const NARRATION_TEXT = "So how do you fix this? Sort every task into one of three buckets. Bucket one: simple tasks. The answer is obvious from what is in the prompt.";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'})}});
const tw=Math.round(w*0.28),th=Math.round(h*0.62),tt=Math.round(h*0.16),gap=Math.round(w*0.02);
const trays=[
  {x:Math.round(w*0.04),c:D.green,label:'SIMPLE TASKS',delay:0},
  {x:Math.round(w*0.04)+tw+gap,c:D.amber,label:'COMPLEX TASKS',delay:12},
  {x:Math.round(w*0.04)+(tw+gap)*2,c:D.red,label:'CRITICAL TASKS',delay:24}
];
const els=trays.map(({x,c,label,delay})=>{
  const sp=spring({frame:Math.max(0,frame-delay),fps,config:{damping:15,stiffness:80,mass:2}});
  return React.createElement('div',{key:label,style:{position:'absolute',left:x,top:tt,width:tw,height:th,border:'3px solid '+c,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:Math.round(h*0.025),boxSizing:'border-box',opacity:sp,transform:'translateY('+Math.round((1-sp)*40)+'px)'}},
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',letterSpacing:'0.1em',textAlign:'center'}},label)
  );
});
const si=React.createElement('div',{style:{position:'absolute',top:Math.round(h*0.03),left:Math.round(w*0.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),opacity:0.6}},'S6');
return [bd,si,...els];