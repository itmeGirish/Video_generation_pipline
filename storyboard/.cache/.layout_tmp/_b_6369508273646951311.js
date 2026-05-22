const NARRATION_TEXT = "Full scratchpad. Full cost. Ask GPT to rewrite a sentence. Reasoning tokens running. Ask Gemini to translate one line.";
const w=width,h=height;
const pw=Math.round(w*0.28),pt=Math.round(h*0.13),ph=Math.round(h*0.72),gap=Math.round(w*0.02);
const xs=[Math.round(w*0.04),Math.round(w*0.04)+pw+gap,Math.round(w*0.04)+(pw+gap)*2];
const banners=xs.map((x,i)=>{
  const op=interpolate(frame,[i*6,i*6+18],[0,1],{extrapolateRight:'clamp'});
  return React.createElement('div',{key:i,style:{position:'absolute',left:x,top:pt+ph-Math.round(h*0.12),width:pw,height:Math.round(h*0.10),display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:D.red+'22',border:'1px solid '+D.red,opacity:op}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'900',letterSpacing:'0.1em'}},'FULL SCRATCHPAD')
  );
});
return banners;