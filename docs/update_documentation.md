# How This Pipeline Works — Script Generation & Video Generation

This document explains the full architecture of the `video_explainer` pipeline: how a
topic becomes a finished YouTube explainer video, what each component does, and how the
pieces fit together. It is the high-level map; per-step detail lives in the individual
skills under [.claude/skills/](../.claude/skills/).

---

## 1. The big picture — two stages, one contract

```
        STAGE A: SCRIPT GENERATION                STAGE B: VIDEO GENERATION
   ┌─────────────────────────────────┐      ┌────────────────────────────────────┐
   │  topic / title                  │      │  structured script (.txt)           │
   │     │                           │      │     │                               │
   │     ▼  (skill chain, steps 3–8) │      │     ▼  parse → design → TTS → align  │
   │  projects/structured_scripts/   │ ───► │     → render → stitch                │
   │      <name>.txt                 │      │     │                               │
   │  (narration + animation beats)  │      │     ▼                               │
   └─────────────────────────────────┘      │  projects/<name>/out/<name>.mp4      │
                                             └────────────────────────────────────┘
```

The **single contract** between the two stages is the structured script:
`projects/structured_scripts/<name>.txt`. Stage A produces it; Stage B consumes it.
There is no intermediate rewrite — the `.txt` is the only source of truth
(see [source_parser.py](../storyboard/source_parser.py)).

Two supporting files per project:
- `projects/<name>/config.yaml` — design tokens (colors, fonts), TTS voice, output name.
- `storyboard/.cache/designs/*.json` — the per-bullet React code (authored in-session).

---

## 2. Stage A — Script Generation

**Goal:** turn a topic into a retention-engineered script where every beat couples a
narration sentence with the visual that depicts it.

**Entry point:** the [`script_generation`](../.claude/skills/script_generation/SKILL.md)
skill. It is a *plugin* — each step is its own skill, invoked in order with the Skill tool.
Working from memory instead of invoking the step's skill is the #1 way rules get skipped,
so the chain is mandatory (this is enforced by a HARD RULE in [CLAUDE.md](../CLAUDE.md)).

### The skill chain (none skippable, in order)

| Step | Skill | What it produces |
|---|---|---|
| 3 | `script-youtube-strategy` | title, thesis, thumbnail moment, shareable insight, 4 open loops |
| 4 | `script-research` | real sourced facts, stats, a quote, the central metaphor |
| 5 | `script-scene-structure` | scene list + one **anchor visual** per scene (the retention plan) |
| 5.5 | `script-storytelling` | the story spine — connect scenes with "because of that", not "and then" |
| 6a | `script-narration` | narration written to sync rules (pauses, numbers-as-words) |
| 6b | `script-animation-bullets` | the "what happens" director beats per bullet |
| 6.5 | (cut pass) | remove ≥10% of sentences — tighter = higher retention |
| 7a | `script-animation-validator` | is each beat BROKEN? (sense/fit/motion/buildable + Check-E) |
| 7a2 | `script-narration-visual-sync` | is it GOOD? /100 scorecard; <70 = NOT READY |
| 7b | `script-validator` + `script-format-validation` | format/anchors/density/canvas |
| 7c | `script-retention-engineering` | engineer the curve: hooks, pattern interrupts |
| 7d | `script-human-review` | watch it as a viewer — 9 questions |
| 7e | `script-content-quality` | 12 content tests |
| 7f | `script-critique-improve` | fact-check gate + patch or rebuild |
| 8 | (save) | write `projects/structured_scripts/<name>.txt` + present for approval |

Producing the `.txt` is **not** the finish line — it is the *input* to steps 6.5–7. A
script is not "ready" until every gate passes.

### Script format (pair-block — the preferred format)

The parser auto-detects two formats. New scripts use **pair-block**, where each beat's
narration and visual are co-located so the audio anchor is a verbatim phrase from the
beat's *own* narration (this makes sync drift impossible):

```
## SCENE N — "Title" (M:SS – M:SS)
- **0:00 – 0:08 — Headline.**
  > The narration sentence(s) for THIS beat. <pause 0.3s>
  what happens: 1. … 2. …          (director description of the motion)
  text: "−33%"                       (≤3 words OR one number on screen)
  audio_anchor: a verbatim phrase from this bullet's own > line
  anchor_mode: appear | through | land
```

The full narration is reassembled by concatenating each bullet's `>` lines in order, so
TTS / Whisper / render all run identically.

---

## 3. Stage B — Video Generation

**Goal:** render the structured script into a finished mp4. Orchestrated by
[build_video.py](../storyboard/build_video.py).

```bash
python storyboard/build_video.py projects/<name>/        # full build
PROJECT=<name> node remotion/render_scenes.mjs <name>-s01 # render one scene (silent)
```

### The 10 orchestration steps (from build_video.py)

1. **Load config** — read `config.yaml` (tokens, voice, output name).
2. **Parse** the structured script → `Scene`/`AnimationBullet` objects
   ([source_parser.py](../storyboard/source_parser.py)).
3. **Visual design** — look up each bullet's `React.createElement` code in the cache
   ([visual_designer.py](../storyboard/visual_designer.py)). **Cache-only — no LLM
   subprocess** (see §4).
4. **TTS** — synthesize the full narration as one continuous track (edge-tts; Piper /
   ElevenLabs are higher-quality alternatives).
5. **Transcribe** — Whisper produces word-level timestamps (faster-whisper).
6. **Locate** scene boundaries inside the transcript.
7. **Align** — compute each bullet's `framesFrom`/`framesTo` by matching its `audio_anchor`
   to the Whisper word, then emit scene JSONs to `projects/<name>/scenes/`.
   7.5 — mirror `projects/<name>/scenes/` → `remotion/public/scenes/` (purge stale).
8. **Patch** `remotion/src/storyboard/timelines.ts` entries.
9. **Render** each scene via Remotion — silent mp4, resume-safe
   ([render_scenes.mjs](../remotion/render_scenes.mjs)).
10. **Stitch** scenes + mux the narration audio → final mp4
    (`ffmpeg -f concat -c:v copy`, then mux the MP3 — note per-scene renders are SILENT).

### The mandatory per-scene loop

Scenes are **not** batch-rendered. Render scene 1, verify it fully, fix, re-render until it
passes — *only then* advance to scene 2. Never stitch before all scenes pass. A bug missed
at scene 1 compounds across 30+ minutes of render time. Verification = audio-sync drift
check + caption-zone + animation-timeline-fit + freeze check + real frame inspection,
logged to `projects/<name>/verification.md`. Full protocol:
[vg-verification-protocol](../.claude/skills/vg-verification-protocol/SKILL.md).

---

## 4. Per-bullet code: cache-only, authored in-session

The renderer needs a self-contained `React.createElement` function body per bullet. That
code is **authored by Claude Code in-session** (reading the structured script directly),
then written to the cache via [seed_bullet_cache.py](../storyboard/seed_bullet_cache.py).
The pipeline does a **pure cache lookup** — it never spawns the `claude` CLI. (The old
per-bullet CLI spawn was removed: it was expensive, and Claude Code refuses to launch
inside Claude Code anyway.)

```
storyboard/.cache/designs/bullet-s{NN}-b{NN}-{hash16}.json
  → { code, audio_anchor, source_headline }
```

The cache key is `sha256(narration + bullet_idx + headline + body + design_tokens +
'prompt-v14-per-bullet')[:16]`. The `audio_anchor` is **not** in the key, so re-anchoring a
beat does not invalidate its code. On a cache miss the build aborts with a precise pointer
to the missing bullet — it never silently ships a placeholder.

**Seeding workflow:**
```bash
python storyboard/seed_bullet_cache.py <script> --json bundle.json
# bundle.json: [ {"scene":1,"bullet":1,"anchor":"…","code":"…"}, … ]
```

---

## 5. The render runtime — how bullet code executes

Each bullet's code string is compiled once via `new Function(...)` inside
[DynamicBlock.tsx](../remotion/src/universal/DynamicBlock.tsx) and run with a fixed set of
injected bindings (the **RUNTIME_KEYS**):

```
React, frame, fps, width, height, durationInFrames, interpolate, spring, Easing,
AbsoluteFill, Sequence, Series, Img, staticFile, AnimatedImage, TransitionSeries,
linearTiming, springTiming, fade, slide, wipe, D, resolveColor, fitText, measureText,
fillTextBox, Video, Audio, captions, findWord, findWordEnd, Kit
```

Re-declaring any of these names with `const`/`let`/`var` is a compile error
(`Identifier 'X' has already been declared`). Authoring rules (no hex/dimension/fps
literals, caption-zone reserved, emoji hang the headless render, etc.) live in the
SHIFT-LEFT section of [CLAUDE.md](../CLAUDE.md).

### Rendering is **slot-based**

Each bullet occupies its own time slot: `b.framesTo - b.framesFrom`. The canvas blanks
between bullets, so **every bullet must be self-contained** — it redraws all the context it
needs (prior boxes/diagram at their settled state) plus its own new element. A bullet that
only draws a delta and relies on a prior bullet still being on screen renders as a floating
fragment.

---

## 6. Design tokens

Colors and fonts are **never hardcoded** in bullet code. They flow:

```
projects/<name>/config.yaml  (design: block — source of truth)
        │  build_video.py writes ↓
remotion/src/universal/config_tokens.json
        │  design.ts imports ↓
   D.bg, D.cyan, D.violet, …   (the `D` binding in every bullet)
```

When rendering a single scene with `render_scenes.mjs` (which reads the existing JSON,
not `config.yaml`), update **both** `config.yaml` and `config_tokens.json`.

---

## 7. The v2 Global Visual System (current design)

The current `claude_code_limits` project uses a **dark theme** + **3 persistent objects**
that never change shape, position, or meaning — consistency is the whole point. They are
built once as reusable components in [kit.tsx](../remotion/src/universal/kit.tsx) and
exposed to bullet code via the `Kit` binding:

| Object | Component | Meaning |
|---|---|---|
| **Battery** (top-right) | `Kit.Battery` | the usage budget; only ever drains green→amber→red |
| **Stack** (center-left) | `Kit.Stack` | the context window; sheets pile up (cyan=you, violet=Claude, white=files, grey=logs) |
| **Claude orb** (center-right) | `Kit.ClaudeOrb` | the assistant; emits a scan-line before each reply |
| scan beam | `Kit.ScanSweep` | Claude reading the stack, top→bottom |
| supporting | `Kit.GlassContainer`, `Kit.Checklist`, `Kit.NumberStamp` | tank / scoped tasks / "loud" number |

**The one causal rule the whole video teaches (shown, not told):**
> tall stack → long scan → big battery drop.

**THE SYNC RULE (most important):** a bullet computes one `scanProgress`, then passes it to
**both** `ScanSweep` (`progress`) and `Battery` (`rem = startLevel − scanProgress × cost`)
— so the scan and the drain move as one. That is how the viewer learns the causality.

Dark palette (config tokens): bg `#0B1020`, surface `#161C2E`, text `#F8FAFC`, dim
`#64748B`, cyan `#22D3EE`, violet `#A78BFA`, amber `#FBBF24`, green `#4ADE80`, red `#F87171`.

> **Note on blur:** never put `filter: blur` / blurred `boxShadow` on a per-frame-moving
> element — the headless render re-rasterizes it every frame and stalls. The Kit glows are
> built from solid concentric shapes for this reason.

---

## 8. Key files reference

| File | Role |
|---|---|
| [storyboard/build_video.py](../storyboard/build_video.py) | end-to-end orchestrator (parse→TTS→align→render→stitch) |
| [storyboard/source_parser.py](../storyboard/source_parser.py) | the script-format contract (legacy + pair-block) |
| [storyboard/visual_designer.py](../storyboard/visual_designer.py) | per-bullet cache lookup (no CLI) |
| [storyboard/seed_bullet_cache.py](../storyboard/seed_bullet_cache.py) | write authored code into the cache |
| [storyboard/ssml_compiler.py](../storyboard/ssml_compiler.py) | narration → SSML (converts `<pause>` to breaks) |
| [storyboard/narration_pacer.py](../storyboard/narration_pacer.py) | inserts pauses so each beat gets its display time |
| [remotion/render_scenes.mjs](../remotion/render_scenes.mjs) | render one/many scenes (silent mp4) |
| [remotion/src/universal/DynamicBlock.tsx](../remotion/src/universal/DynamicBlock.tsx) | compiles & runs bullet code with injected bindings |
| [remotion/src/universal/kit.tsx](../remotion/src/universal/kit.tsx) | reusable component library (the design system) |
| [remotion/src/universal/design.ts](../remotion/src/universal/design.ts) | the `D` token binding |
| [CLAUDE.md](../CLAUDE.md) | project memory: SHIFT-LEFT authoring rules + hard rules |

---

## 9. Glossary

- **Bullet / beat** — one narration+visual unit; the atomic render slot.
- **Anchor** — the verbatim narration phrase whose Whisper timestamp sets when a bullet fires.
- **framesFrom / framesTo** — a bullet's render slot, computed from the anchor's word time.
- **Drift** — `framesFrom/fps − word_start`; must be ±0.05s (PERFECT) or within ±1.5s (PASS).
- **REPLACE vs ADDITIVE** — REPLACE wipes the canvas; additive adds (but slot-based render
  means every bullet still redraws its own context).
- **Cache miss** — a bullet with no seeded code; aborts the build by design.
