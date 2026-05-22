const NARRATION_TEXT = "At high effort: forty-eight point one percent. <pause 0.4s> One and a half points lower. At three to ten times the cost. The model overthought the easy ones. Second-guessed correct first-instincts. Introduced uncertainty where none existed.";
const w=width,h=height;
const sp=spring({frame,fps,config:{damping:15,stiffness:80,mass:2}});
const pw=Math.round(w*0.40),ph=Math.round(h*0.66),pt=Math.round(h*0.12);
const lx=Math.round(w*0.04),rx=Math.round(w*0.56);
const barW=Math.round(pw*0.32),maxBarH=Math.round(ph*0.52),barBottom=pt+ph-Math.round(h*0.08);
const cLowX=lx+Math.round(pw*0.08),cHighX=lx+Math.round(pw*0.54);
const sLowX=rx+Math.round(pw*0.08),sHighX=rx+Math.round(pw*0.54);
// static chart frames
const leftBorder=React.createElement('div',{style:{position:'absolute',left:lx,top:pt,width:pw,height:ph,border:'2px solid '+D.amber,borderRadius:10,backgroundColor:D.surface}});
const leftHdr=React.createElement('div',{style:{position:'absolute',left:lx,top:pt+Math.round(h*0.025),width:pw,textAlign:'center',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',letterSpacing:'0.12em'}},'COMPLEX TASKS');
const rightBorder=React.createElement('div',{style:{position:'absolute',left:rx,top:pt,width:pw,height:ph,border:'2px solid '+D.green,borderRadius:10,backgroundColor:D.surface}});
const rightHdr=React.createElement('div',{style:{position:'absolute',left:rx,top:pt+Math.round(h*0.025),width:pw,textAlign:'center',color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.013),fontWeight:'900',letterSpacing:'0.12em'}},'SIMPLE TASKS');
const cLowH=Math.round(maxBarH*0.44),cHighH=Math.round(maxBarH*0.68);
const sLowH=Math.round(maxBarH*0.496),sHighH=Math.round(maxBarH*0.481);
const bgBars=[
  React.createElement('div',{key:'cl',style:{position:'absolute',left:cLowX,top:barBottom-cLowH,width:barW,height:cLowH,backgroundColor:D.green,borderRadius:'4px 4px 0 0'}}),
  React.createElement('div',{key:'ch',style:{position:'absolute',left:cHighX,top:barBottom-cHighH,width:barW,height:cHighH,backgroundColor:D.amber,borderRadius:'4px 4px 0 0'}}),
  React.createElement('div',{key:'sl',style:{position:'absolute',left:sLowX,top:barBottom-sLowH,width:barW,height:sLowH,backgroundColor:D.green,borderRadius:'4px 4px 0 0'}}),
  React.createElement('div',{key:'sh',style:{position:'absolute',left:sHighX,top:barBottom-sHighH,width:barW,height:sHighH,backgroundColor:D.red,borderRadius:'4px 4px 0 0'}})
];
const cx=Math.round(w*0.50);
const badge=React.createElement('div',{style:{position:'absolute',left:cx-Math.round(w*0.09),top:Math.round(h*0.38),width:Math.round(w*0.18),display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(h*0.015),opacity:sp,transform:'translateY('+Math.round((1-sp)*40)+'px)'}},
  React.createElement('div',{style:{backgroundColor:D.red,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(w*0.012),fontWeight:'900',padding:'6px 14px',borderRadius:6,textAlign:'center',whiteSpace:'nowrap'}},'3-10x MORE COST'),
  React.createElement('div',{style:{color:D.red,fontSize:Math.round(w*0.022)}},'→'),
  React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',whiteSpace:'nowrap'}},'WORSE + COSTLY')
);
return [leftBorder,leftHdr,rightBorder,rightHdr,...bgBars,badge];