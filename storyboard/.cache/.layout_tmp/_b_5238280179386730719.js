const NARRATION_TEXT = "And they're merging everything into a single super app. <pause 0.3s> That's not a model company. That's a PLATFORM company. <pause 0.2s> OpenAI isn't competing with Anthropic. OpenAI is competing with Google Search. With Microsoft Office. With the concept of doing things manually on a computer. <pause 0.3s> Now look at Anthropic. Three releases in the same period. Bigger jumps each time.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const stats=[
  {label:'900M',sub:'weekly users',color:D.violet,f:6},
  {label:'50M',sub:'paying subscribers',color:D.violet,f:22},
  {label:'#1',sub:'Largest tech IPO in history',color:D.amber,f:38},
  {label:'1 app',sub:'ChatGPT + Codex + Atlas + Agents',color:D.violet,f:54},
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.012),fontWeight:700,letterSpacing:3,opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'})}},'OPENAI BY THE NUMBERS'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),right:Math.round(width*.1),top:Math.round(height*.2),display:'flex',flexWrap:'wrap',gap:Math.round(height*.03)}},
    ...stats.map((s,i)=>{
      const sp=spring({frame:Math.max(0,frame-s.f),fps,config:{damping:14,stiffness:160}});
      const op=interpolate(frame,[s.f,s.f+12],[0,1],{extrapolateRight:'clamp'});
      const scale=interpolate(sp,[0,1],[.7,1],{extrapolateRight:'clamp'});
      return React.createElement('div',{key:i,style:{width:Math.round(width*.36),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.025)}px ${Math.round(width*.02)}px`,opacity:op,transform:`scale(${scale})`}},
        React.createElement('div',{style:{color:s.color,fontFamily:D.font_display,fontSize:Math.round(width*.038),fontWeight:900,lineHeight:1}},s.label),
        React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginTop:Math.round(height*.008)}},s.sub)
      );
    })
  )
);