const NARRATION_TEXT = "<pause 0.2s> Anthropic isn't competing with OpenAI. Anthropic is competing with McKinsey. With Deloitte. With the concept of paying an expert to get the answer right the first time. <pause 0.4s> OpenAI wins if the future is: AI does everything, good enough, all in one place. <pause 0.2s> Anthropic wins if the future is: AI does the hard things, correctly, and you trust the output. <pause 0.4s> And you know what? The market is big enough for both. Because every company on earth needs a search engine AND a consultant. <pause 0.3s> That's not a rivalry.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const titleOp=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const lines=[
  {text:'Three releases.  Bigger jumps each time.',f:14,color:D.cyan},
  {text:'Built a model too powerful to release.',f:28,color:D.cyan},
  {text:'Defense partnership — $8T companies.',f:42,color:D.cyan},
  {text:'Hallucination rate: 36%  (competition: 86%)',f:56,color:D.green},
  {text:'Anthropic isn\'t competing with OpenAI.',f:72,color:D.text_dim},
  {text:'Competing with McKinsey.  Deloitte.',f:84,color:D.text_dim},
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:Math.round(width*.08),color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.012),fontWeight:700,letterSpacing:3,opacity:titleOp}},'ANTHROPIC — THE PRECISION COMPANY'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),right:Math.round(width*.08),top:Math.round(height*.2),display:'flex',flexDirection:'column',gap:Math.round(height*.028)}},
    ...lines.map((ln,i)=>{
      const op=interpolate(frame,[ln.f,ln.f+12],[0,1],{extrapolateRight:'clamp'});
      const xSlide=interpolate(frame,[ln.f,ln.f+16],[-Math.round(width*.03),0],{extrapolateRight:'clamp'});
      return React.createElement('div',{key:i,style:{color:ln.color,fontFamily:D.font_mono,fontSize:Math.round(width*.01),opacity:op,transform:`translateX(${xSlide}px)`,borderLeft:`2px solid ${ln.color}`,paddingLeft:Math.round(width*.012)}},ln.text);
    })
  )
);