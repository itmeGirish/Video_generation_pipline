---
name: vg-code-tokens
description: AUTHOR-TIME code recipe for DESIGN TOKENS in a bullet's render code — write zero literals (all color via D.*, all sizes as fractions of w/h, fps/dims via bindings), keep each entity's color token consistent, and never re-declare a reserved binding. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-tokens. Grounded in video-generation-conventions.
---

# Code recipe — tokens only, zero literals

## Use tokens / bindings for every value
```js
const w = width, h = height;                          // local aliases
// ✅ color via D.*, size as fraction of w/h, fps from binding
const card = React.createElement('div',{style:{
  color: D.text, backgroundColor: D.surface,
  fontFamily: D.font_display, fontSize: Math.round(w*0.024),
  borderRadius: Math.round(w*0.010), padding: Math.round(w*0.012)}}, '…');
```

| Need | Use | Never |
|---|---|---|
| Color | `D.cyan` `D.red` `D.bg` `D.text` `D.text_dim` | `'#00F0FF'` |
| Font | `D.font_display` `D.font_mono` | `'Inter'` |
| Size | `Math.round(w*0.024)`, `h*0.10` | `32`, `200` |
| fps / dims | `fps`, `width`, `height` | `30`, `1920` |

**One sanctioned exception:** `rgba(0,0,0,α)` is allowed for **drop SHADOWS only** (there is no
shadow token). Everything else — fills, text, borders, glows — uses `D.*`. For a *colored* glow
use a token (`boxShadow:'0 0 '+Math.round(w*0.01)+'px '+D.cyan`), never a hex.

## Lock each entity to ONE color token (consistency across scenes)
```js
const COLOR = { v48:D.cyan, v47:D.text_dim, cost:D.amber, fail:D.red, ok:D.green }; // reuse everywhere
```

## Don't re-declare reserved bindings (compile error)
`React, frame, fps, width, height, durationInFrames, interpolate, spring, Easing, AbsoluteFill,
Sequence, Series, Img, staticFile, AnimatedImage, TransitionSeries, linearTiming, springTiming,
fade, slide, wipe, D, resolveColor, fitText, measureText, captions, findWord, findWordEnd`
→ name your vars `fadeIn`, `wipeIn`, `slideX`, etc.

## Light editorial theme (alternative palette — the "documentary" look)
Set these in the project's `config.yaml` `design:` block (NOT in bullet code — bullet code
always uses `D.*`). On a light bg, neon-on-black colors wash out, so semantic colors are
**darkened/more saturated** for contrast, and `surface` becomes white cards (use soft shadow):
```yaml
design:
  bg: "#F2EFE9"        # warm off-white (add a soft center glow + vignette in the backdrop)
  surface: "#FFFFFF"   # white floating cards (pair with boxShadow — see vg-code-composition)
  text: "#1A1A22"      # near-black
  text_dim: "#7A7A8A"
  cyan: "#2563EB"      # strong blue (hero/prompt) — not neon
  violet: "#7C3AED"
  amber: "#D97706"     # darker amber for cost/accent (readable on white)
  green: "#15A34A"     # cached / good
  red:  "#DC2626"      # uncached / bad
  white: "#FFFFFF"
  dot_grid_opacity: 0.05
```
Same `D.*` names → existing bullet code works unchanged; only the values flip. Use for
technical/data explainers where the light, card-based look reads premium.

## Anti-patterns
```js
// ❌ {color:'#FF3B3B', width:1920, fontSize:32}          // literals → V3 fail
// ❌ const fade = ...                                     // re-declares reserved binding → BLOCK COMPILE ERROR
// ❌ entity uses D.cyan in S1 but D.green in S4           // color-identity break
```

## Before you write, confirm
- [ ] No hex / px / font-name literal anywhere (grep your code for `#`, `px`, font strings)
- [ ] Every size is a fraction of `w`/`h`; fps/dims via bindings; `round()` not `int()`
- [ ] Each entity uses its locked color token (same in every scene)
- [ ] No reserved binding name re-declared
