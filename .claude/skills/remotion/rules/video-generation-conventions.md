---
name: video-generation-conventions
description: Project conventions for authoring per-bullet render code in the video_generation pipeline — the standardized layout, motion, and design-token rules that reduce visual and layout bugs. Read before writing any bullet's React.createElement code. Complements the upstream Remotion rules (animations, timing, sequencing, transitions, measuring-text, images); it does not replace them. Use when authoring bullet code, fixing a visual/layout bug, or standardizing render output.
---

# Video-Generation Render Conventions

Project-specific standard for the **per-bullet code** the video_generation pipeline
renders (authored in-session, seeded to cache — see video_generation rule 04). It
consolidates the recurring layout/visual bug classes into one author-time checklist so
they're prevented at write-time, not caught after a 25-minute render.

This is the project layer ON TOP of the upstream Remotion rules. For *how a primitive
behaves*, the upstream rules are the source of truth:
- motion → [animations.md](animations.md) + [timing.md](timing.md)
- staggers / sequencing → [sequencing.md](sequencing.md)
- text effects → [text-animations.md](text-animations.md)
- scene transitions → [transitions.md](transitions.md)
- text overflow → [measuring-text.md](measuring-text.md)
- images → [images.md](images.md)

## Contents
- Non-negotiable invariants
- Design tokens only (no literals)
- Reserved binding names (do not re-declare)
- Layout discipline
- Motion discipline
- The visual bug classes (V-checks) to author against
- Pre-author checklist

---

## Non-negotiable invariants

1. **All motion is `useCurrentFrame()`-driven.** No CSS `transition:`/`animation:`, no
   Tailwind animation classes — they're silently dropped in render (animations.md).
2. **No literals.** No hex colors, no font-family names, no pixel dimensions. Every
   visual value comes from a design token `D.*` or `width`/`height`/`fps` bindings.
3. **`round()`, never `int()`** for any seconds→frames math.
4. **One visual beat per bullet**; describe exact elements, not intent.

---

## Design tokens only (no literals)

| Need | Use | Never |
|---|---|---|
| Color | `D.cyan`, `D.red`, `D.bg`, `D.text_dim`, … | `'#00F0FF'` |
| Font | `D.font_display`, `D.font_mono` | `'Inter'` |
| Size | `Math.round(w*0.022)`, `h*0.10` | `32`, `200` |
| fps / dims | `fps`, `width`, `height` (bindings) | `30`, `1920` |

`w`/`h` are local aliases for `width`/`height`; size everything as a fraction of them so
the layout scales with the canvas.

---

## Reserved binding names (do not re-declare)

`DynamicBlock` injects these as function parameters. Re-declaring any with
`const`/`let`/`var` fails compilation with `Identifier 'X' has already been declared`
(renders as `BLOCK COMPILE ERROR`):

```
React, frame, fps, width, height, durationInFrames, interpolate, spring, Easing,
AbsoluteFill, Sequence, Series, Img, staticFile, AnimatedImage, TransitionSeries,
linearTiming, springTiming, fade, slide, wipe, D, resolveColor, fitText,
measureText, captions, findWord
```

Rename your own vars (`fadeIn` not `fade`, `wipeIn` not `wipe`, `slideX` not `slide`).

---

## Layout discipline

- **Fill the canvas.** The primary visual occupies ≥60% of the frame; the ONE focal
  element ≥50% of canvas height. No stamp-sized content on a black void.
- **No clipping.** Every element stays inside `[0..w] × [0..h]`. Account for text width
  (use `fitText`/`measureText` from measuring-text.md for any unbounded string).
- **No overlap.** Two bullets never visible at once (a REPLACE backdrop is a full
  `AbsoluteFill`, not a `position:absolute` div). Within a bullet, labels are not
  covered by colored rects; hero text fits the gap between neighbors.
- **Readable type.** Body ≥ `w*0.009`, headline ≥ `w*0.022`. Key labels never on
  `D.text_dim`.
- **Single-line labels fit their container** — wrap is a bug; size with `fitText` or
  shorten.

---

## Motion discipline

- **Spring presets** (match intent to physics — same values as timing.md):

  | Intent | config | Use for |
  |---|---|---|
  | Smooth | `{ damping: 200 }` | subtle text reveal, ambient |
  | Snappy | `{ damping: 20, stiffness: 200 }` | cards, labels, list items |
  | Bouncy | `{ damping: 8 }` | hero numbers, punchlines |
  | Heavy | `{ damping: 15, stiffness: 80, mass: 2 }` | dramatic entrances, big tiles |

- **Phase timing as `durationInFrames` fractions, never frame literals:**
  ```js
  const p1End = durationInFrames * 0.30;
  const p2End = durationInFrames * 0.60;
  const p3End = durationInFrames * 0.95;   // final phase reaches ~0.95 — no dead tail
  ```
- **The animation spans the window.** It must keep VISIBLE motion (counter / breathe
  ±1.5% / pan / pulse at opacity ≥ 0.15) the whole bullet — never finish early and sit
  static (>3s static = freeze fail). Sub-visible drift (opacity ≤0.08) does not count.
- **Always clamp `interpolate` both sides** (`extrapolateLeft`+`extrapolateRight: 'clamp'`)
  — unclamped easing produces large out-of-range values before/after the input range.
- **Ease `interpolate` motion — never leave it linear.** A bare `interpolate` moves at
  constant speed and looks robotic. Add an easing to every reveal/value animation:
  - arriving (counter landing, bar filling, slide-in) → `easing: Easing.out(Easing.cubic)` (fast→slow)
  - travelling A→B → `easing: Easing.inOut(Easing.cubic)`
  - linear ONLY for continuous ambient loops (steady drift/scan), never a reveal
  ```js
  // ✅ counter eases to its value (confident landing)
  const shown = Math.round(interpolate(frame, [0, durationInFrames*0.6], [0, FINAL],
    {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic)}));
  // ❌ const shown = interpolate(frame, [0, 30], [0, FINAL])  // linear — mechanical
  ```
- **One element leads the eye per beat.** Motion is attention direction: when a new
  element matters it moves (enters/pulses) while the rest holds or dims. Never animate
  two things equally at once — the viewer won't know where to look (rule 21 staging).
- **Show, don't tell.** The visual carries the meaning; on-screen text = a short
  headline + a few labels + numbers. A frame of prose is a slide, not an animation.

---

## The visual bug classes (V-checks) to author against

These are the exact failures rule 23 verification looks for — author so each passes:

| Check | Author so that… |
|---|---|
| V1 not black | ≥40% non-bg pixels at midpoint |
| V2 no bullet overlap | prior bullet gone before next; REPLACE = full AbsoluteFill |
| V3 tokens only | zero hex/font/px literals |
| V4 readable text | body ≥ w*0.009, headline ≥ w*0.022 |
| V5 canvas ≥60% | main visual fills the majority of the frame |
| V7 no clipping | all elements inside canvas bounds |
| V8 animation visible | midpoint frame ≠ frame 0 |
| V9 no internal overlap | labels not under rects; hero text fits the gap |
| V10 text fits | single-line labels don't wrap |
| V11 timeline fits | all phases finish within `framesTo − framesFrom` |
| V12 not text-only | a non-text visual carries the point |
| V13 primary prominence | one element ≥50% canvas height dominates |
| A4/A5 not frozen | visible motion across the whole window |

---

## Pre-author checklist

Before writing a bullet's code:
- [ ] Picked the visual pattern (video_generation rule 21) and the matching upstream Remotion rule
- [ ] Colors/fonts/sizes are `D.*` / fractions of `w`,`h` — zero literals
- [ ] No reserved binding name re-declared
- [ ] Primary element ≥50% canvas height; visual fills ≥60%; nothing clips or overlaps
- [ ] Phases are `durationInFrames` fractions; final phase ~0.95; motion visible whole window
- [ ] `interpolate` clamped both sides; spring preset matches intent
- [ ] Not a text-only frame; a real visual carries the meaning
- [ ] Any `[asset:]` image has cinematic motion (Ken Burns / push-in / logo pop)
