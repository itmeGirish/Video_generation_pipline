const NARRATION_TEXT = "So when does high effort actually help? The answer comes down to three task types. <pause 0.3s> Simple tasks: classification, summarization, rewriting, translation. The answer's in the input. <pause 0.2s> Use low effort. <pause 0.2s> Start there and benchmark up only if your evals demand it. Complex tasks: multi-step code, architecture decisions, debugging subtle bugs. These benefit from medium \u2014 sometimes high. <pause 0.2s> But run your evals first. <pause 0.3s> Critical tasks: legal analysis, financial modeling, medical reasoning. These are the only cases where max effort pays for itself. Not because the model thinks better \u2014 but because the cost of being wrong exceeds the token bill. Independent benchmarks measured up to twenty-three times more tokens at high effort versus minimal \u2014 across full evaluation suites. <pause 0.3s>";

const w = width, h = height;
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

const simpleChips = ['CLASSIFICATION', 'SUMMARIZATION', 'REWRITING', 'TRANSLATION'];
const chipEls = simpleChips.map(function(chip, i) {
  const sp = spring({frame: frame - i * 8, fps, config:{damping:12, stiffness:90, mass:2}});
  const chipH = Math.round(h * 0.058);
  const chipW = Math.round(compartW * 0.85);
  const chipX = startX + Math.round((compartW - chipW) / 2);
  const chipY = compartTop + Math.round(h * 0.09) + i * (chipH + Math.round(h * 0.010));
  return React.createElement('div', {
    key: chip,
    style: {
      position:'absolute',
      left: chipX,
      top: chipY,
      width: chipW,
      height: chipH,
      backgroundColor: D.surface,
      border: '1px solid ' + D.green,
      borderRadius: 4,
      display:'flex', alignItems:'center', justifyContent:'center',
      color: D.green, fontFamily: D.font_mono, fontSize: Math.round(w * 0.009),
      opacity: sp,
      transform: 'translateY(' + Math.round((1 - sp) * -30) + 'px)',
    }
  }, chip);
});

const spBadge = spring({frame: frame - 32, fps, config:{damping:20, stiffness:200}});
const badgeY = compartTop + compartH - Math.round(h * 0.085);
const badge = React.createElement('div', {style:{
  position:'absolute',
  left: startX + Math.round(compartW * 0.10),
  top: badgeY,
  width: Math.round(compartW * 0.80),
  textAlign:'center',
  color: D.green, fontFamily: D.font_display, fontWeight: '700',
  fontSize: Math.round(w * 0.014),
  opacity: spBadge,
  transform: 'scale(' + (0.6 + 0.4 * spBadge) + ')',
}}, 'LOW EFFORT');

return compartEls.concat(chipEls).concat([badge]);
