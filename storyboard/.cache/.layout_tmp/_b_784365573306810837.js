const NARRATION_TEXT = "Wrong answer is genuinely expensive \u2014 safety, liability, reputation damage that cannot be reversed. High or max. Automatically justified \u2014 the cost of a mistake exceeds the cost of the tokens. <pause 0.3s>";
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
const trayX2=Math.round(w*0.04)+(tw+gap)*2;
const bgRedChips=['LEGAL ANALYSIS','FINANCIAL MODEL','MEDICAL REASONING'].map((chip,i)=>React.createElement('div',{key:'r'+chip,style:{position:'absolute',left:trayX2+Math.round(tw*0.08),top:tt+Math.round(h*0.10)+i*Math.round(h*0.14),width:Math.round(tw*0.84)}},React.createElement('div',{style:{backgroundColor:D.bg,border:'1px solid '+D.red,color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),padding:'4px 8px',borderRadius:14,textAlign:'center'}},chip)));
const bgHighLabel=React.createElement('div',{style:{position:'absolute',left:trayX2,top:tt+Math.round(h*0.52),width:tw,textAlign:'center',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700'}},'HIGH / MAX EFFORT');
const bottom=tt+th+Math.round(h*0.025);
const maxBarH=Math.round(h*0.14);
const bars=[
  {x:Math.round(w*0.04),c:D.green,frac:0.14,label:'1x'},
  {x:Math.round(w*0.04)+tw+gap,c:D.amber,frac:0.42,label:'3x'},
  {x:Math.round(w*0.04)+(tw+gap)*2,c:D.red,frac:0.98,label:'7-10x'}
];
const els=bars.map(({x,c,frac,label},i)=>{
  const sp=spring({frame:Math.max(0,frame-i*8),fps,config:{damping:8}});
  const bh=Math.round(maxBarH*frac*sp);
  return React.createElement('div',{key:label,style:{position:'absolute',left:x+Math.round(tw*0.15),top:bottom,width:Math.round(tw*0.70),display:'flex',flexDirection:'column',alignItems:'center',gap:4}},
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),fontWeight:'700'}},(sp>0.5?label:'')),
    React.createElement('div',{style:{width:'100%',height:bh,backgroundColor:c,borderRadius:'4px 4px 0 0'}})
  );
});
const costLabel=React.createElement('div',{style:{position:'absolute',left:0,top:bottom+Math.round(h*0.16),width:w,textAlign:'center',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),opacity:interpolate(frame,[20,35],[0,1],{extrapolateRight:'clamp'})}},'RELATIVE COST');
return [...bgTrays,...bgGreenChips,bgLowLabel,...bgAmberChips,bgMedLabel,...bgRedChips,bgHighLabel,...els,costLabel];