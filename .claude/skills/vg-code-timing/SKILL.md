---
name: vg-code-timing
description: AUTHOR-TIME code recipe for TIMING in a bullet's render code — ease every reveal (never linear), use the intent-matched spring preset, write phases as durationInFrames fractions, and clamp every interpolate. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-timing. Grounded in remotion timing.md.
model: opus
---

# Code recipe — easing & physics

## Ease every reveal (the #1 author-time fix)

## Spring presets — match physics to intent (config values, copy exactly)

## Easing menu beyond cubic — overshoot is for the PAYOFF ONLY (corrected 2026-07-10)
`out(back)` (overshoot) and anticipation easings exist for **the ONE payoff moment per act** — the slam
that deserves to be felt. Everything else (entrances, labels, supporting elements) uses clean
`out(cubic)` fade+rise with NO overshoot — reference-grade arrivals are nearly invisible, so the
mechanism's motion is the only expressive movement on screen (⛔ the old "hero uses out(back), not flat
cubic" default was a bug — overshoot on every entrance reads busy; `feedback/learning.md` §D.5). Reserve
`elastic` for one moment per video.

## WEIGHT physics — momentum · drag · compression (the rest of "it has mass")
Overshoot/anticipation sell the *launch + land*; these three sell the *body* of the motion — they're what
makes an object feel like it weighs something instead of gliding:
Use squash on anything that *lands or hits* (a dropped card, the shredder eating a page, a slammed counter);
use momentum-drag on anything *thrown/falling* (shreds, debris, a flung element). Skip it on calm/ambient
motion. (Physics is *faked* with easing — no engine; cheap + render-safe.)

## Ease the STAGGER too (the cascade itself should accelerate/decelerate, not tick uniformly)
A uniform `delay: i*8` reads mechanical. Curve the delays so the cascade feels choreographed:

## Phases as durationInFrames fractions (never frame literals)

## `intensity` → the timing treatment (the emphasis amplitude; from the compiled grammar)
The beat's `intensity` (`low·medium·impact·climax·wonder`, set by the writer) drives the spring/easing
amplitude + the hold. Apply it to the PAYOFF element (not the supporting rows):
This is how two beats with the SAME grammar land differently (a `medium` shatter vs a `climax` shatter).

## You own the stagger SECONDS — derive them (the writer never types a number)
`vg-code-sequencing` builds the choreography SHAPE (the pattern's stagger function); YOU set the frame gap:
A `together` is `gap:0`; a `morph` has no inter-step gap at all (one continuous interpolate).

## Anti-patterns

## Before you write, confirm
- [ ] Every reveal has an `easing` (out-cubic arriving / inout travelling)
- [ ] Overshoot/anticipation appear ONLY on the act's payoff — every other entrance is clean out(cubic) fade+rise
- [ ] Every `interpolate` has `extrapolateLeft:'clamp'` + `extrapolateRight:'clamp'`
- [ ] Spring `config` matches intent (snappy/bouncy/heavy/smooth); NOT one shared spring on all elements
- [ ] Multi-element stagger delays are CURVED (eased), not a uniform `i*8`
- [ ] The payoff's spring/easing matches the beat's `intensity` (impact=punchy · climax=held · wonder=slow)
- [ ] Stagger seconds DERIVED from pattern × intensity (not a magic number); `together`=0, `morph`=continuous
- [ ] Phases are `durationInFrames` fractions; last phase ~0.95 (motion fills the window)
