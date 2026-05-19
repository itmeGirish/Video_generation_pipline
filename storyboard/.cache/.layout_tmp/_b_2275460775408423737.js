const NARRATION_TEXT = "<pause 0.2s> SWE-bench Pro. Claude pulls ahead. And here's a juicy detail \u2014 Claude's score has an asterisk on it. OpenAI flagged in their own benchmark table that Anthropic might have benefited from training data overlap. A might.";
const cld=interpolate(frame,[0,34],[0,64.3],{extrapolateRight:'clamp'});
const gpt=interpolate(frame,[0,34],[0,58.6],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const ctxOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const labelOp=interpolate(frame,[30,42],[0,1],{extrapolateRight:'clamp'});
const astOp=interpolate(frame,[40,52],[0,1],{extrapolateRight:'clamp'});
const noteOp=interpolate(frame,[52,64],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3,opacity:ctxOp}},'REASONING ROUND  —  SWE-BENCH PRO'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'GPT-5.5'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+6,top:TY1+Math.round(TH*.12),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:labelOp}},
    cld.toFixed(1)+'%',
    React.createElement('span',{style:{color:D.red,fontSize:Math.round(width*.014),marginLeft:2,opacity:astOp}},'*')
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+6,top:TY2+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'58.6%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),bottom:Math.round(height*.06),right:Math.round(width*.14),color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),fontStyle:'italic',opacity:noteOp}},'* OpenAI flagged Anthropic\'s score for possible training data overlap in their own benchmark table')
);