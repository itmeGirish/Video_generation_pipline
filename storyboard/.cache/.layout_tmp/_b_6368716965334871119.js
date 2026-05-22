const NARRATION_TEXT = "It does not appear in your logs. It does not show in your UI. But it is billed. Every thinking token costs exactly the same as an output token. <pause 0.3s> A call that returns five hundred visible words might have consumed four thousand tokens of invisible reasoning first.";
const w=width,h=height;
const pw=Math.round(w*0.44),pt=Math.round(h*0.14),ph=Math.round(h*0.70);
const barTop=pt+44;
const barWidths=[0.55,0.80,0.42,0.90,0.65,0.35,0.75,0.50,0.85,0.60,0.40,0.70];
const spLeft=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt,width:pw,height:ph,border:'2px solid '+D.text_dim,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column'}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.text_dim,color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'THINKING SCRATCHPAD â€” INVISIBLE')
);
const bars=barWidths.map((frac,i)=>React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(w*0.04)+16,top:barTop+i*Math.round(h*0.055),width:Math.round(pw*frac),height:Math.round(h*0.025),backgroundColor:D.text_dim,borderRadius:3,opacity:0.7}}));
const spRight=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:pt,width:pw,height:ph,border:'2px solid '+D.cyan,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column'}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.cyan,color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'YOUR ANSWER')
);
const ansText=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52)+16,top:pt+50,width:pw-32,color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),lineHeight:'1.5'}},'No, this is not spam.');
const count=Math.round(interpolate(frame,[0,Math.round(fps*5)],[0,4000],{extrapolateRight:'clamp'}));
const counter=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt+ph+Math.round(h*0.025),width:pw,display:'flex',flexDirection:'column',alignItems:'center',gap:4,opacity:interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'})}},
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),letterSpacing:'0.15em'}},'THINKING TOKENS'),
  React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.028),fontWeight:'900'}},count.toLocaleString())
);
return [spLeft,...bars,spRight,ansText,counter];