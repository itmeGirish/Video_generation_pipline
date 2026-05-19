"""SFX cue auto-emitter for Pipeline A.

For each bullet in a project, infer SFX cues based on the bullet's metadata
and code patterns, plus the scene's Whisper word timestamps. Writes per-scene
cue JSONs to `projects/<name>/sfx/<scene_id>_cues.json`.

Cue schema (compatible with docs/SOUND.md):
    {
      "scene_id": "<id>",
      "cues": [
        {"sound": "ui_pop", "frame": 12, "volume": 0.08, "source": "bullet 1 entrance"},
        {"sound": "text_tick", "frame": 178, "volume": 0.05, "source": "word 'drafts'"},
        ...
      ]
    }

Detection rules (simple, tunable):
  - Each bullet's framesFrom → 'ui_pop'    (soft entrance pop)
  - REPLACE bullet (has '__replaceBackdrop' in code) → 'transition_whoosh' at framesFrom
  - Bullet code contains 'spring(' AND 'damping' < 10 (heuristic) → 'reveal_hit' at framesFrom + 6
  - Bullet code contains 'typewriter'/'cps'/'visChars' → 'text_tick' on each word
    timestamp from captions inside this bullet's [framesFrom, framesTo)
  - Last bullet's framesTo - 8 (hard cut) → 'impact_soft'

These are RECOMMENDATIONS. Audio mixing into the final mp4 is wired in
build_video.py step 10 only when sfx_cues.json files exist for the project
(future hook — currently the file is written but not yet mixed).

Usage:
    python -m storyboard.sfx_emitter <project_name>
    python -m storyboard.sfx_emitter <project_name> --dry-run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _has(code: str, pat: str) -> bool:
    return pat in code


def _captions_words_in_window(caps: list[dict], lo_frame: int, hi_frame: int, fps: int) -> list[tuple[int, str]]:
    """Return (frame, word) for each Whisper word whose start time lies in
    the bullet's [lo, hi) frame window."""
    out = []
    for w in caps:
        s = w.get("start_seconds", w.get("start", 0))
        f = round(s * fps)
        if lo_frame <= f < hi_frame:
            out.append((f, w.get("word", "").strip()))
    return out


def emit_for_scene(scene_id: str, blocks: list[dict], captions: list[dict], fps: int = 30) -> dict:
    cues: list[dict] = []
    if not blocks:
        return {"scene_id": scene_id, "cues": cues}

    for i, block in enumerate(blocks):
        code = block.get("code", "")
        f_from = block["framesFrom"]
        f_to = block["framesTo"]

        # Entrance pop
        cues.append({
            "sound": "ui_pop", "frame": f_from, "volume": 0.08,
            "source": f"bullet {i+1} entrance",
        })

        # REPLACE backdrop → whoosh
        if _has(code, "__replaceBackdrop") or _has(code, "replaceBackdrop"):
            cues.append({
                "sound": "transition_whoosh", "frame": f_from, "volume": 0.10,
                "source": f"bullet {i+1} REPLACE transition",
            })

        # Spring with low damping → reveal hit
        spring_lowdamp = re.search(r"spring\([^)]*damping\s*:\s*([0-9]+)", code)
        if spring_lowdamp and int(spring_lowdamp.group(1)) <= 10:
            cues.append({
                "sound": "reveal_hit", "frame": f_from + 6, "volume": 0.12,
                "source": f"bullet {i+1} spring(damping={spring_lowdamp.group(1)})",
            })

        # Typewriter / per-word ticks (only if bullet looks like it types text)
        if _has(code, "cps") or _has(code, "visChars") or _has(code, "typewriter"):
            words_in = _captions_words_in_window(captions, f_from, f_to, fps)
            for f, w in words_in:
                cues.append({
                    "sound": "text_tick", "frame": f, "volume": 0.05,
                    "source": f"bullet {i+1} word '{w}'",
                })

        # findWord-driven flashes (icon flashes + similar) → soft impact
        if _has(code, "findWord("):
            words_in = _captions_words_in_window(captions, f_from, f_to, fps)
            for f, w in words_in:
                cues.append({
                    "sound": "impact_soft", "frame": f, "volume": 0.08,
                    "source": f"bullet {i+1} flash on '{w}'",
                })

    # Hard cut to black at scene end
    last = blocks[-1]
    cues.append({
        "sound": "impact_soft", "frame": last["framesTo"] - 6, "volume": 0.08,
        "source": "scene-end hard cut",
    })

    # Density limit: at most 3 cues per 10 frames (avoids muddy mix)
    cues.sort(key=lambda c: c["frame"])
    deduped: list[dict] = []
    for c in cues:
        if len(deduped) >= 1 and c["frame"] - deduped[-1]["frame"] < 4 and c["sound"] == deduped[-1]["sound"]:
            continue  # collapse same-sound stacks closer than ~4 frames
        deduped.append(c)
    return {"scene_id": scene_id, "cues": deduped}


def emit_for_project(project: str, fps: int = 30) -> dict:
    proj_dir = ROOT / "projects" / project
    scenes_dir = proj_dir / "scenes"
    captions_dir = proj_dir / "captions"
    if not scenes_dir.exists():
        return {"error": f"no scenes dir at {scenes_dir}"}
    out_dir = proj_dir / "sfx"
    out_dir.mkdir(parents=True, exist_ok=True)
    summary: dict[str, int] = {}
    for scene_json in sorted(scenes_dir.glob("*.json")):
        scene_id = scene_json.stem
        blocks = json.loads(scene_json.read_text(encoding="utf-8"))
        caps_path = captions_dir / f"{scene_id}.json"
        captions = json.loads(caps_path.read_text(encoding="utf-8")) if caps_path.exists() else []
        cue_map = emit_for_scene(scene_id, blocks, captions, fps)
        out_file = out_dir / f"{scene_id}_cues.json"
        out_file.write_text(json.dumps(cue_map, indent=2, ensure_ascii=False), encoding="utf-8")
        summary[scene_id] = len(cue_map["cues"])
    return summary


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("project")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print cues to stdout without writing JSON files")
    ap.add_argument("--fps", type=int, default=30)
    args = ap.parse_args(argv)
    sys.stdout.reconfigure(encoding="utf-8")

    if args.dry_run:
        proj_dir = ROOT / "projects" / args.project
        scenes_dir = proj_dir / "scenes"
        if not scenes_dir.exists():
            print(f"ERROR: no scenes dir at {scenes_dir}")
            return 1
        for scene_json in sorted(scenes_dir.glob("*.json")):
            scene_id = scene_json.stem
            blocks = json.loads(scene_json.read_text(encoding="utf-8"))
            caps_path = proj_dir / "captions" / f"{scene_id}.json"
            captions = json.loads(caps_path.read_text(encoding="utf-8")) if caps_path.exists() else []
            cue_map = emit_for_scene(scene_id, blocks, captions, args.fps)
            print(f"# {scene_id}: {len(cue_map['cues'])} cues")
            for c in cue_map["cues"]:
                print(f"  f={c['frame']:5d}  {c['sound']:24s} v={c['volume']:.02f}  ({c['source']})")
        return 0

    summary = emit_for_project(args.project, args.fps)
    if "error" in summary:
        print(f"ERROR: {summary['error']}")
        return 1
    print(f"[sfx] wrote cue files for {len(summary)} scene(s):")
    for sid, n in summary.items():
        print(f"  {sid}: {n} cues → projects/{args.project}/sfx/{sid}_cues.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
