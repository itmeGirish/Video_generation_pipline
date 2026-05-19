const NARRATION_TEXT = "<pause 0.4s> Same model. Both true. <pause 0.3s> I spent four days pulling apart how that's possible. Let me show you what I found.";
const bgOp = interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const numScale = interpolate(frame,[0,18],[1,.22],{extrapolateRight:'clamp'});
const numX = interpolate(frame,[0,18],[0,Math.round(width*.33)],{extrapolateRight:'clamp'});
const numY = interpolate(frame,[0,18],[0,-Math.round(height*.36)],{extrapolateRight:'clamp'});
const words = ["LET","ME","SHOW","YOU"];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),top:Math.round(height*.06),color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.042),fontWeight:900,opacity:.8}},'86%'),
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',gap:Math.round(width*.028)}},
    ...words.map((w,i)=>React.createElement('div',{key:i,style:{
      color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.056),fontWeight:900,
      opacity:interpolate(frame,[10+i*5,20+i*5],[0,1],{extrapolateRight:'clamp'}),
      transform:`translateY(${interpolate(spring({frame:Math.max(0,frame-10-i*5),fps,config:{damping:14,stiffness:80}}),[0,1],[32,0],{extrapolateRight:'clamp'})}px)`
    }},w))
  )
);