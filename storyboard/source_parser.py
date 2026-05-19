"""
Parse a source script (projects/<name>/source.txt) into a structured SourceScript.

Source format contract:
    ## SCENE N — "Title" (M:SS – M:SS)
    [optional] **Engagement move:** ...
    ### Narration
    > narration text (single block, may span multiple lines)
    ### Animation
    - **0:00 – 0:08 — Hard cut. Plain horse silhouette.** Body text...
      sub-bullet...
    - **0:08 – 0:18 — Title.** Body...

Returns a SourceScript with per-scene narration + animation bullets.
Each animation bullet has a time window in seconds and the description text.

This is the SINGLE CONTRACT for downstream pipeline steps. No script.md
intermediate. No human/LLM rewrite. Source.txt is the only truth.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class AnimationBullet:
    time_from_sec: float       # seconds within scene (e.g. 0.0)
    time_to_sec: float         # seconds within scene (e.g. 8.0)
    headline: str              # the bold ALL-CAPS-ish first sentence ("Hard cut. Plain horse silhouette.")
    body: str                  # remainder of the bullet text
    spotlight_items: list[str] | None = None  # set when body contains [SPOTLIGHT: a | b | c]


@dataclass
class Scene:
    number: int
    title: str
    window_from_sec: float     # absolute scene start in video (e.g. 60.0)
    window_to_sec: float
    narration: str             # raw narration text (single block)
    animation: list[AnimationBullet] = field(default_factory=list)
    pacing: str = ""           # optional ### Pacing block content


@dataclass
class SourceScript:
    title: str
    scenes: list[Scene]


# ─── helpers ───
_TIME_RE = r"(\d+):(\d{2})"


def _to_sec(m_str: str, s_str: str) -> float:
    return int(m_str) * 60 + int(s_str)


def _parse_window(window: str) -> tuple[float, float]:
    """Parse '0:00 – 1:00' (uses en-dash or hyphen) → (0.0, 60.0)."""
    m = re.match(rf"\s*{_TIME_RE}\s*[–-]\s*{_TIME_RE}\s*", window)
    if not m:
        raise ValueError(f"Cannot parse time window: {window!r}")
    return _to_sec(m.group(1), m.group(2)), _to_sec(m.group(3), m.group(4))


def _strip_markdown(text: str) -> str:
    """Light cleanup: collapse whitespace, strip markdown tickmarks/quotes around words."""
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ─── scene split ───
_SCENE_HEADER = re.compile(
    r"^##\s*SCENE\s+(\d+)\s*[—-]\s*[\"“]?(.+?)[\"”]?\s*\((\d+:\d{2})\s*[–-]\s*(\d+:\d{2})\)\s*$",
    re.MULTILINE,
)


def lint(source_path: str | Path) -> list[str]:
    """Return list of human-readable warnings about common source.txt mistakes.
    Empty list = clean. Does NOT raise — just reports problems for the user to fix."""
    text = Path(source_path).read_text(encoding="utf-8")
    warnings: list[str] = []

    # Wrong em-dash chars in scene headers (must be – or -, not — or other)
    for i, line in enumerate(text.splitlines(), 1):
        if line.startswith("## SCENE"):
            if "(" not in line or ")" not in line:
                warnings.append(f"line {i}: scene header missing time window in parens")
            window_match = re.search(r"\(([^)]*)\)", line)
            if window_match:
                w = window_match.group(1)
                if "–" not in w and "-" not in w:
                    warnings.append(f"line {i}: scene header time window must use – or - between times")

    # Animation bullets: check time window format — ONLY inside ### Animation blocks
    # (preamble bullets in Visual Language / Engagement Playbook are not bullets the
    # parser cares about; flagging them is a false positive.)
    in_anim = False
    lines = text.splitlines()
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("###"):
            in_anim = re.match(r"^###\s*Animation\s*$", stripped, re.IGNORECASE) is not None
            continue
        if not in_anim:
            continue
        m = re.match(r"^-\s+\*\*([^*]+?)\*\*", line)
        if m:
            head = m.group(1)
            if not re.match(r"\d+:\d{2}\s*[–-]\s*\d+:\d{2}\s*[—-]", head):
                warnings.append(f"line {i}: animation bullet header malformed — expected '0:00 – 0:08 — Title'")

    # Check that each scene has both ### Narration and ### Animation
    scenes = list(_SCENE_HEADER.finditer(text))
    for i, m in enumerate(scenes):
        body_start = m.end()
        body_end = scenes[i + 1].start() if i + 1 < len(scenes) else len(text)
        body = text[body_start:body_end]
        if "### Narration" not in body:
            warnings.append(f"scene {m.group(1)}: missing ### Narration block")
        if "### Animation" not in body:
            warnings.append(f"scene {m.group(1)}: missing ### Animation block")

    return warnings


def parse(source_path: str | Path) -> SourceScript:
    text = Path(source_path).read_text(encoding="utf-8")

    # Extract document title (first H1)
    title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else Path(source_path).stem

    # Find scene boundaries
    scene_marks = list(_SCENE_HEADER.finditer(text))
    if not scene_marks:
        raise ValueError(
            f"No scenes found in {source_path}. "
            f"Expected headers like '## SCENE 1 — \"Title\" (0:00 – 1:00)'"
        )

    scenes: list[Scene] = []
    for i, m in enumerate(scene_marks):
        body_start = m.end()
        body_end = scene_marks[i + 1].start() if i + 1 < len(scene_marks) else len(text)
        body = text[body_start:body_end]

        scene_num = int(m.group(1))
        scene_title = m.group(2).strip()
        win_from = _to_sec(*m.group(3).split(":"))
        win_to = _to_sec(*m.group(4).split(":"))

        narration = _extract_narration(body)
        animation = _extract_animation(body)
        pacing = _extract_pacing(body)

        if not narration:
            raise ValueError(f"Scene {scene_num} '{scene_title}' missing ### Narration block")
        if not animation:
            raise ValueError(f"Scene {scene_num} '{scene_title}' missing ### Animation block")

        scenes.append(Scene(
            number=scene_num,
            title=scene_title,
            window_from_sec=win_from,
            window_to_sec=win_to,
            narration=narration,
            animation=animation,
            pacing=pacing,
        ))

    return SourceScript(title=title, scenes=scenes)


# ─── section extractors ───
_SECTION_RE = re.compile(r"^###\s*(\w+)\s*$", re.MULTILINE)


def _extract_section(body: str, name: str) -> str:
    """Extract content of '### name' until next '###' or end."""
    sections = list(_SECTION_RE.finditer(body))
    for i, m in enumerate(sections):
        if m.group(1).lower() == name.lower():
            start = m.end()
            end = sections[i + 1].start() if i + 1 < len(sections) else len(body)
            return body[start:end].strip()
    return ""


def _extract_narration(body: str) -> str:
    raw = _extract_section(body, "Narration")
    if not raw:
        return ""
    # Strip leading '> ' markers, join lines
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if line.startswith(">"):
            line = line[1:].strip()
        if line:
            lines.append(line)
    return _strip_markdown(" ".join(lines))


def _extract_pacing(body: str) -> str:
    return _extract_section(body, "Pacing")


# Spotlight annotation: [SPOTLIGHT: item1 | item2 | item3] anywhere in bullet body/tail
_SPOTLIGHT_RE = re.compile(r'\[SPOTLIGHT:\s*([^\]]+)\]', re.IGNORECASE)


# Animation bullet pattern: top-level "- " bullets with bold time-window header
_ANIM_BULLET = re.compile(
    r"^-\s+\*\*(\d+:\d{2})\s*[–-]\s*(\d+:\d{2})\s*[—-]\s*(.+?)\*\*\s*(.*)$",
    re.MULTILINE,
)


def _extract_animation(body: str) -> list[AnimationBullet]:
    """Extract animation bullets, including their multi-line bodies and sub-bullets."""
    raw = _extract_section(body, "Animation")
    if not raw:
        return []

    # Find all top-level bullet starts
    matches = list(_ANIM_BULLET.finditer(raw))
    bullets: list[AnimationBullet] = []

    for i, m in enumerate(matches):
        start_body = m.end()
        end_body = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        body_text = raw[start_body:end_body].strip()
        # First-line tail (after the bold header) plus sub-content
        first_tail = m.group(4).strip()
        rest = _strip_markdown(body_text)
        body_full = f"{first_tail} {rest}".strip() if first_tail else rest

        from_sec = _to_sec(*m.group(1).split(":"))
        to_sec = _to_sec(*m.group(2).split(":"))
        headline = _strip_markdown(m.group(3))

        # Parse [SPOTLIGHT: item1 | item2 | ...] annotation
        spotlight_items = None
        sm = _SPOTLIGHT_RE.search(body_full)
        if sm:
            spotlight_items = [item.strip() for item in sm.group(1).split('|') if item.strip()]
            body_full = _SPOTLIGHT_RE.sub('', body_full).strip()

        bullets.append(AnimationBullet(
            time_from_sec=from_sec,
            time_to_sec=to_sec,
            headline=headline,
            body=body_full,
            spotlight_items=spotlight_items,
        ))

    return bullets


# ─── self-test ───
if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        print("Usage: python source_parser.py <path/to/source.txt>"); sys.exit(1)
    src = sys.argv[1]
    script = parse(src)
    print(f"Title: {script.title}")
    print(f"Scenes: {len(script.scenes)}")
    for s in script.scenes:
        print(f"\n── Scene {s.number}: {s.title} ({s.window_from_sec:.0f}-{s.window_to_sec:.0f}s)")
        print(f"   Narration: {len(s.narration.split())} words")
        print(f"   Animation: {len(s.animation)} bullets")
        for b in s.animation:
            print(f"     [{b.time_from_sec:>5.1f}-{b.time_to_sec:>5.1f}s] {b.headline[:60]}")
