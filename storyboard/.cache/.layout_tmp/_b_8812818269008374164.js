const NARRATION_TEXT = "Ninety-five cents. Twenty seconds. Three thousand tokens of verbose output. Because Claude doesn't just answer \u2014 it explains, it documents, it narrates while it works. <pause 0.2s> The two-model pipeline is seventy-five percent cheaper and forty-five percent faster. And you get the hallucination catch for free. <pause 0.3s> This is the actual unlock of April twenty-twenty-six. The question isn't which model. It's which combination. Build the routing layer. That's the moat.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const useCases=[
  {label:'Legal question',route:'GPT + Claude',color:D.amber},
  {label:'Code review',route:'Claude only',color:D.cyan},
  {label:'Quick summary',route:'GPT only',color:D.violet},
  {label:'Travel booking',route:'GPT only',color:D.violet},
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,textAlign:'center',opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'})}},'THE MOAT ISN\'T THE MODEL.  IT\'S THE ROUTING LAYER.'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.22),transform:'translateX(-50%)',display:'flex',flexWrap:'wrap',gap:Math.round(width*.02),justifyContent:'center',width:Math.round(width*.75)}},
    ...useCases.map((u,i)=>React.createElement('div',{key:i,style:{backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.02)}px ${Math.round(width*.022)}px`,border:'1px solid '+u.color,display:'flex',flexDirection:'column',gap:Math.round(height*.01),opacity:interpolate(frame,[10+i*8,22+i*8],[0,1],{extrapolateRight:'clamp'}),minWidth:Math.round(width*.28)}},
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},u.label),
      React.createElement('div',{style:{color:u.color,fontFamily:D.font_display,fontSize:Math.round(width*.013),fontWeight:900}},'→  '+u.route)
    ))
  )
);