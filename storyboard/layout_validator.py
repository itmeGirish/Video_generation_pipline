"""Pre-render layout validator for Pipeline A.

For each bullet's React.createElement code, run the Node bounds extractor at
several sample frames, collect every `position:'absolute'` element's bounding
box (x, y, w, h), and check for two violation classes:

  1. OUT_OF_BOUNDS — element exceeds 1920x1080 canvas
  2. CROSS_BULLET_OVERLAP — under additive layering, two elements from different
     bullets occupy the same canvas region at the same frame

Used by build_video.py BEFORE the render step so layout collisions surface as
hard errors instead of being discovered after a 25-minute render.

A violation report is returned as a list of dicts; build_video.py decides
whether to warn or hard-fail (controlled by `--strict-layout` flag).

Usage:
  python -m storyboard.layout_validator <project_name>          # report only
  python -m storyboard.layout_validator <project_name> --strict # exit 1 on any violation
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACT_SCRIPT = ROOT / "remotion" / "scripts" / "extract-bounds.mjs"
TMP_DIR = ROOT / "storyboard" / ".cache" / ".layout_tmp"
CANVAS_W = 1920
CANVAS_H = 1080
SAMPLE_COUNT = 5  # 5 frames per bullet at 25/50/75/95% positions
NODE_TIMEOUT_SEC = 15


def _run_node_extract(code: str, frame: int, duration: int) -> tuple[list[dict], str | None]:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    code_file = TMP_DIR / f"_b_{abs(hash(code))}.js"
    code_file.write_text(code, encoding="utf-8")
    try:
        result = subprocess.run(
            ["node", str(EXTRACT_SCRIPT), str(code_file),
             str(frame), str(duration), str(CANVAS_W), str(CANVAS_H), "30"],
            capture_output=True, text=True, timeout=NODE_TIMEOUT_SEC, check=False,
        )
        if result.returncode != 0:
            return [], f"node exit {result.returncode}: {result.stderr[:300]}"
        try:
            data = json.loads(result.stdout)
        except json.JSONDecodeError as e:
            return [], f"bad JSON from node: {e} :: {result.stdout[:300]}"
        if "error" in data:
            return [], data["error"]
        return data.get("bounds", []), None
    except subprocess.TimeoutExpired:
        return [], f"timeout after {NODE_TIMEOUT_SEC}s"


def _boxes_overlap(a: dict, b: dict, slack: int = 4) -> bool:
    # `slack` lets touching/abutting boxes coexist (real-world rendering tolerates small overlaps).
    return not (
        a["x"] + a["w"] <= b["x"] + slack or
        b["x"] + b["w"] <= a["x"] + slack or
        a["y"] + a["h"] <= b["y"] + slack or
        b["y"] + b["h"] <= a["y"] + slack
    )


def _box_out_of_bounds(box: dict, slack: int = 80) -> bool:
    if box["w"] >= CANVAS_W and box["h"] >= CANVAS_H:
        return False  # full-canvas backdrop, intentional
    if box.get("transformed"):
        return False  # rendered region depends on transform-origin
    if (box.get("opacity") or 1) < 0.05:
        return False  # invisible, can't be a collision
    return (
        box["x"] < -slack or box["y"] < -slack or
        box["x"] + box["w"] > CANVAS_W + slack or
        box["y"] + box["h"] > CANVAS_H + slack
    )


def _box_too_small_text(box: dict) -> bool:
    # Heuristic: a "div" with width < 40 and height < 14 is unreadably small.
    # We can't introspect fontSize statically without extending the extractor.
    return False  # left as a future hook


def _is_full_canvas(box: dict) -> bool:
    return box["w"] >= CANVAS_W * 0.95 and box["h"] >= CANVAS_H * 0.95


def _box_repr(b: dict) -> str:
    return f"({b['x']},{b['y']} {b['w']}x{b['h']} {b.get('role', '?')})"


def _scene_blocks_visible_at(blocks: list[dict], scene_frame: int) -> list[tuple[int, dict]]:
    """Under additive layering, every bullet whose framesFrom <= scene_frame
    keeps rendering through scene end. Returns (bullet_idx, block) tuples for
    bullets visible at this scene-frame."""
    return [(i, b) for i, b in enumerate(blocks) if b["framesFrom"] <= scene_frame]


def validate_scene(scene_id: str, blocks: list[dict]) -> list[dict]:
    """Sample N frames per bullet's local timeline; for each sample, gather
    bounding boxes from THIS bullet plus all earlier bullets (additive
    layering) and check for collisions."""
    violations: list[dict] = []
    if not blocks:
        return violations

    scene_end = max(b["framesTo"] for b in blocks)

    for bidx, block in enumerate(blocks):
        duration = block["framesTo"] - block["framesFrom"]
        if duration <= 0:
            continue
        # Sample only POST-entrance frames. Most bullets have entrance
        # animations in the first ~20-30% (slide-in, spring scale, etc.) where
        # boxes intentionally exit canvas — we skip those.
        sample_offsets = [int(duration * frac) for frac in (0.45, 0.65, 0.85, 0.97)]
        for off in sample_offsets:
            scene_frame = block["framesFrom"] + off
            # Collect bounds for every bullet visible at scene_frame
            simul: list[tuple[int, list[dict]]] = []
            for vidx, vblock in _scene_blocks_visible_at(blocks, scene_frame):
                vlocal = scene_frame - vblock["framesFrom"]
                vdur = vblock["framesTo"] - vblock["framesFrom"]
                if vlocal < 0 or vlocal > vdur * 1.5:
                    continue
                bnds, err = _run_node_extract(vblock["code"], vlocal, vdur)
                if err:
                    violations.append({
                        "scene": scene_id, "bullet": vidx + 1, "scene_frame": scene_frame,
                        "type": "extract_error", "msg": f"bullet {vidx+1} @local {vlocal}: {err}",
                    })
                    continue
                simul.append((vidx, bnds))

            # OUT_OF_BOUNDS check (per bullet)
            for vidx, bnds in simul:
                for box in bnds:
                    if _box_out_of_bounds(box):
                        violations.append({
                            "scene": scene_id, "bullet": vidx + 1, "scene_frame": scene_frame,
                            "type": "out_of_bounds", "box": box,
                            "msg": f"s={scene_id} b{vidx+1} @{scene_frame}f: {_box_repr(box)} exceeds 1920x1080",
                        })

            # INNER ABSOLUTE positioning check (rule 19 § 0).
            # Boxes with absDepth >= 3 are nested too deep in absolute-positioning
            # (outermost=0, section=1, total-row container=2, child=3+). Inner
            # absolute siblings inside content containers should use flex/grid.
            for vidx, bnds in simul:
                for box in bnds:
                    if box.get("absDepth", 0) >= 3 and not box.get("transformed"):
                        violations.append({
                            "scene": scene_id, "bullet": vidx + 1, "scene_frame": scene_frame,
                            "type": "inner_absolute_positioning", "box": box,
                            "msg": (
                                f"s={scene_id} b{vidx+1} @{scene_frame}f: "
                                f"{_box_repr(box)} uses position:'absolute' at depth "
                                f"{box['absDepth']} — switch to flex/grid (rule 19 §0)"
                            ),
                        })

            # CROSS_BULLET_OVERLAP — pair-wise bounds across bullets visible
            #   simultaneously. Skip full-canvas boxes (REPLACE backdrops).
            flat: list[tuple[int, dict]] = []
            for vidx, bnds in simul:
                for box in bnds:
                    if _is_full_canvas(box):
                        continue
                    if box.get("transformed"):
                        continue  # transform-origin / rotation makes box meaningless
                    if (box.get("opacity") or 1) < 0.2:
                        continue  # too faint to count as a collision
                    flat.append((vidx, box))
            seen_pairs: set[tuple[int, int, int, int, int, int]] = set()
            for i in range(len(flat)):
                vi, ba = flat[i]
                for j in range(i + 1, len(flat)):
                    vj, bb = flat[j]
                    if vi == vj:
                        continue  # within-bullet overlaps are author's choice
                    if _boxes_overlap(ba, bb):
                        key = (
                            min(vi, vj), max(vi, vj),
                            ba["x"], ba["y"], bb["x"], bb["y"],
                        )
                        if key in seen_pairs:
                            continue
                        seen_pairs.add(key)
                        violations.append({
                            "scene": scene_id,
                            "bullet": min(vi, vj) + 1,
                            "scene_frame": scene_frame,
                            "type": "cross_bullet_overlap",
                            "between": [vi + 1, vj + 1],
                            "box_a": ba, "box_b": bb,
                            "msg": (
                                f"s={scene_id} b{vi+1}+b{vj+1} @{scene_frame}f: "
                                f"{_box_repr(ba)} <> {_box_repr(bb)}"
                            ),
                        })
    return violations


def validate_project(project: str) -> list[dict]:
    proj_dir = ROOT / "projects" / project / "scenes"
    if not proj_dir.exists():
        print(f"ERROR: no scenes dir at {proj_dir}", file=sys.stderr)
        return [{"type": "no_scenes", "msg": str(proj_dir)}]
    all_violations: list[dict] = []
    for scene_json in sorted(proj_dir.glob("*.json")):
        scene_id = scene_json.stem
        try:
            blocks = json.loads(scene_json.read_text(encoding="utf-8"))
        except Exception as e:
            all_violations.append({"scene": scene_id, "type": "scene_parse_error", "msg": str(e)})
            continue
        all_violations.extend(validate_scene(scene_id, blocks))
    return all_violations


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("project", help="project name (e.g. difference_txt)")
    ap.add_argument("--strict", action="store_true",
                    help="exit code 1 if any violation found")
    ap.add_argument("--max-report", type=int, default=20,
                    help="max violations to print (default 20)")
    args = ap.parse_args(argv)

    sys.stdout.reconfigure(encoding="utf-8")
    violations = validate_project(args.project)

    if not violations:
        print(f"[layout] OK — no violations in project {args.project!r}")
        return 0

    print(f"[layout] {len(violations)} violation(s) in project {args.project!r}:")
    by_type: dict[str, int] = {}
    for v in violations:
        by_type[v["type"]] = by_type.get(v["type"], 0) + 1
    for t, n in sorted(by_type.items()):
        print(f"  {t}: {n}")
    print()
    for v in violations[:args.max_report]:
        print(f"  • {v.get('msg', v)}")
    if len(violations) > args.max_report:
        print(f"  … {len(violations) - args.max_report} more")

    return 1 if args.strict else 0


if __name__ == "__main__":
    sys.exit(main())
