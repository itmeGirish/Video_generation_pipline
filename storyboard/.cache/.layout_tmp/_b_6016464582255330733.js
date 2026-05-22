const NARRATION_TEXT = "The cost is justified. Now look at the same comparison for simple tasks. <pause 0.2s> FutureSearch ran simple classification and summarization tasks across every major reasoning model. At low effort, accuracy was forty-nine point six percent. At high effort: forty-eight point one percent.";
const w=width,h=height;
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
const lblStyle={fontFamily:D.font_mono,fontSize:Math.round(w*0.009),textAlign:'center',color:D.text_dim};
const barLabelY=pt+ph+Math.round(h*0.015);
const bgLabels=[
  React.createElement('div',{key:'cll',style:{position:'absolute',left:cLowX,top:barLabelY,width:barW,...lblStyle}},'LOW'),
  React.createElement('div',{key:'chl',style:{position:'absolute',left:cHighX,top:barLabelY,width:barW,...lblStyle}},'HIGH'),
  React.createElement('div',{key:'sll',style:{position:'absolute',left:sLowX,top:barLabelY,width:barW,...lblStyle}},'LOW'),
  React.createElement('div',{key:'shl',style:{position:'absolute',left:sHighX,top:barLabelY,width:barW,...lblStyle}},'HIGH')
];
// static complex bars from B2
const cLowH=Math.round(maxBarH*0.44),cHighH=Math.round(maxBarH*0.68);
const bgCLowBar=React.createElement('div',{style:{position:'absolute',left:cLowX,top:barBottom-cLowH,width:barW,height:cLowH,backgroundColor:D.green,borderRadius:'4px 4px 0 0'}});
const bgCLowVal=React.createElement('div',{style:{position:'absolute',left:cLowX,top:barBottom-cLowH-Math.round(h*0.04),width:barW,textAlign:'center',color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700'}},'44');
const bgCHighBar=React.createElement('div',{style:{position:'absolute',left:cHighX,top:barBottom-cHighH,width:barW,height:cHighH,backgroundColor:D.amber,borderRadius:'4px 4px 0 0'}});
const bgCHighVal=React.createElement('div',{style:{position:'absolute',left:cHighX,top:barBottom-cHighH-Math.round(h*0.04),width:barW,textAlign:'center',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700'}},'68');
const bgAnnot=React.createElement('div',{style:{position:'absolute',left:cHighX,top:barBottom-cHighH-Math.round(h*0.10),width:Math.round(pw*0.45),color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),fontWeight:'900',whiteSpace:'nowrap'}},'↑ +24 pts');
// animated simple task bars
const spL=spring({frame,fps,config:{damping:8}});
const spH=spring({frame:Math.max(0,frame-12),fps,config:{damping:8}});
const spA=spring({frame:Math.max(0,frame-22),fps,config:{damping:8}});
const lowH=Math.round(maxBarH*0.496),highH=Math.round(maxBarH*0.481);
const sLowBar=React.createElement('div',{style:{position:'absolute',left:sLowX,top:barBottom-Math.round(lowH*spL),width:barW,height:Math.round(lowH*spL),backgroundColor:D.green,borderRadius:'4px 4px 0 0'}});
const sLowVal=React.createElement('div',{style:{position:'absolute',left:sLowX,top:barBottom-Math.round(lowH*spL)-Math.round(h*0.04),width:barW,textAlign:'center',color:D.green,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',opacity:spL}},'49.6%');
const sHighBar=React.createElement('div',{style:{position:'absolute',left:sHighX,top:barBottom-Math.round(highH*spH),width:barW,height:Math.round(highH*spH),backgroundColor:D.red,borderRadius:'4px 4px 0 0'}});
const sHighVal=React.createElement('div',{style:{position:'absolute',left:sHighX,top:barBottom-Math.round(highH*spH)-Math.round(h*0.04),width:barW,textAlign:'center',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.010),fontWeight:'700',opacity:spH}},'48.1%');
const annot=React.createElement('div',{style:{position:'absolute',left:sHighX,top:barBottom-Math.round(highH*spH)-Math.round(h*0.10),width:Math.round(pw*0.45),color:D.red,fontFamily:D.font_mono,fontSize:Math.round(w*0.011),fontWeight:'900',opacity:spA,whiteSpace:'nowrap'}},'↓ −1.5 pts');
const src=React.createElement('div',{style:{position:'absolute',left:rx,top:pt+ph-Math.round(h*0.025),width:pw,textAlign:'center',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(w*0.008),opacity:spA}},'FutureSearch 2026');
return [leftBorder,leftHdr,rightBorder,rightHdr,...bgLabels,bgCLowBar,bgCLowVal,bgCHighBar,bgCHighVal,bgAnnot,sLowBar,sLowVal,sHighBar,sHighVal,annot,src];