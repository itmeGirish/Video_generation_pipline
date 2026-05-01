"""Stitch 12 rh scenes into RealHarness.mp4 with 8-frame (0.27s) crossfades."""
import json
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"
SCENES = [f"rh{i:02d}" for i in range(1, 13)]
XFADE_SEC = 0.27  # ~8 frames at 30fps
FINAL = "RealHarness.mp4"


def duration(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "json", str(p)], capture_output=True, text=True)
    return float(json.loads(r.stdout)["format"]["duration"])


def main():
    files = [OUT / f"{s}.mp4" for s in SCENES]
    for f in files:
        if not f.exists():
            print(f"MISSING: {f}"); sys.exit(1)

    durs = [duration(f) for f in files]
    print(f"Scene durations: {[f'{d:.1f}' for d in durs]}")

    # Build ffmpeg xfade chain. For N scenes, N-1 xfade+acrossfade pairs.
    # Each xfade offset = cumulative duration - (i+1)*XFADE_SEC
    inputs = []
    for f in files:
        inputs += ["-i", str(f)]

    filter_parts = []
    vprev = "0:v"
    aprev = "0:a"
    cum = durs[0]
    for i in range(1, len(files)):
        offset = cum - XFADE_SEC
        vout = f"v{i}"
        aout = f"a{i}"
        filter_parts.append(
            f"[{vprev}][{i}:v]xfade=transition=fade:duration={XFADE_SEC}:offset={offset:.3f}[{vout}]"
        )
        filter_parts.append(
            f"[{aprev}][{i}:a]acrossfade=d={XFADE_SEC}[{aout}]"
        )
        vprev, aprev = vout, aout
        cum += durs[i] - XFADE_SEC

    filter_complex = ";".join(filter_parts)
    out = OUT / FINAL
    print(f"Stitching {len(files)} scenes with {XFADE_SEC}s crossfade → {out.name}")

    r = subprocess.run(
        ["ffmpeg", "-y", *inputs,
         "-filter_complex", filter_complex,
         "-map", f"[{vprev}]", "-map", f"[{aprev}]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-c:a", "aac", "-b:a", "192k",
         "-pix_fmt", "yuv420p",
         str(out)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("ffmpeg failed:")
        print(r.stderr[-2000:])
        sys.exit(1)
    sz = out.stat().st_size // 1024 // 1024
    print(f"OK {out.name}: {sz} MB, {cum:.1f}s total")


if __name__ == "__main__":
    main()
