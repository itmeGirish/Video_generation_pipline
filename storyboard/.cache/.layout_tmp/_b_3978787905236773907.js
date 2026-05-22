const NARRATION_TEXT = "Here's the thing nobody in the documentation actually shows you. <pause 0.3s> For simple tasks, higher effort doesn't just waste money \u2014 it produces worse answers. <pause 0.5s> FutureSearch tested the original GPT-5 in early 2026 \u2014 before the newer model dropped. Low effort scored forty-nine point six percent. <pause 0.3s> Medium dropped to forty-eight point six. <pause 0.3s> High fell to forty-eight point one. <pause 0.5s> The cost went up fifty-six percent. <pause 0.2s> The accuracy went down. <pause 0.3s> Watch what happens to the token counter. <pause 6.0s> Why? <pause 0.3s> The model second-guesses its good initial findings. It chases marginal sources and over-qualifies clear answers. More thinking time means more chances to reject the correct one.";

const w = width, h = height;
const cL = Math.round(w * 0.12), cR = Math.round(w * 0.88);
const cT = Math.round(h * 0.22), cB = Math.round(h * 0.82);
const cW = cR - cL, cH = cB - cT;
const barW = Math.round(cW * 0.17);
const barCXs = [
  cL + Math.round(cW * 0.17),
  cL + Math.round(cW * 0.50),
  cL + Math.round(cW * 0.83),
];
const cols = [D.green, D.amber, D.red];
const xLabels = ['LOW', 'MEDIUM', 'HIGH'];
const vals = [49.6, 48.6, 48.1];
const costLabels = ['$0.25', '$0.35', '$0.39'];
const yMin = 46, yMax = 52;
const yOfVal = function(v) { return cB - Math.round((v - yMin) / (yMax - yMin) * cH); };

const bars = vals.map(function(val, i) {
  const barH = Math.round((val - yMin) / (yMax - yMin) * cH);
  return React.createElement('div', {key:'bar-' + i,
    style:{
      position:'absolute',
      left: barCXs[i] - Math.round(barW / 2),
      top: cB - barH,
      width: barW,
      height: barH,
      backgroundColor: cols[i],
      borderRadius: '4px 4px 0 0',
    }
  });
});

const valLabels = vals.map(function(val, i) {
  const barH = Math.round((val - yMin) / (yMax - yMin) * cH);
  return React.createElement('div', {key:'lbl-' + i, style:{
    position:'absolute',
    left: barCXs[i] - 40, top: cB - barH - Math.round(h*0.06),
    width:80, textAlign:'center',
    color: cols[i], fontFamily:D.font_display, fontWeight:'700',
    fontSize: Math.round(w*0.018),
  }}, val + '%');
});

const xLabelEls = barCXs.map(function(cx, i) {
  return React.createElement('div', {key:i, style:{
    position:'absolute', left:cx - 40, top:cB + Math.round(h*0.02),
    width:80, textAlign:'center',
    color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.009)
  }}, xLabels[i]);
});

// Diagonal downward trend arrow across all three bars
const arrowProgress = interpolate(frame, [0, 20], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const ax1 = barCXs[0], ay1 = yOfVal(vals[0]);
const ax2 = barCXs[2], ay2 = yOfVal(vals[2]);
const aDx = ax2 - ax1, aDy = ay2 - ay1;
const aLen = Math.round(Math.sqrt(aDx * aDx + aDy * aDy));
const aAngle = Math.atan2(aDy, aDx) * 180 / Math.PI;
const trendArrow = React.createElement('div', {style:{
  position:'absolute', left:ax1, top:ay1 - 2,
  width: Math.round(aLen * arrowProgress), height:3,
  backgroundColor: D.red,
  transform: 'rotate(' + aAngle + 'deg)',
  transformOrigin: 'left center',
}});

const arrowLabel = React.createElement('div', {style:{
  position:'absolute',
  left: barCXs[1] - 90, top: yOfVal(48.35) - Math.round(h * 0.06),
  color:D.red, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700',
  opacity: arrowProgress,
}}, 'ACCURACY DROPS');

// Cost labels below bars with animated count
const costEls = costLabels.map(function(cost, i) {
  const prog = interpolate(frame, [i * 5, i * 5 + 14], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  return React.createElement('div', {key:'cost-' + i, style:{
    position:'absolute',
    left: barCXs[i] - 40, top: cB + Math.round(h * 0.060),
    width:80, textAlign:'center',
    color: cols[i], fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700',
    opacity: prog,
  }}, cost);
});

// COST +56% badge above HIGH bar
const spBadge = spring({frame: frame - 20, fps, config:{damping:8}});
const costBadge = React.createElement('div', {style:{
  position:'absolute',
  left: barCXs[2] - Math.round(barW * 0.8),
  top: yOfVal(vals[2]) - Math.round(h * 0.11),
  width: Math.round(barW * 1.6),
  textAlign:'center',
  color: D.red, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700',
  opacity: spBadge,
  transform: 'scale(' + (0.5 + 0.5 * spBadge) + ')',
}}, 'COST +56%');

const source = React.createElement('div', {style:{
  position:'absolute', right:Math.round(w*0.04), bottom:Math.round(h*0.06),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.007)
}}, 'FutureSearch — GPT-5, Feb 2026');

return bars.concat(valLabels).concat(xLabelEls).concat([trendArrow, arrowLabel]).concat(costEls).concat([costBadge, source]);
