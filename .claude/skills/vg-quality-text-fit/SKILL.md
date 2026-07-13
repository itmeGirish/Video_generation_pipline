---
name: vg-quality-text-fit
description: Production-quality gate for TEXT FIT & OVERFLOW (measuring-text). Scores 0-10 on whether on-screen text fits its container — single-line labels don't wrap, nothing clips at canvas edges, hero text fits the gap between neighbors — using fitText/measureText for any unbounded string. Grounded in remotion measuring-text.md. Use after a scene renders, when text wraps unexpectedly, clips, overlaps, or a label overruns its box. One of the 8 visual-quality factors (see vg-visual-quality).
model: opus
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

## TYPOGRAPHY SYSTEM check (retention type, not "developer text") — owner: `vg-code-text`

Fit is necessary but not sufficient — text can fit perfectly and still read as a *presentation slide* instead
of *YouTube communication*. Score the SYSTEM (`vg-code-text` §"THE TYPOGRAPHY SYSTEM") on the rendered frame:
- **4 levels, not random sizes:** every string reads as HERO / SUBHERO / SUPPORT / MACHINE — and there is
  exactly ONE HERO per beat. Random-feeling sizes (huge title, tiny sub, medium chip with no logic) → flag.
- **Chunked, not a wide sentence:** a multi-word caption is stacked into 2–4 chunks the eye GLANCES, not one
  full-width line it must read. A single even-weight sentence spanning the frame → flag (the #1 tell).
- **Key word emphasised:** the 1–2 words that carry the point are bigger/bolder/accent-colored; the rest
  recede. If every word is the same weight, the glance has no target → flag.
- **Mono = machine only:** `D.font_mono` appears ONLY on literal machine text (parser/code/OCR/data); a human
  caption/headline in mono → flag.
- **ONE shared scale (count the sizes):** grep the scene's screen text for distinct font sizes — **>6 distinct
  sizes = drift FAIL** (a design system has ~5; a real audit hit 17 → "text keeps changing size, amateur").
  Likewise **>4 distinct entrance spring configs = motion drift.** The fix is a shared `TYPE`/`SPR` object the
  beats compose from (`vg-code-text` §COMPOSE FROM A SHARED SCALE), not per-beat literals.
- **Opacity ≠ dimming text below the floor:** a *legible color* drawn at `opacity:0.4–0.6` is dim AGAIN
  (opacity multiplies contrast). Any **meaningful** text or data LINE/axis sitting at **opacity < ~0.8 in its
  SETTLED state** = under-contrast FAIL (entrance fade-IN to 1 is fine). This is the trap that defeats a color
  fix — `D.text_dim` brightened to 7.4:1 but drawn at 0.4 opacity is back to ~4:1.

**Caps:** a beat whose main caption is one wide even-weight sentence (no chunking, no emphasis) **caps ≤6** —
it fits, but it isn't retention type. Mono used for a narration caption **caps ≤6**. (Real audit: captions were full-width even-weight sentences → typography scored 6.5/10 while story scored 8.5.)

## 0–10 rubric
- **9–10:** all text fits + the typography SYSTEM holds (4 levels, chunked, key word emphasised, mono=machine).
- **7–8:** fits and mostly systematic, but one caption is a wide sentence OR one size is off-scale.
- **5–6:** fits but reads as slide text — sentences not chunked, no emphasis, or mono misused.
- **3–4:** a label clearly wraps/overflows OR text clips the canvas.
- **0–2:** multiple clipped/overflowing/colliding text elements.

**Gate:** < 7 → REVISE. Any clipped/wrapped text caps ≤4 (V7/V10); un-chunked even-weight sentence captions
or mono-as-caption cap ≤6 (typography system). Report the offending string + the fix (chunk it / emphasise
the key word / fix the level / display-not-mono).
