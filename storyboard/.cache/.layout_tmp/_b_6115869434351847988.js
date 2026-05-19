const NARRATION_TEXT = "<pause 0.3s> It's a design choice. <pause 0.5s> Think about what OpenAI is building. A super app. An AI that browses your web, fills your spreadsheets, operates your computer. What happens if that AI says 'I don't know' in the middle of a ten-step workflow? <pause 0.3s> The whole thing stops. The agent stalls. The user gets frustrated. <pause 0.2s> So OpenAI trained GPT-5.5 to keep moving. Always have an answer.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cabinetOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:Math.round(width*.5),height:Math.round(height*.6),backgroundColor:D.surface,borderRadius:8,border:'1px solid '+D.text_dim,opacity:cabinetOp,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:Math.round(width*.02)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3}},'CASE FILES'),
    React.createElement('div',{style:{width:'85%',height:Math.round(height*.2),backgroundColor:D.bg,borderRadius:6,border:'2px solid '+D.red,display:'flex',alignItems:'center',justifyContent:'center'}}),
    React.createElement('div',{style:{width:'85%',height:Math.round(height*.2),backgroundColor:D.bg,borderRadius:6,border:'2px solid '+D.green,display:'flex',alignItems:'center',justifyContent:'center'}}),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700}},'SAME MODEL  ·  SAME 86%  ·  DIFFERENT STAKES')
  )
);