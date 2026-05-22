const NARRATION_TEXT = "Seventy-five percent. The model you are already paying for becomes three to four times more affordable. Without changing a single line of application logic. Just the parameter per call.";
const w=width,h=height;
const pw=Math.round(w*0.28),ph=Math.round(h*0.68),pt=Math.round(h*0.15),gap=Math.round(w*0.02);
const rows=[
  {label:'SIMPLE',c:D.green,effort:'LOW EFFORT',delay:0},
  {label:'COMPLEX',c:D.amber,effort:'MEDIUM EFFORT',delay:10},
  {label:'CRITICAL',c:D.red,effort:'HIGH / MAX',delay:20}
];
const rowEls=rows.map(({label,c,effort,delay})=>{
  const sp=spring({frame:Math.max(0,frame-delay),fps,config:{damping:20,stiffness:200}});
  return React.createElement('div',{key:label,style:{display:'flex',alignItems:'center',gap:Math.round(w*0.015),opacity:sp,transform:'translateX('+Math.round((1-sp)*30)+'px)'}},
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.014),fontWeight:'900',width:Math.round(w*0.09)}},label),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.012)}},'→'),
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'700'}},effort)
  );
});
const card=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.10),top:Math.round(h*0.15),width:Math.round(w*0.80),border:'2px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',gap:Math.round(h*0.025),padding:Math.round(h*0.035),boxSizing:'border-box'}},
  ...rowEls
);
return [card];