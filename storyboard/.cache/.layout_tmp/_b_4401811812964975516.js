
const cardCY_bottom = Math.round(height * 0.15) + Math.round(height * 0.55);
const timerY = cardCY_bottom + 24;
const iconSize = 48;
const timerFS = Math.round(width * 0.040);
const logoFS = Math.round(width * 0.014);

const op = interpolate(frame, [0, 14], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const sp = spring({frame, fps, config:{damping:8}, durationInFrames: 16});
const sc = interpolate(sp, [0, 1], [0.6, 1.0]);

// Hard-cut-to-black at end of bullet (last 8 frames) — script: "Hard cut to black"
const hardCutOp = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [0, 1],
  {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const timer = React.createElement('div', {
  style:{
    position:'absolute', left: 0, right: 0, top: timerY,
    display:'flex', justifyContent:'center', alignItems:'center', gap: 20,
    opacity: op,
    transform: 'scale(' + sc + ')',
    transformOrigin: 'center center'
  }
},
  React.createElement('div', {
    style:{
      width: iconSize, height: iconSize,
      border: '3px solid ' + D.amber, borderRadius: '50%',
      display:'flex', alignItems:'center', justifyContent:'center',
      color: D.amber, fontWeight: 900, fontSize: 26
    }
  }, '◷'),
  React.createElement('span', {
    style:{
      fontFamily: D.font_display, fontWeight: 900, fontSize: timerFS,
      color: D.amber, letterSpacing: 4
    }
  }, '08:00')
);

// Channel logo — text mark at bottom (no asset on disk)
const channelLogo = React.createElement('div', {
  style:{
    position:'absolute', left: 0, right: 0, bottom: 30, textAlign:'center',
    fontFamily: D.font_mono, fontWeight: 900, fontSize: logoFS,
    color: D.text_dim, letterSpacing: 8, opacity: op
  }
},
  React.createElement('span', {style:{color: D.cyan}}, '◢ '),
  React.createElement('span', {style:{color: D.text}}, 'AI ROUTING'),
  React.createElement('span', {style:{color: D.violet}}, ' ◣')
);

const hardCut = React.createElement('div', {
  style:{
    position:'absolute', inset: 0, backgroundColor: D.bg,
    opacity: hardCutOp, pointerEvents: 'none', zIndex: 999
  }
});

return React.createElement('div', {style:{position:'absolute', inset:0}},
  timer, channelLogo, hardCut
);
