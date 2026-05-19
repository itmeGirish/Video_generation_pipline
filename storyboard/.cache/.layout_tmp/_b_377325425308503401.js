const NARRATION_TEXT = "<pause 0.2s> Anthropic isn't competing with OpenAI. Anthropic is competing with McKinsey. With Deloitte. With the concept of paying an expert to get the answer right the first time. <pause 0.4s> OpenAI wins if the future is: AI does everything, good enough, all in one place. <pause 0.2s> Anthropic wins if the future is: AI does the hard things, correctly, and you trust the output. <pause 0.4s> And you know what? The market is big enough for both. Because every company on earth needs a search engine AND a consultant. <pause 0.3s> That's not a rivalry. That's an ecosystem.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1=interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'});
const l2=interpolate(frame,[20,32],[0,1],{extrapolateRight:'clamp'});
const l3=interpolate(frame,[30,42],[0,1],{extrapolateRight:'clamp'});
const l4=interpolate(frame,[40,52],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.025)}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.012),opacity:l1}},'EVERY COMPANY NEEDS'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.03),fontWeight:900,opacity:l2}},'A SEARCH ENGINE'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.03),fontWeight:900,opacity:l3}},'AND A CONSULTANT.'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.013),opacity:l4,marginTop:Math.round(height*.01)}},"THAT'S NOT A RIVALRY.  THAT'S AN ECOSYSTEM.")
  )
);