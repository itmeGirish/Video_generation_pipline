const NARRATION_TEXT = "<pause 0.4s> OpenAI isn't competing with Anthropic. <pause 0.5s> I know. Sounds wrong. But look at what each company is actually doing. <pause 0.3s> OpenAI shipped six models in eight months. Look at this on screen \u2014 the release cadence looks like a heartbeat getting faster. GPT-5, five-point-one, five-point-two, five-point-three, five-point-four, five-point-five. The model from last August? Retired.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const gptSpikes=[
  {x:.06,h:.28,label:'GPT-5',gap:38},{x:.18,h:.32,label:'5.1',gap:32},
  {x:.28,h:.36,label:'5.2',gap:26},{x:.36,h:.40,label:'5.3',gap:20},
  {x:.43,h:.44,label:'5.4',gap:14},{x:.49,h:.48,label:'5.5',gap:0}
];
const claudeSpikes=[
  {x:.58,h:.44,label:'4.5'},{x:.72,h:.52,label:'4.6'},{x:.86,h:.60,label:'4.7'}
];
const svgW=Math.round(width*.92); const svgH=Math.round(height*.58);
const baseY=Math.round(svgH*.55); const scale=Math.round(svgH*.85);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:3,opacity:.6}},'RELEASE CADENCE — acceleration toward tachycardia'),
  React.createElement('svg',{style:{position:'absolute',left:Math.round(width*.04),top:Math.round(height*.16),width:svgW,height:svgH},viewBox:`0 0 ${svgW} ${svgH}`},
    React.createElement('line',{x1:0,y1:baseY,x2:svgW,y2:baseY,stroke:D.text_dim,strokeWidth:1,opacity:.2}),
    ...gptSpikes.map((s,i)=>{
      const spOp=interpolate(frame,[6+i*4,16+i*4],[0,1],{extrapolateRight:'clamp'});
      const sH=Math.round(scale*s.h); const sX=Math.round(svgW*s.x);
      return React.createElement('g',{key:'g'+i,opacity:spOp},
        React.createElement('rect',{x:sX-3,y:baseY-sH,width:6,height:sH,fill:D.violet}),
        React.createElement('text',{x:sX,y:baseY-sH-8,textAnchor:'middle',fill:D.violet,fontSize:11,fontFamily:'monospace'},s.label)
      );
    }),
    React.createElement('text',{x:Math.round(svgW*.02),y:baseY+20,fill:D.violet,fontSize:11,fontFamily:'monospace',opacity:.7},'OPENAI — spacing shrinks ↓'),
    ...claudeSpikes.map((s,i)=>{
      const spOp=interpolate(frame,[14+i*6,24+i*6],[0,1],{extrapolateRight:'clamp'});
      const sH=Math.round(scale*s.h); const sX=Math.round(svgW*s.x);
      return React.createElement('g',{key:'c'+i,opacity:spOp},
        React.createElement('rect',{x:sX-4,y:baseY-sH,width:8,height:sH,fill:D.cyan}),
        React.createElement('text',{x:sX,y:baseY-sH-8,textAnchor:'middle',fill:D.cyan,fontSize:11,fontFamily:'monospace'},s.label)
      );
    }),
    React.createElement('text',{x:Math.round(svgW*.56),y:baseY+20,fill:D.cyan,fontSize:11,fontFamily:'monospace',opacity:.7},'ANTHROPIC — wider gaps, bigger leaps')
  )
);