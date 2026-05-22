const NARRATION_TEXT = "So here's the answer to the question we opened with. <pause 0.2s> Why do two identical prompts cost completely different amounts? Because someone left the dial on max \u2014 and never checked if it helped. <pause 0.4s> Low for simple tasks. <pause 0.2s> Medium for complex ones. <pause 0.2s> High only when being wrong is expensive. <pause 0.4s> Higher thinking doesn't make the model smarter. It gives the model more time to be wrong \u2014 at a higher price. <pause 0.5s> Get this right and you can cut your reasoning costs by three to five times \u2014 sometimes more. <pause 0.3s> Subscribe \u2014 I'm breaking down one of these settings every week. Next up: tool-use patterns, the other dial most developers ignore.";

const w = width, h = height;
const cardW = Math.round(w * 0.27);
const gap = Math.round(w * 0.03);
const totalW = cardW * 3 + gap * 2;
const startX = Math.round((w - totalW) / 2);
const cardH = Math.round(h * 0.40);
const cardTop = Math.round(h * 0.10);

// Static three dials at medium
const cfgs = [
  {label:'CLAUDE', col:D.cyan},
  {label:'GPT', col:D.violet},
  {label:'GEMINI', col:D.amber},
];
const dialCards = cfgs.map(function(cfg, i) {
  return React.createElement('div', {key:cfg.label, style:{
    position:'absolute',
    left: startX + i * (cardW + gap),
    top: cardTop,
    width: cardW, height: cardH,
    backgroundColor: D.surface,
    borderRadius: 8, border:'1px solid ' + cfg.col,
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    gap: Math.round(h * 0.012),
  }},
    React.createElement('div', {style:{color:cfg.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.013), fontWeight:'700'}}, cfg.label),
    React.createElement('div', {style:{color:D.green, fontFamily:D.font_mono, fontSize:Math.round(w*0.010), fontWeight:'700',
      padding:'3px 12px', border:'1px solid ' + D.green, borderRadius:4,
      boxShadow:'0 0 8px ' + D.green + '44',
    }}, 'MEDIUM')
  );
});

// Rule card slides up from bottom
const ruleCardW = Math.round(w * 0.72);
const spCard = spring({frame: frame, fps, config:{damping:20, stiffness:200}});
const rules = [
  {text:'LOW — simple tasks', col:D.green},
  {text:'MEDIUM — complex tasks', col:D.amber},
  {text:'HIGH — when wrong answers are expensive', col:D.red},
];
const ruleLines = rules.map(function(r, i) {
  const sp = spring({frame: frame - i * 12, fps, config:{damping:20, stiffness:200}});
  return React.createElement('div', {key:i, style:{
    color:r.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.014), fontWeight:'700',
    opacity:sp, transform:'translateX(' + Math.round((1 - sp) * -20) + 'px)',
  }}, r.text);
});

const ruleCard = React.createElement('div', {style:{
  position:'absolute',
  left: Math.round((w - ruleCardW) / 2),
  top: Math.round(h * 0.57),
  width: ruleCardW,
  backgroundColor: D.surface,
  border: '1px solid ' + D.cyan,
  borderRadius: 8,
  padding: Math.round(h * 0.035) + 'px ' + Math.round(w * 0.04) + 'px',
  display:'flex', flexDirection:'column',
  gap: Math.round(h * 0.018),
  boxSizing:'border-box',
  opacity: spCard,
  transform: 'translateY(' + Math.round((1 - spCard) * 40) + 'px)',
}}, ruleLines);

return dialCards.concat([ruleCard]);
