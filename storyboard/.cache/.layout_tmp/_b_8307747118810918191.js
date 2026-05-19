const NARRATION_TEXT = "Every major launch gets this treatment. Real benchmarks, real developer reactions, real money math. No hype. No fluff. <pause 0.2s> Comment below: are you a platform person or a precision person? Best takes get pinned. <pause 0.3s> And that NVIDIA engineer who said losing GPT-5.5 felt like losing a limb? <pause 0.4s> He's right. It IS incredible. <pause 0.3s> Just don't let it write your citations.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1=interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'});
const l2=interpolate(frame,[24,36],[0,1],{extrapolateRight:'clamp'});
const chars='1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
const targetNum='86%';
const settledNum=frame>52;
const cycleNum=settledNum?targetNum:chars[Math.floor(frame*.8)%chars.length]+chars[Math.floor(frame*.6)%chars.length]+'%';
const numOp=interpolate(frame,[40,54],[0,1],{extrapolateRight:'clamp'});
const tagOp=interpolate(frame,[56,68],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.04)}},
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.04),opacity:l1}}),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.012),opacity:l1,textAlign:'center',fontStyle:'italic'}},'"Like having a limb amputated."'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.012),opacity:l2,textAlign:'center',fontStyle:'italic'}},'— He\'s right.  It IS incredible.'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.1),fontWeight:900,opacity:numOp,textShadow:'0 0 50px '+D.red}},settledNum?'86%':cycleNum),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.014),fontWeight:700,opacity:tagOp,textAlign:'center'}},'smarter  ≠  more honest')
  )
);