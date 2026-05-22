const NARRATION_TEXT = "Unless you check the API response metadata for a field called thinking tokens, you have no idea it is happening. Invisible in your output. Visible in your invoice. <pause 0.4s>";
const w=width,h=height;
const pw=Math.round(w*0.44),ph=Math.round(h*0.72),pt=Math.round(h*0.13);
const spLeft=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt,width:pw,height:ph,border:'2px solid '+D.text_dim,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',padding:Math.round(h*0.025),gap:Math.round(h*0.01),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),letterSpacing:'0.08em',marginBottom:Math.round(h*0.01)}},'THINKING SCRATCHPAD â€” INVISIBLE'),
  ...[0.27,0.56,0.39,0.65,0.47,0.71,0.33,0.60,0.44,0.68,0.51,0.59].map((f,i)=>React.createElement('div',{key:i,style:{width:Math.round(pw*0.85*f),height:Math.round(h*0.013),backgroundColor:D.text_dim,borderRadius:2,opacity:0.5}}))
);
const spRight=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:pt,width:pw,height:ph,border:'2px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',padding:Math.round(h*0.025),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),letterSpacing:'0.08em',marginBottom:Math.round(h*0.015)}},'YOUR ANSWER'),
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.013)}},'No, this is not spam.'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(w*0.02),bottom:Math.round(h*0.04),backgroundColor:D.cyan,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),fontWeight:'900',padding:'4px 10px',borderRadius:12}},'RESPONSE DELIVERED')
);
const bgCounter=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:pt+ph+Math.round(h*0.015),display:'flex',flexDirection:'column',alignItems:'center',gap:4}},
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),letterSpacing:'0.1em'}},'THINKING TOKENS'),
  React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.022),fontWeight:'900'}},'1,920')
);
const bgStamp=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.09),top:pt+Math.round(h*0.12),transform:'rotate(-12deg)',border:'4px solid '+D.red,color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.022),fontWeight:'900',padding:'6px 14px',letterSpacing:'0.12em',opacity:0.85}},'INVISIBLE TO YOU');
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const cardH=Math.round(h*0.22),cardW=Math.round(w*0.88);
const card=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.06),bottom:Math.round(h*0.07),width:cardW,height:cardH,backgroundColor:D.surface,border:'2px solid '+D.red,borderRadius:10,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:Math.round(h*0.018),opacity:sp,transform:'translateY('+Math.round((1-sp)*50)+'px)'}},
  React.createElement('div',{style:{display:'flex',alignItems:'center',gap:Math.round(w*0.02),fontFamily:D.font_mono,fontSize:Math.round(w*0.013)}},
    React.createElement('span',{style:{color:D.text}},'500 output tokens'),
    React.createElement('span',{style:{color:D.text_dim}},'+'),
    React.createElement('span',{style:{color:D.amber}},'4,000 thinking tokens'),
    React.createElement('span',{style:{color:D.text_dim}},'='),
    React.createElement('span',{style:{color:D.red,fontWeight:'900'}},'10x COST')
  )
);
return [spLeft,spRight,bgCounter,bgStamp,card];