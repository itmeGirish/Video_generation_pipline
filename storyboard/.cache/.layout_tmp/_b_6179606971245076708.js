
// Near-instant cut (3 frames = 100ms). Slower fades create visible
// transition-overlap with the prior bullet — the script's "fade" is supposed
// to clear the canvas, not blend two metaphors together.
const __replaceBgOp = interpolate(frame, [0, 3], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const __replaceBackdrop = React.createElement('div', {
  style: {
    position:'absolute', inset: 0,
    backgroundColor: D.bg, opacity: __replaceBgOp,
    zIndex: 0, pointerEvents: 'none'
  }
});

const paths = [
  {color: D.cyan,   x1: 0.08, y1: 0.78, x2: 0.32, y2: 0.22, label: 'ACCURACY → CLAUDE', start: 0},
  {color: D.violet, x1: 0.36, y1: 0.78, x2: 0.64, y2: 0.22, label: 'SPEED → GPT-5.5',    start: 6},
  {color: D.amber,  x1: 0.68, y1: 0.78, x2: 0.92, y2: 0.22, label: 'BOTH → PIPELINE',    start: 12},
];

const labelFS = Math.round(width * 0.022);
const PATH_FRAMES = 12;
const LABEL_DELAY = 4;
const LABEL_CPS = 2.0;

function pathEl(p, i){
  const localF = frame - p.start;
  const sp = spring({frame: Math.max(0, localF), fps, config:{damping:14}, durationInFrames: PATH_FRAMES});
  const x1 = p.x1 * width, y1 = p.y1 * height;
  const x2 = p.x2 * width, y2 = p.y2 * height;
  const cx = (x1+x2)/2, cy = (y1+y2)/2;
  const len = Math.hypot(x2-x1, y2-y1);
  const ang = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
  const visible = len * sp;

  const labelStart = p.start + LABEL_DELAY;
  const visibleChars = Math.max(0, Math.floor((frame - labelStart) * LABEL_CPS));
  const visibleLabel = p.label.slice(0, Math.min(visibleChars, p.label.length));

  return React.createElement(React.Fragment, {key: i},
    React.createElement('div', {
      style:{
        position:'absolute', left: x1, top: y1,
        width: visible, height: 6,
        backgroundColor: p.color,
        boxShadow: '0 0 28px ' + p.color + ', 0 0 8px ' + p.color,
        transform: 'rotate(' + ang + 'deg)',
        transformOrigin: 'left center',
        borderRadius: 3
      }
    }),
    React.createElement('div', {
      style:{
        position:'absolute', left: cx - 280, top: cy - labelFS - 32, width: 560,
        textAlign: 'center',
        fontFamily: D.font_mono, fontWeight: 900, fontSize: labelFS,
        color: p.color, letterSpacing: 3,
        textShadow: '0 0 16px ' + p.color + '80'
      }
    }, visibleLabel)
  );
}

const __mainEl = React.createElement('div', {style:{position:'absolute', inset:0}},
  paths.map(pathEl)
);
return React.createElement(React.Fragment, null, __replaceBackdrop, __mainEl);
