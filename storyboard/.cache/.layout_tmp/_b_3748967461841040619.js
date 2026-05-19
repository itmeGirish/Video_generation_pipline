const NARRATION_TEXT = "I want to leave you with something bigger than benchmarks. A way of seeing this whole thing that I think most people are missing. <pause 0.4s> OpenAI isn't competing with Anthropic.";
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const textOp=interpolate(frame,[12,28],[0,1],{extrapolateRight:'clamp'});
const pulseVal=Math.sin(frame*.12)*.15+.85;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.03)}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900,opacity:textOp,textShadow:`0 0 ${Math.round(40*pulseVal)}px ${D.violet}`,textAlign:'center',lineHeight:1.3}},'OpenAI isn\'t competing'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900,opacity:textOp,textShadow:`0 0 ${Math.round(40*pulseVal)}px ${D.violet}`,textAlign:'center',lineHeight:1.3}},'with Anthropic.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[30,44],[0,1],{extrapolateRight:'clamp'}),marginTop:Math.round(height*.02)}},'I know.  Sounds wrong.')
  )
);