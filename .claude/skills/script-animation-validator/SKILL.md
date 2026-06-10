---
name: script-animation-validator
description: Validates the animation bullets right after they are produced (rule 03), before narration sync or render. Checks that each beat's animation MAKES SENSE and fits its scene — grounded in animation review principles (staging, timing, readability) plus the project's clarity, motion, show-don't-tell, and richness standards. Use after writing or editing animation bullets, when reviewing whether the animation communicates, checking motion-to-meaning, verifying a beat fits the scene, or before handing the script to validation/render. Not for writing the bullets (rule 03), narration, or scene structure.
---

# Step 4c — Animation Validator

Run this immediately after the animation bullets are produced (rule 03), per scene.
Producing the animation is not enough — it must be checked that each beat actually
COMMUNICATES and fits the scene. Motion that doesn't make sense loses the viewer.

### What this gate can and CANNOT do — read first

This validates the *design on paper* (the bullet text). **It never sees a pixel.** A PASS
here means the DESIGN is sound — it is **not** a promise the animation renders correctly.
Errors that live only in the render are invisible to this gate by construction:
off-canvas / caption-zone placement, a primary element rendering tiny, two elements
overlapping, a frozen hold, an emoji hanging the headless render, a bar shrinking under
flexbox. A bullet can read perfectly and render broken.

Therefore this gate is **one of three layers, all required** — never treat a 03b PASS as
"the animation is good":

1. **03b (this gate)** — paper review + the known-failure catalog below (catches
   paper-detectable design errors before a render is spent).
2. **`storyboard/layout_validator`** — MECHANICAL: runs each bullet's code in a Node stub,
   catches overlaps / off-canvas / caption-zone / extract-errors. **Required** (see end).
3. **rule 23 / `vg-verification-protocol`** — the ONLY layer that inspects actual rendered
   frames. **MANDATORY before shipping any scene.** Not "later, if time" — always.

If an animation error reached the output, the failure was almost certainly a skipped
layer 2 or 3 — not a missing check here. A paper gate cannot catch a render bug.

## Contents
- The two questions every beat must pass
- CAN REMOTION BUILD IT? — the gate before all others
- Check A — Does the animation MAKE SENSE? (clarity / meaning)
- Check B — Does it FIT the scene? (staging, timing, sync, pacing)
- Check C — Is it MOTION, not a text slide? (show-don't-tell, no full-text scenes, richness)
- Check D — Is it BUILDABLE? (engine-describable, format)
- Check E — Known render-failure catalog (paper-detectable)
- Scoring and output — escalation teeth + the mandatory layer-2 / layer-3 handoff
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
| **Sentence test (primary)** | you can name the exact narration sentence/clause the bullet depicts, and the visual is a play-by-play of it | you can't name the sentence; OR it's generic mood (city/brain/particles/code-rain) that looks technical but maps to no clause — visual noise |
| Meaning test | muted, the motion alone makes the point | needs narration to be understood |
| Motion maps to meaning | up=more, down=less, apart=growing gap, etc. | direction/size unrelated to the point |
| No contradiction | "rising cost" bar rises | "rising cost" bar shrinks (says the opposite) |
| One main idea | viewer knows exactly what to watch | two unrelated motions split attention |
| Decoration is support only | sparks/glow serve the main motion | decoration IS the main event, teaches nothing |
| **Purpose & restraint** | every motion has a purpose — it aids understanding, emphasizes a key moment, or improves engagement; principles used only where they help | motion/transition/effect with no purpose; principles forced onto every element; busy/over-animated beat that adds load not clarity → cut it |

FAIL any row → the animation doesn't make sense. Redesign so the motion IS the message.
**Clarity over complexity:** a calm, clear beat beats a busy one. If a motion doesn't answer
"what does this help the viewer do?", omit it — don't force animation principles into every beat
(see `references/animation_principles.md` §GOVERNING RULE).
The sentence test is the one that catches "rich + moving + non-text but explains
nothing" — motion alone never exempts a beat.

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

## Check E — Known render-failure catalog (paper-detectable)

These are the failures that have actually shipped on this project. Each one is predictable
from the bullet TEXT — so catch it here, on paper, instead of in a wasted render. Check
EVERY bullet against all of them. (Render-only versions are re-checked by layer 3 / rule 23.)

| # | Failure (what renders wrong) | FAIL signal in the bullet text |
|---|---|---|
| E1 | **Floating fragment** — an ADD bullet draws only a delta and relies on a prior bullet's elements still being on screen; under slot-based rendering the canvas blanks between bullets, so it renders as a lone fragment | bullet is ADDITIVE and its body references/depends on an element introduced in an earlier bullet ("the box from before", "beside the previous bar", "the meter keeps…") without redrawing it. → FAIL: make it self-contained (redraw prior context) or `[REPLACE]` |
| E2 | **Context-free visual** — bare shapes/numbers with no title/labels; a deaf viewer can't tell WHAT it is ("4.5 4.6 4.7 4.8" with no axis) | no short TITLE naming the visual + no entity labels + no payoff tag. → FAIL: add a context header + labels |
| E3 | **Caption-zone / off-canvas** — element placed in the reserved bottom 12% or off-frame | body specifies `top > h*0.88`, `bottom < h*0.10`, a footer at `h*0.9x`, or any coordinate outside 0–1×canvas. → FAIL: cap overlays at `top: h*0.82` |
| E4 | **Tiny primary** — the element the viewer must see is small on a black field | the hero/primary element has width/footprint < ~50% canvas, or no size given on a centered element. → FAIL: primary ≥ `w*0.50` / fills ≥60% |
| E5 | **A4 freeze** — a static frame held >3s mid-bullet (not the final hold) | bullet duration >3s with no always-alive motion named (pulse / counter / drift / scan). → FAIL: add subtle continuous motion |
| E6 | **Emoji hang** — astral-plane emoji glyph hangs the headless render | any emoji in the body (⏰🔍🐛🏁🔓🛡 etc.). → FAIL: replace with an SVG primitive. (BMP marks ✓ ✗ ★ ▶ → ↑ ↓ ⚠ · — are safe) |
| E7 | **Flex-shrink bar** — a bar with explicit height inside a height-constrained flex column with sibling labels gets squashed | a bar/column described with siblings in one flex container and no dedicated height-area / `flexShrink:0`. → FAIL: give the bar its own height-area, labels outside |
| E8 | **REPLACE leak / no backdrop** — scene/topic change without a full-canvas backdrop, so prior bullets bleed through | a `[REPLACE]` with no `AbsoluteFill` D.bg backdrop line, OR a scene change with no `[REPLACE]`. → FAIL: add the full-canvas backdrop |

Any E-row hit = FAIL the bullet, fix in rule 03, re-run. These mirror CLAUDE.md SHIFT-LEFT —
if it's listed there, it's listed here as a check.

---

## Scoring and output

Validate per scene, per bullet. Report a table — one row per bullet, five columns:

```
ANIMATION VALIDATION — <name>, Scene N
Bullet | A:Sense | B:Fit | C:Motion | D:Buildable | E:KnownFail
  B1   |  PASS   | PASS  |  PASS    |  PASS       |  PASS
  B2   |  FAIL   | PASS  |  FAIL    |  PASS       |  E1 (floating fragment)
  B3   |  PASS   | FAIL  |  PASS    |  PASS       |  PASS

FAILS (must fix before sync/render):
  S N B2 Sense:  shapes spin with no point — redesign so motion = message
  S N B2 Motion: three lines of sentence text — convert to a visual + label
  S N B2 E1:     ADD bullet relies on B1's box still being on screen — redraw it self-contained
  S N B3 Fit:    anchor "the result" not spoken in this scene's narration

VERDICT: NOT READY — 2 bullets failing
```

### Escalation teeth (so it can't rubber-stamp)
- Any FAIL (A–E) on any bullet = scene NOT READY.
- **Systemic FAIL** — the same failure mode hits ≥ half the bullets in a scene (e.g., most
  beats are text slides, or several ADD bullets are floating fragments) = the scene is
  broken by design, not a few nits — flag it as a redesign, not line fixes.
- For every bullet you must be able to **name the exact narration clause it depicts** (the
  sentence test) — "looks fine" is not a PASS; if you can't name the clause, it's a FAIL.

### Paper PASS is not READY — run layers 2 and 3
A clean 03b table only clears the DESIGN. The scene's animation is **not ready** until:

1. **Layer 2 — `storyboard/layout_validator`** has been run on the project and reports no
   overlap / off-canvas / caption-zone / extract-error for these bullets (the mechanical
   catch this paper gate can't do):
   ```
   python -m storyboard.layout_validator <project>
   ```
2. **Layer 3 — rule 23 / `vg-verification-protocol`** has inspected the ACTUAL rendered
   frames of the scene (the only layer that sees pixels). MANDATORY before advancing.

Only when 03b is all-PASS **and** layer 2 is clean **and** layer 3 frame inspection passes
is the scene's animation truly ready. Reporting 03b-PASS as "animation done" is the bug
that let render errors ship — do not repeat it.

---

## Guidelines

### Always
- Confirm Remotion can build the beat — expressible as transform / spring / value-over-range / stagger
- Run this per scene, immediately after the animation bullets are produced
- Apply the meaning test to every beat (muted, is the point clear?)
- Check staging and timing — the beat must direct attention and land on the right words
- Send failing beats back to rule 03; never sync/render a failing beat
- Report per-bullet PASS/FAIL with a specific, actionable reason
- Check every bullet against the Check E known-failure catalog (floating fragment, context-free, caption-zone, tiny primary, freeze, emoji, flex-shrink, REPLACE leak)
- After a clean 03b table, run layer 2 (`layout_validator`) and layer 3 (rule 23 frame inspection) — a paper PASS is not a finished animation

### Never
- Pass a beat Remotion cannot build (CSS animation, non-`useCurrentFrame` motion, real physics sims)
- Pass a beat that needs the narration to be understood
- Pass motion that contradicts or ignores the meaning
- Pass a text slide as an animation
- Pass a beat that is full of text or whose animation IS text (prose moving/typing)
- Pass a scene that is mostly text on a plain background — that's a slide deck
- Pass an anchor phrase that isn't spoken verbatim in this scene
- Pass a bullet that trips any Check E known-failure pattern
- Report a 03b PASS as "the animation is done" — it only clears the DESIGN; layers 2 (`layout_validator`) and 3 (rule 23 rendered frames) are still required before a scene is ready
- Proceed to render with any FAIL outstanding
