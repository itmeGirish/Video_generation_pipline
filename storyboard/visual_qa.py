"""
Post-render visual QA — runs after Step 9 (scene renders).

Catches:
  - Scene mp4 missing or zero-byte (render silently failed)
  - Midpoint frame is uniform black/dark (renders OK but visual is empty —
    classic symptom of D.surface=undefined, missing primitive after regression,
    or animation completing before it starts)
  - Primitive distribution heavily skewed (LLM stuck on one type)

Does NOT need a vision model. Uses ffprobe + ffmpeg + a tiny pixel variance check.
True vision-model QA (text overflow, contrast, layout) is a separate, future step
that requires the Anthropic SDK with image support.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

# Hide Windows cmd-window flash when spawning ffprobe/ffmpeg.
_NOWIN = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0


def _probe_duration(path: Path) -> float:
    """Get media file duration in seconds via ffprobe. Returns -1 on error."""
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, check=True,
            creationflags=_NOWIN,
        )
        return float(r.stdout.strip())
    except Exception:
        return -1.0


def _midpoint_frame_brightness(path: Path, fps: int) -> float:
    """Extract midpoint frame and compute mean brightness (0..255). -1 on error.
    Uses ffmpeg's signalstats filter — fast and dependency-free."""
    dur = _probe_duration(path)
    if dur <= 0:
        return -1.0
    midpoint_sec = dur / 2
    try:
        # signalstats only prints stats when chained with metadata=print.
        # Real format: lavfi.signalstats.YAVG=118.409 (with =, not :)
        r = subprocess.run(
            ["ffmpeg", "-ss", str(midpoint_sec), "-i", str(path),
             "-vf", "signalstats,metadata=print", "-vframes", "1", "-f", "null", "-"],
            capture_output=True, text=True, timeout=30,
            creationflags=_NOWIN,
        )
        m = re.search(r"YAVG[:=]([\d\.]+)", r.stderr)
        if m:
            return float(m.group(1))
    except Exception:
        pass
    return -1.0


def run_qa(scene_ids: list[str], scenes_dir: Path, render_out: Path, fps: int) -> int:
    """Returns the number of issues found (0 = clean)."""
    print(f"\n[QA] Visual sanity check on {len(scene_ids)} rendered scenes...")
    issues: list[str] = []
    type_counter: Counter[str] = Counter()

    for sid in scene_ids:
        mp4 = render_out / f"{sid}.mp4"
        scene_json = scenes_dir / f"{sid}.json"

        # Tally primitive types from the scene JSON
        if scene_json.exists():
            blocks = json.loads(scene_json.read_text(encoding="utf-8"))
            for b in blocks:
                if "type" in b:
                    type_counter[b["type"]] += 1

        if not mp4.exists():
            issues.append(f"{sid}: rendered mp4 MISSING at {mp4}")
            continue
        size_mb = mp4.stat().st_size / 1024 / 1024
        if mp4.stat().st_size < 100_000:
            issues.append(f"{sid}: mp4 only {size_mb:.2f} MB (suspiciously small — render likely failed)")
            continue

        dur = _probe_duration(mp4)
        if dur <= 0:
            issues.append(f"{sid}: cannot read mp4 duration (corrupt file?)")
            continue

        brightness = _midpoint_frame_brightness(mp4, fps)
        if brightness < 0:
            print(f"      {sid}: ok ({size_mb:.1f} MB, {dur:.1f}s, brightness=?)")
        elif brightness < 8:
            # YAVG < 8 on 0..255 scale = essentially black frame.
            # Allowed at scene start/end (Backdrop fade), but at midpoint = empty render.
            issues.append(
                f"{sid}: midpoint frame is BLACK (brightness={brightness:.1f}) — "
                f"likely empty render. Check scene JSON has visual blocks at midpoint."
            )
        else:
            print(f"      {sid}: ok ({size_mb:.1f} MB, {dur:.1f}s, brightness={brightness:.1f})")

    # Primitive distribution report
    print(f"\n[QA] Primitive type distribution:")
    total = sum(type_counter.values())
    if total > 0:
        for t, n in type_counter.most_common():
            pct = 100 * n / total
            bar = "█" * int(pct / 2)
            print(f"      {t:30s} {n:3d}  {bar} {pct:.0f}%")
        # Warn if one type dominates >60% — LLM may be stuck
        top_pct = 100 * type_counter.most_common(1)[0][1] / total
        if top_pct > 60:
            issues.append(
                f"primitive distribution heavily skewed: '{type_counter.most_common(1)[0][0]}' "
                f"accounts for {top_pct:.0f}% of all blocks. LLM may be stuck on one type — "
                f"make source.txt animation bullets more varied."
            )

    # Final report
    if issues:
        print(f"\n[QA] {len(issues)} issue(s) found:")
        for i in issues:
            print(f"      [issue] {i}")
        print(f"\n[QA] Review issues. Most are not fatal — final mp4 may still play, "
              f"but quality may suffer.")
    else:
        print(f"\n[QA] OK — all renders passed sanity checks.")
    return len(issues)


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    pd = Path(args.project_dir).resolve()
    timing = json.loads((pd / "build_timing.json").read_text(encoding="utf-8"))
    if "fps" not in timing:
        print(f"ERROR: build_timing.json missing required 'fps' field — re-run build_video.py to regenerate"); sys.exit(1)
    root = Path(__file__).resolve().parents[1]
    n = run_qa(
        scene_ids=timing["scene_ids"],
        scenes_dir=pd / "scenes",   # canonical location is project-owned per rule 02
        render_out=root / "remotion" / "out",
        fps=timing["fps"],
    )
    sys.exit(0 if n == 0 else 1)
