"""
Trim leading/trailing silence from each td scene mp4, then hard-cut concat.
Leaves a small breath margin so cuts feel natural (not abrupt).
Output: Trading30Days.mp4 with continuous narration flow.
"""
import json
import subprocess
import sys
import re
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"
TMP = ROOT / "storyboard" / ".trim_work"
TMP.mkdir(exist_ok=True)
SCENES = [f"td{i:02d}" for i in range(1, 11)]
LEAD_KEEP = 0.04    # seconds of silence to keep at scene start (small breath)
TRAIL_KEEP = 0.10   # seconds at scene end (avoid abrupt clip)
SILENCE_DB = "-40dB"
FINAL = "Trading30Days.mp4"


def detect_silence(mp4: Path):
    r = subprocess.run(
        ["ffmpeg", "-i", str(mp4), "-af", f"silencedetect=n={SILENCE_DB}:d=0.1",
         "-vn", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    dur_match = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    total = 0.0
    if dur_match:
        h, m, s = dur_match.groups()
        total = int(h) * 3600 + int(m) * 60 + float(s)
    lead = 0.0
    trail = 0.0
    if starts and ends:
        if starts[0] < 0.1:
            lead = ends[0]
        # Trailing silence: last silence segment that extends close to end of file.
        # Look for any silence that STARTS within last 2 seconds of file.
        for s, e in zip(reversed(starts), reversed(ends + [total])):
            if s > total - 2.0:
                # Last silence stretches to end if its end (or the inferred end) is near total
                if e >= total - 0.05 or len(starts) > len(ends):
                    trail = total - s
                    break
        # Fallback: if last silence_end matches total, treat as trailing
        if trail == 0.0 and ends and abs(ends[-1] - total) < 0.1 and starts[-1] < total - 0.05:
            trail = total - starts[-1]
    return lead, trail, total


def trim_scene(scene: str):
    src = OUT / f"{scene}.mp4"
    dst = TMP / f"{scene}_trimmed.mp4"
    lead, trail, total = detect_silence(src)
    start = max(0.0, lead - LEAD_KEEP)
    end = total - max(0.0, trail - TRAIL_KEEP)
    new_dur = end - start
    print(f"  {scene}: {total:.1f}s → {new_dur:.1f}s  (cut lead={lead - LEAD_KEEP:.2f}s, trail={trail - TRAIL_KEEP:.2f}s)")
    r = subprocess.run(
        ["ffmpeg", "-y", "-ss", f"{start:.3f}", "-to", f"{end:.3f}",
         "-i", str(src),
         "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-c:a", "aac", "-b:a", "192k",
         "-pix_fmt", "yuv420p",
         str(dst)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print(f"  ERROR trimming {scene}:")
        print(r.stderr[-500:])
        sys.exit(1)
    return dst


def main():
    print("Trimming silence from each scene...")
    trimmed = [trim_scene(s) for s in SCENES]

    # Concat list
    concat_file = TMP / "concat.txt"
    concat_file.write_text(
        "\n".join(f"file '{p.resolve()}'" for p in trimmed),
        encoding="utf-8",
    )

    out = OUT / FINAL
    print(f"\nConcat → {out.name} ...")
    # Re-encode on concat to ensure no glitches at boundaries
    r = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(concat_file),
         "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-c:a", "aac", "-b:a", "192k",
         "-pix_fmt", "yuv420p",
         str(out)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("ffmpeg concat failed:")
        print(r.stderr[-1500:])
        sys.exit(1)
    sz = out.stat().st_size // 1024 // 1024
    # Get final duration
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(out)],
                       capture_output=True, text=True)
    print(f"OK {out.name}: {sz} MB, {float(p.stdout.strip()):.1f}s")


if __name__ == "__main__":
    main()
