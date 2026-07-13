"""composite_lint.py — the SCRIPT-SIDE overlap gate (contract-linter 3h, mechanical).

Verifies each scene's `stage.zones` geometry in a render contract BEFORE any render exists:
  1. element/text zones are pairwise DISJOINT (reservation = overlap impossible);
  2. corridors (movers' swept paths) cross NO text zone and NO element zone —
     transform motion overlays what it crosses, so an unreserved crossing is an
     overlap at some frame;
  3. text zones stay out of the caption band (bottom 12% of canvas);
  4. every zone `occupant` resolves to a cast id (element/text zones);
  5. regions are sane fractions ([x,y,w,h] in 0..1, on-canvas).

Usage:
    python .claude/skills/script_generation/scripts/composite_lint.py <contract.json>

Exit 0 = clean (or legacy: no scene carries stage.zones — reported as WARN).
Exit 1 = violations printed (scene · zones · rule).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

CAPTION_BAND_TOP = 0.88   # bottom 12% of canvas is reserved for captions (V9c)


def _rect_overlap(a: list, b: list) -> float:
    """Overlap area of two fractional rects [x,y,w,h]; 0.0 when disjoint."""
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    ox = max(0.0, min(ax + aw, bx + bw) - max(ax, bx))
    oy = max(0.0, min(ay + ah, by + bh) - max(ay, by))
    return ox * oy


def lint(contract_path: Path) -> int:
    data = json.loads(contract_path.read_text(encoding="utf-8"))
    problems: list[str] = []
    scenes_with_zones = 0

    for sc in data.get("scenes", []):
        n = sc.get("number")
        zones = ((sc.get("stage") or {}).get("zones")) or []
        if not zones:
            continue
        scenes_with_zones += 1
        cast_ids = {c.get("id") for c in (sc.get("cast") or [])}

        for z in zones:
            zid, kind, r = z.get("id"), z.get("kind"), z.get("region")
            if not (isinstance(r, list) and len(r) == 4):
                problems.append(f"scene {n} zone {zid}: region must be [x,y,w,h] fractions")
                continue
            x, y, w, h = r
            if not (0 <= x <= 1 and 0 <= y <= 1 and 0 < w <= 1 and 0 < h <= 1
                    and x + w <= 1.0001 and y + h <= 1.0001):
                problems.append(f"scene {n} zone {zid}: region {r} off-canvas / not fractional")
            if kind == "text" and y + h > CAPTION_BAND_TOP:
                problems.append(
                    f"scene {n} zone {zid}: text zone enters the caption band "
                    f"(bottom {round((1-CAPTION_BAND_TOP)*100)}% is reserved — V9c)")
            if kind in ("element", "text"):
                occ = z.get("occupant")
                if occ and cast_ids and occ not in cast_ids:
                    problems.append(f"scene {n} zone {zid}: occupant '{occ}' not in cast")

        solid = [z for z in zones if z.get("kind") in ("element", "text")
                 and isinstance(z.get("region"), list) and len(z["region"]) == 4]
        corridors = [z for z in zones if z.get("kind") == "corridor"
                     and isinstance(z.get("region"), list) and len(z["region"]) == 4]

        for i in range(len(solid)):
            for j in range(i + 1, len(solid)):
                if _rect_overlap(solid[i]["region"], solid[j]["region"]) > 1e-6:
                    problems.append(
                        f"scene {n}: zones '{solid[i].get('id')}' and '{solid[j].get('id')}' "
                        f"OVERLAP — reservation broken; re-place in the composite")
        for c in corridors:
            for s in solid:
                if _rect_overlap(c["region"], s["region"]) > 1e-6:
                    problems.append(
                        f"scene {n}: corridor '{c.get('id')}' crosses {s.get('kind')} zone "
                        f"'{s.get('id')}' — motion overlays what it crosses; re-route the "
                        f"corridor or clear that zone for the pass")

    if problems:
        print(f"composite_lint: {len(problems)} violation(s)")
        for p in problems:
            print("  •", p)
        return 1
    if scenes_with_zones == 0:
        print("composite_lint: WARN — no scene carries stage.zones (legacy contract); "
              "the script-side overlap gate cannot run. New compiles must emit zones.")
        return 0
    print(f"composite_lint: OK — {scenes_with_zones} scene(s), zones disjoint, corridors clear")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(lint(Path(sys.argv[1])))
