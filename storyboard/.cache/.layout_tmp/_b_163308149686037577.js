const NARRATION_TEXT = "The scratchpad is completely invisible to you. <pause 0.3s> The API strips it before the response arrives. You never see it. It does not appear in your logs.";
const w=width,h=height;
const op=interpolate(frame,[0,18],[0,1],{extrapolateRight:'clamp'});
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const pw=Math.round(w*0.44),pt=Math.round(h*0.14),ph=Math.round(h*0.70);
const ansText=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52)+16,top:pt+50,width:pw-32,color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),opacity:op,lineHeight:'1.5'}},'No, this is not spam.');
const pulse=interpolate(frame,[0,8,16,24],[0.5,1,0.5,1],{extrapolateRight:'clamp'});
const border=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:pt,width:pw,height:ph,border:'2px solid '+D.cyan,borderRadius:8,boxShadow:'0 0 20px '+D.cyan+Math.round(pulse*99).toString(16).padStart(2,'0'),opacity:op,pointerEvents:'none'}});
const badge=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52)+Math.round(pw*0.10),top:pt+ph-60,width:Math.round(pw*0.80),display:'flex',justifyContent:'center',opacity:sp}},
  React.createElement('div',{style:{backgroundColor:D.green,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'900',padding:'4px 14px',borderRadius:16}},'RESPONSE DELIVERED')
);
return [ansText,border,badge];