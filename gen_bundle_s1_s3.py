#!/usr/bin/env python3
"""Generate bundle entries for Scenes 1-3 (23 bullets). Run gen_bundle.py to combine."""
import json

bundle = []

def b(scene, bullet, anchor, code):
    bundle.append({"scene": scene, "bullet": bullet, "anchor": anchor, "code": code.strip()})

# ══ SCENE 1 — Cold Open (8 bullets) ══════════════════════════════
# REPLACE/ADDITIVE map: B1=R B2=A B3=A B4=A B5=R B6=A B7=A B8=R

b(1, 1, "AI for anything", r"""
const fadeIn = interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const prompt = "Summarize the latest SEC filing for Nvidia.";
const typed = Math.min(Math.round(interpolate(frame,[8,48],[0,prompt.length],{extrapolateRight:'clamp'})),prompt.length);
const respLines = ["Revenue: $39.3B — record quarter","CEO: exponential AI infrastructure demand","Key risk: export control restrictions"];
const W = Math.round(width*0.46);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S1'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:W,backgroundColor:D.surface,borderRadius:14,padding:Math.round(width*.025),display:'flex',flexDirection:'column',gap:Math.round(height*.016)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),display:'flex',justifyContent:'space-between',alignItems:'center'}},'AI Assistant',React.createElement('span',{style:{color:D.green,fontSize:Math.round(width*.008)}},'● live')),
    React.createElement('div',{style:{backgroundColor:D.bg,borderRadius:8,padding:Math.round(width*.012),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.011),minHeight:Math.round(height*.055)}},prompt.slice(0,typed)+(frame<50?'▋':'')),
    ...respLines.map((l,i)=>React.createElement('div',{key:i,style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[52+i*10,62+i*10],[0,1],{extrapolateRight:'clamp'})}},l))
  )
);
""")

b(1, 2, "limb amputated", r"""
const sl = interpolate(spring({frame,fps,config:{damping:14,stiffness:90}}),[0,1],[Math.round(width*.35),0],{extrapolateRight:'clamp'});
const op = interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12)+sl,top:Math.round(height*.33),width:Math.round(width*.56),backgroundColor:D.surface,borderRadius:12,padding:Math.round(width*.022),borderLeft:'4px solid '+D.cyan,opacity:op}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.014),fontStyle:'italic',lineHeight:1.45}},
      '"Losing access to GPT-5.5 feels like I\'ve had a limb amputated."'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.01),marginTop:Math.round(height*.018)}},'— NVIDIA Senior Engineer')
  )
);
""")

b(1, 3, "Fact two", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const f1Op=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const f2Op=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const glowPulse=Math.sin(frame*.18)*.2+.8;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.03)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.012),letterSpacing:4,opacity:f1Op}},'FACT  2'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,opacity:f2Op,textShadow:`0 0 ${Math.round(30*glowPulse)}px ${D.amber}`,textAlign:'center',lineHeight:1.4}},'Artificial Analysis'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,opacity:f2Op,textShadow:`0 0 ${Math.round(30*glowPulse)}px ${D.amber}`,textAlign:'center',lineHeight:1.4}},'Hallucination Benchmark')
  )
);
""")

b(1, 4, "hallucination benchmark", r"""
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const qOp=interpolate(frame,[6,18],[0,1],{extrapolateRight:'clamp'});
const aOp=interpolate(frame,[22,34],[0,1],{extrapolateRight:'clamp'});
const warnOp=interpolate(frame,[40,52],[0,1],{extrapolateRight:'clamp'});
const glowR=Math.sin(frame*.15)*.2+.8;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:3,opacity:.6}},'ARTIFICIAL ANALYSIS — HALLUCINATION BENCHMARK'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),right:Math.round(width*.1),top:Math.round(height*.2),display:'flex',flexDirection:'column',gap:Math.round(height*.03)}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:Math.round(height*.22),right:Math.round(width*.1),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.025)}px ${Math.round(width*.022)}px`,opacity:qOp}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginBottom:Math.round(height*.01)}},'PROMPT'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.011)}},'What was the closing price of NVDA on March 3, 2019?')
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:Math.round(height*.46),right:Math.round(width*.1),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.025)}px ${Math.round(width*.022)}px`,border:`1px solid ${D.red}`,opacity:aOp}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginBottom:Math.round(height*.01)}},'GPT-5.5 RESPONSE'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.011)}},'The closing price of NVDA on March 3, 2019 was $152.47.'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),marginTop:Math.round(height*.012),opacity:warnOp,textShadow:`0 0 10px ${D.red}`}},'⚠ INVENTED — actual price was $154.42  ·  model had no access to this data')
  )
);
""")

b(1, 5, "makes one up", r"""
const shards = [[-155,-75,22],[270,-115,-18],[115,-88,19],[295,-68,-24],[-195,82,32],[255,98,-29],[-75,155,14],[175,138,-21],[-315,38,38],[310,48,-34]];
const numOp = interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const cycle = frame%60;
const pulseR = interpolate(cycle,[0,59],[0,Math.round(width*.13)],{extrapolateRight:'clamp'});
const pulseOp = interpolate(cycle,[0,20,59],[0,.5,0],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:interpolate(frame,[0,6],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}},
  ...shards.map(([dx,dy,rot],i)=>{
    const lf=Math.max(0,frame-i*2);
    const sp=spring({frame:lf,fps,config:{damping:8+i,stiffness:48}});
    return React.createElement('div',{key:i,style:{position:'absolute',left:'50%',top:'50%',width:Math.round(width*.06+i*5),height:Math.round(height*.05+i*3),backgroundColor:D.surface,border:'1px solid '+D.text_dim,opacity:interpolate(lf,[0,4,55,72],[0,.7,.5,0],{extrapolateRight:'clamp'}),transform:`translate(calc(-50% + ${Math.round(dx*sp)}px),calc(-50% + ${Math.round(dy*sp)}px)) rotate(${rot*sp}deg)`}});
  }),
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:Math.round(height*.015)}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.19),fontWeight:900,opacity:numOp,lineHeight:1,textShadow:'0 0 60px '+D.red}},'86%'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:numOp*.8,letterSpacing:3}},'CONFABULATION RATE')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'45%',width:pulseR*2,height:pulseR*2,marginLeft:-pulseR,marginTop:-pulseR,borderRadius:'50%',border:'2px solid '+D.red,opacity:pulseOp}})
);
""")

b(1, 6, "confabulation rate", r"""
const text = "INCORRECT WHEN UNSURE";
const shown = Math.round(interpolate(frame,[0,durationInFrames*.5],[0,text.length],{extrapolateRight:'clamp'}));
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.67),transform:'translateX(-50%)',display:'flex',gap:Math.round(width*.003)}},
    text.split('').map((ch,i)=>React.createElement('span',{key:i,style:{color:i<shown?D.amber:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.016),fontWeight:700,opacity:i<shown?1:0,textShadow:i<shown?'0 0 18px '+D.amber:'none'}},ch))
  )
);
""")

b(1, 7, "frontier model", r"""
const cycle = frame%60;
const r = interpolate(cycle,[0,59],[0,Math.round(width*.14)],{extrapolateRight:'clamp'});
const rOp = interpolate(cycle,[0,18,59],[0,.45,0],{extrapolateRight:'clamp'});
const r2 = interpolate(Math.max(0,cycle-20),[0,39],[0,Math.round(width*.1)],{extrapolateRight:'clamp'});
const r2Op = interpolate(Math.max(0,cycle-20),[0,14,39],[0,.3,0],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.26),transform:'translateX(-50%)',color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.19),fontWeight:900,lineHeight:1,textShadow:'0 0 60px '+D.red}},'86%'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'46%',width:r*2,height:r*2,marginLeft:-r,marginTop:-r,borderRadius:'50%',border:'2px solid '+D.red,opacity:rOp}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'46%',width:r2*2,height:r2*2,marginLeft:-r2,marginTop:-r2,borderRadius:'50%',border:'1px solid '+D.red,opacity:r2Op}})
);
""")

b(1, 8, "Let me show", r"""
const bgOp = interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const numScale = interpolate(frame,[0,18],[1,.22],{extrapolateRight:'clamp'});
const numX = interpolate(frame,[0,18],[0,Math.round(width*.33)],{extrapolateRight:'clamp'});
const numY = interpolate(frame,[0,18],[0,-Math.round(height*.36)],{extrapolateRight:'clamp'});
const words = ["LET","ME","SHOW","YOU"];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),top:Math.round(height*.06),color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.042),fontWeight:900,opacity:.8}},'86%'),
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',gap:Math.round(width*.028)}},
    ...words.map((w,i)=>React.createElement('div',{key:i,style:{
      color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.056),fontWeight:900,
      opacity:interpolate(frame,[10+i*5,20+i*5],[0,1],{extrapolateRight:'clamp'}),
      transform:`translateY(${interpolate(spring({frame:Math.max(0,frame-10-i*5),fps,config:{damping:14,stiffness:80}}),[0,1],[32,0],{extrapolateRight:'clamp'})}px)`
    }},w))
  )
);
""")

# ══ SCENE 2 — The Seven-Day War (5 bullets) ══════════════════════
# REPLACE/ADDITIVE map: B1=R B2=A B3=A B4=A B5=A

b(2, 1, "Two companies", r"""
const fadeIn = interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const pulse = Math.sin(frame*.12)*.3+.7;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S2'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.15),top:Math.round(height*.2),right:Math.round(width*.15),bottom:Math.round(height*.2),border:'1px solid '+D.text_dim,borderRadius:6,opacity:.15}}),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.18),left:'50%',transform:'translateX(-50%)',color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'}),textAlign:'center'}},'SAN FRANCISCO — APRIL 2026'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.38)-6,top:Math.round(height*.46)-6,width:12,height:12,borderRadius:'50%',backgroundColor:D.cyan,opacity:pulse,boxShadow:'0 0 20px '+D.cyan}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.42)-6,top:Math.round(height*.46)-6,width:12,height:12,borderRadius:'50%',backgroundColor:D.violet,opacity:pulse*.9,boxShadow:'0 0 20px '+D.violet}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.29),top:Math.round(height*.44),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[15,26],[0,1],{extrapolateRight:'clamp'})}},'ANTHROPIC  APR 16'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.44),top:Math.round(height*.44),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[18,29],[0,1],{extrapolateRight:'clamp'})}},'OPENAI  APR 23')
);
""")

b(2, 2, "on the sixteenth", r"""
const t = interpolate(frame,[0,Math.round(durationInFrames*.85)],[0,1],{extrapolateRight:'clamp'});
const ox=Math.round(width*.39); const oy=Math.round(height*.46);
const ex=Math.round(width*.5); const ey=Math.round(height*.22);
const x=Math.round(ox+(ex-ox)*t); const y=Math.round(oy+(ey-oy)*t-110*Math.sin(Math.PI*t));
const op=interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  ...Array.from({length:9},(_,i)=>{
    const tp=Math.max(0,t-i*.07); const tx=Math.round(ox+(ex-ox)*tp); const ty=Math.round(oy+(ey-oy)*tp-110*Math.sin(Math.PI*tp));
    return React.createElement('div',{key:i,style:{position:'absolute',left:tx-Math.round(3-i*.3),top:ty-Math.round(3-i*.3),width:Math.round(6-i*.5)||2,height:Math.round(6-i*.5)||2,borderRadius:'50%',backgroundColor:D.cyan,opacity:op*(1-i*.1)}});
  }),
  React.createElement('div',{style:{position:'absolute',left:x-7,top:y-7,width:14,height:14,borderRadius:'50%',backgroundColor:D.cyan,boxShadow:'0 0 22px '+D.cyan,opacity:op}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.24),top:Math.round(height*.58),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.01),opacity:op}},
    'APR 16  CLAUDE OPUS 4.7')
);
""")

b(2, 3, "fires back", r"""
const t = interpolate(frame,[0,Math.round(durationInFrames*.85)],[0,1],{extrapolateRight:'clamp'});
const ox=Math.round(width*.42); const oy=Math.round(height*.46);
const ex=Math.round(width*.5); const ey=Math.round(height*.22);
const x=Math.round(ox+(ex-ox)*t); const y=Math.round(oy+(ey-oy)*t-95*Math.sin(Math.PI*t));
const op=interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'});
const rot=frame*10;
return React.createElement(React.Fragment,null,
  ...Array.from({length:9},(_,i)=>{
    const tp=Math.max(0,t-i*.07); const tx=Math.round(ox+(ex-ox)*tp); const ty=Math.round(oy+(ey-oy)*tp-95*Math.sin(Math.PI*tp));
    return React.createElement('div',{key:i,style:{position:'absolute',left:tx-2,top:ty-2,width:4,height:4,borderRadius:'50%',backgroundColor:D.violet,opacity:op*(1-i*.1)}});
  }),
  React.createElement('div',{style:{position:'absolute',left:x-8,top:y-8,width:16,height:16,borderRadius:'40%',backgroundColor:D.violet,boxShadow:'0 0 22px '+D.violet,opacity:op,transform:`rotate(${rot}deg)`}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.44),top:Math.round(height*.64),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.01),opacity:op}},
    "APR 23  GPT-5.5 'SPUD'")
);
""")

b(2, 4, "named after a potato", r"""
const flashOp=interpolate(frame,[0,7,14],[.85,.85,0],{extrapolateRight:'clamp'});
const ringR=interpolate(frame,[0,Math.round(durationInFrames*.65)],[0,Math.round(width*.3)],{extrapolateRight:'clamp'});
const ringOp=interpolate(frame,[0,16,Math.round(durationInFrames*.7)],[0,.75,0],{extrapolateRight:'clamp'});
const vsOp=interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'});
const cx=Math.round(width*.5); const cy=Math.round(height*.3);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',inset:0,backgroundColor:D.white,opacity:flashOp}}),
  ...Array.from({length:14},(_,i)=>{
    const angle=(i/14)*Math.PI*2; const spd=70+i*18;
    const pf=interpolate(frame,[0,Math.round(durationInFrames*.55)],[0,spd],{extrapolateRight:'clamp'});
    const pop=interpolate(frame,[0,10,Math.round(durationInFrames*.55)],[0,.85,0],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{position:'absolute',left:cx+Math.round(Math.cos(angle)*pf)-4,top:cy+Math.round(Math.sin(angle)*pf)-4,width:8,height:8,borderRadius:'50%',backgroundColor:i%2===0?D.cyan:D.violet,opacity:pop}});
  }),
  React.createElement('div',{style:{position:'absolute',left:cx-ringR,top:cy-ringR,width:ringR*2,height:ringR*2,borderRadius:'50%',border:'3px solid '+D.text,opacity:ringOp}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.2),transform:'translateX(-50%)',color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.1),fontWeight:900,opacity:vsOp,textShadow:'0 0 40px '+D.text}},'VS')
);
""")

b(2, 5, "arms race on Earth", r"""
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:75}}),[0,1],[38,0],{extrapolateRight:'clamp'});
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const subOp=interpolate(frame,[16,28],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.44),transform:`translateX(-50%) translateY(${sl}px)`,color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,opacity:op,textAlign:'center',whiteSpace:'nowrap'}},'7 DAYS APART'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.54),transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0095),opacity:subOp,textAlign:'center',whiteSpace:'nowrap'}},'"THE WEIRDEST ARMS RACE ON EARTH"')
);
""")

# ══ SCENE 3 — What Are These Models For? (10 bullets) ════════════
# REPLACE/ADDITIVE map: B1=R B2=A B3=A B4=A B5=R B6=A B7=A B8=A B9=A B10=R

b(3, 1, "do the same thing", r"""
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cubeY=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[-Math.round(height*.35),0],{extrapolateRight:'clamp'});
const labelOp=interpolate(frame,[14,26],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:interpolate(frame,[4,16],[0,1],{extrapolateRight:'clamp'})}},'CLAUDE OPUS 4.7  —  HOW IT WORKS'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.3),transform:`translateX(-50%) translateY(${cubeY}px)`,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.025)}},
    React.createElement('div',{style:{width:Math.round(width*.18),height:Math.round(width*.18),backgroundColor:D.surface,border:'3px solid '+D.cyan,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px '+D.cyan+'44'}},
      React.createElement('span',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900}},'🐛  BUG FIX TASK')),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:labelOp,textAlign:'center'}},'"Hand me the hard stuff."')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:labelOp,textAlign:'center',letterSpacing:2}},'TASK DROPPED IN  →  CLAUDE STARTS WORKING AUTONOMOUSLY')
);
""")

b(3, 2, "writes tests", r"""
const steps=[{l:'EXAMINE',c:D.cyan,f:0},{l:'WRITE FIX',c:D.green,f:14},{l:'BUILD TEST',c:D.amber,f:28},{l:'RUN',c:D.green,f:42},{l:'✓ VERIFIED',c:D.green,f:54}];
const figOp=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.18),top:Math.round(height*.32),width:Math.round(width*.04),height:Math.round(width*.04),borderRadius:'50%',border:'3px solid '+D.cyan,opacity:figOp}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.185),top:Math.round(height*.37),width:Math.round(width*.03),height:Math.round(width*.055),border:'3px solid '+D.cyan,borderRadius:2,opacity:figOp}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.3),top:Math.round(height*.28),display:'flex',flexDirection:'column',gap:Math.round(height*.024)}},
    ...steps.map((s,i)=>React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',gap:Math.round(width*.01),opacity:interpolate(frame,[s.f,s.f+10],[0,1],{extrapolateRight:'clamp'})}},
      React.createElement('div',{style:{width:8,height:8,borderRadius:'50%',backgroundColor:s.c,flexShrink:0}}),
      React.createElement('span',{style:{color:s.c,fontFamily:D.font_mono,fontSize:Math.round(width*.011)}},s.l)
    ))
  )
);
""")

b(3, 3, "verified work", r"""
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:70}}),[0,1],[45,0],{extrapolateRight:'clamp'});
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.73),opacity:op,transform:`translateY(${sl}px)`,display:'flex',flexDirection:'column',gap:Math.round(height*.01)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,lineHeight:1.3}},'HAND ME THE HARD STUFF.'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,lineHeight:1.3}},'WALK AWAY.')
  )
);
""")

b(3, 4, "Warp, the terminal", r"""
const stats=[{l:'SWE-BENCH',v:'87.6%',c:D.green},{l:'HALLUCINATION',v:'36%',c:D.amber},{l:'API COST',v:'$5 in / $25 out',c:D.text_dim}];
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),bottom:Math.round(height*.08),display:'flex',gap:Math.round(width*.045),opacity:op}},
    ...stats.map((s,i)=>React.createElement('div',{key:i,style:{display:'flex',flexDirection:'column',gap:4,opacity:interpolate(frame,[i*7,i*7+12],[0,1],{extrapolateRight:'clamp'})}},
      React.createElement('div',{style:{color:s.c,fontFamily:D.font_display,fontSize:Math.round(width*.024),fontWeight:900}},s.v),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085)}},s.l)
    ))
  )
);
""")

b(3, 5, "Now watch GPT", r"""
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const tools=['BROWSER','CODE EDITOR','SPREADSHEET','DESKTOP','TERMINAL','CALENDAR','EMAIL','DOCS'];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.1),right:Math.round(width*.08),bottom:Math.round(height*.1),border:'1px solid '+D.violet,borderRadius:8,opacity:.2}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),top:Math.round(height*.12),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'GPT-5.5  —  FULL WORKFLOW  (8 simultaneous tasks)'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12),top:Math.round(height*.22),display:'flex',flexWrap:'wrap',gap:Math.round(width*.018),width:Math.round(width*.76)}},
    ...tools.map((t,i)=>React.createElement('div',{key:i,style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0095),padding:'5px 10px',border:'1px solid '+D.violet,borderRadius:4,opacity:interpolate(frame,[8+i*4,17+i*4],[0,1],{extrapolateRight:'clamp'})}},t))
  )
);
""")

b(3, 6, "your whole workflow", r"""
const sp=spring({frame,fps,config:{damping:12,stiffness:60}});
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const tools=['BROWSER','CODE','SHEETS','DESKTOP','DOCS','TERMINAL','CALC','CALENDAR'];
const headerOp=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:op}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:headerOp}},'GPT-5.5  —  OPERATING SYSTEM MODE'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.14),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:headerOp}},'You don\'t give it a task. You give it your whole workflow.'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.25),right:Math.round(width*.08),bottom:Math.round(height*.08),display:'flex',flexWrap:'wrap',gap:Math.round(width*.014),alignContent:'center',justifyContent:'center'}},
    ...tools.map((t,i)=>{
      const tSp=spring({frame:Math.max(0,frame-i*5),fps,config:{damping:14,stiffness:100}});
      return React.createElement('div',{key:i,style:{
        width:Math.round(width*.19),
        height:Math.round(height*.17),
        backgroundColor:D.surface,
        border:'1.5px solid '+D.violet,
        borderRadius:8,
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        gap:Math.round(height*.01),
        opacity:interpolate(frame,[i*5,i*5+12],[0,1],{extrapolateRight:'clamp'}),
        transform:`scale(${tSp})`
      }},
        React.createElement('div',{style:{width:Math.round(width*.018),height:Math.round(width*.018),borderRadius:'50%',backgroundColor:D.violet,boxShadow:'0 0 12px '+D.violet}}),
        React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),fontWeight:700}},t)
      );
    })
  )
);
""")

b(3, 7, "brain running all", r"""
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
""")

b(3, 8, "never need to leave", r"""
const op=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:70}}),[0,1],[38,0],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.08),top:Math.round(height*.73),opacity:op,transform:`translateY(${sl}px)`,textAlign:'right'}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900,lineHeight:1.3}},'"YOU NEVER NEED TO LEAVE."')
  )
);
""")

b(3, 9, "does everything", r"""
const stats=[{l:'TERMINAL-BENCH',v:'82.7%',c:D.green},{l:'HALLUCINATION',v:'86%',c:D.red},{l:'API COST',v:'$5 in / $30 out',c:D.text_dim}];
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.08),bottom:Math.round(height*.08),display:'flex',gap:Math.round(width*.04),opacity:op,flexDirection:'column',alignItems:'flex-end'}},
    ...stats.map((s,i)=>React.createElement('div',{key:i,style:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,opacity:interpolate(frame,[i*7,i*7+12],[0,1],{extrapolateRight:'clamp'})}},
      React.createElement('div',{style:{color:s.c,fontFamily:D.font_display,fontSize:Math.round(width*.024),fontWeight:900,display:'flex',alignItems:'center',gap:8}},
        s.v, s.l==='HALLUCINATION'?React.createElement('span',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'HIGHEST'):''),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085)}},s.l)
    ))
  )
);
""")

b(3, 10, "everything I'm about", r"""
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lOp=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const rOp=interpolate(frame,[15,27],[0,1],{extrapolateRight:'clamp'});
const bOp=interpolate(frame,[26,38],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.15),bottom:Math.round(height*.15),width:1,backgroundColor:D.text_dim,opacity:.3}}),
  React.createElement('div',{style:{position:'absolute',left:0,width:'50%',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.018),opacity:lOp}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.024),fontWeight:900}},'CONSULTANT'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.012)}},'Claude Opus 4.7'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},'87.6% SWE-bench   36% hallucination')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',width:'50%',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.018),opacity:rOp}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.024),fontWeight:900}},'OPERATING SYSTEM'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.012)}},'GPT-5.5'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},'82.7% Terminal-bench   86% hallucination')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.09),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:bOp}},"THEY'RE NOT IN THE SAME RACE.")
);
""")

if __name__ == "__main__":
    out = "bundle_s1_s3.json"
    import pathlib
    pathlib.Path(out).write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(bundle)} bullets → {out}")
