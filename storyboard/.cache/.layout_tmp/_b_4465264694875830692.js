const NARRATION_TEXT = "It drafts the answer. Twelve hundred tokens. Cost: six cents. Three seconds. <pause 0.2s> But see those red flags on the output?";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const scanY=interpolate(frame,[0,28],[0,Math.round(height*.26)],{extrapolateRight:'clamp'});
const flag1Removed=interpolate(frame,[20,26],[1,0],{extrapolateRight:'clamp'});
const sealOp=interpolate(spring({frame:Math.max(0,frame-32),fps,config:{damping:12,stiffness:90}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.28); const MH=Math.round(height*.44);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.07),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:op}},'TWO-MODEL PIPELINE  —  STEP 2 OF 2'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),top:Math.round(height*.17),width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'1px solid '+D.text_dim,opacity:op*.3,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.015)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'GPT-5.5  —  DRAFT'),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.022)}},'✓'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'SENT  $0.06 DONE')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.028),opacity:op*.6}},'→'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),top:Math.round(height*.17),width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'2px solid '+D.cyan,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:Math.round(width*.015)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'CLAUDE 4.7  —  FACT-CHECK'),
    React.createElement('div',{style:{width:'85%',height:Math.round(height*.22),backgroundColor:D.bg,borderRadius:6,position:'relative',overflow:'hidden'}},
      React.createElement('div',{style:{position:'absolute',top:scanY,left:0,right:0,height:2,backgroundColor:D.cyan,opacity:.6}}),
      React.createElement('div',{style:{position:'absolute',top:8,right:8,color:D.green,fontSize:Math.round(width*.018)}},'✓'),
      React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),right:10,color:D.red,fontSize:Math.round(width*.016),opacity:flag1Removed}},flag1Removed>.5?'🚩':'✗')
    ),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,opacity:sealOp}},'✓ VERIFIED')
  )
);