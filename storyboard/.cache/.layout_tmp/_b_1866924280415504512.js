const NARRATION_TEXT = "Here's the thing nobody in the documentation actually shows you. <pause 0.3s> For simple tasks, higher effort doesn't just waste money \u2014 it produces worse answers. <pause 0.5s> FutureSearch tested the original GPT-5 in early 2026 \u2014 before the newer model dropped. Low effort scored forty-nine point six percent. <pause 0.3s> Medium dropped to forty-eight point six. <pause 0.3s> High fell to forty-eight point one. <pause 0.5s> The cost went up fifty-six percent. <pause 0.2s> The accuracy went down. <pause 0.3s> Watch what happens to the token counter. <pause 6.0s> Why? <pause 0.3s> The model second-guesses its good initial findings. It chases marginal sources and over-qualifies clear answers. More thinking time means more chances to reject the correct one.";
const NARRATION_TEXT = "Here's the thing nobody in the documentation actually shows you. <pause 0.3s> For simple tasks, higher effort doesn't just waste money \u2014 it produces worse answers. <pause 0.5s> FutureSearch tested the original GPT-5 in early 2026 \u2014 before the newer model dropped. Low effort scored forty-nine point six percent. <pause 0.3s> Medium dropped to forty-eight point six. <pause 0.3s> High fell to forty-eight point one. <pause 0.5s> The cost went up fifty-six percent. <pause 0.2s> The accuracy went down. <pause 0.3s> Watch what happens to the token counter. <pause 6.0s> Why? <pause 0.3s> The model second-guesses its good initial findings. It chases marginal sources and over-qualifies clear answers. More thinking time means more chances to reject the correct one.";

const w = width, h = height;
const backdrop = React.createElement(AbsoluteFill, {
  style: {
    backgroundColor: D.bg,
    opacity: interpolate(frame, [0, 8], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})
  }
});
const tag = React.createElement('div', {style:{
  position:'absolute', top:Math.round(h*0.03), left:Math.round(w*0.03),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008), opacity:0.6
}}, 'S4');

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
const yMin = 46, yMax = 52;
const yOfVal = function(v) { return cB - Math.round((v - yMin) / (yMax - yMin) * cH); };

const title = React.createElement('div', {style:{
  position:'absolute', left:cL, top:Math.round(h*0.07),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
}}, 'EFFORT vs ACCURACY â€” GPT-5 (SIMPLE TASKS)');

const gridLines = [46, 47, 48, 49, 50, 51, 52].map(function(v) {
  return React.createElement('div', {key:v, style:{
    position:'absolute', left:cL, top:yOfVal(v), width:cW, height:1,
    backgroundColor: D.surface
  }});
});

const yLabels = [46, 48, 50, 52].map(function(v) {
  return React.createElement('div', {key:v, style:{
    position:'absolute', left:cL - Math.round(w*0.06), top:yOfVal(v) - Math.round(h*0.012),
    color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008)
  }}, v + '%');
});

const barVals = [49.6, 48.6, 48.1];
const barOutlines = barCXs.map(function(cx, i) {
  const sp = spring({frame: frame - i * 10, fps, config:{damping:20, stiffness:200}});
  return React.createElement('div', {
    key: i,
    style: {
      position:'absolute',
      left: cx - Math.round(barW / 2),
      top: cT,
      width: barW,
      height: cH,
      border: '2px solid ' + cols[i],
      borderRadius: 6,
      opacity: sp,
    }
  });
});

const barFills = barCXs.map(function(cx, i) {
  const sp = spring({frame: frame - i * 15 - 10, fps, config:{damping:14, stiffness:80, mass:1.5}});
  const fillH = Math.round((barVals[i] - yMin) / (yMax - yMin) * cH * sp);
  return React.createElement('div', {
    key: 'fill' + i,
    style: {
      position:'absolute',
      left: cx - Math.round(barW / 2) + 2,
      top: cB - fillH,
      width: barW - 4,
      height: fillH,
      backgroundColor: cols[i] + '44',
      borderRadius: '3px 3px 0 0',
    }
  });
});

const xLabelEls = barCXs.map(function(cx, i) {
  return React.createElement('div', {key:i, style:{
    position:'absolute', left:cx - 40, top:cB + Math.round(h*0.02),
    width:80, textAlign:'center',
    color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.009)
  }}, xLabels[i]);
});

const source = React.createElement('div', {style:{
  position:'absolute', right:Math.round(w*0.04), bottom:Math.round(h*0.06),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.007)
}}, 'FutureSearch â€” GPT-5, Feb 2026');

return [backdrop, tag, title].concat(gridLines).concat(yLabels).concat(barFills).concat(barOutlines).concat(xLabelEls).concat([source]);
