---
name: vg-code-transitions
description: AUTHOR-TIME code recipe for TRANSITIONS in a bullet's render code — write REPLACE backdrops as a full AbsoluteFill D.bg (no leak), exit/settle held elements, and carry an element across a cut for a match-cut. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-transitions. Grounded in remotion transitions.md + vg-scene-transitions.
model: opus
---

# Code recipe — clean handoffs

## 0. TWO LEVELS of transition — and the ONE that causes the overlaps

Transitions live at two levels, and they follow OPPOSITE rules (Remotion-researched):

### A. SCENE → SCENE (the master timeline) — plain `<Series>`, never `TransitionSeries`
The master composes the per-scene components with a **plain `<Series>`** (`render_master.mjs`). This is a
deliberate, correct choice, not a limitation:
- `<Series>` places each `Series.Sequence` at the **cumulative** duration of all priors — **zero overlap,
  fully deterministic**. Every scene starts exactly where its concatenated narration starts → **audio stays
  frame-synced**.
- `TransitionSeries` **OVERLAPS** adjacent sequences: total = `A + B − transition` (a 30-frame transition
  between a 40f and 60f scene yields **70f, not 100f**). Every downstream scene then starts EARLIER than its
  narration → **cumulative audio drift**. That is why CLAUDE.md forbids it at the master. (`@remotion/transitions`
  docs: transitions reduce total duration; adjacent transitions are prohibited.)
- The soft scene cut is the per-scene **`Backdrop` fade** (`fade_frames`), which happens INSIDE the scene's
  own slot — it costs no timeline and shifts nothing. That is the only scene-boundary effect.

**Rule:** never reach for `TransitionSeries` to "make scenes transition nicer" — it silently desyncs the
whole video. Author the handoff INSIDE the scene (a match-cut/carry authored in the last/first beat) or via
the `Backdrop` fade — both are timeline-neutral.

### B. BEAT → BEAT (within a scene) — EVOLVE the zone grid, don't PILE absolute priors
This is the level that produces the recurring overlaps. The slot contract makes each beat SELF-CONTAINED
(it must redraw the scene's settled state). The **old** way did that by stacking the prior beats' code at a
settled frame UNDERNEATH the new beat (`compose_merge`'s `under`/`keep` IIFEs) — but those priors are
**absolutely positioned**, so a later beat's element lands on a settled prior's element and **collides**
(a recurring class). Curating `under` is a patch, not a fix.

**The structural fix (pairs with `vg-code-composition` §0):** every beat of a scene renders the **SAME
`Kit.Zones` grid**. The through-line object lives in its named zone (`stage`/`band`) across ALL beats,
redrawn at its **settled** state (byte-identical → no jump); only the ACTIVE zone's content animates the
delta. Because every element — settled prior or new — is placed **into a zone**, and zones are disjoint by
construction, **a beat can no longer collide with a settled prior.** The "transition" between beats becomes
a content evolve inside fixed zones, which is overlap-proof AND reads as ONE continuous scene (the EVOLVE
pattern, `vg-code-composition` §7). When a beat genuinely REPLACES the world (new metaphor), use the
full-AbsoluteFill REPLACE backdrop below; otherwise EVOLVE the zones.

## REPLACE = three ordered phases: composite-OUT → skeleton-IN → data-IN (added 2026-07-10)

A world-replacing cut is not "paint a backdrop and arrive animating." Reference-grade replacement
(`feedback/learning.md` §D.6) is three micro-phases, in order:
1. **Composite-OUT (~8–10f):** the prior world exits TOGETHER — one group fade/dim of the whole outgoing
   composite (never element-by-element straggling).
2. **Skeleton-IN (~10–14f):** the NEW stage's FRAME arrives first — title, zone frames, axes, empty
   instruments. The viewer meets an empty labeled stage and knows where everything will live.
3. **Data-IN:** content populates the skeleton (the mechanism starts, values fill, the hero enters last).
This order is what makes a new scene legible in its first second; content arriving before its frame is
how "already animating at the cut" confusion happens.

## REPLACE backdrop = full AbsoluteFill (never a position:absolute div)

## Image-backdrop bullet → foreground in its own zIndex:1 AbsoluteFill

## Match-cut / carry-over (continuity across a cut)
Keep a shared element (a number/shape/color) at the SAME position+token entering the next
bullet so it reads as continuous, not a reset.

## Transition VARIETY — not every cut is a fade (the handoff carries emotion)
A crossfade is the safe default, but a video where every boundary is the same fade is monotone — and
the cut is the highest-attention moment (`scene-planner`). Vary the handoff by what the next
beat MEANS (frame-driven, tokens-only — these are reveals of the new content, not CSS transitions):
Map the cut to the moment: a **Reveal** = a hard match-cut or iris (snap to the new thing); a calm
**Resolution** = a slow crossfade; a **Compare** = a wipe/split; a through-line beat = a MORPH of the
carried element (`scene-composer` §1b). Pick deliberately; don't fade everything.

## Avoid double-dark
Don't stack a scene-boundary crossfade with a from-black bullet-1 backdrop fade — pick ONE.
Within a scene, a REPLACE's `bgOp` 0→1 over ~8f is enough; the stitch handles scene crossfade.

## Anti-patterns

## Before you write, confirm
- [ ] REPLACE backdrop is `AbsoluteFill` with `D.bg` (not a `position:absolute` div)
- [ ] Image bullets wrap foreground in `AbsoluteFill {zIndex:1}`
- [ ] Held elements settle (don't freeze) and exit cleanly on REPLACE
- [ ] No competing fade that would double-dark the boundary
