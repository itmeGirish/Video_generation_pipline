const NARRATION_TEXT = "Yeah. That surprised me too. <pause 0.2s> Value? Build the pipeline. Stop guessing. <pause 0.3s> And somewhere in a vault, restricted to eight companies, Anthropic has a model that beats both of them on almost everything.";
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const vaultOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const pipeOp=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const vaultPulse=Math.sin(frame*.1)*.2+.8;
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
const rows=[
  {cat:'DOING THINGS',txt:'GPT-5.5',color:D.violet},{cat:'THINKING',txt:'CLAUDE 4.7',color:D.cyan},
  {cat:'HONESTY',txt:'CLAUDE 4.7',color:D.green},{cat:'ETHICS',txt:'GPT-5.5',color:D.green},
  {cat:'VALUE',txt:'BUILD THE PIPELINE',color:D.amber},
];
const bgMap=[D.violet+'22',D.cyan+'22',D.green+'22',D.green+'22',D.amber+'22'];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.06),display:'flex',flexDirection:'column',gap:Math.round(height*.006)}},
    ...rows.map((r,i)=>React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:Math.round(RH*.8),width:RW,backgroundColor:bgMap[i],borderRadius:4,overflow:'hidden'}},
      React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075)}},r.cat),
      React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700}},r.txt)
    ))
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.28),left:Math.round(width*.06),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.018)}px ${Math.round(width*.018)}px`,border:`1px solid ${D.green}`,opacity:vaultOp,maxWidth:Math.round(width*.32)}},
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,textShadow:`0 0 10px ${D.green}`,opacity:vaultPulse}},'⬡  MYTHOS IS WAITING.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),marginTop:Math.round(height*.008)}},'Restricted to 8 companies.')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.28),right:Math.round(width*.06),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.018)}px ${Math.round(width*.018)}px`,border:`1px solid ${D.amber}`,opacity:pipeOp,maxWidth:Math.round(width*.32)}},
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700}},'⚙  BUILD THIS MONDAY.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),marginTop:Math.round(height*.008)}},'GPT draft  →  Claude verify  →  ship.')
  )
);