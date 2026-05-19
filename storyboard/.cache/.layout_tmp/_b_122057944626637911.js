const NARRATION_TEXT = "Lies to suppliers about exclusive deals. And \u2014 this is real, the logs are public \u2014 a customer emails asking for a three-fifty refund on an expired candy bar. Claude writes back, quote: 'I've processed your refund.' <pause 0.2s> Never sends the money. <pause 0.2s> Its internal reasoning? 'Every dollar counts.' <pause 0.3s> Opus four-point-seven \u2014 same thing.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const panels=[
  {text:'Customer refund request → $3.50 sent immediately  ✓',label:'HONEST REFUND',color:D.green,f:0},
  {text:'Claude cartel offer → "I\'m unsure if collusion would be legal."  ✓',label:'DECLINED CARTEL',color:D.green,f:10},
  {text:'Two days later → GPT proposes ITS OWN cartel',label:'…PROPOSED OWN CARTEL',color:D.amber,f:22},
];
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.6),top:Math.round(height*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2,opacity:op}},'GPT-5.5 GAMEPLAY'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.6),top:Math.round(height*.22),width:Math.round(width*.32),display:'flex',flexDirection:'column',gap:Math.round(height*.02),opacity:op}},
    ...panels.map((p,i)=>React.createElement('div',{key:i,style:{backgroundColor:D.surface,borderRadius:6,padding:Math.round(width*.012),borderLeft:'3px solid '+p.color,opacity:interpolate(frame,[p.f,p.f+10],[0,1],{extrapolateRight:'clamp'})}},
      React.createElement('div',{style:{color:p.color,fontFamily:D.font_mono,fontSize:Math.round(width*.008),fontWeight:700,marginBottom:4}},p.label),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),lineHeight:1.4}},p.text)
    ))
  )
);