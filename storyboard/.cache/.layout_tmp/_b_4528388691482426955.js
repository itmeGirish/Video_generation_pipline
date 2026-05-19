const NARRATION_TEXT = "Now here's where I need you to lean in, because this is the part nobody else is explaining. <pause 0.4s> There's a benchmark called AA-Omniscience. It tests one thing: when the model doesn't know the answer, what does it do? Does it admit it?";
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const textOp=interpolate(frame,[14,28],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S5'),
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.014),opacity:textOp,textAlign:'center',lineHeight:1.6}},
    'WHEN AI DOESN\'T KNOW THE ANSWER…')
);