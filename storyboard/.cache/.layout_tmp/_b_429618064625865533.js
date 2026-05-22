const NARRATION_TEXT = "<pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const panelW = Math.round(w * 0.46);
const panelH = Math.round(h * 0.68);
const panelTop = Math.round(h * 0.16);
const leftX = Math.round(w * 0.02);
const rightX = Math.round(w * 0.52);

// Redraw both panel shells statically (B1 context is gone in slot-based rendering)
const leftPanel = React.createElement('div', {style:{
  position:'absolute', left:leftX, top:panelTop, width:panelW, height:panelH,
  backgroundColor:D.surface, borderRadius:8, border:'1px solid ' + D.cyan,
}});
const leftHeader = React.createElement('div', {style:{
  position:'absolute',
  left: leftX + Math.round(w*0.025), top: panelTop + Math.round(h*0.025),
  color:D.cyan, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
}}, 'THINKING SCRATCHPAD');
const rightPanel = React.createElement('div', {style:{
  position:'absolute', left:rightX, top:panelTop, width:panelW, height:panelH,
  backgroundColor:D.surface, borderRadius:8, border:'1px solid ' + D.text_dim,
}});
const rightHeader = React.createElement('div', {style:{
  position:'absolute',
  left: rightX + Math.round(w*0.025), top: panelTop + Math.round(h*0.025),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
}}, 'YOUR ANSWER');

// Animated thinking lines filling inside the left panel
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

return [leftPanel, leftHeader, rightPanel, rightHeader].concat(lineEls);
