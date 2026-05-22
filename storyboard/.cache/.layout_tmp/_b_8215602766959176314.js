const NARRATION_TEXT = "When you set effort to high, the model doesn't try harder the way a human would. It generates a hidden scratchpad \u2014 thinking tokens \u2014 before writing its answer. <pause 0.3s> These tokens are invisible to you. <pause 0.2s> But they're billed at full output token rates. A low-effort request might use five hundred thinking tokens. <pause 0.3s> The same request on max effort? <pause 0.3s> Tens of thousands. <pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const panelW = Math.round(w * 0.46);
const panelH = Math.round(h * 0.68);
const panelTop = Math.round(h * 0.16);
const leftX = Math.round(w * 0.02);
const rightX = Math.round(w * 0.52);
const leftMid = leftX + Math.round(panelW / 2);
const rightMid = rightX + Math.round(panelW / 2);

// Redraw left panel shell + header (static)
const leftPanel = React.createElement('div', {style:{
  position:'absolute', left:leftX, top:panelTop, width:panelW, height:panelH,
  backgroundColor:D.surface, borderRadius:8, border:'1px solid ' + D.cyan,
}});
const leftHeader = React.createElement('div', {style:{
  position:'absolute',
  left: leftX + Math.round(w*0.025), top: panelTop + Math.round(h*0.025),
  color:D.cyan, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
}}, 'THINKING SCRATCHPAD');

// Static filled thinking lines in left panel (state carried from B2)
const cTop = panelTop + Math.round(h * 0.08);
const cLeft = leftX + Math.round(w * 0.025);
const lineH = Math.round(h * 0.030);
const lineGap = Math.round(h * 0.008);
const lineW = Math.round(panelW * 0.82);
const staticLines = Array.from({length: 14}, function(_, i) {
  const lineLen = Math.round(lineW * (0.55 + (i % 3) * 0.15));
  return React.createElement('div', {key:'sl'+i, style:{
    position:'absolute', left:cLeft, top:cTop + i*(lineH+lineGap),
    width:lineLen, height:lineH, backgroundColor:D.text_dim, borderRadius:2, opacity:0.5,
  }});
});

// Redraw right panel shell + header (static)
const rightPanel = React.createElement('div', {style:{
  position:'absolute', left:rightX, top:panelTop, width:panelW, height:panelH,
  backgroundColor:D.surface, borderRadius:8, border:'1px solid ' + D.text_dim,
}});
const rightHeader = React.createElement('div', {style:{
  position:'absolute',
  left: rightX + Math.round(w*0.025), top: panelTop + Math.round(h*0.025),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
}}, 'YOUR ANSWER');

// Animated: cyan border activates on right panel
const spBorder = spring({frame, fps, config:{damping:200}});
const borderEl = React.createElement('div', {style:{
  position:'absolute', left:rightX, top:panelTop, width:panelW, height:panelH,
  borderRadius:8, border:'2px solid ' + D.cyan, opacity:spBorder,
}});

// Animated: arrow grows from left panel to right panel
const arrowProgress = interpolate(frame, [8, 28], [0, 1], {extrapolateRight:'clamp'});
const arrowY = panelTop + Math.round(panelH * 0.50);
const arrowStartX = leftMid + Math.round(panelW * 0.50);
const arrowEndX = rightMid - Math.round(panelW * 0.50);
const arrowEl = React.createElement('div', {style:{
  position:'absolute', left:arrowStartX, top:arrowY - 2,
  width:Math.max(0, Math.round((arrowEndX - arrowStartX) * arrowProgress)), height:3,
  backgroundColor:D.cyan,
}});

// Animated: answer lines appear in right panel
const answerLines = ['Analyzing input parameters...','Cross-referencing context...','Generating response.'];
const ansContentTop = panelTop + Math.round(h * 0.09);
const answerEls = answerLines.map(function(txt, i) {
  const sp = spring({frame: frame - i * 10, fps, config:{damping:20, stiffness:200}});
  return React.createElement('div', {key:'a'+i, style:{
    position:'absolute',
    left: rightX + Math.round(panelW * 0.06),
    top: ansContentTop + i * Math.round(h * 0.04),
    color:D.text, fontFamily:D.font_mono, fontSize:Math.round(w*0.009), opacity:sp,
  }}, txt);
});

return [leftPanel, leftHeader].concat(staticLines).concat([rightPanel, rightHeader, borderEl, arrowEl]).concat(answerEls);
