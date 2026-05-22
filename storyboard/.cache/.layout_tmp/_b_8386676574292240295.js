const NARRATION_TEXT = "All three major providers shipped this feature \u2014 but named it differently. Claude calls it effort. <pause 0.2s> OpenAI calls it reasoning effort. <pause 0.2s> In the Gemini app, it's thinking level. In the API, thinking_budget. Each runs the same thinking tokens engine underneath. <pause 0.2s> And all three default to medium \u2014 which is the right call for most tasks. They assume high equals better. <pause 0.3s> It doesn't. There's a task type where high effort makes things measurably worse. <pause 0.3s>";

const w = width, h = height;
const cfgs = [
  {label:'CLAUDE', param:'effort: "medium"', col:D.cyan},
  {label:'OPENAI / GPT', param:'reasoning_effort: "medium"', col:D.violet},
  {label:'GEMINI', param:'thinking_budget: MEDIUM', col:D.amber},
];
const panelW = Math.round(w * 0.27);
const gap = Math.round(w * 0.03);
const totalW = panelW * 3 + gap * 2;
const startX = Math.round((w - totalW) / 2);
const panelH = Math.round(h * 0.50);
const panelTop = Math.round(h * 0.20);

const panels = cfgs.map(function(cfg, i) {
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
      display:'flex', flexDirection:'column', alignItems:'center',
      padding: Math.round(h * 0.025),
      boxSizing:'border-box',
      gap: Math.round(h * 0.018),
    }
  },
    React.createElement('div', {style:{
      color:cfg.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.013), fontWeight:'700'
    }}, cfg.label),
    React.createElement('div', {style:{
      backgroundColor:D.bg, borderRadius:4, padding:'6px 10px', width:'88%',
      color:cfg.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.009),
      textAlign:'center', border:'1px solid ' + cfg.col + '55',
      boxSizing:'border-box'
    }}, cfg.param)
  );
});

const badges = cfgs.map(function(cfg, i) {
  const sp = spring({frame: frame - i * 8, fps, config:{damping:12, stiffness:90, mass:2}});
  const cx = startX + i * (panelW + gap) + Math.round(panelW / 2);
  const badgeY = panelTop + Math.round(panelH * 0.62);
  return React.createElement('div', {
    key: 'badge-' + i,
    style: {
      position:'absolute',
      left: cx - Math.round(panelW * 0.32),
      top: badgeY,
      width: Math.round(panelW * 0.64),
      textAlign:'center',
      backgroundColor: D.green + '22',
      border: '2px solid ' + D.green,
      borderRadius: 4,
      padding: '5px 10px',
      color: D.green,
      fontFamily: D.font_mono,
      fontSize: Math.round(w * 0.010),
      fontWeight: '700',
      opacity: sp,
      transform: 'scale(' + (0.6 + 0.4 * sp) + ')',
    }
  }, 'DEFAULT');
});

const panelBottomY = panelTop + panelH;
const boxW = Math.round(w * 0.30);
const boxCX = Math.round(w / 2);
const boxTop = panelBottomY + Math.round(h * 0.14);
const lineProgress = interpolate(frame, [22, 44], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const lines = cfgs.map(function(cfg, i) {
  const panelCX = startX + i * (panelW + gap) + Math.round(panelW / 2);
  const sy = panelBottomY + 4;
  const ey = boxTop;
  const dx = boxCX - panelCX;
  const dy = ey - sy;
  const len = Math.round(Math.sqrt(dx * dx + dy * dy));
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return React.createElement('div', {
    key: 'line-' + i,
    style: {
      position:'absolute',
      left: panelCX,
      top: sy,
      width: Math.round(len * lineProgress),
      height: 2,
      backgroundColor: D.text_dim,
      transform: 'rotate(' + angle + 'deg)',
      transformOrigin: 'left center',
      opacity: 0.5,
    }
  });
});

const spBox = spring({frame: frame - 46, fps, config:{damping:8}});
const box = React.createElement('div', {style:{
  position:'absolute',
  left: boxCX - Math.round(boxW / 2),
  top: boxTop,
  width: boxW,
  padding: Math.round(h * 0.018) + 'px ' + Math.round(w * 0.025) + 'px',
  backgroundColor: D.surface,
  border: '1px solid ' + D.text,
  borderRadius: 6,
  textAlign:'center',
  color: D.text,
  fontFamily: D.font_display,
  fontWeight: '700',
  fontSize: Math.round(w * 0.018),
  opacity: spBox,
  transform: 'scale(' + (0.6 + 0.4 * spBox) + ')',
}}, 'THINKING TOKENS');

return panels.concat(badges).concat(lines).concat([box]);
