const NARRATION_TEXT = "On OpenAI reasoning models, it is reasoning underscore effort. Four levels: low, medium, high, and xhigh. On Gemini, it is thinking underscore budget \u2014 a raw token count you set yourself. Three names. Three interfaces.";
const w=width,h=height;
const pw=Math.round(w*0.28),pt=Math.round(h*0.13),gap=Math.round(w*0.02);
const xs=[Math.round(w*0.04),Math.round(w*0.04)+pw+gap,Math.round(w*0.04)+(pw+gap)*2];
const badges=xs.map((x,i)=>{
  const sp=spring({frame:Math.max(0,frame-i*8),fps,config:{damping:15,stiffness:80,mass:2}});
  return React.createElement('div',{key:i,style:{position:'absolute',left:x+Math.round(pw*0.18),top:pt+Math.round(h*0.10),opacity:sp,transform:'translateY('+Math.round((1-sp)*40)+'px)'}},
    React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),fontWeight:'900',padding:'5px 14px',borderRadius:16,letterSpacing:'0.08em'}},'DEFAULT')
  );
});
return badges;