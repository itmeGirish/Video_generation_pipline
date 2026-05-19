---
name: when-script-received
description: FIRST rule to read. When a user gives you a script with animations, follow this exact flow — no shortcuts, no skipping steps.
metadata:
  tags: workflow, script, animation, entrypoint
---

# When a Script + Animation is Given

This is the ENTRY POINT. Read this first every time the user gives you a script.

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

## Step 4 — Run the pipeline

The build command points at the RAW script under `projects/scripts/<name>.txt`. The
pipeline auto-routes to the canonical `projects/structured_scripts/<name>.txt` (written
in Step 1) for parsing.

```bash
cd c:/Girish/Fundamental_Projects/video_generation/video_explainer
python storyboard/build_video.py projects/scripts/<name>.txt
```

For fast iteration on one scene:
```bash
python storyboard/build_video.py projects/scripts/<name>.txt --scene 3
```

For full re-run after deep changes:
```bash
python storyboard/build_video.py projects/scripts/<name>.txt --force
```

If `stitch.mode` is omitted from `config.yaml`, the renderer falls back to `hard_cut`
(no crossfade) as the safe default. Set `stitch.mode: crossfade` in `config.yaml` only
when the script explicitly asks for crossfade transitions between scenes.

The pipeline does automatically (each step gated by validators):
- [1] Loads + schema-checks config.yaml against `design.ts` DesignTokens
- [2] Parses structured script + lints format issues
- [3] Per-bullet LLM codegen (parallel workers, rate-limit retry, per-bullet cache)
- [4] Compiles SSML + generates TTS audio (edge-tts)
- [5] Transcribes audio (Whisper) with `word_timestamps`
- [6] Locates scene boundaries in transcript (decimal/hyphen normalization)
- [7] Computes framesFrom/framesTo via fuzzy `audio_anchor` lookup + reports coverage
- [8] Patches `timelines.ts`
- [8.5] **Validates pipeline state** (JSONs exist, IDs valid, tokens match) — HARD fail
- [9] Renders all scenes (bundle ONCE, render many)
- [9.5] Visual QA: midpoint brightness sanity check
- [10] Stitches + muxes audio → final mp4
- [10.5] **Validates output** (narration coverage % + per-bullet visibility)

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
