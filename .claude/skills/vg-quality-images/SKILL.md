---
name: vg-quality-images
description: Production-quality gate for IMAGES — cinematic asset quality. Scores 0-10 on whether real images are used only for named real-world things, each carries cinematic motion (Ken Burns / push-in / logo pop), legibility overlay ≤0.6, and the subject matches the meaning — never a static photo (freeze) or wrong-subject stock. Grounded in remotion images.md + vg-graphics-assets. Use after a scene with images renders, or when a photo feels static/stocky/wrong. Score N/A if the scene has no images. One of the 8 visual-quality factors (see vg-visual-quality).
---

# Quality Factor 6 — Images (cinematic asset quality)

Source of truth: `remotion/rules/images.md` + `vg-graphics-assets` + project image rules
(CLAUDE.md #11–14). If the scene has NO images, score **N/A** (exclude from the total).

## What production-grade looks like (10)
- **Real image only for a named real-world thing** (a specific logo, person, place, product);
  abstract concepts/metaphors/numbers use vector, not stock photos.
- **Every image MOVES cinematically:** Ken Burns (slow zoom 1.05→1.20 + drift), push-in
  (scale-settle + fade), or logo pop (bouncy spring + idle breathe). A static image = freeze fail.
- **Legibility overlay ≤ 0.6** — the photo stays visible; text over it has a localized scrim +
  `textShadow`, not a blanket near-black wash.
- **Subject matches meaning** — the photo's content serves the bullet's point (adult-worker
  thesis → adult worker, not a classroom). Logos are the correct brand variant on a light chip.
- No on-frame source citations.

## Failure signals (low)
- A photo sits static for >3s (A4 freeze).
- Stock-photo filler behind a stat/metaphor (should be vector).
- Wrong-subject image picked only because its filename was unused.
- Overlay so dark the photo is invisible (reads as text-on-black).
- A logo on a dark chip / wrong brand variant; or a reused base-name across scenes.

## The fix
Swap concept/metaphor/number photos to vector; add cinematic motion to every kept image;
drop overlay to 0.35–0.55 with a localized scrim for text; re-pick the image so its SUBJECT
matches the bullet's meaning (open the file, don't trust the name); use a light logo chip.

## 0–10 rubric
- **9–10:** real-for-real, all images move cinematically, overlay tuned, subject matches meaning.
- **7–8:** good, but one image's motion is subtle or one overlay slightly heavy.
- **5–6:** an image is near-static, or one subject is a loose fit.
- **3–4:** a static image (freeze), wrong-subject stock, or photo lost under a dark overlay.
- **0–2:** static stock filler dominating; reused/again wrong-subject images.

**Gate:** < 7 → REVISE. Any static image (freeze) or wrong-subject stock caps the scene at ≤4.
Report the image + the motion/overlay/subject fix. (No images → N/A.)
