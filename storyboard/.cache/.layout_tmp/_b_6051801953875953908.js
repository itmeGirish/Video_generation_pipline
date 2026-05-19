const NARRATION_TEXT = "That surprised me too. <pause 0.2s> Value? Build the pipeline. Stop guessing. <pause 0.3s> And somewhere in a vault, restricted to eight companies, Anthropic has a model that beats both of them on almost everything. When Mythos goes public, we do this whole video again.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const glowPulse=Math.sin(frame*.1)*.3+.7;
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[30,0],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.04),bottom:Math.round(height*.1),opacity:op,transform:`translateY(${sl}px)`,display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,opacity:glowPulse,textShadow:'0 0 10px '+D.green}},'⬡  MYTHOS IS WAITING.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075)}},'Restricted to 8 companies.  For now.')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.04),bottom:Math.round(height*.1),opacity:interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'}),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700}},'⚙  BUILD THIS MONDAY.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075)}},'GPT draft  →  Claude verify  →  ship.')
  )
);