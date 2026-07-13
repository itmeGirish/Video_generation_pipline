# Video Generation — the full flow, every skill, and its tools

The Phase-2 reference: how the validated RENDER CONTRACT (`projects/structured_scripts/<name>.json`)
becomes the finished mp4. Each step is a SKILL under [.claude/skills/](../.claude/skills/) — invoke it with
the Skill tool before doing that step; the skill body is the source of truth. Entry point:
**`video_generation`** (the orchestrator); when a script just arrived, **`vg-when-script-received`** first.
Phase-1 (how the contract is produced): [script.md](script.md). Whole-system architecture +
schema: [update_documentation.md](update_documentation.md), [render-contract.schema.json](render-contract.schema.json).

**Governing rules (owners in parentheses):**
- **The contract is the SEAM** — Phase 2 EXECUTES the contract, it never invents. A flat/weak render is a
  Phase-1 gap (an underspecified contract), not a Phase-2 bug (CLAUDE.md §DIVISION OF RESPONSIBILITY).
- **Scene-driven** — author the STAGE once per scene (persistent world + running mechanisms, scene-local
  frames), then each bullet as its modulation/delta ONLY (`vg-visual-designer` §SCENE-DRIVEN).
- **Cache-only, in-session** — the codegen is authored by THIS session and seeded; `build_video.py` does a
  pure cache lookup and never spawns the `claude` CLI (a miss hard-aborts, no placeholders).
- **Prove cheap → render once → gate the master** — the ONE expensive step is the live master render; the
  per-scene catch is the cheap Visual Proof filmstrip, and the full battery runs on the assembled master.
- **The runtime measures; the rules judge; the LLM only fixes** — Rendering Intelligence (telemetry) turns
  "does it look right?" into "did the render execute the contract?" (deterministic, cast-identified).

---

## 1. The flow — every step, every skill

### STEP 1 — CONVERT raw → canonical (only for non-pipeline scripts)
| Skill | Role |
|---|---|
| `vg-when-script-received` | START HERE — routes the input; decides convert vs already-canonical |
| `vg-source-script-format` | the canonical format spec (the JSON RENDER CONTRACT; `.txt` legacy) |
| `vg-script-conversion` | the converter (raw/movie-script → canonical) — MODE B = movie script |
| `vg-script-gen-integration` | when the contract came from `script_generation` (already canonical → skip conversion) |

### STEP 2 — CONFIG
| Skill | Role |
|---|---|
| `vg-build-and-run` | `projects/<name>/config.yaml` (design tokens · voice · output) + how to run the build |
| `vg-pipeline-architecture` | first-time orientation — the two-phase pipeline + file layout |

### STEP 3 — DECIDE THE VISUAL
| Skill | Role |
|---|---|
| `vg-visual-map` | pick the visual TYPE (1–11; TYPE 11 = bespoke metaphor-as-world) — what PROVES the point |
| `vg-visual-designer` | per-bullet authoring contract + the scene-driven layering (STAGE vs beats) + cache lookup |
| `vg-layout-quality-gate` | the overlap/layout discipline (zones/containers/slots) + `layout_validator` (render backstop) |
| `vg-graphics-assets` | any logo/screenshot/photo — semantic-first, real interface, base-name discipline |

### STEP 3b — COMPILE THE MOTION GRAMMAR
| Skill | Role |
|---|---|
| `vg-motion-compiler` | translate the writer's STORY beats → the motion GRAMMAR (el·op·topology·params·token · sync·cue·choreo) + the SHOT-SHEET IR. The writer never authors grammar; the codegen builds React from it |

### STEP 4 — AUTHOR THE CODE (scene-driven; invoke BEFORE writing code)
Author the **STAGE first** (once per scene — the persistent world + running `cycle` mechanisms on
scene-local frames), then each bullet as its **modulation/delta only**.
| Group | Skills |
|---|---|
| index | `vg-render-code` (the golden authoring order; reads the compiled grammar) |
| the 8 factors | `vg-code-animations` · `vg-code-timing` · `vg-code-sequencing` · `vg-code-transitions` · `vg-code-text` · `vg-code-images` · `vg-code-tokens` · `vg-code-vchecks` |
| richness | `vg-code-artifacts` (draw the REAL mechanism + THE TELEMETRY CONTRACT tagging) · `vg-code-composition` (zones · containment · fields · depth) · `vg-code-motion-bank` · `vg-code-trimming` |
| break flat-2D | `vg-remotion-engineering` (3D/Video/Lottie/depth — the capability registry) + the `remotion` skill (canonical rules) |
Doctrine enforced here: SERIAL ATTENTION (one kinetic focus) · the mechanism loop is the hold-alive ·
quiet entrances · text never moves while read · two-tier text · containment/fields · `headline` never
rendered · every cast element tagged `data-cast-id`/`data-state` (Rendering Intelligence). **Build the
carried CINEMATIC TRACKS as data, don't improvise:** the scene's `camera: {move, target, meaning, shot}`,
each beat's `attention: {focus, order, dim}`, and each beat's `transition: {mode, carry}` are contract
fields (camera-director / attention-director / transition-designer) — execute the camera move on its
`target`, brighten the `focus` + dim the rest, and cross the boundary in the declared `mode` carrying
`carry` as ONE instance (telemetry R5/R7 verify the carry holds its home + isn't ghosted).

### STEP 5 — NARRATION + SOUND
| Skill | Role |
|---|---|
| `vg-ssml-narration` | SSML compile (pauses/emphasis → real silence) |
| `vg-narration-alignment` | `audio_anchor` → Whisper word → `framesFrom` (sync) |
| `vg-narration-clarity` | pronunciation / clarity fixes |
| `vg-sound-design` | the AUDIO LAYER — voice engine · music+duck · sfx cues · deliberate silence (wired vs GAP) |

### STEP 6 — SEED THE CACHE
`python storyboard/seed_bullet_cache.py <contract> --json <bundle.json>` — bundle entries are stage
(`{"scene":N,"stage":true,"code":…}`) + bullet (`{"scene":N,"bullet":M,"anchor":…,"code":…}`). Seeder
gates (HARD): PLAN (declare the scene's `mechanism`) · render-determinism (no `Math.random`/`Date.now`) ·
narration-dup (≥4-word literals duplicating narration rejected — the narration is spoken, never typeset).

### STEP 6b — VISUAL PROOF (cheap, per scene, BEFORE the render — mandatory)
`python storyboard/preview_bullet.py <contract> --scene N --visual-proof` → a 5-keyframe FILMSTRIP from the
LIVE composition (no TTS/Whisper/full render). Judge 3 proofs vs the scene's DDI: **Composition**
(`vg-visual-quality` 5–8 + `layout_validator`) · **Narrative** (the muted test, `render-validator`) ·
**Transformation** (mechanical Δ + the contract's `semantics.proof` predicates). PASS → record
`VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%`. `render_gate.sh` HARD-BLOCKS
the master render until EVERY scene has its marker.

### STEP 7 — MASTER RENDER (the ONE expensive step)
`render_master.mjs` — ONE Remotion render of the LIVE per-scene COMPONENTS composed via plain `<Series>`
(zero overlap → sync-safe; `TransitionSeries` rejected — it overlaps + shortens → drift) + the
concatenated narration `<Audio>`. NO per-scene mp4 stitch; the only fade is the per-scene `Backdrop` dip
(a true fade-through). `render_scenes.mjs` is an OPTIONAL debug render-to-watch, never a gate.

**MONITOR the render — don't launch-and-wait-blind (a hung render wastes a lot of time).** Run it in the
BACKGROUND and watch its progress: `render_master.mjs` prints live `NN% rendered=N encoded=N` + `✓ master
rendered` + `✓ telemetry N` (or `Error`/`TimeoutError`). A real hang is bounded — the mjs frame-watchdog
cancels on 120s of no FRAME progress and the per-frame timeout is `RENDER_TIMEOUT_MS` (default 120000) —
so if `rendered=` hasn't advanced for ≳130s the watchdog is about to fire → check `out/render_journal.json`
+ recent chrome, don't keep waiting. Note: `build_video.py` CAPTURES the mjs stdout (its log goes SILENT
during a working render) — monitor `render_journal.json` in that case. Never log-stall-KILL a working
render (the build log's silence is normal); investigate, kill only on a real deadline/error.

### STEP 8 — FINAL GATE on the RENDERED MASTER (invoke ALL)
| Skill / tool | Checks |
|---|---|
| `vg-verification-protocol` | V1–V13 · A4 freeze/A5 PSNR · AUDIO-SYNC drift · volumedetect (non-silent) on the REAL final |
| `vg-visual-quality` → 8 gates | `vg-quality-animations` · `-timing` · `-sequencing` · `-transitions` · `-text-fit` · `-images` · `-tokens` · `-vchecks` (motion factors from the filmstrip) |
| `vg-quality-audio` | voice · −14 LUFS/TP<−1 · music+duck · sfx · silence · non-silent (GAPs recorded) |
| `vg-output-validation` | every word + bullet present; coverage ≥90%; 0 placeholder/error |
| `video-narrative-editor` | holistic editorial CUT — watch the WHOLE video MUTED (8 lenses) → SHIP \| RE-CUT |
| `vg-scene-validator` | SEMANTIC CONFORMANCE — render vs each scene's 12-layer Motion-Native Contract + cross-scene continuity — any VIOLATION blocks MASTER-PASS |
| `telemetry_rules.py` | RUNTIME TELEMETRY vs the contract — R1 zones · R2 corridors · R3 overlap · R4 accumulation · R5 HOME/scale drift · R6 teleport · R7 duplicate-instance (Rendering Intelligence) |
| `vg-youtube-validation` · `vg-video-duration` | T1–T12 technical · duration — the upload gate |
| `skill_coverage.py` | SKILL COVERAGE — every MANDATORY skill was actually INVOKED (per-scene author floor + the final battery), from the `### Skills invoked` track in `verification.md`; a silently-skipped skill = flat output |
PASS → record `MASTER-PASS: <name> | visual=<NN>/100 audio=<N>/10 transform=<min-Δ>%` + the
`SKILL-COVERAGE:` line. **Record the `### Skills invoked` block per scene AS YOU GO** — coverage can't be
verified from an empty track.
FAIL → BUG ROUTER (triage by the quality triangle: Composition · Density · Consistency) → ONE symptom →
ONE owner → fix the scene's code/DDI → re-seed → re-prove (6b) → re-render the master
(`vg-rerun-after-correction`).

---

## 2. The build pipeline ([build_video.py](../storyboard/build_video.py))

```bash
python storyboard/build_video.py projects/structured_scripts/<name>.json
```
1. Config → tokens. 2. Parse the contract ([source_parser.py](../storyboard/source_parser.py)).
3. **Cache-only visual lookup** ([visual_designer.py](../storyboard/visual_designer.py)) — the per-scene
STAGE code (`lookup_stage`) + per-bullet code; no LLM, a miss hard-aborts. 4. TTS (−14 LUFS; real
`<pause>` silences). 5. Whisper word timestamps. 6–7. Anchor alignment → scene JSONs (the stage block
prepended as `role:'stage'`, frames 0→end) + mirror to `remotion/public/scenes/`. 8. `timelines.ts`.
9.5 optional music/sfx mix ([audio_mixer.py](../storyboard/audio_mixer.py)). 10. **ONE live master
render** (`render_master.mjs`), which also collects RuntimeProbe telemetry into `out/telemetry/`.

---

## 3. The render runtime

[UniversalScene.tsx](../remotion/src/universal/UniversalScene.tsx) renders TWO layers: the **STAGE**
(`role:'stage'` block, OUTSIDE any `<Sequence>`, scene-local frames — mechanism cycles never reset at beat
boundaries) + the **BEATS** (each bullet's exclusive `<Sequence>`, rendering only its delta, on top).
[DynamicBlock.tsx](../remotion/src/universal/DynamicBlock.tsx) compiles each block's stored function body
with the runtime bindings (`React, frame, fps, interpolate, spring, Easing, AbsoluteFill, D, fitText,
findWord, Kit, …`); all motion is frame-driven. [RuntimeProbe.tsx](../remotion/src/universal/RuntimeProbe.tsx)
is the telemetry tap (scene-scoped `[data-cast-id]` boxes, layout-inert). The master is assembled by
[render_master.mjs](../remotion/render_master.mjs) + `MasterComposition.tsx` (`<Series>` + audio).

---

## 4. The tools

| Tool | Role |
|---|---|
| `storyboard/build_video.py` | the Phase-2 orchestrator (parse → lookup → TTS → align → master) |
| `storyboard/visual_designer.py` | cache lookup (bullets + `lookup_stage`) — never spawns an LLM |
| `storyboard/seed_bullet_cache.py` | seeding + PLAN/determinism/narration-dup gates (stage + bullet entries) |
| `storyboard/preview_bullet.py` | the Visual Proof filmstrip (the pre-render gate) |
| `storyboard/layout_validator.py` | render-side geometry BACKSTOP (script-side gate = `composite_lint.py`) |
| `storyboard/telemetry_rules.py` | Rendering Intelligence — runtime telemetry vs the contract (R1–R7) |
| `storyboard/telemetry_viewer.py` | telemetry REPLAY → `out/telemetry_viewer.html` (DevTools-style inspector) |
| `storyboard/render_intelligence.py` | the PIXEL-perceptual complement (clutter/occlusion — perception) |
| `storyboard/audio_mixer.py` · `sfx_emitter.py` | the music+sfx mix + cue emitter |
| `storyboard/bug_stats.py` | the effort/bug analytics (BUG LEDGER → `effort/`; invoked-but-still-bugged) |
| `storyboard/skill_coverage.py` | SKILL COVERAGE — was any MANDATORY skill MISSED? (invoked track vs the non-skippable floor) |
| `storyboard/project_init.py` | STEP 0 scaffold (`project-scaffold` skill) — folder structure + pre-filled `verification.md` tracking record (Skill Invocation Tracker + Bug Ledger) |
| `storyboard/time_log.py` | per-project PHASE TIME LOG (`time_log.md`/`.json`) — wall-clock for script-generation · video-generation (auto from production_time.json) · verification, + real-time-to-produce ratio |
| `remotion/render_master.mjs` + `MasterComposition.tsx` | the ONE live master render + `onArtifact` telemetry |
| `remotion/preview_still.mjs` · `render_scenes.mjs` | the still renderer (Visual Proof) · the optional debug scene renderer |
| `remotion/PLAYWRIGHT_MCP_QA.md` | interactive per-scene DOM geometry QA runbook |

---

## 5. The gate chain (what blocks what)

| Gate | Runs | Blocks |
|---|---|---|
| Seeder gates | seed time | a bad bundle can't be cached (plan/determinism/narration-dup) |
| VISUAL-PROOF markers | before the master | `render_gate.sh` HARD-BLOCKS `render_master.mjs` until EVERY scene has its marker |
| SCRIPT-READY (from Phase 1) | before the build | `render_gate.sh` blocks `build_video.py` without the evidenced line (or on `wonder<8`/`sync<70`) |
| MASTER-PASS | after the master | the full battery + telemetry (0 violations) → the evidenced line; then upload |

**Ledger.** `projects/<name>/verification.md` records the per-scene `VISUAL-PROOF` lines + the BUG LEDGER
(attempt · bug · type→pillar · owner-skill · fix · min · resolved) + the `Skills invoked` track; the
effort store is derived (`python -m storyboard.bug_stats --save` → `effort/<name>.json`+`.md`).
