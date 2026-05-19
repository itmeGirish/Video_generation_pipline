const NARRATION_TEXT = "<pause 0.3s> Just don't let it write your citations.";
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const q1Op=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const q2Op=interpolate(frame,[22,36],[0,1],{extrapolateRight:'clamp'});
const chars='1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
const targetNum='86%';
const settledNum=frame>54;
const cycleNum=settledNum?targetNum:chars[Math.floor(frame*.8)%chars.length]+chars[Math.floor(frame*.6)%chars.length]+'%';
const numOp=interpolate(frame,[38,54],[0,1],{extrapolateRight:'clamp'});
const tagOp=interpolate(frame,[58,72],[0,1],{extrapolateRight:'clamp'});
const numPulse=settledNum?Math.sin(frame*.15)*.1+.9:1;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.03)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.012),opacity:q1Op,textAlign:'center',fontStyle:'italic'}},'"Like having a limb amputated."'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.012),opacity:q2Op,textAlign:'center',fontStyle:'italic'}},'He\'s right.  It IS incredible.'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.1),fontWeight:900,opacity:numOp*numPulse,textShadow:`0 0 ${Math.round(60*numPulse)}px ${D.red}`}},settledNum?'86%':cycleNum),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.014),fontWeight:700,opacity:tagOp,letterSpacing:2}},'smarter  ≠  more honest')
  )
);