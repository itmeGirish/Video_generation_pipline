const NARRATION_TEXT = "You are just paying for its nervousness. Subscribe. Every week I break down one parameter like this \u2014 a single config setting quietly costing most teams real money. Next week: tool-use call frequency, the other dial almost nobody tunes. <pause 0.3s>";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const cw=Math.round(w*0.76),ch=Math.round(h*0.56);
const card=React.createElement('div',{style:{position:'absolute',left:Math.round((w-cw)/2),top:Math.round((h-ch)/2),width:cw,height:ch,backgroundColor:D.surface,border:'2px solid '+D.cyan,borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(h*0.030),opacity:sp,transform:'translateY('+Math.round((1-sp)*30)+'px)'}},
  React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.036),fontWeight:'900',letterSpacing:'0.15em'}},'SUBSCRIBE'),
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.015)}},'Breaking down one AI setting every week.'),
  React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),opacity:0.80}},'Next: tool-use call frequency.')
);
return [card];