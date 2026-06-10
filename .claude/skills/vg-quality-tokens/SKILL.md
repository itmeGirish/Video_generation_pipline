---
name: vg-quality-tokens
description: Production-quality gate for DESIGN-TOKEN CONSISTENCY. Scores 0-10 on zero literals (no hex/px/font-name), consistent color identity (each entity keeps its token across the whole video), and on-scale typography. Grounded in video-generation-conventions. Use after a scene renders or while auditing bullet code, when colors drift between scenes, a stray hex/px appears, or type looks inconsistent. One of the 8 visual-quality factors (see vg-visual-quality).
---

# Quality Factor 7 — Design-token consistency

Source of truth: `remotion/rules/video-generation-conventions.md` (Design tokens only).
Consistency is what makes a series look like ONE brand instead of ad-hoc slides.

## What production-grade looks like (10)
- **Zero literals.** Every color is a `D.*` token, every font `D.font_display`/`D.font_mono`,
  every size a fraction of `w`/`h`, every fps/dim a binding. No `#00F0FF`, `'Inter'`, `32`, `1920`.
- **Color identity holds across the whole video** — each entity keeps the SAME token in every
  scene (4.8 = cyan everywhere, cost = amber everywhere, failure = red, success = green).
- **Typography on scale** — body ≥ `w*0.009`, headline ≥ `w*0.022`; key labels never on `D.text_dim`.
- Consistent corner radii, stroke weights, and surface tokens scene-to-scene.

## Failure signals (low)
- Any hex / px / font-family literal in bullet code (also V3 fail; trips the validator).
- An entity changes color between scenes (cyan in S1, green in S4) → viewer loses the thread.
- Sub-threshold or `D.text_dim` key text.
- Ad-hoc radii/strokes/surfaces that differ per scene → looks unbranded.

## The fix
Replace every literal with the matching `D.*` token / `w`,`h` fraction; lock each entity to one
token and apply it everywhere; bump sub-threshold text to the readable minimum; standardize
radius/stroke/surface to tokens. Grep the bullet code for `#`, `px`, and font-name strings.

## 0–10 rubric
- **9–10:** zero literals, color identity perfectly consistent across scenes, type on scale.
- **7–8:** tokens only, but one entity's color or one type size drifts slightly.
- **5–6:** mostly tokens; a couple of inconsistencies or a borderline-small label.
- **3–4:** a hex/px/font literal present, OR an entity visibly changes color between scenes.
- **0–2:** literals throughout; no consistent color identity.

**Gate:** < 7 → REVISE. Any literal (V3) or cross-scene color-identity break caps the scene at ≤4.
Report the literal/inconsistency + the token to use.
