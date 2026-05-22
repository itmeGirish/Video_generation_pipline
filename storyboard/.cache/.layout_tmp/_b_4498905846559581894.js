const NARRATION_TEXT = "The tasks where high effort actively makes things worse. Every day. At scale. On accident. <pause 0.5s>";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:8}});
const why=React.createElement('div',{style:{position:'absolute',left:0,top:0,width:w,height:h,display:'flex',alignItems:'center',justifyContent:'center'}},
  React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.10),fontWeight:'900',opacity:sp,transform:'scale('+sp+')'}},'WHY?')
);
return [why];