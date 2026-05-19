const NARRATION_TEXT = "Does it admit it? Or does it confidently make something up? <pause 0.4s> Watch the needle. <pause 0.3s> Claude Opus four-point-seven \u2014 thirty-six percent.";
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const machineOp=interpolate(frame,[8,22],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.44); const MH=Math.round(height*.52);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-54%)',width:MW,height:MH,backgroundColor:D.surface,borderRadius:12,border:'2px solid '+D.amber,opacity:machineOp,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3}},'AA-OMNISCIENCE TEST'),
    React.createElement('div',{style:{width:Math.round(MW*.8),height:Math.round(MH*.35),backgroundColor:D.bg,borderRadius:8,border:'1px solid '+D.text_dim,display:'flex',alignItems:'flex-end',justifyContent:'center',overflow:'hidden',position:'relative'}},
      React.createElement('div',{style:{position:'absolute',bottom:0,left:'50%',width:2,height:'80%',backgroundColor:D.amber,transformOrigin:'bottom center',transform:'rotate(0deg)'}})
    ),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'NEEDLE AT REST  —  AWAITING SUBJECT')
  )
);