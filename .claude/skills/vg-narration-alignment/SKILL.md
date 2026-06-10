---
name: vg-narration-alignment
description: "How visual blocks align to narration via the audio_anchor field. Without it, visuals drift from what is being said. Use whenever visuals are out of sync, audio_anchor is missing, or any request like "audio anchor," "visuals drift," "narration sync," "anchor lookup," "framesFrom," or "Whisper alignment.""
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

If the anchor phrase is NOT found → **linear-interpolate from neighboring anchors that DID hit**, never use the source script's `time_from_sec`. The script's time windows are author intent on a 150 wpm timeline; the actual TTS runs at a different rate, so script times are systematically wrong as positioning data. Using them caused 1-1.5s visual-ahead-of-narration drift in back-loaded scenes (proven on `difference_txt` scene 1, 2026-05-06). Interpolation: place the missed bullet midway between its prior and next hit anchors, or at the start (j=0) / uniformly past the last hit (trailing).

## Frame-positioning algorithm (Step 7)

The pipeline runs FOUR passes, in order. Get any one wrong and visual desyncs from narration.

1. **Anchor lookup**: for each bullet, `find_phrase_fuzzy(scene_words, audio_anchor)` → word index → `round(scene_words[idx].start * fps)`. Bullets whose anchor matched are flagged hit.
2. **Interpolate misses**: leading misses → 0; interior misses → linear interp between neighbor hits; trailing misses → uniform spacing past last hit. **Never** consult the source script's `time_from_sec`.
3. **Monotonic forward push**: for each bullet j ≥ 1, `frames_from[j] = max(interpolated[j], frames_from[j-1] + MIN_BLOCK_FRAMES)`. Pushes a bullet FORWARD if its anchor lands too close to the prior. Never pushes backward.
4. **Last-bullet-only tail clamp**: if `frames_from[-1] > duration_frames - MIN_BLOCK_FRAMES`, clamp it. Earlier bullets keep their anchor positions.

**Forbidden:** the old uniform-spacing tail clamp `for j in range(n): max_start = duration - MIN*(n-j); frames_from[j] = min(...)`. That formula encoded a *uniform spacing* assumption while real narration is *non-uniform*; it pulled late-clustered anchors backward by 18-44 frames and broke sync. Removed 2026-05-06.

## Default `MIN_BLOCK_SECONDS`

Default is **1.0** (`MIN_BLOCK_FRAMES = 30 @ 30fps`). The previous default of 2.0 forced overly generous spacing that triggered the broken tail clamp on dense scenes. 1.0 is enough for entrance animations to read while leaving room for back-loaded narration. Override per-project via `config.yaml` `build.min_block_seconds`.

## How framesTo is computed (no gaps, no overlaps)

After all `framesFrom` are resolved:

```
block 0: framesFrom=0,   framesTo=frames_from[1]
block 1: framesFrom=X,   framesTo=frames_from[2]
...
block N: framesFrom=Y,   framesTo=duration_frames
```

In the scene JSON each block has `framesTo == next.framesFrom` so the
audio_anchor sequencing math has no gaps and no overlaps. **At runtime,
however, every block's `<Sequence>` extends to scene end** — blocks STACK
additively. See rule 09 § "Layer 1" + rule 04 § "Additive-layering contract".
The `framesTo` field is used by validators and sequencing math, NOT by the
runtime renderer.

## What makes a good audio_anchor

**CRITICAL: anchors MUST be taken verbatim from the Whisper captions JSON, NOT
from the narration text or TTS script.** Whisper transcribes differently from
what was written — "April sixteenth" → "16th", "twenty-third" → "23rd". If the
anchor is copied from the narration text and Whisper transcribed it differently,
`find_phrase_fuzzy` silently misses and the bullet falls back to interpolation at
the wrong frame. Always open `projects/<name>/captions/<scene>.json` and copy the
anchor words exactly as Whisper wrote them.

**CRITICAL: monotonic search is enforced in Step A.** `build_video.py` passes
`start_idx = prev_anchor_end_idx` to every `find_phrase_fuzzy` call. This means
bullet N's anchor is found only AFTER bullet N-1's anchor position in the
transcript. Duplicate phrases in the narration (e.g. "Different jobs" at t=7.1s
and t=30.5s) are never a problem: the first occurrence is already past
`_anchor_search_from` from the previous bullet's match, so only the correct later
occurrence can match. Anchors must still be chosen to fall in script order.

In `visual_designer.py`, the LLM is instructed:
> `audio_anchor` MUST be a 2-4 word phrase copied verbatim from the scene's
> Whisper captions JSON (not the narration text). Pick the phrase that best marks
> WHEN this visual should start. The phrase must appear in the captions AFTER the
> previous bullet's anchor phrase.

**Good anchor characteristics** (apply to ANY project's narration):
- Copied from the captions JSON, not guessed from narration text
- A hero noun, a number, or a distinctive verb
- 2-4 content words
- Appears in script order (after the previous bullet's anchor)

**Bad anchor patterns** (LLM is told to reject these):
- Copied from narration text instead of the Whisper captions file
- Single common word — too short, not unique in the scene
- Filler phrases ("and then we", "you know") — not a hero moment
- Empty string — forces fallback to source-script time, defeats the mechanism

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
        [interp] 320-510f  <bullet 3 headline>     ← anchor missed, interpolated from neighbors
        [anchor] 510-680f  <bullet 4 headline>
        [anchor] 680-820f  <bullet 5 headline>
        [anchor] 820-960f  <bullet 6 headline>
      audio_anchor coverage: 5/6 (83%)
```

- `[anchor]` = visual locked to actual spoken word ✓
- `[interp]` = anchor missed; framesFrom linear-interpolated from neighbor hits

If too many `[interp]` entries (coverage < 70%) → the build log warns and the LLM
codegen needs better anchor selection. Two ways to fix:

1. **Make the structured-script bullet body more concrete.** Vague bullets ("the
   reveal") give the LLM no hint which narration phrase to anchor to. Bullets
   that quote a hero word or number from the narration get reliable anchors.
2. **Force re-codegen** by deleting the offending bullet's cache file. The next
   LLM pass sees the same scene narration but may choose a stronger anchor.

## Tuning fuzzy match threshold

If Whisper is dropping or mishearing words (heavy accent, background noise), the
default match threshold may be too strict and anchors that exist in the narration
fail to match. Loosen it in `config.yaml`:

```yaml
build:
  fuzzy_match_min_ratio: 0.5   # default 0.6 — lower if many unexpected [time] fallbacks
```

When to adjust:
- Coverage < 70% despite concrete anchors → lower to 0.5
- Getting wrong phrase matched (anchor fires too early) → raise to 0.7
- Default 0.6 is correct for clean en-US TTS with no noise
