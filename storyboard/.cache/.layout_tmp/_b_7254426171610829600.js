const NARRATION_TEXT = "So here's the answer to the question we opened with. <pause 0.2s> Why do two identical prompts cost completely different amounts? Because someone left the dial on max \u2014 and never checked if it helped. <pause 0.4s> Low for simple tasks. <pause 0.2s> Medium for complex ones. <pause 0.2s> High only when being wrong is expensive. <pause 0.4s> Higher thinking doesn't make the model smarter. It gives the model more time to be wrong \u2014 at a higher price. <pause 0.5s> Get this right and you can cut your reasoning costs by three to five times \u2014 sometimes more. <pause 0.3s> Subscribe \u2014 I'm breaking down one of these settings every week. Next up: tool-use patterns, the other dial most developers ignore.";

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
}}, 'S7');

const cfgs = [
  {label:'CLAUDE', param:'effort:', levels:['LOW','MEDIUM','HIGH','XHIGH','MAX'], col:D.cyan},
  {label:'GPT', param:'reasoning_effort:', levels:['LOW','MEDIUM','HIGH','XHIGH'], col:D.violet},
  {label:'GEMINI', param:'thinking_budget:', levels:['LOW','MEDIUM','HIGH'], col:D.amber},
];
const cardW = Math.round(w * 0.27);
const gap = Math.round(w * 0.03);
const totalW = cardW * 3 + gap * 2;
const startX = Math.round((w - totalW) / 2);
const cardH = Math.round(h * 0.58);
const cardTop = Math.round(h * 0.18);

const cards = cfgs.map(function(cfg, i) {
  const sp = spring({frame: frame - i * 10, fps, config:{damping:20, stiffness:200}});
  const levelEls = cfg.levels.map(function(lv) {
    const isMedium = lv === 'MEDIUM';
    return React.createElement('div', {
      key: lv,
      style: {
        padding: '4px 10px',
        color: isMedium ? D.green : D.text_dim,
        border: '1px solid ' + (isMedium ? D.green : D.surface),
        borderRadius: 4,
        fontFamily: D.font_mono,
        fontSize: Math.round(w * 0.008),
        fontWeight: isMedium ? '700' : '400',
        width: '78%',
        textAlign:'center',
        boxShadow: isMedium ? ('0 0 10px ' + D.green + '55') : 'none',
      }
    }, lv);
  });

  return React.createElement('div', {
    key: cfg.label,
    style: {
      position:'absolute',
      left: startX + i * (cardW + gap),
      top: cardTop,
      width: cardW,
      height: cardH,
      backgroundColor: D.surface,
      borderRadius: 8,
      border: '1px solid ' + cfg.col,
      opacity: sp,
      transform: 'translateY(' + Math.round((1 - sp) * 50) + 'px)',
      display:'flex', flexDirection:'column', alignItems:'center',
      padding: Math.round(h * 0.025),
      boxSizing:'border-box',
      gap: Math.round(h * 0.012),
    }
  },
    React.createElement('div', {style:{
      color:cfg.col, fontFamily:D.font_mono, fontSize:Math.round(w*0.014), fontWeight:'700'
    }}, cfg.label),
    React.createElement('div', {style:{
      color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.007)
    }}, cfg.param),
    React.createElement('div', {style:{
      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      marginTop:Math.round(h*0.015), width:'100%'
    }}, levelEls),
    React.createElement('div', {style:{
      color:D.green, fontFamily:D.font_mono, fontSize:Math.round(w*0.010),
      fontWeight:'700', marginTop:Math.round(h*0.015)
    }}, 'â–² SET TO MEDIUM')
  );
});

// Checkmark badges stamp onto each card
const checkmarks = cfgs.map(function(cfg, i) {
  const sp = spring({frame: frame - i * 10 - 18, fps, config:{damping:12, stiffness:90, mass:2}});
  return React.createElement('div', {
    key: 'check-' + i,
    style: {
      position:'absolute',
      left: startX + i * (cardW + gap) + Math.round(cardW * 0.62),
      top: cardTop - Math.round(h * 0.02),
      backgroundColor: D.green,
      borderRadius: '50%',
      width: Math.round(w * 0.024),
      height: Math.round(w * 0.024),
      display:'flex', alignItems:'center', justifyContent:'center',
      color: D.bg, fontFamily: D.font_display, fontWeight:'700',
      fontSize: Math.round(w * 0.014),
      opacity: sp,
      transform: 'scale(' + (0.3 + 0.7 * sp) + ')',
    }
  }, 'âœ“');
});

return [backdrop, tag].concat(cards).concat(checkmarks);
