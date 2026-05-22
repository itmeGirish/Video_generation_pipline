const NARRATION_TEXT = "Here's the decision rule that fixes this. <pause 0.2s> Before choosing an effort level, ask three questions. First: is the answer obvious from the input? <pause 0.2s> If yes \u2014 use low. Second: does the task require multiple reasoning steps? <pause 0.2s> If yes \u2014 use medium. Third: is a wrong answer costly in money, reputation, or safety? <pause 0.3s> If yes \u2014 and only if yes \u2014 use high or max. OpenAI defaults to medium. <pause 0.2s> For simple tasks, benchmarking down from there saves even more. <pause 0.3s> Go higher only when your evals prove it's actually better \u2014 not just because it feels like it should be. <pause 0.3s>";

const w = width, h = height;
const backdrop = React.createElement(AbsoluteFill, {
  style: {
    backgroundColor: D.bg,
    opacity: interpolate(frame, [0, 8], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})
  }
});
const tag = React.createElement('div', {style:{
  position:'absolute', top:Math.round(h*0.03), left:Math.round(w*0.03),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008), opacity:0.6
}}, 'S6');

const rootW = Math.round(w * 0.38);
const rootH = Math.round(h * 0.13);
const rootX = Math.round((w - rootW) / 2);
const rootY = Math.round(h * 0.10);
const sp = spring({frame: frame, fps, config:{damping:8}});

const root = React.createElement('div', {style:{
  position:'absolute',
  left: rootX, top: rootY,
  width: rootW, height: rootH,
  backgroundColor: D.surface,
  border: '2px solid ' + D.cyan,
  borderRadius: 8,
  display:'flex', alignItems:'center', justifyContent:'center',
  opacity: sp,
  transform: 'scale(' + (0.6 + 0.4 * sp) + ')',
}},
  React.createElement('div', {style:{
    color: D.text, fontFamily: D.font_display, fontWeight:'700',
    fontSize: Math.round(w * 0.020), textAlign:'center'
  }}, 'WHAT IS THIS TASK?')
);

return [backdrop, tag, root];
