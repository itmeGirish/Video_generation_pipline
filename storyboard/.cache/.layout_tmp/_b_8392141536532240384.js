
const __replaceBgOp = interpolate(frame, [0, 3], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const __replaceBackdrop = React.createElement('div', {
  style: {
    position:'absolute', inset: 0,
    backgroundColor: D.bg, opacity: __replaceBgOp,
    zIndex: 0, pointerEvents: 'none'
  }
});

const cardW = Math.round(width * 0.70);
const cardH = Math.round(height * 0.55);
const cardX = Math.round((width - cardW) / 2);
const cardY = Math.round(height * 0.15);

const headerFS = Math.round(width * 0.032);
const lineFS = Math.round(width * 0.022);

const items = [
  'Which model for which task',
  'The two-model pipeline ($0.24 vs $0.95)',
  'Copy-paste routing code',
  'When to use NEITHER'
];

function rowEl(i){
  const startCheck = 6 + i * 8;
  const startType = startCheck + 4;
  const sp = spring({frame: Math.max(0, frame - startCheck), fps, config:{damping:8}, durationInFrames: 10});
  const checkScale = interpolate(sp, [0, 1], [1.4, 1.0]);
  const checkOp = interpolate(sp, [0, 0.4], [0, 1]);
  const visChars = Math.max(0, Math.floor((frame - startType) * 1.6));
  const visText = items[i].slice(0, Math.min(visChars, items[i].length));

  return React.createElement('div', {
    key: i,
    style:{
      display:'flex', alignItems:'center', gap: 24,
      fontFamily: D.font_display, fontSize: lineFS, fontWeight: 700, color: D.text
    }
  },
    React.createElement('div', {
      style:{
        width: 36, height: 36, flexShrink: 0,
        border: '3px solid ' + D.green, borderRadius: 8,
        display:'flex', alignItems:'center', justifyContent:'center',
        color: D.green, fontWeight: 900, fontSize: 24,
        opacity: checkOp,
        transform: 'scale(' + checkScale + ')'
      }
    }, '✓'),
    React.createElement('span', null, visText)
  );
}

const cardOp = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const __mainEl = React.createElement('div', {
  style:{
    position:'absolute',
    left: cardX, top: cardY, width: cardW, height: cardH,
    backgroundColor: D.surface, border: '3px solid ' + D.amber,
    borderRadius: 12, padding: 56, boxSizing:'border-box',
    opacity: cardOp,
    boxShadow: '0 0 80px ' + D.bg,
    display:'flex', flexDirection:'column', gap: 28
  }
},
  React.createElement('div', {
    style:{
      fontFamily: D.font_display, fontWeight: 900, fontSize: headerFS,
      color: D.amber, letterSpacing: 3
    }
  }, "WHAT YOU'LL LEARN:"),
  ...[0,1,2,3].map(rowEl)
);
return React.createElement(React.Fragment, null, __replaceBackdrop, __mainEl);
