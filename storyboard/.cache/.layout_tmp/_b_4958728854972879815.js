const NARRATION_TEXT = "<pause 0.2s> Quick reality check \u2014 benchmarks aren't reality. But they show patterns. <pause 0.3s> See it?";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cardOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const gptW=interpolate(frame,[14,38],[0,4],{extrapolateRight:'clamp'});
const cldW=interpolate(frame,[22,46],[0,6],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.03),opacity:cardOp}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,marginBottom:Math.round(height*.01)}},'FINAL SCORE'),
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:Math.round(width*.05)}},
      React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.012)}},
        React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.055),fontWeight:900}},Math.round(gptW)),
        React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.01)}},'GPT-5.5')
      ),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.022)}},'vs'),
      React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.012)}},
        React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.055),fontWeight:900}},Math.round(cldW)),
        React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.01)}},'CLAUDE 4.7')
      )
    )
  )
);