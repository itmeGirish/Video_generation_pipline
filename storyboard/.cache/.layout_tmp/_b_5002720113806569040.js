const NARRATION_TEXT = "<pause 0.3s> Claude's pitch is: 'hand me the hard stuff, walk away, come back to verified work.' <pause 0.3s> Now watch GPT-5.5. <pause 0.2s> You don't give it a task. You give it your whole workflow.";
const sp=spring({frame,fps,config:{damping:12,stiffness:60}});
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const tools=['BROWSER','CODE','SHEETS','DESKTOP','DOCS','TERMINAL','CALC','CALENDAR'];
const cx=Math.round(width*.22); const cy=Math.round(height*.5);
const armLen=Math.round(Math.round(width*.15)*sp);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:cx-22,top:cy-22,width:44,height:44,borderRadius:'50%',backgroundColor:D.violet,opacity:op,boxShadow:'0 0 28px '+D.violet}}),
  ...Array.from({length:8},(_,i)=>{
    const angle=(i/8)*Math.PI*2-Math.PI/2;
    const ex=cx+Math.round(Math.cos(angle)*armLen); const ey=cy+Math.round(Math.sin(angle)*armLen);
    const dx=ex-cx; const dy=ey-cy; const len=Math.sqrt(dx*dx+dy*dy)||1;
    return React.createElement(React.Fragment,{key:i},
      React.createElement('div',{style:{position:'absolute',left:Math.min(cx,ex),top:Math.min(cy,ey),width:Math.abs(dx)||2,height:Math.abs(dy)||2,backgroundColor:D.violet,opacity:op*.55}}),
      React.createElement('div',{style:{position:'absolute',left:ex-Math.round(width*.03),top:ey-Math.round(height*.02),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:op*sp,whiteSpace:'nowrap'}},tools[i])
    );
  })
);