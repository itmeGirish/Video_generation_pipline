const NARRATION_TEXT = "An NVIDIA engineer said losing access to GPT-5.5 felt like having a limb amputated. <pause 0.5s> Fact two.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const f1Op=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const f2Op=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const glowPulse=Math.sin(frame*.18)*.2+.8;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.03)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.012),letterSpacing:4,opacity:f1Op}},'FACT  2'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,opacity:f2Op,textShadow:`0 0 ${Math.round(30*glowPulse)}px ${D.amber}`,textAlign:'center',lineHeight:1.4}},'Artificial Analysis'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,opacity:f2Op,textShadow:`0 0 ${Math.round(30*glowPulse)}px ${D.amber}`,textAlign:'center',lineHeight:1.4}},'Hallucination Benchmark')
  )
);