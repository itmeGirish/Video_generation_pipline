const NARRATION_TEXT = "Now imagine that same colleague has been told to reason carefully before every answer. They start exploring: what if this is a trick question? What if the numbers represent something else? What if there is context I am missing? <pause 0.3s> They come back and say: probably four, but it depends on the framing.";
const w=width,h=height;
const spArrow=spring({frame,fps,config:{damping:20,stiffness:200}});
const spPad=spring({frame:Math.max(0,frame-10),fps,config:{damping:200}});
const cardCX=Math.round(w*0.34)+Math.round(w*0.32/2);
const cardBottom=Math.round(h*0.20)+Math.round(h*0.22);
const padTop=cardBottom+Math.round(h*0.06);
const padH=Math.round(h*0.32),padW=Math.round(w*0.32);
const arrow=React.createElement('div',{style:{position:'absolute',left:cardCX-2,top:cardBottom,width:3,height:Math.round(h*0.06),backgroundColor:D.red,opacity:spArrow}});
const arrowHead=React.createElement('div',{style:{position:'absolute',left:cardCX-Math.round(w*0.010),top:cardBottom+Math.round(h*0.06)-6,color:D.red,fontSize:Math.round(w*0.018),opacity:spArrow}},'↓');
const pad=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.34),top:padTop,width:padW,height:padH,border:'2px solid '+D.red,borderRadius:6,backgroundColor:D.surface,overflow:'hidden',opacity:spPad}});
const thoughts=['what if base-3?','trick question?','missing context?','edge case...','ambiguous...','need more info?'];
const lines=thoughts.map((t,i)=>{
  const lOp=interpolate(frame,[10+i*8,28+i*8],[0,1],{extrapolateRight:'clamp'});
  return React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(w*0.34)+12,top:padTop+10+i*Math.round(padH/6.5),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),opacity:lOp}},t);
});
const highLabel=React.createElement('div',{style:{position:'absolute',left:cardCX+Math.round(w*0.18),top:cardBottom+Math.round(h*0.02),color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),opacity:spArrow}},'HIGH EFFORT');
return [arrow,arrowHead,pad,...lines,highLabel];