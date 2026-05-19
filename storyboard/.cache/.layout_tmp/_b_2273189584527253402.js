const NARRATION_TEXT = "<pause 0.5s> Fact two.";
const c1 = interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'});
const c2 = interpolate(frame,[6,16],[0,1],{extrapolateRight:'clamp'});
const c3 = interpolate(frame,[14,24],[0,1],{extrapolateRight:'clamp'});
const glow = interpolate(frame,[0,20],[0,.1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',inset:0,backgroundColor:D.red,opacity:glow}}),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.38),left:0,right:0,height:2,backgroundColor:D.red,opacity:c1,boxShadow:'0 0 12px '+D.red}}),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.43),left:Math.round(width*.25),width:Math.round(width*.45),height:1.5,backgroundColor:D.red,opacity:c2,transform:'rotate(6deg)'}}),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.47),left:Math.round(width*.48),width:Math.round(width*.28),height:1,backgroundColor:D.red,opacity:c3,transform:'rotate(-4deg)'}})
);