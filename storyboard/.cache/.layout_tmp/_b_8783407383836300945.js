const NARRATION_TEXT = "They know immediately. They say four. Correct. Done. Now imagine that same colleague has been told to reason carefully before every answer.";
const w=width,h=height;
const spArrow=spring({frame,fps,config:{damping:20,stiffness:200}});
const spBadge=spring({frame:Math.max(0,frame-10),fps,config:{damping:8}});
const cardCX=Math.round(w*0.34)+Math.round(w*0.32/2);
const cardY=Math.round(h*0.20)+Math.round(h*0.22/2);
const arrow=React.createElement('div',{style:{position:'absolute',left:cardCX+Math.round(w*0.18),top:cardY-Math.round(h*0.025),display:'flex',alignItems:'center',gap:Math.round(w*0.010),opacity:spArrow,transform:'scaleX('+spArrow+')'}},
  React.createElement('div',{style:{width:Math.round(w*0.12),height:3,backgroundColor:D.green}}),
  React.createElement('div',{style:{color:D.green,fontSize:Math.round(w*0.020)}},'→')
);
const badge=React.createElement('div',{style:{position:'absolute',left:cardCX+Math.round(w*0.32),top:cardY-Math.round(h*0.06),display:'flex',flexDirection:'column',alignItems:'center',gap:8,opacity:spBadge,transform:'scale('+spBadge+')'}},
  React.createElement('div',{style:{backgroundColor:D.green,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.022),fontWeight:'900',padding:'8px 20px',borderRadius:8}},'= 4 ✓'),
  React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.009)}},'0.1s — $0.002')
);
const lowLabel=React.createElement('div',{style:{position:'absolute',left:cardCX+Math.round(w*0.20),top:cardY+Math.round(h*0.04),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),opacity:spArrow}},'LOW EFFORT');
return [arrow,badge,lowLabel];