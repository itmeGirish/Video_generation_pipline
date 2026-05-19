const NARRATION_TEXT = "The other is a generalist that does everything. <pause 0.2s> Get that distinction and everything I'm about to show you clicks.";
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lOp=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const rOp=interpolate(frame,[15,27],[0,1],{extrapolateRight:'clamp'});
const bOp=interpolate(frame,[26,38],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.15),bottom:Math.round(height*.15),width:1,backgroundColor:D.text_dim,opacity:.3}}),
  React.createElement('div',{style:{position:'absolute',left:0,width:'50%',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.018),opacity:lOp}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.024),fontWeight:900}},'CONSULTANT'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.012)}},'Claude Opus 4.7'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},'87.6% SWE-bench   36% hallucination')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',width:'50%',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.018),opacity:rOp}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.024),fontWeight:900}},'OPERATING SYSTEM'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.012)}},'GPT-5.5'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},'82.7% Terminal-bench   86% hallucination')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.09),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:bOp}},"THEY'RE NOT IN THE SAME RACE.")
);