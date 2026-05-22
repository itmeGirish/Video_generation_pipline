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

const sp = spring({frame: frame, fps, config:{damping:10}});
const ghostSp = spring({frame: Math.max(0, frame - 12), fps, config:{damping:14}});

const rootW = Math.round(w * 0.60);
const rootH = Math.round(h * 0.20);
const rootX = Math.round((w - rootW) / 2);
const rootY = Math.round(h * 0.10);

const root = React.createElement('div', {style:{
  position:'absolute',
  left: rootX, top: rootY,
  width: rootW, height: rootH,
  backgroundColor: D.surface,
  border: '2px solid ' + D.cyan,
  borderRadius: 8,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  gap: Math.round(h * 0.014),
  opacity: sp,
  transform: 'scale(' + (0.7 + 0.3 * sp) + ')',
}},
  React.createElement('div', {style:{
    color: D.text, fontFamily: D.font_display, fontWeight:'700',
    fontSize: Math.round(w * 0.023), textAlign:'center', letterSpacing: '0.05em'
  }}, 'WHAT IS THIS TASK?'),
  React.createElement('div', {style:{
    color: D.text_dim, fontFamily: D.font_mono,
    fontSize: Math.round(w * 0.012), textAlign:'center', opacity: 0.75
  }}, 'Three questions determine the right effort level')
);

const branchW = Math.round(w * 0.24);
const branchH = Math.round(h * 0.13);
const branchY = Math.round(h * 0.50);
const bxPositions = [
  Math.round(w * 0.05),
  Math.round((w - branchW) / 2),
  Math.round(w * 0.71),
];
const bxLabels = ['YES -> LOW', 'YES -> MEDIUM', 'YES -> HIGH/MAX'];
const bxColors = [D.green, D.amber, D.red];

const branches = bxPositions.map(function(bx, i) {
  return React.createElement('div', {
    key: 'ghost' + i,
    style: {
      position:'absolute',
      left: bx, top: branchY,
      width: branchW, height: branchH,
      backgroundColor: D.surface,
      border: '1px solid ' + bxColors[i] + '44',
      borderRadius: 8,
      display:'flex', alignItems:'center', justifyContent:'center',
      opacity: ghostSp * 0.35,
    }
  },
    React.createElement('div', {style:{
      color: bxColors[i] + '99',
      fontFamily: D.font_mono,
      fontSize: Math.round(w * 0.013),
      fontWeight: '600',
    }}, bxLabels[i])
  );
});

const vertLine = React.createElement('div', {style:{
  position:'absolute',
  left: Math.round(w / 2) - 1,
  top: rootY + rootH,
  width: 2,
  height: branchY - (rootY + rootH),
  backgroundColor: D.cyan + '25',
  opacity: ghostSp * 0.6,
}});

return [backdrop, tag, root, vertLine].concat(branches);
