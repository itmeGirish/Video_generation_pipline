---
name: vg-when-script-received
description: "FIRST rule to read when a script arrives. Follow this exact 6-step flow with no shortcuts. Use whenever a script is given, a render is about to start, a script needs conversion, or any request like "I have a script," "render this," "convert this script," "start the pipeline," "script received," or "begin building the video.""
model: opus
---

# When a Script + Animation is Given

This is the ENTRY POINT. Read this first every time the user gives you a script.

## Contents

- What "script + animation" means
- Step 0 — READ THE WHOLE SCRIPT FIRST (before any pipeline command)
- Step 1 — Read the raw script + animation, convert to canonical structure
- Step 2 — Build config.yaml from the STRUCTURED script (not from defaults)
- Step 3 — Verify every bullet body is concrete enough for codegen
- Step 4 — Per-scene VISUAL PROOF (cheap) → ONE master render → FINAL gate (MANDATORY)
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

0. **Director's-brief check (read it FIRST).** The script (produced by `scene-composer`) carries
   ONE `<!-- GLOBAL VISUAL STYLE -->` + `<!-- REFERENCE ASSETS -->` at the top, and each scene opens with
   `<!-- SCENE DESCRIPTION -->` (a prose brief: Environment · Situation · Viewer Realization · Emotional
   Journey · Visual Transformation · Final Image) and `<!-- SCENE DESIGN -->` (fields: Scene Purpose ·
   Pace · Location · Reality Anchor · REFERENCE assets · CINEMATIC intent · LAYOUT · SHOT · ranked Primary
   Focus · spatial Environment · Attention Flow · beat Transitions · …). **These are the SOURCE the
   animation is derived from** — read them before the bullets. Confirm: a GLOBAL VISUAL STYLE block exists
   (the whole-video art direction), the description is real prose (not a task list), REFERENCE names a
   concrete `[asset: img/x.png]` for any real software (file present or noted to source), CINEMATIC names
   camera/depth/light/color, LAYOUT is a spatial map, SHOT is named, and beats have transitions. A scene
   missing the brief, or whose REFERENCE names real UI with no asset, is incomplete — surface it (the
   bullet author will otherwise improvise generic UI / a random art style). Then the per-bullet author
   (`vg-visual-designer` step 0) realizes the brief in code, in the global style.
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

### 2c. Skeleton

Author `projects/<name>/config.yaml` as: the four pinned constants above + a `design:` block whose
every field is filled from the §2b mapping table (`bg/surface/text/text_dim/cyan/violet=MAGENTA/amber/
green/red/white/font_display/font_mono/dot_grid_opacity/dot_grid_spacing`) + `stitch.mode`. **OMIT any
field the script doesn't define** (let the renderer default apply — don't invent), and carry NO example
values from another project. A script color with no schema slot (e.g. `SOFT_RED`) → flag to the user.
`vg-build-and-run` carries the full skeleton if you need it verbatim.

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

## Step 4 — Per-scene VISUAL PROOF (cheap) → ONE master render → FINAL gate (MANDATORY)

**⛔ NATIVE flow: there is NO per-scene mp4 render→verify→fix loop.** The one expensive step is
the LIVE MASTER render (`render_master.mjs` — all scene COMPONENTS composed via a plain `<Series>`,
zero overlap → sync-safe; narration overlaid at the mux; NO per-scene mp4 stitch). So quality is
proven in TWO places: CHEAP per scene BEFORE the render (4a–4c), then the full battery ON the
rendered master (4e). `render_scenes.mjs` is only an OPTIONAL debug render-to-watch — never a gate.

### 4a — VISUAL PROOF each scene (cheap keyframes; no TTS/Whisper/full render)

```bash
python storyboard/preview_bullet.py projects/structured_scripts/<name>.txt --scene N --visual-proof
```

Renders the 5-keyframe FILMSTRIP from the LIVE composition + the mechanical proofs
(canvas coverage + transformation Δ — frames near-identical = FLAT = FAIL).

### 4b — Judge the 3 proofs against the scene's DDI (route to owners — never score from memory)

| Proof | What must be true | Owner to invoke |
|---|---|---|
| Composition | hero obvious in ~1s · hierarchy · no overlap · caption zone clear | `vg-visual-quality` factors 5–8 + `python -m storyboard.layout_validator <project>` |
| Narrative | MUTED: attention travels + a first-time viewer understands · through-line present | `render-validator` (the muted test) |
| Transformation | the hero's STATE changed A→B across the strip (mechanical Δ vs the DDI) | the DDI + `vg-scene-validator` |

PASS → append to `projects/<name>/verification.md`:

```
VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%
```

**`render_gate.sh` HARD-BLOCKS the master render until EVERY scene has this marker.**

### 4c — On FAIL, fix the actual bullet/DDI (the cache is content-addressed)

Route the symptom to its ONE owner skill FIRST (CLAUDE.md BUG ROUTER) — motion→`vg-code-animations`,
mechanism→`vg-code-artifacts`, stagger→`vg-code-sequencing`, easing→`vg-code-timing`,
text→`vg-code-text`, image→`vg-code-images`, tokens→`vg-code-tokens`. Then:

```bash
# After fixing the bullet's React.createElement code or the scene's DDI, re-seed:
python storyboard/seed_bullet_cache.py projects/structured_scripts/<name>.txt --json fix_bundle.json

# Re-prove the scene:
python storyboard/preview_bullet.py projects/structured_scripts/<name>.txt --scene N --visual-proof
```

The scene never reaches the master render flat.

### 4d — MASTER RENDER (once, after every scene has its marker)

```bash
python storyboard/build_video.py projects/structured_scripts/<name>.txt
```

`build_video.py` flows: [1] config → [2] parse → [3] per-bullet cache LOOKUP (fail-fast on miss) →
[4] SSML+TTS (cached) → [5] Whisper (cached) → [6–8] scene boundaries + `framesFrom/framesTo` via
`audio_anchor` + patch `timelines.ts` → [10] **ONE live master render via `render_master.mjs`**
(there is no per-scene mp4 render and no stitch) + narration mux → final mp4.
Partial subset preview: `MASTER_SCENES=<subset>` (reminder-only, not hard-gated).

### 4e — FINAL gate ON THE RENDERED MASTER (invoke ALL, then record MASTER-PASS)

| Check | Owner (invoke the Skill) |
|---|---|
| V1–V13 + AUDIO-SYNC drift + `ffmpeg volumedetect` (never ship silent) | `vg-verification-protocol` |
| 8 visual factors → /100 (motion factors 1–4 from the FILMSTRIP) | `vg-visual-quality` |
| Audio quality (voice · −14 LUFS · music+duck · sfx · silence) | `vg-quality-audio` |
| Coverage + visibility (≥90%, 0 placeholder/error) | `vg-output-validation` |
| Watch the WHOLE video MUTED — 8 lenses → SHIP\|RE-CUT | `video-narrative-editor` |
| 12-layer Motion-Native conformance + cross-scene continuity | `vg-scene-validator` |
| YouTube T1–T12 technical gate + runtime | `vg-youtube-validation` · `vg-video-duration` |

PASS → record `MASTER-PASS: <name> | visual=<NN>/100 audio=<N>/10 transform=<min-Δ>%` in
`projects/<name>/verification.md`, then upload. FAIL → route to the ONE owner (BUG ROUTER) →
fix the scene's bullet code/DDI → re-seed → re-prove (4a) → re-render the master. One master fix
re-renders the whole video — the cheap proof (4a) is what keeps re-renders rare.

### Why prove-cheap-first is mandatory (lessons from production)

- A FLAT scene caught at 4a costs seconds; caught after the master it re-renders the
  WHOLE video (~260s/scene render budget).
- **Caption zone overlaps** and layout collisions are caught on cheap keyframes by
  `layout_validator` before any render burn.
- **Audio sync** is checked ONCE on the real master (`vg-verification-protocol` Layer 2) —
  the master `<Series>` is zero-overlap, so per-scene drift no longer compounds through a stitch.

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
| `remotion/out/<id>.mp4` | OPTIONAL debug per-scene renders (`render_scenes.mjs` — never a gate) |
| `projects/<name>/out/<Title>.mp4` | **FINAL VIDEO** |

---

## Examples (brief)

- **Rich movie-script** (`### VO:`, frame timestamps, DESIGN TOKENS preamble) → Step 0 flags it →
  hand-convert per `vg-script-conversion` MODE B (`references/movie-script-conversion.md`) / rule 18 (strip frame timestamps, `### VO:`→`### Narration`,
  split sub-scenes, preserve bespoke metaphors) → config from the token block → per-scene author →
  visual-proof each scene → master render → final gate.
- **Plain 3-scene explainer** → `script_converter.py` regex path (no hand-convert) → confirm it parses →
  author 3×~6 bullets → seed → build.

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
