---
name: pipeline-architecture
description: End-to-end pipeline steps from raw script to final .mp4. Know this before touching any step.
metadata:
  tags: pipeline, architecture, steps, orchestration
---

# Pipeline Architecture

Entry point: `python storyboard/build_video.py projects/scripts/<name>.txt`

The build needs:
- `projects/scripts/<name>.txt` — raw script (any format, user-authored)
- `projects/structured_scripts/<name>.txt` — canonical script (single source of truth, written in Step 0.5 or hand-converted per rule 18)
- `projects/<name>/config.yaml` — design tokens, voice, output settings (built by rule 00 §2 from the structured script's comment blocks)

## Step-by-step flow

```
projects/scripts/<name>.txt
    │
    ▼
[STEP 0.5] script_converter.py  (or rule 18 hand-conversion)
    │  Strips preamble, normalizes em-dashes, removes HTML entities
    │  Stage 1: regex (fast). Stage 2: LLM fallback if regex output isn't parseable.
    │  Writes canonical output to projects/structured_scripts/<name>.txt
    │  (raw scripts in projects/scripts/ are NEVER modified — read-only input)
    │
    ▼
[STEP 1] source_parser.py
    │  Parses projects/structured_scripts/<name>.txt → SourceScript { scenes: Scene[] }
    │  Each Scene: { number, title, window_from_sec, window_to_sec, narration, animation: AnimationBullet[] }
    │  Each AnimationBullet: { time_from_sec, time_to_sec, headline, body }
    │
    ▼
[STEP 2] visual_designer.py  (calls Claude CLI via subprocess)
    │  ONE LLM call PER BULLET (not per scene) — emits a JS function body
    │  that returns React.createElement(...). DynamicBlock.tsx compiles +
    │  invokes it at render time. There is NO fixed primitive registry.
    │  Each VisualBlock: { code, audio_anchor, time_from_sec, time_to_sec, source_headline }
    │  Cached per bullet: sha256(narration + bullet idx + headline+body + design_tokens + prompt-version)
    │  Cache file: storyboard/.cache/designs/bullet-s{scene}-b{idx}-{hash16}.json
    │  Concurrency: DESIGNER_PARALLELISM env (default 2) workers.
    │  Retries: 3× normal (20/40/60s), up to 6× rate-limit (60/180/300s).
    │  FIDELITY GATE: every bullet must succeed before the scene is committed.
    │
    ▼
[STEP 3] ssml_compiler.py  (ACTIVE — see rule 05)
    │  Reads narration + animation bullet headlines → produces SSML
    │  Injects <emphasis> on hero words, <break> on em-dashes, <prosody> on punchlines
    │  Respects ### Pacing from source (rate, emphasis level)
    │
    ▼
[STEP 4] edge-tts (continuous TTS)
    │  One continuous audio file for full video: projects/<name>/audio/<filename>.mp3
    │  Cached by sha256(full SSML text)
    │
    ▼
[STEP 5] faster-whisper (word timestamps)
    │  Transcribes full audio → word-level timestamps
    │  Cached by sha256(audio file)
    │  Output: list[{ word, start_sec, end_sec }]
    │
    ▼
[STEP 6] Scene boundary detection
    │  Finds first words of each scene narration in word timestamps
    │  → scene_start_sec[] for each scene
    │
    ▼
[STEP 7] Visual block frame computation + audio_anchor coverage report
    │  Scene durations computed CUMULATIVELY:
    │    total_frames        = round(total_sec × fps)
    │    scene_start_frames  = [round(scene_start_sec × fps) for each scene]
    │    scene_duration[i]   = scene_start_frames[i+1] - scene_start_frames[i]
    │  This GUARANTEES sum(scene_durations) == total_audio_frames (no drift).
    │
    │  For each scene, for each VisualBlock:
    │    framesFrom resolved by audio_anchor lookup OR fallback time_from_sec
    │    framesTo = next block's framesFrom (no gaps, no overlaps)
    │    All seconds→frames conversions use round() (NOT int() — int truncation
    │    accumulates 1-frame drift per scene; round() drift is ±0.5 frame per
    │    scene which cancels out across the whole video).
    │
    │  Writes projects/<name>/scenes/<scene-id>.json     (CANONICAL — owned by project)
    │  Writes projects/<name>/captions/<scene-id>.json   (CANONICAL — word timestamps relative to scene)
    │  Reports % of blocks anchored vs time-fallback (warns if <70%).
    │
    ▼
[STEP 7.5] Sync project scenes/ + captions/ → remotion/public/{scenes,captions}/
    │  Mirrors projects/<name>/scenes/*.json    → remotion/public/scenes/*.json
    │  Mirrors projects/<name>/captions/*.json  → remotion/public/captions/*.json
    │  Purges files from OTHER projects in both mirrors so the bundle ships only the
    │  active project's data. The webpack bundler reads from public/ via require.context —
    │  the public folders exist solely as a build-time mirror; canonical source is the project.
    │
    ▼
[STEP 8] timelines.ts patch
    │  Injects scene entries into remotion/src/storyboard/timelines.ts
    │  IDs use hyphens: "<project>-s01" (NEVER underscores — Remotion rejects them)
    │
    ▼
[STEP 8.5] validate_pipeline.py
    │  Pre-render sanity check: scene/caption JSONs exist, IDs in timelines.ts,
    │  no legacy prefix collisions, config_tokens.json matches DesignTokens type.
    │  Hard-fails BEFORE the slow webpack bundle (1s vs 30s).
    │
    ▼
[STEP 9] Remotion render (bundle once, all scenes)
    │  node render_scenes.mjs <id1> <id2> ... <idN>
    │  Webpack bundles ONCE, then renders each scene silent → remotion/out/<sid>.mp4
    │  RESUME LOGIC: skip render if scene JSON unchanged (mtime check)
    │
    ▼
[STEP 9.5] visual_qa.py
    │  Post-render: midpoint frame brightness per scene + primitive type distribution.
    │  WARN if a scene's middle frame is black (empty render) or one type dominates >60%.
    │
    ▼
[STEP 10] ffmpeg stitch + mux
    │  (1) Re-encode each scene mp4 to a clean stream (libx264, -an, fixed fps).
    │      Quality knobs from config.yaml stitch.scene_clean_preset / scene_clean_crf.
    │  (2) Concatenate via filter_complex concat=n=N:v=1:a=0 (NOT -f concat demuxer —
    │      the demuxer copies source PTS which can drift; filter_complex re-times
    │      from frame 0).
    │  (3) Mux the full TTS mp3 onto the concat'd video. NO -shortest flag —
    │      total video frame count was computed in Step 7 to equal total audio
    │      duration exactly, so neither stream needs truncating.
    │  Quality knobs from config.yaml stitch.final_preset / final_crf / audio_bitrate.
    │  Output: projects/<name>/out/<output_name>.mp4
    │
    ▼
[STEP 10.5] validate_output.py
    │  Verify the rendered video against the structured script:
    │    narration coverage % (Whisper transcript ∩ source narration words)
    │    per-bullet midpoint visibility (each ### Animation bullet not black)
    │  Reports issues; does not block (mp4 is already produced).
```

## File locations

| File | Purpose |
|------|---------|
| `projects/scripts/<name>.txt` | RAW script (user-authored, never edited by pipeline) |
| `projects/structured_scripts/<name>.txt` | CANONICAL script (single source of truth, written in Step 0.5 / rule 18) |
| `projects/<name>/config.yaml` | Design tokens + voice config (built per rule 00 §2 from structured script's comment blocks) |
| `projects/<name>/audio/<name>.mp3` | Continuous TTS audio |
| `projects/<name>/scenes/<id>.json` | Visual blocks for each scene — **CANONICAL, owned by project** |
| `projects/<name>/captions/<id>.json` | Word timestamps for each scene — **CANONICAL, owned by project** |
| `projects/<name>/scenes/index.ts` | Auto-stubbed empty stub for the `@project-scenes` webpack alias |
| `remotion/public/scenes/<id>.json` | **Build-time mirror** of project scenes (cleared/refreshed each build, not source-of-truth) |
| `remotion/public/captions/<id>.json` | **Build-time mirror** of project captions (cleared/refreshed each build, not source-of-truth) |
| `remotion/src/universal/config_tokens.json` | Design tokens for Remotion |
| `remotion/src/storyboard/timelines.ts` | Scene durations for Remotion Root |
| `remotion/out/<id>.mp4` | Per-scene silent renders |
| `projects/<name>/out/<output>.mp4` | FINAL VIDEO |

## Cache locations

| Cache | Key | Location |
|-------|-----|----------|
| Visual codegen (per bullet) | sha256(narration + bullet idx + headline+body + design_tokens + prompt-version) | `storyboard/.cache/designs/bullet-s{scene}-b{idx}-{hash16}.json` |
| Whisper transcript | sha256(audio) | `storyboard/.cache/transcript-<hash>.json` |
| TTS audio | sha256(full SSML) | hash marker file in `projects/<name>/audio/` |

## When a step fails

- **Step 1 fails**: structured script has wrong format → check SCENE headers, Narration/Animation blocks in `projects/structured_scripts/<name>.txt`
- **Step 2 fails (rate-limit)**: Claude CLI returns exit 1 with empty stderr → designer auto-backs off (60/180/300s × 6); reduce `DESIGNER_PARALLELISM` env if it persists
- **Step 2 fails (validation)**: emitted `code` lacks `React.createElement` / `audio_anchor` not in narration → delete that bullet's cache file and rerun (rule 04)
- **Step 4 fails**: edge-tts network error → retry, or check VOICE in config.yaml
- **Step 5 fails**: faster-whisper OOM → use smaller model ("tiny" instead of "base")
- **Step 9 fails**: Remotion crash → check scene JSON `code` field; runtime errors render a red `BLOCK RUNTIME ERROR` frame instead of crashing
- **Step 10 fails**: ffmpeg concat error → check all scene files exist, check re-encode step

## Orchestrator code

`storyboard/build_video.py` runs all 10 steps sequentially.
Key modules it calls:
- `from storyboard.source_parser import parse` → Step 1
- `from storyboard.visual_designer import design_script` → Step 2
- `from storyboard.ssml_compiler import compile_narration` → Step 3
- `edge_tts.Communicate(ssml, voice).save(...)` → Step 4
- `WhisperModel("base").transcribe(...)` → Step 5
