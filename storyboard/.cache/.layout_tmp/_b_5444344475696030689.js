const NARRATION_TEXT = "Bigger jumps each time. Built a model too powerful to release. Created a defense partnership with eight trillion-dollar companies. Running a hallucination rate less than half the competition. <pause 0.3s> That's not a platform company. That's a PRECISION company. <pause 0.2s> Anthropic isn't competing with OpenAI.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1Op=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const l2Op=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const pulseVal=Math.sin(frame*.1)*.2+.8;
const ghostOp=interpolate(frame,[28,42],[0,.06],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.025)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.013),opacity:l1Op,textDecoration:'line-through',textDecorationColor:D.red}},"That's not a model company."),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(60*pulseVal)}px ${D.violet}`,textAlign:'center',lineHeight:1.2}},"That's a"),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.052),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(80*pulseVal)}px ${D.violet}`,letterSpacing:6}},'PLATFORM'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(60*pulseVal)}px ${D.violet}`}},'company.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:ghostOp*15,marginTop:Math.round(height*.02),textAlign:'center',lineHeight:1.8}},'Competing with Google Search  ·  Microsoft Office  ·  manual computer use')
  )
);