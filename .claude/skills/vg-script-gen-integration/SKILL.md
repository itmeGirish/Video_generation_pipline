---
name: vg-script-gen-integration
description: "How script_generation output feeds the video_generation pipeline. Routes the TWO output shapes: the overhauled canonical+briefs output (already parser-ready — its <!-- SCENE DESIGN/DESCRIPTION/GLOBAL VISUAL STYLE --> blocks now cross into the renderer MECHANICALLY via source_parser + visual_designer) vs the legacy ailabs-393 prose (needs script_gen_to_raw.py). Use whenever connecting scriptwriter output to the render pipeline, the script-gen→video-gen bridge, the director's-brief carry, script_gen_to_raw, or how scriptwriter feeds the pipeline."
model: opus
---

# Script Generation Integration

The `.claude/skills/script_generation/` skill is the **upstream** entrypoint for users who
want to start from a topic, not a hand-written script. There are now **two** output shapes,
and they route differently — detect which you have FIRST:

- **Overhauled `script_generation` (current, default).** Emits the **canonical format
  directly** — `## SCENE N — "Title" (M:SS – M:SS)` headers + pair-block bullets
  (`what happens` / `text` / `image` / `audio_anchor`) — **plus the rich director's brief**
  in `<!-- GLOBAL VISUAL STYLE -->`, `<!-- SCENE DESCRIPTION -->`, and `<!-- SCENE DESIGN -->`
  comment blocks, and an evidenced `<!-- SCRIPT-READY: ... -->` line. **This needs NO prose
  bridge** — it is already what `source_parser.py` reads. Copy it to
  `projects/structured_scripts/<name>.txt`, scaffold the project, verify, build.
- **Legacy prose (ailabs-393 script-writer).** YouTube-prose with bracketed sections
  (`[HOOK - 0:00-0:10]`, `[INTRO]`, `[MAIN CONTENT]`, `[Visual cue: ...]`). This does NOT
  match the parser → it needs the `script_gen_to_raw.py` bridge below.

## The director's brief now crosses the bridge MECHANICALLY (fixed 2026-06)

For the overhauled output, the comment blocks are **not decoration** — `source_parser.py`
extracts them into `Scene.description`, `Scene.design`, and `Scene.global_style` (the global
style is denormalized onto every scene), and `visual_designer.py` feeds them into the
per-bullet codegen prompt **and the cache key** (`_scene_brief_block` + the v15 key). Two
consequences:

- **Do NOT strip the comment blocks when copying the script in** — they are the camera /
  layout / through-line / world the renderer builds TO. Before the fix the parser dropped
  every comment and the renderer re-invented the visual (generic output); the brief reached
  the code only if the in-session author remembered to read it. Now it is DATA.
- **Editing a brief re-seeds that scene's bullets** (the brief is in the cache key) — the
  `.txt` is the single source of truth for the look; never re-brief the renderer separately.

The contract for what the brief must contain is owned upstream by `scene-planner`
("THE SCENE CONTRACT → Phase 2") and `scene-composer`.

This rule documents the legacy prose **bridge** (below) for the ailabs-393 shape, which still
needs `script_gen_to_raw.py`.

## When to use this flow

Use it when:
- The user wants to start from a topic ("video about X") rather than a script
- The user invokes the script_generation skill and wants the output to feed
  the pipeline
- You're onboarding a new project and have no `projects/scripts/<name>.txt`
  yet

Do **not** use it when:
- The user already has a structured script — go straight to rule 14 (auto
  converter) or rule 18 (rich-script hand conversion)
- The user just wants to write a script by hand — rule 16 has the
  copy-paste prompt

## Input-format routing (when the user pastes "a script")

Before running any tool, detect what format the user gave you and route:

| Input shape | Route |
|---|---|
| **YouTube prose** — contains `[HOOK ...]`, `[INTRO ...]`, `[MAIN CONTENT ...]`, `[Section N: ... - M:SS-M:SS]`, `[Visual cue: ...]`, or `[CALL TO ACTION ...]` markers (script_generation skill output shape) | **Phase 2 + 3.** Run `script_gen_to_raw.py` to bridge → run `verify_structured_script.py`. STOP before Phase 4. |
| **Canonical + briefs (overhauled script_generation — the DEFAULT today)** — `## SCENE N — "Title" (M:SS – M:SS)` headers + pair-block bullets, PLUS `<!-- GLOBAL VISUAL STYLE -->` / `<!-- SCENE DESCRIPTION -->` / `<!-- SCENE DESIGN -->` blocks + an evidenced `<!-- SCRIPT-READY: ... -->` line | **Skip Phase 2 (no prose bridge).** Copy directly to `projects/structured_scripts/<name>.txt` **with the comment blocks INTACT** — `source_parser.py` now reads them into `Scene.description/design/global_style` and the renderer builds to them (don't strip them). Scaffold the project, run `verify_structured_script.py`. STOP before Phase 4. |
| **Already canonical (legacy, no briefs)** — `## SCENE N — "Title" (M:SS – M:SS)` + `### Narration` + `### Animation` bullets, no comment blocks | **Skip Phase 2.** Copy to `projects/scripts/<name>.txt`, scaffold the project, run `verify_structured_script.py`. The brief fields parse as empty (behavior-preserving — codegen runs as before). STOP before Phase 4. |
| **Topic only** — no scenes, no visual cues (e.g. "make a video about GPT-6") | **Cannot fully automate Phase 1.** The script_generation skill is interactive and stores prefs in `~/.claude/script_writer.json`; another Claude session can't run that interactive flow on the user's behalf. Two options: (a) ask user to invoke `/script_generation` in their session and paste the output back, OR (b) ask for the missing inputs (audience, tone, length, hook style, channel niche) and write a parser-ready script directly per rule 16, skipping the prose-to-raw bridge. |
| **Rich script** — frame-based timing (`Frame 0–60`), `### VO:` / `### ANIMATION:` markers, sub-scenes, design-token preamble | **Skip Phase 2 (script_gen_to_raw.py won't handle this).** Apply rule 18 hand-conversion checklist instead. Then `verify_structured_script.py`. STOP before Phase 4. |

## Two things ALWAYS needed from the user

1. **Project name** (file stem). Used in every path: `projects/scripts/<name>.txt`, `projects/<name>/config.yaml`, etc. Must match `^[a-z0-9_-]+$` (lowercase, no spaces).
2. **Explicit greenlight before Phase 4** (`build_video.py`). Phase 4 spends:
   - API tokens for per-bullet Claude codegen (~$0.05-0.30 typical for 30-50 bullets)
   - ~30-90s on TTS + Whisper (network + model load)
   - Several minutes on Remotion render (~30s per scene at 1080p)
   Don't run build_video.py without confirmation. The user can pre-authorize the entire flow by saying "auto build" or similar.

## Iteration loop (ALWAYS — Phase 3 can take multiple passes)

After every edit to `projects/scripts/<name>.txt` OR `projects/<name>/config.yaml`:

```bash
python storyboard/verify_structured_script.py projects/scripts/<name>.txt
```

Iterate until exit code 0. Don't proceed to Phase 4 with WARN-state output —
the warnings predict the actual desync / coverage problems that surface 90s
into Step 7.

## End-to-end flow

```
User: "video about productivity apps"
   │
   ▼
[1] .claude/skills/script_generation/ skill (script-writer)
   │  - collects preferences (audience, tone, length) on first use
   │  - generates YouTube prose with [HOOK]/[INTRO]/[MAIN]/[CTA] sections
   │  - saves to e.g. /tmp/script_gen_output.txt
   │
   ▼
[2] storyboard/script_gen_to_raw.py
   │  python storyboard/script_gen_to_raw.py \
   │      /tmp/script_gen_output.txt productivity_apps
   │  → writes projects/scripts/productivity_apps.txt (raw)
   │  → emits a placeholder DESIGN TOKENS block + TODO markers for
   │    sparse animation bullets
   │
   ▼
[3] User edits projects/scripts/productivity_apps.txt:
   │  - fill in DESIGN TOKENS palette (hex values per project brand)
   │  - densify ### Animation bullets (target: 5–8 per ~60s scene, rule 15)
   │  - add audio_anchor-friendly phrasing (rule 08)
   │
   ▼
[4] python storyboard/build_video.py projects/scripts/productivity_apps.txt
   │  - Step 0.5 (rule 14) script_converter normalizes any drift
   │  - Step 1 source_parser reads canonical format
   │  - Step 2 per-bullet codegen
   │  - ... (existing pipeline, unchanged)
   │  - Final mp4 in projects/productivity_apps/out/
```

## What `script_gen_to_raw.py` does and does NOT do

**Does:**
- Map each top-level `[HOOK]` / `[INTRO]` / `[CONCLUSION]` / `[CALL TO ACTION]`
  bracket → one SCENE
- Map each `[Section N: ... - M:SS-M:SS]` inside `[MAIN CONTENT]` → one SCENE
- Strip narration prose out of quotes → `### Narration` block
- Convert `[Visual cue: ...]` notes → `### Animation` bullets (time windows
  spread evenly across the section)
- Emit a placeholder `<!-- ## DESIGN TOKENS -->` block at the top with a
  clear TODO marker
- Emit `<!-- TODO: add more animation bullets -->` markers when a scene has
  fewer than the minimum bullet count (default 3)

**Does NOT:**
- Invent narration content (only reformats what the script-writer wrote)
- Auto-pick a design palette (placeholder must be filled before build)
- Densify animation bullets beyond what `[Visual cue: ...]` notes provide
  (sparse cues → TODO marker → user adds more by hand or via rule 18)
- Modify `build_video.py`, `source_parser.py`, or any rule's parser logic

## Why this design (no pipeline changes)

The script_generation skill emits a format we don't control. Forcing our
parser to handle a second input format would couple the parser to a third-
party skill's output and break our fidelity contract (rule 04). The bridge
keeps the responsibility clean:

- `script_gen_to_raw.py` knows the script_generation output shape
- `script_converter.py` (rule 14) knows our raw → canonical format
- `source_parser.py` knows the canonical format

If the script_generation skill's output format changes upstream, only
`script_gen_to_raw.py` needs an update — none of the other pipeline code is
affected.

## Architectural caveat: anchor coupling (read this before relying on the bridge)

The script_generation skill produces **free-form narrative prose** with sparse
`[Visual cue: ...]` notes. Our pipeline's per-bullet codegen (rule 04) needs
**dense bullet bodies** that the visual_designer LLM then reads to pick an
`audio_anchor` — a verbatim 2-4 word phrase from the scene's narration that
locks the visual to the spoken word (rule 08).

The two-layer mismatch:

| script_generation output | Our pipeline needs |
|---|---|
| 1-3 visual cues per section (sparse) | 5-8 bullets per ~60s scene (dense) |
| Cues are author intent ("Show simple Notion setup") | Bullets need bodies that share distinctive content words with narration so the LLM can extract a strong anchor |
| Narration is generic prose | Narration with distinctive nouns/numbers gives the LLM rich anchor candidates |

If you run the converter without densification AND skip the pre-flight check,
you may get a structured script where:
- Scenes have 1-2 bullets each
- Bullets reference cue text that doesn't appear in narration
- The visual_designer LLM picks weak anchors → Step 7 reports <70% coverage
  → visuals desync from narration in the final mp4

**This is a real risk, not a hypothetical.** The two skills (script_generation
+ video_generation) overlap on the script-to-video boundary but have different
density assumptions. The bridge below mitigates it; the pre-flight check
catches what the bridge can't.

## Verification (MANDATORY — run before build_video.py)

```bash
# Step 1: pre-flight check on the converted raw script (<1s)
python storyboard/verify_structured_script.py projects/scripts/<name>.txt
```

The pre-flight tool reports:

1. **Parser errors** (hard fail — fix before building)
2. **Bullet density per scene** (warns if any scene has fewer bullets than the rule 15 target)
3. **Narration richness** (unique content words per bullet — proxy for anchor candidate diversity)
4. **Anchor candidates per bullet** (does each bullet body share distinctive words with the scene's narration? If not, the LLM picks weak anchors)
5. **Word count vs scene duration** (flags wpm outside the 130-200 range — too sparse means audio ends early; too dense means TTS overflows the scene window)
6. **Bullet time windows fit inside scene window** (hard fail if not)
7. **Design tokens / TODO markers leftover** (must be cleared before render)

Exit codes: `0` clean · `1` warnings · `2` hard errors.

**Recommended workflow:**

```bash
# 1. Generate via script_generation skill — paste output to a file, e.g.
#    /tmp/draft.txt or anywhere convenient

# 2. Convert. Densification is ON by default. Project dir + stub config.yaml
#    are scaffolded automatically (use --no-init-project to opt out).
python storyboard/script_gen_to_raw.py /tmp/draft.txt my_project
# → writes projects/scripts/my_project.txt
# → writes projects/my_project/config.yaml (stub with PLACEHOLDER hex values)
# → writes projects/my_project/public/  (empty asset folder)

# 3. Edit projects/my_project/config.yaml — replace PLACEHOLDER hex values
#    with the colors from the script's <!-- ## DESIGN TOKENS --> block

# 4. Edit projects/scripts/my_project.txt — refine bullets/narration,
#    remove any <!-- TODO --> markers

# 5. Pre-flight check — fix everything it warns about
python storyboard/verify_structured_script.py projects/scripts/my_project.txt

# 6. Iterate steps 4-5 until pre-flight is clean (exit 0)

# 7. Build:
python storyboard/build_video.py projects/scripts/my_project.txt
```

**Key behaviour notes (read before relying on the bridge):**

- **Densification is ON by default.** Without it, sparse `[Visual cue: ...]`
  notes (typical of script_generation output) give the per-bullet LLM (rule 04)
  too few anchor candidates → Step 7 anchor coverage <70% → visuals desync.
  Use `--no-densify` only if you intend to write all ### Animation bullets by hand.
- **Bullet ordering preserves narration order.** Densified bullets are
  interleaved with `[Visual cue: ...]` cues at the position where they appear
  in the source narration. This is what keeps audio_anchors landing at the
  correct spoken-word timestamp (rule 08). An earlier version appended
  sentence-bullets after cue-bullets and broke this — fixed.
- **Project scaffolding is ON by default.** `projects/<name>/config.yaml`
  with placeholder values + `projects/<name>/public/` are created so the
  very first `build_video.py` run doesn't error out. You MUST replace the
  `PLACEHOLDER` hex values before running build, or every video looks identical.

If parsing fails at step 1, the most likely causes:
1. The script_generation output had an unusual bracket format
   (e.g. `[HOOK 0:00-0:10]` without the `-` separator) — extend the regex
   in `script_gen_to_raw.py` `TOP_BRACKET_RE`
2. You forgot to fill in the DESIGN TOKENS placeholder before parsing

## REVIEW REQUIRED checklist (before every build)

- [ ] Pre-flight (`verify_structured_script.py`) returns exit 0
- [ ] DESIGN TOKENS block has real hex values (no `PLACEHOLDER` strings)
- [ ] Every scene has ≥3 bullets (or the rule 15 scaled minimum for its duration)
- [ ] Every bullet body shares ≥1 distinctive ≥4-letter word with its scene's narration
- [ ] No `<!-- TODO: ... -->` markers remain
- [ ] Each scene's narration word count is within 130-200 wpm of its time window
- [ ] All `[asset: ...]` references exist in `projects/<name>/public/`

## Anti-patterns

- Do **NOT** edit the script_generation skill's output in place — it's a
  generation artifact. Re-generate or run the converter again.
- Do **NOT** call `script_gen_to_raw.py` on a hand-written script — that's
  what rule 14 and rule 18 are for. The wrong tool will mangle headers.
- Do **NOT** skip Step 3 (filling in DESIGN TOKENS + densifying bullets).
  The placeholder palette is generic; without project-specific values the
  rendered video will look like every other generic explainer.
