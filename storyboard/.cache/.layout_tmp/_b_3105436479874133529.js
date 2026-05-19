const NARRATION_TEXT = "<pause 0.3s> When the job is operating a computer on its own \u2014 terminals, desktops, chaining tools \u2014 watch the magenta runner. <pause 0.2s> Terminal-Bench. GPT rockets ahead.";
const gpt=interpolate(frame,[0,32],[0,78.7],{extrapolateRight:'clamp'});
const cld=interpolate(frame,[0,32],[0,78.0],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const labelOp=interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'});
const chipOp=interpolate(frame,[38,50],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+6,top:TY1+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'78.7%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+6,top:TY2+Math.round(TH*.15),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'78.0%'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(TY1-height*.08),transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:labelOp,textAlign:'center'}},'OSWORLD'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(TY1+TH*.1),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),padding:'3px 8px',border:'1px solid '+D.text_dim,borderRadius:4,opacity:chipOp}},'+0.7  NEAR TIE')
);