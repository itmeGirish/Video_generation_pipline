---
name: vg-source-script-format
description: "The exact format for video source scripts — the JSON render contract (.json, canonical machine handover; schema docs/render-contract.schema.json) and the .txt authoring formats. Use whenever checking script format, understanding what source_parser.py expects, diagnosing a parse error, or any request like "what format does the script need," "how to write the source file," "parser format," or "structured script format.""
model: opus
---

# Source Script Format

## ⭐ JSON RENDER CONTRACT — the canonical MACHINE handover (preferred for pipeline-generated scripts)

The script pipeline hands over `projects/structured_scripts/<name>.json` — the **render contract**
(schema: `docs/render-contract.schema.json`). `source_parser.py` branches on the `.json` extension and
maps it 1:1 onto the same `SourceScript/Scene/AnimationBullet` dataclasses, so everything downstream
(TTS · Whisper anchors · frames · codegen · master · verify) is format-agnostic. Run:
`python storyboard/build_video.py projects/structured_scripts/<name>.json`.

Why JSON: the contract carries what the `.txt` flattened into ignored comments — per-sentence
`role/duration_ms/pause_after_ms/emphasis_word`, `visual_intent`, structured briefs — and the design is
**"parse for the machine, JSON-direct for the LLM"**: the mechanical spine consumes the parsed dataclasses
(exact values, deterministic), while the codegen prompt receives each bullet's RAW JSON object verbatim
(`AnimationBullet.raw` → the RENDER CONTRACT block in `visual_designer._make_bullet_prompt`). Guarantees
enforced at parse (HARD): every bullet carries its own narration sentences; `audio_anchor` must be verbatim
in its OWN bullet's narration (raises on drift); `pause_after_ms ≥ 400` emits the same `<pause Xs>` tag the
TTS pipeline already handles. The JSON's `script_ready` field carries the literal `SCRIPT-READY:` line, so
`render_gate.sh` greps it unchanged. The `.txt` formats below remain fully supported for human-written /
conversion-path scripts.

**SCENE-DRIVEN fields (schema `stage:` per scene):** a scene may carry `stage: {composite, process[]}` —
the persistent world (the settled final-frame composite with reserved zones) + the mechanisms that run the
scene's whole span. Render-side this becomes the scene's seeded STAGE block (`role:'stage'`, scene-local
frames — cycles never reset at beat boundaries), authored ONCE per scene and seeded via the bundle entry
`{"scene": N, "stage": true, "code": …}`; bullets then author ONLY their modulation/delta. Scenes without
`stage` follow the legacy self-contained-bullet contract (`vg-visual-designer` §SCENE-DRIVEN).

There is ONE flow — raw input → canonical structured output → pipeline reads from canonical:

```
projects/scripts/
  <name>.txt                 ← RAW input (any format, human-written) — edit this
projects/structured_scripts/
  <name>.txt                 ← CANONICAL format (parser-ready, single source of truth)
projects/<name>/
  config.yaml                ← per-project design/voice config (rule 00 §2)
  audio/                     ← auto-generated TTS
  out/                       ← auto-generated final mp4
```

Run: `python storyboard/build_video.py projects/scripts/<name>.txt`

The pipeline auto-converts (or rule 18 hand-converts) `projects/scripts/<name>.txt` →
`projects/structured_scripts/<name>.txt`, then every downstream step (`source_parser.py`,
`config.yaml` derivation per rule 00 §2, `visual_designer.py`, validators) reads from
the structured folder.

| Folder | What lives there | Edit by hand? |
|--------|-----------------|---------------|
| `projects/scripts/` | RAW human-written scripts (any format) | ✓ yes |
| `projects/structured_scripts/` | Canonical format (single source of truth for downstream steps) | ✗ no — gets overwritten or hand-converted via rule 18 |
| `projects/<name>/` | per-project `config.yaml` + audio/ + out/ | only `config.yaml` (per rule 00 §2); rest auto-generated |

**Legacy:** an older layout used `projects/<name>/source.txt` as the canonical input.
That path is being phased out. New work writes to `projects/structured_scripts/<name>.txt`.
Never write conversion output to `projects/<name>/source.txt`.

## Getting a raw script INTO this format → owned by `vg-script-conversion`

This skill owns the **FORMAT** (what canonical looks like, above + below). The **conversion** of any raw
`projects/scripts/*.txt` into it is owned by **`vg-script-conversion`** (regex MODE A · movie-script MODE B) —
don't duplicate the converter mechanics here. The one fact this skill asserts: the converter is **regex-only,
deterministic, no LLM subprocess** (the old LLM fallback was removed); if regex can't recover the `## SCENE`
headers it RAISES → hand-convert per `vg-script-conversion`. Run it standalone:
```bash
python storyboard/script_converter.py projects/scripts/<name>.txt --out projects/structured_scripts/<name>.txt

# Same as default but explicit (no behavioural difference now)
python storyboard/script_converter.py projects/scripts/<name>.txt --regex-only --out projects/structured_scripts/<name>.txt

# Overwrite the input in place (DANGEROUS — only when intentionally normalizing the raw)
python storyboard/script_converter.py projects/scripts/<name>.txt --in-place
```

What the converter normalizes:
- Strips everything before the first `## SCENE N` (preamble metadata)
- Strips `**Engagement move:**` lines between header and Narration
- Normalizes em-dashes in scene headers: `## SCENE N — "Title" (M:SS – M:SS)`
- Normalizes animation bullet headers: `- **M:SS – M:SS — Title.** Body`
- Removes HTML entities (`&nbsp;`, etc.) and bullet-point unicode (`•`)
- Collapses 3+ blank lines into 1

What the converter does NOT do:
- Does not invent missing `### Narration` or `### Animation` blocks
- Does not change content (only formatting)
- Does not fix bad time windows (e.g. "10:00" when scene is 1 minute long)

If the converter produces something the parser still rejects, the source script
has a structural problem — read the parser error and fix the source.

The pipeline reads the converted script directly — no further rewrite, no `script.md`.

## Top-level structure

```
# Video Title

## SCENE 1 — "Scene Title" (0:00 – 1:00)
...

## SCENE 2 — "Scene Title" (1:00 – 2:15)
...
```

## Scene header (REQUIRED, exact format)

```
## SCENE N — "Title" (M:SS – M:SS)
```

- `N` = scene number (integer)
- `Title` = short scene title in double quotes
- Time window in `M:SS – M:SS` format using en-dash `–` or hyphen `-`
- Example: `## SCENE 3 — "The Harness" (2:00 – 3:30)`

## Narration block (REQUIRED)

```
### Narration
> This is the narration text spoken by the voice.
> It can span multiple lines — each line starting with `>`.
> Long sentences should breathe. Use em-dashes — like this — for pauses.
```

Rules:
- Only raw narration text — no stage directions, no "(pause)" markers
- Numbers written as words: "one million" not "1,000,000" (helps TTS pronunciation)
- Hero words that should be emphasized: write them in CAPS in the source
- Em-dashes `—` trigger natural pauses in SSML compilation

## Animation block (REQUIRED)

```
### Animation
- **<M:SS> – <M:SS> — <≤8-word headline>.** <Body description with concrete details from THIS project's script.>
  <Optional sub-bullet detail.>
- **<M:SS> – <M:SS> — <next headline>.** <body>
- **<M:SS> – <M:SS> — <next headline>.** <body>
```

(Replace every `<...>` with concrete content from the project's script. Never carry
example values from this rule into a project — every bullet body must come from
the project's own structured script (rule 04 forbids cross-project value bleed).)

Rules:
- Each bullet = one visual block, one time window
- Time is RELATIVE to scene start (not absolute video time)
- Format: `- **M:SS – M:SS — Headline.** Body text`
- Headline = what animation type + what content (be specific)
- Body = concrete values: quoted strings, item lists, numbers
- Count of bullets = count of visual blocks rendered (FIDELITY GATE — must match exactly)

## Pair-block format (recommended for new scripts)

The legacy format keeps `### Narration` and `### Animation` in separate sections.
This works, but creates a dual source of truth: a bullet's `audio_anchor` and the
narration sentence it refers to live in different blocks. Authors can easily
pick an anchor whose narration position falls inside ANOTHER bullet's time
window — a silent sync bug that fires the visual at the wrong moment.

**Pair-block format** couples them per bullet. Each bullet's `> narration` lines
sit directly above its description; the anchor MUST be a verbatim phrase from
those lines. `source_parser.py` auto-detects pair-block (a scene with no
`### Animation` header) and reassembles scene narration by concatenating each
bullet's narration in order. Downstream TTS/Whisper/anchor pipeline runs
identically — the change is authoring-only.

```
## SCENE 1 — "Scene Title" (0:00 – 1:00)

- **0:00 – 0:12 — Headline for visual A.**
  > Narration sentence(s) spoken while this visual is on screen. <pause 0.4s>
  > A second sentence too.
  Animation description: concrete elements, positions, colors via design tokens.
  audio_anchor: a verbatim phrase from the narration above

- **0:12 – 0:30 — Headline for visual B.**
  > Next narration sentence(s).
  Animation description...
  audio_anchor: another phrase from THIS bullet's narration
```

Rules specific to pair-block:
- A scene contains ONLY bullets — no `### Narration`, no `### Animation` headers
- Each bullet MUST have at least one `> ` narration line (lint will warn otherwise)
- The bullet's `audio_anchor` MUST appear verbatim in its OWN `> narration` lines
- Anchors must appear in narration order matching bullet order (the parser does
  not enforce this, but pair-block makes the violation obvious by inspection)
- The first bullet of a scene owns any pre-anchor setup narration (scene-opening
  sentences before the first anchor word) — these go in its `> narration` lines
- Pauses, em-dashes, and prosody work the same as legacy narration

Both formats can coexist in the same project. The parser auto-detects per scene.
Legacy scripts (`ai_thinking_levels.txt`, `qwen_37_max_vs_opus.txt`) keep
working; new scripts (`layoffs_2026.txt`) use pair-block.

### The bullet body should carry the production-factor spec

Only `audio_anchor` / `anchor_mode` are PARSED from a bullet; the rest of the body is the
free-form brief the code author reads. A good bullet names every production factor so the
render code isn't guessed — written by `scene-composer` as labeled lines:
`location:` + `visible:` (on the scene's FIRST bullet — the WHERE and the named on-screen objects
that establish the setting, so the render author orients the viewer; see `scene-composer`
§scene-setting) · `what happens:` (a plain **numbered beat sequence** of what the viewer sees — *the
animation described as story*; this is the core) · `text:` (on-screen labels) · `image:` (`[asset:]`/`none`) ·
`transition:` (`[REPLACE]`/ADD in the headline) · `audio_anchor` + `anchor_mode` · optional `hint:`
(one word if a specific build matters). The body is the **director layer (what + when)** — NOT
springs/easing/arcs/principle-names; the render (`vg-code-*` / `Kit`) supplies the motion physics. These map 1:1 to
the `vg-code-*` author recipes (via `vg-render-code`). A bullet missing factors → the author
guesses → flat/inconsistent output. The parser ignores the extra labeled lines, so they cost
nothing mechanically and everything in brief quality.

## Scene-blueprint template format (the standard authoring template)

The current standard template wraps the **legacy**
`### Narration` / `### Animation` blocks inside a rich, human-readable **scene blueprint** —
the spatial/cinematic design of each scene. It parses on the LEGACY path (it has
`### Narration` + `### Animation`, so `source_parser.py` does NOT treat it as pair-block).
Everything outside those two sections is design metadata the parser ignores.

### Layout of one scene

```
## SCENE N — "Title" (M:SS – M:SS)

──────────────  LEARNING GOAL  ──────────────
<the one thing the viewer should learn>
──────────────  LOCATION  ──────────────
<where we are — the real surface>
... (REALITY ANCHOR · VISUAL METAPHOR · ENVIRONMENT · OBJECTS · PRIMARY FOCUS ·
     ENTRY TRANSITION · INITIAL STATE · FINAL STATE · ATTENTION FLOW — each with a divider)

### Animation

──────────────  BEAT 1  ──────────────
- **M:SS – M:SS — Headline.**
  Purpose: <why this beat exists>
  Visual Action: <the motion event — the setup>
  State Change: <what is different on screen after the beat>
  Text: <≤3 words OR one number, or none>
  audio_anchor: <verbatim phrase from the scene narration>
  anchor_mode: appear | through | land
──────────────  BEAT 1 → BEAT 2 TRANSITION  ──────────────
<how attention moves>
──────────────  BEAT 2  ──────────────
- **M:SS – M:SS — Headline.**
  ...

### Narration
> the scene voice-over, one or more `>` lines, with <pause Xs> tags

──────────────  EXIT TRANSITION  ──────────────
<how the scene leaves>
──────────────  NEXT SCENE HOOK  ──────────────
<the visual element that connects to the next scene>
──────────────  ON-SCREEN TEXT  ──────────────
<max 3 words OR 1 number per beat>
```

### How the parser reads it (exact behavior — verified)

| File region | What `source_parser.py` does |
|---|---|
| Blueprint header fields (LEARNING GOAL … ATTENTION FLOW), between `## SCENE` and `### Animation` | **Ignored.** Not a `### section`, no `>`, no `- **M:SS` bullet — invisible to the parser. |
| `### Animation` | `_extract_animation` finds each `- **M:SS – M:SS — Headline**` bullet. **This count is the FIDELITY GATE** (= rendered blocks). |
| BEAT dividers + "BEAT n → n+1 TRANSITION" text between bullets | **Absorbed into the previous bullet's body** (a bullet's body runs to the next `- **`). Harmless free-form text. |
| `Purpose:` / `Visual Action:` / `State Change:` / `Text:` lines | Part of the bullet **body** (the free-form brief). Only `audio_anchor` / `anchor_mode` are extracted downstream. |
| `### Narration` | `_extract_narration` reads the `>` lines = the scene voice-over (assembled, in order). |
| EXIT TRANSITION / NEXT SCENE HOOK / ON-SCREEN TEXT (after `### Narration`, no `>`) | Inside the Narration section but **not `>` lines → ignored** by narration extraction. |

So: **only `### Animation` bullets and `### Narration` `>` lines drive the pipeline.** All
dividers and blueprint fields are design scaffolding — they cost nothing mechanically and
everything in brief quality.

### CURRENT convention — PAIR-BLOCK with comment-blueprint blocks (preferred)

New scripts carry the blueprint in **HTML comment blocks** and use **pair-block** beats (narration
coupled into each bullet, no `### Narration` / `### Animation` headers). A scene looks like:

```
<!-- GLOBAL VISUAL STYLE (ONCE at the top of the file — the art direction every scene inherits)
     LOOK · RENDER STYLE · TEXTURE · SHAPE LANGUAGE · TYPE · PALETTE (token hex) · LIGHTING -->
<!-- REFERENCE ASSETS    (ONCE at the top — real screenshots to place in public/img/ for real-UI scenes) -->
...
## SCENE N — "Title" (M:SS – M:SS)
<!-- SCENE DESCRIPTION   (prose director's brief — the LARGEST block, the SOURCE of the animation)
     Environment: …  Situation: …  Viewer Realization: …  Emotional Journey: X → Y → Z
     Visual Transformation: …  Final Image: … -->
<!-- SCENE DESIGN        (the structured field block, derived from the description)
     SCENE PURPOSE · PACE · LEARNING GOAL · LOCATION · REALITY ANCHOR · REFERENCE · CINEMATIC ·
     LAYOUT (spatial map) · SHOT/FRAMING · VISUAL METAPHOR · ENVIRONMENT (spatial) · OBJECTS ·
     PRIMARY FOCUS (ranked) · ENTRY/INITIAL · ATTENTION FLOW · FINAL/EXIT · NEXT HOOK -->
- **M:SS – M:SS — [REPLACE] Headline.**
  > narration for THIS beat <pause Xs>
  what happens: 1. … 2. … 3. …
  text: <labels / a number>
  image: none | [asset: img/<name>.png]
  audio_anchor: <verbatim from THIS beat's `>` line>
  anchor_mode: appear | through | land
- … more beats …
```

**Parser behavior (verified — exit 0):** the `<!-- … -->` blocks are HTML comments, so
`source_parser.py` IGNORES them entirely (zero mechanical effect). With no `### Animation` /
`### Narration` headers, the parser auto-detects **pair-block** and assembles the narration from each
bullet's `>` lines in order. Therefore **both blueprint blocks are valid, free design scaffolding that
parses cleanly** — and the new fields (SCENE DESCRIPTION, SCENE PURPOSE, PACE, REFERENCE, CINEMATIC,
spatial ENVIRONMENT) are all inside comments, so they NEVER break the parse. They exist to drive the
per-bullet code author (`vg-visual-designer` step 0). Full field spec: **`scene-composer`**
(§"GLOBAL VISUAL STYLE" · §"SCENE DESCRIPTION" · §"SCENE DESIGN field block"); the scene LIST/arc lives
in `scene-planner`. Anchor rule for pair-block: each `audio_anchor` is a
verbatim phrase from its OWN bullet's `>` line (drift-proof by construction).

### Anchor rule on this format (IMPORTANT — it's scene-scoped, not beat-scoped)

Because narration is one scene-level block (legacy path), an `audio_anchor` must be a
verbatim phrase **somewhere in the scene's `### Narration`** — not necessarily near its own
BEAT. Pair-block's per-beat drift-proofing is traded away for the template, so:
- Keep each anchor a **unique** phrase within the scene (so it can't match the wrong beat's moment).
- Keep anchors in the **same order** as the beats (narration is spoken top-to-bottom).
- Avoid digit/decimal anchors Whisper mis-transcribes (see rule 23 / SHIFT-LEFT #2).

### How the bullet-code author USES the blueprint

When authoring a beat's `React.createElement` code, read the scene blueprint first — it is
the design contract:
- **REALITY ANCHOR** → make the frame look like the real software (the actual Claude Code
  terminal / VS Code), not abstract shapes.
- **VISUAL METAPHOR / OBJECTS** → reuse the persistent objects (battery, paper stack, scan
  beam, CLAUDE orb) — do not invent a new object per scene.
- **BEAT Visual Action + State Change** → exactly what to animate and the end state.
- **BEAT Text / ON-SCREEN TEXT** → ≤3 words or one number; never put the narration on screen.
- **ATTENTION FLOW / PRIMARY FOCUS** → the eye path; keep the frame from clogging.

Authoring the blueprint itself is `scene-planner` §"Per-scene BLUEPRINT"; the beat
fields map 1:1 from `scene-composer`.

## Optional blocks

```
### Pacing
rate=-5% emphasis=heavy
```

```
### Sound design
- Ambient: <one-line ambient description>
- On "<HERO_WORD>" reveal: <one-line impact cue>
```

## Complete example (placeholder shape — never copy literal values into a project)

```
# <Video Title>

## SCENE 1 — "<Scene Title>" (M:SS – M:SS)

### Narration
> <Narration prose for THIS project, paragraph one.>
> <Narration prose paragraph two.>

### Animation
- **<M:SS> – <M:SS> — <≤8-word headline>.** <Body with concrete content from THIS project.>
- **<M:SS> – <M:SS> — <next headline>.** <body>
- **<M:SS> – <M:SS> — <next headline>.** <body>

### Pacing
rate=<from §9 of rule 18 mapping> emphasis=<heavy|moderate|strong|reduced>
```

(Every `<...>` is filled from the project's actual structured script. Do NOT copy
values from this rule — cross-project bleed is the most common cause of "wrong"
videos.)

## Common mistakes to avoid

- DO NOT write `script.md` or `projects/<name>/source.txt` — the only canonical input is `projects/structured_scripts/<name>.txt`
- DO NOT use absolute timestamps in animation bullets (use scene-relative time)
- LEGACY format: DO NOT skip `### Narration` or `### Animation` — both required
- PAIR-BLOCK format: DO NOT mix in `### Narration` / `### Animation` headers — a scene is one or the other. DO NOT skip the `> narration` line in any bullet
- DO NOT write animation bullets without concrete content values — the LLM needs specifics
- DO NOT put more than ~8 animation bullets per scene — each bullet is one visual block
- DO NOT pick an `audio_anchor` whose verbatim phrase falls in another bullet's narration window — the visual will fire at the wrong time. Pair-block format makes this impossible by construction.
- BLUEPRINT TEMPLATE format: it parses on the LEGACY path (`### Animation` + `### Narration` present). The divider/header fields and BEAT-transition blocks are ignored — only `### Animation` bullets and `### Narration` `>` lines drive the pipeline. DO NOT delete `### Animation` / `### Narration` thinking the blueprint replaces them. Anchors are scene-scoped here — keep each one unique and in beat order.
