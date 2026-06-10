---
name: video-builder
description: "Complete pipeline for creating production YouTube explainer videos from a structured script. Per-bullet React code is authored in-session and seeded into cache; build does cache lookup to TTS to Whisper to render to stitch. Never spawns the claude CLI. Use this skill whenever: rendering a script, building a video, running the pipeline, generating the mp4, diagnosing pipeline failures, fixing broken bullets, seeding the bullet cache, running post-render QA, or any request like "render my script," "build the video," "run the pipeline," "make the video," "I have a script ready," "start video production," or "seed the cache.""
when_to_use: Use when a structured script at projects/structured_scripts/<name>.txt is ready and you need to render it into a final mp4. Also use when diagnosing pipeline failures, fixing broken bullets, improving narration quality, or running post-render QA.
---

# Video Generation Pipeline

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
3. **READ rule 21 (visual-map) AND the `remotion` skill BEFORE authoring any bullet
   code.** Bullet code is real Remotion — the `remotion` skill is the source of truth
   for how every primitive must behave (read the rule for the primitive you pick:
   `animations.md` + `timing.md` for any motion, `sequencing.md` for staggers,
   `text-animations.md` for text effects, `transitions.md` for scene transitions,
   `measuring-text.md` for overflow, `images.md` for `<Img>`). Authoring against it is
   what prevents the rule-23 Layer 1/1.5 failures. For each bullet:
   - Answer Q1: what must the viewer understand?
   - Answer Q2: what is the simplest visual that proves it?
   - Pick the canonical pattern from rule 21's content-type map
   - Pick the matching `remotion` rule for that pattern's motion/text/image primitive
   - **Decide: coded vector OR real image?** If a real photo / logo / screenshot
     would land harder than drawn shapes (a *real* data center, *this* company's
     logo), reference it as `[asset: img/<name>.jpg]` in the bullet body and author
     the `<Img>` composite (frame + legibility overlay + **cinematic motion** —
     Ken Burns zoom / push-in / logo pop, rule 17; static images fail the A4 freeze
     gate). **The pipeline auto-sources missing `[asset:]` images** at build
     **Step 2.6** from the bullet description (license-safe Openverse default,
     records `CREDITS.md`) — so for generic concept photos you can just reference
     and let the build fetch. For images where the *wrong* one is costly (a named
     company logo, a specific screenshot/chart), pre-place it by hand FIRST via
     **rule 17** (`storyboard/fetch_images.py` → inspect with the Read tool → keep
     best in `projects/<name>/public/`); Step 2.6 leaves existing files untouched.
     Real brand logos are fine in editorial context; never fake a brand mark in
     vector code. Record attribution → `CREDITS.md`.
   - No chaotic animations, citations for all stats
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
- A new source script + animations is given → **invoke the `vg-when-script-received` skill FIRST**
- The pipeline breaks and you need to diagnose the step that failed
- Narration quality needs improvement (flat/monotone)
- A bullet's rendered output is wrong or empty

## How to use

**When a script is given: always start by invoking `vg-when-script-received`.**

### MANDATORY — invoke each phase's skill (never work from memory)

This pipeline is a plugin: every phase is its own skill. **Before doing a phase, INVOKE its
skill with the Skill tool** (active load, not a skim). Working from memory is exactly how the
per-scene verify loop, the asset rules, and the known-bug defenses get skipped. The contract:

| Phase | Invoke (Skill tool) |
|---|---|
| Script just arrived | `vg-when-script-received` (START HERE) |
| Convert raw → canonical | `vg-rich-script-conversion` (+ `vg-script-conversion`) |
| From the script-writer output | `vg-script-gen-integration` |
| Parse / canonical format | `vg-source-script-format` |
| Per-bullet authoring | `vg-visual-map` + `vg-visual-designer` + `vg-layout-quality-gate` (+ `vg-graphics-assets` for assets) + the `remotion` skill |
| **Write the bullet CODE right the first time** (author-time code recipes) | **`vg-render-code`** → `vg-code-animations` · `vg-code-timing` · `vg-code-sequencing` · `vg-code-transitions` · `vg-code-text` · `vg-code-images` · `vg-code-tokens` · `vg-code-vchecks` — copy-paste code patterns per factor, READ BEFORE writing. The same 8 factors are checked after render by `vg-quality-*` via `vg-visual-quality`. |
| SSML narration | `vg-ssml-narration` |
| audio_anchor sync | `vg-narration-alignment` |
| **Per-scene RENDER→VERIFY→FIX loop (MANDATORY)** | `vg-when-script-received` §Step 4 + `vg-verification-protocol` (broken?) → **`vg-visual-quality`** (production-grade? — runs the 8 `vg-quality-*` factor gates) → audio-sync check |
| Production-quality scorecard (per scene) | **`vg-visual-quality`** → `vg-quality-animations` · `vg-quality-timing` · `vg-quality-sequencing` · `vg-quality-transitions` · `vg-quality-text-fit` · `vg-quality-images` · `vg-quality-tokens` · `vg-quality-vchecks` |
| Visual QA (coverage) | `vg-output-validation` |
| Stitch / transitions | `vg-scene-transitions` |
| YouTube upload gate | `vg-verification-protocol` (Layer 3) + `vg-youtube-validation` |
| About to edit `storyboard/*.py` | `vg-known-bugs` |
| Debugging build/render failure | `vg-pipeline-internals` |
| Validator flagged an error | `vg-rerun-after-correction` |
| Output feels flat / generic | `vg-narration-clarity` |
| Runtime / duration question | `vg-video-duration` |
| Architecture overview | `vg-pipeline-architecture` |
| Commands / config.yaml | `vg-build-and-run` |

**Rule: if you reach a phase without having invoked its skill this session, STOP and invoke it
first.** The per-scene verify loop (`vg-verification-protocol`) is the one most often skipped
under time pressure — it is non-negotiable.

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
| **Step 2** — per-bullet authoring (in-session, no subprocess) | 21 + 04 + 19 + **remotion skill (esp. `video-generation-conventions.md`)** + (17 if assets) | Pick the visual (21), author against the matching `remotion` rule + the project convention file (design tokens, layout discipline, motion/freeze prevention, reserved bindings, V-checks). Author here, seed via `seed_bullet_cache.py`. |
| **Step 2** — bullet has video asset (`.mp4`, `.webm`) | 17 + remotion/can-decode | Run `canDecode` before authoring the bullet; H.264/mp4 safe, AV1/HEVC may fail silently |
| **Step 2** — bullet needs a REAL image (photo, logo, screenshot) from the web | 17 | Fetch license-safe via `storyboard/fetch_images.py` → inspect → place in `public/` → `[asset:]`. Monetized = CC/PD/editorial only, record attribution. |
| **Step 2.6** — missing `[asset:]` at build time (auto-fetch) | 17 | `build_video.py` auto-sources any missing `[asset:]` from the bullet description (Openverse default), records `CREDITS.md`, else HARD-FAILS with the manual command. Pre-place images where the wrong one is costly. Knobs: `assets.auto_fetch`, `assets.source`. |
| **Step 3** — SSML compile | 05 | Prosody knobs, `<pause Xs>` markers |
| **Step 7** — audio_anchor lookup | 08 | How visuals lock to spoken words |
| **Step 4 — per-scene RENDER → VERIFY → FIX loop (MANDATORY)** | **00 (§Step 4) + 23** | **One scene at a time. NEVER render scene N+1 until scene N passes rule 23 all four layers. Hard-won discipline — short-circuit = wasted renders. See rule 00 Step 4 for full loop spec.** |
| **Step 9.5** — visual QA | 12 | Coverage thresholds + post-render checks |
| **Step 10** — stitch + within-block stagger (ONLY after ALL scenes pass loop) | 09 | Backdrop fade, stitch mode, in-code cross-fade pattern |
| **Step 10.5** — output validation | 12 | Same rule as 9.5 |
| **Step 11** — YouTube upload standards | 23 (Layer 3); 22 for the "why" | T1–T12 technical gate lives in rule 23 Layer 3; rule 22 points there + lists YouTube's consequences for non-compliance |
| **Cross-cutting** — verifying rendered scenes (visual, animation, audio, YouTube upload) | 23 | V1–V8 frame inspection, filmstrip A1–A8, freeze detection, PSNR, audio WPM/coverage, YouTube T1–T12 gate |
| **Cross-cutting** — commands, flags, config | 06 | CLI + config.yaml |
| **Cross-cutting** — full architecture | 02 | One-page overview |
| **Cross-cutting** — about to edit `storyboard/*.py` | 10 | 8 known bug classes + their tests |
| **Cross-cutting** — debugging build/render failure | 11 | Bundle-once, mirror sync, cache invalidation |
| **Cross-cutting** — validator flagged an error | 13 | Cookbook → which file, which flag |
| **Cross-cutting** — output feels generic / flat | 15 | Quality bar levers |
| **Cross-cutting** — how long is the video / runtime / will it hit target length | 25 | Exact from `build_timing.json` after build; estimate from word count @160 WPM before |

Read rule files for each concern:

- [../vg-when-script-received/SKILL.md](../vg-when-script-received/SKILL.md) — **START HERE** — exact 6-step flow when a script + animation is given
- [../vg-source-script-format/SKILL.md](../vg-source-script-format/SKILL.md) — The exact `.txt` script format: SCENE headers, Narration, Animation bullets
- [../vg-pipeline-architecture/SKILL.md](../vg-pipeline-architecture/SKILL.md) — End-to-end steps: parse → per-bullet codegen → SSML → TTS → Whisper → render → stitch
- [../vg-visual-designer/SKILL.md](../vg-visual-designer/SKILL.md) — Per-bullet codegen: LLM emits React.createElement code that DynamicBlock compiles + invokes at runtime
- [../vg-ssml-narration/SKILL.md](../vg-ssml-narration/SKILL.md) — How to write SSML for dramatic, non-flat narration
- [../vg-build-and-run/SKILL.md](../vg-build-and-run/SKILL.md) — Commands to run the pipeline, config.yaml format (including optional build/stitch/whisper/narration sections), output locations
- [../vg-narration-alignment/SKILL.md](../vg-narration-alignment/SKILL.md) — audio_anchor mechanism: how visuals lock to actual spoken words; uses round() not int() for s→frames
- [../vg-scene-transitions/SKILL.md](../vg-scene-transitions/SKILL.md) — Backdrop fade, primitive sequencing, stitch mode (hard_cut vs crossfade)
- [../vg-known-bugs/SKILL.md](../vg-known-bugs/SKILL.md) — Post-mortem of every bug class hit so far + the structural defenses that now prevent each one.
- [../vg-pipeline-internals/SKILL.md](../vg-pipeline-internals/SKILL.md) — How JSONs reach renderer, how config propagates, bundle-once pattern, cache invalidation cheat sheet (now per-bullet). **Read when debugging build/render failures.**
- [../vg-output-validation/SKILL.md](../vg-output-validation/SKILL.md) — Verify the rendered video actually contains every narration word and every animation bullet. Frame extraction for human / vision-model QA.
- [../vg-rerun-after-correction/SKILL.md](../vg-rerun-after-correction/SKILL.md) — **Cookbook.** When a validator flags an error: which file to edit, which cache to invalidate, the exact re-run command. Decision tree included.
- [../vg-script-conversion/SKILL.md](../vg-script-conversion/SKILL.md) — How any-format `projects/scripts/*.txt` is auto-converted to canonical `projects/structured_scripts/*.txt` before parsing. Two-stage: regex (fast, free) → LLM fallback (robust). The structured_scripts folder is the parser's single source of truth — never edit by hand.
- [../vg-narration-clarity/SKILL.md](../vg-narration-clarity/SKILL.md) — **Quality bar.** Read when output feels flat or visuals feel generic. Four levers: TTS (edge-tts ignores SSML — use ElevenLabs/Azure for drama), designer prompt (CLARITY > CLEVERNESS), audio_anchor sync, and pacing (8-12 bullets per 60s scene).
- [../vg-script-writing-prompt/SKILL.md](../vg-script-writing-prompt/SKILL.md) — **Copy-paste prompt** for writing a new `source.txt` script the pipeline can render with high fidelity. Use when starting a new video. Includes primitive list, format rules, and good/bad examples.
- [../vg-graphics-assets/SKILL.md](../vg-graphics-assets/SKILL.md) — **Use your own graphics.** How to drop logos/screenshots/diagrams/SVGs into `projects/<name>/public/` and reference them from animation bullets via `[asset: filename.png]`. The per-bullet LLM emits `<Img src={staticFile('...')} />` directly — both bindings are wired into `DynamicBlock` (rule 04 bindings table).
- [../vg-rich-script-conversion/SKILL.md](../vg-rich-script-conversion/SKILL.md) — **MANDATORY first step when a raw script is given.** Read raw `projects/scripts/<name>.txt` → apply the 9-step conversion checklist → write canonical output to `projects/structured_scripts/<name>.txt`. Covers everything `script_converter.py` does NOT handle (frame timing, `### VO:`, sub-scenes, design-token preambles, bespoke metaphors). Includes the bespoke-visual handling guidance and the bullet density target. Canonical store is `projects/structured_scripts/` — never write conversion output anywhere else.
- [../vg-layout-quality-gate/SKILL.md](../vg-layout-quality-gate/SKILL.md) — Canvas-utilization minima, phase-timing idiom (`durationInFrames * 0.3/0.6/0.9`), spring-preset → intent map, proportional typography sizing, common LLM-emitted-code failure modes, and the pre-render checklist. Read when bullet visuals look small/empty, when elements clip, or before shipping a render.
- [../vg-script-gen-integration/SKILL.md](../vg-script-gen-integration/SKILL.md) — How `.claude/script_generation/` (the YouTube script-writer skill) feeds the pipeline via `storyboard/script_gen_to_raw.py`. Two-step bridge — generate, then convert — with no changes to the existing parser/build code.
- [../vg-youtube-validation/SKILL.md](../vg-youtube-validation/SKILL.md) — **Pointer to the YouTube technical gate** (which lives in rule 23 Layer 3, T1–T12) plus the consequence table for *why* each check matters (what YouTube does to non-compliant videos). Run the actual gate from rule 23 after rule 12 passes. FAIL = do not upload.
- [../vg-verification-protocol/SKILL.md](../vg-verification-protocol/SKILL.md) — **4-layer YouTube production quality gate.** Layer 1: V1–V8 visual inspection (canvas utilization, typography, muted-viewer walkthrough). Layer 1.5: animation filmstrip A1–A8 (5-frame filmstrip, freeze detection, PSNR motion check, REPLACE transition check). Layer 2: audio quality (WPM, AAC specs, narration coverage, 4 quality levers). Layer 3: YouTube T1–T12 technical gate. Run after every render before advancing to next scene.
- [../vg-video-duration/SKILL.md](../vg-video-duration/SKILL.md) — **How long is the final video.** Exact runtime from `projects/<name>/build_timing.json` (`total_sec`, `total_frames`, per-scene `durationFrames`) after a build; pre-build estimate from narration word count at ~160 WPM + `<pause Xs>` seconds (±10%, validated). Per-scene breakdown for length budgeting. Never quote the script's `(M:SS)` headers as final.

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
- `rules/display-captions.md` — burned-in captions are disabled for this
  pipeline; the final mp4 ships with a separate `.srt` sidecar for YouTube to
  serve as toggleable subtitles. Whisper word timestamps are still used, but
  only for `audio_anchor` → frame alignment, never for visual rendering.
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
   - Cache key = `sha256(narration + bullet_idx + headline + body + design_tokens + 'prompt-v14-per-bullet')[:16]`.
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

Expected: `PASS: N    FAIL: 0` for the first command; `43 passed` for the
second (40 audit + V12 text-only + A4 freeze regression tests). Any failure means a fix in rule 10 has regressed — read the matching
test for the exact assertion and `../vg-known-bugs/SKILL.md` for
the bug class behind it.

**Single-command run (both suites under pytest):**
```bash
python -m pytest storyboard/test_pipeline_fixes.py storyboard/test_audit_fixes.py
```
