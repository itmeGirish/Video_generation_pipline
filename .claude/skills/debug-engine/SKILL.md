---
name: debug-engine
description: CROSS-CUTTING skill of the Visual Story Engine. Diagnoses failures in contracts, motion graphs, or renders — routes a SYMPTOM (a build crash, a flat scene, an overlap, audio drift, a render hang, a silent master) to its single ROOT CAUSE and owner stage, so one bug pulls in one owner, not the whole pipeline. Runs whenever something is broken. Owns failure diagnosis + routing, not the fix itself (the owner stage) or the quality score (quality-assurance-engine).
when_to_use: Use whenever the pipeline breaks or a render is wrong, to diagnose the root cause and route it to the one owner. The bug router.
model: opus
---

# debug-engine — failure diagnosis + routing (CROSS-CUTTING)

When something breaks, the failure mode is loading five skills and guessing. This cross-cutting skill maps a
symptom to its ONE root cause and owner — one symptom, one owner — so fixes are targeted.

## Symptom → root cause → owner (route, don't guess)

| You see | Likely root | Route to |
|---|---|---|
| Flat / frozen / one-move-then-static scene | no hero transform / thin density | world · attention · motion-operator stages |
| Everything moves at once / no focus | no attention path | `attention-director` |
| Labels overlap / text off-canvas / caption zone | layout | `scene-composer` / composer + a layout check |
| Prior scene bleeds through | backdrop/continuity | `object-continuity-engine` / `transition-designer` |
| Audio out of sync (drift) | anchor/frame | `tempo-sync-engine` |
| Final mp4 silent | mux missing | `remotion-renderer` (audio overlay) |
| Render HANGS (exit 124) | emoji subject / animated blur | `remotion-component-mapper` (decode-safety) |
| Build / seed CRASHES | pipeline internals | `performance-optimizer` / the render scripts |
| Black video frames | AV1/HEVC decode | `asset-manager` (H.264 only) |
| A validator flagged an error you "fixed" | wrong artifact edited | re-trace: contract → component → render |

## The method

1. **Reproduce cheaply** — isolate the smallest failing unit (one scene, one event, one asset) before touching
   anything. Prefer the cheap pre-render proof over a full render to reproduce a visual failure.
2. **Find the ROOT, not the symptom** — a flat render at Phase 2 is usually an underspecified contract at
   Phase 1, not a render bug. Trace upstream until the cause is a decision, not a downstream effect.
3. **Route to the ONE owner** — the stage that owns that decision. If you're loading three skills to fix one
   bug, you've mis-routed.
4. **After the fix, re-run the owning gate** — the fix isn't done until the gate that caught it re-passes.

## The rule

One symptom → one root cause → one owner → re-run its gate. Never patch a symptom downstream of its cause
(don't fix a flat render by adding decoration; fix the contract that under-specified the transform).

## Boundary

You diagnose + route. You do not apply the fix (the owner stage does) or score quality
(`quality-assurance-engine`). You turn "it's broken" into "here's the one owner." (In this pipeline the
render-side symptom catalog lives in `vg-known-bugs` / `vg-pipeline-internals`.)
