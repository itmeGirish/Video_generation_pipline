# Content-Type Catalog — the 11 visual TYPES (full specs)

Reference for `vg-visual-map`. The selection table + the One-Rule / sentence-test / 3-questions live in the parent SKILL.md; this file holds each TYPE's full spec (when to use, the layout, the animation, the do/don't). Pick the TYPE in the SKILL, then read its spec here. TYPE 11 (metaphor-as-world) is the bespoke hero scene — NOT a template.

---

### TYPE 1 — Single Statistic

**When:** bullet reveals one key number (%, $, ratio, count)

**Viewer must understand:** the magnitude and meaning of this number

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              86%                                    │
│         [large, centered]                           │
│                                                     │
│    HALLUCINATION RATE                               │
│    [label below, smaller, muted]                    │
│                                                     │
│  ████████████████████████░░░░░  86/100              │
│  [context bar showing scale]                        │
└─────────────────────────────────────────────────────┘
```

**Code skeleton** — replace ALL_CAPS placeholders with actual values from the script bullet:
```js
// SCRIPT_VALUE  = the numeric value as a decimal, e.g. 0.73 for "73%"
// SCRIPT_LABEL  = short uppercase label describing the stat, e.g. 'ERROR RATE'
// SCRIPT_DISPLAY = the formatted display string, e.g. '73%' or '$4.2B'
// STAT_COLOR    = D.red (bad/danger), D.green (good/success), D.cyan (neutral)
const numSize = Math.round(width * 0.22);
const labelSize = Math.round(width * 0.018);
const barW = Math.round(width * 0.55);
const barH = Math.round(height * 0.025);

const pct = SCRIPT_VALUE;
const barFill = interpolate(frame, [8, 35], [0, pct], {extrapolateRight:'clamp'});
const numOp = interpolate(frame, [0, 12], [0, 1], {extrapolateRight:'clamp'});
const labelOp = interpolate(frame, [10, 22], [0, 1], {extrapolateRight:'clamp'});
const barOp = interpolate(frame, [20, 32], [0, 1], {extrapolateRight:'clamp'});

const numEl = React.createElement('div', {style:{
  fontSize: numSize, fontFamily: D.font_display, fontWeight: 700,
  color: STAT_COLOR, opacity: numOp, lineHeight: 1,
}}, SCRIPT_DISPLAY);

const labelEl = React.createElement('div', {style:{
  fontSize: labelSize, fontFamily: D.font_mono,
  color: D.text_dim, opacity: labelOp, letterSpacing: '0.12em',
  marginTop: Math.round(height * 0.015),
}}, SCRIPT_LABEL);

const bar = React.createElement('div', {style:{
  width: barW, height: barH, opacity: barOp,
  backgroundColor: D.surface, borderRadius: 4,
  overflow: 'hidden', marginTop: Math.round(height * 0.04),
  position: 'relative',
}},
  React.createElement('div', {style:{
    width: Math.round(barW * barFill), height: '100%',
    backgroundColor: STAT_COLOR, borderRadius: 4,
  }})
);

const wrap = React.createElement('div', {style:{
  position:'absolute', inset: 0,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
}}, numEl, labelEl, bar);

return React.createElement(AbsoluteFill, {style:{backgroundColor: D.bg}},
  __replaceBackdrop, wrap);
```

**NEVER do:** screen shatter, explosion, spinning rings, heartbeat pulse, shards — these add drama but zero understanding of the number.

**Context bar is mandatory** when showing a percentage — the raw number alone has no scale for the viewer.

---

### TYPE 2 — Quote / Testimonial

**When:** bullet surfaces a direct quote from a person

**Viewer must understand:** who said it, what they said, why it matters

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   "                                                 │
│                                                     │
│   Losing access felt like                           │
│   having a limb amputated.                          │
│                                                     │
│   "                                                 │
│             — Senior Engineer, Hardware Co.         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- No UI chrome (fake chat windows, browser frames, terminal headers)
- No brand names — use role + generic employer ("Senior Engineer at a chip company")
- Quote text large (width * 0.030–0.038), italic, color D.text
- Attribution small (width * 0.012), non-italic, color D.text_dim
- Typewriter reveal OR spring fade-in from opacity 0 — both acceptable
- Opening quotation mark can be oversized (width * 0.08) as decorative element, color D.cyan at 0.15 opacity

**Code skeleton** — replace ALL_CAPS placeholders with actual values from the script bullet:
```js
// QUOTE_TEXT = the exact quote from the script bullet, as a string
// QUOTE_ATTR = attribution line from the script, e.g. '— Jane Smith, Role'
const quoteSize = Math.round(width * 0.032);
const attrSize = Math.round(width * 0.013);
const QUOTE = QUOTE_TEXT;
const ATTR = QUOTE_ATTR;

// Typewriter reveal
const CPS = 18; // chars per second at 30fps = chars per 30 frames
const charsVisible = Math.min(QUOTE.length, Math.floor(frame * CPS / 30));
const attrDelay = Math.round(QUOTE.length * 30 / CPS) + 10;
const attrOp = interpolate(frame, [attrDelay, attrDelay + 12], [0, 1], {extrapolateRight:'clamp'});

const quoteEl = React.createElement('div', {style:{
  fontSize: quoteSize, fontFamily: D.font_display,
  fontStyle: 'italic', color: D.text, lineHeight: 1.5,
  maxWidth: Math.round(width * 0.7),
}}, QUOTE.slice(0, charsVisible));

const attrEl = React.createElement('div', {style:{
  fontSize: attrSize, fontFamily: D.font_mono,
  color: D.text_dim, opacity: attrOp, marginTop: Math.round(height * 0.025),
}}, ATTR);

const wrap = React.createElement('div', {style:{
  position:'absolute', inset: 0,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  padding: `0 ${Math.round(width * 0.1)}px`,
}}, quoteEl, attrEl);

return React.createElement(AbsoluteFill, {style:{backgroundColor: D.bg}},
  __replaceBackdrop, wrap);
```

---

### TYPE 3 — Ranked Comparison (A vs B vs C)

**When:** bullet compares multiple items by a metric (benchmark, score, cost, speed)

**Viewer must understand:** relative ranking and the gap between items

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│  HALLUCINATION RATE — FRONTIER MODELS               │
│                                                     │
│  Model A   ████████████████████████░  86%  ← worst  │
│  Model B   ████████░░░░░░░░░░░░░░░░░  32%           │
│  Model C   ████░░░░░░░░░░░░░░░░░░░░░  18%           │
│  Model D   ██░░░░░░░░░░░░░░░░░░░░░░░   9%  ← best   │
│                                                     │
│                              Source — Venue, Year   │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Bars grow from left — animate fill width using `interpolate(frame, [startF + i*8, startF + i*8 + 25], [0, value])`
- Stagger rows by 8 frames each
- Highlight the item being discussed in the narration (use D.red for worst, D.green for best, D.cyan for neutral)
- Value label right-aligned at bar end
- Title row always present — tells viewer what they're comparing

**Code skeleton** — replace ALL_CAPS placeholders with actual values from the script bullet:
```js
// ROWS = array built from the script's comparison data, e.g.:
//   {label: 'Item name from script', value: 0.NN, color: D.red/D.green/D.text_dim}
// CHART_TITLE = uppercase label describing what is being compared
const rows = ROWS; // e.g. [{label:'...', value:0.NN, color:D.red}, ...]
const maxBarW = Math.round(width * 0.52);
const rowH = Math.round(height * 0.09);
const labelW = Math.round(width * 0.12);

const rowEls = rows.map((r, i) => {
  const delay = i * 8 + 10;
  const fill = interpolate(frame, [delay, delay + 22], [0, r.value], {extrapolateRight:'clamp'});
  const op = interpolate(frame, [delay, delay + 8], [0, 1], {extrapolateRight:'clamp'});
  return React.createElement('div', {key:i, style:{
    display:'flex', alignItems:'center', gap: Math.round(width*0.012),
    opacity: op, height: rowH,
  }},
    React.createElement('div', {style:{
      width: labelW, fontFamily: D.font_mono,
      fontSize: Math.round(width*0.010), color: D.text_dim, textAlign:'right',
    }}, r.label),
    React.createElement('div', {style:{
      width: maxBarW, height: Math.round(rowH*0.35),
      backgroundColor: D.surface, borderRadius: 3, overflow:'hidden', position:'relative',
    }},
      React.createElement('div', {style:{
        width: Math.round(maxBarW * fill), height:'100%',
        backgroundColor: r.color, borderRadius: 3,
      }})
    ),
    React.createElement('div', {style:{
      fontFamily: D.font_mono, fontSize: Math.round(width*0.010),
      color: r.color, width: Math.round(width*0.04), textAlign:'left',
    }}, `${Math.round(r.value*100)}%`)
  );
});

const chart = React.createElement('div', {style:{
  display:'flex', flexDirection:'column', gap: Math.round(height*0.012),
}}, ...rowEls);
```

---

### TYPE 4 — Step-by-Step Process

**When:** bullet explains HOW something works (algorithm, workflow, chain of events)

**Viewer must understand:** what happens in what order and why

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ① INPUT          ② PROCESS        ③ OUTPUT        │
│   [User query]  →  [Model runs]  →  [Answer]        │
│                                                     │
│   Each step appears when narrator describes it      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Each step appears ONLY when the narration reaches it — use `findWord()` to align
- Arrow connectors appear after the step they connect FROM
- Step boxes use consistent sizing — all same width × height
- Active step: D.cyan border. Completed steps: D.text_dim border.

**Code skeleton** — replace ALL_CAPS placeholders with actual values from the script bullet:
```js
// STEPS = array of steps extracted from the script bullet, each with:
//   {num: '①'/'②'/etc., title: 'short title', desc: 'one-line description'}
const steps = STEPS; // populate from script content — do NOT copy example values
const stepW = Math.round(width * 0.22);
const stepH = Math.round(height * 0.28);
const gap = Math.round(width * 0.04);
const totalW = steps.length * stepW + (steps.length - 1) * gap;
const startX = (width - totalW) / 2;

const stepEls = steps.map((s, i) => {
  const delay = i * 18;
  const op = interpolate(frame, [delay, delay + 15], [0, 1], {extrapolateRight:'clamp'});
  const y = interpolate(frame, [delay, delay + 15], [30, 0], {extrapolateRight:'clamp'});
  return React.createElement('div', {key:i, style:{
    position:'absolute',
    left: startX + i * (stepW + gap),
    top: (height - stepH) / 2 + y,
    width: stepW, height: stepH, opacity: op,
    border: `1px solid ${D.cyan}66`,
    backgroundColor: D.surface, borderRadius: 10,
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    gap: Math.round(height * 0.012), padding: Math.round(width * 0.012),
  }},
    React.createElement('div', {style:{fontSize: Math.round(width*0.030), color: D.cyan}}, s.num),
    React.createElement('div', {style:{fontSize: Math.round(width*0.013), color: D.text, fontFamily: D.font_display, fontWeight:700, textAlign:'center'}}, s.title),
    React.createElement('div', {style:{fontSize: Math.round(width*0.010), color: D.text_dim, fontFamily: D.font_mono, textAlign:'center', lineHeight:1.4}}, s.desc)
  );
});
```

---

### TYPE 5 — Before / After Split

**When:** bullet shows contrast between two states (old vs new, wrong vs right, without vs with)

**Canonical layout:**
```
┌──────────────────────┬──────────────────────┐
│  WITHOUT             │  WITH                │
│                      │                      │
│  [state A visual]    │  [state B visual]    │
│                      │                      │
│  • consequence 1     │  ✓ benefit 1         │
│  • consequence 2     │  ✓ benefit 2         │
└──────────────────────┴──────────────────────┘
         ↑ divider line animates in from top
```

**Rules:**
- LEFT panel: D.error/D.red tint on border (the problem)
- RIGHT panel: D.success/D.green tint on border (the solution)
- Divider appears first, then left panel, then right panel (8-frame stagger each)
- Labels ("WITHOUT" / "WITH") top of each panel, font_mono, textDim

---

### TYPE 6 — Timeline

**When:** bullet shows a sequence of events in chronological order

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ●──────────●──────────●──────────●                 │
│  Jan        Mar        Jun        Sep               │
│  Event A    Event B    Event C    Event D           │
│                                                     │
│  [Each node appears as narrator reaches it]         │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Spine line animates from left to right
- Nodes pop in with a spring bounce at staggered timing
- Dates above the spine, event labels below
- Active/current event uses D.cyan; past events use D.text_dim

---

### TYPE 7 — Concept Definition

**When:** bullet introduces or defines a term or idea

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   CONFABULATION                                     │
│   [term — large, D.cyan]                            │
│                                                     │
│   When a model generates a plausible-sounding       │
│   answer with no factual basis — not a lie,         │
│   but a confident invention.                        │
│   [definition — body size, D.text, max 3 lines]     │
│                                                     │
│   ≠ Hallucination (which includes knowing errors)   │
│   [contrast note — label size, D.text_dim]          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Term reveals first (spring scale from 0.85 → 1.0)
- Definition fades in after (delay 15 frames)
- Contrast note / example fades in last (delay 28 frames)
- No decorative background motion — let the text breathe

---

### TYPE 8 — Data Table / Matrix

**When:** bullet shows structured data with rows and columns

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│  BENCHMARK RESULTS                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │ Task     │ Model A  │ Model B  │ Model C  │     │
│  ├──────────┼──────────┼──────────┼──────────┤     │
│  │ Coding   │  94%     │  87%     │  79%     │     │
│  │ Reasoning│  88%     │  91% ★   │  73%     │     │
│  │ Recall   │  62%     │  58%     │  71% ★   │     │
│  └──────────┴──────────┴──────────┴──────────┘     │
│  ★ = best in category           Source — X, Y 2025 │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Rows stagger in (8 frames each) so viewer reads one row at a time
- Best value in each row gets D.green + star marker
- Header row always visible from frame 0
- Cell text: font_mono, labelSize

---

### TYPE 9 — Narrative Text Card

**When:** bullet is a commentary, insight, or conclusion — no data, pure editorial

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌─────────────────────────────────────────┐      │
│   │                                         │      │
│   │  Same model. Different job.             │      │
│   │  One needs trust. One rewards speed.    │      │
│   │                                         │      │
│   └─────────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Card centered, width 60-70% of canvas, padding generous
- Text size: width * 0.022–0.026 (readable at a glance)
- Card border: 1px solid D.cyan at 30% opacity
- Background: D.surface (slightly lighter than D.bg)
- ONE idea per card. If there are two ideas, use TWO bullets.
- No sub-bullets, no lists — pure prose max 2–3 lines

---

### TYPE 10 — Counter / Progress Reveal

**When:** bullet builds toward a number over time (e.g. "86 out of 100 times")

**Canonical layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     ○○○○○○○○○○  ○○○○○○○○○○  ○○○○○○○○○○             │
│     ○○○○○○○○○○  ○○○○○○○○○○  ○○○○○○○○○○             │
│     ○○○○○○○○○○  ○○○○○○○○○○  ○○○○○○○○○○             │
│     [86 red dots fill in, 14 remain grey]           │
│                                                     │
│     86 out of 100 answers fabricated                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Grid of N dots where N = denominator (100 for percentages)
- Red dots fill left-to-right as frame advances
- Caption below: "X out of N [description]"
- Filling speed: complete fill by frame ~40 (fast enough to feel dramatic, slow enough to read)

**Code pattern** — replace ALL_CAPS placeholders with actual values from the script bullet:
```js
// TOTAL_COUNT   = the denominator from the script (e.g. 100 for "out of 100")
// FILL_COUNT    = the numerator from the script (e.g. 73 for "73 out of 100")
// DOT_COLOR     = D.red (bad), D.green (good), D.cyan (neutral)
// CAPTION_TEXT  = description line from the script, e.g. 'out of 100 responses contained errors'
const TOTAL = TOTAL_COUNT;
const FILL = FILL_COUNT;
const filledSoFar = Math.min(FILL, Math.floor(interpolate(frame, [5, 45], [0, FILL], {extrapolateRight:'clamp'})));
const cols = 10;
const dotSize = Math.round(width * 0.018);
const dotGap = Math.round(width * 0.008);

const dots = Array.from({length: TOTAL}, (_, i) =>
  React.createElement('div', {key:i, style:{
    width: dotSize, height: dotSize, borderRadius: '50%',
    backgroundColor: i < filledSoFar ? DOT_COLOR : D.surface,
    border: `1px solid ${i < filledSoFar ? DOT_COLOR : D.text_dim}44`,
    transition: 'none',
  }})
);

const grid = React.createElement('div', {style:{
  display:'grid',
  gridTemplateColumns: `repeat(${cols}, ${dotSize}px)`,
  gap: dotGap,
}}, ...dots);
```

---

### TYPE 11 — Metaphor-as-World (the bespoke hero scene — NOT a template)

**When:** the ONE scene per video that must be unforgettable (the `visual-story-engine` hero-scene
mandate) — and any abstract concept that a bar/card/counter *flattens.* TYPES 1–10 are the reliable
floor; this is the deliberate ceiling-breaker. Use it sparingly (≈one scene), not everywhere.

**Why it exists:** Conceptual Metaphor Theory (Lakoff & Johnson) — humans understand abstract ideas by
mapping them onto **concrete, physical, sensory-motor** experience. A "token meter at 80%" is a chart of
the concept; "a **bucket leaking water**" *is* the concept, felt. The metaphor isn't decoration — it's
the comprehension *and* the memorability. This is also the scene a viewer screenshots and the one no
other channel would render identically.

**Viewer must understand:** the abstract idea, by SEEING it as a physical thing that behaves the way the
idea behaves.

**The method (don't copy these — derive from THIS script's concept):**
1. Name the abstract concept's *behavior* (depletes / accumulates / branches / breaks / fills / races).
2. Pick a concrete physical system that behaves the SAME way (a leaking bucket / a room filling with
   sticky notes / a rope fraying / a dam holding / a single runner on an endless track).
3. Build it as a **world/stage** (composition §10 "the stage"), with depth (composition §8 fg/mg/bg),
   and animate the *physics* of the metaphor (the water actually falling, the notes actually piling).
4. Label minimally so the muted viewer maps it (the deaf-viewer test still applies).

| The concept | ❌ Template (TYPE 1–10) | ✅ Metaphor-as-world (TYPE 11) | The mapping |
|---|---|---|---|
| context window filling | a token meter at 80% | a **bucket** filling, about to overflow | capacity → a vessel |
| agent memory growing | a database icon + counter | **sticky notes covering a whole room** | accumulation → physical clutter |
| long-task coherence breaking | a red bar at "step 6" | a **rope under load fraying then snapping** | a chain holding → tension on a physical line |
| compounding cost | an amber "$" counter | a **taxi meter spinning** as work runs | a running cost → a ticking mechanism |

**Rules:** still tokens-only (`D.*`), still passes the V-checks (fill ≥60%, readable, not frozen), still
TRUE to the facts (the metaphor must not distort — `visual-story-engine` guardrail). Build with
div/SVG primitives + the physics animated frame-by-frame. **Never** a generic stock "futuristic" scene —
that's spectacle, the opposite of this. The test: would a viewer *screenshot* it, and could another AI
have produced the same frame? If it's still a labelled rectangle, it isn't TYPE 11 yet.

---
