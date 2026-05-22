const NARRATION_TEXT = "Three interfaces. One concept. <pause 0.3s> And here is what does not appear in any of the launch announcements: all three default to medium or high \u2014 automatically, for every request, regardless of what you are asking. <pause 0.3s> Ask Claude to classify a ticket as urgent. High reasoning. Full scratchpad.";
const w=width,h=height;
const pw=Math.round(w*0.28),pt=Math.round(h*0.13),gap=Math.round(w*0.02);
const chips=[
  {x:Math.round(w*0.04),label:'CLASSIFY TICKET',delay:0},
  {x:Math.round(w*0.04)+pw+gap,label:'REWRITE SENTENCE',delay:8},
  {x:Math.round(w*0.04)+(pw+gap)*2,label:'TRANSLATE LINE',delay:16}
];
const els=chips.map(({x,label,delay})=>{
  const sp=spring({frame:Math.max(0,frame-delay),fps,config:{damping:8}});
  return React.createElement('div',{key:label,style:{position:'absolute',left:x+Math.round(pw*0.10),top:Math.round(h*0.55),width:Math.round(pw*0.80),display:'flex',justifyContent:'center',opacity:sp,transform:'translateY('+Math.round((1-sp)*-40)+'px)'}},
    React.createElement('div',{style:{backgroundColor:D.bg,border:'1px solid '+D.text_dim,color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),padding:'6px 12px',borderRadius:20}},label)
  );
});
return els;