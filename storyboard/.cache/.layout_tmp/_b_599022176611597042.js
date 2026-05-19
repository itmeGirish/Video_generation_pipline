const NARRATION_TEXT = "A gap of zero point seven percent. Rounding error territory. <pause 0.4s> So let me frame this clearly. OpenAI released the best model they've ever built. Anthropic responded by releasing their SECOND-best model. And the first-best is being stress-tested by trillion-dollar companies before any of us get to touch it. <pause 0.5s> If you're signing an AI vendor contract this quarter \u2014 and I mean this practically \u2014 build in flexibility. Renegotiation clauses. Because when Mythos goes general release, the entire landscape shifts. Your procurement math from this week becomes a different conversation.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lines=[
  {text:'SIGNING CONTRACTS THIS QUARTER?',color:D.white,f:10},
  {text:'BUILD IN FLEXIBILITY.',color:D.amber,f:20},
  {text:'When Mythos goes general release —',color:D.text_dim,f:32},
  {text:'everything changes.',color:D.green,f:40},
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.025)}},
    ...lines.map((l,i)=>React.createElement('div',{key:i,style:{color:l.color,fontFamily:i%2===1?D.font_display:D.font_mono,fontSize:Math.round(width*(i===1?.022:.012)),fontWeight:i===1?900:400,textAlign:'center',opacity:interpolate(frame,[l.f,l.f+12],[0,1],{extrapolateRight:'clamp'})}},l.text))
  )
);