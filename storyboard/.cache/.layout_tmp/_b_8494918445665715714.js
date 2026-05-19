const NARRATION_TEXT = "Claude wins when AI needs to THINK carefully. <pause 0.3s> The devs who use these daily confirm it.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const headerOp=interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.18),left:'50%',transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,opacity:headerOp,textAlign:'center'}},
    'WHAT DEVELOPERS SAY')
);