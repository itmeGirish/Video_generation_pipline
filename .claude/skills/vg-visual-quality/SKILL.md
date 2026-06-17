---
name: vg-visual-quality
description: Aggregator that runs the 8 per-factor visual-quality skills (animations, timing, sequencing, transitions, text-fit, images, tokens, V-checks) on a rendered scene and combines them into a /100 production-quality score with pass/fail teeth. Runs in the per-scene verify loop AFTER frames are extracted — vg-verification-protocol answers "is it broken?"; this answers "is it production-grade?". Use after rendering a scene, when judging if visuals are Kurzgesagt/Fireship-level, or before advancing a scene. Not for audio sync (script-narration-visual-sync) or build errors.
---

# Visual Quality — aggregator (8 factors)

Runs in the per-scene render→verify loop, AFTER frames are extracted (rule 23 Layer 1).
`vg-verification-protocol`'s V-checks are pass/fail ("is it broken?"). This aggregates a
**0–100 production-quality score** by invoking the 8 per-factor skills below — each is its own
gate so every dimension gets first-class scrutiny.

**Score from the EXTRACTED FRAMES, not the code.** A scene can pass every V-check and still
be flat, robotic, or amateur. This is what catches that.

## The 8 factor skills — invoke each, take its /10
| # | Factor | Skill | Grounded in |
|---|---|---|---|
| 1 | Animation richness & meaning | **`vg-quality-animations`** | animations.md |
| 2 | Timing (easing & physics) | **`vg-quality-timing`** | timing.md |
| 3 | Sequencing (stagger & choreography) | **`vg-quality-sequencing`** | sequencing.md |
| 4 | Transitions (handoffs) | **`vg-quality-transitions`** | transitions.md |
| 5 | Text fit & overflow | **`vg-quality-text-fit`** | measuring-text.md |
| 6 | Images (cinematic assets) | **`vg-quality-images`** | images.md (N/A if none) |
| 7 | Design-token consistency | **`vg-quality-tokens`** | conventions |
| 8 | V-checks (13 bug classes) | **`vg-quality-vchecks`** | verification-protocol |

Invoke each skill, apply its rubric to the scene's frames, record its /10 (Images may be N/A).

## Aggregate scorecard
```
VISUAL QUALITY — <name>, Scene N
  1 Animations      /10
  2 Timing          /10
  3 Sequencing      /10
  4 Transitions     /10
  5 Text-fit        /10
  6 Images          /10  (or N/A)
  7 Tokens          /10
  8 V-checks        /10
  ──────────────────────
  TOTAL            /80   → normalize to %  (if Images N/A, out of 70)
```

| Score (%) | Meaning | Action |
|---|---|---|
| **90–100** | Elite (Kurzgesagt / Fireship) — the TARGET | ship |
| **86–89** | Strong, just under target | lift the lowest factor(s) to ≥9, re-render |
| **< 86 OR any factor < 7** | not at bar | **REVISE** the sub-7 / lowest factors, re-render, re-score |

**Teeth (each triggers NOT READY) — RAISED BAR (per user, 2026-06-14):**
- **Per-factor FLOOR = 7/10 (hard).** ANY factor scoring **< 7** = NOT READY — fix that beat and
  re-render. No "the total clears so a low factor is fine": a single **6 anywhere blocks the
  scene.** (This matches each `vg-quality-*` gate's own "< 7 → REVISE.")
- **Per-factor TARGET = 9/10.** 7 is only "not blocking"; **9 is "done".** After every factor is
  ≥7, keep lifting the lowest toward 9 — aim for **≥9 on every factor (≈90%+ overall)** before you
  write SCENE-PASS. 7 is the floor you must clear, 9 is the bar you ship at.
- **Any V-check FAIL** (factor 8) = NOT READY regardless of total.
- **Systemic:** the same factor low on ≥ half the scenes = a project-level design flaw — fix everywhere.

Report **the per-factor table + the single weakest factor + the one change that raises the
score most.** When a scene sits at 70–79, it's almost always factors **1–3** (motion that's
flat/linear/un-staggered) — that's the highest-leverage fix.

## Where it sits
- **vg-verification-protocol** = is it broken (V-checks pass/fail) → run first.
- **vg-visual-quality (this)** = is it production-grade (0–100 across the 8 factors) → run after.
- **script-narration-visual-sync** = the AUDIO/narration-sync quality scorecard (separate axis).
All three required before a scene is truly done.
