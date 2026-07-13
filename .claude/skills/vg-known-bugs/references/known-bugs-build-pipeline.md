# Known Bugs — Build / TTS / Render-Pipeline (Class 1–20)

Reference catalog for `vg-known-bugs`. Read the relevant class before editing `build_video.py`, `ssml_compiler.py`, `narration_pacer.py`, or `visual_designer.py`. Each bug was real; each is now fixed in code, guarded by a regression test (`storyboard/test_pipeline_fixes.py`), or documented so it can't silently regress. Router + 'what to do when it's not here' live in the parent SKILL.md.

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
  testing-engine fail from fatal/partial. Threshold configurable via
  `--strict-anchor-min-pct` (default 70).

- **Remotion version floor v4.0.245+ (test [21])** — pinned by `package.json`
  at v4.0.455 (latest 4.0.x). Below v4.0.245 the Chrome Headless Shell can
  auto-upgrade and break headless mode entirely (maintainer warning at
  remotion.dev/docs/miscellaneous/chrome-headless-shell). The test reads
  package.json and asserts every `remotion`/`@remotion/*` dep is ≥4.0.245.

---

---

## Class 9 — Slow render (re-bundle per scene)

**Was:** `build_video.py` called `node render_scenes.mjs <id>` once per scene.
Each call re-bundled webpack (~30s).

**Now:** Single call with all pending scene IDs at once. Bundle once, render
all.

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

---


---

## Class 21 — Scene boundary exact-matched a LATER scene's words (Whisper contraction)

**Symptom:** Scene 2's opening "Here is the whole map" was
located at t=319.5s (scene 8's "So here is the rule…") instead of t=29s. Scenes 2-7
collapsed to ~0.2s each; anchor coverage fell to 14%; the whole video's sync was garbage.

**Root cause:** Whisper transcribes clearly-spoken "here is" as the contraction
"here's" — ONE token, which `_norm` collapses to `heres`. The script-side tokens
`['here','is']` can never exact-match at the true position. The boundary matcher's
shrinking-prefix pass then found `"here is the"` VERBATIM inside a later scene and
returned it as a confident exact match — bypassing the fuzzy pass and the scaled
time fallback entirely. A wrong-but-exact match had no sanity check.

**Now prevented by (build_video.py):**
- `_contraction_variant()` — boundary pass 1 searches BOTH the as-written opening and
  a contracted twin ("X is"→"X's", "X are"→"X're", "do not"→"don't", …); earliest hit wins.
- **Proportional sanity gate** — any boundary match (exact or fuzzy) whose timestamp
  deviates from the proportionally-scaled script position by more than
  `BOUNDARY_MAX_DEV_SEC = max(30s, 0.15 × audio_total)` is REJECTED and the next
  pass / scaled fallback takes over.
- Regression test `[21]` in `test_pipeline_fixes.py`.
