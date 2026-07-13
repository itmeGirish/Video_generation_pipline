---
name: vg-quality-timing
description: Production-quality gate for TIMING — easing & physics. Scores a scene 0-10 on whether motion eases (never linear), uses the right spring preset, times phases as durationInFrames fractions, clamps interpolate, and lands confidently. Grounded in remotion timing.md. Use after a scene renders, when motion feels robotic/mechanical/abrupt or has a dead static tail. One of the 8 visual-quality factors (see vg-visual-quality).
model: opus
---

# Quality Factor 2 — Timing (easing & physics)

Source of truth: `remotion/rules/timing.md` + conventions Motion discipline. Linear motion
is the clearest "amateur" tell; easing is what makes motion feel intentional.

> ⛔ **Score from the FILMSTRIP, not one frame.** Easing is *temporal* — a single still can't tell linear
> from eased. Read p10/p30/p50/p70/p90: eased motion ACCELERATES then settles (bigger steps early, tiny
> at the end); linear moves equal distance every frame. Overshoot = it passes the target then eases back.
> One frame = you scored layout, not timing. (Strip extraction: `vg-visual-quality` / protocol Layer 1.5.)

## What production-grade looks like (10)
- **Every reveal is eased** — `Easing.out(Easing.cubic)` for things ARRIVING (counter landing,
  bar filling, slide-in: fast→slow, confident); `Easing.inOut(Easing.cubic)` for travel A→B.
  Linear ONLY for continuous ambient loops (steady drift/scan).
- **Spring preset matches intent:** snappy `{damping:20,stiffness:200}` (cards/labels),
  bouncy `{damping:8}` (hero numbers/punchlines), heavy `{damping:15,stiffness:80,mass:2}`
  (big dramatic tiles), smooth `{damping:200}` (subtle text/ambient).
- **Phases are `durationInFrames` fractions**, final ~0.95 (no dead tail); motion visible
  the whole window.
- **`interpolate` clamped both sides** (`extrapolateLeft`+`extrapolateRight:'clamp'`).

## Failure signals (low)
- Bare `interpolate(frame,[0,30],[0,X])` — linear, mechanical.
- Unnamed/wrong spring (a hero number with `damping:200` feels dead; a label with `damping:8`
  wobbles wrong).
- Phases as frame literals; last phase finishes early → static tail (freeze).
- Unclamped easing → out-of-range values flashing before/after the input range.

## The fix
Add `easing` to every reveal (out-cubic arriving, inout travelling); swap the spring config to
the intent-matched preset; rewrite phase times as `durationInFrames*0.3/0.6/0.95`; add
`extrapolateLeft/Right:'clamp'` to every interpolate.

## 0–10 rubric
- **9–10:** all reveals eased + intent-matched springs + fraction phases (final ~0.95) + clamped.
- **7–8:** mostly eased/clamped; one linear reveal or one slightly-off spring.
- **5–6:** several linear reveals; springs present but generic; phases ok.
- **3–4:** mostly linear/mechanical, or a dead static tail (>3s) from frame-literal phases.
- **0–2:** unclamped flashes, or no easing/physics at all.

**Gate:** < 7 → REVISE. A linear reveal of a hero/landing element caps the scene at ≤4.
Report the worst offender + the exact easing/spring to apply.
