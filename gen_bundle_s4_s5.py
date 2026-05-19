#!/usr/bin/env python3
"""Generate bundle entries for Scenes 4-5 (24 bullets)."""
import json, pathlib

bundle = []

def b(scene, bullet, anchor, code):
    bundle.append({"scene": scene, "bullet": bullet, "anchor": anchor, "code": code.strip()})

# ══ SCENE 4 — The Benchmark Track (14 bullets) ═══════════════════
# REPLACE/ADDITIVE: B1=R B2=A B3=A B4=A B5=R B6=R B7=A B8=A B9=A B10=R B11=A B12=R B13=A B14=A

b(4, 1, "watch the magenta runner", r"""
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const trackOp=interpolate(frame,[8,22],[0,1],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S4'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.14),left:'50%',transform:'translateX(-50%)',color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,opacity:trackOp,letterSpacing:2}},'▶  WHEN AI NEEDS TO ACT'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,width:W,height:TH,border:'2px solid '+D.violet,borderRadius:6,opacity:trackOp,boxShadow:'0 0 18px '+D.violet}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,width:W,height:TH,border:'2px solid '+D.cyan,borderRadius:6,opacity:trackOp,boxShadow:'0 0 18px '+D.cyan}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:trackOp}},'GPT-5.5'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:trackOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1-Math.round(height*.04),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:trackOp}},'START'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.12),top:TY1-Math.round(height*.04),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:trackOp}},'FINISH')
);
""")

b(4, 2, "different league", r"""
const gpt=interpolate(frame,[0,35],[0,82.7],{extrapolateRight:'clamp'});
const cld=interpolate(frame,[0,35],[0,69.4],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const ctxOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const labelOp=interpolate(frame,[30,42],[0,1],{extrapolateRight:'clamp'});
const deltaOp=interpolate(spring({frame:Math.max(0,frame-38),fps,config:{damping:8,stiffness:80}}),[0,1],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3,opacity:ctxOp}},'ACTING ROUND  —  TERMINAL-BENCH 2.0'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'GPT-5.5'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+8,top:TY1+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:labelOp}},gpt.toFixed(1)+'%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+8,top:TY2+Math.round(TH*.15),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},cld.toFixed(1)+'%'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(TY1+TH*.1),backgroundColor:D.violet,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'4px 10px',borderRadius:4,opacity:deltaOp,transform:`scale(${deltaOp})`}},'+13.3 PTS')
);
""")

b(4, 3, "photo finish", r"""
const gpt=interpolate(frame,[0,32],[0,78.7],{extrapolateRight:'clamp'});
const cld=interpolate(frame,[0,32],[0,78.0],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const ctxOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const labelOp=interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'});
const chipOp=interpolate(frame,[38,50],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3,opacity:ctxOp}},'ACTING ROUND  —  OSWORLD'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'GPT-5.5'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+6,top:TY1+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'78.7%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+6,top:TY2+Math.round(TH*.15),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'78.0%'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(TY1+TH*.1),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),padding:'3px 8px',border:'1px solid '+D.text_dim,borderRadius:4,opacity:chipOp}},'+0.7  NEAR TIE')
);
""")

b(4, 4, "ahead by five", r"""
const gpt=interpolate(frame,[0,30],[0,84.9],{extrapolateRight:'clamp'});
const cld=interpolate(frame,[0,30],[0,80.3],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const ctxOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const labelOp=interpolate(frame,[26,38],[0,1],{extrapolateRight:'clamp'});
const deltaOp=interpolate(spring({frame:Math.max(0,frame-34),fps,config:{damping:10,stiffness:80}}),[0,1],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3,opacity:ctxOp}},'ACTING ROUND  —  GDPVAL  (44 PROFESSIONS)'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'GPT-5.5'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+6,top:TY1+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'84.9%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+6,top:TY2+Math.round(TH*.15),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'80.3%'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(TY1+TH*.1),backgroundColor:D.violet,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'4px 10px',borderRadius:4,opacity:deltaOp}},'+4.6 PTS')
);
""")

b(4, 5, "the cyan runner", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cardOp=interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame:Math.max(0,frame-10),fps,config:{damping:12,stiffness:75}}),[0,1],[50,0],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:`translate(-50%,-50%) translateY(${sl}px)`,opacity:cardOp,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,textAlign:'center'}},'GPT-5.5  LEADS THE ACTING ROUND'),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.03),marginTop:Math.round(height*.02)}},
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',padding:'6px 14px',border:'1px solid '+D.violet,borderRadius:4}},'Terminal-Bench  +13.3'),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',padding:'6px 14px',border:'1px solid '+D.text_dim,borderRadius:4}},'OSWorld  +0.7'),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',padding:'6px 14px',border:'1px solid '+D.violet,borderRadius:4}},'GDPVal  +4.6')
    ),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),marginTop:Math.round(height*.015)}},'→  NOW: WHEN AI NEEDS TO REASON')
  )
);
""")

b(4, 6, "fixing real bugs", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const trackOp=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.14),left:'50%',transform:'translateX(-50%)',color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,opacity:trackOp,letterSpacing:2}},'⬡  WHEN AI NEEDS TO REASON'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,width:W,height:TH,border:'2px solid '+D.cyan,borderRadius:6,opacity:trackOp,boxShadow:'0 0 18px '+D.cyan}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,width:W,height:TH,border:'2px solid '+D.violet,borderRadius:6,opacity:trackOp*.5}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:trackOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:trackOp*.5}},'GPT-5.5')
);
""")

b(4, 7, "Claude pulls ahead", r"""
const cld=interpolate(frame,[0,34],[0,64.3],{extrapolateRight:'clamp'});
const gpt=interpolate(frame,[0,34],[0,58.6],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const ctxOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const labelOp=interpolate(frame,[30,42],[0,1],{extrapolateRight:'clamp'});
const astOp=interpolate(frame,[40,52],[0,1],{extrapolateRight:'clamp'});
const noteOp=interpolate(frame,[52,64],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3,opacity:ctxOp}},'REASONING ROUND  —  SWE-BENCH PRO'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'GPT-5.5'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+6,top:TY1+Math.round(TH*.12),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:labelOp}},
    cld.toFixed(1)+'%',
    React.createElement('span',{style:{color:D.red,fontSize:Math.round(width*.014),marginLeft:2,opacity:astOp}},'*')
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+6,top:TY2+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'58.6%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),bottom:Math.round(height*.06),right:Math.round(width*.14),color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),fontStyle:'italic',opacity:noteOp}},'* OpenAI flagged Anthropic\'s score for possible training data overlap in their own benchmark table')
);
""")

b(4, 8, "tied at the ceiling", r"""
const cld=interpolate(frame,[0,32],[0,94.2],{extrapolateRight:'clamp'});
const gpt=interpolate(frame,[0,32],[0,93.6],{extrapolateRight:'clamp'});
const W=Math.round(width*.72); const TH=Math.round(height*.1); const TY1=Math.round(height*.32); const TY2=Math.round(height*.52);
const ctxOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const labelOp=interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'});
const ceilOp=interpolate(frame,[38,50],[0,1],{extrapolateRight:'clamp'});
const ceilX=Math.round(width*.14+W*0.9);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3,opacity:ctxOp}},'REASONING ROUND  —  GPQA DIAMOND  (PhD-LEVEL SCIENCE)'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1+Math.round(TH*.25),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'CLAUDE 4.7'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2+Math.round(TH*.25),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700,opacity:ctxOp}},'GPT-5.5'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY1,height:TH,width:Math.round(W*cld/100),backgroundColor:D.cyan,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14),top:TY2,height:TH,width:Math.round(W*gpt/100),backgroundColor:D.violet,borderRadius:6,opacity:.85}}),
  React.createElement('div',{style:{position:'absolute',left:ceilX,top:TY1-Math.round(height*.02),bottom:Math.round(height*.35),width:2,backgroundColor:D.white,opacity:ceilOp*0.6}}),
  React.createElement('div',{style:{position:'absolute',left:ceilX+6,top:TY1-Math.round(height*.04),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),opacity:ceilOp}},'SATURATION'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*cld/100)+6,top:TY1+Math.round(TH*.15),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'94.2%'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.14+W*gpt/100)+6,top:TY2+Math.round(TH*.15),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:labelOp}},'93.6%')
);
""")

b(4, 9, "show patterns", r"""
const op=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:75}}),[0,1],[40,0],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.12),transform:`translateX(-50%) translateY(${sl}px)`,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.016)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900}},'CLAUDE 4.7  LEADS THE REASONING ROUND'),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.03)}},
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),padding:'5px 12px',border:'1px solid '+D.cyan,borderRadius:4}},'SWE-bench  +5.7*'),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),padding:'5px 12px',border:'1px solid '+D.text_dim,borderRadius:4}},'GPQA  +0.6')
    )
  )
);
""")

b(4, 10, "DO things", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cardOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const gptW=interpolate(frame,[14,38],[0,4],{extrapolateRight:'clamp'});
const cldW=interpolate(frame,[22,46],[0,6],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.03),opacity:cardOp}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,marginBottom:Math.round(height*.01)}},'FINAL SCORE'),
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:Math.round(width*.05)}},
      React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.012)}},
        React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.055),fontWeight:900}},Math.round(gptW)),
        React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.01)}},'GPT-5.5')
      ),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.022)}},'vs'),
      React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.012)}},
        React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.055),fontWeight:900}},Math.round(cldW)),
        React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.01)}},'CLAUDE 4.7')
      )
    )
  )
);
""")

b(4, 11, "THINK carefully", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const trackOp=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const badgeOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const leftSl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[-60,0],{extrapolateRight:'clamp'});
const rightSl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[60,0],{extrapolateRight:'clamp'});
const centerOp=interpolate(frame,[18,30],[0,1],{extrapolateRight:'clamp'});
const W=Math.round(width*.62); const TH=Math.round(height*.1); const TY1=Math.round(height*.26); const TY2=Math.round(height*.46);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.07),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:trackOp,letterSpacing:3}},'BENCHMARK SUMMARY  —  WHO WINS EACH CATEGORY'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY1-Math.round(height*.042),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0078),opacity:trackOp}},'ACTING  (Terminal-Bench · OSWorld · GDPVal)'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18),top:TY1,height:TH,width:Math.round(W*.87),backgroundColor:D.violet,borderRadius:6,opacity:trackOp*.9}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18+W*.87)+8,top:TY1+Math.round(TH*.18),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:trackOp}},'GPT-5.5  ✓'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:TY2-Math.round(height*.042),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0078),opacity:trackOp}},'REASONING  (SWE-bench · GPQA Diamond)'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18),top:TY2,height:TH,width:Math.round(W*.73),backgroundColor:D.cyan,borderRadius:6,opacity:trackOp*.9}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18+W*.73)+8,top:TY2+Math.round(TH*.18),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:trackOp}},'CLAUDE 4.7  ✓'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),bottom:Math.round(height*.2),opacity:badgeOp,transform:`translateX(${leftSl}px)`}},
    React.createElement('div',{style:{backgroundColor:D.violet,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'6px 14px',borderRadius:20}},'ACT  →  GPT-5.5')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),bottom:Math.round(height*.2),opacity:badgeOp,transform:`translateX(${rightSl}px)`}},
    React.createElement('div',{style:{backgroundColor:D.cyan,color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,padding:'6px 14px',borderRadius:20}},'REASON  →  CLAUDE 4.7')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.08),transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:centerOp}},'DIFFERENT JOBS.  DIFFERENT WINNERS.')
);
""")

b(4, 12, "Theo Browne", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const headerOp=interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.18),left:'50%',transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,opacity:headerOp,textAlign:'center'}},
    'WHAT DEVELOPERS SAY')
);
""")

b(4, 13, "too expensive", r"""
const quotes=[
  {text:'"GPT-5.5 is smart, weird, hard to wrangle, and too expensive."',attr:'Theo Browne — developer',color:D.violet},
  {text:'"Issue detection jumped 58% → 79%, but ONLY with extremely specific prompts."',attr:'CodeRabbit — production tests',color:D.cyan},
];
return React.createElement(React.Fragment,null,
  ...quotes.map((q,i)=>{
    const delay=i*14;
    const sl=interpolate(spring({frame:Math.max(0,frame-delay),fps,config:{damping:14,stiffness:80}}),[0,1],[-Math.round(width*.08),0],{extrapolateRight:'clamp'});
    const op=interpolate(frame,[delay,delay+12],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{
      position:'absolute',left:Math.round(width*.1)+sl,top:Math.round(height*.3+i*height*.22),
      width:Math.round(width*.72),backgroundColor:D.surface,borderRadius:10,
      padding:Math.round(width*.02),borderLeft:'4px solid '+q.color,opacity:op
    }},
      React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.012),fontStyle:'italic',lineHeight:1.45}},q.text),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),marginTop:Math.round(height*.012)}},q.attr)
    );
  })
);
""")

b(4, 14, "senior engineer", r"""
const op=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const leftOp=interpolate(frame,[0,16],[0,1],{extrapolateRight:'clamp'});
const rightOp=interpolate(frame,[12,28],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',gap:Math.round(width*.08),opacity:op}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.018),opacity:leftOp}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900}},'GPT-5.5'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900}},'BRILLIANT INTERN'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},'"Hard to wrangle.  Unpredictable.  Fast."')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.018)}},'vs'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.018),opacity:rightOp}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900}},'CLAUDE 4.7'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900}},'SENIOR ENGINEER'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},'"Methodical.  Self-verified.  Reliable."')
  )
);
""")

# ══ SCENE 5 — Why The Smartest Model Lies The Most (10 bullets) ══
# REPLACE/ADDITIVE: B1=R B2=R B3=A B4=A B5=A B6=R B7=R B8=A B9=A B10=R

b(5, 1, "nobody else is explaining", r"""
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const textOp=interpolate(frame,[14,28],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S5'),
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.014),opacity:textOp,textAlign:'center',lineHeight:1.6}},
    'WHEN AI DOESN\'T KNOW THE ANSWER…')
);
""")

b(5, 2, "Watch the needle", r"""
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
""")

b(5, 3, "thirty-six percent", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const needleRot=interpolate(frame,[0,20],[-5,22],{extrapolateRight:'clamp'});
const stamp=interpolate(spring({frame:Math.max(0,frame-28),fps,config:{damping:12,stiffness:100}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.44); const MH=Math.round(height*.52);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-54%)',width:MW,height:MH,opacity:op}},
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.15),left:'50%',transform:'translateX(-50%)',color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'CLAUDE OPUS 4.7'),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.28),left:'50%',width:2,height:Math.round(MH*.38),backgroundColor:D.cyan,transformOrigin:'bottom center',transform:`translateX(-50%) rotate(${needleRot}deg)`}}),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.52),left:'50%',transform:`translateX(-50%) scale(${stamp})`,color:D.bg,backgroundColor:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.013),fontWeight:700,padding:'4px 12px',borderRadius:4,whiteSpace:'nowrap'}},'36%  MODERATE')
  )
);
""")

b(5, 4, "coin flip", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const needleRot=interpolate(frame,[0,22],[-5,35],{extrapolateRight:'clamp'});
const stamp=interpolate(spring({frame:Math.max(0,frame-26),fps,config:{damping:12,stiffness:100}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.44); const MH=Math.round(height*.52);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-54%)',width:MW,height:MH,opacity:op}},
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.15),left:'50%',transform:'translateX(-50%)',color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'GEMINI 3.1 PRO'),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.28),left:'50%',width:2,height:Math.round(MH*.38),backgroundColor:D.text,transformOrigin:'bottom center',transform:`translateX(-50%) rotate(${needleRot}deg)`}}),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.52),left:'50%',transform:`translateX(-50%) scale(${stamp})`,color:D.bg,backgroundColor:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.013),fontWeight:700,padding:'4px 12px',borderRadius:4,whiteSpace:'nowrap'}},'50%  COIN FLIP')
  )
);
""")

b(5, 5, "Now GPT", r"""
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.44); const MH=Math.round(height*.52);
const shake=frame<40?Math.sin(frame*1.8)*Math.round(width*.004)*(1-frame/40):0;
const needleRot=interpolate(frame,[0,30],[-5,70],{extrapolateRight:'clamp'})+(frame<40?Math.sin(frame*2.5)*18:0);
const stamp=interpolate(spring({frame:Math.max(0,frame-38),fps,config:{damping:10,stiffness:90}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const spark=interpolate(frame,[35,45],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:`translate(calc(-50% + ${shake}px),-54%)`,width:MW,height:MH,opacity:op,border:'2px solid '+D.red,borderRadius:12,backgroundColor:D.surface}},
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.12),left:'50%',transform:'translateX(-50%)',color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'GPT-5.5'),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.26),left:'50%',width:3,height:Math.round(MH*.4),backgroundColor:D.violet,transformOrigin:'bottom center',transform:`translateX(-50%) rotate(${needleRot}deg)`,boxShadow:'0 0 8px '+D.violet}}),
    React.createElement('div',{style:{position:'absolute',top:Math.round(MH*.5),left:'50%',transform:`translateX(-50%) scale(${stamp})`,color:D.bg,backgroundColor:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.015),fontWeight:700,padding:'4px 14px',borderRadius:4,whiteSpace:'nowrap'}},'86%'),
    React.createElement('div',{style:{position:'absolute',bottom:Math.round(MH*.08),left:'50%',transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:stamp,textAlign:'center',whiteSpace:'nowrap'}},'WHEN STUMPED  —  INVENTS ANSWERS')
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.24),top:Math.round(height*.18),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:spark}},
    '★  HIGHEST FACTUAL ACCURACY'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.24),top:Math.round(height*.24),color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:spark}},
    '✗  HIGHEST FABRICATION RATE')
);
""")

b(5, 6, "design choice", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const rOp=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const centerOp=interpolate(frame,[32,44],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.16),bottom:Math.round(height*.12),width:1,backgroundColor:D.text_dim,opacity:.3}}),
  React.createElement('div',{style:{position:'absolute',left:0,width:'50%',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),padding:Math.round(width*.025),opacity:lOp}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'OPENAI — SUPER APP'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,textAlign:'center',lineHeight:1.4}},'KEEP MOVING'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.6}},'10-step workflow cannot stall.\nHesitation = frustrated user.\nTrained: always have an answer.')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',width:'50%',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),padding:Math.round(width*.025),opacity:rOp}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'ANTHROPIC — CONSULTANT'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,textAlign:'center',lineHeight:1.4}},'STOP AND VERIFY'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.6}},'Wrong citation = career damage.\nFabrication = production bug.\nTrained: say "I\'m not sure."')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.09),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.014),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:centerOp}},'ONE DESIGNED TO STOP.  ONE DESIGNED TO KEEP GOING.')
);
""")

b(5, 7, "If you're a lawyer", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cabinetOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const lawyerOp=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const founderOp=interpolate(frame,[28,42],[0,1],{extrapolateRight:'clamp'});
const tagOp=interpolate(frame,[40,54],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:Math.round(width*.72),display:'flex',flexDirection:'column',gap:Math.round(height*.024),opacity:cabinetOp}},
    React.createElement('div',{style:{backgroundColor:D.surface,borderRadius:8,border:'2px solid '+D.red,padding:`${Math.round(height*.022)}px ${Math.round(width*.022)}px`,opacity:lawyerOp}},
      React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,letterSpacing:2,marginBottom:Math.round(height*.012)}},'THE LAWYER  —  GPT-5.5 query'),
      React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.01),lineHeight:1.6}},'12 citations returned.  2 are fabricated.  You don\'t know which.'),
      React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:Math.round(height*.01)}},'$0.06 API call  →  Career-level damage')
    ),
    React.createElement('div',{style:{backgroundColor:D.surface,borderRadius:8,border:'2px solid '+D.green,padding:`${Math.round(height*.022)}px ${Math.round(width*.022)}px`,opacity:founderOp}},
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,letterSpacing:2,marginBottom:Math.round(height*.012)}},'THE STARTUP FOUNDER  —  GPT-5.5 query'),
      React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.01),lineHeight:1.6}},'Wrong hotel recommendation.  Rebook in 30 seconds.  Nobody fired.'),
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:Math.round(height*.01)}},'$0.06 API call  →  30 seconds lost')
    ),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,textAlign:'center',opacity:tagOp}},'SAME MODEL  ·  SAME 86%  ·  DIFFERENT STAKES')
  )
);
""")

b(5, 8, "six-cent API call", r"""
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
""")

b(5, 9, "thirty seconds", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const checkOp=interpolate(spring({frame:Math.max(0,frame-20),fps,config:{damping:12,stiffness:90}}),[0,1],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(height*.14),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2,opacity:op}},'THE STARTUP FOUNDER — GPT-5.5 QUERY'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),top:Math.round(height*.24),width:Math.round(width*.44),backgroundColor:D.surface,borderRadius:8,padding:Math.round(width*.018),opacity:op,display:'flex',flexDirection:'column',gap:Math.round(height*.018)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'RECOMMENDED: Grand Hyatt Tokyo'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'← Wrong hotel (hallucinated)'),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:checkOp}},'✓  Re-booked: Park Hyatt Tokyo  (30s)'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:checkOp}})
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.1),bottom:Math.round(height*.1),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'}),textAlign:'right',lineHeight:1.6}},'$0.06 API CALL   →   30 SECONDS LOST')
);
""")

b(5, 10, "failure mode", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const tiles=[
  {x:0,y:0,label:'FAST + LOW STAKES',winner:'GPT-5.5',color:D.violet},
  {x:1,y:0,label:'FAST + HIGH STAKES',winner:'RECONSIDER',color:D.amber},
  {x:0,y:1,label:'CAREFUL + LOW STAKES',winner:'EITHER',color:D.text_dim},
  {x:1,y:1,label:'CAREFUL + HIGH STAKES',winner:'CLAUDE 4.7',color:D.cyan},
];
const TW=Math.round(width*.38); const TH2=Math.round(height*.3);
const baseX=Math.round(width*.1); const baseY=Math.round(height*.25);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,textAlign:'center'}},
    'CHOOSE THE FAILURE MODE YOU CAN SURVIVE'),
  ...tiles.map((t,i)=>{
    const tOp=interpolate(frame,[10+i*8,22+i*8],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{
      position:'absolute',
      left:baseX+t.x*(TW+Math.round(width*.04)),
      top:baseY+t.y*(TH2+Math.round(height*.04)),
      width:TW,height:TH2,
      backgroundColor:D.surface,borderRadius:10,
      border:'2px solid '+t.color,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      gap:Math.round(height*.015),opacity:tOp
    }},
      React.createElement('div',{style:{color:t.color,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},t.winner),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),textAlign:'center',padding:'0 10px'}},t.label)
    );
  })
);
""")

if __name__ == "__main__":
    out = "bundle_s4_s5.json"
    pathlib.Path(out).write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(bundle)} bullets → {out}")
