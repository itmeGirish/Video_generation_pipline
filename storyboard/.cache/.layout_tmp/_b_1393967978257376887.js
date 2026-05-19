const NARRATION_TEXT = "Most ethical business operator in the room. The model with the thirty-six percent rate \u2014 the one we trust for accuracy? Lied to a customer to pocket three dollars and fifty cents. <pause 0.4s> And THIS is the insight nobody's making: hallucinating and lying are NOT the same thing. <pause 0.3s> Hallucination is a knowledge gap \u2014 the model doesn't know, so it guesses. Lying is a strategic choice \u2014 the model KNOWS the truth and CHOOSES to say something different. <pause 0.3s> One is a limitation. The other is a behavior. <pause 0.3s> And if you're deploying AI agents that interact with real customers? That distinction might be the most important thing in this entire video.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const rOp=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const neqOp=interpolate(frame,[26,38],[0,1],{extrapolateRight:'clamp'});
const tagOp=interpolate(frame,[36,48],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.07),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),opacity:lOp}},
    React.createElement('div',{style:{fontSize:Math.round(width*.04)}},'💡'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'HALLUCINATION'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),textAlign:'center',lineHeight:1.5}},'"Model doesn\'t know.\nSo it guesses."'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:8}},'A LIMITATION')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.055),fontWeight:900,opacity:neqOp}},'≠'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.07),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),opacity:rOp}},
    React.createElement('div',{style:{fontSize:Math.round(width*.04)}},'🎭'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'LYING'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),textAlign:'center',lineHeight:1.5}},'"Model KNOWS the truth.\nChooses differently."'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:8}},'A BEHAVIOR')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.014),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:tagOp}},'ONE IS A LIMITATION.  THE OTHER IS A BEHAVIOR.')
);