# Remotion Engineering — how video 1 is engineered, point by point

Source: full end-to-end watch of `documents/videoplayback.webm` (31-min 4K professional LLM-inference
explainer), 2026-07-08. This is the OBSERVATION log of its render-engineering craft — what the
implementation layer does well, point by point, each mapped to where the same technique lives (or now
lives) in our pipeline. Companion docs: `lessons.md` (verdict + tactical fixes), `principles.md` (design
principles + the engineering analysis). Instance details are welcome HERE — this folder is the incident
log; the generic rules live in the skills.

---

## 1. One data model renders everything (state-driven, not scene-drawn)

Every number (peak TFLOPS, bandwidth, the ridge ops/byte, tokens/sec, weight GB) appears in reference
cards, chart annotations, and on-screen derivations — and never disagrees across 31 minutes. The video is
rendered from constants defined once; panels, charts, and derivations are computed from them.
**Ours:** the ONE-VALUE law (`vg-code-motion-bank`) + `numbers_ledger` carried end-to-end
(research → contract → codegen → instruments).

## 2. A real component system, spent relentlessly

The reference card, chip-utilization panel, timeline ruler, token chips, and telemetry ticker recur
pixel-consistent across chapters — components with props, re-rendered in new states, never redrawn art.
The utilization panel is the showcase: same component, workload prop flips, and values + bars + the
`diagnosis:` verdict all change together.
**Ours:** the `Kit` library + "a beat is a state TRANSITION on components already on stage"
(`vg-code-artifacts`). The gap is usage discipline, not capability.

## 3. Value-driven eased motion — data settles into place

Nothing "appears": counters accumulate to their values, bars fill with ease-out, capex sums climb, the
140 GB transfer is watched (`0/140 → 137/140`). Motion amplitude tracks meaning — big claims get big
moves, support settles quietly.
**Ours:** motion-bank P2/P3 (value-growth + synced counter), `vg-code-timing` tokens,
`intensity` → amplitude (`vg-remotion-engineering`).

## 4. Progressive disclosure on ONE persistent diagram

The roofline chart is built over ~4 minutes — axes → compute ceiling → bandwidth slope → ridge point →
prefill plotted → decode plotted → bound-bands — one diagram gaining annotation layers across many beats
and multiple chapter sections. The viewer's eye never re-orients; every addition inherits all prior context.
**Ours:** EVOLVE (`vg-code-composition` §7) + the CHAPTER ANCHOR (§7b, added from this observation).

## 5. Annotation/connector precision — every line lands exactly

Chart callouts, derivation braces, and token→region pointers terminate precisely on their targets (the
ridge-point marker sits exactly at the computed intersection). Geometry is derived from the same model
that draws the chart — a line cannot miss what it names.
**Ours (was our visible failure):** now wired as CONNECTOR REGISTRATION — `vg-code-motion-bank` §P11
(derive endpoints), contract Connect events name both endpoints, `contract-linter` 3c,
`vg-quality-vchecks` settled-frame check, hook ⑯.

## 6. Live instrumentation with seeded, deterministic data

The TTFT samples window, per-user token streams, and flowing packets show plausible variance yet are
clearly seeded/deterministic (an application's idle simulation, not keyframes). Instruments re-read the
world when state changes rather than displaying a static value.
**Ours:** frame-determinism rule #16 + seeded particle engines (`vg-code-composition` §8c) +
"instruments re-diagnose" (`vg-code-artifacts`); the HUD strip pattern (`vg-code-composition` §1–4).

## 7. Camera and focus carry meaning; transitions are optical

Act boundaries use defocus/rack-focus (the roofline blurs out → the next chapter's question card),
macro-zooms dive into one detail, recap pulls wide. The camera grammar varies; no two adjacent sections
repeat a move.
**Ours:** the CAMERA GRAMMAR + rack-focus/DOF rules (`vg-remotion-engineering`) — static blur per state,
never animated radius (the render-safety constraint).

## 8. Light is the hierarchy system

Dark stage; the current focus is always the most luminous thing; vignettes push the eye inward; bloom
appears only on things that plausibly emit (lit cells, active units, glowing curves). You can squint at
any frame and find the hero by brightness alone.
**Ours:** `lighting-director` (script intent) + `vg-code-composition` §8b (light pool + vignette) +
the luminance squint check (`vg-quality-animations` CLEAN≠GOOD test 6).

## 9. Typography as a strict engineered scale

Three voices held for 31 minutes: giant display numerals for the one hero value per scene (~6–8× body),
small uppercase mono for labels/machine data, one mid display weight for headers. Data is ALWAYS mono;
narration-adjacent text never is. No stray sizes.
**Ours:** `vg-code-text` §THE TYPOGRAPHY SYSTEM (4 levels, one HERO per beat, shared scale object,
≥7:1 local-surface contrast).

## 10. One grid, one geography

Identical outer margins and gutters everywhere; recurring elements keep fixed homes (reference card
top-right, telemetry bottom, diagnosis right rail) so the viewer's spatial memory does the navigation.
Density is organized — panels align to shared column edges across the whole video.
**Ours:** ONE GRID (`vg-code-composition` §0 + `visual-style-engine` GRID+SPACING) and HOMES
(`visual-world-engine` §4, enforced by `object-continuity-engine`).

## 11. Semantic color as a token system

Four concept colors held rigidly for 31 minutes (compute/prefill vs memory/decode vs cost/failure vs
cache), reused across every diagram, chart, panel, and title — the diagnosis is readable from color
before any label. Color is never decoration.
**Ours:** `visual-style-engine` immutable entity→accent map + `D.*` tokens (`vg-code-tokens`).

## 12. Rhythm engineering — interstitials and holds are designed states

Near-empty question cards punctuate acts; big reveals get held frames (the number lands, then stillness
while it registers); dense passages alternate with breath. Stillness is a designed state with minimal
ambient life, not a freeze.
**Ours:** Interstitial (`scene-planner` + `vg-code-composition` §10 + the canvas-fill exemption) and
DESIGNED stillness (`vg-code-animations` §SPOTLIGHT-DIM/HOLD).

## 13. The world never fully stops

A persistent telemetry strip ticks under whole chapters; packets flow through the routing stack during
narration holds; held panels breathe at different rates. Even "quiet" frames have live systems.
**Ours:** MOTION DENSITY layers + STALE-ELEMENT (`vg-quality-animations`), hold-alive variety
(`vg-code-animations`), HUD strip (`vg-code-composition`).

## 14. Performance-aware effects (premium without expensive filters)

The glow language is layered luminance (stacked soft copies / screen blends around genuinely bright
elements), thin 1px structure lines, and static gradients — nothing that requires animated blur.
The "expensive look" is achieved with compositor-cheap moves at 4K.
**Ours:** CHEAP DENSITY ONLY (`vg-quality-animations`) + fake-bloom recipes
(`vg-code-composition` §8c / `vg-remotion-engineering` PREMIUM TECHNIQUES) — never animated
`boxShadow`/`filter:blur` (the render-hang class).

## 15. The encode protects the design

4K + generous bitrate is why hairline strokes, small mono labels, and dark gradients survive compression.
The fine-lined shape language is an engineering bet on resolution — the design and the encode were chosen
together.
**Ours:** 1080p CRF16 fits our current (heavier-weight) shape language; adopting video-1-fine-lines would
require the 4K/bitrate decision with it (config, not skills).

---

**Reading this doc:** each point names the OWNER where the technique is wired in our pipeline — when a
render misses one of these, route to that owner (BUG ROUTER discipline), don't re-derive the rule here.
The skills hold the generic law; this file holds the evidence that the law produces reference-grade video.
