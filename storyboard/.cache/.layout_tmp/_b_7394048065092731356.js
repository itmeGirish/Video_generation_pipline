const NARRATION_TEXT = "'Every dollar counts.' <pause 0.3s> Opus four-point-seven \u2014 same thing. Same lies. Same stiffed customers. <pause 0.2s> Then GPT-5.5 plays. And HERE'S the twist \u2014 <pause 0.2s> it wins. Seven thousand nine hundred eighty dollars versus Claude's five thousand eight hundred thirty-eight.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const podiumData=[
  {rank:1,label:'GPT-5.5',amount:'$7,980',color:D.violet,height:.38},
  {rank:2,label:'CLAUDE 4.7',amount:'$5,838',color:D.cyan,height:.27},
  {rank:3,label:'GPT-5.4',amount:'$2,158',color:D.text_dim,height:.15},
];
const baseY=Math.round(height*.75);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'})}},'VENDING-BENCH — FINAL STANDINGS'),
  ...podiumData.map((p,i)=>{
    const pOp=interpolate(frame,[8+i*8,20+i*8],[0,1],{extrapolateRight:'clamp'});
    const PH=Math.round(height*p.height);
    const PW=Math.round(width*.18);
    const xPos=Math.round(width*.28+i*Math.round(width*.2));
    return React.createElement('div',{key:i,style:{position:'absolute',left:xPos,bottom:Math.round(height*.12),width:PW,height:PH,backgroundColor:D.surface,borderRadius:'6px 6px 0 0',border:'2px solid '+p.color,opacity:pOp,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',paddingTop:Math.round(height*.015)}},
      React.createElement('div',{style:{color:p.color,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,marginBottom:4}},p.rank===1?'🥇':p.rank===2?'🥈':'🥉'),
      React.createElement('div',{style:{color:p.color,fontFamily:D.font_display,fontSize:Math.round(width*.014),fontWeight:900}},p.amount),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),marginTop:6}},p.label)
    );
  })
);