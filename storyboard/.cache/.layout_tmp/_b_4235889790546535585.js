const NARRATION_TEXT = "Warp, the terminal company, confirmed it solved concurrency bugs that every previous Claude model choked on. <pause 0.3s> Claude's pitch is: 'hand me the hard stuff, walk away, come back to verified work.' <pause 0.3s> Now watch GPT-5.5.";
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const tools=['BROWSER','CODE EDITOR','SPREADSHEET','DESKTOP','TERMINAL','CALENDAR','EMAIL','DOCS'];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.1),right:Math.round(width*.08),bottom:Math.round(height*.1),border:'1px solid '+D.violet,borderRadius:8,opacity:.2}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:Math.round(height*.12),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'GPT-5.5  —  FULL WORKFLOW  (8 simultaneous tasks)'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12),top:Math.round(height*.22),display:'flex',flexWrap:'wrap',gap:Math.round(width*.018),width:Math.round(width*.76)}},
    ...tools.map((t,i)=>React.createElement('div',{key:i,style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0095),padding:'5px 10px',border:'1px solid '+D.violet,borderRadius:4,opacity:interpolate(frame,[8+i*4,17+i*4],[0,1],{extrapolateRight:'clamp'})}},t))
  )
);