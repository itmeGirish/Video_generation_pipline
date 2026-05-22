const NARRATION_TEXT = "The other pays twenty cents. <pause 0.5s> Same answer. Or actually \u2014 the expensive one got it slightly wrong. That is not a hypothetical.";
const w=width,h=height;
const op=interpolate(frame,[0,18],[0,1],{extrapolateRight:'clamp'});
const cw=Math.round(w*0.44),ch=Math.round(h*0.66),ct=Math.round(h*0.17),p=Math.round(h*0.04);
const ansY=Math.round(h*0.50),ansH=Math.round(h*0.20);
const devA=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:ct,width:cw,height:ch,border:'3px solid '+D.green,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:p,gap:Math.round(h*0.025),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.022),fontWeight:'900',letterSpacing:'0.12em'}},'DEV A'),
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010)}},'claude-sonnet-4-6'),
  React.createElement('div',{style:{flex:1}})
);
const devB=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:ct,width:cw,height:ch,border:'3px solid '+D.red,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:p,gap:Math.round(h*0.025),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.022),fontWeight:'900',letterSpacing:'0.12em'}},'DEV B'),
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010)}},'claude-sonnet-4-6'),
  React.createElement('div',{style:{flex:1}})
);
const ansA=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.06),top:ansY,width:Math.round(cw*0.86),height:ansH,backgroundColor:D.bg,border:'2px solid '+D.green,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',opacity:op}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),textAlign:'center'}},'No, this is not spam.')
);
const ansB=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.54),top:ansY,width:Math.round(cw*0.86),height:ansH,backgroundColor:D.bg,border:'2px solid '+D.red,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',opacity:op}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),textAlign:'center'}},'No, this is not spam.')
);
const same=React.createElement('div',{style:{position:'absolute',left:0,top:ansY+ansH+Math.round(h*0.02),width:w,textAlign:'center',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),letterSpacing:'0.15em',opacity:op}},'SAME ANSWER');
return [devA,devB,ansA,ansB,same];