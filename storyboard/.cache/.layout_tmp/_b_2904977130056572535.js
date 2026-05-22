const NARRATION_TEXT = "So when does high effort actually help? The answer comes down to three task types. <pause 0.3s> Simple tasks: classification, summarization, rewriting, translation. The answer's in the input. <pause 0.2s> Use low effort. <pause 0.2s> Start there and benchmark up only if your evals demand it. Complex tasks: multi-step code, architecture decisions, debugging subtle bugs. These benefit from medium \u2014 sometimes high. <pause 0.2s> But run your evals first. <pause 0.3s> Critical tasks: legal analysis, financial modeling, medical reasoning. These are the only cases where max effort pays for itself. Not because the model thinks better \u2014 but because the cost of being wrong exceeds the token bill. Independent benchmarks measured up to twenty-three times more tokens at high effort versus minimal \u2014 across full evaluation suites. <pause 0.3s>";

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
}}, 'S5');

const compartW = Math.round(w * 0.28);
const gap = Math.round(w * 0.025);
const totalW = compartW * 3 + gap * 2;
const startX = Math.round((w - totalW) / 2);
const compartTop = Math.round(h * 0.16);
const compartH = Math.round(h * 0.55);

const comps = [
  {label:'SIMPLE TASKS', col:D.green},
  {label:'COMPLEX TASKS', col:D.amber},
  {label:'CRITICAL TASKS', col:D.red},
];

const compartEls = comps.map(function(comp, i) {
  const sp = spring({frame: frame - i * 10, fps, config:{damping:20, stiffness:200}});
  return React.createElement('div', {
    key: comp.label,
    style: {
      position:'absolute',
      left: startX + i * (compartW + gap),
      top: compartTop,
      width: compartW,
      height: compartH,
      backgroundColor: D.surface,
      borderRadius: 8,
      border: '2px solid ' + comp.col,
      opacity: sp,
      transform: 'translateY(' + Math.round((1 - sp) * 50) + 'px)',
      display:'flex', flexDirection:'column', alignItems:'center',
      paddingTop: Math.round(h * 0.025),
      boxSizing:'border-box',
    }
  },
    React.createElement('div', {style:{
      color: comp.col, fontFamily: D.font_mono, fontSize: Math.round(w * 0.012),
      fontWeight: '700', textAlign:'center'
    }}, comp.label)
  );
});

return [backdrop, tag].concat(compartEls);
