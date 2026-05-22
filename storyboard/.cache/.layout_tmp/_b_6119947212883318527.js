const NARRATION_TEXT = "Here is what this is worth. Teams that match effort level to task type \u2014 low for simple, medium for complex, high only for critical \u2014 report token cost reductions of seventy to seventy-five percent. <pause 0.4s> Combined with prompt caching and model right-sizing, that is the standard result. Seventy-five percent.";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'})}});
const pw=Math.round(w*0.28),ph=Math.round(h*0.68),pt=Math.round(h*0.15),gap=Math.round(w*0.02);
const cols=[
  {x:Math.round(w*0.04),c:D.cyan,name:'CLAUDE',param:'effort: "low"',delay:0},
  {x:Math.round(w*0.04)+pw+gap,c:D.violet,name:'OPENAI / GPT',param:'reasoning_effort: "low"',delay:10},
  {x:Math.round(w*0.04)+(pw+gap)*2,c:D.amber,name:'GEMINI',param:'thinking_budget: 512',delay:20}
];
const panels=cols.map(({x,c,name,param,delay})=>{
  const sp=spring({frame:Math.max(0,frame-delay),fps,config:{damping:20,stiffness:200}});
  return React.createElement('div',{key:name,style:{position:'absolute',left:x,top:pt,width:pw,height:ph,border:'2px solid '+c,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:Math.round(h*0.03),gap:Math.round(h*0.020),boxSizing:'border-box',opacity:sp,transform:'translateY('+Math.round((1-sp)*40)+'px)'}},
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',letterSpacing:'0.1em',textAlign:'center'}},name),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),backgroundColor:D.bg,padding:'6px 10px',borderRadius:4,border:'1px solid '+D.green,textAlign:'center'}},param),
    React.createElement('div',{style:{color:D.green,fontSize:Math.round(w*0.020),marginTop:'auto'}},'✓')
  );
});
const si=React.createElement('div',{style:{position:'absolute',top:Math.round(h*0.03),left:Math.round(w*0.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),opacity:0.6}},'S8');
return [bd,si,...panels];