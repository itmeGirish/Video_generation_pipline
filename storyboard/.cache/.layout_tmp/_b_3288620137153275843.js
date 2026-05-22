const NARRATION_TEXT = "<pause 0.2s> The model already knew the answer. You just paid for it to sit there reconsidering. <pause 0.4s>";
const w=width,h=height;
const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'})}});
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const wrap=React.createElement('div',{style:{position:'absolute',left:0,top:0,width:w,height:h,display:'flex',alignItems:'center',justifyContent:'center',opacity:sp,transform:'scale('+sp+')'}},
  React.createElement('div',{style:{border:'4px solid '+D.amber,borderRadius:8,padding:Math.round(h*0.04)+' '+Math.round(w*0.05),textAlign:'center',display:'flex',flexDirection:'column',gap:Math.round(h*0.02)}},
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.022),fontWeight:'900',letterSpacing:'0.10em'}},'LONGER THINKING'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.016)}},'NOT SMARTER THINKING')
  )
);
return [bd,wrap];