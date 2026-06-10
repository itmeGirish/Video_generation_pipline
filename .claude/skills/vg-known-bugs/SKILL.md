---
name: vg-known-bugs
description: "Concrete bugs that have hit this pipeline, why they happened, and what now prevents them. Read before editing build_video.py, ssml_compiler.py, or visual_designer.py. Use whenever editing pipeline Python files, debugging a regression, or any request like "edit pipeline code," "known bugs," "regression prevention," or "what went wrong before.""
---

# Known Bugs and Prevention

This file is the **post-mortem**. Every bug listed here was real. Each is now
either fixed in code, structurally prevented by a regression test
(`storyboard/test_pipeline_fixes.py`), or flagged in docs so it cannot
silently regress.

---

## Contents

- Class 1 — `<pause Xs>` markers leaked into spoken TTS
- Class 2 — Audio-anchor missed words containing decimals or hyphens
- Class 3 — Fuzzy anchor hits mislabeled as time-fallback
- Class 4 — `MIN_BLOCK_FRAMES` overflowed scene duration on tiny scenes
- Class 5 — Time-based fallback computed wrong target second
- Class 6 — Cmd window flashes on every subprocess (Windows)
- Class 7 — Hardcoded fps / dimensions in emitted React code
- Class 8 — Render crashes left corrupt mp4s on disk
- Class 9 — Slow render (re-bundle per scene)
- Bug-class to defense matrix
- Class 10 — "Visuals fast, sound slow" — TTS rate too slow for script windows
- Class 11 — Placeholder block masquerades as real codegen
- Class 12 — Cache hit serves stale output after config change
- Class 13 — Crash mid-write corrupts a build artifact
- Class 14 — `int()` vs `round()` frame-conversion drift
- Class 15 — ffmpeg INPUT seek lands on a black keyframe
- Class 16 — DynamicBlock RUNTIME_KEYS / args drift (off-by-one binding)
- Class 17 — Production sidecars missing from final mp4
- Class 18 — Per-bullet `claude` CLI subprocess (token blowout)
- Class 19 — Narration pacer silence blowout from script time windows
- Class 20 — Scene JSON syntax errors baked into render bundle
- Class N — audio_anchor fails narration verbatim check due to `<pause Xs>` tokens
- Class N+1 — Minimal bullet code produces visually meaningless output
- MANDATORY PRE-RENDER GATE — Visual Walkthrough (rule 19 § 10)
- Class N+2 — ADDITIVE bullet assumes previous bullet's visuals are still visible
- Class N+3 — Empty container: border drawn, inner content missing
- Class N+4 — Multiple position:absolute at same coordinates (duplicate overlay bug)
- Class N+5 — Diagonal line coded as filled rectangle
- Class N+6 — Two-panel comparison split across two ADDITIVE bullets
- Class N+7 — Unlabeled data bars (benchmark bars with no model identity)
- Class N+8 — Pipeline output appears frozen in background tasks (false hang diagnosis)
- Class N+9 — Remotion (node) render progress invisible in log files
- Class N+10 — Canvas underutilization (content <60% of screen)
- Class N+11 — Absolute overlay collides with card header (stamp/badge overlap)
- Session progress record — 2026-05-16 (chat_5_5 build)
- Class N+12 — Anchor phrase tokenization mismatch → interpolated framesFrom lands seconds off
- Scene Verification Checklist (run after every render, before master stitch)
- What to do when you hit something not in this list

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

**Related upgrade — pause DURATION is now honored too (regression test [18]):**

Earlier, the strip pipeline replaced every `<break time="...ms"/>` with a
single comma `, `. That stopped the literal `pause` text from leaking into
audio (Class 1 fix above) but the duration value (`300ms`, `500ms`, `1000ms`)
was discarded — every pause became a generic comma-pause regardless of what
the author wrote.

`gen_tts` now uses **Strategy B (split-render-concat)**, the community-canonical
workaround for edge-tts not honoring SSML breaks (verified in
`github.com/rany2/edge-tts` issue #173):

1. Split the SSML on `<break time="Nms"/>` boundaries → list of (text_chunk, ms_after)
2. Render each text chunk via edge-tts → individual mp3 (24kHz mono 48kbps libmp3lame)
3. Generate exact-duration silence per break via ffmpeg `anullsrc` in the
   same format → silent mp3
4. Concat all parts via ffmpeg concat demuxer with `-c copy` (sample-accurate,
   no re-encode, no click artifacts)

Result: `<pause 0.3s>` produces exactly 300ms of silence; `<pause 1s>` produces
exactly 1000ms; the author's intended pause hierarchy is preserved.

**Trade-off:** N+1 edge-tts calls per script instead of 1 (where N = pause
count). Slower than single-shot rendering but the increase is bounded
(~0.5s/chunk over WSS).

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
- Network-flaky LLM calls during Step 3 (Claude CLI) — handled by the
  rate-limit retry policy in `visual_designer.py`, not by these mp4 defenses.

**Follow-up defenses shipped (regression tests [19], [20], [21]):**

- **Browser reuse + restart-every-N (test [19])** — `render_scenes.mjs` opens
  ONE Chromium via `openBrowser('chrome', ...)` and passes it to every
  `selectComposition` + `renderMedia` call via `puppeteerInstance`. Browser
  recycled every 5 scenes to bound memory accumulation per the `swangle`
  long-render leak warning in remotion.dev/docs/chromium-flags.
  *Trade-off documented:* `chromiumOptions` set on `renderMedia` are silently
  ignored when `puppeteerInstance` is set — flags MUST live at openBrowser
  time. Verified in render-media docs.

- **Hung-render watchdog (test [19])** — `makeCancelSignal` + lastProgressAt
  tracking. If `onProgress` doesn't fire for `STALL_TIMEOUT_MS` (120s), the
  watchdog fires `cancel()` and the render rejects with a UserCancelled
  error — handled by the per-scene retry loop. Browser is recycled before
  retry. Verified pattern from remotion.dev/docs/renderer/make-cancel-signal.

- **Ctrl+C tree-kill on Windows (test [19])** — `build_video.py` now spawns
  the render child via `subprocess.Popen` with `CREATE_NEW_PROCESS_GROUP`
  (NOT `shell=True`, which broke signal propagation). On `KeyboardInterrupt`,
  Python runs `taskkill /F /T /PID` to walk the child PID tree and reap
  node + every Chromium it spawned. Exits with POSIX convention 130.
  Verified in MSDN GenerateConsoleCtrlEvent + Python subprocess docs.

- **`--strict-anchors` quality gate (test [20])** — optional flag turns the
  Step 7 soft warn into a hard fail. Distinct exit code 3 lets CI distinguish
  quality-gate fail from fatal/partial. Threshold configurable via
  `--strict-anchor-min-pct` (default 70).

- **Remotion version floor v4.0.245+ (test [21])** — pinned by `package.json`
  at v4.0.455 (latest 4.0.x). Below v4.0.245 the Chrome Headless Shell can
  auto-upgrade and break headless mode entirely (maintainer warning at
  remotion.dev/docs/miscellaneous/chrome-headless-shell). The test reads
  package.json and asserts every `remotion`/`@remotion/*` dep is ≥4.0.245.

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
| Visuals fast / sound slow (TTS rate) | WPM check + `[time]` scaling fix | Step 4 (WARN) |
| Video stuck / silence gaps (pacer uses script windows) | `_required_display_seconds` uses body-length only, NOT `time_to_sec - time_from_sec`; `MAX_DISPLAY_SECONDS=2.0` | `narration_pacer.py` (HARD) |

---

---

## Class 10 — "Visuals fast, sound slow" — TTS rate too slow for script windows

**Symptom:** After rendering, each visual block completes its animation while
narration is still speaking. Every scene looks like the visuals are racing ahead
of the audio. Confirmed by: actual TTS wpm << 150 wpm.

**Root cause:** Script `M:SS – M:SS` time windows were authored at 150 wpm.
`en-US-AndrewMultilingualNeural` at `rate="+0%"` speaks at ~122 wpm — 22% slower.
For bullets that fall back to `[time]` (Whisper can't find the anchor phrase),
`vb.time_from_sec * FPS` used raw script seconds, placing the block too early
in the longer actual audio. For Whisper-anchored bullets, the block starts at
the right spoken word but the animation was authored assuming a shorter block
duration.

**Now prevented by:**
1. Post-TTS WPM check in `build_video.py` — prints actual wpm and warns if
   < 132 wpm with the exact `audio.rate` fix to apply.
2. Time-fallback scaling in `build_video.py` — `vb.time_from_sec` is now
   multiplied by `(actual_scene_dur / script_scene_dur)` before conversion to
   frames, so `[time]` blocks land proportionally correct regardless of TTS rate.

**To fix for any project:** set `audio.rate: "+20%"` in `config.yaml` to bring
Andrew to ~150 wpm. Formula: `rate = round((150 / actual_wpm - 1) * 100)%`.
The pipeline prints `actual_wpm` after TTS every run.

---

## Class 11 — Placeholder block masquerades as real codegen

**Symptom:** A scene renders a generic "PLACEHOLDER — bullet N" card instead of
the bespoke cinematography the script described. The bullet count gate passed
(count of blocks == count of animation bullets), so no validator flagged it.
The user only spots it on visual review.

**Root cause:** `visual_designer.py:_placeholder_block` substituted a
self-contained placeholder block for any bullet whose codegen failed (most
commonly: API rate-limit exhaustion). The placeholder satisfied
`count(blocks) == count(bullets)` by construction, and scene JSON had no marker
distinguishing it from a real LLM-emitted block, so `validate_output.py` did
not flag it.

**Now prevented by:**
1. `VisualBlock.placeholder: bool` field carries an explicit marker, propagated
   into scene JSON (`projects/<name>/scenes/<sid>.json` with `"placeholder": true`
   and `"placeholder_error": "<short reason>"`).
2. `validate_output.py` counts placeholder blocks per scene, prints a
   `placeholder blocks: N (FIDELITY DEGRADED — re-run --redesign)` summary line,
   and emits one `[issue] PLACEHOLDER block` per bullet so the user sees exactly
   which ones are stubs.
3. `--strict-fidelity` CLI flag on `build_video.py`: hard-fails if ANY bullet's
   codegen fails. Use in CI/CD that rejects partial fidelity.

**Test:** `test_audit_fixes.py::test_fix1_*` (5 cases).

---

## Class 12 — Cache hit serves stale output after config change

**Symptom:** User changes `audio.rate` in `config.yaml` from `+0%` to `+20%`,
re-runs the build, and the produced mp4 still has the old `+0%` audio. Whisper
transcribes the new audio identically, so downstream scene-boundary detection
picks the same words; nothing flags it.

**Root cause:** TTS cache key was `sha256(full_ssml)` only — voice, rate, pitch
were not in the hash. Same SSML → same hash → cached mp3 served. Identical bug
on Whisper: cache key was `sha256(audio_bytes)` only — model size and
compute_type were not in the hash. `--whisper-model large` after a prior `base`
run returned the OLD `base` transcript.

**Now prevented by:**
1. TTS cache key = `sha256(VOICE | RATE | PITCH | full_ssml)`.
2. Whisper cache key = `sha256(audio_bytes | model_name | compute_type)`.
3. SKILL.md contract #12 (cache key completeness) names every input.

**Test:** `test_audit_fixes.py::test_fix3_*`, `test_fix4_*`.

---

## Class 13 — Crash mid-write corrupts a build artifact

**Symptom:** Ctrl+C during the final mux leaves a partial mp4 with no moov
atom that crashes every player. Or Ctrl+C during `timelines.ts` write leaves a
half-written TS file that breaks every future build until restored from git.
Or a SIGKILL during `renderMedia` leaves a truncated `<sid>.mp4` that the next
build's size-guard (>100KB) lets through silently as "already rendered".

**Root cause:** `Path.write_text` and `renderMedia({ outputLocation: out })`
are not atomic — the file exists in a half-written state during the I/O. Any
process death between `open` and `close` leaves observable garbage.

**Now prevented by:**
1. `build_video.py` exposes `atomic_write_text(path, content)` and
   `atomic_copy(src, dst)` helpers — both write to `<path>.inprogress` then
   `os.replace()`. Used for `timelines.ts`, `config_tokens.json`,
   `build_timing.json`, scene/caption JSON, mirror copies.
2. `render_scenes.mjs` writes `<sid>.mp4.inprogress` and `fs.renameSync` after
   the size guard passes. Orphaned `.inprogress` files from prior crashes are
   cleaned up at the top of each scene's loop.
3. SKILL.md contract #11 (atomic write contract) names every site.

**Test:** `test_audit_fixes.py::test_atomic_*`, `test_fix6_*`, `test_fix7_*`,
`test_fix8_*`.

---

## Class 14 — `int()` vs `round()` frame-conversion drift

**Symptom:** `build_timing.json["total_frames"]` differs by 1 frame from the
actual rendered video duration. Cumulative scene-frame math uses `round()`;
one site used `int()`. Two values for the same quantity = silent drift in any
tool that reads `total_frames`.

**Root cause:** `total_frames = int(total_sec * FPS)` truncates fractional
frames; `_total_audio_frames = round(total_sec * FPS)` rounds. Spec contract
mandates `round()`; one site escaped review.

**Now prevented by:**
1. The bare `int(total_sec * FPS)` was changed to `round(...)`.
2. SKILL.md contract #13 (frame-conversion contract) names every site.
3. `test_audit_fixes.py::test_fix2_total_frames_uses_round` is a regression
   test that grep-fails the build if the literal returns.

---

## Class 15 — ffmpeg INPUT seek lands on a black keyframe

**Symptom:** `validate_output.py` reports "midpoint frame is BLACK
(brightness=0.0)" for a scene that the human eye clearly shows full of
visuals. Re-running confirms the false positive.

**Root cause:** `ffmpeg -ss <t> -i <file>` is INPUT seek — fast, but lands on
the nearest preceding keyframe. For a midpoint check across a scene boundary,
that keyframe can be a Backdrop fade-in frame seconds before the actual
midpoint. Result: the QA decodes a black frame at a different time than requested.

**Now prevented by:**
1. `validate_output.py` and `visual_qa.py` use OUTPUT seek
   (`ffmpeg -i <file> -ss <t>`) — slower (decodes through), but lands exactly
   at the requested timestamp.
2. SKILL.md contract #14 names the rule.

**Test:** `test_audit_fixes.py::test_fix26_visual_qa_uses_output_seek`,
`test_validate_output_uses_output_seek`.

---

## Class 16 — DynamicBlock RUNTIME_KEYS / args drift (off-by-one binding)

**Symptom:** Compiled bullet `code` calls what it thinks is `interpolate(...)`
and gets `Easing` instead — silent wrong binding for every key past the
insertion point. Manifests as cryptic runtime errors deep inside Remotion primitives.

**Root cause:** `DynamicBlock.tsx` used to maintain TWO hand-edited lists: the
`RUNTIME_KEYS` string array, and the args list passed to `compiled(...)`. A
single `RUNTIME_KEYS` insertion without a mirrored args insertion shifted every
binding past that index by one.

**Now prevented by:**
1. Single source of truth: a `runtimeBindings` Record keyed by
   `RUNTIME_KEYS[number]`. Args are derived via
   `RUNTIME_KEYS.map(k => runtimeBindings[k])`, so insertion at one site fails
   the TypeScript record type until both sides line up.
2. Defensive runtime length-mismatch guard: `if (args.length !== RUNTIME_KEYS.length) throw`.

**Test:** `test_audit_fixes.py::test_dynamic_block_*`.

---

## Class 17 — Production sidecars missing from final mp4

**Symptom:** Final mp4 plays, but: web/streaming clients wait for full download
(no faststart); no .srt subtitles to upload to YouTube; no chapter timestamps
to paste into the description; no thumbnail; no length-equality check between
video frames and audio.

**Root cause:** Stitch step produced just the mp4 with no sidecar artifacts.

**Now prevented by Step 10.6 in `build_video.py`:**
1. ffmpeg `-movflags +faststart` flag in the final mux.
2. ffprobe report logged at end (codec/resolution/duration/bitrate).
3. A/V length-equality gate (warn if final duration drifts >0.5s).
4. `.srt` subtitle file (concatenated from caption JSONs).
5. `.chapters.txt` (YouTube-ready timestamps from `scene_timings`).
6. `_thumbnail.jpg` (frame at t=3s).
7. Optional `stitch.audio_loudnorm: true` in `config.yaml` for YouTube loudnorm
   (I=-14 LUFS, TP=-1, LRA=11).

**Test:** `test_audit_fixes.py::test_prod_*`.

---

## Class 18 — Per-bullet `claude` CLI subprocess (token blowout)

**Symptom:** Building a 70-bullet video drove enormous Anthropic API token cost.
Each bullet's codegen was a separate `claude --print` subprocess paying full
system-prompt + bullet context. Worse, when the parent process was itself a
Claude Code session, the spawn failed with "Claude Code cannot be launched
inside another Claude Code session", forcing the user to run the build from a
plain terminal. Either way, the architecture wasted tokens for work the active
session could already do with shared context.

**Root cause:** `visual_designer.py` and `script_converter.py` both spawned
`claude --print --model ...` per call (per bullet for the designer; per fallback
for the converter). The cache key was correct, but the codegen path itself was
the wrong unit of work — too granular to share context, too expensive to repeat.

**Now prevented by:**
- All `subprocess.run([CLAUDE_BIN, ...])` calls REMOVED from
  `storyboard/visual_designer.py` and `storyboard/script_converter.py`.
- `visual_designer._design_bullet` does cache lookup only; cache miss raises
  `CacheMissError` naming the bullet body and the seed command.
- `script_converter.convert_with_fallback` raises if regex normalization fails
  (no LLM fallback) — operator hand-converts per rule 18.
- New seeding tool: `storyboard/seed_bullet_cache.py` writes per-bullet cache
  files at the exact hash paths the build expects. The cache key version tag
  (`prompt-v14-per-bullet`) is shared between seed and lookup so they can never
  drift silently.
- Preflight test `[5]` in `test_pipeline_fixes.py` asserts:
  - `subprocess.run` does NOT appear in either module.
  - `CLAUDE_BIN` does NOT appear in either module.
  Reintroducing either pattern fails the build.

**Test:** `test_pipeline_fixes.py [5]`.

---

## Class 19 — Narration pacer silence blowout from script time windows

**Symptom:** Video appears "stuck" — multi-second silence gaps (3-5s) mid-playback
while the screen shows a static visual. No crash, no error. The narrator simply
goes quiet. Proven on `difference_txt` scene 1 bullet 5 (4.16s silence for
"Curriculum card.") and scene 2 bullet 1 (3.28s silence for "Split-screen two
panels."). Total forced silence was 9.65s in a 57.5s video (19% dead time).

**Root cause:** `_required_display_seconds()` in `narration_pacer.py` returned
`max(script_window, content_heuristic, MIN_DISPLAY_SECONDS)`, where
`script_window = b.time_to_sec - b.time_from_sec`. Script bullet windows are the
author's estimate at 150 wpm — a "Curriculum card." bullet might have a 5s window
even though the narrator only says "Eight minutes." in 0.5s. Required = 5.0s,
estimated gap = 0.5s → pacer injects a `<pause 4.5s>` → TTS goes silent for 4.5s.

**Now prevented by:**
1. `_required_display_seconds()` uses ONLY the content-density heuristic:
   `min(max(MIN_DISPLAY_SECONDS, body_len / 80.0 + 0.5), MAX_DISPLAY_SECONDS)`.
   It NO LONGER reads `b.time_from_sec` or `b.time_to_sec` — those fields are
   author intent, not a display-time requirement.
2. `MAX_DISPLAY_SECONDS = 2.0` hard-caps the required display time so narration
   always flows continuously (no pause can exceed 2.0s regardless of body length).
3. The docstring on `_required_display_seconds()` explicitly documents the old
   design and why the window dependency was removed — so the next reader does not
   "restore" the script window logic.

**Defense in depth:** After TTS, `build_video.py` step 4 prints actual WPM. If
WPM << 150 (TTS slower than scripted), the script windows are even MORE out of
proportion with actual audio, making this bug worse. Always set
`audio.rate: '+N%'` so TTS speaks at 150 wpm (formula: `rate = round((150/actual_wpm-1)*100)%`).

**What the bug log looked like:**
```
[3.5] Narration pacer (display-time enforcement)...
      [scene 1] inserted 3 pause(s) totaling 6.37s:
        +4.16s after b5  'Curriculum card.'     ← this is the bug
      [scene 2] inserted 1 pause(s) totaling 3.28s:
        +3.28s after b1  'Split-screen two panels.'  ← this too
```
**After the fix:**
```
[3.5] Narration pacer (display-time enforcement)...
      [scene 1] inserted 2 pause(s) totaling 1.97s:
        +1.16s after b5  'Curriculum card.'     ← content-density based, correct
```

---

## Class 20 — Scene JSON syntax errors baked into render bundle

**Symptom:** Rendered mp4 shows `BLOCK COMPILE ERROR — Invalid or unexpected token`
(or `missing ) after argument list`) as a red overlay on screen for the affected
bullet's entire duration. The render exits 0 and the size-guard passes — the file
looks healthy. The bug is only visible on playback.

**Root cause:** Opus authored JS code inside `code` fields that contained:
1. **Literal newlines inside single-quoted strings** — e.g.
   `'AUTONOMOUS\nVULNERABILITY\nDETECTION'` where `\n` is a real newline.
   JavaScript does not allow literal newlines inside `'...'` → `Invalid or
   unexpected token`.
2. **ASCII apostrophe inside single-quoted string** — e.g.
   `'"Just don't let it write your citations."'` where the `'` in `don't`
   terminates the JS string early → `missing ) after argument list`.

`DynamicBlock.tsx` calls `new Function(...RUNTIME_KEYS, code)` at render time.
If that throws (SyntaxError), the block displays the compile-error overlay.
Because `render_scenes.mjs` uses `require.context` to bundle ALL scene JSONs
at webpack time, a render task started BEFORE the JSON fix is applied will bake
the broken code into its bundle permanently — even if the JSON is fixed later,
the already-running render produces a corrupted mp4. The size guard (>100KB)
lets it through because the file is structurally valid H.264; only playback
reveals the error overlay.

**Prevention (mandatory preflight — no exceptions):**
After authoring or modifying ANY scene JSON, run `node --check` on every
bullet's `code` field BEFORE starting any render task:

```python
import json, subprocess, os, tempfile

def assert_scene_compiles(json_path):
    data = json.load(open(json_path, encoding='utf-8'))
    errors = []
    for i, b in enumerate(data):
        tf = tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8')
        tf.write(b['code'])
        tf.close()
        r = subprocess.run(['node', '--check', tf.name], capture_output=True, text=True, encoding='utf-8')
        os.unlink(tf.name)
        if r.returncode != 0:
            errors.append('B%d (%s): %s' % (i+1, b['audio_anchor'][:30], r.stderr.split('SyntaxError:')[-1][:80].strip()))
    if errors:
        raise RuntimeError(json_path + ' has syntax errors:\n' + '\n'.join(errors))
```

Run this for every scene JSON before `node render_scenes.mjs ...`.

**Fix procedure when a render has already started with broken JSONs:**
1. Kill the render task (`TaskStop`).
2. Fix the JSON files.
3. Delete ALL mp4 files that the broken-bundle task rendered (they all used the
   same broken bundle — even "done" scenes from that task may have errors).
4. Start a fresh render — the new task will re-bundle with the fixed JSONs.

**Escaping rules for Opus-generated code (enforce via code review):**
- Multiline text content → use `\\n` (JSON: `\\\\n`) or split into array with
  `React.createElement('br', {key:'br'})` between elements.
- Apostrophes in single-quoted strings → `\\'` (JSON: `\\\\'`) or switch
  outer delimiter to double quotes.
- Never author JS string literals that span multiple lines inside `code` fields.

**Regression test:** Add `node --check` as a Step 8.4 gate in `build_video.py`
before `render_scenes.mjs` is invoked — hard-fail if any bullet's code is
syntactically invalid.

---

## Class N — audio_anchor fails narration verbatim check due to `<pause Xs>` tokens

**Symptom:** `build_video.py` raises `RuntimeError: cached audio_anchor '...' is not a verbatim phrase in narration` even though the phrase visually appears in the narration text.

**Root cause:** The narration validator tokenises with `r"[a-z0-9]+"` which includes `<pause 0.3s>` → tokens `["pause","0","3s"]`. Any anchor phrase that spans a `<pause>` break is non-contiguous in the token list → validation fails.

**Examples that fail:**
- Narration: `"Ethics? <pause 0.3s> …GPT."` → anchor `"Ethics GPT Yeah"` fails because `["ethics","gpt","yeah"]` are not contiguous.
- Narration: `"nine hundred million weekly"` → anchor `"900 million weekly"` fails (Whisper outputs numerals, narration has words).
- Narration: `"OpenAI wins"` → anchor `"Open AI wins"` fails (one word vs two in narration).

**Fix rules:**
1. Anchor must be verbatim in the narration as written (not as Whisper transcribes it).
2. Never span a `<pause Xs>` boundary — use a phrase from one side of the pause.
3. For number words ("nine hundred") the fuzzy Whisper matcher handles digit form ("900") at alignment time — write the anchor as it appears in the narration.
4. For "OpenAI" (one word in narration, Whisper says "Open AI") — use "OpenAI" in the anchor; fuzzy tier 4 (SequenceMatcher) handles the split at alignment time.

**Now prevented by:** These rules are documented here. Before authoring any anchor, visually confirm it is a verbatim substring of the narration text with no `<pause>` in between.

---

## Class N+1 — Minimal bullet code produces visually meaningless output

**Symptom:** Rendered scene shows thin lines, blinking cursors, or single abstract shapes with no narrative connection. Viewer cannot tell what the narration is talking about.

**Root cause:** Bullets like "Hairline crack appears" or "Cursor blinks; silence" were coded as literal abstract effects (2-3 thin lines, a blinking glyph) with zero text context. The LLM optimised for visual correctness of the description rather than viewer comprehension.

**Rule:** Every bullet code must answer: *"If you muted the audio and watched this frame, could the viewer understand what topic is being discussed?"* If not, add:
- A title/label showing the subject (e.g. `'ARTIFICIAL ANALYSIS — HALLUCINATION BENCHMARK'`)
- A stat, quote, or data point visible on screen
- Enough context text that the visual is self-explanatory

Short transition bullets (< 2s) are exempt, but any bullet > 3s with no readable text is a production failure.

**Now prevented by:** Read this rule before authoring any bullet with a vague headline (e.g. "crack appears", "cursor blinks", "wipe", "transition"). Always add context text.

---

## MANDATORY PRE-RENDER GATE — Visual Walkthrough (rule 19 § 10)

Before ANY render of a new scene: write a one-line "muted viewer sees:" description for
every bullet and apply the FAIL test. No render starts until all bullets pass.
Full procedure is in **rule 19 § 10**. This gate catches the bug classes below before
a 25-min render bakes them in.

---

## Class N+2 — ADDITIVE bullet assumes previous bullet's visuals are still visible

**Symptom:** An ADDITIVE bullet that "adds on top of" the previous bullet shows only its own content with no context. E.g. B7 (checkmarks) showed floating ✓/⚠ symbols with no octopus body, no arms, no tool labels — because those were in B6 which had already ended.

**Root cause:** In slot-based rendering (`UniversalScene.tsx`), each bullet renders ONLY during its own `[framesFrom, framesTo]` window. When B7's slot begins, B6's slot has ended — B6's React code is no longer running. There is no "accumulation" of previous bullets' visuals.

**Rule:** Every ADDITIVE bullet must be visually self-contained and self-explanatory. It cannot rely on previous bullet content being visible.  
- Copy the relevant background/context elements from the previous bullet into the new one.  
- If B6 shows an octopus + arms, B7 (which adds checkmarks) must ALSO render the octopus body + arms + labels, then ADD the checkmarks on top.

**Fix checklist before authoring any ADDITIVE bullet:**
1. Ask: "If this bullet played with all previous bullets invisible, would a viewer understand what topic is on screen?"
2. If no: add the essential context elements (labels, title, background shapes) directly in THIS bullet's code.
3. Short stagger bullets (<2s) that add a single label or stat are exempt — but the BASE visual (chart, diagram, workspace) must already be present in a REPLACE bullet before them.

**Now prevented by:** This rule. Apply it during every bullet authoring session before seeding cache.

---

## Class N+3 — Empty container: border drawn, inner content missing

**Symptom:** Rendered scene shows colored-border rectangles/boxes with nothing visible inside. E.g. S05 B7 showed two colored boxes (red border for "lawyer", green for "founder") with zero readable text — empty drawers. Viewer has no idea what they represent.

**Root cause:** The LLM authored the container `div` with a border, but placed the inner content (title label, body text, stat line) as sibling `divs` that either: (a) had incorrect positioning so they rendered outside the container bounds, (b) had `opacity: 0` from an animation that never triggered because `frame` started from 0 before the parent's `bgOp` reached 1, or (c) were simply missing — the LLM "completed" the visual description with the container alone.

**Rule:** Every bordered box/card must have at minimum:
1. A TITLE label (color-matched to the border, `fontFamily: D.font_mono`, `fontWeight: 700`)
2. A body line with the actual content claim (stat, quote, outcome)
3. Text must be inside `padding` or at `position: absolute` with explicit `top/left` inside the container — never rely on flexbox gap alone

**Muted-viewer test:** If you cover the border, is there still readable text that tells the viewer what this card is about? If not, the card is empty.

**Fix pattern:** When authoring a labeled card:
```js
React.createElement('div', {style: {backgroundColor: D.surface, borderRadius: 8, border: '2px solid ' + D.red, padding: `${Math.round(height*.022)}px ${Math.round(width*.022)}px`}},
  React.createElement('div', {style: {color: D.red, fontFamily: D.font_mono, fontSize: Math.round(width*.009), fontWeight: 700, marginBottom: Math.round(height*.012)}}, 'CARD TITLE'),
  React.createElement('div', {style: {color: D.text, fontFamily: D.font_mono, fontSize: Math.round(width*.01), lineHeight: 1.6}}, 'Body content here.')
)
```
The title and body must be INSIDE the container element, not as siblings.

**Now prevented by:** This rule. Check every card/box element during the pre-render walkthrough (rule 19 § 10).

---

## Class N+4 — Multiple position:absolute at same coordinates (duplicate overlay bug)

**Symptom:** Two or three identical-looking elements stacked exactly on top of each other — only the topmost is visible. E.g. S07 B4 had three `position:absolute` divs placed at the same `left/bottom` coordinates; one was an empty green-bordered card overlapping the numbers div, making the numbers look wrong.

**Root cause:** LLM creates multiple elements but uses the same computed position for each — often because it reuses `Math.round(height*.1)` as `bottom` for all siblings, or copies a container's position to all children without adding offsets.

**Detection rule:** Before seeding cache, visually trace every `position:absolute` element and ask: "does this element share the same `top/left/bottom/right` as any sibling?" If yes, the later sibling is invisible or obscures the earlier one.

**Fix:** Use either:
- `flexDirection: 'column'` with `gap` for vertically-stacked elements (no `position:absolute` needed)
- Or explicitly stagger: `top: Math.round(height*.1)` for el1, `top: Math.round(height*.25)` for el2, etc.

**Common case:** The "result card" pattern (stat + badges) — use a single centered column flex container, not multiple `position:absolute` siblings.

**Now prevented by:** This rule + the pre-render walkthrough checklist item: "do any two elements have identical computed position?"

---

## Class N+5 — Diagonal line coded as filled rectangle

**Symptom:** Code attempts to draw diagonal connections between two points using a `div` with `width: Math.abs(dx)` and `height: Math.abs(dy)` — this creates a solid filled rectangle, not a line. E.g. S03 B6 "octopus arms" created 8 filled colored rectangles instead of the intended diagonal lines from center to tool cards.

**Root cause:** LLM correctly computes the `dx/dy` offset between two points, then uses those as `width/height` of a `div` — creating a rectangular fill, not a line. The visual result is a grid of colored blocks, not connecting arms.

**Correct pattern for diagonal lines using CSS:**
```js
const dx = x2 - x1; const dy = y2 - y1;
const len = Math.round(Math.sqrt(dx*dx + dy*dy));
const angle = Math.atan2(dy, dx) * 180 / Math.PI;
React.createElement('div', {style: {
  position: 'absolute',
  left: x1, top: y1,
  width: len, height: 2,
  backgroundColor: D.cyan,
  transform: `rotate(${angle}deg)`,
  transformOrigin: '0 50%'
}})
```

**Alternative (when connecting two anchor points):** Instead of diagonal lines, use a grid of labeled cards (simpler, more readable, no trigonometry needed). The 8-tool grid pattern is the canonical replacement for "hub-and-spoke" diagrams.

**Rule:** NEVER use `width: Math.abs(x2-x1), height: Math.abs(y2-y1)` on a `div` to draw a line. Either use the `rotate + thin height` pattern above, or replace the hub-spoke design with a labeled card grid.

**Now prevented by:** This rule. Grep for `Math.abs(` in width/height props during code review — if both `width` and `height` use `Math.abs` of a coordinate difference, it is this bug.

---

## Class N+6 — Two-panel comparison split across two ADDITIVE bullets

**Symptom:** A pipeline or A-vs-B comparison has two panels — LEFT card (step 1) and RIGHT card (step 2). Each is coded as a separate ADDITIVE bullet. When either bullet plays, viewer sees ONE card on the left or right half of the screen with the other 50-60% completely black.

**Example:** S07 pipeline — B2 (GPT DRAFT, left-only) → B3 (Claude FACT-CHECK, right-only). In additive mode, B3 was supposed to join B2 on screen. In slot-based rendering, B3 plays alone: viewer sees only the right card, left half is empty.

**Root cause:** The author designed the two bullets as "additive overlay" (B2 sets up left, B3 adds right). In slot-based rendering, this assumption breaks — each bullet must be self-contained.

**Rule:** When a visual story requires TWO panels to be understood simultaneously (pipeline A→B, before/after, comparison), use ONE OF:

Option A — Single REPLACE bullet showing both panels:
```js
// Both LEFT and RIGHT cards in one bullet
React.createElement(AbsoluteFill, {style: {backgroundColor: D.bg}},
  React.createElement('div', {style: {position:'absolute', left: Math.round(width*.06), ...}}, /* LEFT card */),
  React.createElement('div', {style: {position:'absolute', right: Math.round(width*.06), ...}}, /* RIGHT card */)
)
```

Option B — Each bullet self-contained with both panels, active one bright, inactive one dimmed (opacity .25):
```js
// B2: LEFT active (bright), RIGHT waiting (dimmed)
// B3: LEFT done (dimmed), RIGHT active (bright)
```

**The test:** Cover one panel. Can the viewer still understand what the other panel means? If not, the panels are co-dependent and must appear together.

**Now prevented by:** This rule. Whenever authoring two bullets that show "left half → right half", immediately ask: "would either look coherent alone?" If no → use Option A or Option B.

---

## Class N+7 — Unlabeled data bars (benchmark bars with no model identity)

**Symptom:** Animated bar chart shows colored horizontal bars filling to some percentage, but the only labels are the percentage numbers. Viewer cannot tell which bar represents which model. E.g. S04 B2/B3/B4/B7/B8 showed violet bar 82.7% and cyan bar 69.4% with no "GPT-5.5" or "CLAUDE 4.7" text visible.

**Root cause:** The REPLACE bullet (B1) set up the track layout WITH model labels at `left: width*.08`. The ADDITIVE bullets (B2-B8) only drew the bars, not the labels — they depended on B1's labels still being visible. In slot-based rendering, B1 is gone when B2 plays.

**Rule:** EVERY benchmark bar bullet (whether REPLACE or ADDITIVE) must include:
1. **Benchmark round context** — `'ACTING ROUND — BENCHMARK-NAME'` or `'REASONING ROUND — BENCHMARK-NAME'` at `top: height*.1` centered
2. **Model identity labels** at `left: width*.08` for each bar track:
   - Left of top track: `color: D.violet, 'GPT-5.5'` (or `D.cyan, 'CLAUDE 4.7'` depending on which model is on top)
   - Left of bottom track: the other model label
3. Score **percentage** at the right end of the bar
4. **Winner badge** (e.g. `'+13.3 PTS'`) appearing after bar fills

The pattern `left: width*.08, top: TY1+TH*.25` for model label and `left: width*.14` for bar start leaves a natural label column.

**Now prevented by:** This rule. For every bar chart bullet, write the pre-render walkthrough entry as: "Viewer sees: [ROUND] label, [MODEL A] top bar at X%, [MODEL B] bottom bar at Y%, winner badge." If any of those elements is missing from the description, the bullet is incomplete.

---

## Class N+8 — Pipeline output appears frozen in background tasks (false hang diagnosis)

**Symptom:** Background task output stops at exactly "Race 1: Terminal-Bench, MAGENTA leads." (S04 B2 in step 7). Operator concludes pipeline is hung, kills it, restarts — repeating the loop. The mp4s never appear because the pipeline is killed before it finishes rendering. This exact loop happened ≥3 times in the chat_5_5 build session (2026-05-16).

**Root cause:** Python's stdout is **block-buffered** when its output goes to a pipe (PowerShell background task output capture). Python accumulates ~8KB in a memory buffer before flushing to the file. The pipeline prints ~8KB of lint warnings and step 7 frame ranges for S01-S04, then the buffer fills and stops flushing until the process exits or the buffer overflows again. Meanwhile the pipeline IS running step 7 for S05-S10, then step 8, then step 9 (Remotion render) — completely invisible in the output file.

**Why "Race 1: Terminal-Bench":** That line happens to be the point where the ~8KB buffer fills for the chat_5_5 project (86 bullets worth of lint + step 7 frame output). A different project with more/fewer bullets would have a different stopping line, but the underlying cause is always the same buffer fill.

**Confirmed NOT a hang:** The pipeline processed all 10 scenes and rendered S04 (chat-5-5-s04.mp4, 6.6 MB, 22:32 timestamp) while the output file was still showing the frozen line. The render completed silently in the background.

**Fix (use ALL of these):**

1. **Use `python -u` flag** (unbuffered) when running in any background context. This disables block buffering so each `print()` writes immediately:
   ```powershell
   python -u storyboard/build_video.py ... > C:\tmp\build_s05.log 2>&1
   ```

2. **Redirect to a log file + read tail** instead of reading task output. The log file grows in real time with `-u`:
   ```powershell
   Get-Content C:\tmp\build_s05.log -Encoding Unicode -Tail 30
   ```

3. **Check for rendered mp4s, NOT task output**, to determine render progress:
   ```bash
   ls -la remotion/out/chat-5-5-s*.mp4
   ```
   If a new mp4 appeared with a recent timestamp → that scene rendered. Task output is irrelevant.

4. **Never kill a pipeline because output looks frozen.** Wait for either: (a) a new mp4 appears, (b) the task notification fires (completed/failed), or (c) 60+ minutes pass with no new mp4 AND no node.exe or python.exe process visible in `Get-Process`.

**What a healthy stuck-looking run looks like:**
```
# Task output (frozen at):
        [anchor] 646-745f  Race 1: Terminal-Bench, MAGENTA leads.

# But Get-Process shows:
node.exe    Id=XXXX  CPU=high  Working=1.2GB   ← Remotion rendering

# And remotion/out/ has:
chat-5-5-s05.mp4  22:58  5.1 MB   ← appeared while "frozen"
```

**What a genuinely stuck run looks like:**
- No `node.exe` or `python.exe` process visible in `Get-Process`
- No new mp4 appeared after 30+ minutes
- Task status is still "running" (harness lag)

In that case, kill and restart with `python -u ... > C:\tmp\build.log 2>&1` to see the real error.

---

## Class N+9 — Remotion (node) render progress invisible in log files

**Symptom:** `build_video.py` log ends at `rendering 1 scenes: ['chat-5-5-s05']` and nothing appears after — not frame counters, not success/failure, nothing. Operator concludes render crashed silently. Kills task. Restarts. Loop repeats. `CREATE_NO_WINDOW` is the cause.

**Root cause:** `build_video.py` spawns `node render_scenes.mjs` via:
```python
subprocess.Popen(
    ["node", "render_scenes.mjs"] + to_render,
    cwd=str(REMOTION_DIR), env=env,
    creationflags=CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
)
```
`CREATE_NO_WINDOW` on Windows tells the OS to create the child process **without an attached console**. A side effect: Windows does NOT inherit the parent's stdout/stderr handles to a consoleless child. Node's stdout (frame progress `100/5711`, `200/5711`, ...) and stderr go to NUL — discarded. The Python parent is blocked on `proc.wait()` and prints nothing until node exits. The log appears dead.

**How this differs from Class N+8:** Class N+8 is Python's own block-buffered stdout (fixed with `-u`). Class N+9 is a different process entirely — node's stdout is structurally discarded, not buffered. Even `python -u` makes no difference for node's output.

**Proof it was running:** When `node render_scenes.mjs chat-5-5-s05` is run directly (not via `build_video.py`) with output captured, frames print normally: `100/5711 ... 200/5711 ...`. The render IS running; the log just shows nothing.

**What the correct diagnostic looks like:**
```powershell
# 1. Is node still alive?
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, CPU, StartTime

# 2. Any inprogress file growing?
Get-ChildItem remotion/out/ | Sort-Object LastWriteTime -Descending

# 3. Final verdict — did the mp4 appear?
Get-ChildItem remotion/out/chat-5-5-s*.mp4 | Sort-Object LastWriteTime -Descending
```
If `node.exe` is visible with high CPU → render is running. Period. Do not kill it.

**Fix for future monitoring:** Run node directly (bypassing `build_video.py`) if you need visible frame progress:
```powershell
$env:PROJECT = "chat_5_5"
Set-Location remotion
node render_scenes.mjs chat-5-5-s05 > C:\tmp\render_s05.log 2>&1
# C:\tmp\render_s05.log will contain live frame counters
```
Or just watch for the mp4 to appear in `remotion/out/`.

**NEVER kill a node.exe/python.exe that started within the last 20 minutes just because the log looks frozen.** That is always Class N+8 or N+9, not a hung process.

---

## Class N+10 — Canvas underutilization (content <60% of screen)

**Symptom:** Rendered frame shows large black empty areas — top 25%+ blank, or right/left 30%+ unused. Elements are technically present but clustered in a small region of the 1920×1080 canvas. Viewer feels like they're watching a tiny postage stamp. Dull, amateurish.

**Root cause:** Per-bullet code uses size constants that are too small (e.g. `MW=width*.14, MH=height*.22`) and/or positions them via center-clustering logic that fails to spread elements across the full canvas. Often occurs in multi-element grid layouts (2×2 or 4-item) where author anchored all positions relative to a narrow center band.

**Canonical examples:**
- S06 B1: 4 vending machines at `MW=width*.14, MH=height*.22` with positions `{x:.16,y:.35},{x:.38,y:.28},{x:.6,y:.35},{x:.38,y:.58}` → machines small, top 28% and right 33% unused.

**Prevention rules:**
1. For 2×2 grid: machine/card must be at minimum `MW=width*.38, MH=height*.28`. Column centers at ~26% and ~74%. Row tops at ~22% and ~58%.
2. Canvas coverage check before render: `min(element top) ≤ 0.20`, `max(element bottom) ≥ 0.80`, `min(element left) ≤ 0.08`, `max(element right) ≥ 0.88`
3. 4-item layouts MUST span from column 6% to 94% and row 18% to 88% (allowing for title at top).
4. Single card layouts: card width ≥ `width*.55`, card height ≥ `height*.55`.
5. After authoring multi-element code, verify every `MW=`, `MH=`, and position multiplier meets the above minimums before seeding cache.

**Fix pattern for 2×2 grid:**
```javascript
const positions=[{cx:.26,cy:.22},{cx:.74,cy:.22},{cx:.26,cy:.58},{cx:.74,cy:.58}];
const MW=Math.round(width*.40); const MH=Math.round(height*.30);
// left = Math.round(width*p.cx) - Math.round(MW/2)
// top  = Math.round(height*p.cy)
```

---

## Class N+11 — Absolute overlay collides with card header (stamp/badge overlap)

**Symptom:** A stamp, badge, or floating label is positioned at canvas coordinates that put it within 5% of a card's `top:` value. When the element rotates (e.g. `rotate(-12deg)`), it bleeds across the card's top edge and covers the header text. Viewer sees unreadable overlapping text.

**Root cause:** Author positions the overlay at canvas-level `top:` only slightly above (or equal to) the card's `top:` — e.g. stamp at `top:height*.26` when card is at `top:height*.28`. The 2% gap is smaller than the rotated element's visual extent, causing collision. The card header (`CLAUDE RESPONSE`, `CUSTOMER EMAIL`, etc.) is rendered at the very top of the card with only marginBottom:8px separation.

**Canonical examples:**
- S06 B3: Stamp `REFUND: NEVER SENT` at `top:height*.26` overlaps right panel header `CLAUDE RESPONSE` at `top:height*.28`. Only 2% canvas height gap; rotation spreads stamp across header.

**Prevention rules:**
1. Any stamp/badge overlay over a card MUST be positioned at least 20% of the card's height below the card's `top:` value. Formula: `stampTop = cardTop + cardHeight * 0.55` (lower 45% of card).
2. If stamp is canvas-absolute (not inside the card element), ensure `stampTop ≥ cardTop + cardHeight * 0.35`.
3. Prefer positioning stamp BELOW the card entirely (`top: cardTop + cardHeight + gap`) when it should feel like a verdict, not content inside the card.
4. Never use `transform:rotate(Xdeg)` on a canvas-absolute element that shares a `top:` within 8% of any other element's `top:`.
5. Test visually: stamp center Y + (font_size / 2) + rotation_spread must NOT overlap any text line above it.

**Fix pattern:**
```javascript
// Card at top:height*.28, height:height*.24
// Stamp INSIDE lower panel area — safe:
top: Math.round(height*.28 + height*.24 * 0.55)  // = height*.412 → well below header
// OR stamp below both panels:
top: Math.round(height*.58)  // below panel bottom (52%) with visible gap
```

---

## Session progress record — 2026-05-16 (chat_5_5 build)

**State at session end:**
- S01 mp4: ✓ rendered (19:59)
- S02 mp4: ✓ rendered (20:02)
- S03 mp4: ✓ rendered (20:52)
- S04 mp4: ✓ rendered (22:32) — **all 9 muted-viewer fixes applied** (see below)
- S05 mp4: **rendering in progress** (task bo9fcepne, started ~23:07, `C:\tmp\render_s05.log`)
- S06-S10: not yet rendered

**S04 muted-viewer fixes applied:**
- B2/B3/B4: Added "ACTING ROUND — [BENCHMARK]" header + GPT-5.5/CLAUDE 4.7 model labels at each bar track (Class N+7)
- B7/B8: Added "REASONING ROUND — [BENCHMARK]" header + labels, Claude on top/TY1 (Class N+7)
- B11: Rewrote as full self-contained BENCHMARK SUMMARY scene (was floating badges on black — Class N+2)
- S06 B2: Added VENDING-BENCH context header + machine body (Class N+3)
- S06 B4: Centered two panels (was right-60%+ only — Class N+6)
- S07 B2: Added RIGHT card dimmed (opacity .2) showing full pipeline (Class N+6)
- S07 B3: Added LEFT card dimmed (opacity .3) showing full pipeline (Class N+6)

**Canonical scene JSON state:**
- S04: 22:09 timestamp — has all fixes ✓
- S06: 22:09 — has fixes ✓
- S07: 22:09 — has fixes ✓
- S05/S08-S10: older timestamps — **no muted-viewer issues identified**, OK to render as-is

**To continue (next session):**
1. Check S05: `Get-Content C:\tmp\render_s05.log | Select-String "\d+/5711" | Select-Object -Last 1`
2. If S05 done (mp4 in `remotion/out/`): run `python -u storyboard/build_video.py projects/structured_scripts/chat_5_5.txt --skip-layout > C:\tmp\build_all.log 2>&1` — pipeline auto-skips S01-S05
3. Monitor S06-S10 render: `Get-Process node` for liveness; `Get-ChildItem remotion/out/chat-5-5-s*.mp4` for new files — NOT the log
4. After all 10 rendered: pipeline auto-stitches → `projects/chat_5_5/out/GPT_5_5_vs_Claude_Opus_4_7.mp4`

---

## Class N+12 — Anchor phrase tokenization mismatch → interpolated framesFrom lands seconds off

**Symptom:** `verify_sync.py` reports anchor NOT FOUND for a block. Pipeline interpolates `framesFrom` from neighbors. Visual appears 1–3+ seconds before or after narration says the matching phrase. In extreme cases (S05 B3 in chat_5_5): +3.02s drift — visual appears 3 seconds AFTER the words are spoken.

**Root cause — three specific mismatch patterns confirmed in production:**

1. **Decimal spoken as split number tokens** — anchor `"seventy-seven point eight"` normalizes to target `["77","point","eight"]`. But Whisper transcribes `77.8` as two tokens: `"77"` and `".8."` — no `"point"` word ever appears as a separate token. Matcher fails on the missing middle token.

2. **Percentage as single Whisper token** — anchor `"thirty-six percent"` normalizes to `["36","percent"]`. But Whisper outputs `"36%."` as ONE token — `"percent"` never appears as a separate word. Two-token target has no match.

3. **Compound word split by Whisper** — anchor `"OpenAI isn't"` normalizes to `["openai","isnt"]`. Whisper transcribes as `"Open"` `"AI"` `"isn't"` (three tokens). First token `"open"` ≠ `"openai"` → exact match fails. Fuzzy tier 4 (SequenceMatcher) sometimes catches this; sometimes doesn't.

**Confirmed production impact (chat_5_5, 2026-05-17):**
- S05 B3 "thirty-six percent" → interpolated to 23.60s, spoken at 20.58s → **+3.02s CRITICAL drift**
- S03 B5 "Now watch GPT" → adjacent-block interpolation landed at 36.07s, spoken at 35.42s → **+0.65s drift**
- S08 B4 "seventy-seven point eight" → interpolated to 63.60s, spoken at 63.84s → -0.24s (minor)

**Anchor phrase rules (mandatory):**
1. **Never use decimal numbers as anchors.** `"seventy-seven point eight"`, `"four point seven"`, etc. always fail. Use the surrounding sentence instead: `"Mythos scores"` instead of `"seventy-seven point eight"`.
2. **Never use number+unit as anchor.** `"thirty-six percent"`, `"fifty million"` fail if Whisper merges them. Use context: `"the needle"` or `"coin flip"` for nearby spoken words.
3. **Compound words (OpenAI, SWEbench, TerminalBench):** fuzzy tier 4 usually handles these but is unreliable. Prefer surrounding plain words: `"isn't competing"` instead of `"OpenAI isn't"`.
4. **Always use a phrase of 2–4 plain words from the surrounding sentence** — not the statistic or measurement being displayed.

**Verification procedure (mandatory after every alignment step):**
Run `verify_sync.py` (copy of alignment functions from `build_video.py`) against all scene captions BEFORE rendering. Any block showing MISSED or DRIFT >0.5s must be fixed in the scene JSON (`framesFrom`/`framesTo`) before rendering starts. Re-rendering after sync fixes is required — fixing JSON alone is not enough since the master render uses pre-rendered scene mp4s.

```python
# Correct procedure for a missed anchor:
# 1. Load captions/<sid>.json (Whisper word timestamps)
# 2. Find the word index where the anchor phrase is actually spoken
# 3. Set framesFrom = round(words[idx]['start'] * FPS)
# 4. Set prior block's framesTo = same value
# 5. Re-render the scene
```

**Fix order for chat_5_5 production (2026-05-17):**
- S03 B5: framesFrom 1082 → 1063, B4 framesTo 1082 → 1063
- S05 B3: framesFrom 708 → 617, B2 framesTo 708 → 617
- S08 B4: framesFrom 1908 → 1915, B3 framesTo 1908 → 1915

**Now prevented by:** These anchor rules + mandatory `verify_sync.py` run before any render.

**Structural guard added (build_video.py Step 7):** a *drift-plausibility check* on every
fuzzy anchor hit. Tiers 3–4 of `find_phrase_fuzzy` scan the whole rest of the scene by
similarity only, so a loose phrase can match a window far from where the bullet belongs
and return a confident-but-wrong index (the +3s drift above). The guard:
- never touches an EXACT match (those are trustworthy),
- for a FUZZY match, compares the matched word index to the bullet's expected position
  (`bullet_i / n_bullets × scene_word_count`) with a generous ±50%-of-scene band,
- if the hit is past the band, it's REJECTED and treated as a miss — filled by
  neighbor interpolation (more reliable than a bad match; never source-script time).
Verified: normal in-order anchors all pass (no false rejects); a bullet-1 anchor that
matches near the scene end is rejected. Regression test: `test_pipeline_fixes.py [13b]`.

---

---

## Scene Verification Checklist (run after every render, before master stitch)

These are **general quality gates** that apply to every video project — not
project-specific. Check each rendered scene mp4 against all conditions below.
If any condition fails: fix the scene JSON / bullet code, delete the scene mp4,
re-render, and verify again. Do **not** move to the next scene until the current
scene passes all conditions.

### Conditions

| # | Condition | How to check |
|---|-----------|-------------|
| V1 | **Screen utilization** — no block should leave >60% of canvas empty | Inspect bullet code: at least one element must span ≥40% of width or height |
| V2 | **No overlapping text or visuals** — elements at similar top/left values must have different time phases or non-overlapping layout areas | Read all `top`/`left`/`right`/`bottom` values in block code; flag same-position siblings that are simultaneously visible |
| V3 | **Audio / visual sync** — framesFrom must match the spoken word within ±0.5s | Run `verify_sync.py`; any DRIFT > 0.5s or MISSED anchor with wrong interpolation = fail |
| V4 | **Text readability** — body text ≥ `width * 0.009`, headline text ≥ `width * 0.022` | Grep bullet code for `fontSize:Math.round(width*` and confirm values meet minimums |
| V5 | **Animation quality** — every block must use at least one `spring()` or `interpolate()` for motion; static renders are forbidden | Grep block code for `spring(` or `interpolate(`; zero matches = fail |
| V6 | **Block duration** — no block shorter than 0.5s (15 frames) unless it is a deliberate flash transition | Check `(framesTo - framesFrom) / fps`; flag any block < 15 frames |
| V7 | **Scene flow consistency** — no gap between consecutive blocks (framesTo of block N must equal framesFrom of block N+1) | Check JSON: `blocks[i].framesTo === blocks[i+1].framesFrom` for all i |
| V8 | **Narration coverage** — every narration sentence must have a visual block active while it is spoken | Cross-check Whisper word timestamps against block [framesFrom, framesTo] windows |

### Failure workflow

```
FOR each scene S01..S10:
  VERIFY all V1..V8
  IF any fail:
    IDENTIFY failing block(s)
    FIX bullet code or framesFrom/framesTo in scene JSON
    DELETE old scene mp4
    RE-RENDER scene
    RE-VERIFY
    REPEAT until all V1..V8 pass
  MARK scene PASSED
  MOVE to next scene
RE-RENDER master only after all 10 scenes pass
```

### Quick verification commands

```bash
# Sync check (V3)
python C:/tmp/verify_sync.py

# Block duration / gap check (V6, V7)
python -c "
import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
FPS = 30
for i in range(1, 11):
    sid = f'chat-5-5-s{i:02d}'
    blocks = json.loads(Path(f'remotion/public/scenes/{sid}.json').read_text(encoding='utf-8'))
    for j, b in enumerate(blocks):
        dur = (b['framesTo'] - b['framesFrom']) / FPS
        if dur < 0.5:
            print(f'{sid} B{j+1}: DURATION {dur:.2f}s < 0.5s — FAIL V6')
        if j > 0 and blocks[j-1]['framesTo'] != b['framesFrom']:
            gap = (b['framesFrom'] - blocks[j-1]['framesTo']) / FPS
            print(f'{sid} B{j+1}: GAP {gap:.2f}s after B{j} — FAIL V7')
print('Duration/gap check done')
"
```

---

## What to do when you hit something not in this list

1. Add it here as a new class with symptom + root cause + defense.
2. If structural prevention is possible (regression test in
   `test_pipeline_fixes.py`), add it.
3. If only docs can prevent, mark it in the relevant rule with `**KNOWN ISSUE:**`.

## Class N+13 — Render hangs forever (parent-side `proc.wait()` with no ceiling)

**Symptom:** The build reaches the render step and never returns. No error, no
progress, the session is stuck — minutes (sometimes the whole session) lost before
anyone notices and kills it manually.

**Root cause:** `render_scenes.mjs` has an internal 120s no-frame-progress watchdog
(Class N+8/N+9), but it only covers a render that's *actively stalled mid-frame*. It
does NOT cover:
- node deadlocking BETWEEN scenes (cleanup / file write — no `renderMedia` running, so
  no watchdog active),
- the watchdog firing `cancel()` but an orphaned Chromium keeping the node event loop
  alive so the process never exits,
- a hang before the first `onProgress`.
In all three, `build_video.py` was calling a **bare `proc.wait()`** on the node
subprocess — which blocks the Python parent **indefinitely**.

**Fix (build_video.py render step):** `proc.wait(timeout=_render_ceiling_s)` with a
wall-clock ceiling sized PER SCENE (`render_timeout_per_scene_s`, default 900s, ×
number of scenes rendering; floor 900s). On `TimeoutExpired` the render tree (node +
Chromium) is force-killed via the shared `_kill_render_tree()` helper and the build
exits **124** (timed-out convention). Completed scenes are kept; re-run resumes the
rest. The ceiling is generous so a legitimately long batch never false-trips; override
with config `build.render_timeout_per_scene_s` or env `RENDER_TIMEOUT_PER_SCENE_S`.

**Prevention:** never call `proc.wait()` without a timeout on a long-running render or
LLM/TTS subprocess — an unbounded wait turns any downstream hang into a frozen session.

---

The principle: **every bug we hit twice is a process failure, not a code bug.**
Each Class above shipped with a regression test in
`storyboard/test_pipeline_fixes.py` — run that file (`python -m
storyboard.test_pipeline_fixes`) before any change to the matching code area.
