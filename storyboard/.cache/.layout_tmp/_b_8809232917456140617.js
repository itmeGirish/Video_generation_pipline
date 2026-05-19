
const cardW = Math.round(width * 0.28);
const cardH = Math.round(height * 0.42);
const cardY = Math.round(height * 0.18);
const leftX_final = Math.round(width * 0.03);
const rightX_final = Math.round(width * 0.69);

const iconSize = 80;                         // larger, readable
const gap = 28;
const totalW = iconSize * 4 + gap * 3;
const rowCX = leftX_final + cardW / 2;       // centered above LEFT card
const rowX = rowCX - totalW / 2;
const iconY = 44;                             // pinned with breathing room from canvas top
const labelFS = Math.round(width * 0.013);
// Fade the row down once the hero −75% takes over (~B2 local frame 103 = end
// of "fact-checks" word). Keeps context visible but de-emphasises icons so
// hero is the focal point.
const rowDim = interpolate(frame, [100, 120], [1.0, 0.35], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const labels = ['code', 'drafts', 'agents', 'fact-checks'];
// Word-synced flashes via the new findWord binding (Option 2). Falls back to
// evenly-spaced flashes if Whisper didn't transcribe a word.
const _fallback = [10, 22, 34, 46];
function _flashFor(i){
  const w = labels[i];
  // For 'fact-checks' Whisper may transcribe 'fact' + 'checks' separately;
  // try the compound first, then the simpler 'fact' token.
  const tries = (w === 'fact-checks') ? ['fact-checks', 'fact'] : [w];
  for (const t of tries){
    const f = findWord(t);
    if (f !== null) return f;
  }
  return _fallback[i];
}
const flashStart = [_flashFor(0), _flashFor(1), _flashFor(2), _flashFor(3)];

// SVG icons that actually look like what the script asks for
function iconSvg(kind, color, size){
  const s = size, p = size * 0.15;
  if (kind === 'code'){
    return React.createElement('svg', {viewBox:'0 0 100 100', width: s-12, height: s-12},
      React.createElement('polyline', {points:'35,30 15,50 35,70', fill:'none', stroke: color, strokeWidth: 8, strokeLinecap:'round', strokeLinejoin:'round'}),
      React.createElement('polyline', {points:'65,30 85,50 65,70', fill:'none', stroke: color, strokeWidth: 8, strokeLinecap:'round', strokeLinejoin:'round'})
    );
  }
  if (kind === 'doc'){
    return React.createElement('svg', {viewBox:'0 0 100 100', width: s-12, height: s-12},
      React.createElement('path', {d:'M 25 15 L 70 15 L 80 25 L 80 85 L 25 85 Z', fill:'none', stroke: color, strokeWidth: 6, strokeLinejoin:'round'}),
      React.createElement('line', {x1:35, y1:42, x2:70, y2:42, stroke: color, strokeWidth: 4, strokeLinecap:'round'}),
      React.createElement('line', {x1:35, y1:55, x2:70, y2:55, stroke: color, strokeWidth: 4, strokeLinecap:'round'}),
      React.createElement('line', {x1:35, y1:68, x2:60, y2:68, stroke: color, strokeWidth: 4, strokeLinecap:'round'})
    );
  }
  if (kind === 'robot'){
    return React.createElement('svg', {viewBox:'0 0 100 100', width: s-12, height: s-12},
      // antenna
      React.createElement('line', {x1:50, y1:8, x2:50, y2:20, stroke: color, strokeWidth: 5, strokeLinecap:'round'}),
      React.createElement('circle', {cx:50, cy:8, r:4, fill: color}),
      // head
      React.createElement('rect', {x:20, y:22, width:60, height:55, rx:8, fill:'none', stroke: color, strokeWidth: 6}),
      // eyes
      React.createElement('circle', {cx:38, cy:42, r:5, fill: color}),
      React.createElement('circle', {cx:62, cy:42, r:5, fill: color}),
      // mouth
      React.createElement('rect', {x:36, y:58, width:28, height:6, rx:3, fill: color}),
      // ears
      React.createElement('line', {x1:14, y1:42, x2:20, y2:42, stroke: color, strokeWidth: 5, strokeLinecap:'round'}),
      React.createElement('line', {x1:80, y1:42, x2:86, y2:42, stroke: color, strokeWidth: 5, strokeLinecap:'round'}),
      // base
      React.createElement('line', {x1:30, y1:88, x2:70, y2:88, stroke: color, strokeWidth: 6, strokeLinecap:'round'})
    );
  }
  if (kind === 'mag'){
    return React.createElement('svg', {viewBox:'0 0 100 100', width: s-12, height: s-12},
      React.createElement('circle', {cx:42, cy:42, r:24, fill:'none', stroke: color, strokeWidth: 7}),
      React.createElement('line', {x1:60, y1:60, x2:84, y2:84, stroke: color, strokeWidth: 8, strokeLinecap:'round'})
    );
  }
}
const iconKinds = ['code', 'doc', 'robot', 'mag'];

function makeIcon(i){
  const stagger = i * 2;                                        // tight: all in by frame 6+spring
  const sp = spring({frame: Math.max(0, frame - stagger), fps, config:{damping:12}, durationInFrames: 12});
  const op = interpolate(sp, [0, 1], [0, 1]);
  const sc = interpolate(sp, [0, 1], [0.6, 1.0]);
  const flashF = flashStart[i];
  const flashing = frame >= flashF && frame < flashF + 10;
  const color = flashing ? D.violet : D.cyan;
  const glow = flashing
    ? '0 0 16px ' + D.violet + ', 0 0 6px ' + D.violet
    : '0 0 8px ' + D.cyan + '60';
  // flash also pops scale slightly
  const flashScale = flashing ? 1.0 + 0.10 * Math.sin((frame - flashF) * Math.PI / 10) : 1.0;

  return React.createElement('div', {
    key: i,
    style:{
      width: iconSize, height: iconSize,
      border: '3px solid ' + color, borderRadius: 14,
      backgroundColor: D.surface,
      display:'flex', alignItems:'center', justifyContent:'center',
      color, opacity: op,
      transform: 'scale(' + (sc * flashScale) + ')',
      boxShadow: glow
    }
  }, iconSvg(iconKinds[i], color, iconSize));
}

function makeLabel(t, i){
  const flashF = flashStart[i];
  const flashing = frame >= flashF && frame < flashF + 10;
  const color = flashing ? D.violet : D.text_dim;
  return React.createElement('div', {
    key: i,
    style:{
      width: iconSize, textAlign:'center', whiteSpace:'nowrap',
      fontFamily: D.font_mono, fontSize: labelFS, color,
      fontWeight: flashing ? 900 : 700, letterSpacing: 1
    }
  }, t);
}

return React.createElement('div', {style:{position:'absolute', inset:0, opacity: rowDim}},
  React.createElement('div', {
    style:{
      position:'absolute', left: rowX, top: iconY,
      display:'flex', gap: gap, alignItems:'center'
    }
  }, [0,1,2,3].map(makeIcon)),
  React.createElement('div', {
    style:{
      position:'absolute', left: rowX, top: iconY + iconSize + 8,
      display:'flex', gap: gap
    }
  }, labels.map((t, i) => makeLabel(t, i)))
);
