---
name: vg-code-artifacts
description: AUTHOR-TIME catalog of domain-accurate DIAGRAM artifacts to draw instead of generic shapes — topic-agnostic. Cell grids, tier/hierarchy bars, pipelines, comparison panels, sliders, formula breakdowns, growing/stacked bars, node rails, KPI cards, gauges. Each entry says what it depicts and how to build it from div/SVG primitives with our tokens. Use WHILE choosing/writing a bullet's visual so it depicts the real mechanism (memory pages, storage tiers, a pipeline) — not a vague bar. Grounded in vg-code-vchecks/tokens/motion-bank.
---

# Artifact catalog — draw the real mechanism, not a generic shape

The difference between "dull" and "expert" is depicting the ACTUAL thing. Pick the artifact
that matches the concept, then animate it with `vg-code-motion-bank`. All topic-agnostic —
swap the labels. Build with `div`/SVG primitives + `D.*` tokens (no emoji — SVG icons only).

## TOPIC-AGNOSTIC — map a beat's MEANING to a `Kit` component, then pass THIS topic's data

These artifacts ARE the reusable `Kit` components (`remotion/src/universal/kit.tsx`). They are
**not tied to any topic** — `Kit.BarChart` renders a token cost, a population, a benchmark score,
or a company's runway equally; only the *data you pass* changes. **Never hardcode a topic or draw
bespoke divs** — pick the component by what the beat MEANS, then fill it with this script's values.

| The beat MEANS (any topic)… | Compose this `Kit` component (pass data) |
|---|---|
| a quantity, or A-vs-B amounts | **`Kit.BarChart`** `{rows:[{label,value,color}],max,unit}` |
| a headline metric counting up | **`Kit.KPI`** `{label,to,unit}` |
| the big-number moment | **`Kit.BigStat`** `{value,caption,sub}` |
| saturation / utilization % | **`Kit.Gauge`** `{label,value,max}` |
| items in slots / a matrix / states (good↔bad) | **`Kit.TokenGrid`** `{cells:[{label,state}],cols}` |
| speed/cost/latency layers, a hierarchy | **`Kit.Tiers`** `{tiers:[{name,sub,wFrac,color}]}` |
| a process / flow / stages | **`Kit.Pipeline`** `{stages:[...]}` |
| a tunable tradeoff / setting | **`Kit.Slider`** `{label,min,max,value}` |
| code / config / a diff | **`Kit.CodePanel`** `{title,lines:[{text,color}]}` |
| a persistent constant / unit | **`Kit.RefCard`** `{label,value,sub}` |
| a corner stat | **`Kit.Tag`** `{value,label}` |
| a labelled comparison row | **`Kit.Chip`** `{who,text,x}` |
| scene header (title + subtitle) | **`Kit.Title`** `{title,subtitle}` |
| a ticking value inline | **`Kit.Counter`** `{to,prefix,suffix,decimals}` |

**Same components, ANY topic — the data is the only thing that changes:**
- *Token cost:* `Kit.BarChart{rows:[{'MON',0.30,cyan},{'TUE',3.00,amber}],max:3,unit:'$'}`
- *Startup runway:* `Kit.BarChart{rows:[{'Q1',1.2,...},{'Q2',0.4,...}],max:1.5,unit:'$M'}` + `Kit.Gauge{label:'RUNWAY SPENT',value:73}`
- *Model benchmark:* `Kit.BarChart{rows:[{'GPT',71,...},{'Claude',77,...}],max:100,unit:'%'}` + `Kit.KPI{label:'WIN RATE',to:64,unit:'%'}`
- *AI reasoning:* `Kit.Pipeline{stages:['prompt','branches','evaluate','answer']}` + `Kit.TokenGrid{cells:[…paths with state]}`
- *Memory/cache:* `Kit.Tiers{tiers:[{'HBM','5ns',...},{'SSD','50µs',...}]}` + `Kit.TokenGrid{cells:[…cached/miss]}`

The author's job: read the beat → name what it MEANS → pick the component → pass the data. No
topic logic is baked into the kit or the recipe; it generalizes by construction.

## Build snippets (primitives + tokens)

**Cell grid** (pages / tokens / matrix)
```js
const cell=(label,c)=>React.createElement('div',{style:{width:Math.round(w*0.05),height:Math.round(w*0.05),
  display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:c,borderRadius:Math.round(w*0.004),
  fontFamily:D.font_mono,fontSize:Math.round(w*0.012),color:D.white}},label);
const row=React.createElement('div',{style:{display:'flex',gap:Math.round(w*0.008)}}, ...items.map(...));
```

**Tier bars** (hierarchy FAST→SLOW) — each tier a labeled horizontal bar of decreasing prominence
```js
const tier=(name,latency,wFrac,c)=>React.createElement('div',{style:{display:'flex',alignItems:'center',
  width:Math.round(w*wFrac),height:Math.round(h*0.09),backgroundColor:c,borderRadius:Math.round(w*0.008),
  padding:Math.round(w*0.012),marginBottom:Math.round(h*0.02)}},
  React.createElement('span',{style:{fontFamily:D.font_mono,fontSize:Math.round(w*0.012),color:D.text}}, name+'  '+latency));
```

**Pipeline** (stages + arrows)
```js
const stage=(t)=>React.createElement('div',{style:{/* card */}}, t);
const arrow=React.createElement('div',{style:{fontFamily:D.font_mono,color:D.text_dim}}, '→');
// flex row: stage, arrow, stage, arrow, stage  (stagger each in — vg-code-sequencing)
```

**Slider** (tradeoff)
```js
const knobX=interpolate(val,[min,max],[0,trackW],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
// a thin track div + a knob div at left:knobX + a value pill above the knob
```

**Code panel** (real code / JSON / a diff — syntax-colored, mono)
```js
// a card with a title bar + mono lines; color tokens by role (keyword/string/number/comment)
const tok=(t,c)=>React.createElement('span',{style:{color:c}},t);
const line=(...spans)=>React.createElement('div',{style:{fontFamily:D.font_mono,fontSize:Math.round(w*0.012),
  lineHeight:1.6,whiteSpace:'pre'}}, ...spans);
const panel=React.createElement('div',{style:{backgroundColor:D.surface,borderRadius:Math.round(w*0.01),
  padding:Math.round(w*0.016)}},
  React.createElement('div',{style:{fontFamily:D.font_mono,fontSize:Math.round(w*0.009),color:D.text_dim,
    marginBottom:Math.round(h*0.012)}},'tool_def.json'),               // title bar
  line(tok('"name"',D.cyan), tok(': ',D.text_dim), tok('"search_web"',D.green), tok(',',D.text_dim)),
  line(tok('"type"',D.cyan), tok(': ',D.text_dim), tok('"function"',D.green)));
// reveal: type-on per line (vg-code-sequencing stagger) or fade the panel in; for a DIFF, recolor
// the changed line (motion-bank P5). Keep ≤ ~6 lines — it's a focal artifact, not a file dump.
```
Roles → tokens: keyword `D.cyan` · string `D.green` · number `D.amber` · comment `D.text_dim`.

**Formula breakdown** → see `vg-code-motion-bank` P10 (terms populate → collapse to result).

**Growing/stacked bar, gauge, comparison, KPI card** → `vg-code-motion-bank` P2/P6 + `vg-code-composition` (KPI cards, dashboard).

## Rules
- **Open the real thing in your mind** — a KV page HAS an index + tokens + a hash; a GPU die HAS
  a core grid; a storage tier HAS a latency. Put those real attributes ON the artifact (as labels).
- **Label every part** (tiny uppercase mono) — the deaf-viewer test (see `vg-code-text`).
- **Animate it** with the matching motion pattern — a static artifact still fails the freeze gate.
- **No emoji** — icons are SVG primitives (clock = circle + 2 lines; lock = rect + arc; flag = pole + triangle).

## Before you pick a visual, confirm
- [ ] Composed a **`Kit` component chosen by the beat's MEANING** + passed this topic's data —
      no bespoke hand-built divs, no topic-specific logic (the same component serves any subject)
- [ ] The artifact depicts the REAL mechanism (not a generic bar standing in for it)
- [ ] Its real parts are present + labeled (index, latency, hash, stage name, unit…)
- [ ] A motion pattern from the bank animates it; nothing is static
