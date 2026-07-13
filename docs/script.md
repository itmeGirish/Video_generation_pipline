# Script Generation — the full flow, every skill, and the scripts

The Phase-1 reference: how a topic becomes the validated RENDER CONTRACT
(`projects/structured_scripts/<name>.json`, schema [render-contract.schema.json](render-contract.schema.json)).
Each step below is a SKILL under [.claude/skills/](../.claude/skills/) — invoke it with the Skill tool
before doing that step's work; the skill body is the source of truth. Entry point: **`script_generation`**
(the orchestrator), invoked FIRST. Whole-system architecture: [update_documentation.md](update_documentation.md).

**Governing rules (owners in parentheses):**
- **Scene-driven** — per scene: the STAGE (persistent world + running mechanism) first; beats are
  MODULATIONS, never re-declarations (`script_generation` §THE UNIT IS THE SCENE).
- **THE MECHANISM IS THE SPINE** — the narrative's backbone is the mechanism's causal chain, walked in
  causal order; facts/numbers ATTACH to the step they evidence, never form beats or chapters of their own
  (`teaching-narrative-engine` · `narrative-architect`). Understanding is causal-chain knowledge — the
  script answers "what happens?", not "what is true?".
- **Commentary Law** — narration is commentary on a running world; rhetorical sentences ≤1/chapter
  (`script-writer` law 11).
- **No text-rich output** — `headline` = machine metadata (never rendered); `text` defaults EMPTY and is
  budget-counted; a quantity's home is an INSTRUMENT (`scene-composer` · `visual-metaphor-engine` · linter 3g).
- **Render-shaped research** — mechanism MODELS, a `series` for every chart, a `trace` for every
  mechanism (`research-engine`).
- **The moratorium** — the 32-stage set is complete; improvements harden existing owners/gates, never add
  stages (`script_generation`).

---

## 1. The flow — every stage, every skill

**The five-layer view (the mental model; the stages below implement it):**
```
Topic → KNOWLEDGE (S1–S6 · stage 1)      what are we teaching? facts · mechanisms · story
     → UNDERSTANDING (2–5)               what happens in the viewer's head? mental model · metaphor world
     → VISUAL REASONING (6–8)            what does the viewer SEE? scenes · machine · cast · load budget
     → COMPILATION (9–22)                deterministic translation: states → events → operators → timeline
     → THE CONTRACT (23–25)              the executable visual IR + its mechanical gates
```
The provenance thread through all five: **concept ids** (cognitive model → S5 `concept_tag` → beat
`semantics.concept` → the contract's top-level `concepts` — coverage counted by the scorecard).

### LAYER 1 — KNOWLEDGE + NARRATIVE · PHASE 0 SCRIPT PRODUCTION (S1–S7): the master clock

S1–S6 produce the **VERIFIED DRAFT** (`locked:false`, sentence IDs stable from S5). The visual stages
design the world to it; `scene-composer` (23) may adjust WORDING ONLY; **then S7 locks** — words serve
the seen, then freeze. A post-lock one-word change reopens S7.

| S | Skill | Output | Gate / law |
|---|---|---|---|
| S1 | `topic-intelligence` | Topic Brief | GO/NO-GO (a NO-GO is a success) |
| S2 | `research-engine` | Knowledge Package | primary sources · **mechanism MODELS** (parts/flow/repeats/limit) · `numbers_ledger` (+ **series** · **trace** · scale_anchors · visual_references) · running example · misconceptions · surprise bank · boundary facts |
| S3 | `angle-engine` | Angle Map | ONE central question · concrete stake · tensions each with a release · open loops · mid-video re-hook (>8 min) — **every device WATCHABLE** (a world trajectory with a named carrier object) |
| S4 | `narrative-architect` | Narrative Blueprint | ≤30s hook — **an EVENT in the world, not a spoken claim** · concrete-before-abstract (mechanical) · one goal/chapter · **chapters map onto MECHANISM SEGMENTS** (a stretch of the causal chain + the misconception it repairs; a chapter with no mechanism step under it = fact-recital → restructure/cut) · proof beat + interrupt + reanchor per chapter · the one-sentence takeaway |
| S5 | `script-writer` | Draft Script (sentence objects) | the **11 sentence laws** incl. law 11 the COMMENTARY LAW → run `sentence_laws_lint.py` |
| S6 | `personality-pass` | Voiced Script | voice within the S5 sentence shape (never operational → punchline) · diff fact-safe · banned-words clean |
| S7 | `verification-pass` | **LOCKED master clock** | **runs AFTER stage 23**: 4 verification rounds · TTS-timed · tagged · rubric ≥4 → `locked:true` |

Consistency artifacts: `references/voice-profile.json` · `references/banned-words.txt` ·
`references/sentence-laws.md` · `references/scoring-rubric.md`.

### LAYERS 2–3 — UNDERSTANDING (stages 2–5) + VISUAL REASONING (stages 6–8): the explanation is DECIDED here

| # | Skill | Output | Decides |
|---|---|---|---|
| 1 | `research-engine` | Knowledge Package | (same artifact as S2 — the quantified, mechanism-shaped world) |
| 2 | `teaching-narrative-engine` | Teaching Narrative | **THE MECHANISM IS THE SPINE** — the narrative backbone is the mechanism's causal chain in causal order; facts ATTACH to the step they evidence (a "which step is this?" = "none" beat is recital → attach or cut) · BUT/THEREFORE boundaries, never "and then" |
| 3 | `cognitive-model-engine` | Cognitive Model | **what mental model the viewer builds** + which misconception each beat corrects · **concepts get stable ids that EXPORT** (the provenance spine: same ids as S5 `concept_tag`, beat `semantics.concept`, the contract's top-level `concepts` — coverage counted at 25) |
| 4 | `visual-metaphor-engine` | Visual Metaphor Library | **the ONE story-world whose MECHANICS match the concept**; every abstract noun cast as a physical OBJECT (subject is never text); **NO NAKED NUMBER** — quantities live on instruments; one metaphor per concept, immutable · **`rejected_worlds` REQUIRED** (the alternatives considered and why each lost) |
| 5 | `visual-story-engine` | Story Beats | the DIVERGENT pass — peaks, through-line, emotional arc, bespoke hero scene · **Wonder ≥8 or NOT READY** |
| 6 | `scene-planner` | Scene Plan | scenes + arc + open-loop chain · purpose + pace (varied) · **THE SCENE'S MACHINE** (the persistent world + what runs continuously) · **THE VISUAL LOAD BUDGET** (one new concept/beat · a handful of containers · entries budgeted) · interstitials posed by the WORLD (title-class words only) |
| 7 | `visual-world-engine` | World Model | the CAST (hero + props, forms/materials/homes) · hierarchy · environment — **the World Model IS the scene's STAGE** |
| 8 | `object-library-engine` | Object Library | which objects PERSIST across scenes + each one's state machine (the through-line) |

### LAYER 4 — COMPILATION (stages 9–22): states → events → motion (creative decisions stop; translation begins)

| # | Skill | Output | Key rule |
|---|---|---|---|
| 9 | `state-graph-compiler` | State Graph | typed world states per beat; a state may carry **`process`** (a running mechanism is a steady state, not "no event") — diffs EXPORT as `semantics.transitions` |
| 10 | `event-graph-compiler` | Event Graph | typed events; kinds incl. **`Run`** (mandatory for per-unit/rate narration); **relationships are legal subjects** (edge strengths) |
| 11 | `event-validator` | Validated Event Graph | pre/postconditions · lifecycle adjacency · **invariants preserve/break** · WORLD-OBJECT floor · `Run` buildability · the muted chain |
| 12 | `object-continuity-engine` | Continuity Graph | cross-scene identity · morph targets · home = identity |
| 13 | `attention-director` | Attention Graph | the eye path (one focus at a time) + transformation intent |
| 14 | `camera-director` | Camera Track | camera carries meaning; no adjacent repeats · **the camera is a CONSEQUENCE OF THE MECHANISM** — its default path follows the process's causal chain, station to station |
| 15 | `lighting-director` | Lighting Track | light as attention + mood |
| 16 | `motion-operator-engine` | Motion Operators | the CLOSED buildable verb set incl. **`cycle`** (the mechanism loop) — a **style-locked table**, compiled once, never re-chosen |
| 17 | `physics-engine` | Physics Graph | springs/easing/weight — quiet entrances; expressive physics = the act's payoff only |
| 18 | `tempo-sync-engine` | Timeline | anchor→frame sync · pauses · cadence (binds to locked sentence timings) |
| 19 | `audio-design-engine` | Audio Track | voice · music+duck · sfx cues · designed silence · honest GAPs |
| 20 | `transition-designer` | Transition Graph | per-boundary handoff: fade-through (exit-then-enter) · disjoint · persistent-single-instance — transitions are UNION-WINDOWS |
| 21 | `visual-style-engine` | Style Graph | GLOBAL VISUAL STYLE + tokens · ONE grid · semantic color constancy |
| 22 | `idiom-library-engine` | Idiom Library | concept → reusable pattern (same-object-two-states, etc.) |

### LAYER 5 — THE CONTRACT (stages 23–25): compose + compile + validate the executable visual IR

| # | Skill | Output | Key rule |
|---|---|---|---|
| 23 | `scene-composer` | Scene Specification | **STAGE FIRST**: the settled final-frame composite (every element + every mover's CORRIDOR in a reserved zone) + scene-span processes → THEN beats as MODULATIONS, cut at EVENT grain · `text` defaults EMPTY (earned via the deaf-viewer test) · the visual glossary (term follows object) · the cut pass (−≥10%) — then **S7 locks** |
| 24 | `render-contract-compiler` | Render Contract | the deterministic JSON: cast · `stage{composite, zones, process}` · per-beat `semantics{transitions, relationships, invariants, process, proof}` · `numbers_ledger{quantities, derived, series, trace}` · constraints · **IR governance: one producer + ≥1 consumer per field** |
| 25 | `contract-linter` | **VALIDATED CONTRACT** | the MECHANICAL FLOOR first (`contract_scorecard.py` + `composite_lint.py`, both exit 0) + checks 1–5 and 3b–3h (ledger numbers · connectors · referent gate · renderable cast · semantics · text budget · stage · corridors) |

### The SCRIPT-READY gate (after 25 — producing the .json is the INPUT, not the finish)

`testing-engine` (the 12 content tests, judged as a viewer) · `knowledge-validator` (every claim traced
to a source — accuracy is above everything) · `render-validator` script-side (sync score, muted proof
plan) · `feedback-optimizer` (fact-check HARD gate · patch-or-rebuild · **DIMENSION LOCK** reconciliation
· writes the evidenced line):

```
<!-- SCRIPT-READY: <name> | sync=<NN>/100 wonder=<N>/10 gates=communication,contract,quality,retention,critique -->
+ the verbatim SCRIPT-SCORECARD: line   (contract_scorecard.py, exit 0, on the FINAL contract)
+ the verbatim composite_lint: line     (composite_lint.py, exit 0)
```

`render_gate.sh` hard-blocks `build_video.py` without this line (or on `wonder<8` / `sync<70`).
Stages 26–32 (component mapping → assets → composition → GO → render → SHIP → iterate) are executed by
the `video_generation` orchestrator — see [update_documentation.md](update_documentation.md) §5.

### The 10 cross-cutting skills (run THROUGHOUT, not at one stage)

`knowledge-validator` · `testing-engine` · `feedback-optimizer` · `design-system-manager` ·
`documentation-engine` · `debug-engine` · `performance-optimizer` · `component-library-manager` ·
`token-sync-engine` · `code-review-engine` (+ `deployment-engine` at ship).

---

## 2. The runnable scripts (`.claude/skills/script_generation/scripts/`)

The mechanical verification floor — a dimension a script can COUNT is never certified by prose judgment
alone. Exit 0 = pass · 1 = violations printed · 2 = usage error.

### `sentence_laws_lint.py` — the S5 sentence floor
```
python .claude/skills/script_generation/scripts/sentence_laws_lint.py <draft-script.json> \
    [--banned .claude/skills/script_generation/references/banned-words.txt]
```
Flags: >22 words · passive-voiced mechanism · missing role/concept tag · banned words · visual-narration
phrases. (Laws 10–11 — numbers ramp, Commentary Law — are human-judged at S5 + the S7 cold-read.)

### `contract_scorecard.py` — the contract scorecard (stage 25, run FIRST)
```
python .claude/skills/script_generation/scripts/contract_scorecard.py <contract.json>
```
| Dimension | Bar |
|---|---|
| `semantics` coverage | every bullet carries its authoritative block |
| `process` coverage | every per-unit/rate narration beat carries `semantics.process` / scene `stage.process` (the arrivals-where-process-taught detector) |
| **concept coverage** | every top-level `concepts[].id` taught by ≥1 beat's `semantics.concept` (a never-taught concept = a silent curriculum hole); every beat traces to a concept; dangling ids = FAIL |
| rendered-text budget | non-empty `text` fields per scene ≤ budget |
| **visual load** | canvas containers per scene ≤ budget · elements ENTERING per beat ≤ budget (the cognitive ceiling, countable half) |
| `stage` coverage | every scene has `stage.composite` |
| render-shaped data | `series` present for charts; processes with an empty `trace` = decorative cycles = FAIL |

Evidence line: `SCRIPT-SCORECARD: semantics=… process=… concepts=… text_budget=… load=… stage=… series=… trace_steps=…`
(legacy contracts — no `stage` anywhere — are scored report-only).

### `composite_lint.py` — the script-side overlap gate (stage 25, with the scorecard)
```
python .claude/skills/script_generation/scripts/composite_lint.py <contract.json>
```
Pure geometry over `stage.zones` (fractional rects, kind `element|text|corridor`): element/text zones
pairwise DISJOINT · corridors (movers' swept paths) cross NO occupied/text zone · text zones out of the
caption band (bottom 12%) · occupants resolve to cast ids. **Overlap is settled AT THE SCRIPT** — the
render-side `layout_validator` is a backstop only (it samples snapshots and skips transformed boxes).

### `script_db.py` — writer preferences store (support tool, not a gate)
Persistent scriptwriting preferences / past-script metadata at `~/.claude/script_writer.json`
(tone, audience, niche, hook style) — a memory aid for S3–S6 voice consistency.

---

## 3. The gate chain (what blocks what)

| Gate | Runs | Blocks |
|---|---|---|
| `sentence_laws_lint.py` | S5 | hand-off to S6 until clean |
| mechanical floor (`contract_scorecard.py` + `composite_lint.py`) | stage 25, first | the SCRIPT-READY line may not be written while either fails on the FINAL contract |
| SCRIPT-READY (evidenced + both lint lines) | `feedback-optimizer`, last | `render_gate.sh` blocks `build_video.py` without it, or on `wonder<8`/`sync<70` |
| DIMENSION LOCK | throughout | accuracy · buildable/muted · **Wonder ≥8** · **sync ≥70** are locked once passed; a later gate may not regress them; conflicts go to the ONE reconciler (`feedback-optimizer`, precedence: accuracy > buildable/motion-native > Wonder > retention > polish) |

**Not the finish line:** the `.json` is the INPUT to the gates. A script is "ready" only when the
mechanical floor exits 0 and the evidenced SCRIPT-READY line exists — then **Phase 2 takes the contract:
[video.md](video.md)** (the full render flow, every `vg-*` skill, the build pipeline, the runtime, and the
Rendering Intelligence telemetry gate).
