"""Script Beat Parser — parses per-timeslice animation specs from markdown scripts.

Architectural fix #1: preserves 0:00–0:05 granularity from scripts like harness_3.txt
so it can flow through to storyboard → scene generation instead of being collapsed
to scene-level. This is the ground truth for Phase boundaries.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


_TIME = r"(\d{1,2}):(\d{2})"
# Matches bullet lines like:
#   - **0:00 – 0:05 — Black screen. Five numbers punch in.** ...
#   - **0:05-0:15 — Reveal.** ...
BEAT_LINE_RE = re.compile(
    rf"^\s*[-*]\s*\*\*\s*{_TIME}\s*[–—\-]\s*{_TIME}\s*[—–\-]\s*(.+?)\*\*(.*)$",
    re.MULTILINE,
)
SCENE_HEADER_RE = re.compile(
    r"^##\s+SCENE\s+(\d+)\b[^\n]*\((\d+):(\d{2})\s*[–—\-]\s*(\d+):(\d{2})\)",
    re.MULTILINE,
)
NARRATION_RE = re.compile(
    r"###\s+Narration\s*\n+>\s*([\s\S]+?)(?=\n###|\n##|\Z)", re.MULTILINE
)
ANIMATION_BLOCK_RE = re.compile(
    r"###\s+Animation\s*\n([\s\S]+?)(?=\n##\s|\Z)", re.MULTILINE
)


@dataclass
class AnimationBeat:
    """A single per-timeslice animation spec from the script.

    These become Phase boundaries in the generated Remotion scene —
    one Phase per beat, with pre-computed fallback frames.
    """

    start_seconds: float
    end_seconds: float
    title: str
    description: str
    sync_word: str | None = None
    elements: list[str] = field(default_factory=list)

    @property
    def duration_seconds(self) -> float:
        return max(0.1, self.end_seconds - self.start_seconds)

    def to_dict(self) -> dict:
        return {
            "start_seconds": self.start_seconds,
            "end_seconds": self.end_seconds,
            "title": self.title,
            "description": self.description,
            "sync_word": self.sync_word,
            "elements": self.elements,
        }


@dataclass
class ParsedSceneBeats:
    """All beats parsed for one scene, plus scene metadata."""

    scene_index: int
    scene_start_seconds: float
    scene_end_seconds: float
    narration: str
    beats: list[AnimationBeat]

    @property
    def scene_duration_seconds(self) -> float:
        return self.scene_end_seconds - self.scene_start_seconds

    def to_dict(self) -> dict:
        return {
            "scene_index": self.scene_index,
            "scene_start_seconds": self.scene_start_seconds,
            "scene_end_seconds": self.scene_end_seconds,
            "narration": self.narration,
            "beats": [b.to_dict() for b in self.beats],
        }


def _mmss_to_seconds(mm: str | int, ss: str | int) -> float:
    return int(mm) * 60 + int(ss)


def _pick_sync_word(narration: str, description: str) -> str | None:
    """Heuristic: pick the most distinctive word in the description that appears
    in the narration — that word becomes the Phase `trigger`."""
    if not narration or not description:
        return None
    narr_words = {
        w.lower().strip(".,!?;:'\"()")
        for w in narration.split()
        if len(w) > 3
    }
    # Score by length (longer words are more distinctive); prefer proper nouns.
    candidates = []
    for raw in re.findall(r"[A-Za-z][A-Za-z'\-]+", description):
        w = raw.lower().strip(".,!?;:'\"()")
        if len(w) < 4 or w in _STOPWORDS:
            continue
        if w in narr_words:
            score = len(w) + (5 if raw[0].isupper() else 0)
            candidates.append((score, raw))
    if not candidates:
        return None
    candidates.sort(reverse=True)
    return candidates[0][1]


_STOPWORDS = {
    "the", "and", "then", "with", "this", "that", "from", "into", "onto",
    "over", "under", "screen", "frame", "seconds", "starts", "ends",
    "fade", "fades", "appears", "types", "flies", "slides", "slams",
    "narration", "viewer", "narrator", "caption", "text", "animation",
    "still", "black", "white", "after", "before", "right", "left", "center",
}


def _extract_elements(description: str) -> list[str]:
    """Pull short element phrases from backticks / bold emphasis in the description.
    These help the LLM know *what* to render, not just the mood."""
    elements: list[str] = []
    elements.extend(re.findall(r"`([^`]{1,60})`", description))
    elements.extend(re.findall(r"\*\*([^*]{1,60})\*\*", description))
    # Dedupe while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for el in elements:
        key = el.strip().lower()
        if key and key not in seen:
            seen.add(key)
            unique.append(el.strip())
    return unique


def _parse_beats_block(
    block: str, scene_start_seconds: float, narration: str
) -> list[AnimationBeat]:
    beats: list[AnimationBeat] = []
    for match in BEAT_LINE_RE.finditer(block):
        start_mm, start_ss, end_mm, end_ss, title, rest = match.groups()
        # Times in the script are *relative to the scene start*
        rel_start = _mmss_to_seconds(start_mm, start_ss)
        rel_end = _mmss_to_seconds(end_mm, end_ss)

        # Collect body lines until the next beat (or end of block)
        body_start = match.end()
        next_match = BEAT_LINE_RE.search(block, body_start)
        body_end = next_match.start() if next_match else len(block)
        body = (rest + "\n" + block[body_start:body_end]).strip()

        description = f"{title.strip()} {body}".strip()
        sync_word = _pick_sync_word(narration, description)
        elements = _extract_elements(description)

        beats.append(
            AnimationBeat(
                start_seconds=scene_start_seconds + rel_start,
                end_seconds=scene_start_seconds + rel_end,
                title=title.strip(),
                description=description[:2000],
                sync_word=sync_word,
                elements=elements,
            )
        )
    return beats


def parse_script_beats(markdown: str) -> list[ParsedSceneBeats]:
    """Parse a markdown script (e.g. harness_3.txt) into per-scene beat lists.

    Returns one entry per `## SCENE N — ... (mm:ss – mm:ss)` header found.
    Scenes without an Animation block yield a synthetic single-beat covering
    the full scene — so downstream never sees an empty beat list.
    """
    scene_headers = list(SCENE_HEADER_RE.finditer(markdown))
    if not scene_headers:
        return []

    parsed: list[ParsedSceneBeats] = []
    for i, header in enumerate(scene_headers):
        scene_num = int(header.group(1))
        scene_start = _mmss_to_seconds(header.group(2), header.group(3))
        scene_end = _mmss_to_seconds(header.group(4), header.group(5))

        section_start = header.end()
        section_end = (
            scene_headers[i + 1].start()
            if i + 1 < len(scene_headers)
            else len(markdown)
        )
        section = markdown[section_start:section_end]

        narr_match = NARRATION_RE.search(section)
        narration = narr_match.group(1).strip() if narr_match else ""

        anim_match = ANIMATION_BLOCK_RE.search(section)
        beats: list[AnimationBeat] = []
        if anim_match:
            beats = _parse_beats_block(anim_match.group(1), scene_start, narration)

        if not beats:
            beats = [
                AnimationBeat(
                    start_seconds=scene_start,
                    end_seconds=scene_end,
                    title=f"Scene {scene_num}",
                    description=narration[:500],
                )
            ]

        parsed.append(
            ParsedSceneBeats(
                scene_index=scene_num - 1,
                scene_start_seconds=float(scene_start),
                scene_end_seconds=float(scene_end),
                narration=narration,
                beats=beats,
            )
        )
    return parsed


def parse_script_file(path: str | Path) -> list[ParsedSceneBeats]:
    return parse_script_beats(Path(path).read_text(encoding="utf-8"))


def fill_beat_gaps(
    scene: ParsedSceneBeats,
    *,
    max_internal_gap_seconds: float = 0.25,
) -> ParsedSceneBeats:
    """Return a copy of `scene` with gap-filler beats inserted.

    Any internal gap > max_internal_gap_seconds between consecutive beats is
    bridged by a synthetic beat (title `(bridge)`, no sync_word so the Phase
    falls back to fallbackStart/End). Head/tail gaps are bridged too.

    This is the parser-side guarantee for architectural fix #3: after this
    pass, beats tile the entire scene with no silent gaps, so each <Phase>
    drawn from them covers the full duration.
    """
    scene_start = scene.scene_start_seconds
    scene_end = scene.scene_end_seconds
    sorted_beats = sorted(scene.beats, key=lambda b: b.start_seconds)

    filled: list[AnimationBeat] = []

    def _bridge(start: float, end: float, why: str) -> AnimationBeat:
        return AnimationBeat(
            start_seconds=max(scene_start, start),
            end_seconds=min(scene_end, end),
            title="(bridge)",
            description=(
                f"Continuity bridge ({why}). Hold ambient motion and any "
                f"persistent elements so the scene never goes blank."
            ),
            sync_word=None,
        )

    # Head gap
    if sorted_beats and sorted_beats[0].start_seconds - scene_start > max_internal_gap_seconds:
        filled.append(_bridge(scene_start, sorted_beats[0].start_seconds, "head"))

    # Body + internal gaps
    for i, b in enumerate(sorted_beats):
        filled.append(b)
        if i + 1 < len(sorted_beats):
            gap = sorted_beats[i + 1].start_seconds - b.end_seconds
            if gap > max_internal_gap_seconds:
                filled.append(
                    _bridge(b.end_seconds, sorted_beats[i + 1].start_seconds, "internal")
                )

    # Tail gap
    if sorted_beats and scene_end - sorted_beats[-1].end_seconds > max_internal_gap_seconds:
        filled.append(_bridge(sorted_beats[-1].end_seconds, scene_end, "tail"))

    # If no beats at all, single bridge covering the entire scene
    if not sorted_beats:
        filled.append(_bridge(scene_start, scene_end, "empty"))

    return ParsedSceneBeats(
        scene_index=scene.scene_index,
        scene_start_seconds=scene.scene_start_seconds,
        scene_end_seconds=scene.scene_end_seconds,
        narration=scene.narration,
        beats=filled,
    )
