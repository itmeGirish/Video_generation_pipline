const NARRATION_TEXT = "Before I throw benchmarks at you, I need you to understand something most comparison videos completely skip. These two models aren't trying to do the same thing.";
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cubeY=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[-Math.round(height*.35),0],{extrapolateRight:'clamp'});
const labelOp=interpolate(frame,[14,26],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:interpolate(frame,[4,16],[0,1],{extrapolateRight:'clamp'})}},'CLAUDE OPUS 4.7  —  HOW IT WORKS'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.3),transform:`translateX(-50%) translateY(${cubeY}px)`,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.025)}},
    React.createElement('div',{style:{width:Math.round(width*.18),height:Math.round(width*.18),backgroundColor:D.surface,border:'3px solid '+D.cyan,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px '+D.cyan+'44'}},
      React.createElement('span',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900}},'🐛  BUG FIX TASK')),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:labelOp,textAlign:'center'}},'"Hand me the hard stuff."')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:labelOp,textAlign:'center',letterSpacing:2}},'TASK DROPPED IN  →  CLAUDE STARTS WORKING AUTONOMOUSLY')
);