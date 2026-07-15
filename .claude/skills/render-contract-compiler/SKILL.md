---
name: render-contract-compiler
description: STAGE 24 of the Visual Story Engine. Compiles every scene specification into a deterministic RENDER CONTRACT — the single, complete, machine-readable spec per scene that the render executes with zero interpretation (objects + states + events + operators + physics + timeline + audio + transitions + style, all resolved to concrete values). Input = Scene Specifications. Output = the RENDER CONTRACT. Runs after scene-composer, before the contract-linter. Owns "the deterministic spec the render runs", not the assembly of graphs (scene-composer) or its validation (contract-linter).
when_to_use: Use after scene-composer to compile the merged scene spec into a deterministic, fully-resolved render contract per scene. Owns the render contract format.
model: opus
---

# render-contract-compiler — Scene Specification → Render Contract (STAGE 24)

The scene specification is human-readable design; the RENDER CONTRACT is its deterministic, fully-resolved
form — everything the render needs, with nothing left to interpret. Determinism is the whole point: the same
contract always produces the same frames (which is what lets a cheap pre-render proof match the final ship).

## What the contract resolves (per scene, per beat)

Compile the merged graphs into concrete, resolved values:
- **objects — exported as the TYPED `cast` array, never prose.** Each scene's object graph (from
  visual-world-engine + object-library-engine) ships as schema `cast:` entries
  `{id, kind: world-object|instrument|label, form, material, accent, home, states, owner}` — every scene
  with ≥1 `world-object`. Prose in `description`/`design` DESCRIBES; the cast IS. An object that exists
  only as a sentence never reaches the renderer (the seam rule) — that is the documented "rich text"
  failure. Ops' `obj`/`to` and labels' `owner` resolve against these ids;
- **states** — the typed world states per beat (from the state graph);
- **semantics — the AUTHORITATIVE per-beat spec (schema `semantics:`), exported from stages 9–11 instead
  of dying in-memory**: `transitions` (object state deltas), `relationships` (edge-strength deltas — the
  relationship itself is the subject, e.g. adjacency(label,value) 1.0→0.0), `invariants`
  (preserve / break — the teaching as constraints), `process` (the beat's RUNNING MECHANISMS — each Run
  event / state `process` field exported as {object, circuit, emits, rate}; realized downstream as the
  `cycle` operator), `proof` (what the viewer realizes + a MEASURABLE
  visual predicate the proof gate checks on frames). `what_happens` prose is demoted to illustration.
  The contract states WHAT MUST BECOME TRUE; realization compiles from the video's style-locked
  verb→topology table ONCE (deterministic, film-consistent) — never re-chosen per render;
- **events** — each with subject · from · to · operator · physics · fire-frame (from event/operator/physics/tempo);
  a **Connect/link event names BOTH endpoints as cast elements** (source → target — the semantic map of what
  points at what); an endpoint the render would have to invent is a compile error → back to
  `attention-director`/`scene-composer`;
- **timeline** — every event's frame, every pause, the beat frame-lengths, the scene total (from tempo-sync);
- **audio** — voice/music/sfx/silence cues mapped to frames (from audio-design), with GAPs marked;
- **transitions** — the boundary morph/carry/match-cut (from transition-designer);
- **style** — the resolved tokens the scene inherits (from the style graph);
- **assets** — the required real assets (screenshots/photos/logos) referenced, to be resolved by asset-manager.
- **audio** — the FULL Audio Track from stage 19 (voice engine + loudness · music arc + duck · sfx cues ·
  designed silences · honest GAP list). Stage 19's artifact is a first-class contract section — a contract
  without it produces silent renders (a real failure this rule exists on).
- **concepts — the PROVENANCE SPINE (top-level `concepts:`).** The cognitive model's concept list
  exported as data (id · label · shape · misconception); each beat's `semantics.concept` references one.
  Same id space as S5 sentence `concept_tag`s. This is what the scorecard counts coverage against —
  a concept not in the contract cannot be verified as taught;
- **numbers_ledger** — the quantified world from `research-engine`'s knowledge package (quantities + units
  + source facts + derived values, mutually consistent), exported top-level so instruments/HUD/charts can be
  textured with REAL values downstream. The render may only display ledger (or narration) numbers — so a
  contract with a thin ledger ships starved instruments; carry the full ledger, not just the narrated stats.
  **Carry the RENDER-SHAPED data too:** the ledger's `series` (real multi-point data for every planned
  chart/curve/row-fill) and `trace` (the running example executed step-by-step through the mechanism —
  the per-pass values a scene's `cycle` replays). A chart with no series behind it can only be faked; a
  cycle with no trace is decorative.
- **camera + attention + transition — the CINEMATIC TRACKS, carried not dropped.** The Camera Track
  (camera-director, 14) ships as the scene's `camera: {move, target, meaning, shot}`; each beat's eye-path
  (attention-director, 13) ships as its `attention: {focus, order, dim}`; each beat's boundary handoff
  (transition-designer, 20) ships as its `transition: {mode, carry}`. All targets/carry resolve to cast
  ids. These were dying in-memory (camera/eye-path) or buried in prose (transitions) — decided upstream
  but not carried means the renderer invents them (camera-locked / split-attention / boundary
  ghost-and-leak flat renders). Same die-in-memory cure as `semantics` and `concepts`: the decision is
  data, the render executes it, and the runtime verifies it (transition `carry` → R5/R7 telemetry).
  With these carried, the contract IS the complete backend-agnostic scene graph — a non-React backend is
  a pure mapper swap, no separate ISG layer.
- **homes** — each recurring element's fixed screen address (from the world model's HOMES): part of its
  identity, resolved into every scene's design so the render never re-places a recurring element per scene.
- **stage — the SCENE-DRIVEN persistent world (schema `stage:`).** Per scene, export (a) `composite`: the
  settled final-frame layout as ONE spec (every beat's element in its own reserved zone — scene-composer's
  FINAL-COMPOSITE-FIRST), and (b) `process[]`: the mechanisms that run for the scene's WHOLE duration
  (scene-level Run events). The renderer draws the stage continuously on scene-local time; bullets are
  MODULATIONS of it. A scene whose world exists only inside its bullets re-creates per-beat restaging —
  the seam must carry the stage as data.
- **constraints** — the Capability Registry's RENDER CONSTRAINTS exported into the contract, so ANY renderer
  (ours or external) receives them with the content: captions sidecar-only (never burn narration) · on-screen
  text law (≤3 words or one number per element) · canvas fill minima (hero ≥50% height, content ≥60% canvas;
  a scene marked Interstitial is the designed exception) · Transform events must produce a visible state
  change (fade-only = non-conformant) · render the FULL runtime (`clock.runtime_total_s`, no truncation) ·
  narration synthesized + muxed (non-silent) · additive beats self-contained · caption zone (bottom 12%)
  clear · deterministic/frame-driven · **frame one populated** (the scene opens with its stage visible; no
  blank-canvas wait) · **no stale element** (no load-bearing element pixel-identical across ≥2 beat
  boundaries) · **numbers derived, never asserted** (a load-bearing value's first appearance derives from
  the `numbers_ledger`; no invented numbers anywhere) · **instruments re-diagnose** (any gauge/meter on
  stage is wired to the scene's driver value) · **recurring elements keep their HOME** (fixed screen address
  video-wide) · **one grid** (one margin/gutter system video-wide) · **headline never rendered** (machine
  metadata only; on-screen words come solely from `text` fields + instrument readings — linter 3g budget).
  The contract is the SEAM — constraints that live only in skills never reach an external renderer.

## IR GOVERNANCE — a field earns its place, or it doesn't exist

The contract is a compiler IR, and IRs rot into kitchen sinks unless gated: **every field must have
exactly ONE producer stage and at least ONE named consumer** (a downstream stage or the renderer that
reads it). No speculative fields, no "might be useful later," no second stage writing the same field.
Adding a field = naming its producer + its consumer first (the DDI rule, generalized to the whole
contract). A field nothing consumes is deleted, not documented.

## The motion score (carried as INTENT, not inferred from prose)

Each teaching beat carries a **`motion`** block (schema `motion:`) — the MOTION SCORE exported from the
directors + operators + physics (stages 14/16/17), so the beat's world BEHAVES instead of the codegen
inventing generic tweens (the "clean explainer, not a film" failure). It carries: `operator` (closed set) ·
`material` · `intensity` (the serial-attention tier: hero/medium/restrained/still) · `score` (the ordered
micro-beats **as STRUCTURED steps** `{actor, action (a CLOSED-set verb), intensity, target}` — never
free-form prose, which is a determinism smell a compiler can't parse) · `secondary` (restrained supporting
motion + particulate on hero beats) · `camera_reaction` · `light_reaction` · `physics_feel`.
**The boundary holds:** the score carries the choreography + FEEL; the exact `(easing, duration)` per step
resolves at Phase-2 via the style-locked `(action, intensity) -> (easing, duration)` table — the same action
renders identically video-wide (film consistency) and no spring constant / frame count is baked per beat
(the semantics-vs-timing boundary). **Serial attention:** only the hero/impact beat gets the full score +
camera + particulate reaction; support beats stay quiet (one kinetic focus). A `motion` left null (prose in
`what_happens` only) is the die-in-memory failure — the choreography designed at stages 14/16/17 must be
EXPORTED here or the render re-invents it flat. Mechanically gated by `contract_scorecard.py` (`motion=n/m` +
structured/closed-verb wellformedness).

## Determinism rules (the hard constraints)

- **No runtime randomness** — every value is fixed or seeded from the frame. No `Math.random`/`Date.now`/wall
  clock anywhere in the contract; jitter is seeded from frame number. (This is what makes the proof == the ship.)
- **Frame-driven only** — every motion is a function of the current frame, never self-animating/CSS/auto-play.
- **Resolved, not deferred** — no "TBD at render", no "figure out the layout later." A field the render would
  have to invent is a compile error → back to scene-composer / the owning stage.
- **In range** — every position on-canvas, every beat's events fit its frame length, text stays a
  headline+labels (not a paragraph), one heavy capability per video.

## The contract is the seam

Everything upstream is DESIGN (what/why); everything downstream is EXECUTION (how Remotion builds it). The
render contract is the seam between them — Phase 2 implements this contract and never invents. A flat render
is therefore an underspecified contract (a Phase-1 gap), not a render bug.

## The Render Contract (your output — consumed by contract-linter + the render mapper)

Per scene: the fully-resolved, deterministic spec (objects · states · events+operators+physics+frames ·
timeline · audio · transitions · style · assets). This is the canonical artifact the linter validates and the
component-mapper turns into React.

## Boundary

You compile the deterministic contract. You do NOT validate it (`contract-linter`), map it to React
components (`remotion-component-mapper`), or resolve assets (`asset-manager`). Emit the contract; hand it on.
(In this pipeline the contract IS `projects/structured_scripts/<name>.json` — schema
`docs/render-contract.schema.json`. `source_parser.py` parses it for the mechanical spine; each bullet's raw
JSON also feeds the codegen prompt verbatim — "parse for the machine, JSON-direct for the LLM." The JSON's
`script_ready` field carries the literal SCRIPT-READY line for `render_gate.sh`. Format spec:
`vg-source-script-format`.)
