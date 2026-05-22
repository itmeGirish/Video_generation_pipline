const NARRATION_TEXT = "Here's the thing nobody in the documentation actually shows you. <pause 0.3s> For simple tasks, higher effort doesn't just waste money \u2014 it produces worse answers. <pause 0.5s> FutureSearch tested the original GPT-5 in early 2026 \u2014 before the newer model dropped. Low effort scored forty-nine point six percent. <pause 0.3s> Medium dropped to forty-eight point six. <pause 0.3s> High fell to forty-eight point one. <pause 0.5s> The cost went up fifty-six percent. <pause 0.2s> The accuracy went down. <pause 0.3s> Watch what happens to the token counter. <pause 6.0s> Why? <pause 0.3s> The model second-guesses its good initial findings. It chases marginal sources and over-qualifies clear answers. More thinking time means more chances to reject the correct one.";

const w = width, h = height;
const backdrop = React.createElement(AbsoluteFill, {
  style: {
    backgroundColor: D.bg,
    opacity: interpolate(frame, [0, 8], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})
  }
});

const termW = Math.round(w * 0.43);
const termH = Math.round(h * 0.65);
const termTop = Math.round(h * 0.18);
const gap = Math.round(w * 0.04);
const leftX = Math.round((w - termW * 2 - gap) / 2);
const rightX = leftX + termW + gap;

const lowCount = Math.round(interpolate(frame, [0, 180], [0, 520], {extrapolateLeft:'clamp', extrapolateRight:'clamp'}));
const maxCount = Math.round(interpolate(frame, [0, 210], [0, 18400], {extrapolateLeft:'clamp', extrapolateRight:'clamp'}));
const fmt = function(n) {
  return n.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

const makeTerminal = function(x, label, labelCol, borderCol, paramText, count, countCol, countSize, spDelay) {
  const sp = spring({frame: frame - spDelay, fps, config:{damping:20, stiffness:200}});
  const header = React.createElement('div', {style:{
    display:'flex', alignItems:'center', gap:6,
    padding: '10px 14px',
    backgroundColor: D.bg,
    borderRadius: '6px 6px 0 0',
  }},
    React.createElement('div', {style:{width:8, height:8, borderRadius:'50%', backgroundColor:D.red}}),
    React.createElement('div', {style:{width:8, height:8, borderRadius:'50%', backgroundColor:D.amber}}),
    React.createElement('div', {style:{width:8, height:8, borderRadius:'50%', backgroundColor:D.green}}),
    React.createElement('div', {style:{
      color: D.text_dim, fontFamily: D.font_mono, fontSize: Math.round(w * 0.008),
      marginLeft: 8
    }}, paramText)
  );
  const counterEl = React.createElement('div', {style:{
    color: countCol, fontFamily: D.font_display, fontWeight: '700',
    fontSize: Math.round(w * countSize),
    textAlign:'center',
    marginTop: Math.round(h * 0.04),
  }}, fmt(count));
  const subLabel = React.createElement('div', {style:{
    color: D.text_dim, fontFamily: D.font_mono, fontSize: Math.round(w * 0.009),
    textAlign:'center', marginTop: Math.round(h * 0.01)
  }}, 'thinking tokens');
  const termBody = React.createElement('div', {style:{
    flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
    padding: Math.round(h * 0.02),
  }}, counterEl, subLabel);
  const term = React.createElement('div', {style:{
    position:'absolute', left:x, top:termTop, width:termW, height:termH,
    backgroundColor: D.surface,
    border: '1px solid ' + borderCol,
    borderRadius: 8,
    borderTop: '3px solid ' + borderCol,
    display:'flex', flexDirection:'column',
    opacity: sp,
    transform: 'translateY(' + Math.round((1 - sp) * 40) + 'px)',
  }}, header, termBody);
  const titleEl = React.createElement('div', {style:{
    position:'absolute', left:x, top: termTop - Math.round(h * 0.06),
    width: termW, textAlign:'center',
    color: labelCol, fontFamily: D.font_mono, fontSize: Math.round(w * 0.011), fontWeight:'700',
    opacity: sp,
  }}, label);
  return [titleEl, term];
};

const leftParts = makeTerminal(leftX, 'LOW EFFORT', D.green, D.green, 'effort: "low"', lowCount, D.green, 0.026, 0);
const rightParts = makeTerminal(rightX, 'MAX EFFORT', D.red, D.red, 'effort: "max"', maxCount, D.red, 0.036, 10);

return [backdrop].concat(leftParts).concat(rightParts);
