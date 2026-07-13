---
name: vg-script-conversion
description: "THE single owner of script→canonical conversion (both modes). MODE A — REGEX auto-convert for canonical/near-canonical scripts (script_converter.py). MODE B — the MOVIE-SCRIPT format (frame timing, ### VO:/### ANIMATION:, sub-scenes, design-token preambles, bespoke metaphors) → hand-convert per references/movie-script-conversion.md. Hand-convert via rule 18 if regex fails. The canonical target FORMAT is owned by vg-source-script-format. Use whenever running script_converter.py or converting any raw script (incl. movie-script / rich / frame-timing / 'hand convert')."
model: opus
---

# Script Conversion — the single converter (two modes)

This skill OWNS converting any raw `projects/scripts/*.txt` → canonical `projects/structured_scripts/*.txt`.
**The canonical TARGET format is owned by `vg-source-script-format`** (don't re-learn it here — that's the
spec). This skill owns the *conversion*, in two modes:
- **MODE A — REGEX auto-convert** (the default): canonical or lightly-drifted scripts → `script_converter.py`
  normalizes them. Covered below.
- **MODE B — MOVIE-SCRIPT / rich format** (frame timing `Frame 0–60` · `### VO:`/`### ANIMATION:` · sub-scenes ·
  design-token preambles · bespoke metaphors): the regex converter does NOT handle these → **hand-convert per
  the 9-step checklist in `references/movie-script-conversion.md`** (formerly the separate `vg-rich-script-conversion`).

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

## The solution — single-stage regex converter (LLM fallback removed)

`storyboard/script_converter.py` runs as **Step 0.5** of `build_video.py`
whenever you pass a `.txt` path:

```
projects/scripts/<name>.txt              (raw, light structural drift)
              │
              ▼  Regex converter
              │   - strips preamble before first ## SCENE
              │   - strips engagement-move lines
              │   - normalizes em-dashes in scene headers + bullet headers
              │   - removes HTML entities (&nbsp;, •, ·)
              │   - collapses excess blank lines
              │
              ▼  parses cleanly?
              │
   ┌──────────┴──────────┐
   │ yes                 │ no — regex failed
   ▼                     ▼
   │           HARD ERROR. The LLM fallback that USED to spawn the
   │           claude CLI here was REMOVED (no subprocess allowed).
   │           Hand-convert per rule 18 and write to:
   │             projects/structured_scripts/<name>.txt
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

## The canonical TARGET format → owned by `vg-source-script-format`

The shape the converter must produce (`## SCENE N — "Title" (M:SS – M:SS)` + `### Narration` with `> ` prefixes
+ `### Animation` `- **M:SS – M:SS — Headline.** Body` bullets + optional `### Pacing`) is the **single spec in
`vg-source-script-format`** — read it there, don't duplicate it here (this skill owns the *conversion*, not the
format). The converter's only job is: whatever the raw shape, emit exactly what `source_parser.py` parses.

## Usage

**Auto (recommended):** the pipeline does it for you.
```bash
python storyboard/build_video.py projects/scripts/<name>.txt
# Auto-converts → projects/structured_scripts/<name>.txt → runs full pipeline
```

**Standalone:**
```bash
# Regex-only normalization. The --llm flag is OBSOLETE — kept for argparse
# compatibility but invokes the same regex pass. If the regex pass fails,
# the converter raises and you must hand-convert per rule 18.
python storyboard/script_converter.py projects/scripts/<name>.txt \
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

For scripts that need ANY of the above (movie-style scripts with frame timing, sub-scenes, design-token preambles, or bespoke cinematography), that is **MODE B → `references/movie-script-conversion.md`** (the 9-step hand-convert checklist).

If the source has a structural problem (no scenes, missing narration, etc.),
the converter cannot fix it. The parser will reject it loudly and you fix
the source.

## When regex can't recover the scenes (NO LLM fallback — it was removed)

The regex converter is preferred because it's free, deterministic (same input → same output), fast (<10ms),
and reviewable. It **fails** (raises — there is **no** LLM subprocess fallback anymore) when:
1. Regex output has zero `## SCENE N` headers, OR
2. Regex output has fewer SCENE headers than the raw input did —
typically because the raw script uses unusual headers (`# Scene 1`, `Scene 1:`, `## Part 1`) the regex
doesn't match. On that failure → **hand-convert** (MODE B / `references/movie-script-conversion.md`, or rule
18 for a one-off) and write `projects/structured_scripts/<name>.txt` yourself. (No conversion cache exists —
the LLM-conversion cache was removed with the subprocess; the only cache is the per-bullet design cache.)

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

If the regex pass fails AND a hand-convert (MODE B) still can't produce parseable output, that's a
genuine source bug — read the parser's error message and fix the original `.txt` manually.
