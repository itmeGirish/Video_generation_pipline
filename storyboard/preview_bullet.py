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
# CROSS-PROJECT CACHE-BLEED FIX (real bug, pixel_rag 2026-07-03): cache filenames
# carry NO project identity — bullet-s1-b5-<hash>.json from a PREVIOUS project with
# the same scene numbering matches the glob and renders another project's bullet
# into this project's proof. The fix: when the script is known (main() always has
# it), compute THIS project's exact content-addressed paths via the same
# _bullet_cache_key the build uses, and consult ONLY those. The glob remains as a
# legacy fallback for callers without a script.

_EXACT_CACHE: dict = {}   # (scene_num, bullet_1based) -> exact Path


def _register_exact_cache(script_path: Path, config: dict) -> None:
    from storyboard.source_parser import parse as _parse
    from storyboard.visual_designer import _bullet_cache_key
    src = _parse(script_path)
    tokens = config["design"]
    for sc in src.scenes:
        for i in range(len(sc.animation)):
            key = _bullet_cache_key(sc, i, tokens)
            _EXACT_CACHE[(sc.number, i + 1)] = CACHE_DIR / f"bullet-s{sc.number}-b{i + 1}-{key}.json"


def _write_tokens(config: dict) -> None:
    """Sync remotion config_tokens.json to THIS project's design (same write the
    build does at step 1). Without this the preview renders with the LAST-BUILT
    project's palette — a stale-theme bug (pixel_rag rendered dark, 2026-07-03)."""
    tokens_json = ROOT / "remotion" / "src" / "universal" / "config_tokens.json"
    tokens_json.write_text(json.dumps(config["design"], indent=2), encoding="utf-8")


def _find_bullet_cache(scene_num: int, bullet_num: int) -> Path | None:
    if _EXACT_CACHE:
        p = _EXACT_CACHE.get((scene_num, bullet_num))
        return p if (p is not None and p.exists()) else None
    matches = list(CACHE_DIR.glob(f"bullet-s{scene_num}-b{bullet_num}-*.json"))
    return matches[0] if matches else None


def _all_cached_bullets_in_scene(scene_num: int) -> list[int]:
    """Return sorted list of 1-based bullet numbers that have cache files."""
    if _EXACT_CACHE:
        return sorted(b for (s, b), p in _EXACT_CACHE.items() if s == scene_num and p.exists())
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


# ── VISUAL PROOF (cheap pre-render gate: filmstrip + transformation delta) ──────
#
# Renders a 5-keyframe FILMSTRIP per bullet (no TTS/Whisper/full-render) so the
# CINEMATIC design is proven on cheap pixels BEFORE a ~260s scene render. Emits:
#   • the mechanical proofs Python CAN judge: Composition (canvas coverage) +
#     Transformation (did the frames actually CHANGE, or are they identical?).
#   • a stitched filmstrip image for Claude to judge the Narrative/Composition
#     proofs (hero obvious / hierarchy / attention / muted test) against the DDI.
# It does NOT judge motion QUALITY (easing/stagger/freeze) — that is temporal and
# stays in post-render QA (vg-quality-*). Static frames cannot prove motion.

VP_FRAME_FRACS = (0.10, 0.30, 0.50, 0.70, 0.90)  # the 5-keyframe filmstrip
TRANSFORM_MIN  = 0.015   # min mean-normalized pixel change across the strip; below
                         # this the 5 frames are ~identical → FLAT scene (nothing
                         # transformed). Whole-frame metric: catches "nothing changed
                         # at all". Subject-vs-camera stays a post-render check.
CHANGED_FRAC_MIN = 0.006 # SLOT-BASED secondary criterion (2026-07-04): under the
                         # slot contract a bullet renders priors FROZEN settled +
                         # only its own delta animating. A real but small-area delta
                         # (beams locking, a counter, a label sweep) dilutes the
                         # whole-canvas mean below TRANSFORM_MIN while a true freeze
                         # is ~0 on BOTH metrics. Transformation passes if the mean
                         # clears TRANSFORM_MIN OR ≥ this fraction of canvas pixels
                         # genuinely changed (per-pixel max-channel diff > 15/255).


def _frame_delta(path_a: Path, path_b: Path) -> float:
    """Mean normalized pixel change between two stills (0.0–1.0)."""
    try:
        import numpy as np
        from PIL import Image
    except ImportError:
        return 1.0
    a = np.asarray(Image.open(path_a).convert("RGB"), dtype=np.int32)
    b = np.asarray(Image.open(path_b).convert("RGB"), dtype=np.int32)
    if a.shape != b.shape:
        return 1.0
    return float(np.abs(a - b).mean()) / 255.0


def _changed_fraction(path_a: Path, path_b: Path) -> float:
    """Fraction of pixels (0.0–1.0) whose max-channel abs diff exceeds 15/255."""
    try:
        import numpy as np
        from PIL import Image
    except ImportError:
        return 1.0
    a = np.asarray(Image.open(path_a).convert("RGB"), dtype=np.int32)
    b = np.asarray(Image.open(path_b).convert("RGB"), dtype=np.int32)
    if a.shape != b.shape:
        return 1.0
    return float((np.abs(a - b).max(axis=2) > 15).mean())


def _render_bullet_frames(project_name, config, code, payload, frames, out_paths,
                          duration_frames, prior_payloads=None) -> str | None:
    """Render a LIST of frames for one cached bullet (mirrors preview_bullet's
    single-frame path under one timelines patch). Returns None on success or an
    error string."""
    fps = config.get("video", {}).get("fps", 30)
    preview_id = f"{project_name.replace('_', '-')}-preview"
    scene_json_path    = SCENES_DIR   / f"{preview_id}.json"
    captions_json_path = CAPTIONS_DIR / f"{preview_id}.json"
    original_timelines: str | None = None
    try:
        # ADDITIVE-STACK FIDELITY (2026-07-03): in the real scene, bullet N paints on
        # TOP of bullets 1..N-1 (additive layering). Rendering a bullet in ISOLATION
        # under-measures coverage (an additive delta alone is a near-empty canvas) and
        # mis-measures transformation. So the proof composes the same stack the scene
        # will: prior bullets' code first (framesFrom 0 -> settled/replaying), the
        # proved bullet last (on top). prior_payloads=None keeps the old single-block path.
        blocks = []
        for pp in (prior_payloads or []):
            blocks.append({"framesFrom": 0, "framesTo": duration_frames, "code": pp.get("code", ""),
                           "audio_anchor": pp.get("audio_anchor", ""),
                           "source_headline": pp.get("source_headline", "")})
        blocks.append({"framesFrom": 0, "framesTo": duration_frames, "code": code,
                       "audio_anchor": payload.get("audio_anchor", ""),
                       "source_headline": payload.get("source_headline", "")})
        scene_json_path.write_text(json.dumps(blocks, indent=2, ensure_ascii=False), encoding="utf-8")
        captions_json_path.write_text("[]", encoding="utf-8")
        original_timelines = _patch_timelines(preview_id, duration_frames, fps)
        env = {**os.environ, "PROJECT": project_name, "VIDEO_FPS": str(fps),
               "VIDEO_WIDTH":  str(config.get("video", {}).get("width", 1920)),
               "VIDEO_HEIGHT": str(config.get("video", {}).get("height", 1080))}
        for fr, op in zip(frames, out_paths):
            op.parent.mkdir(parents=True, exist_ok=True)
            r = subprocess.run(
                ["node", str(PREVIEW_MJS), "--composition", preview_id,
                 "--frame", str(fr), "--output", str(op)],
                env=env, cwd=str(ROOT / "remotion"), capture_output=True,
                text=True, timeout=180, creationflags=_NOWIN)
            if r.returncode != 0:
                return f"renderer exited {r.returncode}: {(r.stderr or r.stdout)[:300]}"
        return None
    finally:
        if original_timelines is not None:
            TIMELINES_TS.write_text(original_timelines, encoding="utf-8")
        for p in (scene_json_path, captions_json_path):
            if p.exists():
                p.unlink()


def visual_proof_bullet(project_name, config, scene_num, bullet_num, out_dir,
                        duration_frames: int = 90, prior_payloads=None) -> dict:
    """Render the 5-keyframe filmstrip for one bullet + the mechanical proofs."""
    bg_rgb = _bg_rgb(config)
    cache_file = _find_bullet_cache(scene_num, bullet_num)
    if not cache_file:
        return {"scene": scene_num, "bullet": bullet_num, "verdict": "SKIP",
                "reason": "no cache file — seed this bullet first"}
    payload = json.loads(cache_file.read_text(encoding="utf-8"))
    code = payload.get("code", "")
    if not code:
        return {"scene": scene_num, "bullet": bullet_num, "verdict": "ERROR",
                "reason": "cache file has empty code field"}

    frames    = [max(0, int(duration_frames * f)) for f in VP_FRAME_FRACS]
    out_paths = [out_dir / f"s{scene_num}_b{bullet_num}_p{int(f*100):02d}.jpg" for f in VP_FRAME_FRACS]
    err = _render_bullet_frames(project_name, config, code, payload, frames, out_paths, duration_frames, prior_payloads=prior_payloads)
    if err:
        return {"scene": scene_num, "bullet": bullet_num, "verdict": "ERROR", "reason": err}

    coverages  = [_canvas_coverage(p, bg_rgb) for p in out_paths]
    consec     = [_frame_delta(out_paths[i], out_paths[i + 1]) for i in range(len(out_paths) - 1)]
    transform  = max((max(consec) if consec else 0.0), _frame_delta(out_paths[0], out_paths[-1]))
    fracs      = [_changed_fraction(out_paths[i], out_paths[i + 1]) for i in range(len(out_paths) - 1)]
    changed    = max((max(fracs) if fracs else 0.0), _changed_fraction(out_paths[0], out_paths[-1]))
    cov_min    = min(coverages) if coverages else 0.0
    comp_ok    = cov_min >= COVERAGE_MIN          # Composition (mechanical part)
    # Transformation: full-canvas mean OR a real changed-pixel region (slot model —
    # priors frozen settled dilute the mean; a true freeze is ~0 on both).
    trans_ok   = (transform >= TRANSFORM_MIN) or (changed >= CHANGED_FRAC_MIN)
    return {
        "scene": scene_num, "bullet": bullet_num,
        "verdict":          "PASS" if (comp_ok and trans_ok) else "FAIL",
        "coverage_min":     round(cov_min * 100, 1),
        "transform_delta":  round(transform * 100, 2),
        "transform_min":    round(TRANSFORM_MIN * 100, 2),
        "changed_frac":     round(changed * 100, 2),
        "changed_frac_min": round(CHANGED_FRAC_MIN * 100, 2),
        "composition_ok":   comp_ok,
        "transformation_ok": trans_ok,
        "frames":           [str(p) for p in out_paths],
        "headline":         payload.get("source_headline", ""),
    }


def _stitch_filmstrip(results: list[dict], out_path: Path) -> str | None:
    """Stack each bullet's 5 keyframes into one contact sheet (one row per bullet)."""
    try:
        from PIL import Image
    except ImportError:
        return None
    thumb_w, rows = 384, []
    for res in results:
        if res.get("verdict") in ("SKIP", "ERROR"):
            continue
        imgs = [Image.open(p).convert("RGB") for p in res["frames"]]
        h    = int(thumb_w * imgs[0].height / imgs[0].width)
        imgs = [im.resize((thumb_w, h)) for im in imgs]
        row  = Image.new("RGB", (thumb_w * len(imgs), h))
        for i, im in enumerate(imgs):
            row.paste(im, (i * thumb_w, 0))
        rows.append(row)
    if not rows:
        return None
    sheet = Image.new("RGB", (max(r.width for r in rows), sum(r.height for r in rows)), (10, 10, 15))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, quality=85)
    return str(out_path)


def visual_proof_scene(project_name, config, scene_num, duration_frames: int = 90) -> dict:
    """Run Visual Proof for a whole scene: per-bullet filmstrips + the scene contact
    sheet + a visual_proof.json. The MECHANICAL verdict (Composition coverage +
    Transformation delta) is decided here; the Narrative + Composition JUDGMENT
    (hero/hierarchy/attention/muted) is for Claude to read off the filmstrip."""
    out_dir = Path(f"c:/tmp/visual_proof_{project_name}_s{scene_num}")
    bullets = _all_cached_bullets_in_scene(scene_num)
    if not bullets:
        return {"scene": scene_num, "verdict": "ERROR", "reason": "no cached bullets — seed first"}
    # SLOT-BASED contract (UniversalScene.tsx): seeded bullet code is SELF-CONTAINED
    # (priors composed settled at seed time), so each bullet is proved exactly as the
    # master renders it: alone in its slot. Stacking priors here would double-draw.
    results = []
    for b in bullets:
        results.append(visual_proof_bullet(project_name, config, scene_num, b, out_dir,
                                           duration_frames))
    filmstrip = _stitch_filmstrip(results, out_dir / f"FILMSTRIP_s{scene_num}.jpg")
    scored    = [r for r in results if r.get("verdict") in ("PASS", "FAIL")]
    mech_pass = bool(scored) and all(r["verdict"] == "PASS" for r in scored)
    report = {"scene": scene_num, "filmstrip": filmstrip,
              "mechanical_verdict": "PASS" if mech_pass else "FAIL", "bullets": results}
    (out_dir / "visual_proof.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


# ── CLI ───────────────────────────────────────────────────────────────────────

def main(argv: list[str] | None = None) -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script_path", help="projects/structured_scripts/<name>.txt")
    ap.add_argument("--scene",    type=int, required=True,  help="Scene number (1-based)")
    ap.add_argument("--bullet",   type=int, default=None,   help="Bullet number (1-based). Omit = all cached bullets in scene.")
    ap.add_argument("--out",      default=None,             help="Output JPG path (single-bullet mode only)")
    ap.add_argument("--duration", type=int, default=90,     help="Preview duration in frames (default 90 = 3s at 30fps)")
    ap.add_argument("--visual-proof", action="store_true",  help="VISUAL PROOF mode: render the 5-keyframe filmstrip + mechanical Composition/Transformation proofs for the whole scene (the cheap pre-render gate).")
    args = ap.parse_args(argv)

    script_path  = Path(args.script_path)
    project_name = script_path.stem

    try:
        config = _load_config(project_name)
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        return 1

    # Exact per-project cache resolution + this project's design tokens for the renderer
    # (cross-project cache-bleed + stale-theme fixes — see helpers above).
    try:
        _register_exact_cache(script_path, config)
    except Exception as e:
        print(f"WARNING: exact cache resolution unavailable ({e}) — falling back to glob")
    _write_tokens(config)

    # ── VISUAL PROOF mode (the cheap pre-render gate) ───────────────────────────
    if args.visual_proof:
        report = visual_proof_scene(project_name, config, args.scene, args.duration)
        if report.get("verdict") == "ERROR":
            print(f"[visual-proof] S{args.scene}  ERROR: {report['reason']}")
            return 1
        print(f"[visual-proof] S{args.scene} — {len(report['bullets'])} bullet(s)  →  MECHANICAL: {report['mechanical_verdict']}")
        for r in report["bullets"]:
            v = r["verdict"]
            if v in ("SKIP", "ERROR"):
                print(f"  S{args.scene}-B{r['bullet']}  {v}  ({r.get('reason','')})")
                continue
            flat = "" if r["transformation_ok"] else "  ⚠ FLAT (frames ~identical → no transformation)"
            thin = "" if r["composition_ok"] else f"  ⚠ canvas {r['coverage_min']}% < {int(COVERAGE_MIN*100)}%"
            frac = f" chg={r.get('changed_frac', 0)}%" if "changed_frac" in r else ""
            print(f"  S{args.scene}-B{r['bullet']}  {v}  Δ={r['transform_delta']}% (≥{r['transform_min']}%){frac} cov={r['coverage_min']}%{flat}{thin}")
        print(f"  FILMSTRIP → {report.get('filmstrip')}")
        print( "  Mechanical proofs (Composition coverage + Transformation Δ) judged above.")
        print( "  NOW read the filmstrip and judge the JUDGMENT proofs against the scene's DDI:")
        print( "    • Composition  — hero obvious in ~1s? hierarchy/balance/spacing/no-overlap/caption-zone clear?")
        print( "    • Narrative    — muted, does attention travel + a viewer understand? through-line/continuity held?")
        print( "    • Transformation (mechanical above) — the hero's STATE actually changed A→B across the strip.")
        print( "  Record the result:  VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%")
        print( "  (FAIL any proof → fix the bullet CODE/DDI now, BEFORE the ~260s full render. That is the point.)")
        return 0 if report["mechanical_verdict"] == "PASS" else 1

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
