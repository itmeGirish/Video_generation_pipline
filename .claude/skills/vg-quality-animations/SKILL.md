---
name: vg-quality-animations
description: Production-quality gate for ANIMATION RICHNESS & MEANING — scores a scene's motion 0-10. Grounded in remotion animations.md. A beat must be a layered entrance + choreographed order + ≥1 supporting motion, all serving ONE clear meaning; never a bare fade or one-move-then-frozen. Use after a scene renders (score from frames), when motion looks flat/amateur/decorative, or before advancing a scene. One of the 8 visual-quality factors (see vg-visual-quality).
---

# Quality Factor 1 — Animation richness & meaning

Score from the EXTRACTED FRAMES (not the code). Source of truth: `remotion/rules/animations.md`
+ video-generation-conventions Motion discipline. This is the #1 separator between an
"AI slideshow" and a Fireship/Kurzgesagt render.

## What production-grade looks like (10)
- Each beat = a **layered entrance** (2–3 transforms: slide+scale+slight-rotate, not one move)
  + **choreographed order** (a hero lands, supporting labels follow) + **≥1 supporting motion**
  (glow pulse, particle, drifting backdrop) — all serving ONE clear meaning.
- **Motion maps to meaning:** up=more, down=less, apart=growing gap, converge=agreement,
  fast=sudden, big=dominant. The movement itself teaches the point.
- **Muted test passes:** with audio off, the motion alone makes the point.
- **One hero leads the eye** per beat; the rest support or hold.

## Failure signals (low)
- Bare opacity fade as the whole animation; element enters then freezes.
- Lots of motion that explains nothing (spinning shapes, drifting particles as the main event).
- Motion contradicts meaning (a "rising cost" bar that shrinks).
- Two unrelated things animate equally → split attention.
- Decoration IS the main event; nothing teaches.
- **THIN / sparse beat (the #1 real-world miss):** one element on a near-empty canvas; numbers
  that just APPEAR instead of counting up; no scaffold; almost no labels; static after the
  entrance. It animates but reads amateur. If half the canvas is empty and nothing is counting
  or moving at the midpoint, it's thin → fails. (See `vg-code-motion-bank` + `vg-code-composition`
  density; script side `script-animation-bullets` §Density bar.)

## The fix
Rebuild the beat: pick the script verb → make the visual DO it; layer 2–3 transforms on the
hero; stagger the supporting elements; add one supporting motion; ensure the direction/size
encodes the meaning. Cut decoration that doesn't serve the one point.

## 0–10 rubric
- **9–10:** layered + choreographed + supporting motion, meaning unmistakable muted, one hero leads.
- **7–8:** real entrance + some support, meaning clear, but a bit thin or one missed hero.
- **5–6:** single transform, mostly one-move; meaning needs the narration; little support.
- **3–4:** bare fades or motion that doesn't map to meaning; or competing motions.
- **0–2:** static/frozen, or pure decoration that teaches nothing.

**The purpose test (governs both directions):** every motion must help the viewer *understand*,
*emphasize a key moment*, or *improve engagement*. Ask of each animation: "what does this help the
viewer do?" No answer → it's decoration → cut it. This cuts BOTH ways:
- **Thin/sparse** (empty canvas, numbers that appear vs count, no labels) caps the scene at **≤5** —
  density that serves comprehension is required.
- **Over-animated** (motion with no purpose, principles forced onto every element, busy/competing
  movement that adds load not clarity) ALSO caps at **≤5** — clarity beats complexity.
The target is the middle: *as much motion as serves understanding, and no more.*

**Gate:** < 7 → REVISE the beat. A frozen/decorative-only beat caps at ≤4. Report the weakest
beat + the one change that raises it most (add a purposeful counter/scaffold/label if thin;
remove purposeless motion if busy).
