"""
Stitch silent td scenes with a SHORT 6-frame (200ms) crossfade between scenes,
then overlay the continuous narration audio.

Why 6 frames:
- Long enough (200ms) to smooth a hard-cut "shake" between busy visuals
- Short enough to not feel like a dissolve (no overlap clutter)
- Subliminal: the eye reads it as a clean cut, not a transition

Audio remains continuous (overlay AFTER video xfade) so narration is unbroken.
"""
import os
import json
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"
TMP = ROOT / "storyboard" / ".stitch_work"
AUDIO = ROOT / "projects" / os.environ.get("PROJECT", "harness_3") / "audio" / "vo-trading-full.mp3"
SCENES = [f"td{i:02d}" for i in range(1, 11)]
XFADE_SEC = 0.20   # 6 frames at 30fps — smoothing, not dissolving
FINAL = "Trading30Days.mp4"


def duration(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(p)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


def main():
    files = [TMP / f"{s}_clean.mp4" for s in SCENES]
    for f in files:
        if not f.exists():
            print(f"MISSING: {f}"); sys.exit(1)
    if not AUDIO.exists():
        print(f"MISSING: {AUDIO}"); sys.exit(1)

    durs = [duration(f) for f in files]
    print(f"Scene durations: {[f'{d:.1f}' for d in durs]}")

    # Build xfade chain on VIDEO ONLY (audio is overlaid separately)
    inputs = []
    for f in files:
        inputs += ["-i", str(f)]

    filter_parts = []
    vprev = "0:v"
    cum = durs[0]
    for i in range(1, len(files)):
        offset = cum - XFADE_SEC
        vout = f"v{i}"
        filter_parts.append(
            f"[{vprev}][{i}:v]xfade=transition=fade:duration={XFADE_SEC}:offset={offset:.3f}[{vout}]"
        )
        vprev = vout
        cum += durs[i] - XFADE_SEC

    filter_complex = ";".join(filter_parts)
    print(f"Stitching {len(files)} scenes with {XFADE_SEC}s ({int(XFADE_SEC*30)}-frame) crossfade")
    print(f"  expected video duration: {cum:.1f}s")

    # Step 1: video-only xfade output
    silent_xfade = TMP / "td_silent_xfade.mp4"
    r = subprocess.run(
        ["ffmpeg", "-y", *inputs,
         "-filter_complex", filter_complex,
         "-map", f"[{vprev}]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-pix_fmt", "yuv420p",
         "-an",
         str(silent_xfade)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("xfade failed:")
        print(r.stderr[-1500:])
        sys.exit(1)

    # Step 2: mux with continuous audio
    out = OUT / FINAL
    r = subprocess.run(
        ["ffmpeg", "-y",
         "-i", str(silent_xfade),
         "-i", str(AUDIO),
         "-c:v", "copy",
         "-c:a", "aac", "-b:a", "192k",
         "-map", "0:v:0", "-map", "1:a:0",
         "-shortest",
         str(out)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("mux failed:")
        print(r.stderr[-1500:])
        sys.exit(1)

    sz = out.stat().st_size // 1024 // 1024
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(out)],
                       capture_output=True, text=True)
    print(f"OK {out.name}: {sz} MB, {float(p.stdout.strip()):.1f}s")


if __name__ == "__main__":
    main()
