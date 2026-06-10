---
name: vg-code-vchecks
description: AUTHOR-TIME code recipe for writing a bullet that PASSES the 13 V-checks by construction — fill the canvas (primary ≥50% height, visual ≥60%), keep everything inside bounds, one non-text visual carries the point, motion visible the whole window, phases inside framesTo-framesFrom. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-vchecks. Grounded in vg-verification-protocol + video-generation-conventions.
---

# Code recipe — pass the V-checks by construction

Write each bullet so the 13 checks pass without rework. (Verify after render with `vg-quality-vchecks`.)

## Fill the canvas (V5, V13)
```js
const w = width, h = height;
// primary element ≥ 50% canvas height, visual fills ≥ 60% of the frame
const primaryH = Math.round(h*0.55);
const primaryW = Math.round(w*0.62);
```

## Stay inside bounds (V7) + no internal overlap (V9)
```js
// position from fractions; leave margins; reserve the caption zone (bottom 12%)
const top = Math.round(h*0.12);             // header band
const footTop = Math.round(h*0.82);         // footers/punchlines MAX here (never > h*0.88)
// labels sit BESIDE rects, not under them; hero text fits the gap between neighbors
```

## A real visual carries it (V12) + readable text (V4)
```js
// not text-only: a chart/diagram/shape is the hero; text = short title + labels + numbers
fontSize: Math.round(w*0.024)               // headline ≥ w*0.022; body ≥ w*0.009
```

## Motion the whole window (V8, A4/A5) + phases fit (V11)
```js
const p3 = durationInFrames*0.95;           // last phase ends ~0.95 → no dead tail, fits the slot
const breathe = 1 + 0.015*Math.sin(frame*0.12);   // always-alive so the midpoint ≠ frame 0
```

## Anti-patterns (each is a V-check fail)
```js
// ❌ stamp-sized visual on black            → V1/V5/V13
// ❌ element at top:h*0.92 (caption zone)   → V9c
// ❌ last phase starts at frame 64 of 72    → V11 (only 8f visible)
// ❌ text-only frame                        → V12
// ❌ single shared opacity, frozen midpoint → V8/A4
```

## Before you write, confirm (the 13)
- [ ] V1 ≥40% non-bg · V5 visual ≥60% · V13 primary ≥50% height
- [ ] V7 inside `[0..w]×[0..h]` · V9 no internal overlap · V9c nothing in bottom 12%
- [ ] V4 body ≥ w*0.009 / headline ≥ w*0.022 · V10 labels fit (see vg-code-text)
- [ ] V12 a non-text visual is the hero · V3 tokens only (see vg-code-tokens)
- [ ] V8/A4 motion visible at midpoint, runs the window · V11 last phase ~0.95 ≤ slot
