---
name: vg-quality-text-fit
description: Production-quality gate for TEXT FIT & OVERFLOW (measuring-text). Scores 0-10 on whether on-screen text fits its container — single-line labels don't wrap, nothing clips at canvas edges, hero text fits the gap between neighbors — using fitText/measureText for any unbounded string. Grounded in remotion measuring-text.md. Use after a scene renders, when text wraps unexpectedly, clips, overlaps, or a label overruns its box. One of the 8 visual-quality factors (see vg-visual-quality).
---

# Quality Factor 5 — Text fit & overflow

Source of truth: `remotion/rules/measuring-text.md`. Wrapping/clipping text is one of the most
common "amateur render" tells — it reads as broken layout.

## What production-grade looks like (10)
- **`fitText` / `measureText` used for every unbounded string** (any text whose length isn't
  fixed) so the font size adapts to the container.
- **Single-line labels stay single-line** — no unintended wrap.
- **Nothing clips** the canvas bounds `[0..w] × [0..h]` or its own container.
- **Hero text fits the gap** between its neighbors (doesn't collide with adjacent elements).
- Type on scale: body ≥ w*0.009, headline ≥ w*0.022 (readable), but not so large it overflows.

## Failure signals (low)
- A label wraps to 2 lines when it should be one.
- Text runs past the canvas edge or out of its rect/box.
- A long string at a hardcoded font size overflows its container.
- Hero number/headline collides with a neighboring element.
- Text set without measuring → looks fine for short strings, breaks for long ones.

## The fix
Wrap unbounded strings in `fitText({text, width, fontFamily})` (or `measureText` to check and
branch); cap labels to one line and shrink-to-fit; verify every text element's box is inside
canvas bounds and clear of neighbors; shorten copy if it can't fit at the readable minimum.

## 0–10 rubric
- **9–10:** all text fits, single-line labels intact, nothing clips, fitText used for unbounded strings.
- **7–8:** fits, but one string relies on luck (no measure) or sits tight to an edge.
- **5–6:** a minor wrap or a near-clip that's distracting.
- **3–4:** a label clearly wraps/overflows OR text clips the canvas.
- **0–2:** multiple clipped/overflowing/colliding text elements.

**Gate:** < 7 → REVISE. Any clipped or wrapped on-screen text caps the scene at ≤4 (V7/V10).
Report the offending string + fitText/shorten fix.
