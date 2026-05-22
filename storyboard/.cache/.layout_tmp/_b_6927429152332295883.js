const NARRATION_TEXT = "<pause 0.3s> The same request on max effort? <pause 0.3s> Tens of thousands. <pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const backdrop = React.createElement(AbsoluteFill, {
  style: {
    backgroundColor: D.bg,
    opacity: interpolate(frame, [0, 8], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})
  }
});
const tag = React.createElement('div', {style:{
  position:'absolute', top:Math.round(h*0.03), left:Math.round(w*0.03),
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008), opacity:0.6
}}, 'S2');

const panelW = Math.round(w * 0.46);
const panelH = Math.round(h * 0.68);
const panelTop = Math.round(h * 0.16);
const leftX = Math.round(w * 0.02);
const rightX = Math.round(w * 0.52);

const spL = spring({frame: frame, fps, config:{damping:20, stiffness:200}});
const spR = spring({frame: frame - 8, fps, config:{damping:20, stiffness:200}});

const leftPanel = React.createElement('div', {style:{
  position:'absolute', left:leftX, top:panelTop, width:panelW, height:panelH,
  backgroundColor:D.surface, borderRadius:8, border:'1px solid ' + D.cyan,
  opacity:spL, transform:'translateX(' + Math.round((spL-1)*80) + 'px)',
  display:'flex', flexDirection:'column',
  padding:Math.round(h*0.025), boxSizing:'border-box', gap:Math.round(h*0.015),
}},
  React.createElement('div', {style:{
    color:D.cyan, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
  }}, 'THINKING SCRATCHPAD'),
  React.createElement('div', {style:{
    width:'100%', height:1, backgroundColor:D.surface
  }})
);

const rightPanel = React.createElement('div', {style:{
  position:'absolute', left:rightX, top:panelTop, width:panelW, height:panelH,
  backgroundColor:D.surface, borderRadius:8, border:'1px solid ' + D.text_dim,
  opacity:spR, transform:'translateX(' + Math.round((1-spR)*80) + 'px)',
  display:'flex', flexDirection:'column',
  padding:Math.round(h*0.025), boxSizing:'border-box', gap:Math.round(h*0.015),
}},
  React.createElement('div', {style:{
    color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
  }}, 'YOUR ANSWER')
);

return [backdrop, tag, leftPanel, rightPanel];
