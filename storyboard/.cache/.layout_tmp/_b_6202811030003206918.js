const NARRATION_TEXT = "For complex tasks that answer is worse. For simple tasks it is identical or better. I will show you the data \u2014 and give you a rule you can apply in ten seconds. <pause 0.4s>";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const cx=Math.round(w*0.50),cy=Math.round(h*0.50),r=Math.round(Math.min(w,h)*0.22);
const dial=React.createElement('div',{style:{position:'absolute',left:cx-r,top:cy-r,width:r*2,height:r*2,border:'5px solid '+D.amber,borderRadius:'50%',backgroundColor:D.surface,boxShadow:'0 0 50px '+D.amber+'33'}});
const title=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.20),top:cy-r-Math.round(h*0.09),width:Math.round(w*0.60),textAlign:'center',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.022),fontWeight:'900',letterSpacing:'0.2em'}},'THINKING LEVEL');
const notches=[{l:'LOW',a:220,c:D.green},{l:'MED',a:258,c:D.amber},{l:'HIGH',a:295,c:D.red},{l:'MAX',a:325,c:D.red}];
const notchEls=notches.map(({l,a,c})=>{const rad=a*Math.PI/180;const dist=r+Math.round(w*0.036);return React.createElement('div',{key:l,style:{position:'absolute',left:Math.round(cx+dist*Math.cos(rad))-Math.round(w*0.025),top:Math.round(cy+dist*Math.sin(rad))-Math.round(h*0.015),width:Math.round(w*0.05),textAlign:'center',color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700'}},l);});
const needle=React.createElement('div',{style:{position:'absolute',left:cx-2,top:cy-2,width:Math.round(r*0.65),height:4,backgroundColor:D.red,transformOrigin:'2px 2px',transform:'rotate(295deg)',borderRadius:2}});
const dot=React.createElement('div',{style:{position:'absolute',left:cx-8,top:cy-8,width:16,height:16,backgroundColor:D.amber,borderRadius:'50%'}});
const badge=React.createElement('div',{style:{position:'absolute',left:cx-Math.round(w*0.10),top:cy-r-Math.round(h*0.005),width:Math.round(w*0.20),display:'flex',justifyContent:'center',opacity:sp,transform:'translateY('+Math.round((1-sp)*60)+'px)'}},
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.016),fontWeight:'900',padding:'8px 20px',borderRadius:24,letterSpacing:'0.1em',whiteSpace:'nowrap'}},'DEFAULT: HIGH')
);
const cap=React.createElement('div',{style:{position:'absolute',left:0,top:cy+r+Math.round(h*0.04),width:w,textAlign:'center',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),opacity:sp}},'Set by the API. Changed by almost nobody.');
return [dial,title,...notchEls,needle,dot,badge,cap];