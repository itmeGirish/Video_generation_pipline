const NARRATION_TEXT = "These two models aren't trying to do the same thing. <pause 0.3s> Watch this. <pause 0.2s> You give Claude a coding task.";
const steps=[{l:'EXAMINE',c:D.cyan,f:0},{l:'WRITE FIX',c:D.green,f:14},{l:'BUILD TEST',c:D.amber,f:28},{l:'RUN',c:D.green,f:42},{l:'✓ VERIFIED',c:D.green,f:54}];
const figOp=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18),top:Math.round(height*.32),width:Math.round(width*.04),height:Math.round(width*.04),borderRadius:'50%',border:'3px solid '+D.cyan,opacity:figOp}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.185),top:Math.round(height*.37),width:Math.round(width*.03),height:Math.round(width*.055),border:'3px solid '+D.cyan,borderRadius:2,opacity:figOp}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.3),top:Math.round(height*.28),display:'flex',flexDirection:'column',gap:Math.round(height*.024)}},
    ...steps.map((s,i)=>React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',gap:Math.round(width*.01),opacity:interpolate(frame,[s.f,s.f+10],[0,1],{extrapolateRight:'clamp'})}},
      React.createElement('div',{style:{width:8,height:8,borderRadius:'50%',backgroundColor:s.c,flexShrink:0}}),
      React.createElement('span',{style:{color:s.c,fontFamily:D.font_mono,fontSize:Math.round(width*.011)}},s.l)
    ))
  )
);