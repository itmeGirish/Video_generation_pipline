const NARRATION_TEXT = "Here's the decision rule that fixes this. <pause 0.2s> Before choosing an effort level, ask three questions. First: is the answer obvious from the input? <pause 0.2s> If yes \u2014 use low. Second: does the task require multiple reasoning steps? <pause 0.2s> If yes \u2014 use medium. Third: is a wrong answer costly in money, reputation, or safety? <pause 0.3s> If yes \u2014 and only if yes \u2014 use high or max. OpenAI defaults to medium. <pause 0.2s> For simple tasks, benchmarking down from there saves even more. <pause 0.3s> Go higher only when your evals prove it's actually better \u2014 not just because it feels like it should be. <pause 0.3s>";

const w = width, h = height;
const rootW = Math.round(w * 0.38);
const rootH = Math.round(h * 0.13);
const rootX = Math.round((w - rootW) / 2);
const rootY = Math.round(h * 0.10);
const rootCX = rootX + Math.round(rootW / 2);
const rootBottomY = rootY + rootH;
const leafW = Math.round(w * 0.28);
const leafH = Math.round(h * 0.20);
const leafY = Math.round(h * 0.46);

const root = React.createElement('div', {style:{
  position:'absolute', left:rootX, top:rootY,
  width:rootW, height:rootH, backgroundColor:D.surface,
  border:'2px solid ' + D.cyan, borderRadius:8,
  display:'flex', alignItems:'center', justifyContent:'center',
}},
  React.createElement('div', {style:{
    color:D.text, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.020), textAlign:'center'
  }}, 'WHAT IS THIS TASK?')
);

// Branch 1 static
const leftLeafCX = Math.round(w * 0.04) + Math.round(leafW / 2);
const dx1 = leftLeafCX - rootCX, dy1 = leafY - rootBottomY;
const len1 = Math.round(Math.sqrt(dx1*dx1 + dy1*dy1));
const ang1 = Math.atan2(dy1, dx1) * 180 / Math.PI;
const b1Line = React.createElement('div', {style:{
  position:'absolute', left:rootCX, top:rootBottomY,
  width:len1, height:2, backgroundColor:D.green,
  transform:'rotate('+ang1+'deg)', transformOrigin:'left center',
}});
const leftLeaf = React.createElement('div', {style:{
  position:'absolute', left:Math.round(w*0.04), top:leafY,
  width:leafW, height:leafH, backgroundColor:D.surface,
  border:'2px solid ' + D.green, borderRadius:8,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  gap:Math.round(h*0.012), padding:Math.round(h*0.018), boxSizing:'border-box',
}},
  React.createElement('div', {style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.010), textAlign:'center'}}, 'Answer obvious from input?'),
  React.createElement('div', {style:{color:D.green, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.016)}}, 'YES â†’ LOW')
);

// Branch 2 animated
const lineProgress = interpolate(frame, [0, 15], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const centerLeafX = Math.round(w * 0.36);
const centerLeafCX = centerLeafX + Math.round(leafW / 2);
const b2Line = React.createElement('div', {style:{
  position:'absolute', left:rootCX, top:rootBottomY,
  width: Math.round((leafY - rootBottomY) * lineProgress), height:2,
  backgroundColor:D.amber,
}});

const spLeaf2 = spring({frame: frame - 17, fps, config:{damping:20, stiffness:200}});
const centerLeaf = React.createElement('div', {style:{
  position:'absolute', left:centerLeafX, top:leafY,
  width:leafW, height:leafH, backgroundColor:D.surface,
  border:'2px solid ' + D.amber, borderRadius:8,
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  gap:Math.round(h*0.012), padding:Math.round(h*0.018), boxSizing:'border-box',
  opacity:spLeaf2, transform:'scale(' + (0.7 + 0.3 * spLeaf2) + ')',
}},
  React.createElement('div', {style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.010), textAlign:'center'}}, 'Multiple reasoning steps?'),
  React.createElement('div', {style:{color:D.amber, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.016)}}, 'YES â†’ MEDIUM')
);

return [root, b1Line, leftLeaf, b2Line, centerLeaf];
