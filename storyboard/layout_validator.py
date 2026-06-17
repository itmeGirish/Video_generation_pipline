"""Pre-render layout validator for Pipeline A.

For each bullet's React.createElement code, run the Node bounds extractor at
several sample frames, collect every `position:'absolute'` element's bounding
box (x, y, w, h), and check for these violation classes:

  1. OUT_OF_BOUNDS         — element exceeds 1920x1080 canvas
  2. CROSS_BULLET_OVERLAP  — under additive layering, two elements from different
                             bullets occupy the same canvas region at the same frame
  3. TEXT_OVERLAP (V9)     — a text label colliding with another element in the SAME bullet
  4. LEGIBILITY_CLUTTER    — a bright payoff text sitting over a DIMMED-but-still-legible
                             background (the "thesis over a 0.3-opacity dashboard" miss that
                             reported overlap:0 because the old check ignored opacity<0.45)
  5. SPARSE_CANVAS (V5)    — the largest CONTIGUOUS empty region exceeds a threshold
                             (the "~half the frame is empty" miss; no pixel-area metric existed)
  6. CONTINUITY_GAP        — a persistent element drawn in most bullets but MISSING from one
                             that is bracketed by bullets which DO draw it (slideshow flicker)

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
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACT_SCRIPT = ROOT / "remotion" / "scripts" / "extract-bounds.mjs"
TMP_DIR = ROOT / "storyboard" / ".cache" / ".layout_tmp"
CANVAS_W = 1920
CANVAS_H = 1080
SAMPLE_COUNT = 5  # 5 frames per bullet at 25/50/75/95% positions
NODE_TIMEOUT_SEC = 15

# ── Density / occupancy tuning (gap #2: sparse-canvas) ──────────────────────
GRID_W = 24                 # 1920 / 24 = 80px cells
GRID_H = 14                 # 1080 / 14 ≈ 77px cells
SPARSE_EMPTY_FRAC = 0.44    # flag if the largest CONTIGUOUS empty rectangle exceeds this
                            # (an empty HALF ≈ 0.5; a deliberate empty third ≈ 0.30 stays clear)
# ── Continuity tuning (gap #3) ──────────────────────────────────────────────
PERSIST_FRAC = 0.7          # an element in >= this fraction of bullets counts as "persistent"
PERSIST_MIN_W = 180         # only SUBSTANTIAL elements (not nodes/dots) track as persistent
PERSIST_MIN_AREA_FRAC = 0.02  # ... and >= this fraction of canvas area


def _run_node_extract(code: str, frame: int, duration: int) -> tuple[list[dict], str | None]:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    code_file = TMP_DIR / f"_b_{abs(hash(code))}.js"
    code_file.write_text(code, encoding="utf-8")
    try:
        result = subprocess.run(
            ["node", str(EXTRACT_SCRIPT), str(code_file),
             str(frame), str(duration), str(CANVAS_W), str(CANVAS_H), "30"],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=NODE_TIMEOUT_SEC, check=False,
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


def _box_contains(outer: dict, inner: dict, slack: int = 4) -> bool:
    """True if `inner` sits fully inside `outer` (text resting on a container)."""
    return (
        inner["x"] >= outer["x"] - slack and
        inner["y"] >= outer["y"] - slack and
        inner["x"] + inner["w"] <= outer["x"] + outer["w"] + slack and
        inner["y"] + inner["h"] <= outer["y"] + outer["h"] + slack
    )


def _path_related(a: dict, b: dict) -> bool:
    """True if one element is an ancestor/descendant of the other (text INSIDE
    its own container is intentional, e.g. a label inside a card)."""
    pa, pb = a.get("path", ""), b.get("path", "")
    return pa == pb or pa.startswith(pb + ".") or pb.startswith(pa + ".")


def _box_out_of_bounds(box: dict, slack: int = 80) -> bool:
    if box["w"] >= CANVAS_W and box["h"] >= CANVAS_H:
        return False  # full-canvas backdrop, intentional
    if box.get("transformed"):
        return False  # rendered region depends on transform-origin
    if box.get("opacity", 1) < 0.05:
        return False  # invisible, can't be a collision
    return (
        box["x"] < -slack or box["y"] < -slack or
        box["x"] + box["w"] > CANVAS_W + slack or
        box["y"] + box["h"] > CANVAS_H + slack
    )


def _is_full_canvas(box: dict) -> bool:
    return box["w"] >= CANVAS_W * 0.95 and box["h"] >= CANVAS_H * 0.95


def _box_repr(b: dict) -> str:
    return f"({b['x']},{b['y']} {b['w']}x{b['h']} {b.get('role', '?')})"


# ── Content / density helpers (gap #2) ──────────────────────────────────────

def _content_boxes(bnds: list[dict]) -> list[dict]:
    """Visible, non-backdrop boxes that count as on-screen 'content' for density."""
    out = []
    for b in bnds:
        if b.get("opacity", 1) < 0.5:
            continue                       # too faint to read as content
        if _is_full_canvas(b):
            continue                       # backdrop / dot-grid / dim overlay
        w, h = b.get("w", 0) or 0, b.get("h", 0) or 0
        if w <= 0 or h <= 0:
            continue
        if w * h > CANVAS_W * CANVAS_H * 0.85:
            continue                       # near-full backdrop
        out.append(b)
    return out


def _occupancy_grid(boxes: list[dict]) -> list[list[bool]]:
    cw, ch = CANVAS_W / GRID_W, CANVAS_H / GRID_H
    grid = [[False] * GRID_W for _ in range(GRID_H)]
    for b in boxes:
        x0 = max(0, min(GRID_W - 1, int(b["x"] / cw)))
        y0 = max(0, min(GRID_H - 1, int(b["y"] / ch)))
        x1 = max(0, min(GRID_W - 1, int((b["x"] + b["w"]) / cw)))
        y1 = max(0, min(GRID_H - 1, int((b["y"] + b["h"]) / ch)))
        for gy in range(y0, y1 + 1):
            for gx in range(x0, x1 + 1):
                grid[gy][gx] = True
    return grid


def _largest_empty_frac(grid: list[list[bool]]) -> float:
    """Largest all-empty axis-aligned rectangle as a fraction of canvas
    (maximal-rectangle-in-histogram over the EMPTY cells — O(GW*GH))."""
    gh = len(grid)
    gw = len(grid[0]) if gh else 0
    if not gh or not gw:
        return 0.0
    heights = [0] * gw
    best = 0
    for gy in range(gh):
        for gx in range(gw):
            heights[gx] = heights[gx] + 1 if not grid[gy][gx] else 0
        stack: list[tuple[int, int]] = []
        for i in range(gw + 1):
            cur = heights[i] if i < gw else 0
            start = i
            while stack and stack[-1][1] >= cur:
                s_i, s_h = stack.pop()
                best = max(best, s_h * (i - s_i))
                start = s_i
            stack.append((start, cur))
    return best / float(gw * gh)


def _persist_sig(b: dict) -> tuple:
    """Coarse position+role identity for a content box, tolerant to small shifts —
    used to track a persistent element across a scene's bullets (gap #3)."""
    return (b.get("role", "?"), round(b["x"] / 80), round(b["y"] / 80), round(b["w"] / 120))


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

    # A bullet whose code returns an AbsoluteFill backdrop is REPLACE — it HIDES all
    # earlier bullets (A6 convention). Used to suppress false cross-bullet overlaps.
    replace_bullets = {i for i, b in enumerate(blocks) if "AbsoluteFill" in b.get("code", "")}
    per_bullet_sigs: dict[int, set] = {}   # gap #3: each bullet's own settled element signatures
    clutter_seen: set = set()              # gap #1: dedupe legibility_clutter across settled samples

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

            # Which earlier bullets are hidden under a later REPLACE backdrop.
            _replace_idxs = [vidx for vidx, _b in simul if vidx in replace_bullets]
            _visible_from = max(_replace_idxs) if _replace_idxs else -1

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

            # WITHIN-BULLET TEXT OVERLAP (V9) + LEGIBILITY CLUTTER — at SETTLED frames only.
            if off >= int(duration * 0.84):
                for vidx, bnds in simul:
                    if vidx != bidx:
                        continue  # only the bullet being sampled, at its own settled frame
                    canvas_area = CANVAS_W * CANVAS_H

                    # ── V9: full-opacity element-vs-text collisions ──
                    vis = [b for b in bnds
                           if b.get("opacity", 1) >= 0.45 and not _is_full_canvas(b)]
                    for i in range(len(vis)):
                        for j in range(i + 1, len(vis)):
                            ba, bb = vis[i], vis[j]
                            ta, tb = ba.get("kind") == "text", bb.get("kind") == "text"
                            if not ta and not tb:
                                continue  # need at least one readable text label
                            if _path_related(ba, bb):
                                continue  # label inside its own card/panel — intentional
                            if not _boxes_overlap(ba, bb, slack=6):
                                continue
                            if ta and tb:
                                pass  # two labels colliding = always a real overlap
                            else:
                                text_el = ba if ta else bb
                                other = bb if ta else ba
                                if other["w"] * other["h"] > canvas_area * 0.10:
                                    continue  # panel / surface — text rides on it
                                if _box_contains(other, text_el):
                                    continue  # label intentionally inside a small card/button
                            txt = (ba.get("text") if ta else bb.get("text")) or "?"
                            violations.append({
                                "scene": scene_id, "bullet": vidx + 1, "scene_frame": scene_frame,
                                "type": "text_overlap", "box_a": ba, "box_b": bb,
                                "msg": (f"s={scene_id} b{vidx+1} @settled: text {txt!r} "
                                        f"{_box_repr(ba)} overlaps {_box_repr(bb)} — V9: move the label clear"),
                            })

                    # ── LEGIBILITY CLUTTER (gap #1): bright payoff text over a DIMMED-but-legible
                    #    background. The old V9 only looked at opacity>=0.45, so a thesis over a
                    #    0.15-0.40 dashboard reported overlap:0 (real miss: fable_5_power S7 B5 / S4 B5).
                    #    Suppressed when a full-canvas dim OVERLAY (opacity 0.4-0.95) occludes the
                    #    background — that is the correct "clean stage" fix and composites it away.
                    has_dim_overlay = any(
                        _is_full_canvas(b) and 0.4 <= b.get("opacity", 1) < 0.95 for b in bnds
                    )
                    if not has_dim_overlay:
                        bright_text = [b for b in bnds
                                       if b.get("kind") == "text" and b.get("opacity", 1) >= 0.7
                                       and not _is_full_canvas(b)]
                        dim_legible = [b for b in bnds
                                       if 0.12 <= b.get("opacity", 1) < 0.5
                                       and (b.get("kind") == "text" or b.get("text"))
                                       and not _is_full_canvas(b)]
                        for tb in bright_text:
                            for db in dim_legible:
                                if _path_related(tb, db):
                                    continue
                                if not _boxes_overlap(tb, db, slack=6):
                                    continue
                                key = (bidx, round(tb["x"]), round(tb["y"]))
                                if key in clutter_seen:
                                    continue
                                clutter_seen.add(key)
                                violations.append({
                                    "scene": scene_id, "bullet": vidx + 1, "scene_frame": scene_frame,
                                    "type": "legibility_clutter", "box_a": tb, "box_b": db,
                                    "msg": (f"s={scene_id} b{vidx+1} @settled: bright text "
                                            f"{(tb.get('text') or '?')!r} sits over dimmed legible "
                                            f"{_box_repr(db)} (opacity {db.get('opacity', 1):.2f}) with no "
                                            f"dim overlay — payoff clutter; add a D.bg dim overlay or clear "
                                            f"the background so it lands on a clean stage"),
                                })
                                break

            # DENSITY (gap #2) + PERSISTENT-ELEMENT signatures (gap #3) — at the most-settled sample.
            if off >= int(duration * 0.92):
                vis_content: list[dict] = []
                for vidx, bnds in simul:
                    if vidx < _visible_from:
                        continue  # hidden under a later REPLACE backdrop
                    vis_content.extend(_content_boxes(bnds))
                empty_frac = _largest_empty_frac(_occupancy_grid(vis_content))
                # The opener (hook) and the final bullet (thesis / final-hold) are legitimately
                # minimal — exempt them; a sparse MIDDLE bullet is the real failure (S7 B2).
                is_edge_bullet = (bidx == 0 or bidx == len(blocks) - 1)
                if empty_frac > SPARSE_EMPTY_FRAC and not is_edge_bullet:
                    violations.append({
                        "scene": scene_id, "bullet": bidx + 1, "scene_frame": scene_frame,
                        "type": "sparse_canvas",
                        "msg": (f"s={scene_id} b{bidx+1} @settled: largest CONTIGUOUS empty region is "
                                f"{empty_frac*100:.0f}% of canvas (> {SPARSE_EMPTY_FRAC*100:.0f}%) — "
                                f"V5 density: fill the empty zone (draw pending tiers dim) or enlarge content"),
                    })
                # record THIS bullet's OWN settled signatures (substantial elements only) for the continuity diff
                for vidx, bnds in simul:
                    if vidx == bidx:
                        per_bullet_sigs[bidx] = {
                            _persist_sig(b) for b in _content_boxes(bnds)
                            if b["w"] >= PERSIST_MIN_W
                            and b["w"] * b["h"] >= PERSIST_MIN_AREA_FRAC * CANVAS_W * CANVAS_H
                        }

            # CROSS_BULLET_OVERLAP — pair-wise bounds across bullets visible simultaneously.
            flat: list[tuple[int, dict]] = []
            for vidx, bnds in simul:
                if vidx < _visible_from:
                    continue  # hidden under a later REPLACE backdrop
                for box in bnds:
                    if _is_full_canvas(box):
                        continue
                    if box.get("transformed"):
                        continue  # transform-origin / rotation makes box meaningless
                    if box.get("opacity", 1) < 0.2:
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

    # ── PERSISTENT-ELEMENT CONTINUITY (gap #3) ──────────────────────────────
    # A content element drawn in most bullets but MISSING from one that is BRACKETED
    # by bullets which DO draw it = a slideshow flicker (real miss: fable_5_power S3 B3
    # dropped the day-timeline that B1/B2/B4/B5 all carried). The bracketing rule spares
    # an element legitimately introduced late or dropped on the final thesis bullet.
    n = len(blocks)
    if n >= 3 and per_bullet_sigs:
        present: dict[tuple, set] = defaultdict(set)
        for bi, sigs in per_bullet_sigs.items():
            for s in sigs:
                present[s].add(bi)
        recorded = sorted(per_bullet_sigs.keys())
        threshold = max(2, int(round(n * PERSIST_FRAC)))
        flagged_bullets: set[int] = set()
        for s, idxs in sorted(present.items(), key=lambda kv: -len(kv[1])):
            if len(idxs) < threshold:
                continue  # not a persistent element
            for m in recorded:
                if m in idxs or m in flagged_bullets:
                    continue
                if any(i < m for i in idxs) and any(i > m for i in idxs):
                    flagged_bullets.add(m)
                    violations.append({
                        "scene": scene_id, "bullet": m + 1,
                        "type": "continuity_gap",
                        "msg": (f"s={scene_id} b{m+1}: a persistent element {s} present in "
                                f"{len(idxs)}/{n} bullets is MISSING here (bracketed before+after) "
                                f"— cross-beat continuity flicker; redraw it in this bullet"),
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
