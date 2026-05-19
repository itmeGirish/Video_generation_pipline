const NARRATION_TEXT = "Okay. I want to leave you with something bigger than benchmarks.";
const fadeIn=interpolate(frame,[0,15],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const titleOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const lineOp=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const svgW=Math.round(width*.84); const svgH=Math.round(height*.28);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:5,opacity:titleOp}},'PLATFORM  vs  PRECISION'),
  React.createElement('svg',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.35),width:svgW,height:svgH,opacity:lineOp},viewBox:`0 0 ${svgW} ${svgH}`},
    React.createElement('line',{x1:0,y1:Math.round(svgH*.38),x2:svgW,y2:Math.round(svgH*.38),stroke:D.violet,strokeWidth:2.5,opacity:.7}),
    React.createElement('line',{x1:0,y1:Math.round(svgH*.72),x2:svgW,y2:Math.round(svgH*.72),stroke:D.cyan,strokeWidth:2,opacity:.5})
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.59),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.007),opacity:lineOp*.7}},'OPENAI  —  6 models / 8 months'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.67),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.007),opacity:lineOp*.6}},'ANTHROPIC  —  3 models / same period')
);