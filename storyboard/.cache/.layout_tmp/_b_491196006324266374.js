const NARRATION_TEXT = "The other pays twenty cents. <pause 0.5s> Same answer. Or actually \u2014 the expensive one got it slightly wrong. That is not a hypothetical.";
const w=width,h=height;
const op=interpolate(frame,[0,18],[0,1],{extrapolateRight:'clamp'});
const cw=Math.round(w*0.44),ct=Math.round(h*0.17);
const ansY=Math.round(h*0.56),ansH=Math.round(h*0.14);
const ansA=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:ansY,width:cw,height:ansH,backgroundColor:D.surface,border:'1px solid '+D.green,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',opacity:op}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),textAlign:'center'}},'No, this is not spam.')
);
const ansB=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:ansY,width:cw,height:ansH,backgroundColor:D.surface,border:'1px solid '+D.red,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',opacity:op}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),textAlign:'center'}},'No, this is not spam.')
);
const same=React.createElement('div',{style:{position:'absolute',left:0,top:ansY+ansH+Math.round(h*0.02),width:w,textAlign:'center',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),letterSpacing:'0.15em',opacity:op}},'SAME ANSWER');
return [ansA,ansB,same];