const NARRATION_TEXT = "Before I throw benchmarks at you, I need you to understand something most comparison videos completely skip. These two models aren't trying to do the same thing.";
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cubeY=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[-Math.round(height*.28),0],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S3'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.1),right:Math.round(width*.08),bottom:Math.round(height*.1),border:'1px solid '+D.text_dim,borderRadius:8,opacity:.14}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:Math.round(height*.12),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008)}},'CLAUDE CODE  —  EDITOR'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.44),transform:`translateX(-50%) translateY(${cubeY}px)`,width:Math.round(width*.08),height:Math.round(width*.08),backgroundColor:D.surface,border:'2px solid '+D.text,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center'}},
    React.createElement('span',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'BUG FIX'))
);