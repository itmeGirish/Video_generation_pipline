const NARRATION_TEXT = "Every major AI API gives you control over this. They just cannot agree on what to call it. On Claude, the parameter is effort. <pause 0.2s> Five levels: low, medium, high, xhigh, and max. On OpenAI reasoning models, it is reasoning underscore effort.";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'})}});
const pw=Math.round(w*0.28),ph=Math.round(h*0.72),pt=Math.round(h*0.13),gap=Math.round(w*0.02);
const cols=[
  {x:Math.round(w*0.04),c:D.cyan,name:'CLAUDE',param:'effort: "high"',scale:'LOW — MED — HIGH — XHIGH — MAX',delay:0},
  {x:Math.round(w*0.04)+pw+gap,c:D.violet,name:'OPENAI / GPT',param:'reasoning_effort: "high"',scale:'LOW — MED — HIGH — XHIGH',delay:10},
  {x:Math.round(w*0.04)+(pw+gap)*2,c:D.amber,name:'GEMINI',param:'thinking_budget: 8000',scale:'(raw token count)',delay:20}
];
const panels=cols.map(({x,c,name,param,scale,delay})=>{
  const sp=spring({frame:Math.max(0,frame-delay),fps,config:{damping:20,stiffness:200}});
  return React.createElement('div',{key:name,style:{position:'absolute',left:x,top:pt,width:pw,height:ph,border:'2px solid '+c,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:Math.round(h*0.035),gap:Math.round(h*0.025),boxSizing:'border-box',opacity:sp,transform:'translateY('+Math.round((1-sp)*40)+'px)'}},
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.014),fontWeight:'900',letterSpacing:'0.1em',textAlign:'center'}},name),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),backgroundColor:D.bg,padding:'6px 12px',borderRadius:4,border:'1px solid '+D.text_dim,textAlign:'center'}},param),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),textAlign:'center',marginTop:'auto'}},scale)
  );
});
const si=React.createElement('div',{style:{position:'absolute',top:Math.round(h*0.03),left:Math.round(w*0.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),opacity:0.6}},'S3');
return [bd,si,...panels];