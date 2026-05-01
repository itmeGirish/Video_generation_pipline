"""Engagement scoring — architectural fix #4.

The old inspector only checked whether each sampled beat looked good. It
couldn't detect:
  - "dead air" stretches where nothing moves for seconds at a time
  - monotonous pacing (no pattern interrupt every 10–15s)
  - visual density dropping below the script's engagement bar

This module computes those metrics from a uniform frame sampling of a
rendered scene and returns per-scene scores. Inspector.py consumes the
scores and flags scenes that fall below thresholds, so the refine loop
gates on engagement, not just per-beat polish.

No heavy dependencies — uses PIL (already in requirements via Playwright)
for pixel-diff. Falls back to a no-op scorer when PIL is missing, so it
never breaks the pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Sequence

try:
    from PIL import Image, ImageChops, ImageFilter

    _PIL_AVAILABLE = True
except Exception:  # pragma: no cover - import guard only
    _PIL_AVAILABLE = False


@dataclass
class EngagementScore:
    """Per-scene engagement metrics.

    All three metrics are normalized so "higher is better", bounded [0, 1]
    where possible. `issues` lists specific defects callers can surface.
    """

    content_density: float  # fraction of sampled frames with visible movement
    pattern_interrupt_rate: float  # visual changes per 10s (target >= 1.0)
    pacing_variance: float  # stddev of inter-change gaps / mean; higher = more varied
    dead_air_spans: list[tuple[float, float]] = field(default_factory=list)
    issues: list[str] = field(default_factory=list)

    def passes(
        self,
        *,
        min_density: float = 0.75,
        min_interrupts_per_10s: float = 1.0,
    ) -> bool:
        return (
            self.content_density >= min_density
            and self.pattern_interrupt_rate >= min_interrupts_per_10s
            and not self.dead_air_spans
        )

    def to_dict(self) -> dict:
        return {
            "content_density": round(self.content_density, 3),
            "pattern_interrupt_rate": round(self.pattern_interrupt_rate, 3),
            "pacing_variance": round(self.pacing_variance, 3),
            "dead_air_spans": [[round(a, 2), round(b, 2)] for a, b in self.dead_air_spans],
            "issues": self.issues,
        }


def _frame_diff_magnitude(img_a: "Image.Image", img_b: "Image.Image") -> float:
    """Mean absolute pixel difference between two frames in [0, 1].

    Downscales + blurs to ignore microscopic TTS-induced jitter so we're
    scoring *perceptible* motion, not JPEG noise.
    """
    small_a = img_a.convert("L").resize((80, 45)).filter(ImageFilter.GaussianBlur(1))
    small_b = img_b.convert("L").resize((80, 45)).filter(ImageFilter.GaussianBlur(1))
    diff = ImageChops.difference(small_a, small_b)
    hist = diff.getdata()
    n = len(hist)
    if n == 0:
        return 0.0
    return sum(hist) / (n * 255.0)


def score_scene_engagement(
    frame_paths: Sequence[Path],
    frame_times_seconds: Sequence[float],
    *,
    motion_threshold: float = 0.012,
    dead_air_threshold_seconds: float = 2.0,
) -> EngagementScore:
    """Score a scene from uniformly-sampled frame screenshots.

    Args:
        frame_paths: Paths to PNGs sampled at regular intervals.
        frame_times_seconds: Timestamp (in the scene) for each frame.
        motion_threshold: Below this pixel-diff magnitude the frame pair
            counts as "static". Tuned for 80x45 greyscale diffs.
        dead_air_threshold_seconds: Consecutive static span longer than
            this is flagged as dead air.

    Returns:
        EngagementScore with density, pattern-interrupt rate, pacing variance,
        and a list of dead-air spans for the inspector/regenerator to act on.
    """
    if len(frame_paths) < 2:
        return EngagementScore(
            content_density=0.0,
            pattern_interrupt_rate=0.0,
            pacing_variance=0.0,
            issues=["not_enough_frames_to_score"],
        )

    if not _PIL_AVAILABLE:
        # Graceful degradation: report unknown but don't block the pipeline.
        return EngagementScore(
            content_density=1.0,
            pattern_interrupt_rate=0.0,
            pacing_variance=0.0,
            issues=["pil_unavailable_scoring_skipped"],
        )

    # Per-pair diffs
    diffs: list[float] = []
    frames = [Image.open(p) for p in frame_paths]
    try:
        for a, b in zip(frames[:-1], frames[1:]):
            diffs.append(_frame_diff_magnitude(a, b))
    finally:
        for f in frames:
            try:
                f.close()
            except Exception:
                pass

    moving = [d >= motion_threshold for d in diffs]

    # Content density — fraction of sampled intervals that had motion
    content_density = sum(moving) / max(1, len(moving))

    # Dead-air detection — runs of consecutive no-motion intervals
    dead_spans: list[tuple[float, float]] = []
    run_start: float | None = None
    run_end: float = 0.0
    for i, is_moving in enumerate(moving):
        t_start = frame_times_seconds[i]
        t_end = frame_times_seconds[i + 1]
        if not is_moving:
            if run_start is None:
                run_start = t_start
            run_end = t_end
        else:
            if run_start is not None and (run_end - run_start) >= dead_air_threshold_seconds:
                dead_spans.append((run_start, run_end))
            run_start = None
    if run_start is not None and (run_end - run_start) >= dead_air_threshold_seconds:
        dead_spans.append((run_start, run_end))

    # Pattern interrupts — count motion "events" (rising edges)
    events = 0
    prev = False
    event_times: list[float] = []
    for i, is_moving in enumerate(moving):
        if is_moving and not prev:
            events += 1
            event_times.append(frame_times_seconds[i])
        prev = is_moving
    total_scene_seconds = max(
        0.1, frame_times_seconds[-1] - frame_times_seconds[0]
    )
    pattern_interrupt_rate = events / (total_scene_seconds / 10.0)

    # Pacing variance — stddev of gaps between events, normalized by mean
    pacing_variance = 0.0
    if len(event_times) >= 3:
        gaps = [b - a for a, b in zip(event_times[:-1], event_times[1:])]
        mean_gap = sum(gaps) / len(gaps)
        if mean_gap > 0:
            var = sum((g - mean_gap) ** 2 for g in gaps) / len(gaps)
            stddev = var ** 0.5
            pacing_variance = stddev / mean_gap

    issues: list[str] = []
    if content_density < 0.75:
        issues.append(f"low_content_density ({content_density:.2f} < 0.75)")
    if pattern_interrupt_rate < 1.0:
        issues.append(
            f"monotonous_pacing ({pattern_interrupt_rate:.2f} interrupts/10s < 1.0)"
        )
    for start, end in dead_spans:
        issues.append(f"dead_air {start:.1f}s-{end:.1f}s")

    return EngagementScore(
        content_density=content_density,
        pattern_interrupt_rate=pattern_interrupt_rate,
        pacing_variance=pacing_variance,
        dead_air_spans=dead_spans,
        issues=issues,
    )


def sample_frame_paths(
    scene_dir: Path, duration_seconds: float, interval_seconds: float = 1.5
) -> list[tuple[Path, float]]:
    """Utility used by callers that haven't yet captured frames.

    Returns the list of (path, timestamp) pairs the caller should produce.
    Naming convention: `engagement_tXXXX.png` where XXXX = tenths of a second.
    """
    n = max(2, int(duration_seconds // interval_seconds) + 1)
    out: list[tuple[Path, float]] = []
    for i in range(n):
        t = min(duration_seconds, i * interval_seconds)
        tenths = int(round(t * 10))
        out.append((scene_dir / f"engagement_t{tenths:05d}.png", t))
    return out
