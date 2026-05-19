const NARRATION_TEXT = "No fluff. <pause 0.2s> Comment below: are you a platform person or a precision person? Best takes get pinned. <pause 0.3s> And that NVIDIA engineer who said losing GPT-5.5 felt like losing a limb? <pause 0.4s> He's right. It IS incredible. <pause 0.3s> Just don't let it write your citations.";
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
const target='SUBSCRIBE';
const settled=frame>32;
const cycleStr=settled?target:target.split('').map((_,i)=>chars[Math.floor((frame+i*3)*.8)%chars.length]).join('');
const btnOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const subOp=interpolate(frame,[26,40],[0,1],{extrapolateRight:'clamp'});
const commentOp=interpolate(frame,[42,56],[0,1],{extrapolateRight:'clamp'});
const blinkOn=Math.floor(frame/18)%2===0;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.03)}},
    React.createElement('div',{style:{width:Math.round(width*.6),height:Math.round(height*.13),backgroundColor:D.surface,borderRadius:8,border:`2px solid ${D.cyan}`,display:'flex',alignItems:'center',justifyContent:'center',opacity:btnOp}},
      React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.022),fontWeight:700,letterSpacing:5}},cycleStr)
    ),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:subOp,textAlign:'center',lineHeight:2}},
      'Real benchmarks.  Real developer reactions.  Real money math.\nNo hype.  No fluff.'
    ),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:commentOp,textAlign:'center'}},
      'PLATFORM OR PRECISION? — ',
      React.createElement('span',{style:{color:blinkOn?D.amber:D.surface}},'YOU')
    )
  )
);