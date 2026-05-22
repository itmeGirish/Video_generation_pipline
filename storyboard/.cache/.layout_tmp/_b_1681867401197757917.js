const NARRATION_TEXT = "Same model. Same question. <pause 0.4s> One pays two cents. The other pays twenty cents.";
const w=width,h=height;
const spA=spring({frame,fps,config:{damping:8}});
const spB=spring({frame:Math.max(0,frame-12),fps,config:{damping:8}});
const spX=spring({frame:Math.max(0,frame-24),fps,config:{damping:15,stiffness:80,mass:2}});
const cw=Math.round(w*0.44),ct=Math.round(h*0.17),ch=Math.round(h*0.66);
const labelY=ct+ch+Math.round(h*0.025);
const costA=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04),top:labelY,width:cw,display:'flex',justifyContent:'center',opacity:spA,transform:'scale('+spA+')'}},
  React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.030),fontWeight:'900'}},'$0.02')
);
const costB=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52),top:labelY,width:cw,display:'flex',justifyContent:'center',opacity:spB,transform:'scale('+spB+')'}},
  React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.030),fontWeight:'900'}},'$0.20')
);
const badge=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.44),top:labelY-Math.round(h*0.035),width:Math.round(w*0.12),display:'flex',justifyContent:'center',opacity:spX,transform:'translateY('+Math.round((1-spX)*30)+'px)'}},
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',padding:'4px 14px',borderRadius:20,whiteSpace:'nowrap'}},'10x MORE')
);
return [costA,costB,badge];