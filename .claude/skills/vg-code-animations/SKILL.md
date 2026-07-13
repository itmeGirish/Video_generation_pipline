---
name: vg-code-animations
description: AUTHOR-TIME code recipe for writing RICH, MEANINGFUL motion in a bullet's React.createElement code — layered entrance (2-3 transforms) + supporting motion + hold-alive, all frame-driven and mapping to meaning. Use BEFORE/WHILE writing a bullet's code (not after render). Pairs with the verify gate vg-quality-animations. Grounded in remotion animations.md + DynamicBlock bindings.
model: opus
---

# Code recipe — rich, meaningful motion

Write this into the bullet code up front. Goal: a layered entrance + ≥1 supporting motion +
hold-alive, all `frame`-driven, with motion that MAPS to meaning. (Verify after render with
`vg-quality-animations`.)

## The pattern (copy, then fill with the beat's meaning)

## Map motion to meaning (pick the transform from the verb / the compiled `op·topology`)
The compiled grammar (`vg-motion-compiler`) names the `op·topology` for each row — build THAT, don't invent
a different move. The op→transform mapping:
| op·topology (from grammar) / meaning | Code move |
|---|---|
| more / growth · `Reveal·fill`/`count` | height/width grows, value counts up |
| less / shrink | scale/height decreases |
| gap widens | two elements `translateX` apart |
| `Transform·shatter`/`shred` | split into groups, translateY apart + rotate (tilt), eased fall |
| `Transform·morph` | one continuous interpolate between the two shapes — NO cut |
| `Emphasize·glow`/`ignite` | boxShadow blur + brightness up (the amber answer-cell lighting) |
| impact | scale overshoot + 2-frame shake, heavy spring |
| arrives · `Move`/`Enter` | eased `interpolate` (out-cubic) into place |

## `intensity` → the motion AMPLITUDE (apply to the payoff element only)
The compiled `intensity` scales how BIG the payoff move is — same op, different weight:
A `climax`/`wonder` is the scene's hero moment — give it the glow + camera + hold; a `medium` beat stays plain.

## ENTRANCE RESTRAINT — arrivals are quiet; the PAYOFF is loud (corrected 2026-07-10)

> ⛔ The old rule here ("add anticipation/overshoot to EVERY hero entrance") was a BUG (benchmark:
> `feedback/learning.md` §D.5): physics on every arrival makes arrival-motion compete with meaning-motion
> and the frame reads busy/wobbly. Reference-grade entrances are nearly invisible.

- **DEFAULT entrance (all elements):** 10–14-frame fade + a small rise (~8–20px), `Easing.out(cubic)`,
  NO overshoot, NO spring. The element simply becomes present; the viewer's eye stays on the mechanism.
- **THE ONE PAYOFF per act** gets the expressive physics: overshoot/anticipation/slam + its reactions.
  Emphasis is scarce by design — if everything pops, nothing does.
- Weight still matters WHERE physics is used: heavy = slower settle (`mass:2`); light = quick snap.

## HOLD-ALIVE = THE MECHANISM STILL RUNNING (never a decorative breathe) — corrected 2026-07-10

> ⛔ The old rule here (a table of per-element breathes, "no two elements share a breathe frequency" —
> i.e. EVERYTHING breathes) was a BUG: it manufactures meaningless wobble to satisfy freezedetect, the
> exact "decorative anti-freeze" failure ([[feedback-freeze-gate-honest-not-gamed]],
> `feedback/learning.md` §D.7).

A long beat stays alive because **the beat's MECHANISM keeps operating** — the `cycle` op (travel →
process → emit, repeating), the counter still tallying per pass, the wave still oscillating, the meter
tracking its driver. That motion is meaningful, studyable, and can run forever. The A4 fix for a static
beat is ALWAYS "what should be RUNNING here?" — route to the mechanism, not to amplitude:
- a process beat → make the mechanism `cycle` visibly;
- a settled payoff under narration → a DESIGNED HOLD: pixel-still except (at most) ONE subtle breathe on
  the hero; stillness is what makes the landing register;
- everything else settled = pixel-still. Settled elements do NOT breathe/shimmer/bob.

## SECONDARY MOTION — the PAYOFF's acknowledgment (scoped; not a density lever)

When the act's payoff lands, the world acknowledges it: 1–3 cheap coupled reactions (shadow shifts, key
light brightens, camera compensates) read off the payoff's driver variable. That's the whole scope —
supporting elements and routine beats do NOT spawn reactions (the old "every primary spawns 2–3, else the
frame is dead" rule produced parallel-everything noise). ONE KINETIC FOCUS at a time: when the hero moves,
everything else is settled-still; the reaction follows the hit, lagged ~3f, then stillness again.
(Lead/lag timing: `vg-code-sequencing`.)

## OBJECT CONSTRAINTS — every animated element needs an anchor/pivot/origin (decide it, don't default)

A scale/rotate with the wrong `transformOrigin` reads wrong (a lens that scales from its corner, a bar that
grows from its middle). **Decide the pivot per object from what it IS** — and it's a one-prop fix:
| Object | `transformOrigin` |
|---|---|
| a bar / meter that GROWS | `bottom` (grows up from its base) or `left` (fills rightward) |
| a card / page entering | `center` (scales toward its middle) |
| a lens / loupe / badge | `center` (opens about its eye) |
| a hinged / folding panel | the hinge edge (`top` / `left`) |
| a tooltip / callout popping off an anchor | the anchor side (`bottom` if it pops upward) |
Pivot is part of authoring the move, not an afterthought — a wrong origin is a common "amateur" tell.

## EXIT — an object that's carried doesn't just vanish (ties to the script's `carry:`)

If the scene has a through-line protagonist (`carry:`), an element doesn't pop to opacity 0 — it **exits with
direction** toward where the next beat needs it: it travels off-frame, shrinks into the next beat's machine,
or hands its position to the next element. A hard opacity cut between beats is a slide-swap; a directional
exit reads as one continuous take. (Cross-beat handoff: `vg-code-transitions` / `vg-scene-transitions`.)

## MATERIAL informs the motion (a quick tell)

A thing made of **paper** flutters/bends/tears; **glass** has weight + a sharp specular that slides as it
moves; **metal** is rigid with a hard highlight; **a glow** has no mass and eases softly. Don't move every
object with the same generic spring — let the implied material pick the easing + the secondary (paper → a
slight bend + a fluttering edge; glass → a moving specular; metal → a rigid snap). Cheap, and it kills the
"everything is the same matte SVG plane" feel.

## SPOTLIGHT-DIM emphasis + DESIGNED stillness (the premium counterweight to motion density)

Two moves premium explainers use that raw motion-density chasing misses:
- **Emphasis by RELATIVE dimming, camera locked.** When focus moves to one element, dim every other
  element (opacity toward ~0.5–0.6, desaturate) and brighten/lift the one — the eye snaps to it with ZERO
  camera motion and zero new elements. This is the cheapest, cleanest attention move; prefer it over a
  camera push for within-frame focus shifts. Restore the dimmed elements when focus returns (they stay on
  stage at their settled states — never remove them to emphasize something else).
- **A HOLD is a DESIGNED state, not a freeze bug.** After a payoff lands, the frame may sit essentially
  still for a beat while the narration carries — that stillness is a deliberate `role: breath` /
  `pause_after_ms` state from the contract: keep only the subtlest hold-alive (a breathe on the hero),
  suppress everything else. Landing → stillness → next build is a rhythm, and the stillness is what makes
  the landing register. (A4 exempts the final hold; a contract-mandated HOLD mid-scene is equally
  intentional — subdivide only beats that are static WITHOUT a mandated hold.)

## Anti-patterns (do NOT write)

## ⛔ Anti-freeze must be MEANINGFUL — never a free-floating beam (real miss)
A long/establishing beat that sits static fails A4. The WRONG fix (and a real lapse) is to drop in a
decorative sweeping bar/beam/scan-line just to register motion — it reads as a random moving block with
no meaning and the viewer notices it as noise. **Anti-freeze motion must carry meaning.** In priority order:
1. **Animate the actual subject** — advance the runner, drain/fill the real gauge, tick the counter, light
   the next step. The thing the beat is ABOUT should be what moves.
2. **Animate the scaffold being built** — a "drawing head" glow at the leading edge of a line/track being
   laid (the track extending toward the horizon), a bar filling, a diagram wiring up. The construction IS
   the motion and it means something.
3. **Subdivide the beat** — if a 12–15s beat has genuinely nothing to move, it's too long for ONE beat:
   evolve it through sub-phases (state A → state B → state C), each a real change (`scene-composer`
   §Rhythm). A breathing hero + a real phase change every few seconds beats any sweeping beam.
A motion you can't name the MEANING of (apply the purpose test) is decoration — cut it, don't ship it to
pass freezedetect.

## Before you write, confirm
- [ ] A process/rate beat has its MECHANISM visibly RUNNING (`cycle` op: travel→process→emit, looping) — the beat's honest hold-alive
- [ ] ONE KINETIC FOCUS at a time — when the subject moves, everything else is settled and pixel-still
- [ ] Entrances are QUIET: 10–14f fade+rise, out(cubic), no overshoot/spring — the arrival is not the show
- [ ] The act's ONE payoff gets the expressive physics (overshoot/slam) + 1–3 coupled reactions, lagged ~3f
- [ ] Settled elements do NOT breathe/shimmer/bob; a designed hold is pixel-still except (at most) one subtle hero breathe
- [ ] Every scaled/rotated element has a deliberate `transformOrigin` (not the default corner)
- [ ] A carried element EXITS with direction (not a hard opacity cut) toward the next beat
- [ ] No load-bearing element sits pixel-identical across BEAT BOUNDARIES — held elements re-react per beat via a value/state change (not a wobble)
- [ ] The motion's direction/size encodes the point (muted test passes)
- [ ] All motion is `frame`-driven (no CSS/Tailwind animation)
