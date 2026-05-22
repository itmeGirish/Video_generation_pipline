const NARRATION_TEXT = "<pause 0.3s> They come back and say: probably four, but it depends on the framing. That is not a smarter answer. That is an overthought answer. <pause 0.3s> Language models do the exact same thing. On simple tasks, extended thinking introduces uncertainty and hedging that was never there before. The scratchpad gives the model time and permission to doubt itself.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const cw=Math.round(w*0.32),ch=Math.round(h*0.22);
const cardCX=Math.round(w*0.34)+Math.round(w*0.32/2),cardY=Math.round(h*0.20)+Math.round(h*0.22/2);
const cardBottom=Math.round(h*0.20)+ch;
const padTop=cardBottom+Math.round(h*0.06),padH=Math.round(h*0.32),padW=Math.round(w*0.32);
// static: question card
const bgCard=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.34),top:Math.round(h*0.20),width:cw,height:ch,border:'3px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',alignItems:'center',justifyContent:'center'}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.030),fontWeight:'900'}},'2 + 2 = ?')
);
// static: high-effort scratchpad from B3
const bgPad=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.34),top:padTop,width:padW,height:padH,border:'2px solid '+D.red,borderRadius:6,backgroundColor:D.surface,overflow:'hidden'}});
const thoughts=['what if base-3?','trick question?','missing context?','edge case...','ambiguous...','need more info?'];
const bgLines=thoughts.map((t,i)=>React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(w*0.34)+12,top:padTop+10+i*Math.round(padH/6.5),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009)}},t));
// animated hedged answer badge
const badge=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.34)+padW+Math.round(w*0.03),top:padTop+Math.round(padH*0.25),display:'flex',flexDirection:'column',alignItems:'flex-start',gap:8,opacity:sp,transform:'translateX('+Math.round((1-sp)*30)+'px)'}},
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),fontWeight:'900',padding:'8px 16px',borderRadius:8,maxWidth:Math.round(w*0.24)}},'= probably 4,'),
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),fontWeight:'900',padding:'8px 16px',borderRadius:8}},'context-dependent'),
  React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.009)}},'3.2s — $0.018')
);
return [bgCard,bgPad,...bgLines,badge];