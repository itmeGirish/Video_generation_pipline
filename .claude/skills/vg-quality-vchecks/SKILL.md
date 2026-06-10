---
name: vg-quality-vchecks
description: Production-quality gate for the V-CHECKS — the 13 visual bug classes (canvas fill, no overlap, readable text, primary prominence, no clipping, not text-only, not frozen, etc.). Scores 0-10 on how well a scene passes V1-V13 WITH MARGIN, not barely. Grounded in vg-verification-protocol + video-generation-conventions. Use after a scene renders (score from extracted frames) to confirm none of the known visual bug classes are present. One of the 8 visual-quality factors (see vg-visual-quality).
---

# Quality Factor 8 — V-checks (the 13 visual bug classes)

Source of truth: `vg-verification-protocol` (Layer 1) + `video-generation-conventions`
V-check table. These are the failures that have actually shipped — score how cleanly the
scene clears them FROM THE EXTRACTED FRAMES (a midpoint frame per bullet).

## The 13 checks (each must pass with margin)
| Check | Pass = |
|---|---|
| V1 not black | ≥40% non-bg pixels at the midpoint frame |
| V2 no bullet overlap | prior bullet gone before next; REPLACE = full AbsoluteFill |
| V3 tokens only | zero hex/font/px literals |
| V4 readable text | body ≥ w*0.009, headline ≥ w*0.022 |
| V5 canvas ≥60% | the main visual fills the majority of the frame |
| V7 no clipping | every element inside `[0..w] × [0..h]` |
| V8 animation visible | midpoint frame ≠ frame 0 |
| V9 no internal overlap | labels not under rects; hero text fits the gap |
| V10 text fits | single-line labels don't wrap |
| V11 timeline fits | all phases finish within `framesTo − framesFrom` |
| V12 not text-only | a non-text visual carries the point |
| V13 primary prominence | one element ≥50% canvas height dominates |
| A4/A5 not frozen | visible motion across the whole window |

## What production-grade looks like (10)
All 13 pass with **margin** — canvas comfortably ≥60%, primary clearly ≥50% height, text
well above the readable floor, zero overlap/clip, obvious motion at the midpoint, a real
visual (not text) carrying the point.

## Failure signals (low)
- Any check fails, OR several pass only *barely* (canvas ~42%, primary ~50%, text at the floor).
- A black/near-empty frame, a text-only frame, a frozen midpoint, a clipped/overlapping element.

## The fix
Send the failing check back to its owner: V5/V13 → enlarge the primary (≥50% height, fill
≥60%); V1/V12 → add a real visual; V8/A4 → add motion across the window; V2/V9 → AbsoluteFill
REPLACE + reflow; V7/V10 → fit/clip (see vg-quality-text-fit); V3 → tokens (vg-quality-tokens).

## 0–10 rubric
- **9–10:** all 13 pass with clear margin.
- **7–8:** all pass, but 1–2 only just clear the threshold.
- **5–6:** all technically pass but several are marginal (looks cramped/thin).
- **3–4:** one V-check fails outright.
- **0–2:** multiple V-checks fail (black/text-only/frozen/clipped).

**Gate:** any V-check FAIL = scene NOT READY (caps at ≤4); fix and re-render. Margin passes
target ≥8. Report which checks fail or only barely pass + the owner fix.
