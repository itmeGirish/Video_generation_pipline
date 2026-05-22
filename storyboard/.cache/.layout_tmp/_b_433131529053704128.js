const NARRATION_TEXT = "Wrong answer is genuinely expensive \u2014 safety, liability, reputation damage that cannot be reversed. High or max. Automatically justified \u2014 the cost of a mistake exceeds the cost of the tokens. <pause 0.3s>";
const w=width,h=height;
const tw=Math.round(w*0.28),tt=Math.round(h*0.16),th=Math.round(h*0.62),gap=Math.round(w*0.02);
const bars=[
  {x:Math.round(w*0.04),c:D.green,frac:0.14,label:'1x'},
  {x:Math.round(w*0.04)+tw+gap,c:D.amber,frac:0.42,label:'3x'},
  {x:Math.round(w*0.04)+(tw+gap)*2,c:D.red,frac:0.98,label:'7-10x'}
];
const bottom=tt+th+Math.round(h*0.025);
const maxBarH=Math.round(h*0.14);
const els=bars.map(({x,c,frac,label},i)=>{
  const sp=spring({frame:Math.max(0,frame-i*8),fps,config:{damping:8}});
  const bh=Math.round(maxBarH*frac*sp);
  return React.createElement('div',{key:label,style:{position:'absolute',left:x+Math.round(tw*0.15),top:bottom,width:Math.round(tw*0.70),display:'flex',flexDirection:'column',alignItems:'center',gap:4}},
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),fontWeight:'700'}},(sp>0.5?label:'')),
    React.createElement('div',{style:{width:'100%',height:bh,backgroundColor:c,borderRadius:'4px 4px 0 0'}})
  );
});
const costLabel=React.createElement('div',{style:{position:'absolute',left:0,top:bottom+Math.round(h*0.16),width:w,textAlign:'center',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.009),opacity:interpolate(frame,[20,35],[0,1],{extrapolateRight:'clamp'})}},'RELATIVE COST');
return [...els,costLabel];