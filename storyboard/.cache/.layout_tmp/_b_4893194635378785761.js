const NARRATION_TEXT = "When Mythos goes public, we do this whole video again. <pause 0.3s> Here's what I actually think. The winner of April twenty-twenty-six isn't a model. It's the developer who stops asking 'which one' and starts building systems that use both. <pause 0.3s> If you're writing code you can't afford to get wrong \u2014 use Claude. If you're building systems that need to act \u2014 GPT-5.5 is unstoppable. <pause 0.2s> They're not rivals. They're different species. <pause 0.4s> If this video changed how you think about AI \u2014 and I mean actually changed it, not just informed you \u2014 hit subscribe. Every major launch gets this treatment.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
const target='SUBSCRIBE';
const settled=frame>28;
const cycleStr=settled?target:target.split('').map((_,i)=>chars[Math.floor((frame+i*3)*.8)%chars.length]).join('');
const cOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const subOp=interpolate(frame,[22,34],[0,1],{extrapolateRight:'clamp'});
const blinkOn=Math.floor(frame/18)%2===0;
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.35),transform:'translateX(-50%)',width:Math.round(width*.6),height:Math.round(height*.14),backgroundColor:D.surface,borderRadius:6,border:'2px solid '+D.cyan,display:'flex',alignItems:'center',justifyContent:'center',opacity:cOp}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.022),fontWeight:700,letterSpacing:4}},cycleStr)
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.55),transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),textAlign:'center',opacity:subOp}},
    'Real benchmarks.  Real code.  Real money.  No hype.'),
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.1),transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.012),opacity:interpolate(frame,[34,46],[0,1],{extrapolateRight:'clamp'}),textAlign:'center',whiteSpace:'nowrap'}},
    'PLATFORM OR PRECISION? — ',
    React.createElement('span',{style:{color:blinkOn?D.amber:D.surface}},'YOU'))
);