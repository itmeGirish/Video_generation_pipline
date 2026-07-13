---
name: vg-quality-sequencing
description: Production-quality gate for SEQUENCING — stagger & choreography. Scores a scene 0-10 on whether multi-element beats reveal in a deliberate order (per-element delay, lead-and-follow, cause→effect) with one hero leading the eye, instead of everything appearing at once. Grounded in remotion sequencing.md. Use after a scene renders, when a beat dumps everything simultaneously or feels chaotic/flat. One of the 8 visual-quality factors (see vg-visual-quality).
model: opus
---

# Quality Factor 3 — Sequencing (stagger & choreography)

Source of truth: `remotion/rules/sequencing.md`. A beat is a small scene with an ORDER —
elements should arrive in a choreographed sequence, not all at frame 0.

> ⛔ **Score from the FILMSTRIP, not one frame.** Stagger is *temporal* — at the settled frame everything
> is already in place, so a staggered cascade and a frame-0 dump look identical. Read p10/p30/p50/p70/p90:
> do elements arrive ONE BY ONE across the strip (stagger), or are they all present by p10 (no order)?
> does the hero land first and support follow? (Strip extraction: `vg-visual-quality` / protocol Layer 1.5.)

## What production-grade looks like (10)
- **Stagger:** multiple elements enter one-by-one with a per-element delay (e.g. 8–15 frames
  each), never all at once.
- **Lead and follow:** the hero element lands first; supporting labels/values follow ~6–10
  frames later.
- **Cause and effect:** one element's motion triggers the next (bar fills → its value pops →
  a check stamps). The order tells a micro-story.
- **One hero leads the eye**, the rest are clearly secondary.

## Failure signals (low)
- Everything pops in on the same frame (a "slide reveal," not an animation).
- No order — labels, shapes, numbers all arrive together → the eye has no path.
- Two equal elements compete for attention (no lead/follow).
- A list/grid with no stagger.

## The fix
Add per-element delays (`delay: i * 12` or staggered interpolate offsets); land the hero
first, then cascade the support; chain cause→effect (next element keys off the prior's
landing frame, e.g. via `findWord`/phase fractions). Demote everything but one hero.

## Did the render honor the beat's `animation_pattern`? (the compiled choreography)
If the beat carries an `animation_pattern` (from the script), the filmstrip must MATCH it — this is the
spec, not a suggestion:
- **domino** → each element starts as the prior LANDS (causal chain visible), not a uniform tick.
- **morph** → ONE continuous transform across the strip, NO discrete cuts/stagger.
- **cascade/bloom** → a staggered wave; for `bloom from-center` it radiates outward, `left-to-right` sweeps by x.
- **together** → genuinely simultaneous (the one case where frame-0 arrival is CORRECT).
- **compare** → two sides in parallel, then the winner emphasized.
Mismatch (e.g. a `domino` rendered as a frame-0 dump, or a `morph` rendered as 3 cuts) → REVISE, cap ≤5.

## 0–10 rubric
- **9–10:** clear staggered cascade, lead-and-follow, cause→effect order, one hero leads; the beat's `animation_pattern` is visibly honored.
- **7–8:** staggered but flat ordering, or hero/support hierarchy slightly unclear.
- **5–6:** partial stagger; some elements still arrive together.
- **3–4:** mostly simultaneous; no clear order or hero.
- **0–2:** everything at frame 0; chaotic or flat.

**Gate:** < 7 → REVISE. A multi-element beat with zero stagger caps the scene at ≤4.
Report the beat + the stagger/order to apply.
