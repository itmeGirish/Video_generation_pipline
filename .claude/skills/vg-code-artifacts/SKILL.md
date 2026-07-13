---
name: vg-code-artifacts
description: AUTHOR-TIME REGISTRY MAP — OBJECT-FIRST. Every scene's HERO is a hand-built WORLD OBJECT (machine/page/vessel/figure, from primitives, per the world/spatial vocabulary) with labels welded on; the reusable `Kit` panels (bar/KPI/gauge/tiers/pipeline/slider/code-panel/token-grid/big-stat/counter) are rail INSTRUMENTS that display values ABOUT the world — never the hero. Kit instruments are composed, never re-drawn by hand; world objects are bespoke by design. Also owns the TRANSFORM vocabulary (how one artifact becomes another). Use WHILE choosing a bullet's visual so it depicts the real mechanism, not a text panel. Grounded in vg-code-vchecks/tokens/motion-bank.
model: opus
---

# Artifact catalog — draw the real mechanism, not a generic shape

The difference between "dull" and "expert" is depicting the ACTUAL thing. Pick the artifact
that matches the concept, then animate it with `vg-code-motion-bank`. All topic-agnostic —
swap the labels. Build with `div`/SVG primitives + `D.*` tokens (no emoji — SVG icons only).

## ⛔ OBJECT-FIRST — the default is a WORLD OBJECT; panels are INSTRUMENTS only

**The scene's HERO is a physical world object (kind=world-object in the contract cast): a machine,
page, vessel, figure, pile — a thing with form, material, and a home — with text WELDED ON as labels.**
The `Kit` panel components below (KPI/BigStat/Tag/Chip/RefCard/Counter/BarChart/…) are INSTRUMENTS —
they display values ABOUT the world; they never ARE the world. A scene whose hero is a panel is a
dashboard, and a video of dashboards is rich text, not animation (the documented text-slide failure).
- **Every scene**: hero = a world object from the contract's typed `cast` (kind=world-object); panels
  appear only as rail instruments reporting on it.
- **World objects are hand-built from primitives BY DESIGN** (the table below + `vg-code-composition`
  §10 stage archetypes) — the "compose Kit, never hand-draw" rule applies to the *instrument* panels
  (never re-draw a KPI/bar/gauge by hand), NOT to world objects, which are bespoke per world.
- Physicality is NOT rationed to one hero scene: EVERY scene lives in the staged world; TYPE 11 is the
  one scene allowed to go *further* (bespoke metaphor-as-world staging), not the only physical one.

## TOPIC-AGNOSTIC — map a beat's MEANING to a `Kit` component, then pass THIS topic's data

These artifacts ARE the reusable `Kit` components (`remotion/src/universal/kit.tsx`). They are
**not tied to any topic** — `Kit.BarChart` renders a token cost, a population, a benchmark score,
or a company's runway equally; only the *data you pass* changes. **Never hardcode a topic or draw
bespoke divs** — pick the component by what the beat MEANS, then fill it with this script's values.

| The beat MEANS (any topic)… | Compose this `Kit` component (pass data) |
|---|---|
| a quantity, or A-vs-B amounts | **`Kit.BarChart`** `{rows:[{label,value,color}],max,unit}` |
| a headline metric counting up | **`Kit.KPI`** `{label,to,unit}` |
| the big-number moment | **`Kit.BigStat`** `{value,caption,sub}` |
| saturation / utilization % | **`Kit.Gauge`** `{label,value,max}` |
| a value CHANGING over time/iterations — a trend · decay · growth · crossing a threshold | **`Kit.LineChart`** `{points:[y…],refs:[{y,label}],mark:{i,label}}` (the ONLY continuous-axis primitive — see snippet) |
| items in slots / a matrix / states (good↔bad) | **`Kit.TokenGrid`** `{cells:[{label,state}],cols}` |
| speed/cost/latency layers, a hierarchy | **`Kit.Tiers`** `{tiers:[{name,sub,wFrac,color}]}` |
| a process / flow / stages | **`Kit.Pipeline`** `{stages:[...]}` |
| a tunable tradeoff / setting | **`Kit.Slider`** `{label,min,max,value}` |
| code / config / a diff | **`Kit.CodePanel`** `{title,lines:[{text,color}]}` |
| a persistent constant / unit | **`Kit.RefCard`** `{label,value,sub}` |
| a corner stat | **`Kit.Tag`** `{value,label}` |
| a labelled comparison row | **`Kit.Chip`** `{who,text,x}` |
| scene header (title + subtitle) | **`Kit.Title`** `{title,subtitle}` |
| a ticking value inline | **`Kit.Counter`** `{to,prefix,suffix,decimals}` |
| ONE thing fanning out to N (a prompt→agents, a parent→branches) | **`Kit.FanoutTree`** `{parent:{label,value},children:[{label,value,state}]}` |
| part-to-whole anatomy (what a total is MADE of) | **`Kit.StackedLedger`** `{segments:[{label,value,color,sub}],unit}` |
| utilization with a saturation state | **`Kit.MeterBar`** `{label,value,max,state:'saturated'}` |
| a formula building factor-by-factor to a result | **`Kit.FormulaChips`** `{factors:[{label,sub}],result:{label,sub}}` |
| a dense composition (thousands of units by group) | **`Kit.TokenHeatmap`** `{groups:[{label,count,color}],title}` |
| a row table / an index with per-row state | **`Kit.BlockTable`** `{title,rows:[{label,value,state}]}` |
| ONE resource split two ways (an animated divider) | **`Kit.AllocationBar`** `{label,left:{label,frac,color},right:{label,color}}` |
| a vertical hierarchy on an axis (fast→slow, cheap→costly) | **`Kit.Ladder`** `{rungs:[{label,sub,color}],axis:{top,bottom}}` |
| a processor/engine with units lighting up | **`Kit.Die`** `{rows,cols,active,label}` |
| capacity slabs filling (memory/weights/storage) | **`Kit.SlabStack`** `{slabs,filled,label,color}` |

## THE SELECTION PROCEDURE — the component is DECIDED BY THE SCRIPT, never by taste

The choice above is **derived from the beat's contract fields**, mechanically — that is what "not
hardcoded" means: the skill carries the decision LOGIC; every value comes from THIS script at build time.
Decide in this order:

1. **Read the beat's concept SHAPE** (the render contract carries it — the cognitive model / idiom the
   script pipeline chose; else infer it from `what_happens`): comparison · accumulation/part-to-whole ·
   flow/process · hierarchy · transformation · trend-over-time · a tunable tradeoff · a lookup/index ·
   a saturation/utilization.
2. **Shape → component family** via the meaning table above (comparison→BarChart rows · accumulation→
   stacked/grid fill · flow→Pipeline · hierarchy→Tiers · trend→LineChart · tradeoff→Slider ·
   states-in-slots→TokenGrid · saturation→Gauge). One shape, one family — if two beats share a shape,
   they REUSE the same family (consistency the viewer learns to read).
3. **Props come from the contract, verbatim** — labels, values, units, counts from THIS beat's
   `what_happens`/`text`/narration `display_value`s. A prop value that isn't in the contract or the
   narration does not exist (no invented numbers, no filler rows). The contract's **numbers ledger**
   (from `research-engine`) is the sanctioned source for instrument/HUD texture values — a credible
   dense frame comes from carrying MORE ledger numbers, never from inventing values.
4. **The beat's `role`/`emphasis` set the component's STATE, not new art** — components take state props
   (active · settled · highlighted · crossed-out · saturated); a beat is a state TRANSITION on components
   already on stage, not a fresh drawing. The `emphasis_word` names which element enters its emphasized
   state; a `breath`/pause beat is the HOLD state.
5. **A parameter beat gets a visible control** — when the beat's meaning is "this setting changes the
   outcome", render the control (`Kit.Slider`) and DERIVE every downstream element from its value, so the
   cause→effect is mechanical (one prop drives the whole frame — see the ONE-VALUE law,
   `vg-code-motion-bank`).

## These are Kit COMPONENTS — compose them, never hand-draw

Every repeatable artifact above **is a `Kit` component** (`remotion/src/universal/kit.tsx`). **Compose the
component and pass THIS topic's data — never re-draw it from raw divs.** That reuse is the whole point; a
hand-built tier-bar/pipeline/KPI when `Kit.Tiers`/`Kit.Pipeline`/`Kit.KPI` exists is the redundancy that makes
scenes drift. (Roles for `Kit.CodePanel`: keyword `D.cyan` · string `D.green` · number `D.amber` · comment
`D.text_dim`.) Formula breakdown → `vg-code-motion-bank` P10.

**`Kit.CurveChart`** (alias `Kit.LineChart`) `{points, refs, mark}` — the continuous-axis artifact (a trend /
decay / growth crossing a threshold) — is BUILT (draws on via `@remotion/paths` evolvePath; reference lines
give the curve meaning). Never hand-draw a chart per scene.

## WORLD / SPATIAL artifacts — the DEFAULT stage vocabulary (every scene, not just TYPE 11)

Every artifact above is **dashboard-shaped** (data in panels) — instruments on the rail. The scene's
HERO is a **physical thing in a space**, animated by its own physics — that's what makes it memorable
instead of generic. Build these as a *stage* (`vg-code-composition` §10), with depth (§8), and animate
the MECHANISM, not a bar:

| The metaphor | Build it from primitives | Animate (the physics) |
|---|---|---|
| **vessel filling / leaking** (capacity, context) | an SVG container outline + a clipped fill rect + falling drop rects | fill height rises with the value; drops fall + a puddle grows when it "leaks" |
| **accumulation in a space** (memory, debt, clutter) | many small rotated `div` cards scattered on a "wall" | cards drop/stick one by one, the wall fills, density = the quantity |
| **a line under tension** (coherence, a chain holding) | an SVG path (taut) with checkpoint circles | nodes light along it; at the break point the path forks + jitters red (fray → snap) |
| **a single figure on a path** (a long task, a journey) | a capsule "runner" + a path receding with perspective | it advances step-by-step; a stalled rival drifts off the path |
| **a mechanism ticking** (a running cost/clock) | concentric SVG dials + a sweeping hand | the hand sweeps, digits roll — the cost *spins up* |
| **a map / territory** (reach, spread, where) | a simple region outline + nodes + connecting arcs | nodes light + arcs draw outward = spread over space |

These are **bespoke by design** (the point is they're NOT a reusable Kit component) — build the specific
metaphor THIS script needs, label minimally, keep it tokens-only, and make the *physics* the motion
(`vg-code-animations` — the water really falls, the rope really frays). Every scene's hero comes from
this vocabulary; the Kit panels above serve as its rail instruments.

## TRANSFORM vocabulary — HOW one artifact becomes another (name the technique, don't hand-wave "page → strips")
A beat like "the page turns into strips" or "the table melts into text" needs a *named transform technique*,
or the render invents a random animation. Pick the technique that matches the physical change — all are
`frame`-driven and Remotion-buildable:
| The change (X → Y) | Technique | How |
|---|---|---|
| something is **sliced / shredded** | `clip-path` bands OR stacked strip divs | render N vertical strips of the content; translateY + rotate each apart (eased fall + momentum, `vg-code-timing`) |
| something is **revealed / wiped** | `clip-path` inset / a mask rect growing | animate `clip-path:inset()` or a mask width 0→100% to uncover |
| **A morphs smoothly into B** | cross-interpolate both states | both shapes present; interpolate A→opacity 0 / B→opacity 1 + a shared scale, NO cut (`Transform·morph`) |
| something **collapses / folds** | `scaleY` → 0 about an edge | `transformOrigin` the edge, scaleY 1→0 (then the next unfolds from the same edge) |
| a structure **breaks into pieces** | per-piece transform from a shared driver | each piece reads the same progress var, translateY/rotate apart with a stagger (`vg-code-sequencing`) |
| an outline **draws on / erases** | SVG `stroke-dashoffset` | dash the path; offset LEN→0 to draw, 0→LEN to erase |
| something **disintegrates → particles** | the particle field as the bridge | dissolve the shape, spawn particles at its cells (`vg-code-composition` §8c) |
Author the technique explicitly in the motion plan (`vg-render-code` §0c) so "X → Y" is a built transform,
not an improvised fade. Real-image assets get their own choreography (crop / push-in / mask / callout) —
`vg-code-images`.

## Rules
- **Open the real thing in your mind** — a KV page HAS an index + tokens + a hash; a GPU die HAS
  a core grid; a storage tier HAS a latency. Put those real attributes ON the artifact (as labels).
- **Label every part** (tiny uppercase mono) — the deaf-viewer test (see `vg-code-text`).
- **SLOT GRAMMAR IS MANDATORY inside every bespoke builder (`mk*`).** A hand-built artifact's INTERIOR
  is laid out by the layout engine, never by hand-picked fractions: the container is a flex/grid column
  of SLOTS — title slot (top), content slot(s), reading slot (value right-aligned on its own row),
  caption slot (its own line below) — so internal text can NEVER collide with internal content. In-panel
  labels placed at `left: pw*0.NN` are the in-container overlap class the zone system cannot see (zones
  guard the canvas, not a container's interior). Same law `Kit` components already obey internally —
  bespoke builders get no exemption.
- **Animate it** with the matching motion pattern — a static artifact still fails the freeze gate.
- **A load-bearing number is DERIVED, never asserted.** If a value is the beat's point, it must be
  BORN on screen — `Kit.FormulaChips` (factors → result), `Kit.Counter` accumulating in sync with the
  visual event, or `Kit.StackedLedger` assembling the total from its parts. A finished stat pasted on
  as a static chip is the assert-tell (the viewer must trust it instead of watching it become true).
  Static `Kit.Tag`/`Kit.BigStat` are for RESTATING a value already derived/established, never for the
  first appearance of the beat's key number. (Motion: `vg-code-motion-bank` P10.)
- **An instrument RE-DIAGNOSES, or it's decoration.** A `Kit.Gauge`/`Kit.MeterBar`/`Kit.RefCard` on
  stage is WIRED to the scene's driver value: when the driver crosses a threshold the instrument
  visibly changes its reading AND its state (value + color-state + label/verdict). An instrument that
  never re-reads the world across the scene's beats is a decoration — cut it or wire it. (This is the
  ONE-VALUE law applied to instruments: one driver, everything downstream re-derives.)
- **No emoji** — icons are SVG primitives (clock = circle + 2 lines; lock = rect + arc; flag = pole + triangle).
- **THE TELEMETRY CONTRACT — tag every cast element (`data-cast-id` / `data-state`).** The top-level
  element of every world object and instrument carries `'data-cast-id': '<the contract cast id>'` and
  (when it has states) `'data-state': '<current state>'` as props. This is what makes the render
  MEASURABLE: the RuntimeProbe reads real layout boxes of tagged elements during every render and the
  rules engine (`python -m storyboard.telemetry_rules <project>`) verifies them against the contract —
  zone occupancy, corridor bounds, overlap, accumulation, HOME drift — with cast identity attached to
  every violation. An untagged cast element is invisible to Rendering Intelligence: the probe sees an
  anonymous box it can't check against anything. Tag the container of the object, not its inner parts.

## Before you pick a visual, confirm
- [ ] Composed a **`Kit` component chosen by the beat's MEANING** + passed this topic's data —
      no bespoke hand-built divs, no topic-specific logic (the same component serves any subject)
- [ ] The artifact depicts the REAL mechanism (not a generic bar standing in for it)
- [ ] Its real parts are present + labeled (index, latency, hash, stage name, unit…)
- [ ] A motion pattern from the bank animates it; nothing is static
- [ ] The beat's key number is DERIVED on screen (FormulaChips/Counter/StackedLedger), not a pasted static chip
- [ ] Every instrument on stage (Gauge/MeterBar/RefCard) is wired to the scene driver and re-diagnoses when it crosses a threshold
