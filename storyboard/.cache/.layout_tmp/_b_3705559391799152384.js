
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

function line(n, code, comment){
  return React.createElement('div', {
    style:{ display:'flex', gap: 16, fontFamily: D.font_mono,
            fontSize: Math.round(width * 0.018), whiteSpace: 'pre' }
  },
    React.createElement('span', { style:{ color: D.text_dim, width: 28, textAlign:'right' } }, n),
    React.createElement('span', { style:{ color: D.text } }, code),
    comment ? React.createElement('span', { style:{ color: D.amber } }, '  # ' + comment) : null
  );
}
return _scnCard({ borderColor: D.cyan, fadeIn,
  width: Math.round(width * 0.85), height: Math.round(height * 0.65),
  top: Math.round(height * 0.18),
  children: [
    React.createElement('div', { style:{ display:'flex', gap: 8, alignItems:'center' } },
      React.createElement('div', { style:{width:14, height:14, borderRadius:'50%', backgroundColor: D.red} }),
      React.createElement('div', { style:{width:14, height:14, borderRadius:'50%', backgroundColor: D.amber} }),
      React.createElement('div', { style:{width:14, height:14, borderRadius:'50%', backgroundColor: D.green} }),
      React.createElement('span', { style:{marginLeft: 16, fontFamily: D.font_mono, fontSize: 16, color: D.text_dim} },
        'smart_query.py')
    ),
    line(1, 'def smart_query(question, stakes="high"):', null),
    line(2, '    if stakes == "low":', null),
    line(3, '        return gpt_5_5(question)', 'cheap, fast'),
    line(4, '', null),
    line(5, '    draft = gpt_5_5(question)', '$0.06, 3s'),
    line(6, '    verified = claude_4_7.verify(draft)', '$0.18, 8s'),
    line(7, '    const __mainEl = verified', '$0.24 total'),
  ]
});
const __mainWrap = React.createElement('div', {style: {position:'absolute', inset:0, opacity: __replaceContentOp, zIndex: 1}}, __mainEl);
return React.createElement(React.Fragment, null, __replaceBackdrop, __mainWrap);
