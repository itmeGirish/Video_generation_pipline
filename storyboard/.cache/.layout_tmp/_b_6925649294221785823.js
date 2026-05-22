const NARRATION_TEXT = "On OpenAI reasoning models, it is reasoning underscore effort. Four levels: low, medium, high, and xhigh. On Gemini, it is thinking underscore budget \u2014 a raw token count you set yourself. Three names. Three interfaces.";
const w=width,h=height;
const pw=Math.round(w*0.28),ph=Math.round(h*0.72),pt=Math.round(h*0.13),gap=Math.round(w*0.02);
const bgPanels=[
  [Math.round(w*0.04),D.cyan,'CLAUDE','effort: "high"','LOW — MED — HIGH — XHIGH — MAX'],
  [Math.round(w*0.04)+pw+gap,D.violet,'OPENAI / GPT','reasoning_effort: "high"','LOW — MED — HIGH — XHIGH'],
  [Math.round(w*0.04)+(pw+gap)*2,D.amber,'GEMINI','thinking_budget: 8000','(raw token count)']
].map(([x,c,name,param,scale])=>React.createElement('div',{key:name,style:{position:'absolute',left:x,top:pt,width:pw,height:ph,border:'2px solid '+c,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:Math.round(h*0.035),gap:Math.round(h*0.025),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.014),fontWeight:'900',letterSpacing:'0.1em',textAlign:'center'}},name),
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),backgroundColor:D.bg,padding:'6px 12px',borderRadius:4,border:'1px solid '+D.text_dim,textAlign:'center'}},param),
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),textAlign:'center',marginTop:'auto'}},scale)
));
const xs=[Math.round(w*0.04),Math.round(w*0.04)+pw+gap,Math.round(w*0.04)+(pw+gap)*2];
const badges=xs.map((x,i)=>{
  const sp=spring({frame:Math.max(0,frame-i*8),fps,config:{damping:15,stiffness:80,mass:2}});
  return React.createElement('div',{key:i,style:{position:'absolute',left:x+Math.round(pw*0.18),top:pt+Math.round(h*0.10),opacity:sp,transform:'translateY('+Math.round((1-sp)*40)+'px)'}},
    React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),fontWeight:'900',padding:'5px 14px',borderRadius:16,letterSpacing:'0.08em'}},'DEFAULT')
  );
});
return [...bgPanels,...badges];