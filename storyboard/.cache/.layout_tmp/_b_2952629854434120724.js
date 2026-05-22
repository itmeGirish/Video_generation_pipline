const NARRATION_TEXT = "Just the parameter per call. <pause 0.3s> One more time, so it fits on a sticky note: Simple task: use low. Complex task: use medium. Critical task: use high. Match the thinking level to the task \u2014 not to your anxiety about getting the answer wrong.";
const w=width,h=height;
const pw=Math.round(w*0.28),ph=Math.round(h*0.68),pt=Math.round(h*0.15),gap=Math.round(w*0.02);
const bgCols=[
  {x:Math.round(w*0.04),c:D.cyan,name:'CLAUDE',param:'effort: "low"'},
  {x:Math.round(w*0.04)+pw+gap,c:D.violet,name:'OPENAI / GPT',param:'reasoning_effort: "low"'},
  {x:Math.round(w*0.04)+(pw+gap)*2,c:D.amber,name:'GEMINI',param:'thinking_budget: 512'}
].map(({x,c,name,param})=>React.createElement('div',{key:name,style:{position:'absolute',left:x,top:pt,width:pw,height:ph,border:'2px solid '+c,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',padding:Math.round(h*0.03),gap:Math.round(h*0.020),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',letterSpacing:'0.1em',textAlign:'center'}},name),
  React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),backgroundColor:D.bg,padding:'6px 10px',borderRadius:4,border:'1px solid '+D.green,textAlign:'center'}},param),
  React.createElement('div',{style:{color:D.green,fontSize:Math.round(w*0.020),marginTop:'auto'}},'✓')
));
const bgRows=[
  {label:'SIMPLE',c:D.green,effort:'LOW EFFORT'},
  {label:'COMPLEX',c:D.amber,effort:'MEDIUM EFFORT'},
  {label:'CRITICAL',c:D.red,effort:'HIGH / MAX'}
].map(({label,c,effort})=>React.createElement('div',{key:label,style:{display:'flex',alignItems:'center',gap:Math.round(w*0.015)}},
  React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.014),fontWeight:'900',width:Math.round(w*0.09)}},label),
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.012)}},'→'),
  React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'700'}},effort)
));
const bgCard=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.10),top:Math.round(h*0.15),width:Math.round(w*0.80),border:'2px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',gap:Math.round(h*0.025),padding:Math.round(h*0.035),boxSizing:'border-box'}},
  ...bgRows
);
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
return [...bgCols,bgCard,beforeBar,afterBar,badge];