const NARRATION_TEXT = "Match the thinking level to the task \u2014 not to your anxiety about getting the answer wrong. <pause 0.3s> The model knows how to classify your support ticket. It does not need four thousand tokens of scratchpad to get there. You are just paying for its nervousness.";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'})}});
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const wrap=React.createElement('div',{style:{position:'absolute',left:0,top:0,width:w,height:h,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(h*0.03),opacity:sp,transform:'scale('+sp+')'}},
  React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.026),fontWeight:'900',letterSpacing:'0.10em'}},'MATCH THINKING TO TASK.'),
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.018)}},'Not to your anxiety.')
);
return [bd,wrap];