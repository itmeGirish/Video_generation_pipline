const NARRATION_TEXT = "Not medium. Low. <pause 0.3s> Your classification tasks are not ambiguous. Your formatting tasks are not critical.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const bannerH=Math.round(h*0.12);
const banner=React.createElement('div',{style:{position:'absolute',left:0,bottom:0,width:w,height:bannerH,backgroundColor:D.cyan+'22',borderTop:'2px solid '+D.cyan,display:'flex',alignItems:'center',justifyContent:'center',opacity:sp,transform:'translateY('+Math.round((1-sp)*60)+'px)'}},
  React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(w*0.020),fontWeight:'900',letterSpacing:'0.12em'}},'DEFAULT TO LOW. NOT MEDIUM. LOW.')
);
return [banner];