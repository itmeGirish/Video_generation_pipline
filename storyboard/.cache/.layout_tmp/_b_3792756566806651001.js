const NARRATION_TEXT = "The model from last August? Retired. Gone. <pause 0.3s> They have nine hundred million weekly users. Fifty million paying subscribers. They're building toward the largest tech IPO in history. And they're merging everything into a single super app. <pause 0.3s> That's not a model company. That's a PLATFORM company. <pause 0.2s> OpenAI isn't competing with Anthropic. OpenAI is competing with Google Search. With Microsoft Office. With the concept of doing things manually on a computer. <pause 0.3s> Now look at Anthropic. Three releases in the same period. Bigger jumps each time. Built a model too powerful to release. Created a defense partnership with eight trillion-dollar companies. Running a hallucination rate less than half the competition. <pause 0.3s> That's not a platform company. That's a PRECISION company. <pause 0.2s> Anthropic isn't competing with OpenAI.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const rOp=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const pulseCycle=frame%90;
const pulse=Math.sin(pulseCycle*.07)*.2+.8;
const beamAngle=frame*0.8;
const PR=Math.round(width*.14);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),opacity:lOp}},
    React.createElement('div',{style:{width:PR*2,height:PR*2,borderRadius:'50%',backgroundColor:D.violet,opacity:.7*pulse,boxShadow:`0 0 ${Math.round(40*pulse)}px ${D.violet}`,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}},
      React.createElement('div',{style:{color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.5}},`900M\nusers`)
    ),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900}},'THE PLATFORM'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.6}},'Competing with Google Search\nMicrosoft Office\nManual computer use')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.014),opacity:.5}},'≠'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.14),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),opacity:rOp}},
    React.createElement('div',{style:{width:PR*2,height:PR*2,borderRadius:'50%',backgroundColor:D.cyan,opacity:.55,boxShadow:'0 0 30px '+D.cyan,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}},
      React.createElement('div',{style:{color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.5}},'36%\nhalluc.')
    ),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900}},'THE CONSULTANT'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.6}},'Competing with McKinsey\nDeloitte\nPaying an expert to get it right')
  )
);