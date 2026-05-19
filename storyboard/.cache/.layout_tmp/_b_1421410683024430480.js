
const __replaceBgOp = interpolate(frame, [0, 3], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const __replaceBackdrop = React.createElement('div', {
  style: {
    position:'absolute', inset: 0,
    backgroundColor: D.bg, opacity: __replaceBgOp,
    zIndex: 0, pointerEvents: 'none'
  }
});

// Generic centered card. Children inside use flex column with gap.
function _scnCard(opts){
  const { children, borderColor, fadeIn, padding, width: cardW, height: cardH, top, gap } = opts;
  const W = cardW || Math.round(width * 0.80);
  const H = cardH || Math.round(height * 0.65);
  const X = Math.round((width - W) / 2);
  const Y = top !== undefined ? top : Math.round((height - H) / 2);
  return React.createElement('div', {
    style:{
      position:'absolute', left: X, top: Y, width: W, height: H,
      backgroundColor: D.surface,
      border: '3px solid ' + (borderColor || D.amber),
      borderRadius: 12,
      padding: padding !== undefined ? padding : 48,
      boxSizing: 'border-box',
      opacity: fadeIn,
      boxShadow: '0 0 80px ' + D.bg,
      display:'flex', flexDirection:'column', gap: gap !== undefined ? gap : 22,
      overflow: 'hidden'
    }
  }, children);
}
function _scnTitle(text, color, fs){
  return React.createElement('div', {
    style:{
      fontFamily: D.font_display, fontWeight: 900,
      fontSize: fs || Math.round(width * 0.030),
      color: color || D.amber, letterSpacing: 2
    }
  }, text);
}
function _scnSubtitle(text, color, fs){
  return React.createElement('div', {
    style:{
      fontFamily: D.font_mono, fontSize: fs || Math.round(width * 0.014),
      color: color || D.text_dim, letterSpacing: 1
    }
  }, text);
}
function _scnLine(text, color, fs, weight){
  return React.createElement('div', {
    style:{
      fontFamily: D.font_mono, fontSize: fs || Math.round(width * 0.018),
      color: color || D.text, fontWeight: weight || 700, letterSpacing: 1
    }
  }, text);
}
function _scnPill(text, color){
  return React.createElement('span', {
    style:{
      display:'inline-block',
      padding: '6px 14px', borderRadius: 999,
      border: '2px solid ' + color, color,
      fontFamily: D.font_mono, fontSize: Math.round(width * 0.014),
      fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap'
    }
  }, text);
}
function _scnRow(children, gap){
  return React.createElement('div', {
    style:{ display:'flex', flexDirection:'row', gap: gap || 16, alignItems:'center', flexWrap: 'wrap' }
  }, children);
}
function _scnFadeIn(){
  return interpolate(frame, [0, 14], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
}
function _scnTypeText(text, startFrame, cps){
  const visChars = Math.max(0, Math.floor((frame - (startFrame || 0)) * (cps || 1.4)));
  return text.slice(0, Math.min(visChars, text.length));
}

const fadeIn = _scnFadeIn();

function mug(title, color, stats){
  return React.createElement('div', {
    style:{ width: '40%', backgroundColor: D.surface, border: '3px solid ' + color,
            borderRadius: 12, padding: 24, display:'flex', flexDirection:'column', gap: 10 }
  },
    React.createElement('div', { style:{
      backgroundColor: color, color: D.white, padding: 8,
      fontFamily: D.font_mono, fontSize: 14, letterSpacing: 2, fontWeight: 900
    }}, title),
    ...stats.map((s, i) => _scnLine(s.text, s.color))
  );
}
const __mainEl = React.createElement('div', {
  style:{ position:'absolute', inset:0, opacity: fadeIn,
          display:'flex', alignItems:'center', justifyContent:'center', gap: 32, padding: 48 }
},
  mug('GPT-5.5 — BOOKING #2026-VB-031', D.violet, [
    {text:'HALLUCINATION: 86%', color: D.red},
    {text:'BUSINESS ETHICS: CLEAN ✓', color: D.green},
    {text:'REFUNDS HONORED: 100%', color: D.green},
    {text:'DECEPTION COUNT: 0', color: D.green}
  ]),
  mug('CLAUDE — BOOKING #2026-VB-046', D.cyan, [
    {text:'HALLUCINATION: 36%', color: D.green},
    {text:'BUSINESS ETHICS: LIED ✗', color: D.red},
    {text:'REFUNDS HONORED: 71%', color: D.red},
    {text:'DECEPTION COUNT: 4', color: D.red}
  ])
);
return React.createElement(React.Fragment, null, __replaceBackdrop, __mainEl);
