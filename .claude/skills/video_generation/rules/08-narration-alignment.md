---
name: narration-alignment
description: How visual blocks align to narration. The audio_anchor field is the mechanism. Without it, visuals drift from what is being said.
metadata:
  tags: narration, alignment, audio_anchor, whisper, timing
---

# Narration Alignment

## The problem

Source script animation bullets have time windows like `0:08 – 0:18`.
These are the author's INTENT — the actual TTS might speak faster or slower.

If we use source script times directly → visuals drift from narration.
The wrong animation is showing while the wrong sentence is being spoken.

## The fix: audio_anchor

Every `VisualBlock` carries an `audio_anchor` — a verbatim 2-4 word phrase
from the same scene's narration that marks WHEN this visual should appear.

Block shape (post-codegen pivot):

```json
{
  "framesFrom":     <int>,
  "framesTo":       <int>,
  "code":           "<JS function body returning React.createElement(...)>",
  "audio_anchor":   "<verbatim 2-4 word phrase from narration>",
  "source_headline": "<the bullet's headline, copied verbatim>"
}
```

`build_video.py` Step 7 uses the anchor to find the ACTUAL Whisper timestamp:

```
1. find_phrase_fuzzy(scene_words, anchor_phrase) → word index 8
2. scene_words[8].start = 4.23s  (actual spoken time)
3. framesFrom = round(4.23 * fps)   # round() not int() — see audio-sync note below
```

**Use `round()` not `int()` for seconds→frames conversion.** `int()` truncates
toward zero, biasing every conversion 0–33ms early. Across N scenes that's up
to N/fps seconds of cumulative drift, which makes audio play ahead of video by
the end. `round()` errors are ±0.5 frames per conversion and cancel out.

If the anchor phrase is NOT found in the transcript → falls back to `round(time_from_sec * fps)`.

## How framesTo is computed (no gaps, no overlaps)

After all `framesFrom` are resolved:

```
block 0: framesFrom=0,   framesTo=frames_from[1]
block 1: framesFrom=X,   framesTo=frames_from[2]
...
block N: framesFrom=Y,   framesTo=duration_frames
```

Each block fills exactly until the next block starts.
**No gap** (black screen between primitives).
**No overlap** (two primitives on screen at once).

## What makes a good audio_anchor

In `visual_designer.py`, the LLM is instructed:
> `audio_anchor` MUST be a verbatim 2-4 word phrase that exists in the narration.
> Pick the phrase that best marks WHEN this visual should start.

**Good anchor characteristics** (apply to ANY project's narration):
- A hero noun, a number, or a distinctive verb that recurs nowhere else in the scene
- 2-4 content words (not stopwords like "the", "and", "this")
- A phrase the author would emphasize when speaking aloud — usually the moment
  the rest of the sentence pivots around

**Bad anchor patterns** (LLM is told to reject these):
- Single common word — too short, not unique in the scene
- Filler phrases ("and then we", "you know") — not a hero moment
- Empty string — forces fallback to source-script time, defeats the mechanism

The LLM is shown the entire scene's narration when it picks the anchor — it has
the context to choose a phrase that uniquely identifies the moment.

## How to improve alignment for a specific scene

1. Delete the affected bullet's cache file (per-bullet now, not per-scene):
   ```bash
   rm storyboard/.cache/designs/bullet-s{N}-b{M}-*.json
   ```
   To force re-codegen of an entire scene's bullets:
   ```bash
   rm storyboard/.cache/designs/bullet-s{N}-*.json
   ```
2. Re-run the pipeline — LLM re-picks the anchor for that bullet.
3. Or edit the canonical scene JSON directly:
   `projects/<name>/scenes/<id>.json` → adjust `framesFrom` manually
   (Step 7.5 will mirror it to the bundler-readable path on next run)

## What the build log shows

```
[7/10] Computing visual block frame ranges...
      <project>-s01: 960f (32.0s), 6 visual blocks
        [anchor] 0-160f    <bullet 1 headline>     ← anchor found in Whisper transcript
        [anchor] 160-320f  <bullet 2 headline>
        [time]   320-510f  <bullet 3 headline>     ← anchor not found, used time_from_sec
        [anchor] 510-680f  <bullet 4 headline>
        [anchor] 680-820f  <bullet 5 headline>
        [time]   820-960f  <bullet 6 headline>
      audio_anchor coverage: 4/6 (67%)
```

- `[anchor]` = visual locked to actual spoken word ✓
- `[time]`   = fell back to source-script timestamp (acceptable, not ideal)

If too many `[time]` entries (coverage < 70%) → the build log warns and the LLM
codegen needs better anchor selection. Two ways to fix:

1. **Make the structured-script bullet body more concrete.** Vague bullets ("the
   reveal") give the LLM no hint which narration phrase to anchor to. Bullets
   that quote a hero word or number from the narration get reliable anchors.
2. **Force re-codegen** by deleting the offending bullet's cache file. The next
   LLM pass sees the same scene narration but may choose a stronger anchor.
