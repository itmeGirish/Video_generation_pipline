const NARRATION_TEXT = "It does not appear in your logs. It does not show in your UI. But it is billed. Every thinking token costs exactly the same as an output token. <pause 0.3s> A call that returns five hundred visible words might have consumed four thousand tokens of invisible reasoning first.";
const w=width,h=height;
const pw=Math.round(w*0.44),pt=Math.round(h*0.14),ph=Math.round(h*0.70);
const count=Math.round(interpolate(frame,[0,Math.round(fps*5)],[0,4000],{extrapolateRight:'clamp'}));
const counter=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt+ph+Math.round(h*0.025),width:pw,display:'flex',flexDirection:'column',alignItems:'center',gap:4,opacity:interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'})}},
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),letterSpacing:'0.15em'}},'THINKING TOKENS'),
  React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.028),fontWeight:'900'}},count.toLocaleString())
);
return [counter];