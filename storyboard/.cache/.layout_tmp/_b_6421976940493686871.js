const NARRATION_TEXT = "So here's the answer to the question we opened with. <pause 0.2s> Why do two identical prompts cost completely different amounts? Because someone left the dial on max \u2014 and never checked if it helped. <pause 0.4s> Low for simple tasks. <pause 0.2s> Medium for complex ones. <pause 0.2s> High only when being wrong is expensive. <pause 0.4s> Higher thinking doesn't make the model smarter. It gives the model more time to be wrong \u2014 at a higher price. <pause 0.5s> Get this right and you can cut your reasoning costs by three to five times \u2014 sometimes more. <pause 0.3s> Subscribe \u2014 I'm breaking down one of these settings every week. Next up: tool-use patterns, the other dial most developers ignore.";

const w = width, h = height;
const lines = [
  {text:"Higher thinking doesn't make the model smarter.", col:D.text, size:0.022},
  {text:"It gives it more time to be wrong â€” at a higher price.", col:D.cyan, size:0.022},
];
const lineEls = lines.map(function(line, i) {
  const sp = spring({frame: frame - i * 10, fps, config:{damping:12, stiffness:90, mass:2}});
  return React.createElement('div', {key:i, style:{
    color: line.col,
    fontFamily: D.font_display,
    fontWeight: '700',
    fontSize: Math.round(w * line.size),
    textAlign:'center',
    lineHeight: 1.4,
    opacity: sp,
    transform: 'scale(' + (0.7 + 0.3 * sp) + ')',
    maxWidth: Math.round(w * 0.78),
  }}, line.text);
});

const container = React.createElement('div', {style:{
  position:'absolute', top:0, left:0, right:0, bottom:0,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  gap: Math.round(h * 0.030),
  backgroundColor: D.bg + 'DD',
}}, lineEls);

return [container];
