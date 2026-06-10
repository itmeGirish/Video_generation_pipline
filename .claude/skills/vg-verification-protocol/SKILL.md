---
name: vg-verification-protocol
description: "5-layer YouTube production quality gate: pre-render image-asset validation (presence + decode + license + relevance), V1-V13 visual frame inspection incl. V14 image-actually-rendered, A1-A8 animation filmstrip incl. Ken Burns motion for image bullets, audio WPM/coverage + anchor-drift, YouTube T1-T12 technical standards. Run after every render before advancing to next scene. Use whenever verifying a render, validating fetched images, running QA, or any request like "verify the render," "V1-V8 check," "image asset gate," "quality gate," "filmstrip," "audio sync verification," "frame inspection," or "is this scene done.""
---

# Verification Protocol — YouTube Production Quality Gate

Four layers run in order. A scene does not advance until its layer passes.
The final mp4 does not upload until all four layers pass.

```
LAYER 1   Visual Quality       (before authoring + after render)
LAYER 1.5 Animation Validation (after render — filmstrip + motion checks)
LAYER 2   Audio Quality        (after TTS + after final render)
LAYER 3   YouTube Technical    (final mp4 only — upload gate)
```

---

## Contents

- The per-scene RENDER → VERIFY → FIX loop (mandatory)
- The `verification.md` artifact — MANDATORY written record
- Scene s01 — <scene-id>
- 🔊 AUDIO SYNC CHECK — MANDATORY PER SCENE
- LAYER 0.5 — IMAGE ASSET VALIDATION (pre-render gate)
- LAYER 1 — VISUAL QUALITY
- LAYER 1.5 — ANIMATION VALIDATION
- LAYER 2 — AUDIO QUALITY
- LAYER 3 — YOUTUBE TECHNICAL STANDARDS
- Where this fits in the pipeline

---

## The per-scene RENDER → VERIFY → FIX loop (mandatory)

Reference: rule 00 Step 4 for the full loop. Summary here for fast lookup.

**NEVER render scenes 2-N before scene 1 passes verification.** Hard-won
from production: a bug missed at scene 1 wastes 30+ min of compounded
render time later.

```
FOR each scene N (1 ascending):
  0. IMAGE ASSETS (pre-render gate — Layer 0.5):
       - every [asset:] in the scene resolves to a real, decodable file
       - each auto-fetched image inspected with the Read tool (relevance)
       - license recorded in a sidecar / CREDITS.md
       - skip if the scene has no [asset:] refs
  1. RENDER scene N only (single-scene flag)
  2. VERIFY scene N (run ALL of the checks below — no skipping):
       a. Visual: V1-V13 frame inspection
       a'. V14 — every [asset:] bullet shows the image (not broken-box)
       b. Animation: A1-A8 filmstrip + freeze + PSNR — image bullets MUST pass
          A4 (Ken Burns means no freeze) and A5 (visible motion)
       c. AUDIO SYNC: anchor-drift check (MUST run — see block below)
       d. Audio coherence: mid-bullet topical match
       e. Caption zone: V9c top<h*0.88 + bottom>h*0.10
       f. PRODUCTION-QUALITY SCORECARD: invoke `vg-visual-quality` — it runs the
          8 factor gates (`vg-quality-animations` / `-timing` / `-sequencing` /
          `-transitions` / `-text-fit` / `-images` / `-tokens` / `-vchecks`) on the
          extracted frames. Scene must score ≥70% (target 80+); any factor ≤4/10,
          any V-check fail, or a systemic weakness = NOT READY. V-checks (a) answer
          "is it broken?"; this answers "is it production-grade?" — both required.
       g. RHYTHM (dead-air check): for each beat, does the visual keep changing while
          its narration keeps adding meaning? A beat whose visual sits UNCHANGED while
          the narrator delivers several distinct ideas = dead air → FAIL: subdivide that
          span into evolving sub-beats (script-animation-bullets §Rhythm). Judge by
          meaning vs visual change, not a fixed duration. (Real failure: a hook visual
          held static through three spoken ideas — 8s of one label.)

  ⚠ FRAME SAMPLING: extract verify frames at each bullet's MIDPOINT
    (`framesFrom + (framesTo−framesFrom)/2`), NOT at fixed wall-clock intervals.
    Fixed intervals land on bullet STARTS where entrance springs read ~0, so elements
    look "missing" — a false alarm. Always sample mid-beat.
  3. IF FAIL:
       - identify failing bullet(s) / factor(s)
       - for AUDIO SYNC failure: update framesFrom = round(word_start*fps)
         in scene JSON + remotion/public mirror, re-render scene only
       - for QUALITY-SCORECARD failure: improve the weakest factor per its
         `vg-quality-*` skill (motion/easing/stagger are the usual culprits), re-author, re-render
       - for VISUAL failure: fix React.createElement code OR bullet body
       - delete bullet cache: rm storyboard/.cache/designs/bullet-s0N-bXX-*.json
       - re-seed via seed_bullet_cache.py
       - rm remotion/out/<name>-s0N.mp4
       - GO TO step 1
  4. IF PASS:
       - WRITE the scene's section to projects/<name>/verification.md
         (mandatory written record — see "The verification.md artifact" below)
       - mark scene N PASS in todo list (this enforces honest tracking)
       - ONLY THEN render scene N+1
```

A scene is NOT marked PASS in the todo list until its `verification.md`
section is written with real frame evidence. "Looks right from the code"
is the absence of a check, not a check.

Stitching (rule 09) + final mp4 happens ONCE at the end after the last
scene passes. Never stitch mid-loop.

---

## The `verification.md` artifact — MANDATORY written record

Every project keeps ONE verification log at **`projects/<name>/verification.md`**.
It is the durable proof that each scene was inspected — not assumed. The
per-scene loop appends a section the moment a scene reaches a verdict; the
final upload report is appended once after stitch.

**Rules:**
- ONE file per project: `projects/<name>/verification.md`. Append per scene; never
  silently overwrite the whole file. On a re-render after a fix, **replace that one
  scene's section** with the latest result.
- A scene is NOT marked PASS until its section is written here with frame evidence —
  real ffmpeg-extracted frame paths (from `c:/tmp/verify`, `c:/tmp/filmstrip`) that
  were actually opened with the Read tool, and real drift numbers printed by the
  audio-sync script.
- Every verdict cell must trace to evidence. A `✅` with no frame path or no printed
  number behind it is a hallucinated pass — the exact failure mode this file exists
  to prevent.
- Write with `build_video.atomic_write_text` semantics if scripting it; a hand-written
  file via the Write/Edit tool is fine.

### Template — one block per scene (copy, fill, append)

```markdown
# <name> — Verification Log

Project: <name>   fps: 30   resolution: 1920×1080
Per-scene RENDER → VERIFY → FIX loop (rule 23). Each scene below was
inspected from extracted frames, not code.

---

## Scene s01 — <scene-id>
Rendered: <YYYY-MM-DD HH:MM>   mp4: remotion/out/<scene-id>.mp4
Bullets: <N>   Frames read: <N×2 mid+sync> + <N×5 filmstrip>

### Audio sync  (drift = framesFrom/fps − word_start; PERFECT ±0.05s, PASS −0.5..+1.5s)
| Bullet | anchor | fire | word@start | drift | verdict |
|---|---|---|---|---|---|
| B1 | "..." | 0.00s | "..."@0.00s | +0.00s | PERFECT |

### Layer 1 — Visual V1–V13  (✅ pass / ❌ fail / — n/a)
| Bullet | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 | V9 | V10 | V11 | V13 | frame evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B1 |   |   |   |   |   |   |   |   |   |    |    |    | c:/tmp/verify/<scene-id>_b1_mid.jpg |

### Layer 1.5 — Animation A1–A8
| Bullet | p10≠p30 | p70≈p90 | p50 visible | freeze<3s | PSNR | REPLACE | verdict |
|---|---|---|---|---|---|---|---|
| B1 |   |   |   |   |   | — |   |

### Layer 2 — Audio (scene-level)
WPM: ___   coverage: ___%   pause literals: none/___   silence >2s: none/___

### Observations  (one line per bullet — what is ACTUALLY on screen)
- B1: ___

**SCENE VERDICT:** [ ] PASS   [ ] FAIL
```

### Final section — appended once after stitch

After the last scene passes and the final mp4 is stitched, append the
**Final Upload Report** block (the `YOUTUBE VALIDATION` template in Layer 3
§"Final Upload Report") to the bottom of the same `verification.md`. That makes
the one file the complete record: every scene's PASS plus the Layer 3 upload gate.

---

## 🔊 AUDIO SYNC CHECK — MANDATORY PER SCENE

**Run AFTER every render. NEVER advance to next scene with a sync WARN or FAIL.**

This check verifies that each bullet's `framesFrom` matches the actual Whisper
word timestamp for its `audio_anchor`. Production bugs in `ai_thinking_levels`
proved this slips through visual inspection — must be run programmatically
on every scene.

### Step 1 — Read the data

```python
import json
from pathlib import Path

scene_id = "ai-thinking-levels-s01"   # change per scene
fps      = 30

scene_path = Path(f"projects/<name>/scenes/{scene_id}.json")
caps_path  = Path(f"projects/<name>/captions/{scene_id}.json")

scene = json.loads(scene_path.read_text(encoding="utf-8"))
words = json.loads(caps_path.read_text(encoding="utf-8"))
```

### Step 2 — For each bullet, compute drift

```python
def find_word(anchor, words):
    """Find anchor in Whisper words. Try several substitution forms because
    Whisper transcribes numbers/words inconsistently."""
    anchor_low = anchor.lower().strip()
    # Whisper-form substitutions (extend per project):
    subs = [
        anchor_low,
        anchor_low.replace("twelve", "12"),
        anchor_low.replace("fifty",  "50"),
        anchor_low.replace("twenty-three", "23"),
        anchor_low.replace("multi-step", "multi -step"),   # Whisper splits hyphens
        anchor_low.replace("scratchpad", "scratch pad"),
        anchor_low.replace("forty-nine point six", "49 .6"),
        anchor_low.replace("forty-eight point one", "48 .1"),
    ]
    first_word = anchor_low.split()[0]
    closest = None
    for w in words:
        wlow = w["word"].lower().strip(".,!?\":;-")
        if first_word in wlow or wlow in first_word:
            return w
    return None

for i, b in enumerate(scene):
    fire_s    = b["framesFrom"] / fps
    anchor    = b["audio_anchor"]
    word      = find_word(anchor, words)
    if not word:
        print(f"B{i+1}: anchor {anchor!r} NOT FOUND — try more substitutions OR check anchor exists in narration")
        continue
    drift = fire_s - word["start"]
    verdict = (
        "PERFECT" if abs(drift) < 0.05 else
        "PASS"    if -0.50 <= drift <= +1.50 else
        "WARN"    if +1.50 <  drift <= +2.00 else
        "FAIL"
    )
    print(f"B{i+1}: fire={fire_s:.2f}s  word={word['word']!r}@{word['start']:.2f}s  "
          f"drift={drift:+.2f}s  [{verdict}]")
```

### Step 3 — Verdict thresholds (DO NOT SKIP WARN)

| Drift | Verdict | Action |
|---|---|---|
| ±0.05s | ✅ PERFECT | Continue |
| −0.50s to +1.50s | ✅ PASS | Continue |
| +1.50s to +2.00s | ⚠ **WARN** | **MUST FIX** — set `framesFrom = round(word_start*fps)`, re-render, do NOT advance |
| > +2.00s | ❌ FAIL | Same fix as WARN |
| < −1.00s | ⚠ WARN | Either move framesFrom earlier OR confirm it's the first-bullet PASS-FIRST exemption (scene opens before any spoken word) |

### Step 4 — On WARN/FAIL: fix in BOTH locations

The scene JSON exists in TWO places and BOTH must be updated:

```python
import json, shutil
fix_scene = "projects/<name>/scenes/ai-thinking-levels-s0N.json"
with open(fix_scene, encoding="utf-8") as f:
    scene = json.load(f)
scene[bullet_idx]["framesFrom"] = round(word_start * 30)
# Also update previous bullet's framesTo to match if needed
with open(fix_scene, "w", encoding="utf-8") as f:
    json.dump(scene, f, indent=2, ensure_ascii=False)
# CRITICAL: mirror to remotion/public/scenes/ — Remotion reads from this path
shutil.copy(fix_scene, "remotion/public/scenes/ai-thinking-levels-s0N.json")
```

Then delete `remotion/out/<name>-s0N.mp4` and re-render the scene.

### Step 5 — The constraint case

If moving `B[N].framesFrom` earlier would collapse `B[N-1]` below
`MIN_BLOCK_SECONDS` (default 1.0s), do ONE of:
- Accept +1.5–2.0s WARN on B[N], document why (B[N-1] needs minimum visible time)
- Add an earlier anchor in the script that fires B[N-1] sooner
- Combine B[N-1] and B[N] into one bullet

### Why this is mandatory (lessons from production)

- **+1.83s WARN on multi-step proofs** in pre-S2 build slipped through because
  the verifier's anchor-matcher was loose with hyphenation. The Whisper-form
  substitutions in Step 2 above are the structural fix.
- **+0.65s drift on B4** in S6 ai_thinking_levels production: badges fired
  during "Low effort," instead of on "$23" word. Caught only after Layer 2
  systematic check, NOT after visual inspection.
- A scene that LOOKS right but has +1.7s audio drift makes the viewer
  hear "while AI says X" and see "the visual for Y" — viewer mentally
  disconnects narration from visuals. Worse than a render bug because
  it's invisible to the developer doing visual-only review.

---

---

## LAYER 0.5 — IMAGE ASSET VALIDATION (pre-render gate)

Runs BEFORE TTS / render — catches missing, broken, off-topic, or unlicensed
images before you burn 25+ minutes of render time on a scene that renders
broken-image boxes. Step 2.6 ASSET RESOLUTION auto-fetches missing `[asset:]`
from Openverse, **but auto-fetch is blind** (top result, no visual inspection).
Layer 0.5 is what catches the wrong logo / off-topic stock photo before render.

Skip the whole layer only if the scene has zero `[asset:]` refs.

### 0.5.1 — Asset presence (HARD gate)

Every `[asset: <path>]` in the structured script must resolve to a real file:

```bash
# refs declared in the script
grep -oE '\[asset:[^]]+\]' projects/structured_scripts/<name>.txt \
  | sed 's/\[asset: *//; s/\]//' | sort -u > /tmp/refs.txt
# files actually present
( cd projects/<name>/public && find img -type f ) | sort -u > /tmp/files.txt
# anything in refs missing from files → FAIL
comm -23 /tmp/refs.txt /tmp/files.txt
```

Any missing path → re-run Step 2.6 or hand-fetch via `storyboard/fetch_images.py`
(rule 17). Don't render until every reference resolves.

Also confirm each file is non-empty and has valid image magic bytes (a 0-byte
file or an HTML error page from a failed download silently renders as a broken
box):

```python
from pathlib import Path
import imghdr
for p in Path('projects/<name>/public/img').glob('*'):
    if p.suffix.lower() == '.svg':
        ok = '<svg' in p.read_text(encoding='utf-8', errors='ignore')[:512]
    elif p.suffix.lower() == '.json':
        continue  # sidecar
    else:
        ok = p.stat().st_size > 0 and imghdr.what(p) is not None
    if not ok: print(f'BROKEN: {p}')
```

### 0.5.2 — Image relevance (SOFT — visual inspection of auto-fetched images)

Step 2.6 keeps the **top candidate without looking at it**. Open every
auto-fetched image with the **Read tool** and judge it visually before render:

| Ask | Reject if |
|---|---|
| Is the subject what the bullet asks for? | "control room operator" returned a *building exterior* called Control Tower; "office worker thinking" returned a 1940s archival card-punch photo |
| Watermark-free? | Visible Shutterstock / Getty preview watermark |
| Adequate resolution? | < 1280px wide for a hero image |
| Right orientation? | Portrait when bullet expects landscape (or vice-versa) |
| On-brand / safe for monetization? | Inappropriate subject; clashing aesthetic |

Off-topic → delete + re-fetch with a refined query, or pre-place by hand (rule 17).
A skipped relevance check is the single most common image failure in production.

### 0.5.3 — License compliance (HARD gate — monetized channel)

Every kept image must have its license + attribution recorded:

```bash
# every image should have a sidecar (written by fetch_images.py)
for f in projects/<name>/public/img/*.{jpg,jpeg,png,webp,svg,gif}; do
  [ -f "${f%.*}.json" ] || echo "NO LICENSE SIDECAR: $f"
done
```

Then fold the kept sidecars into `projects/<name>/CREDITS.md` for the YouTube
description. License must be one of: CC commercial-use (BY / BY-SA), public
domain, Pexels License, or editorial-context logo/trademark. **No license
recorded → don't ship.** Replace or remove the image.

### 0.5.4 — V14 (post-render) — image actually rendered

After render, on each `[asset:]` bullet's midpoint frame, the image area must
NOT be:

- solid `D.bg` (the broken-image fallback area)
- a tiny browser broken-link icon
- letterboxed empty stripes (means `objectFit:cover` wasn't set on the `<Img>`)

Failure is almost always a wrong `staticFile()` path — usually the missing
`public/` prefix (rule 17: `publicDir = projects/<name>/`, so the call is
`staticFile('public/img/x.jpg')`, NOT `staticFile('img/x.jpg')`). Fix the
bullet code, re-seed, re-render.

### 0.5.5 — Image motion (handled by A4 + A5)

Image bullets are NOT a new motion check — they reuse the existing animation
layer:

- **A4 freeze**: a static image >3s = FAIL. A correctly-authored Ken Burns
  (`scale 1.0 → 1.08` over the bullet duration) auto-passes A4 because every
  frame differs from the last.
- **A5 PSNR**: image bullets must show non-trivial frame-to-frame motion;
  Ken Burns / Logo pop / Push-in keep PSNR well above the freeze threshold.

So confirm A4 + A5 ran for every `[asset:]` bullet — if A4 fires on an image
bullet, the motion wasn't authored. Fix the bullet code (add the Ken Burns
`interpolate(frame, [0, durationInFrames], [1.0, 1.10])` per rule 17).

### 0.5.6 — Record in `verification.md`

Add this block per scene, ABOVE the Layer 1 V-table:

```markdown
### Layer 0.5 — Image assets
| Asset | Present | Decodes | On-topic | License | V14 rendered | A4 motion |
|---|---|---|---|---|---|---|
| img/amazon_logo.png  | ✅ | ✅ | ✅ Wikimedia AMZN logo            | ✅ PD     | ✅ | ✅ logo pop  |
| img/win_senior.jpg   | ✅ | ✅ | ✅ developer, dual monitors      | ✅ Pexels | ✅ | ✅ Ken Burns |
| img/cta_managing.jpg | ✅ | ✅ | ⚠ generic stock — accept         | ✅ Pexels | ✅ | ✅ Ken Burns |
```

A scene with any ❌ in 0.5.1 / 0.5.2 / 0.5.3 / V14 is **FAIL** — fix before
advancing to the next scene.

---

## LAYER 1 — VISUAL QUALITY

> **Source of truth for visual correctness = the `remotion` skill.** When a check below
> fails, verify the fix against the remotion rule that defines the correct behavior —
> don't invent a fix. Map:
> - text overflow / clipping → `remotion/rules/measuring-text.md` (`fitText()`)
> - image sizing / aspect / fit → `remotion/rules/images.md`
> - fonts not loading / wrong glyphs → `remotion/rules/fonts.md`
> - composition dimensions / fps → `remotion/rules/compositions.md` + `calculate-metadata.md`
> A visual that violates a remotion rule keeps failing this layer until fixed at the source.

### 1.1 Muted-Viewer Test (run BEFORE authoring any bullet code)

> *Watch the video with audio off. Can a viewer understand every scene without hearing a word?*

For every bullet, write one line:
**"If audio is muted and only this frame is on screen, the viewer sees: ___"**

Apply the kill-list. Any bullet that matches → fix before rendering:

| Kill condition | Real example | Fix |
|---|---|---|
| "black canvas with small stamp in center" | Stamp 32% wide on black | `width: Math.round(w*0.76)`, font `w*0.032` |
| "single word / phrase, 85% black void" | "WHY?" on black | Font `Math.round(w*0.14)` + subtitle row |
| "bordered card with nothing inside" | Red box, zero text | Title label + body text INSIDE the element |
| "left half only" or "right half only" | One panel, other side black | Both panels in ONE bullet; inactive at opacity 0.25 |
| "floating symbols with no context" | Checkmarks with no labels | Add title, entity name, stat |
| "prior bullet's visuals bleeding through" | Old content behind new card | `React.createElement(AbsoluteFill, ...)` not plain div |
| "abstract shape with no narrative" | Thin diagonal lines | Add headline text stating the topic |
| "empty workspace / blinking cursor" | Cursor on black | Replace with content card showing the topic |

**No bullet is authored until it passes this test.**

---

### 1.2 Canvas Utilization Standards

Every bullet's main content must fill ≥60% of 1920×1080:

| Element | Minimum size | Code |
|---|---|---|
| Stamp / verdict badge | `w*0.72` wide, `h*0.22` tall | `width:Math.round(w*.72)+'px'` — NEVER auto |
| Single hero word | font `w*0.14` | fills ~26% canvas height |
| Info card (single) | `w*0.80` × `h*0.68` | flex column, centered |
| Two-panel layout | Each panel `w*0.44` × `h*0.68` | row flex, 4% gap |
| Bar chart | container `w*0.88` × `h*0.72` | bars fill container |
| 2×2 grid | Each cell `w*0.40` × `h*0.30` | spans 6%→94% width, 18%→88% height |
| Full REPLACE | `AbsoluteFill` | mandatory for scene resets |

Multi-element coverage — every layout must meet:
- `min element top` ≤ 20% canvas height
- `max element bottom` ≥ 80% canvas height
- `min element left` ≤ 8% canvas width
- `max element right` ≥ 88% canvas width

---

### 1.3 Typography Standards

```
Stamp / verdict title:    Math.round(width * 0.030)   → ~58px @ 1920w
Section headline:         Math.round(width * 0.024)   → ~46px
Card title:               Math.round(width * 0.015)   → ~29px
Body / explanation text:  Math.round(width * 0.011)   → ~21px
Label / caption:          Math.round(width * 0.008)   → ~15px  ← floor
```

- Key labels / verdicts: `D.text`, `D.amber`, or `D.cyan` — NEVER `D.text_dim`
- `D.text_dim` = decorative secondary only (source citations, scene numbers)
- All font sizes: `Math.round(width * 0.0XX)` — never raw px, rem, or em

---

### 1.4 Visual–Narration Sync

Goal: narrator says X → visual for X appears ON SCREEN at that exact frame.

| Rule | Detail |
|---|---|
| 2–4 verbatim words per anchor | From THIS scene's narration only |
| No decimal anchors | `"seventy-seven point eight"` — Whisper splits decimals |
| No unit anchors | `"thirty-six percent"` — Whisper merges as `36%.` |
| No `<pause>` spans | Anchor must be from one side of any `<pause Xs>` break |
| Exact narration form | Write anchor as it appears in the narration text |
| Good anchor examples | `"the needle"`, `"coin flip"`, `"watch it"` |

Drift check after render — **MANDATORY for every scene before sign-off. Run with Whisper-form substitutions (twelve↔12, fifty↔50, scratchpad↔scratch pad, multi-step↔multi -step) to find the anchor even when transcription differs from the source word.**

1. `framesFrom ÷ fps` = visual fire time
2. Find anchor in `projects/<project>/captions/<sid>.json` → `start_seconds`
3. Drift = fire_time − anchor_time

| Drift | Verdict | Action |
|---|---|---|
| −0.5s to +1.5s | ✅ PASS | Continue |
| +1.5s to +2.0s | ⚠ WARN | **MANDATORY FIX** — set `framesFrom = round(word.start * fps)` in scene JSON + mirror, re-render. Do NOT advance to next scene with a WARN drift. |
| > +2.0s | ❌ FAIL | Same as WARN — set `framesFrom = round(word.start * fps)`, re-render |
| < −1.0s | ⚠ WARN — fires before topic | Either move framesFrom forward, OR confirm this is the first-bullet PASS-FIRST exemption (scene opens with this visual before any spoken word) |

**Watch for the constraint case:** if moving B[N] framesFrom earlier collapses B[N-1] below `MIN_BLOCK_SECONDS` (default 1.0s), then either:
- Accept the +1.5–2.0s WARN on B[N] (document why — B[N-1] needs minimum visible time)
- Add an earlier anchor in the script that fires B[N-1] sooner
- Combine B[N-1] and B[N] into one bullet

**This MUST run after every render — do not skip. The pre-S2 production bug was: B5 multi-step proofs +1.83s WARN and B7 default setting +1.76s WARN slipped through because the verifier's anchor-matching was loose with hyphenation. Strengthen the matcher to try multiple word-form variants before declaring "anchor not found".**

---

### 1.5 Animation Quality Standards

Every bullet must have visible animation at midpoint frame (`framesFrom + duration/2`):

| Spring intent | Config | Use for |
|---|---|---|
| `heavy` | `{damping:15, stiffness:80, mass:2}` | Stamps, dramatic reveals — visible through frame 80+ |
| `smooth` | `{damping:200}` | Ambient text reveals, subtle fades |
| `bouncy` | `{damping:8}` | Hero numbers, punchline words |
| `snappy` | `{damping:20, stiffness:200}` | Cards, badges, UI labels |

- Stagger: 8–15 frames per item — `spring({frame: frame - i*10, ...})`
- Phase timing: always `durationInFrames * 0.30 / 0.60 / 0.90` fractions, never hard frame counts
- Prohibited: screen shatter, explosion, word scatter, spinning orbits, heartbeat rings

---

### 1.6 Pacing Standards

| Metric | Target | Fail |
|---|---|---|
| Visual changes per 60s scene | 8–12 bullets | < 6 = too static; > 15 = too chaotic |
| Longest single visual hold | ≤ 12s | > 15s without change |
| REPLACE bullets per scene | 1 (first bullet) | 0 = additive stacking; > 3 = fragmented |
| Scene transitions | `crossfade_frames: 12` | Hard cuts feel cheap |

---

### 1.7 Post-Render Frame Inspection — V1–V8

Extract midpoint + sync frames per bullet:

```python
import json, subprocess, os
from pathlib import Path
fps = 30
scene = '<scene-id>'          # e.g. 'my-project-s01'
project = '<project_name>'    # e.g. 'my_project'
blocks = json.loads(Path(f'projects/{project}/scenes/{scene}.json').read_text('utf-8'))
os.makedirs('c:/tmp/verify', exist_ok=True)
for b in blocks:
    for label, fr in [
        ('mid',  (b['framesFrom'] + b['framesTo']) // 2),
        ('sync',  b['framesFrom'] + 10),
    ]:
        t = fr / fps
        out = f'c:/tmp/verify/{scene}_b{b["bulletIndex"]+1}_{label}.jpg'
        subprocess.run(['ffmpeg','-y','-i', f'remotion/out/{scene}.mp4',
            '-ss', str(t), '-frames:v','1','-q:v','2', out], capture_output=True)
    print(f'B{b["bulletIndex"]+1}: mid={(b["framesFrom"]+b["framesTo"])//2}f')
```

| # | Check | Pass | Fail |
|---|---|---|---|
| V1 | Not black | ≥40% non-background pixels | Tiny element, empty card, black void |
| V2 | No bullet overlap | B[N] gone at B[N].framesTo; B[N+1] fresh | Two bullets visible simultaneously |
| V3 | Tokens only | All colors from `D.*` | Raw hex literal in bullet code |
| V4 | Readable text | Body ≥ `w*0.009`; headline ≥ `w*0.022` | Fine print; `D.text_dim` on key label |
| V5 | Canvas ≥60% | Main visual fills majority of frame | Stamp content-sized; empty card interior |
| V6 | Content matches | Visual matches bullet body description | Wrong chart, placeholder, missing text |
| V7 | No clipping | All elements inside canvas bounds | Card cut at bottom; text off right edge |
| V8 | Animation visible | Midpoint ≠ frame 0 | Static image; spring done before midpoint |
| **V9** | **No INTERNAL element overlap** (new — protocol gap that allowed B2 scratchpad covering dial labels and B3 "MAX EFFORT" label hidden behind red bar to slip through verification) | Text labels not covered by colored rectangles; hero text fits within designed gap between adjacent elements; ADDITIVE static elements remain fully visible (not covered by new panel) | Label inside bar's bounding rect; hero font wider than gap; scratchpad covers prior-bullet dials in ADDITIVE |
| **V10** | **Text fits container width** (new — checks rendered text isn't wrapping unintentionally or escaping `whiteSpace:nowrap`) | All single-line text labels render on one line; multi-line text doesn't exceed container height | "openai: reasoning_effort" wrapping to 2 lines inside w*0.22 pill |
| **V11** | **Bullet duration vs animation timeline** (new — pre-render gate: compare planned animation frame timeline to actual `framesTo − framesFrom`) | All animation phases (entry, hold, exit) complete within `framesTo − framesFrom` | Bullet 72f long but "FOR THE SAME ANSWER" appears at frame 64 (8 frames visible) — animation cut short |
| **V12** | **Not a text-only frame** (new — guards the gap where V1/V5/V8 all PASS for a screen of fading-in prose; a text slide is not a video) | The frame SHOWS the idea with a non-text visual (chart, metaphor, diagram, number, image); on-screen text is only a short headline + a few labels + numbers | The frame is mostly sentences/paragraphs/a prose bullet-list; OR the only animation is words fading/typing in with nothing else moving; OR a narration sentence is reprinted on screen → rule 21 Prohibited Patterns |
| **V13** | **Primary-focus prominence** (new — every bullet has ONE primary visual that conveys the script's point; that element must dominate the canvas, not the secondary context elements) | Primary element occupies ≥50% of canvas height; viewer can read its content at arm's length on a phone screen | Scratchpad squeezed to bottom 20% of canvas while context dials take 50% — viewer cannot read the scratchpad content; in ADDITIVE bullets, prior-state elements should shrink/move to give the new visual the stage |
| **V15** | **The sentence test — visual EXPLANATION not visual noise** (new — catches the gap V12/A4 miss: a frame that MOVES, is non-text, and fills the canvas but represents nothing the narrator says). For each bullet, name the narration sentence/clause it explains and confirm the on-screen visual literally depicts it. | You can state "this bullet explains: '<exact narration sentence>'" AND the visual is a play-by-play of that sentence (e.g. "task splits into 3 agents → they work → results merge" for "breaks into subtasks and assigns to agents") | You cannot name the sentence; OR the visual is generic mood ("futuristic city / floating AI brain / neon particles / code rain / spinning server rack / stock office footage") that looks technical but maps to no clause → rule 21 sentence test. Moving + rich + non-text does NOT exempt it. |

---

### 1.8 V9 — Internal Element Overlap Check

V2 catches **bullet-to-bullet** overlap. V7 catches **canvas-edge** clipping.
Neither catches **element-to-element overlap WITHIN a bullet** — and that gap is
why labels hidden behind bars (B3) and scratchpads covering dial labels (B2)
slipped through verification in the 2026-05 ai_thinking_levels production.

**Pre-render code-level check:** for each bullet, list every element's bounding
rectangle `(left, top, right, bottom)` derived from its style props. Two
elements overlap if both X ranges and Y ranges intersect.

```python
# pseudocode for verify_<scene>.py
elements = parse_bullet_elements(bullet_code)  # extract (id, x1, y1, x2, y2, kind)
for a, b in itertools.combinations(elements, 2):
    if a.kind == 'text' and b.kind == 'bar' and intersects(a, b):
        fail(f'{a.id} text label inside {b.id} bar — will be hidden')
    if a.kind == 'static_prior' and b.kind == 'new_panel' and intersects(a, b):
        fail(f'ADDITIVE {b.id} covers prior settled {a.id}')
```

**Post-render pixel check:** at p50 frame, extract OCR text from regions where
labels should appear. If declared label text is not OCR-extractable, the label
is covered or clipped.

**Hard rule for ADDITIVE bullets:** static elements from the prior bullet's
settled state must occupy a region the new bullet's animated panels do not
overlap. The bullet author MUST verify these regions are disjoint BEFORE seed.

**Sub-check V9b — decorative UI elements (dots, icons, LEDs, rings) must not
cover text labels.** In the 2026-05 ai_thinking_levels render a red "REC dot"
indicator (added for per-frame motion to defeat freeze detection) was
positioned at `left: px + w*0.010` — directly on top of the
"INTERNAL SCRATCHPAD — INVISIBLE TO CALLER" header text, which started at the
panel's flex-container left edge after `padding: h*0.015`. Result: viewers
saw "RNAL SCRATCHPAD — INVISIBLE TO CALLER" with the first 4 characters
covered by a glowing red disc.

**Sub-check V9c — reserve `h*0.88–1.0` for the caption box.** The renderer
overlays whisper-driven captions at the bottom of every frame (centered, big
white text on dark background). Any bullet element positioned with
`bottom: < h*0.10` or `top: > h*0.88` WILL collide with the caption. The S3B5
production bug was: "SAME MECHANISM · THREE NAMES" overlay positioned at
`bottom: h*0.04` — i.e. at `top: h*0.92`, directly inside the caption zone —
causing the caption "for good reasons. Medium" to slice through the
overlay text in every B5 frame.

Rule: no bullet element may have `top > h*0.88` OR `bottom < h*0.10`. If the
bullet's content needs more vertical space, either shrink the elements above
or push them up. The footer/punchline overlay belongs at `top: h*0.82–0.86`
maximum, with at least h*0.04 padding above the caption zone.

Rule: any pulsing/cycling indicator (dot, LED, ring) MUST be positioned in a
region that is **NOT** occupied by any text element. Allowed regions:
- Outside the panel entirely (above/below/beside)
- Inside a dedicated indicator column (e.g. far right of header, after the
  token counter)
- Inline as part of a flex row using `gap: Nps` so the dot pushes text right
- A vertical strip on the panel edge that contains no labels

If you need per-frame motion AND every text region is occupied, prefer:
- A scanning gradient line traversing the panel (no text collision)
- Border opacity pulse on the panel itself
- Background gradient shift (very subtle)

Never position a decorative element at fixed `(x, y)` without verifying it
falls in a text-free pixel region.

---

### 1.9 V10 — Text-Fits-Container Check

Pre-render code check: for every text element with `whiteSpace: 'nowrap'`,
estimate rendered width (`chars × fontSize × 0.55`) and assert it's < container
width. For multi-line text, estimate lines × lineHeight and assert it's <
container height.

```python
def text_fits(label, font_size_px, container_width_px, nowrap=True):
    est_width = len(label) * font_size_px * 0.55
    if nowrap and est_width > container_width_px:
        return False, f'"{label}" needs ~{est_width:.0f}px but container {container_width_px:.0f}px'
    return True, None
```

Common failure: `openai: reasoning_effort` (24 chars) at font `w*0.016`
(=30px @ 1920w) needs ~400px but pill container `w*0.22` (=422px) is barely
enough — wraps in practice due to padding. Fix: shrink font or widen container.

---

### 1.10 V11 — Bullet Duration vs Animation Timeline

The script may plan a bullet at 12s with 7 staggered animation phases. The
audio_anchor system may give that bullet only 2.4s because the next anchor
fires soon. Result: late-phase animations (e.g. "FOR THE SAME ANSWER" at
frame 64) never appear because the bullet ends at frame 72.

**Pre-render check:**

```python
for b in scene:
    duration_f = b['framesTo'] - b['framesFrom']
    # extract latest spring/interpolate keyframe in the bullet code
    last_phase = extract_last_animation_frame(b['code'])
    if last_phase > duration_f - 12:  # need 12f tail buffer
        warn(f'B{i}: bullet only {duration_f}f but last phase at {last_phase}f — {duration_f - last_phase} frames visible')
```

Fix options when this fails:
- Rewrite bullet to fit available duration (shorten stagger, drop late phases)
- Add an intermediate anchor in the script to give the bullet more time
- Accept and document (only if the late phase is truly secondary)

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

## Where this fits in the pipeline

```
build_video.py
    ├─ Step 3     per-bullet code authored ............... run 1.1 muted-viewer BEFORE
    ├─ Step 9     render scenes .........................
    ├─ Step 9.5   visual_qa.py (brightness) ............. automatic
    ├─ Step 10    stitch + mux .........................
    └─ Step 10.5  validate_output.py ................... automatic

After each scene render:
    Layer 1   (1.7 V1–V8)           → frame inspection
    Layer 1.5 (A1–A8)               → filmstrip + freeze + PSNR
    Layer 2   (2.1–2.4 audio)       → listen + coverage check
    After final stitch:
    Layer 3   (T1–T12 + artifacts)  → ffprobe + srt + chapters + thumbnail
```
