const NARRATION_TEXT = "Introduced uncertainty where none existed. And here is the real problem. <pause 0.2s> Most production API traffic is simple tasks. Classification, formatting, translation, summarization. The tasks where high effort actively makes things worse.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const stamp=React.createElement('div',{style:{position:'absolute',left:0,top:0,width:w,height:h,display:'flex',alignItems:'center',justifyContent:'center',opacity:sp,transform:'scale('+sp+')'}},
  React.createElement('div',{style:{border:'5px solid '+D.red,borderRadius:8,padding:Math.round(h*0.040)+' '+Math.round(w*0.06),backgroundColor:D.bg+'ee',textAlign:'center',display:'flex',flexDirection:'column',gap:Math.round(h*0.02)}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.028),fontWeight:'900',letterSpacing:'0.12em'}},'WORSE RESULTS.'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.028),fontWeight:'900',letterSpacing:'0.12em'}},'HIGHER COST.')
  )
);
return [stamp];