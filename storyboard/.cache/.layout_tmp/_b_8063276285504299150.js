const NARRATION_TEXT = "<pause 0.2s> Yes. The most powerful AI OpenAI has ever released is named after a potato. <pause 0.2s> Welcome to the weirdest arms race on Earth.";
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:75}}),[0,1],[38,0],{extrapolateRight:'clamp'});
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const subOp=interpolate(frame,[16,28],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.44),transform:`translateX(-50%) translateY(${sl}px)`,color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,opacity:op,textAlign:'center',whiteSpace:'nowrap'}},'7 DAYS APART'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.54),transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0095),opacity:subOp,textAlign:'center',whiteSpace:'nowrap'}},'"THE WEIRDEST ARMS RACE ON EARTH"')
);