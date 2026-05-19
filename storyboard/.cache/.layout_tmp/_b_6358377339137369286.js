
// REPLACE bullet sub-scene transition (rule 09 Layer 1 / Layer 4 master).
// Backdrop fades to opaque D.bg over ~10 frames (0.33s @ 30fps) to hide the
// prior bullet's content. Content fades in over the same window so the visual
// is a clean cross-fade — no instant pop. Window matches MasterComposition
// inter-scene fade for consistent rhythm at every transition (sub-scene AND
// scene boundaries).
const __replaceBgOp = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const __replaceContentOp = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
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

const __mainEl = _scnCard({ borderColor: D.cyan, fadeIn,
  width: Math.round(width * 0.55), height: Math.round(height * 0.40),
  top: Math.round(height * 0.30),
  children: [
    _scnTitle('CLAUDE VERIFY', D.cyan),
    _scnLine('+$0.18  +8s  — fact-check pass', D.cyan, Math.round(width * 0.022), 900),
    _scnLine('Removed 1 fabricated citation', D.green),
    _scnLine('VERIFIED ✓', D.green, Math.round(width * 0.024), 900),
  ]
});
const __mainWrap = React.createElement('div', {style: {position:'absolute', inset:0, opacity: __replaceContentOp, zIndex: 1}}, __mainEl);
return React.createElement(React.Fragment, null, __replaceBackdrop, __mainWrap);
