---
name: vg-code-sequencing
description: AUTHOR-TIME code recipe for SEQUENCING in a bullet's render code — stagger multi-element reveals with per-element delay, lead-and-follow, and cause→effect order so one hero leads the eye. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-sequencing. Grounded in remotion sequencing.md + the findWord/findWordEnd bindings.
---

# Code recipe — stagger & choreography

## Stagger N elements with a per-element delay
```js
const items = DATA.map((d, i) => {
  const delay = i * 8;                                  // ~8 frames between entrances
  const s = spring({frame, fps, delay, config:{damping:20, stiffness:200}});  // snappy
  const y = interpolate(s,[0,1],[Math.round(h*0.05),0]);
  return React.createElement('div',{key:i, style:{transform:`translateY(${y}px)`, opacity:s, ...}}, d.label);
});
```

## Lead-and-follow (hero lands first, support follows ~8f later)
```js
const heroS  = spring({frame, fps, config:{damping:12, stiffness:80, mass:2}});      // heavy hero
const labelS = spring({frame, fps, delay:8, config:{damping:20, stiffness:200}});    // label follows
```

## Cause→effect (next element keys off the prior's landing, or the spoken word)
```js
const barFull = interpolate(frame,[0, durationInFrames*0.5],[0,1],{extrapolateRight:'clamp', easing:Easing.out(Easing.cubic)});
const valuePop = spring({frame: frame - Math.round(durationInFrames*0.5), fps, config:{damping:8}}); // pops AFTER bar fills
// or tie a sub-beat to the actual spoken word:
const at = findWord('explodes') ?? Math.round(durationInFrames*0.6);   // bullet-relative frame
```

## Anti-patterns
```js
// ❌ everything enters on the same frame (a slide reveal, not animation):
const op = interpolate(frame,[0,12],[0,1]);   // applied to ALL elements at once
// ❌ two equal elements animating identically → no hero, eye has no path
```

## Before you write, confirm
- [ ] Multi-element beats use a per-element `delay` (stagger), not one shared opacity
- [ ] A hero lands first; supporting labels/values `delay` after it
- [ ] Cause→effect chains use the prior landing frame (or `findWord`/`findWordEnd`)
- [ ] Exactly ONE element leads the eye at a time
