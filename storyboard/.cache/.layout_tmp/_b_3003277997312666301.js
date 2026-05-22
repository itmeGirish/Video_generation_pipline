const NARRATION_TEXT = "Debugging, architectural decisions, research synthesis, legal analysis. Start with medium. Use high only if you have benchmarked it and confirmed the accuracy gain on your specific task. <pause 0.3s> Bucket three: critical tasks. Wrong answer is genuinely expensive \u2014 safety, liability, reputation damage that cannot be reversed.";
const w=width,h=height;
const tw=Math.round(w*0.28),tt=Math.round(h*0.16),gap=Math.round(w*0.02);
const trayX=Math.round(w*0.04)+(tw+gap)*2;
const chips=['LEGAL ANALYSIS','FINANCIAL MODEL','MEDICAL REASONING'];
const els=chips.map((chip,i)=>{
  const sp=spring({frame:Math.max(0,frame-i*10),fps,config:{damping:15,stiffness:80,mass:2}});
  return React.createElement('div',{key:chip,style:{position:'absolute',left:trayX+Math.round(tw*0.08),top:tt+Math.round(h*0.10)+i*Math.round(h*0.14),width:Math.round(tw*0.84),opacity:sp,transform:'translateY('+Math.round((1-sp)*-30)+'px)'}},
    React.createElement('div',{style:{backgroundColor:D.bg,border:'1px solid '+D.red,color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),padding:'4px 8px',borderRadius:14,textAlign:'center'}},chip)
  );
});
const label=React.createElement('div',{style:{position:'absolute',left:trayX,top:tt+Math.round(h*0.52),width:tw,textAlign:'center',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',opacity:interpolate(frame,[28,42],[0,1],{extrapolateRight:'clamp'})}},'HIGH / MAX EFFORT');
return [...els,label];