const NARRATION_TEXT = "Benchmarks. I'll go fast \u2014 the pattern matters more than any individual score. <pause 0.3s> When the job is operating a computer on its own \u2014 terminals, desktops, chaining tools \u2014 watch the magenta runner.";
const gpt=interpolate(frame,[0,35],[0,82.7],{extrapolateRight:'clamp'});
const cld=interpolate(frame,[0,35],[0,69.4],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const labelOp=interpolate(frame,[30,42],[0,1],{extrapolateRight:'clamp'});
const deltaOp=interpolate(spring({frame:Math.max(0,frame-38),fps,config:{damping:8,stiffness:80}}),[0,1],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+8,top:TY1+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:labelOp}},gpt.toFixed(1)+'%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+8,top:TY2+Math.round(TH*.15),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},cld.toFixed(1)+'%'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(TY1-height*.08),transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:labelOp,textAlign:'center'}},'TERMINAL-BENCH 2.0'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(TY1+TH*.1),backgroundColor:D.violet,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'4px 10px',borderRadius:4,opacity:deltaOp,transform:`scale(${deltaOp})`}},'+13.3 PTS')
);