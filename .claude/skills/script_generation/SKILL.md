---
name: script_generation
description: Orchestrator + entry point for the Visual Story Engine — the full compiler-style pipeline (32 core stages + 10 cross-cutting skills) that turns a topic into a produced video. Each stage has ONE responsibility and emits a typed artifact for the next. Invoke FIRST, then invoke each stage's skill in order. Stages 1–25 produce the validated Render Contract (the canonical `projects/structured_scripts/<name>.json` — the RENDER CONTRACT, schema docs/render-contract.schema.json); stages 26–32 execute the render (also driven by the video_generation orchestrator). Output feeds the render with zero reformatting.
when_to_use: Use when the user wants to write a script / make a video. Invoke FIRST, then invoke each stage's skill in order — none skippable.
model: opus
---

# script_generation — the Visual Story Engine (32 stages + 10 cross-cutting)

The pipeline is a **compiler**: each stage has ONE responsibility and produces a typed artifact the next
stage consumes. This is not one giant prompt — it is 32 single-purpose stages, gated at validation points,
with 10 cross-cutting skills running throughout. Invoke this orchestrator first, then invoke every stage's
skill in order — **NONE skippable.**

> **THE MISSION:** a **visual learning experience** — every scene teaches ONE concept through motion,
> transformation, and visual cause-and-effect; narration only REINFORCES. Hierarchy: `Concept → Viewer
> Understanding → Visual Story → Motion Story → Remotion` (implementation LAST). **The success metric over all
> others:** *mute the audio — can a first-time viewer explain the concept from the visuals alone?* Proven at
> `render-validator` (pre-render, cheap) and `quality-assurance-engine` (post-render, on the real video).

## THE ARCHITECTURE IS COMPLETE — harden owners, never add stages (the moratorium)

The 32-stage set is a deliberate many-small-passes design (each stage ONE job over typed artifacts —
the architecture compilers converged on). The system's real cost is not stage count but the invocation
surface, so improvements go INTO existing owners and their mechanical gates — **never a new stage, skill,
or gate**. A capability gap = expand the owner that already holds that responsibility (the
expand-the-owner rule); a quality gap = make an existing gate countable. A proposal for a new stage must
first prove no existing owner can absorb it.

## MANDATORY — invoke each stage's skill (never work from memory)

Every stage is its own skill. **Before doing a stage's work, INVOKE its skill with the Skill tool.** Working
from memory is how gates get skipped. If you reach a stage without invoking its skill this session, STOP and
invoke it first.

## PHASE 0 — SCRIPT PRODUCTION (the master clock) — invoke S1→S7 FIRST

The SCRIPT is the master clock: every downstream motion event, camera move, and hold binds to a narration
sentence. **But the LOCK comes AFTER the visual world exists — not before.** S1–S6 produce the VERIFIED
DRAFT (facts checked, laws linted, voice applied — `locked: false`); the visual stages (1–23) then design
the world and seen events; `scene-composer` may adjust WORDING ONLY (never facts, numbers, structure, or
sentence count) so each line CONFIRMS what the viewer just watched; **then S7 runs its final rounds,
TTS-times, and locks.** Locking words before the world exists is the documented text-first failure: every
visual becomes an illustration of a frozen sentence, and discovery-led ("visual fires → narration
confirms") is structurally impossible. Words-serve-the-seen, then freeze.

| S | Script stage | Input → Output | Gate |
|---|---|---|---|
| S1 | **topic-intelligence** | Topic → Topic Brief | GO/NO-GO (NO-GO stops here — a success) |
| S2 | **research-engine** | Topic Brief → Knowledge Package | primary sources · running example · boundary facts |
| S3 | **angle-engine** | Knowledge Package → Angle Map | one stake · every tension released · open loop · mid-video re-hook (>8min) |
| S4 | **narrative-architect** | Angle Map → Narrative Blueprint | concrete-before-abstract (mechanical) · ≤30s hook · one goal/chapter |
| S5 | **script-writer** | Blueprint → Draft Script (sentences) | the 11 sentence laws (incl. the COMMENTARY LAW) — **run `scripts/sentence_laws_lint.py`** |
| S6 | **personality-pass** | Draft → Voiced Script | diff fact-safe · banned-words clean (`references/banned-words.txt`) |
| S7 | **verification-pass** | Voiced (+ scene-composer wording adjustments) → **LOCKED master clock** | runs AFTER stage 23 · 4 rounds + TTS-timed + rubric ≥4 → `locked:true` |

**Consistency artifacts (the mechanical floor):** `references/voice-profile.json` (spoken identity) ·
`references/banned-words.txt` · `references/sentence-laws.md` + `scripts/sentence_laws_lint.py` (runnable) ·
`references/scoring-rubric.md` (the ship bar, ≥4 avg, no 2s). Once `locked:true`, the script is IMMUTABLE — a
one-word change reopens S7 because the visual stages bind to sentence IDs + `cumulative_start_ms`.

The visual pipeline below **choreographs to the verified DRAFT** (sentence IDs are stable from S5;
`scene-composer` pairs beats to them and may adjust wording to serve the seen events); the S7 LOCK then
freezes the final text and `tempo-sync-engine` uses the locked timings. A post-lock change of even one
word reopens S7. (In the script-first flow, the script layer's `angle-engine`+`narrative-architect` own
the teaching flow/chaptering that `teaching-narrative-engine` sketched — treat that stage as their
thinking pass.)

## THE UNIT IS THE SCENE, NOT THE BEAT (scene-driven — the governing rule of every stage below)

Every stage designs **per scene, scene-first**: first the scene's **STAGE** — the one persistent world
(the settled composite with every element in a reserved zone + the cast at their homes) and the scene's
**RUNNING MECHANISM(S)** (what operates continuously for the scene's whole span — the machine the scene
exists to show) — and only THEN the beats, which are **MODULATIONS of that stage** (spotlight a station,
change a rate, break an invariant, land the payoff). A stage whose output designs beats first and
assembles a world from them re-creates the bullet-driven slideshow. Contract-side this exports as
`stage: {composite, process[]}` per scene (stages 23–25); render-side the stage renders continuously on
scene-local time and beats draw only their deltas. Beats never re-declare the world.

## The 32 core stages — invoke in this order (they consume the LOCKED script)

| # | Stage skill | Input → Output |
|---|---|---|
| 1 | **research-engine** | Topic → Knowledge Package |
| 2 | **teaching-narrative-engine** | Knowledge Package → Teaching Narrative |
| 3 | **cognitive-model-engine** | Teaching Narrative → Cognitive Model |
| 4 | **visual-metaphor-engine** | Cognitive Model → Visual Metaphor Library |
| 5 | **visual-story-engine** | Narrative + Metaphors → Story Beats (**Wonder gate <8 = NOT READY**) |
| 6 | **scene-planner** | Story Beats → Scene Plan |
| 7 | **visual-world-engine** | Scene Plan → World Model |
| 8 | **object-library-engine** | World Model → Object Library |
| 9 | **state-graph-compiler** | World Model → State Graph (typed world states) |
| 10 | **event-graph-compiler** | State Graph → Event Graph (State→Event→State) |
| 11 | **event-validator** | Event Graph → Validated Event Graph (pre/postconditions + buildable + muted chain) |
| 12 | **object-continuity-engine** | State Graph → Continuity Graph (identity · morph targets · carry-over) |
| 13 | **attention-director** | Story + Events → Attention Graph (eye path · transformation intent) |
| 14 | **camera-director** | Attention Graph → Camera Track |
| 15 | **lighting-director** | Attention Graph → Lighting Track |
| 16 | **motion-operator-engine** | Event Graph → Motion Operators (the closed, buildable verb per event) |
| 17 | **physics-engine** | Motion Operators → Physics Graph (spring/easing/weight/anticipation) |
| 18 | **tempo-sync-engine** | Script + Motion → Timeline (anchor→frame sync · pauses · cadence) |
| 19 | **audio-design-engine** | Events → Audio Track (voice · music+duck · sfx · silence · swells) |
| 20 | **transition-designer** | Continuity Graph → Transition Graph (morph · match-cut · carry-over) |
| 21 | **visual-style-engine** | World + Motion → Style Graph (GLOBAL VISUAL STYLE + tokens) |
| 22 | **idiom-library-engine** | Events → Idiom Library (concept → reusable pattern) |
| 23 | **scene-composer** | All graphs → Scene Specification (director's brief + pair-block narration/beats) |
| 24 | **render-contract-compiler** | Scene Specs → Render Contract (deterministic, fully-resolved) |
| 25 | **contract-linter** | Render Contract → **Validated Contract** (completeness · consumed-not-re-derived · format) |
| — | **↑ stages 1–25 produce the canonical `<name>.json` RENDER CONTRACT (schema docs/render-contract.schema.json). ↓ 26–32 execute the render (video_generation).** | |
| 26 | **remotion-component-mapper** | Validated Contract → Component Graph (objects→reusable React components) |
| 27 | **asset-manager** | Component Graph → Asset Manifest (resolve · decode-safe · semantic) |
| 28 | **remotion-composer** | Component Graph → Remotion Composition (Series, zero-overlap, audio overlay) |
| 29 | **render-validator** | Composition → Render Report (**GO**: sync·continuity·audio + the cheap MUTED proof per scene) |
| 30 | **remotion-renderer** | Composition → Video Frames (one live master render + audio mux + CRF encode) |
| 31 | **quality-assurance-engine** | Rendered Video → QA Report (**SHIP**: full battery + muted test on real frames) |
| 32 | **feedback-optimizer** | QA Report → Optimized Contract (fact-check · reconcile · DIMENSION LOCK · iterate) |

## The 10 cross-cutting skills — run THROUGHOUT (not at one stage)

`knowledge-validator` (fact accuracy, everywhere a claim appears) · `design-system-manager` (style consistency
across scenes) · `documentation-engine` (keep docs true) · `testing-engine` (the validation tests + gate
wiring, incl. the 12 content tests) · `debug-engine` (symptom→root→owner routing) · `performance-optimizer`
(render cost/memory/determinism) · `component-library-manager` (the reusable Kit) · `token-sync-engine`
(design↔code tokens) · `code-review-engine` (generated-code render-safety) · `deployment-engine` (package ·
YouTube checks · ship).

## The gates (evidenced hard blocks)

- **SCRIPT-READY** (after stage 25 + the content tests via `testing-engine` + facts via `knowledge-validator`):
  the `.txt` may not enter render until the flag is replaced with the evidenced line. `render_gate.sh` enforces.
- **GO** (stage 29 `render-validator`): no expensive render until sync/continuity/audio + the muted proof pass.
- **SHIP** (stage 31 `quality-assurance-engine`): no upload until the full battery passes.
Each is EVIDENCED (recorded numbers) — a bare pass is the hallucination the gate stops. **LOCKED invariants**
(re-verified by `feedback-optimizer`): accuracy · buildable/muted · Wonder ≥8 · sync ≥70.

## Property → OWNER map (a script quality is weak → route to the ONE owner)

CLAUDE.md's BUG ROUTER lands here. One weak property → ONE owner stage (invoke its skill);
never re-run all gates for one symptom.

| Weak property (the symptom) | OWNER to invoke |
|---|---|
| Hook slow / >30s to the point / dead open | `narrative-architect` (≤30s hook law) |
| No stake · tension never released · no open loops · retention risk | `angle-engine` |
| Generic angle / "seen this video before" / commodity topic | `topic-intelligence` (GO/NO-GO) + `angle-engine` |
| Thin value · no evidence · no running example · boundary facts missing | `research-engine` |
| A fact is wrong / unverifiable | `knowledge-validator` (+ `feedback-optimizer` hard gate) |
| Sentences robotic / AI-sounding / a sentence law violated | `script-writer` (re-run `scripts/sentence_laws_lint.py`) |
| Voice flat · banned words · no personality | `personality-pass` |
| Not memorable · no peak/screenshot moment · Wonder <8 | `visual-story-engine` |
| Doesn't teach visually · muted test fails · narration-dependent | `render-validator` (the gate) + `visual-metaphor-engine` (the metaphor) |
| Structure muddled · abstract-before-concrete | `narrative-architect` |
| Pacing/rhythm off · scenes same-shaped | `scene-planner` (rhythm) · `tempo-sync-engine` (sync) |
| One of the 12 content tests fails | `testing-engine` defines the test → route the fix to the stage it names |
| Gates fighting each other / a LOCKED dimension regressed | `feedback-optimizer` (the reconciler — DIMENSION LOCK) |

## Workflow

**Step 1 — preferences** `python3 .claude/skills/script_generation/scripts/script_db.py is_initialized` →
if `false`, collect + save (Tone · Audience · Hook · Sentence style · Humor · Personal stories · Length · CTA
· Niche); else load. Preferences drive the narration VOICE only; the pipeline rules control everything else.

**Step 2 — run stages 1–25** (each via its Skill), carrying each typed artifact forward in working memory.
The research block + the scene blocks land in the `.txt`; the graphs are in-memory.

**Step 3 — save** `projects/structured_scripts/<name>.json` — the RENDER CONTRACT (schema docs/render-contract.schema.json; snake_case = config `project:`; run `python storyboard/build_video.py` on it directly). On first draft
write line 2 `<!-- SCRIPT-READY: REQUIRED -->`; `feedback-optimizer` replaces it with the evidenced line
(`sync=` from render-validator's proof, `wonder=` from visual-story-engine) once the gates pass.

**Step 4 — present + approval.** Show the full script · scene count + duration · one-line anchor per scene ·
the content verdict. Ask exactly: *"Script is ready. Does this look good to you, or would you like any changes
before I render the video?"* **WAIT for explicit approval.** If the user edits it → run `contract-linter` only
(format), fix only pipeline-breaking errors with permission. If new direction → apply + re-run the affected
gates. **The user's script is the user's script** — never rewrite their content unasked.

**Step 5 — render (stages 26–32)** → hand off to `video_generation` (which orchestrates the render-side
stages against the real pipeline scripts). Save the DB record after approval.

## Boundary
**Produces:** the validated, parser-ready `.txt` (stages 1–25). **Render (26–32)** is executed by
`video_generation` + the render scripts. References while composing: `references/` (script format, storytelling,
explainer animation principles).
