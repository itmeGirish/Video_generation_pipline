---
name: vg-code-composition
description: AUTHOR-TIME composition recipes for a bullet's render code. Header/card/dashboard/reference are `Kit` components — compose them, don't hand-draw.
model: opus
---

# Composition recipe

Pair with `vg-code-motion-bank` for the motion.

## 0. ZONE LAYOUT — the overlap-proof frame (reach for this FIRST)

**Implement the brief's FINAL COMPOSITE, then reveal it.** `scene-composer` designs the scene's LAYOUT as
one settled final frame (every beat's element in its own reserved zone). Code it that way: declare the FULL
`Kit.Zones` grid (all zones, all beats) from BULLET 1 — early beats render later beats' zones EMPTY (or as
dim skeleton frames), and each beat fades the next occupant into its reserved zone. Never re-derive a new
layout per bullet: reveal one composite progressively (`feedback/learning.md` §D.4) — that's what makes
overlap unrepresentable AND the scene read as one continuous stage.

**CONTAINMENT — the canvas negotiates only CONTAINERS; density lives INSIDE them.** A dense frame is
built hierarchically: the canvas hosts a handful of bounded containers (bordered panels with internal
padding — each a zone occupant), and everything dense lives inside a container under its own internal
slot layout. Collision risk then scales with the container count, not the mark count. Adding detail to a
scene NEVER means adding another free-floating object to the canvas — it means adding a row/cell/mark
INSIDE an existing container (or adding one new container to an empty zone). Free-floating labels/marks
placed "near" other elements on the open canvas are the crowding failure by construction.

**FIELDS — visual mass is REPETITION of one unit, not more distinct objects.** When a beat needs "a lot"
(scale, volume, accumulation), build a FIELD: one container holding many copies of a single identical
unit laid in a programmatic grid/row (cells, ticks, dots — one identity, generated positions). A field
reads as one textured object, its internal overlap is impossible, and it carries huge density for the
budget of ONE container. Many distinct objects with distinct labels is how density becomes clutter.

**VOID SURVIVES DENSITY — islands in emptiness.** Even the densest frame keeps generous empty canvas
BETWEEN containers; the void is what separates dense regions and keeps them readable. Never stretch a
layout to "use the space" — fill is satisfied by the containers' own footprint + their internal density
(see `vg-code-vchecks` fill note), not by spreading islands until they merge.

**CORRIDORS — a mover's path is reserved space, like a zone.** Transform-driven motion bypasses layout
entirely: a moving element OVERLAYS whatever it crosses (the browser never reflows for a transform), so a
static-clean layout can still collide at some mid-flight frame. Two rules make trajectories safe by
construction: (a) every mover (sweep / travel / dock / a cycle's circuit) runs inside a CORRIDOR the
composite reserves — an empty lane that crosses no text zone and no occupied zone (from the brief's
composite; endpoints DERIVE from the connected elements' layout variables, `vg-code-motion-bank` §P11);
(b) position movers with `transform`, never by animating `left/top` — layout-positioned movers thrash both
the layout engine and the box checks. A mover with no reservable corridor is a design problem: dim/clear
the crossing zone for the pass, or re-route.

**Remotion has NO layout engine.** `AbsoluteFill` is pure `position:absolute` + z-index — it stacks by paint
order and *never reserves space*. So two elements placed at hand-picked canvas fractions (`left:w*0.05`,
`top:h*0.7`) overlap **silently** — nothing in the stack looks at where boxes land relative to each other,
and no gate can reliably separate a designed dark-on-light child from an accidental collision (they are
pixel-identical). This is the **recurring overlap class** (seen repeatedly: a persistent band + a later
beat's parser box, placed by independent percentages, collided). Coordinate-tuning is whack-a-mole; the
durable fix is the one **Remotion's own docs point at — use the browser layout engine (flex/grid).**

**`Kit.Zones` / `Kit.Zone`** (in `remotion/src/universal/kit.tsx`) is a CSS **grid** that partitions the
canvas into NAMED, disjoint regions. Two elements in DIFFERENT zones **cannot** overlap — the grid gives each
area its own non-overlapping box, so the collision is *unrepresentable*, not merely unlikely. Each zone is
`overflow:hidden` (a stroke / X-glyph / shred particle that escapes its region is **clipped**, not spilled
onto a neighbour) and lays its own children out with **flex** (siblings spaced by the engine, never stacked
by hand).

```js
React.createElement(Kit.Zones, {
  areas: `"header header"
          "stage  rail"
          "band   band"`,
  rows: '12% 1fr 22%', cols: '1fr 34%',      // caption band auto-reserved (safeBottom, default 12%)
}, [
  React.createElement(Kit.Zone, { name:'header', key:'h' }, /* Kit.Title-style header      */),
  React.createElement(Kit.Zone, { name:'stage',  key:'s' }, /* the hero / transforming obj  */),
  React.createElement(Kit.Zone, { name:'rail',   key:'r', dir:'column', justify:'space-between' }, /* KPIs */),
  React.createElement(Kit.Zone, { name:'band',   key:'b' }, /* the persistent through-line  */),
])
```

**The rules (this is the anti-overlap contract):**
- **ONE GRID, video-wide.** The zone grid's outer margins, gutters, and row/column proportions come from
  ONE shared set of constants (the project's design tokens), reused by every scene's `Kit.Zones` — scene 7's
  margins = scene 2's. Scenes vary WHICH zones exist, never the spacing system. (The spatial mirror of
  `vg-code-text`'s "compose from a shared scale" — per-scene spacing by feel is the same drift bug.)
- **Every element lives in exactly ONE zone.** The through-line band gets its own `band` zone; the beat's
  hero object gets `stage`. They are disjoint by construction → they can never collide, no matter what
  coordinates the beat later picks.
- **Inside a zone, size RELATIVE to the zone** (`'100%'`, flex, `%`) — **never** by canvas fraction
  (`w*0.x`). A canvas-fraction child ignores the zone and re-introduces the bug. (The legacy absolute Kit
  components — `Kit.Terminal`, `Kit.BarChart`, `Kit.Pool` — position by canvas fraction; either give one the
  WHOLE canvas as its own full-bleed scene, or draw the zone's content as flow/flex content. Don't drop a
  canvas-fraction component *into* a zone and expect it constrained.)
- **`position:absolute` is for TRUE overlays only** — a floating caption, a corner badge. Put it in an
  `overlay` zone spanning the grid, or as an absolute child of its zone (it's clipped to the zone).
- **The caption band is carved out of the grid** (`safeBottom`, default 12%) — nothing is ever laid into the
  bottom 12%, so SHIFT-LEFT rule 1 (caption zone) holds structurally, not by hand.
- **Match the grid to the FEELING** (§9): a calm beat = simple `header / stage`; a dashboard = `stage / rail`;
  an awe beat = one full-bleed `stage` zone with big negative space.

**Why this retires the geometry detector's hard-FAIL for migrated scenes:** once a scene is zone-composed,
"did it overlap" collapses to "did every element stay in its zone" — which is true by construction. The
`render_intelligence` occlusion/panel-cut checks exist to catch the *absolute-coordinate* class; a
zone-composed scene can't produce it. (Verify the migration held with one Visual Proof; the detector then
only needs to confirm no element used a stray canvas-fraction that escaped its zone.)

## 1–4. Header · card · dashboard · reference — COMPOSE the Kit components (don't hand-draw)

These are reusable `Kit` components (`remotion/src/universal/kit.tsx`) — **compose them, never re-code them:**
- **scene header** (persistent title + swapping subtitle + underline accent) → **`Kit.Title{title,subtitle}`**,
  redrawn identically in every bullet of the scene (bullets are self-contained — CLAUDE.md). The title text
  comes from the `## SCENE N — "Title"` header; the subtitle is THIS bullet's point (it swaps as the beat evolves).
- **panel / floating card** (the reusable surface unit) → **`Kit.Panel`** (soft-shadow; `rgba(0,0,0,α)` is the
  ONE sanctioned non-token literal — SHADOWS ONLY; a colored glow uses a `D.*` token).
- **dashboard** (hero ≥55% + 2–3 KPI cards + a meter row, dense but RANKED) → compose the hero visual
  (`Kit.BarChart`/a diagram) + **`Kit.KPI`** cards + **`Kit.Gauge`** meters. One hero leads (V13); cards
  secondary; meters tertiary. Layout is a `flex` row (hero left, cards stacked right, meters bottom).
- **persistent reference card** (a corner constant that breathes) → **`Kit.RefCard{label,value,sub}`**.
- **HUD / telemetry strip** (the chapter's vital signs, always on) → a thin `band` zone composing 3–6
  live micro-stats (`Kit.Tag`/`Kit.Counter`/mini `Kit.MeterBar`), each WIRED to the scene's driver values
  so they visibly tick/re-read as the world changes — a running instrument panel, not a static footer.
  Redraw it identically in every bullet (self-contained), values at their current driver state. This is
  the strongest cross-beat "the world is running" signal a scene can have; one strip, whole chapter
  inherits life. (Instruments must re-diagnose — `vg-code-artifacts` Rules; keep it out of the caption
  zone, cap `top:h*0.82`.)
  **A PROGRESS/CHAPTER spine is ICONIC, not a permanent word-band:** each stop is a glyph/shape + fill
  state; a stop shows its text label ONLY while it is the ACTIVE subject (or at the recap). A strip that
  keeps every chapter's multi-word title on screen for the whole video is a standing wall of words — it
  taxes every frame's text budget and the viewer stops reading it after scene one.

## 5. Sub-beats WITHIN a beat (crossfade phases)
A long beat shows 2–4 sub-visuals in sequence; each crossfades to the next (title stays).

## 6. Element carryover / dock (match-cut continuity)
A result from sub-beat 1 SHRINKS and DOCKS to a corner, becoming the reference for sub-beat 2.
> Cross-BULLET carryover: the next bullet must REDRAW the docked card at its settled corner
> position (bullets are self-contained — CLAUDE.md). The dock animates in bullet N; bullet N+1
> shows it already parked.

## 7. EVOLVE — persist the diagram across bullets, animate only the delta (continuity)
The #1 continuity pattern. For ADD beats that continue the SAME object: redraw the anchor diagram
at its **settled state** (no entrance — static, just breathing) and animate **only the change**.
The diagram never re-enters, so the viewer reads it as ONE persistent thing across bullets.
- The anchor is **byte-identical** bullet-to-bullet → no jump/reflow.
- Only the delta animates: a moving highlight, a recolor (P5), a value tick, one added element, the subtitle.
- Use **ADD** bullets for evolve beats; `[REPLACE]` only when the diagram itself changes.
- Keep the anchor builder in EACH bullet (bullets are self-contained — CLAUDE.md); copy it verbatim.

**§7b. THE CHAPTER ANCHOR — one diagram is the SET across consecutive SCENES (EVOLVE at chapter scale).**
The premium long-form pattern: when several consecutive scenes argue about the SAME structure (one chart,
one machine, one map), that diagram becomes the chapter's *set* — each scene re-draws it at its settled
state (match-move: same screen position/scale across the cut, `vg-scene-transitions`) and adds ONLY its
new annotation layer (a plotted point, a band, a threshold line, a verdict). The diagram is never
re-established, so the viewer's mental model accumulates instead of resetting — each addition inherits
every prior beat's context, and the eye never re-orients. Requires the script side to have planned it
(the scenes share one anchor object — `scene-planner`/`object-continuity-engine`); render-side the anchor
builder is copied verbatim scene-to-scene like §7, and each scene's delta is its own beat structure.
Reach for this whenever ≥2 adjacent scenes would otherwise each redraw a variant of the same diagram —
N variants of one chart is the slideshow tell; one chart gaining N layers is a film.

## 8. CAMERA-SPACE DEPTH — fg / mg / bg moving at DIFFERENT rates (the cinematic upgrade)

The dashboard look is flat — everything on one plane. The single biggest "cinematic" upgrade is **depth
via parallax** (Disney's multiplane camera: layers further from the camera move SLOWER; the eye reads
that speed difference as 3D space). On a 2D canvas you fake it by moving three layers at different rates
during any push-in / drift:
Even a STATIC beat gets depth: put the dot-grid on a far plane drifting `*0.005`, the diagram on the
mid plane, and one foreground accent that drifts faster. Three planes at three speeds reads as a *world*,
not a slide. (Pairs with `scene-composer` CINEMATIC: Depth + Camera; the brief names it, this builds it.)

## 8b. ATMOSPHERE — texture · light · material (the "feels expensive" pass, not a flat template)

Parallax gives *space*; this gives *surface*. The #1 reason clean vector renders read as "premium
template / AI motion-graphic" instead of cinematic is they are **flat fills with no texture, no light
behaviour, no material** — every shape the same matte plane. Apply ALL THREE as a global layer (build them
into the shared backdrop helper so EVERY beat inherits them at once — one edit, whole scene lifts):

1. **GRAIN / texture (kills the "digital flatness").** A faint static noise overlay over the whole frame —
   cheap + compositor-safe (it does NOT animate, so no re-raster), at low opacity + `mixBlendMode:'overlay'`.
2. **LIGHT (directional + vignette → the frame has a light source).** Not a flat bg: a large off-centre soft
   radial "key light" in a warm/cool accent over the bg, plus a vignette that darkens the edges so the eye is
   pushed to the lit centre. Both are static gradients (cheap). The hero sits in the light pool.
3. **MATERIAL (objects are lit solids, not stickers).** Never a pure flat fill on a focal object: give it a
   subtle top-down GRADIENT (lighter top edge → darker bottom) + a soft STATIC drop-shadow grounding it on the
   plane (a fixed-blur `boxShadow` — STATIC only; **never animate the blur radius**, `vg-known-bugs`). Flat
   fills are the sticker tell.

**Discipline:** all three are STATIC (or drift on a parallax plane) — zero animated blur/filter (render-safe).
Tokens only (`GRAIN_OP`, `LIGHT_X/Y`, `ACCENT_DIM` are placeholders → pull from THIS project's `D.*` + config;
never ship literal values). The combination — grain + a light pool + lit material on a 3-plane parallax —
is the difference between "looks like a slide" and "looks shot." (Verify: `vg-quality-animations` premium tell;
break the flat-2D ceiling further with real 3D/Lottie via `vg-remotion-engineering` for the ONE hero beat.)

## 8c. MOTION SYSTEMS — parameterized PARTICLES + ANIMATED lighting (the cheap-density engines)

§8b is the *static* surface; these are the *living* ambient systems that raise MOTION DENSITY
(`vg-quality-animations`) — reusable, parameterized, and **compositor-cheap** (transform / opacity /
gradient-position only — never an animated `filter`/`blur`, which hangs the render, `vg-known-bugs`). Build
them ONCE into the shared backdrop so every beat inherits them.

**PARTICLE FIELD (params: `count · speed · spawn · drift · depth`).** A drifting dust/spark field — the
single cheapest way to make every frame alive. Deterministic (seeded) so it's stable per render:
Tune per scene by emotion: calm = few/slow; chaos/destruction = many/fast + a burst on impact (spike COUNT
+ SPEED for ~10f at the hit). One helper, every scene different by params — not re-authored.

**ANIMATED LIGHT RIG (cheap, no blur).** §8b's key-light is static; make it *move* — the difference between
"a lit slide" and "a lit shot":
Rule: **light position + light opacity animate; light BLUR never does.** A sweeping key + a pulsing glow +
a moving specular = 3 live lighting systems, all free. (Real bloom for an actual light source = stacked
low-opacity screen-blend layers, `vg-code-animations`/`vg-remotion-engineering` — still no animated blur.)

## 8d. THE CATALOGS — material · lighting rig · particle types (what the compiler IR references by name)

The shot-sheet IR (`vg-motion-compiler`) tags each object with `material:` and references a lighting rig +
particle types. These are the parameterized catalogs the codegen reads — so "glass" or "rim light" or
"impact particles" means the SAME thing every scene (consistency), and each is compositor-cheap.

**MATERIAL catalog (`material:` → easing + light + secondary behaviour).** Don't move every object with one
generic spring — the implied material picks how it moves AND how light hits it:
| material | motion (easing/physics) | light signature | secondary |
|---|---|---|---|
| **paper** | light, flutters; bends on move; tears | matte, soft shadow | a fluttering edge / a slight bend trailing the move |
| **glass** (lens) | smooth glide, a touch of weight | a **specular that slides** as it moves + faint chromatic rim | refraction onto what's behind it |
| **metal** (machine) | rigid, hard snap, vibration | a **hard specular sweep** | a spark/rattle on impact |
| **glow** (light/answer) | massless, eases softly, no hard stops | IS light — bloom, no shadow | a halo that swells with value |
| **ink** (numbers/text) | stamps/prints, a firm land | flat, crisp | a tiny settle/bounce on land |

**LIGHTING RIG (each independently animated — cheap, position/opacity only, never blur).** A scene has up to:
`key` (the main sweeping source) · `fill` (soft opposite, lifts shadows) · `rim` (a bright edge on the lit
side of the hero) · `bounce` (color picked up from a nearby bright surface) · `ambient` (the overall floor) ·
`bloom` (on a real light source — stacked screen-blend layers) · `reflection` (a desk sheen). Animate
position (`lx/ly` sweep) + opacity (glow pulse) + which-plane-is-rim — never the blur radius. The IR's
`drives:` chain is what makes a light REACT (key brightens as the hero lands).

**PARTICLE TYPES (not one generic "dust" — pick the type the moment calls for, params from §8c).**
| type | when | look |
|---|---|---|
| **fg / bg dust** | always-alive ambient | slow drift, fg brighter/larger, bg dim/small (depth) |
| **paper particles** | the shred/tear (S3) | flat flakes, tumble + drag |
| **impact particles** | a slam/land (counter, win) | a short outward burst, then fall |
| **glow particles** | the discovery/answer (S6/S9) | soft rising motes near the lit cell |
| **spark particles** | the machine (metal) | quick bright flecks, fast decay |
| **debris** | collapse/destruction | heavier chunks, momentum + settle |
Each is the §8c particle field with different `count/speed/spawn/depth` — same engine, typed by the beat.

## 9. COMPOSITION CREATES EMOTION — pick the layout for the FEELING, not just to fit

Layout is not neutral — it sets emotional tone (film composition research). Match the composition to the
scene's emotional beat (the Creative Director's arc):

| Composition | Feeling it creates | Use for |
|---|---|---|
| **Centered / symmetrical** | order, control, authority, calm, the "thesis" | a definition, a verdict, the final thesis hold |
| **Off-center (rule of thirds)** | dynamic, forward motion, unresolved | a body beat that pushes to the next |
| **Tilted / asymmetric / low-angle** | unease, tension, instability, power | the Tension dip, a warning, "something's wrong" |
| **Negative space, small subject** | isolation, scale, awe, loneliness | a single shocking number, the Wonder beat, "one vs many" |
| **Dense / full-bleed, edge-to-edge** | overwhelm, magnitude, intensity | accumulation, "this is everything", chaos |

So a calm explainer beat is centered; the Tension beat tilts or goes off-balance; the awe/Wonder beat
puts one small element in a vast empty field. **Don't default every scene to the centered dashboard** —
that's why they all feel the same emotional register. Vary the composition WITH the emotional arc.

## 10. NON-DASHBOARD archetypes (break the "every scene is a dashboard" sameness)

The dashboard (§3) is ONE archetype. A video of nothing but dashboards habituates. Reach for these when
the beat calls for it (esp. the bespoke hero scene from `visual-story-engine`):
- **Full-bleed cinematic** — ONE giant element edge-to-edge, zero chrome, no cards (a Reveal/awe beat).
- **The stage** — a centered subject (a figure, an object, a metaphor) with an environment around it,
  not a panel grid (the metaphor-as-world scene — see `vg-code-artifacts` §world artifacts).
- **Asymmetric editorial** — rule-of-thirds, big negative space on one side, the subject on a third
  (a quote, a single stat, a "leaves you thinking" closer).
- **Interstitial / question card** — the act-boundary breath scene: ONE line (the chapter's question or
  thesis) in a vast, near-empty field, a few seconds long, with only minimal ambient life (a slow light
  drift, a breathing accent). Planned by `scene-planner` (`purpose: Interstitial`); judged as
  negative-space composition (§9) — EXEMPT from canvas-fill/density bars, the emptiness IS the design.
Each is a different FEELING (§9). One bespoke non-dashboard scene per video is the pattern interrupt.

## Before you write, confirm
- [ ] A title names the scene + a tiny uppercase subtitle names the sub-beat + a color underline
- [ ] Canvas filled: one hero panel (≥55%) + KPI cards + meters (not one lonely element)
- [ ] Panels are soft-shadow floating cards (consistent radius/shadow)
- [ ] A persistent reference card anchors the key constant (breathes)
- [ ] If the beat is long, sub-beats crossfade (title holds, subtitle swaps)
- [ ] A carried result docks to a corner instead of being wiped (continuity, not REPLACE)
- [ ] The composition was chosen for the scene's FEELING (§9), not defaulted to centered dashboard
- [ ] On any camera move, fg/mg/bg shift at DIFFERENT rates (parallax depth, §8) — not one flat plane
