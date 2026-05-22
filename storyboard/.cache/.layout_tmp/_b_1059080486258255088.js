const NARRATION_TEXT = "Ask Gemini to translate one line. Thinking budget engaged. Pattern-matching tasks the model could answer in its sleep \u2014 treated like a PhD dissertation by default. <pause 0.3s>";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const wrap=React.createElement('div',{style:{position:'absolute',left:0,top:0,width:w,height:h,display:'flex',alignItems:'center',justifyContent:'center',opacity:sp,transform:'scale('+sp+')'}},
  React.createElement('div',{style:{border:'5px solid '+D.red,borderRadius:8,padding:Math.round(h*0.035)+' '+Math.round(w*0.05),textAlign:'center',display:'flex',flexDirection:'column',gap:Math.round(h*0.02)}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.020),fontWeight:'900',letterSpacing:'0.12em'}},'EVERY TASK ='),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.020),fontWeight:'900',letterSpacing:'0.12em'}},'PHD DISSERTATION BY DEFAULT')
  )
);
return [wrap];