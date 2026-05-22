const NARRATION_TEXT = "When you set effort to high, the model doesn't try harder the way a human would. It generates a hidden scratchpad \u2014 thinking tokens \u2014 before writing its answer. <pause 0.3s> These tokens are invisible to you. <pause 0.2s> But they're billed at full output token rates. A low-effort request might use five hundred thinking tokens. <pause 0.3s> The same request on max effort? <pause 0.3s> Tens of thousands. <pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const backdrop = React.createElement(AbsoluteFill, {
  style: {
    backgroundColor: D.bg,
    opacity: interpolate(frame, [0, 6], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})
  }
});

const panelW = Math.round(w * 0.46);
const panelH = Math.round(h * 0.58);
const panelTop = Math.round(h * 0.10);
const leftX = Math.round(w * 0.02);
const rightX = Math.round(w * 0.52);

// Redraw left panel (scratchpad — with lines visible)
const leftPanel = React.createElement('div', {style:{
  position:'absolute', left:leftX, top:panelTop, width:panelW, height:panelH,
  backgroundColor:D.surface, borderRadius:8, border:'1px solid ' + D.cyan,
  display:'flex', flexDirection:'column',
  padding:Math.round(h*0.025), boxSizing:'border-box', gap:Math.round(h*0.010),
}},
  React.createElement('div', {style:{color:D.cyan, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'}}, 'THINKING SCRATCHPAD'),
  ...[0.5, 0.5, 0.7, 0.4, 0.6, 0.5, 0.8, 0.5].map(function(pct, i) {
    return React.createElement('div', {key:i, style:{
      height:Math.round(h*0.022), width: Math.round(panelW*pct*0.85),
      backgroundColor:D.text_dim, borderRadius:2, opacity:0.4
    }});
  })
);

// Right panel
const rightPanel = React.createElement('div', {style:{
  position:'absolute', left:rightX, top:panelTop, width:panelW, height:panelH,
  backgroundColor:D.surface, borderRadius:8, border:'2px solid ' + D.cyan,
  display:'flex', flexDirection:'column',
  padding:Math.round(h*0.025), boxSizing:'border-box', gap:Math.round(h*0.012),
}},
  React.createElement('div', {style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'}}, 'YOUR ANSWER'),
  ...[0,1,2].map(function(i) {
    return React.createElement('div',{key:i, style:{
      color:D.text, fontFamily:D.font_mono, fontSize:Math.round(w*0.009), opacity:0.8
    }}, ['Analyzing input...', 'Cross-referencing...', 'Response ready.'][i]);
  })
);

// Token counter below left panel
const counterBottom = panelTop + panelH + Math.round(h * 0.03);
const maxCount = 18400;
const count = Math.min(Math.round(interpolate(frame, [8, durationInFrames * 0.80], [0, maxCount], {extrapolateRight:'clamp'})), maxCount);
const spLabel = spring({frame: frame, fps, config:{damping:200}});

const counterEl = React.createElement('div', {style:{
  position:'absolute',
  left: leftX,
  top: counterBottom,
  width: panelW,
  display:'flex',
  flexDirection:'column',
  alignItems:'center',
  gap:6,
}},
  React.createElement('div', {style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.009)}}, 'THINKING TOKENS:'),
  React.createElement('div', {style:{color:D.amber, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.028)}}, count.toLocaleString()),
  React.createElement('div', {style:{
    color:D.red, fontFamily:D.font_mono, fontSize:Math.round(w*0.008),
    opacity: spLabel,
  }}, 'BILLED AS OUTPUT TOKENS')
);

return [backdrop, leftPanel, rightPanel, counterEl];
