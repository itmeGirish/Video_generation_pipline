"""
storyboard visualize — emit an HTML trust artifact showing phase boundaries,
anchors, and transcript-per-phase for every compiled scene. Human can scan
this in ~30s instead of watching a full 8-min render.

Usage:
  python storyboard/visualize.py              → builds all
  python storyboard/visualize.py hf07 hf04    → specific scenes
"""
import os
import hashlib
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path("c:/Girish/Fundamental_Projects/video_generation/video_explainer")
TIMELINES_DIR = ROOT / "storyboard" / "timelines"
CACHE_DIR = ROOT / "storyboard" / ".cache"
AUDIO_DIR = ROOT / "projects" / os.environ.get("PROJECT", "harness_3") / "audio"
OUT = ROOT / "storyboard" / "visualize.html"

COLORS = ["#22D3EE", "#A78BFA", "#F59E0B", "#22C55E", "#EF4444", "#EC4899", "#10B981"]


def load_transcript(audio_file: str) -> list[dict]:
    audio_path = AUDIO_DIR / audio_file
    h = hashlib.sha256(audio_path.read_bytes()).hexdigest()[:16]
    cache = CACHE_DIR / f"transcript-{h}.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    return []


def render_scene(t: dict) -> str:
    """Render one scene as an HTML block with timeline + transcript per phase."""
    words = load_transcript(t["audioFile"])
    fps = t["fps"]
    total = t["durationFrames"]

    # Timeline SVG bar
    w = 1100
    h = 80
    svg_bars = []
    for i, ph in enumerate(t["phases"]):
        x1 = ph["fromFrame"] / total * w
        x2 = ph["toFrame"] / total * w
        color = COLORS[i % len(COLORS)]
        svg_bars.append(
            f'<rect x="{x1:.1f}" y="20" width="{x2-x1:.1f}" height="40" '
            f'fill="{color}" opacity="0.8" />'
            f'<text x="{(x1+x2)/2:.1f}" y="44" fill="#fff" font-size="11" '
            f'text-anchor="middle" font-family="monospace">{ph["id"]}</text>'
        )

    # Anchor ticks
    for aname, frame in t["anchors"].items():
        x = frame / total * w
        svg_bars.append(
            f'<line x1="{x:.1f}" y1="10" x2="{x:.1f}" y2="70" stroke="#fff" stroke-width="1" opacity="0.5" />'
            f'<text x="{x:.1f}" y="8" fill="#888" font-size="9" text-anchor="middle" font-family="monospace">{aname}</text>'
        )

    svg = f'<svg width="{w}" height="{h}" style="background:#0A1628;border-radius:6px;margin:8px 0;">{"".join(svg_bars)}</svg>'

    # Per-phase word blocks
    phase_blocks = []
    for i, ph in enumerate(t["phases"]):
        from_s = ph["fromFrame"] / fps
        to_s = ph["toFrame"] / fps
        words_in_phase = [w["word"] for w in words if from_s <= w["start"] < to_s]
        preview = " ".join(words_in_phase[:40])
        if len(words_in_phase) > 40:
            preview += " ..."
        color = COLORS[i % len(COLORS)]
        preview_html = preview if preview else '<em style="color:#666">[no words in this phase]</em>'
        phase_blocks.append(
            f'<div style="border-left:4px solid {color};padding:8px 14px;margin:6px 0;background:#111E34;border-radius:4px;">'
            f'<div style="color:{color};font-family:monospace;font-size:11px;font-weight:700;">'
            f'{ph["id"]} &nbsp;&nbsp; f{ph["fromFrame"]}-{ph["toFrame"]} &nbsp;&nbsp; ({to_s-from_s:.1f}s)'
            f'</div>'
            f'<div style="color:#E8F4FF;font-size:12px;margin-top:4px;">{preview_html}</div>'
            f'</div>'
        )

    return (
        f'<section style="margin:30px 0;padding:20px;background:#060A12;border-radius:10px;border:1px solid #333;">'
        f'<h2 style="color:#22D3EE;margin:0 0 6px;font-family:Inter,sans-serif;">{t["id"]}</h2>'
        f'<div style="color:#888;font-size:13px;font-family:monospace;">'
        f'{t["durationSeconds"]:.1f}s · {total} frames · {len(t["phases"])} phases · {len(t["anchors"])} anchors · audio: {t["audioFile"]}'
        f'</div>'
        f'{svg}'
        f'<div>{"".join(phase_blocks)}</div>'
        f'</section>'
    )


def main():
    ids = sys.argv[1:] if len(sys.argv) > 1 else None
    timelines = []
    for f in sorted(TIMELINES_DIR.glob("*.json")):
        if f.name == "manifest.json":
            continue
        t = json.loads(f.read_text(encoding="utf-8"))
        if ids and t["id"] not in ids:
            continue
        timelines.append(t)

    manifest = {}
    mf = TIMELINES_DIR / "manifest.json"
    if mf.exists():
        manifest = json.loads(mf.read_text(encoding="utf-8"))

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Storyboard — Timeline Visualizer</title>
<style>
  body {{ background:#050811; color:#E8F4FF; font-family:Inter,sans-serif; padding:30px; max-width:1200px;margin:auto; }}
  h1 {{ color:#22D3EE; margin:0; }}
  .meta {{ color:#888; font-family:monospace; font-size:13px; margin:6px 0 20px; }}
</style></head>
<body>
  <h1>Storyboard Timelines</h1>
  <div class="meta">
    {len(timelines)} scene(s) · built at {manifest.get("built_at_utc","?")} · voice={manifest.get("tts_voice","?")}
  </div>
  {"".join(render_scene(t) for t in timelines)}
</body></html>
"""
    OUT.write_text(html, encoding="utf-8")
    print(f"✓ wrote {OUT}")
    print(f"  open with: start {OUT}")


if __name__ == "__main__":
    main()
