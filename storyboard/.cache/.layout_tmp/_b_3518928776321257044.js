const NARRATION_TEXT = "<pause 0.3s> A call that returns five hundred visible words might have consumed four thousand tokens of invisible reasoning first. That is a ten to one cost multiplier \u2014 on the most expensive part of your API call. Unless you check the API response metadata for a field called thinking tokens, you have no idea it is happening.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const pw=Math.round(w*0.44),pt=Math.round(h*0.14),ph=Math.round(h*0.70);
const barTop=pt+44;
const barWidths=[0.55,0.80,0.42,0.90,0.65,0.35,0.75,0.50,0.85,0.60,0.40,0.70];
const spLeft=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt,width:pw,height:ph,border:'2px solid '+D.text_dim,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column'}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.text_dim,color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'THINKING SCRATCHPAD — INVISIBLE')
);
const bars=barWidths.map((frac,i)=>React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(w*0.04)+16,top:barTop+i*Math.round(h*0.055),width:Math.round(pw*frac),height:Math.round(h*0.025),backgroundColor:D.text_dim,borderRadius:3,opacity:0.7}}));
const spRight=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:pt,width:pw,height:ph,border:'2px solid '+D.cyan,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column'}},
  React.createElement('div',{style:{padding:'12px 16px',borderBottom:'1px solid '+D.cyan,color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),letterSpacing:'0.12em'}},'YOUR ANSWER')
);
const ansText=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52)+16,top:pt+50,width:pw-32,color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),lineHeight:'1.5'}},'No, this is not spam.');
const stamp=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt+Math.round(ph*0.25),width:pw,display:'flex',justifyContent:'center',opacity:sp,transform:'rotate(-8deg) scale('+sp+')'}},
  React.createElement('div',{style:{border:'4px solid '+D.red,padding:'10px 24px',borderRadius:4}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.020),fontWeight:'900',letterSpacing:'0.1em'}},'INVISIBLE TO YOU')
  )
);
return [spLeft,...bars,spRight,ansText,stamp];