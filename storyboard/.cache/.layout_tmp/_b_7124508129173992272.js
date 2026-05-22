const NARRATION_TEXT = "If yes \u2014 medium. Is a wrong answer expensive? If yes \u2014 high. <pause 0.3s> Default everything else to low. Not medium.";
const w=width,h=height;
const rootY=Math.round(h*0.10)+Math.round(h*0.16);
const branchTop=rootY+Math.round(h*0.12);
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
return els;