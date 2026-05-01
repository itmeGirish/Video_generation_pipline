"""
SSML compiler — converts plain narration text to SSML for edge-tts.

Without SSML, edge-tts produces flat monotone narration.
With SSML, hero words get emphasis, em-dashes become natural pauses,
last sentence of each scene gets punchline prosody.

Reads `### Pacing` blocks from the source script for per-scene rate/emphasis overrides.

Usage:
    from storyboard.ssml_compiler import compile_narration
    ssml = compile_narration(scenes)   # → str ready for edge_tts.Communicate(ssml, ...)
"""
from __future__ import annotations

import html
import os
import re

from .source_parser import Scene


# ─── Narration prosody constants (config-overridable via env vars) ───
# build_video.py reads config.yaml `narration:` and exports these via env vars
# before calling compile_narration. Defaults match the project-pinned cadence.
EMPHASIS_RATE     = os.environ.get("SSML_EMPHASIS_RATE",     "-15%")
PUNCHLINE_RATE    = os.environ.get("SSML_PUNCHLINE_RATE",    "-10%")
PUNCHLINE_PITCH   = os.environ.get("SSML_PUNCHLINE_PITCH",   "+5%")
EM_DASH_PAUSE_MS  = os.environ.get("SSML_EM_DASH_PAUSE_MS",  "400")
SENTENCE_PAUSE_MS = os.environ.get("SSML_SENTENCE_PAUSE_MS", "250")


def _convert_author_pauses(text: str) -> str:
    """Convert author-supplied <pause Xs> markers in narration to SSML breaks
    BEFORE _escape() runs. Otherwise html.escape() turns them into &lt;pause Xs&gt;
    and the downstream strip-tags-for-edge-tts pass cannot remove them, so the
    TTS speaks "less-than pause zero point three s greater-than" out loud.

    Accepts forms: <pause 0.3s>, <pause 0.3 s>, <pause 300ms>, <pause 1>.
    Numeric value can be float; unit defaults to seconds, 'ms' explicit.
    Output is a literal SSML <break time="Xms"/> tag (raw '<' and '>'), which
    the strip pipeline removes (replacing with ', ') before edge-tts sees it.
    """
    def _to_break(m: re.Match) -> str:
        val = m.group(1)
        unit = (m.group(2) or "s").lower()
        try:
            n = float(val)
        except ValueError:
            return ""  # malformed pause → drop entirely
        ms = round(n) if unit == "ms" else round(n * 1000)
        return f'<break time="{ms}ms"/>'
    # Handles <pause 0.3s>, <pause 0.3 s>, <pause 300ms>, <pause 1>, etc.
    return re.sub(
        r'<\s*pause\s+([\d.]+)\s*(ms|s)?\s*>',
        _to_break,
        text,
        flags=re.IGNORECASE,
    )


def _escape(text: str) -> str:
    """Escape XML chars (& < >) so SSML stays valid."""
    return html.escape(text, quote=False)


def _hero_words(narration: str) -> set[str]:
    """ALL-CAPS words (length > 2) and number tokens are heroes."""
    heroes: set[str] = set()
    heroes.update(re.findall(r"\b[A-Z]{3,}\b", narration))
    return heroes


def _wrap_emphasis(text: str, heroes: set[str], emphasis_level: str) -> str:
    """Wrap each hero word in <emphasis><prosody rate="{EMPHASIS_RATE}">...</prosody></emphasis>."""
    if not heroes:
        return text
    pattern = r"\b(" + "|".join(re.escape(h) for h in sorted(heroes, key=len, reverse=True)) + r")\b"
    return re.sub(
        pattern,
        lambda m: f'<emphasis level="{emphasis_level}"><prosody rate="{EMPHASIS_RATE}">{m.group(1)}</prosody></emphasis>',
        text,
    )


def _wrap_numbers(text: str) -> str:
    """Numbers (digits with optional commas/periods) get emphasis + slowdown.
    Skips digits already inside SSML tag attributes (e.g. rate="{EMPHASIS_RATE}").
    """
    parts = re.split(r"(<[^>]+>)", text)
    out: list[str] = []
    for p in parts:
        if p.startswith("<"):
            out.append(p)
        else:
            out.append(re.sub(
                r"\b(\d[\d,\.]*)\b",
                lambda m: f'<emphasis level="strong"><prosody rate="{EMPHASIS_RATE}">{m.group(1)}</prosody></emphasis>',
                p,
            ))
    return "".join(out)


def _replace_emdashes(text: str) -> str:
    """Em-dashes → 400ms pauses. Handle ' — ' and '—' and ' -- '."""
    text = re.sub(r"\s+—\s+", f'<break time="{EM_DASH_PAUSE_MS}ms"/> ', text)
    text = re.sub(r"\s+--\s+", f'<break time="{EM_DASH_PAUSE_MS}ms"/> ', text)
    return text


def _add_sentence_breaks(text: str) -> str:
    """Add 250ms break after sentence-ending periods (not inside numbers like 3.14)."""
    return re.sub(r"(?<=[a-zA-Z])\.(\s+)", rf'.<break time="{SENTENCE_PAUSE_MS}ms"/>\1', text)


def _wrap_last_sentence(text: str) -> str:
    """Wrap final sentence in slower + slightly higher pitch (punchline delivery)."""
    # Find the last sentence. Trailing whitespace/punctuation OK.
    parts = re.split(r"(?<=[a-zA-Z])\.(\s*)", text.rstrip())
    if len(parts) < 3:
        return text
    # parts = [..., last_sentence, "", trailing] — last meaningful sentence is parts[-3]
    last = parts[-3].strip()
    if not last or len(last) < 5:
        return text
    wrapped = f'<prosody rate="{PUNCHLINE_RATE}" pitch="{PUNCHLINE_PITCH}">{last}.</prosody>'
    rebuilt = "".join(parts[:-3]) + wrapped + parts[-1]
    return rebuilt


def _parse_pacing(pacing_text: str) -> tuple[str | None, str]:
    """Parse '### Pacing' block → (rate_override, emphasis_level).
    Defaults: rate=None (no override), emphasis='moderate'.
    """
    rate = None
    emphasis = "moderate"
    if not pacing_text:
        return rate, emphasis
    m = re.search(r"rate\s*=\s*([+-]?\d+%)", pacing_text)
    if m:
        rate = m.group(1)
    m = re.search(r"emphasis\s*=\s*(\w+)", pacing_text, re.IGNORECASE)
    if m:
        v = m.group(1).lower()
        if v in ("strong", "heavy"):
            emphasis = "strong"
        elif v in ("reduced", "soft"):
            emphasis = "reduced"
        else:
            emphasis = "moderate"
    return rate, emphasis


def compile_scene(scene: Scene) -> str:
    """Compile one scene's narration to SSML body (no <speak> wrapper)."""
    rate_override, emphasis_level = _parse_pacing(scene.pacing)
    # Author-supplied <pause Xs> markers MUST be converted to <break/> tags
    # BEFORE escape, otherwise they get HTML-escaped to &lt;pause Xs&gt; and
    # leak through the strip-tags pipeline → TTS speaks them literally.
    raw = _convert_author_pauses(scene.narration.strip())
    text = _escape(raw)

    heroes = _hero_words(scene.narration)
    text = _wrap_emphasis(text, heroes, emphasis_level)
    text = _wrap_numbers(text)
    text = _replace_emdashes(text)
    text = _add_sentence_breaks(text)
    text = _wrap_last_sentence(text)

    if rate_override:
        text = f'<prosody rate="{rate_override}">{text}</prosody>'
    return text


def compile_narration(scenes: list[Scene]) -> str:
    """Compile all scenes into one SSML document for continuous TTS."""
    body = "\n".join(compile_scene(s) for s in scenes)
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">\n'
        f"{body}\n"
        "</speak>"
    )


# ─── self-test ───
if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    from .source_parser import parse
    if len(sys.argv) < 2:
        print("Usage: python ssml_compiler.py <path/to/source.txt>"); sys.exit(1)
    src = sys.argv[1]
    script = parse(src)
    print(compile_narration(script.scenes))
