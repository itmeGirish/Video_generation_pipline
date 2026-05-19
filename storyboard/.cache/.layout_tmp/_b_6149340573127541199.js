const NARRATION_TEXT = "<pause 0.3s> See it? <pause 0.3s> GPT-5.5 wins when AI needs to DO things. Claude wins when AI needs to THINK carefully.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const trackOp=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const badgeOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const leftSl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[-60,0],{extrapolateRight:'clamp'});
const rightSl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[60,0],{extrapolateRight:'clamp'});
const centerOp=interpolate(frame,[18,30],[0,1],{extrapolateRight:'clamp'});
const W=Math.round(width*.62); const TH=Math.round(height*.1); const TY1=Math.round(height*.26); const TY2=Math.round(height*.46);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.07),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:trackOp,letterSpacing:3}},'BENCHMARK SUMMARY  —  WHO WINS EACH CATEGORY'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1-Math.round(height*.042),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0078),opacity:trackOp}},'ACTING  (Terminal-Bench · OSWorld · GDPVal)'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18),top:TY1,height:TH,width:Math.round(W*.87),backgroundColor:D.violet,borderRadius:6,opacity:trackOp*.9}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18+W*.87)+8,top:TY1+Math.round(TH*.18),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:trackOp}},'GPT-5.5  ✓'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2-Math.round(height*.042),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0078),opacity:trackOp}},'REASONING  (SWE-bench · GPQA Diamond)'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18),top:TY2,height:TH,width:Math.round(W*.73),backgroundColor:D.cyan,borderRadius:6,opacity:trackOp*.9}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18+W*.73)+8,top:TY2+Math.round(TH*.18),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:trackOp}},'CLAUDE 4.7  ✓'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),bottom:Math.round(height*.2),opacity:badgeOp,transform:`translateX(${leftSl}px)`}},
    React.createElement('div',{style:{backgroundColor:D.violet,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'6px 14px',borderRadius:20}},'ACT  →  GPT-5.5')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),bottom:Math.round(height*.2),opacity:badgeOp,transform:`translateX(${rightSl}px)`}},
    React.createElement('div',{style:{backgroundColor:D.cyan,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'6px 14px',borderRadius:20}},'REASON  →  CLAUDE 4.7')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.08),transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:centerOp}},'DIFFERENT JOBS.  DIFFERENT WINNERS.')
);