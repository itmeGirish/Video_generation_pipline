const NARRATION_TEXT = "<pause 0.3s> Fact one. An NVIDIA engineer said losing access to GPT-5.5 felt like having a limb amputated.";
const sl = interpolate(spring({frame,fps,config:{damping:14,stiffness:90}}),[0,1],[Math.round(width*.35),0],{extrapolateRight:'clamp'});
const op = interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12)+sl,top:Math.round(height*.33),width:Math.round(width*.56),backgroundColor:D.surface,borderRadius:12,padding:Math.round(width*.022),borderLeft:'4px solid '+D.cyan,opacity:op}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.014),fontStyle:'italic',lineHeight:1.45}},
      '"Losing access to GPT-5.5 feels like I\'ve had a limb amputated."'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.01),marginTop:Math.round(height*.018)}},'— NVIDIA Senior Engineer')
  )
);