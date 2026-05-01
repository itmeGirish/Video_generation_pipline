---
name: video-generation-pipeline
description: Complete pipeline for creating production YouTube explainer videos from a source script. Covers script format, per-bullet React codegen, narration/SSML, and rendering.
metadata:
  tags: video, remotion, pipeline, animation, narration, tts, codegen
---

## When to use

Use this skill whenever:
- A new source script + animations is given → **read `rules/00-when-script-received.md` FIRST**
- The pipeline breaks and you need to diagnose the step that failed
- Narration quality needs improvement (flat/monotone)
- A bullet's rendered output is wrong or empty

## How to use

**When a script is given: always start with rule 00.**

### Pipeline-step → which rule(s) to read

Use this table when you know which step of `build_video.py` is in play and
need the matching rule fast. (For topical browsing, the full rule index
follows below.)

| Pipeline step (rule 02 numbering) | Rule(s) to read | Why |
|---|---|---|
| **Pre-build** — script just arrived | 00 | Workflow entrypoint |
| **Pre-build** — authoring a new script | 16 | Copy-paste prompt |
| **Step 0.5** — auto-convert minor format drift | 14 | regex + LLM converter |
| **Step 0.5** — convert rich script (frames, sub-scenes, preamble) | 18 | Mandatory hand-conversion checklist |
| **Step 1** — parse | 01 | Canonical format the parser eats |
| **Step 2** — per-bullet codegen | 04 + 19 + (17 if assets) | Bindings, fidelity gates, layout discipline, asset references |
| **Step 3** — SSML compile | 05 | Prosody knobs, `<pause Xs>` markers |
| **Step 7** — audio_anchor lookup | 08 | How visuals lock to spoken words |
| **Step 9.5** — visual QA | 12 | Coverage thresholds + post-render checks |
| **Step 10** — stitch + within-block stagger | 09 | Backdrop fade, stitch mode, in-code cross-fade pattern |
| **Step 10.5** — output validation | 12 | Same rule as 9.5 |
| **Cross-cutting** — commands, flags, config | 06 | CLI + config.yaml |
| **Cross-cutting** — full architecture | 02 | One-page overview |
| **Cross-cutting** — about to edit `storyboard/*.py` | 10 | 8 known bug classes + their tests |
| **Cross-cutting** — debugging build/render failure | 11 | Bundle-once, mirror sync, cache invalidation |
| **Cross-cutting** — validator flagged an error | 13 | Cookbook → which file, which flag |
| **Cross-cutting** — output feels generic / flat | 15 | Quality bar levers |

Read rule files for each concern:

- [rules/00-when-script-received.md](rules/00-when-script-received.md) — **START HERE** — exact 6-step flow when a script + animation is given
- [rules/01-source-script-format.md](rules/01-source-script-format.md) — The exact `.txt` script format: SCENE headers, Narration, Animation bullets
- [rules/02-pipeline-architecture.md](rules/02-pipeline-architecture.md) — End-to-end steps: parse → per-bullet codegen → SSML → TTS → Whisper → render → stitch
- [rules/04-visual-designer.md](rules/04-visual-designer.md) — Per-bullet codegen: LLM emits React.createElement code that DynamicBlock compiles + invokes at runtime
- [rules/05-ssml-narration.md](rules/05-ssml-narration.md) — How to write SSML for dramatic, non-flat narration
- [rules/06-build-and-run.md](rules/06-build-and-run.md) — Commands to run the pipeline, config.yaml format (including optional build/stitch/whisper/narration sections), output locations
- [rules/08-narration-alignment.md](rules/08-narration-alignment.md) — audio_anchor mechanism: how visuals lock to actual spoken words; uses round() not int() for s→frames
- [rules/09-scene-transitions.md](rules/09-scene-transitions.md) — Backdrop fade, primitive sequencing, stitch mode (hard_cut vs crossfade)
- [rules/10-known-bugs-and-prevention.md](rules/10-known-bugs-and-prevention.md) — Post-mortem of every bug class hit so far + the structural defenses that now prevent each one.
- [rules/11-pipeline-internals.md](rules/11-pipeline-internals.md) — How JSONs reach renderer, how config propagates, bundle-once pattern, cache invalidation cheat sheet (now per-bullet). **Read when debugging build/render failures.**
- [rules/12-output-validation.md](rules/12-output-validation.md) — Verify the rendered video actually contains every narration word and every animation bullet. Frame extraction for human / vision-model QA.
- [rules/13-rerun-after-correction.md](rules/13-rerun-after-correction.md) — **Cookbook.** When a validator flags an error: which file to edit, which cache to invalidate, the exact re-run command. Decision tree included.
- [rules/14-script-conversion.md](rules/14-script-conversion.md) — How any-format `projects/scripts/*.txt` is auto-converted to canonical `projects/structured_scripts/*.txt` before parsing. Two-stage: regex (fast, free) → LLM fallback (robust). The structured_scripts folder is the parser's single source of truth — never edit by hand.
- [rules/15-narration-and-clarity.md](rules/15-narration-and-clarity.md) — **Quality bar.** Read when output feels flat or visuals feel generic. Four levers: TTS (edge-tts ignores SSML — use ElevenLabs/Azure for drama), designer prompt (CLARITY > CLEVERNESS), audio_anchor sync, and pacing (8-12 bullets per 60s scene).
- [rules/16-script-writing-prompt.md](rules/16-script-writing-prompt.md) — **Copy-paste prompt** for writing a new `source.txt` script the pipeline can render with high fidelity. Use when starting a new video. Includes primitive list, format rules, and good/bad examples.
- [rules/17-graphics-and-assets.md](rules/17-graphics-and-assets.md) — **Use your own graphics.** How to drop logos/screenshots/diagrams/SVGs into `projects/<name>/public/` and reference them from animation bullets via `[asset: filename.png]`. The per-bullet LLM emits `<Img src={staticFile('...')} />` directly — both bindings are wired into `DynamicBlock` (rule 04 bindings table).
- [rules/18-rich-script-conversion.md](rules/18-rich-script-conversion.md) — **MANDATORY first step when a raw script is given.** Read raw `projects/scripts/<name>.txt` → apply the 9-step conversion checklist → write canonical output to `projects/structured_scripts/<name>.txt`. Covers everything `script_converter.py` does NOT handle (frame timing, `### VO:`, sub-scenes, design-token preambles, bespoke metaphors). Includes the bespoke-visual handling guidance and the bullet density target. Canonical store is `projects/structured_scripts/` — never write conversion output anywhere else.
- [rules/19-layout-and-quality-gate.md](rules/19-layout-and-quality-gate.md) — Canvas-utilization minima, phase-timing idiom (`durationInFrames * 0.3/0.6/0.9`), spring-preset → intent map, proportional typography sizing, common LLM-emitted-code failure modes, and the pre-render checklist. Read when bullet visuals look small/empty, when elements clip, or before shipping a render.

## Dependency on remotion skill

This skill depends on `.claude/skills/remotion/`. Read it in these situations:

| Situation | Which remotion rule to read |
|-----------|----------------------------|
| Writing any `.tsx` primitive | `rules/animations.md` + `rules/timing.md` (MANDATORY) |
| Typewriter/text effect | `rules/text-animations.md` |
| Sequence/stagger timing | `rules/sequencing.md` |
| Scene-to-scene transitions | `rules/transitions.md` |
| Long user text that may overflow | `rules/measuring-text.md` — use `fitText()` from `@remotion/layout-utils` |

Rules NOT used by this pipeline (do not be misled by skill index):
- `rules/audio.md` — audio is muxed externally via ffmpeg in `build_video.py`,
  never inside primitives. No primitive uses Remotion's audio components.
- `rules/display-captions.md` — captions come from our own `VideoCaptions`
  component reading Whisper word timestamps; not Remotion's `@remotion/captions`.
- `rules/extract-frames.md` — uses Mediabunny browser canvas API for runtime
  frame extraction. Our `visual_qa.py` and `validate_output.py` extract from
  finished mp4 in Python via ffmpeg. ffmpeg is correct; do NOT migrate.
- `rules/charts.md` — `StatsGrid`, `ProductivityBars` are custom primitives,
  not chart-library based.

The visual_designer.py LLM system prompt already embeds the core Remotion constraints
(no CSS transitions, design token colors, static props) — this runs automatically on
every script. But when Claude writes a `.tsx` file, it MUST read the remotion skill first.

## Critical contracts (never break these)

1. **`projects/structured_scripts/<name>.txt` is the ONLY truth.** All downstream steps
   (parser, `config.yaml` derivation per rule 00 §2, designer LLM, validators, human
   reviewers) read from this single file. Never use `script.md`, `projects/<name>/source.txt`,
   or the raw `projects/scripts/<name>.txt` as intermediates. The raw script is converted
   ONCE in Step 1 (rule 18) and never re-read by later steps.
2. **Single-source-of-truth convention** — the structured file's top must contain
   `<!-- ## DESIGN TOKENS ... -->`, `<!-- ## GLOBAL VISUAL SYSTEM ... -->`, and
   `<!-- ## TITLE OPTIONS ... -->` comment blocks copied verbatim from the raw script.
   `source_parser.py` ignores comments; `config.yaml` derivation reads them.
3. Count(animation bullets in structured script) MUST equal count(visual blocks emitted) — fidelity gate
4. Bullet codegen failure (LLM rate-limit / malformed JSON / empty code field) → hard fail, no silent skipping
5. All Remotion animations via `useCurrentFrame()` — CSS transitions FORBIDDEN
6. Composition IDs use hyphens only: `<project>-s01`, never underscores
7. **LLM-emitted `code` is invoked at runtime by `DynamicBlock.tsx`** — there is no fixed primitive registry. Each bullet's "primitive" is whatever React.createElement tree the LLM authored from the bullet body. Runtime errors show a "BLOCK COMPILE ERROR" / "BLOCK RUNTIME ERROR" frame instead of crashing the bundle.
8. **Data flow is one-way: structured script → config.yaml → design tokens → primitive .tsx.**
   No primitive `.tsx` (including `UniversalScene.tsx` and the `Backdrop`/error-fallback components)
   may contain a literal hex color, font name, or pixel dimension. All visual values come from
   `D.*` (design tokens) — which are themselves derived from `projects/structured_scripts/<name>.txt`'s
   `<!-- ## DESIGN TOKENS -->` comment block via `projects/<name>/config.yaml`. The MISSING PRIMITIVE
   error fallback also obeys this rule.
   **Pipeline scripts (`storyboard/*.py`) follow the same rule for fps:** every place that uses fps
   (frame intervals, minimum block duration, oscillation periods) must reference `FPS` loaded from
   `config["video"]["fps"]`, never the bare literal `30`. Subprocess timeouts in seconds and `dict.get(..., 30)`
   fallbacks that intentionally match the pinned fps are exempt.
   **Docstrings and inline comments in any code file (`.tsx`, `.py`, `.mjs`) must use generic
   `<name>` / `<project>` / `<headline>` placeholders, never project-specific strings.** A real
   project name (e.g. `harness_3`, `chat_5_5`) appearing in a usage example or a "this looks like…"
   comment is a bleed leak — future readers and LLMs treat it as canonical and copy it into
   unrelated work. Exception: explicit FORBID lists naming banned strings (the contract requires
   naming them) and factual references to dependencies (e.g. "the Anthropic SDK").
9. **`config.yaml` has 4 pinned constants** — `audio.voice = en-US-AndrewMultilingualNeural`,
   `video.fps = 30`, `video.width = 1920`, `video.height = 1080`. Every other field
   (`design.*`, `audio.rate`, `audio.pitch`, `stitch.mode`, `output:`) must be derived
   from the structured file's comment blocks (rule 00 §2). Never hardcode hex / font /
   animation parameter values.

## ALWAYS VERIFY ANY DIMENSION/NUMBER THE SCRIPT PROVIDES (before running the pipeline)

The script may provide dimensions, durations, counts, or filenames. **Treat these as
proposals, not truth.** Verify every one against ground truth before kicking off TTS or
render. Bad dimensions → bad video → user blames the pipeline.

Checklist (apply against every script the user gives you):

| Script claim | Truth source | If mismatch |
|---|---|---|
| Scene time window `(M:SS – M:SS)` | sum of bullet `M:SS – M:SS` ranges | bullets must fit inside scene window |
| Bullet `M:SS – M:SS` | start < end, ranges non-overlapping, monotonic | reorder/edit before run |
| Total runtime claim ("7 minutes") | sum(scene durations) at 170 wpm | shorten/lengthen narration |
| Video resolution / fps | `config.yaml` `video:` block | hard-fail if mismatch |
| Asset filename `[asset: foo.png]` | `projects/<name>/public/foo.png` exists | ask user OR drop placeholder |
| Number of scenes | `## SCENE N` headers in source.txt | reject if duplicates / missing |
| Anchor phrase | verbatim presence in same scene's narration | reject design (rule 15 fuzzy fallback only) |
| Animation bullet count vs narration density | 5–8 bullets per ~60s, 80–130 narration words | warn user before running |

**Practical workflow** — when a script arrives, do this BEFORE any tool call:
1. **Step 1 (rule 18)** — convert `projects/scripts/<name>.txt` → `projects/structured_scripts/<name>.txt`
   with all preservations (DESIGN TOKENS / GLOBAL VISUAL SYSTEM / TITLE OPTIONS as comment blocks at top)
2. **Verify parse-gate**: `python storyboard/source_parser.py projects/structured_scripts/<name>.txt`
3. **Step 2 (rule 00 §2)** — read structured file's comment blocks → write `projects/<name>/config.yaml`
   (4 pinned constants + script-derived design values, no hardcodes)
4. `wc -w` each scene's narration in the structured file → estimate seconds at 170 wpm → compare to scene window
5. `ls projects/<name>/public/` → list every asset on disk
6. Grep the structured file for `[asset:` and image filenames → ensure each is on disk
7. For each scene, verify bullet windows are inside the scene window and don't overlap

If any check fails: stop, tell the user what's wrong, and fix the structured file
(NEVER edit `projects/scripts/<name>.txt` in place). Do NOT run the pipeline on broken
inputs hoping it sorts itself out.

## Verification command

Run BEFORE editing any file in `storyboard/` to catch regressions in the
fundamental fixes (pause leak, decimal/hyphen anchor matching, MIN_BLOCK
overshoot, fuzzy-aware coverage, subprocess window flash):

```bash
python -m storyboard.test_pipeline_fixes
```

Expected: `PASS: N    FAIL: 0`. Any failure means a fix in rule 10 has
regressed — read `storyboard/test_pipeline_fixes.py` for the exact assertion
and `rules/10-known-bugs-and-prevention.md` for the bug class behind it.
