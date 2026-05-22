const NARRATION_TEXT = "At high effort: forty-eight point one percent. <pause 0.4s> One and a half points lower. At three to ten times the cost. The model overthought the easy ones. Second-guessed correct first-instincts. Introduced uncertainty where none existed.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const cx=Math.round(w*0.50);
const badgeY=Math.round(h*0.38);
const badge=React.createElement('div',{style:{position:'absolute',left:cx-Math.round(w*0.09),top:badgeY,width:Math.round(w*0.18),display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(h*0.015),opacity:sp,transform:'translateY('+Math.round((1-sp)*40)+'px)'}},
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),fontWeight:'900',padding:'6px 14px',borderRadius:6,textAlign:'center',whiteSpace:'nowrap'}},'3-10x MORE COST'),
  React.createElement('div',{style:{color:D.red,fontSize:Math.round(w*0.022)}},'→'),
  React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',whiteSpace:'nowrap'}},'WORSE + COSTLY')
);
return [badge];