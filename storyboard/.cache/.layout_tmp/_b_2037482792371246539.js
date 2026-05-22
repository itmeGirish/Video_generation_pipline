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

// All three branches static
const leafDefs = [
  {x:Math.round(w*0.04), col:D.green, q:'Answer obvious from input?', a:'YES → LOW'},
  {x:Math.round(w*0.36), col:D.amber, q:'Multiple reasoning steps?', a:'YES → MEDIUM'},
  {x:Math.round(w*0.68), col:D.red, q:'Wrong answer costly?', a:'YES → HIGH / MAX'},
];

const branchEls = leafDefs.map(function(ld, i) {
  const cx = ld.x + Math.round(leafW / 2);
  const dx = cx - rootCX, dy = leafY - rootBottomY;
  const len = Math.round(Math.sqrt(dx*dx + dy*dy));
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const line = React.createElement('div', {key:'line-' + i, style:{
    position:'absolute', left:rootCX, top:rootBottomY,
    width: i === 1 ? dy : len, height:2, backgroundColor:ld.col,
    transform: i === 1 ? 'none' : 'rotate('+ang+'deg)',
    transformOrigin:'left center',
  }});
  const leaf = React.createElement('div', {key:'leaf-' + i, style:{
    position:'absolute', left:ld.x, top:leafY,
    width:leafW, height:leafH, backgroundColor:D.surface,
    border:'2px solid ' + ld.col, borderRadius:8,
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    gap:Math.round(h*0.012), padding:Math.round(h*0.018), boxSizing:'border-box',
  }},
    React.createElement('div', {style:{color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.010), textAlign:'center'}}, ld.q),
    React.createElement('div', {style:{color:ld.col, fontFamily:D.font_display, fontWeight:'700', fontSize:Math.round(w*0.016)}}, ld.a)
  );
  return [line, leaf];
}).reduce(function(a, b) { return a.concat(b); }, []);

// Banner slides up from bottom
const bannerH = Math.round(h * 0.11);
const spBanner = spring({frame: frame, fps, config:{damping:20, stiffness:200}});
const banner = React.createElement('div', {style:{
  position:'absolute', left:0, bottom: Math.round(h * 0.04),
  width:w, height:bannerH,
  backgroundColor: D.cyan,
  display:'flex', alignItems:'center', justifyContent:'center',
  opacity: spBanner,
  transform: 'translateY(' + Math.round((1 - spBanner) * 60) + 'px)',
}},
  React.createElement('div', {style:{
    color: D.bg, fontFamily: D.font_display, fontWeight:'700',
    fontSize: Math.round(w * 0.015), textAlign:'center',
  }}, 'OPENAI DEFAULT: MEDIUM — BENCHMARK DOWN FOR SIMPLE TASKS.')
);

return [root].concat(branchEls).concat([banner]);
