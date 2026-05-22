const NARRATION_TEXT = "Here's the thing nobody in the documentation actually shows you. <pause 0.3s> For simple tasks, higher effort doesn't just waste money \u2014 it produces worse answers. <pause 0.5s> FutureSearch tested the original GPT-5 in early 2026 \u2014 before the newer model dropped. Low effort scored forty-nine point six percent. <pause 0.3s> Medium dropped to forty-eight point six. <pause 0.3s> High fell to forty-eight point one. <pause 0.5s> The cost went up fifty-six percent. <pause 0.2s> The accuracy went down. <pause 0.3s> Watch what happens to the token counter. <pause 6.0s> Why? <pause 0.3s> The model second-guesses its good initial findings. It chases marginal sources and over-qualifies clear answers. More thinking time means more chances to reject the correct one.";

const w = width, h = height;
const sp = spring({frame: frame, fps, config:{damping:8}});

const question = React.createElement('div', {style:{
  position:'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  display:'flex', alignItems:'center', justifyContent:'center',
  backgroundColor: D.bg + 'E0',
}},
  React.createElement('div', {style:{
    color: D.cyan,
    fontFamily: D.font_display,
    fontWeight: '700',
    fontSize: Math.round(h * 0.22),
    lineHeight: 1,
    opacity: sp,
    transform: 'scale(' + (0.3 + 0.7 * sp) + ')',
  }}, '?')
);

return [question];
