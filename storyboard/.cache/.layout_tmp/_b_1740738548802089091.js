const NARRATION_TEXT = "<pause 0.3s> A call that returns five hundred visible words might have consumed four thousand tokens of invisible reasoning first. That is a ten to one cost multiplier \u2014 on the most expensive part of your API call. Unless you check the API response metadata for a field called thinking tokens, you have no idea it is happening.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const pw=Math.round(w*0.44),pt=Math.round(h*0.14),ph=Math.round(h*0.70);
const stamp=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt+Math.round(ph*0.25),width:pw,display:'flex',justifyContent:'center',opacity:sp,transform:'rotate(-8deg) scale('+sp+')'}},
  React.createElement('div',{style:{border:'4px solid '+D.red,padding:'10px 24px',borderRadius:4}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.020),fontWeight:'900',letterSpacing:'0.1em'}},'INVISIBLE TO YOU')
  )
);
return [stamp];