---
name: script-conversion
description: How any-format `.txt` script gets converted to the canonical structured-script format that the parser expects. Two-stage: regex first (fast), LLM fallback (robust).
metadata:
  tags: conversion, normalization, llm, regex, script, structured-scripts
---

# Script Conversion

## The problem

Real scripts in `projects/scripts/*.txt` come in many shapes:
- Long preambles (Engagement Playbook, Visual Language, Scene Map, Runtime tables)
- Different em-dash conventions (`—`, `–`, `--`, `-`)
- HTML entities (`&nbsp;`, `•`, `·`)
- "Engagement move" notes between scene header and Narration
- Sub-bullets with code fences, mixed indentation
- Sometimes totally different header styles (`# Scene 1` instead of `## SCENE 1`)

The parser (`source_parser.py`) expects ONE canonical format. Without
conversion, scripts fail to parse — or worse, parse partially and produce
wrong output.

## The solution — two-stage converter

`storyboard/script_converter.py` runs as **Step 0.5** of `build_video.py`
whenever you pass a `.txt` path (Layout B):

```
projects/scripts/<name>.txt              (raw, ANY structure)
              │
              ▼  Stage 1: regex converter
              │   - strips preamble before first ## SCENE
              │   - strips engagement-move lines
              │   - normalizes em-dashes in scene headers
              │   - normalizes em-dashes in animation bullet headers
              │   - removes HTML entities (&nbsp;, •, ·)
              │   - collapses excess blank lines
              │
              ▼  parses cleanly?
              │
   ┌──────────┴──────────┐
   │ yes                 │ no
   ▼                     ▼
   │              Stage 2: LLM converter
   │              - Claude with strict prompt
   │              - converts ANY structure → canonical format
   │              - preserves all narration + animation content
   │              - cached by sha256(raw input)
   │                     │
   └──────────┬──────────┘
              ▼
projects/structured_scripts/<name>.txt   (canonical, parser-ready)
              │
              ▼  source_parser.py reads from here
```

## Folder responsibilities

| Folder | Owner | Hand-edit? | Purpose |
|--------|-------|-----------|---------|
| `projects/scripts/` | human | YES | original raw scripts you write |
| `projects/structured_scripts/` | pipeline | NO — overwritten on each run | parser-ready canonical format |
| `projects/<name>/` | mixed | config.yaml yes, rest no | per-project config + outputs |

## The canonical format (what the parser eats)

```
# Video Title

## SCENE 1 — "Scene Title" (0:00 – 1:00)

### Narration
> Narration prose here. Em-dashes — like this — for natural pauses.

### Animation
- **0:00 – 0:08 — Headline of what happens.** Body description with concrete details.
- **0:08 – 0:18 — Next moment.** More body detail.

### Pacing
rate=-5% emphasis=heavy

## SCENE 2 — "Title" (1:00 – 2:00)
...
```

Required:
- `## SCENE N — "Title" (M:SS – M:SS)` exactly
- `### Narration` block with `> ` line prefixes
- `### Animation` block with `- **M:SS – M:SS — Headline.** Body` bullets

## Usage

**Auto (recommended):** the pipeline does it for you.
```bash
python storyboard/build_video.py projects/scripts/<name>.txt
# Auto-converts → projects/structured_scripts/<name>.txt → runs full pipeline
```

**Standalone:**
```bash
# Default — regex first, LLM fallback if needed.
# Output goes to the canonical structured_scripts folder.
python storyboard/script_converter.py projects/scripts/<name>.txt \
    --out projects/structured_scripts/<name>.txt

# Force LLM (most robust, slower, costs tokens)
python storyboard/script_converter.py projects/scripts/<name>.txt --llm \
    --out projects/structured_scripts/<name>.txt

# Regex only (free, no network, may fail on unusual scripts)
python storyboard/script_converter.py projects/scripts/<name>.txt --regex-only \
    --out projects/structured_scripts/<name>.txt
```

**To re-convert** (after editing the raw script): just re-run the pipeline.
The converter detects raw-script changes via content comparison and overwrites
`projects/structured_scripts/<name>.txt` automatically.

## What the converter preserves

- Every word of `### Narration` content
- Every animation bullet (count and order)
- Scene order and titles
- Time windows and durations
- Pacing overrides

## What the converter normalizes

- Em-dashes: `—` between scene number and title, `–` between times
- Bullet headers: `- **M:SS – M:SS — Headline.** Body`
- Whitespace: collapses 3+ blank lines to 1
- Removes HTML entities and unicode bullets

## What the converter does NOT do

- Does NOT invent missing `### Narration` or `### Animation` blocks
- Does NOT change content (only formatting)
- Does NOT fix bad time windows (e.g. `(10:00 – 11:00)` for a 1-min scene)
- Does NOT split or merge scenes
- Does NOT translate between languages
- Does NOT handle scene headers WITHOUT an inline `(M:SS – M:SS)` window (e.g. `## SCENE 1 — COLD OPEN` with the time on a separate `**Frames:**` line)
- Does NOT convert frame-based bullet timing (`- **Frame 60–90:**`) to scene-relative `M:SS – M:SS`
- Does NOT rewrite `### VO:` → `### Narration` or `### ANIMATION:` → `### Animation`
- Does NOT strip stage directions like `<pause 0.3s>` from narration
- Does NOT flag bullets whose bespoke metaphor (octopus, vault, lie detector, etc.) has no matching primitive

For scripts that need ANY of the above (movie-style scripts with frame timing, sub-scenes, design-token preambles, or bespoke cinematography), see **rule 18 — rich-script-conversion**.

If the source has a structural problem (no scenes, missing narration, etc.),
the converter cannot fix it. The parser will reject it loudly and you fix
the source.

## When the LLM fallback fires

The regex converter is preferred because it's:
- Free (no LLM tokens)
- Deterministic (same input → same output)
- Fast (<10ms)
- Reviewable (you can read the regex rules)

LLM fallback fires only when:
1. Regex output has zero `## SCENE N` headers, OR
2. Regex output has fewer SCENE headers than the raw input did

This happens when the raw script uses unusual headers like `# Scene 1` or
`Scene 1:` or `## Part 1` — patterns the regex doesn't match.

## Cache

LLM conversions are cached at `storyboard/.cache/conversions/<sha256>.txt`.
Same raw input = instant retrieval, no LLM call.

To force re-conversion (e.g., after improving the LLM prompt):
```bash
rm storyboard/.cache/conversions/*.txt
```

## How this fits the pipeline

```
build_video.py
    │
    ├─ Step 0.5  script_converter.py   (only for .txt input)
    │            ANY format → canonical projects/structured_scripts/<name>.txt
    │
    ├─ Step 1    load + schema check (config.yaml)
    ├─ Step 2    parse structured script + lint
    ├─ Step 3    per-bullet LLM codegen (parallel + per-bullet cache)
    ├─ Step 4    SSML compile + edge-tts
    ├─ Step 5    Whisper transcribe
    ├─ Step 6    scene boundaries (decimal/hyphen normalization)
    ├─ Step 7    frame ranges + audio_anchor coverage
    ├─ Step 8    timelines.ts patch
    ├─ Step 8.5  validate pipeline (JSONs, IDs, design tokens)
    ├─ Step 9    render (bundle once)
    ├─ Step 9.5  visual QA (midpoint brightness)
    ├─ Step 10   stitch + mux
    └─ Step 10.5 validate output (narration coverage % + per-bullet visibility)
```

The converter is the bridge between "messy human script" and "clean machine
input". Without it, the pipeline would fail on real-world scripts.

## Quality contract

Whatever happens at Step 0.5, the output MUST satisfy `source_parser.py`:
- `parse(source_file)` does not raise
- Every scene has narration and animation blocks
- Every bullet has a time window and headline

If both regex AND LLM fallback fail to produce parseable output, that's a
genuine source bug — read the parser's error message and fix the original
.txt manually.
