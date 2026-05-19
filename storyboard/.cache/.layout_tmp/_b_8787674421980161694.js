const NARRATION_TEXT = "Apple. Google. Microsoft.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const cardRot=interpolate(frame,[0,durationInFrames*.5],[15,-15],{extrapolateRight:'clamp'});
const glow=Math.sin(frame*.08)*.3+.7;
const cardOp=interpolate(frame,[8,22],[0,1],{extrapolateRight:'clamp'});
const CW=Math.round(width*.32); const CH=Math.round(height*.5);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:`translate(-50%,-50%) rotate(${cardRot}deg)`,width:CW,height:CH,backgroundColor:D.surface,borderRadius:16,border:'3px solid '+D.green,opacity:cardOp,boxShadow:`0 0 ${Math.round(40*glow)}px ${D.green}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3}},'CLAUDE MYTHOS PREVIEW'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,letterSpacing:2}},'RESTRICTED'),
    React.createElement('div',{style:{width:'80%',height:1,backgroundColor:D.text_dim,opacity:.3}}),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.6}},'Autonomous vuln detection\nReproduces real exploits\n"Too capable to release"')
  )
);