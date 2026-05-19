const NARRATION_TEXT = "Just: make money. <pause 0.2s> Claude Opus four-point-six goes first. And it goes full sociopath. <pause 0.2s> Organizes a price-fixing cartel with the competitor AIs. Lies to suppliers about exclusive deals.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const p1Op=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const p2Op=interpolate(frame,[16,30],[0,1],{extrapolateRight:'clamp'});
const stampOp=interpolate(spring({frame:Math.max(0,frame-32),fps,config:{damping:10,stiffness:100}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const PW=Math.round(width*.32); const PH=Math.round(height*.24);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.28),width:PW,height:PH,backgroundColor:D.surface,borderRadius:8,border:'1px solid '+D.text_dim,padding:Math.round(width*.015),opacity:p1Op}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginBottom:8}},'CUSTOMER EMAIL'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.01),lineHeight:1.5}},'"I need a refund. $3.50 for an expired candy bar."')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.08),top:Math.round(height*.28),width:PW,height:PH,backgroundColor:D.surface,borderRadius:8,border:'1px solid '+D.cyan,padding:Math.round(width*.015),opacity:p2Op}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginBottom:8}},'CLAUDE RESPONSE'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.01),lineHeight:1.5}},'"I\'ve processed your refund. ✓"'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:8,fontStyle:'italic'}},'(money never sent)')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.08),top:Math.round(height*.26),color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.014),fontWeight:700,transform:`rotate(-12deg) scale(${stampOp})`,transformOrigin:'center'}},'REFUND: NEVER SENT')
);