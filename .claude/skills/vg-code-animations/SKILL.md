---
name: vg-code-animations
description: AUTHOR-TIME code recipe for writing RICH, MEANINGFUL motion in a bullet's React.createElement code — layered entrance (2-3 transforms) + supporting motion + hold-alive, all frame-driven and mapping to meaning. Use BEFORE/WHILE writing a bullet's code (not after render). Pairs with the verify gate vg-quality-animations. Grounded in remotion animations.md + DynamicBlock bindings.
---

# Code recipe — rich, meaningful motion

Write this into the bullet code up front. Goal: a layered entrance + ≥1 supporting motion +
hold-alive, all `frame`-driven, with motion that MAPS to meaning. (Verify after render with
`vg-quality-animations`.)

## The pattern (copy, then fill with the beat's meaning)
```js
// hero: layered entrance (scale + rise + opacity), eased spring
const inSpr = spring({frame, fps, config:{damping:20, stiffness:200}});      // snappy
const heroY = interpolate(inSpr,[0,1],[Math.round(h*0.06),0]);
const heroS = interpolate(inSpr,[0,1],[0.86,1]);
const heroOp = interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
// hold-alive: subtle breathe the whole window (never freezes)
const breathe = 1 + 0.015*Math.sin(frame*0.12);
const hero = React.createElement('div',{style:{
  transform:`translateY(${heroY}px) scale(${heroS*breathe})`, opacity:heroOp, color:D.cyan, ...}}, '…');
// supporting motion: a glow/label that follows ~8 frames later (see vg-code-sequencing)
```

## Map motion to meaning (pick the transform from the verb)
| Meaning | Code move |
|---|---|
| more / growth | height/width grows, value counts up |
| less / shrink | scale/height decreases |
| gap widens | two elements `translateX` apart |
| impact | scale overshoot + 2-frame shake, heavy spring |
| arrives | eased `interpolate` (out-cubic) into place |

## Anti-patterns (do NOT write)
```js
// ❌ bare fade as the whole animation — reads as a slide
const op = interpolate(frame,[0,15],[0,1]);
return React.createElement('div',{style:{opacity:op}}, '…');
// ❌ enters then frozen (no hold-alive) → freeze fail
// ❌ CSS transition/animation or Tailwind animate-* → silently dropped in render
// ❌ a decorative sweeping BAR/BEAM/dot added ONLY to beat the freeze gate
//    const pp=(frame*0.02)%1; <div style={{left:px(pp), width:w*0.04, height:h*0.3, background:D.cyan}}/>
//    → reads as a meaningless floating block gliding across the scene; the viewer asks "what is that?"
```

## ⛔ Anti-freeze must be MEANINGFUL — never a free-floating beam (real miss, fable_5_power S2, 2026-06-14)
A long/establishing beat that sits static fails A4. The WRONG fix (and a real lapse) is to drop in a
decorative sweeping bar/beam/scan-line just to register motion — it reads as a random moving block with
no meaning and the viewer notices it as noise. **Anti-freeze motion must carry meaning.** In priority order:
1. **Animate the actual subject** — advance the runner, drain/fill the real gauge, tick the counter, light
   the next step. The thing the beat is ABOUT should be what moves.
2. **Animate the scaffold being built** — a "drawing head" glow at the leading edge of a line/track being
   laid (the track extending toward the horizon), a bar filling, a diagram wiring up. The construction IS
   the motion and it means something.
3. **Subdivide the beat** — if a 12–15s beat has genuinely nothing to move, it's too long for ONE beat:
   evolve it through sub-phases (state A → state B → state C), each a real change (`script-animation-bullets`
   §Rhythm). A breathing hero + a real phase change every few seconds beats any sweeping beam.
A motion you can't name the MEANING of (apply the purpose test) is decoration — cut it, don't ship it to
pass freezedetect.

## Before you write, confirm
- [ ] Hero has ≥2 layered transforms (not opacity-only)
- [ ] ≥1 supporting motion (glow pulse / drift / counter / particle)
- [ ] A hold-alive motion runs the WHOLE window (breathe ±1-2% / pulse / counter)
- [ ] The motion's direction/size encodes the point (muted test passes)
- [ ] One hero leads; everything else supports (see vg-code-sequencing)
- [ ] All motion is `frame`-driven (no CSS/Tailwind animation)
