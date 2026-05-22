const NARRATION_TEXT = "Just the parameter per call. <pause 0.3s> One more time, so it fits on a sticky note: Simple task: use low. Complex task: use medium. Critical task: use high. Match the thinking level to the task \u2014 not to your anxiety about getting the answer wrong.";
const w=width,h=height;
const barZoneX=Math.round(w*0.10),barZoneW=Math.round(w*0.80),barZoneTop=Math.round(h*0.52);
const maxH=Math.round(h*0.26);
const spBefore=spring({frame,fps,config:{damping:8}});
const spAfter=spring({frame:Math.max(0,frame-12),fps,config:{damping:8}});
const spBadge=spring({frame:Math.max(0,frame-24),fps,config:{damping:8}});
const bw=Math.round(barZoneW*0.25);
const beforeBar=React.createElement('div',{style:{position:'absolute',left:barZoneX+Math.round(barZoneW*0.10),top:barZoneTop+maxH-Math.round(maxH*spBefore),width:bw,height:Math.round(maxH*spBefore),backgroundColor:D.red,borderRadius:'4px 4px 0 0',display:'flex',alignItems:'flex-start',justifyContent:'center',overflow:'visible'}},
  React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',marginTop:'-28px',whiteSpace:'nowrap'}},'BEFORE: $100/day')
);
const afterBar=React.createElement('div',{style:{position:'absolute',left:barZoneX+Math.round(barZoneW*0.55),top:barZoneTop+maxH-Math.round(maxH*0.25*spAfter),width:bw,height:Math.round(maxH*0.25*spAfter),backgroundColor:D.green,borderRadius:'4px 4px 0 0',display:'flex',alignItems:'flex-start',justifyContent:'center',overflow:'visible'}},
  React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',marginTop:'-28px',whiteSpace:'nowrap'}},'AFTER: $25/day')
);
const badge=React.createElement('div',{style:{position:'absolute',left:barZoneX+Math.round(barZoneW*0.40),top:barZoneTop+Math.round(maxH*0.30),opacity:spBadge,transform:'scale('+spBadge+')'}},
  React.createElement('div',{style:{backgroundColor:D.green,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.020),fontWeight:'900',padding:'8px 18px',borderRadius:20}},'75% SAVINGS')
);
return [beforeBar,afterBar,badge];