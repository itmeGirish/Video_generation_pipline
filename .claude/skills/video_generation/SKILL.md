---
name: video_generation
description: Complete pipeline for creating production YouTube explainer videos from a structured script. The pipeline NEVER spawns the `claude` CLI — per-bullet React code is authored in-session by Claude Code and seeded into a content-addressed cache; the build then does pure cache lookup → TTS → render → stitch.
metadata:
  tags: video, remotion, pipeline, animation, narration, tts, in-session-codegen
---

## NO CLAUDE CLI SUBPROCESS — ARCHITECTURAL INVARIANT

The `claude` CLI is **NEVER** spawned by any file under `storyboard/`. This is enforced by the
preflight suite (`test_pipeline_fixes.py [5]`) which fails the build if `subprocess.run` or
`CLAUDE_BIN` reappear in `visual_designer.py` or `script_converter.py`.

Per-bullet React.createElement code is authored by **the active Claude Code session** (this
agent) reading the structured script directly, then written to the cache via
`storyboard/seed_bullet_cache.py`. `visual_designer.py` only does cache lookup; a cache miss
raises `CacheMissError` naming the bullet and the seed command — no silent fallback.

**Why:** Each `claude --print` subprocess call paid full system-prompt + context tokens for
every one of 70+ bullets. The user explicitly forbade this pattern: token cost was massive,
and Claude Code refuses to launch inside another Claude Code session anyway. In-session
authoring keeps context loaded once for the whole script.

**Workflow when a script arrives:**
1. Hand-convert raw → structured (rule 18)
2. Build `config.yaml` from the structured comment blocks (rule 00 §2)
3. **READ rule 21 (visual-map) BEFORE authoring any bullet code.** For each bullet:
   - Answer Q1: what must the viewer understand?
   - Answer Q2: what is the simplest visual that proves it?
   - Pick the canonical pattern from rule 21's content-type map
   - No brand names, no chaotic animations, citations for all stats
4. Write a JSON bundle and call `python storyboard/seed_bullet_cache.py <script_path> --json bundle.json`
5. Run `python storyboard/build_video.py <script_path>` — 100% cache hits expected; pipeline
   flows through TTS → Whisper → align → render → stitch with zero token cost

## MODEL STRATEGY — which Claude model does what

The acting Claude Code session's model is selected via `/model` (Opus 4.7 / Sonnet 4.6 /
Haiku 4.5). Pipeline scripts in `storyboard/` no longer take a `model:` config — there is
no subprocess to feed; the active session does the work.

| Phase | Model | Why |
|---|---|---|
| Hand-convert raw → structured (rule 18) | **Opus 4.7** | 9-step checklist with silent downstream-fatal mistakes (frame-timing math, design-token preservation, bespoke metaphors). Needs deep reasoning to get right first time. |
| Build `config.yaml` from comment blocks | **Sonnet 4.6** | Mechanical: copy hex values from `<!-- ## DESIGN TOKENS -->` block into yaml. Pure templating. |
| Verify parse-gate, count bullets, list assets | **Sonnet 4.6** | File ops + arithmetic. |
| **Step 2 — author per-bullet React code** | **Opus 4.7** | Each bullet is 100-200 lines satisfying 10 fidelity contracts (no JSX, design tokens only, audio_anchor verbatim, durationInFrames-fraction phase timing, spring-preset → intent map, no-text-overlap, etc.). Bespoke metaphors (octopus tentacles, vault doors, glass shatter, lie detector, planets) need deep understanding of bullet body intent. |
| Step 2 — seed cache (`seed_bullet_cache.py`) | **Sonnet 4.6** | Pure command execution. |
| Run TTS, Whisper, render, stitch | **Sonnet 4.6** | Watch logs, parse status. No reasoning. |
| **Quality check** — `validate_output.py` review, frame inspection, narration coverage analysis | **Opus 4.7** | Subtle judgment: does the rendered visual match the bullet's intent? Reading scene JSON + structured-script bullet + frame thumbnails together. |
| **Correction** — bullet rendered wrong, rewrite code | **Opus 4.7** | Same skill as Step 2 authoring; debugging + re-authoring complex code with multiple constraints. |
| Routing — "which rule to read", "which file to edit", "which cache to invalidate" | **Sonnet 4.6** | Lookup against rule index + decision tree (rule 13). |
| Status polls — cache file count, render progress, file existence | **Sonnet 4.6** (or Haiku 4.5 for the cheapest) | Sub-second answers, no chain reasoning. |

**Heuristic for switching:**
- *Generating creative code, debugging subtle behavior, or making a judgment call?* → Opus 4.7.
- *Running commands, reading files, making templated edits?* → Sonnet 4.6.
- *Yes/no determinations, file existence, status checks?* → Haiku 4.5 (or stay on Sonnet, fine).

**Practical session pattern:**
1. Stay on **Opus 4.7** during scene authoring + QA + correction phases.
2. Switch (`/model sonnet`) for the seed → build → render → stitch phase (mechanical).
3. Switch back to **Opus 4.7** when reviewing `validate_output.py` results or fixing
   broken bullets.

## ENFORCEMENT — Agent tool with `model` parameter (verified working in Claude Code 2026-05)

Manual `/model` switching is fragile — easy to forget and burn Opus tokens on
mechanical work. The real enforcement is the **`Agent` tool's `model` parameter**:
the subagent literally runs as that model, billing is correct, and the subagent
gets an isolated context window so log-parsing doesn't bloat the parent's
context.

**What was verified (2026-05) by spawning a test subagent in this session:**
- ✅ `Agent(subagent_type: "general-purpose", model: "haiku", ...)` — works.
  Subagent responded in ~4s on Haiku-consistent token count.
- ❌ `Agent(subagent_type: "<custom-name>", ...)` reading `.claude/agents/<name>.md` —
  **NOT supported** in this harness. The Claude Code build resolves only the 5
  builtin types (`general-purpose`, `Plan`, `Explore`, `claude-code-guide`,
  `statusline-setup`). Custom file-based subagents may exist in other Anthropic
  surfaces but were rejected with "Agent type 'video-status' not found" here.

So all recipes use the **inline-model pattern** on `general-purpose` — the only
combination tested and known to work in this session.

### Recipe 1 — SEED + BUILD phase (Sonnet)

After authoring all bullets in this Opus session and writing `bundle.json`:

```
Agent(
  description: "Seed bullet cache + run video build",
  subagent_type: "general-purpose",
  model: "sonnet",
  prompt: "You are running mechanical pipeline commands for the video_generation
    project. Do NOT author or modify any React.createElement code, do NOT edit
    the structured script, do NOT make quality judgments — surface those back
    to the parent Opus session if they come up.

    Run in order, watching the output of each:

      1. python storyboard/seed_bullet_cache.py <script_path> --json <bundle_path>
      2. python storyboard/build_video.py <script_path>

    After step 1: report cache file count vs bundle entry count.
    After step 2: report final mp4 path, total runtime, audio_anchor coverage %,
    and placeholder count. If a CacheMissError surfaces, STOP and report
    which bullet. Final report under 250 words, structured as:

      COMMAND:   <which command ran>
      RESULT:    <pass/fail>
      ARTIFACTS: <paths to mp4/srt/chapters/thumbnail produced>
      METRICS:   <cache hits, anchor %, runtime, placeholders>
      WARNINGS:  <verbatim from logs>"
)
```

### Recipe 2 — STATUS POLL (Haiku)

When the user asks "what's the build status" mid-run:

```
Agent(
  description: "Video build status poll",
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: "Report video build state for projects/<name>/. Run these checks:

    1. ls storyboard/.cache/designs/bullet-s*-b*-*.json | wc -l
    2. ls projects/<name>/audio/*.mp3 (file size if exists)
    3. ls projects/<name>/scenes/*.json | wc -l
    4. ls remotion/out/<project-with-hyphens>-s*.mp4 | wc -l
    5. ls projects/<name>/out/*.mp4 (file size if exists)

  Return EXACTLY 4 lines, no prose:
    cache:   <N> files
    audio:   <yes|no> [<size>]
    scenes:  <N> json, <N> mp4
    final:   <yes|no> [<size>] [<path>]"
)
```

### Recipe 3 — QUALITY REVIEW (stays on Opus, no subagent)

When `validate_output.py` finishes and a coverage % or per-bullet visibility flag
is below threshold, do NOT delegate. Stay on Opus and read:
- `projects/<name>/out/<output>.mp4_validation_report.txt`
- The flagged bullet's `code` field in `projects/<name>/scenes/<sid>.json`
- The structured-script bullet body
Then decide: re-author this bullet, fix the bullet body in the structured script,
or accept the warning. This decision is THE thing that requires Opus's depth.

### When NOT to spawn a subagent

- Authoring per-bullet React code → MUST stay on this Opus session (deep reasoning).
- Hand-converting a raw script per rule 18 → MUST stay on this Opus session.
- Reviewing validate_output.py findings + deciding action → MUST stay on this Opus session.
- A one-line shell command you can run faster than spelling out a prompt → just use Bash here.

The line: *if the work needs judgment, stay on Opus. If it just runs commands and
parses logs, delegate to Sonnet (Recipe 1). If it answers a yes/no count,
delegate to Haiku (Recipe 2).*

## HARD PREFLIGHT — NON-NEGOTIABLE (auto mode does NOT skip this)

Before ANY tool call, code edit, or pipeline run in this project:

1. Identify which pipeline step you are about to work on
2. Look up that step in the routing table below
3. **Read every rule file listed for that step** — open and read, not assume
4. Run `python -m storyboard.test_pipeline_fixes` before editing any `storyboard/*.py`

**Pressure ("continue", auto mode, urgency) does NOT waive this preflight.**
Skipping it causes real failures: sync drift, render crashes, TTS loops, format errors.
The rules exist because each one documents a real bug already hit in production.

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
| **Pre-build** — authoring a new script (manual / by hand) | 16 | Copy-paste prompt |
| **Pre-build** — generating a script via `.claude/skills/script_generation/` skill | 20 | Bridge from script-writer output → raw script via `script_gen_to_raw.py` |
| **Step 0.5** — auto-convert minor format drift | 14 | Regex normalizer (LLM fallback REMOVED — see rule 18 if regex fails) |
| **Step 0.5** — convert rich script (frames, sub-scenes, preamble) | 18 | Mandatory hand-conversion checklist |
| **Step 1** — parse | 01 | Canonical format the parser eats |
| **Step 2** — per-bullet authoring (in-session, no subprocess) | 04 + 19 + (17 if assets) | Bindings, fidelity gates, layout discipline, asset references. Author here, seed via `seed_bullet_cache.py`. |
| **Step 2** — bullet has video asset (`.mp4`, `.webm`) | 17 + remotion/can-decode | Run `canDecode` before authoring the bullet; H.264/mp4 safe, AV1/HEVC may fail silently |
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
- [rules/20-script-generation-integration.md](rules/20-script-generation-integration.md) — How `.claude/script_generation/` (the YouTube script-writer skill) feeds the pipeline via `storyboard/script_gen_to_raw.py`. Two-step bridge — generate, then convert — with no changes to the existing parser/build code.

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
3. Count(animation bullets in structured script) MUST equal count(cached bullet entries) — fidelity gate.
   The pipeline now does cache-only lookup. A missing cache entry raises `CacheMissError` and
   aborts the build before any audio or video is produced. There is no silent placeholder
   substitution — if you see a build start TTS, every bullet was found in cache.
4. Bullet authoring + cache contract:
   - Per-bullet React.createElement code is authored by **the active Claude Code session**
     reading `projects/structured_scripts/<name>.txt` directly. NO subprocess invokes the
     `claude` CLI from anywhere in `storyboard/`.
   - Authored code + `audio_anchor` is written to `storyboard/.cache/designs/bullet-sN-bM-<hash>.json`
     via `python storyboard/seed_bullet_cache.py <script_path> --json bundle.json`.
   - Cache key = `sha256(narration + bullet_idx + headline + body + design_tokens + 'prompt-v13-per-bullet')[:16]`.
     `seed_bullet_cache.py` and `visual_designer._bullet_cache_key` use the SAME constant —
     drift between them = cache miss. Preflight test asserts the version tag matches.
   - Cache miss = hard error pointing at the bullet body and the seed command. No placeholder
     fallback exists; the renderer never sees an "incomplete" build.
5. All Remotion animations via `useCurrentFrame()` — CSS transitions FORBIDDEN
6. Composition IDs use hyphens only: `<project>-s01`, never underscores
7. **Authored `code` is invoked at runtime by `DynamicBlock.tsx`** — there is no fixed primitive registry. Each bullet's "primitive" is whatever React.createElement tree was authored in-session from the bullet body. Runtime errors show a "BLOCK COMPILE ERROR" / "BLOCK RUNTIME ERROR" frame instead of crashing the bundle.
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
10. **Narration word → visual sync contract** — every bullet must satisfy:
    (a) `[anchor: X]` where X is 1–4 verbatim words from that scene's narration — when
    the narrator says X, that visual appears on screen at that exact moment.
    (b) Bullet body describes the exact elements on screen (shape, label text, color token,
    position, animation) — not intent. "Green button labeled 'RUN TESTS' pulses center,
    progress bar cyan below" not "show the testing step."
    Vague anchor + vague body = generic layout + wrong sync time.
    See rule 15 Lever 3 for full examples and checklist.

11. **Atomic write contract** — every artifact whose corruption would break a future build
    or render must be written via `inprogress → os.replace` (or `fs.renameSync` in Node):
    - `timelines.ts`, `config_tokens.json`, `build_timing.json`
    - `projects/<name>/scenes/<sid>.json` and `projects/<name>/captions/<sid>.json`
    - `remotion/public/{scenes,captions}/<sid>.json` mirrors (atomic copy)
    - `remotion/out/<sid>.mp4` (renderer writes `.inprogress`, renames after size guard)
    - `projects/<name>/out/<output>.mp4` (final mux + health-check before replace)
    - `storyboard/.cache/designs/bullet-*.json` (LLM cache)
    `build_video.py` exposes `atomic_write_text(path, content)` and `atomic_copy(src, dst)`
    helpers — use them. Direct `Path.write_text` on a build artifact is a regression.

12. **Cache key completeness** — every cache key must hash EVERY input that would change
    the output. If a config knob changes the rendered bytes, that knob is in the key.
    - TTS cache key = `sha256(VOICE | RATE | PITCH | full_ssml)` (NOT bare SSML)
    - Whisper cache key = `sha256(audio_bytes | model_name | compute_type)` (NOT bare audio)
    - Designer cache key = `sha256(narration + bullet_idx + headline+body + design_tokens + prompt-version)`
    A cache miss because the user "fixed" config.yaml is correct behavior. A cache HIT
    after the user changed an output-affecting knob is silent staleness — a bug class.

13. **Frame-conversion contract — `round()`, never `int()`** — every seconds→frames
    multiplication uses `round(t * FPS)`. `int()` truncates and accumulates 1-frame drift
    per scene; `round()` errors are ±0.5 frame and cancel across the whole video.
    Audited sites: `total_frames = round(total_sec * FPS)`, `_total_audio_frames`,
    `_scene_start_frames`, every `framesFrom` / `framesTo` derivation, `MIN_BLOCK_FRAMES`.
    Subprocess timeouts in seconds (`timeout=30`) are exempt — they are not frame counts.

14. **ffmpeg seek for QA & validation** — use OUTPUT seek (`-i file -ss t`), not INPUT
    seek (`-ss t -i file`). Input seek is fast but lands on the nearest preceding keyframe;
    a midpoint visibility check can land on a black backdrop-fade frame seconds before the
    requested timestamp and emit a false "midpoint is BLACK" alarm. Output seek decodes
    through and lands exactly. Applies to `visual_qa.py`, `validate_output.py`.

15. **Production sidecar artifacts** — every final mp4 must ship with:
    - `+faststart` flag (moov atom at front for streaming)
    - ffprobe report logged at end (codec/resolution/duration/bitrate)
    - A/V length-equality check (warn if final duration drifts >0.5s from `total_sec`)
    - `.srt` subtitle file (concatenated from caption JSONs, ~7 words per cue)
    - `.chapters.txt` (YouTube-ready timestamps from `scene_timings`)
    - `_thumbnail.jpg` (frame at t=3s)
    Optional knob: `stitch.audio_loudnorm: true` enables YouTube-target loudnorm
    (I=-14 LUFS, TP=-1, LRA=11). Off by default to keep audio levels stable across re-runs.

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
overshoot, fuzzy-aware coverage, subprocess window flash, atomic writes,
cache key completeness, frame-conversion drift, output-seek QA):

```bash
# Custom check() harness — covers rule 10 Classes 1-10
python -m storyboard.test_pipeline_fixes

# Pytest harness — covers rule 10 Classes 11-17 (audit-driven fixes)
python -m pytest storyboard/test_audit_fixes.py -v
```

Expected: `PASS: N    FAIL: 0` for the first command; `41 passed` for the
second. Any failure means a fix in rule 10 has regressed — read the matching
test for the exact assertion and `rules/10-known-bugs-and-prevention.md` for
the bug class behind it.

**Single-command run (both suites under pytest):**
```bash
python -m pytest storyboard/test_pipeline_fixes.py storyboard/test_audit_fixes.py
```
