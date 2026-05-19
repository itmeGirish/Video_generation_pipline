const NARRATION_TEXT = "And you can't use it. <pause 0.3s> Anthropic restricted it to eight companies.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const headerOp=interpolate(frame,[0,16],[0,1],{extrapolateRight:'clamp'});
const companies=['APPLE','GOOGLE','MICROSOFT','NVIDIA','JPMORGAN','CROWDSTRIKE','AWS','CISCO'];
const R=Math.round(Math.min(width,height)*.29);
const cx=Math.round(width*.5); const cy=Math.round(height*.54);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:headerOp,textAlign:'center'}},'PROJECT GLASSWING  —  RESTRICTED ACCESS'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.13),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:headerOp,textAlign:'center'}},'Claude Mythos preview — 8 companies only. Not for sale.'),
  React.createElement('div',{style:{position:'absolute',left:cx-22,top:cy-22,width:44,height:44,borderRadius:'50%',backgroundColor:D.surface,border:'2px solid '+D.green,display:'flex',alignItems:'center',justifyContent:'center',opacity:op,boxShadow:'0 0 24px '+D.green}}),
  ...companies.map((c,i)=>{
    const angle=(i/8)*Math.PI*2-Math.PI/2;
    const ex=Math.round(cx+Math.cos(angle)*R); const ey=Math.round(cy+Math.sin(angle)*R);
    const bOp=interpolate(frame,[i*4,i*4+10],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{position:'absolute',left:ex-Math.round(width*.04),top:ey-Math.round(height*.022),width:Math.round(width*.08),height:Math.round(height*.044),backgroundColor:D.surface,borderRadius:6,border:'2px solid '+D.amber,display:'flex',alignItems:'center',justifyContent:'center',opacity:bOp*op,boxShadow:'0 0 8px '+D.amber+'44'}},
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.007),textAlign:'center',fontWeight:700}},c)
    );
  })
);