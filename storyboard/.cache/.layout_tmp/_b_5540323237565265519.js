const NARRATION_TEXT = "It opens your browser. Writes your code. Fills your spreadsheet.";
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const tools=['BROWSER','CODE','SHEETS','DESKTOP','DOCS','TERMINAL','CALC','CALENDAR'];
const warn=[false,false,false,false,true,false,false,false];
const headerOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const tileW=Math.round(width*.18);
const tileH=Math.round(height*.18);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.07),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0095),opacity:headerOp,letterSpacing:2}},'GPT-5.5 — 8 SIMULTANEOUS TASKS'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.14),display:'flex',gap:Math.round(width*.025),opacity:headerOp}},
    React.createElement('span',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.012),fontWeight:700}},'✓ 7 COMPLETE'),
    React.createElement('span',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.012),fontWeight:700}},'⚠ 1 ERROR FLAGGED')
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.24),display:'flex',flexWrap:'wrap',gap:Math.round(width*.012),width:Math.round(width*.84)}},
    ...tools.map((t,i)=>{
      const tOp=interpolate(frame,[i*4,i*4+12],[0,1],{extrapolateRight:'clamp'});
      return React.createElement('div',{key:i,style:{
        width:tileW,height:tileH,
        backgroundColor:D.surface,
        border:'1.5px solid '+(warn[i]?D.red:D.green),
        borderRadius:6,
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        gap:Math.round(height*.012),
        opacity:tOp
      }},
        React.createElement('div',{style:{color:warn[i]?D.red:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.022),fontWeight:700}},warn[i]?'⚠':'✓'),
        React.createElement('div',{style:{color:warn[i]?D.red:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),textAlign:'center'}},t)
      );
    })
  )
);