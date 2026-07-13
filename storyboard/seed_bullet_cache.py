"""
Seed visual_designer cache files. The active Claude Code session authors each
bullet's React.createElement code by reading the structured script directly,
then calls this script to write cache files at the hashed paths
visual_designer.py looks up. There is NO claude CLI fallback — on a cache
miss, visual_designer.py raises CacheMissError and the build aborts with a
precise pointer to the missing bullet (rule 04).

Usage (one bullet per call):

  python storyboard/seed_bullet_cache.py \
      <project_script_path> <scene_num> <bullet_idx_1based> <anchor_phrase> < code_file.txt

Or programmatically (preferred — avoids stdin quoting):

  python storyboard/seed_bullet_cache.py --json <bundle.json>

  bundle.json format (THE PLAN GATE — vg-render-code §0c is a hard requirement here):
    {
      "plan": {
        "scenes": {
          "<scene_num>": {
            "live_systems": ["<system 1>", ... ],   # >= 8 named live systems (6 layers)
            "physical_cast": ["<object 1>", ... ],  # >= 1 non-text physical object on stage
            "atmosphere": {"grain": 0.05, "light": 0.7, "vignette": 0.15}  # >= minimums
          }, ...
        }
      },
      "bullets": [
        {"scene": 1, "bullet": 1, "anchor": "<verbatim words>", "code": "..." },
        ...
      ]
    }
  A bare JSON list (no plan) is REFUSED: batch authoring without a written per-scene
  motion plan is the documented "text-slide" failure mode. Single-bullet mode (a fix
  to one bullet of an already-planned scene) is exempt.

Once cache files exist at the correct hashed paths, build_video.py Step 2
finds them via pure cache lookup. There is no LLM/CLI subprocess in the
pipeline — a missing cache entry raises CacheMissError and aborts the build.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from storyboard.source_parser import parse as parse_source
# SINGLE SOURCE OF TRUTH for the cache key — reuse the build's exact function so the
# seeded hash can NEVER drift from the lookup hash (drift = silent CacheMissError at build).
# This previously diverged: visual_designer added the scene-brief fields (v15) + bumped the
# prompt version (v16) while this file kept a stale v14 copy missing those fields.
from storyboard.visual_designer import _bullet_cache_key
import yaml

CACHE_DIR = ROOT / "storyboard" / ".cache" / "designs"

# ── RENDER-DETERMINISM GATE ──────────────────────────────────────────────────────
# The seeded bullet code MUST render identically on every render. Two reasons this
# is load-bearing in the native architecture:
#   1. The final video is ONE live master render — it must be reproducible.
#   2. The Visual Proof filmstrip is rendered SEPARATELY from the master, so frame N
#      in the proof must equal frame N in the ship. A wall-clock / RNG value makes
#      them differ → the gate would validate a different image than ships.
# Motion must be FRAME-DRIVEN: derive any jitter from `frame` (e.g. Math.sin(frame*0.1)),
# never from the wall clock or an unseeded RNG. (See vg-code-tokens: frame-driven only.)
_NONDETERMINISTIC = re.compile(r"\b(?:Math\.random|Date\.now|performance\.now)\b|\bnew\s+Date\b")

# ── NARRATION-DUPLICATION GATE (the text-video injector made mechanical) ─────────
# The audited #1 author-side text injector: copying a narration line onto the frame
# as a caption ("the narration is SPOKEN, never typeset" — vg-code-text; the picture
# proves the line, it doesn't quote it). Mechanical rule: any string literal of >=4
# words in seeded code whose normalized token sequence appears in the scene's
# narration is REJECTED — unless the script itself directs that text (it appears in
# the bullet's own body/text fields, e.g. a typed query that IS a world object).
_STR_LIT = re.compile(r"'((?:[^'\\]|\\.){12,300})'|\"((?:[^\"\\]|\\.){12,300})\"")


def _norm_tokens(s: str) -> str:
    s = re.sub(r"<pause[^>]*>", " ", s or "")
    return " ".join(re.findall(r"[a-z0-9]+", s.lower()))


def _check_narration_dup(code: str, scene, scene_num: int, where: str, allow_text: str = "") -> None:
    narr = _norm_tokens(scene.narration)
    allow = _norm_tokens(allow_text)
    for m in _STR_LIT.finditer(code):
        lit = m.group(1) or m.group(2) or ""
        seq = _norm_tokens(lit)
        if seq.count(" ") < 3:          # <4 words: anchors/labels/readings are fine
            continue
        if seq in narr and seq not in allow:
            raise ValueError(
                f"scene {scene_num} {where}: on-screen literal duplicates the narration: "
                f"{lit[:70]!r} — the narration is SPOKEN, never typeset (the picture proves the "
                f"line; a caption is the author gaming the muted test). If the SCRIPT directs this "
                f"text, it must appear in the beat's own text/what_happens fields."
            )


# ── THE PLAN GATE (vg-render-code §0c made mechanical) ──────────────────────────
# Batch-authoring bullets without a written per-scene MOTION PLAN is the documented
# failure that ships "text-in-boxes" scenes (every rule in context, none executed).
# A bundle must DECLARE, per scene: >=8 named live systems (vg-quality-animations
# MOTION DENSITY layers), >=1 non-text physical cast object (visual-world-engine
# LAW 1), and atmosphere strengths at values that visibly register
# (vg-code-composition §8b — "subtle" may not mean "invisible").
# A scene marked "interstitial": true is DESIGNED sparse → reduced minimum (3).
PLAN_MIN_LIVE_SYSTEMS = 8
PLAN_MIN_LIVE_SYSTEMS_INTERSTITIAL = 3
PLAN_ATMOS_MIN = {"grain": 0.04, "light": 0.5, "vignette": 0.12}


def _check_plan(plan: dict, scene_nums: list) -> None:
    scenes = (plan or {}).get("scenes") or {}
    problems: list[str] = []
    for n in sorted({s for s in scene_nums if s is not None}):
        sp = scenes.get(str(n)) or scenes.get(n)
        if not isinstance(sp, dict):
            problems.append(f"scene {n}: no plan entry")
            continue
        # Corrected doctrine (2026-07-10, serial attention): a plan declares the scene's
        # RUNNING MECHANISM (the `cycle` that carries long beats) — motion QUANTITY is no
        # longer the bar. Legacy bundles may still satisfy the gate with >=N live_systems.
        mech = str(sp.get("mechanism") or "").strip()
        min_sys = PLAN_MIN_LIVE_SYSTEMS_INTERSTITIAL if sp.get("interstitial") else PLAN_MIN_LIVE_SYSTEMS
        ls = [s for s in (sp.get("live_systems") or []) if str(s).strip()]
        if not mech and len(ls) < min_sys:
            problems.append(
                f"scene {n}: no 'mechanism' declared (the scene's running cycle — what operates "
                f"continuously; 'none — payoff/interstitial' is explicit) and only {len(ls)} legacy "
                f"live_systems (< {min_sys}). Declare the mechanism (vg-render-code §0c).")
        pc = [s for s in (sp.get("physical_cast") or []) if str(s).strip()]
        if len(pc) < 1:
            problems.append(
                f"scene {n}: no non-text physical cast object declared — a scene of text panels "
                f"is a slide (visual-world-engine LAW 1)")
        at = sp.get("atmosphere") or {}
        for k, mn in PLAN_ATMOS_MIN.items():
            try:
                v = float(at.get(k, 0))
            except (TypeError, ValueError):
                v = 0.0
            if v < mn:
                problems.append(f"scene {n}: atmosphere.{k}={v} below minimum {mn} (vg-code-composition §8b)")
    if problems:
        raise ValueError(
            "PLAN GATE FAILED — the motion plan is a hard prerequisite (vg-render-code §0c):\n  - "
            + "\n  - ".join(problems)
            + "\n  Write the per-scene plan into the bundle's \"plan\" section, make the CODE match it, re-seed."
        )


def _check_determinism(code: str, scene_num: int, bullet_idx_1based: int) -> None:
    hits = sorted({m.group(0) for m in _NONDETERMINISTIC.finditer(code)})
    if hits:
        raise ValueError(
            f"NON-DETERMINISTIC code in scene {scene_num} bullet {bullet_idx_1based}: {hits}.\n"
            f"  The render must be reproducible — the final is ONE live master render, and the\n"
            f"  Visual Proof filmstrip is rendered SEPARATELY and must match the ship.\n"
            f"  Replace wall-clock/RNG with a FRAME-DRIVEN value: e.g. Math.sin(frame*0.1) for\n"
            f"  jitter, or a frame-seeded hash. (vg-code-tokens: frame-driven only.)"
        )


def _load_design_tokens(project_dir: Path) -> dict:
    cfg_path = project_dir / "config.yaml"
    if not cfg_path.exists():
        raise FileNotFoundError(f"config.yaml not found at {cfg_path}")
    cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8"))
    return cfg["design"]


def _load_script(script_path: Path):
    """script_path can be projects/scripts/<name>.txt OR projects/structured_scripts/<name>.txt.
    If the former, prefer the structured version (rule 18 hand-conversion)."""
    if "structured_scripts" in script_path.parts:
        return parse_source(script_path)
    structured = ROOT / "projects" / "structured_scripts" / script_path.name
    if structured.exists():
        print(f"NOTE: using structured version {structured.relative_to(ROOT)}")
        return parse_source(structured)
    return parse_source(script_path)


def seed_one(script, design_tokens: dict, scene_num: int, bullet_idx_1based: int,
             code: str, anchor: str, anchor_mode: str = "appear") -> Path:
    """Write one cache file. Returns the path."""
    scene = next((s for s in script.scenes if s.number == scene_num), None)
    if scene is None:
        raise ValueError(f"scene {scene_num} not found in script (have {[s.number for s in script.scenes]})")
    bullet_idx = bullet_idx_1based - 1
    if bullet_idx < 0 or bullet_idx >= len(scene.animation):
        raise ValueError(
            f"bullet {bullet_idx_1based} out of range for scene {scene_num} "
            f"(scene has {len(scene.animation)} bullets)"
        )
    bullet = scene.animation[bullet_idx]
    _check_determinism(code, scene_num, bullet_idx_1based)   # block non-deterministic bullet code
    _check_narration_dup(code, scene, scene_num, f"bullet {bullet_idx_1based}",
                         allow_text=bullet.body)             # block narration-as-caption text
    key = _bullet_cache_key(scene, bullet_idx, design_tokens)
    cache_file = CACHE_DIR / f"bullet-s{scene_num}-b{bullet_idx + 1}-{key}.json"
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    # Wipe any stale entries for this bullet (different hash from prior content)
    for old in CACHE_DIR.glob(f"bullet-s{scene_num}-b{bullet_idx + 1}-*.json"):
        old.unlink()
    _mode = str(anchor_mode or "appear").strip().lower()
    if _mode not in ("appear", "through", "land"):
        raise ValueError(f"anchor_mode must be appear/through/land, got {anchor_mode!r}")
    payload = {
        "code": code,
        "audio_anchor": anchor,
        "anchor_mode": _mode,
        "source_headline": bullet.headline,
    }
    cache_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return cache_file


def seed_stage(script, design_tokens: dict, scene_num: int, code: str) -> Path:
    """Write ONE scene's STAGE cache file (scene-driven architecture): the persistent
    world component rendered on scene-local frames for the scene's whole duration.
    Key mirrors visual_designer._stage_cache_key exactly."""
    from storyboard.visual_designer import _stage_cache_key
    scene = next((s for s in script.scenes if s.number == scene_num), None)
    if scene is None:
        raise ValueError(f"scene {scene_num} not found in script (have {[s.number for s in script.scenes]})")
    _check_determinism(code, scene_num, 0)   # stage code must be frame-driven too
    _check_narration_dup(code, scene, scene_num, "stage",
                         allow_text=(getattr(scene, "description", "") or "") + " "
                                    + (getattr(scene, "design", "") or ""))
    key = _stage_cache_key(scene, design_tokens)
    cache_file = CACHE_DIR / f"stage-s{scene_num}-{key}.json"
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    for old in CACHE_DIR.glob(f"stage-s{scene_num}-*.json"):
        old.unlink()
    cache_file.write_text(json.dumps({"code": code}, indent=2, ensure_ascii=False), encoding="utf-8")
    return cache_file


def main(argv: list[str] | None = None) -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("script_path", nargs="?",
                    help="Path to projects/scripts/<name>.txt OR projects/structured_scripts/<name>.txt. "
                         "If --json bundle is used and project field is in each entry, this can be omitted.")
    ap.add_argument("--scene", type=int, help="Scene number (1-based) — for single-bullet mode")
    ap.add_argument("--bullet", type=int, help="Bullet index (1-based) — for single-bullet mode")
    ap.add_argument("--anchor", help="audio_anchor phrase (2-4 verbatim words from narration)")
    ap.add_argument("--anchor-mode", default="appear", choices=["appear", "through", "land"],
                    help="sync-to-meaning mode: appear (word_start) | through (start→end) | land (word_end)")
    ap.add_argument("--code-file", help="Path to file containing the React.createElement code body")
    ap.add_argument("--json", help="Path to a JSON bundle of bullets (preferred for batch).")
    args = ap.parse_args(argv)

    if not args.script_path and not args.json:
        ap.error("Need script_path (positional) and either single-bullet flags or --json bundle")

    if args.json:
        raw = json.loads(Path(args.json).read_text(encoding="utf-8"))
        if isinstance(raw, list):
            raise ValueError(
                "PLAN GATE: bare-list bundles are no longer accepted. Batch authoring requires the "
                "per-scene MOTION PLAN (vg-render-code §0c): use {\"plan\": {\"scenes\": {...}}, "
                "\"bullets\": [...]} — declare >=8 live systems, >=1 physical cast object, and "
                "atmosphere strengths per scene, then make the code match the plan."
            )
        if not isinstance(raw, dict) or not isinstance(raw.get("bullets"), list):
            raise ValueError("--json bundle must be {\"plan\": {...}, \"bullets\": [...]}")
        bundle = raw["bullets"]
        _check_plan(raw.get("plan") or {}, [e.get("scene") for e in bundle])
        # Determine project from script_path or from each entry
        if args.script_path:
            script = _load_script(Path(args.script_path).resolve())
            project_dir = ROOT / "projects" / Path(args.script_path).stem
            design_tokens = _load_design_tokens(project_dir)
        else:
            raise ValueError("--json bundle requires script_path positional arg")

        for i, entry in enumerate(bundle):
            if entry.get("stage"):
                # Scene-driven: {"scene": N, "stage": true, "code": "..."} seeds the
                # scene's persistent-world component (no bullet/anchor — it spans the scene).
                for k in ("scene", "code"):
                    if k not in entry:
                        raise ValueError(f"bundle[{i}] (stage) missing key '{k}'")
                path = seed_stage(script, design_tokens, entry["scene"], entry["code"])
                print(f"  ✓ scene {entry['scene']} STAGE → {path.name}")
                continue
            for k in ("scene", "bullet", "anchor", "code"):
                if k not in entry:
                    raise ValueError(f"bundle[{i}] missing key '{k}' (entry: {entry!r})")
            path = seed_one(script, design_tokens,
                            entry["scene"], entry["bullet"],
                            entry["code"], entry["anchor"],
                            entry.get("anchor_mode", "appear"))
            print(f"  ✓ scene {entry['scene']} bullet {entry['bullet']} → {path.name}")
        print(f"\nseeded {len(bundle)} bullet cache file(s) under {CACHE_DIR.relative_to(ROOT)}")
        return 0

    # Single-bullet mode
    if not all([args.scene, args.bullet, args.anchor, args.code_file]):
        ap.error("Single-bullet mode needs --scene, --bullet, --anchor, --code-file")
    script = _load_script(Path(args.script_path).resolve())
    project_dir = ROOT / "projects" / Path(args.script_path).stem
    design_tokens = _load_design_tokens(project_dir)
    code = Path(args.code_file).read_text(encoding="utf-8")
    path = seed_one(script, design_tokens, args.scene, args.bullet, code, args.anchor,
                    args.anchor_mode)
    print(f"seeded {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
