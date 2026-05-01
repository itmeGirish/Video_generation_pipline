"""Render 12 rh scenes via programmatic single-bundle, then ffmpeg stitch."""
import os, subprocess, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path("c:/Girish/Fundamental_Projects/video_generation/video_explainer")
REMOTION_DIR = ROOT / "remotion"
OUT_DIR = REMOTION_DIR / "out"
OUT_DIR.mkdir(exist_ok=True)

SCENES = [f"rh{i:02d}" for i in range(1, 13)]
FINAL = "RealHarness.mp4"


def stitch():
    concat = OUT_DIR / "_rh_concat.txt"
    concat.write_text("\n".join(f"file '{s}.mp4'" for s in SCENES), encoding="utf-8")
    out = OUT_DIR / FINAL
    print(f"\n▶ Stitching {len(SCENES)} scenes → {out.name}")
    r = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(concat), "-c", "copy", str(out)],
        cwd=str(OUT_DIR), capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("  copy failed, re-encoding...")
        r = subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
             "-i", str(concat),
             "-c:v", "libx264", "-preset", "medium", "-crf", "18",
             "-c:a", "aac", "-b:a", "192k",
             str(out)],
            cwd=str(OUT_DIR),
        )
    concat.unlink(missing_ok=True)
    if r.returncode == 0:
        print(f"✓ {out.name}: {out.stat().st_size // (1024*1024)} MB")
    return r.returncode == 0


def main():
    args = [a for a in sys.argv[1:] if a != "--stitch"]
    stitch_only = "--stitch" in sys.argv

    if stitch_only:
        stitch()
        return

    scenes = args if args else SCENES
    env = {**os.environ, "PROJECT": os.environ.get("PROJECT", "harness_3"), "PYTHONIOENCODING": "utf-8"}
    r = subprocess.run(
        ["node", "render_scenes.mjs", "--rh", *scenes],
        cwd=str(REMOTION_DIR), env=env, shell=True,
    )
    if r.returncode != 0:
        print("Render failed")
        sys.exit(1)

    if not args:  # rendered all → stitch
        stitch()


if __name__ == "__main__":
    main()
