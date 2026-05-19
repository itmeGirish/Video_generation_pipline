const NARRATION_TEXT = "<pause 0.5s> The answer is on the board. <pause 0.3s> Doing things?";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const boardOp=interpolate(frame,[6,20],[0,1],{extrapolateRight:'clamp'});
const rows=[
  {cat:'DOING THINGS'},{cat:'THINKING'},{cat:'HONESTY'},{cat:'ETHICS'},{cat:'VALUE'}
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68);
const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:interpolate(frame,[4,16],[0,1],{extrapolateRight:'clamp'})}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008),opacity:boardOp}},
    ...rows.map((r,i)=>React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:D.surface,borderRadius:6,overflow:'hidden'}},
      React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
      React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.01)}},'--------')
    ))
  )
);