const NARRATION_TEXT = "OpenAI is merging ChatGPT, Codex, and their Atlas browser into a single app \u2014 and GPT-5.5 is the brain running all of it. <pause 0.2s> GPT's pitch isn't 'I'm smarter.' It's 'you never need to leave.' <pause 0.4s> One is a specialist you trust with the hard stuff.";
const stats=[{l:'TERMINAL-BENCH',v:'82.7%',c:D.green},{l:'HALLUCINATION',v:'86%',c:D.red},{l:'API COST',v:'$5 in / $30 out',c:D.text_dim}];
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.08),bottom:Math.round(height*.08),display:'flex',gap:Math.round(width*.04),opacity:op,flexDirection:'column',alignItems:'flex-end'}},
    ...stats.map((s,i)=>React.createElement('div',{key:i,style:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,opacity:interpolate(frame,[i*7,i*7+12],[0,1],{extrapolateRight:'clamp'})}},
      React.createElement('div',{style:{color:s.c,fontFamily:D.font_display,fontSize:Math.round(width*.024),fontWeight:900,display:'flex',alignItems:'center',gap:8}},
        s.v, s.l==='HALLUCINATION'?React.createElement('span',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'HIGHEST'):''),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085)}},s.l)
    ))
  )
);