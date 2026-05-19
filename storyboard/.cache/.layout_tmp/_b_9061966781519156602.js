const NARRATION_TEXT = "Fills your spreadsheet. Navigates your desktop.";
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:70}}),[0,1],[38,0],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.08),top:Math.round(height*.73),opacity:op,transform:`translateY(${sl}px)`,textAlign:'right'}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,lineHeight:1.3}},'"YOU NEVER NEED TO LEAVE."')
  )
);