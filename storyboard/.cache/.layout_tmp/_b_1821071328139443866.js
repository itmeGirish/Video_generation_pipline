const NARRATION_TEXT = "<pause 0.3s> That's not a rivalry. That's an ecosystem.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1Op=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const l2Op=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const pulseVal=Math.sin(frame*.1)*.2+.8;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.025)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.013),opacity:l1Op,textDecoration:'line-through',textDecorationColor:D.red}},"That's not a platform company."),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(60*pulseVal)}px ${D.cyan}`,textAlign:'center',lineHeight:1.2}},"That's a"),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.052),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(80*pulseVal)}px ${D.cyan}`,letterSpacing:6}},'PRECISION'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(60*pulseVal)}px ${D.cyan}`}},'company.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:interpolate(frame,[36,50],[0,1],{extrapolateRight:'clamp'}),marginTop:Math.round(height*.02),textAlign:'center',lineHeight:1.8}},'Competing with McKinsey  ·  Deloitte  ·  paying an expert to get it right')
  )
);