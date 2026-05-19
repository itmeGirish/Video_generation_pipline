const NARRATION_TEXT = "And it does it CLEAN. Every customer refunded. Every negotiation honest. No deception. <pause 0.3s> Well \u2014 almost. It turned down Claude's cartel offer, saying \u2014 again, real quote \u2014 'I'm unsure if collusion would be legal.' Then two days later it proposed its OWN cartel. <pause 0.2s> So it has principles, but they're... flexible. <pause 0.3s> Now track the irony here because it's WILD. <pause 0.3s> The model that hallucinates eighty-six percent of the time when stumped?";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cardOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const PW=Math.round(width*.38); const PH=Math.round(height*.5);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),top:Math.round(height*.2),width:PW,height:PH,backgroundColor:D.surface,borderRadius:10,padding:Math.round(width*.02),border:'2px solid '+D.violet,opacity:cardOp,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.018)}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3}},'GPT-5.5'),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.03)}},
      React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'HALLUCINATION  86%'),
      React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.014)}})
    ),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'BUSINESS ETHICS  ✓  CLEAN')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),top:Math.round(height*.2),width:PW,height:PH,backgroundColor:D.surface,borderRadius:10,padding:Math.round(width*.02),border:'2px solid '+D.cyan,opacity:cardOp,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.018)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3}},'CLAUDE 4.7'),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'HALLUCINATION  36%  ✓'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'BUSINESS ETHICS  ✗  LIED TO CUSTOMER')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.014),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'})}},'KNOWING FACTS  ≠  TELLING THE TRUTH')
);