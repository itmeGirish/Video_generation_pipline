# How This Pipeline Works — Script Generation & Video Generation

> The architecture as it IS (rewritten 2026-07-11 after the reference-grade overhaul; the old
> bullet-driven/lock-first description was removed). Benchmarks + design principles behind these
> decisions: [feedback/learning.md](../feedback/learning.md), [feedback/principles.md](../feedback/principles.md),
> [feedback/remotion_engineering.md](../feedback/remotion_engineering.md).

**The mission:** a *visual learning experience* — every scene teaches ONE concept through a persistent
world OPERATING (motion, transformation, cause→effect); narration only reinforces. The overriding metric:
**mute the audio — can a first-time viewer explain the concept from the visuals alone?**

---

## 1. The big picture — two phases, one contract

```
        PHASE 1: SCRIPT GENERATION                     PHASE 2: VIDEO GENERATION
   ┌──────────────────────────────────────┐      ┌──────────────────────────────────────┐
   │ topic                                 │      │ the RENDER CONTRACT (.json)          │
   │   ▼  32-stage Visual Story Engine     │      │   ▼ parse → author (stage+deltas)    │
   │ projects/structured_scripts/          │ ───► │     → seed → TTS/align → VISUAL      │
   │   <name>.json  = THE RENDER CONTRACT  │      │     PROOF → ONE live master render   │
   │ (scenes: stage+cast+semantics+beats)  │      │     → master gate battery            │
   └──────────────────────────────────────┘      │   ▼ projects/<name>/out/<name>.mp4   │
                                                  └──────────────────────────────────────┘
```

**The single contract** is `projects/structured_scripts/<name>.json` — the RENDER CONTRACT
(schema [docs/render-contract.schema.json](render-contract.schema.json)). Phase 1 produces it; Phase 2
executes it with zero re-interpretation ("parse for the machine, raw-JSON-direct to the codegen LLM").
Legacy `.txt` formats remain supported for hand-written/conversion scripts.

Per project: `projects/<name>/config.yaml` (design tokens, voice, output) ·
`storyboard/.cache/designs/*.json` (the per-SCENE stage code + per-bullet React, authored in-session).

**STEP 0 — scaffold (new projects):** `project-scaffold` (`python -m storyboard.project_init <name>`)
creates the project folder + pre-fills `verification.md` with the tracking record — the **Skill
Invocation Tracker** (the full pipeline checklist, ticked as each skill is invoked) + the **Bug Ledger**
— the one file `skill_coverage.py` · `bug_stats.py` · `render_gate.sh` read. Tracking is "tick as you go"
from project start, not authored later (the reason trackers were empty before).

**THE GOVERNING RULE — the unit is the SCENE, not the beat.** Every stage designs scene-first: the
scene's **STAGE** (one persistent world: the settled composite with reserved zones + the cast at their
homes) and its **RUNNING MECHANISM(s)** (`cycle` processes operating for the scene's whole span) come
first; beats are **MODULATIONS** of that stage (spotlight a station · change a rate · break an invariant
· land the payoff). Beats never re-declare the world.

---

## 2. Skill system & enforcement

Both phases are driven by skills under [.claude/skills/](../.claude/skills/): invoke each step's skill
with the Skill tool — the body is the source of truth; working from memory is how gates get skipped.
Bodies ≤500 lines (catalogs in `references/`); every skill pinned `model: opus`; **single ownership** —
each quality property has ONE owner skill, everything else references it (routing: `script_generation`
§"Property → OWNER" + CLAUDE.md BUG ROUTER).

Hooks remind; the HARD gates block:

| Gate | Type | Teeth |
|---|---|---|
| **Mechanical script floor** | HARD (stage 25) | `contract_scorecard.py` (semantics/process coverage · text budget · stage coverage · series/trace) + `composite_lint.py` (zones pairwise disjoint · corridors cross nothing · caption band) — both must exit 0 on the final contract |
| **SCRIPT-READY** | HARD (`render_gate.sh`) | blocks `build_video.py` until the Phase-1 gates pass; the evidenced line (`sync=NN wonder=N …`) is recorded WITH the verbatim `SCRIPT-SCORECARD:` + `composite_lint:` lines |
| **DIMENSION LOCK** | HARD | locked invariants (accuracy · buildable/muted · Wonder ≥8 · sync ≥70) may not be regressed by later gates; one reconciler (`feedback-optimizer`); `render_gate.sh` blocks on `wonder<8`/`sync<70` |
| **Seeder gates** | HARD (`seed_bullet_cache.py`) | PLAN gate (declare the scene's `mechanism` — or legacy live-systems), render-determinism (`Math.random`/`Date.now`… rejected), **narration-dup** (≥4-word literals duplicating narration rejected — the narration is spoken, never typeset) |
| **VISUAL-PROOF** | HARD (`render_gate.sh`) | blocks the live master render until EVERY scene has an evidenced `VISUAL-PROOF: <id> \| composition=PASS narrative=PASS transform=<Δ>%` filmstrip marker |
| **MASTER-PASS** | evidence | after the ONE master render, the full battery records `MASTER-PASS: <name> \| visual=NN/100 audio=N/10 transform=<min-Δ>%` before upload |

---

## 3. Phase 1 — the Visual Story Engine (32 stages, five layers)

Entry: the [`script_generation`](../.claude/skills/script_generation/SKILL.md) orchestrator; each stage
is its own skill, invoked in order, none skippable. The five-layer view (full per-stage tables:
[script.md](script.md)): **KNOWLEDGE** (S1–S6 + stage 1: what are we teaching) → **UNDERSTANDING**
(2–5: the viewer's mental model + the ONE metaphor world) → **VISUAL REASONING** (6–8: what the viewer
sees — scenes, the machine, the cast, the load budget) → **COMPILATION** (9–22: deterministic
translation) → **THE CONTRACT** (23–25: the executable visual IR + gates). The provenance thread through
all five is the **concept id** (cognitive model → sentence `concept_tag` → beat `semantics.concept` →
top-level `concepts` — coverage counted by `contract_scorecard.py`).

**SCRIPT PRODUCTION (S1–S7):** S1 topic GO/NO-GO → S2 research → S3 angle → S4 narrative →
S5 sentences → S6 voice → **S7 verify + LOCK — which runs AFTER stage 23**: S1–S6 produce the VERIFIED
DRAFT (`locked:false`, sentence IDs stable); the visual stages design the world; `scene-composer` may
adjust WORDING ONLY so each line confirms what the viewer just watched; then S7 TTS-times and locks the
master clock. Locking words before the world exists was the documented text-first failure.

Style laws that keep the script animatable (all decision logic, no examples):
- **THE MECHANISM IS THE SPINE** (the priority inversion): the Teaching Narrative's backbone is the
  mechanism's causal chain walked in causal order (`teaching-narrative-engine`); chapters map onto
  MECHANISM SEGMENTS (`narrative-architect`); facts/numbers ATTACH to the step they evidence — they
  never form beats or chapters. The script answers "what happens?", not "what is true?" (understanding
  is causal-chain knowledge — the IOED finding).
- **The Commentary Law** (S5 law 11): narration = commentary on a running world — world-subject +
  operational verb, present tense. Rhetorical sentences (paradox/aphorism/promise/address) ≤1 per
  chapter, riding a beat whose world already shows the point. Test: "what does the PICTURE do during
  this sentence?" — if the answer is "display the sentence," rewrite it.
- **Watchable retention devices** (S3): stake/tensions/loops/re-hook are world trajectories with a
  named carrier object — never purely verbal claims. **Hook = an event in the world** (S4).
- **Voice serves the picture** (S6): personality via word choice/rhythm inside the S5 sentence shape.
- **Render-shaped research** (S2): mechanisms as MODELS (parts · flow · repeats · limit), data `series`
  (multi-point, for every chart), the `trace` (the running example EXECUTED step-by-step — cycles replay
  real computations), `scale_anchors`, `visual_references`. Claims + scalars alone = the text-slide
  seeded at research time.

**DESIGN (1–8) — THE VISUAL REASONING LAYER** (the explanation is decided HERE, before anything
compiles: the viewer's mental model · the metaphor whose mechanics match · what persists · what the
viewer infers without narration · the visual load budget)**:** teaching narrative → cognitive model → **visual-metaphor-engine** (the ONE story-world;
objects-not-text; **NO NAKED NUMBER** — a quantity's home is an instrument) → **visual-story-engine**
(divergent pass; Wonder ≥8 gate) → **scene-planner** (scenes + pace + **THE SCENE'S MACHINE** named per
scene + interstitials posed by the world, not typeset) → **visual-world-engine** (the World Model IS the
scene's stage) → object-library (through-line state machines).

**COMPILE (9–22):** `state-graph-compiler` (typed states; a state may carry a **`process`** — steady-state
≠ static) → `event-graph-compiler` (typed events incl. **`Run`** — mandatory for per-unit/rate narration;
relationships are legal subjects) → `event-validator` (pre/post + invariants preserve/break + Run
buildability + the muted chain) → continuity/attention/camera/lighting → `motion-operator-engine` (closed
operator set incl. **`cycle`**; a style-locked verb→operator table, compiled once) → physics → tempo-sync →
audio-design → transition-designer → style → idioms.

**COMPOSE + CONTRACT (23–25):** `scene-composer` writes each scene **stage-first** (the settled
final-frame composite with every element + every mover's CORRIDOR in a reserved zone; scene-span
processes) then the pair-block beats as modulations — beats are cut at EVENT grain; `text` DEFAULTS TO
EMPTY (a beat earns a label via the deaf-viewer test on the scene composite; the label budget is
counted). → `render-contract-compiler` (the deterministic contract; see §4) → `contract-linter`
(structure + the mechanical floor + checks 3b–3h) → the SCRIPT-READY gate (12 content tests ·
fact-check · reconciliation · the evidenced line).

---

## 4. The Render Contract (what the JSON carries)

Per scene:
- **`cast`** — the typed object graph as DATA: `{id, kind: world-object|instrument|label, form, material,
  accent, home, states, owner}`; ops/labels resolve against these ids (prose describes; the cast IS).
- **`stage`** — the SCENE-DRIVEN layer: `composite` (the settled final-frame layout, corridors included),
  **`zones`** (machine-checkable fractional rects: `element|text|corridor` — the script-side overlap gate),
  `process[]` (mechanisms running the whole scene).
- **bullets** — narration sentences (roles/pauses/emphasis) + `what_happens` (human illustration) +
  **`semantics`** (AUTHORITATIVE: `transitions` · `relationships` (edge strengths) · `invariants`
  (preserve/break) · `process` · `proof` (realize + a MEASURABLE predicate)) + opt-in `text` +
  `audio_anchor`/`anchor_mode`. **`headline` is machine metadata — never rendered.**
- **`camera`** (per scene) + **`attention`** + **`transition`** (per beat) — the CINEMATIC TRACKS carried
  as data (camera-director's move/target/meaning/shot; attention-director's focus/order/dim eye-path;
  transition-designer's mode/carry boundary handoff), so the renderer EXECUTES the camera, directs the eye,
  and crosses each boundary as declared instead of improvising — the same die-in-memory cure as
  semantics/concepts; targets/carry resolve to cast ids (linter 3i), and the declared `transition.carry`
  is verified at runtime by telemetry R5 (holds its HOME) + R7 (single instance, no ghost). **This
  completes the contract-as-IR: it now carries all six things an "Intermediate Scene Graph" would
  (identity · hierarchy via owner · state machines · constraints · camera+attention · transitions),
  so a future non-React backend is a pure mapper swap — no separate ISG layer to build or maintain.**
- top-level: **`concepts`** (the provenance spine — the cognitive model's concept list; every beat's
  `semantics.concept` references one; coverage counted by the scorecard), **`numbers_ledger`**
  (`quantities` + `derived` + **`series`** + **`trace`** — instruments may only display ledger/narration
  values), `constraints` (the render rules that must travel with the content), `script_ready` (the
  evidenced gate line `render_gate.sh` greps).

Determinism rules: no runtime randomness (frame-seeded only) · frame-driven motion · resolved-not-deferred
· everything in range. The contract is the SEAM — a rule that lives only in a skill never reaches an
external renderer.

---

## 5. Phase 2 — video generation ([build_video.py](../storyboard/build_video.py))

> Full per-step skill tables + the tools reference: **[video.md](video.md)** (the Phase-2 mirror of
> [script.md](script.md)). This section is the summary.

```bash
python storyboard/build_video.py projects/structured_scripts/<name>.json    # build (JSON contract path)
```

1. Config → tokens. 2. Parse the contract. 3. **Cache-only visual lookup** — the per-scene STAGE code +
per-bullet code from `storyboard/.cache/designs/` (no LLM subprocess; a miss hard-aborts). 4. TTS
(−14 LUFS; real `<pause>` silences). 5. Whisper word timestamps. 6–7. Anchor alignment → scene JSONs
(the stage block prepended as `role:'stage'`, frames 0→end) + mirrors. 8. timelines.ts. 9.5 optional
music/sfx mix ([audio_mixer.py](../storyboard/audio_mixer.py)). 10. **ONE live master render**
([render_master.mjs](../remotion/render_master.mjs)): a plain `<Series>` of the live scene components +
the narration `<Audio>` — zero overlap, sync-safe by construction (`TransitionSeries` deliberately
rejected: it overlaps scenes AND shortens the timeline → drift). Cross-scene transition = the per-scene
opaque `Backdrop` dip (a true fade-through).

**AUTHORING (scene-driven).** Per scene: author the **STAGE once** — the persistent world + running
mechanisms, on scene-local frames — then each bullet as its **modulation/delta only**
([vg-visual-designer](../.claude/skills/vg-visual-designer/SKILL.md) §SCENE-DRIVEN). Seed via bundle:
`{"plan": {...}, "bullets": [{"scene":N,"stage":true,"code":…}, {"scene":N,"bullet":M,"anchor":…,"code":…}, …]}`.
Legacy scenes with no stage keep the old self-contained slot contract.

**The motion doctrine (serial attention).** ONE KINETIC FOCUS at a time; the beat's mechanism loop
(`cycle`: travel→process→emit, repeating) is the honest hold-alive — never decorative breathes; entrances
are quiet (10–14f fade+rise, out-cubic); expressive physics belongs to the act's ONE payoff (+1–3 coupled
reactions); **text never moves while being read**; settled elements are pixel-still.

**The density system (hierarchical).** The canvas negotiates only CONTAINERS; density lives inside them
under SLOT grammar (bespoke `mk*` interiors laid out by flex/grid, never hand fractions); visual mass =
FIELDS (one repeated unit); **TWO-TIER text** (focal = full ≥7:1 contrast + budget-counted; peripheral =
dim slotted texture, never load-bearing); void survives density (fill = container footprint;
islands-in-void is correct).

**Overlap defense (4 nested levels).** Canvas: `stage.zones` + movers' corridors, proven by
`composite_lint.py` at the script → Containers: the containment law → Slots: interior grammar → the
render-side `layout_validator` is the BACKSTOP, not the gate (it samples snapshots and skips transformed
boxes — it cannot prove trajectories). Transitions are union-windows: exit-then-enter (fade-through) or
provably disjoint; persistent elements are single instances carried by the stage.

**THE QUALITY TRIANGLE (the top-level quality model — a lens over the gates, not a new layer).** Every
visual failure belongs to one of three orthogonal domains: **COMPOSITION** (can the scene physically
exist without conflict? spatial = zones/corridors/slots/containment; temporal = object retirement +
union-window transitions) · **DENSITY** (can the viewer comfortably process it? the text/load/concept
budgets, serial attention, fields, two-tier text) · **CONSISTENCY** (does it feel like ONE film? script:
the ONE metaphor world + through-line; render: tokens, homes, one grid, the style-locked motion
language). Orthogonal by evidence: each has failed independently in production with the other two clean.
Bugs are triaged pillar-first (CLAUDE.md BUG ROUTER), and the ledger's `type` vocabulary maps to pillars
(`vg-verification-protocol` §Bug ledger).

**VERIFY: prove cheap → render once → gate the master.** Per scene, the 5-keyframe **Visual Proof**
filmstrip ([preview_bullet.py](../storyboard/preview_bullet.py) `--visual-proof`) judged on Composition ·
Narrative (muted) · Transformation (+ the contract's `semantics.proof` predicates) — the marker gates the
master render. After the one master render: the full battery (verification protocol V1–V13/A4/A5 ·
8-factor visual quality · audio · the muted editorial cut · `vg-scene-validator` semantic conformance ·
YouTube technical) → MASTER-PASS. All evidence in `projects/<name>/verification.md` (+ BUG LEDGER;
`effort/` derived via `bug_stats.py`).

**RENDERING INTELLIGENCE (runtime telemetry — the master render doubles as the verification run).**
The `RuntimeProbe` component (mounted in every scene) reads the real Chromium layout boxes of every
`[data-cast-id]`-tagged cast element at sampled scene-local frames — between layout and capture, via
Remotion's native `<Artifact>`/`onArtifact` API — at negligible cost (a DOM read vs a screenshot).
Correctness details that make the master telemetry trustworthy (all verified): the probe queries ONLY
within its own scene's `[data-scene-root]` wrapper (so in the `<Series>` master it never captures a
premounted adjacent scene's elements), samples only when its scene is on stage (`frame >= 0` — a
premounted scene's negative local frame would otherwise sample an invisible scene since `-5 % 5 === 0`),
and records EFFECTIVE opacity up the ancestor chain (a dimmed/premount wrapper reads through). It is
layout-inert (renders nothing), so proof==ship holds; unhandled `<Artifact>`s are dropped by the still/
scene renderers (optional-chaining in the renderer), so the Visual Proof gate is unaffected.
`render_master.mjs` collects the samples into `out/telemetry/`; the rules engine
(`python -m storyboard.telemetry_rules <project> [--strict]`) verifies them **against the contract**:
R1 zone occupancy · R2 corridor bounds · R3 overlap · R4 accumulation (the container budget over time) ·
R5 HOME/scale drift across scenes · R6 teleportation (motion discontinuity — displacement bounded per
elapsed frame; the 5-frame probe cadence is what makes it discriminating) · R7 duplicate-instance (the
same cast id visible twice in one sample = transition ghosting / stage double-paint — the shared-element
single-instance law, measured) — every violation tagged with cast ids (an engineering report the LLM
*repairs*, never a review it performs). Prerequisite: the
telemetry contract — authors tag cast elements (`vg-code-artifacts` §THE TELEMETRY CONTRACT, hook ⑲).
**Telemetry replay:** `python -m storyboard.telemetry_viewer <project>` → a self-contained
`out/telemetry_viewer.html` — scrub the timeline, see every cast box (id · state · opacity) as Chromium
laid it out, with the rule violations inlined per sample (the DevTools/Unity-frame-debugger pattern).
The pixel-perceptual complement stays `render_intelligence.py` (clutter/occlusion — perception, where
telemetry has no opinion). Known limit, kept honest: easing/velocity-CONTINUITY quality (minimum-jerk-
style smoothness) needs per-frame sampling — the discontinuity class is covered; curve quality stays
with the post-render motion gates.

---

## 6. The render runtime

[UniversalScene.tsx](../remotion/src/universal/UniversalScene.tsx) renders TWO layers:
- **STAGE** (`role:'stage'` block) — OUTSIDE any `<Sequence>`, on scene-local frames 0→end: the
  persistent world; mechanism cycles never reset at beat boundaries. Painted first (behind).
- **BEATS** — each bullet's exclusive `<Sequence>` window (`framesFrom→framesTo`, beat-local frame,
  `premountFor` for asset loading) rendering only its delta, on top.

[DynamicBlock.tsx](../remotion/src/universal/DynamicBlock.tsx) compiles each block's stored function body
with the runtime bindings (`React, frame, fps, width, height, durationInFrames, interpolate, spring,
Easing, AbsoluteFill, Img, D, fitText, measureText, findWord/findWordEnd, Kit, …`). All motion is
frame-driven; `findWord` maps narration words → block-relative frames for micro-sync.

DOM geometry QA ([remotion/PLAYWRIGHT_MCP_QA.md](../remotion/PLAYWRIGHT_MCP_QA.md)): real boxes from the
Studio per-scene composition; the snippet's `effOp()` MUST skip effective-opacity≈0/hidden subtrees —
premounted sequences are invisible phantoms (a verified false-positive class); the stage layer is always
visible and correctly included.

---

## 7. The cache (authored in-session, cache-only at build)

- **Bullet**: `bullet-s{N}-b{M}-{hash16}.json` — key = sha256(narration · idx/times · headline|body ·
  design tokens · global_style/description/design · compiled ops · **the bullet's raw contract JSON** ·
  prompt version). Any semantic edit re-keys the bullet.
- **Stage**: `stage-s{N}-{hash16}.json` — key = sha256(scene narration · brief · tokens · stage version);
  bullets are NOT part of the key (beats modulate the stage; they don't define it).
- Seeded via [seed_bullet_cache.py](../storyboard/seed_bullet_cache.py) (single or `--json` bundle),
  through the three seeder gates (§2). A cache miss aborts the build — no placeholders, no CLI spawns.

## 8. Design tokens

`config.yaml design:` → `config_tokens.json` → the `D` binding (colors/fonts/spacing). Bullet code uses
`D.*` + `w/h` fractions only (zero literals; `rgba()` allowed for drop shadows only). Semantic state
colors are locked video-wide; recurring elements keep their HOME and their token.

## 9. Key files

| File | Role |
|---|---|
| `projects/structured_scripts/<name>.json` | THE render contract (schema `docs/render-contract.schema.json`) |
| `.claude/skills/script_generation/scripts/` | `sentence_laws_lint.py` · `contract_scorecard.py` · `composite_lint.py` — the mechanical script floor |
| `storyboard/build_video.py` | Phase-2 orchestrator (parse→lookup→TTS→align→master) |
| `storyboard/visual_designer.py` | cache lookup (bullets + `lookup_stage`) — never spawns an LLM |
| `storyboard/seed_bullet_cache.py` | seeding + PLAN/determinism/narration-dup gates |
| `storyboard/preview_bullet.py` | the Visual Proof filmstrip (pre-render gate) |
| `remotion/src/universal/UniversalScene.tsx` | stage layer + beat slots |
| `remotion/render_master.mjs` + `MasterComposition.tsx` | the ONE live master render (`<Series>` + audio) |
| `storyboard/layout_validator.py` | render-side geometry BACKSTOP (script-side gate = composite_lint) |
| `projects/<name>/verification.md` | VISUAL-PROOF markers · MASTER-PASS · BUG LEDGER · skills-invoked track |
| `.claude/hooks/{skill_flow,authoring,render}_gate.sh` | reminders + the hard blocks |

## 10. Changelog — the reference-grade overhaul (2026-07-10/11)

The architecture above IS this overhaul; summary of what changed and where, for archaeology:

| Change | Owners touched |
|---|---|
| Scene-driven stage layer (bullets = modulations; scene-local mechanism time) | `UniversalScene.tsx` · `visual_designer` · seeder · `build_video` · schema · `vg-visual-designer` · orchestrators |
| Semantics seam (transitions/relationships/invariants/process/proof exported; `Run`/`cycle` vocabulary) | stages 9–11 · 16 · 24 · 25 · schema |
| Serial-attention doctrine (REVERSAL of "≥8 live systems/breathe everything/overshoot everywhere") | `vg-quality-animations` · `vg-code-{animations,timing,sequencing}` · PLAN gate |
| Anti-text-slide chain (headline=metadata · text-defaults-empty · no-naked-number · narration-dup seeder gate · 3g budget) | schema · `scene-composer` · `visual-metaphor-engine` · `vg-code-text` · seeder · hook ⑰ |
| Commentary-Law script style + watchable devices + hook-as-event + S7 lock after 23 | S3–S7 skills · `script_generation` |
| Render-shaped research (mechanism models · series · trace · scale anchors · visual references) | `research-engine` · schema · linter 3b |
| Script-side overlap gate (zones/corridors + `composite_lint.py`; transitions as union-windows; premount QA fix) | schema · linter 3h · `scene-composer` · `vg-code-composition` · `vg-layout-quality-gate` · runbook |
| Hierarchical density (containment · slots · fields · two-tier text · island-aware fill) | `vg-code-composition` · `vg-code-artifacts` · `vg-code-text` · `vg-quality-vchecks` |
| Mechanical verification floor (`contract_scorecard.py` + evidence lines in SCRIPT-READY) | `contract-linter` · `testing-engine` · `feedback-optimizer` |
| Review-driven hardening (2026-07-11): mechanism-spine priority inversion (narrative built ON the causal chain; facts attach as evidence) · CONCEPT PROVENANCE SPINE (`concepts` + `semantics.concept`, coverage counted) · VISUAL LOAD BUDGET (containers/scene + entries/beat, countable) · IR governance (one producer + ≥1 consumer per field) · the stage-count moratorium · `rejected_worlds` · camera-as-consequence-of-the-mechanism · five-layer framing | `teaching-narrative-engine` · `narrative-architect` · `cognitive-model-engine` · schema · `contract_scorecard.py` · `render-contract-compiler` · `script_generation` · `visual-metaphor-engine` · `camera-director` · docs |
| **⭐⭐ RENDERING INTELLIGENCE runtime (2026-07-12/13)**: `RuntimeProbe` (in-composition telemetry tap — real Chromium boxes of `[data-cast-id]` elements at sampled scene-local frames, emitted via Remotion's `<Artifact>`, layout-inert; **scene-scoped query + active-window guard + effective opacity** so the master `<Series>` telemetry is uncontaminated by premounted scenes) · `onArtifact` collection in the master render (`out/telemetry/`) · `telemetry_rules.py` (R1 zones · R2 corridors · R3 overlap · R4 accumulation · R5 HOME/scale drift · R6 teleport · R7 duplicate-instance/transition-ghost — contract conformance with cast identity; the LLM repairs, never discovers) · `telemetry_viewer.py` (DevTools-style replay HTML) · the TELEMETRY CONTRACT tagging rule + hook ⑲ · quality-triangle triage + object RETIREMENT rule. Verified: tsc clean · rules R3/R4/R7 proven · regression 198/198 | `RuntimeProbe.tsx` · `UniversalScene.tsx` · `render_master.mjs` · `storyboard/telemetry_rules.py` · `storyboard/telemetry_viewer.py` · `vg-code-artifacts` · `object-library-engine` · `vg-verification-protocol` · CLAUDE.md |

**Honest open gaps:** sound-design ASSETS (mix built, no sound files/music bed in repo) · ElevenLabs/true-SSML
voice adapter · concept-viability + thumbnail/CTR gates · headless Playwright harness · and the first
end-to-end script built under the new architecture (the proof run).
