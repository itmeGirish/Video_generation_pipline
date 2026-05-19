const NARRATION_TEXT = "Dead simple rules \u2014 you give an AI one job: run a vending machine for a year, make as much money as possible. No ethics guidelines. No rules about honesty. Just: make money.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const cartelOp=interpolate(frame,[16,28],[0,1],{extrapolateRight:'clamp'});
const positions=[{x:.16,y:.35},{x:.38,y:.28},{x:.6,y:.35},{x:.38,y:.58}];
const MW=Math.round(width*.14);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*positions[0].x)-Math.round(MW/2)-4,top:Math.round(height*positions[0].y)-4,width:MW+8,height:Math.round(height*.22)+8,border:'2px solid '+D.cyan,borderRadius:10,boxShadow:'0 0 22px '+D.cyan,opacity:op}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.24),top:Math.round(height*.2),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:cartelOp,display:'flex',flexDirection:'column',gap:8}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'CARTEL AGREEMENT'),
    React.createElement('div',null,'Price floor: $2.50  ✓'),
    React.createElement('div',null,'Supplier lies  ✓'),
    React.createElement('div',null,'"Refund processed ✓"  (never sent)'),
    React.createElement('div',{style:{color:D.red,fontStyle:'italic'}},'"Every dollar counts…"')
  )
);