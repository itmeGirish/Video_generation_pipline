---
name: testing-engine
description: CROSS-CUTTING skill of the Visual Story Engine. Defines the validation tests and automated quality gates the pipeline runs — including the 12 content-quality tests (hook, unique angle, value, evidence, tension→resolution, "so what", freshness, human-not-AI, not-generic, not-over-polished, critique, viewer psychology), and the gate wiring that hard-blocks a bad artifact from advancing (SCRIPT-READY, GO, SHIP). Runs across the pipeline, defining what each validator/gate checks. Owns the test definitions + gate wiring, not the fact-check (knowledge-validator) or the per-stage validators' own logic.
when_to_use: Use to define/maintain the pipeline's validation tests and automated gates — especially the 12 content tests judging the script as a viewer would, and the hard-block wiring. Owns test + gate definitions.
model: opus
---

# testing-engine — validation tests + quality gates (CROSS-CUTTING)

A compiler is only trustworthy because of its checks. This cross-cutting skill defines the tests each gate
runs and wires the hard blocks that stop a bad artifact from advancing — so quality is mechanical, not hoped for.

## The 12 content-quality tests (judge the script AS A VIEWER)

Verdict must be STRONG or ACCEPTABLE; a WEAK/FAIL routes the fix to the owner and re-runs:
1. **Hook** — do the first 30s earn the watch?
2. **Unique angle** — a real point of view, not the generic take?
3. **Value** — does the viewer leave with something usable?
4. **Evidence** — every claim backed (via `knowledge-validator`), not asserted?
5. **Tension → resolution** — a real question held open and paid off?
6. **"So what"** — each scene answers why to care?
7. **Freshness** — something not heard ten times before?
8. **Human-not-AI** — reads like a person; no banned filler ("delve", "in the world of", "unlock the power"),
   no robotic cadence, no listy prose.
9. **Not generic / predictable** — another AI wouldn't generate it near-identically.
10. **Not over-polished** — has an edge, a personality, a risk.
11. **The critique pass** — attack it as a harsh viewer; route the found weakness to `feedback-optimizer`.
12. **Viewer psychology** — the cost/benefit is FELT (2–3 picture-able consequence beats), not stated.

## The automated gates it wires (hard blocks)

- **SCRIPT-READY** — the script may not enter render until the Phase-1 gates pass and the evidenced flag is
  written (sync ≥70, wonder ≥8, accuracy). `render_gate.sh` enforces it. The evidence includes the
  MECHANICAL floor: `contract_scorecard.py` (semantics/process coverage · text budget · stage ·
  series/trace) and `composite_lint.py` (zone disjointness · corridors) both exit 0 on the final contract —
  their printed `SCRIPT-SCORECARD:` / `composite_lint:` lines are recorded with the flag. A dimension a
  script can COUNT is never certified by prose judgment alone.
- **GO** — the composition may not render until `render-validator` passes (sync/continuity/audio + the muted
  proof per scene).
- **SHIP** — the video may not upload until `quality-assurance-engine` passes the full battery.
Each gate is EVIDENCED (a recorded line with the real numbers) — a bare pass is the hallucination the gate stops.

## The rule

Every quality claim is backed by a defined test with a bar; every advance past a gate is backed by evidence.
"Looks good" is not a test result. Tests route fixes to owners; they don't re-specify the owners.

## Boundary

You define tests + wire gates. You do not verify facts (`knowledge-validator`), run the per-stage validator
logic (those stages own it), or apply fixes (`feedback-optimizer`). You make quality mechanical.
