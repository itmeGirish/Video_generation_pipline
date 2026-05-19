const NARRATION_TEXT = "Two companies.";
const t = interpolate(frame,[0,Math.round(durationInFrames*.85)],[0,1],{extrapolateRight:'clamp'});
const ox=Math.round(width*.39); const oy=Math.round(height*.46);
const ex=Math.round(width*.5); const ey=Math.round(height*.22);
const x=Math.round(ox+(ex-ox)*t); const y=Math.round(oy+(ey-oy)*t-110*Math.sin(Math.PI*t));
const op=interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  ...Array.from({length:9},(_,i)=>{
    const tp=Math.max(0,t-i*.07); const tx=Math.round(ox+(ex-ox)*tp); const ty=Math.round(oy+(ey-oy)*tp-110*Math.sin(Math.PI*tp));
    return React.createElement('div',{key:i,style:{position:'absolute',left:tx-Math.round(3-i*.3),top:ty-Math.round(3-i*.3),width:Math.round(6-i*.5)||2,height:Math.round(6-i*.5)||2,borderRadius:'50%',backgroundColor:D.cyan,opacity:op*(1-i*.1)}});
  }),
  React.createElement('div',{style:{position:'absolute',left:x-7,top:y-7,width:14,height:14,borderRadius:'50%',backgroundColor:D.cyan,boxShadow:'0 0 22px '+D.cyan,opacity:op}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.24),top:Math.round(height*.58),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.01),opacity:op}},
    'APR 16  CLAUDE OPUS 4.7')
);