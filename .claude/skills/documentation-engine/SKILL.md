---
name: documentation-engine
description: CROSS-CUTTING skill of the Visual Story Engine. Generates and maintains the technical documentation + architecture docs — keeps the pipeline docs, the stage/skill index, and the per-project records accurate as the pipeline evolves, so the docs never drift from the code + skills. Runs whenever a stage, skill, or contract changes. Owns documentation freshness, not the pipeline logic itself.
when_to_use: Use whenever a skill/stage/contract changes, to update the architecture docs + skill index so documentation stays true to the pipeline. Owns doc freshness.
model: opus
---

# documentation-engine — technical + architecture docs (CROSS-CUTTING)

Docs that drift from reality are worse than none — they mislead. This cross-cutting skill keeps the pipeline's
documentation true to the actual stages, skills, and contracts as they change.

## What it maintains

- **The architecture doc** — the full pipeline walkthrough (the 32 core stages + 10 cross-cutting skills, in
  order, with each stage's input→output typed artifact). Kept in sync with the actual skill set.
- **The stage/skill index** — the orchestrator's stage list, the CLAUDE.md flow, and the hook checklist all
  reflecting the same current pipeline (no stale step numbers or removed skills).
- **The typed-artifact contracts** — what each stage consumes and emits, so a change to one stage's output is
  reflected in the next stage's expected input.
- **Per-project records** — the verification/effort ledgers that track what was built and how.

## When it runs (cross-cutting)

Whenever a stage is added/removed/renamed, a contract's shape changes, or the flow reorders — update the docs
in the SAME pass, so the architecture doc, CLAUDE.md, the orchestrator, and the hook never disagree. A
skill-set change with stale docs is an incomplete change.

## The rule

The docs are an INDEX of the real pipeline, never a second source of truth to apply from memory. Keep them
minimal and accurate: one line per stage/skill pointing to the skill body (which is the real source). If a
doc and a skill disagree, the skill wins and the doc is fixed.

## Boundary

You keep documentation accurate. You do not change pipeline logic (the stages do) or review code
(`code-review-engine`). You ensure anyone reading the docs sees the pipeline as it actually is.
