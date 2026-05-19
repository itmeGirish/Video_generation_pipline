const NARRATION_TEXT = "<pause 0.3s> Now when the job is fixing real bugs in real code \u2014 watch the cyan runner. <pause 0.2s> SWE-bench Pro.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const trackOp=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.14),left:'50%',transform:'translateX(-50%)',color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,opacity:trackOp,letterSpacing:2}},'⬡  WHEN AI NEEDS TO REASON'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,width:W,height:TH,border:'2px solid '+D.cyan,borderRadius:6,opacity:trackOp,boxShadow:'0 0 18px '+D.cyan}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,width:W,height:TH,border:'2px solid '+D.violet,borderRadius:6,opacity:trackOp*.5}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:trackOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:trackOp*.5}},'GPT-5.5')
);