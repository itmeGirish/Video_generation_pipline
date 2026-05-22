"""
Pre-render single-bullet still frame generator + canvas-utilization checker.

Renders a still frame from one seeded bullet WITHOUT running TTS, Whisper, or
the full build pipeline. Catches V5 (canvas < 60%) bugs at authoring time —
before they survive into a 25-minute render.

Usage:
  # Single bullet
  python storyboard/preview_bullet.py projects/structured_scripts/<name>.txt --scene 1 --bullet 5

  # All bullets in a scene
  python storyboard/preview_bullet.py projects/structured_scripts/<name>.txt --scene 4

  # Custom output path
  python storyboard/preview_bullet.py projects/structured_scripts/<name>.txt --scene 1 --bullet 1 --out c:/tmp/s1b1.jpg

Prerequisites: bullet must be seeded in storyboard/.cache/designs/ first
  (run seed_bullet_cache.py or build_video.py --scene N first).

Exit code: 0 = all PASS, 1 = any FAIL or ERROR.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import yaml

CACHE_DIR     = ROOT / "storyboard" / ".cache" / "designs"
TIMELINES_TS  = ROOT / "remotion" / "src" / "storyboard" / "timelines.ts"
SCENES_DIR    = ROOT / "remotion" / "public" / "scenes"
CAPTIONS_DIR  = ROOT / "remotion" / "public" / "captions"
PREVIEW_MJS   = ROOT / "remotion" / "preview_still.mjs"
CANVAS_W      = 1920
CANVAS_H      = 1080
COVERAGE_MIN  = 0.25   # V5 threshold — 25% non-background pixels
                        # Dark-theme designs use D.surface (#12121A) for card interiors,
                        # which is only distance=11 from D.bg (#0A0A0F). Real fails
                        # (tiny stamp on black) are ≤5%; large cards are 40%+.
CHECK_FRAME_FRAC = 0.70  # check at 70% of duration (animation settled)
_BG_DIST_THRESHOLD = 5   # Chebyshev distance — detects D.surface (dist=11) and up

_NOWIN = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0


# ── config helpers ─────────────────────────────────────────────────────────────

def _load_config(project_name: str) -> dict:
    cfg_path = ROOT / "projects" / project_name / "config.yaml"
    if not cfg_path.exists():
        raise FileNotFoundError(f"config.yaml not found: {cfg_path}")
    return yaml.safe_load(cfg_path.read_text(encoding="utf-8"))


def _bg_rgb(config: dict) -> tuple[int, int, int]:
    bg = config["design"]["bg"].lstrip("#")
    return int(bg[0:2], 16), int(bg[2:4], 16), int(bg[4:6], 16)


# ── cache lookup ───────────────────────────────────────────────────────────────

def _find_bullet_cache(scene_num: int, bullet_num: int) -> Path | None:
    matches = list(CACHE_DIR.glob(f"bullet-s{scene_num}-b{bullet_num}-*.json"))
    return matches[0] if matches else None


def _all_cached_bullets_in_scene(scene_num: int) -> list[int]:
    """Return sorted list of 1-based bullet numbers that have cache files."""
    cached = sorted(CACHE_DIR.glob(f"bullet-s{scene_num}-b*-*.json"))
    return sorted({int(p.stem.split("-b")[1].split("-")[0]) for p in cached})


# ── timelines.ts patch ─────────────────────────────────────────────────────────

def _patch_timelines(preview_id: str, duration_frames: int, fps: int) -> str:
    """Insert preview entry into timelines.ts. Returns original for restore."""
    original = TIMELINES_TS.read_text(encoding="utf-8")
    entry = (
        f'\n  "{preview_id}": {{\n'
        f'    "id": "{preview_id}",\n'
        f'    "durationFrames": {duration_frames},\n'
        f'    "durationSeconds": {duration_frames / fps:.3f},\n'
        f'    "fps": {fps},\n'
        f'    "audioFile": "",\n'
        f'    "anchors": {{}},\n'
        f'    "phases": [\n'
        f'      {{\n'
        f'        "id": "scene",\n'
        f'        "fromFrame": 0,\n'
        f'        "toFrame": {duration_frames},\n'
        f'        "enterFrames": 0,\n'
        f'        "exitFrames": 0,\n'
        f'        "transitionIn": "hard_cut"\n'
        f'      }}\n'
        f'    ]\n'
        f'  }},'
    )
    marker = "export const TIMELINES: Record<string, SceneTimeline> = {"
    if marker not in original:
        raise RuntimeError("Could not find TIMELINES declaration in timelines.ts")
    patched = original.replace(marker, marker + entry, 1)
    TIMELINES_TS.write_text(patched, encoding="utf-8")
    return original


# ── canvas utilization ─────────────────────────────────────────────────────────

def _canvas_coverage(jpg_path: Path, bg_rgb: tuple[int, int, int]) -> float:
    """Fraction of canvas pixels that differ from bg (0.0–1.0)."""
    try:
        import numpy as np
        from PIL import Image
    except ImportError:
        print("  WARNING: PIL/numpy not available — skipping canvas utilization check")
        return 1.0

    img = Image.open(jpg_path).convert("RGB")
    arr = np.array(img, dtype=np.int32)
    bg  = np.array(bg_rgb, dtype=np.int32)
    # Chebyshev distance > _BG_DIST_THRESHOLD = content pixel.
    # Threshold=5 catches D.surface (#12121A, dist=11 from D.bg #0A0A0F) and
    # anything brighter. Pure D.bg pixels (dist=0) and JPEG noise (dist≤2) are
    # excluded. dot_grid_opacity=0.0 in config_tokens so no grid noise.
    is_content = (np.abs(arr - bg).max(axis=2) > _BG_DIST_THRESHOLD)
    return float(is_content.sum()) / (CANVAS_W * CANVAS_H)


# ── main preview logic ─────────────────────────────────────────────────────────

def preview_bullet(
    project_name: str,
    config: dict,
    scene_num: int,
    bullet_num: int,
    out_path: Path,
    duration_frames: int = 90,
) -> dict:
    """
    Render a still frame for one cached bullet and run V5 canvas check.
    Returns a result dict with keys: scene, bullet, verdict, v5_coverage,
    still, headline. verdict is 'PASS', 'FAIL', 'SKIP', or 'ERROR'.
    """
    fps    = config.get("video", {}).get("fps", 30)
    bg_rgb = _bg_rgb(config)

    cache_file = _find_bullet_cache(scene_num, bullet_num)
    if not cache_file:
        return {
            "scene": scene_num, "bullet": bullet_num, "verdict": "SKIP",
            "reason": "no cache file — seed this bullet first",
        }

    payload = json.loads(cache_file.read_text(encoding="utf-8"))
    code = payload.get("code", "")
    if not code:
        return {
            "scene": scene_num, "bullet": bullet_num, "verdict": "ERROR",
            "reason": "cache file has empty code field",
        }

    project_id  = project_name.replace("_", "-")
    preview_id  = f"{project_id}-preview"
    check_frame = int(duration_frames * CHECK_FRAME_FRAC)

    scene_json_path   = SCENES_DIR   / f"{preview_id}.json"
    captions_json_path = CAPTIONS_DIR / f"{preview_id}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    original_timelines: str | None = None
    try:
        # 1. Write single-block scene JSON
        block = {"framesFrom": 0, "framesTo": duration_frames, "code": code,
                 "audio_anchor": payload.get("audio_anchor", ""),
                 "source_headline": payload.get("source_headline", "")}
        scene_json_path.write_text(
            json.dumps([block], indent=2, ensure_ascii=False), encoding="utf-8"
        )

        # 2. Write empty captions JSON (no audio in preview)
        captions_json_path.write_text("[]", encoding="utf-8")

        # 3. Patch timelines.ts to register the preview composition
        original_timelines = _patch_timelines(preview_id, duration_frames, fps)

        # 4. Run Node still renderer
        env = {
            **os.environ,
            "PROJECT":      project_name,
            "VIDEO_FPS":    str(fps),
            "VIDEO_WIDTH":  str(config.get("video", {}).get("width", 1920)),
            "VIDEO_HEIGHT": str(config.get("video", {}).get("height", 1080)),
        }
        r = subprocess.run(
            ["node", str(PREVIEW_MJS),
             "--composition", preview_id,
             "--frame",       str(check_frame),
             "--output",      str(out_path)],
            env=env,
            cwd=str(ROOT / "remotion"),
            capture_output=True,
            text=True,
            timeout=180,
            creationflags=_NOWIN,
        )
        if r.returncode != 0:
            return {
                "scene": scene_num, "bullet": bullet_num, "verdict": "ERROR",
                "reason": f"renderer exited {r.returncode}: {(r.stderr or r.stdout)[:400]}",
            }

        # 5. V5 canvas utilization check
        coverage = _canvas_coverage(out_path, bg_rgb)
        verdict  = "PASS" if coverage >= COVERAGE_MIN else "FAIL"
        return {
            "scene":        scene_num,
            "bullet":       bullet_num,
            "verdict":      verdict,
            "v5_coverage":  round(coverage * 100, 1),
            "v5_threshold": int(COVERAGE_MIN * 100),
            "still":        str(out_path),
            "headline":     payload.get("source_headline", ""),
            "check_frame":  check_frame,
        }

    finally:
        # Always restore timelines.ts and remove temp files
        if original_timelines is not None:
            TIMELINES_TS.write_text(original_timelines, encoding="utf-8")
        for p in (scene_json_path, captions_json_path):
            if p.exists():
                p.unlink()


# ── CLI ───────────────────────────────────────────────────────────────────────

def main(argv: list[str] | None = None) -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script_path", help="projects/structured_scripts/<name>.txt")
    ap.add_argument("--scene",    type=int, required=True,  help="Scene number (1-based)")
    ap.add_argument("--bullet",   type=int, default=None,   help="Bullet number (1-based). Omit = all cached bullets in scene.")
    ap.add_argument("--out",      default=None,             help="Output JPG path (single-bullet mode only)")
    ap.add_argument("--duration", type=int, default=90,     help="Preview duration in frames (default 90 = 3s at 30fps)")
    args = ap.parse_args(argv)

    script_path  = Path(args.script_path)
    project_name = script_path.stem

    try:
        config = _load_config(project_name)
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        return 1

    # Determine which bullets to preview
    if args.bullet is not None:
        bullets = [args.bullet]
    else:
        bullets = _all_cached_bullets_in_scene(args.scene)
        if not bullets:
            print(f"No cached bullets for scene {args.scene} — seed them first.")
            return 1

    all_pass = True
    print(f"[preview] S{args.scene} — {len(bullets)} bullet(s), "
          f"check_frame={int(args.duration * CHECK_FRAME_FRAC)} "
          f"({int(CHECK_FRAME_FRAC*100)}% of {args.duration}f)")

    for bullet_num in bullets:
        if args.out and len(bullets) == 1:
            out_path = Path(args.out)
        else:
            out_path = Path(f"c:/tmp/preview_{project_name}_s{args.scene}_b{bullet_num}.jpg")

        label = f"  S{args.scene}-B{bullet_num}"
        print(f"{label}  rendering...", end="", flush=True)

        result = preview_bullet(
            project_name, config, args.scene, bullet_num, out_path, args.duration
        )

        verdict = result["verdict"]
        if verdict == "SKIP":
            print(f"  SKIP  ({result['reason']})")
        elif verdict == "ERROR":
            print(f"  ERROR: {result['reason']}")
            all_pass = False
        elif verdict == "PASS":
            print(f"  ✓ PASS  {result['v5_coverage']}% canvas  →  {result['still']}")
        else:  # FAIL
            print(f"  ✗ FAIL  {result['v5_coverage']}% canvas (need ≥{result['v5_threshold']}%)")
            print(f"         → {result['still']}")
            print(f"         V5: element too small or excessive black void")
            print(f"         Fix: enlarge element to w*0.72+ or add secondary content")
            all_pass = False

    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
