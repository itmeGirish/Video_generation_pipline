---
name: vg-code-motion-bank
description: AUTHOR-TIME motion-design pattern bank modeled on top technical-explainer channels (the commitlog house style). The ONE principle — scaffold → fill with value-driven motion → payoff — plus copy-paste code for the signature builds (scaffold-then-fill, value-growth + synced counter, count-up number, staggered fill, state-change recolor+pulse, comparison into reserved space, payoff-lands-last, persistent reference card, curve draw). Use WHILE writing a data/diagram bullet so the motion reads as professional "data settling into place." Grounded in remotion timing.md/sequencing.md + vg-code-animations/timing/sequencing.
model: opus
---

# Motion-design bank — "scaffold → fill → payoff"

The house style of premium technical explainers: restrained, value-driven, confident.
**One principle:** draw the SCAFFOLD first (container/axes/track/empty grid + title), then
animate the DATA into it with eased value motion and counting numbers, then land a PAYOFF
line last. Feel = `Easing.out(Easing.cubic)`, numbers counting, gentle springs — never
flashy. Nothing freezes (hold-alive breathe/pulse on held elements).

## ⭐ THE ONE-VALUE LAW (what makes motion read as ENGINEERED, not decorated)

Every beat has **ONE driving value** — a single frame-interpolated progress/quantity — and the
counter, the geometry (bar heights, fills, positions), and the colors/states are ALL **functions of
that one value**. Nothing in the beat is separately keyframed: when the number moves, the diagram and
the state colors move *because they derive from the same driver*. This is why premium explainers feel
mechanical-precise — number, picture, and color can never disagree, and cause→effect is literal (one
prop changes → everything downstream re-derives). Corollaries:
- Author the driver first (`interpolate(frame, phase, [from,to])`, values from the CONTRACT), then
  express every element as a pure function of it. If an element needs its own timeline, it's a
  different beat.
- A parameter beat (a visible control/slider) is the same law with the control as the driver.
- Stagger/sequencing offsets phase per element (`vg-code-sequencing`), but each element still reads
  the shared driver — offset, not independent.

## Topic-agnostic — the patterns are universal, the data is swappable
These are NOT about tokens/caches. Map any topic to a pattern:

| Your beat is about… | Pattern |
|---|---|
| a quantity growing/shrinking (cost, users, memory, speed) | P2 value-growth + counter |
| a breakdown / what-it's-made-of (a formula, a budget, a bill) | P10 formula-fill / stacked build |
| a sequence / process / pipeline (steps, requests, stages) | P4 staggered fill + P11 linked-highlight |
| before/after or A vs B (old vs new, us vs them) | P6 comparison into reserved space |
| a state flip good→bad (works→breaks, valid→invalid, safe→leaked) | P5 recolor + pulse |
| a conclusion / takeaway | P7 payoff lands last |
| a constant the viewer must keep in mind | P8 persistent reference card |
| a trend over time / a curve | P9 line draws into axes |

Example (non-token): "a startup burns its runway" → P1 scaffold a money bar + months axis →
P2 the bar DRAINS while a `$1.2M → $0` counter falls (ease-out) → P5 it turns red near zero +
pulses → P7 payoff "11 months left." Same code, different labels.

## P1 — Scaffold-then-fill (reserve space first)

## P2 — Value-growth + SYNCED counter (the core build)

## P3 — Count-up number (incl. the "X to Y" dual count)

## P4 — Staggered fill (bars / cells / token boxes one-by-one)

## P5 — State-change recolor + pulse (e.g. cache invalidation)

## P6 — Comparison slides into RESERVED space (after the first lands)

## P7 — Payoff lands LAST (the takeaway pill/caption)

## P8 — Persistent reference card (breathes the whole scene)

## P9 — Curve / line draw into axes

## P10 — Formula / breakdown fill (terms populate, then collapse to result)

## P11 — Linked highlight (activating A lights up related B)

**⛔ CONNECTOR REGISTRATION (the law for ANY drawn link/beam/arrow/leader line).** A connector names two
elements; its endpoints must be **DERIVED from the same layout variables that place those two elements** —
one geometry source, so the line *cannot* miss what it names. Guessed endpoint constants next to computed
element layout = two sources of truth for one relationship → guaranteed misregistration.
- **Both endpoints resolve to element coordinates**: source = the element's computed center/edge, target =
  the named row/cell/region's own position variables. If an element is flex/grid-placed and its coordinates
  aren't derivable, PLACE IT at computed positions instead — a connector may never point at a guess.
- **The pairing comes from the CONTRACT** (the Connect event's source → target map), never invented at
  codegen. No map in the beat = route back, don't improvise one.
- **One link fires at a time** (stagger per `vg-code-sequencing`) — the eye follows one match; N simultaneous
  crossing lines is spaghetti regardless of registration.
- **The landing triggers the target's reaction** (the cell ignites / the row highlights — P5 on arrival).
  A connector whose target stays inert is a decorative line, not a taught relationship.
- **Technique note:** rotated-div beams are the render-safe build (a full-canvas animated `<svg>` hung a
  headless render >180s) — keep the technique; compute its `len`/`angle` FROM the two derived endpoints.

## P12 — Stream / type-on as the SUBJECT (the process of production IS the concept)

When the beat's concept is *something being produced piece by piece* (text generating, a log filling, a
message arriving, items emitted over time), the type-on IS the subject — not a caption effect. Build it
frame-driven: reveal the content unit-by-unit (word/token/line) at a FIXED rate derived from the concept's
real cadence, with a caret/cursor at the leading edge (the eye's anchor) and a small live rate/progress
readout (`Kit.Tag`/`Counter`) that makes the cadence measurable, not just felt. `slice()` the content by
`Math.floor(frame/RATE)` — never CSS animation. Exempt from the text-motion-ratio cap ONLY when the
production process is the beat's point (the exemption is the concept, not the styling); a title flying in
is still text-motion. Pair with a ticking timeline/ruler if the beat's claim is about the RATE itself.

## OPERATOR HELPERS — the SUBJECT-TRANSFORM kit (make the hero MOVE, as a function call)

The P-patterns above are *data settling in*. These are the **anti-PPT operators** — ready helpers so authoring
"the SUBJECT transforms" is a call, not bespoke React each scene. Each takes an OBJECT (an element/render) + a
fire frame, and returns the transformed object. (Pass the SUBJECT region's box to `vg-quality-animations`
§SUBJECT-MOVED so the SSIM check knows where to look.) `at` = the bullet-relative fire frame (use `findWord`).
**The rule:** the hero of every beat is built with ONE of these (it MOVES/BECOMES/CLIMBS/DIES) — `Enter`(fade)
+ `Camera` + ambient is the SLIDE fallback. If you reached for an opacity-fade as the main event, reach for an
operator instead. (These satisfy `vg-quality-animations` §SUBJECT-MOVED by construction: the subject's pixels
genuinely change p10→p90.)

## The beat timeline (how to assemble)
```
0.00–0.10  scaffold in (container/axes/track/title)        P1
0.10–0.55  hero value grows + counter ticks (ease-out)     P2/P3, staggered if multi  P4
0.45       state change recolor+pulse (if any)             P5
0.55–0.75  comparison slides into reserved space           P6
0.80–0.95  payoff pill/caption lands                       P7
whole beat persistent reference card breathes              P8
```

## Before you write, confirm
- [ ] Scaffold drawn first; all space reserved up front (no mid-beat reflow/jump)
- [ ] Hero value GROWS with a SYNCED counting number, `Easing.out(Easing.cubic)`
- [ ] Multi-element parts stagger (per-index delay), one hero leads
- [ ] State changes recolor AND keep a pulse (changed elements stay alive)
- [ ] Comparison enters pre-reserved space AFTER the hero lands (not at frame 0)
- [ ] A payoff line lands last (~0.8 of the beat)
- [ ] A persistent reference/context element breathes; nothing freezes
- [ ] **DENSITY (non-negotiable):** numbers COUNT up (never just appear); a scaffold is drawn
      first; every element is labeled (tiny uppercase mono); the canvas is FILLED (reference
      card / KPI chips / axis / gridlines) — no big empty regions; something moves the whole beat.
      A thin, sparse, static-after-growth frame reads amateur and fails `vg-quality-animations`.
