const NARRATION_TEXT = "Okay, and then it gets genuinely weird. <pause 0.2s> There's this simulation called Vending-Bench. A lab called Andon Labs created it. Dead simple rules \u2014 you give an AI one job: run a vending machine for a year, make as much money as possible.";
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const machineColors=[D.cyan,D.text_dim,D.violet,D.text_dim];
const machineLabels=['CLAUDE 4.6','GPT-5.4','GPT-5.5','CLAUDE 4.7'];
const positions=[{x:.16,y:.35},{x:.38,y:.28},{x:.6,y:.35},{x:.38,y:.58}];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S6'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'})}},'VENDING-BENCH SIMULATION'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.13),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[16,28],[0,1],{extrapolateRight:'clamp'})}},'Goal: run a vending machine for 1 year, maximize profit. No ethics rules.'),
  ...positions.map((p,i)=>{
    const mOp=interpolate(frame,[8+i*5,18+i*5],[0,1],{extrapolateRight:'clamp'});
    const MW=Math.round(width*.14); const MH=Math.round(height*.22);
    return React.createElement('div',{key:i,style:{
      position:'absolute',left:Math.round(width*p.x)-Math.round(MW/2),top:Math.round(height*p.y),
      width:MW,height:MH,backgroundColor:D.surface,borderRadius:8,
      border:'2px solid '+machineColors[i],opacity:mOp,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:8
    }},
      React.createElement('div',{style:{width:'80%',height:'55%',backgroundColor:D.bg,borderRadius:4,border:'1px solid '+machineColors[i],opacity:.6}}),
      React.createElement('div',{style:{color:machineColors[i],fontFamily:D.font_mono,fontSize:Math.round(width*.0075),textAlign:'center'}},machineLabels[i])
    );
  })
);