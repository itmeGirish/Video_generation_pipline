const NARRATION_TEXT = "<pause 0.2s> You give Claude a coding task. It takes the task, writes code, then \u2014 here's the difference \u2014 it writes tests for its own code. Runs them.";
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:70}}),[0,1],[45,0],{extrapolateRight:'clamp'});
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.73),opacity:op,transform:`translateY(${sl}px)`,display:'flex',flexDirection:'column',gap:Math.round(height*.01)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,lineHeight:1.3}},'HAND ME THE HARD STUFF.'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,lineHeight:1.3}},'WALK AWAY.')
  )
);