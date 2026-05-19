const NARRATION_TEXT = "A might. In a footnote. Doing a LOT of heavy lifting. <pause 0.3s> GPQA Diamond, PhD-level science \u2014 both models are in the ninety-fours.";
const cld=interpolate(frame,[0,32],[0,94.2],{extrapolateRight:'clamp'});
const gpt=interpolate(frame,[0,32],[0,93.6],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const labelOp=interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'});
const ceilOp=interpolate(frame,[38,50],[0,1],{extrapolateRight:'clamp'});
const ceilX=Math.round(width*.14+W*0.9);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:ceilX,top:TY1-Math.round(height*.02),bottom:Math.round(height*.35),width:2,backgroundColor:D.white,opacity:ceilOp*0.6}}),
  React.createElement('div',{style:{position:'absolute',left:ceilX+6,top:TY1-Math.round(height*.04),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),opacity:ceilOp}},'SATURATION'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+6,top:TY1+Math.round(TH*.15),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'94.2%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+6,top:TY2+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'93.6%'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(TY1-height*.08),transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:labelOp,textAlign:'center'}},'GPQA DIAMOND — PhD-LEVEL SCIENCE')
);