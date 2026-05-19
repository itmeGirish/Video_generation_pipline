const NARRATION_TEXT = "It runs a fact-check pass. Scans for fabrications. Those red flags either get verified \u2014 green check \u2014 or caught and removed. <pause 0.2s> Clean output comes out the other end. Total cost: twenty-four cents. Eleven seconds. Hallucination-checked. <pause 0.3s> Now look at the alternative. Running Claude alone for the same query? Ninety-five cents.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const topOp=interpolate(frame,[10,20],[0,.4],{extrapolateRight:'clamp'});
const botOp=interpolate(frame,[14,26],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.3); const MH=Math.round(height*.42);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:topOp}},
    'TWO-MODEL PIPELINE  (above)'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.25),transform:'translateX(-50%)',width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'2px solid '+D.cyan,opacity:botOp,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:Math.round(width*.02)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'CLAUDE ALONE — SAME QUERY'),
    React.createElement('div',{style:{width:'85%',height:Math.round(height*.2),backgroundColor:D.bg,borderRadius:6,display:'flex',flexDirection:'column',gap:4,padding:8,overflow:'hidden'}},
      ...Array.from({length:6},(_,i)=>React.createElement('div',{key:i,style:{height:4,borderRadius:2,backgroundColor:D.cyan,width:(70+i*5)+'%',opacity:.4}}))
    ),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.03)}},
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'$0.95'),
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'20s'),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_display,fontSize:Math.round(width*.018)}}},'3,000 tokens')
    )
  )
);