const NARRATION_TEXT = "Here is what happens inside a reasoning model before it answers you. <pause 0.2s> The model opens a private scratchpad. An internal chain of thought where it works through the problem step by step. On Claude, Anthropic calls this extended thinking.";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'})}});
const op=interpolate(frame,[0,20],[0,1],{extrapolateRight:'clamp'});
const pw=Math.round(w*0.44),ph=Math.round(h*0.70),pt=Math.round(h*0.14);
const spLeft=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt,width:pw,height:ph,border:'2px solid '+D.text_dim,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column',opacity:op}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.text_dim,color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'THINKING SCRATCHPAD — INVISIBLE')
);
const spRight=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:pt,width:pw,height:ph,border:'2px solid '+D.cyan,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column',opacity:op}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.cyan,color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'YOUR ANSWER')
);
const si=React.createElement('div',{style:{position:'absolute',top:Math.round(h*0.03),left:Math.round(w*0.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),opacity:0.6}},'S2');
return [bd,si,spLeft,spRight];