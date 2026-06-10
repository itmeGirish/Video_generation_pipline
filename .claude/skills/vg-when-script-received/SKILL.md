---
name: vg-when-script-received
description: "FIRST rule to read when a script arrives. Follow this exact 6-step flow with no shortcuts. Use whenever a script is given, a render is about to start, a script needs conversion, or any request like "I have a script," "render this," "convert this script," "start the pipeline," "script received," or "begin building the video.""
---

# When a Script + Animation is Given

This is the ENTRY POINT. Read this first every time the user gives you a script.

## Contents

- What "script + animation" means
- Step 0 — READ THE WHOLE SCRIPT FIRST (before any pipeline command)
- Step 1 — Read the raw script + animation, convert to canonical structure
- Step 2 — Build config.yaml from the STRUCTURED script (not from defaults)
- Step 3 — Verify every bullet body is concrete enough for codegen
- Step 4 — Per-scene render → verify → fix LOOP (MANDATORY)
- Step 5 — Verify fidelity
- Step 6 — Check output
- What NOT to do
- Quick reference: file locations after a successful run
- Examples
- Guidelines

---

## What "script + animation" means

The user gives you either:
- A `.txt` file path (e.g. `projects/scripts/<name>.txt`)
- The text of a script directly in the conversation
- A request to create a new script about a topic

It always contains `## SCENE N` headers with `### Narration` and `### Animation` blocks.

---

## Step 0 — READ THE WHOLE SCRIPT FIRST (before any pipeline command)

**Do not skip this. Do not just count scenes and run `build_video.py`.**

When a script arrives, you must read EVERY scene's narration AND every animation
bullet end-to-end before doing anything. The pipeline is a fidelity executor — if
the script is unclear, vague, or contradictory, the pipeline will faithfully render
unclear, vague, contradictory output. The user blames the pipeline; the root cause
is usually the script.

For each scene, internally answer:

1. **Narration check** — does the prose tell ONE clear story? Are the hero words
   (numbers, product names, real people) concrete and quotable? Are sentences
   short enough that the TTS can pace them naturally? (See rule 16.)
2. **Animation check** — for every `### Animation` bullet:
   - Is the body CONCRETE (specific elements, colors, text content)? Or vague
     ("the reveal", "the takeaway", "show what matters")?
   - Does the body reference a SHORT VERBATIM PHRASE that also appears in the
     scene's narration? If not, audio_anchor will fail (rule 15).
   - Is the visual intent clear enough that the LLM can author concrete
     React.createElement code from the bullet body? (See rule 04.) Vague
     bullets ("the takeaway", "show what matters") give the LLM nothing
     to anchor on.
   - If the bullet mentions an asset (logo, screenshot, diagram), does
     `projects/<name>/public/<filename>` actually exist? (See rule 17.)
3. **Sync check** — do the bullets' time windows roughly match the narration's
   pace? 5–8 bullets per ~60s scene. Bullet at 0:38 of a scene with only 30 words
   of narration = mismatch.
4. **Asset check** — list every filename mentioned. Verify each is in
   `projects/<name>/public/`. Missing assets fail at render, not design.

**If any answer is "no" or "unclear" — STOP and either (a) ask the user, or (b)
fix the script before running the pipeline.** Do not paper over a bad script with
LLM hallucination at design time. That just produces a video the user rejects.

The user has invested time in writing the script; you save them re-runs by
catching script issues before TTS + 25 minutes of render burn cache.

When the script passes step 0, then proceed to step 1 below.

---

## Step 1 — Read the raw script + animation, convert to canonical structure

**Single contract:**

| | |
|---|---|
| INPUT | `projects/scripts/<name>.txt` (raw, user-authored, ANY format) |
| ACTION | Read the WHOLE script — every scene's narration AND every animation bullet. Understand what each scene is trying to do. Then convert to canonical format using the rules in §1.1 below. |
| OUTPUT | `projects/structured_scripts/<name>.txt` (canonical, parser-ready, the ONLY file `source_parser.py` and `build_video.py` read) |

```
projects/scripts/<name>.txt              ← RAW input (NEVER edit in place)
            │
            ▼  read carefully + convert
            │
projects/structured_scripts/<name>.txt   ← CANONICAL output
            │
            ▼  build_video.py reads from here
```

### 1.1 Conversion mode — pick by script shape

| Raw script shape | How to convert |
|---|---|
| Already canonical (`## SCENE N — "Title" (M:SS – M:SS)`, `### Narration` / `### Animation`, `**M:SS – M:SS — Headline.**` bullets) | `python storyboard/script_converter.py projects/scripts/<name>.txt --out projects/structured_scripts/<name>.txt --regex-only` |
| Mostly canonical with minor drift (em-dash variants, html entities, engagement-move lines) | `python storyboard/script_converter.py projects/scripts/<name>.txt --out projects/structured_scripts/<name>.txt` (regex only — the LLM fallback was removed alongside the `claude` CLI subprocess; if regex fails, hand-convert per rule 18) |
| Movie-script style — `Frame 0–60` timing, `### VO:` / `### ANIMATION:`, separate `**Frames:**` line, sub-scenes, design-token preamble, bespoke metaphors | **Hand-convert per rule 18** and write to `projects/structured_scripts/<name>.txt`. The auto-converter cannot handle these today. |

### 1.2 Verify the converted file parses (HARD GATE)

```bash
python storyboard/source_parser.py projects/structured_scripts/<name>.txt
```
Expected: `N scenes, M bullets`. If parsing fails, fix `projects/structured_scripts/<name>.txt`
— NEVER edit the raw `projects/scripts/<name>.txt`.

### 1.3 Anti-patterns

- DO NOT write conversion output anywhere except `projects/structured_scripts/<name>.txt`
  (no `projects/<name>/source.txt`, no in-place edits to the raw file)
- DO NOT skip reading the script end-to-end — converting blindly produces a wrong video
- DO NOT skip the conversion step "because the script looks fine" — the parser is strict

---

## Step 2 — Build config.yaml from the STRUCTURED script (not from defaults)

```bash
ls projects/<name>/config.yaml
```

If missing, create it. The **only constants** are voice/fps/width/height; **every design value
must come from the structured script** (`projects/structured_scripts/<name>.txt`) — specifically
from the `<!-- ## DESIGN TOKENS ... -->` and `<!-- ## GLOBAL VISUAL SYSTEM ... -->` comment blocks
that Step 1 preserved at the top of that file.

Never hardcode a hex / font / animation parameter that the script itself defines — the rendered
video must match the script's design system. Never read from the raw `projects/scripts/<name>.txt`
in Step 2 — the structured file is the single source of truth for all downstream steps.

### 2a. The four pinned constants — and ONLY these four

These are the ONLY values the doc allows you to write without checking the script:

```yaml
audio:
  voice: en-US-AndrewMultilingualNeural   # ← pipeline-pinned (warm/confident YouTube voice)
  full_audio_filename: vo-<name>-full.mp3 # ← path template, not a value (<name> is dynamic)

video:
  fps: 30                                  # ← pipeline-pinned (renderer + Whisper alignment math)
  width: 1920                              # ← pipeline-pinned (1080p YouTube long-form)
  height: 1080                             # ← pipeline-pinned (1080p YouTube long-form)
```

Everything else — `audio.rate`, `audio.pitch`, every `design.*` field, `stitch.mode`
— must be sourced from the raw script, OR omitted from config.yaml entirely so the
renderer's built-in defaults take effect. **Never invent a value to fill a slot.**

### 2b. Pull EVERY other value from the structured script's comment blocks

For each field below, search `projects/structured_scripts/<name>.txt` (the comment blocks
preserved by Step 1) for the source value. If a value is present, USE it. If not, fall
back to code defaults (do NOT invent a value to fill the slot — leave it out of
`config.yaml` and let the renderer use its built-in default).

| config.yaml field | Source location in structured script | Mapping rule |
|---|---|---|
| `project` | filename stem | derive from `projects/structured_scripts/<name>.txt` → `<name>` |
| `output` | first numbered item in `<!-- ## TITLE OPTIONS ... -->` comment block | `<Headline>.mp4` (replace spaces with `_`) |
| `audio.rate` | `### Pacing` blocks per scene (mapped from raw `**Pacing:**` by Step 1) — read globally if all scenes agree | `Slow / Measured` → `'-5%'`, `Quick / Fast` → `'+3%'`, otherwise omit (default 0%) |
| `audio.pitch` | scene tone directions captured in `<!-- Visual Metaphor: ... -->` comments or `### Pacing` blocks | `'-2Hz'` for deeper, `'+2Hz'` for brighter, otherwise omit |
| `design.bg` | `BASE:` line in `<!-- ## DESIGN TOKENS ... -->` comment block | hex verbatim |
| `design.surface` | `SURFACE:` line | hex verbatim |
| `design.text` | `WHITE:` line | hex verbatim |
| `design.text_dim` | `DIM:` line | hex verbatim |
| `design.cyan` | `CYAN:` line | hex verbatim |
| `design.amber` | `AMBER:` line | hex verbatim |
| `design.green` | `GREEN:` line | hex verbatim |
| `design.red` | `RED:` line | hex verbatim |
| `design.violet` | `MAGENTA:` line (the pipeline color slot called `violet` is the pink/magenta channel) | hex verbatim |
| `design.white` | `WHITE:` line (same as text) | hex verbatim |
| `design.font_display` | `FONT_DISPLAY:` line | wrap as `"'<FontName>', sans-serif"` |
| `design.font_mono` | `FONT_MONO:` line | wrap as `"'<FontName>', monospace"` |
| `design.dot_grid_opacity` | grid opacity in `<!-- ## GLOBAL VISUAL SYSTEM ... -->` comment (e.g. "CYAN at 4% opacity" → `0.04`) | percent → decimal |
| `design.dot_grid_spacing` | grid spacing in `<!-- ## GLOBAL VISUAL SYSTEM ... -->` comment (e.g. "40px spacing" → `40`) | integer |
| `stitch.mode` | scene-transition description in `<!-- ## GLOBAL VISUAL SYSTEM ... -->` comment | `hard_cut` if it says "HARD CUTS", else `crossfade` |

Animation defaults (`spring_damping`, `spring_stiffness`, `fade_frames`, `type_speed_cps`)
are NOT user-facing knobs in most scripts — leave them out unless the script explicitly
specifies them. The renderer has built-in defaults.

### 2c. Skeleton template (no values — fill from script)

Use this skeleton when authoring a new `projects/<name>/config.yaml`. Every `<...>` is
a placeholder you fill from the raw script via the §2b mapping table. Do NOT carry
example hex values from one project to another.

```yaml
project: <name>                   # ← derived from filename stem
output: <Headline>.mp4            # ← derived from script's ## TITLE OPTIONS

audio:
  voice: en-US-AndrewMultilingualNeural   # ← pinned constant
  full_audio_filename: vo-<name>-full.mp3 # ← path template
  # rate: <from script ## Pacing>     ← OMIT this line if script has no pacing override
  # pitch: <from script tone>         ← OMIT this line if script has no tone direction

video:
  fps: 30                                  # ← pinned constant
  width: 1920                              # ← pinned constant
  height: 1080                             # ← pinned constant

design:
  bg: <hex from BASE>
  surface: <hex from SURFACE>
  text: <hex from WHITE>
  text_dim: <hex from DIM>
  cyan: <hex from CYAN>
  violet: <hex from MAGENTA>      # pipeline calls the magenta/pink slot 'violet'
  amber: <hex from AMBER>
  green: <hex from GREEN>
  red: <hex from RED>
  white: <hex from WHITE>
  font_display: "'<font from FONT_DISPLAY>', sans-serif"
  font_mono: "'<font from FONT_MONO>', monospace"
  dot_grid_opacity: <decimal from GLOBAL VISUAL SYSTEM grid opacity>
  dot_grid_spacing: <integer from GLOBAL VISUAL SYSTEM grid spacing>

stitch:
  mode: <hard_cut | crossfade — from script's scene transitions description>
```

If the script provides extra colors (e.g. `SOFT_RED`, `BRAND_BLUE`) that have no slot
in the schema today, flag this to the user — they may want a new color slot, or you
can reference the hex inline in the bullet body when designing visuals.

### 2d. Anti-patterns

- DO NOT copy hex / font / pacing values from another project's `config.yaml` — every
  new project must derive them from its own raw script
- DO NOT keep stale palettes (e.g. old purple/blue tokens like `#0A1628`, `#22D3EE`,
  `#A78BFA`) as defaults — those bleed across projects and override script intent
- DO NOT silently invent a hex when the script doesn't provide one — leave the field
  out and let the renderer's code defaults apply
- DO NOT change `audio.voice`, `video.fps`, `video.width`, `video.height` per-project —
  those four are the pinned pipeline constants

---

## Step 3 — Verify every bullet body is concrete enough for codegen

There is no fixed primitive registry in this pipeline. Every bullet's visual is
authored at design time by the LLM as a JS function body returning
`React.createElement(...)`. `DynamicBlock.tsx` compiles + invokes it per frame.

What this means for Step 3:

- A vague bullet body produces shallow / generic React. Re-write the bullet
  body in `projects/structured_scripts/<name>.txt` with concrete elements,
  counts, and labels that the LLM can mirror 1:1.
- Per-bullet codegen is **cached** at
  `storyboard/.cache/designs/bullet-s{scene}-b{idx}-{hash16}.json`. After
  editing a bullet body, delete only the affected cache file.
- A bullet's `code` field that throws at render time produces a visible red
  `BLOCK RUNTIME ERROR` overlay (rule 04). The bundle does NOT crash — the
  rest of the scene still renders, so failures are obvious in the final mp4.

**No-hardcode rule applies to every emitted `code` block** (rule 04):
- Colors: `D.amber`, `D.surface`, `D.bg` — never raw hex
- Dimensions: `useVideoConfig().width / height` — never the resolution literals
- FPS: `useVideoConfig().fps` — never the fps literal
- CSS transitions / keyframes: forbidden — only frame-driven `interpolate` /
  `spring` produce motion at render time

The visual_designer system prompt embeds these constraints, but if the bullet
body itself names a hex / dimension / fps literal, the LLM may copy it through.
Keep bullet bodies in the structured script free of those literals too.

---

## Step 4 — Per-scene render → verify → fix LOOP (MANDATORY)

**DO NOT render all scenes at once.** This is the hard-won discipline from
production: one bad scene caught at scene 1 saves 30+ minutes of wasted render
time on scenes 2-7. The loop is non-negotiable.

### The loop (repeat for each scene N = 1, 2, 3, ... last):

```
LOOP scene N:
  4a. RENDER scene N only         → produces remotion/out/<name>-s0N.mp4
  4b. VERIFY scene N (rule 23)    → V1-V8 + A1-A8 + audio sync + caption zone
  4c. IF FAIL:
        - identify which bullet(s) failed
        - rewrite that bullet's React.createElement code (rule 04 + rule 19)
        - delete cache: storyboard/.cache/designs/bullet-s0N-bXX-*.json
        - re-seed the affected bullet via seed_bullet_cache.py
        - GO TO 4a
  4d. IF PASS:
        - mark scene N done
        - advance to scene N+1
```

**You may NEVER advance to scene N+1 until scene N is PASS.**

### 4a — Render ONE scene

```bash
cd c:/Girish/Fundamental_Projects/video_generation/video_explainer
# Pipeline supports per-scene rendering via --scene flag:
python storyboard/build_video.py projects/scripts/<name>.txt --scene 1

# OR direct Remotion (faster, skips TTS/Whisper if already done):
cd remotion && PROJECT=<name> node render_scenes.mjs <name>-s01
```

### 4b — Verify (rule 23 is the law)

For EVERY bullet in the rendered scene, run all of:

| Layer | What to check | Tool |
|---|---|---|
| V1-V8 | Frame inspection (5 frames per bullet: p10/p30/p50/p70/p90) | ffmpeg extract → Read tool on jpg |
| V9 | Internal element overlap | Visual inspection |
| V9b | Decorative covers text | Visual inspection |
| **V9c** | **Caption zone reserved (top<h*0.88 & bottom>h*0.10)** | Visual inspection |
| V10 | Text fits container (no overflow) | Visual inspection |
| V11 | Bullet duration vs animation timeline | Check last phase frame < duration |
| V13 | Primary visual prominence (≥50% canvas) | Visual inspection |
| A1-A8 | Animation filmstrip (5-frame motion check) | ffmpeg filmstrip |
| A4 | Freeze detection (>3s static = FAIL unless final-hold) | PSNR check |
| A5 | PSNR p10→p70 motion check | ffmpeg PSNR |
| Layer 2 | Audio sync (framesFrom ≈ Whisper word start within ±0.05s) | Whisper JSON lookup |
| Layer 2.5 | Mid-bullet audio coherence (visual matches narration throughout) | Per 3s window |

Save report to `projects/<name>/verify_s0N_report.txt` for the record.

### 4c — On FAIL, fix the actual bullet

DON'T just re-render and hope. The cache is content-addressed, so re-rendering
without changing the cache returns the same broken output.

```bash
# After fixing the bullet body OR the React.createElement code:
rm storyboard/.cache/designs/bullet-s0N-b0X-*.json

# Re-seed just that bullet:
python storyboard/seed_bullet_cache.py projects/scripts/<name>.txt --json fix_bundle.json

# Delete the broken mp4 so renderer re-renders:
rm remotion/out/<name>-s0N.mp4

# Re-render this scene only:
cd remotion && PROJECT=<name> node render_scenes.mjs <name>-s0N
```

Then loop back to 4b verification.

### 4d — Only advance after PASS

Document scene N as PASS in your todo list BEFORE rendering scene N+1.
This forces honest tracking. A "mostly passed" scene is FAIL.

### Why this loop is mandatory (lessons from production)

- **ADDITIVE bullet violations** silently break the visual story. Caught at
  scene 1, fixed in 2 min. Caught after stitching all 7 = re-do 6 scenes.
- **Caption zone overlaps** look fine in isolation but break once captions render.
  Per-scene check catches before bottom 12% is wasted.
- **Audio sync drift** of +1.5s on scene 2 compounds when stitched — viewer
  notices in scene 5. Per-scene Layer 2 check catches at the source.
- **Render time budget**: 7 scenes × 5 min each = 35 min total. One bug
  caught late = re-render all = 70 min wasted. Loop discipline = strictly
  +verification time, no wasted renders.

### Underlying pipeline behavior (informational)

The bulk `build_video.py` runs these steps; per-scene rendering uses the same
infrastructure but stops at step [9] for one scene at a time:
- [1] Load + schema-check config.yaml
- [2] Parse structured script
- [3] Per-bullet cache LOOKUP (no LLM subprocess — fail-fast on cache miss)
- [4] SSML compile + TTS (one-time, cached)
- [5] Whisper transcribe (one-time, cached)
- [6] Locate scene boundaries
- [7] Compute framesFrom/framesTo via audio_anchor lookup
- [8] Patch timelines.ts
- [8.5] Validate pipeline state
- [9] Render the requested scene(s) only
- [10] Stitch + mux → final mp4 — **DEFER until all scenes pass**

`stitch.mode`: omit from config.yaml → safe default `hard_cut`. Set
`crossfade` only when script explicitly requests it.

---

## Step 5 — Verify fidelity

After the pipeline runs, verify:

```
Count(### Animation bullets in structured script per scene)
  == Count(visual blocks in projects/<name>/scenes/<id>.json)
```

The pipeline enforces this as a hard-fail (fidelity gate).
If it passed, every animation directive was rendered.

---

## Step 6 — Check output

```bash
ls -lh projects/<name>/out/
# Should show <Title>.mp4 with non-zero size
```

Step 10.5 already verified narration coverage and per-bullet visibility automatically.
Now play the mp4 and check the things validators CANNOT judge:
- [ ] Each scene has the right primitive (not a wrong-but-valid substitute)
- [ ] Narration tone sounds natural (SSML emphasis on hero words landed correctly)
- [ ] Text doesn't overflow (primitives using `fitText` should auto-shrink — see rule 11)
- [ ] No two visual elements overlap awkwardly
- [ ] Color contrast is readable

If anything is wrong → see **`rule 13`** for the right re-run flag (no manual cache deletion).

---

## What NOT to do

- DO NOT write `script.md` — the canonical script lives at `projects/structured_scripts/<name>.txt`
- DO NOT edit `projects/scripts/<name>.txt` in place — it is the user's authoring file
- DO NOT write conversion output to `projects/<name>/source.txt` — that path is being phased out
- DO NOT substitute a generic primitive for a specific one — hard-fail instead
- DO NOT skip the fidelity gate check — it exists to prevent silent quality loss
- DO NOT add CSS transitions to any .tsx — read remotion skill first
- DO NOT hardcode hex colors in `.tsx` — use design tokens from `D.*`
- DO NOT hardcode design hex / font / animation values in `config.yaml` — pull from the script's `## DESIGN TOKENS` block (see Step 2)
- DO NOT change `audio.voice`, `video.fps`, `video.width`, `video.height` per-project — those four are pipeline constants

---

## Quick reference: file locations after a successful run

| File | What it contains |
|------|-----------------|
| `projects/scripts/<name>.txt` | RAW script (user-authored, never edited by pipeline) |
| `projects/structured_scripts/<name>.txt` | CANONICAL script (parser-ready — read by build_video.py) |
| `projects/<name>/config.yaml` | Design + voice config (4 pinned constants + script-derived values) |
| `projects/<name>/audio/vo-<name>-full.mp3` | Continuous TTS audio |
| `projects/<name>/scenes/<id>.json` | Visual blocks for each scene — **CANONICAL, owned by project** |
| `projects/<name>/captions/<id>.json` | Word timestamps for each scene — **CANONICAL, owned by project** |
| `remotion/public/scenes/<id>.json` | Build-time mirror of project scenes (auto-synced; not source-of-truth) |
| `remotion/public/captions/<id>.json` | Build-time mirror of project captions (auto-synced; not source-of-truth) |
| `remotion/src/storyboard/timelines.ts` | Scene duration registry |
| `remotion/out/<id>.mp4` | Per-scene silent renders |
| `projects/<name>/out/<Title>.mp4` | **FINAL VIDEO** |

---

## Examples

### Receiving "AI Thinking Levels" script (7 scenes, ~8 min)

```
User: "here's my script for AI thinking levels, render it"

Step 0 — Identify format: rich movie-script format (### VO:, frame timestamps, DESIGN TOKENS preamble)
  → Rule 18 mandatory. NOT regex-only. Hand-convert now.

Step 1 — Hand-convert (rule 18):
  - Strip frame timestamps ("0:00–0:45 / SCENE 1")
  - Collapse "### VO:" blocks into "### Narration" blocks
  - Split sub-scenes into separate "### Scene N" headers
  - Preserve bespoke metaphors ("octopus neurons") as Animation bullets
  - Write output to projects/structured_scripts/ai-thinking-levels.txt

Step 2 — Build config.yaml:
  - Read ## DESIGN TOKENS from structured script
  - Paste hex values into projects/ai-thinking-levels/config.yaml
  - Set output: "AI Thinking Levels.mp4"

Step 3 — Count bullets: 7 scenes × ~6 bullets = 42 total bullets to author

Step 4 — Author bullet code (rule 04 + rule 21):
  - Read rule 21 first — Q1/Q2 for every bullet before writing code
  - Scene 1 bullet 1 (hook): Single hero number animating in
  - Scene 2 bullet 3 (comparison): SplitPanel left=instinct right=reasoning
  - Scene 5 bullet 2 (bespoke): octopus tentacles branching via interpolate arcs
  - etc. for all 42 bullets

Step 5 — Seed cache:
  python storyboard/seed_bullet_cache.py projects/scripts/ai-thinking-levels.txt --json bundle.json

Step 6 — Build:
  python storyboard/build_video.py projects/scripts/ai-thinking-levels.txt
```

### Receiving a simple 3-scene explainer (plain format)

```
User: "i have a 3 scene explainer about TCP handshake"

Step 0 — Identify format: plain structured format (no design preamble, no frame timestamps)
  → script_converter.py regex path. No hand-conversion needed.

Step 1 — Verify conversion produced valid structured_scripts/tcp-handshake.txt
  python -m storyboard.source_parser projects/structured_scripts/tcp-handshake.txt --dry-run

Step 2 — Config: minimal config.yaml (black bg, white text, Sora font)

Step 3 — Author 3×6=18 bullets, seed, build.
```

---

## Guidelines

**Always:**
- Read rule 18 BEFORE deciding if regex conversion is sufficient — rich scripts silently corrupt on regex-only
- Build `config.yaml` from the structured script's `## DESIGN TOKENS` block — never hardcode hex
- Author all per-bullet React code in THIS session before running `build_video.py` — the pipeline does cache lookup only
- Count bullets in the structured script after conversion and confirm count matches expectations
- Run `python -m storyboard.test_pipeline_fixes` if you edited any `storyboard/*.py` file

**Never:**
- Skip Step 2 (config.yaml) — the pipeline fails at Step 1 if `surface` key is missing
- Author bullet code for scenes you haven't read the narration for — anchor phrases must be verbatim
- Run `build_video.py` before seeding the cache — every bullet must have a cache entry first
- Write conversion output to `projects/<name>/source.txt` — only `projects/structured_scripts/<name>.txt`
- Assume the regex converter handled a rich script correctly — verify line count and bullet count match

**Quality bar:**
- `audio_anchor coverage ≥ 90%` — if lower, tighten anchor phrases before declaring success
- `animation visibility = 100%` — any missing bullet must be re-authored before upload
- Narration coverage ≥ 85% per scene — if lower, review Step 5 output and re-run with `--retts` if needed
