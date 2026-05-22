---
name: animation-bullets
description: Standards for writing animation bullets in video production scripts. Use whenever drafting or upgrading the ### Animation section of a scene. Enforces named metaphors, color tokens, exact quantities, spring physics, audio anchors, and ADDITIVE vs REPLACE marking. Every bullet must answer 8 pre-write questions before being written.
metadata:
  tags: animation-bullets, metaphors, physics, replace, additive, audio-anchor, color-tokens
  applies_to: production documents for Remotion-rendered video scripts
---

# Animation Bullets — Authoring Standard

The animation bullet body IS the screenplay. The pipeline renders exactly what you write.
Vague description → generic visual. Director-level description → cinematic visual.

---

## ⚠️ DERIVE DON'T COPY

Every example in this file comes from one production script about AI thinking levels.
The dials, towers, lab-bench plots, and rubber-stamps are ONE creator's choices for ONE topic.

**If your topic is different, do not copy these metaphors.** Examples show *how* to write bullets,
not *what* to write. Your metaphors come from your topic's research and the physical actions
your topic resembles. An LLM that copies examples produces the same video for every topic.
That is a failure mode.

---

## 1. Parser requirements

The bullet body must conform to this exact format or the build pipeline will reject it.

```
### Animation
- **M:SS – M:SS — Headline.** Body text on same line.
  Continuation text on indented next line.
  More continuation.
```

Rules:
- Section heading is exactly `### Animation`
- Each bullet starts with `- **`
- Time window uses format `M:SS – M:SS` (en-dash preferred, hyphen accepted)
- Time is followed by ` — ` (em-dash with spaces) separating time from headline
- Headline ends with `.` before closing `**`
- Body is everything after `**` on same line and any indented continuation lines
- Each subsequent line of body indented 2 spaces

---

## 2. The 8-question pre-write checklist

Answer ALL 8 before writing any bullet body. If you cannot answer Q3 or Q4, the bullet is not ready.

```
Q1: What must the viewer understand from this bullet — in one sentence?
    If you cannot state it, the animation will be random.

Q2: What is the SIMPLEST visual that proves Q1 without audio?
    If the visual requires narration to make sense, it is wrong.

Q3: What named physical object or metaphor carries this idea?
    Not "a visual." A named real-world object derived from your topic's research:
    a machine, a container, a track, a cabinet, a web, a chain.

Q4: Which color token identifies each entity on screen?
    Every entity must have a token: D.cyan, D.violet, D.amber, D.red, D.green, D.text_dim.

Q5: What is the exact quantity of each repeated element?
    Not "some" or "several." A number.

Q6: What is the spring intent for entrance animations?
    One of: bouncy, snappy, heavy, smooth.

Q7: What 2-4 words from this scene's narration fire this bullet?
    Verbatim. This becomes the audio_anchor. Must exist in the narration.

Q8: Is this bullet ADDITIVE or REPLACE?
    Does it add to what is on screen, or wipe everything and start fresh?
```

---

## 3. Technique 1 — Named metaphor (required for every scene's first bullet)

Every scene's first bullet must establish a named object. Not "something visual." A named thing.

### How to derive YOUR metaphor

1. **What does your topic DO physically?** (grows, flows, breaks, connects, filters, races, accumulates, decays)
2. **What real-world object does that same physical action?**
3. **Name the object specifically.** Not "a container" — "a glass cylinder with measurement marks and a rubber stopper."

### Pattern examples (do NOT copy these — derive your own)

| Domain | Topic | Example metaphor | What makes it specific |
|---|---|---|---|
| AI / tech | Hallucination test | Lie detector machine | paper roll, oscillating needle, art-deco brass casing |
| Infrastructure | Database migration | Water tank with valve | two glass rectangles, calibrated fill marks, valve handle |
| Business | Market monopoly | Tipping scales | two brass pans, weight blocks, pivot point |
| Biology | Immune response | Factory assembly line | conveyor belt, inspection stations, reject chute |
| Finance | Compound interest | Snowball rolling downhill | diameter grows, speed increases, path visible behind |
| History | Roman roads | Spider web on a map | nodes at cities, threads between, thickening with use |
| Health | Drug absorption | Sponge soaking liquid | dry sponge, liquid pool, saturation point |
| Physics | Entropy | Ice cube melting | ordered crystal → spreading puddle, arrow of time |

### Writing the metaphor

Right:
```
Two brass balance scales, art-deco styling. Left pan: ENTITY A. Right pan: ENTITY B.
Weight blocks stamp onto each pan, pans tip toward whichever side is heavier.
```

Wrong:
```
A comparison visual showing two sides.
```

---

## 4. Technique 2 — Color = character identity

Assign one color token to each entity once. Use the same token in every bullet where that entity appears.

### Default identity map

| Entity type | Token |
|---|---|
| Primary model / protagonist | `D.cyan` |
| Secondary model / antagonist | `D.violet` |
| Warning / cost / ambiguity | `D.amber` |
| Danger / failure / liability | `D.red` |
| Success / verified / safe | `D.green` |
| Background text / labels | `D.text_dim` |

Use the default unless your topic requires different. If different, declare entity-to-token
mapping ONCE at the top of the production document and use it consistently.

### In bullet bodies, name the color when introducing an entity

Wrong:
```
A card slides in from right.
```

Right:
```
D.cyan card spring-enters from right — "ENTITY A". D.violet card from left — "ENTITY B".
```

---

## 5. Technique 3 — Exact quantities, not adjectives

The pipeline cannot render adjectives. It renders numbers.

| Adjective (cannot be coded) | Quantity (codeable) |
|---|---|
| "many elements" | "30-40 elements" |
| "some particles" | "100+ particle fragments, 4-8px each" |
| "staggered" | "staggered 12 frames per item" |
| "several parts" | "8 spokes" or "6 nodes" |
| "a trail effect" | "12-15 fading circles, 8px each, opacity 0.6 to 0" |
| "a bouncy entrance" | "spring damping 8" |
| "thumbnails" | "5 thumbnails, 240×135px each" |
| "rises gradually" | "rises from 0% to 80% over 25 frames" |

**Rule:** before any element with a count, state the count. Before any motion, state the duration.

---

## 6. Technique 4 — Physics intent (spring config)

State one of these four intents for every spring-animated entrance:

| Intent word | Maps to | Use for |
|---|---|---|
| `"bouncy spring"` | `{damping: 8}` | Hero numbers, punchline reveals, trophies |
| `"snappy spring"` | `{damping: 20, stiffness: 200}` | Cards, labels, UI elements, list items |
| `"heavy spring"` | `{damping: 12-15, stiffness: 80-100, mass: 2}` | Dramatic entrances, large tiles, stamps |
| `"smooth reveal"` | `{damping: 200}` | Ambient fades, background elements |

For staggered groups, name the stagger explicitly: `"12-frame stagger"` or `"staggered 10 frames per item"`.

### Also name motion shape when it matters

- `"sawtooth oscillations"` not `"moves"`
- `"pulse every 30 frames"` not `"pulses"`
- `"level drops from 80% to 12%"` not `"shrinks"`
- `"counter counts from 0 to 18,400 over 25 frames"` not `"counter goes up"`
- `"arc traces from -120° to +120° with easeInOutCubic"` not `"rotates"`

---

## 7. Technique 5 — ADDITIVE vs REPLACE

**ADDITIVE (default):** bullet adds to what is already on screen.
Use when the script says "X slides in alongside Y" or "label appears on the card."

**REPLACE:** bullet wipes all prior visuals and starts a new scene.
Use when the script says "cut to a new world" or "scene changes completely."

### Mark REPLACE explicitly in the headline

```
- **0:12 – 0:14 — [REPLACE] Scene wipes to new workspace.**
```

### REPLACE body must start with a backdrop description

```
Full-canvas D.bg backdrop fades in over 10 frames covering all prior bullets.
Then: new content appears on top.
```

### Decision rule

| Bullet intent | Use |
|---|---|
| New element appears alongside existing | ADDITIVE |
| New element appears INSIDE existing structure | ADDITIVE |
| Entire scene changes visual context | REPLACE |
| Second topic begins after first concluded | REPLACE |
| Same metaphor continues, more detail added | ADDITIVE |

---

## 8. Audio anchor targeting

The audio_anchor phrase must appear in BOTH the narration AND the bullet body.
This ensures the renderer fires the animation at the exact moment the narration says the phrase.

### Pattern

```
Narration:   "...watch the YOUR_ANCHOR_PHRASE. <pause 0.2s>"
Bullet body: "YOUR_ANCHOR_PHRASE ACTION. YOUR_ANCHOR_PHRASE RESULT."
audio_anchor: "YOUR_ANCHOR_PHRASE"
```

### Anchor selection order of preference

1. **A number spoken out loud** — "fifty-six percent", "twenty-three times", "forty-nine point six"
2. **An entity name + action** — "needle hits MAX", "cost meter explodes"
3. **An imperative from the narration** — "watch the counter", "look at this"
4. **A distinctive noun unique to this scene** — something that cannot match any other scene's narration

### Never pick

- Generic connectors: "and then", "here's", "this", "let me show"
- Words that appear in multiple scenes
- Phrases longer than 5 words

---

## 9. Bullet density per scene

| Scene length | Target bullets | Seconds per bullet |
|---|---|---|
| ~30s | 3–5 | 6–10s each |
| ~60s | 6–9 | 7–10s each |
| ~90s | 8–12 | 7–11s each |

- Fewer than 5 bullets in a 60s scene = scene feels static.
- More than 12 bullets in a 60s scene = visual changes too fast, no absorption time.

---

## 10. Bullet body template

Fill this template for every bullet before writing the final body. Delete the template once the body is written.

```
Q1 (one-sentence takeaway):   ___
Q2 (simplest visual):          ___
Named object (Q3):             ___
Entities & color tokens (Q4):  Entity A: D.____  Entity B: D.____
Exact quantities (Q5):         ___
Spring intent (Q6):            bouncy / snappy / heavy / smooth + stagger
Audio anchor (Q7):             "___" (verbatim from narration)
Mode (Q8):                     ADDITIVE / REPLACE
```

---

## 11. Worked example (reference only — do NOT copy for other topics)

**Topic:** AI thinking levels and the effort paradox.

**Narration excerpt:**
> Every frontier AI model now has a dial that controls how hard it thinks. Turn it up
> and you'd expect better answers. But for GPT-5, turning it to high actually lowered
> accuracy — and costs fifty-six percent more.

**Bullet — first attempt (BAD):**
```
- **0:00 – 0:10 — Three dials, canvas-wide.**
  Three rotary dials appear, all set to HIGH. Cost bar rises.
```

**Why it fails the checklist:**
- Q1 not stated (no viewer takeaway declared)
- Q3 weak — "dials" is generic, no named physical context
- Q4 incomplete — no color token assigned to each lab's dial
- Q5 partial — "three" present but no count of ticks, glow, needle
- Q6 missing — no spring intent
- Q7 missing — no audio_anchor
- Q8 missing — REPLACE not marked despite full-canvas wipe

**Same bullet — upgraded (GOOD):**
```
- **0:00 – 0:10 — [REPLACE] Three control-room rotary dials, factory aesthetic.**
  Q1: Viewer must see all three AI labs ship the same physical dial pre-set to HIGH by default.
  Named object: Industrial control-room dials with brass bezels and tick marks etched into the face.
  Full-canvas D.bg backdrop fades in over 8 frames covering all prior visuals.
  3 dials horizontal layout, centered vertically, 28% canvas width each, 60-frame stagger between dials.
  Left dial: D.cyan bezel, label "CLAUDE — effort:", 5 tick positions LOW/MEDIUM/HIGH/XHIGH/MAX.
  Center dial: D.violet bezel, label "GPT — reasoning_effort:", 4 positions LOW/MEDIUM/HIGH/XHIGH.
  Right dial: D.amber bezel, label "GEMINI — thinking_budget:", 3 positions LOW/MEDIUM/HIGH.
  All 3 needles pre-rotated to HIGH position, D.red glow circle (12px radius) at each HIGH tick.
  Heavy spring entrance (damping 12, stiffness 90, mass 2), staggered 10 frames per dial.
  audio_anchor: "controls how hard it thinks"
```

Every checklist item answered. Pipeline can render exactly this.

---

## 12. Pre-submit checklist

Before adding any bullet to the script, verify ALL of these:

- [ ] Q1 (one-sentence takeaway) stated above the visual description
- [ ] Q2 (simplest visual proving Q1) implicit in the body
- [ ] Q3 — headline names a specific named physical object, not "a visual"
- [ ] Q4 — every entity tagged with a color token (D.cyan, D.violet, D.amber, D.red, D.green, D.text_dim)
- [ ] Q5 — every repeated element has a count; every motion has a duration
- [ ] Q6 — spring intent named (bouncy / snappy / heavy / smooth)
- [ ] Q7 — audio_anchor present, verbatim from this scene's narration
- [ ] Q8 — [REPLACE] tag in headline if replacing; omitted (default) if additive
- [ ] Body contains NO hex literals (use D.tokens), NO JSX, NO CSS animation keywords
- [ ] Body contains NO words "many", "some", "several", "a few", "staggered" (without a number)

---

## 13. Common failure modes

| Failure | What it looks like | Fix |
|---|---|---|
| Generic visual | "Three boxes appear" | Name the specific object: "Three brass cabinets with combination locks" |
| Adjective-only | "Bars rise dramatically" | "Bars rise from 0% to 80% over 25 frames, heavy spring" |
| Missing color | "A card appears" | "D.cyan card appears" |
| Missing anchor | (no audio_anchor line) | Find 2-4 words from narration; add `audio_anchor: "..."` |
| Wrong mode | REPLACE not marked when scene changes | Add `[REPLACE]` to headline + backdrop line to body |
| Reusing example metaphors | Lie detector for a non-AI topic | Derive your own metaphor from your topic's physical action |
| Anchor not in narration | `audio_anchor: "watch this"` (not in script) | Pick a phrase that exists verbatim in the narration |
| Multiple anchors match | `audio_anchor: "and then"` | Pick a distinctive phrase, not a generic connector |

---

## 14. Upgrade workflow for existing scripts

If you have an existing script with weak animation bullets, apply this 5-step pass:

1. **Read each bullet. Ask Q1.** Write the one-sentence takeaway above the headline.
2. **Replace generic visuals with named metaphors.** "Cards" → "filing cabinets." "Bars" → "mercury thermometers."
3. **Tag entities with color tokens.** D.cyan / D.violet / D.amber / D.red / D.green.
4. **Convert adjectives to numbers.** "Many" → "30-40." "Staggered" → "12-frame stagger."
5. **Find audio anchors.** For each bullet, extract the 2-4 word phrase from narration that fires it. Add `audio_anchor:` line.

Time budget: ~5-7 minutes per bullet. ~50 minutes per 8-scene script.

---

End of skill.