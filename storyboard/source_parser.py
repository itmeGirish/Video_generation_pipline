"""
Parse a source script (projects/<name>/source.txt) into a structured SourceScript.

Two formats are supported (auto-detected per scene):

LEGACY FORMAT — separate narration + animation sections:
    ## SCENE N — "Title" (M:SS – M:SS)
    ### Narration
    > narration text (single block, may span multiple lines)
    ### Animation
    - **0:00 – 0:08 — Hard cut. Plain horse silhouette.** Body text...
    - **0:08 – 0:18 — Title.** Body...

PAIR-BLOCK FORMAT — narration + animation coupled per bullet (anchor MUST appear
in the bullet's own narration; eliminates the dual-source-of-truth sync bug):
    ## SCENE N — "Title" (M:SS – M:SS)
    - **0:00 – 0:08 — Hard cut. Plain horse silhouette.**
      > narration sentence(s) for THIS bullet. <pause 0.4s>
      Body / animation description...
      audio_anchor: silhouette
    - **0:08 – 0:18 — Title.**
      > next narration sentence(s).
      Body...

In pair-block mode, scene.narration is reassembled by concatenating each
bullet's narration in order — downstream TTS/Whisper/anchor pipeline runs
identically. Detection: a scene with no `### Animation` header is pair-block.

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

    # Per-scene structure: legacy needs both ### Narration and ### Animation;
    # pair-block has neither but must have bullets with `> narration` lines.
    scenes = list(_SCENE_HEADER.finditer(text))
    for i, m in enumerate(scenes):
        body_start = m.end()
        body_end = scenes[i + 1].start() if i + 1 < len(scenes) else len(text)
        body = text[body_start:body_end]
        if _is_pair_block_scene(body):
            bullets = list(_ANIM_BULLET.finditer(body))
            if not bullets:
                warnings.append(f"scene {m.group(1)}: pair-block format but no bullets found")
                continue
            for b in bullets:
                # find this bullet's slice and check for at least one `> ` narration line
                b_start = b.end()
                next_b = next((bn for bn in bullets if bn.start() > b_start), None)
                b_end = next_b.start() if next_b else body_end - body_start
                slice_ = body[b_start:b_end]
                if not any(ln.strip().startswith(">") for ln in slice_.splitlines()):
                    warnings.append(
                        f"scene {m.group(1)} bullet {b.group(1)}–{b.group(2)}: "
                        f"pair-block bullet has no `> narration` line"
                    )
        else:
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

        pacing = _extract_pacing(body)

        if _is_pair_block_scene(body):
            narration, animation = _extract_pair_blocks(body)
            if not animation:
                raise ValueError(
                    f"Scene {scene_num} '{scene_title}' (pair-block format) has no bullets"
                )
            if not narration:
                raise ValueError(
                    f"Scene {scene_num} '{scene_title}' (pair-block format) has no '> narration' lines inside its bullets"
                )
        else:
            narration = _extract_narration(body)
            animation = _extract_animation(body)
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
    # ONLY `>`-prefixed lines are narration. Any other text inside the section —
    # blueprint footer fields placed after the narration (EXIT TRANSITION /
    # NEXT SCENE HOOK / ON-SCREEN TEXT) or trailing build-notes — is design
    # scaffolding and must NOT be spoken. The old version appended EVERY non-empty
    # line, which leaked the template footer straight into the TTS audio (the
    # voice read "exit transition, battery docks to the corner…"), shifting every
    # anchor. All legacy scripts use `>`-prefixed narration, so this is behavior-
    # preserving for them and a correctness fix for the blueprint template.
    lines = [line.strip()[1:].strip()
             for line in raw.splitlines()
             if line.strip().startswith(">")]
    return _strip_markdown(" ".join(lines))


def _extract_pacing(body: str) -> str:
    return _extract_section(body, "Pacing")


# Spotlight annotation: [SPOTLIGHT: item1 | item2 | item3] anywhere in bullet body/tail
_SPOTLIGHT_RE = re.compile(r'\[SPOTLIGHT:\s*([^\]]+)\]', re.IGNORECASE)


# Animation bullet pattern: top-level "- " bullets with bold time-window header.
# `[ \t]*(.*)$` at the end restricts capture of the first-line tail to the SAME
# line as the header (legacy + pair-block both rely on this — otherwise `\s*`
# eats the newline and group(4) leaks into the next line).
_ANIM_BULLET = re.compile(
    r"^-\s+\*\*(\d+:\d{2})\s*[–-]\s*(\d+:\d{2})\s*[—-]\s*(.+?)\*\*[ \t]*(.*)$",
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


# ─── pair-block format (narration + animation coupled per bullet) ───
def _is_pair_block_scene(body: str) -> bool:
    """A scene is pair-block when it has no `### Animation` section header.

    Pair-block scenes interleave narration (`> ...` lines) with each bullet's
    animation description. Detection by absence of the legacy `### Animation`
    marker is sufficient — if a scene has bullets but no Animation header, the
    narration must live inside them.
    """
    return _SECTION_RE.search(body) is None or not any(
        m.group(1).lower() in ("animation", "narration")
        for m in _SECTION_RE.finditer(body)
    )


def _extract_pair_blocks(body: str) -> tuple[str, list[AnimationBullet]]:
    """Pair-block parser. Each bullet body contains:
      - one or more `> narration` lines (the spoken sentences for THIS bullet)
      - the animation description (everything else)
    Returns (concatenated_narration, animation_bullets).
    """
    matches = list(_ANIM_BULLET.finditer(body))
    bullets: list[AnimationBullet] = []
    narration_parts: list[str] = []

    for i, m in enumerate(matches):
        start_body = m.end()
        end_body = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        block = body[start_body:end_body]

        narr_lines: list[str] = []
        anim_lines: list[str] = []
        for line in block.splitlines():
            stripped = line.strip()
            if stripped.startswith(">"):
                narr_lines.append(stripped[1:].strip())
            else:
                anim_lines.append(line)

        first_tail = m.group(4).strip()
        anim_body_raw = " ".join([first_tail] + anim_lines).strip() if first_tail else " ".join(anim_lines)
        body_full = _strip_markdown(anim_body_raw)

        if narr_lines:
            narration_parts.append(" ".join(narr_lines))

        from_sec = _to_sec(*m.group(1).split(":"))
        to_sec = _to_sec(*m.group(2).split(":"))
        headline = _strip_markdown(m.group(3))

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

    narration = _strip_markdown(" ".join(narration_parts))
    return narration, bullets


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
