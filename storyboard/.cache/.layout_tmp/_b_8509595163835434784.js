const NARRATION_TEXT = "Every frontier AI model now has a dial that controls how hard it thinks. <pause 0.2s> Turn it up and you'd expect better answers.";

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
}}, 'S1');

const cfgs = [
  {label:'CLAUDE', param:'effort:', levels:['LOW','MEDIUM','HIGH','XHIGH','MAX'], col:D.cyan},
  {label:'GPT', param:'reasoning_effort:', levels:['LOW','MEDIUM','HIGH','XHIGH'], col:D.violet},
  {label:'GEMINI', param:'thinking_budget:', levels:['LOW','MEDIUM','HIGH'], col:D.amber},
];
const cardW = Math.round(w * 0.27);
const gap = Math.round(w * 0.03);
const totalW = cardW * 3 + gap * 2;
const startX = Math.round((w - totalW) / 2);
const cardH = Math.round(h * 0.62);
const cardTop = Math.round(h * 0.18);

const cards = cfgs.map(function(cfg, i) {
  const sp = spring({frame: frame - i * 10, fps, config:{damping:20, stiffness:200}});
  const levelEls = cfg.levels.map(function(lv) {
    const isHigh = lv === 'HIGH';
    return React.createElement('div', {
      key: lv,
      style: {
        padding: '4px 10px',
        color: isHigh ? cfg.col : D.text_dim,
        border: '1px solid ' + (isHigh ? cfg.col : D.surface),
        borderRadius: 4,
        fontFamily: D.font_mono,
        fontSize: Math.round(w * 0.008),
        fontWeight: isHigh ? '700' : '400',
        width: '78%',
        textAlign: 'center',
        boxShadow: isHigh ? ('0 0 10px ' + cfg.col + '55') : 'none',
      }
    }, lv);
  });

  return React.createElement('div', {
    key: cfg.label,
    style: {
      position: 'absolute',
      left: startX + i * (cardW + gap),
      top: cardTop,
      width: cardW,
      height: cardH,
      backgroundColor: D.surface,
      borderRadius: 8,
      border: '1px solid ' + cfg.col,
      opacity: sp,
      transform: 'translateY(' + Math.round((1 - sp) * 50) + 'px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: Math.round(h * 0.025),
      boxSizing: 'border-box',
      gap: Math.round(h * 0.012),
    }
  },
    React.createElement('div', {style:{
      color: cfg.col, fontFamily: D.font_mono, fontSize: Math.round(w * 0.014), fontWeight: '700'
    }}, cfg.label),
    React.createElement('div', {style:{
      color: D.text_dim, fontFamily: D.font_mono, fontSize: Math.round(w * 0.007)
    }}, cfg.param),
    React.createElement('div', {style:{
      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      marginTop: Math.round(h * 0.015), width:'100%'
    }}, levelEls),
    React.createElement('div', {style:{
      color: cfg.col, fontFamily: D.font_mono, fontSize: Math.round(w * 0.010),
      fontWeight: '700', marginTop: Math.round(h * 0.015)
    }}, '▲ SET TO HIGH')
  );
});

return [backdrop, tag].concat(cards);
