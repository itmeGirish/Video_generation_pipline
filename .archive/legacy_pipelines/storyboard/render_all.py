"""
Render each scene with a fresh Chrome process, then stitch with ffmpeg.
Avoids Chrome's cumulative memory leak over long renders (~10k+ frames).

Usage:
  python storyboard/render_all.py           # render + stitch all
  python storyboard/render_all.py hf01      # render one scene (no stitch)
  python storyboard/render_all.py --stitch  # just stitch existing per-scene MP4s
"""
import os
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path("c:/Girish/Fundamental_Projects/video_generation/video_explainer")
REMOTION_DIR = ROOT / "remotion"
OUT_DIR = REMOTION_DIR / "out"
OUT_DIR.mkdir(exist_ok=True)

SCENES = ["hf01", "hf02", "hf03", "hf04", "hf05", "hf06", "hf07"]
FINAL_NAME = "HarnessEngagementFilm.mp4"


def kill_chrome():
    """Clean slate before each render — ensures fresh browser process."""
    for proc in ["chrome.exe", "Remotion Chrome Headless Shell.exe"]:
        subprocess.run(["taskkill", "/F", "/IM", proc, "/T"],
                       capture_output=True, text=True)


def render_scene(scene_id: str, max_retries: int = 2, skip_if_exists: bool = True) -> Path:
    out_path = OUT_DIR / f"{scene_id}.mp4"
    if skip_if_exists and out_path.exists() and out_path.stat().st_size > 100_000:
        print(f"\n⏭  {scene_id} already rendered ({out_path.stat().st_size // (1024*1024)} MB) — skipping")
        return out_path

    for attempt in range(1, max_retries + 2):
        print(f"\n{'='*60}\n▶ Rendering {scene_id} (attempt {attempt}) → {out_path.name}\n{'='*60}")
        kill_chrome()
        env = {**os.environ, "PROJECT": os.environ.get("PROJECT", "harness_3"), "PYTHONIOENCODING": "utf-8"}
        result = subprocess.run(
            ["npx", "remotion", "render", scene_id,
             "--codec", "h264",
             "--concurrency", "2",
             "--timeout", "180000",
             "--output", str(out_path)],
            cwd=str(REMOTION_DIR), env=env, shell=True,
        )
        if result.returncode == 0 and out_path.exists():
            print(f"✓ {scene_id} rendered: {out_path.stat().st_size // (1024*1024)} MB")
            return out_path
        if attempt <= max_retries:
            print(f"⚠ {scene_id} failed (attempt {attempt}/{max_retries+1}), retrying...")
            import time
            time.sleep(5)
    raise RuntimeError(f"Render failed for {scene_id} after {max_retries+1} attempts")


def stitch(scene_files: list[Path]) -> Path:
    """ffmpeg concat demuxer: lossless join of already-encoded MP4s."""
    concat_list = OUT_DIR / "_concat.txt"
    concat_list.write_text("\n".join(f"file '{f.name}'" for f in scene_files), encoding="utf-8")
    out = OUT_DIR / FINAL_NAME
    print(f"\n▶ Stitching {len(scene_files)} scenes → {out.name}")
    result = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(concat_list),
         "-c", "copy", str(out)],
        cwd=str(OUT_DIR), capture_output=True, text=True,
    )
    if result.returncode != 0:
        # If streams aren't compatible for copy, re-encode
        print("  copy failed, re-encoding...")
        result = subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
             "-i", str(concat_list),
             "-c:v", "libx264", "-preset", "medium", "-crf", "18",
             "-c:a", "aac", "-b:a", "192k",
             str(out)],
            cwd=str(OUT_DIR),
        )
    concat_list.unlink(missing_ok=True)
    if result.returncode != 0:
        raise RuntimeError("ffmpeg stitch failed")
    print(f"✓ {out.name}: {out.stat().st_size // (1024*1024)} MB")
    return out


def main():
    args = [a for a in sys.argv[1:] if a != "--stitch"]
    stitch_only = "--stitch" in sys.argv

    scenes_to_render = args if args else SCENES

    scene_files = []
    if not stitch_only:
        for sid in scenes_to_render:
            scene_files.append(render_scene(sid))
    else:
        scene_files = [OUT_DIR / f"{sid}.mp4" for sid in SCENES]

    # Stitch unless user asked for single scene
    if not args or stitch_only:
        stitch([OUT_DIR / f"{sid}.mp4" for sid in SCENES])


if __name__ == "__main__":
    main()
