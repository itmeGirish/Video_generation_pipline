---
name: 03b-animation-validator
description: Validates the animation bullets right after they are produced (rule 03), before narration sync or render. Checks that each beat's animation MAKES SENSE and fits its scene — grounded in animation review principles (staging, timing, readability) plus the project's clarity, motion, show-don't-tell, and richness standards. Use after writing or editing animation bullets, when reviewing whether the animation communicates, checking motion-to-meaning, verifying a beat fits the scene, or before handing the script to validation/render. Not for writing the bullets (rule 03), narration, or scene structure.
---

# Step 4c — Animation Validator

Run this immediately after the animation bullets are produced (rule 03), per scene.
Producing the animation is not enough — it must be checked that each beat actually
COMMUNICATES and fits the scene. Motion that doesn't make sense loses the viewer.

This validates the *design on paper* (the bullets). The rendered frames are verified
later by the video_generation verification protocol (rule 23). This catches the
problems before a render is ever spent.

## Contents
- The two questions every beat must pass
- CAN REMOTION BUILD IT? — the gate before all others
- Check A — Does the animation MAKE SENSE? (clarity / meaning)
- Check B — Does it FIT the scene? (staging, timing, sync, pacing)
- Check C — Is it MOTION, not a text slide? (show-don't-tell, no full-text scenes, richness)
- Check D — Is it BUILDABLE? (engine-describable, format)
- Scoring and output
- Guidelines

---

## The two questions every beat must pass

1. **Does the animation make sense?** Muted, would the motion alone make the point clear?
2. **Does it fit the scene?** Does it land on the right words, at the right pace, staging
   the one idea the scene is about?

If either is NO, the beat FAILS — send it back to rule 03 and redesign. Do not proceed
to sync/render with a failing beat.

---

## CAN REMOTION BUILD IT? — the gate before all others

This is the most important practical check: **the animation must be one Remotion can
actually render.** A beautiful, meaningful idea that the engine can't produce is useless
— it will not appear on screen. Every beat must be expressible as frame-driven motion.

Remotion CAN build (all of these are PASS):
- Transforms over time — `translate`, `scale`, `rotate`, opacity (via `interpolate`)
- Physics motion — `spring()` (bouncy / snappy / heavy / smooth)
- Value-over-range — counters, bar fills, wipes, progress (clamped `interpolate`)
- Staggered reveals — per-element delay offsets
- SVG / shapes / paths drawing, gradients, blur, shadow, glow (as animated style)
- `<Img>` / `<Video>` with Ken Burns, push-in, crossfade
- Timing to a point — start a motion on the audio_anchor frame via a delay

Remotion CANNOT build (all of these are FAIL — redesign):
- CSS transitions / `@keyframes` / Tailwind animation classes (forbidden — they flicker)
- Anything not driven by `useCurrentFrame()` (non-deterministic, breaks on render)
- Real 3D physics, fluid/cloth/particle simulations, or true physics engines
- "Whatever the AI feels like" motion with no frame-based form ("dynamic energy")
- Effects that need external/live state, real-time input, or wall-clock time

**The test:** can you name the motion as a transform, a spring, a value-over-a-range, or
a stagger? If yes → Remotion can build it. If you can't express it that way → it can't be
rendered as written → FAIL and rewrite it in engine terms (see Check D).

---

## Check A — Does the animation MAKE SENSE? (clarity / meaning)

| What to check | PASS | FAIL |
|---|---|---|
| Meaning test | muted, the motion alone makes the point | needs narration to be understood |
| Motion maps to meaning | up=more, down=less, apart=growing gap, etc. | direction/size unrelated to the point |
| No contradiction | "rising cost" bar rises | "rising cost" bar shrinks (says the opposite) |
| One main idea | viewer knows exactly what to watch | two unrelated motions split attention |
| Decoration is support only | sparks/glow serve the main motion | decoration IS the main event, teaches nothing |

FAIL any row → the animation doesn't make sense. Redesign so the motion IS the message.

---

## Check B — Does it FIT the scene? (staging, timing, sync, pacing)

Staging and timing are the animation principles that decide whether a beat fits.

| What to check | PASS | FAIL |
|---|---|---|
| Serves the scene's one idea | the beat advances this scene's point | the beat is off-topic decoration |
| Staging | attention is directed to the key element | the key element competes with clutter |
| Anchor fit | the motion fires on the verbatim spoken phrase | anchor not in this scene's narration |
| On the right word | the reveal lands as the narration says it | reveal lands seconds before/after the words |
| Pacing / readability | the eye has time to read before the next change | beat too short to absorb, or static >3s |
| Motion matches the line's verb | "exploded" → burst; "fills" → fill | generic move unrelated to the words |
| Continuity | entity keeps its color token across the scene | entity changes color, viewer loses track |
| Fits the time window | bullet timecodes inside the scene window | bullet runs past the scene end |

FAIL any row → the beat doesn't fit. Re-time, re-stage, or re-anchor it.

---

## Check C — Is it MOTION, not a text slide? (show-don't-tell, richness)

| What to check | PASS | FAIL |
|---|---|---|
| Scene is not full of text | the scene is carried by visuals/motion | the scene (or beat) is mostly on-screen text |
| Not a text animation | text is a static label; motion is on the visual | the animation IS text moving/typing as the main event |
| Show don't tell | a visual makes the point; text only labels it | a card of sentences / paragraphs |
| Not narration-on-screen | on-screen text is a 2–5 word label + a number | the spoken sentence printed on canvas |
| Real motion | enters with a transform (slide/scale/pop) or value-over-range | a bare opacity fade as the whole animation |
| Hold-alive | a held element keeps a subtle motion | element enters then freezes |
| Rich, with hierarchy | layered + choreographed + one supporting motion, one hero | one move then nothing, OR everything moving equally |

FAIL any row → it reads as a slide, not an animation. Convert text to visuals; add motion.

**Full-text / text-animation FAIL — explicit:**
- We do NOT recommend animating text as the main visual. A beat whose primary content is
  text (a sentence, a paragraph, a typing/word-by-word reveal of prose) FAILS — the
  picture must make the point; text only labels it.
- Scene-level check: scan the whole scene. If most beats are text on a plain background
  with no metaphor / chart / image / motion carrying the meaning, the scene FAILS as a
  "slide deck" — redesign it around visuals.
- Allowed text: a 2–5 word headline, a few labels, and numbers (a hero number is a
  visual). Animating those (a number counting, a label sliding in to tag a visual) is
  fine. Animating prose is not.

---

## Check D — Is it BUILDABLE? (engine-describable, format)

| What to check | PASS | FAIL |
|---|---|---|
| Engine-describable | motion is an entrance / value-over-range / stagger | "feels alive", "dynamic energy" (no frame form) |
| Named object | a specific object, not "a visual" | "a comparison appears" |
| Exact quantities | counts and durations stated | "some", "several", "staggered" with no number |
| Spring intent named | bouncy / snappy / heavy / smooth | unnamed spring |
| REPLACE handled | REPLACE has a full-canvas backdrop line | scene changes but no REPLACE / no backdrop |
| Real images move | every `[asset:]` has a motion (Ken Burns / Logo pop) | static image (trips freeze gate) |
| Format | `- **M:SS – M:SS — Headline.** body`, no hex/JSX | malformed bullet (will not parse) |

FAIL any row → it can't be rendered as written. Fix per rule 03.

---

## Scoring and output

Validate per scene, per bullet. Report a table — one row per bullet, four columns:

```
ANIMATION VALIDATION — <name>, Scene N
Bullet | A:Sense | B:Fit | C:Motion | D:Buildable
  B1   |  PASS   | PASS  |  PASS    |  PASS
  B2   |  FAIL   | PASS  |  FAIL    |  PASS
  B3   |  PASS   | FAIL  |  PASS    |  PASS

FAILS (must fix before sync/render):
  S N B2 Sense:  shapes spin with no point — redesign so motion = message
  S N B2 Motion: three lines of sentence text — convert to a visual + label
  S N B3 Fit:    anchor "the result" not spoken in this scene's narration

VERDICT: NOT READY — 2 bullets failing
```

Any FAIL = not ready. Fix in rule 03, re-run this validator. Only when every bullet is
PASS (isolated, non-blocking notes allowed) is the scene's animation ready.

---

## Guidelines

### Always
- Confirm Remotion can build the beat — expressible as transform / spring / value-over-range / stagger
- Run this per scene, immediately after the animation bullets are produced
- Apply the meaning test to every beat (muted, is the point clear?)
- Check staging and timing — the beat must direct attention and land on the right words
- Send failing beats back to rule 03; never sync/render a failing beat
- Report per-bullet PASS/FAIL with a specific, actionable reason

### Never
- Pass a beat Remotion cannot build (CSS animation, non-`useCurrentFrame` motion, real physics sims)
- Pass a beat that needs the narration to be understood
- Pass motion that contradicts or ignores the meaning
- Pass a text slide as an animation
- Pass a beat that is full of text or whose animation IS text (prose moving/typing)
- Pass a scene that is mostly text on a plain background — that's a slide deck
- Pass an anchor phrase that isn't spoken verbatim in this scene
- Proceed to render with any FAIL outstanding
