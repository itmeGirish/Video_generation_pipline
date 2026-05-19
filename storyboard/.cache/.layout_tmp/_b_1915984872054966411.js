const NARRATION_TEXT = "Claude. <pause 0.2s> Honesty?";
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const target1='CLAUDE 4.7'; const target2='CLAUDE 4.7';
const settled1=frame>18; const settled2=frame>30;
const c1=chars[Math.floor(frame*2.2)%chars.length]; const c2=chars[Math.floor((frame-6)*2.2)%chars.length];
const txt1=settled1?target1:c1.repeat(target1.length);
const txt2=settled2?target2:c2.repeat(target2.length);
const rows=[
  {cat:'DOING THINGS',txt:'GPT-5.5',color:D.violet,settled:true},
  {cat:'THINKING',txt:txt1,color:settled1?D.cyan:D.text_dim,settled:settled1},
  {cat:'HONESTY',txt:txt2,color:settled2?D.green:D.text_dim,settled:settled2},
  {cat:'ETHICS',txt:'--------',color:D.text_dim,settled:false},
  {cat:'VALUE',txt:'--------',color:D.text_dim,settled:false},
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:.6}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const bgMap=[D.violet+'22',D.cyan+'22',D.green+'22',D.surface,D.surface];
      const bg=r.settled?bgMap[i]:D.surface;
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:bg,borderRadius:6,overflow:'hidden'}},
        React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:r.settled?700:400}},r.txt)
      );
    })
  )
);