---
name: vg-output-validation
description: "How to verify narration and animation bullets actually ended up in the final rendered video. Checks OUTPUT, not inputs. Use whenever checking video quality, verifying coverage, or any request like "validate output," "check the video," "narration coverage," "animation visibility," "did all bullets render," or "validate_output.py.""
---

# Output Validation

The other validator (`validate_pipeline.py`) checks **inputs and contracts** —
what should happen. This validator checks the **actual rendered output** —
what did happen.

It answers two questions:
1. Did the narration in the structured script actually get spoken in the final video?
2. Did every `### Animation` bullet actually appear on screen?

---

## The script

`storyboard/validate_output.py` runs as Step 10.5 of `build_video.py`,
after the final mp4 is muxed.

Standalone:
```bash
python storyboard/validate_output.py projects/<name>/             # report only
python storyboard/validate_output.py projects/<name>/ --extract   # + save QA frames
```

---

## Check 1 — Narration coverage

For each scene:
- Tokenize source narration → content words (stopwords + punctuation removed)
- Tokenize Whisper transcript words for that scene
- Coverage = `|expected ∩ spoken| / |expected|`
- < 80% triggers an issue with the missing words listed

**What low coverage usually means:**
- TTS dropped words (rare — usually means SSML had bad XML)
- Whisper mis-transcribed (acceptable for unusual words)
- Scene boundary detection picked the wrong span (more serious — visuals will drift)

**Acceptable thresholds:**
- ≥ 90% → good
- 80–90% → some loss, usually OK for TTS imperfection
- < 80% → investigate; likely a real mismatch

---

## Check 2 — Animation visibility

For each animation bullet:
- Compute its midpoint frame (between `framesFrom` and `framesTo`)
- Convert to seconds via fps
- Run `ffmpeg signalstats` on the rendered scene mp4 at that timestamp
- If `YAVG < 8` (black/empty frame) → flag as missing

**What missing animations usually mean:**
- The primitive type is missing → red MISSING PRIMITIVE box (already caught)
- The visual block has invalid props → component renders nothing
- Time window math broke → block scheduled outside the scene duration

**Per-bullet drill-down:** the report says exactly which bullet failed and
includes the source headline so you can find it in the structured script instantly.

---

## Frame extraction for human / vision-model review

```bash
python storyboard/validate_output.py projects/<name>/ --extract
```

Saves one JPG per animation bullet to `projects/<name>/qa_frames/`:
```
qa_frames/
  <project>-s01_b01_<primitive>_<headline-slug>.jpg
  <project>-s01_b02_<primitive>_<headline-slug>.jpg
  <project>-s01_b03_<primitive>_<headline-slug>.jpg
  ...
```

Filename format: `{scene-id}_b{bullet-num}_{primitive-type}_{slug-of-headline}.jpg`

These frames can be:
- Browsed manually for layout/contrast/overflow issues
- Sent to a future vision-model QA step (Anthropic SDK with image input)
- Attached to PR descriptions for review

---

## What this validator does NOT check

It catches structural mismatches (missing words, black frames). It does NOT
catch quality issues:
- Text overflow off the side of the frame
- Two visual elements overlapping in an ugly way
- Color contrast too low to read
- Wrong primitive choice (LLM picked `bullet_list` when `formula` was better)

These need vision-model QA or human review. The `--extract` flag exists to
make that review fast (browse a folder of thumbnails instead of scrubbing video).

### The VISION-QA GATE (highest-ROI open improvement — build this)

The deterministic validators now cover overlap, density (`sparse_canvas`), dim-overlap
(`legibility_clutter`), continuity (`continuity_gap`), freeze, sync, and coverage. What they
CANNOT judge — and what gets MISSED when a human reviews under pressure — is the subjective-but-
critical layer: **density-by-meaning, "does the visual explain THIS narration sentence" (V15),
reality-anchor/authenticity (real interface vs generic fake), and clutter/prominence.** This
session those exact misses slipped through (generic-interface, sparse, payoff-clutter) and the
USER caught them, not the gate.

**The gate:** for each bullet, extract the SETTLED frame (≈p92), and send `(frame image + the
bullet's narration sentence + the scene's reality-anchor)` to a vision LLM (Anthropic SDK, image
input) with a rubric: score 1–5 each on (a) DENSITY — does content fill the frame, no empty half;
(b) SENTENCE-TEST/V15 — does the picture literally depict this sentence; (c) REALITY-ANCHOR — is it
the REAL interface the video established, not a generic stand-in; (d) CLUTTER — is the focal element
clean and unobstructed. Return pass/fail + a one-line reason per factor. Fail any < 3 → NOT READY.

This is NOT the cache-only architectural invariant (that bans LLM calls in bullet CODEGEN; a separate
QA tool reading frames is fine — this very file already names it as the intended future step). It is
the single highest-leverage reliability improvement: it turns "good if the reviewer looks honestly"
into "good, gated." Author-time (`vg-visual-designer` reality-anchor, `vg-code-artifacts` real
mechanism) prevents these; the vision-QA gate is the post-render safety net. See
[[project-best-output-roadmap]].

---

## Where this fits in the validator chain

```
build_video.py
    ├─ Step 1     load + schema-check config.yaml ............... (HARD)
    ├─ Step 2     parse + lint structured script ............... (SOFT warn)
    ├─ Step 3     per-bullet LLM codegen (parallel + retry) .... (HARD per bullet)
    │             rejects emitted code missing React.createElement
    │             rejects audio_anchor not present in scene narration
    ├─ Step 4     SSML compile + edge-tts ....................... (HARD)
    ├─ Step 5     Whisper transcribe ............................ (HARD)
    ├─ Step 6     scene boundaries (decimal/hyphen normalize) ... (HARD)
    ├─ Step 7     frame ranges + audio_anchor coverage report ... (SOFT warn)
    ├─ Step 8     patch timelines.ts .............................
    ├─ Step 8.5   validate_pipeline.py .......................... (HARD)
    │             scene/caption JSONs, IDs, design tokens
    ├─ Step 9     render scenes (bundle once) ....................
    ├─ Step 9.5   visual_qa.py .................................. (SOFT warn)
    │             black-frame at scene midpoint
    ├─ Step 10    stitch + mux → final.mp4 .......................
    └─ Step 10.5  validate_output.py ............................ (SOFT warn)
                  narration coverage % + per-bullet visibility
```

Two contract validators (HARD: implicit at 1, 8.5) plus per-bullet codegen
guards at Step 3, and two output validators (SOFT: 9.5, 10.5).
