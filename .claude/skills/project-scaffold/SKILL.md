---
name: project-scaffold
description: INFRA / STEP 0 — scaffold a NEW project before any pipeline work. Creates projects/<name>/ (config.yaml stub · scenes/ · captions/ · audio/ · out/) and pre-fills verification.md with the per-project TRACKING record — the Skill Invocation Tracker (the full Phase-1 32-stage + Phase-2 skill checklist, ticked as each is invoked) and the Bug Ledger — the single source of truth read by skill_coverage.py, bug_stats.py, and render_gate.sh. Run FIRST for any new video, before script_generation. Owns project bootstrap + the tracking scaffold, not the pipeline stages themselves.
when_to_use: Use at the very start of a NEW project/video, before invoking script_generation. Owns "set up the project folder + its skill-invocation + bug tracking record".
model: opus
---

# project-scaffold — STEP 0: bootstrap the project + its tracking record

Every project starts here. This is the INFRA skill: it lays down the standard folder structure and — the
load-bearing part — pre-creates the per-project TRACKING record so coverage/bug tracking is "tick as you
go" from the start, never "remember to author it later" (the reason trackers ended up empty before).

## What it creates

```
python -m storyboard.project_init <name>
```
Scaffolds `projects/<name>/`:
- `config.yaml` (stub — design tokens · voice · `stitch.mode: remotion_master`; FILL before seeding,
  because `design_tokens` are in the bullet cache key)
- `scenes/` · `captions/` · `audio/` · `out/` (the pipeline's output folders)
- **`verification.md`** — pre-filled with the tracking record (see below). Idempotent: never overwrites an
  existing one.

## The tracking record (inside `verification.md` — ONE file, no drift)

Two scaffolded sections + the per-scene area, all read by the existing tools:

- **## Skill Invocation Tracker** — the full pipeline checklist as `[ ]` items: PHASE 1 (S1–S7 + Design
  1–8 + Compile 9–22 + Compose/Contract 23–25) and PHASE 2 (Author + Verify). **Tick `[x]` as each skill
  is INVOKED** (a real Skill-tool call — "read from memory" is NOT invoked). This is the human-facing
  manifest; `skill_coverage.py` mechanically verifies the mandatory floor against the per-scene
  `### Skills invoked` blocks.
- **## Bug Ledger** — the table header (`attempt · bug · type · pillar · sev · owner skill · fix · min ·
  resolved`). One row per bug FIXED. `type`→quality-triangle pillar is in the scaffold. Feeds
  `bug_stats.py`.
- **## Per-scene records** — append one block per scene (its `VISUAL-PROOF` marker + `### Skills invoked`
  + observations) as you build it (template: `vg-verification-protocol` §The verification.md artifact).

> **Why one file, not a separate `skill.md` + `bug.md`:** `skill_coverage.py`, `bug_stats.py`, and
> `render_gate.sh` all already read `verification.md`. A second file = a second source of truth = drift
> (the failure this whole pipeline is built to prevent). The tracker and bug log are SECTIONS of the one
> record the tools consume.

## The workflow this enables

1. **`project-scaffold`** (here) → folder + tracking record exist, checklist unticked.
2. **`script_generation`** (Phase 1) → tick each stage as invoked; the SCRIPT-READY gate + mechanical
   floor run against the contract. When done: `python -m storyboard.time_log <name> log script-generation
   <seconds>`.
3. **`video_generation`** (Phase 2) → author + verify per scene; append each scene's `VISUAL-PROOF` +
   `### Skills invoked` block; log fixes in the Bug Ledger. The render's wall-clock auto-logs
   (`production_time.json` → `time_log`). Time the verification battery with
   `python -m storyboard.time_log <name> wrap verification -- <cmd>`.
4. **At MASTER-PASS** → `python -m storyboard.skill_coverage <name>` proves no MANDATORY skill was MISSED;
   `python -m storyboard.bug_stats --save` derives the effort/effectiveness store;
   `python -m storyboard.time_log <name> report` shows the per-phase wall-clock cost (script-generation ·
   video-generation · verification) + the real-time-to-produce ratio, in `time_log.md`.

## Boundary

You bootstrap the project + its tracking scaffold. You do NOT write the contract (`script_generation`),
render (`video_generation`), or verify coverage (`skill_coverage.py`) — you create the record those
consume. Run once per new project, first.
