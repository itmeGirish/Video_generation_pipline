const NARRATION_TEXT = "<pause 0.2s> OSWorld \u2014 basically a photo finish, less than a point apart. <pause 0.2s> GDPval, real workplace tasks across forty-four professions \u2014 GPT pulls ahead by five. <pause 0.3s> Now when the job is fixing real bugs in real code \u2014 watch the cyan runner.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cardOp=interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame:Math.max(0,frame-10),fps,config:{damping:12,stiffness:75}}),[0,1],[50,0],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:`translate(-50%,-50%) translateY(${sl}px)`,opacity:cardOp,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,textAlign:'center'}},'GPT-5.5  LEADS THE ACTING ROUND'),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.03),marginTop:Math.round(height*.02)}},
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',padding:'6px 14px',border:'1px solid '+D.violet,borderRadius:4}},'Terminal-Bench  +13.3'),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',padding:'6px 14px',border:'1px solid '+D.text_dim,borderRadius:4}},'OSWorld  +0.7'),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',padding:'6px 14px',border:'1px solid '+D.violet,borderRadius:4}},'GDPVal  +4.6')
    ),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),marginTop:Math.round(height*.015)}},'→  NOW: WHEN AI NEEDS TO REASON')
  )
);