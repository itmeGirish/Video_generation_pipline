---
name: token-sync-engine
description: CROSS-CUTTING skill of the Visual Story Engine. Synchronizes design tokens across the design intent and the code — the style graph's palette/type/spacing tokens become the render's concrete token set (the D.* tokens) with a single source of truth, so a color/size defined once is used everywhere and no literal hex/px leaks into bullet code. Optionally bridges tokens to/from Figma. Runs between visual-style-engine and the render code. Owns token synchronization, not the style decision (visual-style-engine) or the component registry (component-library-manager).
when_to_use: Use to keep design tokens in sync between the style graph and the render code (D.* tokens), preventing literal color/size leakage. Owns token sync.
model: opus
---

# token-sync-engine — design-token synchronization (CROSS-CUTTING)

A design system only holds if there is ONE source of truth for its values and everything references it. This
cross-cutting skill keeps the style graph's tokens and the render's code tokens in sync, so a color defined
once is the color used everywhere — and no literal value leaks in to drift.

## What it synchronizes

- **Palette → color tokens** — each accent (per object) and the base bg become named tokens (the render's
  `D.*` set). Bullet code references `D.cyan`, never `#hex`.
- **Type + spacing → tokens** — font sizes, weights, radii, spacing as tokens/fractions, never raw px or `1920`.
- **Dimensions/fps → bindings** — canvas size + fps come from bindings, never hard-coded numbers.
- **One source of truth** — the style graph is authoritative; the code tokens are generated from it. Changing a
  color changes it once, everywhere.
- **(Optional) Figma bridge** — where a Figma design system exists, keep its tokens and the code tokens in
  sync in both directions.

## The rule (zero literals)

No literal hex, no raw px, no bare `1920`/`32`/fps numbers in bullet code — every value is a token or a
fraction bound to the source. A literal in the code is drift waiting to happen (it won't update when the token
does) → replace it with the token. (The one sanctioned literal is a shadow's `rgba(0,0,0,α)`.)

## When it runs (cross-cutting)

- at **visual-style-engine** — captures the tokens as the source.
- at the **render code** — generates/verifies the `D.*` token set from the source; catches any literal leak.
- when the **palette changes** — re-syncs so every scene inherits the new value with one edit.

## Boundary

You sync tokens (design ↔ code). You do not choose the palette/type (`visual-style-engine`), enforce their
consistent application (`design-system-manager`), or manage components (`component-library-manager`). You keep
one source of truth for every value. (In this pipeline the render tokens live in `vg-code-tokens` / the config.)
