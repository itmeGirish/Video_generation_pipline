const NARRATION_TEXT = "Senior engineer. <pause 0.2s> Choose accordingly.";
const op=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const leftOp=interpolate(frame,[0,16],[0,1],{extrapolateRight:'clamp'});
const rightOp=interpolate(frame,[12,28],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',gap:Math.round(width*.08),opacity:op}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.018),opacity:leftOp}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900}},'GPT-5.5'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900}},'BRILLIANT INTERN'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},'"Hard to wrangle.  Unpredictable.  Fast."')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.018)}},'vs'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.018),opacity:rightOp}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900}},'CLAUDE 4.7'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900}},'SENIOR ENGINEER'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},'"Methodical.  Self-verified.  Reliable."')
  )
);