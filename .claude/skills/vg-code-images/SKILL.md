---
name: vg-code-images
description: AUTHOR-TIME code recipe for IMAGES in a bullet's render code — write cinematic motion (Ken Burns / push-in / logo pop) on every Img, a legibility overlay ≤0.6, and a zIndex:1 foreground wrapper. Use BEFORE/WHILE writing a bullet that has an image. Pairs with the verify gate vg-quality-images. Grounded in remotion images.md + vg-graphics-assets.
---

# Code recipe — cinematic images

## Ken Burns backdrop (slow zoom + drift — never static)
```js
const kb = interpolate(frame,[0, durationInFrames],[1.06, 1.18],
  {extrapolateLeft:'clamp', extrapolateRight:'clamp'});            // zoom 1.06→1.18 across the bullet
const driftX = interpolate(frame,[0, durationInFrames],[0, Math.round(w*-0.02)],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg}},
  React.createElement(AbsoluteFill,{style:{overflow:'hidden'}},
    React.createElement(Img,{src: staticFile('img/win_senior.jpg'),
      style:{width:'100%', height:'100%', objectFit:'cover',
             transform:`scale(${kb}) translateX(${driftX}px)`}}),
    React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg, opacity:0.45}})),   // overlay ≤0.6
  React.createElement(AbsoluteFill,{style:{zIndex:1, display:'flex', /* text */ }}, /* … */));
```

## Logo pop (bouncy entrance + idle breathe; white chip)
```js
const pop = spring({frame, fps, config:{damping:8}});                 // bouncy
const breathe = 1 + 0.02*Math.sin(frame*0.1);
React.createElement('div',{style:{backgroundColor:D.white, borderRadius:Math.round(w*0.01), padding:Math.round(w*0.012)}},
  React.createElement(Img,{src:staticFile('img/cisco_logo-3.png'),
    style:{transform:`scale(${pop*breathe})`, height:Math.round(h*0.12)}}));
```

## Anti-patterns
```js
// ❌ static Img (no transform driven by frame) → A4 freeze fail
// ❌ overlay opacity 0.8 → photo goes near-black (reads as text-on-black)
// ❌ logo on a D.surface dark chip → washes out; use D.white + verify the right brand variant
// ❌ real photo for an abstract concept/number → use a vector instead
```

## Before you write, confirm
- [ ] Every `Img` has frame-driven motion (Ken Burns / push-in / logo pop) — never static
- [ ] Legibility overlay opacity ≤ 0.6 (tune to lowest readable; localized scrim if needed)
- [ ] Foreground wrapped in `AbsoluteFill {zIndex:1}` over the image
- [ ] Real image ONLY for a named real thing; subject matches the bullet's meaning (open the file)
- [ ] Logo on `D.white` chip, correct brand variant; base-name not reused in another scene
