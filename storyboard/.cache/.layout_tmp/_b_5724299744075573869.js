const NARRATION_TEXT = "<pause 0.3s> The devs who use these daily confirm it. Theo Browne \u2014 and I quote \u2014 'GPT-5.5 is smart, weird, hard to wrangle, and too expensive.' <pause 0.2s> CodeRabbit's production tests: issue detection jumped from fifty-eight to seventy-nine percent \u2014 but only with extremely specific prompts. <pause 0.2s> GPT-5.5? Brilliant intern. <pause 0.2s> Claude? Senior engineer.";
const quotes=[
  {text:'"GPT-5.5 is smart, weird, hard to wrangle, and too expensive."',attr:'Theo Browne — developer',color:D.violet},
  {text:'"Issue detection jumped 58% → 79%, but ONLY with extremely specific prompts."',attr:'CodeRabbit — production tests',color:D.cyan},
];
return React.createElement(React.Fragment,null,
  ...quotes.map((q,i)=>{
    const delay=i*14;
    const sl=interpolate(spring({frame:Math.max(0,frame-delay),fps,config:{damping:14,stiffness:80}}),[0,1],[-Math.round(width*.08),0],{extrapolateRight:'clamp'});
    const op=interpolate(frame,[delay,delay+12],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{
      position:'absolute',left:Math.round(width*.1)+sl,top:Math.round(height*.3+i*height*.22),
      width:Math.round(width*.72),backgroundColor:D.surface,borderRadius:10,
      padding:Math.round(width*.02),borderLeft:'4px solid '+q.color,opacity:op
    }},
      React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.012),fontStyle:'italic',lineHeight:1.45}},q.text),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),marginTop:Math.round(height*.012)}},q.attr)
    );
  })
);