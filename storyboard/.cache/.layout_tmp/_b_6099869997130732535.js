
const __replaceBgOp = interpolate(frame, [0, 3], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const __replaceBackdrop = React.createElement('div', {
  style: {
    position:'absolute', inset: 0,
    backgroundColor: D.bg, opacity: __replaceBgOp,
    zIndex: 0, pointerEvents: 'none'
  }
});

// Use SVG so paths are first-class children of one viewBox; no per-line
// absolute positioning. SVG handles the geometry.
const PATH_FRAMES = 12;
const LABEL_DELAY = 4;
const LABEL_CPS = 2.0;

const paths = [
  {color: D.cyan,   x1: 0.08, y1: 0.78, x2: 0.32, y2: 0.22, label: 'ACCURACY → CLAUDE', start: 0},
  {color: D.violet, x1: 0.36, y1: 0.78, x2: 0.64, y2: 0.22, label: 'SPEED → GPT-5.5',    start: 6},
  {color: D.amber,  x1: 0.68, y1: 0.78, x2: 0.92, y2: 0.22, label: 'BOTH → PIPELINE',    start: 12},
];

const labelFS = Math.round(width * 0.020);

function makePath(p, i){
  const localF = frame - p.start;
  const sp = spring({frame: Math.max(0, localF), fps, config:{damping:14}, durationInFrames: PATH_FRAMES});
  const x1 = p.x1 * width, y1 = p.y1 * height;
  const x2 = p.x2 * width, y2 = p.y2 * height;
  const x2v = x1 + (x2 - x1) * sp;
  const y2v = y1 + (y2 - y1) * sp;
  return React.createElement('line', {
    key: i, x1, y1, x2: x2v, y2: y2v,
    stroke: p.color, strokeWidth: 6, strokeLinecap: 'round',
    style: { filter: 'drop-shadow(0 0 8px ' + p.color + ')' }
  });
}

function makeLabel(p, i){
  const cx = (p.x1 + p.x2) / 2 * width;
  const cy = (p.y1 + p.y2) / 2 * height - labelFS - 28;
  const labelStart = p.start + LABEL_DELAY;
  const visChars = Math.max(0, Math.floor((frame - labelStart) * LABEL_CPS));
  const visText = p.label.slice(0, Math.min(visChars, p.label.length));
  return React.createElement('div', {
    key: 'L' + i,
    style:{
      position:'absolute', left: cx - 280, top: cy, width: 560,
      textAlign:'center',
      fontFamily: D.font_mono, fontWeight: 900, fontSize: labelFS,
      color: p.color, letterSpacing: 3,
      textShadow: '0 0 16px ' + p.color + '80'
    }
  }, visText);
}

const __mainEl = React.createElement('div', {style:{position:'absolute', inset:0}},
  React.createElement('svg', {
    style:{ position:'absolute', inset: 0 }, width, height
  }, paths.map(makePath)),
  paths.map(makeLabel)
);
return React.createElement(React.Fragment, null, __replaceBackdrop, __mainEl);
