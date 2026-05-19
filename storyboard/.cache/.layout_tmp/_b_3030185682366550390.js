const NARRATION_TEXT = "<pause 0.3s> Now GPT-5.5. <pause 0.5s> Eighty-six percent. <pause 0.5s> To be precise \u2014 that's eighty-six percent of the time the model is stumped. Not eighty-six percent of all answers. Most of the time GPT-5.5 actually has the highest factual accuracy of any model tested. But when it doesn't know?";
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.44); const MH=Math.round(height*.52);
const shake=frame<40?Math.sin(frame*1.8)*Math.round(width*.004)*(1-frame/40):0;
const needleRot=interpolate(frame,[0,30],[-5,70],{extrapolateRight:'clamp'})+(frame<40?Math.sin(frame*2.5)*18:0);
const stamp=interpolate(spring({frame:Math.max(0,frame-38),fps,config:{damping:10,stiffness:90}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const spark=interpolate(frame,[35,45],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:`translate(calc(-50% + ${shake}px),-54%)`,width:MW,height:MH,opacity:op,border:'2px solid '+D.red,borderRadius:12,backgroundColor:D.surface}},
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.12),left:'50%',transform:'translateX(-50%)',color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'GPT-5.5'),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.26),left:'50%',width:3,height:Math.round(MH*.4),backgroundColor:D.violet,transformOrigin:'bottom center',transform:`translateX(-50%) rotate(${needleRot}deg)`,boxShadow:'0 0 8px '+D.violet}}),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.5),left:'50%',transform:`translateX(-50%) scale(${stamp})`,color:D.bg,backgroundColor:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.015),fontWeight:700,padding:'4px 14px',borderRadius:4,whiteSpace:'nowrap'}},'86%'),
    React.createElement('div',{style:{position:'absolute',bottom:Math.round(MH*.08),left:'50%',transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:stamp,textAlign:'center',whiteSpace:'nowrap'}},'WHEN STUMPED  —  INVENTS ANSWERS')
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.24),top:Math.round(height*.18),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:spark}},
    '★  HIGHEST FACTUAL ACCURACY'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.24),top:Math.round(height*.24),color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:spark}},
    '✗  HIGHEST FABRICATION RATE')
);