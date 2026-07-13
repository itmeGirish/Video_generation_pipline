---
name: vg-pipeline-architecture
description: "End-to-end pipeline steps from raw script to final .mp4. Know this before touching any step. Use whenever understanding how the pipeline works, tracing a failure to a step, or any request like "pipeline steps," "how does the build work," "architecture overview," or "which step does X.""
model: opus
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
    │  Strips preamble, normalizes em-dashes, removes HTML entities — REGEX ONLY.
    │  The LLM fallback was REMOVED — no `claude` CLI subprocess is spawned anywhere.
    │  If regex normalization fails, the converter raises and the user must hand-convert
    │  per rule 18 to projects/structured_scripts/<name>.txt.
    │  (raw scripts in projects/scripts/ are NEVER modified — read-only input)
    │
    ▼
[STEP 1] source_parser.py
    │  Parses projects/structured_scripts/<name>.txt → SourceScript { scenes: Scene[] }
    │  Each Scene: { number, title, window_from_sec, window_to_sec, narration, animation: AnimationBullet[] }
    │  Each AnimationBullet: { time_from_sec, time_to_sec, headline, body }
    │
    ▼
[STEP 2] visual_designer.py  (CACHE LOOKUP ONLY — no subprocess)
    │  Per-bullet React.createElement code is authored UPSTREAM by the active
    │  Claude Code session reading projects/structured_scripts/<name>.txt directly.
    │  Authored bundles are seeded via:
    │    python storyboard/seed_bullet_cache.py <script_path> --json bundle.json
    │  This step does pure cache lookup; cache miss raises CacheMissError and aborts.
    │  Each VisualBlock: { code, audio_anchor, time_from_sec, time_to_sec, source_headline }
    │  Cache key: sha256(narration + f"{bullet_idx}|{time_from_sec}-{time_to_sec}" + f"{headline}|{body}" + design_tokens(sorted) + 'prompt-v14-per-bullet')
    │  Cache file: storyboard/.cache/designs/bullet-s{scene}-b{idx}-{hash16}.json
    │  Concurrency: DESIGNER_PARALLELISM env (default 8) — pure disk reads, no API calls.
    │  FIDELITY GATE: every bullet must be in cache; missing entries fail loud, no placeholder.
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
    │    framesTo = next block's framesFrom (no gaps, no overlaps in JSON)
    │    All seconds→frames conversions use round() (NOT int() — int truncation
    │    accumulates 1-frame drift per scene; round() drift is ±0.5 frame per
    │    scene which cancels out across the whole video).
    │  NOTE on framesTo: at RUNTIME (UniversalScene.tsx, SCENE-DRIVEN) each BEAT's
    │    <Sequence durationInFrames> = (framesTo - framesFrom) — its EXCLUSIVE slot
    │    (prior beat unmounts; beats do NOT stack). The persistent world is the
    │    separate role:'stage' block (outside any Sequence, scene-local frames).
    │    See vg-visual-designer §SCENE-DRIVEN.
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
[STEP 8.6] layout_validator.py  (rule 19 §7)
    │  For each bullet, evaluates the React.createElement code in a Node stub
    │  environment at sample post-entrance frames (45/65/85/97% of duration),
    │  walks the tree, extracts every position:'absolute' element's (x, y, w, h),
    │  and checks for OUT_OF_BOUNDS (with 80px slack, transform/low-opacity
    │  ignored) + CROSS_BULLET_OVERLAP (additive-layering aware).
    │  Reports violations; --strict-layout makes it a hard error,
    │  --skip-layout disables the step for fast iteration.
    │
    ▼
[STEP 9] Remotion render (bundle once, all scenes)  — Remotion v4.0.455+
    │  node render_scenes.mjs <id1> <id2> ... <idN>
    │  Webpack bundles ONCE, then renders each scene silent → remotion/out/<sid>.mp4
    │  RESUME LOGIC: skip render if scene JSON unchanged AND _mp4_is_healthy()
    │  BROWSER REUSE: openBrowser('chrome', { gl:'swangle' }) shared across all
    │    scenes via puppeteerInstance; recycled every 5 scenes (memory bound)
    │  HUNG-RENDER WATCHDOG: 120s without onProgress → cancelSignal fires →
    │    retry attempt; browser is recycled before retry
    │  PER-SCENE RETRY: 1 initial + 1 retry (2s backoff); failed-mp4 cleanup
    │    between attempts; partial failure → exit code 2 (vs 1=fatal)
    │  ATOMIC WRITES: <sid>.mp4.inprogress → os.replace (Ctrl+C-safe)
    │  Ctrl+C handling (parent build_video.py): subprocess.Popen +
    │    CREATE_NEW_PROCESS_GROUP + taskkill /F /T on KeyboardInterrupt
    │    (Windows tree-kill of node + every Chromium it spawned); exit 130
    │
    ▼
[STEP 9.5] visual_qa.py
    │  Post-render: midpoint frame brightness per scene.
    │  WARN if a scene's middle frame is black (empty render).
    │
    ▼
[STEP 10] Final stitch — three modes (config.yaml stitch.mode):
    │
    │  ── MODE A: remotion_master (RECOMMENDED — see rule 09 Layer 4) ──────
    │  Single Remotion render produces audio+visuals together. NO ffmpeg.
    │     subprocess: node render_master.mjs <output>
    │       env: PROJECT, MASTER_AUDIO_FILE, VIDEO_FPS/WIDTH/HEIGHT
    │     The master composition (remotion/src/MasterComposition.tsx) chains
    │     per-scene mp4s via a plain <Series> (ZERO overlap, NO master fade) +
    │     master <Audio>. Frame-accurate by construction; avoids BOTH the ffmpeg
    │     chained-xfade drift AND TransitionSeries' ~12-frame/transition overlap drift.
    │     (Only fade is the per-scene Backdrop; stitch.mode is unused by the master.)
    │     Atomic: <output>.mp4.inprogress → health-check → os.replace.
    │
    │  ── MODE B: hard_cut (default) / crossfade (legacy ffmpeg) ──────────
    │  (1) Re-encode each scene mp4 to a clean stream (libx264, -an, fixed fps).
    │      Atomic: <sid>_clean.mp4.inprogress → os.replace (rule 10 Class 8).
    │      Quality knobs from config.yaml stitch.scene_clean_preset / scene_clean_crf.
    │  (2) Concatenate via filter_complex concat=n=N:v=1:a=0 (hard_cut)
    │      OR chained xfade filters (crossfade — has known timeline-drift bug,
    │      see rule 09 Layer 4).
    │  (3) Mux the full TTS mp3 onto the concat'd video. NO -shortest flag.
    │      Atomic: <output>.mp4.inprogress → health-check → os.replace.
    │  Quality knobs from config.yaml stitch.final_preset / final_crf / audio_bitrate.
    │
    │  Output (both modes): projects/<name>/out/<output_name>.mp4
    │
    ▼
[STEP 10.5] validate_output.py
    │  Verify the rendered video against the structured script:
    │    narration coverage % (Whisper transcript ∩ source narration words)
    │    per-bullet midpoint visibility (each ### Animation bullet not black)
    │  Reports issues; does not block (mp4 is already produced).
```

## ROADMAP — the master-composition ceiling (cross-scene continuity + master camera)

**Today's architecture:** each scene is rendered to its OWN mp4, then STEP 10 chains the finished mp4s via a
plain `<Series>` (no overlap, frame-accurate — chosen to kill the xfade/TransitionSeries audio-drift bugs).
This is correct for sync, but it imposes a hard **ceiling on motion**: because scenes are independent baked
mp4s, three premium things are **architecturally impossible** in the current pipeline, no matter the skills:
1. **A protagonist that travels scene→scene** (the page moving out of S1 into S2's shredder) — you can't morph
   pixels from one finished mp4 into the next. The closest achievable is the **match-move illusion**
   (`vg-scene-transitions`): author the last frame of scene N and the first of scene N+1 at an identical
   transform so the cut is invisible. Real continuity needs a shared object timeline.
2. **A master camera that moves across scenes** (one continuous dolly through the whole video).
3. **Global controllers** (one particle engine / color engine / lighting rig owning the whole runtime).

**The unlock (a real re-architecture, not a skill edit):** render the whole video as **ONE Remotion
composition** — a master timeline where each scene is a `<Sequence>` (not a pre-baked mp4), persistent
objects (the through-line page, the camera, the particle field) live ABOVE the scene sequences and animate
across boundaries, and audio is one master track. This restores cross-scene morphs, a master camera, and
global engines — at the cost of re-solving the per-scene render isolation + the audio-sync model that the
current mp4-chain was built to guarantee. **Sequence it LAST:** the within-scene density work (the other
skills in this batch) closes ~90% of the "feels like slides" gap and is free; this re-architecture is the
expensive final 10% for true scene-to-scene continuity. Until then, treat each scene as a self-contained
shot and use match-move at the seams.

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
| Visual codegen (per bullet) | sha256(narration + f"{bullet_idx}\|{time_from_sec}-{time_to_sec}" + f"{headline}\|{body}" + design_tokens(sorted) + b"prompt-v14-per-bullet") | `storyboard/.cache/designs/bullet-s{scene}-b{idx}-{hash16}.json` |
| Whisper transcript | sha256(audio) | `storyboard/.cache/transcript-<hash>.json` |
| TTS audio | sha256(full SSML) | hash marker file in `projects/<name>/audio/` |

## When a step fails

- **Step 1 fails**: structured script has wrong format → check SCENE headers, Narration/Animation blocks in `projects/structured_scripts/<name>.txt`
- **Step 2 fails (cache miss)**: bullet not yet authored → error message names the bullet, body, and the seed command. Author the bullet here in-session, write a JSON bundle, run `seed_bullet_cache.py`, re-run the build (rule 04)
- **Step 2 fails (validation)**: cached `code` lacks `React.createElement` / `audio_anchor` not in narration → delete that bullet's cache file, re-author here, re-seed (rule 04)
- **Step 4 fails**: edge-tts network error → retry, or check VOICE in config.yaml
- **Step 5 fails**: faster-whisper OOM → use smaller model ("tiny" instead of "base")
- **Step 9 fails**: Remotion crash → check scene JSON `code` field; runtime errors render a red `BLOCK RUNTIME ERROR` frame instead of crashing
- **Step 10 fails**:
  - `remotion_master` mode → `node render_master.mjs` exit code != 0; check stdout/stderr in build log. Common causes: master audio file not in `projects/<name>/audio/`, scene mp4 missing from `remotion/out/`, master composition id mismatch (must be `<project-id-with-hyphens>-master`).
  - ffmpeg modes → ffmpeg concat/xfade error → check all scene files exist, check re-encode step.

## Orchestrator code

`storyboard/build_video.py` runs all 10 steps sequentially.
Key modules it calls:
- `from storyboard.source_parser import parse` → Step 1
- `from storyboard.visual_designer import design_script` → Step 2
- `from storyboard.ssml_compiler import compile_narration` → Step 3
- `edge_tts.Communicate(ssml, voice).save(...)` → Step 4
- `WhisperModel("base").transcribe(...)` → Step 5
