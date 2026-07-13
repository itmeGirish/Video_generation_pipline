---
name: design-system-manager
description: CROSS-CUTTING skill of the Visual Story Engine. Maintains the consistent design system — colors, typography, spacing, shape language, and the accent-per-object token map — across every scene and every stage, so N scenes read as ONE video. Enforces that the style graph's decisions are applied everywhere and never drift per scene. Runs alongside visual-style-engine (which sets it), scene-composer, and the render stages (which must honor it). Owns design-system consistency, not the one-time style choice (visual-style-engine) or the code tokens (token-sync-engine).
when_to_use: Use throughout to keep colors/type/spacing/shape/accent-tokens consistent across all scenes and stages. The consistency enforcer for the design system.
model: opus
---

# design-system-manager — design-system consistency (CROSS-CUTTING)

One held design system is what makes eight scenes feel like one video. `visual-style-engine` DECIDES the
system once; this cross-cutting skill ENFORCES it everywhere, catching per-scene drift before it ships.

## What it maintains (consistently, across all scenes)

- **Color palette + accent-per-object tokens** — each recurring object keeps its accent every appearance;
  the base bg and desaturation rules hold. A color that drifts scene-to-scene = a flag.
- **Typography** — the display + mono fonts, the weight/scale hierarchy (hero/label/caption) — identical
  everywhere. No scene invents a new type scale.
- **Spacing + shape language** — corner radius, stroke weight, fill-vs-outline, panel padding — one system.
- **Composition grammar** — the composition-for-feeling rules applied consistently (the tension beat tilts,
  the thesis centers) rather than every scene defaulting to the same layout.

## When it runs (cross-cutting)

- at **visual-style-engine** — records the system as the single source of truth (the Style Graph).
- at **scene-composer** — verifies each scene's fields inherit the system, don't override it.
- at the **render stages** — verifies the resolved tokens match the system; catches a scene that hard-coded a
  color instead of a token.
- across the **object library** — ties each object's identity accent to the palette so identity == color.

## The rule

The design system is set once and inherited everywhere; a scene APPLIES it (the tension scene uses the system
in a tense way), it never CONTRADICTS it. Any per-scene value that isn't a system token or a sanctioned
application is drift → route back to the scene/style owner.

## Boundary

You enforce consistency of the system. You do not make the one-time style choice (`visual-style-engine`) or
sync the code-level design tokens (`token-sync-engine`). You keep the whole video visually coherent.
