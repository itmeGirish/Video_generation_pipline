const NARRATION_TEXT = "<pause 0.2s> Ethics? <pause 0.3s> \u2026GPT. Yeah.";
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const target4='BUILD THE PIPELINE';
const settled4=frame>24;
const c4=chars[Math.floor(frame*2.6)%chars.length];
const txt4=settled4?target4:c4.repeat(Math.min(target4.length,Math.floor(frame*1.8)));
const rows=[
  {cat:'DOING THINGS',txt:'GPT-5.5',color:D.violet,settled:true},
  {cat:'THINKING',txt:'CLAUDE 4.7',color:D.cyan,settled:true},
  {cat:'HONESTY',txt:'CLAUDE 4.7',color:D.green,settled:true},
  {cat:'ETHICS',txt:'GPT-5.5',color:D.green,settled:true},
  {cat:'VALUE',txt:txt4,color:settled4?D.amber:D.text_dim,settled:settled4},
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:.6}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const bgMap=[D.violet+'22',D.cyan+'22',D.green+'22',D.green+'22',D.amber+'22'];
      const bg=r.settled?bgMap[i]:D.surface;
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:bg,borderRadius:6,overflow:'hidden'}},
        React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:r.settled?700:400}},r.txt)
      );
    })
  ),
  settled4?React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.12),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,opacity:interpolate(frame,[26,40],[0,1],{extrapolateRight:'clamp'})}},'Stop guessing.  Start building.'):null
);