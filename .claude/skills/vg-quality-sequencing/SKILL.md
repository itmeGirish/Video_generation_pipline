---
name: vg-quality-sequencing
description: Production-quality gate for SEQUENCING — stagger & choreography. Scores a scene 0-10 on whether multi-element beats reveal in a deliberate order (per-element delay, lead-and-follow, cause→effect) with one hero leading the eye, instead of everything appearing at once. Grounded in remotion sequencing.md. Use after a scene renders, when a beat dumps everything simultaneously or feels chaotic/flat. One of the 8 visual-quality factors (see vg-visual-quality).
---

# Quality Factor 3 — Sequencing (stagger & choreography)

Source of truth: `remotion/rules/sequencing.md`. A beat is a small scene with an ORDER —
elements should arrive in a choreographed sequence, not all at frame 0.

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

## 0–10 rubric
- **9–10:** clear staggered cascade, lead-and-follow, cause→effect order, one hero leads.
- **7–8:** staggered but flat ordering, or hero/support hierarchy slightly unclear.
- **5–6:** partial stagger; some elements still arrive together.
- **3–4:** mostly simultaneous; no clear order or hero.
- **0–2:** everything at frame 0; chaotic or flat.

**Gate:** < 7 → REVISE. A multi-element beat with zero stagger caps the scene at ≤4.
Report the beat + the stagger/order to apply.
