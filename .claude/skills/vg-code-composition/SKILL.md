---
name: vg-code-composition
description: AUTHOR-TIME composition recipe modeled on premium technical-explainer channels — topic-agnostic. Lays out a bullet like they do: a persistent title + swapping subtitle, a dashboard (hero + side KPI cards + bottom meters), a persistent reference card in a corner, sub-beats that crossfade within a beat, and element carryover/dock between beats (match-cut continuity). Use WHILE writing a data/diagram bullet to get the "designed, continuous" look. Grounded in vg-code-vchecks (canvas fill) + vg-code-motion-bank + video-generation-conventions.
---

# Composition recipe — the "designed dashboard" look (any topic)

These layouts are universal — swap the labels/data for any subject. Pair with
`vg-code-motion-bank` for the motion.

## 1. Title + swapping subtitle (scene header)
A bold title that NAMES the scene + a tiny uppercase subtitle that says the current sub-beat.
The title holds; the subtitle is what changes as the beat evolves.

**Persistent title across a whole SCENE (multiple bullets) — no format change needed.** A scene's
bullets share ONE title. Since bullets are self-contained (CLAUDE.md), **redraw the SAME scene
title as a STATIC top element in EVERY bullet of that scene** (identical text/position/token),
and use each bullet's own point as the **swapping subtitle**. The viewer sees a fixed title with
an evolving subtitle and visual underneath — the channel's persistent-title look — without any
parser/scene-format change. (The scene's title text comes from the `## SCENE N — "Title"` header.)
```js
const w=width,h=height;
const titleOp=interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'});
const header=React.createElement('div',{style:{position:'absolute',top:Math.round(h*0.05),width:'100%',
  textAlign:'center',opacity:titleOp}},
  React.createElement('div',{style:{fontFamily:D.font_display,fontWeight:700,fontSize:Math.round(w*0.026),color:D.text}},'WHAT THIS SCENE IS'),
  React.createElement('div',{style:{marginTop:Math.round(h*0.008),fontFamily:D.font_mono,fontSize:Math.round(w*0.011),
    color:D.text_dim,letterSpacing:'0.08em',textTransform:'uppercase'}},'current sub-beat label'),
  React.createElement('div',{style:{margin:'0 auto',marginTop:Math.round(h*0.01),width:Math.round(w*0.04),height:Math.round(h*0.004),
    backgroundColor:D.cyan,borderRadius:Math.round(w*0.002)}}));   // colored underline accent (no px literal)
```

## 2. Soft-shadow floating card (the panel unit — reuse everywhere)
```js
const card=(children,extra)=>React.createElement('div',{style:Object.assign({
  backgroundColor:D.surface, borderRadius:Math.round(w*0.012), padding:Math.round(w*0.014),
  boxShadow:'0 '+Math.round(h*0.01)+'px '+Math.round(h*0.03)+'px rgba(0,0,0,0.18)'}, extra||{})}, ...children);
// NOTE: rgba(0,0,0,α) is the ONE sanctioned non-token literal — SHADOWS ONLY. For a colored
// glow use a token (e.g. boxShadow:'0 0 '+Math.round(w*0.01)+'px '+D.cyan). Never hex for fills.
```

## 3. Dashboard layout (hero + side KPI cards + bottom meters)
Fill the canvas with ONE hero visual + 2–3 small KPI cards + a meter row — dense but ranked.
```js
// hero panel left (≥55% width), KPI cards right (stacked), meters along the bottom
const root=React.createElement(AbsoluteFill,{style:{display:'flex',padding:Math.round(w*0.06),
  paddingTop:Math.round(h*0.16),gap:Math.round(w*0.03)}},
  card([/* hero chart/diagram */],{flex:'0 0 '+Math.round(w*0.55)+'px'}),
  React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:Math.round(h*0.03),flex:1}},
    card([/* KPI 1: big number + label */]), card([/* KPI 2 */])));
```
One hero leads (biggest); KPI cards are secondary; meters are tertiary. (V13 satisfied by the hero.)

## 4. Persistent reference card (corner anchor, breathes all scene)
```js
const ref=1+0.015*Math.sin(frame*0.1);
const refCard=React.createElement('div',{style:{position:'absolute',top:Math.round(h*0.16),left:Math.round(w*0.04),
  transform:`scale(${ref})`, /* small card: a constant unit/fact, e.g. "2.5 MB / per token" or "$3 / 1M tok" */}}, /* … */);
```

## 5. Sub-beats WITHIN a beat (crossfade phases)
A long beat shows 2–4 sub-visuals in sequence; each crossfades to the next (title stays).
```js
const phase=(a,b)=>interpolate(frame,[durationInFrames*a,durationInFrames*b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const sub1Op=1-phase(0.30,0.40);      // sub-beat 1 fades OUT at 30–40%
const sub2Op=phase(0.32,0.42);        // sub-beat 2 fades IN (overlap = crossfade)
// render sub1 with opacity:sub1Op, sub2 with opacity:sub2Op
```

## 6. Element carryover / dock (match-cut continuity)
A result from sub-beat 1 SHRINKS and DOCKS to a corner, becoming the reference for sub-beat 2.
```js
const dock=phase(0.30,0.45);
const dx=interpolate(dock,[0,1],[0, Math.round(w*0.42)-Math.round(w*0.04)]);  // center → top-left
const dy=interpolate(dock,[0,1],[0, -(Math.round(h*0.30))]);
const ds=interpolate(dock,[0,1],[1, 0.5]);                                    // shrink to ref size
// the result card: transform:`translate(${dx}px,${dy}px) scale(${ds})` — it travels to the corner and stays
```
> Cross-BULLET carryover: the next bullet must REDRAW the docked card at its settled corner
> position (bullets are self-contained — CLAUDE.md). The dock animates in bullet N; bullet N+1
> shows it already parked.

## 7. EVOLVE — persist the diagram across bullets, animate only the delta (continuity)
The #1 continuity pattern. For ADD beats that continue the SAME object: redraw the anchor diagram
at its **settled state** (no entrance — static, just breathing) and animate **only the change**.
The diagram never re-enters, so the viewer reads it as ONE persistent thing across bullets.
```js
// 1) the anchor diagram — IDENTICAL code/positions every bullet, drawn at settled state (no entrance)
const anchor = buildAnchorDiagram();          // same builder, same coords, bullet-to-bullet
// 2) the delta for THIS bullet only — e.g. the highlight box slides to a new token:
const mv = spring({frame, fps, config:{damping:20,stiffness:200}});
const hiX = interpolate(mv,[0,1],[prevX, newX],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
// 3) swap the subtitle (see §1); optionally recolor a cell (motion-bank P5) or add ONE element
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg}}, header, anchor, highlightAt(hiX), /* one new element */);
```
- The anchor is **byte-identical** bullet-to-bullet → no jump/reflow.
- Only the delta animates: a moving highlight, a recolor (P5), a value tick, one added element, the subtitle.
- Use **ADD** bullets for evolve beats; `[REPLACE]` only when the diagram itself changes.
- Keep the anchor builder in EACH bullet (bullets are self-contained — CLAUDE.md); copy it verbatim.

## Before you write, confirm
- [ ] A title names the scene + a tiny uppercase subtitle names the sub-beat + a color underline
- [ ] Canvas filled: one hero panel (≥55%) + KPI cards + meters (not one lonely element)
- [ ] Panels are soft-shadow floating cards (consistent radius/shadow)
- [ ] A persistent reference card anchors the key constant (breathes)
- [ ] If the beat is long, sub-beats crossfade (title holds, subtitle swaps)
- [ ] A carried result docks to a corner instead of being wiped (continuity, not REPLACE)
