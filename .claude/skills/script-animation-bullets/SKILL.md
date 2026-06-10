---
name: script-animation-bullets
description: Writes the animation bullets under each scene — the per-beat visual timeline with timecodes, REPLACE/ADD semantics, and audio_anchor phrases. Grounded in how Remotion actually animates (frame-driven interpolate/spring, motion timed to a point via delay) so each bullet maps cleanly to renderable code. Covers the bullet format, the 9-point checklist, the 6 cinematic techniques, and the physics vocabulary. Use when writing animation bullets, adding timecodes, deciding REPLACE vs ADD, choosing an audio_anchor, or translating narration into visual cues. Not for scene-level structure, narration prose, or writing Remotion code itself.
---

# Step 4b — Writing Animation Bullets

Animation bullets are the bridge between narration and Remotion code.
Each bullet is one visual beat: what appears, when, and what audio triggers it.

You DESIGN the animation here, from the script. The bullet is the screenplay the
renderer follows literally — so design the best motion the beat can carry, don't
settle for things merely appearing.

But before "rich," the animation must be **clear**. Motion that doesn't carry meaning
just confuses the viewer. Clarity first, then richness on top.

## Contents
- Clarity first — the animation must MEAN something
- Show, don't tell — visuals carry meaning, not text
- Motion-first — the default, not fades
- Rich animation — layer, choreograph, support
- Design the motion from the script — the verb is the animation
- The three-phase motion model — enter, hold-alive, exit
- Rich-animation recipe bank (→ `.claude/skills/script_generation/references/animation_recipes.md`)
- How Remotion animates — the model every bullet must respect
- Bullet format (exact)
- The 10-point bullet checklist
- The 6 cinematic techniques
- Physics vocabulary — spring feels
- REPLACE vs ADD — the canvas rule
- Real images — asset syntax, auto-fetch, required motion
- Bullet density per scene
- Examples
- Common failure modes
- Guidelines — Always / Never

---

## Write WHAT the viewer sees, not HOW the motion behaves (you're the director, not the animator)

**The governing rule for writing bullets.** The script describes **what the audience sees and
understands** — a plain sequence of visual beats. It does NOT name animation principles or specify
low-level physics (springs, easing, damping, arcs, follow-through). The render (`vg-code-*`) is the
*animator* that supplies HOW the motion behaves, automatically. **Principles EMERGE from a
well-described sequence — you never author them by listing them.**

You specify only the **director principles**, as plain beats, by answering 5 questions per beat:
1. **What should the viewer look at?** (Staging)
2. **What happens before the reveal?** (Anticipation)
3. **How long does the viewer need to process this idea?** (Timing)
4. **What supporting motion reinforces the point?** (Secondary action)
5. **Is the visual metaphor obvious within ~1 second?** (Appeal)

❌ animator language (wrong in a script): *"apply anticipation, squash & stretch, arcs, slow-in/out, overlapping, secondary action."*
✅ storytelling language (right) — a plain beat sequence:
> 1. prompt enters · 2. everything freezes a beat · 3. branches expand into many routes ·
> 4. most fade · 5. one brightens and becomes the answer.

That ✅ sequence naturally *uses* anticipation/staging/timing/secondary-action/appeal, and the
render adds slow-in/out + arcs — without naming any. Write the `visual:` / `motion:` factor as
that kind of plain beat sequence. **The spring-feel words further below (snappy / heavy / bouncy)
are OPTIONAL director-intent shorthand only** — the render applies sensible easing/springs/arcs by
default; never itemize low-level physics in a bullet. Full split:
`references/animation_principles.md` §DIVISION OF LABOR.

---

## Clarity first — the animation must MEAN something

Rich motion is worthless if the viewer can't tell what it's saying. Every motion must
carry meaning — the movement itself should TEACH the point, not decorate it. If a
viewer would ask "why did that move?", the animation has failed.

**The sentence test (the #1 test — every bullet must pass):**
> **"What sentence of the narration is this animation explaining?"**
> Name the exact sentence/clause. If you can't, the animation is **visual noise, not
> visual explanation** — redesign it. Motion alone is not the bar; the motion must
> *depict the thing the narrator is saying.*

This is the single biggest difference between average AI-generated video and
high-retention YouTube (Fireship, 3Blue1Brown, MKBHD rarely animate just to fill the
screen). A "futuristic city / floating AI brain / neon particles" is rich and moving but
explains nothing — it fails this test even though it isn't text and isn't frozen.

These rows teach the METHOD, not visuals to reuse — derive each from YOUR script's
sentences (a different script = different visuals; copying these is the noise failure):

| Narration | ❌ Visual noise (moves, explains nothing) | ✅ Visual explanation (depicts the sentence) |
|---|---|---|
| "Hermes breaks a task into subtasks and assigns them to agents" | futuristic city, floating brain, robots | task enters → splits into Research/Coding/Validation → 3 agents work → results merge |
| "Revenue grew from $2M to $20M in three years" | dollar signs flying, CEO photo zoom | a timeline + revenue bar growing year-by-year, numbers ticking |
| "Lacking info, the model gives a confident wrong answer" | AI brain pulsing, glowing circuit board | question → empty knowledge base → answer generated → red warning |

The ✅ column is a literal play-by-play of the sentence. When the sentence has steps
(receives → splits → assigns → merges), animate them in sequence — **each beat = one
clause.** Author the ✅ column.

More worked good/bad pairs: `.claude/skills/script_generation/references/animation_sentence_test.md`.

**The muted test (secondary, reinforces it):**
> If you muted the narration, would the motion alone make the point clear?
> If not, the animation doesn't make sense — redesign it.

**Motion must map to meaning:**
- Direction means something — up = more/growth, down = less/decline, left→right = progress/time.
- Speed means something — fast = sudden/shocking, slow = gradual/heavy.
- Size means something — big = important/dominant, small = minor/shrinking.
- Together/apart means something — converging = agreement, diverging = a growing gap.
- Color follows identity — the same entity keeps its token, so the viewer tracks it.

**Make it legible:**
- One main idea per beat. If two things move at once, the viewer must know which to watch.
- Don't animate two unrelated things in opposite directions — it splits attention.
- Label what isn't self-evident. A bar is just a bar until a label says what it measures.
- Give the eye time to read before the next change (this is why beats are ~6–11s, not 2s).
- Motion that contradicts the meaning is worse than none (e.g. a "cost rising" bar that
  shrinks reads as the opposite of the point).

❌ Confusing: "shapes spin and fly around as the cost is mentioned" — energetic but
meaningless; the viewer learns nothing.
✅ Clear: "a single bar labeled COST rises and a counter climbs with it" — the motion IS
the message: cost going up.

Decoration is allowed only in SUPPORT of the clear main motion (rule above), never as
the main event. Pretty + meaningless = a failed bullet.

---

## Show, don't tell — visuals carry meaning, not text

"Rich" does NOT mean text-rich. A screen full of words is not an animation — it's a
slide. Viewers watch motion and pictures; they do not read paragraphs while listening
to narration. The narration already carries the words. The visual must carry the
MEANING through shapes, motion, and imagery — not by restating the sentence in text.

**The rule: the picture makes the point; text only labels it.**

- The narration says it. The motion shows it. Text only labels the few things the
  picture can't say on its own (a metric name, an entity name, a number).
- If a bullet's main content is a block of text, it's wrong — turn the idea into a
  visual (a bar, a flow, a metaphor object, an image) and keep only the label.
- Don't put the narration sentence on screen. Don't paraphrase it on screen either.

**Text budget per beat:**
- A short headline (2–5 words) + a handful of labels. That's it.
- Numbers are fine — a hero number IS a visual.
- No paragraphs, no full sentences, no bullet-list-of-sentences on the canvas.

❌ Text-rich (wrong): a card with three lines of sentence text explaining the point.
✅ Show, don't tell: a metaphor object or chart performs the point; a 3-word label names
it; the hero number animates in. The viewer understands by watching, not reading.

**Labels are REQUIRED, not banned (the deaf-viewer test).** "Show, don't tell" bans text as
the CONTENT — never the labels. Every visual MUST carry a short title + entity labels + any
hero number, animated in, or a sound-off viewer can't tell what they're looking at ("4.5
*what*?"). A context-free visual fails as hard as a text slide. So: **animate labels onto the
visual ✅; replace the visual with text ❌.** In the factor spec, `visual:` is the non-text
object and `text:` is its labels — a good bullet has BOTH.

When you catch yourself writing on-screen *sentences*, stop — design the picture that
makes those sentences unnecessary. (Short labels are fine; sentences are not.)

---

## Motion-first — the default, not fades

A fade is the weakest animation. Real animation is **movement**: things travel, grow,
turn, count, fill, or sweep. Design every beat around a `transform` — `translate`
(slide/rise/drift), `scale` (pop/grow/push-in), or `rotate` (spin/swing/tilt) — or a
value animating over a range (a counter, a bar filling). Opacity is a layer ON TOP of
motion, never the whole animation.

- ❌ Weak: "the title fades in"
- ✅ Strong: "the title rises 60px and scales 0.85→1, snappy spring; opacity 0→1 layered on"

Reserve opacity-only for backdrops settling or calm reading text. Everything that
should feel animated moves.

---

## Rich animation — layer, choreograph, support

One element doing one move is the floor, not the goal. Rich animation comes from THREE
things stacked into a single beat:

**1. Layer motions on one element.** Combine 2–3 transforms so the entrance has depth:
- slide + scale + slight rotate (a card that flies in and settles)
- scale-up + opacity + a soft drop-shadow growing (a number that "arrives")
- translate + a blur-to-sharp settle (a push-in reveal)
A single transform reads as "fine." Layered transforms read as "designed."

**2. Choreograph multiple elements.** A beat is a small scene with a sequence:
- **Stagger** — elements enter one-by-one (a delay per item), not all at once.
- **Lead and follow** — the hero element lands first, supporting labels follow ~6–10 frames later.
- **Cause and effect** — one element's motion triggers the next (a bar fills → its value pops → a check stamps).
Name the order and the gap between each entrance.

**3. Add supporting motion.** The main subject isn't the only thing moving:
- a backdrop that slowly drifts or a gradient that shifts
- particles, sparks, or trail dots on an impact
- a glow that pulses, a beam that sweeps, a connecting line that draws
- the held elements still breathing underneath the new one

A rich beat = a layered entrance + choreographed order + at least one supporting motion —
all of it serving ONE clear meaning (see "Clarity first" above).
A poor beat = one element, one move, then frozen — OR lots of motion that means nothing.

❌ Poor: "the bar grows."
✅ Rich: "the D.cyan bar fills 0→100% over the beat (snappy), its value counter ticks
alongside, a glow pulses at the leading edge, and when it lands a check stamps with a
2-frame shake while the backdrop keeps a slow drift."

**Don't overdo it.** Rich ≠ chaotic. One clear focal motion plus supporting motion that
serves it. If everything moves equally hard, nothing reads. Choreograph a hierarchy:
one hero motion, the rest in support.

---

## Design the motion from the script — the verb is the animation

The narration already tells you the motion. Find the verb/action in the line and make
the visual DO that physical action:

| The script says… | The motion is… |
|---|---|
| "costs exploded" | a number counts up fast, then a heavy-spring stamp + shake |
| "it pulls ahead" | a bar overtakes another, race-style |
| "it collapsed" | an element scales/drops down and settles |
| "watch it fill up" | a level rises 0→full over the beat |
| "three things happen" | three items stagger in one-by-one |
| "the gap is huge" | two markers slide apart, the distance between them growing |

Pick the motion that literally enacts the sentence. A bullet whose motion matches the
spoken verb feels designed; a generic fade feels like a slide deck.

---

## The three-phase motion model — enter, hold-alive, exit

Every element on screen for more than ~1s should have all three:

1. **Enter** — a real entrance motion (slide/scale/pop), timed to the audio_anchor.
2. **Hold-alive** — continuous subtle motion while it stays: a breathing scale (±1–2%),
   a slow drift, a pulse, a ticking counter. A frozen element >3s trips the freeze gate
   and reads as "the video stopped." Name at least one always-moving element per beat.
3. **Exit / handoff** — if the next bullet REPLACEs, the element clears (wipe/fade-down);
   if ADD, it settles to a static-but-breathing state so the new element gets focus.

Don't write "enter then sit there." Write what keeps moving while it's held.

---

## Rich-animation recipe bank

A bank of 8 reusable, buildable motion recipes — Number arrival, Race/overtake,
Staggered reveal, Fill/drain, Build-and-connect, Impact/break, Push-in reveal, and
Sweep/scan — each a layered entrance + supporting motion you fill with real content.
See `.claude/skills/script_generation/references/animation_recipes.md`. Combine
recipes across consecutive bullets so no two adjacent beats animate the same way.

---

## Production motion patterns — name one per beat (channel-grade builds)

Top technical explainers run every data beat on ONE skeleton:
**scaffold → fill (value-driven) → payoff.** Design each beat to that shape and NAME the
pattern in the bullet; video_generation renders it via `vg-code-motion-bank` (motion) and
`vg-code-composition` (layout). This is how a beat reads as "designed," not "appeared."

**The beat skeleton (default for any data/diagram beat):**
1. **Scaffold** — the empty frame draws first (axes / track / grid / title); reserve all space.
2. **Fill** — the hero value GROWS while its number COUNTS UP (ease-out); staggered if multiple.
3. **Payoff** — a one-line takeaway lands LAST (~final 20% of the beat).
Plus: a persistent reference card holds the key constant; nothing freezes.

**Pick the pattern by what the beat is about (topic-agnostic — works for any subject):**
| The beat is about… | Pattern to name |
|---|---|
| a quantity growing / shrinking (cost, users, memory, runway) | value-growth + counter |
| a breakdown / formula / bill (what it's made of) | formula-fill (terms populate → collapse to result) |
| a sequence / process / pipeline (steps, stages) | staggered fill + linked-highlight |
| before/after or A vs B (old vs new, us vs them) | comparison into reserved space |
| a state flip good→bad (works→breaks, valid→invalid) | recolor + pulse |
| a trend over time | curve draws into axes |
| the conclusion | payoff lands last |

**Composition (how to lay the beat out):**
- A persistent scene **TITLE** + a tiny uppercase **SUBTITLE** that changes per sub-beat.
- A **dashboard** when there's a lot: one hero visual (≥55%) + small KPI cards + a meter row.
- A **persistent reference card** in a corner for the constant the viewer must hold in mind.
- For a long beat, sub-beats **crossfade** (title holds); carry a result by **docking it to a
  corner** instead of wiping — continuity, not a hard cut.

Name the chosen pattern in the bullet's `pattern:` line (factor spec below) so the brief is
complete. Vary the pattern across consecutive beats so no two feel the same.

> **Purpose governs density (read first).** "Rich" / "dense" means *as much as serves
> comprehension, and no more* — NEVER decoration or complexity for its own sake. Every element
> and motion must earn its place: does it help the viewer understand, emphasize a key moment, or
> improve engagement? If not, omit it. A calm, clear beat beats a busy one. Apply the animation
> principles only where they strengthen communication — don't force them into every beat.
> (Full rule: `references/animation_principles.md` §GOVERNING RULE.) The density bar below
> prevents *dead air and missing context* — it is not a license to over-animate.

## Density bar — a beat must be RICH, not thin (the #1 quality gap)

The most common failure is a **faithful-but-thin** beat: one element on a near-empty canvas,
numbers that just appear, almost no labels, static after the entrance. It animates, but it
reads amateur next to a top channel. A thin brief ("two bars grow, value at each end") renders
thin. Every data beat must clear this DENSITY bar — write the brief to demand it:

- **Numbers COUNT, never just appear** — a value arrives by ticking (`$0 → $3.00`), not by fading in.
- **Scaffold first** — draw the track / axis / grid, then fill data into it (don't pop a finished chart).
- **Label densely** — every bar / axis / element gets a tiny uppercase mono label (a value, a unit, a name).
- **Fill the canvas** — no big empty regions: add a reference card, KPI chips, axis, gridlines, or
  supporting elements until the frame is full and ranked (dashboard density).
- **Keep moving the WHOLE beat** — counter / breathe / scan / pulse; never grow-then-freeze.

❌ thin: "two bars grow, MON short, TUE long, value at each end." → sparse, static, unlabeled.
✅ rich: "scaffold a baseline + axis; MON & TUE bars FILL while `$0→$0.30` / `$0→$3.00` COUNT UP;
   tiny labels (`PER TURN`, `×10`); a persistent `cost / token` reference card; faint gridlines;
   a slow breathe holds it alive."

Write the ✅ version. In the factor spec, `visual:` must name the **full dashboard** (not one
element) and `pattern:` must include `value-growth + counter + scaffold`. A thin beat fails
`vg-quality-animations` (density) at verify.

## Rhythm — the principle of meaningful change (no dead air, no overload)

A bullet's visual is on screen from its anchor until the next bullet's anchor. The **principle**:
the screen should change *in step with the meaning the narrator is adding.* As long as the
narrator keeps giving the viewer new information, the visual must keep revealing it. A frame
that sits **visually unchanged while the narration moves on** is dead air — the #1 "slow /
amateur" tell. The opposite failure is overload — everything at once, nothing to follow.

**Diagnose by meaning, not a stopwatch:** read each bullet's narration and ask *"is the picture
still saying something new while these words are spoken?"* If a single visual would hold while
the narrator delivers several distinct ideas, that bullet is doing too much narration with too
little visual change — **subdivide it into evolving sub-beats**, one per idea, each anchored on
a word *within* that span, all evolving the SAME visual (a detail enters, a label changes, a
value ticks).

❌ one bullet owns "The exact same task. Same files. Same request." → one static label sits
   through all three ideas (dead air).
✅ three sub-beats — `same task` (terminal types) → `same files` (file chips appear) →
   `same request` (a "queued" tag pops): one workspace that keeps revealing as the words land.

This is the EVOLVE pattern used for rhythm: a long narration span = several sub-beats evolving
one anchor visual, not one visual holding. `vg-quality-animations` flags a frozen/static hold;
the rhythm principle is *why* — match visual change to the narration's flow of meaning.

## Scene composition & sequencing — the principles (design by these, not by numbers)

> **Full theory:** `.claude/skills/script_generation/references/animation_principles.md` — the
> 4 layers (12 Principles of Animation · composition · sequencing · cognition/Mayer) that make
> motion world-class. Read it to design a scene; the summary below is the working subset.

These are the principles a motion designer composes by. They're *judgments*, not fixed values —
apply them to each beat; the right size/timing follows from the principle.

**Composition (how a single frame is arranged):**
- **One focal point.** Every frame has a single clear hero; the eye knows instantly where to look.
  Rank everything: hero > supporting > labels. Encode rank with size, weight, color, position.
- **Visual hierarchy & contrast.** The most important thing is the biggest / boldest / most
  saturated; context recedes (dim, small, grey). If everything is equal weight, nothing leads.
- **Reading path.** Arrange so the eye flows in the order the viewer should read it — use
  alignment and leading lines to carry it (title → hero → detail → payoff).
- **Grid & alignment.** Elements share a grid with consistent margins/gutters; nothing sits at an
  arbitrary spot. Alignment is what reads as "designed" vs "placed."
- **Negative space.** Empty space is a tool — it *frames* the focal point. Breathing room around
  the hero ≠ dead canvas; an unframed element floating in a void = dead canvas.
- **Grouping (gestalt).** Related elements are visually grouped (proximity + shared style) so the
  structure parses at a glance.
- **Anchored context.** A persistent title / reference / unit keeps "what am I looking at"
  answered without the narration (the deaf-viewer test).
- **One consistent system.** Reuse the same component styles + tokens everywhere → one designed
  world, not ad-hoc per beat.

**Sequencing (how a beat unfolds over time):**
- **Staging.** Present ONE idea at a time; direct attention to what matters *now*; never reveal
  everything at once.
- **Order = meaning.** Elements appear in the order they should be understood — cause before
  effect, subject before its detail, scaffold before data.
- **Anticipation → action → settle.** A move has a small wind-up, then the action, then a settle
  (overshoot/ease), never an instant start/stop — that's what makes motion feel alive.
- **Cause-and-effect chains.** One element's motion triggers the next (a bar fills → its value
  pops → a check stamps). The beat tells a micro-story, not a pile of simultaneous moves.
- **Continuity over reset.** Carry a visual across beats and evolve it (match-cut / dock) rather
  than wiping to a fresh thing — continuity is what makes it feel like one explanation.
- **Sync to meaning.** A thing enters / moves / climaxes as the narration reaches it; the visual
  climax lands on the semantic climax (see anchor modes appear/through/land).
- **Progressive disclosure.** Build complexity gradually — scaffold → populate → conclude
  (payoff) — so the viewer is never shown more than they can read at once.

When a beat feels wrong, name which principle it breaks (no focal point? everything at once?
no continuity? unframed in a void?) — that's the fix, not a number.

---

## How Remotion animates — the model every bullet must respect

The bullets are written for a real engine. Knowing how it works keeps a bullet
describable in code. (See the project `remotion` skill for the code-level rules.)

- **Everything is frame-driven.** Animation is a function of the current frame —
  deterministic, the same frame always renders the same pixel. There is no "play"
  state; there is only "what does this look like at frame N."
- **`interpolate()` maps a frame range to an output range** (e.g. frames 0–20 →
  opacity 0–1). It is ALWAYS clamped on both ends, so values don't shoot past the
  target. This is how fades, slides, and counters are built.
- **`spring()` is physics-based motion** from 0→1, controlled by `damping`
  (bounce), `stiffness` (speed), and `mass` (weight). This is how pops, slams, and
  bouncy entrances are built.
- **Motion is timed to a point by a delay offset** — the animation starts at a
  chosen frame, not before. This is exactly what the `audio_anchor` does: the
  visual fires the frame the anchor word is spoken.
- **Staggering = per-element delay.** Sequential reveals are just each element
  offset by an index, so "five cards fan out one by one" is a real, cheap pattern.

**What this means for a bullet:** describe motion the engine can produce — an
entrance (fade/slide/pop), a value animating over a frame range (a counter, a bar
filling), or a staggered reveal — and tie it to an anchor moment. Don't describe
motion that has no frame-based form ("it feels alive," "dynamic energy").

---

## Bullet format (exact)

### Pair-block format — PREFERRED (narration + visual coupled per beat)

Author each beat with its narration `>` line(s), its visual, and its anchor together. No
separate `### Narration` / `### Animation` headers — the parser auto-detects pair-block by
their absence and reassembles the full narration from the `>` lines in order.

```
## SCENE N — "Title" (M:SS – M:SS)
- **0:00 – 0:06 — [REPLACE] Headline text.**
  > The narration sentence(s) for THIS beat. <pause 0.3s>
  Visual description: motion, D.* color tokens, position.
  audio_anchor: verbatim 2–4 word phrase from THIS bullet's `>` line
- **0:06 – 0:12 — Next headline.**
  > Next narration sentence(s). <pause 0.5s>
  Visual description...
  audio_anchor: phrase from THIS bullet's narration
```

Pair-block rules:
- Each bullet's `>` line(s) hold the narration spoken during that beat
- `audio_anchor` MUST be a verbatim substring of the SAME bullet's `>` line (this is what
  kills sync drift — the words and the anchor can't disagree)
- The concatenated narration (all `>` lines, in order) must still read as natural speech
- A purely-visual sub-beat may omit `>` narration; its anchor then references a phrase from
  the most recent bullet that has narration (use sparingly)

### Per-bullet spec — describe WHAT HAPPENS as a beat sequence (director, not animator)

Each bullet states, in the body, **what the viewer SEES** — a plain sequence of visual beats
(what appears, what happens, what changes, what resolves) — plus the few structural fields the
build needs. Write the **director layer (what + when)**, never the animator layer
(springs/easing/arcs/damping — the render supplies those). Only `audio_anchor` / `anchor_mode`
are parsed; the rest is the free-form brief.

- **what happens** — THE core. A plain, numbered beat sequence of what the viewer sees, in order
  (`1. … 2. … 3. …`). This *is* the animation, described as story: what enters, what it does,
  what changes, what resolves. It implicitly answers the 5 director questions (look-at /
  before-reveal / how-long / supporting-motion / obvious-in-1s). **No principle names, no physics.**
- **text** — the exact on-screen labels / numbers (short headline + a few labels)  → *text*
- **image** — `[asset: img/x.jpg]`, or `none`  → *image*
- **transition** — `[REPLACE]` (new context) or ADD (continue / evolve the prior visual), in the headline  → *transition*
- **audio_anchor** + **anchor_mode** — verbatim phrase + appear / through / land  → *sync*
- *(optional)* **hint** — one word IF a specific build matters (`value-growth`, `pipeline`,
  `evolve`, `tiers`…); otherwise the render picks the `Kit` component from "what happens." Never
  itemize springs/easing.

Example — the beat sequence IS the animation (plain language; works for any topic):
```
- **3:18 – 3:26 — [REPLACE] The cost explodes.**
  > And then the cost quietly explodes. <pause 0.4s>
  what happens:
    1. a single COST bar sits on a labelled grid (axis $0…$3)
    2. the bar grows while a counter climbs $2.40 → $31
    3. on "explodes" it bursts — the number slams, the bar floods red
  text: "COST", "$2.40 → $31"
  image: none
  audio_anchor: explodes
  anchor_mode: land
```

The body reads like **what a viewer would describe seeing** — not "apply heavy-spring squash +
arcs + follow-through." The render turns each beat into motion (bar → `Kit.BarChart`, counter →
`Kit.Counter`) and applies the physics (ease, settle, overshoot) automatically. A bullet whose
**"what happens" is vague or missing** is an incomplete brief — the render will guess. The
sequence must be concrete enough that two people would picture the same thing.

### Legacy two-block format (still parses)

```
### Animation
- **0:00 – 0:04 — Headline text.** Supporting detail about what appears.
- **0:04 – 0:09 — [REPLACE] New headline.** What replaces the previous visual.
```

Parser requirements (both formats):
- Each bullet: `- **M:SS – M:SS — Headline.** Body text.`
- Timecodes use `M:SS` with an en-dash or hyphen between
- `[REPLACE]` tag (optional) at start of headline = clear canvas before this bullet
- Without `[REPLACE]` = ADD to existing canvas (additive)
- Legacy uses separate `### Narration` + `### Animation` headers; pair-block uses neither

---

## The 10-point bullet checklist

Every bullet must answer all 10 before it is written:

1. **Timecode** — when does this beat start and end? (`M:SS – M:SS`)
2. **Headline** — the 2–5 word phrase that names this beat
3. **REPLACE or ADD** — does this clear the canvas or add to it?
4. **Visual element** — what actually appears (shape, text, image, chart)?
5. **Enter motion** — a real transform entrance (slide/scale/pop) or value-over-range, NOT a bare fade. Which physical action, matching the script's verb?
6. **Hold-alive motion** — what keeps moving while it's on screen (breathe/drift/pulse/counter)?
7. **Color token** — which `D.*` tokens (cyan/violet/amber/red/green)?
8. **Position** — where on the canvas?
9. **audio_anchor** — what 2–4 word verbatim narration phrase fires it?
10. **Duration logic** — does the timing match the narration pace, and does the motion fit inside the beat?

Point 10 has a code reason: an animation phase that starts near the end of a short
beat is barely visible. Keep the motion inside the beat's frame budget.

---

## The 6 cinematic techniques

Every bullet should use as many of these as the beat allows.

### 1. Named metaphor object
Don't write "a visual." Name the specific object:
- Bad: "a comparison appears"
- Good: "two glass capsules race side by side"

### 2. Color identity (assign once, never break)
Assign `D.*` color tokens to entities early and keep them consistent:
- `D.cyan` = your product / the hero
- `D.violet` = the competitor / the other entity
- `D.amber` = cost / warning
- `D.red` = failure / danger
- `D.green` = success / win

### 3. Exact quantities (numbers, not adjectives)
The engine animates a count, not a vibe:
- Bad: "several items appear"
- Good: "five cards fan out, staggered"

### 4. Physics intent (name the spring feel)
Name the motion in the engine's terms so it's directly buildable — see the physics
vocabulary below.

### 5. Audio anchor target (echo the narration)
The bullet body echoes the narration trigger phrase so the anchor self-selects and
the motion fires on the spoken word:
- narration: "watch the needle move"
- bullet body contains: "the needle"

### 6. Real image vs coded vector
- Real image (`[asset: img/...]`) for named real-world things: logos, people, places
- Coded vector for abstract concepts: flows, comparisons, processes

---

## Physics vocabulary — spring feels

These map directly to `spring()` config. Name the feel; the code follows.

| Feel | Config intent | Use for |
|---|---|---|
| `bouncy spring` | low damping (~8) | playful entrances, node pops |
| `snappy spring` | damping ~20, stiffness ~200 | confident reveals, bars landing |
| `heavy spring` | damping ~12–15, stiffness ~80–100, mass ~2 | weighty slams, big-number stamps |
| `smooth reveal` | high damping (~200) | calm fades, backdrops settling |

For value animations (counters, bar fills, wipes) use a clamped `interpolate` over a
frame range rather than a spring — e.g. "counter ticks 0→[number] over the beat."

---

## Motion-feel fundamentals (the pro-vs-amateur difference)

Springs handle entrances, but a lot of motion is `interpolate`-based (counters, bars,
wipes, slides). These three fundamentals are what separate professional motion from
robotic motion. Note them in the bullet so video_generation authors them right.

**1. Easing — never linear.** Real motion accelerates and decelerates; it doesn't start
or stop instantly. A linear `interpolate` looks mechanical. Specify an ease:
- **ease-out** (fast→slow) for things ARRIVING — a counter landing, a bar filling, an
  element sliding into place. The most common; feels confident.
- **ease-in-out** for things travelling across the screen (a marker moving A→B).
- **linear** ONLY for continuous ambient loops (a steady drift/scan) — never for a reveal.
- In the bullet: say "counter eases out to [number]" / "bar fills, ease-out" — not just
  "counter goes up." (Code: `interpolate(..., {easing: Easing.out(Easing.cubic)})`.)

**2. Spacing = the feel.** Timing is *how long*; spacing is *how far it moves per frame*.
Same duration, different spacing = different feel: even spacing reads mechanical; big
early steps that shrink = heavy/settling; small early steps that grow = anticipation.
You get this for free from springs/easing — so the rule is simply: **a reveal must ease
(uneven spacing), never move at constant speed.**

**3. Attention direction — motion guides the eye.** Only ONE thing should pull focus at
a time, and motion is how you point. When a new element matters, it moves (enters/pulses)
while everything else holds still or dims. Never animate two things equally at once — the
eye doesn't know where to look. State which element leads each beat: "the COST bar leads;
labels hold." This is the staging/hierarchy principle in motion form.

---

## Sync to MEANING, not just the word — anchor modes (appear / through / land)

Basic sync shows the visual when the word is spoken. Professional sync ties the visual to
where the word's MEANING completes. Grounded in audiovisual-perception research: the
synchrony window is ≈185 ms, and **a visual that LEADS the audio reads cleaner than one
that lags** (asynchrony is detected more easily when audio comes first). So the timing
depends on the word's TYPE. Pick one of three modes per anchor:

| Word type | Examples | Mode | Timing |
|---|---|---|---|
| **Noun / object** | bus, cache, scout, the meter, a subagent | **`appear`** | start the entrance at **`word_start − ~2–3 frames`** (the small visual lead) |
| **Action verb (process)** | growing, shrinking, searching, filling, draining | **`through`** | the value animates across **`word_start → word_end`** (motion runs for the word's duration) |
| **Outcome / result / impact** | explodes, expires, collapses, fails, wins, lands | **`land`** | the **climax lands on `word_end`**; the wind-up/anticipation runs *during* the word → `framesFrom = word_end − entranceFrames` |

Why `land` isn't "late": the impact's wind-up fills the word (no dead beat), and the climax
hits as the word's meaning completes — you're syncing the visual *climax* to the *semantic*
climax, which is what reads as cinematic. (E.g. "cost **explodes**": expansion begins mid-word,
the blast lands as "explodes" ends — never the instant the word starts.)

**Author it in the bullet** (pair-block), one line under the anchor:
```
- **3:18 – 3:26 — Cost explodes.**
  > And the cost explodes. <pause 0.4s>
  The COST bar's wind-up shakes, then bursts — shards fly, heavy spring.
  audio_anchor: explodes
  anchor_mode: land
```
- Default when omitted: `appear` (start-of-word) — the current behavior, always safe.
- `through` and `land` need word **end** times → they take effect once forced alignment
  provides `word_end`; without it they degrade gracefully to `appear`.
- Classify by the anchor word: concrete noun → `appear`; `-ing`/process verb → `through`;
  result/impact verb → `land`. When in doubt for a reveal whose punch matters, use `land`.

**Two layers of sync (don't confuse them):**
- **`anchor_mode`** sets WHEN the whole bullet's slot starts (`framesFrom`) — coarse, the
  build computes it from the anchor word's start/end.
- **`findWord(w)` / `findWordEnd(w)`** are bullet-code bindings that return the bullet-relative
  frame where a word STARTS / FINISHES — use them INSIDE the code for sub-beat timing, e.g.
  `const land = findWordEnd('explodes') ?? durationInFrames*0.6;` then climax the impact at
  `land`. This is how a `land`/`through` beat times its motion to the actual spoken word.

---

## REPLACE vs ADD — the canvas rule

- **ADD (default):** the bullet adds to what is already on screen. Use when an
  element appears alongside or inside existing structure.
- **REPLACE:** the bullet wipes all prior visuals and starts fresh. Use when the
  scene's visual context changes entirely.

Mark REPLACE in the headline, and start the body with a full-canvas backdrop so prior
bullets don't bleed through:
```
- **0:12 – 0:16 — [REPLACE] New workspace.** Full-canvas D.bg backdrop fades in over
  ~10 frames covering all prior bullets, then new content appears on top.
```

| Bullet intent | Use |
|---|---|
| New element appears alongside / inside existing | ADD |
| Same metaphor continues, more detail added | ADD |
| Entire scene changes visual context | REPLACE |
| A new sub-topic begins after the previous concluded | REPLACE |
| Same object continues, only a detail changes | **EVOLVE** (ADD — see below) |

---

## EVOLVE a persistent visual — the continuity pattern (slideshow → continuous)

The #1 difference between a slideshow and a top channel: they keep **ONE diagram on screen for a
whole scene and EVOLVE it** — the title/labels/highlights change, one element is added — instead of
wiping to a fresh visual every beat. Design a scene this way whenever consecutive beats are about
the **same object**.

**How to author it (uses ADD — no new syntax):**
- Pick ONE **anchor visual** for the scene (the diagram/chart/grid the whole scene is about).
- **Bullet 1** builds it (`[REPLACE]` + scaffold). **Bullets 2..N are ADD and EVOLVE it:** each
  REDRAWS the anchor diagram at its **settled state** (bullets are self-contained), then animates
  **ONLY its delta** — move the highlight, swap the title/subtitle, recolor a cell, add one
  element, tick a value. **The diagram itself does NOT re-enter.**
- Use `[REPLACE]` only when the scene's SUBJECT actually changes (a genuinely new diagram).

❌ slideshow: B1 chart → `[REPLACE]` B2 different chart → `[REPLACE]` B3 another — feels sliced.
✅ continuous: B1 builds the token grid → B2 (ADD) **same grid**, highlight moves + title swaps →
   B3 (ADD) **same grid**, K/V cells recolor green "cached" → one evolving explanation.

In the factor spec write: `pattern: evolve (anchor: <the diagram>; delta: <what changes this beat>)`.
Renders via `vg-code-composition` §EVOLVE. This is the highest-leverage lever for the
"designed, continuous" feel — plan most multi-beat scenes around an anchor visual, not N visuals.

---

## Real images — asset syntax, auto-fetch, required motion

Some beats land harder with a real photo or logo than with drawn shapes. Reference an
asset in the bullet body with `[asset: img/<name>.ext]` (path relative to the project's
`public/`). The build's asset-resolution step auto-fetches any missing asset from a
commercial-safe source and records attribution; existing files are left untouched.

**When to use real vs vector:**

| Bullet shows | Use |
|---|---|
| A named company's logo | Real image |
| A specific person / job site / real location | Real image |
| A number, ratio, or stat | Vector (drawn) |
| A metaphor (the metaphor IS the visual) | Vector |
| A label, list, or text card | Vector |

The test: would a viewer expect to recognize a *real-world* thing? If yes, real image.
For a number / metaphor / list, real photos read as stock-slide filler.

**Every image MUST move** — a static image trips the freeze gate (>3s static = FAIL).
Name one slow primary motion in the body:

| Motion | Use for |
|---|---|
| Ken Burns (slow zoom + drift) | photos |
| Logo pop (bouncy spring + idle breathe) | logos |
| Push-in reveal (scale settle + fade), then Ken Burns | hero photo entrance |
| Crossfade (opacity swap, both moving) | swapping two photos in one bullet |

One motion per image — don't stack zoom + pan + rotate. Alternate Ken Burns direction
scene-to-scene so consecutive photos don't drift the same way. For a specific named
asset (a real logo, a particular chart), pre-place it by hand — blind auto-fetch can
pick the wrong image. Never use copyrighted stock; logos in editorial/factual context
are fine.

---

## Bullet density per scene

| Scene length | Target bullets | Seconds per bullet |
|---|---|---|
| ~30s | 3–5 | 6–10s each |
| ~60s | 6–9 | 7–10s each |
| ~90s | 8–12 | 7–11s each |

Too few bullets → the scene feels static. Too many → visuals change faster than the
viewer can absorb. This bullet rhythm is also the visual engagement beat (rule 01).

---

## Examples

### Good bullet set (motion-rich additive build)

```
### Animation
- **0:00 – 0:03 — Cold open.** Black canvas. The hero number punches in centered, D.amber,
  heavy spring; counter ticks 0→final, then a stamp + 2-frame shake. Holds with a ±1.5% breathe.
- **0:03 – 0:07 — Context.** Below the number, a label rises 40px into place, snappy spring,
  D.text_dim; the hero number keeps breathing above it.
- **0:07 – 0:12 — [REPLACE] The turn.** Canvas wipes. A glass capsule slides in from the left
  and scales 0.9→1, snappy spring, D.cyan; a slow drift keeps it alive through the hold.
```

Every element enters with a transform (punch / rise / slide+scale) and stays alive
(breathe / drift) — no bare fades, nothing frozen.

### Bad bullet (vague, frozen, no anchor)

```
### Animation
- **0:00 – 0:05 — Stuff happens.** Some text and a chart fade in with dynamic energy.
```

Fails: bare fade, no transform, no hold-alive motion, no audio_anchor, "dynamic energy"
has no frame-based form.

(Examples are illustrative — fill the headline/body with your real, sourced facts.)

---

## Common failure modes

| Failure | Looks like | Fix |
|---|---|---|
| Generic visual | "three boxes appear" | name the specific object |
| Adjective-only motion | "bars rise dramatically" | "bars rise 0→80% over ~25 frames, heavy spring" |
| Missing color | "a card appears" | "a D.cyan card appears" |
| Missing anchor | no `audio_anchor` line | add a 2–4 word verbatim phrase from narration |
| Anchor not in narration | anchor phrase doesn't exist in the script | pick a phrase spoken verbatim in this scene |
| Generic anchor | `audio_anchor: "and then"` | pick a distinctive phrase, not a connector |
| Wrong mode | scene changes but no REPLACE | add `[REPLACE]` + a backdrop line |
| Static image | `[asset:]` with no motion | add Ken Burns / Logo pop — static fails the freeze gate |
| Real photo for a number/metaphor | stock photo behind a stat | use vector |
| Late animation phase | motion starts near the beat's end | move it earlier so it finishes inside the beat |
| Bare fade | "X fades in" with no transform | add a slide/scale/pop; layer opacity on top |
| Frozen hold | element enters then sits static | add a hold-alive motion (breathe/drift/pulse) |
| Motion ignores the line | generic move unrelated to the words | make the visual enact the script's verb |
| Meaningless motion | shapes spin/fly with no point | redesign so the motion IS the message; pass the meaning test |
| Motion contradicts meaning | "rising cost" bar shrinks | match direction/size to the meaning (up = more) |
| Split attention | two unrelated things move at once | one main idea per beat; demote the rest to support |
| Text-rich slide | card with sentences / paragraphs | turn the idea into a visual; keep a 2–5 word label only |
| Narration on screen | the spoken sentence shown as text | show the picture; the narration already says the words |

---

## Guidelines

### Always
- Pass the meaning test: muted, the motion alone makes the point clear
- Show, don't tell — the visual makes the point; text only labels it (2–5 word headline + labels)
- Map motion to meaning (direction/speed/size/together-apart say something)
- One main idea per beat — the viewer always knows what to watch
- One visual beat per bullet
- Make each beat rich: a layered entrance + choreographed order + ≥1 supporting motion
- Choreograph a hierarchy — one hero motion, the rest in support
- Design motion from the script's verb — the visual enacts what the line says
- Enter with a transform (slide/scale/pop) or value-over-range, not a bare fade
- Give every held element a hold-alive motion (breathe/drift/pulse/counter)
- Name the specific object (not "a visual")
- Time the entrance to the audio_anchor — start on the spoken word, not before
- Assign and keep color identity
- Keep the animation inside the beat's frame budget
- Match bullet duration to narration pace
- Use real, researched numbers in any visual

### Never
- Make a beat text-rich — no paragraphs / full sentences on the canvas; the picture makes the point
- Put the narration sentence (or a paraphrase of it) on screen
- Animate for decoration — motion that doesn't carry meaning just confuses
- Let motion contradict the meaning (a "rising cost" that shrinks)
- Move two unrelated things at once so attention splits
- Ship a one-element, one-move, then-frozen beat — that's the floor, not the goal
- Make everything move equally hard — choreograph a focal hierarchy instead
- Use opacity-only as the whole animation (except backdrops / calm reading text)
- Leave an element frozen >3s (trips the freeze gate)
- Write a bullet with no audio_anchor
- Describe motion with no frame-based form ("feels alive," "dynamic energy")
- Reuse a color token for a different entity mid-video
- Put more than one visual beat in a bullet
- Start a key animation phase so late it can't finish inside the beat
- Invent a number for a visual
- Exceed the scene's time window with bullet timecodes
