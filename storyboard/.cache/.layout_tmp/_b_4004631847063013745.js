const NARRATION_TEXT = "On Claude, Anthropic calls this extended thinking. On OpenAI o-series models, they are reasoning tokens. On Gemini, it is the thinking budget. The scratchpad is completely invisible to you.";
const w=width,h=height;
const pw=Math.round(w*0.44),ph=Math.round(h*0.70),pt=Math.round(h*0.14),barTop=Math.round(h*0.14)+44;
const spLeft=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt,width:pw,height:ph,border:'2px solid '+D.text_dim,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column'}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.text_dim,color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'THINKING SCRATCHPAD — INVISIBLE')
);
const spRight=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:pt,width:pw,height:ph,border:'2px solid '+D.cyan,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column'}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.cyan,color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'YOUR ANSWER')
);
const barWidths=[0.55,0.80,0.42,0.90,0.65,0.35,0.75,0.50,0.85,0.60,0.40,0.70];
const bars=barWidths.map((frac,i)=>{
  const sp=spring({frame:Math.max(0,frame-i*8),fps,config:{damping:200}});
  return React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(w*0.04)+16,top:barTop+i*Math.round(h*0.055),width:Math.round(pw*frac*sp),height:Math.round(h*0.025),backgroundColor:D.text_dim,borderRadius:3,opacity:0.7}});
});
return [spLeft,spRight,...bars];