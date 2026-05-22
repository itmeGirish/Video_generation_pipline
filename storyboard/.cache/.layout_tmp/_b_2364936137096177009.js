const NARRATION_TEXT = "The scratchpad is completely invisible to you. <pause 0.3s> The API strips it before the response arrives. You never see it. It does not appear in your logs.";
const w=width,h=height;
const op=interpolate(frame,[0,18],[0,1],{extrapolateRight:'clamp'});
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const pw=Math.round(w*0.44),pt=Math.round(h*0.14),ph=Math.round(h*0.70);
const barTop=pt+44;
const barWidths=[0.55,0.80,0.42,0.90,0.65,0.35,0.75,0.50,0.85,0.60,0.40,0.70];
const spLeft=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt,width:pw,height:ph,border:'2px solid '+D.text_dim,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column'}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.text_dim,color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'THINKING SCRATCHPAD â€” INVISIBLE')
);
const bars=barWidths.map((frac,i)=>React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(w*0.04)+16,top:barTop+i*Math.round(h*0.055),width:Math.round(pw*frac),height:Math.round(h*0.025),backgroundColor:D.text_dim,borderRadius:3,opacity:0.7}}));
const pulse=interpolate(frame,[0,8,16,24],[0.5,1,0.5,1],{extrapolateRight:'clamp'});
const border=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:pt,width:pw,height:ph,border:'2px solid '+D.cyan,borderRadius:8,backgroundColor:D.surface,boxShadow:'0 0 20px '+D.cyan+Math.round(pulse*99).toString(16).padStart(2,'0'),opacity:op,pointerEvents:'none'}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.cyan,color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'YOUR ANSWER')
);
const ansText=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52)+16,top:pt+50,width:pw-32,color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),opacity:op,lineHeight:'1.5'}},'No, this is not spam.');
const badge=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52)+Math.round(pw*0.10),top:pt+ph-60,width:Math.round(pw*0.80),display:'flex',justifyContent:'center',opacity:sp}},
  React.createElement('div',{style:{backgroundColor:D.green,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'900',padding:'4px 14px',borderRadius:16}},'RESPONSE DELIVERED')
);
return [spLeft,...bars,border,ansText,badge];