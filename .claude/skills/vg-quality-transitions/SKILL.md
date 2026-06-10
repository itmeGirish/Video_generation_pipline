---
name: vg-quality-transitions
description: Production-quality gate for TRANSITIONS — the handoffs between beats and scenes. Scores 0-10 on clean REPLACE backdrops (full AbsoluteFill, no leak), deliberate scene boundaries (crossfade or match-cut, no double-dark), and smooth within-bullet handoffs. Grounded in remotion transitions.md + vg-scene-transitions. Use after a scene renders, when a prior bullet bleeds through, a cut feels abrupt, or two fades stack into a dark flash. One of the 8 visual-quality factors (see vg-visual-quality).
---

# Quality Factor 4 — Transitions (handoffs)

Source of truth: `remotion/rules/transitions.md` + `vg-scene-transitions`. The cut between
beats/scenes is where attention leaks and where leaks/flashes show — handoffs must be clean
and deliberate.

## What production-grade looks like (10)
- **REPLACE = full `AbsoluteFill` backdrop** (D.bg), fading/covering all prior content — no
  prior bullet bleeding through.
- **Scene boundaries are deliberate:** a ~12-frame crossfade OR a match-cut on a shared
  element (a shape/number/color persists across the cut) — chosen on purpose, not random.
- **No double-dark:** a scene-boundary crossfade is NOT stacked with a bullet-1 backdrop
  fade-from-black (that overlaps into a dark flash). One or the other.
- **Within-bullet handoffs** (element settles as the new one enters) are smooth, not jarring.

## Failure signals (low)
- `position:absolute` div backdrop (not `AbsoluteFill`) → prior bullet leaks through.
- Hard reset to a brand-new world with no bridge (attention drops).
- Stacked fades → a black/dark flash at the boundary (double-dark).
- A `[REPLACE]` with no backdrop line at all.
- Elements pop out with no exit/handoff while the next pops in (visual whiplash).

## The fix
Make every REPLACE backdrop a full `AbsoluteFill` D.bg; pick ONE boundary technique
(crossfade ~12f or a match-cut on a carried element) and remove the competing fade; give held
elements a settle/exit so the handoff reads continuous.

## 0–10 rubric
- **9–10:** clean AbsoluteFill REPLACEs, deliberate boundaries, no leak/flash, smooth handoffs.
- **7–8:** mostly clean; one slightly abrupt cut or a minor handoff.
- **5–6:** boundaries work but feel arbitrary; a faint leak or flat reset.
- **3–4:** a visible bleed-through OR a double-dark flash.
- **0–2:** prior bullet clearly visible under the next; jarring resets throughout.

**Gate:** < 7 → REVISE. Any bullet bleed-through or double-dark flash caps the scene at ≤4.
Report the boundary + the exact handoff fix.
