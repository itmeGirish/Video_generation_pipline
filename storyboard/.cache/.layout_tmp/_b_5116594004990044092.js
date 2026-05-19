
const cardY = Math.round(height * 0.18);
const cardW = Math.round(width * 0.30);
const leftX = Math.round(width * 0.04);

const iconBoxSize = 80;
const labelFS = Math.round(width * 0.013);

const labels = ['code', 'drafts', 'agents', 'fact-checks'];
function _flashFor(i){
  const w = labels[i];
  const tries = (w === 'fact-checks') ? ['fact-checks', 'fact'] : [w];
  for (const t of tries){
    const f = findWord(t);
    if (f !== null) return f;
  }
  // Fallback if Whisper missed the word
  return [10, 22, 34, 46][i];
}
const flashStart = [_flashFor(0), _flashFor(1), _flashFor(2), _flashFor(3)];

function iconSvg(kind, color){
  if (kind === 'code'){
    return React.createElement('svg', {viewBox:'0 0 100 100', width: 48, height: 48},
      React.createElement('polyline', {points:'35,30 15,50 35,70', fill:'none', stroke: color, strokeWidth: 8, strokeLinecap:'round', strokeLinejoin:'round'}),
      React.createElement('polyline', {points:'65,30 85,50 65,70', fill:'none', stroke: color, strokeWidth: 8, strokeLinecap:'round', strokeLinejoin:'round'})
    );
  }
  if (kind === 'doc'){
    return React.createElement('svg', {viewBox:'0 0 100 100', width: 48, height: 48},
      React.createElement('path', {d:'M 25 15 L 70 15 L 80 25 L 80 85 L 25 85 Z', fill:'none', stroke: color, strokeWidth: 6, strokeLinejoin:'round'}),
      React.createElement('line', {x1:35, y1:42, x2:70, y2:42, stroke: color, strokeWidth: 4, strokeLinecap:'round'}),
      React.createElement('line', {x1:35, y1:55, x2:70, y2:55, stroke: color, strokeWidth: 4, strokeLinecap:'round'}),
      React.createElement('line', {x1:35, y1:68, x2:60, y2:68, stroke: color, strokeWidth: 4, strokeLinecap:'round'})
    );
  }
  if (kind === 'robot'){
    return React.createElement('svg', {viewBox:'0 0 100 100', width: 48, height: 48},
      React.createElement('line', {x1:50, y1:8, x2:50, y2:20, stroke: color, strokeWidth: 5, strokeLinecap:'round'}),
      React.createElement('circle', {cx:50, cy:8, r:4, fill: color}),
      React.createElement('rect', {x:20, y:22, width:60, height:55, rx:8, fill:'none', stroke: color, strokeWidth: 6}),
      React.createElement('circle', {cx:38, cy:42, r:5, fill: color}),
      React.createElement('circle', {cx:62, cy:42, r:5, fill: color}),
      React.createElement('rect', {x:36, y:58, width:28, height:6, rx:3, fill: color}),
      React.createElement('line', {x1:30, y1:88, x2:70, y2:88, stroke: color, strokeWidth: 6, strokeLinecap:'round'})
    );
  }
  if (kind === 'mag'){
    return React.createElement('svg', {viewBox:'0 0 100 100', width: 48, height: 48},
      React.createElement('circle', {cx:42, cy:42, r:24, fill:'none', stroke: color, strokeWidth: 7}),
      React.createElement('line', {x1:60, y1:60, x2:84, y2:84, stroke: color, strokeWidth: 8, strokeLinecap:'round'})
    );
  }
}
const iconKinds = ['code', 'doc', 'robot', 'mag'];

function makeIconCell(i){
  const stagger = i * 2;
  const sp = spring({frame: Math.max(0, frame - stagger), fps, config:{damping:12}, durationInFrames: 12});
  const op = interpolate(sp, [0, 1], [0, 1]);
  const sc = interpolate(sp, [0, 1], [0.6, 1.0]);
  const flashF = flashStart[i];
  const flashing = frame >= flashF && frame < flashF + 10;
  const color = flashing ? D.violet : D.cyan;
  const glow = flashing
    ? '0 0 16px ' + D.violet + ', 0 0 6px ' + D.violet
    : '0 0 8px ' + D.cyan + '60';

  return React.createElement('div', {
    key: i,
    style:{
      display:'flex', flexDirection:'column', alignItems:'center', gap: 6,
      opacity: op,
      transform: 'scale(' + sc + ')'
    }
  },
    React.createElement('div', {
      style:{
        width: iconBoxSize, height: iconBoxSize,
        border: '3px solid ' + color, borderRadius: 14,
        backgroundColor: D.surface,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: glow
      }
    }, iconSvg(iconKinds[i], color)),
    React.createElement('span', {
      style:{
        fontFamily: D.font_mono, fontSize: labelFS,
        color: flashing ? D.violet : D.text_dim,
        fontWeight: flashing ? 900 : 700, letterSpacing: 1
      }
    }, labels[i])
  );
}

// Section wrapper — positions the icon row above LEFT card.
// Inside the wrapper: flex row with gap, no absolute positioning.
const rowDim = interpolate(frame, [100, 120], [1.0, 0.35], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const rowY = Math.max(28, cardY - iconBoxSize - 50);  // sit above LEFT card

return React.createElement('div', {
  style:{
    position:'absolute',
    left: leftX, top: rowY,
    width: cardW,                          // ALIGNED with LEFT card width (per script)
    display:'flex', justifyContent:'space-around', alignItems:'center',
    opacity: rowDim
  }
}, [0,1,2,3].map(makeIconCell));
