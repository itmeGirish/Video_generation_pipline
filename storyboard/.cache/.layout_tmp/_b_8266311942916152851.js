const NARRATION_TEXT = "Here's the thing nobody in the documentation actually shows you. <pause 0.3s> For simple tasks, higher effort doesn't just waste money \u2014 it produces worse answers. <pause 0.5s> FutureSearch tested the original GPT-5 in early 2026 \u2014 before the newer model dropped. Low effort scored forty-nine point six percent. <pause 0.3s> Medium dropped to forty-eight point six. <pause 0.3s> High fell to forty-eight point one. <pause 0.5s> The cost went up fifty-six percent. <pause 0.2s> The accuracy went down. <pause 0.3s> Watch what happens to the token counter. <pause 6.0s> Why? <pause 0.3s> The model second-guesses its good initial findings. It chases marginal sources and over-qualifies clear answers. More thinking time means more chances to reject the correct one.";

const w = width, h = height;
const lines = ['WORSE RESULTS.', 'HIGHER COST.'];
const lineEls = lines.map(function(text, i) {
  const sp = spring({frame: frame - i * 6, fps, config:{damping:12, stiffness:90, mass:2}});
  return React.createElement('div', {
    key: text,
    style: {
      color: D.red,
      fontFamily: D.font_display,
      fontWeight: '700',
      fontSize: Math.round(w * 0.036),
      opacity: sp,
      transform: 'scale(' + (0.6 + 0.4 * sp) + ')',
      textAlign:'center',
      lineHeight: 1.15,
    }
  }, text);
});

const container = React.createElement('div', {style:{
  position:'absolute', top:0, left:0, right:0, bottom:0,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  gap: Math.round(h * 0.018),
  backgroundColor: D.bg + 'CC',
}}, lineEls);

return [container];
