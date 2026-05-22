const NARRATION_TEXT = "On Claude, Anthropic calls this extended thinking. On OpenAI o-series models, they are reasoning tokens. On Gemini, it is the thinking budget. The scratchpad is completely invisible to you.";
const w=width,h=height;
const pw=Math.round(w*0.44),pt=Math.round(h*0.14),barTop=Math.round(h*0.14)+44;
const barWidths=[0.55,0.80,0.42,0.90,0.65,0.35,0.75,0.50,0.85,0.60,0.40,0.70];
const bars=barWidths.map((frac,i)=>{
  const sp=spring({frame:Math.max(0,frame-i*8),fps,config:{damping:200}});
  return React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(w*0.04)+16,top:barTop+i*Math.round(h*0.055),width:Math.round(pw*frac*sp),height:Math.round(h*0.025),backgroundColor:D.text_dim,borderRadius:3,opacity:0.7}});
});
return bars;