---
name: vg-visual-map
description: "Content-type to visual-type map. Every scene type has a canonical implementation pattern, sketch, and code skeleton. Read BEFORE authoring any bullet code. Use whenever choosing which visual to use, designing a scene, or any request like "which visual for this," "content type map," "visual map," "scene design pattern," "canonical visual," or "what animation fits this idea.""
model: opus
---

# Visual Map — Meaningful Scene Design

## Contents

- The One Rule
- Before Writing Any Code — 3 Questions
- Content-Type Map
- Scene Narrative Arc (how bullets within a scene should build)
- Color Semantics (consistent across all scenes)
- Typography Rules (matches config.yaml defaults)
- Prohibited Patterns (never generate these)
- Meaningful Animation Design
- Quick Reference: "Is my visual meaningful?"
- Examples
- Guidelines

---

## The One Rule

**Every visual must answer: "What would a viewer understand from this screen alone, with no audio?"**

If the answer is "nothing — it just looks dramatic," the visual is wrong. Rewrite it.

### The sentence test (apply to EVERY bullet)

> **"What sentence of the narration is this animation explaining?"**

If you can't name the exact sentence, the animation is **visual noise, not visual
explanation** — the single biggest difference between average AI-generated video and
high-retention YouTube (Fireship / 3Blue1Brown / MKBHD rarely animate just to fill the
screen). Motion alone is NOT the bar — the motion must *represent the thing the narrator
is saying*.

This is the failure our other checks MISS: a "futuristic city + floating AI brain + neon
particles" is moving, rich, and non-text, so it passes the freeze check (A4) and the
text-slide check (V12) — yet it explains nothing. The sentence test is what catches it.

These rows teach the METHOD, not visuals to reuse — derive each from THIS script's
sentences. A different script = different visuals; reusing these rows verbatim is itself
the noise failure (two scripts with the same animation can't both be depicting their own
narration).

| Narration | ❌ Visual noise (moves, explains nothing) | ✅ Visual explanation (represents the sentence) |
|---|---|---|
| "Hermes breaks a task into subtasks and assigns them to agents" | futuristic city, floating brain, robots walking | task enters Hermes → splits into Research/Coding/Validation → 3 agents work → results merge |
| "The client requests data from the remote server's tools" | server rack spinning, code rain, cloud icons | client →request arrow→ server → connects to DB/Gmail/Slack → responses return |
| "Revenue grew from $2M to $20M in three years" | dollar signs flying, CEO photo zoom, office stock footage | timeline + a revenue bar growing year-by-year, numbers ticking up |
| "Lacking info, the model gives a confident wrong answer" | AI brain pulsing, glowing circuit board, particles | question → empty knowledge base → answer generated → red warning icon |
| "The app queries the DB and returns matching records" | programmer typing, terminal scrolling, coffee cup | search box → query sent → DB searched → matching rows highlight → results return |

The ✅ column is a literal play-by-play of the sentence; the ❌ column is "looks
technical / looks AI" but maps to no sentence. **Author the ✅ column.** When a bullet
spans a sentence with steps (receives → splits → assigns → merges), animate those steps
in sequence — each beat = one clause.

More worked good/bad pairs: `.claude/skills/script_generation/references/animation_sentence_test.md`
(the sentence test originates in the script_generation skill; this rule implements it).

---

## Before Writing Any Code — 3 Questions

1. **What is the CONTENT TYPE of this bullet?** (pick from the map below)
2. **What must the viewer UNDERSTAND?** (write one sentence)
3. **What is the SIMPLEST visual that proves that?** (pick the canonical pattern)
4. **Which `remotion` rule defines how that visual behaves?** Read it before coding —
   the remotion skill is the source of truth for the primitive's correctness:
   animation → `remotion/rules/animations.md` + `timing.md`; staggered reveals →
   `sequencing.md`; text/typewriter → `text-animations.md`; transitions →
   `transitions.md`; text that may overflow → `measuring-text.md` (`fitText()`);
   images → `images.md`. (Same rules rule 04 authors against and rule 23 verifies against.)

Only then open the code.

**The skeletons are templates — not examples to copy.** Replace every ALL_CAPS placeholder with the actual content from the script bullet. Stats, labels, quotes, step descriptions, row data — all come from the script, never from these docs.

---

## Content-Type Map

> **MANDATORY RULE — NO COPY-PASTE OF EXAMPLE VALUES**
> Every code skeleton below uses ALL_CAPS placeholder names (`SCRIPT_VALUE`, `SCRIPT_LABEL`, `ROWS`, `STEPS`, `QUOTE_TEXT`, etc.).
> You MUST replace every ALL_CAPS placeholder with the actual value from the current script bullet.
> Copying the example values from these skeletons into a real scene produces wrong content for every script except the one the example was written for.
> If you cannot map a placeholder to something in the script, you are using the wrong TYPE — go back and pick the correct content-type pattern.

---

Pick the TYPE that matches the bullet's content, then read its full spec in
`references/content-types.md` (when-to-use · layout · animation · do/don't):

| TYPE | Use when the bullet is… |
|---|---|
| 1 — Single Statistic | ONE number that is the whole point (cost/waste/perf shock; a hook) |
| 2 — Quote / Testimonial | a verbatim quote from a named real person |
| 3 — Ranked Comparison | A vs B vs C on one metric — who wins / ranks where |
| 4 — Step-by-Step Process | how something works, 3–6 ordered steps |
| 5 — Before / After Split | two states of one thing, real numbers both sides |
| 6 — Timeline | chronology / history / release order |
| 7 — Concept Definition | defining one term + its key parts |
| 8 — Data Table / Matrix | structured rows×cols, or a 2-axis decision grid |
| 9 — Narrative Text Card | a line that must be *read* (thesis, punchline) — sparingly |
| 10 — Counter / Progress Reveal | a value building/filling to a final state |
| 11 — Metaphor-as-World | the bespoke HERO scene — a metaphor made physical, NO template |

**Do NOT invent a visual type outside this set** unless the script body explicitly names a bespoke
animation (then it's TYPE 11 — the one hero scene, owned by `visual-story-engine`'s mandate).

## Scene Narrative Arc (how bullets within a scene should build)

A scene is not a collection of independent slides. It's a story with a beginning, middle, and end. Design bullets to PROGRESS:

```
Bullet 1: ESTABLISH — set the context, introduce the subject
Bullet 2: REVEAL — show the key fact / data / tension
Bullet 3: PROVE — evidence, comparison, or mechanism
Bullet 4: LAND — conclusion, implication, or call to action
```

**Example — S01 (86% confabulation):**
- B1: Establish — show an AI being used for real work (clean interface)
- B2: Reveal — show the quote: "like a limb amputated" (quote card)
- B3: Prove — show the 86% stat with bar chart vs other models
- B4: Land — text card: "Highest confabulation of any frontier model"

**Each bullet adds ONE new idea.** If you find yourself re-showing something from a prior bullet, you're padding — delete it or merge.

---

## Color Semantics (consistent across all scenes)

| Color | Token | Meaning | Use for |
|---|---|---|---|
| Cyan | D.cyan | Information, neutral highlight | Labels, active steps, key terms |
| Red | D.red | Problem, danger, warning | Bad stats, errors, risks |
| Green | D.green | Solution, success | Good outcomes, improvements |
| Amber | D.amber | Caution, transition | Mixed results, context |
| text_dim | D.text_dim | Secondary | Supporting text, annotations |
| text | D.text | Primary | Main body content |
| surface | D.surface | Container background | Cards, rows, panels |

**Never invent colors with raw hex.** Use only D.* tokens.

---

## Typography Rules (matches config.yaml defaults)

| Use | Font token | Size range | Weight |
|---|---|---|---|
| Hero numbers, key stats | D.font_display | width × 0.12–0.22 | 700 |
| Headlines, titles | D.font_display | width × 0.022–0.030 | 700 |
| Body text | D.font_display | width × 0.014–0.018 | 400 |
| Labels, annotations | D.font_mono | width × 0.008–0.012 | 400 |
| Code, technical values | D.font_mono | width × 0.010–0.014 | 400 |
| Citations | D.font_mono | width × 0.007–0.009 | 400 |

**Never name a font family directly.** Always use D.font_display or D.font_mono — these resolve from config.yaml and are pre-loaded by Root.tsx.

---

## Prohibited Patterns (never generate these)

These patterns appear in bad authoring. The pipeline validator will flag them.

| Pattern | Why it fails |
|---|---|
| **Text as the visual** (prose/sentences/bullet-list filling the frame · OR a data table/record FLATTENED into a run-on text string · OR a "comparison" drawn as two TEXT panels) | It's a slide, not an animation — the **PPT tell**. The narration already says the words; the visual must SHOW the idea, not reprint it. **MEASURABLE BUDGET — at ANY single frame, simultaneous on-screen text ≈ ONE headline (≤~6 words) + a few labels/numbers; if a viewer has to READ a block to get the point, it's narration wearing a visual's clothes → cut it.** Three concrete forms of this failure: (a) a table/record rendered as a long text STRING ("Plan Price Seats Pro 29 5 Team 49 20 …") — the structure that made it a table is gone, so it's just data-as-prose; (b) a contest ("A vs B", "X beats Y") drawn as two text BLOCKS — instead SHOW the contest as an EVENT: the two answers appear, one wrong (red ✗) one right (green ✓), the winner highlights/pops; (c) a beat whose only motion is text fading/typing in. **The positive rule: every narration sentence must trigger one VISIBLE EVENT** — an object moves/transforms, a value counts, a row highlights, a camera pushes — *not* a line of text appearing. (Real miss: the "TEXT" side of the contest was a 15-token run-on string in a bordered panel → read as a dim paragraph; the fix is to show the text-fed AI ANSWERING WRONG, not to print the table.) |
| **Text-only "animation"** (the motion is words fading/typing in, nothing else moves) | Animating prose is not a visual. If the only thing happening is text appearing, there is no visual meaning — pick a real content-type from the map above. |
| **Skeleton / placeholder content** (a document, code panel, chat, table or UI drawn as featureless GRAY BARS / empty blocks / lorem-ipsum lines standing in for the real text) | A muted viewer sees "gray bars in a box" — they CANNOT tell it's a contract / code / a chat / what's being reviewed. Placeholder bars are not content. The artifact must carry REAL legible content: a contract = a title + numbered clause HEADINGS + actual legal sentence fragments; code = real syntax-colored lines; a chat = real message text. A "redline" must strike a REAL word and insert a REAL replacement, not recolor a blank bar. This is the muted-viewer / viewer-sense failure (same class as "colored bars for a conversation"): if the picture only reads as the real thing once you add the narration, it fails. See `vg-code-artifacts` §"real content, not skeleton bars". |
| Narration sentence printed on screen | Redundant with the audio; wastes the frame. Show the picture the words describe. |
| Screen shattering / glass cracking | Dramatizes rather than informs. Viewer learns nothing. |
| Shards / fragments flying outward | Pure spectacle, no data meaning |
| Heartbeat rings pulsing around a number | The pulsing adds no information about the number |
| "LET ME SHOW YOU" words assembling | Filler between bullets — says nothing about content |
| Fake ChatGPT / Claude / Gemini UI with branding | Places brand names on screen |
| Font weight 900 on body/label text | Looks aggressive; reserve 700 for hero numbers only |
| Raw `#hex` color in code | Breaks design token consistency |
| `frame * N` escalating transforms | Elements will fly off screen at large frame values |
| CSS `transition:` or `animation:` | Silently ignored in Remotion render — use `interpolate` |
| Inner `position: 'absolute'` for siblings | Causes layout collisions (rule 19) |
| Stagger > 20 frames between list items | Feels too slow; 8–15 frames is the correct range |

---

## Meaningful Animation Design

### The Animation Rule

**Every animation must be the visual verb of the narration sentence.**

When the narrator says "grows", something grows.
When they say "crashes", something falls.
When they say "compare", two things appear side by side.
When they say "eighty-six percent", the bar fills to 86%.

If you cannot write a one-line mapping between the animation and the narration verb, the animation is decorative noise — delete it.

---

### Narration Verb → Animation Action Map

This is the canonical mapping. Pick the animation that matches the word the narrator actually says.

| Narrator says | Animation |
|---|---|
| "grows", "rises", "increases" | Bar or value grows upward/rightward; counter counts up |
| "falls", "drops", "decreases" | Bar shrinks; value counts down; element slides downward |
| "appears", "introduces", "reveals" | Element fades or springs in from opacity 0 |
| "compares", "versus", "against" | Two panels appear side by side |
| "ranks", "orders", "top/bottom" | Bars sort by height; rows reorder with animation |
| "steps through", "first/second/third" | Steps appear one at a time in sequence |
| "highlights", "focuses on" | Other elements dim (opacity 0.3); highlighted element brightens |
| "spreads", "expands" | Element scales outward from center |
| "connects", "links", "flows to" | Arrow or line draws from source to destination |
| "breaks down", "splits into" | One element divides into labeled sub-elements |
| "outperforms", "beats", "wins" | Winner bar/card grows taller/brighter; others dim |
| "fails", "struggles", "can't" | Element shakes slightly (small ±4px), turns D.red |
| "locks in", "confirms", "proves" | Element gets a D.green border/check; brief scale pulse ×1.05 then back |

---

### Timing: Sync Animation to the Spoken Word

Use `findWord()` to make animation fire exactly when the narrator says the key term — not at frame 0, not guessed.

```js
// Replace KEY_WORD with the actual spoken word from the narration (e.g. 'seventy', 'growth', 'failed')
// Replace FILL_VALUE with the actual decimal value from the script (e.g. 0.73)
const anchorFrame = findWord('KEY_WORD') ?? findWord('NUMERIC_FALLBACK') ?? 8;
const barFill = interpolate(
  frame,
  [anchorFrame, anchorFrame + 28],
  [0, FILL_VALUE],
  { extrapolateRight: 'clamp' }
);
```

**Always null-coalesce findWord() to a fallback frame** — Whisper may mishear the word. Without a fallback the bullet shows a static frozen frame.

**Stagger list items to spoken order** — use the actual words the narrator says for each item:
```js
// Replace WORD_1/WORD_2/WORD_3 with the key word spoken for each item in the narration
const item1Frame = findWord('WORD_1') ?? 5;
const item2Frame = findWord('WORD_2') ?? item1Frame + 20;
const item3Frame = findWord('WORD_3') ?? item2Frame + 20;
```

---

### Animation Physics → Emotional Register

The spring config controls HOW the animation feels. Match it to what the content means emotionally.

| Content meaning | Spring config | Effect |
|---|---|---|
| Important stat landing hard | `{ damping: 8, stiffness: 250 }` | Bouncy — demands attention |
| List items building up | `{ damping: 20, stiffness: 200 }` | Snappy — efficient, informative |
| Context/supporting info | `{ damping: 200 }` | Smooth — unobtrusive |
| Problem / warning revealed | `{ damping: 12, stiffness: 180 }` | Medium bounce — notable but not alarming |
| Final conclusion | `{ damping: 15, stiffness: 80, mass: 2 }` | Heavy, slow — weight of conclusion |

```js
// CORRECT — bouncy for a key stat that the narrator emphasizes
const numScale = spring({ frame, fps, config: { damping: 8, stiffness: 250 } });

// CORRECT — smooth for a supporting label that appears alongside
const labelOp = interpolate(frame, [12, 24], [0, 1], { extrapolateRight: 'clamp' });
```

**Never use the same spring config for every element in a scene.** If everything bounces identically, nothing feels important.

---

### Entrance Direction Carries Meaning

Where an element enters FROM communicates structure. Be deliberate.

| Entrance direction | Meaning it implies |
|---|---|
| Fade from opacity 0 (no movement) | Neutral reveal — information appears |
| Slide from LEFT | Sequential next item; chronological progression |
| Slide from BOTTOM | Building upward; growth; something rising |
| Slide from TOP | Falling into place; consequence; result |
| Scale from 0 → 1 (center) | Emphasis; the thing matters; zoom in |
| Scale from 1.2 → 1 (overshoot in) | Importance; this is the big number |
| No entrance animation (immediate) | The element was always there; continuity |

**Never use random directions.** If three items appear and they all slide from different random directions, the viewer reads chaos, not structure.

---

### Duration: How Long an Animation Should Take

Animation duration signals importance. Slow = important. Fast = routine.

| Element type | Duration range (frames at 30fps) |
|---|---|
| Hero number (the key stat) | 20–35 frames to reach final value |
| Supporting bar / secondary stat | 15–22 frames |
| Label / caption fade-in | 8–15 frames |
| List item entrance | 10–18 frames each, staggered 8–12 frames apart |
| Transition between bullets (REPLACE backdrop) | 6–10 frames |
| Highlight / color change | 6–10 frames |
| Typewriter text | CPS 15–25 (chars per second); full phrase by 50% of bullet duration |

**Never let an animation extend past 60% of durationInFrames.** The viewer needs to see the RESULT (finished state) for the remaining 40%, not watch a perpetual reveal.

```js
// CORRECT — animation completes at 40% of bullet, viewer reads it for 60%
const revealEnd = Math.round(durationInFrames * 0.40);
const barFill = interpolate(frame, [8, revealEnd], [0, 0.86], { extrapolateRight: 'clamp' });

// WRONG — animation runs to the end, viewer never gets to read the result
const barFill = interpolate(frame, [8, durationInFrames], [0, 0.86], { extrapolateRight: 'clamp' });
```

---

### Hold State: What Stays on Screen After Animation

After the animation completes, the element must HOLD in its final state and remain readable. This is where the viewer actually absorbs the information.

Rules for the hold state:
- All text must be at opacity 1 and fully visible
- Bars and numbers must be at their final values
- No oscillation, no blinking, no continuous motion in the hold state
- ONE exception: a slow ambient pulse (Math.sin(frame * 0.05) giving ±2% scale) is acceptable on a hero number to keep it "alive" — but only on the hero, never on labels/bars

**Blinking cursors must stop.** A typewriter cursor that keeps blinking after text is complete distracts from reading. Stop the blink after `frame > textCompleteFrame + 10`.

```js
// CORRECT — cursor stops after text is done
const textDone = charsVisible >= QUOTE.length;
const blink = textDone ? 0 : (frame % 16 < 8 ? 1 : 0);
```

---

### Multi-Element Scenes: Every Element Must Earn Its Place

Before adding any element, ask: **"What does the viewer understand from this element that they didn't understand without it?"**

If the answer is "nothing — it fills space / looks good," remove it.

**The 3-element rule:** most bullets need only 3 visual elements:
1. The KEY element (the thing the narration is about)
2. The CONTEXT element (what makes the key element meaningful — a label, comparison, or scale reference)
3. The CITATION (source, bottom-right, always)

If you have 8 elements in a bullet, 5 are probably decoration. Cut them.

---

### Animation Checklist (per bullet, before seeding)

- [ ] Every animation maps to a verb in the narration
- [ ] Key animation fires near when narrator says the key word (use `findWord()`)
- [ ] Spring config matches emotional register of the content
- [ ] Entrance direction is deliberate, not random
- [ ] Animation completes by 60% of `durationInFrames`
- [ ] Hold state is static and readable
- [ ] Typewriter cursor stops after text is complete
- [ ] No more than 3 core visual elements (key + context + citation)
- [ ] No continuous spinning/orbiting/pulsing on non-hero elements

---

## Quick Reference: "Is my visual meaningful?"

Ask these three questions before seeding:

1. **Would a deaf viewer understand the point?** (no audio, no captions)
2. **Is the animation adding information, or just adding motion?**
3. **Could you describe the visual in one sentence that matches the narration?**

If any answer is "no" → rewrite the bullet before seeding.

## Quick Reference: "Is my visual NOVEL?" (clarity is necessary, not sufficient)

A visual can be perfectly clear and still be **forgettable** — the brain habituates to patterns it has
seen before and tunes them out. Clear gets understanding; novel gets *remembered and shared.* For the
scene that's meant to land (and always for the hero scene), also ask:

1. **Have viewers seen this exact visual a thousand times?** (bars → counter → payoff is the default AI
   output). If yes, it's clear but generic — push it toward TYPE 11 metaphor-as-world.
2. **Is there ONE scene in this video people will actually remember?** If every scene is a template,
   the answer is no — promote one to a bespoke hero scene.
3. **Could you tell this frame apart from any other channel's video on the same topic?** If another AI
   would render the identical scene, it isn't distinctive — make it unmistakably THIS video's.

These are the `visual-story-engine` visual-novelty questions, applied at render time. Clarity is the
floor (the three questions above); novelty is the ceiling. The reliable scenes can be templates; **at
least one scene must answer all three of these "yes."**

---

---

## Examples

### Q1/Q2 walkthrough — Scene 3 of "AI Thinking Levels"

```
Bullet body: "System 2 requires 18× more energy than System 1"

Q1: What must the viewer understand?
    → System 2 thinking costs 18 times more energy. The number 18× is the point.

Q2: Simplest visual that PROVES it?
    → Two side-by-side bars. Left "System 1" short, right "System 2" tall (18× height).
      Label the gap. Cite source bottom-right.

Pattern chosen: SingleNumber (hero "18×") OR RaceTrack (two bars racing in)
Decision: RaceTrack — the comparison IS the point, not the number alone.

Spring config: stiff (tension:280, friction:26) — emphasizing the stark contrast
Entrance: bars grow UP from bottom (quantity = up)
Animation completes: by frame round(durationInFrames * 0.55)
Hold state: both bars static, labels at opacity 1, citation visible

Audio anchor: "eighteen times" (verbatim from narration)
```

### Bespoke metaphor — "octopus neurons" bullet

```
Bullet body: "Parallel processing fans out like octopus tentacles — each limb independent"

Q1: What must the viewer understand?
    → Neural computation branches into many simultaneous paths.

Q2: Simplest visual that proves it?
    → A central node with 8 arcs radiating outward, each staggering in.
      NOT a stock diagram of a neuron.

Pattern chosen: NamedMetaphor (octopus tentacles)
Implementation:
  - 1 circle (central "hub")
  - 8 arcs via cubic bezier, each with a 4-frame stagger offset
  - Arc opacity interpolates 0 → 1 from frame (i*4) to (i*4 + 20)
  - Tips pulse at slow Math.sin frequency ONLY — no continuous orbit
  - No text labels on arcs (visual should be self-evident)

WRONG approach: stock neural-network grid layout (generic, not octopus)
WRONG approach: animated SVG (no SVG in bullets — use interpolate + React.createElement paths)
```

### Stat bullet with citation

```
Bullet body: "GPT-5.5 fabricates an answer 86% of the time when it doesn't know"

Q1: What must the viewer understand?
    → 86% — a shockingly high number. Not a comparison, just the number.

Pattern chosen: SingleNumber hero
Code sketch:
  const opacity = spring({ frame, fps, config: SPRING_PRESETS.wobbly })
  const scale = interpolate(opacity, [0, 1], [0.6, 1])
  // render: "86%" in design.amber, 120px, centered
  // subtext: "of queries with unknown answers" 18px design.text_dim
  // citation: "Source: [Author, 2025]" 13px bottom-right

Anchor: 'eighty-six percent'
```

---

## Guidelines

**Always:**
- Answer Q1 and Q2 OUT LOUD before writing a single line of code — wrong pattern costs a full re-render
- Match spring config to emotional register: facts → stiff/clean, stories → gentle, alarm → bouncy
- Complete animation by 60% of `durationInFrames` — hold phase is where the viewer actually reads
- Anchor direction: quantities grow UP/RIGHT, losses shrink DOWN, comparisons enter from opposite sides

**Never:**
- Start coding before answering Q1 and Q2 — "I'll figure out the visual while writing" always produces generic output
- Use more than 3 core visual elements (key + context + citation) — extras are decoration, not information
- Let typewriter cursors blink after text is complete — stop the blink at `frame > textCompleteFrame + 10`
- Use continuous spinning/orbiting on non-hero elements — ambient motion distracts from reading

**Quality bar:**
- Deaf viewer test: cover the captions and narration — can the visual alone communicate the point? If not, redesign.
- Animation adds information test: is the motion teaching something, or just making the slide "feel dynamic"? Pure decoration = cut it.
- One-sentence description test: "This visual shows [X] by [animation verb] [Y]." If you can't fill that in, the visual isn't concrete enough.

*Rule 21 — visual-map. Read before authoring every bullet. Last updated 2026-05.*
