
const timerFS = Math.round(width * 0.040);
const logoFS = Math.round(width * 0.014);

const op = interpolate(frame, [0, 14], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const sp = spring({frame, fps, config:{damping:8}, durationInFrames: 16});
const sc = interpolate(sp, [0, 1], [0.6, 1.0]);
const hardCutOp = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [0, 1],
  {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

// Section wrapper — flex column at the bottom half
const sectionY = Math.round(height * 0.74);
const sectionH = Math.round(height * 0.20);

const timerBlock = React.createElement('div', {
  style:{
    position:'absolute',
    left: 0, top: sectionY, width: width, height: sectionH,
    display:'flex', flexDirection:'column',
    justifyContent:'center', alignItems:'center', gap: 24,
    opacity: op,
    transform: 'scale(' + sc + ')',
    transformOrigin: 'center'
  }
},
  // Timer row (flex)
  React.createElement('div', {
    style:{
      display:'flex', alignItems:'center', gap: 20
    }
  },
    React.createElement('div', {
      style:{
        width: 48, height: 48,
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
  ),
  // Channel logo (flex row)
  React.createElement('div', {
    style:{
      display:'flex', alignItems:'center', gap: 8,
      fontFamily: D.font_mono, fontWeight: 900, fontSize: logoFS,
      color: D.text_dim, letterSpacing: 8
    }
  },
    React.createElement('span', { style:{color: D.cyan} }, '◢'),
    React.createElement('span', { style:{color: D.text} }, 'AI ROUTING'),
    React.createElement('span', { style:{color: D.violet} }, '◣')
  )
);

const hardCut = React.createElement('div', {
  style:{
    position:'absolute', inset: 0, backgroundColor: D.bg,
    opacity: hardCutOp, pointerEvents: 'none', zIndex: 999
  }
});

return React.createElement('div', {style:{position:'absolute', inset:0}}, timerBlock, hardCut);
