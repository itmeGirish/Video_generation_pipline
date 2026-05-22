const NARRATION_TEXT = "When you set effort to high, the model doesn't try harder the way a human would. It generates a hidden scratchpad \u2014 thinking tokens \u2014 before writing its answer. <pause 0.3s> These tokens are invisible to you. <pause 0.2s> But they're billed at full output token rates. A low-effort request might use five hundred thinking tokens. <pause 0.3s> The same request on max effort? <pause 0.3s> Tens of thousands. <pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const panelW = Math.round(w * 0.46);
const panelH = Math.round(h * 0.68);
const panelTop = Math.round(h * 0.16);
const rightX = Math.round(w * 0.52);
const leftX = Math.round(w * 0.02);
const leftMid = leftX + Math.round(panelW / 2);
const rightMid = rightX + Math.round(panelW / 2);

// Border reveal on right panel
const spBorder = spring({frame, fps, config:{damping:200}});

// 3 answer lines
const answerLines = [
  'Analyzing input parameters...',
  'Cross-referencing context...',
  'Generating response.',
];
const contentTop = panelTop + Math.round(h * 0.09);
const answerEls = answerLines.map(function(txt, i) {
  const sp = spring({frame: frame - i * 10, fps, config:{damping:20, stiffness:200}});
  return React.createElement('div', {
    key: i,
    style: {
      position:'absolute',
      left: rightX + Math.round(panelW * 0.06),
      top: contentTop + i * Math.round(h * 0.04),
      color: D.text,
      fontFamily: D.font_mono,
      fontSize: Math.round(w * 0.009),
      opacity: sp,
    }
  }, txt);
});

// Arrow from left panel to right panel
const arrowProgress = interpolate(frame, [8, 28], [0, 1], {extrapolateRight:'clamp'});
const arrowY = panelTop + Math.round(panelH * 0.50);
const arrowStartX = leftMid + Math.round(panelW * 0.50);
const arrowEndX = rightMid - Math.round(panelW * 0.50);
const arrowWidth = Math.round((arrowEndX - arrowStartX) * arrowProgress);
const arrowEl = React.createElement('div', {style:{
  position:'absolute',
  left: arrowStartX,
  top: arrowY - 2,
  width: Math.max(0, arrowWidth),
  height: 3,
  backgroundColor: D.cyan,
}});

// Cyan border overlay on right panel
const borderEl = React.createElement('div', {style:{
  position:'absolute',
  left: rightX,
  top: panelTop,
  width: panelW,
  height: panelH,
  borderRadius: 8,
  border: '2px solid ' + D.cyan,
  opacity: spBorder,
}});

return [borderEl, arrowEl].concat(answerEls);
