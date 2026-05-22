const NARRATION_TEXT = "<pause 0.2s> Higher setting. <pause 0.2s> Worse results.";

const w = width, h = height;
const cL = Math.round(w * 0.14), cR = Math.round(w * 0.86);
const cT = Math.round(h * 0.22), cB = Math.round(h * 0.80);
const cW = cR - cL, cH = cB - cT;
const yMin = 47.5, yMax = 50.5;
const xOfIdx = function(i) { return cL + Math.round(i * cW / 2); };
const yOfVal = function(v) { return cB - Math.round((v - yMin) / (yMax - yMin) * cH); };
const pts = [
  {label:'LOW',    val:49.6, col:D.green},
  {label:'MEDIUM', val:48.6, col:D.amber},
  {label:'HIGH',   val:48.1, col:D.red},
];

// Static chart base (fully revealed — no animation)
const titleEl = React.createElement('div', {style:{
  position:'absolute', left:cL, top:Math.round(h*0.07),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.010), fontWeight:'700'
}}, 'GPT-5 ACCURACY — SIMPLE TASKS');

const gridLines = [48, 49, 50].map(function(v) {
  return React.createElement('div', {key:v, style:{
    position:'absolute', left:cL, top:yOfVal(v), width:cW, height:1, backgroundColor:D.surface
  }});
});

const yLabels = [48, 49, 50].map(function(v) {
  return React.createElement('div', {key:v, style:{
    position:'absolute', left:cL - Math.round(w*0.055), top:yOfVal(v) - Math.round(h*0.012),
    color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008)
  }}, v + '%');
});

const xLabels = pts.map(function(pt, i) {
  return React.createElement('div', {key:pt.label, style:{
    position:'absolute', left:xOfIdx(i) - 35, top:cB + Math.round(h*0.02),
    width:70, textAlign:'center',
    color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.009)
  }}, pt.label);
});

const lineEls = [0, 1].map(function(i) {
  const x1 = xOfIdx(i), y1 = yOfVal(pts[i].val);
  const x2 = xOfIdx(i+1), y2 = yOfVal(pts[i+1].val);
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.round(Math.sqrt(dx*dx + dy*dy));
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return React.createElement('div', {key:i, style:{
    position:'absolute', left:x1, top:y1 - 1,
    width:len, height:2, backgroundColor:D.red,
    transform:'rotate('+angle+'deg)', transformOrigin:'left center',
  }});
});

const dotEls = pts.map(function(pt, i) {
  const x = xOfIdx(i), y = yOfVal(pt.val);
  return React.createElement(React.Fragment, {key:pt.label},
    React.createElement('div', {style:{
      position:'absolute', left:x-8, top:y-8, width:16, height:16,
      borderRadius:'50%', backgroundColor:pt.col,
    }}),
    React.createElement('div', {style:{
      position:'absolute', left:x-32, top:y-Math.round(h*0.07), width:64, textAlign:'center',
      color:pt.col, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.013),
    }}, pt.val+'%')
  );
});

const sourceEl = React.createElement('div', {style:{
  position:'absolute', right:Math.round(w*0.04), bottom:Math.round(h*0.06),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.007)
}}, 'FutureSearch — GPT-5, Feb 2026');

// Animated arrows on top of static chart
const spCost = spring({frame: frame, fps, config:{damping:8}});
const arrowH = Math.round(cH * 0.38);
const arrowX = Math.round(cR + w * 0.02);
const costArrow = React.createElement('div', {style:{
  position:'absolute', left:arrowX,
  top: Math.round(cB - arrowH * spCost),
  display:'flex', flexDirection:'column', alignItems:'center',
  opacity: spCost,
}},
  React.createElement('div', {style:{
    color:D.amber, fontFamily:D.font_mono, fontSize:Math.round(w*0.022), lineHeight:1
  }}, '↑'),
  React.createElement('div', {style:{
    color:D.amber, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700',
    textAlign:'center', width:80, marginTop:4
  }}, 'COST\n+56%')
);

const spAcc = spring({frame: frame - 6, fps, config:{damping:8}});
const accArrowX = Math.round(cL - w * 0.09);
const accArrow = React.createElement('div', {style:{
  position:'absolute', left:accArrowX - 30,
  top: Math.round(cT + arrowH * 0.1),
  display:'flex', flexDirection:'column', alignItems:'center',
  opacity: spAcc,
}},
  React.createElement('div', {style:{
    color:D.red, fontFamily:D.font_mono, fontSize:Math.round(w*0.010), fontWeight:'700',
    textAlign:'center', width:90
  }}, 'ACCURACY\n−1.5\nPOINTS'),
  React.createElement('div', {style:{
    color:D.red, fontFamily:D.font_mono, fontSize:Math.round(w*0.022), lineHeight:1, marginTop:4
  }}, '↓')
);

return [titleEl].concat(gridLines).concat(yLabels).concat(xLabels).concat(lineEls).concat(dotEls).concat([sourceEl, costArrow, accArrow]);
