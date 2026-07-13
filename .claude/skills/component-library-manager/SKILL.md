---
name: component-library-manager
description: CROSS-CUTTING skill of the Visual Story Engine. Manages the reusable Remotion/React component library (the Kit) — the registry of shared, parameterized components (titles, panels, counters, charts, terminals, gauges, pipelines, the through-line objects) that the component-mapper reuses instead of hand-drawing per bullet. Keeps components consistent, parameterized, and documented; adds a new component only when a genuinely new object needs one. Runs alongside remotion-component-mapper. Owns the component registry, not the per-scene mapping (remotion-component-mapper) or design tokens (token-sync-engine).
when_to_use: Use to maintain + grow the reusable component library (the Kit) so objects are composed from shared components, not redrawn. Owns the component registry.
model: opus
---

# component-library-manager — the RENDER CAPABILITY REGISTRY (CROSS-CUTTING)

Component-first only works if there's a well-kept library to compose from. This cross-cutting skill maintains
the Kit — the registry of reusable, parameterized React/Remotion components — so the component-mapper reuses
battle-tested components instead of re-drawing shapes every bullet.

## The registry is the SEAM — the script knows the registry, never the renderer

The **Render Capability Registry** is the ONE interface the script-side stages consult when deciding what
can be shown: **components** (this registry) · **operators** (the closed set, `motion-operator-engine`) ·
**idioms** (`idiom-library-engine`) · **constraints + performance rules** (frame-driven · deterministic ·
decode-safe · cheap channels · one-heavy-per-video — `performance-optimizer`/`code-review-engine`). The
script composes FROM the registry; it never "knows Remotion." Remotion is the execution runtime behind the
registry — swap the runtime (Canvas/WebGPU/whatever) and nothing script-side changes, because nothing
script-side ever referenced more than the registry's vocabulary. Design decisions consult the registry
(need a comparison → the registry's comparison family; need a hierarchy → its tree/tiers family); the
script never invents visuals — it assembles them.

## What it maintains

- **The registry** — the catalog of shared components (titles, panels, counters, charts, terminals, gauges,
  pipelines, chips, KPIs, the persistent through-line objects), each parameterized by props (state, values,
  accent) so ONE component renders many states.
- **Consistency** — every component obeys the design system (tokens, type, shape), is frame-driven, and is
  decode-safe. A component that hard-codes a color or self-animates is a registry bug.
- **Coverage vs bespoke** — most objects map to an existing component; a NEW component is added only for a
  genuinely new object (the hero scene's bespoke element). Uncontrolled growth (a new component per bullet) is
  the anti-pattern; so is a missing component that forces hand-drawing.
- **Documentation** — each component's props + intended use, so the mapper knows what exists before building new.

## When it runs (cross-cutting)

- at **remotion-component-mapper** — supplies the registry to map objects onto; flags objects with no component.
- when a **new object** appears (a bespoke hero element) — decide: extend an existing component or add one, then
  register + document it so future videos reuse it.
- across videos — the library grows deliberately, becoming the shared vocabulary that keeps every video
  consistent and fast to build.

## The rule

Reuse before rebuild: check the registry first; add a component only when nothing fits, and register it when
you do. The library is the reason objects are components (own state, reused) and not one-off drawings.

## Boundary

You own the component REGISTRY. You do not map scenes onto it (`remotion-component-mapper`), sync design
tokens (`token-sync-engine`), or review the generated code (`code-review-engine`). You keep the shared
component vocabulary healthy. (In this pipeline the registry is `remotion/src/universal/kit.tsx`.)
