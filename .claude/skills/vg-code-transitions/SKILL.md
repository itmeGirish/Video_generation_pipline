---
name: vg-code-transitions
description: AUTHOR-TIME code recipe for TRANSITIONS in a bullet's render code — write REPLACE backdrops as a full AbsoluteFill D.bg (no leak), exit/settle held elements, and carry an element across a cut for a match-cut. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-transitions. Grounded in remotion transitions.md + vg-scene-transitions.
---

# Code recipe — clean handoffs

## REPLACE backdrop = full AbsoluteFill (never a position:absolute div)
```js
// ✅ covers ALL prior content — no bleed-through
const bgOp = interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp', extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor: D.bg, opacity: bgOp}},
  /* new content on top */ );
// ❌ leaks the previous bullet:
// React.createElement('div',{style:{position:'absolute', inset:0, backgroundColor:D.bg}})
```

## Image-backdrop bullet → foreground in its own zIndex:1 AbsoluteFill
```js
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg}},
  React.createElement(AbsoluteFill,{style:{overflow:'hidden'}}, /* Img + overlay */),
  React.createElement(AbsoluteFill,{style:{zIndex:1, display:'flex', ...}}, /* text/elements */));
```

## Match-cut / carry-over (continuity across a cut)
Keep a shared element (a number/shape/color) at the SAME position+token entering the next
bullet so it reads as continuous, not a reset.

## Avoid double-dark
Don't stack a scene-boundary crossfade with a from-black bullet-1 backdrop fade — pick ONE.
Within a scene, a REPLACE's `bgOp` 0→1 over ~8f is enough; the stitch handles scene crossfade.

## Anti-patterns
```js
// ❌ position:absolute inset:0 div as REPLACE backdrop → prior bullet bleeds through
// ❌ opacity hitting exactly 1.0 on a flex child over an absolute backdrop → stacking-context drop
//    (wrap foreground in AbsoluteFill zIndex:1)
// ❌ element pops out while the next pops in with no settle/exit → whiplash
```

## Before you write, confirm
- [ ] REPLACE backdrop is `AbsoluteFill` with `D.bg` (not a `position:absolute` div)
- [ ] Image bullets wrap foreground in `AbsoluteFill {zIndex:1}`
- [ ] Held elements settle (don't freeze) and exit cleanly on REPLACE
- [ ] No competing fade that would double-dark the boundary
