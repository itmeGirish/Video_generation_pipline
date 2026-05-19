const NARRATION_TEXT = "<pause 0.5s> Fact two.";
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const qOp=interpolate(frame,[6,18],[0,1],{extrapolateRight:'clamp'});
const aOp=interpolate(frame,[22,34],[0,1],{extrapolateRight:'clamp'});
const warnOp=interpolate(frame,[40,52],[0,1],{extrapolateRight:'clamp'});
const glowR=Math.sin(frame*.15)*.2+.8;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:3,opacity:.6}},'ARTIFICIAL ANALYSIS — HALLUCINATION BENCHMARK'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),right:Math.round(width*.1),top:Math.round(height*.2),display:'flex',flexDirection:'column',gap:Math.round(height*.03)}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:Math.round(height*.22),right:Math.round(width*.1),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.025)}px ${Math.round(width*.022)}px`,opacity:qOp}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginBottom:Math.round(height*.01)}},'PROMPT'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.011)}},'What was the closing price of NVDA on March 3, 2019?')
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:Math.round(height*.46),right:Math.round(width*.1),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.025)}px ${Math.round(width*.022)}px`,border:`1px solid ${D.red}`,opacity:aOp}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginBottom:Math.round(height*.01)}},'GPT-5.5 RESPONSE'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.011)}},'The closing price of NVDA on March 3, 2019 was $152.47.'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),marginTop:Math.round(height*.012),opacity:warnOp,textShadow:`0 0 10px ${D.red}`}},'⚠ INVENTED — actual price was $154.42  ·  model had no access to this data')
  )
);