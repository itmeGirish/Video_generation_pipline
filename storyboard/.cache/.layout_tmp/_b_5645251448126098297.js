const NARRATION_TEXT = "<pause 0.3s> GPQA Diamond, PhD-level science \u2014 both models are in the ninety-fours. Tied at the ceiling. Claude wins MCP-Atlas too, by two points, but you get the idea. <pause 0.2s> Quick reality check \u2014 benchmarks aren't reality.";
const op=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:75}}),[0,1],[40,0],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.12),transform:`translateX(-50%) translateY(${sl}px)`,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.016)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900}},'CLAUDE 4.7  LEADS THE REASONING ROUND'),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.03)}},
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),padding:'5px 12px',border:'1px solid '+D.cyan,borderRadius:4}},'SWE-bench  +5.7*'),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),padding:'5px 12px',border:'1px solid '+D.text_dim,borderRadius:4}},'GPQA  +0.6')
    )
  )
);