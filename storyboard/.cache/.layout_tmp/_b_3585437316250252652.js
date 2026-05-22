const NARRATION_TEXT = "<pause 0.2s> Worse results. <pause 0.5s> Here's what the documentation doesn't tell you.";

const w = width, h = height;
const lines = ['SAME MODEL.', 'HIGHER SETTING.', 'WORSE RESULTS.'];
const lineEls = lines.map(function(text, i) {
  const sp = spring({frame: frame - i * 12, fps, config:{damping:12, stiffness:90, mass:2}});
  return React.createElement('div', {
    key: text,
    style: {
      color: D.red,
      fontFamily: D.font_display,
      fontWeight: '700',
      fontSize: Math.round(w * 0.030),
      opacity: sp,
      transform: 'scale(' + (0.6 + 0.4 * sp) + ')',
      textAlign: 'center',
      lineHeight: 1.2,
    }
  }, text);
});

const container = React.createElement('div', {style:{
  position:'absolute', top:0, left:0, right:0, bottom:0,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  gap: Math.round(h * 0.02),
  backgroundColor: D.bg + 'cc',
}}, lineEls);

return [container];
