const NARRATION_TEXT = "<pause 0.3s> It's a design choice. <pause 0.5s> Think about what OpenAI is building. A super app. An AI that browses your web, fills your spreadsheets, operates your computer. What happens if that AI says 'I don't know' in the middle of a ten-step workflow? <pause 0.3s> The whole thing stops. The agent stalls. The user gets frustrated. <pause 0.2s> So OpenAI trained GPT-5.5 to keep moving. Always have an answer.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cabinetOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const lawyerOp=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const founderOp=interpolate(frame,[28,42],[0,1],{extrapolateRight:'clamp'});
const tagOp=interpolate(frame,[40,54],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:Math.round(width*.72),display:'flex',flexDirection:'column',gap:Math.round(height*.024),opacity:cabinetOp}},
    React.createElement('div',{style:{backgroundColor:D.surface,borderRadius:8,border:'2px solid '+D.red,padding:`${Math.round(height*.022)}px ${Math.round(width*.022)}px`,opacity:lawyerOp}},
      React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,letterSpacing:2,marginBottom:Math.round(height*.012)}},'THE LAWYER  —  GPT-5.5 query'),
      React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.01),lineHeight:1.6}},'12 citations returned.  2 are fabricated.  You don\'t know which.'),
      React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:Math.round(height*.01)}},'$0.06 API call  →  Career-level damage')
    ),
    React.createElement('div',{style:{backgroundColor:D.surface,borderRadius:8,border:'2px solid '+D.green,padding:`${Math.round(height*.022)}px ${Math.round(width*.022)}px`,opacity:founderOp}},
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,letterSpacing:2,marginBottom:Math.round(height*.012)}},'THE STARTUP FOUNDER  —  GPT-5.5 query'),
      React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.01),lineHeight:1.6}},'Wrong hotel recommendation.  Rebook in 30 seconds.  Nobody fired.'),
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:Math.round(height*.01)}},'$0.06 API call  →  30 seconds lost')
    ),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,textAlign:'center',opacity:tagOp}},'SAME MODEL  ·  SAME 86%  ·  DIFFERENT STAKES')
  )
);