"""skill_coverage.py — per-project SKILL-INVOCATION coverage: which skills ran, which were MISSED.

The pipeline's quality IS its skills — a skill silently skipped is how output goes flat. `bug_stats.py`
already records WHICH skills were invoked (the `### Skills invoked` track in verification.md) and computes
invoked-but-still-bugged. This tool answers the other half: **for THIS project, was every MANDATORY skill
invoked, and where are the gaps?** — expected vs actual, per scene and project-wide.

Two expected sets (the pipeline's own non-skippable floor — decision structure, not topic content):
  PER-SCENE   — must appear in EVERY scene's author track (you can't author a scene without them).
  PROJECT     — must appear at least ONCE (the final gate battery, run on the assembled master).

Usage:
    python -m storyboard.skill_coverage <project> [--strict]

Reads projects/<project>/verification.md (the `### Skills invoked` blocks).
Exit 0 = full coverage (or nothing to check — WARN); prints MISSED skills; --strict → exit 1 on any gap.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from storyboard.bug_stats import _parse_invoked

ROOT = Path(__file__).resolve().parent.parent

# The non-skippable authoring floor for EVERY scene (video_generation flow steps 3-4 + 6b).
PER_SCENE_MANDATORY = {
    "vg-visual-map",        # decide the visual
    "vg-render-code",       # author (the golden order)
    "vg-code-vchecks",      # pass the V-checks by construction
    "vg-code-tokens",       # tokens-only / determinism
}
# The final gate battery — must run at least ONCE on the assembled master (step 8).
PROJECT_MANDATORY = {
    "vg-verification-protocol",
    "vg-visual-quality",
    "vg-quality-audio",
    "vg-output-validation",
    "video-narrative-editor",
    "vg-scene-validator",
    "vg-youtube-validation",
}


def run(project: str, strict: bool) -> int:
    md = ROOT / "projects" / project / "verification.md"
    if not md.exists():
        print(f"skill_coverage: no verification.md at {md}")
        return 0
    invoked_by_scene = _parse_invoked(md)
    if not invoked_by_scene:
        print(f"skill_coverage: WARN — no '### Skills invoked' blocks in {md.name} "
              f"(the INVOCATION track is undocumented; nothing to verify — record it per scene "
              f"per vg-verification-protocol §Skills invoked).")
        return 0

    all_invoked: set = set()
    for sk in invoked_by_scene.values():
        all_invoked.update(sk)

    problems: list[str] = []

    # per-scene coverage
    for scene in sorted(invoked_by_scene):
        got = set(invoked_by_scene[scene])
        missed = PER_SCENE_MANDATORY - got
        if missed:
            problems.append(f"scene {scene}: MISSED author skill(s) {sorted(missed)}")

    # project-level battery coverage
    missed_project = PROJECT_MANDATORY - all_invoked
    if missed_project:
        problems.append(f"PROJECT battery: MISSED gate skill(s) {sorted(missed_project)} "
                        f"— the master was certified without them")

    n_scenes = len(invoked_by_scene)
    per_scene_ok = n_scenes - sum(1 for s in invoked_by_scene
                                  if PER_SCENE_MANDATORY - set(invoked_by_scene[s]))
    battery_ok = len(PROJECT_MANDATORY & all_invoked)
    print(f"SKILL-COVERAGE: scenes={n_scenes} per-scene-floor-ok={per_scene_ok}/{n_scenes} "
          f"battery={battery_ok}/{len(PROJECT_MANDATORY)} distinct-skills-invoked={len(all_invoked)}")
    for p in problems:
        print("  •", p)
    if problems and strict:
        return 1
    if not problems:
        print("  full coverage — every mandatory skill was invoked.")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("project")
    ap.add_argument("--strict", action="store_true", help="exit 1 on any coverage gap")
    args = ap.parse_args()
    sys.exit(run(args.project, args.strict))
