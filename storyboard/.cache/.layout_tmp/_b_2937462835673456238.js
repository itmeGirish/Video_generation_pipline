const NARRATION_TEXT = "For complex tasks that answer is worse. For simple tasks it is identical or better. I will show you the data \u2014 and give you a rule you can apply in ten seconds. <pause 0.4s>";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const cx=Math.round(w*0.50),cy=Math.round(h*0.50),r=Math.round(Math.min(w,h)*0.22);
const badge=React.createElement('div',{style:{position:'absolute',left:cx-Math.round(w*0.10),top:cy-r-Math.round(h*0.005),width:Math.round(w*0.20),display:'flex',justifyContent:'center',opacity:sp,transform:'translateY('+Math.round((1-sp)*60)+'px)'}},
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.016),fontWeight:'900',padding:'8px 20px',borderRadius:24,letterSpacing:'0.1em',whiteSpace:'nowrap'}},'DEFAULT: HIGH')
);
const cap=React.createElement('div',{style:{position:'absolute',left:0,top:cy+r+Math.round(h*0.04),width:w,textAlign:'center',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),opacity:sp}},'Set by the API. Changed by almost nobody.');
return [badge,cap];