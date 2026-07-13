"""Render Intelligence — perceptual frame checks the pixel/DOM gates can't see.

Measures, per rendered frame, the three failure classes that shipped bugs in
pixel_rag (2026-07) and were caught only by human eyes:

  1. CLUTTER      — how many distinct element GROUPS are on screen at once.
                    (the S1 fork frame: 8 groups fighting -> unclear focus)
  2. OCCLUSION    — a dark panel partially overlapping a light panel (or the
                    reverse): the parser-box-on-answer-card class. Text-on-text
                    is already covered by layout_validator; THIS catches
                    panel-on-panel, which it cannot see.
  3. ORPHAN SLAB  — a large solid blank panel with no content inside (the
                    floating green "success wash" left after its target was
                    de-piled). A panel with near-zero internal variance is
                    decoration pointing at nothing.
  +  FOCUS SHARE  — does one group visually dominate (top group's share of
                    total visual weight)? Low share = no clear focal point.

Usage:
  python -m storyboard.render_intelligence <frame.jpg> [more.jpg ...] [--bg EFE9DD]
  python -m storyboard.render_intelligence --dir c:/tmp/frames [--bg EFE9DD]

Exit code 1 if any frame FAILs (clutter/occlusion/orphan), 0 otherwise.

Thresholds are calibrated on the pixel_rag production frames (buggy masters
#5-#7 vs fixed master #9) — see verification.md "Render Intelligence" section.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

try:
    import cv2
except ImportError:  # pragma: no cover
    cv2 = None
from PIL import Image
from scipy import ndimage

# ── thresholds (calibrated 2026-07-05 on pixel_rag frames) ────────────────────
FG_DIFF          = 18     # per-channel diff from bg to count as foreground
GROUP_DILATE_PX  = 25     # merge radius: elements closer than this = one group
GROUP_MIN_AREA   = 0.0008 # of canvas — ignore specks/labels as own groups
CLUTTER_MAX      = 6      # > this many groups = cognitive overload (ADVISORY — see note)
DARK_MIN_DIM     = 34     # a "dark panel" must be at least this wide AND tall (px):
                          # a thin divider line / underline is not an occluding panel
OCCLUSION_MIN    = 0.06   # partial-overlap fraction (of smaller bbox) to flag
OCCLUSION_MAX    = 0.90   # near-full containment = child element, legitimate
PANEL_MIN_AREA   = 0.012  # of canvas — a "panel" is a big slab
ORPHAN_MIN_AREA  = 0.030  # of canvas — orphan slabs are BIG; designed row
                          # highlights (~2%) stay below this
ORPHAN_STD_MAX   = 9.0    # internal luminance std below this = blank slab
CUT_MIN_AREA     = 0.020  # of canvas — light panels big enough to judge shape
CUT_FILL_MAX     = 0.72   # visible region this non-rectangular = panel is CUT
                          # by another light panel on top (white-on-white pile)
FOCUS_WARN       = 0.30   # top group's weight share below this = no focal point
DARK_LUMA        = 100    # panel luminance below = "dark panel"
LIGHT_LUMA       = 200    # panel luminance above = "light panel"


def _luma(rgb: np.ndarray) -> np.ndarray:
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def _bboxes(mask: np.ndarray, min_area_px: float):
    lab, n = ndimage.label(mask)
    out = []
    for sl in ndimage.find_objects(lab):
        if sl is None:
            continue
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        if h * w >= min_area_px:
            out.append((sl[1].start, sl[0].start, w, h))  # x, y, w, h
    return out


def _overlap_frac(a, b) -> float:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    ix = max(0, min(ax + aw, bx + bw) - max(ax, bx))
    iy = max(0, min(ay + ah, by + bh) - max(ay, by))
    inter = ix * iy
    return inter / max(1, min(aw * ah, bw * bh))


def _iou(a, b) -> float:
    """Intersection-over-union of two bboxes. Near 1.0 = the two bboxes are the
    SAME rectangle — i.e. one UI element captured twice (a dark filled button and
    its own light label/edge), NOT a small panel crossing a large one. A real
    dark-over-light-card collision has the dark element much smaller than the card
    (low IoU) or only partially overlapping (low IoU)."""
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    ix = max(0, min(ax + aw, bx + bw) - max(ax, bx))
    iy = max(0, min(ay + ah, by + bh) - max(ay, by))
    inter = ix * iy
    union = aw * ah + bw * bh - inter
    return inter / max(1, union)


def _contained(inner, outer, margin=6) -> bool:
    """True if `inner` bbox sits FULLY inside `outer` (a designed child element —
    a station inside a lane, a stamp inside a card — NOT a collision). A real
    collision is when the darker element CROSSES the light panel's boundary
    (sticks out beyond at least one edge)."""
    ix, iy, iw, ih = inner
    ox, oy, ow, oh = outer
    return (ix >= ox - margin and iy >= oy - margin and
            ix + iw <= ox + ow + margin and iy + ih <= oy + oh + margin)


def analyze_frame(path: str | Path, bg_rgb=(0xEF, 0xE9, 0xDD)) -> dict:
    img = np.asarray(Image.open(path).convert("RGB"), dtype=np.int16)
    H, W = img.shape[:2]
    canvas = H * W
    luma = _luma(img)

    # Frames on a DARK stage (e.g. the S5 dark room) invert the bg reference.
    corners = np.concatenate([img[:40, :40].reshape(-1, 3), img[:40, -40:].reshape(-1, 3),
                              img[-40:, :40].reshape(-1, 3), img[-40:, -40:].reshape(-1, 3)])
    eff_bg = corners.mean(axis=0)

    diff = np.abs(img - eff_bg).max(axis=2)
    fg = diff > FG_DIFF

    # 1) CLUTTER — element groups after morphological merge
    st = np.ones((GROUP_DILATE_PX, GROUP_DILATE_PX), bool)
    merged = ndimage.binary_dilation(fg, structure=st)
    lab, n = ndimage.label(merged)
    groups, weights = 0, []
    for i in range(1, n + 1):
        m = lab == i
        area = int(m.sum())
        if area >= GROUP_MIN_AREA * canvas:
            groups += 1
            weights.append(float(diff[m].sum()))
    focus_share = (max(weights) / sum(weights)) if weights else 1.0

    # 2) OCCLUSION — dark panels partially overlapping light panels
    dark_mask = (luma < DARK_LUMA) & fg
    light_mask = (luma > LIGHT_LUMA) & fg
    dark_p = [b for b in _bboxes(ndimage.binary_closing(dark_mask, np.ones((9, 9), bool)),
                                 PANEL_MIN_AREA * canvas * 0.25)
              if b[2] >= DARK_MIN_DIM and b[3] >= DARK_MIN_DIM]  # skip thin lines/dividers
    light_p = _bboxes(ndimage.binary_closing(light_mask, np.ones((9, 9), bool)),
                      PANEL_MIN_AREA * canvas)
    occlusions = []
    for d in dark_p:
        for l in light_p:
            f = _overlap_frac(d, l)
            # A element FULLY INSIDE the other is a designed child — a dark station
            # inside a light lane / stamp in a card (dark-in-light), OR light text /
            # an icon inside a dark button (light-in-dark). Containment is SYMMETRIC:
            # either direction = a nested child, not a collision. Flag only when the
            # two panels CROSS each other's boundary (neither is contained).
            if (OCCLUSION_MIN < f < OCCLUSION_MAX
                    and not _contained(d, l) and not _contained(l, d)
                    and _iou(d, l) < 0.55):
                occlusions.append({"dark": d, "light": l, "frac": round(f, 3)})

    # 3) ORPHAN SLAB — big solid panel with no internal content
    orphans = []
    lab2, n2 = ndimage.label(fg)
    for i in range(1, n2 + 1):
        m = lab2 == i
        area = int(m.sum())
        if area < ORPHAN_MIN_AREA * canvas:
            continue
        sl = ndimage.find_objects(lab2 == i)[0]
        rect_fill = area / max(1, (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start))
        if rect_fill < 0.7:
            continue                       # not slab-shaped
        inner_std = float(luma[m].std())
        mean_rgb = img[m].mean(axis=0)
        if inner_std < ORPHAN_STD_MAX and np.abs(mean_rgb - eff_bg).max() > FG_DIFF:
            orphans.append({"bbox": (sl[1].start, sl[0].start,
                                     sl[1].stop - sl[1].start, sl[0].stop - sl[0].start),
                            "std": round(inner_std, 1)})

    # 4) PANEL-CUT — white-on-white pile-ups. Touching light panels merge into
    #    one blob, so split them along their border/shadow EDGES first; a card
    #    partially hidden behind another leaves an L-shaped visible region
    #    (low rectangularity) that a fully-visible card never has.
    cuts = []
    if cv2 is not None:
        edges = cv2.Canny(luma.astype(np.uint8), 40, 120)
        edges = cv2.dilate(edges, np.ones((3, 3), np.uint8))
        split_light = light_mask & ~(edges > 0)
        lab3, n3 = ndimage.label(ndimage.binary_opening(split_light, np.ones((5, 5), bool)))
        for i in range(1, n3 + 1):
            m = lab3 == i
            area = int(m.sum())
            if area < CUT_MIN_AREA * canvas:
                continue
            sl = ndimage.find_objects(lab3 == i)[0]
            # Fill internal holes (dark stations/tiles/text INSIDE the panel) —
            # they are designed content, not a cut. Only a clipped OUTER boundary
            # (a same-colour panel piled on top, or a bar covering the panel) makes
            # the FILLED shape non-rectangular. That is the real light-on-light overlap.
            sub = ndimage.binary_fill_holes(m[sl])
            filled_area = int(sub.sum())
            rect_fill = filled_area / max(1, sub.shape[0] * sub.shape[1])
            if rect_fill < CUT_FILL_MAX:
                cuts.append({"bbox": (sl[1].start, sl[0].start,
                                      sl[1].stop - sl[1].start, sl[0].stop - sl[0].start),
                             "fill": round(rect_fill, 2)})

    verdict = "PASS"
    reasons = []
    # CLUTTER is ADVISORY, not a hard fail: a raw group-count cannot tell a clean
    # 5-stage diagram from a cluttered mess — both have many groups. That judgment
    # needs perception (the vision-model gate), not a threshold. So it WARNs; only
    # the geometric overlap checks (occlusion/panel-cut/orphan) hard-FAIL.
    if groups > CLUTTER_MAX:
        reasons.append(f"WARN clutter {groups} groups (advisory — needs vision judgment)")
    if occlusions:
        verdict = "FAIL"; reasons.append(f"OCCLUSION x{len(occlusions)}")
    if orphans:
        verdict = "FAIL"; reasons.append(f"ORPHAN-SLAB x{len(orphans)}")
    if cuts:
        verdict = "FAIL"; reasons.append(f"PANEL-CUT x{len(cuts)}")
    if focus_share < FOCUS_WARN and verdict == "PASS":
        reasons.append(f"WARN focus {focus_share:.2f} < {FOCUS_WARN}")

    return {"file": str(path), "groups": groups, "focus": round(focus_share, 2),
            "occlusions": occlusions, "orphans": orphans, "cuts": cuts,
            "verdict": verdict, "reasons": reasons}


def main(argv=None) -> int:
    args = list(argv or sys.argv[1:])
    files: list[Path] = []
    if "--dir" in args:
        d = Path(args[args.index("--dir") + 1])
        files = sorted(d.glob("*.jpg")) + sorted(d.glob("*.png"))
    else:
        files = [Path(a) for a in args if not a.startswith("--")]
    if not files:
        print(__doc__)
        return 2
    sys.stdout.reconfigure(encoding="utf-8")
    any_fail = False
    for f in files:
        r = analyze_frame(f)
        flag = " | ".join(r["reasons"]) if r["reasons"] else "clean"
        print(f"{r['verdict']:4s} groups={r['groups']:2d} focus={r['focus']:.2f}  {Path(r['file']).name}  [{flag}]")
        for o in r["occlusions"]:
            print(f"      occlusion: dark{o['dark']} over light{o['light']} frac={o['frac']}")
        for o in r["orphans"]:
            print(f"      orphan slab: bbox={o['bbox']} inner-std={o['std']}")
        for o in r.get("cuts", []):
            print(f"      panel-cut: bbox={o['bbox']} fill={o['fill']}")
        any_fail |= r["verdict"] == "FAIL"
    return 1 if any_fail else 0


if __name__ == "__main__":
    sys.exit(main())
