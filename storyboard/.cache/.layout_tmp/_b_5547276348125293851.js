const NARRATION_TEXT = "Here's the thing nobody in the documentation actually shows you. <pause 0.3s> For simple tasks, higher effort doesn't just waste money \u2014 it produces worse answers. <pause 0.5s> FutureSearch tested the original GPT-5 in early 2026 \u2014 before the newer model dropped. Low effort scored forty-nine point six percent. <pause 0.3s> Medium dropped to forty-eight point six. <pause 0.3s> High fell to forty-eight point one. <pause 0.5s> The cost went up fifty-six percent. <pause 0.2s> The accuracy went down. <pause 0.3s> Watch what happens to the token counter. <pause 6.0s> Why? <pause 0.3s> The model second-guesses its good initial findings. It chases marginal sources and over-qualifies clear answers. More thinking time means more chances to reject the correct one.";

const w = width, h = height;
const cardW = Math.round(w * 0.74);
const cardLines = [
  {text: 'The model second-guesses its good initial findings.', col: D.text, size: 0.020},
  {text: 'Chases marginal sources. Over-qualifies clear answers.', col: D.text_dim, size: 0.015},
  {text: 'More thinking time = more chances to reject the correct answer.', col: D.amber, size: 0.016},
];

const lineEls = cardLines.map(function(line, i) {
  const sp = spring({frame: frame - i * 10, fps, config:{damping:20, stiffness:200}});
  return React.createElement('div', {
    key: i,
    style: {
      color: line.col,
      fontFamily: i === 0 ? D.font_display : D.font_mono,
      fontWeight: i === 0 ? '700' : '400',
      fontSize: Math.round(w * line.size),
      textAlign:'center',
      lineHeight: 1.5,
      opacity: sp,
      transform: 'translateY(' + Math.round((1 - sp) * 20) + 'px)',
    }
  }, line.text);
});

const card = React.createElement('div', {style:{
  position:'absolute',
  left: Math.round((w - cardW) / 2),
  top: Math.round(h * 0.28),
  width: cardW,
  backgroundColor: D.surface,
  border: '1px solid ' + D.cyan,
  borderRadius: 8,
  padding: Math.round(h * 0.045) + 'px ' + Math.round(w * 0.04) + 'px',
  display:'flex', flexDirection:'column', alignItems:'center',
  gap: Math.round(h * 0.025),
  boxSizing:'border-box',
}}, lineEls);

return [card];
