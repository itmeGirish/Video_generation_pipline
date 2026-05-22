const NARRATION_TEXT = "<pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const panelW = Math.round(w * 0.46);
const panelTop = Math.round(h * 0.16);
const leftX = Math.round(w * 0.02);
const contentTop = panelTop + Math.round(h * 0.08);
const contentLeft = leftX + Math.round(w * 0.025);
const lineH = Math.round(h * 0.030);
const lineGap = Math.round(h * 0.008);
const totalLines = 14;
const lineW = Math.round(panelW * 0.82);

const lineEls = Array.from({length: totalLines}, function(_, i) {
  const sp = spring({frame: frame - i * 8, fps, config:{damping:20, stiffness:200}});
  const lineLen = Math.round(lineW * (0.55 + (i % 3) * 0.15));
  return React.createElement('div', {
    key: i,
    style: {
      position:'absolute',
      left: contentLeft,
      top: contentTop + i * (lineH + lineGap),
      width: Math.round(lineLen * sp),
      height: lineH,
      backgroundColor: D.text_dim,
      borderRadius: 2,
      opacity: sp * 0.5,
    }
  });
});

return lineEls;
