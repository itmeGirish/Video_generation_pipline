"""
Final stitch for continuous-audio td video.

Concat all 10 silent td*.mp4 scenes (visuals only) and overlay the continuous
narration from vo-trading-full.mp3. No per-scene audio bleed, no intonation
resets, narrator never restarts.
"""
import os
import json
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"
AUDIO_DIR = ROOT / "projects" / os.environ.get("PROJECT", "harness_3") / "audio"
TMP = ROOT / "storyboard" / ".stitch_work"
TMP.mkdir(exist_ok=True)
SCENES = [f"td{i:02d}" for i in range(1, 11)]
FULL_AUDIO = AUDIO_DIR / "vo-trading-full.mp3"
FINAL = "Trading30Days.mp4"


def main():
    files = [OUT / f"{s}.mp4" for s in SCENES]
    for f in files:
        if not f.exists():
            print(f"MISSING: {f}"); sys.exit(1)
    if not FULL_AUDIO.exists():
        print(f"MISSING: {FULL_AUDIO}"); sys.exit(1)

    # 1. Concat silent video scenes (use copy if codecs match)
    concat_file = TMP / "concat.txt"
    concat_file.write_text(
        "\n".join(f"file '{p.resolve()}'" for p in files),
        encoding="utf-8",
    )
    silent_video = TMP / "td_silent_video.mp4"
    print(f"Concat {len(files)} silent scenes → {silent_video.name} ...")
    r = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(concat_file),
         "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-pix_fmt", "yuv420p",
         "-an",
         str(silent_video)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("concat failed:")
        print(r.stderr[-1500:])
        sys.exit(1)

    # 2. Get video duration
    p = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(silent_video)],
        capture_output=True, text=True,
    )
    video_dur = float(p.stdout.strip())

    p = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(FULL_AUDIO)],
        capture_output=True, text=True,
    )
    audio_dur = float(p.stdout.strip())
    print(f"  silent video: {video_dur:.2f}s")
    print(f"  full audio:   {audio_dur:.2f}s")

    if abs(video_dur - audio_dur) > 1.0:
        print(f"  WARNING: video and audio durations differ by {abs(video_dur-audio_dur):.2f}s — "
              f"compile_td_continuous may need re-running")

    # 3. Mux silent video with continuous audio
    out = OUT / FINAL
    print(f"Muxing audio → {out.name} ...")
    r = subprocess.run(
        ["ffmpeg", "-y",
         "-i", str(silent_video),
         "-i", str(FULL_AUDIO),
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
    print(f"OK {out.name}: {sz} MB")


if __name__ == "__main__":
    main()
