const NARRATION_TEXT = "So here's the answer to the question we opened with. <pause 0.2s> Why do two identical prompts cost completely different amounts? Because someone left the dial on max \u2014 and never checked if it helped. <pause 0.4s> Low for simple tasks. <pause 0.2s> Medium for complex ones. <pause 0.2s> High only when being wrong is expensive. <pause 0.4s> Higher thinking doesn't make the model smarter. It gives the model more time to be wrong \u2014 at a higher price. <pause 0.5s> Get this right and you can cut your reasoning costs by three to five times \u2014 sometimes more. <pause 0.3s> Subscribe \u2014 I'm breaking down one of these settings every week. Next up: tool-use patterns, the other dial most developers ignore.";

const w = width, h = height;
const colW = Math.round(w * 0.34);
const gap = Math.round(w * 0.08);
const totalW = colW * 2 + gap;
const startX = Math.round((w - totalW) / 2);
const barMaxH = Math.round(h * 0.52);
const barTop = Math.round(h * 0.18);
const barBottom = barTop + barMaxH;

const spBefore = spring({frame: frame, fps, config:{damping:12, stiffness:90, mass:2}});
const spAfter = spring({frame: frame - 12, fps, config:{damping:12, stiffness:90, mass:2}});

const beforeH = Math.round(barMaxH * 0.78 * spBefore);
const afterH = Math.round(barMaxH * 0.14 * spAfter);

const beforeBar = React.createElement('div', {style:{
  position:'absolute',
  left: startX, top: barBottom - beforeH,
  width: colW, height: beforeH,
  backgroundColor: D.red,
  borderRadius: '6px 6px 0 0',
}});
const afterBar = React.createElement('div', {style:{
  position:'absolute',
  left: startX + colW + gap, top: barBottom - afterH,
  width: colW, height: afterH,
  backgroundColor: D.green,
  borderRadius: '6px 6px 0 0',
}});

const beforeLabel = React.createElement('div', {style:{
  position:'absolute',
  left: startX, top: barBottom - beforeH - Math.round(h * 0.08),
  width: colW, textAlign:'center',
  color:D.red, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.014),
  opacity: spBefore,
}}, 'ALL TASKS\nAT MAX');
const afterLabel = React.createElement('div', {style:{
  position:'absolute',
  left: startX + colW + gap, top: barBottom - afterH - Math.round(h * 0.08),
  width: colW, textAlign:'center',
  color:D.green, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.014),
  opacity: spAfter,
}}, 'EFFORT\nMATCHED');

const baselineL = React.createElement('div', {style:{
  position:'absolute', left:startX - Math.round(w*0.01), top:barBottom,
  width: totalW + Math.round(w*0.02), height:2, backgroundColor:D.text_dim,
}});

const beforeXLabel = React.createElement('div', {style:{
  position:'absolute', left:startX, top:barBottom + Math.round(h*0.02),
  width:colW, textAlign:'center', color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.009),
}}, 'BEFORE');
const afterXLabel = React.createElement('div', {style:{
  position:'absolute', left:startX + colW + gap, top:barBottom + Math.round(h*0.02),
  width:colW, textAlign:'center', color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.009),
}}, 'AFTER');

const spStamp = spring({frame: frame - 22, fps, config:{damping:8}});
const stamp = React.createElement('div', {style:{
  position:'absolute',
  left: Math.round((w - Math.round(w * 0.72)) / 2),
  top: barBottom + Math.round(h * 0.08),
  width: Math.round(w * 0.72),
  textAlign:'center',
  color: D.green, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700',
  opacity: spStamp, transform: 'scale(' + (0.6 + 0.4 * spStamp) + ')',
}}, 'THREE TO FIVE TIMES CHEAPER — SOMETIMES MORE');

return [beforeBar, afterBar, beforeLabel, afterLabel, baselineL, beforeXLabel, afterXLabel, stamp];
