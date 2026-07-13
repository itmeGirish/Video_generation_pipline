---
name: vg-code-images
description: AUTHOR-TIME code recipe for IMAGES in a bullet's render code — write cinematic motion (Ken Burns / push-in / logo pop) on every Img, a legibility overlay ≤0.6, and a zIndex:1 foreground wrapper. Use BEFORE/WHILE writing a bullet that has an image. Pairs with the verify gate vg-quality-images. Grounded in remotion images.md + vg-graphics-assets.
model: opus
---

# Code recipe — cinematic images

## Ken Burns backdrop (slow zoom + drift — never static)

## Logo pop (bouncy entrance + idle breathe; white chip)

## Anti-patterns

## Before you write, confirm
- [ ] Every `Img` has frame-driven motion (Ken Burns / push-in / logo pop) — never static
- [ ] Legibility overlay opacity ≤ 0.6 (tune to lowest readable; localized scrim if needed)
- [ ] Foreground wrapped in `AbsoluteFill {zIndex:1}` over the image
- [ ] Real image ONLY for a named real thing; subject matches the bullet's meaning (open the file)
- [ ] Logo on `D.white` chip, correct brand variant; base-name not reused in another scene
