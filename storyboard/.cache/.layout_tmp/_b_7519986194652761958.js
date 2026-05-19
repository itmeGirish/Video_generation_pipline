const NARRATION_TEXT = "The highest confabulation rate of any frontier model. <pause 0.4s> Same model.";
const cycle = frame%60;
const r = interpolate(cycle,[0,59],[0,Math.round(width*.14)],{extrapolateRight:'clamp'});
const rOp = interpolate(cycle,[0,18,59],[0,.45,0],{extrapolateRight:'clamp'});
const r2 = interpolate(Math.max(0,cycle-20),[0,39],[0,Math.round(width*.1)],{extrapolateRight:'clamp'});
const r2Op = interpolate(Math.max(0,cycle-20),[0,14,39],[0,.3,0],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.26),transform:'translateX(-50%)',color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.19),fontWeight:900,lineHeight:1,textShadow:'0 0 60px '+D.red}},'86%'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'46%',width:r*2,height:r*2,marginLeft:-r,marginTop:-r,borderRadius:'50%',border:'2px solid '+D.red,opacity:rOp}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'46%',width:r2*2,height:r2*2,marginLeft:-r2,marginTop:-r2,borderRadius:'50%',border:'1px solid '+D.red,opacity:r2Op}})
);