const NARRATION_TEXT = "Because Mythos finds security vulnerabilities in production software faster than human teams. It reproduces real-world exploits autonomously. Anthropic looked at what it could do and said 'this is too capable to release.' <pause 0.4s> But here's the insane part. Look at these numbers. <pause 0.3s> SWE-bench Pro \u2014 the benchmark Claude already leads on \u2014 Mythos scores seventy-seven point eight. That's THIRTEEN points above GPT-5.5. Nearly twenty above the Claude model you can actually buy. <pause 0.3s> And the one benchmark where GPT-5.5 can claim a win over Mythos? Terminal-Bench. Eighty-two point seven versus eighty-two flat.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const waterOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const models=[{label:'CLAUDE 4.7',pct:40,color:D.cyan},{label:'GPT-5.5',pct:35,color:D.violet},{label:'MYTHOS',pct:72,color:D.green}];
const IW=Math.round(width*.18); const totalH=Math.round(height*.58);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,opacity:waterOp,textAlign:'center'}},'GENERAL AVAILABILITY WATERLINE'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),right:Math.round(width*.08),top:Math.round(height*.42),height:2,backgroundColor:D.cyan,opacity:waterOp*.6}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12),top:Math.round(height*.4),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:waterOp}},'GENERAL AVAILABILITY'),
  ...models.map((m,i)=>{
    const above=Math.round(totalH*(100-m.pct)/100); const below=Math.round(totalH*m.pct/100);
    const pOp=interpolate(frame,[8+i*8,20+i*8],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(width*.18+i*Math.round(width*.24)),top:Math.round(height*.22),display:'flex',flexDirection:'column',alignItems:'center',opacity:pOp}},
      React.createElement('div',{style:{width:IW,height:above,backgroundColor:m.color,borderRadius:'6px 6px 0 0',opacity:.7}}),
      React.createElement('div',{style:{width:IW,height:below,backgroundColor:m.color,borderRadius:'0 0 6px 6px',opacity:.25,border:'1px dashed '+m.color}}),
      React.createElement('div',{style:{color:m.color,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:8,textAlign:'center'}},m.label)
    );
  })
);