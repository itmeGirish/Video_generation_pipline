const NARRATION_TEXT = "Retired. Gone. <pause 0.3s> They have nine hundred million weekly users. Fifty million paying subscribers. They're building toward the largest tech IPO in history. And they're merging everything into a single super app.";
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const stamp1Op=interpolate(frame,[4,14],[0,1],{extrapolateRight:'clamp'});
const stamp2Op=interpolate(frame,[14,24],[0,1],{extrapolateRight:'clamp'});
const textOp=interpolate(frame,[20,32],[0,1],{extrapolateRight:'clamp'});
const svgW=Math.round(width*.92); const svgH=Math.round(height*.5); const baseY=Math.round(svgH*.55);
const scale=Math.round(svgH*.85);
const allSpikes=[
  {x:.06,h:.28,label:'GPT-5',retired:true},{x:.18,h:.32,label:'5.1',retired:true},
  {x:.28,h:.36,label:'5.2',retired:false},{x:.36,h:.40,label:'5.3',retired:false},
  {x:.43,h:.44,label:'5.4',retired:false},{x:.49,h:.48,label:'5.5',retired:false}
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('svg',{style:{position:'absolute',left:Math.round(width*.04),top:Math.round(height*.18),width:svgW,height:svgH},viewBox:`0 0 ${svgW} ${svgH}`},
    React.createElement('line',{x1:0,y1:baseY,x2:svgW,y2:baseY,stroke:D.text_dim,strokeWidth:1,opacity:.2}),
    ...allSpikes.map((s,i)=>{
      const sH=Math.round(scale*s.h); const sX=Math.round(svgW*s.x);
      const color=s.retired?D.red:D.violet;
      const retiredStampOp=s.retired?(i===0?stamp1Op:stamp2Op):0;
      return React.createElement('g',{key:'s'+i},
        React.createElement('rect',{x:sX-3,y:baseY-sH,width:6,height:sH,fill:color}),
        s.retired?React.createElement('line',{x1:sX-12,y1:baseY-4,x2:sX+12,y2:baseY-4,stroke:D.red,strokeWidth:3,opacity:retiredStampOp}):null,
        React.createElement('text',{x:sX,y:baseY-sH-8,textAnchor:'middle',fill:color,fontSize:11,fontFamily:'monospace'},s.label),
        s.retired?React.createElement('text',{x:sX,y:baseY-sH-22,textAnchor:'middle',fill:D.red,fontSize:10,fontFamily:'monospace',opacity:retiredStampOp},'RETIRED'):null
      );
    }),
    React.createElement('text',{x:Math.round(svgW*.02),y:baseY+20,fill:D.text_dim,fontSize:11,fontFamily:'monospace',opacity:.7},'OPENAI')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.18),left:'50%',transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:textOp,textAlign:'center'}},
    'Model from last August?  Gone.'
  )
);