const NARRATION_TEXT = "Two flagship models. Seven days apart.";
const t = interpolate(frame,[0,Math.round(durationInFrames*.85)],[0,1],{extrapolateRight:'clamp'});
const ox=Math.round(width*.42); const oy=Math.round(height*.46);
const ex=Math.round(width*.5); const ey=Math.round(height*.22);
const x=Math.round(ox+(ex-ox)*t); const y=Math.round(oy+(ey-oy)*t-95*Math.sin(Math.PI*t));
const op=interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'});
const rot=frame*10;
return React.createElement(React.Fragment,null,
  ...Array.from({length:9},(_,i)=>{
    const tp=Math.max(0,t-i*.07); const tx=Math.round(ox+(ex-ox)*tp); const ty=Math.round(oy+(ey-oy)*tp-95*Math.sin(Math.PI*tp));
    return React.createElement('div',{key:i,style:{position:'absolute',left:tx-2,top:ty-2,width:4,height:4,borderRadius:'50%',backgroundColor:D.violet,opacity:op*(1-i*.1)}});
  }),
  React.createElement('div',{style:{position:'absolute',left:x-8,top:y-8,width:16,height:16,borderRadius:'40%',backgroundColor:D.violet,boxShadow:'0 0 22px '+D.violet,opacity:op,transform:`rotate(${rot}deg)`}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.44),top:Math.round(height*.64),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.01),opacity:op}},
    "APR 23  GPT-5.5 'SPUD'")
);