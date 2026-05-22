---
name: youtube-output-validation
description: Final YouTube upload standards check on the finished mp4. Validates resolution, codec, bitrate, frame rate, audio, captions, thumbnail, and chapter timestamps before the video is upload-ready. Run AFTER rule 12 (internal pipeline QA) passes.
metadata:
  tags: youtube, upload, validation, codec, bitrate, audio, captions, thumbnail, chapters, ffprobe
---

# YouTube Output Validation — Rule 22

Rule 12 checks that every narration word and animation bullet made it into the video.
This rule checks that the finished mp4 meets YouTube's technical upload standards.

Run this as the final step before declaring the video upload-ready.

---

## How to run

Use `ffprobe` to inspect the final mp4. All checks below are derived from its output.

```bash
ffprobe -v quiet -print_format json -show_streams -show_format projects/<name>/out/<name>.mp4
```

Also check side artifacts (thumbnail, captions, chapters) separately.

---

## Check 1 — Resolution (FAIL if wrong)

| Requirement | Value |
|---|---|
| Width | 1920 px |
| Height | 1080 px |
| Aspect ratio | 16:9 |

YouTube accepts lower resolutions but processes 1080p as the standard quality tier.
Anything below 1280×720 will be flagged as low quality by YouTube's processing pipeline.

**FAIL condition:** `width != 1920` or `height != 1080`
**Fix:** Re-render with Remotion canvas set to `1920 × 1080` (check `remotion/src/Root.tsx` composition dimensions).

---

## Check 2 — Frame rate (FAIL if wrong)

| Requirement | Value |
|---|---|
| Frame rate | 30 fps |

YouTube supports 24, 25, 30, 48, 50, 60 fps. Our pipeline renders at 30 fps.
Mixed frame rates in a concat cause stuttering and YouTube re-encoding artifacts.

**FAIL condition:** `r_frame_rate != 30/1`
**Fix:** Check `config.yaml` fps field and Remotion composition fps. All scenes must match.

---

## Check 3 — Video codec (FAIL if wrong)

| Requirement | Value |
|---|---|
| Codec | H.264 (`libx264`) |
| Profile | High |
| Level | 4.0 or higher |

H.264 is YouTube's preferred codec. It processes fastest and has highest compatibility.
AV1 and HEVC are supported but may delay processing by 30-60 minutes on YouTube's end.

**FAIL condition:** `codec_name != "h264"`
**Fix:** Re-render with `ffmpeg -c:v libx264 -profile:v high -level 4.0`

---

## Check 4 — Video bitrate (WARN if low)

| Resolution | Minimum | Recommended |
|---|---|---|
| 1080p30 | 5 Mbps | 8 Mbps |
| 1080p60 | 7.5 Mbps | 12 Mbps |

Low bitrate causes YouTube's compression to introduce visible artifacts (blocking, banding)
especially on fast-moving animations and high-contrast text.

**WARN condition:** `bit_rate < 5000000` (5 Mbps)
**Fix:** Add `-b:v 8M -maxrate 10M -bufsize 20M` to the ffmpeg stitch command in `build_video.py`.

---

## Check 5 — Audio codec (FAIL if wrong)

| Requirement | Value |
|---|---|
| Codec | AAC (`aac`) |
| Sample rate | 48000 Hz or 44100 Hz |
| Channels | 2 (stereo) |
| Bitrate | ≥ 192 kbps |

YouTube requires AAC audio. MP3 in an mp4 container causes silent upload failures.
Mono audio (1 channel) plays only in the left ear on some devices.

**FAIL condition:** `codec_name != "aac"` or `channels != 2`
**WARN condition:** `bit_rate < 192000`
**Fix:** Re-mux with `ffmpeg -c:a aac -ar 48000 -ac 2 -b:a 192k`

---

## Check 6 — Duration consistency (WARN if mismatch)

Compare:
1. `ffprobe` reported duration (seconds)
2. Expected duration from structured script (sum of all scene time windows)

**WARN condition:** `|actual_duration - expected_duration| > 3.0 seconds`

A large gap means a scene was dropped during stitch or TTS ran significantly over/under.
**Fix:** Check stitch log for missing scene mp4 files; re-run affected scenes.

---

## Check 7 — No black frames at start/end (WARN if present)

The first and last frames must not be pure black.
Black frame at start = YouTube may use it as the auto-thumbnail (looks bad in feed).
Black frame at end = viewer sees dead black before the next video loads.

```bash
ffmpeg -i projects/<name>/out/<name>.mp4 -vf "select=eq(n\,0)" -frames:v 1 -f image2 /tmp/first_frame.png
ffmpeg -sseof -1 -i projects/<name>/out/<name>.mp4 -frames:v 1 /tmp/last_frame.png
```

Read both images. **WARN** if either is pure black.
**Fix:** Add a 0.5s fade-in on Scene 1 bullet 1; add a hold frame on the last scene's final visual.

---

## Check 8 — Captions file (WARN if missing)

YouTube allows SRT upload for accurate captions. Auto-captions have errors that hurt
viewer trust on technical content.

**Required:** `projects/<name>/out/<name>.srt` exists and is non-empty.

Check:
```bash
python -c "
with open('projects/<name>/out/<name>.srt') as f:
    content = f.read()
    print('Lines:', len(content.splitlines()))
    print('Entries:', content.count('-->'))"
```

**WARN condition:** SRT file missing or has 0 entries.
**Fix:** Run `python storyboard/build_video.py <name> --captions-only` to regenerate from Whisper output.

---

## Check 9 — Thumbnail (WARN if missing or wrong size)

YouTube thumbnail requirements:
- Resolution: 1280 × 720 px minimum
- Format: JPG or PNG
- File size: under 2 MB
- Aspect ratio: 16:9

**Required:** `projects/<name>/out/thumbnail.jpg` or `thumbnail.png` exists.

```bash
ffprobe -v quiet -print_format json -show_streams projects/<name>/out/thumbnail.jpg
```

**WARN condition:** Thumbnail missing, or dimensions < 1280×720, or file > 2 MB.
**Fix:** Extract the thumbnail moment frame defined in the script's strategy block:
```bash
ffmpeg -i projects/<name>/out/<name>.mp4 -ss <timestamp> -frames:v 1 projects/<name>/out/thumbnail.jpg
```

---

## Check 10 — Chapter timestamps (WARN if missing)

YouTube chapters improve watch time by letting viewers navigate. They appear when
the video description contains timestamps in `MM:SS` or `HH:MM:SS` format, starting at `0:00`.

**Required:** `projects/<name>/out/chapters.txt` exists with one line per scene:
```
0:00 Hook
0:45 Context
2:10 How It Works
4:30 The Surprising Part
6:15 The Verdict
```

**WARN condition:** `chapters.txt` missing.
**Fix:** Generate from scene time windows in the structured script:
```bash
python storyboard/build_video.py <name> --chapters-only
```

---

## YouTube output validation report format

```
YOUTUBE VALIDATION — <name>.mp4
Duration: M:SS   File size: X.X MB

Check 1  Resolution:    PASS   1920×1080 ✓
Check 2  Frame rate:    PASS   30 fps ✓
Check 3  Video codec:   PASS   H.264 High ✓
Check 4  Video bitrate: WARN   4.2 Mbps (recommended ≥ 8 Mbps)
Check 5  Audio:         PASS   AAC 48kHz stereo 192kbps ✓
Check 6  Duration:      PASS   actual 8:42 vs expected 8:39 (Δ3s) ✓
Check 7  Black frames:  PASS   first/last frames non-black ✓
Check 8  Captions:      PASS   312 SRT entries ✓
Check 9  Thumbnail:     PASS   1280×720 JPG 480KB ✓
Check 10 Chapters:      WARN   chapters.txt missing

VERDICT: UPLOAD-READY WITH WARNINGS
  Fix before upload: video bitrate (Check 4), chapters (Check 10)
```

---

## Verdict levels

| Verdict | Meaning |
|---|---|
| **UPLOAD-READY** | All 10 checks PASS. Upload now. |
| **UPLOAD-READY WITH WARNINGS** | No FAILs, some WARNs. Upload OK but fix WARNs for best quality. |
| **NOT READY** | One or more FAILs. Fix before uploading — YouTube may reject or heavily re-compress. |

---

## What YouTube does to non-compliant videos

| Issue | YouTube consequence |
|---|---|
| Wrong codec | Re-encodes — adds 1-4 hours processing delay, quality loss |
| Low bitrate | Visible blocking artifacts on animations, especially text |
| Mono audio | Left-ear-only on many mobile devices |
| Missing captions | Auto-captions used — errors common on technical terms |
| No thumbnail | YouTube picks a random frame — usually a transition or black frame |
| No chapters | Viewers cannot navigate; drop-off higher on 8+ min videos |
| < 1080p | YouTube serves lower quality tier; smaller in search results |
