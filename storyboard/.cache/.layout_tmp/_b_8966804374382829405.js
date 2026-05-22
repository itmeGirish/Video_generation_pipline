const NARRATION_TEXT = "The answer is obvious from what is in the prompt. No reasoning chain needed. Classification, translation, summarization, rewriting, formatting, sentiment. Effort level: low. Always.";
const w=width,h=height;
const tw=Math.round(w*0.28),th=Math.round(h*0.62),tt=Math.round(h*0.16),gap=Math.round(w*0.02);
const bgTrays=[
  [Math.round(w*0.04),D.green,'SIMPLE TASKS'],
  [Math.round(w*0.04)+tw+gap,D.amber,'COMPLEX TASKS'],
  [Math.round(w*0.04)+(tw+gap)*2,D.red,'CRITICAL TASKS']
].map(([x,c,label])=>React.createElement('div',{key:label,style:{position:'absolute',left:x,top:tt,width:tw,height:th,border:'3px solid '+c,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:Math.round(h*0.025),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',letterSpacing:'0.1em',textAlign:'center'}},label)
));
const trayX=Math.round(w*0.04);
const chips=['CLASSIFY','TRANSLATE','SUMMARIZE','REWRITE','FORMAT','SENTIMENT'];
const els=chips.map((chip,i)=>{
  const sp=spring({frame:Math.max(0,frame-i*8),fps,config:{damping:8}});
  const row=Math.floor(i/2),col=i%2;
  return React.createElement('div',{key:chip,style:{position:'absolute',left:trayX+Math.round(tw*0.08)+col*Math.round(tw*0.46),top:tt+Math.round(h*0.10)+row*Math.round(h*0.12),opacity:sp,transform:'translateY('+Math.round((1-sp)*-30)+'px)'}},
    React.createElement('div',{style:{backgroundColor:D.bg,border:'1px solid '+D.green,color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),padding:'4px 8px',borderRadius:14,whiteSpace:'nowrap'}},chip)
  );
});
const label=React.createElement('div',{style:{position:'absolute',left:trayX,top:tt+Math.round(h*0.52),width:tw,textAlign:'center',color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',opacity:interpolate(frame,[20,35],[0,1],{extrapolateRight:'clamp'})}},'LOW EFFORT');
return [...bgTrays,...els,label];