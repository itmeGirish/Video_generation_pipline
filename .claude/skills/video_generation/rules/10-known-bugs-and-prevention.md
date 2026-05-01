---
name: known-bugs-and-prevention
description: Concrete bugs that have hit this pipeline, why they happened, and what now prevents them. Read before editing build_video.py, ssml_compiler.py, or visual_designer.py.
metadata:
  tags: bugs, regression, prevention, validator, contract
---

# Known Bugs and Prevention

This file is the **post-mortem**. Every bug listed here was real. Each is now
either fixed in code, structurally prevented by a regression test
(`storyboard/test_pipeline_fixes.py`), or flagged in docs so it cannot
silently regress.

---

## Class 1 — `<pause Xs>` markers leaked into spoken TTS

**Symptom:** Final mp4 audio literally said "less than pause zero point three s
greater than" between sentences. Hundreds of phantom tokens in the transcript
also broke audio_anchor lookups for every following bullet.

**Root cause:** `_escape()` in `ssml_compiler.py` ran `html.escape()` BEFORE
the pause-marker conversion, so `<pause 0.3s>` became `&lt;pause 0.3s&gt;`.
The downstream strip-tags pipeline in `gen_tts` only matched raw `<...>`,
so the entity-encoded form survived → edge-tts spoke it character by character.

**Now prevented by:**
- `_convert_author_pauses()` runs BEFORE `_escape()` in `ssml_compiler.py`.
- `gen_tts` adds `html.unescape()` + a 2nd strip-tags pass as a defense in depth.
- Regression tests `[1]`–`[3]` in `test_pipeline_fixes.py` assert no `pause`
  token survives end-to-end.

---

## Class 2 — Audio-anchor missed words containing decimals or hyphens

**Symptom:** ~30% of bullets fell back to time-based positioning even though
the anchor phrase was clearly present in the transcript. Visuals drifted.

**Root cause:** Anchor phrases like `"GPT-5.5"` or `"Vending-Bench"` were
tokenized by `_norm()` as a single token (`gpt55`) but Whisper transcribed the
spoken form as multiple tokens (`gpt`, `five`, `point`, `five`). They never
matched. The same gap also affected scene-boundary detection.

**Now prevented by:**
- `expand_decimals()` rewrites `5.5` → `5 point 5` (lookbehind/lookahead so
  overlapping decimals like `4.7.1` work).
- `normalize_for_match()` strips `<...>` markup, expands decimals, and
  replaces hyphens with spaces — used by BOTH boundary detection AND
  `find_phrase` / `find_phrase_fuzzy`.
- Regression tests `[4]`, `[8]`, `[9]` cover the helper, the regex, and
  end-to-end matching against a synthetic Whisper word list.

---

## Class 3 — Fuzzy anchor hits mislabeled as time-fallback

**Symptom:** `audio_anchor coverage` reported 60–70% even after Class 2 was
fixed; rerunning the pipeline never improved the number.

**Root cause:** Step 7 used `find_phrase_fuzzy()` to compute the actual frame
position, but the coverage counter re-ran `find_phrase()` (exact only) to
decide `[anchor]` vs `[time]`. Every fuzzy hit was credited to the time bucket.

**Now prevented by:**
- Step 1 of frame-range computation now records `anchor_hit_flags[j]` from
  the SAME `find_phrase_fuzzy()` call that resolves the position.
- The coverage counter reads `anchor_hit_flags[j]` directly — no second lookup.
- Regression test `[12]` asserts the coverage counter does not call
  `find_phrase_fuzzy(scene_words, vb.audio_anchor)` more than once per bullet.

---

## Class 4 — `MIN_BLOCK_FRAMES` overflowed scene duration on tiny scenes

**Symptom:** A short "silence beat" scene (e.g. 11 frames total, 3 bullets)
collapsed all 3 bullets into a single overlapping flash because every
`framesTo` exceeded `durationInFrames`.

**Root cause:** `MIN_BLOCK_FRAMES = round(FPS * MIN_BLOCK_SECONDS)` was a
constant. When `MIN_BLOCK_FRAMES * num_blocks > duration_frames`, Remotion
silently truncated.

**Now prevented by:**
- For very short scenes the per-block minimum shrinks to
  `max(1, duration_frames // n)`.
- `framesTo` is then capped at `duration_frames` for every block.
- Regression test `[11]` asserts both clamps are present in code.

---

## Class 5 — Time-based fallback computed wrong target second

**Symptom:** When boundary detection failed, the previous scene received
near-zero duration and the visuals lurched.

**Root cause:** The fallback used the script's stated `window_from_sec`
directly. When actual audio diverged from script estimate, the script time
fell BEFORE the search cursor, so the first available word was picked → the
prior scene "ended" almost immediately.

**Now prevented by:**
- `script_total` scans ALL scenes' window times (resilient to last-scene
  `window_to_sec=0`); fallback target = `(script_start / script_total) * total_sec`.
- If even the scaled target falls before the cursor, the remaining audio is
  evenly distributed across remaining scenes.
- Regression tests `[6]`, `[13]`, `[14]` cover the proportional formula,
  the resilient `script_total`, and the absence of a `* 0` regression.

---

## Class 6 — Cmd window flashes on every subprocess (Windows)

**Symptom:** Every Whisper / ffmpeg / claude CLI / ffprobe call on Windows
flashed a black cmd window for ~50ms, hundreds of times per build.

**Now prevented by:**
- `_NOWIN = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0` is
  defined at module top in every subprocess-spawning file.
- Every `subprocess.run` / `subprocess.Popen` call passes
  `creationflags=_NOWIN`.
- Regression test `[5]` counts `subprocess.run|Popen` calls vs
  `creationflags=_NOWIN` occurrences in each file and fails on mismatch.

---

## Class 7 — Hardcoded fps / dimensions in emitted React code

**Symptom:** Pipeline works at the pinned fps but math drifts at any other fps.

**Now prevented by:**
- `visual_designer.py` system prompt forbids hardcoded fps / dimensions / hex
  in the emitted code.
- The `code` field runs inside a Remotion `<Sequence>` with `fps`, `width`,
  `height` as in-scope bindings (rule 04) — no need to reach for literals.
- Discipline: keep bullet bodies in the structured script free of literals
  too, so the LLM has no source to copy from.

---

## Class 8 — Render crashes left corrupt mp4s on disk

**Symptoms hit historically:**
- Final mp4 unplayable in every player (no moov atom) after Ctrl+C during stitch
- Resume-after-crash silently shipped a corrupt scene mp4 because the mtime check skipped it
- A "successful" render (exit 0) produced an mp4 with H.264 NAL errors that only surfaced during stitch — much later, with confusing error messages

**Root cause class:** ffmpeg / Remotion node processes write directly to the
final output path. If interrupted (Ctrl+C, OS kill, crash), the partial file
sits on disk looking like a valid output. Resume logic that relies on `mtime`
or `exists()` then trusts that broken file.

**Now prevented by three coordinated defenses in `build_video.py`:**

1. **`_mp4_is_healthy()` helper** — runs `ffprobe` (10s timeout) + checks
   file size ≥ 100KB. Returns `False` on any error so callers default to
   "re-render" rather than "trust possibly-broken file."
2. **Resume-skip is gated on health, not just mtime.** The Step 9 resume
   path now checks `_mp4_is_healthy(out_file)` in addition to
   `out_file.stat().st_mtime >= scene_json.stat().st_mtime`. A killed prior
   build's broken mp4 fails the health check → re-rendered.
3. **Atomic writes via `.inprogress` + `os.replace()`.** Both the per-scene
   `_clean.mp4` step AND the final mux write to a staging file first.
   `os.replace()` is atomic on Windows + POSIX. Killing ffmpeg mid-write
   leaves an orphan `.inprogress` file (cleanly identifiable, harmless) and
   the previous valid output (if any) is untouched.
4. **Post-render integrity check.** After the bundle render exits 0, every
   scene mp4 is health-checked. Any failure aborts with a named scene list
   instead of leaking a corrupt file into stitch.
5. **Post-stitch integrity check.** The final mp4 is health-checked on the
   `.inprogress` file BEFORE `os.replace()` — a 0-exit-code mux that
   produced a 0-duration mp4 is caught and the staging file is cleaned up
   instead of being moved to the user-facing path.

**Regression test:** `test_pipeline_fixes.py` group `[16]` asserts every
defense above is wired in code (helper exists, both resume-skip and
post-render paths call it, both ffmpeg sites use `.inprogress + os.replace`).

**What this still does NOT protect against:**
- Long-render Chromium memory pressure inside Remotion's node process —
  out of scope for ffmpeg-side defenses; would need `--concurrency=N`
  tuning in `render_scenes.mjs`.
- Lingering `node.exe` processes on Windows after Ctrl+C — separate issue;
  cleanup with `taskkill /F /IM node.exe` is manual today.
- Network-flaky LLM calls during Step 3 (Claude CLI) — handled by the
  rate-limit retry policy in `visual_designer.py`, not by these mp4 defenses.

---

## Class 9 — Slow render (re-bundle per scene)

**Was:** `build_video.py` called `node render_scenes.mjs <id>` once per scene.
Each call re-bundled webpack (~30s).

**Now:** Single call with all pending scene IDs at once. Bundle once, render
all.

---

## Bug-class to defense matrix

| Bug class | Defense | Where enforced |
|-----------|---------|----------------|
| `<pause Xs>` leak into TTS | `_convert_author_pauses` before `_escape` + `html.unescape` in strip pipeline | `ssml_compiler.py`, `build_video.py` (HARD) |
| Anchor miss on decimals/hyphens | `normalize_for_match` + `expand_decimals` | `build_video.py` (HARD) |
| Fuzzy hits credited as time | `anchor_hit_flags` from single fuzzy call | `build_video.py` Step 7 (HARD) |
| MIN_BLOCK overshoot tiny scene | shrink to `duration_frames // n` + cap framesTo | `build_video.py` Step 7 (HARD) |
| Time-fallback picks earliest word | proportional scaling + remaining-audio distribution | `build_video.py` Step 6 (HARD) |
| Cmd-window flash on Windows | `creationflags=_NOWIN` on every subprocess | 4 storyboard `.py` files (HARD) |
| Killed mid-write → corrupt mp4 | `.inprogress` + `os.replace()` atomic write | `build_video.py` Step 9 + Step 10 (HARD) |
| Resume-skip trusts a corrupt mp4 | `_mp4_is_healthy()` gates the skip path | `build_video.py` Step 9 (HARD) |
| Render exits 0 but mp4 is corrupt | post-render `_mp4_is_healthy` sweep | `build_video.py` Step 9 (HARD) |
| Stitch exits 0 but final mp4 is unplayable | health-check `.inprogress` before `os.replace` | `build_video.py` Step 10 (HARD) |
| Per-bullet codegen failure | per-bullet retry + per-bullet cache | `visual_designer.py` (HARD per bullet) |
| Bad scene ID format | `validate_pipeline.py` | Step 8.5 (HARD) |
| Bad structured script | parser raises + linter warns | `source_parser.py` (HARD/SOFT) |
| `config.yaml` missing field | schema check from `design.ts` | Step 1 (HARD) |
| Scene JSON missing pre-render | `validate_pipeline.py` | Step 8.5 (HARD) |
| `config_tokens.json` ↔ `design.ts` drift | `validate_pipeline.py` | Step 8.5 (HARD) |
| Empty/black render output | `visual_qa.py` brightness check | Step 9.5 (WARN) |
| Low audio_anchor coverage | `build_video.py` reports % | Step 7 (WARN) |
| Block code throws at runtime | red `BLOCK RUNTIME ERROR` overlay | `DynamicBlock.tsx` (VISIBLE) |
| Visual layout / contrast / overflow | needs vision-model QA | manual review (SOFT) |

---

## What to do when you hit something not in this list

1. Add it here as a new class with symptom + root cause + defense.
2. If structural prevention is possible (regression test in
   `test_pipeline_fixes.py`), add it.
3. If only docs can prevent, mark it in the relevant rule with `**KNOWN ISSUE:**`.

The principle: **every bug we hit twice is a process failure, not a code bug.**
Each Class above shipped with a regression test in
`storyboard/test_pipeline_fixes.py` — run that file (`python -m
storyboard.test_pipeline_fixes`) before any change to the matching code area.
