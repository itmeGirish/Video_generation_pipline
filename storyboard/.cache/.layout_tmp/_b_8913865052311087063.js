const NARRATION_TEXT = "Three questions to decide in ten seconds: is the answer obvious from the input? <pause 0.2s> If yes \u2014 low. Does it require multi-step reasoning? If yes \u2014 medium.";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'})}});
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const rootW=Math.round(w*0.50),rootH=Math.round(h*0.16),rootX=Math.round((w-Math.round(w*0.50))/2),rootY=Math.round(h*0.10);
const root=React.createElement('div',{style:{position:'absolute',left:rootX,top:rootY,width:rootW,height:rootH,border:'3px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(h*0.010),opacity:sp,transform:'scale('+sp+')'}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.016),fontWeight:'900'}},'WHAT IS THIS TASK?'),
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010)}},'Three questions — ten seconds.')
);
const branchTop=rootY+rootH+Math.round(h*0.12);
const bw=Math.round(w*0.26),bh=Math.round(h*0.26);
const ghosts=[
  {x:Math.round(w*0.03),c:D.green,label:'Q1: Obvious?'},
  {x:Math.round(w*0.37),c:D.amber,label:'Q2: Multi-step?'},
  {x:Math.round(w*0.71),c:D.red,label:'Q3: Expensive?'}
];
const ghostEls=ghosts.map(({x,c,label})=>{
  const gs=spring({frame:Math.max(0,frame-8),fps,config:{damping:20,stiffness:200}});
  return React.createElement('div',{key:label,style:{position:'absolute',left:x,top:branchTop,width:bw,height:bh,border:'2px solid '+c,borderRadius:8,backgroundColor:D.surface,display:'flex',alignItems:'center',justifyContent:'center',opacity:gs*0.5}},
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.010)}},label)
  );
});
const connector=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.50)-1,top:rootY+rootH,width:2,height:Math.round(h*0.12),backgroundColor:D.text_dim,opacity:sp}});
const si=React.createElement('div',{style:{position:'absolute',top:Math.round(h*0.03),left:Math.round(w*0.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),opacity:0.6}},'S7');
return [bd,si,root,connector,...ghostEls];