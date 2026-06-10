---
name: vg-code-timing
description: AUTHOR-TIME code recipe for TIMING in a bullet's render code — ease every reveal (never linear), use the intent-matched spring preset, write phases as durationInFrames fractions, and clamp every interpolate. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-timing. Grounded in remotion timing.md.
---

# Code recipe — easing & physics

## Ease every reveal (the #1 author-time fix)
```js
// ✅ arriving (counter/bar/slide-in): fast→slow, confident
const v = interpolate(frame,[0, durationInFrames*0.6],[0, FINAL],
  {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic)});
// ✅ travelling A→B
const x = interpolate(frame,[a,b],[x0,x1],
  {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.inOut(Easing.cubic)});
// linear ONLY for an ambient loop (drift/scan), never a reveal
```

## Spring presets — match physics to intent (config values, copy exactly)
```js
const snappy = {damping:20, stiffness:200};            // cards, labels, list items
const bouncy = {damping:8};                            // hero numbers, punchlines
const heavy  = {damping:15, stiffness:80, mass:2};     // big tiles, dramatic slams
const smooth = {damping:200};                          // subtle text, ambient
const s = spring({frame, fps, config: bouncy});
```

## Phases as durationInFrames fractions (never frame literals)
```js
const p1 = durationInFrames*0.30, p2 = durationInFrames*0.60, p3 = durationInFrames*0.95; // final ~0.95, no dead tail
```

## Anti-patterns
```js
// ❌ linear (mechanical):            interpolate(frame,[0,30],[0,X])
// ❌ unclamped (flashes out of range): interpolate(frame,[10,20],[0,1])  // add both clamps
// ❌ frame-literal phases that finish early → static tail (freeze)
// ❌ damping:200 on a hero number (feels dead) / damping:8 on a label (wobbles wrong)
```

## Before you write, confirm
- [ ] Every reveal has an `easing` (out-cubic arriving / inout travelling)
- [ ] Every `interpolate` has `extrapolateLeft:'clamp'` + `extrapolateRight:'clamp'`
- [ ] Spring `config` matches intent (snappy/bouncy/heavy/smooth)
- [ ] Phases are `durationInFrames` fractions; last phase ~0.95 (motion fills the window)
