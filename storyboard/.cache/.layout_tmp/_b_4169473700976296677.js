const NARRATION_TEXT = "That is not a hypothetical. FutureSearch ran this benchmark in 2026 across every major reasoning model. <pause 0.3s> Higher effort on simple tasks produced lower accuracy \u2014 and cost three to ten times more. The setting responsible is called the thinking level. <pause 0.2s> Different APIs name it differently \u2014 effort, reasoning effort, thinking budget.";
const w=width,h=height;
const spG=spring({frame,fps,config:{damping:20,stiffness:200}});
const spR=spring({frame:Math.max(0,frame-18),fps,config:{damping:15,stiffness:80,mass:2}});
const cw=Math.round(w*0.44),ct=Math.round(h*0.17);
const stampY=Math.round(h*0.30);
const stampA=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.04)+Math.round(cw*0.12),top:stampY,border:'3px solid '+D.green,borderRadius:4,padding:'4px 12px',transform:'rotate(-8deg) scale('+spG+')',opacity:spG,transformOrigin:'center center'}},
  React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',letterSpacing:'0.1em'}},'CORRECT')
);
const stampB=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.52)+Math.round(cw*0.08),top:stampY,border:'3px solid '+D.red,borderRadius:4,padding:'4px 10px',transform:'rotate(-8deg) translateY('+Math.round((1-spR)*40)+'px)',opacity:spR,transformOrigin:'center center'}},
  React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),fontWeight:'900',letterSpacing:'0.06em'}},'SLIGHTLY WORSE')
);
const cite=React.createElement('div',{style:{position:'absolute',right:Math.round(w*0.03),bottom:Math.round(h*0.04),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),opacity:spR}},'FutureSearch 2026');
return [stampA,stampB,cite];