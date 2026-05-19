const NARRATION_TEXT = "<pause 0.3s> Claude's pitch is: 'hand me the hard stuff, walk away, come back to verified work.' <pause 0.3s> Now watch GPT-5.5. <pause 0.2s> You don't give it a task. You give it your whole workflow.";
const sp=spring({frame,fps,config:{damping:12,stiffness:60}});
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const tools=['BROWSER','CODE','SHEETS','DESKTOP','DOCS','TERMINAL','CALC','CALENDAR'];
const headerOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:op}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:headerOp}},'GPT-5.5  —  OPERATING SYSTEM MODE'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.14),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:headerOp}},'You don\'t give it a task. You give it your whole workflow.'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.25),right:Math.round(width*.08),bottom:Math.round(height*.08),display:'flex',flexWrap:'wrap',gap:Math.round(width*.014),alignContent:'center',justifyContent:'center'}},
    ...tools.map((t,i)=>{
      const tSp=spring({frame:Math.max(0,frame-i*5),fps,config:{damping:14,stiffness:100}});
      return React.createElement('div',{key:i,style:{
        width:Math.round(width*.19),
        height:Math.round(height*.17),
        backgroundColor:D.surface,
        border:'1.5px solid '+D.violet,
        borderRadius:8,
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        gap:Math.round(height*.01),
        opacity:interpolate(frame,[i*5,i*5+12],[0,1],{extrapolateRight:'clamp'}),
        transform:`scale(${tSp})`
      }},
        React.createElement('div',{style:{width:Math.round(width*.018),height:Math.round(width*.018),borderRadius:'50%',backgroundColor:D.violet,boxShadow:'0 0 12px '+D.violet}}),
        React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700}},t)
      );
    })
  )
);