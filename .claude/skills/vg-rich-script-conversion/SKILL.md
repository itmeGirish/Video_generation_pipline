---
name: vg-rich-script-conversion
description: "MANDATORY first step when a raw script arrives in movie-script format (frame timing, VO headers, sub-scenes, design-token preambles, bespoke metaphors). 9-step conversion checklist. Use whenever a rich or movie-script format script is given, or any request like "rich script," "movie script format," "frame timing," "hand convert," or "mandatory conversion.""
---

# Rich Script Conversion (the "movie script" format)

## The MANDATORY flow (no exceptions)

```
projects/scripts/<name>.txt          ← RAW (what user hands you, any format, hand-written)
            │
            ▼  [THIS RULE — apply 9-step checklist]
            │
projects/structured_scripts/<name>.txt   ← CANONICAL (parser-ready)
            │
            ▼  build_video.py reads from here
            ▼
projects/<name>/out/<output>.mp4
```

**ALWAYS** write the converted output to `projects/structured_scripts/<name>.txt` — never directly to
the legacy `projects/<name>/source.txt` path and never edit the raw `projects/scripts/<name>.txt` in place. The
`structured_scripts/` folder is the single canonical store; the raw folder is the user's authoring
space and the project folder is for outputs only.

## When to use this rule

Use this rule the **first** time a script in `projects/scripts/<name>.txt` is given to you,
ESPECIALLY when the script:
- Has a long preamble with **DESIGN TOKENS**, **GLOBAL VISUAL SYSTEM**, **SCENE INVENTORY** sections
- Uses **frame-based timing** (`Frame 0–60` at 30fps) instead of `M:SS – M:SS`
- Uses **`### VO:` / `### ANIMATION:` (uppercase, with colon)** instead of `### Narration` / `### Animation`
- Puts the time window on a **separate `**Frames:**` line** rather than inside the scene header
- Describes **bespoke visual metaphors** (glass shatter, octopus tentacles, vault doors, lie-detector needles, comic panels, Tron tracks, departure boards, etc.) where the bullet body needs to carry the full metaphor verbatim so the LLM can author it
- Has **sub-scenes** like "Sub-scene 3A — The Architect (Frame 660–1020)" / "Sub-scene 3B — The Octopus"

`script_converter.py` does NOT handle these variants today (see rule 14 — only handles minor format
drift). For rich scripts you must convert manually OR extend the converter. EITHER WAY, the canonical
output goes to `projects/structured_scripts/<name>.txt`.

## Conversion checklist (raw → canonical)

### 1. Triage preamble + trailer blocks — preserve everything in the structured file

The structured file is the **single source of truth** for ALL downstream steps (parser, config.yaml
derivation, visual_designer LLM, validators, human reviewers). It must contain everything any
downstream step might need. **Nothing silently deleted, nothing only-in-raw.**

`source_parser.py` ignores HTML-style `<!-- ... -->` comments, so we KEEP the original blocks
as comments at the top of the structured file. config.yaml derivation (rule 00 §2) reads those
comment blocks; the parser skips them.

| Block | Action | Where it ends up |
|---|---|---|
| Top header (Design System name, Target Runtime, Total Frames, Scenes count) | KEEP as `<!-- ... -->` block at top of structured file | structured file |
| `## DESIGN TOKENS` (color hex, fonts) | KEEP as `<!-- ## DESIGN TOKENS ... -->` block at top of structured file | structured file (read by Step 2 to populate `config.yaml`) |
| `## GLOBAL VISUAL SYSTEM` (background field, blueprint grid, scene transitions, reusable components) | KEEP as `<!-- ## GLOBAL VISUAL SYSTEM ... -->` block at top of structured file. Also mirror to side file `globals.md` for human reference | structured file + `projects/<name>/globals.md` |
| `## SCENE INVENTORY` (table of scenes + difficulty) | strip — already enumerated by the scene bodies below | n/a |
| `## THUMBNAIL OPTIONS` | EXTRACT → side file (NOT pipeline input but author needs them later) | `projects/<name>/thumbnail.md` |
| `## TITLE OPTIONS` | KEEP as `<!-- ## TITLE OPTIONS ... -->` block at top of structured file (Step 2 reads first item for `config.yaml` `output:`); also mirror to side file `titles.md` for author reference | structured file + `projects/<name>/titles.md` |
| `## SOURCES` | EXTRACT → side file for citation reference | `projects/<name>/sources.md` |
| `## COMBINED VOICEOVER SCRIPT` | strip — the per-scene `### Narration` blocks are the source of truth | n/a |

The canonical file then looks like:
```
# <Title from H1>

<!--
Design System: <copied verbatim from raw script header>
Target Runtime: <copied verbatim>
Total Frames @ <fps>fps: <copied verbatim>
Scenes: <count, derived from raw>
-->

<!--
## DESIGN TOKENS
BASE:         <hex>
SURFACE:      <hex>
... every line copied verbatim from the raw script's ## DESIGN TOKENS block
-->

<!--
## GLOBAL VISUAL SYSTEM
... every bullet copied verbatim from the raw script's ## GLOBAL VISUAL SYSTEM block
-->

<!--
## TITLE OPTIONS
1. <first title> ← Step 2 uses this as config.yaml `output:` (filename-safe form)
2. <second title>
... every option copied verbatim from raw
-->

## SCENE 1 — "<Title>" (M:SS – M:SS)
...
```

The `<!-- … -->` blocks are preserved through `source_parser.py` (which skips comments) and are
the inputs Step 2 reads to populate `config.yaml`. **Do NOT discard them. Do NOT hardcode example
values from one script into another script's canonical file** — every value here is copied from
THAT script's raw input.

### 2. Rewrite the scene header — preserve Pacing AND Visual Metaphor

Raw shape (any script):
```
## SCENE N — <UPPERCASE TITLE>
**Frames:** <start>–<end> (<M:SS>–<M:SS>)
**Pacing:** <one-line tone direction>
**Visual Metaphor:** <one-line metaphor description>
```

Canonical shape:
```
## SCENE N — "<Title-Case Title>" (<M:SS> – <M:SS>)

<!-- Visual Metaphor: <copied verbatim from raw> -->
<!-- Frames: <start>–<end> -->
```

Rules:
- Quote the title in `"…"` and convert to Title Case (or whatever the raw uses)
- Pull the `(M:SS – M:SS)` window from the `**Frames:**` line (frames ÷ fps → M:SS), or from the `(M:SS–M:SS)` parenthetical
- **`**Pacing:**`** → encode as `### Pacing` block (see §9 below) — never silently dropped
- **`**Visual Metaphor:**`** → preserve as `<!-- Visual Metaphor: ... -->` comment line, copied VERBATIM from the raw. The visual_designer LLM reads scene context including comments and uses this as the dominant intent for primitive selection
- **Original frame range** → preserve as `<!-- Frames: <raw range> -->` comment so the developer can reverse-derive the absolute frame number for any bullet without recomputing
- **Do NOT hardcode example values** (titles, metaphors, frame ranges) from one script into another

### 3. Convert section headers

| Raw | Canonical |
|---|---|
| `### VO:` | `### Narration` |
| `### Voice:` | `### Narration` |
| `### Voiceover` | `### Narration` |
| `### ANIMATION:` | `### Animation` |
| `### Visuals:` | `### Animation` |
| `### Animation:` | `### Animation` |

### 4. Add `>` line prefix to narration prose — KEEP `<pause>` markers

Raw narration is plain prose with stage directions inline:
```
"<sentence one> <pause 0.3s>

<sentence two> <pause 0.5s>"
```

Canonical narration uses `>` prefix on every line AND **preserves `<pause Xs>` and `<break>` markers verbatim**:
```
> <sentence one> <pause 0.3s>
>
> <sentence two> <pause 0.5s>
```

Why: TTS engines that respect SSML (ElevenLabs, Azure) read these markers as breath/pause directives.
The `ssml_compiler.py` step in the pipeline converts `<pause Xs>` → `<break time="Xs"/>` automatically.
**Stripping pauses produces flat, rushed narration.** Never strip them.

Other stage directions (`(beat)`, `(slow)`, ALL-CAPS direction tags like `[WHISPER]`) — KEEP them
inline as `<!-- (beat) -->` or move them into a `### Pacing` block. Do NOT silently delete.

Quote characters: strip the outer `"…"` wrapper that the raw script uses around the whole VO block,
but keep quotation marks around in-narration quoted content (e.g. attributions).

### 5. Convert bullet timing AND keep frame numbers AND keep technical specs verbatim

Raw bullet:
```
- **Frame <abs_start>–<abs_end>:** <body with concrete cinematography>
```

Canonical bullet:
```
- **<M:SS> – <M:SS> — <≤8-word headline>.** <body, VERBATIM from raw, including (Frame <abs_start>–<abs_end>) appended>
```

Where:
- `<M:SS>` = `(<abs_frame> - <scene_start_frame>) / fps` — scene-relative
- `<scene_start_frame>` = the absolute frame where this scene began (from the scene's `**Frames:**` line)

Rules:
- ALL bullet times are **scene-relative** (start at 0:00, NOT absolute video time) — required by parser
- Format MUST be `**M:SS – M:SS — Headline.**` (en-dash between times, em-dash before headline, period after headline) — required by parser
- Headline = ≤8 words summarizing the visual intent
- Body = the original concrete description **preserved verbatim** — every animation parameter,
  easing curve, opacity value, glow radius, color hex, prop value the raw script gave you
- Append `(Frame <abs_start>–<abs_end>)` at the END of the body so the developer can reverse-derive
  the absolute frame number without recomputing
- **NEVER summarize or paraphrase technical Remotion specs.** These are exact developer instructions:
  - `interpolate(frame, [start, start+30], [0, 82.7], { easing: Easing.bezier(0.2, 0.8, 0.4, 1) })`
  - `spring({ damping: 8, stiffness: 180 })`
  - `box-shadow: 0 0 20px [color]`
  - `frame * 0.25` slow-mo math
  - `opacity 0→0.8→0 over 12 frames`
  - exact pixel sizes (`Inter Black 300px`, `12px circles`, `4px border`, `border-radius: 40px`)
  - exact stagger timings (`100ms stagger`, `400ms stagger`, `1.5s between rows`)
  
  Keep them character-for-character in the body. The per-bullet LLM (rule 04)
  reads these literally and emits matching `interpolate` / `spring` calls in the
  `code` field, so the more concrete the body, the more faithful the visual.

### 6. Expand sub-scenes into bullets

Raw:
```
**Sub-scene 3A — The Architect (Frame 660–1020):**
- **Frame 660–720:** A flat 2D workspace appears...
- **Frame 720–810:** A CYAN figure picks up the cube...
  1. (720–750) Examines the cube
  2. (750–780) Opens it
  3. (780–810) Writes a fix
```

Canonical (sub-scene markers go AWAY; the bullets become flat with scene-relative times):
```
- **0:00 – 0:02 — Workspace appears.** A flat 2D workspace, abstracted code editor, glowing WHITE cube labeled "BUG FIX" drops in.
- **0:02 – 0:05 — Cyan craftsman examines.** A CYAN geometric humanoid examines the cube — magnifying glass appears, cube unfolds into a flat blueprint with code lines.
- **0:05 – 0:08 — Craftsman writes fix.** Pen tool draws new lines in GREEN.
```

Sub-scene 3B / 3C continue with the same flat numbering. The "Sub-scene" label is just author organization — the parser doesn't see it.

### 7. Preserve bespoke visuals as concrete bullet bodies

This pipeline has NO fixed primitive registry — the per-bullet LLM authors a
React.createElement function body for each bullet from the headline + body
(rule 04). That means a bespoke metaphor doesn't need to "map to" anything.
What matters is that the **bullet body carries enough specificity** that the
LLM can build it.

For each bullet, ask: if the LLM read only this body, would it know what to
draw? Concrete elements (counts, colors, positions, named items, animation
verbs) make the difference between a faithful render and a generic one.

Two patterns work well:

**A. Decompose the metaphor into describable parts (default)**

A "glass shatter into 86%" bullet body should name: the cracking element, the
direction shards fly, the count of shards, the background color, the final
text + size + color. The LLM uses each named part as a concrete React element
with its own `interpolate` / `spring`.

**B. Quote any explicit physics from the raw script verbatim**

If the raw script said `frame * 0.25 slow-mo math` or `box-shadow: 0 0 20px
[color]` or `100ms stagger`, copy those literally into the bullet body. The
LLM treats numeric specifics as ground truth and emits matching code.

**Don't** strip a metaphor down to a generic shape (e.g. dropping "shatter"
and writing "big number"). Without the metaphor in the body, the LLM has no
hint to author shatter physics — and the script's intent is lost.

**Don't** name a primitive type (`number_punch`, `bullet_list`, etc.) in the
headline or body — there is no registry to look it up against, and naming one
just confuses the LLM.

### 8. Density target (every long scene)

| Scene length | Target bullet count |
|---|---|
| 0–30 s | 3–5 bullets |
| 30–60 s | 5–8 bullets |
| 60–90 s | 7–10 bullets |
| 90–120 s | 9–12 bullets |
| 120–180 s | 12–16 bullets |

A scene with one primitive holding for 17 seconds will look static and read as "nothing happening." Split it into more beats.

### 9. Pacing block (optional)

If the raw script's `**Pacing:** Measured` (or similar) carries information, encode it as:
```
### Pacing
rate=-5% emphasis=heavy
```

Mapping:
- "Measured / Slow / Reflective" → `rate=-8% emphasis=moderate`
- "Quick / Momentum / Fast" → `rate=+3% emphasis=heavy`
- "Mystery / Building tension" → `rate=-5% emphasis=strong`

## End-to-end example (generic placeholders — substitute every `<...>` with the actual raw value)

**Raw input shape:**
```
## SCENE <N> — <UPPERCASE TITLE>
**Frames:** <abs_start>–<abs_end> (<M:SS>–<M:SS>)
**Pacing:** <one-line tone direction>
**Visual Metaphor:** <one-line metaphor>

### VO:
"<sentence one with stage directions like <pause 0.3s>>

<sentence two> <pause 0.5s>"

### ANIMATION:

- **Frame <a>–<b>:** <body with full cinematography: colors, easing, opacity values, exact pixel sizes, spring/interpolate parameters>
- **Frame <b>–<c>:** <body>
```

**Canonical output shape (every `<...>` is copied or computed from the raw):**
```
## SCENE <N> — "<Title-Case Title>" (<M:SS> – <M:SS>)

<!-- Visual Metaphor: <copied verbatim from raw> -->
<!-- Frames: <abs_start>–<abs_end> -->

### Narration
> <sentence one with stage directions like <pause 0.3s> KEPT inline>
>
> <sentence two> <pause 0.5s>

### Animation
- **<M:SS> – <M:SS> — <≤8-word headline>.** <body verbatim from raw, including all technical specs> (Frame <a>–<b>)
- **<M:SS> – <M:SS> — <headline>.** <body verbatim> (Frame <b>–<c>)

### Pacing
rate=<from §9 mapping table> emphasis=<from §9 mapping>
```

Notes the converter MUST follow:
- Spell out numerals that are spoken (`5.5` → `five point five`, `4.7` → `four point seven`, `2026` → `twenty twenty-six`) — TTS pronounces correctly and Whisper transcribes more reliably (rule 15). This applies ONLY to narration prose, NOT to bullet bodies (where exact numbers are visual content).
- Bullet headlines are short (≤8 words) + concrete; bodies preserve the original cinematography character-for-character.
- Sub-second timing (e.g., `0:02 – 0:03`) is fine; the parser accepts it; primitives display for at least MIN_BLOCK_FRAMES (30 frames = 1s) regardless of declared duration.
- DO NOT hardcode project-specific titles, metaphors, frame ranges, or content into a different project's canonical file.

## When to extend `script_converter.py` vs hand-convert

| Situation | Do |
|---|---|
| One-off rich script for a single video | Hand-convert per this rule and write to `projects/structured_scripts/<name>.txt` |
| The user expects to drop many similarly-formatted scripts into `projects/scripts/` | Extend `script_converter.py` with the missing transforms (separate `**Frames:**` line parsing, `### VO:` mapping, frame→time conversion) AND broaden the LLM-fallback gate so it also fires when the regex output doesn't actually parse. Output of the converter still goes to `projects/structured_scripts/<name>.txt`. |
| The script's bespoke visuals are core to the brand and will repeat across videos | Document the metaphor pattern in the project's structured-script preamble (DESIGN TOKENS / GLOBAL VISUAL SYSTEM comment block) so each script captures its own visual language without depending on a shared registry |

## Where to write the converted script

ALWAYS: `projects/structured_scripts/<name>.txt`

- DO NOT write to `projects/<name>/source.txt` (legacy Layout A — being phased out for raw scripts)
- DO NOT edit `projects/scripts/<name>.txt` in place (that is the user's raw authoring file)
- DO create `projects/structured_scripts/` if it does not exist (one-time `mkdir`)
- After writing, verify it parses: `python storyboard/source_parser.py projects/structured_scripts/<name>.txt`

The build pipeline is then invoked as:
```bash
python storyboard/build_video.py projects/scripts/<name>.txt
# build_video.py auto-routes to projects/structured_scripts/<name>.txt for parsing
# (if the structured file is fresher than the raw, no re-conversion happens)
```

If for some reason build_video.py is not yet wired to read from `structured_scripts/`, that is a
pipeline bug — fix the build script, do NOT change where conversion is stored.

## Anti-patterns (the things that lose information silently)

**Format compliance — required by `source_parser.py`:**
- DO NOT keep `**Frame X–Y:**` as the bullet HEADER — the parser rejects it. (You may keep `(Frame X–Y)` as a parenthetical at the END of the bullet body.)
- DO NOT keep `### VO:` or `### ANIMATION:` as section headers — only `### Narration` and `### Animation` are recognized.
- DO NOT collapse multiple narration paragraphs into one — use multiple `>` lines, one per paragraph.

**Information preservation — required by every other consumer (TTS, designer LLM, .tsx author, human reviewer):**
- DO NOT strip `<pause Xs>` or `<break time="...">` markers from narration. ElevenLabs/Azure TTS respect them; `ssml_compiler.py` converts them. Stripping = flat narration.
- DO NOT silently delete `**Pacing:**` lines. Encode them in a `### Pacing` block per §9.
- DO NOT silently delete `**Visual Metaphor:**` lines. Preserve as `<!-- Visual Metaphor: ... -->` comment under each scene header. The visual_designer LLM uses this as the dominant intent signal.
- DO NOT silently delete the script's top header (Design System, Target Runtime, Total Frames, Scenes count). Preserve as `<!-- ... -->` comment block at the top of the canonical file.
- DO NOT silently delete `## THUMBNAIL OPTIONS`, `## TITLE OPTIONS`, `## SOURCES`. Move to side files in `projects/<name>/` (thumbnail.md, titles.md, sources.md).
- DO NOT summarize or paraphrase technical Remotion specs in bullet bodies. Preserve `interpolate(...)`, `spring(...)`, `Easing.bezier(...)`, `box-shadow: 0 0 20px [color]`, `frame * 0.25`, exact pixel sizes, opacity values, and stagger timings character-for-character.
- DO NOT substitute a wildly different primitive for a bespoke ask without preserving the descriptive body — the LLM designer needs the description to pick the closest match and the validator's anchor logic depends on phrases from the body.
- DO NOT inflate bullet count by splitting a single visual moment into N tiny bullets just to hit density targets — each bullet must be a distinct beat with its own visual content.

**Generality — required by future scripts:**
- DO NOT hardcode example values from one script (titles, hex colors, frame ranges, metaphor names, project names) into another script's canonical file. Every value in the canonical file must come from THAT project's raw script.
- DO NOT copy a previously-converted canonical file as a "template" for a new script. Re-run the 9-step checklist against the new raw script from scratch.
