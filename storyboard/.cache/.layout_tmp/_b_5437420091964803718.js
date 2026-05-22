const NARRATION_TEXT = "<pause 0.2s> Different APIs name it differently \u2014 effort, reasoning effort, thinking budget. But every one controls the same thing: how many tokens the model burns on internal reasoning before it writes its first word. Set it high \u2014 thousands of invisible tokens, full chain of thought, full cost. <pause 0.3s> Set it low \u2014 direct answer. For complex tasks that answer is worse.";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'})}});
const sp=spring({frame,fps,config:{damping:8}});
const cx=Math.round(w*0.50),cy=Math.round(h*0.50),r=Math.round(Math.min(w,h)*0.22);
const dial=React.createElement('div',{style:{position:'absolute',left:cx-r,top:cy-r,width:r*2,height:r*2,border:'5px solid '+D.amber,borderRadius:'50%',backgroundColor:D.surface,boxShadow:'0 0 50px '+D.amber+'33',opacity:sp,transform:'scale('+sp+')'}});
const title=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.20),top:cy-r-Math.round(h*0.09),width:Math.round(w*0.60),textAlign:'center',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.022),fontWeight:'900',letterSpacing:'0.2em',opacity:sp}},'THINKING LEVEL');
const notches=[{l:'LOW',a:220,c:D.green},{l:'MED',a:258,c:D.amber},{l:'HIGH',a:295,c:D.red},{l:'MAX',a:325,c:D.red}];
const notchEls=notches.map(({l,a,c})=>{
  const rad=a*Math.PI/180;
  const dist=r+Math.round(w*0.036);
  return React.createElement('div',{key:l,style:{position:'absolute',left:Math.round(cx+dist*Math.cos(rad))-Math.round(w*0.025),top:Math.round(cy+dist*Math.sin(rad))-Math.round(h*0.015),width:Math.round(w*0.05),textAlign:'center',color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',opacity:sp}},l);
});
const needle=React.createElement('div',{style:{position:'absolute',left:cx-2,top:cy-2,width:Math.round(r*0.65),height:4,backgroundColor:D.red,transformOrigin:'2px 2px',transform:'rotate(295deg)',opacity:sp,borderRadius:2}});
const dot=React.createElement('div',{style:{position:'absolute',left:cx-8,top:cy-8,width:16,height:16,backgroundColor:D.amber,borderRadius:'50%',opacity:sp}});
return [bd,dial,title,...notchEls,needle,dot];