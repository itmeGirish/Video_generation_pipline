const NARRATION_TEXT = "When you set effort to high, the model doesn't try harder the way a human would. It generates a hidden scratchpad \u2014 thinking tokens \u2014 before writing its answer. <pause 0.3s> These tokens are invisible to you. <pause 0.2s> But they're billed at full output token rates. A low-effort request might use five hundred thinking tokens. <pause 0.3s> The same request on max effort? <pause 0.3s> Tens of thousands. <pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const dimOverlay = React.createElement('div', {style:{
  position:'absolute', top:0, left:0, right:0, bottom:0,
  backgroundColor: D.bg,
  opacity: interpolate(frame, [0, 6], [0, 0.82], {extrapolateRight:'clamp'}),
}});

const sp1 = spring({frame: frame, fps, config:{damping:12, stiffness:90, mass:2}});
const sp2 = spring({frame: frame - 8, fps, config:{damping:12, stiffness:90, mass:2}});

const line1 = React.createElement('div', {style:{
  position:'absolute',
  top: Math.round(h * 0.35),
  left: 0, right: 0,
  textAlign: 'center',
  color: D.text,
  fontFamily: D.font_display,
  fontWeight: '700',
  fontSize: Math.round(w * 0.030),
  opacity: sp1,
  transform: 'scale(' + (0.6 + 0.4 * sp1) + ')',
}}, 'INVISIBLE TO YOU.');

const line2 = React.createElement('div', {style:{
  position:'absolute',
  top: Math.round(h * 0.50),
  left: 0, right: 0,
  textAlign: 'center',
  color: D.red,
  fontFamily: D.font_display,
  fontWeight: '700',
  fontSize: Math.round(w * 0.024),
  opacity: sp2,
  transform: 'scale(' + (0.6 + 0.4 * sp2) + ')',
}}, 'BILLED AS OUTPUT TOKENS.');

return [dimOverlay, line1, line2];
