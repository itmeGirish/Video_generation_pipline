const NARRATION_TEXT = "And here's the part that makes everything I just said potentially irrelevant. <pause 0.4s> Claude Opus four-point-seven \u2014 the model that just won six out of ten benchmarks, the one with the best hallucination rate, the one your pipeline is using for fact-checking \u2014 is NOT Anthropic's best model. <pause 0.5s> Their best model is called Mythos Preview.";
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const doorOp=interpolate(frame,[8,22],[0,1],{extrapolateRight:'clamp'});
const VW=Math.round(width*.65); const VH=Math.round(height*.76);
const companies=['APPLE','GOOGLE','MICROSOFT','NVIDIA','JPMORGAN','CROWDSTRIKE','AWS','CISCO'];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S8'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:VW,height:VH,backgroundColor:D.surface,borderRadius:'50%',border:'4px solid '+D.text_dim,opacity:doorOp,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,letterSpacing:4}},'CLASSIFIED'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.01),letterSpacing:2}},'PROJECT GLASSWING'),
    React.createElement('div',{style:{display:'flex',flexWrap:'wrap',gap:Math.round(width*.01),justifyContent:'center',width:Math.round(VW*.7),marginTop:Math.round(height*.02)}},
      ...companies.map((c,i)=>React.createElement('div',{key:i,style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),padding:'3px 8px',border:'1px solid '+D.text_dim,borderRadius:4,opacity:interpolate(frame,[12+i*3,22+i*3],[0,1],{extrapolateRight:'clamp'})}},c))
    ),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:Math.round(height*.02),textAlign:'center'}},
      '8 COMPANIES  ·  ACCESS RESTRICTED')
  )
);