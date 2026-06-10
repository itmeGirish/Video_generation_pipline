---
name: vg-code-motion-bank
description: AUTHOR-TIME motion-design pattern bank modeled on top technical-explainer channels (the commitlog house style). The ONE principle — scaffold → fill with value-driven motion → payoff — plus copy-paste code for the signature builds (scaffold-then-fill, value-growth + synced counter, count-up number, staggered fill, state-change recolor+pulse, comparison into reserved space, payoff-lands-last, persistent reference card, curve draw). Use WHILE writing a data/diagram bullet so the motion reads as professional "data settling into place." Grounded in remotion timing.md/sequencing.md + vg-code-animations/timing/sequencing.
---

# Motion-design bank — "scaffold → fill → payoff"

The house style of premium technical explainers: restrained, value-driven, confident.
**One principle:** draw the SCAFFOLD first (container/axes/track/empty grid + title), then
animate the DATA into it with eased value motion and counting numbers, then land a PAYOFF
line last. Feel = `Easing.out(Easing.cubic)`, numbers counting, gentle springs — never
flashy. Nothing freezes (hold-alive breathe/pulse on held elements).

## Topic-agnostic — the patterns are universal, the data is swappable
These are NOT about tokens/caches. Map any topic to a pattern:

| Your beat is about… | Pattern |
|---|---|
| a quantity growing/shrinking (cost, users, memory, speed) | P2 value-growth + counter |
| a breakdown / what-it's-made-of (a formula, a budget, a bill) | P10 formula-fill / stacked build |
| a sequence / process / pipeline (steps, requests, stages) | P4 staggered fill + P11 linked-highlight |
| before/after or A vs B (old vs new, us vs them) | P6 comparison into reserved space |
| a state flip good→bad (works→breaks, valid→invalid, safe→leaked) | P5 recolor + pulse |
| a conclusion / takeaway | P7 payoff lands last |
| a constant the viewer must keep in mind | P8 persistent reference card |
| a trend over time / a curve | P9 line draws into axes |

Example (non-token): "a startup burns its runway" → P1 scaffold a money bar + months axis →
P2 the bar DRAINS while a `$1.2M → $0` counter falls (ease-out) → P5 it turns red near zero +
pulses → P7 payoff "11 months left." Same code, different labels.

## P1 — Scaffold-then-fill (reserve space first)
```js
// scaffold appears 0→8f: the empty column/track/axes/title — reserve ALL space now
const scaffold = interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'});
// data fills AFTER the scaffold is up (starts ~frame 8)
const fill = interpolate(frame,[8, durationInFrames*0.55],[0,1],
  {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:Easing.out(Easing.cubic)});
```

## P2 — Value-growth + SYNCED counter (the core build)
```js
// ONE progress drives BOTH the bar height AND the displayed number → they move together
const FINAL = 320;                                  // e.g. GB
const p = interpolate(frame,[8, durationInFrames*0.55],[0,1],
  {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:Easing.out(Easing.cubic)});
const barH   = Math.round(maxH * p);                // bar grows
const shown  = Math.round(FINAL * p);              // number counts up in sync
// render: a D.red column of height barH + a label `${shown} GB`
```

## P3 — Count-up number (incl. the "X to Y" dual count)
```js
const a = Math.round(interpolate(frame,[10,durationInFrames*0.5],[3,80],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)}));
const b = Math.round(interpolate(frame,[10,durationInFrames*0.5],[0,92],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)}));
// label: `${a} to ${b}%`  → reads "80 to 92%" as it settles
```

## P4 — Staggered fill (bars / cells / token boxes one-by-one)
```js
const cells = DATA.map((d,i)=>{
  const g = spring({frame:frame-(10+i*4), fps, config:{damping:20,stiffness:200}}); // per-cell delay
  return React.createElement('div',{key:i,style:{opacity:g, transform:`scale(${0.6+0.4*g})`,
    backgroundColor:d.cached?D.green:D.surface, /* … */}}, d.label);
});
```

## P5 — State-change recolor + pulse (e.g. cache invalidation)
```js
const flip = durationInFrames*0.45;                 // the moment state changes
const pulse = 0.6+0.4*Math.abs(Math.sin(frame*0.18));
const color = (i>=insertAt && frame>=flip) ? D.red : D.green;
const op    = (i>=insertAt && frame>=flip) ? pulse : 1;   // changed cells keep pulsing (alive)
```

## P6 — Comparison slides into RESERVED space (after the first lands)
```js
// left gap was empty on purpose; the compare bar enters once the hero has landed
const cmp = spring({frame:frame-Math.round(durationInFrames*0.55), fps, config:{damping:18}});
const cmpX = interpolate(cmp,[0,1],[Math.round(-W*0.15),0]);   // slide in from left
const cmpH = Math.round(maxH*0.44*cmp);                        // grows to its (smaller) value
```

## P7 — Payoff lands LAST (the takeaway pill/caption)
```js
const payoff = spring({frame:frame-Math.round(durationInFrames*0.8), fps, config:{damping:14}});
const payY = interpolate(payoff,[0,1],[Math.round(H*0.04),0]);
// a pill bottom-center: `≈ 3.2x cheaper` — opacity:payoff, transform:`translateY(${payY}px)`
```

## P8 — Persistent reference card (breathes the whole scene)
```js
const ref = 1 + 0.015*Math.sin(frame*0.1);          // never frozen
// a small static card (e.g. "2.5 MB / per token") with transform:`scale(${ref})` — context anchor
```

## P9 — Curve / line draw into axes
```js
const draw = interpolate(frame,[12,durationInFrames*0.7],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
// svg path with strokeDasharray=LEN, strokeDashoffset=LEN*(1-draw)  → the line draws on
```

## P10 — Formula / breakdown fill (terms populate, then collapse to result)
```js
// a formula's terms appear one-by-one, then the whole thing collapses into its result
const terms = ['2','80','64','128','N','P'];          // any breakdown: factors, line items, parts
const shownTerm = (i)=> spring({frame:frame-(10+i*6), fps, config:{damping:20,stiffness:200}});
// each term: opacity:shownTerm(i), transform:`scale(${0.6+0.4*shownTerm(i)})`
const collapse = interpolate(frame,[durationInFrames*0.55,durationInFrames*0.7],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp'});            // formula fades → result card grows in
// result card opacity:collapse, scale: interpolate(collapse,[0,1],[0.8,1])
```

## P11 — Linked highlight (activating A lights up related B)
```js
// when a step/panel goes active, a RELATED element elsewhere highlights too (cause across panels)
const active = frame >= durationInFrames*0.4;          // step becomes active
const panelGlow = active ? (0.6+0.4*Math.abs(Math.sin(frame*0.15))) : 0;   // the panel pulses
// the linked element (a row/label elsewhere) gets: opacity: active?1:0.3, borderColor: active?D.amber:D.surface
```

## The beat timeline (how to assemble)
```
0.00–0.10  scaffold in (container/axes/track/title)        P1
0.10–0.55  hero value grows + counter ticks (ease-out)     P2/P3, staggered if multi  P4
0.45       state change recolor+pulse (if any)             P5
0.55–0.75  comparison slides into reserved space           P6
0.80–0.95  payoff pill/caption lands                       P7
whole beat persistent reference card breathes              P8
```

## Before you write, confirm
- [ ] Scaffold drawn first; all space reserved up front (no mid-beat reflow/jump)
- [ ] Hero value GROWS with a SYNCED counting number, `Easing.out(Easing.cubic)`
- [ ] Multi-element parts stagger (per-index delay), one hero leads
- [ ] State changes recolor AND keep a pulse (changed elements stay alive)
- [ ] Comparison enters pre-reserved space AFTER the hero lands (not at frame 0)
- [ ] A payoff line lands last (~0.8 of the beat)
- [ ] A persistent reference/context element breathes; nothing freezes
- [ ] **DENSITY (non-negotiable):** numbers COUNT up (never just appear); a scaffold is drawn
      first; every element is labeled (tiny uppercase mono); the canvas is FILLED (reference
      card / KPI chips / axis / gridlines) — no big empty regions; something moves the whole beat.
      A thin, sparse, static-after-growth frame reads amateur and fails `vg-quality-animations`.
