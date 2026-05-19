const NARRATION_TEXT = "An NVIDIA engineer said losing access to GPT-5.5 felt like having a limb amputated. <pause 0.5s> Fact two.";
const cursorOn = Math.floor(frame/15)%2===0;
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.585),top:Math.round(height*.50),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.018),opacity:.7}},cursorOn?'▋':'')
);