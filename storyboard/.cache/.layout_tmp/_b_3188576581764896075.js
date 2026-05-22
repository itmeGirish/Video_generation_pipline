const NARRATION_TEXT = "So why does more thinking produce worse results on simple tasks? I call this the overthinker mechanism. Imagine asking a colleague what two plus two equals. They know immediately.";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'})}});
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const cw=Math.round(w*0.32),ch=Math.round(h*0.22);
const card=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.34),top:Math.round(h*0.20),width:cw,height:ch,border:'3px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',alignItems:'center',justifyContent:'center',opacity:sp,transform:'scale('+sp+')'}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.030),fontWeight:'900'}},'2 + 2 = ?')
);
const si=React.createElement('div',{style:{position:'absolute',top:Math.round(h*0.03),left:Math.round(w*0.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),opacity:0.6}},'S5');
return [bd,si,card];