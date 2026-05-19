const NARRATION_TEXT = "Runs them. Checks the output. Only THEN does it hand the result back to you.";
const stats=[{l:'SWE-BENCH',v:'87.6%',c:D.green},{l:'HALLUCINATION',v:'36%',c:D.amber},{l:'API COST',v:'$5 in / $25 out',c:D.text_dim}];
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),bottom:Math.round(height*.08),display:'flex',gap:Math.round(width*.045),opacity:op}},
    ...stats.map((s,i)=>React.createElement('div',{key:i,style:{display:'flex',flexDirection:'column',gap:4,opacity:interpolate(frame,[i*7,i*7+12],[0,1],{extrapolateRight:'clamp'})}},
      React.createElement('div',{style:{color:s.c,fontFamily:D.font_display,fontSize:Math.round(width*.024),fontWeight:900}},s.v),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085)}},s.l)
    ))
  )
);