const NARRATION_TEXT = "Okay. I want to leave you with something bigger than benchmarks. A way of seeing this whole thing that I think most people are missing. <pause 0.4s> OpenAI isn't competing with Anthropic. <pause 0.5s> I know. Sounds wrong. But look at what each company is actually doing. <pause 0.3s> OpenAI shipped six models in eight months. Look at this on screen \u2014 the release cadence looks like a heartbeat getting faster. GPT-5, five-point-one, five-point-two, five-point-three, five-point-four, five-point-five. The model from last August?";
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const gptSpikes=[
  {x:.08,h:.18,label:'GPT-5'},{x:.18,h:.22,label:'5.1'},{x:.26,h:.26,label:'5.2'},
  {x:.32,h:.30,label:'5.3'},{x:.37,h:.34,label:'5.4'},{x:.41,h:.38,label:'5.5'}
];
const claudeSpikes=[{x:.15,h:.24,label:'4.5'},{x:.32,h:.30,label:'4.6'},{x:.5,h:.42,label:'4.7'}];
const W=Math.round(width*.75); const midY=Math.round(height*.45); const scale=Math.round(height*.38);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S9'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'})}},'RELEASE CADENCE'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12),right:Math.round(width*.12),top:midY,height:1,backgroundColor:D.text_dim,opacity:.2}}),
  ...gptSpikes.map((s,i)=>{
    const sOp=interpolate(frame,[8+i*5,18+i*5],[0,1],{extrapolateRight:'clamp'});
    const sH=Math.round(scale*s.h);
    const retired=i<2;
    return React.createElement('div',{key:'g'+i,style:{position:'absolute',left:Math.round(width*(.12+s.x*W/width)),top:midY-sH,width:Math.round(width*.008),height:sH,backgroundColor:retired?D.red:D.violet,opacity:sOp*0.85}},
      React.createElement('div',{style:{position:'absolute',top:-Math.round(height*.03),left:'50%',transform:'translateX(-50%)',color:retired?D.red:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.007),whiteSpace:'nowrap'}},s.label),
      retired?React.createElement('div',{style:{position:'absolute',top:-Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.006),whiteSpace:'nowrap'}}):'')
  }),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12),top:midY+Math.round(height*.02),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.008)}},'OPENAI — 6 models in 8 months   (first 2 RETIRED)'),
  ...claudeSpikes.map((s,i)=>{
    const sOp=interpolate(frame,[12+i*8,22+i*8],[0,1],{extrapolateRight:'clamp'});
    const sH=Math.round(scale*s.h);
    return React.createElement('div',{key:'c'+i,style:{position:'absolute',left:Math.round(width*(.12+s.x*W/width)),top:midY+Math.round(height*.12)-sH,width:Math.round(width*.008),height:sH,backgroundColor:D.cyan,opacity:sOp*.85}},
      React.createElement('div',{style:{position:'absolute',bottom:-Math.round(height*.03),left:'50%',transform:'translateX(-50%)',color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.007),whiteSpace:'nowrap'}},s.label)
    );
  }),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12),bottom:Math.round(height*.1),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.008)}},'ANTHROPIC — 3 models  ·  each one bigger leap')
);