const NARRATION_TEXT = "And you can't use it. <pause 0.3s> Anthropic restricted it to eight companies.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const companies=['APPLE','GOOGLE','MICROSOFT','NVIDIA','JPMORGAN','CROWDSTRIKE','AWS','CISCO'];
const VW=Math.round(width*.65); const VH=Math.round(height*.76);
const R=Math.round(VW*.46);
return React.createElement(React.Fragment,null,
  ...companies.map((c,i)=>{
    const angle=(i/8)*Math.PI*2-Math.PI/2;
    const cx=Math.round(width*.5+Math.cos(angle)*R); const cy=Math.round(height*.5+Math.sin(angle)*R);
    const bOp=interpolate(frame,[i*4,i*4+10],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{position:'absolute',left:cx-Math.round(width*.04),top:cy-Math.round(height*.02),width:Math.round(width*.08),height:Math.round(height*.04),backgroundColor:D.surface,borderRadius:6,border:'2px solid '+D.amber,display:'flex',alignItems:'center',justifyContent:'center',opacity:bOp*op}},
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.007),textAlign:'center'}},c)
    );
  })
);