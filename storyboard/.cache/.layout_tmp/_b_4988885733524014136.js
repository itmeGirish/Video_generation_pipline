const NARRATION_TEXT = "On Artificial Analysis's hallucination benchmark, when GPT-5.5 doesn't know the answer, it makes one up eighty-six percent of the time. The highest confabulation rate of any frontier model.";
const text = "INCORRECT WHEN UNSURE";
const shown = Math.round(interpolate(frame,[0,durationInFrames*.5],[0,text.length],{extrapolateRight:'clamp'}));
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.67),transform:'translateX(-50%)',display:'flex',gap:Math.round(width*.003)}},
    text.split('').map((ch,i)=>React.createElement('span',{key:i,style:{color:i<shown?D.amber:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.016),fontWeight:700,opacity:i<shown?1:0,textShadow:i<shown?'0 0 18px '+D.amber:'none'}},ch))
  )
);