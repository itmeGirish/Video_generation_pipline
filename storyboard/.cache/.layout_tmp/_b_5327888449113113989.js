const NARRATION_TEXT = "<pause 0.2s> Anthropic drops Claude Opus four-point-seven on the sixteenth. And exactly one week later, OpenAI fires back with GPT-5.5 \u2014 codenamed, I'm not kidding, Spud.";
const flashOp=interpolate(frame,[0,7,14],[.85,.85,0],{extrapolateRight:'clamp'});
const ringR=interpolate(frame,[0,Math.round(durationInFrames*.65)],[0,Math.round(width*.3)],{extrapolateRight:'clamp'});
const ringOp=interpolate(frame,[0,16,Math.round(durationInFrames*.7)],[0,.75,0],{extrapolateRight:'clamp'});
const vsOp=interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'});
const cx=Math.round(width*.5); const cy=Math.round(height*.3);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',inset:0,backgroundColor:D.white,opacity:flashOp}}),
  ...Array.from({length:14},(_,i)=>{
    const angle=(i/14)*Math.PI*2; const spd=70+i*18;
    const pf=interpolate(frame,[0,Math.round(durationInFrames*.55)],[0,spd],{extrapolateRight:'clamp'});
    const pop=interpolate(frame,[0,10,Math.round(durationInFrames*.55)],[0,.85,0],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{position:'absolute',left:cx+Math.round(Math.cos(angle)*pf)-4,top:cy+Math.round(Math.sin(angle)*pf)-4,width:8,height:8,borderRadius:'50%',backgroundColor:i%2===0?D.cyan:D.violet,opacity:pop}});
  }),
  React.createElement('div',{style:{position:'absolute',left:cx-ringR,top:cy-ringR,width:ringR*2,height:ringR*2,borderRadius:'50%',border:'3px solid '+D.text,opacity:ringOp}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.2),transform:'translateX(-50%)',color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.1),fontWeight:900,opacity:vsOp,textShadow:'0 0 40px '+D.text}},'VS')
);