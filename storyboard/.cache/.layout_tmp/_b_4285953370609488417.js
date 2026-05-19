const NARRATION_TEXT = "So. Did GPT-5.5 beat Claude Opus four-point-seven? <pause 0.5s> The answer is on the board. <pause 0.3s> Doing things? GPT. <pause 0.2s> Thinking carefully? Claude. <pause 0.2s> Honesty? Claude. Not close. <pause 0.2s> Ethics? <pause 0.3s> \u2026GPT. Yeah. That surprised me too.";
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const rows=[
  {cat:'DOING THINGS',winner:'GPT-5.5',color:D.violet,f:8},
  {cat:'THINKING',winner:'CLAUDE 4.7',color:D.cyan,f:22},
  {cat:'HONESTY',winner:'CLAUDE 4.7',color:D.green,f:36},
  {cat:'ETHICS',winner:'GPT-5.5',color:D.green,f:52},
  {cat:'VALUE',winner:'BUILD THE PIPELINE',color:D.amber,f:66},
];
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const RH=Math.round(height*.1); const RW=Math.round(width*.7);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S10'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:interpolate(frame,[6,18],[0,1],{extrapolateRight:'clamp'})}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.15),top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const rowOp=interpolate(frame,[r.f,r.f+8],[0,1],{extrapolateRight:'clamp'});
      const settled=frame>r.f+14;
      const cycleChar=settled?'':chars[Math.floor((frame-r.f)*2.5)%chars.length];
      const displayText=settled?r.winner:cycleChar.repeat(Math.min(r.winner.length,Math.floor((frame-r.f)*1.5)));
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',gap:0,height:RH,width:RW,backgroundColor:D.surface,borderRadius:6,overflow:'hidden',opacity:rowOp}},
        React.createElement('div',{style:{width:Math.round(RW*.35),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,letterSpacing:settled?1:0}},settled?r.winner:displayText)
      );
    })
  )
);