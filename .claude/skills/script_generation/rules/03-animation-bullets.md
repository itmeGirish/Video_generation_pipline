---
name: 03-animation-bullets
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
- Rich-animation recipe bank (→ references/animation_recipes.md)
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

## Clarity first — the animation must MEAN something

Rich motion is worthless if the viewer can't tell what it's saying. Every motion must
carry meaning — the movement itself should TEACH the point, not decorate it. If a
viewer would ask "why did that move?", the animation has failed.

**The meaning test (every bullet must pass):**
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

When you catch yourself writing on-screen sentences, stop — design the picture that
makes those sentences unnecessary.

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
See [references/animation_recipes.md](../references/animation_recipes.md). Combine
recipes across consecutive bullets so no two adjacent beats animate the same way.

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

```
### Animation
- **0:00 – 0:04 — Headline text.** Supporting detail about what appears.
- **0:04 – 0:09 — [REPLACE] New headline.** What replaces the previous visual.
```

Parser requirements:
- Section starts with `### Animation`
- Each bullet: `- **M:SS – M:SS — Headline.** Body text.`
- Timecodes use `M:SS` with an en-dash or hyphen between
- `[REPLACE]` tag (optional) at start of headline = clear canvas before this bullet
- Without `[REPLACE]` = ADD to existing canvas (additive)

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
