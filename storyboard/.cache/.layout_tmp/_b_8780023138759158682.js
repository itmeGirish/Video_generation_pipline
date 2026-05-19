const NARRATION_TEXT = "<pause 0.2s> Honesty? Claude. Not close. <pause 0.2s> Ethics?";
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const target3='GPT-5.5';
const flickerLen=40;
const settled3=frame>flickerLen;
const c3=chars[Math.floor(frame*2.8)%chars.length];
const fakeClau=frame>12&&frame<28;
const displayTxt=settled3?target3:(fakeClau?'CLAU----':c3.repeat(target3.length));
const rows=[
  {cat:'DOING THINGS',txt:'GPT-5.5',color:D.violet,settled:true},
  {cat:'THINKING',txt:'CLAUDE 4.7',color:D.cyan,settled:true},
  {cat:'HONESTY',txt:'CLAUDE 4.7',color:D.green,settled:true},
  {cat:'ETHICS',txt:displayTxt,color:settled3?D.green:D.amber,settled:settled3},
  {cat:'VALUE',txt:'--------',color:D.text_dim,settled:false},
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:.6}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const bgMap=[D.violet+'22',D.cyan+'22',D.green+'22',D.green+'22',D.surface];
      const bg=r.settled?bgMap[i]:D.surface;
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:bg,borderRadius:6,overflow:'hidden'}},
        React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:r.settled?700:400}},r.txt)
      );
    })
  ),
  settled3?React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.12),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[flickerLen+8,flickerLen+22],[0,1],{extrapolateRight:'clamp'})}},'Yeah.  That surprised me too.'):null
);