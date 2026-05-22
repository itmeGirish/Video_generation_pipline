const NARRATION_TEXT = "So here's the answer to the question we opened with. <pause 0.2s> Why do two identical prompts cost completely different amounts? Because someone left the dial on max \u2014 and never checked if it helped. <pause 0.4s> Low for simple tasks. <pause 0.2s> Medium for complex ones. <pause 0.2s> High only when being wrong is expensive. <pause 0.4s> Higher thinking doesn't make the model smarter. It gives the model more time to be wrong \u2014 at a higher price. <pause 0.5s> Get this right and you can cut your reasoning costs by three to five times \u2014 sometimes more. <pause 0.3s> Subscribe \u2014 I'm breaking down one of these settings every week. Next up: tool-use patterns, the other dial most developers ignore.";

const w = width, h = height;
const op = interpolate(frame, [0, 15], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const sub = React.createElement('div', {style:{
  position:'absolute', top:0, left:0, right:0, bottom:0,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  gap: Math.round(h * 0.018),
  opacity: op,
}},
  React.createElement('div', {style:{
    color: D.text_dim,
    fontFamily: D.font_mono,
    fontSize: Math.round(w * 0.013),
    textAlign:'center',
    lineHeight: 1.6,
  }}, 'Subscribe — I\'m breaking down one of these settings every week.'),
  React.createElement('div', {style:{
    color: D.text_dim,
    fontFamily: D.font_mono,
    fontSize: Math.round(w * 0.011),
    textAlign:'center',
    lineHeight: 1.5,
  }}, 'Next up: tool-use patterns, the other dial most developers ignore.')
);

return [sub];
