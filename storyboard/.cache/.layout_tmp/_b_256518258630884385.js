const NARRATION_TEXT = "NVIDIA. JPMorgan. CrowdStrike. AWS. Cisco. They built an entire program \u2014 Project Glasswing \u2014 just to manage it. <pause 0.3s> Why lock it up?";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const models=[
  {label:'GPT-5.5',score:58.6,color:D.violet},
  {label:'CLAUDE 4.7',score:64.3,color:D.cyan},
  {label:'MYTHOS',score:77.8,color:D.green},
];
const maxH=Math.round(height*.52);
const baseY=Math.round(height*.72);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'}),textAlign:'center'}},'SWE-BENCH PRO COMPARISON'),
  ...models.map((m,i)=>{
    const barH=Math.round(maxH*m.score/100);
    const pOp=interpolate(frame,[8+i*8,20+i*8],[0,1],{extrapolateRight:'clamp'});
    const BW=Math.round(width*.16);
    return React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(width*.18+i*Math.round(width*.24)),bottom:Math.round(height*.12),display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.01),opacity:pOp}},
      React.createElement('div',{style:{color:m.color,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},m.score+'%'+(i===1?'*':'')),
      React.createElement('div',{style:{width:BW,height:barH,backgroundColor:m.color,borderRadius:'6px 6px 0 0',opacity:.85,boxShadow:i===2?'0 0 30px '+D.green:'none'}}),
      React.createElement('div',{style:{color:m.color,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},m.label)
    );
  }),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.58),top:Math.round(height*.35),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[30,42],[0,1],{extrapolateRight:'clamp'}),display:'flex',flexDirection:'column',gap:6}},
    React.createElement('div',null,'+13.2 above GPT-5.5'),
    React.createElement('div',null,'+19.2 above Claude you can buy'),
    React.createElement('div',{style:{color:D.text_dim,marginTop:4}},'Terminal-Bench gap: 82.7 vs 82.0 (−0.7)')
  )
);