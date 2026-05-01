"""
Visual refinement module.

Handles Phase 3 of the refinement process: inspecting and refining scene visuals.
"""

from .beat_parser import BeatParser, parse_narration_to_beats
from .engagement_scorer import EngagementScore, score_scene_engagement
from .screenshot import ScreenshotCapture
from .inspector import VisualInspector, ClaudeCodeVisualInspector

__all__ = [
    "BeatParser",
    "parse_narration_to_beats",
    "EngagementScore",
    "score_scene_engagement",
    "ScreenshotCapture",
    "VisualInspector",
    "ClaudeCodeVisualInspector",
]
