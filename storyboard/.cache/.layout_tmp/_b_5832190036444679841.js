const NARRATION_TEXT = "When you set effort to high, the model doesn't try harder the way a human would. It generates a hidden scratchpad \u2014 thinking tokens \u2014 before writing its answer. <pause 0.3s> These tokens are invisible to you. <pause 0.2s> But they're billed at full output token rates. A low-effort request might use five hundred thinking tokens. <pause 0.3s> The same request on max effort? <pause 0.3s> Tens of thousands. <pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const sp = spring({frame, fps, config:{damping:15, stiffness:80, mass:2}});

const card = React.createElement('div', {style:{
  position:'absolute',
  left: Math.round(w * 0.15),
  top: Math.round(h * 0.50) - Math.round(h * 0.10 * sp),
  width: Math.round(w * 0.70),
  padding: Math.round(h * 0.04),
  backgroundColor: D.surface,
  borderRadius: 8,
  border: '1px solid ' + D.cyan,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  opacity: sp,
}},
  React.createElement('div', {style:{
    color: D.text,
    fontFamily: D.font_display,
    fontSize: Math.round(w * 0.022),
    textAlign: 'center',
    lineHeight: 1.4,
  }}, 'That scratchpad is where your money goes.')
);

return [card];
