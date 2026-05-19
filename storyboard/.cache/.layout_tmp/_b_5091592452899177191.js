const NARRATION_TEXT = "<pause 0.3s> See it? <pause 0.3s> GPT-5.5 wins when AI needs to DO things. Claude wins when AI needs to THINK carefully.";
const op=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const leftSl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[-60,0],{extrapolateRight:'clamp'});
const rightSl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[60,0],{extrapolateRight:'clamp'});
const centerOp=interpolate(frame,[18,30],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),bottom:Math.round(height*.22),opacity:op,transform:`translateX(${leftSl}px)`}},
    React.createElement('div',{style:{backgroundColor:D.violet,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'6px 14px',borderRadius:20}},'ACT  →  GPT-5.5')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),bottom:Math.round(height*.22),opacity:op,transform:`translateX(${rightSl}px)`}},
    React.createElement('div',{style:{backgroundColor:D.cyan,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'6px 14px',borderRadius:20}},'REASON  →  CLAUDE 4.7')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.1),transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:centerOp}},'DIFFERENT JOBS.  DIFFERENT WINNERS.')
);