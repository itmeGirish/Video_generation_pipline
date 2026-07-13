---
name: vg-code-vchecks
description: AUTHOR-TIME code recipe for writing a bullet that PASSES the 13 V-checks by construction — fill the canvas (primary ≥50% height, visual ≥60%), keep everything inside bounds, one non-text visual carries the point, motion visible the whole window, phases inside framesTo-framesFrom. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-vchecks. Grounded in vg-verification-protocol + video-generation-conventions.
model: opus
---

# Code recipe — pass the V-checks by construction

Write each bullet so the 13 checks pass without rework. (Verify after render with `vg-quality-vchecks`.)

## Fill the canvas (V5, V13)
Fill = the CONTAINERS' footprint + their internal density (fields/rows/cells inside panels) — never
spread. Islands-in-void is the correct dense pattern (`vg-code-composition` §CONTAINMENT): satisfy V5 by
making containers dense INSIDE, not by stretching the layout until islands merge. Peripheral text renders
DIM by design (`vg-code-text` §TWO TIERS) — dimness is the tier marker; size stays at/above the V4 floor.

## Stay inside bounds (V7) + no internal overlap (V9)

## A real visual carries it (V12) + readable text (V4)

## Motion the whole window (V8, A4/A5) + phases fit (V11)

## Anti-patterns (each is a V-check fail)

## Before you write, confirm (the 13)
- [ ] V1 ≥40% non-bg · V5 visual ≥60% · V13 primary ≥50% height
- [ ] V7 inside `[0..w]×[0..h]` · V9 no internal overlap · V9c nothing in bottom 12%
- [ ] V4 body ≥ w*0.009 / headline ≥ w*0.022 · V10 labels fit (see vg-code-text)
- [ ] V12 a non-text visual is the hero · V3 tokens only (see vg-code-tokens)
- [ ] V8/A4 motion visible at midpoint, runs the window · V11 last phase ~0.95 ≤ slot
