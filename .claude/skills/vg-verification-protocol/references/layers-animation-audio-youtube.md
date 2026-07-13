# Verification — Layer 1.5 (animation A1–A8) + Layer 2 (audio) + Layer 3 (YouTube technical) — full procedures

Reference for `vg-verification-protocol`. HOW to run the animation filmstrip checks (A1–A8 incl. A4 freeze + A5 PSNR), the audio-quality layer (listen test, −14 LUFS/TP, coverage, mid-bullet coherence), and the T1–T12 YouTube upload gate + side artifacts + final report.

---

## LAYER 1.5 — ANIMATION VALIDATION

V8 proves animation existed at one moment. This layer proves it **moves correctly,
settles on time, and holds cleanly** across the full bullet duration.

> **Source of truth for animation correctness = the `remotion` skill.** Each check here
> verifies behavior the remotion rules define — when one fails, fix against that rule:
> - A4 freeze / element not moving → `remotion/rules/animations.md` (must be `useCurrentFrame()`-driven, no CSS)
> - A5 motion magnitude / A7 spring settlement → `remotion/rules/timing.md` (interpolate clamping, spring configs)
> - A6 REPLACE / scene transitions → `remotion/rules/transitions.md`
> - staggered / sequenced reveals → `remotion/rules/sequencing.md`
> - text typewriter / reveal effects → `remotion/rules/text-animations.md`
> A4/A5/A6 failures are almost always a remotion-rule violation in the authored code —
> read the matching rule before re-authoring.

---

### A1 — Filmstrip Extraction (5 frames per bullet)

Extract frames at 10 / 30 / 50 / 70 / 90% of every bullet's duration:

```python
import json, subprocess, os
from pathlib import Path
fps = 30
scene   = '<scene-id>'
project = '<project_name>'
blocks  = json.loads(Path(f'projects/{project}/scenes/{scene}.json').read_text('utf-8'))
os.makedirs('c:/tmp/filmstrip', exist_ok=True)
for b in blocks:
    d = b['framesTo'] - b['framesFrom']
    print(f'B{b["bulletIndex"]+1}  [{b["framesFrom"]}–{b["framesTo"]}f  dur={d}f]')
    for p in [0.10, 0.30, 0.50, 0.70, 0.90]:
        fr  = b['framesFrom'] + int(d * p)
        out = f'c:/tmp/filmstrip/{scene}_b{b["bulletIndex"]+1}_p{int(p*100):02d}.jpg'
        subprocess.run(['ffmpeg','-y','-i', f'remotion/out/{scene}.mp4',
            '-ss', str(fr/fps), '-frames:v','1','-q:v','2', out], capture_output=True)
```

Read frames in order: `p10 → p30 → p50 → p70 → p90`.

---

### A2 — Per-Frame Animation Checks

| Frame | What to check | Pass | Fail |
|---|---|---|---|
| **p10** | Animation started — element in motion, not settled | Partially entered / partial opacity / bar at ~15% | Already at final position OR invisible |
| **p30** | Significant motion — clearly different from p10 | Noticeably closer to final position | Same as p10 (spring finished too fast) |
| **p50** | Element visible and well-formed | On-screen, content readable | Still off-screen, black, or transparent |
| **p70** | Settling — nearly at final position | Slight difference from p50 | Still in heavy motion (too slow) |
| **p90** | Complete — settled, held, readable | Same or nearly same as p70 | Still moving (jitter / underdamped) |

**Key invariant:** `p10 ≠ p30 ≠ p50` (motion present) AND `p70 ≈ p90` (settled by 70%)

---

### A3 — Animation Type Filmstrip Signatures

#### Entrance / slide-in
```
p10: element ~30% off-edge, partially entered
p30: element ~70% traveled, slight overshoot if bouncy
p70: at final position ± tiny jitter
p90: locked at final position, fully visible
```

#### Fade-in (opacity 0→1)
```
p10: opacity ~0.1–0.2
p30: opacity ~0.4–0.5
p50: opacity ~0.7–0.8
p70+: opacity 1.0
```

#### Bar chart (height 0→target)
```
p10: bars at ~15% final height (stubs visible)
p30: bars at ~55% height
p50: bars at ~85% height
p70+: bars at full height, labels visible
```

#### Staggered list
```
p10: first 1–2 items visible
p30: first 3–4 items visible
p50: ~half of all items visible
p70+: all items visible
```

#### Typewriter
```
p10: first few characters
p30: ~30% of text
p50: ~55% of text
p90: full text
```

#### Stamp scale-in
```
p10: stamp at ~25% scale (visible but tiny)
p30: stamp at ~80% scale
p50+: full scale, centered, readable
```

#### Counter count-up
```
p10: number at ~10% of target
p30: ~40–50% of target
p70+: final value, held
```

---

### A4 — Freeze Detection

Finds bullets where animation stops too early — leaving a long static hold:

```powershell
ffmpeg -i remotion/out/<scene-id>.mp4 `
    -vf "freezedetect=n=-60dB:d=2.0" `
    -f null - 2>&1 | Select-String "freeze_start|freeze_end|freeze_duration"
```

Map freeze times to bullets using `framesFrom/framesTo ÷ fps` from scene JSON.

**FAIL:** freeze > 3.0s inside a bullet that is not the final hold frame.

Fix: switch spring from `snappy` (settles ~18f) to `heavy` (settles ~80f), or add a
second-phase animation (pulse, count-up, secondary stagger) to keep screen alive.

---

### A5 — Motion Magnitude (PSNR check)

Confirms motion is VISIBLE between p10 and p70 — not just mathematically different:

```python
import subprocess, json
from pathlib import Path
fps   = 30
scene = '<scene-id>'
project = '<project_name>'
blocks  = json.loads(Path(f'projects/{project}/scenes/{scene}.json').read_text('utf-8'))
for b in blocks:
    d  = b['framesTo'] - b['framesFrom']
    t1 = (b['framesFrom'] + int(d * 0.10)) / fps
    t2 = (b['framesFrom'] + int(d * 0.70)) / fps
    subprocess.run(['ffmpeg','-y',
        '-ss', str(t1), '-i', f'remotion/out/{scene}.mp4', '-frames:v','1', 'c:/tmp/_a.png',
        '-ss', str(t2), '-i', f'remotion/out/{scene}.mp4', '-frames:v','1', 'c:/tmp/_b.png'],
        capture_output=True)
    r = subprocess.run(['ffmpeg','-i','c:/tmp/_a.png','-i','c:/tmp/_b.png',
        '-lavfi','psnr','-f','null','-'], capture_output=True, text=True)
    line = next((l for l in r.stderr.split('\n') if 'average' in l), 'no output')
    print(f'B{b["bulletIndex"]+1} p10→p70: {line.strip()[:70]}')
```

| PSNR | Motion | Verdict |
|---|---|---|
| < 25 dB | Heavy motion | ✅ Clearly visible |
| 25–35 dB | Moderate | ✅ Visible |
| 35–45 dB | Subtle | ⚠ May feel static |
| > 45 dB | Near-identical | ❌ FAIL — animation done too early |

---

### A6 — REPLACE Transition Check

Run only for REPLACE bullets — identified by `AbsoluteFill` present in the bullet's `code`
field (ADDITIVE bullets keep prior content intentionally; checking them gives false fails).

```python
import json, subprocess, os
from pathlib import Path
fps = 30; scene = '<scene-id>'; project = '<project_name>'
blocks = json.loads(Path(f'projects/{project}/scenes/{scene}.json').read_text('utf-8'))
os.makedirs('c:/tmp/replace', exist_ok=True)
replace_bullets = [b for b in blocks if 'AbsoluteFill' in b.get('code', '')]
if not replace_bullets:
    print('No REPLACE bullets found — skip A6')
for b in replace_bullets:
    if b['framesFrom'] == 0:
        print(f'B{b["bulletIndex"]+1} is scene-start REPLACE — no prior content to check')
        continue
    for offset, label in [(1,'before'), (5,'mid'), (12,'after')]:
        fr  = b['framesFrom'] + offset
        out = f'c:/tmp/replace/{scene}_b{b["bulletIndex"]+1}_t{label}.jpg'
        subprocess.run(['ffmpeg','-y','-i', f'remotion/out/{scene}.mp4',
            '-ss', str(fr/fps), '-frames:v','1','-q:v','2', out], capture_output=True)
    print(f'B{b["bulletIndex"]+1} REPLACE transition at frame {b["framesFrom"]}')
```

| Frame offset | Expected | Fail |
|---|---|---|
| +1 | Prior content still visible (fade just started) | All black → opacity ramp too fast |
| +5 | Backdrop partially covering old content (mix) | Old content fully gone → too fast; old still visible → backdrop broken |
| +12 | New content clear, old fully hidden | Old content bleeding through → used plain `div` instead of `AbsoluteFill` |

**ADDITIVE bullets**: skip A6 entirely — prior content remaining on screen is correct behavior.

---

### A7 — Spring Settlement Safety Check (pre-render, code-level)

| Config | Settles by frame | Safe for bullet duration ≥ |
|---|---|---|
| `snappy` — `{damping:20, stiffness:200}` | ~18–22f | 25f (0.8s) |
| `smooth` — `{damping:200}` | ~20–25f | 30f (1.0s) |
| `bouncy` — `{damping:8}` | ~60–80f | 100f (3.3s) |
| `heavy` — `{damping:15, stiffness:80, mass:2}` | ~80–100f | 120f (4.0s) |

If `framesTo − framesFrom < settlement_frame` for the chosen config → animation cut mid-bounce.
Use `snappy`/`smooth` for short bullets (< 60f). Reserve `bouncy`/`heavy` for long windows (> 3s narration).

---

### A8 — Animation Summary Table (fill per scene)

| Bullet | p10≠p30 | p70≈p90 | p50 visible | freeze <3s | REPLACE clean | Verdict |
|---|---|---|---|---|---|---|
| B1 | | | | | — | |
| B2 | | | | | | |
| B3 | | | | | — | |
| BN | | | | | | |

✅ = pass  ❌ = fail  — = not applicable

---

## LAYER 2 — AUDIO QUALITY

### 2.1 Narration Quality — Listen Test

Listen to `projects/<project>/audio/vo-*.mp3` alone. Must pass all:

| Check | Pass | Fail | Fix |
|---|---|---|---|
| Pacing | Varied — short punchy sentences land as punches | Monotone drone | Aggressive punctuation; short sentences; em dashes |
| Hero words | Key numbers / verdicts feel punchy via rhythm | Key words buried in long flat sentences | Move hero word to end: "The answer? Four." |
| No pause literals | Audio never says "pause zero point three s" | Literal `pause` spoken | `ssml_compiler._convert_author_pauses` must run before `_escape` |
| No clipping | Every sentence completes naturally | Words cut off mid-sentence | Check scene boundary + `window_to_sec` |
| WPM | 130–160 WPM | < 120 (sluggish) or > 180 (rushing) | `audio.rate: '+N%'` in config.yaml — formula: `round((150/actual_wpm-1)*100)%` |
| No long silences | No gap > 2s | 3–5s dead air | Narration pacer bug Class 19 — verify `MAX_DISPLAY_SECONDS=2.0` |

WPM appears in build log step 4:
```
audio: 565.37s (16961 frames)
WPM: 134 (target 150)    ← must be 130–160
```

---

### 2.2 Audio Technical Standards

```bash
ffprobe -v quiet -print_format json -show_streams projects/<project>/out/<project>.mp4
```

| Check | Required | Fail |
|---|---|---|
| Codec | AAC (`aac`) | Any other codec — silent YouTube failure |
| Sample rate | 48000 Hz | Non-standard → YouTube re-encode |
| Channels | 2 stereo | Mono → left-ear-only on mobile |
| Bitrate | ≥ 192 kbps | < 192 → audible artifacts |
| Loudness target | −14 LUFS (I), −1 TP, LRA 11 | Mismatch → YouTube compression kills dynamics |

Loudness check:
```bash
ffmpeg -i projects/<project>/out/<project>.mp4 \
    -af loudnorm=print_format=summary -f null - 2>&1 \
    | grep "Input Integrated\|Input True Peak\|Input LRA"
```

---

### 2.3 Narration Coverage

```bash
python storyboard/validate_output.py projects/<project>/ --extract
```

| Coverage | Verdict |
|---|---|
| ≥ 90% | ✅ PASS |
| 80–90% | ⚠ WARN — TTS imperfection acceptable |
| < 80% | ❌ FAIL — scene boundary error or SSML issue |

Any `ERROR` line in validate_output output = FAIL (error overlay visible in video).
Any `placeholder blocks` count > 0 = FAIL (generic placeholder card in video).

---

### 2.4.5 — Layer 2.5 Mid-Bullet Audio Coherence (new)

Layer 2.1 anchor-drift check confirms that visual N fires at the moment its
anchor word is spoken. It does NOT check what happens between anchors — i.e.
whether the visual still relates to the spoken audio 5/10/15 seconds INTO the
bullet's playback.

Bullets that play for > 8 seconds with no visual change drift from the audio.
In the 2026-05 ai_thinking_levels render this caused two glaring failures:

| Bullet | Duration on screen | Visual | Audio actually said |
|---|---|---|---|
| B2 | 11.6s | scratchpad (anchor: "thousands of hidden") | "thousands of hidden... → ... The answer? Identical to..." |
| B4 | **22.5s** | identical-answer cards (anchor: "identical output") | "identical output → Cloud calls it effort → OpenAI calls reasoning → Google calls thinking → expose the same lever" |

The B4 case is severe: 22.5s of one visual while audio covers 5 different
topics. A muted viewer sees the right thing; a sound-on viewer hears
audio-visual desync.

**Coherence check:**

```python
# per-bullet, sample audio every 3 seconds; assert the active visual
# is still relevant to spoken word.
for b in scene:
    start, end = b['framesFrom']/fps, b['framesTo']/fps
    for t in range(int(start), int(end), 3):
        spoken = words_in_window(captions, t, t+3)
        # 'topical match' = anchor word OR any noun in bullet headline appears in spoken
        if not topical_match(spoken, b['audio_anchor'], b['headline']):
            warn(f'B{i}: at {t:.0f}s, spoken {spoken!r} no longer matches visual {b["audio_anchor"]!r}')
```

**Threshold:** if a bullet is on screen > 8s and topical_match drops for > 5s
of continuous audio, flag for either:
- Adding intermediate script anchor (preferred — splits the bullet)
- Mid-bullet visual morph using `frame > X` state transitions inside the
  bullet code (less invasive but harder to author)

---

### 2.4 The 4 Quality Levers

| Lever | Test | Fix |
|---|---|---|
| **Drama** | Listen alone — does it hold attention full duration? | Shorter, punchier sentences |
| **Clarity** | Watch muted — does each visual tell the story alone? | Run muted-viewer test (1.1) |
| **Sync** | Watch with audio — do visuals change at the spoken key word? | Tighten audio_anchors; fix drift > 1s |
| **Pacing** | Count visual changes in first 60s — ≥ 8? | Split large bullets into 2–3 sub-bullets |

---

## LAYER 3 — YOUTUBE TECHNICAL STANDARDS

Run only after Layers 1, 1.5, and 2 pass. This is the upload gate.

```bash
ffprobe -v quiet -print_format json -show_streams -show_format \
    projects/<project>/out/<project>.mp4
```

### Technical Checks

| # | Check | Required | FAIL | WARN |
|---|---|---|---|---|
| T1 | Resolution | 1920×1080 px, 16:9 | ≠ 1920×1080 | — |
| T2 | Frame rate | 30 fps | ≠ 30 fps | — |
| T3 | Video codec | H.264, profile High, level ≥4.0 | codec ≠ h264 | — |
| T4 | Video bitrate | ≥ 8 Mbps | — | < 5 Mbps → blocking on text/animation |
| T5 | Audio codec | AAC | ≠ aac | — |
| T6 | Audio channels | 2 stereo | < 2 channels | — |
| T7 | Audio bitrate | ≥ 192 kbps | — | < 192 kbps |
| T8 | Sample rate | 48000 Hz | — | 44100 Hz |
| T9 | Duration match | ≤ 3s drift vs expected | > 3s = dropped scene | — |
| T10 | First frame | Not black | Pure black | — |
| T11 | Last frame | Not black | Pure black | — |
| T12 | Faststart | moov atom at file start | moov at end | — |

Fix commands:
```bash
# Re-mux with faststart + correct audio (lossless video copy, fast)
ffmpeg -i input.mp4 -c:v copy -c:a aac -ar 48000 -ac 2 -b:a 192k \
    -movflags +faststart output.mp4

# Re-encode video at target bitrate (T4 WARN)
ffmpeg -i input.mp4 -c:v libx264 -profile:v high -level 4.0 \
    -b:v 8M -maxrate 10M -bufsize 20M -c:a copy \
    -movflags +faststart output.mp4
```

---

### Side Artifacts

| Artifact | File | Requirement | Why |
|---|---|---|---|
| SRT captions | `out/<project>.srt` | ≥ 50 entries | Auto-captions have errors on technical terms |
| Chapters | `out/chapters.txt` | Starts at `0:00`, one line per scene | Reduces drop-off on 7+ min videos |
| Thumbnail | `out/thumbnail.jpg` | 1280×720 px, < 2 MB, 16:9 | YouTube picks a random (often black) frame if missing |

```bash
# Check captions
python -c "c=open('projects/<project>/out/<project>.srt').read(); print('SRT entries:', c.count('-->'))"

# Extract thumbnail at the thumbnail-moment timestamp from the script strategy block
ffmpeg -i projects/<project>/out/<project>.mp4 -ss <timestamp> \
    -frames:v 1 -q:v 1 projects/<project>/out/thumbnail.jpg

# Chapters are auto-generated during the normal build at:
#   projects/<project>/out/<project>.chapters.txt
# Re-run the full build if chapters file is missing.
```

---

### Final Upload Report (fill out before uploading)

```
YOUTUBE VALIDATION — <project>.mp4
Duration: M:SS    File size: X.X MB    WPM: NNN

LAYER 1 — VISUAL
  Muted-viewer walkthrough:     [ ] PASS
  Canvas ≥60% all bullets:      [ ] PASS
  V1–V8 all scenes:             [ ] PASS
  Pacing ≥8 changes/min:        [ ] PASS

LAYER 1.5 — ANIMATION
  Filmstrip A1–A2 (motion + settle):  [ ] PASS
  Freeze detection A4 (<3s):          [ ] PASS
  PSNR motion A5 (<45dB):             [ ] PASS
  REPLACE transitions A6:             [ ] PASS

LAYER 2 — AUDIO
  WPM 130–160:                  [ ] PASS  (actual: ___)
  No pause literals:            [ ] PASS
  No long silences (>2s):       [ ] PASS
  Narration coverage ≥90%:      [ ] PASS  (actual: ___)
  AAC stereo 48kHz ≥192kbps:    [ ] PASS

LAYER 3 — TECHNICAL
  T1  1920×1080:                [ ] PASS
  T2  30 fps:                   [ ] PASS
  T3  H.264 High:               [ ] PASS
  T4  Bitrate ≥8 Mbps:          [ ] PASS  (actual: ___ Mbps)
  T5–T8 Audio specs:            [ ] PASS
  T9  Duration match:           [ ] PASS  (drift: ___s)
  T10 First frame not black:    [ ] PASS
  T11 Last frame not black:     [ ] PASS
  T12 Faststart:                [ ] PASS
  SRT captions:                 [ ] PASS  (___ entries)
  Chapters file:                [ ] PASS
  Thumbnail 1280×720:           [ ] PASS

VERDICT:  [ ] UPLOAD-READY   [ ] NEEDS FIXES
```

---
