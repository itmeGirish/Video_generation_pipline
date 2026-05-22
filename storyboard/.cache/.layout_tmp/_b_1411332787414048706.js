const NARRATION_TEXT = "When you set effort to high, the model doesn't try harder the way a human would. It generates a hidden scratchpad \u2014 thinking tokens \u2014 before writing its answer. <pause 0.3s> These tokens are invisible to you. <pause 0.2s> But they're billed at full output token rates. A low-effort request might use five hundred thinking tokens. <pause 0.3s> The same request on max effort? <pause 0.3s> Tens of thousands. <pause 0.5s> That scratchpad is where your money goes.";

const w = width, h = height;
const backdrop = React.createElement(AbsoluteFill, {
  style: {
    backgroundColor: D.bg,
    opacity: interpolate(frame, [0, 6], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})
  }
});

const colW = Math.round(w * 0.42);
const colH = Math.round(h * 0.72);
const colTop = Math.round(h * 0.12);
const leftX = Math.round(w * 0.04);
const rightX = Math.round(w * 0.54);

// LOW column
const spL = spring({frame, fps, config:{damping:8}});
const lowLines = [0.6, 0.5, 0.7, 0.4].map(function(pct, i) {
  return React.createElement('div',{key:i, style:{
    height:Math.round(h*0.022), width:Math.round(colW*pct*0.80),
    backgroundColor:D.text_dim, borderRadius:2, opacity:0.5
  }});
});
const lowCol = React.createElement('div', {style:{
  position:'absolute', left:leftX, top:colTop, width:colW, height:colH,
  backgroundColor:D.surface, borderRadius:8, border:'2px solid ' + D.green,
  opacity:spL, transform:'scale(' + (0.85+0.15*spL) + ')',
  display:'flex', flexDirection:'column',
  padding:Math.round(h*0.03), boxSizing:'border-box', gap:Math.round(h*0.012),
}},
  React.createElement('div', {style:{color:D.green, fontFamily:D.font_mono, fontSize:Math.round(w*0.012), fontWeight:'700'}}, 'LOW EFFORT'),
  React.createElement('div', {style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008)}}, 'effort: "low"'),
  React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:Math.round(h*0.008), marginTop:Math.round(h*0.015)}}, lowLines),
  React.createElement('div', {style:{marginTop:'auto', display:'flex', flexDirection:'column', alignItems:'center', gap:6}},
    React.createElement('div',{style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008)}}, 'THINKING TOKENS'),
    React.createElement('div',{style:{color:D.green, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.032)}}, '500')
  )
);

// MAX column
const spR = spring({frame: frame - 10, fps, config:{damping:8}});
const maxLines = [0.6,0.5,0.7,0.4,0.6,0.5,0.8,0.5,0.7,0.6,0.5,0.8,0.6,0.5,0.7,0.4,0.6,0.5,0.8,0.6,0.5,0.7,0.4,0.6,0.5,0.8,0.5,0.7].map(function(pct, i) {
  return React.createElement('div',{key:i, style:{
    height:Math.round(h*0.018), width:Math.round(colW*pct*0.80),
    backgroundColor:D.text_dim, borderRadius:2, opacity:0.5
  }});
});
const maxCol = React.createElement('div', {style:{
  position:'absolute', left:rightX, top:colTop, width:colW, height:colH,
  backgroundColor:D.surface, borderRadius:8, border:'2px solid ' + D.red,
  opacity:spR, transform:'scale(' + (0.85+0.15*spR) + ')',
  display:'flex', flexDirection:'column',
  padding:Math.round(h*0.03), boxSizing:'border-box', gap:Math.round(h*0.008),
  overflow:'hidden',
}},
  React.createElement('div', {style:{color:D.red, fontFamily:D.font_mono, fontSize:Math.round(w*0.012), fontWeight:'700'}}, 'MAX EFFORT'),
  React.createElement('div', {style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008)}}, 'effort: "max"'),
  React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:4, marginTop:Math.round(h*0.010), overflow:'hidden', flexGrow:1}}, maxLines),
  React.createElement('div', {style:{marginTop:Math.round(h*0.008), display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0}},
    React.createElement('div',{style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.008)}}, 'THINKING TOKENS'),
    React.createElement('div',{style:{color:D.red, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.036)}}, '18,400')
  )
);

return [backdrop, lowCol, maxCol];
