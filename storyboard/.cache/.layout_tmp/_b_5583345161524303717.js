const NARRATION_TEXT = "Unless you check the API response metadata for a field called thinking tokens, you have no idea it is happening. Invisible in your output. Visible in your invoice. <pause 0.4s>";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:20,stiffness:200}});
const cardH=Math.round(h*0.22),cardW=Math.round(w*0.88);
const card=React.createElement('div',{style:{position:'absolute',left:Math.round(w*0.06),bottom:Math.round(h*0.07),width:cardW,height:cardH,backgroundColor:D.surface,border:'2px solid '+D.red,borderRadius:10,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:Math.round(h*0.018),opacity:sp,transform:'translateY('+Math.round((1-sp)*50)+'px)'}},
  React.createElement('div',{style:{display:'flex',alignItems:'center',gap:Math.round(w*0.02),fontFamily:D.font_mono,fontSize:Math.round(w*0.013)}},
    React.createElement('span',{style:{color:D.text}},'500 output tokens'),
    React.createElement('span',{style:{color:D.text_dim}},'+'),
    React.createElement('span',{style:{color:D.amber}},'4,000 thinking tokens'),
    React.createElement('span',{style:{color:D.text_dim}},'='),
    React.createElement('span',{style:{color:D.red,fontWeight:'900'}},'10x COST')
  )
);
return [card];