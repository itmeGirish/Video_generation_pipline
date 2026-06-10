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

  bundle.json format:
    [
      {"scene": 1, "bullet": 1, "anchor": "limb amputated", "code": "..." },
      {"scene": 1, "bullet": 2, "anchor": "...",           "code": "..." },
      ...
    ]

Once cache files exist at the correct hashed paths, build_video.py Step 2
finds them via pure cache lookup. There is no LLM/CLI subprocess in the
pipeline — a missing cache entry raises CacheMissError and aborts the build.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from storyboard.source_parser import parse as parse_source
import yaml

CACHE_DIR = ROOT / "storyboard" / ".cache" / "designs"


def _bullet_cache_key(scene, bullet_idx: int, design_tokens: dict) -> str:
    """Mirror visual_designer._bullet_cache_key EXACTLY. Any drift here
    means the cache file lands at a hash visual_designer.py won't look up,
    causing CacheMissError at build time (rule 04). Both functions hash the
    same fields in the same order with the same prompt-version constant
    (b'prompt-v14-per-bullet'); the preflight test asserts this stays in sync."""
    h = hashlib.sha256()
    b = scene.animation[bullet_idx]
    h.update(scene.narration.encode("utf-8"))
    h.update(f"{bullet_idx}|{b.time_from_sec}-{b.time_to_sec}".encode("utf-8"))
    h.update(f"{b.headline}|{b.body}".encode("utf-8"))
    h.update(json.dumps(design_tokens, sort_keys=True).encode("utf-8"))
    h.update(b"prompt-v14-per-bullet")  # MUST match visual_designer.py constant
    return h.hexdigest()[:16]


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
        bundle = json.loads(Path(args.json).read_text(encoding="utf-8"))
        if not isinstance(bundle, list):
            raise ValueError("--json bundle must be a JSON list")
        # Determine project from script_path or from each entry
        if args.script_path:
            script = _load_script(Path(args.script_path).resolve())
            project_dir = ROOT / "projects" / Path(args.script_path).stem
            design_tokens = _load_design_tokens(project_dir)
        else:
            raise ValueError("--json bundle requires script_path positional arg")

        for i, entry in enumerate(bundle):
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
