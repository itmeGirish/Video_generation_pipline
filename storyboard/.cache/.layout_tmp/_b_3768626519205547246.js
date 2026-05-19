const NARRATION_TEXT = "And let me show you exactly how. <pause 0.3s> Watch the screen \u2014 I'm building you a real pipeline. <pause 0.2s> A user submits a legal question. That query drops onto the line. First stop: GPT-5.5 at medium effort.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const fillH=Math.round(interpolate(frame,[0,30],[0,Math.round(height*.28)],{extrapolateRight:'clamp'}));
const tokenCount=Math.round(interpolate(frame,[0,30],[0,1200],{extrapolateRight:'clamp'}));
const costOp=interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.26); const MH=Math.round(height*.42);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:Math.round(height*.22),width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'2px solid '+D.violet,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:Math.round(width*.015)}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'GPT-5.5  DRAFT'),
    React.createElement('div',{style:{width:'85%',height:Math.round(height*.22),backgroundColor:D.bg,borderRadius:6,position:'relative',overflow:'hidden'}},
      React.createElement('div',{style:{position:'absolute',bottom:0,left:0,right:0,height:fillH,backgroundColor:D.violet,opacity:.5}}),
      React.createElement('div',{style:{position:'absolute',top:8,right:8,color:D.red,fontSize:Math.round(width*.018)}},'🚩'),
      React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),right:10,color:D.red,fontSize:Math.round(width*.016)}},'🚩')
    ),
    React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:4,opacity:costOp}},
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008)}},tokenCount.toLocaleString()+' tokens'),
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'$0.06  /  3s')
    )
  )
);