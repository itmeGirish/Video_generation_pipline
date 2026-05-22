const NARRATION_TEXT = "The scratchpad gives the model time and permission to doubt itself. For complex tasks, that doubt is useful \u2014 it catches mistakes. For simple tasks, there are no mistakes to catch. <pause 0.2s> The model already knew the answer.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const cw=Math.round(w*0.32),ch=Math.round(h*0.22);
const cardCX=Math.round(w*0.34)+Math.round(w*0.32/2);
const cardBottom=Math.round(h*0.20)+ch;
const padTop=cardBottom+Math.round(h*0.06),padH=Math.round(h*0.32),padW=Math.round(w*0.32);
// static context: question card + scratchpad
const bgCard=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.34),top:Math.round(h*0.20),width:cw,height:ch,border:'3px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',alignItems:'center',justifyContent:'center'}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.030),fontWeight:'900'}},'2 + 2 = ?')
);
const bgPad=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.34),top:padTop,width:padW,height:padH,border:'2px solid '+D.red,borderRadius:6,backgroundColor:D.surface}});
// animated comparison card
const compCard=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.10),top:Math.round(h*0.70),width:Math.round(w*0.80),height:Math.round(h*0.22),backgroundColor:D.surface,border:'1px solid '+D.text_dim,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-around',padding:Math.round(h*0.025),opacity:sp,transform:'translateY('+Math.round((1-sp)*30)+'px)'}},
  React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:6}},
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'700'}},'DIRECT'),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.020),fontWeight:'900'}},'= 4 ✓')
  ),
  React.createElement('div',{style:{width:1,height:Math.round(h*0.12),backgroundColor:D.text_dim}}),
  React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:6}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'700'}},'EXTENDED'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.012)}},'= probably 4, depends')
  ),
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),textAlign:'center'}},'Same model. 9x the cost.')
);
return [bgCard,bgPad,compCard];