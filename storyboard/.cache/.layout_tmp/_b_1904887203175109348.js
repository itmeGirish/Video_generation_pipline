const NARRATION_TEXT = "But when it doesn't know? It almost never tells you. It makes one up. <pause 0.5s> But here's the thing \u2014 and this is why I'm slowing down. <pause 0.3s> This isn't a bug. <pause 0.3s> It's a design choice.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const rOp=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const centerOp=interpolate(frame,[32,44],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.16),bottom:Math.round(height*.12),width:1,backgroundColor:D.text_dim,opacity:.3}}),
  React.createElement('div',{style:{position:'absolute',left:0,width:'50%',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),padding:Math.round(width*.025),opacity:lOp}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'OPENAI — SUPER APP'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,textAlign:'center',lineHeight:1.4}},'KEEP MOVING'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.6}},'10-step workflow cannot stall.\nHesitation = frustrated user.\nTrained: always have an answer.')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',width:'50%',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),padding:Math.round(width*.025),opacity:rOp}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'ANTHROPIC — CONSULTANT'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,textAlign:'center',lineHeight:1.4}},'STOP AND VERIFY'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.6}},'Wrong citation = career damage.\nFabrication = production bug.\nTrained: say "I\'m not sure."')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.09),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.014),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:centerOp}},'ONE DESIGNED TO STOP.  ONE DESIGNED TO KEEP GOING.')
);