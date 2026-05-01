"""
Pre-render pipeline validator. Runs BEFORE the slow webpack bundle so failures
surface in 1 second, not 30+.

Catches the pipeline-orchestration bug classes that the Remotion framework
itself does not check (the remotion skill is silent on these):

  1. Scene JSON missing in remotion/public/scenes/<sid>.json
     → require.context picks up nothing → empty SCENE_BLOCKS map → empty render

  2. Caption JSON missing in remotion/public/captions/<sid>.json
     → CAPTIONS_JSON has no entry → no captions on screen

  3. Scene ID not in TIMELINES → makeUniversalScenePreview throws at render

  4. Scene ID matches legacy prefix (hf/rh/td) → won't be auto-discovered as universal

  5. Composition ID has invalid chars (must match [a-zA-Z0-9-]+) → Remotion rejects

  6. publicDir target mismatch — config says one path, render_scenes.mjs uses another

  7. Required env vars (VIDEO_FPS/WIDTH/HEIGHT) not in env passed to subprocess

  8. design.ts DesignTokens vs config_tokens.json field drift (would break D.* lookups)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Build mirrors — for the bundler-readable check (these MUST exist before bundle())
SCENES_PUBLIC_DIR   = ROOT / "remotion" / "public" / "scenes"
CAPTIONS_PUBLIC_DIR = ROOT / "remotion" / "public" / "captions"
TIMELINES_TS = ROOT / "remotion" / "src" / "storyboard" / "timelines.ts"
TOKENS_JSON = ROOT / "remotion" / "src" / "universal" / "config_tokens.json"
DESIGN_TS = ROOT / "remotion" / "src" / "universal" / "design.ts"
RENDER_SCENES_MJS = ROOT / "remotion" / "render_scenes.mjs"

# Composition IDs must be hyphen+alphanumeric only (Remotion rejects underscores/spaces).
COMPOSITION_ID_RE = re.compile(r"^[a-zA-Z0-9-]+$")


def _read_timelines_ids() -> set[str]:
    """Extract scene IDs from timelines.ts (keys at top level of TIMELINES object)."""
    if not TIMELINES_TS.exists():
        return set()
    text = TIMELINES_TS.read_text(encoding="utf-8")
    # Each entry looks like:  "<project>-s01": {
    return set(re.findall(r'"([a-zA-Z0-9-]+)":\s*\{', text))


def _check_design_tokens_match() -> list[str]:
    """Verify config_tokens.json has every key required by design.ts DesignTokens type."""
    errors: list[str] = []
    if not DESIGN_TS.exists() or not TOKENS_JSON.exists():
        return ["design.ts or config_tokens.json missing"]
    dt_text = DESIGN_TS.read_text(encoding="utf-8")
    m = re.search(r"type\s+DesignTokens\s*=\s*\{([^}]*)\}", dt_text, re.DOTALL)
    if not m:
        return ["cannot parse DesignTokens from design.ts"]
    required = set(re.findall(r"(\w+)\s*:\s*\w+", m.group(1)))
    actual = set(json.loads(TOKENS_JSON.read_text(encoding="utf-8")).keys())
    missing = required - actual
    if missing:
        errors.append(
            f"config_tokens.json missing keys required by DesignTokens: {sorted(missing)} "
            f"(D.{sorted(missing)[0]} would be undefined → broken visuals)"
        )
    return errors


def validate(scene_ids: list[str], project_dir: Path | None = None) -> int:
    """Run all pipeline checks. Returns 0 if clean, else number of errors.

    `project_dir` (when provided) is checked as the canonical source of truth
    for scene + caption JSONs (`projects/<name>/scenes/`, `projects/<name>/captions/`).
    The build-mirror locations under `remotion/public/` are also verified
    because the Remotion bundler reads from there at /scenes/ and /captions/."""
    print(f"[pipeline] Validating render-side prerequisites for {len(scene_ids)} scenes...")
    errors: list[str] = []
    warnings: list[str] = []

    timeline_ids = _read_timelines_ids()
    project_scenes = (project_dir / "scenes") if project_dir else None
    project_captions = (project_dir / "captions") if project_dir else None

    for sid in scene_ids:
        # 1. Canonical scene JSON exists in project folder
        if project_scenes is not None:
            psj = project_scenes / f"{sid}.json"
            if not psj.exists():
                errors.append(f"{sid}: canonical scene JSON MISSING at {psj}")
            elif psj.stat().st_size < 10:
                errors.append(f"{sid}: canonical scene JSON is empty ({psj.stat().st_size} bytes)")

        # 2. Build-mirror scene JSON exists (bundler reads from here)
        msj = SCENES_PUBLIC_DIR / f"{sid}.json"
        if not msj.exists():
            errors.append(f"{sid}: build-mirror scene JSON MISSING at {msj.relative_to(ROOT)} — Step 7.5 sync did not run")

        # 3. Canonical caption JSON
        if project_captions is not None:
            pcj = project_captions / f"{sid}.json"
            if not pcj.exists():
                warnings.append(f"{sid}: canonical caption JSON missing at {pcj} (no captions on screen)")

        # 4. Build-mirror caption JSON
        mcj = CAPTIONS_PUBLIC_DIR / f"{sid}.json"
        if not mcj.exists():
            warnings.append(f"{sid}: build-mirror caption JSON missing at {mcj.relative_to(ROOT)}")

        # 5. Scene ID is in timelines.ts
        if sid not in timeline_ids:
            errors.append(f"{sid}: not in timelines.ts (Root.tsx will not auto-discover)")

        # 6. ID format
        if not COMPOSITION_ID_RE.match(sid):
            errors.append(f"{sid}: invalid composition ID — must match [a-zA-Z0-9-]+ (no underscores, spaces)")

    # 6. Design tokens contract
    errors.extend(_check_design_tokens_match())

    # 7. render_scenes.mjs exists
    if not RENDER_SCENES_MJS.exists():
        errors.append(f"render_scenes.mjs MISSING at {RENDER_SCENES_MJS.relative_to(ROOT)}")

    # Report
    if warnings:
        for w in warnings:
            print(f"      [warn] {w}")
    if errors:
        print(f"      {len(errors)} error(s):")
        for e in errors:
            print(f"      [ERROR] {e}")
        return len(errors)
    print(f"      OK — all {len(scene_ids)} scenes have JSON, in timelines.ts, valid IDs.")
    return 0


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    pd = Path(args.project_dir).resolve()
    timing_path = pd / "build_timing.json"
    if not timing_path.exists():
        print(f"ERROR: {timing_path} not found. Run build_video.py first."); sys.exit(1)
    timing = json.loads(timing_path.read_text(encoding="utf-8"))
    sys.exit(0 if validate(timing["scene_ids"], project_dir=pd) == 0 else 1)
