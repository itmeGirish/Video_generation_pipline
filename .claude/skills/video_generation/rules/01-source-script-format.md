---
name: source-script-format
description: The exact format for video source scripts (.txt files). This is the ONLY input to the pipeline — no script.md intermediate.
metadata:
  tags: script, format, source, narration, animation
---

# Source Script Format

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

## Auto-conversion of raw scripts

Scripts in `projects/scripts/` come in MANY shapes — different preambles,
different dash conventions, different bullet styles, sometimes totally
different headers. `build_video.py` runs `script_converter.py` automatically
when given a Layout B path. The converter is **two-stage**:

1. **Regex pass (fast, free):** strips preamble, normalizes em-dashes,
   fixes bullet headers. Handles ~80% of scripts.
2. **LLM pass (fallback):** if the regex output has no `## SCENE N` headers
   or lost scenes, calls Claude with strict instructions to convert ANY
   structure into the canonical format. Cached by hash — runs once per
   unique script.

```

```
projects/scripts/<name>.txt              (raw, with preamble + format quirks)
              │
              ▼  script_converter.py — strips preamble, normalizes em-dashes,
              │   fixes bullet headers, removes engagement-move lines
              ▼
projects/structured_scripts/<name>.txt   (clean, parser-ready, single source of truth)
```

The converted file is written to `projects/structured_scripts/` and reused on
subsequent runs (re-converts only if the raw script changed).

Run the converter standalone:
```bash
# Regex normalization (default). If regex can't recover ## SCENE headers it
# raises — the LLM fallback was REMOVED alongside the claude CLI subprocess.
# Hand-convert per rule 18 if regex fails.
python storyboard/script_converter.py projects/scripts/<name>.txt --out projects/structured_scripts/<name>.txt

# `--llm` flag still exists in the parser but the codepath now raises
# RuntimeError pointing at rule 18. Treat it as deprecated / no-op.
# python storyboard/script_converter.py projects/scripts/<name>.txt --llm  # → raises

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
- DO NOT skip the `### Narration` or `### Animation` blocks — both required
- DO NOT write animation bullets without concrete content values — the LLM needs specifics
- DO NOT put more than ~8 animation bullets per scene — each bullet is one visual block
