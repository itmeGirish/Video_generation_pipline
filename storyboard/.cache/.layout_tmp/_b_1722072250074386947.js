const NARRATION_TEXT = "<pause 0.3s> Doing things? GPT. <pause 0.2s> Thinking carefully? Claude.";
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const target0='GPT-5.5';
const settled0=frame>22;
const cyc0=chars[Math.floor(frame*2.4)%chars.length];
const txt0=settled0?target0:cyc0.repeat(target0.length);
const col0=settled0?D.violet:D.text_dim;
const rows=[
  {cat:'DOING THINGS',txt:txt0,color:col0,settled:settled0},
  {cat:'THINKING',txt:'--------',color:D.text_dim,settled:false},
  {cat:'HONESTY',txt:'--------',color:D.text_dim,settled:false},
  {cat:'ETHICS',txt:'--------',color:D.text_dim,settled:false},
  {cat:'VALUE',txt:'--------',color:D.text_dim,settled:false},
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:.6}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const bg=i===0&&r.settled?D.violet+'22':D.surface;
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:bg,borderRadius:6,overflow:'hidden',transition:'none'}},
        React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:r.settled?700:400}},r.txt)
      );
    })
  )
);