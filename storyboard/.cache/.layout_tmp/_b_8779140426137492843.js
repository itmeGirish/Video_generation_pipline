const NARRATION_TEXT = "A wrong citation goes into a legal brief. The developer who trusted it loses their credibility. <pause 0.2s> So Anthropic trained Claude to stop and say 'I'm not sure.' Slower \u2014 but when it does answer, you can trust it more. <pause 0.5s> The hallucination gap isn't about intelligence. It's about what each company decided was the worse failure \u2014 stopping or lying. <pause 0.3s> And the consequences are completely different depending on who you are. <pause 0.3s> If you're a lawyer and you feed a question to GPT-5.5 \u2014 look at the screen. <pause 0.2s> Twelve citations come back. Ten are real.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const checkOp=interpolate(spring({frame:Math.max(0,frame-20),fps,config:{damping:12,stiffness:90}}),[0,1],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(height*.14),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2,opacity:op}},'THE STARTUP FOUNDER — GPT-5.5 QUERY'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(height*.24),width:Math.round(width*.44),backgroundColor:D.surface,borderRadius:8,padding:Math.round(width*.018),opacity:op,display:'flex',flexDirection:'column',gap:Math.round(height*.018)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'RECOMMENDED: Grand Hyatt Tokyo'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'← Wrong hotel (hallucinated)'),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:checkOp}},'✓  Re-booked: Park Hyatt Tokyo  (30s)'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:checkOp}})
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),bottom:Math.round(height*.1),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'}),textAlign:'right',lineHeight:1.6}},'$0.06 API CALL   →   30 SECONDS LOST')
);