const NARRATION_TEXT = "All three major providers shipped this feature \u2014 but named it differently. Claude calls it effort. <pause 0.2s> OpenAI calls it reasoning effort. <pause 0.2s> In the Gemini app, it's thinking level. In the API, thinking_budget. Each runs the same thinking tokens engine underneath. <pause 0.2s> And all three default to medium \u2014 which is the right call for most tasks. They assume high equals better. <pause 0.3s> It doesn't. There's a task type where high effort makes things measurably worse. <pause 0.3s>";

const w = width, h = height;
const cardW = Math.round(w * 0.68);
const spCard = spring({frame: frame, fps, config:{damping:15, stiffness:80, mass:2}});
const spSub = interpolate(frame, [18, 32], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const card = React.createElement('div', {style:{
  position:'absolute',
  left: Math.round((w - cardW) / 2),
  top: Math.round(h * 0.32),
  width: cardW,
  backgroundColor: D.surface,
  border: '2px solid ' + D.amber,
  borderRadius: 8,
  padding: Math.round(h * 0.04) + 'px ' + Math.round(w * 0.04) + 'px',
  opacity: spCard,
  transform: 'translateY(' + Math.round((1 - spCard) * 40) + 'px)',
  display:'flex', flexDirection:'column', alignItems:'center',
  gap: Math.round(h * 0.024),
  boxSizing:'border-box',
}},
  React.createElement('div', {style:{
    color: D.text,
    fontFamily: D.font_display,
    fontWeight: '700',
    fontSize: Math.round(w * 0.020),
    textAlign:'center',
    fontStyle:'italic',
    lineHeight: 1.45,
  }}, "There’s a task type where HIGH effort makes results worse."),
  React.createElement('div', {style:{
    color: D.text_dim,
    fontFamily: D.font_mono,
    fontSize: Math.round(w * 0.010),
    opacity: spSub,
  }}, 'Coming up in 60 seconds.')
);

return [card];
