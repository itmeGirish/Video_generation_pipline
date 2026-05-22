const NARRATION_TEXT = "All three major providers shipped this feature \u2014 but named it differently. Claude calls it effort. <pause 0.2s> OpenAI calls it reasoning effort. <pause 0.2s> In the Gemini app, it's thinking level. In the API, thinking_budget. Each runs the same thinking tokens engine underneath. <pause 0.2s> And all three default to medium \u2014 which is the right call for most tasks. They assume high equals better. <pause 0.3s> It doesn't. There's a task type where high effort makes things measurably worse. <pause 0.3s>";

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
}}, 'S3');

const cfgs = [
  {label:'CLAUDE', param:'effort: "medium"', sub:'5 levels: low → max', col:D.cyan},
  {label:'OPENAI / GPT', param:'reasoning_effort: "medium"', sub:'4 levels: low → xhigh', col:D.violet},
  {label:'GEMINI', param:'thinking_budget: MEDIUM', sub:'app: thinking level', col:D.amber},
];
const panelW = Math.round(w * 0.27);
const gap = Math.round(w * 0.03);
const totalW = panelW * 3 + gap * 2;
const startX = Math.round((w - totalW) / 2);
const panelH = Math.round(h * 0.60);
const panelTop = Math.round(h * 0.20);

const panels = cfgs.map(function(cfg, i) {
  const sp = spring({frame: frame - i * 12, fps, config:{damping:20, stiffness:200}});
  return React.createElement('div', {
    key: cfg.label,
    style: {
      position:'absolute',
      left: startX + i * (panelW + gap),
      top: panelTop,
      width: panelW,
      height: panelH,
      backgroundColor: D.surface,
      borderRadius: 8,
      border: '2px solid ' + cfg.col,
      opacity: sp,
      transform: 'translateY(' + Math.round((1 - sp) * 60) + 'px)',
      display:'flex', flexDirection:'column', alignItems:'center',
      padding: Math.round(h * 0.03),
      boxSizing:'border-box',
      gap: Math.round(h * 0.02),
    }
  },
    React.createElement('div', {style:{
      color:cfg.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.013), fontWeight:'700',
      textAlign:'center'
    }}, cfg.label),
    React.createElement('div', {style:{
      backgroundColor:D.bg, borderRadius:4, padding:'8px 12px', width:'90%',
      color:cfg.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.009),
      textAlign:'center', border:'1px solid ' + cfg.col + '55',
      boxSizing:'border-box'
    }}, cfg.param),
    React.createElement('div', {style:{
      color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008),
      textAlign:'center'
    }}, cfg.sub)
  );
});

return [backdrop, tag].concat(panels);
