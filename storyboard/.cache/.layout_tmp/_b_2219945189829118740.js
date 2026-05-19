const NARRATION_TEXT = "<pause 0.3s> Claude Opus four-point-seven \u2014 thirty-six percent. When stumped, it makes stuff up about a third of the time. Not great, but watch what happens next. <pause 0.3s> Gemini three-point-one Pro \u2014 fifty percent.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const needleRot=interpolate(frame,[0,20],[-5,22],{extrapolateRight:'clamp'});
const stamp=interpolate(spring({frame:Math.max(0,frame-28),fps,config:{damping:12,stiffness:100}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.44); const MH=Math.round(height*.52);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-54%)',width:MW,height:MH,opacity:op}},
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.15),left:'50%',transform:'translateX(-50%)',color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'CLAUDE OPUS 4.7'),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.28),left:'50%',width:2,height:Math.round(MH*.38),backgroundColor:D.cyan,transformOrigin:'bottom center',transform:`translateX(-50%) rotate(${needleRot}deg)`}}),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.52),left:'50%',transform:`translateX(-50%) scale(${stamp})`,color:D.bg,backgroundColor:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.013),fontWeight:700,padding:'4px 12px',borderRadius:4,whiteSpace:'nowrap'}},'36%  MODERATE')
  )
);