---
name: vg-build-and-run
description: "How to run the pipeline, config.yaml format, CLI flags, exit codes, and project directory structure. Use whenever running a build, checking flags, writing config.yaml, or any request like "build command," "how to run," "CLI flags," "config format," "run the build," "--force flag," "--scene flag," or "exit code.""
---

# Build and Run

## Command

`build_video.py` is invoked with the path to the RAW script:

```bash
cd c:/Girish/Fundamental_Projects/video_generation/video_explainer

python storyboard/build_video.py projects/scripts/<name>.txt
```

The project name is the filename stem and `config.yaml` is read from `projects/<stem>/config.yaml`.

## Project directory structure (required)

There is ONE flow — raw input → canonical structured output → pipeline reads from canonical:

```
projects/
  scripts/
    <name>.txt              ← RAW script (any format, hand-written) — edit this
  structured_scripts/
    <name>.txt              ← CANONICAL format (single source of truth)
                             — written by script_converter.py OR hand-converted per rule 18
  <name>/
    config.yaml             ← per-project design + voice config (built per rule 00 §2)
    audio/                  ← auto-generated TTS
    out/                    ← auto-generated final video
```

When you pass `projects/scripts/<name>.txt`:
1. `script_converter.py` (or rule 18 hand-conversion) reads the raw script
2. Converts to canonical format (regex only — the LLM fallback was removed alongside the claude CLI subprocess; rule 14 has details)
3. Writes to `projects/structured_scripts/<name>.txt`
4. `source_parser.py` and `config.yaml` derivation (rule 00 §2) read from there
   — single source of truth for every downstream step

**Legacy:** an older layout used `projects/<name>/source.txt` as canonical input.
That path is being phased out. Never write conversion output to `projects/<name>/source.txt`.

## config.yaml format

```yaml
video:
  fps: 30
  width: 1920
  height: 1080

audio:
  voice: en-US-AndrewMultilingualNeural   # pipeline-pinned constant (see rule 00 §2a)
  rate: "+20%"   # CRITICAL: must be calibrated so TTS speaks at ~150 wpm.
                 # en-US-AndrewMultilingualNeural at +0% ≈ 122 wpm → visuals finish
                 # before narration ("visuals fast, sound slow").
                 # +20% ≈ 150 wpm (correct). Always start with +20%, not +0%.
                 # Formula to tune: rate = round((150 / actual_wpm - 1) * 100)%
                 # The pipeline prints actual wpm after TTS and warns if < 132 wpm.
                 # If build log shows [time] scale factor > 1.15× → rate is too low.
  pitch: "+0%"
  full_audio_filename: "full.mp3"

output: <Headline.mp4 from structured-script ## TITLE OPTIONS>

design:
  bg: <hex from BASE in structured-script ## DESIGN TOKENS>
  surface: <hex from SURFACE>
  text: <hex from WHITE>
  text_dim: <hex from DIM>
  amber: <hex from AMBER>
  cyan: <hex from CYAN>
  violet: <hex from MAGENTA>
  green: <hex from GREEN>
  red: <hex from RED>
  white: <hex from WHITE>
  font_display: "'<font from FONT_DISPLAY>', sans-serif"
  font_mono: "'<font from FONT_MONO>', monospace"
  dot_grid_opacity: <decimal from GLOBAL VISUAL SYSTEM grid opacity>
  dot_grid_spacing: <integer from GLOBAL VISUAL SYSTEM grid spacing>

# NOTE: There is no `llm:` section anymore. The previous `llm.designer_model`
# knob and `DESIGNER_MODEL` env var were removed when the claude CLI subprocess
# was removed from the pipeline. Per-bullet React code is authored in-session
# by the active Claude Code agent (rule 04); the model used is whichever the
# operator selected via `/model` (Opus 4.7 for authoring/QA, Sonnet 4.6 for
# routing/mechanical work — see SKILL.md § "MODEL STRATEGY").

# Optional — visual-block timing + scene-boundary heuristics.
# Defaults below; omit any key to use the default.
# build:
#   min_block_seconds: 2.0          # MIN_BLOCK_FRAMES = round(fps × this) — min visual block duration
#   scene_boundary_words: 8         # how many opening words to use to locate scene start in Whisper transcript
#   fuzzy_match_min_ratio: 0.6      # find_phrase_fuzzy default sliding-window overlap threshold
#   scene_boundary_min_ratio: 0.5   # boundary fallback fuzzy threshold
#   render_timeout_per_scene_s: 900 # parent-side render ceiling per scene (default 900s=15min). A stuck
#                                   # node/Chromium render is force-killed after (this × scenes) instead of
#                                   # hanging the session forever (rule 10 hang class). Env override:
#                                   # RENDER_TIMEOUT_PER_SCENE_S. Raise only if renders legitimately exceed it.

# Optional — ffmpeg quality knobs for stitch step.
# stitch:
#   mode: hard_cut                  # transition mode (hard_cut | crossfade)
#   scene_clean_preset: fast        # ffmpeg per-scene re-encode preset (ultrafast..veryslow)
#   scene_clean_crf: 20             # per-scene re-encode CRF (0..51, lower = better)
#   final_preset: medium            # final mux preset
#   final_crf: 19                   # final mux CRF
#   audio_bitrate: 192k             # final mux audio bitrate

# Optional — Whisper quantization + timestamp source.
# whisper:
#   compute_type: int8              # int8 | int8_float16 | float16 | float32
#   aligner: whisper                # whisper (default ASR) | torchaudio (forced alignment of
#                                   # the known narration → ~20-50ms word boundaries vs ~200ms;
#                                   # needs `pip install torchaudio`; any failure falls back to whisper)

# Optional — sync-to-meaning (anchor_mode: appear/through/land). framesFrom is set from
# the anchor word's start/end + the bullet's anchor_mode (seeded per bullet).
# sync:
#   anchor_lead_frames: 2           # `appear` starts this many frames BEFORE word_start (visual lead)
#   entrance_frames: 12             # `land` impact climaxes on word_end; windup starts this many frames earlier

# Optional — SSML narration prosody. Only matters if you switch off edge-tts
# to a TTS engine that respects SSML (Azure, ElevenLabs). edge-tts strips SSML.
# narration:
#   emphasis_rate: -15%             # ALL-CAPS / number rate inside <prosody>
#   punchline_rate: -10%            # final sentence rate
#   punchline_pitch: +5%            # final sentence pitch lift
#   em_dash_pause_ms: 400           # <break time="..."/> for ' — '
#   sentence_pause_ms: 250          # <break time="..."/> after ". "

# Optional — auto-fetch of [asset:] images at build Step 2.6 (rule 17).
# Missing [asset:] images are sourced from the bullet description automatically.
# assets:
#   auto_fetch: true                # false = hard-fail on a missing [asset:] instead of fetching
#   source: openverse               # openverse | wikimedia | pexels (pexels needs PEXELS_API_KEY)
```

All `design` values are written to `remotion/src/universal/config_tokens.json` at build time.

The `llm:` / `build:` / `stitch:` / `whisper:` / `narration:` / `assets:` sections are all OPTIONAL.
If absent, sensible defaults from `build_video.py` apply. They're for projects that need to
deviate from the pinned defaults (different visual cadence, different ffmpeg quality, larger
Whisper model, etc.).

## Build steps and expected output

```
[1/10] Loading config from config.yaml...
      design tokens → config_tokens.json
[2/10] Parsing structured script...
      N scenes: ['<project>-s01', ..., '<project>-sNN']
      [lint] (none — clean)
[2.5] Bullet vagueness lint...
      [bullet-lint] all bullets concrete — no vagueness detected
      (or: [VAGUE] scene 3 bullet 2 — "Performance": no quoted labels; no numbers; ...)
[3/10] Visual codegen (LLM per bullet, parallel workers)...
      [scene 1] codegen for 6 bullets (workers=2)...
      [scene 1] bullet 1/6 OK (cached)
      [scene 1] bullet 2/6 OK
      ...
      scene 1: 6 visual blocks (all bullets succeeded)
      ...
[4/10] Continuous TTS (SSML-enhanced)...
      generating TTS via en-US-AndrewMultilingualNeural (hash abc12345)...
      audio: 465.40s (13962 frames)
[5/10] Whisper transcribe (cached by audio hash)...
      transcribed: 1842 words
[6/10] Locating scene boundaries...
      scene 1: word #0 (t=0.12s)
      ...
[7/10] Computing visual block frame ranges...
      <project>-s01: 960f (32.0s), 6 blocks
      ...
      audio_anchor coverage: 38/42 (90%)
[8/10] Patching timelines.ts...
      patched 7 entries
[8.5] Validating render-side prerequisites for 7 scenes...
      OK — all 7 scenes have JSON, in timelines.ts, valid IDs.
[9/10] Rendering 7 scenes (bundle once)...
      rendering 7 scenes: ['<project>-s01', ...]
[QA] Visual sanity check on N rendered scenes...
      <project>-s01: ok (XX MB, YY.Ys, brightness=NN.N)
      ...
      OK — all renders passed sanity checks.
[10/10] Stitching + muxing audio...

-- DONE: projects/<name>/out/<output>.mp4  (13 MB, 465.4s)

[output] Validating final video against structured script...
[output] SUMMARY:
         narration coverage   : 94% (avg across scenes)
         animation visibility : 100% (42/42 bullets visible)
[output] OK — narration and all animation bullets verified in final video.
```

## CLI flags

| Flag | Effect |
|------|--------|
| (none) | full build, with hash-based cache reuse |
| `--scene N` | re-render only scene N (1-indexed). Skips stitch step. |
| `--whisper-model X` | tiny/base/small/medium/large. Default: base |
| `--force` | clear all caches: per-bullet codegen, transcripts, TTS hash, scene renders |
| `--redesign` | clear per-bullet codegen cache only (keeps audio + transcript) |
| `--retts` | clear TTS hash only (re-generates audio + Whisper) |
| `--strict-bullets` | hard-fail the build at Step 2.5 if any bullet scores VAGUE in the bullet linter. Without this flag, vague bullets are warned but build continues — LLM may hallucinate stats/labels. |
| `--strict-anchors` | hard-fail the build if Step 7 audio_anchor coverage < threshold (default 70%). Exit code 3 = quality-gate fail (vs 1=fatal, 2=partial). Without this flag, low coverage is a SOFT warn and the build proceeds. |
| `--strict-anchor-min-pct N` | coverage percent threshold for `--strict-anchors` (default 70). Ignored without `--strict-anchors`. |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | full build success |
| 1 | fatal error (bundle failed, parser rejected, etc.) |
| 2 | render partial — some scenes failed retries; re-run to retry only the missing ones; stitch aborted |
| 3 | quality gate (`--strict-anchors` / `--strict-bullets`) — coverage/vagueness below threshold; tighten the structured script and re-run |
| 4 | asset resolution (Step 2.6) — a `[asset:]` image is missing and could not be auto-fetched (or `assets.auto_fetch` is off); run the printed `fetch_images.py` command, then re-run |
| 130 | Ctrl+C — render tree killed (Windows: `taskkill /F /T`); re-run resumes from where it stopped |

## Re-run after errors

When a validator flags an issue, see **`rule 13-rerun-after-correction.md`** —
it maps every error class to: which file to edit, which flag to use, which
command to run. Don't manually delete cache files; use the flags.

## Resume logic

If the build crashes:
- Re-run the same command — hash-based caches resume from where you stopped
- Scene mp4s whose JSON hasn't changed are skipped (mtime check)

## Prerequisites check

```bash
# Python dependencies
pip install edge-tts faster-whisper pyyaml

# Node/Remotion
cd remotion && npm install

# ffmpeg (must be on PATH)
ffmpeg -version

# claude CLI is NOT a runtime prerequisite. visual_designer.py does pure
# cache lookup; per-bullet code is authored by the active Claude Code session
# and seeded via storyboard/seed_bullet_cache.py. See rule 04.
```

## Remotion composition ID rules

IDs MUST match: `[a-zA-Z0-9-]+`
- VALID: `<project>-s01`, `ai-agents-s03`
- INVALID: `<project>_s01` (underscore), `<project> s01` (space), `Project_S01` (uppercase)

`build_video.py` enforces this:
```python
PROJECT_PREFIX = re.sub(r"[^a-z0-9]", "-", PROJECT.lower()).strip("-")
scene_ids = [f"{PROJECT_PREFIX}-s{i+1:02d}" for i in range(len(scenes))]
```

## Where outputs go

| Output | Location |
|--------|---------|
| Final video | `projects/<name>/out/<output>.mp4` |
| Scene renders | `remotion/out/<scene-id>.mp4` |
| Scene JSONs (canonical) | `projects/<name>/scenes/<scene-id>.json` — owned by the project, source of truth |
| Scene JSONs (build mirror) | `remotion/public/scenes/<scene-id>.json` — auto-synced from project on every build, purged of other projects' files |
| Caption JSONs (canonical) | `projects/<name>/captions/<scene-id>.json` — owned by the project, source of truth |
| Caption JSONs (build mirror) | `remotion/public/captions/<scene-id>.json` — auto-synced from project on every build, purged of other projects' files |
| TTS audio | `projects/<name>/audio/<filename>.mp3` |
| Design tokens | `remotion/src/universal/config_tokens.json` |
| Video timing (playback length) | `projects/<name>/build_timing.json` — `total_sec`, `total_frames`, per-scene `durationFrames` |
| Production time (how long the build took) | `projects/<name>/production_time.json` — `build_seconds`, `build_hms`, `build_per_video_ratio` (build time ÷ video length) |
| Per-scene render journal | `remotion/out/render_journal.json` — per scene: `seconds`, `attempts`, `sizeMB`, `status`, `error`; plus `scenes_retried`, `slowest_scene`, `total_render_seconds`. **This is the production record** — which scene took longest, what errored, how many attempts to get a clean render. |
| Per-scene QA record (human) | `projects/<name>/verification.md` — rule 23 frame-evidence log: vN PASS, corrections made, drift notes |

---

## Examples

### Full build — happy path

```bash
cd c:/Girish/Fundamental_Projects/video_generation/video_explainer

# First build (everything cold):
python storyboard/build_video.py projects/scripts/ai-thinking-levels.txt
# → [1/10] config loaded
# → [2/10] 7 scenes parsed
# → [3/10] 42/42 bullets resolved from cache
# → [4/10] TTS generated (full.mp3, 465s)
# → [5/10] Whisper transcribed (1842 words)
# → [6/10] 7 scene boundaries located
# → [7/10] frame ranges computed, 90% audio_anchor coverage
# → [9/10] 7 scenes rendered
# → [10/10] stitched → projects/ai-thinking-levels/out/AI Thinking Levels.mp4
```

### Single-scene fast iteration

```bash
# Tweak Scene 3 bullet code, re-render only that scene:
python storyboard/build_video.py projects/scripts/ai-thinking-levels.txt --scene 3
# → renders ai-thinking-levels-s03 only, skips stitch
# Output: remotion/out/ai-thinking-levels-s03.mp4
```

### Force redesign of one scene

```bash
# Scene 2 visuals are wrong — delete codegen cache, re-author, re-seed, re-render:
python storyboard/build_video.py projects/scripts/ai-thinking-levels.txt --scene 2 --redesign
```

### Re-generate audio (narration text changed)

```bash
python storyboard/build_video.py projects/scripts/ai-thinking-levels.txt --retts
```

---

## Guidelines

**Always:**
- Pass `projects/scripts/<name>.txt` (raw path) — never the structured_scripts path
- Check `audio_anchor coverage` in Step 7 output — below 70% means anchors are too vague
- Confirm `animation visibility = 100%` in the Step 10.5 summary before calling the build done
- Use `--scene N` for single-scene iteration — it's ~10s vs ~5min for a full build

**Never:**
- Hardcode `fps`, `width`, `height`, `voice` in config.yaml — those are pipeline constants; changing them breaks the render
- Delete cache files manually — use `--force` / `--redesign` / `--retts` flags instead
- Run `build_video.py` before seeding all bullet caches — a `CacheMissError` at Step 3 means a bullet has no cache entry
- Use `--force` as a first response to an error — the decision tree in rule 13 maps each error to the minimum-cost flag

**Reading the build log:**
- `(cached)` next to a bullet = cache hit, no LLM call needed
- `[VAGUE]` warning = bullet body is too abstract — LLM may hallucinate stats; add `--strict-bullets` to hard-fail on vague
- `scale factor > 1.15×` = TTS rate is too slow; increase `audio.rate` in config.yaml
- Exit 2 = partial render; re-run same command — resume skips completed scenes automatically
