const NARRATION_TEXT = "<pause 0.2s> But see those red flags on the output? Those are potential hallucinations. We don't know which facts are real yet. <pause 0.2s> So the draft rides the line to the second stop: Claude Opus four-point-seven. It runs a fact-check pass.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[30,0],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.12),transform:`translateX(-50%) translateY(${sl}px)`,opacity:op,display:'flex',gap:Math.round(width*.04),alignItems:'center'}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.08),transform:`translateX(-50%) translateY(${sl}px)`,opacity:op,backgroundColor:D.surface,borderRadius:10,padding:`${Math.round(height*.02)}px ${Math.round(width*.025)}px`,border:'1px solid '+D.green,display:'flex',gap:Math.round(width*.04),alignItems:'center'}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.08),transform:`translateX(-50%) translateY(${sl}px)`,opacity:op}},
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.05),alignItems:'center',justifyContent:'center'}}),
    React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.012)}},
      React.createElement('div',{style:{display:'flex',gap:Math.round(width*.04)}},
        React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900}},'$0.24'),
        React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900}},'11s'),
        React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900}},'✓ CHECKED')
      ),
      React.createElement('div',{style:{display:'flex',gap:Math.round(width*.04),marginTop:Math.round(height*.01)}},
        React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),padding:'4px 12px',backgroundColor:D.surface,borderRadius:20}},'-75% COST'),
        React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),padding:'4px 12px',backgroundColor:D.surface,borderRadius:20}},'-45% TIME')
      )
    )
  )
);