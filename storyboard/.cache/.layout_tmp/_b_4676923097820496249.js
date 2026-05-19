const NARRATION_TEXT = "<pause 0.5s> Fact two. On Artificial Analysis's hallucination benchmark, when GPT-5.5 doesn't know the answer, it makes one up eighty-six percent of the time.";
const shards = [[-155,-75,22],[270,-115,-18],[115,-88,19],[295,-68,-24],[-195,82,32],[255,98,-29],[-75,155,14],[175,138,-21],[-315,38,38],[310,48,-34]];
const numOp = interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const cycle = frame%60;
const pulseR = interpolate(cycle,[0,59],[0,Math.round(width*.13)],{extrapolateRight:'clamp'});
const pulseOp = interpolate(cycle,[0,20,59],[0,.5,0],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,6],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}},
  ...shards.map(([dx,dy,rot],i)=>{
    const lf=Math.max(0,frame-i*2);
    const sp=spring({frame:lf,fps,config:{damping:8+i,stiffness:48}});
    return React.createElement('div',{key:i,style:{position:'absolute',left:'50%',top:'50%',width:Math.round(width*.06+i*5),height:Math.round(height*.05+i*3),backgroundColor:D.surface,border:'1px solid '+D.text_dim,opacity:interpolate(lf,[0,4,55,72],[0,.7,.5,0],{extrapolateRight:'clamp'}),transform:`translate(calc(-50% + ${Math.round(dx*sp)}px),calc(-50% + ${Math.round(dy*sp)}px)) rotate(${rot*sp}deg)`}});
  }),
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:Math.round(height*.015)}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.19),fontWeight:900,opacity:numOp,lineHeight:1,textShadow:'0 0 60px '+D.red}},'86%'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:numOp*.8,letterSpacing:3}},'CONFABULATION RATE')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'45%',width:pulseR*2,height:pulseR*2,marginLeft:-pulseR,marginTop:-pulseR,borderRadius:'50%',border:'2px solid '+D.red,opacity:pulseOp}})
);