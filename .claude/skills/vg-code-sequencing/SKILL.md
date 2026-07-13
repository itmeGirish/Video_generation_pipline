---
name: vg-code-sequencing
description: AUTHOR-TIME code recipe for SEQUENCING in a bullet's render code — stagger multi-element reveals with per-element delay, lead-and-follow, and cause→effect order so one hero leads the eye. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-sequencing. Grounded in remotion sequencing.md + the findWord/findWordEnd bindings.
model: opus
---

# Code recipe — stagger & choreography

## SERIAL ATTENTION — one mover at a time (the master choreography law — added 2026-07-10)

Reference-grade choreography is SERIAL: at any instant exactly ONE object is in visible motion (the
current subject, or the scene's running `cycle` mechanism between events); everything else is settled and
pixel-still. A stagger is a sequence of stillness-punctuated events — element lands, brief stillness, the
next fires — never N parallel tweens overlapping (`feedback/learning.md` §D.2: the eye can only follow one
thing; two simultaneous movers = both unseen). Choreographed exceptions read as ONE event: a
`together`/`bloom` group moves as a single body; the payoff's 1–3 coupled reactions ride the payoff's own
driver, lagged ~3f.

## FRAME ONE — the scene opens populated (no dead open)

Stagger delays choreograph an ALREADY-VISIBLE world; they never leave the canvas blank while the viewer
waits. Bullet 1 of a scene does not start from an empty backdrop with every element at opacity 0 queued
behind entrance delays: the stage (backdrop, zones, carried/held context) is present at frame 0, and the
first hero motion is underway within ~15 frames. For the FIRST scene of the video this is the hook — the
first frame IS the story; seconds of empty canvas before a title fades in are the most expensive dead air
in the video. (Scene-boundary fade is separate — keep scene 1's `Backdrop` `fade_frames` low so the open
isn't a slow fade from nothing; `vg-scene-transitions`.)

## Stagger N elements with a per-element delay

## Lead-and-follow (hero lands first, support follows ~8f later)

## Coupled secondaries lag the primary slightly (the density reactions — `vg-code-animations` §SECONDARY MOTION)
The reactive secondaries (shadow follows · light shifts · dust reacts · camera compensates) read the SAME
driver as the primary, but a real reaction is **a few frames behind** the cause — couple them with a tiny lag,
not in lockstep (lockstep reads as "all one rigid object"):
Lead leads, support follows ~8f, **coupled reactions trail ~3f** — three timing tiers = a frame that feels alive.

## Cause→effect (next element keys off the prior's landing, or the spoken word)

## Build the `animation_pattern` — the compiled choreography (from `vg-motion-compiler`)
The beat's `animation_pattern` (set by the writer, expanded by the compiler) is the choreography you BUILD
here. Clause order = execution order — row `i` is the i-th `change:` clause; never reorder. Each pattern:

## Direction qualifier → the stagger FUNCTION (semantic: force/progress/discovery/organic)
For `bloom`/`cascade`, the direction (`from-center`/`left-to-right`/`all-at-once`/`scattered`) sets HOW the
per-element delay is distributed — same motion, different meaning:
The exact frame numbers come from the compiler (pattern × token × `intensity`); you implement the shape.

## Anti-patterns

## Before you write, confirm
- [ ] Bullet 1 opens POPULATED — stage visible at frame 0, first hero motion underway ≤~15f (no blank-canvas wait)
- [ ] Multi-element beats use a per-element `delay` (stagger), not one shared opacity
- [ ] The beat's `animation_pattern` is BUILT as specified (domino=causal · morph=continuous · cascade/bloom=wave · together=0)
- [ ] Direction qualifier honored (from-center=radial · left-to-right=by-x · all-at-once=0 · scattered=random)
- [ ] Clause order preserved (row i = clause i); a `morph` is NOT staggered
- [ ] A hero lands first; supporting labels/values `delay` after it
- [ ] Cause→effect chains use the prior landing frame (or `findWord`/`findWordEnd`)
- [ ] Exactly ONE element leads the eye at a time
