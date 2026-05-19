const NARRATION_TEXT = "Ten are real. Two are fabricated. You don't know which two. You submit the brief. The judge finds them. You're facing sanctions. Career-level damage from a six-cent API call. <pause 0.4s> But if you're a startup founder building a travel agent \u2014 wrong hotel recommendation? Rebook in thirty seconds. Nobody gets fired. <pause 0.3s> Same model. Same hallucination rate. Completely different consequences. <pause 0.4s> So here's the framework: don't ask 'which model hallucinates less.' Ask 'which failure mode can I survive?' <pause 0.3s> If a wrong answer costs you money, reputation, or your job \u2014 Claude. If a wrong answer costs you thirty seconds \u2014 GPT is faster and cheaper. <pause 0.3s> That's the decision nobody's framing correctly.";
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const tiles=[
  {x:0,y:0,label:'FAST + LOW STAKES',winner:'GPT-5.5',color:D.violet},
  {x:1,y:0,label:'FAST + HIGH STAKES',winner:'RECONSIDER',color:D.amber},
  {x:0,y:1,label:'CAREFUL + LOW STAKES',winner:'EITHER',color:D.text_dim},
  {x:1,y:1,label:'CAREFUL + HIGH STAKES',winner:'CLAUDE 4.7',color:D.cyan},
];
const TW=Math.round(width*.38); const TH2=Math.round(height*.3);
const baseX=Math.round(width*.1); const baseY=Math.round(height*.25);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,textAlign:'center'}},
    'CHOOSE THE FAILURE MODE YOU CAN SURVIVE'),
  ...tiles.map((t,i)=>{
    const tOp=interpolate(frame,[10+i*8,22+i*8],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{
      position:'absolute',
      left:baseX+t.x*(TW+Math.round(width*.04)),
      top:baseY+t.y*(TH2+Math.round(height*.04)),
      width:TW,height:TH2,
      backgroundColor:D.surface,borderRadius:10,
      border:'2px solid '+t.color,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      gap:Math.round(height*.015),opacity:tOp
    }},
      React.createElement('div',{style:{color:t.color,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},t.winner),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),textAlign:'center',padding:'0 10px'}},t.label)
    );
  })
);