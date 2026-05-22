const NARRATION_TEXT = "If yes \u2014 medium. Is a wrong answer expensive? If yes \u2014 high. <pause 0.3s> Default everything else to low. Not medium.";
const w=width,h=height;
const rootW=Math.round(w*0.50),rootH=Math.round(h*0.16),rootX=Math.round((w-Math.round(w*0.50))/2),rootY=Math.round(h*0.10);
const bgRoot=React.createElement('div',{style:{position:'absolute',left:rootX,top:rootY,width:rootW,height:rootH,border:'3px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(h*0.010)}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.016),fontWeight:'900'}},'WHAT IS THIS TASK?'),
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010)}},'Three questions — ten seconds.')
);
const bgConnector=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.50)-1,top:rootY+rootH,width:2,height:Math.round(h*0.12),backgroundColor:D.text_dim}});
const branchTop=rootY+rootH+Math.round(h*0.12);
const bw=Math.round(w*0.26),bh=Math.round(h*0.26);
const branches=[
  {x:Math.round(w*0.03),c:D.green,q:'Answer obvious from input?',a:'YES → LOW EFFORT',delay:0},
  {x:Math.round(w*0.37),c:D.amber,q:'Multiple reasoning steps?',a:'YES → MEDIUM EFFORT',delay:10},
  {x:Math.round(w*0.71),c:D.red,q:'Wrong answer expensive?',a:'YES → HIGH / MAX',delay:20}
];
const els=branches.map(({x,c,q,a,delay})=>{
  const sp=spring({frame:Math.max(0,frame-delay),fps,config:{damping:20,stiffness:200}});
  return React.createElement('div',{key:a,style:{position:'absolute',left:x,top:branchTop,width:bw,height:bh,border:'2px solid '+c,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(h*0.016),padding:Math.round(h*0.02),boxSizing:'border-box',opacity:sp,transform:'scale('+sp+')'}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),textAlign:'center'}},q),
    React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',textAlign:'center'}},a)
  );
});
return [bgRoot,bgConnector,...els];