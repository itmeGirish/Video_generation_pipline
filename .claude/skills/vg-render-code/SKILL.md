---
name: vg-render-code
description: Index of the 8 AUTHOR-TIME code recipes for writing production-grade per-bullet render code UP FRONT (animations, timing, sequencing, transitions, text, images, tokens, V-checks). Use BEFORE writing a bullet's React.createElement code, so the video is great by design — not fixed after render. Pairs 1:1 with the verify scorecard vg-visual-quality. Grounded in the remotion rules + video-generation-conventions.
---

# Author-time render-code recipes (write it right the first time)

Read these WHILE writing each bullet's code so it's production-grade by construction. The
research is clear: rubric-guided **code generation** is where quality is actually built —
verification is only the safety net. These are the code recipes; `vg-visual-quality` (+ its 8
`vg-quality-*` gates) is the after-render check of the SAME 8 factors.

## The 8 recipes (read, then write the code)
| # | Factor | Author recipe | Verify gate |
|---|---|---|---|
| 1 | rich, meaningful motion | **`vg-code-animations`** | `vg-quality-animations` |
| 2 | easing & physics | **`vg-code-timing`** | `vg-quality-timing` |
| 3 | stagger & choreography | **`vg-code-sequencing`** | `vg-quality-sequencing` |
| 4 | clean handoffs | **`vg-code-transitions`** | `vg-quality-transitions` |
| 5 | text that fits | **`vg-code-text`** | `vg-quality-text-fit` |
| 6 | cinematic images | **`vg-code-images`** (if the bullet has an image) | `vg-quality-images` |
| 7 | tokens only, zero literals | **`vg-code-tokens`** | `vg-quality-tokens` |
| 8 | pass V-checks by construction | **`vg-code-vchecks`** | `vg-quality-vchecks` |
| + | trim animation/clip (only if needed) | **`vg-code-trimming`** | — |
| ★ | **motion-design bank** (scaffold→fill→payoff, value-growth, staggered, recolor, comparison, formula-fill, linked-highlight) — topic-agnostic | **`vg-code-motion-bank`** | `vg-quality-animations` |
| ★ | **composition** (persistent title+subtitle, dashboard, reference card, sub-beats, carryover/dock) — topic-agnostic | **`vg-code-composition`** | `vg-quality-vchecks` |
| ★ | **artifacts** (draw the REAL mechanism: cell grid / tier bars / pipeline / slider / node rail / KPI) — topic-agnostic | **`vg-code-artifacts`** | `vg-quality-vchecks` |

## Golden authoring order (per bullet)
0. **Read the scene's DIRECTOR'S BRIEF first** — produced by `script-scene-design`: the once-per-video
   `<!-- GLOBAL VISUAL STYLE -->` + per-scene `<!-- SCENE DESCRIPTION -->` (prose) + `<!-- SCENE DESIGN -->`
   (fields) blocks (see `vg-visual-designer` step 0). The code must REALIZE the brief, not just the bullet.
   Map EVERY field → a recipe:
   - **GLOBAL VISUAL STYLE** (art direction, whole video) → `vg-code-tokens` (the palette hex + fonts) +
     `vg-code-composition` (one render style / shape language held across ALL scenes — this is what makes
     8 scenes feel like one video). Obey it everywhere; never let a scene drift to a different aesthetic.
   - **REFERENCE / `image: [asset:]`** → `vg-code-images`: load the real screenshot, PRESERVE its layout,
     animate only the changes (never redraw/invent UI; missing file → accurate vector from real details).
   - **CINEMATIC: Camera** → `vg-code-animations`/`vg-code-timing`: push-in = scale the focal group up;
     pull-back = scale down to reveal scale; parallax = layers at different speeds.
   - **CINEMATIC: Depth** → `vg-code-composition`: fg/mg/bg layers; blur/dim the non-focal plane.
   - **CINEMATIC: Light+Mood** → glow on the hero, a vignette, a GRADIENT backdrop (never a flat fill).
   - **CINEMATIC: Color** → `vg-code-tokens`: one hero accent token; desaturate the context.
   - **LAYOUT** (spatial map) → `vg-code-composition`/`vg-code-vchecks`: place each element to the map
     (zones / grid), at the stated size — don't float or re-center.
   - **SHOT / FRAMING** → `vg-code-animations`: the focal scale — a CLOSE beat fills the frame with the
     hero; a WIDE beat shows the whole set. Match the brief's shot per beat.
   - **PRIMARY FOCUS (ranked)** → `vg-code-sequencing`: the #1 hero leads/enters first; #2/#3 follow dimmer.
   - **BEAT n → n+1 TRANSITION** → `vg-code-transitions`: carry / dock / match-cut the NAMED element (don't invent the cut).
   - **SCENE PURPOSE/PACE** → motion energy + beat density (a Reveal may be ONE bare beat; a Hook is fast).
   - **ENVIRONMENT (spatial)** → build the set where the brief says; hold positions across beats.
1. **Pick the visual** — `vg-visual-map` (what proves the point) + the matching `remotion` rule.
2. **Frame the canvas** — `vg-code-vchecks` (primary ≥50% h, fill ≥60%, bounds, caption zone).
3. **Tokens first** — `vg-code-tokens` (color identity, sizes as `w`/`h` fractions, no literals).
4. **Write the motion** — `vg-code-animations` (layered + meaning) → `vg-code-timing` (ease + spring)
   → `vg-code-sequencing` (stagger + hero leads).
5. **Text + images** — `vg-code-text` (fitText) and, if any image, `vg-code-images` (Ken Burns/overlay).
6. **Handoff** — `vg-code-transitions` (AbsoluteFill REPLACE, no leak/double-dark).
7. Seed → render → then verify the same 8 with `vg-visual-quality`.

## Why this is the high-leverage step
Fixing a flat render after the fact costs a 25-min re-render; writing it right up front doesn't.
Author against all 8 recipes and most scenes clear the verify scorecard on the first render.
These recipes live on top of the canonical `remotion` rules (animations.md / timing.md / …) —
they're the pipeline-specific code patterns using our bindings (`D.*`, `durationInFrames`,
`AbsoluteFill`, `fitText`, `findWord`/`findWordEnd`).
