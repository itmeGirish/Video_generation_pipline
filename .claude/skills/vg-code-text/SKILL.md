---
name: vg-code-text
description: AUTHOR-TIME code recipe for TEXT FIT in a bullet's render code — size every unbounded string with fitText/measureText so labels never wrap or clip, keep single-line labels single-line, and keep type on scale. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-text-fit. Grounded in remotion measuring-text.md + the fitText/measureText bindings.
---

# Code recipe — text that fits

**Labels are required, not banned.** Every visual needs a short title + entity labels +
any hero number (the deaf-viewer test) — animate them on. What's banned is text as the
whole beat (sentences/paragraphs/the narration typeset). Label the visual ✅; replace the
visual with text ❌. This recipe is about making those labels/numbers FIT.

## Size unbounded strings with fitText (shrink-to-fit a container)
```js
// fit a headline to a target width using the loaded display font
const boxW = Math.round(w*0.8);
const fit = fitText({text: HEADLINE, withinWidth: boxW, fontFamily: D.font_display, fontWeight:'700'});
const headFs = Math.min(fit.fontSize, Math.round(w*0.060));   // cap so it never overgrows
const head = React.createElement('div',{style:{
  fontFamily:D.font_display, fontSize:headFs, whiteSpace:'nowrap', maxWidth:boxW, color:D.text}}, HEADLINE);
```

## Check overflow / branch with measureText
```js
const m = measureText({text: LABEL, fontFamily: D.font_mono, fontSize: Math.round(w*0.014)});
const labelFs = m.width > boxW ? Math.round(w*0.011) : Math.round(w*0.014);  // shrink if it would overflow
```
> `fitText`/`measureText` are only correct with `D.font_display` / `D.font_mono` (Root.tsx
> preloads those). Any other family falls back to a default and the numbers are wrong.

## Keep single-line labels single-line
```js
style:{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'clip' }   // never let a label wrap
```

## Anti-patterns
```js
// ❌ hardcoded fontSize on a variable-length string → overflows for long values
fontSize: 48
// ❌ a long label with default white-space → wraps to 2 lines (looks broken)
// ❌ fitText with a font that isn't D.font_display/D.font_mono → wrong measurements
```

## Before you write, confirm
- [ ] Every variable-length string is sized with `fitText` (or branched via `measureText`)
- [ ] Single-line labels use `whiteSpace:'nowrap'` and fit their container
- [ ] `fitText`/`measureText` use `D.font_display` or `D.font_mono` only
- [ ] Body ≥ w*0.009, headline ≥ w*0.022, and nothing exceeds canvas bounds
