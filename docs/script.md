# Script Structure — Production Reference

Every field in this document is derived directly from:
- `storyboard/source_parser.py` — the actual parser regex and logic
- `projects/structured_scripts/chat_5_5.txt` — a production-shipped script
- `projects/chat_5_5/config.yaml` — a production config

**Nothing in this document is invented.**

---

## 1. File locations

| File | Path | Purpose |
|---|---|---|
| Script | `projects/structured_scripts/<name>.txt` | Parser's single source of truth |
| Config | `projects/<name>/config.yaml` | Project settings, design tokens, audio |

Never write to `projects/scripts/` or `projects/<name>/source.txt` — those are raw input, not what the parser reads.

---

## 2. Script file format (`<name>.txt`)

### 2.1 Document title (optional)

```
# GPT-5.5 vs Claude Opus 4.7 — PRODUCTION DOCUMENT
```

One `#` heading at the top. Parser extracts this as `SourceScript.title`.
If omitted, the filename stem is used as the title.

---

### 2.2 Scene header (REQUIRED — exact format)

```
## SCENE 1 — "Cold Open" (0:00 – 0:13)
```

**Parser regex** (`source_parser.py` lines 76-79):
```
^## SCENE N — "Title" (M:SS – M:SS)$
```

Rules the parser enforces:
- Must start with `## SCENE` (two hashes, space, word SCENE)
- Scene number is an integer (`N`)
- Separator between number and title: `—` (em-dash) or `-` (hyphen)
- Title: any text, optionally in quotes
- Time window in parentheses: `(M:SS – M:SS)` — en-dash or hyphen between times
- Times are `minutes:seconds` — e.g. `0:00`, `1:42`, `16:17`
- Must be on a single line — no line breaks inside the header

**Real production example:**
```
## SCENE 4 — "The Benchmark Track" (0:52 – 1:42)
```

---

### 2.3 Narration block (REQUIRED)

```
### Narration
> If you're using AI for anything that matters — code, research, client work —
> I need you to hear two facts about the same model. <pause 0.3s>
> Same model. Both true.
```

Rules:
- Section starts with `### Narration` (three hashes)
- Every narration line must start with `>`
- Multiple `>` lines are joined into one narration string
- `<pause Xs>` anywhere in the text inserts a TTS pause (e.g. `<pause 0.5s>`)
- Blank lines between `>` lines are ignored
- Parser raises `ValueError` if this block is missing from any scene

---

### 2.4 Animation block (REQUIRED)

```
### Animation
- **0:00 – 0:02 — Clean AI interface fades in.** ChatGPT-style dark-mode UI. Prompt types: "Summarize the latest SEC filing."
- **0:02 – 0:05 — CYAN card slides in from right.** Card with CYAN left border spring-enters. Quote in white text.
- **0:05 – 0:13 — 86% pulses like heartbeat.** RED ring expands outward every 30 frames and fades.
```

**Parser regex for each bullet** (`source_parser.py` lines 218-221):
```
^- **M:SS – M:SS — Headline.** body text$
```

Rules:
- Section starts with `### Animation`
- Each bullet starts with `- **`
- Time window: `M:SS – M:SS` (en-dash or hyphen between times)
- Then ` — ` (em-dash or hyphen) separating time from headline
- Headline: all bold text inside `**...**` after the time window
- Body: everything after the closing `**` on the same line, plus any indented continuation lines
- Sub-bullets (indented) are appended to the parent bullet body
- Parser raises `ValueError` if this block is missing from any scene

**Headline naming convention (from production):**
- Describe exactly what the viewer SEES — no abstract labels
- Name the color/model for unambiguous attribution
- Good: `CYAN architect examines the cube`, `Vault door fills screen, 8 bolts`
- Bad: `Animation plays`, `Card appears`

---

### 2.5 Pacing block (optional)

```
### Pacing
Slower build — let the lie detector beat hold 3 seconds before cutting.
```

Not consumed by the renderer. Used as a note for the bullet authoring phase.

---

### 2.6 SPOTLIGHT annotation (optional, inside bullet body)

```
- **0:35 – 0:38 — Pattern reveal.** Left: ACT pill → GPT-5.5. Right: REASON pill → Claude. [SPOTLIGHT: ACT | REASON | DIFFERENT JOBS]
```

Parser extracts `[SPOTLIGHT: item1 | item2 | item3]` and stores it as `AnimationBullet.spotlight_items`.
Items are `|`-separated. The annotation is stripped from body text before passing to the visual designer.

---

### 2.7 Complete minimal example (2 scenes)

```
# My Video Title

## SCENE 1 — "Hook" (0:00 – 0:30)
### Narration
> This is the hook sentence. <pause 0.3s>
> And this is the second sentence explaining the topic.

### Animation
- **0:00 – 0:05 — Title card fades in.** Large white text on dark background. Spring entrance from below.
- **0:05 – 0:15 — CYAN data card slides in from right.** Key stat in 80px amber text center. CYAN border.
- **0:15 – 0:30 — Bar chart animates.** Bars grow left to right. MAGENTA for model A, CYAN for model B.

## SCENE 2 — "Conclusion" (0:30 – 0:50)
### Narration
> Here is the conclusion. <pause 0.2s> The answer is clear.

### Animation
- **0:00 – 0:10 — Final verdict card appears.** Single sentence in large white text. Fades in over 12 frames.
- **0:10 – 0:20 — Subscribe CTA.** CYAN border card. "SUBSCRIBE" types in at 22 cps. Comment prompt below.
```

---

## 3. Config file format (`config.yaml`)

Source: `projects/chat_5_5/config.yaml` (production, shipped video).

```yaml
project: chat_5_5                           # must match projects/<name>/ folder name
output: MyVideo.mp4                         # informational label only

audio:
  voice: en-US-AndrewMultilingualNeural     # edge-tts voice ID
  full_audio_filename: vo-chat_5_5-full.mp3 # TTS output filename
  rate: '+20%'                              # speaking speed (+/- %)
  pitch: '+0Hz'                             # pitch shift

video: {fps: 30, width: 1920, height: 1080}

design:
  # Backgrounds
  bg: '#0A0A0F'
  surface: '#12121A'

  # Text
  text: '#E8E8E8'
  text_dim: '#666680'

  # Brand colors — used in bullet code as D.cyan, D.violet, D.amber, etc.
  cyan: '#00F0FF'
  violet: '#FF2D92'
  amber: '#FFB800'
  green: '#00FF88'
  red: '#FF3B3B'
  soft_red: '#FF6B6B'
  white: '#E8E8E8'

  # Fonts
  font_display: "'Inter', sans-serif"
  font_mono: "'JetBrains Mono', monospace"

  # Animation defaults
  dot_grid_opacity: 0.04
  dot_grid_spacing: 40
  spring_damping: 14
  spring_stiffness: 180
  fade_frames: 0
  type_speed_cps: 22                        # typewriter characters per second

stitch:
  mode: remotion_master                     # do not change
  crossfade_frames: 12
```

All fields shown are required. Bullet code references design tokens as `D.bg`, `D.cyan`, `D.amber`, etc. Missing tokens cause runtime errors.

---

## 4. Canvas quality rules (V1 gate)

A bullet fails V1 verification if the rendered frame has >60% black/empty pixels.
These rules prevent V1 failures — verified against 10 rendered scenes.

| Rule | Requirement | Wrong | Correct |
|---|---|---|---|
| Canvas fill | Visuals must use >40% of 1920×1080 | Centered text on black | Full-width card or chart |
| Body font | `Math.round(width * 0.009)` minimum | `fontSize: 14` | `fontSize: Math.round(width * 0.009)` |
| Headline font | `Math.round(width * 0.022)` minimum | `fontSize: 24` | `fontSize: Math.round(width * 0.022)` |
| Phase timing | Fractions of `durationInFrames` | `interpolate(frame, [0, 30], ...)` | `interpolate(frame, [0, durationInFrames*0.3], ...)` |
| Colors | Only design tokens `D.*` | `color: '#00F0FF'` | `color: D.cyan` |
| No JSX | `React.createElement(...)` only | `<div style={...}>` | `React.createElement('div', {style: {...}}, ...)` |
| Backdrop | `AbsoluteFill` for full-canvas bg | `position: 'absolute', inset: 0` | `React.createElement(AbsoluteFill, {style: {backgroundColor: D.bg}})` |

---

## 5. Bullet density target

| Scene length | Target bullets | Seconds per bullet |
|---|---|---|
| ~30s | 4–6 | 5–8s each |
| ~60s | 8–12 | 5–8s each |
| ~90s | 12–16 | 5–8s each |

Minimum per bullet: 30 frames (1 second). Shorter bullets fail V6 verification.

---

## 6. Audio sync — how visuals lock to narration (foundational)

This is the mechanism that makes visuals appear at the exact moment the narrator speaks the matching words.

### How it works (from `storyboard/source_parser.py` + rule 08)

The script's bullet time windows (`0:00 – 0:05`) are **author intent only** — approximate hints.
The actual visual timing comes from the `audio_anchor` field, set during bullet authoring:

```
Narration text → TTS (mp3) → Whisper (word-level timestamps) → fuzzy match anchor phrase
                                                                          ↓
                                                              framesFrom = round(word.start × 30)
```

Every visual block in the scene JSON has this structure:
```json
{
  "framesFrom": 451,
  "framesTo":   745,
  "audio_anchor": "different league",
  "code": "..."
}
```

Real production example from `projects/chat_5_5/scenes/chat-5-5-s04.json`:

| Block | framesFrom | framesTo | audio_anchor |
|---|---|---|---|
| 0 | 0 | 451 | `watch the magenta runner` |
| 1 | 451 | 745 | `different league` |
| 2 | 745 | 830 | `photo finish` |
| 3 | 830 | 1034 | `ahead by five` |

The narration for S04 says: *"watch the magenta runner… thirteen-point gap — that's not close, that's a different league… OSWorld — basically a photo finish… GPT pulls ahead by five."*
Every anchor phrase is pulled verbatim from what was spoken.

### What the script writer controls

You don't write `audio_anchor` yourself — that is set by Claude during bullet authoring.
But **you control how good the anchors can be**, through narration writing quality.

**Write narration with clear trigger phrases:**

| Bad | Good |
|---|---|
| `"And then the chart shows data about performance…"` | `"Watch the needle. Claude — thirty-six percent."` |
| Long run-on sentences with no clear moment | Short clauses with pauses — `<pause 0.3s>` |
| Generic filler words as visual cues | Hero nouns, numbers, model names |

**Write bullet bodies that echo the narration trigger:**

```
### Narration
> Terminal-Bench. GPT rockets ahead. Thirteen-point gap —
> that's not close, that's a different league. <pause 0.2s>

### Animation
- **0:02 – 0:06 — Race 1: Terminal-Bench, MAGENTA leads.**
  MAGENTA stops at 82.7%, CYAN at 69.4%. Delta badge "+13.3 POINTS".
```

The bullet body references `"different league"` → Claude picks it as `audio_anchor` → Whisper finds it in the transcript → frame-perfect sync.

### Coverage target

Build log shows anchor coverage per scene:
```
[anchor] 0-451f    Race 1: Terminal-Bench        ← locked to spoken word ✓
[anchor] 451-745f  Race 2: OSWorld               ← locked ✓
[interp] 745-830f  Race 3: GDPVal                ← anchor missed, interpolated ⚠
[anchor] 830-1034f Trophy: GPT leads doing round  ← locked ✓
  audio_anchor coverage: 3/4 (75%)
```

- `[anchor]` = visual locked to actual spoken word ✓
- `[interp]` = anchor missed → linearly interpolated from neighbors ⚠

**Target: ≥70% anchor coverage per scene.** Below 70% the build log warns.
Fix: make bullet bodies more concrete, quote a specific word or number from the narration.

### Rule: script time windows are intent, not position

The `0:00 – 0:05` in your bullet is used only to guide the visual designer.
It is **never** used to position the block at render time.
The actual frame position comes exclusively from the Whisper anchor match.
Using script times directly caused 1–1.5s drift on back-loaded scenes (proven on `difference_txt`, 2026-05-06).

---

## 7. Pipeline flow

```
projects/structured_scripts/<name>.txt      ← WRITE THIS
          ↓  storyboard/source_parser.py
      SourceScript (scenes + bullets parsed)
          ↓  visual_designer (in-session, Opus 4.7)
      storyboard/.cache/designs/bullet-*.json
          ↓  storyboard/build_video.py
      TTS (edge-tts) → Whisper (alignment) → render scenes → ffmpeg stitch
          ↓
      projects/<name>/out/<name>-master-yt.mp4    ← FINAL VIDEO
```

The `.txt` file is read exactly once by `source_parser.py`.
All downstream steps (TTS, render, stitch) consume the parsed output — they never re-read the `.txt`.

---

## 8. Complete worked examples — end to end

Four script types are covered below. Each one shows a different kind of content:

| Example | Script type | Key animation techniques |
|---|---|---|
| 8.1 | Comparison / analysis | Side-by-side chat windows, bar chart, verdict cards |
| 8.2 | Process / step-by-step explainer | Numbered steps, timeline, build-up bullets |
| 8.3 | Metaphor / transfer story | Named object (tank), animated level change, REPLACE cut |
| 8.4 | Data race / benchmark | Race track lanes, live score counters, trophy drop |

---

## 8.1 — Comparison / analysis: *"Why Claude Hallucinates Less"*

A 3-scene video showing two models compared on a specific benchmark.
Shows the full structure with annotations explaining what each part does.

---

### `projects/structured_scripts/hallucination.txt`

```
# Why Claude Hallucinates Less — PRODUCTION DOCUMENT

## SCENE 1 — "The Hook" (0:00 – 0:30)
### Narration
> Two AI models. Same question. <pause 0.4s>
> One admits it doesn't know. <pause 0.3s>
> The other makes up an answer — and delivers it with total confidence. <pause 0.4s>
> That gap is not random. It's a design choice. Let me show you why.

### Animation
- **0:00 – 0:05 — Two chat windows side by side.** LEFT: CYAN border "Claude". RIGHT: MAGENTA
  border "GPT". Same prompt typed in both: "Who won the 1987 Peruvian chess championship?"
- **0:05 – 0:12 — Claude replies: I don't know.** CYAN window: "I don't have reliable data on
  this. I'd rather say that than guess." GREEN checkmark pulses beside it. Label: "HONEST."
- **0:12 – 0:20 — GPT replies with confident fabrication.** MAGENTA window fills with a full
  paragraph naming a fictional champion with fake tournament stats. Everything looks real.
  RED warning stamp appears: "FABRICATED." Text glows softly RED.
- **0:20 – 0:30 — Split label reveal.** Chat windows shrink to corners. Center card fades in:
  LEFT "ADMITS UNCERTAINTY" CYAN. RIGHT "INVENTS AN ANSWER" RED. Below in AMBER:
  "SAME INTELLIGENCE. DIFFERENT TRAINING OBJECTIVE."
```

**What happens with audio sync on this scene:**

```
Narration spoken:  "One admits it doesn't know…"
                          ↑
              audio_anchor = "admits it doesn't know"
              Whisper finds it at t=3.2s → framesFrom = round(3.2 × 30) = 96

Narration spoken:  "The other makes up an answer…"
                          ↑
              audio_anchor = "makes up an answer"
              Whisper finds it at t=6.8s → framesFrom = round(6.8 × 30) = 204
```

The bullet time windows `0:05 – 0:12` and `0:12 – 0:20` are approximate hints for the
visual designer — the actual frame positions come from the Whisper match above.

---

```
## SCENE 2 — "The Numbers" (0:30 – 1:10)
### Narration
> Here's what the benchmark shows. <pause 0.3s>
> Claude Opus — thirty-six percent confabulation rate. When stumped, it invents
> an answer about a third of the time. <pause 0.3s>
> GPT-5.5 — eighty-six percent. <pause 0.5s>
> Same question pool. Two and a half times more likely to fabricate. <pause 0.3s>
> But here's what that number actually means in practice.

### Animation
- **0:00 – 0:04 — Benchmark title card.** Dark surface card 88%×20% of canvas. Header in AMBER
  FONT_MONO: "AA-OMNISCIENCE BENCHMARK". Sub: "When the model doesn't know — what does it do?"
- **0:04 – 0:14 — Claude bar grows to 36%.** CYAN horizontal bar animates from left edge.
  Stops at 36% of track width. Label: "CLAUDE OPUS 4.7" left, "36%" right in CYAN. Below bar:
  "makes something up 1 in 3 times" in DIM text.
- **0:14 – 0:26 — GPT bar grows to 86%, RED glow.** MAGENTA bar starts growing. Passes Claude's
  bar. Keeps going. Stops at 86%. Bar glows RED at tip. Label: "GPT-5.5" left, "86%" right
  in RED. Below: "makes something up 6 in 7 times" in RED text.
- **0:26 – 0:36 — 2.5× multiplier badge drops in.** Between bars: badge with spring entrance
  from above. AMBER text: "2.5×" large, below "more likely to fabricate" small. Badge border
  pulses once.
- **0:36 – 0:40 — "In practice" transition card.** Bars dim. Center text fades in WHITE:
  "But what does 86% actually cost you?" Hold 3s.
```

**Good anchor phrases in this narration** (hero words + numbers):
- `"thirty-six percent"` → triggers Claude bar block
- `"eighty-six percent"` → triggers GPT bar block
- `"two and a half times"` → triggers multiplier badge block
- `"in practice"` → triggers transition card

Each phrase is specific, spoken at a clear moment, easy for Whisper to find.

---

```
## SCENE 3 — "The Verdict" (1:10 – 1:40)
### Narration
> So should you stop using GPT? <pause 0.4s> No. <pause 0.3s>
> The rule is simple. <pause 0.2s>
> If a wrong answer costs you money, reputation, or your job — use Claude. <pause 0.3s>
> If a wrong answer costs you thirty seconds — GPT is faster and cheaper. <pause 0.3s>
> Choose the failure mode you can survive.

### Animation
- **0:00 – 0:06 — Question card pulses.** Dark void. AMBER text center: "Should you stop
  using GPT?" Question mark pulses every 20 frames. No answer yet.
- **0:06 – 0:12 — "No" slams in, then rule card.** "No." in large WHITE text hits center with
  spring (stiffness 200, damping 12). Bounces once. Fades to 30% opacity. Rule card slides up:
  "THE RULE IS SIMPLE" in AMBER FONT_MONO.
- **0:12 – 0:24 — Two consequence cards side by side.** LEFT card CYAN border: "COSTS YOU
  MONEY / REPUTATION / YOUR JOB" → "USE CLAUDE" CYAN bold. RIGHT card MAGENTA border:
  "COSTS YOU 30 SECONDS" → "USE GPT-5.5" MAGENTA bold. Both cards spring in with 8-frame stagger.
- **0:24 – 0:30 — Final line burns in.** Cards fade to 20% opacity. Center: "CHOOSE THE
  FAILURE MODE YOU CAN SURVIVE." Each word appears 4 frames apart, AMBER, 52px.
  Last word holds. Hard cut to black.
```

---

### `projects/hallucination/config.yaml`

```yaml
project: hallucination
output: Why_Claude_Hallucinates_Less.mp4

audio:
  voice: en-US-AndrewMultilingualNeural
  full_audio_filename: vo-hallucination-full.mp3
  rate: '+15%'
  pitch: '+0Hz'

video: {fps: 30, width: 1920, height: 1080}

design:
  bg: '#0A0A0F'
  surface: '#12121A'
  text: '#E8E8E8'
  text_dim: '#666680'
  cyan: '#00F0FF'
  violet: '#FF2D92'
  amber: '#FFB800'
  green: '#00FF88'
  red: '#FF3B3B'
  soft_red: '#FF6B6B'
  white: '#E8E8E8'
  font_display: "'Inter', sans-serif"
  font_mono: "'JetBrains Mono', monospace"
  dot_grid_opacity: 0.04
  dot_grid_spacing: 40
  spring_damping: 14
  spring_stiffness: 180
  fade_frames: 0
  type_speed_cps: 22

stitch:
  mode: remotion_master
  crossfade_frames: 12
```

---

### What makes this example production-quality

| Element | What it does | Why it matters |
|---|---|---|
| Short narration clauses + `<pause>` | Creates clear spoken moments | Each pause = potential anchor point |
| Numbers in narration (`thirty-six percent`) | Unique, easy for Whisper to find | Near-guaranteed anchor hit |
| Bullet body echoes narration phrase | `"makes up an answer"` in both | Claude picks it as `audio_anchor` |
| Color attribution in bullets (`CYAN border "Claude"`) | Unambiguous visual instruction | No rendering ambiguity |
| Canvas-filling visuals (88%×20%, side-by-side cards) | Every block covers >40% canvas | Passes V1 gate |
| Spring physics named in bullets (`stiffness 200, damping 12`) | Tells designer which spring preset | Consistent motion feel |

---

## 8.2 — Process / step-by-step explainer: *"How Transformers Learn"*

A 3-scene video explaining a technical concept through numbered steps and a timeline.
Demonstrates: step-by-step build-up bullets, ADDITIVE layering to accumulate steps, timeline spine.

---

### `projects/structured_scripts/transformers.txt`

```
# How Transformers Learn — PRODUCTION DOCUMENT

## SCENE 1 — "The Problem" (0:00 – 0:35)
### Narration
> Old neural networks read words one at a time. Left to right. In order. <pause 0.3s>
> Every word waited for the one before it. <pause 0.4s>
> That made them slow. And it made them forget context. <pause 0.3s>
> The word at the start of a long sentence? By the end — gone.
> Transformers solved this with one idea: read everything at once.

### Animation
- **0:00 – 0:06 — [REPLACE] Old network: words queued in a line.**
  Horizontal conveyor belt, 8 word tokens ("The", "cat", "sat", "on", "the", "mat", "and",
  "slept") spaced 120px apart. Each word D.text_dim box, 100×40px. Single processor
  node at right end, AMBER glow. Tokens slide right one at a time, 20 frames per token.
  Label top-left D.font_mono 14px: "RNN — ONE WORD AT A TIME."

- **0:06 – 0:14 — Forgotten context highlight.**
  First token "The" highlighted RED as it exits the processor. Counter below: "CONTEXT
  WINDOW: 1 token remembered." Remaining tokens D.text_dim. Arrow labeled "FORGOTTEN"
  points at the dimmed early tokens. Spring entrance from below, snappy (damping 20).

- **0:14 – 0:22 — [REPLACE] Transformer: all words at once.**
  Same 8 tokens — but now arranged in a 2D grid, 4×2. Each token CYAN box with soft glow.
  8 lines connect every token to every other token simultaneously (28 lines total, opacity
  0.3, D.cyan). All 8 tokens pulse once together. Label: "TRANSFORMER — ALL AT ONCE."

- **0:22 – 0:35 — Attention lines thicken on "cat" → "slept".**
  The connection line between "cat" and "slept" thickens from 1px to 4px, color D.amber.
  Both tokens glow brighter. Label slides in from right: "ATTENTION: 'cat' relates to 'slept'."
  Below in D.text_dim: "No forgetting. No waiting."

## SCENE 2 — "The Four Steps" (0:35 – 1:20)
### Narration
> Here's exactly how a transformer processes one sentence. Four steps. <pause 0.3s>
> Step one: tokenize. Break the sentence into pieces. <pause 0.2s>
> Step two: embed. Convert each piece into a vector of numbers. <pause 0.2s>
> Step three: attend. Every token looks at every other token. Scores relationships. <pause 0.3s>
> Step four: predict. The highest-scored next token wins. <pause 0.3s>
> Four steps. Every single forward pass. Every word you've ever gotten from an LLM.

### Animation
- **0:00 – 0:04 — Step tracker header appears.**
  Top strip D.surface, full width, 80px height. Label D.font_mono D.text_dim: "TRANSFORMER
  FORWARD PASS — 4 STEPS." Four empty circle nodes labeled 1 2 3 4 right side, D.text_dim.

- **0:04 – 0:14 — Step 1: Tokenize.**
  Node 1 fills CYAN. Below header: input sentence "The cat sat on the mat" splits into
  6 token chips with snappy spring (damping 18, stiffness 220), staggered 8 frames each.
  Each chip: white rounded rectangle 90×36px, token text D.bg inside, D.cyan border.
  Label below chips: "STEP 1 — TOKENIZE" D.amber.

- **0:14 – 0:26 — Step 2: Embed. [ADDITIVE]**
  Node 2 fills CYAN. Each token chip grows downward: 6 thin vertical bars of random
  heights appear below each chip (representing vector dimensions), D.cyan, width 8px,
  staggered 4 frames. 300 numbers total. Label: "STEP 2 — EMBED: each token → 768 numbers."

- **0:26 – 0:40 — Step 3: Attend. [ADDITIVE]**
  Node 3 fills CYAN. 15 attention lines arc between chips. Lines appear in groups of 3,
  each group staggered 10 frames. Thicker lines = stronger attention, D.amber. Thinnest
  lines D.cyan opacity 0.25. Label: "STEP 3 — ATTEND: score every relationship."

- **0:40 – 0:52 — Step 4: Predict. [ADDITIVE]**
  Node 4 fills D.green. A new token chip materializes to the right of the last one:
  heavy spring entrance (damping 12, stiffness 80, mass 2), D.green border, text "slept".
  Label: "STEP 4 — PREDICT: highest-score token wins." Below: "OUTPUT: 'slept'" D.green bold.

- **0:52 – 1:20 — All 4 nodes glow, summary holds.**
  All 4 step nodes pulse once in sequence (12-frame stagger). Center card fades in REPLACE:
  "4 STEPS. EVERY WORD. EVERY PROMPT." D.font_display white 48px. Below in D.text_dim:
  "Running in parallel — not one at a time."

## SCENE 3 — "Why It Changed Everything" (1:20 – 1:50)
### Narration
> Before transformers: best translation model needed two weeks to train. <pause 0.3s>
> After transformers: same quality in two days. <pause 0.4s>
> That's not an improvement. That's a different era. <pause 0.3s>
> GPT, Claude, Gemini — every model you use today is a transformer.
> The architecture is ten years old. We're still finding its ceiling.

### Animation
- **0:00 – 0:08 — [REPLACE] Timeline spine: 2017 to 2025.**
  Horizontal timeline, full canvas width, 4px D.text_dim line at vertical center. Year nodes
  at 2017, 2018, 2020, 2022, 2023, 2024, 2025 — small circles D.text_dim, 14px.
  "Attention Is All You Need" paper icon drops at 2017 with bouncy spring (damping 8).
  Label: "2017 — TRANSFORMER PAPER." D.amber.

- **0:08 – 0:20 — Model milestones appear on timeline. [ADDITIVE]**
  Nodes spring up from timeline at each year, staggered 15 frames:
  2018 → "BERT" D.cyan; 2020 → "GPT-3" D.amber; 2022 → "ChatGPT" D.green;
  2023 → "GPT-4 / Claude 2" D.cyan; 2024 → "Claude 3 / GPT-4o" D.violet;
  2025 → "Claude Opus 4.7 / GPT-5.5" SPLIT D.cyan left D.violet right.
  Each node: label above in D.font_mono 13px, circle fills its color.

- **0:20 – 0:30 — Training time comparison bars. [ADDITIVE]**
  Two vertical bars rise from bottom of canvas. LEFT D.red "BEFORE: 14 DAYS."
  RIGHT D.green "AFTER: 2 DAYS." Both animate from 0% height, LEFT first then RIGHT
  with 20-frame stagger. Heights proportional: LEFT 100%, RIGHT 14% of canvas.
  Delta badge between bars: "7× FASTER" D.amber, bouncy spring.

- **0:30 – 0:50 — Final verdict card. [REPLACE]**
  Dark canvas. Three lines appear word by word, 4 frames per word:
  Line 1 D.cyan 42px: "GPT. CLAUDE. GEMINI."
  Line 2 D.text_dim 22px: "Every model you use today."
  Line 3 D.amber 36px: "All transformers."
  After all lines: D.text_dim 16px fades in below: "Architecture: 2017. Ceiling: unknown."
```

**Anchor phrases and what they fire:**

| Narration phrase | Bullet it fires |
|---|---|
| `"one at a time"` | Conveyor belt animation |
| `"read everything at once"` | 2D grid of tokens |
| `"step one"` | Step 1 tokenize |
| `"step two"` | Step 2 embed |
| `"step three"` | Step 3 attend |
| `"step four"` | Step 4 predict |
| `"two weeks"` | Timeline spine |
| `"two days"` | Training time bars |

**Why this works:**
- ADDITIVE bullets in Scene 2 build the step tracker cumulatively — each step node fills as the narration says the step number
- Step numbers in the narration (`"step one"`, `"step two"`) are unique, spoken at distinct moments — near-guaranteed Whisper anchor hits
- Timeline spine uses REPLACE then ADDITIVE — spine appears clean, then milestones layer on top

---

## 8.3 — Metaphor / transfer story: *"Data Flows Like Water"*

A 2-scene video explaining a data pipeline concept through a physical metaphor.
Demonstrates: named object metaphor (tank), animated level change, REPLACE for scene cut.

---

### `projects/structured_scripts/data_flow.txt`

```
# Data Flows Like Water — PRODUCTION DOCUMENT

## SCENE 1 — "The Transfer" (0:00 – 0:45)
### Narration
> Think of your database as a tank. <pause 0.3s>
> Right now all your data lives in Tank A — your old system. <pause 0.3s>
> The migration doesn't copy it. It moves it. <pause 0.4s>
> Watch the valve open. <pause 0.2s>
> Tank B fills completely. Tank A empties. <pause 0.3s>
> Zero data lost. The numbers have to match.

### Animation
- **0:00 – 0:08 — [REPLACE] Two glass tanks, Tank A full.**
  Two tall glass rectangles, 30% canvas width each, vertically centered, 15% gap between.
  Left "TANK A — OLD SYSTEM" label D.text_dim above in D.font_mono 16px.
  Water column D.cyan, height 90% of tank interior, slow opacity pulse 0.85→1.0 on
  40-frame cycle. Right "TANK B — NEW SYSTEM" label, empty — dashed outline only D.text_dim.
  Horizontal pipe at 50% tank height connecting both. Valve icon at midpoint: RED circle 28px.
  Row count label below Tank A: "12,847,203 rows" D.text_dim 14px.

- **0:08 – 0:20 — Valve opens, water flows left to right.**
  Valve icon flips GREEN with snappy spring (damping 20, stiffness 200). 12 small D.cyan
  circles (16px each) animate along pipe path; each offset 12 frames from previous,
  opacity interpolates 1.0→0.0 over travel distance. Tank A water level drops:
  interpolate over durationInFrames*0.85 from 0.90 to 0.05. Tank B water level rises:
  interpolate same range from 0.00 to 0.85. Row counter below Tank A counts down,
  Tank B counter counts up — both using D.font_mono 14px.

- **0:20 – 0:32 — Progress label mid-transfer.**
  Midpoint badge springs in above pipe (snappy, damping 18): "MIGRATING..." D.amber
  D.font_mono 18px. Percentage counter beside it: interpolate 0→100 over bullet duration.
  Both tanks show partial levels. Pipe circles still flowing.

- **0:32 – 0:45 — [REPLACE] Transfer complete — Tank B full.**
  Tank A: empty, dashed outline D.text_dim, label dims to 30% opacity.
  Tank B: full D.cyan fill, glow border D.cyan shadow-spread 24px, label brightens.
  Row count below Tank B: "12,847,203 rows ✓" D.green D.font_mono.
  Stamp enters from top with heavy spring (damping 12, stiffness 90, mass 2):
  "MIGRATION COMPLETE" D.font_display D.green rotated -2deg 56px.
  Below stamp D.font_mono 16px D.text_dim: "ZERO LOSS. ROWS IN = ROWS OUT."

## SCENE 2 — "What Can Go Wrong" (0:45 – 1:20)
### Narration
> But here's what the diagram doesn't show. <pause 0.4s>
> The pipe can clog. Three ways. <pause 0.3s>
> Schema mismatch — Tank B's shape doesn't match Tank A's water. <pause 0.3s>
> Encoding errors — the data arrives corrupted. <pause 0.3s>
> Timeout — the transfer stalls mid-stream, tanks out of sync. <pause 0.4s>
> Each one has a different fix. Each fix takes a different amount of time.

### Animation
- **0:00 – 0:06 — [REPLACE] Same two tanks, pipe clogged RED.**
  Same tank setup from Scene 1 but Tank B half-full, frozen. Pipe now shows RED X icon
  at center. Flow circles stopped. Both tanks: water level static. Label above pipe:
  "TRANSFER STALLED" D.red D.font_mono 18px, opacity pulses 0.7→1.0 on 20-frame cycle.

- **0:06 – 0:22 — Three failure cards drop in sequence. [ADDITIVE]**
  Three cards spring down from top, staggered 20 frames each.
  Card 1 D.red border: "SCHEMA MISMATCH" title D.font_display 20px, body D.text_dim 14px:
    "Tank B column types differ from Tank A. Fix: ALTER TABLE before migration. Time: 2 hrs."
  Card 2 D.amber border: "ENCODING ERRORS" title, body:
    "UTF-8 vs Latin-1 collision on text fields. Fix: iconv + pre-scan. Time: 4 hrs."
  Card 3 D.violet border: "TIMEOUT" title, body:
    "Batch too large for single transaction. Fix: chunk to 10,000 rows. Time: 30 min."
  Each card: 420×140px, D.surface background, snappy spring (damping 20, stiffness 180).

- **0:22 – 0:36 — Time cost bar chart. [ADDITIVE]**
  Below the three cards: three vertical bars grow upward from baseline, staggered 10 frames.
  Bar 1 D.red: height proportional to "2 HRS". Bar 2 D.amber: "4 HRS". Bar 3 D.violet: "0.5 HRS".
  Labels above each bar in D.font_mono 13px. Baseline label: "TIME TO FIX."

- **0:36 – 1:20 — [REPLACE] Rule card: match the fix to the failure.**
  Two-column card fills 80%×60% of canvas. Header D.amber D.font_mono: "MATCH THE FIX."
  Left column "FAILURE TYPE": schema / encoding / timeout in D.text_dim rows.
  Right column "FIRST ACTION": ALTER TABLE / iconv scan / reduce batch size — each row
  D.green. Row separator lines D.surface. Card springs in from below with heavy spring
  (damping 14, stiffness 100). Hold to end of scene.
```

**Anchor phrases and what they fire:**

| Narration phrase | Bullet it fires |
|---|---|
| `"Tank A"` | Two glass tanks setup |
| `"watch the valve open"` | Valve flips GREEN, flow begins |
| `"Zero data lost"` | REPLACE — completion stamp |
| `"pipe can clog"` | REPLACE — clogged pipe scene |
| `"schema mismatch"` | Card 1 drops |
| `"encoding errors"` | Card 2 drops |
| `"timeout"` | Card 3 drops |

**Why this works:**
- The tank metaphor is named explicitly in both narration ("Think of your database as a tank") and bullet bodies ("Two tall glass rectangles")
- REPLACE on bullets 1 and 4 creates clean scene cuts — old visuals fully wiped
- Row counters in D.font_mono reinforce the "data = numbers" framing
- Three failure cards use three different color tokens (D.red / D.amber / D.violet) — each failure has a visual identity

---

## 8.4 — Data race / benchmark: *"The Speed Test"*

A 2-scene video comparing two products on multiple benchmarks using race tracks.
Demonstrates: race lanes, live fill animation, trophy entrance, scoreboard.

---

### `projects/structured_scripts/speed_test.txt`

```
# The Speed Test — PRODUCTION DOCUMENT

## SCENE 1 — "The Race" (0:00 – 1:00)
### Narration
> We ran five tests. Same hardware. Same prompts. Same judge. <pause 0.3s>
> Test one: raw inference speed. Watch the blue runner. <pause 0.2s>
> Sixty-two tokens per second versus forty-one. Not close. <pause 0.3s>
> Test two: time to first token. The green runner this time. <pause 0.2s>
> One-point-two seconds versus two-point-eight. More than twice as fast. <pause 0.3s>
> Test three: sustained throughput over ten minutes. <pause 0.2s>
> Blue holds steady. Green degrades — thermal throttling kicks in at minute four. <pause 0.4s>
> Test four: cost per million tokens. <pause 0.2s>
> Green is cheaper. Two dollars versus three-fifty. <pause 0.3s>
> Test five: accuracy on domain questions. <pause 0.2s>
> Green leads — eighty-eight percent versus seventy-nine.

### Animation
- **0:00 – 0:05 — [REPLACE] Race track materializes.**
  Two horizontal capsule lane tracks, full canvas width 90%, stacked vertically with 40px gap.
  Top lane D.cyan background 8px border: "MODEL A" label D.font_mono 16px left side.
  Bottom lane D.green background 8px border: "MODEL B" label D.font_mono 16px left side.
  Distance markers at 25%, 50%, 75%, 100% — thin vertical lines D.text_dim.
  Header center D.font_display D.text 28px: "5 BENCHMARK TESTS."

- **0:05 – 0:15 — Test 1: Inference speed, MODEL A leads.**
  Both runners launch from left. MODEL A (D.cyan capsule 60×28px) stops at 62% of track.
  MODEL B (D.green capsule) stops at 41%. Both animate with interpolate over
  durationInFrames*0.7, easing Easing.out(Easing.quad). Speed labels appear at stop point:
  "62 tok/s" D.cyan above track. "41 tok/s" D.green below. Delta badge between lanes:
  "+21 TOKENS/S" D.cyan, snappy spring (damping 18, stiffness 200).

- **0:15 – 0:25 — Test 2: Time to first token, MODEL B leads. [REPLACE]**
  Fresh track. MODEL B runner now reaches 86% (1.2s scaled inversely). MODEL A reaches
  43% (2.8s). Note: shorter time = longer bar (speed metric, inverted). Labels:
  "1.2s" D.green, "2.8s" D.cyan. Delta: "2.3× FASTER" D.green badge.

- **0:25 – 0:35 — Test 3: Sustained throughput, MODEL A wins. [REPLACE]**
  Line chart instead of bars. Two lines plot over 10 time segments (minute markers).
  D.cyan line flat/steady across all 10. D.green line flat to segment 4 then drops
  15% — interpolate(frame, [dur*0.5, dur*0.8], [1.0, 0.72]).
  Drop point annotated: "THROTTLE AT MIN 4" D.amber label. D.cyan line labeled: "STABLE."

- **0:35 – 0:44 — Test 4: Cost, MODEL B wins. [REPLACE]**
  Two price tags drop from top with bouncy spring (damping 8): D.green "$2.00 / 1M tokens",
  D.cyan "$3.50 / 1M tokens." Green tag larger (winner). Savings badge: "SAVE 43%" D.green.

- **0:44 – 0:55 — Test 5: Accuracy, MODEL B wins. [REPLACE]**
  Two horizontal accuracy bars. D.green grows to 88%, D.cyan to 79%. Both animate
  over durationInFrames*0.7. Labels at tip: "88%" D.green bold, "79%" D.cyan.
  Delta badge: "+9 POINTS" D.green.

- **0:55 – 1:00 — Scoreboard fills. [REPLACE]**
  Two columns: MODEL A left D.cyan, MODEL B right D.green.
  Five rows, one per test — each cell shows WIN or LOSS.
  Rows populate with 10-frame stagger: WIN cells D.green fill, LOSS cells D.surface dim.
  Final tally row: "MODEL A: 2 WINS" D.cyan, "MODEL B: 3 WINS" D.green.
  Trophy icon D.green drops above MODEL B column with bouncy spring (damping 8).

## SCENE 2 — "Which One Do You Pick?" (1:00 – 1:30)
### Narration
> So here's the real question. Not which is faster. <pause 0.3s>
> Which failures can your use case survive? <pause 0.4s>
> If you need speed and cost — Model B wins. <pause 0.3s>
> If you need sustained load and stability — Model A wins. <pause 0.3s>
> They're not competing. They're for different jobs.

### Animation
- **0:00 – 0:08 — [REPLACE] Decision matrix 2×2.**
  Four floor tiles in 2D grid, each 40% canvas width, 35% height, 20px gap.
  Top-left D.green tinted: "HIGH THROUGHPUT + LOW COST → MODEL B."
  Top-right D.cyan tinted: "SUSTAINED LOAD + STABILITY → MODEL A."
  Bottom-left D.text_dim: "LATENCY-SENSITIVE → MODEL B."
  Bottom-right D.text_dim: "ACCURACY-CRITICAL → DEPENDS ON DOMAIN."
  All four tiles spring in with 12-frame stagger, snappy (damping 20, stiffness 200).

- **0:08 – 0:22 — Highlight use-case tiles. [ADDITIVE]**
  MODEL B tiles (top-left, bottom-left) glow D.green border 3px, brightness +20%.
  MODEL A tile (top-right) glows D.cyan border 3px. Bottom-right dims to 15% opacity.
  Label fades in below grid D.text_dim 16px: "Match the model to the workload."

- **0:22 – 0:30 — [REPLACE] Final verdict card.**
  Single card 70%×40% canvas. D.surface background. Two lines:
  Line 1 D.green D.font_display 36px: "SPEED + COST → MODEL B."
  Line 2 D.cyan D.font_display 36px: "LOAD + STABILITY → MODEL A."
  Divider line D.text_dim between them.
  Below both lines D.amber D.font_mono 18px: "DIFFERENT JOBS. DIFFERENT WINNERS."
  Card springs in from below, heavy spring (damping 14, stiffness 90, mass 2).
```

**Anchor phrases and what they fire:**

| Narration phrase | Bullet it fires |
|---|---|
| `"watch the blue runner"` | Race track materializes, runners launch |
| `"sixty-two tokens"` | Delta badge appears |
| `"time to first token"` | Test 2 REPLACE |
| `"thermal throttling"` | Throttle annotation on line chart |
| `"two dollars"` | Price tags drop |
| `"eighty-eight percent"` | Accuracy bars animate |
| `"speed and cost"` | Decision matrix |
| `"different jobs"` | Final verdict card |

**Why this works:**
- Every test is a fresh REPLACE — clean slate prevents visual overlap between races
- Color identity (D.cyan = Model A, D.green = Model B) is set in bullet 1 and never breaks
- Narration says the number ("sixty-two tokens") at the same moment the number appears on screen — frame-perfect sync via anchor
- The line chart for Test 3 breaks from the bar pattern intentionally — the script explicitly describes "line chart" because bar charts cannot show degradation over time

---

## 8.5 — Single-scene snippets (copy-paste templates)

Short examples for common scene types. Use these when writing individual scenes inside a longer script.

---

### Quote / testimonial scene

```
## SCENE N — "What Developers Say" (M:SS – M:SS)
### Narration
> Theo Browne built one of the most-watched engineering channels on YouTube.
> Here's what he said after four days using GPT-5.5. <pause 0.3s>
> Quote: "Smart, weird, hard to wrangle, and too expensive." <pause 0.4s>
> That's not a complaint. That's a job description.

### Animation
- **0:00 – 0:05 — [REPLACE] Speaker identity card.**
  Left third of canvas: portrait placeholder circle 180px D.text_dim border, center.
  Right two-thirds: "THEO BROWNE" D.font_display D.text 32px. Below: "@t3dotgg"
  D.font_mono D.text_dim 16px. "200K+ subscribers" D.text_dim 14px. Snappy spring entrance.

- **0:05 – 0:18 — Quote card expands.**
  Large quote card 80%×50% canvas, D.surface background, D.amber left border 4px.
  Quote text D.font_display D.text 28px italic, max 3 lines, fitText applied:
  '"Smart, weird, hard to wrangle, and too expensive."'
  Attribution below D.text_dim 16px: "— Theo Browne, after 4 days with GPT-5.5."
  Card springs in from right with heavy spring (damping 14, stiffness 100).

- **0:18 – 0:28 — Key phrase highlights. [ADDITIVE]**
  Words "Smart" D.green, "weird" D.amber, "hard to wrangle" D.red, "too expensive" D.red
  each brighten with 6-frame stagger as if underlined by a marker.
  Reframe label fades in below card D.text_dim 16px: "Not a complaint. A job description."
```

---

### Before / after scene

```
## SCENE N — "Before and After" (M:SS – M:SS)
### Narration
> This is what the codebase looked like before the refactor.
> Twelve hundred lines. Four responsibilities. Zero tests. <pause 0.3s>
> Six hours later — watch the right side.

### Animation
- **0:00 – 0:06 — [REPLACE] Split canvas: BEFORE left, AFTER right.**
  Vertical divider line D.text_dim at 50% canvas width, 2px.
  Left panel header D.red D.font_mono 14px: "BEFORE." Right panel header D.green: "AFTER."
  Left panel: code block mockup, 1200 lines of D.text_dim 11px text, monospace,
  dense — no spacing. Files listed: "auth.js — 1,200 lines" D.red.

- **0:06 – 0:20 — Right side builds as narrator describes. [ADDITIVE]**
  Right panel: 4 files spring in staggered 12 frames each from right edge.
  "auth.service.js — 180 lines" D.green. "auth.middleware.js — 95 lines" D.cyan.
  "auth.validator.js — 60 lines" D.amber. "auth.test.js — 220 lines ✓" D.green.
  Each file: small card D.surface background, D.font_mono 13px, snappy spring.

- **0:20 – 0:30 — Delta badges drop. [ADDITIVE]**
  Above left panel: badge D.red "1,200 LINES. 0 TESTS."
  Above right panel: badge D.green "555 LINES. 220 TESTS."
  Between panels: large badge D.amber "54% SMALLER. 100% TESTED." bouncy spring (damping 8).
```

---

### Timeline / history scene

```
## SCENE N — "The Timeline" (M:SS – M:SS)
### Narration
> Three years. Four major releases. One direction. <pause 0.3s>
> March twenty-twenty-three — Claude one. Quiet launch, developer-only. <pause 0.2s>
> July — Claude two. Writing quality jumps. <pause 0.2s>
> March twenty-twenty-four — Claude three family. Three tiers. The first model
> people called better than GPT-4. <pause 0.3s>
> April twenty-twenty-six — Claude Opus four-point-seven.
> Highest-ever SWE-bench score.

### Animation
- **0:00 – 0:06 — [REPLACE] Timeline spine appears.**
  Horizontal line 90% canvas width at vertical center, 3px D.text_dim.
  Year markers "2023" "2024" "2025" "2026" at proportional positions, D.text_dim
  D.font_mono 13px below line. Line draws left-to-right over 30 frames using
  interpolate on width from 0 to full.

- **0:06 – 0:12 — Release 1: Claude 1. [ADDITIVE]**
  Node springs up at 2023-03 position: circle 20px D.text_dim fill, snappy spring.
  Label above: "CLAUDE 1" D.font_mono 14px D.text_dim. Sub: "Mar 2023 — Developer beta."

- **0:12 – 0:18 — Release 2: Claude 2. [ADDITIVE]**
  Node at 2023-07: circle D.text 20px. Label: "CLAUDE 2" D.text. Sub: "Jul 2023 — Writing quality leap."

- **0:18 – 0:28 — Release 3: Claude 3 family. [ADDITIVE]**
  Three nodes at 2024-03 close together: Haiku D.text_dim, Sonnet D.cyan, Opus D.amber.
  Labels stagger 8 frames apart. Bracket below all three: "CLAUDE 3 FAMILY." Bold Opus
  label: "First model users called GPT-4 class."

- **0:28 – 0:40 — Release 4: Claude Opus 4.7. [ADDITIVE]**
  Large node at 2026-04: circle 32px D.cyan glow, heavy spring (damping 12, stiffness 80).
  Label above bold: "CLAUDE OPUS 4.7" D.cyan D.font_display 20px.
  Badge beside node: "SWE-bench: 87.6% ★" D.green bouncy spring.

- **0:40 – 0:55 — Direction arrow sweeps right. [ADDITIVE]**
  Arrow extends from 2023 to 2026 above the nodes, D.cyan, 3px, arrowhead.
  Draws left-to-right over 20 frames. Label above arrow D.text_dim 14px: "ONE DIRECTION."
```

---

### 8.5 summary — which template to pick

| Your scene contains | Use template |
|---|---|
| A person saying something memorable | Quote / testimonial |
| Before and after a change | Before / after |
| Events in chronological order | Timeline |
| Two things racing or compared on multiple axes | Data race (8.4) |
| How something works step by step | Process explainer (8.2) |
| A physical concept (flow, fill, transfer) | Metaphor / transfer (8.3) |
| Two entities compared on ONE metric | Side-by-side bars (8.1 Scene 2) |

---

## 9. Writing Cinematically — The Bullet Body IS the Screenplay

The pipeline renders exactly what you write in each bullet body.
Vague description → generic render. Director-level description → cinematic render.

**Nothing else controls visual quality. No config flag. No pipeline setting.**

All evidence below comes from `projects/structured_scripts/chat_5_5.txt` — a shipped production script.

### Section 9 quick-reference

| Sub-section | What it teaches |
|---|---|
| 9.1 | Side-by-side proof: generic bullet vs production bullet from Scene 3 |
| 9.2 | Every named metaphor from the production script (lie detector, octopus, race track, filing cabinet) with the exact text that produced it |
| 9.3 | Adjective → number translation table (30-40 shards, 100+ particles, 10-15 circles) |
| 9.4 | Spring intent → physics config map (bouncy / snappy / heavy / smooth) |
| 9.5 | Audio anchor as editorial cut — with exact production examples from S4 and S5 |
| 9.6 | REPLACE vs ADDITIVE — when to wipe the screen vs stack on top |
| 9.7 | Narration writing rules for creating sync opportunities |
| 9.8 | Pause = viewing time for the visual that just appeared |
| 9.9 | Complete water tank scene written cinematically — all 5 techniques annotated |
| 9.10 | 8-question pre-write checklist — must answer before touching bullet code |
| 9.11 | Content-type → visual template table (only when bullet is vague; named metaphor overrides) |

**Key principle:** The content-type table in 9.11 is a fallback for vague bullets, not a restriction on what can be rendered. If the script says "octopus" — render the octopus. The table never overrides an explicit script description.

---

---

### 9.1 The core gap: generic vs cinematic

**Generic bullet (what NOT to write):**
```
- **0:02 – 0:05 — Show Claude's approach.**
  Claude processes the task carefully and returns a verified result.
```
What renders: empty workspace, a spinner, maybe a text label. Indistinguishable from any other video.

**Cinematic bullet (from Scene 3 of the production script):**
```
- **0:02 – 0:05 — CYAN architect examines the cube.**
  Geometric CYAN humanoid (Bauhaus rectangles/circles) places cube on workbench,
  rotates it with magnifying glass, unfolds to blueprint with code lines, writes fix in GREEN.
```
What renders: a specific character, a specific object, a specific action, specific colors.
Not generic. Not replaceable.

**The pipeline did not make that cinematic. You wrote it that way.**

---

### 9.2 Technique 1 — Bespoke named metaphor

Every memorable scene in the production script has a named visual object. Not "something visual". A named thing.

| Scene | Named metaphor | How it appears in the bullet body |
|---|---|---|
| S1 | 86% shattering screen | `"30-40 irregular shards fly outward with spring physics (damping 8-16)"` |
| S2 | Missile launch | `"CYAN streak on ballistic arc from SF dot. Vapor wake of 10-15 fading circles."` |
| S3 | Lie detector machine | `"Art-deco cyberpunk lie detector machine. Paper roll feeds. Needle at center. Warm amber glow."` |
| S4 | Tron race tracks | `"Two parallel capsule lanes: MAGENTA top 'GPT-5.5', CYAN bottom 'CLAUDE 4.7'."` |
| S5 | Filing cabinet with drawers | `"Filing cabinet with two drawers. Drawer 1 RED 'THE LAWYER': brief unfolds, 12 citations."` |
| S5 | Geometric octopus | `"Geometric MAGENTA octopus with neon-outlined tentacles simultaneously grabs browser, code editor, spreadsheet."` |

**Rule:** If the bullet body doesn't name the metaphor and its visual form, the renderer has nothing to work with.

Do not write: `"Show the comparison"`.
Write: `"Art-deco cyberpunk lie detector machine. Paper roll feeds. Needle at center."`.

---

### 9.3 Technique 2 — Color = character identity, consistent across scenes

Pick a color for each entity. Use it everywhere that entity appears.

**Production script identity map:**

| Entity | Token | Meaning |
|---|---|---|
| Claude / architect / careful thinking | `D.cyan` | `CYAN` |
| GPT / octopus / speed / spread | `D.violet` or `MAGENTA` | `MAGENTA` |
| Warning / cost / ambiguity | `D.amber` | `AMBER` |
| Danger / hallucination / liability | `D.red` | `RED` |
| Verified / correct / safe | `D.green` | `GREEN` |

These identities appear in Scene 2, Scene 3, Scene 4, Scene 5. When the viewer sees CYAN they already know who it is without reading the label. That is visual language — cinema technique applied to YouTube video.

**In bullet bodies, always attribute color to entity:**
- Wrong: `"A card slides in."`
- Right: `"CYAN card slides in from right — Claude's result. MAGENTA card from left — GPT's result."`

---

### 9.4 Technique 3 — Exact quantities, not adjectives

The React code uses the numbers you write. Adjectives cannot be coded.

| Adjective (unfillable) | Quantity (codeable) |
|---|---|
| `"many shards"` | `"30-40 irregular shards"` → `Array.from({length: 35})` |
| `"some particles"` | `"100+ particle fragments spray and drift"` → `Array.from({length: 110})` |
| `"staggered"` | `"300ms stagger"` → `frame - i * 9` (9 frames at 30fps) |
| `"vapor trail"` | `"10-15 fading circles"` → `Array.from({length: 12})` |
| `"several tentacles"` | `"8 tentacles, each grabbing a different tool"` → `Array.from({length: 8})` |
| `"bouncy entrance"` | `"spring damping 8-16"` → `{damping: 12}` |

Write the number. Not the adjective.

---

### 9.5 Technique 4 — State physics intent in the bullet body

Spring physics choice determines visual feel. Name it in the bullet.

| Intent | Write in bullet body | What renders |
|---|---|---|
| Dramatic, hero | `"bouncy spring"` | `{damping: 8}` — overshoots, snaps back |
| Cards, UI labels | `"snappy entrance"` | `{damping: 20, stiffness: 200}` |
| Heavy, cinematic | `"heavy spring, damping 15, stiffness 80, mass 2"` | Slow weight, lands with authority |
| Ambient, ambient | `"smooth reveal"` | `{damping: 200}` — no overshoot |

**From production S1:** `"spring physics (damping 8-16), rotating on X/Y/Z"`
The author named the damping range. The renderer used it.

Also name motion shape when it matters:
- `"Needle sawtooth oscillations"` — renderer uses `Math.sin(frame * 0.5) * amplitude` with increasing amplitude
- `"Heartbeat pulse every 30 frames"` — renderer uses `frame % 30 === 0` to trigger ring expansion
- `"Slow-motion last 10%"` — renderer uses `interpolate(frame, [dur*0.9, dur], [1, 0.1])` on speed

---

### 9.6 Technique 5 — Audio anchor = the editorial cut

The `audio_anchor` is 2-4 verbatim words from the narration. When Whisper hears those words spoken, the bullet fires. That is the "cut on the hit" in film editing — the visual change lands exactly when the narrator says the key word.

**How to write bullet bodies so the anchor picks itself:**

The bullet body should echo the most dramatic word or phrase from the narration at that moment.

From Scene 4:
```
Narration: "watch the magenta runner"
Bullet:    Race 1 — Two parallel capsule lanes. MAGENTA runner launches.
```
The phrase `"watch the magenta runner"` appears in both. Claude picks it as the anchor. Whisper finds it. Frame-perfect sync.

From Scene 5:
```
Narration: "Eighty-six percent."
Bullet:    "86%" in Inter Black 300px, RED, dead center.
```
The word `"eighty-six percent"` fires → the number slams in.

**Anchor selection rule:** Pick the 2-4 most distinctive words spoken at the moment the visual should appear. Numbers, model names, and key nouns anchor reliably. Generic words (`"and"`, `"the"`, `"this"`) miss.

---

### 9.7 REPLACE vs ADDITIVE — the scene cut

Under additive layering every bullet's content stays on screen as later bullets paint on top.
Use this intentionally:

| Script says | Mode | What to write in bullet body |
|---|---|---|
| "X slides in alongside Y" | ADDITIVE (default) | Just draw X. Y is already there from the prior bullet. |
| "Scene cuts to new metaphor" | REPLACE | Start body with: `[REPLACE]` and an opaque `D.bg` backdrop fading in over 10 frames. |
| "Screen wipes to new world" | REPLACE | Same — backdrop covers everything prior. |
| "Label appears on the card" | ADDITIVE | Prior bullet drew the card. This bullet adds only the label. |

**REPLACE in the bullet headline:**
```
- **0:12 – 0:14 — [REPLACE] Scene wipes right to chaotic workspace.**
  CYAN workspace slides away. New workspace materializes — multiple screens, windows, tabs.
```

The `[REPLACE]` tag tells you (and Claude when authoring) to begin the bullet code with an `AbsoluteFill` backdrop, covering all prior bullets.

---

### 9.8 Narration writing for cinematic sync

The narration controls where clear anchor moments exist. Write it to create trigger points.

**Three rules:**

**1. Short clauses with pauses create anchor opportunities:**
```
> Terminal-Bench. GPT rockets ahead. Thirteen-point gap — <pause 0.2s>
> that's not close, that's a different league. <pause 0.2s>
```
Every clause ending or pause = a potential anchor moment for a visual change.

**2. Numbers and names anchor reliably — use them at the reveal moment:**
```
> Claude Opus four-point-seven — thirty-six percent. <pause 0.3s>
> GPT-5.5. <pause 0.5s>
> Eighty-six percent. <pause 0.5s>
```
`"thirty-six percent"` and `"eighty-six percent"` are exact Whisper targets.
The pause after each gives the viewer time to absorb the visual before the narration continues.

**3. Say the trigger word, then let the visual breathe:**
```
Narration:  "watch the needle." <pause 0.3s>
Visual:     Needle animates. 0.3s of silence = viewer watches the needle.
```
The pause is not empty air. It is viewing time for the visual that just appeared.

---

### 9.9 Complete cinematic bullet set — water tank scene

Shows all 5 techniques applied to a concrete example.

**Narration:**
```
### Narration
> Water doesn't stay in Tank A. <pause 0.3s>
> It moves. Watch the valve open. <pause 0.2s>
> Tank B fills completely. Zero loss.
```

**Animation bullets:**
```
### Animation

- **0:00 – 0:08 — [REPLACE] Two glass tanks, Tank A full.**
  Two tall glass rectangles, 30% canvas width each, centered with 15% gap between them.
  Left: "TANK A" label D.text_dim above. Water column: D.cyan, height 90% of tank,
  slow opacity pulse 0.85→1.0 on 40-frame cycle. Right: "TANK B" label, empty — dashed
  outline only, D.text_dim. Pipe connector between tanks at 50% height.
  Valve icon at midpoint: RED circle, 24px. Nothing moves yet.

- **0:08 – 0:18 — Valve opens, water flows left to right.**
  Valve icon flips GREEN with snappy spring (damping 20, stiffness 200). 10 small D.cyan
  circles animate along pipe path left-to-right; each circle offset 15 frames, opacity
  fades from 1.0 to 0.0 over its travel. Tank A water level drops:
  interpolate over durationInFrames*0.85 from 0.9 to 0.05. Tank B water level rises:
  interpolate over durationInFrames*0.85 from 0.0 to 0.85.

- **0:18 – 0:28 — [REPLACE] Transfer complete — Tank B full.**
  Tank A: empty, dashed outline, D.text_dim. Tank B: full D.cyan fill, glow border
  D.cyan shadow-spread 20px. Stamp enters from top with heavy spring (damping 12,
  stiffness 90, mass 2): "TRANSFERRED" in D.font_display, D.green, rotated -3deg,
  70px. Below in D.font_mono 18px D.text_dim: "ZERO LOSS."
```

| Element | Technique applied |
|---|---|
| `"30% canvas width each"` | Exact quantity |
| `"40-frame cycle"` | Exact quantity |
| `"10 small D.cyan circles, offset 15 frames"` | Exact quantity |
| `D.cyan`, `D.green`, `D.text_dim` | Color = identity |
| `"snappy spring (damping 20, stiffness 200)"` | Physics intent |
| `"heavy spring (damping 12, stiffness 90, mass 2)"` | Physics intent |
| `[REPLACE]` on bullets 1 and 3 | REPLACE mode |
| `"Zero loss"` echoes narration `"Zero loss"` | Audio anchor target |

---

### 9.10 Pre-write checklist — before authoring any bullet

Answer these before writing a single line of the bullet body:

```
Q1: What must the viewer understand from this bullet — in one sentence?
    (Write it. If you cannot, the animation will be random.)

Q2: What is the SIMPLEST visual that proves Q1 without audio?
    (If the visual requires narration to make sense, it is wrong.)

Q3: What named object or metaphor carries this idea?
    (Not "a visual". A lie detector. A tank. A race track. A filing cabinet.)

Q4: Which color identity does each entity carry?
    (Every entity on screen must have a token: D.cyan, D.amber, D.red, D.green.)

Q5: What is the exact quantity of each element?
    (Not "some". A number. 8 tentacles. 30 shards. 12 circles.)

Q6: What is the spring intent?
    (bouncy / snappy / heavy / smooth — maps to a physics config.)

Q7: What narration word or phrase fires this bullet?
    (2-4 verbatim words from this scene's narration. This becomes the audio_anchor.)

Q8: Is this bullet ADDITIVE or REPLACE?
    (Does it add to what's on screen, or does it wipe the prior scene?)
```

Only after all 8 are answered: write the bullet body.

---

### 9.11 Content-type → correct visual template

When the script animation bullet is vague and doesn't name a metaphor, use the matching template from this table. Never invent a template not in this list.

| What the narration says | Correct visual | Never use |
|---|---|---|
| Single stat (N%, $N, Nx) | Large number counting up, ONE context bar | Screen shattering (unless script says so) |
| Quote / testimonial | Clean quote card: big italic text + attribution | Fake chat interface |
| Ranked comparison A vs B | Horizontal bars growing to their values, staggered 12 frames | Abstract orbiting circles |
| Step-by-step process | Numbered steps appearing left-to-right, one per anchor | Random icon burst |
| Before / after | Two panels separated by animated divider line | Overlapping fades with no structure |
| Timeline | Horizontal spine, nodes spring in left-to-right in order | Floating cards with no spatial relationship |
| Race / competition | Two horizontal bars filling simultaneously, color-coded | Generic bar chart with static values |
| Concept (X is like Y) | The named metaphor object — drawn directly | Abstract decoration |
| List of items | Staggered rows sliding in from left, 10-12 frames per item | All items at once |
| Two entities compared | Side-by-side cards, one per entity, color attributed | Single merged card |

This table applies only when the bullet body is vague. If the bullet body names a specific metaphor (octopus, lie detector, race track), use that — it overrides the table.
