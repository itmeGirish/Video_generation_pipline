---
name: performance-optimizer
description: CROSS-CUTTING skill of the Visual Story Engine. Optimizes rendering performance, memory, and frame generation — keeps motion on the cheap compositor channels (transform/opacity), avoids the render-killers (animated blur/filter, un-budgeted 3D/video, huge un-optimized assets), budgets one heavy capability per video, and keeps the render deterministic + within time/memory. Runs across the component/composition/render stages. Owns render performance, not the component mapping (remotion-component-mapper) or the render execution (remotion-renderer).
when_to_use: Use across the render stages to keep the render fast, deterministic, and within memory — cheap-motion channels, capability budget, no render-killers. Owns render performance.
model: opus
---

# performance-optimizer — render performance + memory (CROSS-CUTTING)

A render that is correct but hangs or blows memory never ships. This cross-cutting skill keeps the render fast,
deterministic, and within budget — mostly by preventing the known render-killers at author time.

## The performance rules (enforce across the render stages)

- **Motion on cheap channels only** — animate `transform` + `opacity` (+ gradient position). NEVER animate a
  `blur`/`filter` radius or a heavy `boxShadow` blur — it re-rasters every frame and balloons or hangs the
  render. Glow = stacked static low-opacity screen layers, not an animated blur.
- **Capability budget** — one heavy capability per video (the hero scene). Un-budgeted 3D or multiple video
  clips blow render time. The body stays on the reliable 2D floor.
- **Decode-safe + light assets** — H.264 mp4 for video; optimized images; no huge files. (Asset-manager
  resolves; this stage budgets their cost.)
- **Deterministic + frame-driven** — no wall-clock, no randomness (seed from frame). Determinism is also a
  performance property: it lets the cheap proof stand in for the full render, avoiding wasted render passes.
- **Watchdog + patience** — render is SLOW (~minutes/scene at 1080p), not hung; a per-frame watchdog catches a
  genuinely stuck frame. Don't kill a slow render early; do kill a truly hung one.
- **One master pass** — one render of the live composition, not per-scene mp4s stitched (avoids redundant work
  and stitch seams).

## The method

Prevent at author time (the component mapper + composer honor these rules), catch at the render (the watchdog
+ journal), and fix at the root (a hang is usually a banned channel — an animated blur — not a render bug).

## The rule

Performance is designed in, not tuned after: the cheapest render is the one whose composition never asked for
an expensive thing. Every heavy choice is budgeted and justified (the one hero scene).

## Boundary

You own render cost/speed/memory. You do not map components (`remotion-component-mapper`), execute the render
(`remotion-renderer`), or score visual quality (`quality-assurance-engine`). You keep the render buildable in
practice. (In this pipeline the render-side detail lives in `vg-pipeline-internals` / `vg-known-bugs`.)
