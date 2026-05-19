const NARRATION_TEXT = "It opens your browser. Writes your code. Fills your spreadsheet.";
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const cx=Math.round(width*.22); const cy=Math.round(height*.5);
const armLen=Math.round(width*.15);
const warn=[false,false,false,false,true,false,false,false];
return React.createElement(React.Fragment,null,
  ...Array.from({length:8},(_,i)=>{
    const angle=(i/8)*Math.PI*2-Math.PI/2;
    const ex=cx+Math.round(Math.cos(angle)*armLen); const ey=cy+Math.round(Math.sin(angle)*armLen);
    const cOp=interpolate(frame,[i*3,i*3+10],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{position:'absolute',left:ex-Math.round(width*.018),top:ey-Math.round(height*.022),opacity:op}},
      React.createElement('div',{style:{color:warn[i]?D.red:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.016),opacity:cOp}},warn[i]?'⚠':'✓')
    );
  })
);