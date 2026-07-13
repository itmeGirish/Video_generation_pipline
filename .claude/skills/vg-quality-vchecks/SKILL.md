---
name: vg-quality-vchecks
description: Production-quality gate for the V-CHECKS — the 13 visual bug classes (canvas fill, no overlap, readable text, primary prominence, no clipping, not text-only, not frozen, etc.). Scores 0-10 on how well a scene passes V1-V13 WITH MARGIN, not barely. Grounded in vg-verification-protocol + video-generation-conventions. Use after a scene renders (score from extracted frames) to confirm none of the known visual bug classes are present. One of the 8 visual-quality factors (see vg-visual-quality).
model: opus
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
| V4 readable text | body ≥ w*0.009, headline ≥ w*0.022 **AND adequate CONTRAST** — see V4b |
| **V4b CONTRAST (ratio, vs the LOCAL surface, not just opacity)** | **every on-screen TEXT string + every meaningful data LINE/axis must clear ≥7:1 WCAG contrast vs the surface IT ACTUALLY SITS ON** (AA floor 4.5:1 — aim 7:1 for video). Three things conspire, check all: **(a) color value** — a mid-grey `#64748B` on dark is ~4:1 even un-dimmed (FAILS); **(b) opacity** — a legible color at `opacity:0.4–0.6` multiplies back down to ~4:1; **(c) the BACKGROUND it's on** — a secondary tuned for the darkest `D.bg` (e.g. `#94A3B8`≈7.4:1 there) loses contrast on any LIGHTER panel (`D.surface`/a card/a tinted box) and can drop below 7 there. So **identify each text element's real background fill and compute `(L_hi+0.05)/(L_lo+0.05)` against THAT** — not the page bg. Fix a failing panel by brightening the text for it OR darkening/hollowing the panel. (Real misses: captions + chart axis were `#64748B`/opacity-dimmed (a+b); and the contest's mono "soup" was `#94A3B8` on a `D.surface` panel → ~6.6:1 + smallest size → read dim (c) — the bg-only check passed it.) |
| V5 canvas ≥60% | the main visual fills the majority of the frame |
| V7 no clipping | every element inside `[0..w] × [0..h]` |
| V8 animation visible | midpoint frame ≠ frame 0 |
| V9 no internal overlap | labels not under rects; hero text fits the gap |
| V10 text fits | single-line labels don't wrap |
| V11 timeline fits | all phases finish within `framesTo − framesFrom` |
| V12 not text-only **(measurable — the PPT tell)** | a non-text visual carries the point. **COUNT the words on the busiest settled frame:** simultaneous on-screen text should ≈ ONE headline (≤~6 words) + labels/numbers. FAIL forms (each caps factor ≤5): a **table/record flattened to a run-on STRING** (data-as-prose, structure gone), a **paragraph/sentence block** read as the visual, a **"comparison" drawn as two TEXT panels** (the contest must be an EVENT — answers appearing, winner highlighting — not two blocks of prose), or a beat whose only motion is **text fading/typing in**. Ask: "if I removed all text, is there still a visual carrying the point?" If no → V12 FAIL. (Real miss: a 15-token pricing string in a bordered panel passed because it wasn't *full-screen* — but it's data-as-prose; owner fix `vg-visual-map` §Prohibited "Text as the visual".) |
| V13 primary prominence | one element ≥50% canvas height dominates |
| A4/A5 not frozen | visible motion across the whole window |

## TIER-AWARE scoring (V4b + V5 under the density system)

- **V4b applies to FOCAL text.** PERIPHERAL text (`vg-code-text` §TWO TIERS: context micro-labels /
  telemetry, dimmed via opacity on a legible ink, slotted, uniform micro-mono, never load-bearing) is a
  sanctioned texture class — do NOT fail it for sitting below the 7:1 floor. VERIFY instead that it
  qualifies as peripheral: at/above the V4 SIZE floor, slotted inside its container (not free-floating),
  and nothing the beat teaches lives only there. Load-bearing text found dimmed = a real V4b FAIL.
- **V5 fill is CONTAINER-footprint fill, not spread.** Score fill as the composite's containers + their
  internal density; generous void BETWEEN containers (islands-in-emptiness) is the designed pattern of
  dense-and-legible frames, not under-fill. A layout visibly STRETCHED to cover canvas (islands merged,
  margins eaten) is the failure, even when the percentage passes.

## What production-grade looks like (10)
All 13 pass with **margin** — canvas comfortably ≥60%, primary clearly ≥50% height, text
well above the readable floor, zero overlap/clip, obvious motion at the midpoint, a real
visual (not text) carrying the point.

## Failure signals (low)
- Any check fails, OR several pass only *barely* (canvas ~42%, primary ~50%, text at the floor).
- A black/near-empty frame, a text-only frame, a frozen midpoint, a clipped/overlapping element.
- **A MEANINGFUL label rendered near-invisible** (`D.text_dim` + low opacity on dark bg) — it's
  "present" so V4-by-size passes, but a viewer can't READ it → V4b FAIL. Squint at the actual frame:
  if a label you must read is barely visible, it fails, no matter that the text exists. (Real miss:
  the horizon-scale labels "a day / a week / a month" — the scene's THESIS
  axis — were `D.text_dim` @0.5 and verification wrongly passed them.)
- **A moving element with no nameable meaning** (a sweeping beam/bar added to beat the freeze gate) —
  reads as noise; the viewer asks "what is that?" Apply the purpose test to every moving thing.
- **A mis-registered connector** — see the settled-frame check below.

## ⛔ CONNECTOR REGISTRATION — every drawn link lands ON its target (judge at the SETTLED frame)

Any connector (line / beam / arrow / leader) names a relationship; on the settled frame (~p90, same frame
as V9) verify **each endpoint sits INSIDE the box of the element it names** — source end on the source
element, target end on the target row/cell/region. FAIL forms, each caps the factor ≤4:
- an endpoint in **void** (background, off the panel, past the card edge);
- an endpoint on the **wrong element** (a line meant for a data cell terminating on a heading);
- several connectors **converging on one point** that the narration says are different targets;
- a connector crossing **through** its target and continuing (drawn by angle+length, not point-to-point).
The viewer reads a connector as a claim — "THIS relates to THAT" — so a mis-registered line doesn't just
look sloppy, it *teaches the wrong fact*. Route: `vg-code-motion-bank` P11 (endpoints derive from the
connected elements' own layout variables; the pairing comes from the contract).

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

## ⛔ V9 OVERLAP MUST BE JUDGED AT THE SETTLED FRAME, NOT THE MIDPOINT (real miss)
Element-overlap (V9) almost never shows at the bullet MIDPOINT — at the midpoint, moving elements
haven't reached their final positions and late text is still near-zero opacity, so two things that
WILL collide still look clear. The collision appears only once everything **settles** (a runner stops
at its end x, a red tag fades to full opacity ON it). **So for V9/V9b you MUST inspect a LATE frame
(~p85–p95 of the bullet) where every element is at full opacity AND final position** — the midpoint
frame is a false "no-overlap." (Real miss: B2 "LOST THE THREAD" red text sat ON the violet sprinter
once it stalled at 0.34 + the text reached full opacity; the midpoint frame (sprinter mid-burst at
0.30, text ~0 opacity) showed no overlap, so it wrongly passed.)
- Extract BOTH `mid` and `p90` per bullet. Judge V1/V5/V8/V13 from `mid`; judge **V9/V9b/V7/V10
  (overlap, clipping, fit) from `p90`** (settled). A label that lands ON a figure/bar/another label at
  settled = FAIL.
- When placing any text label near a moving element, ask: where is that element at its FINAL position,
  and does the label's box (left..left+width × top..top+height) intersect it THERE? Put labels in the
  region the element vacates or never occupies (e.g. the inter-lane gap, well to the side).

### ✅ MANDATORY — run the PROGRAMMATIC overlap gate (general, every scene; don't eyeball it)
Eyeballing one midpoint frame misses overlaps. Run the bounds-based validator — it evaluates each
bullet's code at the SETTLED frame, computes every label/figure box, and reports text-on-element
collisions across the WHOLE scene.

> **The tool, its commands, flags, and ALL violation classes (`text_overlap`, `out_of_bounds`,
> `inner_absolute_positioning`, `cross_bullet_overlap`) are owned + documented in `vg-layout-quality-gate`
> §"Pre-render layout validator".** Run it from there — don't re-memorize the commands here (that's how the
> two copies drifted). This section owns only the V9 *scoring consequence*:

- **Any `text_overlap` violation = V9 FAIL** — caps factor 8 at ≤4 until fixed. Move the label clear (the
  validator prints which element it hit).
- Re-run it after every fix until it prints `text_overlap: 0`. This is the general fix — **never hand-hunt
  overlaps scene by scene.** (Built 2026-06-14 after repeated label-on-figure misses.)
