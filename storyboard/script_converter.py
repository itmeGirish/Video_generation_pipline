"""
Script converter — normalize any human-written script into the clean format
that source_parser.py expects.

Handles common drift in `projects/scripts/<name>.txt` files:
  - Preamble (Engagement Playbook, Visual Language, Scene Map) before SCENE 1
  - Wrong em-dash chars in scene headers (— vs – vs -)
  - Malformed animation bullet headers (mixed dash chars, bold spanning wrong region)
  - Sub-bullets indented with mixed spaces/tabs
  - Trailing metadata after the last scene (sound design, pacing, credits)
  - Inline code-fences in bullet body (`like this`) — preserved
  - HTML entities (&nbsp; etc.) — stripped

Usage:
    python storyboard/script_converter.py projects/scripts/<name>.txt
        # writes converted output to stdout

    python storyboard/script_converter.py projects/scripts/<name>.txt --out projects/structured_scripts/<name>.txt
        # writes to the canonical structured-scripts folder (single source of truth)
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


# ─── normalization rules ───

def _normalize_emdash(text: str) -> str:
    """Standardize dashes for the parser:
       - ` -- ` (ASCII double-dash with spaces) → ` — ` (em-dash)
       - ` --- ` (triple-dash) → ` — ` (em-dash)
       - 'word--word' (no spaces) → 'word—word'
    Time windows use en-dash; title separators use em-dash. The parser already
    accepts both shapes but we normalize so downstream regexes are simpler and
    diffs across scripts stay clean.
    """
    text = re.sub(r" --- ", " — ", text)
    text = re.sub(r" -- ", " — ", text)
    # Compact form 'word--word' (no surrounding spaces) becomes em-dash
    text = re.sub(r"(?<=\w)--(?=\w)", "—", text)
    return text


def _strip_preamble(text: str) -> str:
    """Remove everything before the first `## SCENE N` header.
    Preamble (Engagement Playbook, Visual Language, Scene Map) is human-readable
    metadata that confuses the linter and is not used by the pipeline.
    """
    m = re.search(r"^##\s*SCENE\s+\d+", text, re.MULTILINE)
    if not m:
        return text  # no scene found — return as-is, parser will fail loudly
    # Keep the document title (first H1) if present
    title_match = re.search(r"^#\s+.+$", text, re.MULTILINE)
    title_line = title_match.group(0) + "\n\n" if title_match and title_match.start() < m.start() else ""
    return title_line + text[m.start():]


def _strip_html_entities(text: str) -> str:
    """Decode HTML entities like &nbsp; that confuse the lexer.

    The previous version stripped ALL `&...;` entities (including legitimate
    `&amp;` / `&copy;` / `&trade;` that appear in narration prose), making
    'AT&amp;T' lose 'amp' and become 'AT;T'. Now we use html.unescape, which
    converts entities to their actual chars (&amp; → &, &nbsp; → space, &lt; → <).
    """
    import html as _html
    text = _html.unescape(text)
    # &nbsp; decodes to non-breaking-space \xa0 — replace with regular space
    text = text.replace("\xa0", " ")
    text = re.sub(r"[•·]", "-", text)
    return text


def _strip_engagement_moves(text: str) -> str:
    """Remove `**Engagement move:** ...` lines between scene header and Narration.
    The parser ignores them but they add noise."""
    return re.sub(r"^\*\*Engagement move:\*\*.*$", "", text, flags=re.MULTILINE)


def _normalize_animation_bullets(text: str) -> str:
    """Inside each `### Animation` block, normalize bullet header format to:
        - **M:SS – M:SS — Title.** Body
    Common drift: hyphens-only, em-dash misplacement, missing period after Title.
    """
    # Split into sections by ### headers, only touch Animation sections
    def fix_section(match: re.Match) -> str:
        header = match.group(1)
        body = match.group(2)
        if header.lower() != "animation":
            return match.group(0)
        # Normalize bullet headers in this section only
        new_body = re.sub(
            r"^-\s+\*\*(\d+:\d{2})\s*[-–—]+\s*(\d+:\d{2})\s*[-–—]+\s*(.+?)\*\*",
            lambda b: f"- **{b.group(1)} – {b.group(2)} — {b.group(3).strip().rstrip('.')}.**",
            body,
            flags=re.MULTILINE,
        )
        return f"### {header}\n{new_body}"

    pattern = re.compile(r"^###\s+(\w+)\s*\n(.*?)(?=^###|\Z)", re.MULTILINE | re.DOTALL)
    return pattern.sub(fix_section, text)


def _normalize_scene_headers(text: str) -> str:
    """Standardize scene header dashes: `## SCENE N — "Title" (M:SS – M:SS)`."""
    return re.sub(
        r"^##\s*SCENE\s+(\d+)\s*[-–—]+\s*[\"“]?(.+?)[\"”]?\s*\(\s*(\d+:\d{2})\s*[-–—]+\s*(\d+:\d{2})\s*\)\s*$",
        lambda m: f'## SCENE {m.group(1)} — "{m.group(2).strip()}" ({m.group(3)} – {m.group(4)})',
        text,
        flags=re.MULTILINE,
    )


def _collapse_blank_lines(text: str) -> str:
    """Collapse 3+ consecutive blank lines into 1 — keeps file tidy."""
    return re.sub(r"\n{3,}", "\n\n", text)


# ─── pipeline ───

def convert(text: str) -> str:
    """Apply all normalization steps in order."""
    text = _strip_html_entities(text)
    text = _strip_preamble(text)
    text = _strip_engagement_moves(text)
    text = _normalize_scene_headers(text)
    text = _normalize_animation_bullets(text)
    text = _collapse_blank_lines(text)
    return text.strip() + "\n"


_LLM_SYSTEM_PROMPT = """You are a script-format converter for a video pipeline.

INPUT: a free-form Markdown video script with ANY structure (could have preamble,
visual language tables, runtime tables, scene maps, engagement notes, sub-bullets,
inconsistent dashes, code blocks, anything).

OUTPUT: ONLY the canonical format below. No explanation, no markdown fences,
no commentary. Just the converted script as plain text.

CANONICAL FORMAT (this is what the parser expects):

```
# Video Title

## SCENE 1 — "Scene Title" (0:00 – 1:00)

### Narration
> Narration text goes here on one or more lines starting with `>`.
> Em-dashes — like this — for natural pauses.

### Animation
- **0:00 – 0:08 — Headline of what happens.** Body description with concrete details.
- **0:08 – 0:18 — Next animation moment.** More body detail.

### Pacing
rate=-5% emphasis=heavy

## SCENE 2 — "Title" (1:00 – 2:00)
...
```

EXACT RULES:
1. Strip ALL preamble before the first SCENE (engagement playbook, visual
   language, scene map, runtime tables — gone).
2. Each SCENE header MUST be: `## SCENE N — "Title" (M:SS – M:SS)` with em-dash
   between number and title, en-dash in time window.
3. ### Narration block: prose with `> ` line prefixes.
4. ### Animation block: bullets formatted EXACTLY as `- **M:SS – M:SS — Headline.** Body`
   (em-dash separator, period after headline).
5. PRESERVE all narration text and all animation content — only normalize formatting.
6. DO NOT invent scenes, narration, or animation bullets.
7. DO NOT merge or split scenes.
8. If the input has 7 scenes, output has 7 scenes.
9. If a scene has 6 animation bullets, output has 6 animation bullets in same order.
10. If something is ambiguous, prefer the parser-friendly interpretation."""


def _llm_convert(raw: str) -> str:
    """Removed: this used to spawn the `claude` CLI to repair scripts the regex
    pass couldn't normalize. The subprocess path is gone. Hand-convert the
    raw script per `.claude/skills/video_generation/rules/18-rich-script-conversion.md`
    and drop the result in `projects/structured_scripts/<name>.txt`."""
    raise RuntimeError(
        "script_converter LLM fallback is disabled — claude CLI subprocess removed.\n"
        "  Hand-convert the raw script per rule 18 (rich-script-conversion) and write\n"
        "  the canonical output to projects/structured_scripts/<name>.txt. The pipeline\n"
        "  reads the structured file directly."
    )


def convert_with_fallback(raw: str) -> str:
    """Regex-only normalization. If the regex pass cannot recover SCENE headers,
    we raise — there is no LLM fallback now that the claude CLI subprocess is gone.
    The caller must hand-convert the raw script to `projects/structured_scripts/`."""
    candidate = convert(raw)
    if not re.search(r"^##\s*SCENE\s+\d+", candidate, re.MULTILINE):
        raise RuntimeError(
            "regex converter found no SCENE headers — and the LLM fallback is disabled.\n"
            "  Hand-convert the raw script per rule 18 and write to projects/structured_scripts/."
        )
    raw_scenes = len(re.findall(r"(?im)^#{1,3}\s*SCENE\s+\d+|^scene\s+\d+", raw, re.MULTILINE))
    out_scenes = len(re.findall(r"^##\s*SCENE\s+\d+", candidate, re.MULTILINE))
    if raw_scenes > 0 and out_scenes == 0:
        raise RuntimeError(
            f"regex converter lost scenes ({raw_scenes} → {out_scenes}) — and the LLM fallback is disabled.\n"
            "  Hand-convert the raw script per rule 18 and write to projects/structured_scripts/."
        )
    return candidate


def main() -> int:
    ap = argparse.ArgumentParser(description="Convert raw Markdown script to clean source.txt format")
    ap.add_argument("input", help="Path to raw script (e.g. projects/scripts/<name>.txt)")
    ap.add_argument("--out", help="Output path (default: print to stdout)")
    ap.add_argument("--in-place", action="store_true", help="Overwrite input file")
    ap.add_argument("--llm", action="store_true", help="Force LLM converter (skip regex)")
    ap.add_argument("--regex-only", action="store_true", help="Use regex only (no LLM fallback)")
    args = ap.parse_args()

    src = Path(args.input).resolve()
    if not src.exists():
        print(f"ERROR: not found: {src}"); return 1
    raw = src.read_text(encoding="utf-8")
    if args.llm:
        clean = _llm_convert(raw)
    elif args.regex_only:
        clean = convert(raw)
    else:
        clean = convert_with_fallback(raw)

    if args.in_place:
        src.write_text(clean, encoding="utf-8")
        print(f"OK — wrote {len(clean)} chars to {src}")
    elif args.out:
        out = Path(args.out).resolve()
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(clean, encoding="utf-8")
        print(f"OK — wrote {len(clean)} chars to {out}")
    else:
        sys.stdout.write(clean)
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
