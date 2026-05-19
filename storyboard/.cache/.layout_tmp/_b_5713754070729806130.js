const NARRATION_TEXT = "Always push forward. Hesitation is the enemy when you're building an operating system. <pause 0.4s> Now think about what Anthropic is building. A consultant. An AI that developers trust to run unsupervised for hours. What happens if THAT AI invents a fact? <pause 0.3s> A bug ships to production. A wrong citation goes into a legal brief.";
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const briefLines=['Citation 1: SEC Rule 10b-5  ✓','Citation 2: Musk v. Twitter (2022)  ✓','Citation 3: Howey Test doctrine  ✓','Citation 4: ████████████████  ← FABRICATED','Citation 5: In re Paramount 2024  ✓','Citation 6: ████████████  ← FABRICATED'];
const fireOp=interpolate(frame,[40,55],[0,.6],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.15),transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2,opacity:op}},'THE LAWYER — GPT-5.5 QUERY'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.25),transform:'translateX(-50%)',width:Math.round(width*.55),backgroundColor:D.surface,borderRadius:8,padding:Math.round(width*.018),opacity:op,display:'flex',flexDirection:'column',gap:Math.round(height*.015)}},
    ...briefLines.map((l,i)=>React.createElement('div',{key:i,style:{color:l.includes('FABRICATED')?D.red:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[i*4,i*4+8],[0,1],{extrapolateRight:'clamp'})}},l))
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.1),transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:interpolate(frame,[30,42],[0,1],{extrapolateRight:'clamp'}),textAlign:'center',lineHeight:1.6}},'$0.06 API CALL   →   CAREER-LEVEL DAMAGE')
);