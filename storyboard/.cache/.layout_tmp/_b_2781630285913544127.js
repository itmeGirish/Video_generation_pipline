const NARRATION_TEXT = "<pause 0.3s> Gemini three-point-one Pro \u2014 fifty percent. It's a coin flip. <pause 0.3s> Now GPT-5.5.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const needleRot=interpolate(frame,[0,22],[-5,35],{extrapolateRight:'clamp'});
const stamp=interpolate(spring({frame:Math.max(0,frame-26),fps,config:{damping:12,stiffness:100}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.44); const MH=Math.round(height*.52);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-54%)',width:MW,height:MH,opacity:op}},
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.15),left:'50%',transform:'translateX(-50%)',color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'GEMINI 3.1 PRO'),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.28),left:'50%',width:2,height:Math.round(MH*.38),backgroundColor:D.text,transformOrigin:'bottom center',transform:`translateX(-50%) rotate(${needleRot}deg)`}}),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.52),left:'50%',transform:`translateX(-50%) scale(${stamp})`,color:D.bg,backgroundColor:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.013),fontWeight:700,padding:'4px 12px',borderRadius:4,whiteSpace:'nowrap'}},'50%  COIN FLIP')
  )
);