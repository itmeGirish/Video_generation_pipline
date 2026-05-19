const NARRATION_TEXT = "<pause 0.2s> But see those red flags on the output? Those are potential hallucinations. We don't know which facts are real yet. <pause 0.2s> So the draft rides the line to the second stop: Claude Opus four-point-seven. It runs a fact-check pass.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[40,0],{extrapolateRight:'clamp'});
const badgeOp=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.1),transform:`translateX(-50%) translateY(${sl}px)`,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.022)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3}},'TWO-MODEL PIPELINE RESULT'),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.04),alignItems:'baseline'}}),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.05),alignItems:'baseline'}},
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.052),fontWeight:900,lineHeight:1}},'$0.24'),
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900}},'·  11s'),
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900}},'✓ CHECKED')
    ),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.025),opacity:badgeOp}},
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),padding:'5px 14px',backgroundColor:D.surface,borderRadius:20,border:'1px solid '+D.amber}},'-75% COST vs solo Claude'),
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),padding:'5px 14px',backgroundColor:D.surface,borderRadius:20,border:'1px solid '+D.amber}},'-45% TIME')
    )
  )
);