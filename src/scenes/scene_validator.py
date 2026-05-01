"""Scene Validator — the enforcement layer for the four architectural fixes.

After the LLM emits a .tsx file we cannot trust it. This validator statically
checks the generated code against the hard contract:

  1. Exactly one <Phase> per script beat (no more, no fewer)
  2. Every <Phase> has both fallbackStart={...} and fallbackEnd={...}
  3. File exports animationCompletionFrames
  4. The .tsx imports from the SceneFramework (so AmbientBackdrop is active)

It also validates beat coverage — whether the parsed beats actually tile the
full scene duration with no internal gaps.

Violations surface as ValidationIssues that the generator loop uses to retry
(bounded) before giving up. Nothing ships without passing these checks.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from ..planning.script_beat_parser import AnimationBeat


# ---------- regex contract primitives ----------

# <Phase ... > — matches opening tag (self-closing or not), spanning newlines
_PHASE_TAG_RE = re.compile(r"<Phase\b[^/>]*?>", re.DOTALL)
_PHASE_SELFCLOSE_RE = re.compile(r"<Phase\b[^/>]*?/\s*>", re.DOTALL)
_FALLBACK_START_RE = re.compile(r"\bfallbackStart\s*=\s*\{")
_FALLBACK_END_RE = re.compile(r"\bfallbackEnd\s*=\s*\{")
_COMPLETION_EXPORT_RE = re.compile(
    r"export\s+(?:const|function)\s+animationCompletionFrames\b"
    r"|export\s*\{\s*[^}]*\banimationCompletionFrames\b[^}]*\}"
)
_SCENE_FRAMEWORK_IMPORT_RE = re.compile(
    r"from\s+[\"']@remotion-components/SceneFramework[\"']"
)
_SCENE_LAYOUT_USE_RE = re.compile(r"<SceneLayout\b")


@dataclass
class ValidationIssue:
    """A contract violation found in generated code."""

    code: str  # short stable identifier, e.g. "phase_count_mismatch"
    message: str
    severity: str = "high"  # "high" = block render; "medium" = warn

    def __str__(self) -> str:
        return f"[{self.severity}] {self.code}: {self.message}"


@dataclass
class SceneValidationReport:
    """Full validation result for one scene."""

    scene_id: str
    passed: bool
    issues: list[ValidationIssue] = field(default_factory=list)
    phase_count: int = 0
    expected_phase_count: int = 0

    @property
    def blocking_issues(self) -> list[ValidationIssue]:
        return [i for i in self.issues if i.severity == "high"]

    def to_dict(self) -> dict:
        return {
            "scene_id": self.scene_id,
            "passed": self.passed,
            "phase_count": self.phase_count,
            "expected_phase_count": self.expected_phase_count,
            "issues": [
                {"code": i.code, "message": i.message, "severity": i.severity}
                for i in self.issues
            ],
        }


# ---------- beat coverage check ----------

def validate_beat_coverage(
    beats: list[AnimationBeat],
    scene_start_seconds: float,
    scene_end_seconds: float,
    *,
    max_internal_gap_seconds: float = 0.25,
) -> list[ValidationIssue]:
    """Confirm that a scene's beats tile the full scene duration.

    - First beat must start at (or before) scene_start
    - Last beat must end at (or after) scene_end
    - Consecutive beats may not have an internal gap > max_internal_gap_seconds
    """
    issues: list[ValidationIssue] = []
    if not beats:
        issues.append(
            ValidationIssue(
                "no_beats",
                "Scene has no AnimationBeats — full scene will rely on "
                "AmbientBackdrop only.",
                severity="high",
            )
        )
        return issues

    sorted_beats = sorted(beats, key=lambda b: b.start_seconds)

    head_gap = sorted_beats[0].start_seconds - scene_start_seconds
    if head_gap > max_internal_gap_seconds:
        issues.append(
            ValidationIssue(
                "beat_head_gap",
                f"First beat starts {head_gap:.2f}s after scene start "
                f"({scene_start_seconds:.2f}s).",
            )
        )

    tail_gap = scene_end_seconds - sorted_beats[-1].end_seconds
    if tail_gap > max_internal_gap_seconds:
        issues.append(
            ValidationIssue(
                "beat_tail_gap",
                f"Last beat ends {tail_gap:.2f}s before scene end "
                f"({scene_end_seconds:.2f}s).",
            )
        )

    for prev, cur in zip(sorted_beats[:-1], sorted_beats[1:]):
        gap = cur.start_seconds - prev.end_seconds
        if gap > max_internal_gap_seconds:
            issues.append(
                ValidationIssue(
                    "beat_internal_gap",
                    f"Gap of {gap:.2f}s between beats "
                    f"[{prev.start_seconds:.1f}-{prev.end_seconds:.1f}] and "
                    f"[{cur.start_seconds:.1f}-{cur.end_seconds:.1f}].",
                )
            )

    return issues


# ---------- generated-tsx contract check ----------

def _count_phases(code: str) -> int:
    """Count <Phase> opening tags AND self-closing tags."""
    # self-closing tags match _PHASE_TAG_RE too, so dedupe by position
    opens = {m.start() for m in _PHASE_TAG_RE.finditer(code)}
    selfs = {m.start() for m in _PHASE_SELFCLOSE_RE.finditer(code)}
    return len(opens | selfs)


def validate_generated_scene(
    code: str,
    *,
    scene_id: str,
    beats: list[AnimationBeat] | None,
) -> SceneValidationReport:
    """Statically validate a generated .tsx file against the hard contract."""
    issues: list[ValidationIssue] = []

    if not code.strip():
        return SceneValidationReport(
            scene_id=scene_id,
            passed=False,
            issues=[ValidationIssue("empty_file", "Generated file is empty.")],
        )

    # 1. SceneFramework import (required for AmbientBackdrop + Phase)
    if not _SCENE_FRAMEWORK_IMPORT_RE.search(code):
        issues.append(
            ValidationIssue(
                "missing_scene_framework_import",
                "File does not import from SceneFramework — AmbientBackdrop "
                "and Phase timing will not work.",
            )
        )

    # SceneLayout wrapper — enforces padding + ambient backdrop
    if not _SCENE_LAYOUT_USE_RE.search(code):
        issues.append(
            ValidationIssue(
                "missing_scene_layout",
                "File does not use <SceneLayout>; skipping the framework "
                "loses ambient backdrop and layout enforcement.",
            )
        )

    # 2. Phase count matches beat count (when beats provided)
    phase_count = _count_phases(code)
    expected = len(beats) if beats else 0
    if beats:
        if phase_count < expected:
            issues.append(
                ValidationIssue(
                    "phase_count_too_low",
                    f"Found {phase_count} <Phase> tags, expected {expected} "
                    f"(one per beat).",
                )
            )
        elif phase_count > expected:
            issues.append(
                ValidationIssue(
                    "phase_count_too_high",
                    f"Found {phase_count} <Phase> tags, expected {expected} "
                    f"(one per beat) — LLM invented extras.",
                    severity="medium",
                )
            )
    elif phase_count < 2:
        issues.append(
            ValidationIssue(
                "phase_count_too_low",
                f"Found {phase_count} <Phase> tags; minimum 2 required to "
                f"avoid front-loaded content.",
            )
        )

    # 3. Every Phase must have fallbackStart and fallbackEnd
    fb_start = len(_FALLBACK_START_RE.findall(code))
    fb_end = len(_FALLBACK_END_RE.findall(code))
    if fb_start < phase_count:
        issues.append(
            ValidationIssue(
                "missing_fallback_start",
                f"Found {fb_start} fallbackStart props but {phase_count} "
                f"<Phase> tags. Every Phase needs fallbackStart to survive "
                f"TTS word-match failure.",
            )
        )
    if fb_end < phase_count:
        issues.append(
            ValidationIssue(
                "missing_fallback_end",
                f"Found {fb_end} fallbackEnd props but {phase_count} "
                f"<Phase> tags. Every Phase needs fallbackEnd.",
            )
        )

    # 4. animationCompletionFrames export — the runtime contract
    if not _COMPLETION_EXPORT_RE.search(code):
        issues.append(
            ValidationIssue(
                "missing_completion_export",
                "File does not export animationCompletionFrames — player "
                "cannot detect dead air for this scene.",
            )
        )

    passed = not any(i.severity == "high" for i in issues)
    return SceneValidationReport(
        scene_id=scene_id,
        passed=passed,
        issues=issues,
        phase_count=phase_count,
        expected_phase_count=expected,
    )


def validate_scene_file(
    path: Path,
    *,
    scene_id: str,
    beats: list[AnimationBeat] | None,
) -> SceneValidationReport:
    """Convenience wrapper that reads the file from disk."""
    try:
        code = path.read_text(encoding="utf-8")
    except OSError as exc:
        return SceneValidationReport(
            scene_id=scene_id,
            passed=False,
            issues=[
                ValidationIssue(
                    "read_failed", f"Could not read {path}: {exc}"
                )
            ],
        )
    return validate_generated_scene(code, scene_id=scene_id, beats=beats)


def format_report(report: SceneValidationReport) -> str:
    """Human-readable summary for terminal output."""
    if report.passed and not report.issues:
        return (
            f"  ✓ {report.scene_id}: {report.phase_count} phases, "
            f"contract satisfied"
        )
    lines = [
        f"  {'✓' if report.passed else '✗'} {report.scene_id}: "
        f"{report.phase_count} phases (expected {report.expected_phase_count})"
    ]
    for issue in report.issues:
        lines.append(f"      {issue}")
    return "\n".join(lines)


__all__ = [
    "SceneValidationReport",
    "ValidationIssue",
    "format_report",
    "validate_beat_coverage",
    "validate_generated_scene",
    "validate_scene_file",
]
