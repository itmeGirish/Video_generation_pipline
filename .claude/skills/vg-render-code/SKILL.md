---
name: vg-render-code
description: Index of the 8 AUTHOR-TIME code recipes for writing production-grade per-bullet render code UP FRONT (animations, timing, sequencing, transitions, text, images, tokens, V-checks). Use BEFORE writing a bullet's React.createElement code, so the video is great by design — not fixed after render. Pairs 1:1 with the verify scorecard vg-visual-quality. Grounded in the remotion rules + video-generation-conventions.
model: opus
---

# Author-time render-code recipes (write it right the first time)

Read these WHILE writing each bullet's code so it's production-grade by construction. The
research is clear: rubric-guided **code generation** is where quality is actually built —
verification is only the safety net. These are the code recipes; `vg-visual-quality` (+ its 8
`vg-quality-*` gates) is the after-render check of the SAME 8 factors.

## The 8 recipes (read, then write the code)
| # | Factor | Author recipe | Verify gate |
|---|---|---|---|
| 1 | rich, meaningful motion | **`vg-code-animations`** | `vg-quality-animations` |
| 2 | easing & physics | **`vg-code-timing`** | `vg-quality-timing` |
| 3 | stagger & choreography | **`vg-code-sequencing`** | `vg-quality-sequencing` |
| 4 | clean handoffs | **`vg-code-transitions`** | `vg-quality-transitions` |
| 5 | text that fits | **`vg-code-text`** | `vg-quality-text-fit` |
| 6 | cinematic images | **`vg-code-images`** (if the bullet has an image) | `vg-quality-images` |
| 7 | tokens only, zero literals | **`vg-code-tokens`** | `vg-quality-tokens` |
| 8 | pass V-checks by construction | **`vg-code-vchecks`** | `vg-quality-vchecks` |
| + | trim animation/clip (only if needed) | **`vg-code-trimming`** | — |
| ★ | **motion-design bank** (scaffold→fill→payoff, value-growth, staggered, recolor, comparison, formula-fill, linked-highlight) — topic-agnostic | **`vg-code-motion-bank`** | `vg-quality-animations` |
| ★ | **composition** (persistent title+subtitle, dashboard, reference card, sub-beats, carryover/dock) — topic-agnostic | **`vg-code-composition`** | `vg-quality-vchecks` |
| ★ | **artifacts** (draw the REAL mechanism: cell grid / tier bars / pipeline / slider / node rail / KPI) — topic-agnostic | **`vg-code-artifacts`** | `vg-quality-vchecks` |

## Golden authoring order (per bullet)
0. **Read the scene's DIRECTOR'S BRIEF first** — produced by `scene-composer`: the once-per-video
   `<!-- GLOBAL VISUAL STYLE -->` + per-scene `<!-- SCENE DESCRIPTION -->` (prose) + `<!-- SCENE DESIGN -->`
   (fields) blocks (see `vg-visual-designer` step 0). The code must REALIZE the brief, not just the bullet.
   Map EVERY field → a recipe:
   - **GLOBAL VISUAL STYLE** (art direction, whole video) → `vg-code-tokens` (the palette hex + fonts) +
     `vg-code-composition` (one render style / shape language held across ALL scenes — this is what makes
     8 scenes feel like one video). Obey it everywhere; never let a scene drift to a different aesthetic.
   - **REFERENCE / `image: [asset:]`** → `vg-code-images`: load the real screenshot, PRESERVE its layout,
     animate only the changes (never redraw/invent UI; missing file → accurate vector from real details).
   - **CINEMATIC: Camera** → BUILD the scene's carried `camera: {move, target, meaning, shot}` (contract
     field, from camera-director) — not an improvised move: push = scale the focal group up · pull = scale
     down to reveal scale · parallax = layers at different speeds · the move lands on `target` (a cast id).
     A scene with a camera field and a locked render is ignoring the track (`vg-code-animations`/`-timing`).
   - **ATTENTION: eye-path** → BUILD each beat's carried `attention: {focus, order, dim}`: brighten/scale
     `focus` (the ONE kinetic focus), settle the `order` handoff, spotlight-DIM the `dim` cast ids (two-tier
     texture). This is the eye-path as data — don't guess where the eye goes (`vg-code-sequencing`/`-animations`).
   - **TRANSITION: boundary handoff** → BUILD each beat's carried `transition: {mode, carry}` (`vg-code-transitions`):
     `evolve` = redraw settled priors + the delta · `replace` = composite-out → skeleton-in → data-in ·
     `match-cut`/`morph`/`dock` = carry `carry` across as ONE instance (never redraw it fresh — that's the
     ghost R7 catches; hold its HOME — R5). The mode is data; don't default every cut to a fade.
   - **CINEMATIC: Depth** → `vg-code-composition`: fg/mg/bg layers; blur/dim the non-focal plane.
   - **CINEMATIC: Light+Mood** → glow on the hero, a vignette, a GRADIENT backdrop (never a flat fill).
   - **CINEMATIC: Color** → `vg-code-tokens`: one hero accent token; desaturate the context.
   - **LAYOUT** (spatial map) → `vg-code-composition`/`vg-code-vchecks`: place each element to the map
     (zones / grid), at the stated size — don't float or re-center.
   - **SHOT / FRAMING** → `vg-code-animations`: the focal scale — a CLOSE beat fills the frame with the
     hero; a WIDE beat shows the whole set. Match the brief's shot per beat.
   - **PRIMARY FOCUS (ranked)** → `vg-code-sequencing`: the #1 hero leads/enters first; #2/#3 follow dimmer.
     The scene's THROUGH-LINE / callback object (e.g. the amber answer-cell) is the default camera + emphasis
     anchor — keep it lit on every beat it's present; it's never below context.
   - **BEAT n → n+1 TRANSITION** → `vg-code-transitions`: carry / dock / match-cut the NAMED element (don't invent the cut).
   - **SCENE PURPOSE/PACE** → motion energy + beat density (a Reveal may be ONE bare beat; a Hook is fast).
   - **ENVIRONMENT (spatial)** → build the set where the brief says; hold positions across beats.
0b. **Read the COMPILED MOTION GRAMMAR for each beat — build the motion FROM it, don't re-invent from prose.**
   `vg-motion-compiler` has already translated each story beat (`event/change/result/sync` + `intensity` +
   `animation_pattern`) into motion rows `{el, op, topology, params, token, sync, cue, choreo}`. Your React
   REALIZES those rows. The three per-beat DIRECTOR DIALS map to recipes:
   - **`op·topology·params`** (what moves) → `vg-code-animations` + `vg-code-motion-bank` (build the topology) ·
     `vg-code-timing` (bind the `token` spring/duration).
   - **`intensity`** (`low·medium·impact·climax·wonder` — how big) → the EMPHASIS amplitude: `vg-code-timing`
     (punchier vs sustained token) + `vg-code-animations` (payoff scale + glow) + camera magnitude (push-in on
     `climax`, pull-back on `wonder`) + `cue:` → `vg-sound-design` (sting/swell/silence). Scale the PAYOFF row,
     not the supporting rows.
   - **`animation_pattern` (+ direction)** (how the clauses flow) → `vg-code-sequencing`: the pattern sets the
     choreo (`domino`=causal sequence · `morph`=one continuous transform · `cascade`/`bloom`=staggered wave ·
     `together`=same frame · `compare`=parallel), and the direction qualifier (`from-center`/`left-to-right`/
     `all-at-once`/`scattered`) sets the stagger FUNCTION. Clause order = execution order (never reorder).
   - **`sync`** (the one event-marker) → `vg-code-sequencing`/`vg-code-timing`: land the payoff on `findWord(sync)`;
     the compiler's in-between rows fire on their own `findWord` anchors.
   **Build from the full SHOT-SHEET IR, not just the spine rows** (`vg-motion-compiler` §"THE SHOT-SHEET IR"):
   the compiler also emits, per beat — **shots/microbeats** (with frame ranges; lay your sub-phases on them),
   **per-object specs** `{material, physics(weight/drag), anchor/pivot, z, bounds}` (build the object with THAT
   material's easing+light + its own physics + transform-origin + depth-index — `vg-code-composition` §8d
   catalogs + `vg-code-animations` constraints), and the **dependency graph** (`drives:`/`trigger:`/`lag:` —
   each primary's progress var DRIVES its reactions/camera/light/`cue`, coupled + lagged ~3f via
   `vg-code-sequencing`). A render that ignores the per-object specs or doesn't fire the dependency chain is
   building the spine without the body — the "inert, one-animation-on-a-slide" beat the IR exists to prevent.
0c. **WRITE THE MOTION PLAN FIRST — the grammar is BINDING, not advisory (the anti-"invents random animation" gate).**
   The recurring failure is reading 0a/0b loosely and then hand-writing whatever bespoke React comes to mind —
   which is why output "looks like a slideshow" even with the grammar available. Before any `React.createElement`,
   write a short explicit plan and BUILD TO IT (don't drift):
   - **Per object** (the scene's cast): `op·topology·params·token` + `transformOrigin` (anchor/pivot) + its
     **motion arc** (enter → sustain → emphasize → exit) + the camera move it's framed by.
   - **THE RUNNING MECHANISM** (the plan's first question): which object CYCLES through the beat
     (`cycle` op: travel→process→emit, repeating) so the concept is visibly OPERATING? A beat about a
     process/rate with no mechanism loop is the real "slide" failure — no amount of added shimmer fixes it.
   - **ONE KINETIC FOCUS at a time:** the plan sequences movers SERIALLY (this moves → stillness → next
     moves); the payoff primary drives 1–3 reactions; supporting elements are pixel-still once landed.
   - **The PERIPHERY:** the dim, mostly-static context instruments around the hero (pinned card, tally,
     status strip) — present for density of INFORMATION, not of motion. (⛔ the old "list ~8+ systems
     alive at once / add cheap systems NOW" rule was a bug — it manufactured decorative wobble;
     see `feedback/learning.md` §D.)
   This plan is what `vg-quality-animations` (richness + MOTION DENSITY: mechanism + one-mover) verifies the
   render against — a render that doesn't match its own plan (no mechanism, parallel movers, locked payoff)
   is NOT READY. Declaring it up front is *assembling a known motion language*, not inventing per beat.
0d. **COMPONENT-FIRST — assemble from REUSABLE COMPONENTS + object STATES; do NOT re-author primitives every
   bullet (Remotion's model: components + props, not redrawn clips).** The scene's CAST (the DDI objects) are
   reusable COMPONENTS, and each owns a STATE LIFECYCLE (the DDI **Object Lifecycle**: `map: folded→opened→
   burned`). A beat **renders a state**, it does not redraw the object from div/SVG scratch.
   - **Reuse the `Kit` library** (`Kit.*` — already a `DynamicBlock` binding) for any anchor that recurs.
     A persistent object is drawn ONCE as a component, then re-shown across beats/scenes by passing new props —
     never copy-pasted as a fresh div tree each bullet (that redraw is the scene-centric failure: drift,
     inconsistency, per-bullet bugs — empirically only ~10/46 scenes reuse components today; raise that).
   - **Write ONE local builder `mkX(state, props)` per persistent object** at the top of the scene's bullets
     and CALL it per beat with that beat's state. Identity (color/shape/role) is FIXED across states; only the
     state changes. The through-line object is literally the SAME component across scenes — that's what makes
     N scenes feel like one built world instead of N bespoke redraws.
   - **A beat = compose components at their states** (`mkMap('opened')`, `Kit.NumberStamp{value}`), THEN apply
     the beat's motion grammar (0b) to them. If a bullet re-declares a tree another bullet already drew,
     promote it to a component + pass props. **Scenes orchestrate; components + object-states are the units.**
   - **The state transitions are DECIDED BY THE CONTRACT, not invented** (JSON render-contract path: the
     bullet's RAW object is in the prompt). Map fields → states mechanically: `emphasis_word` → that element
     enters its EMPHASIZED state on its word · `pause_after_ms ≥ 400` / `role: breath` → the HOLD state
     (designed stillness, breathe only) · `role: release/takeaway` → the settled/payoff state · every prop
     value (labels/numbers/units) verbatim from the contract or narration — a value not in the contract does
     not exist. Component selection itself: the decision procedure in `vg-code-artifacts`.
1. **Pick the visual** — `vg-visual-map` (what proves the point) + the matching `remotion` rule.
2. **Frame the canvas** — `vg-code-vchecks` (primary ≥50% h, fill ≥60%, bounds, caption zone).
3. **Tokens first** — `vg-code-tokens` (color identity, sizes as `w`/`h` fractions, no literals).
4. **Write the motion** — `vg-code-animations` (layered + meaning) → `vg-code-timing` (ease + spring)
   → `vg-code-sequencing` (stagger + hero leads).
5. **Text + images** — `vg-code-text` (fitText) and, if any image, `vg-code-images` (Ken Burns/overlay).
6. **Handoff** — `vg-code-transitions` (AbsoluteFill REPLACE, no leak/double-dark).
7. Seed → render → then verify the same 8 with `vg-visual-quality`.

## Why this is the high-leverage step
Fixing a flat render after the fact costs a 25-min re-render; writing it right up front doesn't.
Author against all 8 recipes and most scenes clear the verify scorecard on the first render.
These recipes live on top of the canonical `remotion` rules (animations.md / timing.md / …) —
they're the pipeline-specific code patterns using our bindings (`D.*`, `durationInFrames`,
`AbsoluteFill`, `fitText`, `findWord`/`findWordEnd`).
