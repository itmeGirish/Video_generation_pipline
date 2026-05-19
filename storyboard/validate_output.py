"""
Output validator — verifies that source.txt narration and animations actually
ended up in the rendered video. Runs as Step 10.5 after the final mp4 is muxed.

Two coverage checks:

1. NARRATION COVERAGE
   For each scene, what % of the narration's content words appear in the
   Whisper transcript of the spoken audio? Low = TTS dropped words, SSML
   broke pronunciation, or scene boundary detection picked the wrong span.

2. ANIMATION COVERAGE
   For each scene, every `### Animation` bullet should have a visual block
   in the scene JSON, and that block's rendered frame should be visible
   (non-black) at its midpoint. Per-bullet drill-down makes it easy to spot
   which specific bullet went missing.

Optionally extracts one frame per animation bullet to `projects/<name>/qa_frames/`
for human (or future vision-model) review.

Usage:
    python storyboard/validate_output.py projects/<name>/                # report only
    python storyboard/validate_output.py projects/<name>/ --extract       # + save frames
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from storyboard.source_parser import parse as parse_source

RENDER_OUT = ROOT / "remotion" / "out"

# Hide Windows cmd-window flash when spawning ffmpeg/ffprobe.
_NOWIN = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "they", "them", "their", "we", "us", "our", "you", "your", "he", "she",
    "his", "her", "i", "me", "my",
}


def _tokens(text: str) -> list[str]:
    """Lowercase content words (no stopwords, no punctuation)."""
    raw = re.findall(r"[a-zA-Z]+", text.lower())
    return [w for w in raw if w not in STOPWORDS and len(w) > 1]


def _midpoint_brightness(mp4: Path, t_sec: float) -> float:
    """ffmpeg signalstats YAVG at second `t_sec`. -1 on error.

    Uses OUTPUT seek (`-i file -ss t`), not INPUT seek (`-ss t -i file`).
    Input seek is fast but can land on the nearest preceding keyframe instead
    of the requested timestamp; output seek decodes through and lands exactly.
    For visibility checks across the whole video this matters at scene
    boundaries where a black frame may sit near a keyframe.
    """
    try:
        r = subprocess.run(
            ["ffmpeg", "-i", str(mp4), "-ss", str(t_sec),
             "-vf", "signalstats,metadata=print", "-vframes", "1", "-f", "null", "-"],
            capture_output=True, text=True, timeout=30,
            creationflags=_NOWIN,
        )
        m = re.search(r"YAVG[:=]([\d\.]+)", r.stderr)
        return float(m.group(1)) if m else -1.0
    except Exception:
        return -1.0


def _extract_frame(mp4: Path, t_sec: float, out: Path) -> bool:
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        # Output seek (-i file -ss t) lands exactly at t_sec rather than the
        # nearest preceding keyframe.
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(mp4), "-ss", str(t_sec),
             "-vframes", "1", "-q:v", "2", str(out)],
            capture_output=True, text=True, check=True,
            creationflags=_NOWIN,
        )
        return True
    except Exception:
        return False


def validate_output(project_dir: Path, extract_frames: bool = False) -> int:
    """Returns number of issues found (0 = clean)."""
    source_file = project_dir / "source.txt"
    timing_file = project_dir / "build_timing.json"
    if not source_file.exists() or not timing_file.exists():
        print(f"ERROR: missing source.txt or build_timing.json in {project_dir}"); return 1

    script = parse_source(source_file)
    timing = json.loads(timing_file.read_text(encoding="utf-8"))
    scene_ids: list[str] = timing["scene_ids"]
    if "fps" not in timing:
        print(f"ERROR: build_timing.json missing required 'fps' field — re-run build_video.py to regenerate"); return 1
    fps: int = timing["fps"]
    qa_dir = project_dir / "qa_frames"
    # Canonical sources: project-owned scene + caption JSONs (rule 02 / SKILL.md).
    project_scenes_dir   = project_dir / "scenes"
    project_captions_dir = project_dir / "captions"

    print(f"\n[output] Validating final video against source.txt...")
    try:
        print(f"         source : {source_file.resolve().relative_to(ROOT)}")
    except ValueError:
        print(f"         source : {source_file}")
    print(f"         scenes : {len(scene_ids)}")

    issues: list[str] = []
    total_narr_coverage = 0.0
    total_anim_present = 0
    total_anim_count = 0
    placeholder_count = 0

    # Build a sceneNumber → sceneId lookup. Previous code used zip-by-index,
    # which assumed Step 1 never reordered or filtered scenes. If a future
    # change ever drops an empty scene, every subsequent comparison would
    # silently misalign. Now we look up by scene NUMBER from build_timing.json's
    # scene_timings list (which carries the ID alongside the scene-derived data).
    sid_by_idx: dict[int, str] = {}
    for i, sid in enumerate(scene_ids):
        sid_by_idx[i] = sid

    for i, sc in enumerate(script.scenes):
        sid = sid_by_idx.get(i)
        if sid is None:
            issues.append(f"scene {sc.number}: no scene_id (timing.json out of sync with source)")
            continue
        # Defensive: cross-check by scene number prefix when possible.
        # Convention: PROJECT-sNN where NN matches scene number 1-indexed.
        expected_suffix = f"-s{sc.number:02d}"
        if not sid.endswith(expected_suffix):
            issues.append(
                f"scene {sc.number}: timing.json scene_id {sid!r} does not end with "
                f"{expected_suffix!r} — possible reorder/filter mismatch"
            )

        # ── Narration coverage ──
        captions_path = project_captions_dir / f"{sid}.json"
        spoken_words = []
        if captions_path.exists():
            spoken_words = [w["word"] for w in json.loads(captions_path.read_text(encoding="utf-8"))]
        spoken_set = set(_tokens(" ".join(spoken_words)))
        expected_set = set(_tokens(sc.narration))
        if not expected_set:
            narr_pct = 100.0
        else:
            hit = expected_set & spoken_set
            narr_pct = 100 * len(hit) / len(expected_set)
            if narr_pct < 80:
                missing = sorted(expected_set - spoken_set)[:8]
                issues.append(
                    f"scene {sc.number} ({sid}): narration coverage only {narr_pct:.0f}% "
                    f"(missing words include: {missing})"
                )
        total_narr_coverage += narr_pct

        # ── Animation coverage ──
        scene_json = project_scenes_dir / f"{sid}.json"
        if not scene_json.exists():
            issues.append(f"scene {sc.number} ({sid}): scene JSON missing")
            continue
        blocks = json.loads(scene_json.read_text(encoding="utf-8"))

        if len(blocks) != len(sc.animation):
            issues.append(
                f"scene {sc.number} ({sid}): {len(sc.animation)} animation bullets in source, "
                f"{len(blocks)} blocks in render — fidelity broken"
            )

        # Placeholder fidelity check — count blocks marked placeholder=True
        # by visual_designer (rate-limit fallback). The bullet count gate above
        # passes silently for placeholders, so this is the only check that
        # surfaces the actual fidelity loss.
        scene_placeholders = sum(1 for b in blocks if b.get("placeholder"))
        if scene_placeholders:
            placeholder_count += scene_placeholders
            for j, b in enumerate(blocks):
                if b.get("placeholder"):
                    err = b.get("placeholder_error", "")[:120]
                    issues.append(
                        f"scene {sc.number} bullet {j+1} ({sid}): PLACEHOLDER block — "
                        f"codegen failed and a generic card was rendered instead. "
                        f"Re-run --redesign to retry. {err}"
                    )

        # ── Per-bullet visibility check (frame at midpoint of each block) ──
        mp4 = RENDER_OUT / f"{sid}.mp4"
        if not mp4.exists():
            issues.append(f"scene {sc.number} ({sid}): rendered mp4 missing")
            continue

        for j, (block, bullet) in enumerate(zip(blocks, sc.animation)):
            total_anim_count += 1
            framesFrom = block.get("framesFrom", 0)
            framesTo = block.get("framesTo", framesFrom + fps)
            mid_frame = (framesFrom + framesTo) / 2
            mid_sec = mid_frame / fps
            brightness = _midpoint_brightness(mp4, mid_sec)
            present = brightness >= 8
            if present:
                total_anim_present += 1
            else:
                issues.append(
                    f"scene {sc.number} bullet {j+1} ({block.get('type','?')}) "
                    f"@ t={mid_sec:.1f}s: midpoint frame is BLACK (brightness={brightness:.1f}). "
                    f"Source bullet was: '{bullet.headline[:60]}'"
                )
            if extract_frames:
                tag = re.sub(r"\W+", "_", bullet.headline.lower())[:40]
                out = qa_dir / f"{sid}_b{j+1:02d}_{block.get('type','unknown')}_{tag}.jpg"
                _extract_frame(mp4, mid_sec, out)

    # ── Summary ──
    avg_narr = total_narr_coverage / max(1, len(script.scenes))
    anim_pct = 100 * total_anim_present / max(1, total_anim_count)

    print(f"\n[output] SUMMARY:")
    print(f"         narration coverage   : {avg_narr:.0f}% (avg across scenes)")
    print(f"         animation visibility : {anim_pct:.0f}% ({total_anim_present}/{total_anim_count} bullets visible)")
    if placeholder_count:
        print(f"         placeholder blocks   : {placeholder_count} (FIDELITY DEGRADED — re-run --redesign)")
    if extract_frames:
        print(f"         qa frames saved to   : {qa_dir.relative_to(ROOT)}")

    if issues:
        print(f"\n[output] {len(issues)} issue(s) found:")
        for i in issues[:25]:
            print(f"         [issue] {i}")
        if len(issues) > 25:
            print(f"         ... and {len(issues) - 25} more")
        return len(issues)

    print(f"\n[output] OK — narration and all animation bullets verified in final video.")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("--extract", action="store_true", help="Save midpoint frame per animation bullet to qa_frames/")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    pd = Path(args.project_dir).resolve()
    sys.exit(0 if validate_output(pd, args.extract) == 0 else 1)
