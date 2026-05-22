const NARRATION_TEXT = "Always. You are asking the model to recognize, not to reason. <pause 0.3s> Bucket two: complex tasks. Multi-step reasoning where earlier conclusions affect later ones. Debugging, architectural decisions, research synthesis, legal analysis.";
const w=width,h=height;
const tw=Math.round(w*0.28),tt=Math.round(h*0.16),gap=Math.round(w*0.02);
const trayX=Math.round(w*0.04)+tw+gap;
const chips=['DEBUGGING','ARCHITECTURE','RESEARCH SYNTHESIS','CODE REVIEW'];
const els=chips.map((chip,i)=>{
  const sp=spring({frame:Math.max(0,frame-i*8),fps,config:{damping:8}});
  return React.createElement('div',{key:chip,style:{position:'absolute',left:trayX+Math.round(tw*0.08),top:tt+Math.round(h*0.10)+i*Math.round(h*0.11),width:Math.round(tw*0.84),opacity:sp,transform:'translateY('+Math.round((1-sp)*-30)+'px)'}},
    React.createElement('div',{style:{backgroundColor:D.bg,border:'1px solid '+D.amber,color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),padding:'4px 8px',borderRadius:14,textAlign:'center'}},chip)
  );
});
const label=React.createElement('div',{style:{position:'absolute',left:trayX,top:tt+Math.round(h*0.55),width:tw,textAlign:'center',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',opacity:interpolate(frame,[24,38],[0,1],{extrapolateRight:'clamp'})}},'MEDIUM EFFORT');
return [...els,label];