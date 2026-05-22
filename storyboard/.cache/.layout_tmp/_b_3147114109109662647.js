const NARRATION_TEXT = "Debugging, architectural decisions, research synthesis, legal analysis. Start with medium. Use high only if you have benchmarked it and confirmed the accuracy gain on your specific task. <pause 0.3s> Bucket three: critical tasks. Wrong answer is genuinely expensive \u2014 safety, liability, reputation damage that cannot be reversed.";
const w=width,h=height;
const tw=Math.round(w*0.28),th=Math.round(h*0.62),tt=Math.round(h*0.16),gap=Math.round(w*0.02);
const bgTrays=[
  [Math.round(w*0.04),D.green,'SIMPLE TASKS'],
  [Math.round(w*0.04)+tw+gap,D.amber,'COMPLEX TASKS'],
  [Math.round(w*0.04)+(tw+gap)*2,D.red,'CRITICAL TASKS']
].map(([x,c,label])=>React.createElement('div',{key:label,style:{position:'absolute',left:x,top:tt,width:tw,height:th,border:'3px solid '+c,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:Math.round(h*0.025),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',letterSpacing:'0.1em',textAlign:'center'}},label)
));
const bgGreenChips=['CLASSIFY','TRANSLATE','SUMMARIZE','REWRITE','FORMAT','SENTIMENT'].map((chip,i)=>{const row=Math.floor(i/2),col=i%2;return React.createElement('div',{key:'g'+chip,style:{position:'absolute',left:Math.round(w*0.04)+Math.round(tw*0.08)+col*Math.round(tw*0.46),top:tt+Math.round(h*0.10)+row*Math.round(h*0.12)}},React.createElement('div',{style:{backgroundColor:D.bg,border:'1px solid '+D.green,color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),padding:'4px 8px',borderRadius:14,whiteSpace:'nowrap'}},chip));});
const bgLowLabel=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:tt+Math.round(h*0.52),width:tw,textAlign:'center',color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700'}},'LOW EFFORT');
const bgAmberChips=['DEBUGGING','ARCHITECTURE','RESEARCH SYNTHESIS','CODE REVIEW'].map((chip,i)=>React.createElement('div',{key:'a'+chip,style:{position:'absolute',left:Math.round(w*0.04)+tw+gap+Math.round(tw*0.08),top:tt+Math.round(h*0.10)+i*Math.round(h*0.11),width:Math.round(tw*0.84)}},React.createElement('div',{style:{backgroundColor:D.bg,border:'1px solid '+D.amber,color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),padding:'4px 8px',borderRadius:14,textAlign:'center'}},chip)));
const bgMedLabel=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04)+tw+gap,top:tt+Math.round(h*0.55),width:tw,textAlign:'center',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700'}},'MEDIUM EFFORT');
const trayX=Math.round(w*0.04)+(tw+gap)*2;
const chips=['LEGAL ANALYSIS','FINANCIAL MODEL','MEDICAL REASONING'];
const els=chips.map((chip,i)=>{
  const sp=spring({frame:Math.max(0,frame-i*10),fps,config:{damping:15,stiffness:80,mass:2}});
  return React.createElement('div',{key:chip,style:{position:'absolute',left:trayX+Math.round(tw*0.08),top:tt+Math.round(h*0.10)+i*Math.round(h*0.14),width:Math.round(tw*0.84),opacity:sp,transform:'translateY('+Math.round((1-sp)*-30)+'px)'}},
    React.createElement('div',{style:{backgroundColor:D.bg,border:'1px solid '+D.red,color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),padding:'4px 8px',borderRadius:14,textAlign:'center'}},chip)
  );
});
const label=React.createElement('div',{style:{position:'absolute',left:trayX,top:tt+Math.round(h*0.52),width:tw,textAlign:'center',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',opacity:interpolate(frame,[28,42],[0,1],{extrapolateRight:'clamp'})}},'HIGH / MAX EFFORT');
return [...bgTrays,...bgGreenChips,bgLowLabel,...bgAmberChips,bgMedLabel,...els,label];