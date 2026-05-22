const NARRATION_TEXT = "So when does high effort actually help? The answer comes down to three task types. <pause 0.3s> Simple tasks: classification, summarization, rewriting, translation. The answer's in the input. <pause 0.2s> Use low effort. <pause 0.2s> Start there and benchmark up only if your evals demand it. Complex tasks: multi-step code, architecture decisions, debugging subtle bugs. These benefit from medium \u2014 sometimes high. <pause 0.2s> But run your evals first. <pause 0.3s> Critical tasks: legal analysis, financial modeling, medical reasoning. These are the only cases where max effort pays for itself. Not because the model thinks better \u2014 but because the cost of being wrong exceeds the token bill. Independent benchmarks measured up to twenty-three times more tokens at high effort versus minimal \u2014 across full evaluation suites. <pause 0.3s>";

const w = width, h = height;
const cardW = Math.round(w * 0.74);
const spCard = spring({frame: frame, fps, config:{damping:15, stiffness:80, mass:2}});
const spLine2 = spring({frame: frame - 16, fps, config:{damping:15, stiffness:80, mass:2}});

const card = React.createElement('div', {style:{
  position:'absolute',
  left: Math.round((w - cardW) / 2),
  top: Math.round(h * 0.30),
  width: cardW,
  backgroundColor: D.surface,
  border: '1px solid ' + D.cyan,
  borderRadius: 8,
  padding: Math.round(h * 0.05) + 'px ' + Math.round(w * 0.05) + 'px',
  display:'flex', flexDirection:'column', alignItems:'center',
  gap: Math.round(h * 0.030),
  boxSizing:'border-box',
  opacity: spCard,
  transform: 'translateY(' + Math.round((1 - spCard) * 40) + 'px)',
}},
  React.createElement('div', {style:{
    color: D.text,
    fontFamily: D.font_display,
    fontWeight: '700',
    fontSize: Math.round(w * 0.020),
    textAlign:'center', lineHeight:1.4,
  }}, "The twenty-three times cost difference only pays off in bucket three."),
  React.createElement('div', {style:{
    color: D.red,
    fontFamily: D.font_display,
    fontWeight: '700',
    fontSize: Math.round(w * 0.018),
    textAlign:'center', lineHeight:1.4,
    opacity: spLine2,
    transform: 'translateY(' + Math.round((1 - spLine2) * 15) + 'px)',
  }}, "For buckets one and two — you're burning money.")
);

return [card];
