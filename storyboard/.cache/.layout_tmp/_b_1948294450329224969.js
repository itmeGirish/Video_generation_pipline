const NARRATION_TEXT = "Your formatting tasks are not critical. Match the thinking level to the complexity of the task \u2014 and save the heavy reasoning for the work that actually needs it. <pause 0.2s>";
const w=width,h=height;
const rootW=Math.round(w*0.50),rootH=Math.round(h*0.16),rootX=Math.round((w-Math.round(w*0.50))/2),rootY=Math.round(h*0.10);
const bgRoot=React.createElement('div',{style:{position:'absolute',left:rootX,top:rootY,width:rootW,height:rootH,border:'3px solid '+D.cyan,borderRadius:10,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(h*0.010)}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.016),fontWeight:'900'}},'WHAT IS THIS TASK?'),
  React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.010)}},'Three questions — ten seconds.')
);
const bgConnector=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.50)-1,top:rootY+rootH,width:2,height:Math.round(h*0.12),backgroundColor:D.text_dim}});
const branchTop=rootY+rootH+Math.round(h*0.12);
const bw=Math.round(w*0.26),bh=Math.round(h*0.26);
const bgBranches=[
  {x:Math.round(w*0.03),c:D.green,q:'Answer obvious from input?',a:'YES → LOW EFFORT'},
  {x:Math.round(w*0.37),c:D.amber,q:'Multiple reasoning steps?',a:'YES → MEDIUM EFFORT'},
  {x:Math.round(w*0.71),c:D.red,q:'Wrong answer expensive?',a:'YES → HIGH / MAX'}
].map(({x,c,q,a})=>React.createElement('div',{key:a,style:{position:'absolute',left:x,top:branchTop,width:bw,height:bh,border:'2px solid '+c,borderRadius:8,backgroundColor:D.surface,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(h*0.016),padding:Math.round(h*0.02),boxSizing:'border-box'}},
  React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),textAlign:'center'}},q),
  React.createElement('div',{style:{color:c,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',textAlign:'center'}},a)
));
const bannerH=Math.round(h*0.12);
const bgBanner=React.createElement('div',{style:{position:'absolute',left:0,bottom:0,width:w,height:bannerH,backgroundColor:D.cyan+'22',borderTop:'2px solid '+D.cyan,display:'flex',alignItems:'center',justifyContent:'center'}},
  React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.020),fontWeight:'900',letterSpacing:'0.12em'}},'DEFAULT TO LOW. NOT MEDIUM. LOW.')
);
const pulse=interpolate(frame,[0,15,30,45,60,75],[0.3,1.0,0.3,1.0,0.3,1.0],{extrapolateRight:'clamp'});
const xs=[Math.round(w*0.03),Math.round(w*0.37),Math.round(w*0.71)];
const cs=[D.green,D.amber,D.red];
const glows=xs.map((x,i)=>React.createElement('div',{key:i,style:{position:'absolute',left:x,top:branchTop,width:bw,height:bh,border:'3px solid '+cs[i],borderRadius:8,boxShadow:'0 0 25px '+cs[i]+'66',opacity:pulse,pointerEvents:'none'}}));
return [bgRoot,bgConnector,...bgBranches,bgBanner,...glows];