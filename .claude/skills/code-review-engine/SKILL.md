---
name: code-review-engine
description: CROSS-CUTTING skill of the Visual Story Engine. Reviews the generated React/TypeScript/Remotion code before it renders — frame-driven only (no CSS/auto-play/self-animation), deterministic (no Math.random/Date.now/wall-clock), decode-safe (no emoji subjects, H.264 video), no animated blur/filter, tokens not literals, no reserved-binding clashes, text fits its box. Runs on the component/render code. Owns generated-code correctness, not the component registry (component-library-manager) or performance budgeting (performance-optimizer).
when_to_use: Use to review generated Remotion/React bullet code for the render-safety + determinism + token rules before seeding/rendering. Owns code review.
model: opus
---

# code-review-engine — generated-code review (CROSS-CUTTING)

The render is deterministic headless Chromium; most "major render bugs" are a code rule violated at author
time. This cross-cutting skill reviews the generated React/Remotion code against the render-safety rules
before it ever renders — catching the bug in the diff, not after a full render.

## The review checklist (every rule prevents a specific render bug)

- **Frame-driven only** — motion is a function of `useCurrentFrame()`. No CSS/Tailwind animation, no
  auto-play, no self-animating loop (silently dropped or flickers in render).
- **Deterministic** — NO `Math.random` / `Date.now` / `new Date` / `performance.now`. Jitter is seeded from
  frame. (Non-determinism makes the cheap proof differ from the ship — the seed check hard-blocks it.)
- **Decode-safe** — no emoji glyph as a subject (hangs headless render → SVG/shape icons); video is H.264 mp4.
- **No animated blur/filter** — glow is stacked static screen layers; drop-shadow blur is static (animating it
  balloons/hangs the render).
- **Tokens, not literals** — colors are `D.*`, sizes are w/h fractions, dims/fps are bindings; no `#hex`/`1920`.
- **No reserved-binding clashes** — don't re-declare the DynamicBlock reserved names (React/frame/fps/D/fade/
  slide/wipe/Img/Video/…); rename local helpers.
- **Text fits** — headlines/labels measured to fit their box (no clip/wrap/overrun); nothing in the caption zone.
- **Escaping** — apostrophes/quotes escaped correctly inside the code strings.

## The method

Review the diff BEFORE seeding/rendering. A violation is cheaper to fix in the code string than after a
render pass reveals a hang or a flat frame. Route each finding to its rule owner (determinism → the
component-mapper's constraints; tokens → token-sync; blur → performance-optimizer).

## The rule

No generated code renders until it passes the checklist — the render-safety rules are non-negotiable because
each maps to a real, expensive render failure. "It'll probably be fine" is how a render hangs at minute 20.

## Boundary

You review generated CODE. You do not manage the component registry (`component-library-manager`), sync tokens
(`token-sync-engine`), or budget performance (`performance-optimizer`) — though you enforce their rules in the
code. (In this pipeline the code rules live in `vg-code-*` + the seed determinism lint.)
