const NARRATION_TEXT = "<pause 0.3s> And somewhere in a vault, restricted to eight companies, Anthropic has a model that beats both of them on almost everything. When Mythos goes public, we do this whole video again. <pause 0.3s> Here's what I actually think. The winner of April twenty-twenty-six isn't a model. It's the developer who stops asking 'which one' and starts building systems that use both. <pause 0.3s> If you're writing code you can't afford to get wrong \u2014 use Claude. If you're building systems that need to act \u2014 GPT-5.5 is unstoppable. <pause 0.2s> They're not rivals. They're different species. <pause 0.4s> If this video changed how you think about AI \u2014 and I mean actually changed it, not just informed you \u2014 hit subscribe. Every major launch gets this treatment. Real benchmarks, real developer reactions, real money math. No hype. No fluff.";
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1Op=interpolate(frame,[12,26],[0,1],{extrapolateRight:'clamp'});
const l2Op=interpolate(frame,[28,42],[0,1],{extrapolateRight:'clamp'});
const l3Op=interpolate(frame,[46,60],[0,1],{extrapolateRight:'clamp'});
const l4Op=interpolate(frame,[62,76],[0,1],{extrapolateRight:'clamp'});
const bothGlow=Math.sin(frame*.1)*.2+.8;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.025),paddingLeft:Math.round(width*.08),paddingRight:Math.round(width*.08)}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:400,opacity:l1Op,textAlign:'center',lineHeight:1.4}},'The winner of April 2026 isn\'t a model.'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:700,opacity:l2Op,textAlign:'center',lineHeight:1.4}},"It's the developer who stops asking"),
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:Math.round(width*.012),opacity:l2Op}},
      React.createElement('span',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900}},'which one'),
      React.createElement('span',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.022)}},'and starts building systems that use'),
      React.createElement('span',{style:{color:'transparent',fontFamily:D.font_display,fontSize:Math.round(width*.026),fontWeight:900,backgroundImage:`linear-gradient(90deg,${D.cyan},${D.violet})`,WebkitBackgroundClip:'text',backgroundClip:'text',textShadow:'none',filter:`drop-shadow(0 0 ${Math.round(14*bothGlow)}px ${D.cyan})`}},'BOTH')
    ),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.02),opacity:l3Op,marginTop:Math.round(height*.02)}},
      React.createElement('div',{style:{backgroundColor:D.cyan+'22',border:`1px solid ${D.cyan}`,borderRadius:6,padding:`${Math.round(height*.016)}px ${Math.round(width*.016)}px`,color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),lineHeight:1.7}},`Code you can't afford\nto get wrong →\nUse Claude.`),
      React.createElement('div',{style:{backgroundColor:D.violet+'22',border:`1px solid ${D.violet}`,borderRadius:6,padding:`${Math.round(height*.016)}px ${Math.round(width*.016)}px`,color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),lineHeight:1.7}},'Systems that need\nto act →\nGPT-5.5.')
    ),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:l4Op,textAlign:'center'}},"They're not rivals.  They're different species.")
  )
);