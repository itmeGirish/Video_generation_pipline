const NARRATION_TEXT = "<pause 0.3s> They come back and say: probably four, but it depends on the framing. That is not a smarter answer. That is an overthought answer. <pause 0.3s> Language models do the exact same thing. On simple tasks, extended thinking introduces uncertainty and hedging that was never there before. The scratchpad gives the model time and permission to doubt itself.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const cardBottom=Math.round(h*0.20)+Math.round(h*0.22);
const padTop=cardBottom+Math.round(h*0.06);
const padH=Math.round(h*0.32);
const badge=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.34)+Math.round(w*0.32)+Math.round(w*0.03),top:padTop+Math.round(padH*0.25),display:'flex',flexDirection:'column',alignItems:'flex-start',gap:8,opacity:sp,transform:'translateX('+Math.round((1-sp)*30)+'px)'}},
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),fontWeight:'900',padding:'8px 16px',borderRadius:8,maxWidth:Math.round(w*0.24)}},'= probably 4,'),
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),fontWeight:'900',padding:'8px 16px',borderRadius:8}},'context-dependent'),
  React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.009)}},'3.2s — $0.018')
);
return [badge];