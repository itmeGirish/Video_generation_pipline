"""telemetry_rules.py — the Rendering Intelligence RULES ENGINE (runtime telemetry vs the contract).

Verifies the RuntimeProbe's runtime telemetry (real Chromium layout boxes of every
[data-cast-id] element, emitted as render Artifacts and collected by render_master.mjs
into projects/<name>/out/telemetry/) AGAINST THE RENDER CONTRACT — deterministic rules,
not opinions. The LLM never discovers these bugs; it receives this report and repairs.
(Complements storyboard/render_intelligence.py, the PIXEL-perceptual checker: pixels
judge perception; telemetry judges CONTRACT CONFORMANCE with cast identity attached.)

Rules (each maps to a quality-triangle pillar):
  COMPOSITION
    R1 zone occupancy   — a cast element sits inside its reserved zone (stage.zones
                          occupant) whenever visible (center-in-region, with slack).
    R2 corridor bounds  — a corridor's mover stays inside its corridor while visible.
    R3 overlap          — two visible tagged elements must not materially intersect
                          (nesting — one ~containing the other — is legal structure).
  DENSITY
    R4 accumulation     — visible tagged elements at any sample <= the container budget
                          (temporal crowding no spatial check can see).
  CONSISTENCY
    R5 HOME drift       — the same cast id keeps ~the same home (center/size) across
                          scenes (the one-film rule, measured).
  MOTION
    R6 teleportation    — a visible cast element must not jump discontinuously between
                          consecutive samples (displacement bounded by elapsed frames;
                          netcode-style discontinuity detection). NOTE: easing/velocity-
                          CONTINUITY metrics (minimum-jerk-style smoothness) need denser
                          sampling than the probe's default cadence — R6 catches the
                          discontinuity class; curve quality stays with the post-render
                          motion gates until a dense-probe mode is warranted.
  TRANSITIONS
    R7 duplicate inst.  — the SAME cast id visible more than once in one sample = the
                          two-copies/ghosting class (a persistent element drawn by both
                          sides of a transition, or double-painted over the stage).
                          Single-instance is the shared-element law: one id, one element.

Usage:
    python -m storyboard.telemetry_rules <project> [--strict]

Reads  projects/<project>/out/telemetry/*.json  +  the contract
       projects/structured_scripts/<project>.json.
Exit 0 = clean (or no telemetry yet — WARN); violations print per rule; --strict → exit 1.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

VISIBLE_OP = 0.15        # below this an element is texture/premounted — not a collision party
ZONE_SLACK = 0.03        # fractional slack around zone regions (entrances/settle wobble)
OVERLAP_MIN_PX = 400     # px² — ignore hairline touches
NEST_FRAC = 0.90         # one box inside the other by >=90% = legal nesting
MAX_VISIBLE = 6          # container budget (matches contract_scorecard CONTAINERS_PER_SCENE)
HOME_DRIFT_CENTER = 0.08 # fraction of canvas the same cast id's center may drift across scenes
HOME_DRIFT_SIZE = 0.35   # relative size change allowed across scenes
TELEPORT_SPEED = 0.09    # max plausible travel per frame, as a fraction of the canvas diagonal.
                         # Calibration: the fastest legitimate sweep (full canvas in ~0.5s) is
                         # ~0.066 diag/frame; an instant jump between 5-frame samples reads as
                         # >=0.2 diag/frame. 0.09 separates them — requires the probe's 5-frame
                         # cadence (at coarser sampling a teleport averages into a plausible sweep).


def _inter(a: dict, b: dict) -> float:
    ox = max(0, min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"]))
    oy = max(0, min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"]))
    return ox * oy


def _center_in(item: dict, region: list, W: int, H: int, slack: float = ZONE_SLACK) -> bool:
    cx, cy = item["x"] + item["w"] / 2, item["y"] + item["h"] / 2
    rx, ry, rw, rh = region
    return ((rx - slack) * W <= cx <= (rx + rw + slack) * W
            and (ry - slack) * H <= cy <= (ry + rh + slack) * H)


def run(project: str, strict: bool) -> int:
    tel_dir = ROOT / "projects" / project / "out" / "telemetry"
    contract_path = ROOT / "projects" / "structured_scripts" / f"{project}.json"
    files = sorted(tel_dir.glob("*.json")) if tel_dir.exists() else []
    if not files:
        print(f"telemetry_rules: WARN — no telemetry at {tel_dir} "
              f"(render the master with the RuntimeProbe mounted, or tag elements with data-cast-id)")
        return 0
    contract = json.loads(contract_path.read_text(encoding="utf-8")) if contract_path.exists() else {}
    zones_by_scene: dict[str, list] = {}
    for sc in contract.get("scenes", []):
        sid_frag = f"s{int(sc.get('number', 0)):02d}"
        zones_by_scene[sid_frag] = ((sc.get("stage") or {}).get("zones")) or []

    v: list[str] = []
    homes: dict[str, list] = defaultdict(list)   # cast id -> [(scene, cx_frac, cy_frac, area_frac)]
    tracks: dict[tuple, list] = defaultdict(list)  # (scene, cast id) -> [(frame, cx, cy, diag)]
    n_samples = 0
    cast_seen: set = set()

    for f in files:
        t = json.loads(f.read_text(encoding="utf-8"))
        scene, frame = t.get("scene", ""), t.get("frame", 0)
        W = (t.get("canvas") or {}).get("w") or 1920
        H = (t.get("canvas") or {}).get("h") or 1080
        items = [i for i in t.get("items", []) if i.get("id")]
        n_samples += 1
        visible = [i for i in items if i.get("op", 1) >= VISIBLE_OP and i["w"] > 0 and i["h"] > 0]
        for i in items:
            cast_seen.add(i["id"])

        # R1/R2 — zone occupancy + corridor bounds
        sid_frag = scene.rsplit("-", 1)[-1] if "-s" in scene else scene
        for z in zones_by_scene.get(sid_frag, []):
            occ, region, kind = z.get("occupant"), z.get("region"), z.get("kind")
            if not (occ and isinstance(region, list) and len(region) == 4):
                continue
            for i in visible:
                if i["id"] != occ:
                    continue
                if not _center_in(i, region, W, H):
                    rule = "R2 corridor bounds" if kind == "corridor" else "R1 zone occupancy"
                    v.append(f"[COMPOSITION {rule}] {scene} f{frame}: '{occ}' outside its "
                             f"{kind} zone '{z.get('id')}'")

        # R7 — duplicate instances of one cast id (transition ghosting / double-paint)
        by_id: dict = defaultdict(int)
        for i in visible:
            by_id[i["id"]] += 1
        for cid, cnt in by_id.items():
            if cnt > 1:
                v.append(f"[TRANSITION R7 duplicate-instance] {scene} f{frame}: '{cid}' visible "
                         f"{cnt}× — two copies of one cast element (transition double-draw / "
                         f"stage double-paint); a persistent element is ONE instance")

        # R3 — overlap between visible non-nested tagged elements
        for a_i in range(len(visible)):
            for b_i in range(a_i + 1, len(visible)):
                a, b = visible[a_i], visible[b_i]
                if a["id"] == b["id"]:
                    continue
                inter = _inter(a, b)
                if inter < OVERLAP_MIN_PX:
                    continue
                area_a, area_b = a["w"] * a["h"], b["w"] * b["h"]
                if min(area_a, area_b) and inter / min(area_a, area_b) >= NEST_FRAC:
                    continue  # nesting — legal structure
                v.append(f"[COMPOSITION R3 overlap] {scene} f{frame}: '{a['id']}' ∩ '{b['id']}' "
                         f"= {int(inter)}px²")

        # R4 — accumulation (temporal density)
        if len(visible) > MAX_VISIBLE:
            v.append(f"[DENSITY R4 accumulation] {scene} f{frame}: {len(visible)} cast elements "
                     f"visible (> {MAX_VISIBLE}) — retire objects (exit/periphery/carry)")

        # collect homes for R5 + motion tracks for R6
        diag = (W ** 2 + H ** 2) ** 0.5
        for i in visible:
            homes[i["id"]].append((scene, (i["x"] + i["w"] / 2) / W, (i["y"] + i["h"] / 2) / H,
                                   (i["w"] * i["h"]) / (W * H)))
            tracks[(scene, i["id"])].append((frame, i["x"] + i["w"] / 2, i["y"] + i["h"] / 2, diag))

    # R5 — HOME drift across scenes (per cast id: compare per-scene mean center/size)
    for cid, obs in homes.items():
        per_scene: dict[str, list] = defaultdict(list)
        for scene, cx, cy, area in obs:
            per_scene[scene].append((cx, cy, area))
        if len(per_scene) < 2:
            continue
        means = {s: (sum(o[0] for o in ol) / len(ol), sum(o[1] for o in ol) / len(ol),
                     sum(o[2] for o in ol) / len(ol)) for s, ol in per_scene.items()}
        scenes_sorted = sorted(means)
        for s1, s2 in zip(scenes_sorted, scenes_sorted[1:]):
            (x1, y1, a1), (x2, y2, a2) = means[s1], means[s2]
            if abs(x1 - x2) > HOME_DRIFT_CENTER or abs(y1 - y2) > HOME_DRIFT_CENTER:
                v.append(f"[CONSISTENCY R5 home drift] '{cid}': center moved "
                         f"{s1} → {s2} (Δx={abs(x1-x2):.2f}, Δy={abs(y1-y2):.2f} of canvas) — HOMES are identity")
            if a1 > 0 and a2 > 0 and max(a1, a2) / min(a1, a2) - 1 > HOME_DRIFT_SIZE:
                v.append(f"[CONSISTENCY R5 scale drift] '{cid}': size changed "
                         f"{s1} → {s2} ({min(a1,a2):.3f} → {max(a1,a2):.3f} of canvas)")

    # R6 — teleportation: displacement between consecutive samples bounded by elapsed frames
    for (scene, cid), pts in tracks.items():
        pts.sort()
        for (f1, x1, y1, diag), (f2, x2, y2, _) in zip(pts, pts[1:]):
            df = f2 - f1
            if df <= 0:
                continue
            dist = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
            if dist / df > TELEPORT_SPEED * diag:
                v.append(f"[MOTION R6 teleport] {scene}: '{cid}' jumped {int(dist)}px in {df} frames "
                         f"(f{f1}→f{f2}) — a visible element moved discontinuously (no exit, no entrance)")

    dedup = sorted(set(v))
    print(f"RENDER-TELEMETRY: samples={n_samples} cast_ids={len(cast_seen)} violations={len(dedup)}")
    if not cast_seen:
        print("  WARN: telemetry contains no [data-cast-id] elements — the tagging rule "
              "(vg-code-artifacts) isn't being followed; the probe sees an anonymous scene.")
    for line in dedup:
        print("  •", line)
    if dedup and strict:
        return 1
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("project")
    ap.add_argument("--strict", action="store_true", help="exit 1 on any violation")
    args = ap.parse_args()
    sys.exit(run(args.project, args.strict))
