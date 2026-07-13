---
name: vg-visual-quality
description: Aggregator that runs the 8 per-factor visual-quality skills (animations, timing, sequencing, transitions, text-fit, images, tokens, V-checks) on a rendered scene and combines them into a /100 production-quality score with pass/fail teeth. Runs in the per-scene verify loop AFTER frames are extracted — vg-verification-protocol answers "is it broken?"; this answers "is it production-grade?". Use after rendering a scene, when judging if visuals are Kurzgesagt/Fireship-level, or before advancing a scene. Not for audio sync (render-validator) or build errors.
model: opus
---

# Visual Quality — aggregator (8 factors)

Runs in the per-scene render→verify loop, AFTER frames are extracted (rule 23 Layer 1).
`vg-verification-protocol`'s V-checks are pass/fail ("is it broken?"). This aggregates a
**0–100 production-quality score** by invoking the 8 per-factor skills below — each is its own
gate so every dimension gets first-class scrutiny.

**Score from the EXTRACTED FRAMES, not the code.** A scene can pass every V-check and still
be flat, robotic, or amateur. This is what catches that.

> ⛔ **The MOTION factors (1 Animations · 2 Timing · 3 Sequencing · 4 Transitions) are scored from a
> FILMSTRIP, not one frame.** Easing, anticipation, overshoot, follow-through, and stagger are
> *temporal* — a single still looks identical whether the motion was linear-and-dead or eased-and-alive.
> Extract a **5-frame strip per bullet at p10/p30/p50/p70/p90** (`vg-verification-protocol` Layer 1.5
> already pulls these) and read motion ACROSS the strip: does the value ACCELERATE then settle (eased)
> or move equal distance each frame (linear→robotic)? is there a wind-up/overshoot at the ends? do
> supporting elements LAG the hero? do multi-element reveals arrive STAGGERED? Factors 5–8 (text-fit,
> images, tokens, V-checks) are spatial → score from the settled (p90) still. **If you scored a motion
> factor from one frame, you scored layout, not motion — pull the strip.**

## ⭐ PRE-RENDER VISUAL PROOF — prove it on cheap pixels BEFORE the ~260s render

This same owner runs **once more, EARLIER and CHEAPER** — on a 5-keyframe filmstrip rendered without
TTS/Whisper/full-render — so a flat scene is caught in *seconds*, not after the full render + audio + verify
loop. The pipeline becomes **Think → Prove → Render** (paper proof = gates 10/11; cheap-pixel proof = here;
expensive-pixel proof = the 8 factors below). It is **a gate, not a new skill** — it reuses existing owners.

**Generate the evidence** (after codegen + seed, before `render_scenes.mjs`):
```
python storyboard/preview_bullet.py projects/structured_scripts/<name>.txt --scene N --visual-proof
```
This renders the 5 keyframes/bullet (p10/30/50/70/90), decides the two **mechanical** proofs, and writes a
stitched **FILMSTRIP** image + `visual_proof.json`.

**The three proofs** (mechanical = Python decides; judgment = you read the filmstrip, routed to the owner):

| Proof | What it checks | Decided by |
|---|---|---|
| **Composition** | hero obvious in ~1s · hierarchy · balance · spacing · **no overlap** · caption zone · **canvas utilization** | canvas coverage = *mechanical*; hero/hierarchy = *you* (→ this skill's factors 5–8 + `layout_validator`) |
| **Narrative** | muted: does attention TRAVEL · a viewer UNDERSTAND · through-line / continuity hold | *you* read the filmstrip (→ `render-validator` muted test + the **DDI** attention path) |
| **Transformation** | did the hero's STATE actually change A→B across the 5 frames — or are they ~identical (FLAT)? | *mechanical* (frame-delta Δ ≥ bar) + the **DDI** transformation intent |

**What this CANNOT prove (do not try):** motion QUALITY — easing, stagger, freeze, choreography — is
*temporal*; static keyframes can't show it. That stays in the post-render 8 factors below. The Visual Proof
catches the big, cheap class (flat layout · no hero · **nothing transforms** · overlap · caption-zone); it
does not replace the motion check.

**PASS → record the marker** (this is what `render_gate.sh` requires before the full render):
```
VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%
```
**FAIL any proof → fix the bullet CODE / the DDI now, re-seed, re-prove.** Never full-render a scene that
fails its Visual Proof — that is the whole point of the gate.

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
  record MASTER-PASS. 7 is the floor you must clear, 9 is the bar you ship at.
- **Any V-check FAIL** (factor 8) = NOT READY regardless of total.
- **Systemic:** the same factor low on ≥ half the scenes = a project-level design flaw — fix everywhere.

Report **the per-factor table + the single weakest factor + the one change that raises the
score most.** When a scene sits at 70–79, it's almost always factors **1–3** (motion that's
flat/linear/un-staggered) — that's the highest-leverage fix.

## Where it sits
- **vg-verification-protocol** = is it broken (V-checks pass/fail) → run first.
- **vg-visual-quality (this)** = is it production-grade VISUALLY (0–100 across the 8 factors) → run after.
- **vg-quality-audio** = is the AUDIO production-grade (voice expressiveness · loudness −14 LUFS · music
  bed + ducking · sfx-on-reveals · silence) — the parallel audio scorecard, the half of perceived quality
  the 8 visual factors don't touch. Run it too.
- **render-validator** = the narration↔visual-sync quality scorecard (separate axis).
All required before a scene is truly done.

## Effort note (write it in the ledger) — make the cost visible
When you record MASTER-PASS, also record **how many re-prove→re-render passes the scene took + the
factor that caused each redo** (e.g. `passes: 4 — 2× text-fit, 1× animations, 1× tokens`). This is the
*first-pass-yield / rework-reason* signal: a scene that took 6 passes, all on the same factor, is a
**definition problem upstream** (the brief/recipe was unclear), not just a render bug — fix it at the
source (`scene-composer` / the owning `vg-code-*`). Surfacing where effort went is what stops the
process mass from silently crowding out the creative time. (Ledger lives in `vg-verification-protocol`.)
