const NARRATION_TEXT = "So when does high effort actually help? The answer comes down to three task types. <pause 0.3s> Simple tasks: classification, summarization, rewriting, translation. The answer's in the input. <pause 0.2s> Use low effort. <pause 0.2s> Start there and benchmark up only if your evals demand it. Complex tasks: multi-step code, architecture decisions, debugging subtle bugs. These benefit from medium \u2014 sometimes high. <pause 0.2s> But run your evals first. <pause 0.3s> Critical tasks: legal analysis, financial modeling, medical reasoning. These are the only cases where max effort pays for itself. Not because the model thinks better \u2014 but because the cost of being wrong exceeds the token bill. Independent benchmarks measured up to twenty-three times more tokens at high effort versus minimal \u2014 across full evaluation suites. <pause 0.3s>";

const w = width, h = height;
const compartW = Math.round(w * 0.28);
const gap = Math.round(w * 0.025);
const totalW = compartW * 3 + gap * 2;
const startX = Math.round((w - totalW) / 2);
const compartTop = Math.round(h * 0.08);
const compartH = Math.round(h * 0.42);

const comps = [
  {label:'SIMPLE TASKS', col:D.green, badge:'LOW EFFORT'},
  {label:'COMPLEX TASKS', col:D.amber, badge:'MEDIUM EFFORT'},
  {label:'CRITICAL TASKS', col:D.red, badge:'HIGH / MAX EFFORT'},
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
      justifyContent:'space-between',
      padding: Math.round(h * 0.022),
      boxSizing:'border-box',
    }
  },
    React.createElement('div', {style:{
      color:comp.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
    }}, comp.label),
    React.createElement('div', {style:{
      color:comp.col, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.013)
    }}, comp.badge)
  );
});

// Horizontal cost bars below compartments
const barAreaTop = compartTop + compartH + Math.round(h * 0.06);
const barAreaH = Math.round(h * 0.30);
const barConfigs = [
  {pct: 0.08, label: '1×', col: D.green},
  {pct: 0.32, label: '4-8×', col: D.amber},
  {pct: 1.00, label: 'twenty-three times', col: D.red},
];

const barEls = barConfigs.map(function(bc, i) {
  const maxW = compartW;
  const sp = interpolate(frame, [i * 6, i * 6 + 22], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const bx = startX + i * (compartW + gap);
  const barH = Math.round(barAreaH * 0.28);
  const barW = Math.round(maxW * bc.pct * sp);
  return React.createElement(React.Fragment, {key:'bc-' + i},
    React.createElement('div', {style:{
      position:'absolute', left:bx, top:barAreaTop + Math.round(barAreaH * 0.35),
      width:barW, height:barH, backgroundColor:bc.col, borderRadius:'0 3px 3px 0',
    }}),
    React.createElement('div', {style:{
      position:'absolute', left:bx, top:barAreaTop + Math.round(barAreaH * 0.35) - Math.round(h*0.04),
      color:bc.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.009), fontWeight:'700',
      opacity: sp,
    }}, 'RELATIVE COST')
  );
});

const spStamp = spring({frame: frame - 28, fps, config:{damping:8}});
const stamp = React.createElement('div', {style:{
  position:'absolute',
  left: startX + 2 * (compartW + gap) + compartW + Math.round(w * 0.005),
  top: barAreaTop + Math.round(barAreaH * 0.25),
  color: D.red, fontFamily: D.font_mono, fontSize: Math.round(w * 0.010), fontWeight:'700',
  opacity: spStamp, transform: 'scale(' + (0.5 + 0.5 * spStamp) + ')',
  width: Math.round(w * 0.10),
}}, '23×\nMORE');

const source = React.createElement('div', {style:{
  position:'absolute', right:Math.round(w*0.04), bottom:Math.round(h*0.04),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.007)
}}, 'Artificial Analysis benchmark suite — directional, not per-task');

return compartEls.concat(barEls).concat([stamp, source]);
