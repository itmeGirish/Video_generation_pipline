const NARRATION_TEXT = "April twenty-twenty-six.";
const fadeIn = interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const pulse = Math.sin(frame*.12)*.3+.7;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S2'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.15),top:Math.round(height*.2),right:Math.round(width*.15),bottom:Math.round(height*.2),border:'1px solid '+D.text_dim,borderRadius:6,opacity:.15}}),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.18),left:'50%',transform:'translateX(-50%)',color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'}),textAlign:'center'}},'SAN FRANCISCO — APRIL 2026'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.38)-6,top:Math.round(height*.46)-6,width:12,height:12,borderRadius:'50%',backgroundColor:D.cyan,opacity:pulse,boxShadow:'0 0 20px '+D.cyan}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.42)-6,top:Math.round(height*.46)-6,width:12,height:12,borderRadius:'50%',backgroundColor:D.violet,opacity:pulse*.9,boxShadow:'0 0 20px '+D.violet}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.29),top:Math.round(height*.44),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[15,26],[0,1],{extrapolateRight:'clamp'})}},'ANTHROPIC  APR 16'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.44),top:Math.round(height*.44),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[18,29],[0,1],{extrapolateRight:'clamp'})}},'OPENAI  APR 23')
);