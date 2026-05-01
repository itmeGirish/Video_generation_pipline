"""Render 10 td scenes via single-bundle, then ffmpeg crossfade-stitch."""
import os, subprocess, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path("c:/Girish/Fundamental_Projects/video_generation/video_explainer")
REMOTION_DIR = ROOT / "remotion"
OUT_DIR = REMOTION_DIR / "out"
OUT_DIR.mkdir(exist_ok=True)

SCENES = [f"td{i:02d}" for i in range(1, 11)]
FINAL = "Trading30Days.mp4"


def stitch_concat():
    """Fast concat — fallback if crossfade fails."""
    concat = OUT_DIR / "_td_concat.txt"
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
        stitch_concat()
        return

    scenes = args if args else SCENES
    # PROJECT defaults to trading_30days for td scenes; override via env if needed.
    env = {**os.environ, "PROJECT": os.environ.get("PROJECT", "trading_30days"), "PYTHONIOENCODING": "utf-8"}
    r = subprocess.run(
        ["node", "render_scenes.mjs", "--td", *scenes],
        cwd=str(REMOTION_DIR), env=env, shell=True,
    )
    if r.returncode != 0:
        print("Render failed")
        sys.exit(1)

    if not args:
        stitch_concat()


if __name__ == "__main__":
    main()
