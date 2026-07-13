# CLAUDE.md — Project Memory (auto-loaded every session)

**This is a VISUAL TEACHING pipeline, not a Remotion pipeline.** The mission: *generate a visual learning
experience where every scene teaches ONE concept through motion, transformation, and visual cause-and-effect —
narration only REINFORCES, it is not the primary explanation.* The governing hierarchy (Remotion is LAST — the
implementation engine, never where the story is invented):
`Concept → Viewer Understanding → Visual Story → Motion Story → Remotion implementation`.
**The one success metric that overrides all others:** *mute the audio — can a first-time viewer explain the
concept from the visuals alone?* If no, the script FAILED, no matter how impressive the animation
(owned at the gate by `render-validator`; the muted test). Implementation pipeline that serves it:
**script → Remotion render → master render → mp4** — per-bullet React authored in-session + seeded into cache;
cache-only lookup (never spawns the `claude` CLI).

**DIVISION OF RESPONSIBILITY (the seam — why "fix it in vg" is usually wrong).** Remotion does not *create*
visual storytelling; it *executes* it — give it a weak idea and it renders a polished weak idea. The split:
**the SCRIPT pipeline DIRECTS** (chooses the visual metaphor · what the viewer sees first · the learning
sequence · which objects transform · the attention path · that the concept is understood) — **Remotion +
Phase-2 EXECUTE** (rendering · timing · animation · camera moves · transitions · composition). So **the visual
explanation must be COMPLETE before render starts:** Phase 2 receives the Motion-Native Scene Contract
(`scene-planner`, 12 layers) which already answers *what concept · what the viewer should understand ·
what visual sequence teaches it · which objects transform · what camera language · what motion reinforces it.*
**Remotion implements the contract; it never invents** — a flat render is therefore usually a Phase-1 gap (an
underspecified contract), NOT a Phase-2 bug. Completeness is gated before handoff by `contract-linter`
+ the bridge test; conformance after render by `vg-scene-validator`.

**This file is an INDEX of which skill to invoke — not a rulebook to apply from memory.** Every step is
a skill under `.claude/skills/`. Before doing a step, INVOKE its skill with the Skill tool; the skill
body is the source of truth. "It's in my context from CLAUDE.md" is NOT "I invoked it" — that
substitution is the #1 recurring failure. "Give it now / auto / continue" does NOT waive this.

### Key paths
- Scripts: `projects/scripts/<name>.txt` (raw) → `projects/structured_scripts/<name>.txt` (canonical .txt) **OR
  `projects/structured_scripts/<name>.json` — the RENDER CONTRACT (canonical MACHINE handover from the script
  pipeline; schema `docs/render-contract.schema.json`; parse for the machine, raw-JSON-direct to the codegen LLM)**
- Config: `projects/<name>/config.yaml` · Bullet cache: `storyboard/.cache/designs/bullet-s{NN}-b{NN}-{hash16}.json`
- Scene JSONs: `projects/<name>/scenes/*.json` (mirror → `remotion/public/scenes/*.json`) · Captions: `projects/<name>/captions/*.json`
- Rendered scenes: `remotion/out/<name>-s{NN}.mp4` · Final: `projects/<name>/out/<name>.mp4`
- Verification log: `projects/<name>/verification.md` (per-scene VISUAL-PROOF + MASTER-PASS + BUG LEDGER + `Skills invoked` track) · Effort history store: `effort/<name>.json`+`.md` (derived; `bug_stats.py`)

---

## PHASE 0 — SCAFFOLD THE PROJECT → invoke `project-scaffold` first (new projects only)

Before any pipeline work on a NEW video, invoke `project-scaffold` (`python -m storyboard.project_init
<name>`): it creates `projects/<name>/` (config stub · scenes/ · captions/ · audio/ · out/) and pre-fills
`verification.md` with the TRACKING record — the **Skill Invocation Tracker** (the full Phase-1 + Phase-2
skill checklist, ticked `[x]` as each is INVOKED) and the **Bug Ledger** — the ONE file
`skill_coverage.py` · `bug_stats.py` · `render_gate.sh` read. Tracking is "tick as you go" from the start,
not "remember to author later." (Skip only when the project folder already exists.)
**TIME LOG:** log each phase's wall-clock into the project — `python -m storyboard.time_log <name> log
script-generation <s>` · the render auto-logs (production_time.json → time_log) · `time_log <name> wrap
verification -- <cmd>`. `time_log <name> report` → `time_log.md` (per-phase cost + real-time-to-produce ratio).

## PHASE 1 — WRITE THE SCRIPT → invoke `script_generation` first

Invoke each STAGE's skill in order — none skippable. The pipeline is a **compiler** (the *Visual Story
Engine*): each stage has ONE responsibility and emits a typed artifact the next consumes. Two axes run in
parallel: the *convergent* gates (is it correct?) and the *divergent* memorability check inside
`visual-story-engine` (is it memorable? — the Wonder gate).

```
SCRIPT PRODUCTION (the MASTER CLOCK — S1–S6 produce the VERIFIED DRAFT; the LOCK comes AFTER stage 23)
 S1 topic-intelligence (GO/NO-GO gate)   S2 research-engine (mechanism MODELS · series/trace · running example · boundary facts)
 S3 angle-engine (one stake · WATCHABLE devices · open loops · mid-video re-hook)   S4 narrative-architect (chapters · hook = a world EVENT · ≤30s)
 S5 script-writer (11 sentence laws incl. the COMMENTARY LAW · run scripts/sentence_laws_lint.py)   S6 personality-pass (voice serves the picture · banned-words clean)
 S7 verification-pass (runs AFTER stage 23 wording-adjust: 4 rounds + TTS-time + rubric ≥4 → locked:true = MASTER CLOCK; a 1-word change reopens S7)
   consistency artifacts: references/{voice-profile.json,banned-words.txt,sentence-laws.md,scoring-rubric.md} + scripts/sentence_laws_lint.py
DESIGN (story + world — SCENE-DRIVEN: per scene the STAGE + running MECHANISM first, beats = modulations; choreograph to the verified draft, sentence IDs stable from S5)
 1 research-engine → Knowledge Package        2 teaching-narrative-engine → Teaching Narrative
 3 cognitive-model-engine → Cognitive Model   4 visual-metaphor-engine → Visual Metaphor Library (the ONE world)
 5 visual-story-engine → Story Beats (DIVERGENT · WONDER ≥8 or NOT READY)   6 scene-planner → Scene Plan
 7 visual-world-engine → World Model (cast · hierarchy · env)   8 object-library-engine → Object Library (through-line · state machines)
COMPILE (states → events → motion)
 9 state-graph-compiler → State Graph   10 event-graph-compiler → Event Graph   11 event-validator → Validated (pre/post + buildable + muted chain)
12 object-continuity-engine → Continuity Graph (identity · morph)   13 attention-director → Attention Graph (eye path · transformation intent)
14 camera-director → Camera Track   15 lighting-director → Lighting Track   16 motion-operator-engine → Operators (closed set)   17 physics-engine → Physics
18 tempo-sync-engine → Timeline (anchor→frame)   19 audio-design-engine → Audio Track   20 transition-designer → Transition Graph
21 visual-style-engine → Style Graph (GLOBAL STYLE+tokens)   22 idiom-library-engine → Idiom Library
COMPOSE + CONTRACT
23 scene-composer → Scene Specification (STAGE composite+process FIRST, then beats as modulations + cut pass)
24 render-contract-compiler → deterministic Render Contract   25 contract-linter → VALIDATED CONTRACT = the .txt
    ── SCRIPT-READY gate (all PASS before the .txt renders): 25 contract-linter (MECHANICAL floor:
       contract_scorecard.py + composite_lint.py, both exit 0) · testing-engine (12 content tests) ·
       knowledge-validator (facts) · feedback-optimizer (reconcile + evidenced SCRIPT-READY line
       + the SCRIPT-SCORECARD/composite_lint evidence lines) ──
RENDER (Phase 2 — video_generation runs these against the pipeline scripts)
26 remotion-component-mapper   27 asset-manager   28 remotion-composer   29 render-validator (GO: sync+continuity+audio+MUTED proof)
30 remotion-renderer (one live master + mux)   31 quality-assurance-engine (SHIP: full battery + muted test on real frames)   32 feedback-optimizer (iterate)
CROSS-CUTTING (throughout): knowledge-validator · design-system-manager · documentation-engine · testing-engine ·
   debug-engine · performance-optimizer · component-library-manager · token-sync-engine · code-review-engine · deployment-engine
```

The MUTED test is the overriding metric — proven cheap at `render-validator` (29, pre-render) and on the real
video at `quality-assurance-engine` (31). Producing the `.txt` (stages 1–25) is NOT the finish line — it is the
INPUT to the SCRIPT-READY gate. See HARD RULE below.

## ⛔ HUMAN GATE 1 — the user validates the SCRIPT before Phase 2 (first human-in-the-loop)

After Phase 1 passes its gates (the evidenced `SCRIPT-READY` line), **STOP and ask the user to validate the
script** — present the narration + the per-scene visual plan and get explicit approval BEFORE Phase 2
spends render time. Never self-approve. On approval, record it in `projects/<name>/verification.md`:
`SCRIPT-APPROVED: <name> | <YYYY-MM-DD> | approved by user`. `render_gate.sh` HARD-BLOCKS `build_video.py`
until that marker exists. If the user requests changes → revise (reopens S7), do NOT write the marker.

## PHASE 2 — RENDER → invoke `video_generation` (then `vg-when-script-received` first)

```
1  CONVERT raw → canonical   vg-when-script-received · vg-source-script-format (the format) · vg-script-conversion (the converter; movie-script = its MODE B) (+ vg-script-gen-integration if from script_generation)
2  CONFIG config.yaml        vg-build-and-run · vg-pipeline-architecture (first time)
3  DECIDE the visual         vg-visual-map (TYPE 1–11; TYPE 11 = bespoke metaphor-as-world) · vg-visual-designer · vg-layout-quality-gate · vg-graphics-assets
3b COMPILE motion           vg-motion-compiler — translate the writer's STORY beats (event/change/result/sync) → the motion GRAMMAR
                             (el/op/topology/params/token). The writer NEVER authors grammar; this layer infers it (4-layer split:
                             story → visual intent → motion grammar → params). Grammar/target defined by vg-remotion-engineering §THE MOTION SYSTEM.
4  AUTHOR scene code (SCENE-DRIVEN) — the STAGE first, once per scene (persistent world + running `cycle`
                             mechanisms on scene-local frames), THEN each bullet as its modulation/delta ONLY
                             (`vg-visual-designer` §SCENE-DRIVEN): vg-render-code → vg-code-{animations,timing,sequencing,transitions,text,images,tokens,vchecks}
                             + richness: vg-code-{artifacts,composition,motion-bank,trimming} + vg-remotion-engineering (break flat-2D: 3D/Video/Lottie/depth) + the remotion skill
5  NARRATION + SOUND         vg-ssml-narration · vg-narration-alignment · vg-narration-clarity · vg-sound-design (voice engine · music+duck · sfx cues · deliberate silence — wired vs GAP)
6  SEED cache                storyboard/seed_bullet_cache.py — stage entries {"scene":N,"stage":true,"code":…} + bullet entries; gates: PLAN (mechanism) · determinism · narration-dup
6b VISUAL PROOF (cheap)      `python storyboard/preview_bullet.py <script> --scene N --visual-proof` → 5-keyframe FILMSTRIP
                             per bullet (NO TTS/Whisper/full-render). Prove the scene is cinematic on CHEAP pixels BEFORE the
                             ~260s render — 3 proofs (Composition · Narrative · Transformation), reusing existing owners
                             (vg-visual-quality §PRE-RENDER VISUAL PROOF · muted test · DDI). Mechanical: canvas-coverage +
                             transformation-Δ (FLAT = frames ~identical → FAIL). NOT motion quality (easing/stagger = post-render).
                             PASS → write `VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%` —
                             render_gate.sh HARD-BLOCKS the MASTER render (step 7) until EVERY scene has its marker. Think → PROVE → render.
   (NO per-scene render→verify→fix loop. Native Remotion does NOT render each scene to its own mp4 to verify it —
    the cheap per-scene catch is 6b Visual Proof (filmstrip from the LIVE composition, no full render); the full
    quality battery runs ONCE on the assembled master at step 8. render_scenes.mjs is now only an OPTIONAL
    debug render-to-watch, never a gate.)
6c HUMAN VISUAL CHECK        ⛔ SAMPLE-APPROVAL before the master render (the third human-in-the-loop touch).
                             Prove the SAMPLE scenes (scene 1 + scene 2), READ their filmstrips, and PRESENT both to the
                             user with an honest read (composition · muted-narrative · transformation Δ). STOP and ask
                             "how is it?" — do NOT master-render on your own judgement. USER GOOD → step 7 directly
                             (no per-scene belabouring). USER WANTS FIXES → route to the owner (flat→vg-code-animations,
                             illegible→vg-code-text), re-seed, re-prove that scene, re-present. Never self-approve. (This
                             is the cheap "watch a sample, then commit" gate — S1+S2 stand in for the film's look/motion.)
7  MASTER RENDER (LIVE)      render_master.mjs — ONE render of the LIVE per-scene COMPONENTS (makeUniversalScenePreview)
                             composed via plain `<Series>` (zero overlap → sync-safe; NOT TransitionSeries — it drifts).
                             NO per-scene mp4 stitch. Only fade is the per-scene Backdrop (`fade_frames`) · vg-scene-transitions
8  FINAL gate (ON THE MASTER) — the quality gates RUN ON THE RENDERED MASTER and catch the points (the cheap 6b proof
                             already caught the flat/composition class pre-render; THIS is the full battery on the assembled video):
                             · vg-verification-protocol (V1–V13 + AUDIO-SYNC drift + volumedetect on the REAL final)
                             · vg-visual-quality (the 8 factors from master frames/filmstrip)
                             · video-narrative-editor (watch the WHOLE video MUTED — 8 lenses: clarity·attention·hierarchy·
                               camera·SIMPLIFICATION·mute·retention·storytelling — SHIP|RE-CUT)
                             · vg-scene-validator (per-scene 12-layer Motion-Native conformance + cross-scene continuity/through-line)
                             · vg-youtube-validation · vg-video-duration  → MASTER-PASS, then upload.
                             FAIL → fix the SCENE's bullet code/DDI → re-seed → re-render the master (one master fix re-renders
                             the whole video, so 6b Visual Proof is what keeps this catch small). Then upload.
```

## ⛔ HUMAN GATE 2 — the user approves the FINAL VIDEO before upload (second human-in-the-loop)

After MASTER-PASS, **STOP and present the finished video to the user** (the `out/<name>.mp4` path) and get
explicit approval BEFORE upload/publish. Uploading is outward-facing + hard to reverse — never ship without
the user's go. On approval, record `VIDEO-APPROVED: <name> | <YYYY-MM-DD> | approved by user` in
`verification.md`. If the user requests a re-cut → route the fix to its owner (BUG ROUTER), re-render, re-gate,
re-present. (The two human gates: SCRIPT before render · VIDEO before upload — the pipeline is autonomous
BETWEEN them, never across them.)

Troubleshooting: `vg-known-bugs` (before editing `storyboard/*.py`) · `vg-pipeline-internals` (build/render fail) · `vg-rerun-after-correction` (validator flagged an error).

---

## MOTION STORY QUALITY GATES — the 12-dimension quality checklist (one owner each, NOT 12 new skills)

The quality question is **NOT "can Remotion render this?"** (Remotion is *only* the execution engine — it has
no opinion on good-explainer vs slideshow). It is: **"will this scene TEACH the concept through motion, and
can Remotion faithfully execute that design?"** These 12 dimensions are what the pipeline's gates *collectively*
prove — they validate the chain `Concept → Visual Understanding → Motion Story → Viewer Comprehension →
Remotion Execution`. **Each is OWNED by ONE existing skill** (this is a checklist/index — never build 12
parallel gate skills; that is the `human-review` duplication at 12×):

| # | Motion-Story quality dimension | PASS = | Single owner |
|---|---|---|---|
| 1 | **Visual Learning** | the visual teaches; narration only reinforces; mute test passes | `render-validator` (the VISUAL COMMUNICATION gate — *the lead gate*) |
| 2 | **Story Through Motion** | every motion explains/advances; reject decorative | `render-validator` (decorative-ratio) + `visual-metaphor-engine` (objects over text) |
| 3 | **Object World** | the scene is a living system of OBJECTS, not text | `visual-world-engine` (the CAST / object graph) |
| 4 | **Transformation** | objects change STATE A→B; cause→effect; reject "nothing changes" | `attention-director` (transformation intent) + `vg-quality-animations` SUBJECT-MOVED |
| 5 | **Camera Language** | camera carries meaning; reject locked/random | `camera-director` + `vg-remotion-engineering` |
| 6 | **Attention Guidance** | viewer always knows where/why to look; reject all-moving-at-once | `attention-director` (the eye path) + `video-narrative-editor` |
| 7 | **Motion Density** | every layer evolves; reject static / only-text-moving | `visual-world-engine` (living system) + `vg-quality-animations` MOTION DENSITY |
| 8 | **Visual Richness** | right medium (UI/diagram/chart/video/SVG/Lottie); reject all-typography | `visual-metaphor-engine` (medium choice) + `vg-remotion-engineering` (capability) |
| 9 | **Cinematic Variety** | vary entrance/camera/timing; reject template feeling | `camera-director` (no adjacent repeats) + `vg-quality-animations` ENTRANCE VARIETY |
| 10 | **Viewer Comprehension** | muted, a first-timer can answer what/why/changed/learned | `render-validator` (7 viewer Qs) + `vg-scene-validator` (layer 12) |
| 11 | **Buildability** | React/Remotion can build it; decode-safe; timing/perf feasible | `render-validator` (buildability) + `vg-remotion-engineering` |
| 12 | **Premium Motion** | object-transform/camera/reveal/cause-effect; reject flying-text/glow/particles/PPT | `visual-world-engine` (object transform) + `vg-quality-animations` (text-ratio) |

**Reading it:** these map onto the PHASE-1 gates (10, 11) + the render-side gates (`vg-quality-animations`,
`vg-scene-validator`, `video-narrative-editor`) — viewed as ONE coherent family, the *Motion-Story quality*
that the muted test (Gate 1/10) leads. They are **not** "Remotion gates" (Remotion doesn't judge) — they are
what makes a technically-correct render an actual *teaching* video. A flat output = one of these 12 went
un-proven; find the row, invoke its owner.

---

## SHIFT-LEFT — failure-mode INDEX (invoke the owner skill; don't apply from memory)

| # | Failure → the fix (one line) | Invoke for detail |
|---|---|---|
| 1 | Caption zone reserved — keep text out of bottom 12% (`top>h*0.88`); cap footers at `top:h*0.82` | `vg-code-vchecks` |
| 2 | `audio_anchor` = verbatim 2–4 words from THIS scene's narration; no decimals/units/`<pause>`-spanning | `vg-narration-alignment` |
| 3 | SCENE-DRIVEN: the STAGE (seeded per scene, `role:stage`) carries the persistent world + running mechanisms on scene-local frames; bullets render ONLY their modulation/delta on top. Legacy scenes with no stage: bullets self-contained (redraw settled priors); when in doubt `[REPLACE]` | `vg-visual-designer` §SCENE-DRIVEN + `vg-code-transitions` |
| 3b | Every visual needs a CONTEXT HEADER (title + labels + payoff) — context-free shapes fail the deaf-viewer test | `vg-visual-map` |
| 3d | REAL legible content, not gray skeleton/placeholder bars (real title + headings + sentences/code/chat) | `vg-code-artifacts` |
| 3c | NO emoji in `code` (hangs headless render) — SVG icons; BMP dingbats ✓ ✗ ★ ▶ → ↑ ↓ ⚠ are fine | `vg-code-tokens` |
| 4 | REPLACE backdrop = full `AbsoluteFill` D.bg (a `position:absolute` div leaks prior bullets) | `vg-code-transitions` |
| 5 | Zero literals — color `D.*`, sizes as `w`/`h` fractions, fps/dims via bindings (never `#hex`/`1920`/`32`) | `vg-code-tokens` |
| 6 | Animation phases fit `framesTo−framesFrom` (duration fractions, last ~0.9) — else V11 FAIL | `vg-code-timing` |
| 7 | Static >3s mid-bullet = A4 freeze → make the beat's MECHANISM run (`cycle` op, looping) — NEVER add decorative breathe/shimmer; designed holds + final-hold exempt | `vg-code-animations` |
| 8 | Primary must EXPLAIN — dense by AREA (≥`w*0.45×h*0.40`), animate the VERB, cause→effect, mute test | `vg-quality-animations` |
| 9 | Title + body text INSIDE structural elements (no empty bordered boxes) | `vg-code-text` |
| 10 | Real-image backdrops stay VISIBLE — darken overlay ≤0.6 (localized scrim if text unreadable) | `vg-code-images` |
| 11 | NO bare-text-on-black in a real-image video — every bullet photo-backed (even 1s closers) + `textShadow` | `vg-code-images` |
| 11b | Photo base-name = subject identity; each base-name ≤1 scene (grep scene JSONs); logos exempt | `vg-graphics-assets` |
| 11c | Photo is SEMANTIC-first — OPEN the file (names lie), subject must match meaning; else ask for a new asset | `vg-graphics-assets` |
| 12 | Image bullets wrap foreground in `zIndex:1` AbsoluteFill (at opacity 1.0 the stacking context drops) | `vg-code-images` |
| 13 | NO on-frame source citations — they go in the YouTube description | `vg-visual-map` |
| 14 | Don't re-declare DynamicBlock reserved bindings (`React/frame/fps/D/fade/slide/wipe/Img/Video/Audio/ThreeCanvas/…`) — rename `fadeIn`/`slideX` | `vg-code-tokens` |
| 15 | Apostrophe in a JS single-quote inside a Python r-string: write `\'` (or use a curly `'` U+2019) | `vg-render-code` |
| 16 | FRAME-DRIVEN only — never `Math.random`/`Date.now`/`new Date`/`performance.now` in bullet code (breaks render determinism: the live master + the separately-rendered Visual Proof must match). Seed jitter from `frame`. `seed_bullet_cache.py` HARD-BLOCKS it | `vg-code-tokens` |

---

## BUG ROUTER — when something is BROKEN, invoke the ONE owner (don't reload everything)

SHIFT-LEFT (above) is author-time *prevention*. This is the fix-time *mirror*: you saw a bug — route the
**symptom to its single owner skill** and load only that. This is why skills stay small + single-purpose:
a layout bug pulls in *only* `vg-layout-quality-gate`, never a 2,500-line mega-skill. Invoke the owner
(Skill tool), fix, re-render, then re-run the verify battery (`vg-verification-protocol` + `vg-visual-quality`).

**Triage by the QUALITY TRIANGLE first** — every visual failure is one of three orthogonal domains
(fixing one never fixes another): **COMPOSITION** — can the scene physically exist without conflict?
(spatial: zones/corridors/slots · temporal: accumulation/retirement/union-window transitions) ·
**DENSITY** — can the viewer comfortably process it? (text/object/motion/information load; the budgets) ·
**CONSISTENCY** — does it feel like ONE film? (script: the ONE world · render: tokens/homes/grid/motion
language). Name the pillar, then pick the owner row below; a bug that resists its owner's fix is usually
filed under the wrong pillar. (Ledger `type`→pillar mapping: `vg-verification-protocol` §Bug ledger.)

| You SEE / GET this | Invoke ONLY this owner | Then |
|---|---|---|
| Labels overlap · text on a figure/bar · off-canvas · `text_overlap>0` | `vg-layout-quality-gate` (run `layout_validator`) → `vg-code-vchecks` | move the label clear, re-run until `text_overlap:0` |
| Text in bottom 12% / caption zone | `vg-code-vchecks` | cap footers at `top:h*0.82` |
| Motion flat / frozen >3s / one-move-then-static | `vg-code-animations` (+ `vg-quality-animations` to re-score) | add layered entrance + hold-alive |
| Robotic/linear easing · dead static tail | `vg-code-timing` | ease + spring preset + phase fractions |
| Everything appears at once / no choreography | `vg-code-sequencing` | per-element stagger, lead-and-follow |
| Prior bullet bleeds through (within a scene) | `vg-code-transitions` (+ `vg-scene-transitions` for scene cuts) | full `AbsoluteFill` REPLACE backdrop |
| Over-dark dip between scenes | (scene-level, not master) | lower per-scene `Backdrop` `fade_frames` (or `0` for hard cuts); master `<Series>` adds NO fade |
| Text wraps / clips / overruns its box | `vg-code-text` | `fitText`/`measureText` |
| Stray `#hex`/px · colors drift between scenes | `vg-code-tokens` | `D.*` tokens, sizes as `w/h` fractions |
| Photo static/stocky/wrong-subject · invisible backdrop | `vg-code-images` · `vg-graphics-assets` (asset choice) | Ken-Burns motion, overlay ≤0.6, OPEN the file |
| Generic bar where the real mechanism should be | `vg-code-artifacts` | draw the actual artifact |
| Render HANGS (exit 124) | `vg-code-tokens` (emoji?) → `vg-pipeline-internals` | strip emoji glyphs; SVG icons |
| Build / render / seed CRASHES · `extract_error` | `vg-pipeline-internals` (+ `vg-known-bugs` before editing `storyboard/*.py`) | fix root, re-seed, re-render |
| Audio out of sync (drift WARN/FAIL) | `vg-narration-alignment` | fix `framesFrom` in scene JSON + mirror |
| Voice flat · no music/sfx · wrong LUFS | `vg-sound-design` (design/fix) · `vg-quality-audio` (score) | switch `engine:piper`, add silence/music/sfx; record GAPs |
| Final mp4 SILENT | (project rule: `ffmpeg volumedetect`) → `vg-pipeline-internals` | master overlays narration; re-encode |
| A validator flagged an error and you fixed code | `vg-rerun-after-correction` | error → file → cache → re-run, correctly |
| — SCRIPT SIDE — | | |
| A script quality is weak (hook/voice/generic/value…) | the **OWNER** in `script_generation` §"Property → OWNER map" | route to the one owner, not all gates |
| Visuals disconnected scene-to-scene / flatline arc | `object-library-engine` (through-line) + `visual-story-engine` (emotional arc) | |
| Wonder · sync · OR motion-native/buildable regressed after a later gate (a rewrite re-introduced flying text / a static subject / a crammed beat) | `feedback-optimizer` (the reconciler — DIMENSION LOCK) + re-run stage 29 `render-validator` | restore the locked dim, reconcile |

Rule: **one symptom → one owner.** If you're loading three skills to fix one bug, you've mis-routed — find the single owner above.

---

## HARD RULE — SCRIPT GENERATION: PASS EVERY GATE BEFORE THE SCRIPT IS "READY"

The PHASE-1 GATES (contract-linter 25 · render-validator 29 · testing-engine · knowledge-validator ·
feedback-optimizer 32) are the **Phase-1 verification layer** — the mirror of `vg-verification-protocol`.
Producing the `.txt` is NOT done — it is the INPUT to the gates. Never report "script ready" while any
gate is unrun/failing. (Real lapse `claude_code_limits` 2026-06-09: a self-made check substituted for the
real gates under "give it now" pressure.)

**Enforced (symmetric to the render side).** When `script_generation` drafts the `.txt` it writes
`<!-- SCRIPT-READY: REQUIRED -->` as the second line; `render_gate.sh` then HARD-BLOCKS `build_video.py`
for that script until the gates pass and the flag is REPLACED with an evidenced line:
`<!-- SCRIPT-READY: <name> | sync=<NN>/100 wonder=<N>/10 gates=communication,contract,quality,retention,critique -->`
(`sync=` from stage 29 `render-validator`, `wonder=` from stage 5 `visual-story-engine`).
Conversion-path scripts never carry the flag → never blocked.

### DIMENSION LOCK — stop the gates from fighting each other (creative-drift fix)
Once a dimension passes its bar it is a **locked invariant**, not a free variable a later gate may trade
away. **THREE are locked:** **Wonder ≥8** (set at stage 5 `visual-story-engine`) · **sync ≥70** (stage 29
`render-validator`) · **MOTION-NATIVE + BUILDABLE** (set across the world/object/attention stages,
verified at stage 29 `render-validator`). The drift this stops:
- *creative drift:* the retention pass in `teaching-narrative-engine` strips a `<pause>`/Wonder beat → Wonder
  drops → `feedback-optimizer` adds it back → retention re-breaks → the gates oscillate.
- *MOTION drift (the one that re-creates PPT):* `feedback-optimizer` (rebuild) or the retention pass
  **rebuilds a beat into flying text / a static subject / 8 events crammed in 2s / an undecodable asset** →
  the scene silently regresses from buildable+motion-native back to a slide, revealed only at render.

The rule:
- A later gate may **not regress a locked dimension below bar**. Retention gains pacing via
  music/sfx/silence/visual, never by flattening the arc OR by collapsing an object-transform into text.
  **Any stage that REWRITES a beat (feedback-optimizer / testing-engine) must re-run stage 29
  (`render-validator`: buildability + slide-vs-shot + muted) on that beat** — a rewrite is not
  "done" until it re-passes.
- Genuine conflicts go to the **ONE reconciler `feedback-optimizer`**, precedence **accuracy >
  buildable/motion-native > Wonder/peak > retention-pacing > polish**; it records the tradeoff.
  `feedback-optimizer` is the Wonder + motion-native lock-VERIFY.
- **Teeth:** `render_gate.sh` hard-blocks `build_video.py` if the evidenced line shows `wonder<8` or
  `sync<70`. A regressed dimension can't ship just because the flag was replaced.

---

## HARD RULE — PROVE CHEAP (per scene) → RENDER ONCE (master) → GATE THE MASTER

**⛔ Native Remotion flow: there is NO per-scene mp4 render→verify→fix loop.** The one expensive step is the
LIVE master render (all scene COMPONENTS composed via `<Series>`, one render — `render_master.mjs`). So quality
is proven in TWO places — cheap per scene BEFORE the render, then the full battery on the assembled video AFTER.
**Invoke the skills, don't work from memory.**

**(1) PER SCENE — VISUAL PROOF (cheap, BEFORE the render).** For every scene render the 5-keyframe FILMSTRIP
from the LIVE composition (`python storyboard/preview_bullet.py <script> --scene N --visual-proof` →
`preview_still.mjs`; NO TTS/Whisper/full-render). Judge the 3 proofs against the scene's DDI, routing each to
its owner (don't score from memory): **Composition** (`vg-visual-quality` factors 5–8 + `layout_validator`) ·
**Narrative** (the muted test, `render-validator`) · **Transformation** (mechanical Δ + the DDI).
PASS → record `VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%`. **`render_gate.sh`
HARD-BLOCKS the master render until EVERY scene has this marker.** FAIL → fix the bullet CODE / DDI, re-seed,
re-prove — the scene never reaches the render flat. (`render_scenes.mjs` is now only an OPTIONAL debug render.)

**Tripwire (mechanical):** before EVERY `Edit`/`Write` on bullet code / a scene JSON, and before any re-prove
or VISUAL-PROOF call, ask *"have I invoked THIS change's owning skill via the Skill tool THIS pass?"*
(motion→`vg-code-animations`, mechanism→`vg-code-artifacts`, stagger→`vg-code-sequencing`,
easing→`vg-code-timing`, text→`vg-code-text`, image→`vg-code-images`, tokens→`vg-code-tokens`). If no →
invoke first. Hand-running ffmpeg/PSNR/Δ WITHOUT invoking the skills is the SKIP, not verification.

**(2) THE WHOLE VIDEO — the FINAL gate (after the ONE live master render).** Invoke ALL skills, on the MASTER:
| # | Check | Owner | PASS bar |
|---|---|---|---|
| 1 | Audio-sync drift + NON-SILENT (volumedetect on the REAL final) | vg-verification-protocol L2 + project audio rule | −0.5..+1.5s · not −91 dB |
| 2 | A4 freeze · A5 PSNR (master filmstrip) | vg-verification-protocol L1.5 | no freeze >3s (final-hold ok) · PSNR <45dB |
| 3 | V1–V13 (master frames) | vg-verification-protocol L1 | not-black/readable+contrast/fill/prominence… |
| 4 | V9 overlap (SETTLED frame) | vg-verification-protocol L1 | `python -m storyboard.layout_validator <project>` → `text_overlap: 0` |
| 5 | V9c caption zone · rhythm/continuity/viewer-sense | vg-verification-protocol L1 | nothing in bottom 12%; evolves, reads cold |
| 6 | 8 VISUAL gates → /100 (motion factors 1–4 from the FILMSTRIP) | vg-visual-quality | every factor ≥7 (target 9) |
| 7 | AUDIO quality (voice·−14 LUFS·music+duck·sfx·silence·non-silent) | vg-quality-audio | ≥7 (or GAPs recorded, doc 06) |
| 8 | Coverage + visibility | vg-output-validation | ≥90%, 0 placeholder/error |
| 8b | Holistic editorial CUT — watch the WHOLE video MUTED (8 lenses: clarity·attention·hierarchy·camera·SIMPLIFICATION·mute·retention·storytelling) | video-narrative-editor | SHIP (not RE-CUT) |
| 8c | **SEMANTIC CONFORMANCE** — render ↔ each scene's 12-layer Motion-Native Contract (protagonist-identity·transforms-occurred·operators·camera-path·muted-communicates·not-slide·beat-advances·VIEWER-TARGETS) + cross-scene continuity | vg-scene-validator | CONFORMS — any VIOLATION blocks MASTER-PASS |
| 9 | (final mp4) T1–T12 YouTube technical | vg-youtube-validation | upload gate |
| 10 | RUNTIME TELEMETRY vs the contract — `python -m storyboard.telemetry_rules <project>` (R1 zones · R2 corridors · R3 overlap · R4 accumulation · R5 HOME drift · R6 teleport · R7 duplicate-instance/transition ghosting, from the RuntimeProbe's `out/telemetry/` samples collected during the master render); replay debugger: `python -m storyboard.telemetry_viewer <project>` → out/telemetry_viewer.html | telemetry_rules.py (mechanical) | 0 violations |
| 11 | SKILL COVERAGE — `python -m storyboard.skill_coverage <project>`: every MANDATORY skill was actually INVOKED (per-scene author floor + the final gate battery), read from the `### Skills invoked` track in `verification.md`. A skill silently skipped = flat output; this is the mechanical catch. **Record the invocation track per scene AS YOU GO** or coverage can't be verified | skill_coverage.py (mechanical) | full coverage / no MISSED |

Ledger (`verification.md`) records the per-scene `VISUAL-PROOF` lines + a **BUG LEDGER** (`attempt · bug ·
type · sev · owner-skill · fix · min · resolved`) + a `Skills invoked` track. **Effort store** unchanged:
`python -m storyboard.bug_stats --save` → `effort/<project>.json`+`.md`; aggregate → `effort/_SUMMARY.md`
(bugs by type + owner-skill + fix-min, skill invocation frequency, and **effectiveness** = invoked-but-still-
bugged → fix the SKILL). `effort/*` is DERIVED — regenerate, never hand-edit.

**MASTER-PASS is EVIDENCED.** After the final battery, record WITH fields:
`MASTER-PASS: <name> | visual=<NN>/100 audio=<N>/10 transform=<min-Δ>%`
The fields prove you ran `vg-visual-quality`, `vg-quality-audio`, and the conformance close.
**Transformation is the anti-PPT teeth**: the per-scene VISUAL-PROOF Δ (and `vg-quality-animations`
SUBJECT-MOVED on the master filmstrip — lowest subject-region SSIM(p10,p90)) must show the hero changed STATE
A→B; a near-zero Δ / SSIM ≳0.97 = a slide → BLOCKED. "Looks right from the code" is NOT evidence; only the
rendered master frames + the invoked skills are. On any FAIL → route the symptom to its ONE owner (BUG ROUTER)
→ fix the SCENE's code/DDI → re-prove (1) → re-render the master (one fix re-renders the whole video, so (1) is
what keeps the re-renders rare). (Partial preview: `MASTER_SCENES=<subset>`.)

---

## REGISTERED HOOKS (`.claude/settings.json`) — auto-inject the right checklist

| Hook | Trigger | Injects |
|---|---|---|
| `skill_flow_gate.sh` | UserPromptSubmit ("write a script" / "build the video") | the ordered skill list for that phase |
| `authoring_gate.sh` | Edit/Write on bullet code / scene JSON | the author-time set + SHIFT-LEFT |
| `render_gate.sh` | Bash with `render_master.mjs` / `build_video.py` / `preview_bullet.py` / `seed_bullet_cache.py` | the native verify reminder; HARD-BLOCKS the MASTER render until EVERY scene has a `VISUAL-PROOF` marker, and `build_video.py` on missing `SCRIPT-READY` / regressed DIMENSION-LOCK |

Hooks REMIND (UserPromptSubmit/PreToolUse inject context); the render/script gates are the only HARD blocks.

---

## OTHER PROJECT-WIDE RULES
- **No `claude` CLI subprocess** from `storyboard/`. Cache-only lookup; authored in-session, seeded via `seed_bullet_cache.py`. A cache miss hard-aborts (no placeholder).
- **Burned-in captions DISABLED** (long-form uses the separate `.srt` sidecar). Whisper timestamps are used only for `audio_anchor` → frame alignment.
- **AUDIO is half perceived quality** → invoke `vg-sound-design` (author) + `vg-quality-audio` (score). WIRED: `audio.engine: piper` (vs flat edge-tts), `loudnorm=I=-14:TP=-1.5`, real silence from `<pause>`, and the **music+sfx MIX** (`storyboard/audio_mixer.py`, build step 10·pre — ducked bed + `sfx_emitter` cues, enabled by `audio.music`/`audio.sfx`). The only gap left = **ASSETS** (sound files in `projects/<name>/assets/sfx/` + a music bed; repo ships none) → until present, `vg-quality-audio` scores music/sfx as GAPs (`docs/SOUND.md`).
- **MASTER RENDER AUDIO:** per-scene renders are SILENT; the master overlays the concatenated narration. ALWAYS `ffmpeg -i out.mp4 -af volumedetect -f null -` the final or it can ship SILENT. Final encode by QUALITY: `-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 384k -movflags +faststart` + the loudnorm.
- **LAYOUT VALIDATOR** also gates `legibility_clutter`, `sparse_canvas`, `continuity_gap` (run `python -m storyboard.layout_validator <project>`).
- **Geometry QA:** deterministic per-scene DOM checks via Playwright-MCP on the `<project>-sNN` Studio composition (NOT the master) — runbook `remotion/PLAYWRIGHT_MCP_QA.md`.
- **Highest-ROI open QA improvement:** a vision-model gate (frame + narration → density / sentence-test / clutter score) — makes the manual visual scoring deterministic.

## When in doubt
INVOKE the step's skill — don't work from memory. Routing tables: `script_generation/SKILL.md` (Phase 1) ·
`video_generation/SKILL.md` (Phase 2). Full architecture: `docs/update_documentation.md`.
