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
    """Convert author-supplied <pause Xs> markers (raw OR HTML-escaped) into
    raw SSML <break time="Xms"/> tags.

    Why both forms: callers may run this BEFORE or AFTER `_escape`. If before,
    the input has raw `<pause Xs>`; if after, the input has `&lt;pause Xs&gt;`
    because `_escape` escapes the angle brackets. Earlier code ran this only
    BEFORE escape — but `_escape` then HTML-escaped the just-created `<break>`
    tags into `&lt;break.../&gt;`, which the TTS chunk-splitter regex
    `<break time="(\\d+)(ms|s)"\\s*/>` does not match. Result: every author/
    pacer pause was silently dropped (verified 2026-05-07 on difference_txt
    scene 1: pacer inserted 5.46s of pauses, audio duration didn't change).

    Calling this AFTER `_escape` handles both raw author markers (already
    escaped to `&lt;pause Xs&gt;`) AND any pre-existing raw markers (left
    over from upstream callers). The output is RAW `<break time="Xms"/>`
    tags, which `_replace_emdashes` and `_add_sentence_breaks` produce too —
    the TTS chunk-splitter finds all of them.

    Accepts forms: <pause 0.3s>, <pause 0.3 s>, <pause 300ms>, <pause 1>,
    and the HTML-escaped equivalents (&lt;pause 0.3s&gt;, etc.).
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
    # Single regex handles both raw `<...>` and escaped `&lt;...&gt;` markers.
    return re.sub(
        r'(?:<|&lt;)\s*pause\s+([\d.]+)\s*(ms|s)?\s*(?:>|&gt;)',
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
    Skips digits inside SSML tag attributes AND digits already inside an
    <emphasis>...</emphasis> region (which _wrap_emphasis may have produced
    around hero words containing digits like 'GPT5'). Wrapping digits inside
    an existing <emphasis> produces nested <emphasis>, which is invalid SSML
    on most engines and undefined behavior on edge-tts.
    """
    parts = re.split(r"(<[^>]+>)", text)
    out: list[str] = []
    emphasis_depth = 0
    for p in parts:
        if p.startswith("<"):
            if re.match(r"<emphasis(\s|>)", p):
                emphasis_depth += 1
            elif p.startswith("</emphasis"):
                emphasis_depth = max(0, emphasis_depth - 1)
            out.append(p)
        else:
            if emphasis_depth > 0:
                # Already inside an <emphasis>; don't nest another
                out.append(p)
            else:
                out.append(re.sub(
                    r"\b(\d[\d,\.]*)\b",
                    lambda m: f'<emphasis level="strong"><prosody rate="{EMPHASIS_RATE}">{m.group(1)}</prosody></emphasis>',
                    p,
                ))
    return "".join(out)


def _replace_emdashes(text: str) -> str:
    """Em-dashes → 400ms pauses. Handle ' — ', '—' (no spaces), ' -- '."""
    text = re.sub(r"\s+—\s+", f'<break time="{EM_DASH_PAUSE_MS}ms"/> ', text)
    text = re.sub(r"\s+--\s+", f'<break time="{EM_DASH_PAUSE_MS}ms"/> ', text)
    # Also handle no-space em-dash like 'well—then' (common in compact prose)
    text = re.sub(r"(?<=\w)—(?=\w)", f'<break time="{EM_DASH_PAUSE_MS}ms"/>', text)
    return text


def _add_sentence_breaks(text: str) -> str:
    """Add 250ms break after sentence-ending punctuation: '.', '?', '!'.
    Allows digit-ending sentences like '...by 2024.' (previous regex required
    a letter immediately before the period and skipped these).
    """
    return re.sub(
        r"(?<=[a-zA-Z0-9])([.?!])(\s+)",
        rf'\1<break time="{SENTENCE_PAUSE_MS}ms"/>\2',
        text,
    )


def _wrap_last_sentence(text: str) -> str:
    """Wrap final sentence in slower + slightly higher pitch (punchline delivery).

    Now handles single-sentence narration: if there is exactly one sentence,
    wrap the whole thing as the punchline (the previous version returned
    unchanged, leaving very common short scenes with NO punchline prosody)."""
    stripped = text.rstrip()
    if not stripped:
        return text

    # Try to find a final sentence by punctuation. We accept '.', '?', '!'.
    # Walk backward from the end to find the LAST sentence-ending punctuation
    # that is followed by whitespace or end-of-string.
    sentence_end_re = re.compile(r"[.?!]")
    matches = list(sentence_end_re.finditer(stripped))
    if len(matches) <= 1:
        # 0 or 1 sentence terminator — treat the whole thing as the punchline.
        # Skip if too short for prosody to feel natural.
        if len(stripped) < 5:
            return text
        wrapped = f'<prosody rate="{PUNCHLINE_RATE}" pitch="{PUNCHLINE_PITCH}">{stripped}</prosody>'
        return wrapped + text[len(stripped):]

    # Two or more sentences: the last sentence starts after the second-to-last
    # punctuation. (matches[-1] is the final sentence's terminator.)
    second_last_end = matches[-2].end()
    final_terminator = matches[-1].end()
    last_sentence = stripped[second_last_end:final_terminator].lstrip()
    if not last_sentence or len(last_sentence) < 5:
        return text
    leading_ws = stripped[second_last_end:second_last_end + len(stripped[second_last_end:]) - len(stripped[second_last_end:].lstrip())]
    head = stripped[:second_last_end] + leading_ws
    tail = text[len(stripped):]
    wrapped = f'<prosody rate="{PUNCHLINE_RATE}" pitch="{PUNCHLINE_PITCH}">{last_sentence}</prosody>'
    return head + wrapped + tail


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
    # Order matters:
    #   1. _escape — HTML-escape raw narration. Author markers `<pause Xs>` and
    #      em-dashes are turned into `&lt;pause Xs&gt;` and `—` (already safe).
    #   2. _convert_author_pauses — converts BOTH raw `<pause Xs>` and escaped
    #      `&lt;pause Xs&gt;` to RAW `<break time="Xms"/>` tags. RAW form is
    #      what the TTS chunk-splitter regex matches (Strategy B in build_video.py).
    #   3. emphasis / numbers / em-dash / sentence breaks — add additional RAW
    #      `<break/>` and `<emphasis>` tags. They survive because they're added
    #      AFTER escape.
    text = _escape(scene.narration.strip())
    text = _convert_author_pauses(text)

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
