---
name: vg-code-tokens
description: AUTHOR-TIME code recipe for DESIGN TOKENS in a bullet's render code — write zero literals (all color via D.*, all sizes as fractions of w/h, fps/dims via bindings), keep each entity's color token consistent, and never re-declare a reserved binding. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-tokens. Grounded in video-generation-conventions.
model: opus
---

# Code recipe — tokens only, zero literals

## Use tokens / bindings for every value

| Need | Use | Never |
|---|---|---|
| Color | `D.cyan` `D.red` `D.bg` `D.text` `D.text_dim` | `'#00F0FF'` |
| Font | `D.font_display` `D.font_mono` | `'Inter'` |
| Size | `Math.round(w*0.024)`, `h*0.10` | `32`, `200` |
| fps / dims | `fps`, `width`, `height` | `30`, `1920` |

**One sanctioned exception:** `rgba(0,0,0,α)` is allowed for **drop SHADOWS only** (there is no
shadow token). Everything else — fills, text, borders, glows — uses `D.*`. For a *colored* glow
use a token (`boxShadow:'0 0 '+Math.round(w*0.01)+'px '+D.cyan`), never a hex.

## FRAME-DRIVEN ONLY — never wall-clock / RNG (render determinism)
Every value in a bullet derives from **`frame`** (+ the injected bindings). The render must be
**reproducible**: the final is ONE live master render, and the **Visual Proof** filmstrip is rendered
*separately* — so frame N in the proof must equal frame N in the ship. A wall-clock or random value makes
them differ → the gate validates a different image than ships. **`seed_bullet_cache.py` HARD-BLOCKS** any
bullet whose code contains these:

| Need | Use (frame-driven) | NEVER (non-deterministic) |
|---|---|---|
| jitter / wobble | `Math.sin(frame*0.28)`, `Math.cos(frame*0.4)` | `Math.random()` |
| a "random-looking" scatter | a frame-seeded hash, or a fixed array indexed by `i` | `Math.random()` |
| time / now | `frame`, `frame/fps` | `Date.now()` · `new Date()` · `performance.now()` |
| per-element variety | `i`-indexed constants (`[0.1,0.4,0.7][i]`) | `Math.random()` per element |

`Math.sin`/`Math.cos`/`Math.round`/`Math.abs` of `frame` are fine (deterministic). The ban is specifically
`Math.random` · `Date.now` · `new Date` · `performance.now`. If you want apparent randomness, seed it from
`frame` (or the element index) so it's identical every render.

## Lock each entity to ONE color token (consistency across scenes)

## SEMANTIC STATE-COLOR CONSTANCY — color roles are locked for the WHOLE video

Beyond per-entity identity: the video's STATE colors are a fixed semantic mapping, decided once (the
GLOBAL VISUAL STYLE / config palette) and never reassigned scene-to-scene — the good/valid state, the
bad/cost/broken state, the stable/baseline element, and the variable/highlight element each own ONE token
for the entire video. The viewer learns the mapping in scene 1 and reads every later scene faster because
color IS meaning. Re-using the "bad" role's color for neutral decoration (or flipping roles mid-video)
breaks that learned language — a component's state props map to these role tokens, never to fresh colors.

## Don't re-declare reserved bindings (compile error)
`React, frame, fps, width, height, durationInFrames, interpolate, spring, Easing, AbsoluteFill,
Sequence, Series, Img, staticFile, AnimatedImage, TransitionSeries, linearTiming, springTiming,
fade, slide, wipe, D, resolveColor, fitText, measureText, fillTextBox, Video, Audio, captions,
findWord, findWordEnd, Kit, ThreeCanvas`
→ name your vars `fadeIn`, `wipeIn`, `slideX`, etc.

## Light editorial theme (alternative palette)
A light "documentary" look is set in the project's `config.yaml` `design:` block — NOT in bullet code (bullet
code always uses `D.*`, so only the token VALUES flip). On a light bg, darken/saturate the semantic colors for
contrast and make `surface` white cards with a soft shadow. Existing bullet code works unchanged.

## Anti-patterns

## The `text_dim` / secondary token MUST be legible (≥7:1) — not a washed-out grey
The secondary-text token (`D.text_dim`) is used for *readable* support copy (captions, sub-lines, labels,
axis/data lines), so its VALUE must clear **≥7:1 contrast against the background it sits on** — a slate-400
(~`#94A3B8`, ≈7.4:1 on a near-black bg), not a mid-grey like `#64748B` (≈4:1, **below WCAG AA** → reads dim/
washed on video). Hierarchy below the white HERO comes from SIZE + WEIGHT, not from dimming text to the point
it fails contrast. If you need a *truly* faint element (a dot-grid, a hairline), make it faint with **opacity
on a legible color**, never by choosing an illegible color. (Floor + the typography levels: `vg-code-text`
§CONTRAST FLOOR; the render-time CHECK: `vg-quality-vchecks` contrast V-check.)

## Before you write, confirm
- [ ] No hex / px / font-name literal anywhere (grep your code for `#`, `px`, font strings)
- [ ] Every size is a fraction of `w`/`h`; fps/dims via bindings; `round()` not `int()`
- [ ] Each entity uses its locked color token (same in every scene)
- [ ] `D.text_dim` (and any secondary text/line) clears ≥7:1 on its background — faintness via opacity, not an illegible color
- [ ] No reserved binding name re-declared
