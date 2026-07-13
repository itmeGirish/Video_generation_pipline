---
name: vg-video-duration
description: "Calculate the final video's duration — exactly after a build, or estimated before one. Use whenever asked how long the video is, the runtime, the total length, 'how many minutes,' duration check, chapter timing, or whether a script will hit a target length. Reads build_timing.json for the exact number; estimates from narration word count at the pinned WPM before TTS."
model: opus
---

# Video Duration Calculator

Two modes: **exact** (after a build — read the real number) and **estimate**
(before a build — from narration word count). Never guess when the exact number
exists on disk.

## Contents
- Exact duration (after a build)
- Estimated duration (before a build)
- Per-scene breakdown
- Why the two can differ
- Guidelines

---

## Exact duration (after a build)

`build_video.py` writes the ground-truth timing to
`projects/<name>/build_timing.json` — it is derived from the actual TTS audio
length (`ffprobe` on the rendered audio), so it is exact, not an estimate.

```bash
python -c "import json; d=json.load(open('projects/<name>/build_timing.json',encoding='utf-8')); \
s=d['total_sec']; print(f\"{s:.1f}s = {int(s//60)}:{int(s%60):02d}  ({d['total_frames']} frames @ {d['fps']}fps, {len(d['scene_timings'])} scenes)\")"
```

Fields:
- `total_sec` — exact runtime in seconds
- `total_frames` — `round(total_sec * fps)`
- `scene_timings[]` — per-scene `{id, durationFrames}` (divide by `fps` for seconds)

The final mp4's container duration should match `total_sec` within ~0.5s — rule 23
T9 / rule 22 flag a larger drift as a dropped scene.

---

## Estimated duration (before a build)

Before TTS exists, estimate from narration length. The pipeline speaks at a known
rate, so word count → seconds is reliable to ±10%.

```
estimated_seconds = total_narration_words / WPM * 60   +   sum(<pause Xs>)
```

- **WPM** — the pinned narration voice (`en-US-AndrewMultilingualNeural`) lands at
  roughly **150–170 words/min** at the default rate. Use **160 WPM** as the planning
  default; the build later prints the measured `_actual_wpm` to confirm.
- **Pauses** — add every `<pause Xs>` marker's seconds (they are real silence the
  estimate must include).

```bash
# Estimate from a structured script (words + pause seconds).
# NOTE: narration lines may be indented before the '>' — match ^\s*> , not ^> .
python -c "import re; t=open('projects/structured_scripts/<name>.txt',encoding='utf-8').read(); \
narr=' '.join(re.findall(r'^\s*>\s?(.*)$', t, re.M)); \
words=len(re.findall(r'\b\w+\b', re.sub(r'<pause[^>]*>','',narr))); \
pauses=sum(float(x) for x in re.findall(r'<pause\s+([\d.]+)s?>', t)); \
sec=words/160*60+pauses; print(f'~{sec:.0f}s = {int(sec//60)}:{int(sec%60):02d}  ({words} words, {pauses:.1f}s pauses @160wpm)')"
```

Treat the result as a planning number: if it overshoots the target length, cut
narration (script_generation rule 06.5 cut pass); if it undershoots, the scene is
thin.

---

## Per-scene breakdown

For a length budget per scene (e.g. "is scene 4 too long?"):

```bash
python -c "import json; d=json.load(open('projects/<name>/build_timing.json',encoding='utf-8')); fps=d['fps']; \
[print(f\"{s['id']}: {s['durationFrames']/fps:.1f}s\") for s in d['scene_timings']]"
```

A scene over ~120s is a drop-off risk (script_generation rule 01) — split it.

---

## Why the two can differ

The estimate uses a fixed WPM; the exact number uses the real TTS audio. They
diverge when:
- the voice's actual rate differs from 160 WPM (the build prints `_actual_wpm`)
- `<pause Xs>` markers or the narration pacer (rule 05) inserted silence
- a scene was dropped or TTS errored (rule 23 T9 catches the drift)

When they disagree by more than ~10%, trust `build_timing.json` and check the
build log for the measured WPM and any pacer-inserted silence.

---

## Guidelines

### Always
- After a build, read `build_timing.json` — it is exact; do not re-estimate
- Before a build, estimate from word count at 160 WPM + pause seconds
- Include `<pause Xs>` seconds in any pre-build estimate
- Report as `M:SS` and confirm against the target length

### Never
- Quote a duration from the script's `(M:SS – M:SS)` headers as final — those are
  author proposals; the real number comes from TTS (SKILL.md "ALWAYS VERIFY")
- Estimate when `build_timing.json` already exists
