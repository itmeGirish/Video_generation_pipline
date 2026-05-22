const NARRATION_TEXT = "<pause 0.2s> Higher setting. <pause 0.2s> Worse results.";

const w = width, h = height;
const cL = Math.round(w * 0.14), cR = Math.round(w * 0.86);
const cT = Math.round(h * 0.22), cB = Math.round(h * 0.80);
const cW = cR - cL, cH = cB - cT;
const yMin = 47.5, yMax = 50.5;
const xOfIdx = function(i) { return cL + Math.round(i * cW / 2); };
const yOfVal = function(v) { return cB - Math.round((v - yMin) / (yMax - yMin) * cH); };

// Upward amber arrow: COST +56% (right side of chart)
const spCost = spring({frame: frame, fps, config:{damping:8}});
const arrowH = Math.round(cH * 0.38);
const arrowX = Math.round(cR + w * 0.02);
const costArrow = React.createElement('div', {style:{
  position:'absolute',
  left: arrowX,
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

// Downward red arrow: ACCURACY -1.5 POINTS (left side)
const spAcc = spring({frame: frame - 6, fps, config:{damping:8}});
const accArrowX = Math.round(cL - w * 0.09);
const accArrow = React.createElement('div', {style:{
  position:'absolute',
  left: accArrowX - 30,
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

return [costArrow, accArrow];
