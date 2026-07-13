# Verification — Layer 0.5 (image assets) + Layer 1 (visual V1–V13) — full procedures

Reference for `vg-verification-protocol`. The per-scene loop, the copy-checklist, the `verification.md` artifact, and audio-sync live in the parent SKILL.md; this file is HOW to run the image-asset gate and the visual V-checks (extract frames, the standards, V9 overlap, V10 fit, V11 timeline).

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
