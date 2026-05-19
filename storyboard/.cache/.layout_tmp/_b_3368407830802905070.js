const NARRATION_TEXT = "So. Did GPT-5.5 beat Claude Opus four-point-seven? <pause 0.5s> The answer is on the board.";
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const textOp=interpolate(frame,[12,28],[0,1],{extrapolateRight:'clamp'});
const qPulse=Math.sin(frame*.14)*.3+.7;
const qOp=interpolate(frame,[28,42],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.026),fontWeight:900,opacity:textOp,textAlign:'center',lineHeight:1.3}},'Did GPT-5.5 beat'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.026),fontWeight:900,opacity:textOp,textAlign:'center',lineHeight:1.3}},'Claude Opus 4.7?'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.06),fontWeight:900,opacity:qOp,textShadow:`0 0 ${Math.round(60*qPulse)}px ${D.amber}`}},'?')
  )
);