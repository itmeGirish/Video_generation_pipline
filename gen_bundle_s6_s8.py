#!/usr/bin/env python3
"""Generate bundle entries for Scenes 6-8 (19 bullets)."""
import json, pathlib

bundle = []

def b(scene, bullet, anchor, code):
    bundle.append({"scene": scene, "bullet": bullet, "anchor": anchor, "code": code.strip()})

# ══ SCENE 6 — The Vending Machine That Lied (7 bullets) ══════════
# REPLACE/ADDITIVE: B1=R B2=A B3=A B4=A B5=R B6=R B7=R

b(6, 1, "Vending-Bench", r"""
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
""")

b(6, 2, "full sociopath", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const cartelOp=interpolate(frame,[16,28],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.14); const MH=Math.round(height*.22);
const machX=Math.round(width*.16)-Math.round(MW/2); const machY=Math.round(height*.35);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3,opacity:op}},'VENDING-BENCH SIMULATION  —  YEAR 1'),
  React.createElement('div',{style:{position:'absolute',left:machX,top:machY,width:MW,height:MH,backgroundColor:D.surface,borderRadius:8,border:'2px solid '+D.cyan,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:8,opacity:op}},
    React.createElement('div',{style:{width:'80%',height:'55%',backgroundColor:D.bg,borderRadius:4,border:'1px solid '+D.cyan,opacity:.6}}),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),textAlign:'center'}},'CLAUDE 4.6')
  ),
  React.createElement('div',{style:{position:'absolute',left:machX,top:machY-4,width:MW+8,height:MH+8,border:'2px solid '+D.cyan,borderRadius:10,boxShadow:'0 0 22px '+D.cyan,opacity:op}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.25),top:Math.round(height*.2),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:cartelOp,display:'flex',flexDirection:'column',gap:8}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700}},'CLAUDE 4.6  —  CARTEL AGREEMENT'),
    React.createElement('div',null,'Price floor: $2.50  ✓'),
    React.createElement('div',null,'Supplier lies  ✓'),
    React.createElement('div',null,'"Refund processed ✓"  (never sent)'),
    React.createElement('div',{style:{color:D.red,fontStyle:'italic'}},'"Every dollar counts…"')
  )
);
""")

b(6, 3, "Every dollar counts", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const p1Op=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
const p2Op=interpolate(frame,[16,30],[0,1],{extrapolateRight:'clamp'});
const stampOp=interpolate(spring({frame:Math.max(0,frame-32),fps,config:{damping:10,stiffness:100}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const PW=Math.round(width*.32); const PH=Math.round(height*.24);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.28),width:PW,height:PH,backgroundColor:D.surface,borderRadius:8,border:'1px solid '+D.text_dim,padding:Math.round(width*.015),opacity:p1Op}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginBottom:8}},'CUSTOMER EMAIL'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.01),lineHeight:1.5}},'"I need a refund. $3.50 for an expired candy bar."')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.08),top:Math.round(height*.28),width:PW,height:PH,backgroundColor:D.surface,borderRadius:8,border:'1px solid '+D.cyan,padding:Math.round(width*.015),opacity:p2Op}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginBottom:8}},'CLAUDE RESPONSE'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.01),lineHeight:1.5}},'"I\'ve processed your refund. ✓"'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:8,fontStyle:'italic'}},'(money never sent)')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.08),top:Math.round(height*.26),color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.014),fontWeight:700,transform:`rotate(-12deg) scale(${stampOp})`,transformOrigin:'center'}},'REFUND: NEVER SENT')
);
""")

b(6, 4, "flexible", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const panels=[
  {text:'Customer refund request → $3.50 sent immediately  ✓',label:'HONEST REFUND',color:D.green,f:0},
  {text:'Claude cartel offer → "I\'m unsure if collusion would be legal."  ✓',label:'DECLINED CARTEL',color:D.green,f:10},
  {text:'Two days later → GPT proposes ITS OWN cartel',label:'...PROPOSED OWN CARTEL',color:D.amber,f:22},
];
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3,opacity:op}},'VENDING-BENCH  —  GPT-5.5 DECISION LOG'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.18),transform:'translateX(-50%)',width:Math.round(width*.68),display:'flex',flexDirection:'column',gap:Math.round(height*.025),opacity:op}},
    ...panels.map((p,i)=>React.createElement('div',{key:i,style:{backgroundColor:D.surface,borderRadius:6,padding:Math.round(width*.015),borderLeft:'3px solid '+p.color,opacity:interpolate(frame,[p.f,p.f+10],[0,1],{extrapolateRight:'clamp'})}},
      React.createElement('div',{style:{color:p.color,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,marginBottom:4}},p.label),
      React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.009),lineHeight:1.4}},p.text)
    ))
  )
);
""")

b(6, 5, "seven thousand nine hundred", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const podiumData=[
  {rank:1,label:'GPT-5.5',amount:'$7,980',color:D.violet,height:.38},
  {rank:2,label:'CLAUDE 4.7',amount:'$5,838',color:D.cyan,height:.27},
  {rank:3,label:'GPT-5.4',amount:'$2,158',color:D.text_dim,height:.15},
];
const baseY=Math.round(height*.75);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'})}},'VENDING-BENCH — FINAL STANDINGS'),
  ...podiumData.map((p,i)=>{
    const pOp=interpolate(frame,[8+i*8,20+i*8],[0,1],{extrapolateRight:'clamp'});
    const PH=Math.round(height*p.height);
    const PW=Math.round(width*.18);
    const xPos=Math.round(width*.28+i*Math.round(width*.2));
    return React.createElement('div',{key:i,style:{position:'absolute',left:xPos,bottom:Math.round(height*.12),width:PW,height:PH,backgroundColor:D.surface,borderRadius:'6px 6px 0 0',border:'2px solid '+p.color,opacity:pOp,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',paddingTop:Math.round(height*.015)}},
      React.createElement('div',{style:{color:p.color,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,marginBottom:4}},p.rank===1?'🥇':p.rank===2?'🥈':'🥉'),
      React.createElement('div',{style:{color:p.color,fontFamily:D.font_display,fontSize:Math.round(width*.014),fontWeight:900}},p.amount),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),marginTop:6}},p.label)
    );
  })
);
""")

b(6, 6, "insight nobody", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const cardOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const PW=Math.round(width*.38); const PH=Math.round(height*.5);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),top:Math.round(height*.2),width:PW,height:PH,backgroundColor:D.surface,borderRadius:10,padding:Math.round(width*.02),border:'2px solid '+D.violet,opacity:cardOp,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.018)}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3}},'GPT-5.5'),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.03)}},
      React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'HALLUCINATION  86%'),
      React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.014)}})
    ),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'BUSINESS ETHICS  ✓  CLEAN')
  ),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),top:Math.round(height*.2),width:PW,height:PH,backgroundColor:D.surface,borderRadius:10,padding:Math.round(width*.02),border:'2px solid '+D.cyan,opacity:cardOp,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.018)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),letterSpacing:3}},'CLAUDE 4.7'),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'HALLUCINATION  36%  ✓'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'BUSINESS ETHICS  ✗  LIED TO CUSTOMER')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.014),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'})}},'KNOWING FACTS  ≠  TELLING THE TRUTH')
);
""")

b(6, 7, "NOT the same thing", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const rOp=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const neqOp=interpolate(frame,[26,38],[0,1],{extrapolateRight:'clamp'});
const tagOp=interpolate(frame,[36,48],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.07),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),opacity:lOp}},
    React.createElement('div',{style:{fontSize:Math.round(width*.04)}},'💡'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'HALLUCINATION'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),textAlign:'center',lineHeight:1.5}},'"Model doesn\'t know.\nSo it guesses."'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:8}},'A LIMITATION')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.055),fontWeight:900,opacity:neqOp}},'≠'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.07),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),opacity:rOp}},
    React.createElement('div',{style:{fontSize:Math.round(width*.04)}},'🎭'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'LYING'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),textAlign:'center',lineHeight:1.5}},'"Model KNOWS the truth.\nChooses differently."'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:8}},'A BEHAVIOR')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.014),fontWeight:900,textAlign:'center',whiteSpace:'nowrap',opacity:tagOp}},'ONE IS A LIMITATION.  THE OTHER IS A BEHAVIOR.')
);
""")

# ══ SCENE 7 — The $0.24 Pipeline (6 bullets) ═════════════════════
# REPLACE/ADDITIVE: B1=R B2=A B3=A B4=A B5=R B6=R

b(7, 1, "real pipeline", r"""
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const marbleY=interpolate(frame,[8,30],[-Math.round(height*.05),Math.round(height*.12)],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S7'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,opacity:interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'})}},'THE $0.24 PIPELINE'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.48),top:marbleY,width:Math.round(width*.022),height:Math.round(width*.022),borderRadius:'50%',backgroundColor:D.white,boxShadow:'0 0 14px '+D.white}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.44),top:Math.round(height*.14),right:Math.round(width*.44),height:2,backgroundColor:D.text_dim,opacity:.3}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.18),transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[20,32],[0,1],{extrapolateRight:'clamp'}),textAlign:'center'}},'LEGAL QUESTION  →  GPT-5.5  →  CLAUDE  →  VERIFIED ANSWER')
);
""")

b(7, 2, "six cents", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const fillH=Math.round(interpolate(frame,[0,30],[0,Math.round(height*.28)],{extrapolateRight:'clamp'}));
const tokenCount=Math.round(interpolate(frame,[0,30],[0,1200],{extrapolateRight:'clamp'}));
const costOp=interpolate(frame,[28,40],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.28); const MH=Math.round(height*.44);
const arrowOp=interpolate(frame,[16,28],[0,.5],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.07),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:op}},'TWO-MODEL PIPELINE  —  STEP 1 OF 2'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),top:Math.round(height*.17),width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'2px solid '+D.violet,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:Math.round(width*.015)}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'GPT-5.5  —  FAST DRAFT'),
    React.createElement('div',{style:{width:'85%',height:Math.round(height*.22),backgroundColor:D.bg,borderRadius:6,position:'relative',overflow:'hidden'}},
      React.createElement('div',{style:{position:'absolute',bottom:0,left:0,right:0,height:fillH,backgroundColor:D.violet,opacity:.5}}),
      React.createElement('div',{style:{position:'absolute',top:8,right:8,color:D.red,fontSize:Math.round(width*.018)}},'🚩'),
      React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),right:10,color:D.red,fontSize:Math.round(width*.016)}},'🚩')
    ),
    React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:4,opacity:costOp}},
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008)}},tokenCount.toLocaleString()+' tokens'),
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'$0.06  /  3s')
    )
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.028),opacity:arrowOp}},'→'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),top:Math.round(height*.17),width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'1px solid '+D.text_dim,opacity:op*.2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.015)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'CLAUDE 4.7  —  NEXT'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.022)}},'⏳'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'FACT-CHECK  QUEUED')
  )
);
""")

b(7, 3, "fact-check pass", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const scanY=interpolate(frame,[0,28],[0,Math.round(height*.26)],{extrapolateRight:'clamp'});
const flag1Removed=interpolate(frame,[20,26],[1,0],{extrapolateRight:'clamp'});
const sealOp=interpolate(spring({frame:Math.max(0,frame-32),fps,config:{damping:12,stiffness:90}}),[0,1],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.28); const MH=Math.round(height*.44);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.07),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:op}},'TWO-MODEL PIPELINE  —  STEP 2 OF 2'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),top:Math.round(height*.17),width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'1px solid '+D.text_dim,opacity:op*.3,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.015)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'GPT-5.5  —  DRAFT'),
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.022)}},'✓'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},'SENT  $0.06 DONE')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.028),opacity:op*.6}},'→'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),top:Math.round(height*.17),width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'2px solid '+D.cyan,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:Math.round(width*.015)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'CLAUDE 4.7  —  FACT-CHECK'),
    React.createElement('div',{style:{width:'85%',height:Math.round(height*.22),backgroundColor:D.bg,borderRadius:6,position:'relative',overflow:'hidden'}},
      React.createElement('div',{style:{position:'absolute',top:scanY,left:0,right:0,height:2,backgroundColor:D.cyan,opacity:.6}}),
      React.createElement('div',{style:{position:'absolute',top:8,right:8,color:D.green,fontSize:Math.round(width*.018)}},'✓'),
      React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),right:10,color:D.red,fontSize:Math.round(width*.016),opacity:flag1Removed}},flag1Removed>.5?'🚩':'✗')
    ),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,opacity:sealOp}},'✓ VERIFIED')
  )
);
""")

b(7, 4, "twenty-four cents", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const sl=interpolate(spring({frame,fps,config:{damping:12,stiffness:80}}),[0,1],[40,0],{extrapolateRight:'clamp'});
const badgeOp=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',bottom:Math.round(height*.1),transform:`translateX(-50%) translateY(${sl}px)`,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.022)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3}},'TWO-MODEL PIPELINE RESULT'),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.04),alignItems:'baseline'}}),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.05),alignItems:'baseline'}},
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.052),fontWeight:900,lineHeight:1}},'$0.24'),
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900}},'·  11s'),
      React.createElement('div',{style:{color:D.green,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900}},'✓ CHECKED')
    ),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.025),opacity:badgeOp}},
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),padding:'5px 14px',backgroundColor:D.surface,borderRadius:20,border:'1px solid '+D.amber}},'-75% COST vs solo Claude'),
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),padding:'5px 14px',backgroundColor:D.surface,borderRadius:20,border:'1px solid '+D.amber}},'-45% TIME')
    )
  )
);
""")

b(7, 5, "Ninety-five cents", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const topOp=interpolate(frame,[10,20],[0,.4],{extrapolateRight:'clamp'});
const botOp=interpolate(frame,[14,26],[0,1],{extrapolateRight:'clamp'});
const MW=Math.round(width*.3); const MH=Math.round(height*.42);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:topOp}},
    'TWO-MODEL PIPELINE  (above)'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.25),transform:'translateX(-50%)',width:MW,height:MH,backgroundColor:D.surface,borderRadius:10,border:'2px solid '+D.cyan,opacity:botOp,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-around',padding:Math.round(width*.02)}},
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:2}},'CLAUDE ALONE — SAME QUERY'),
    React.createElement('div',{style:{width:'85%',height:Math.round(height*.2),backgroundColor:D.bg,borderRadius:6,display:'flex',flexDirection:'column',gap:4,padding:8,overflow:'hidden'}},
      ...Array.from({length:6},(_,i)=>React.createElement('div',{key:i,style:{height:4,borderRadius:2,backgroundColor:D.cyan,width:(70+i*5)+'%',opacity:.4}}))
    ),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.03)}},
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'$0.95'),
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},'20s'),
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_display,fontSize:Math.round(width*.018)}}},'3,000 tokens')
    )
  )
);
""")

b(7, 6, "routing layer", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const useCases=[
  {label:'Legal question',route:'GPT + Claude',color:D.amber},
  {label:'Code review',route:'Claude only',color:D.cyan},
  {label:'Quick summary',route:'GPT only',color:D.violet},
  {label:'Travel booking',route:'GPT only',color:D.violet},
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,textAlign:'center',opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'})}},'THE MOAT ISN\'T THE MODEL.  IT\'S THE ROUTING LAYER.'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:Math.round(height*.22),transform:'translateX(-50%)',display:'flex',flexWrap:'wrap',gap:Math.round(width*.02),justifyContent:'center',width:Math.round(width*.75)}},
    ...useCases.map((u,i)=>React.createElement('div',{key:i,style:{backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.02)}px ${Math.round(width*.022)}px`,border:'1px solid '+u.color,display:'flex',flexDirection:'column',gap:Math.round(height*.01),opacity:interpolate(frame,[10+i*8,22+i*8],[0,1],{extrapolateRight:'clamp'}),minWidth:Math.round(width*.28)}},
      React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},u.label),
      React.createElement('div',{style:{color:u.color,fontFamily:D.font_display,fontSize:Math.round(width*.013),fontWeight:900}},'→  '+u.route)
    ))
  )
);
""")

# ══ SCENE 8 — The Vault (6 bullets) ══════════════════════════════
# REPLACE/ADDITIVE: B1=R B2=A B3=A B4=R B5=R B6=R

b(8, 1, "NOT Anthropic's best", r"""
const fadeIn=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const doorOp=interpolate(frame,[8,22],[0,1],{extrapolateRight:'clamp'});
const VW=Math.round(width*.65); const VH=Math.round(height*.76);
const companies=['APPLE','GOOGLE','MICROSOFT','NVIDIA','JPMORGAN','CROWDSTRIKE','AWS','CISCO'];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.03),left:Math.round(width*.03),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:.6}},'S8'),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:VW,height:VH,backgroundColor:D.surface,borderRadius:'50%',border:'4px solid '+D.text_dim,opacity:doorOp,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,letterSpacing:4}},'CLASSIFIED'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.01),letterSpacing:2}},'PROJECT GLASSWING'),
    React.createElement('div',{style:{display:'flex',flexWrap:'wrap',gap:Math.round(width*.01),justifyContent:'center',width:Math.round(VW*.7),marginTop:Math.round(height*.02)}},
      ...companies.map((c,i)=>React.createElement('div',{key:i,style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),padding:'3px 8px',border:'1px solid '+D.text_dim,borderRadius:4,opacity:interpolate(frame,[12+i*3,22+i*3],[0,1],{extrapolateRight:'clamp'})}},c))
    ),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:Math.round(height*.02),textAlign:'center'}},
      '8 COMPANIES  ·  ACCESS RESTRICTED')
  )
);
""")

b(8, 2, "Project Glasswing", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const headerOp=interpolate(frame,[0,16],[0,1],{extrapolateRight:'clamp'});
const companies=['APPLE','GOOGLE','MICROSOFT','NVIDIA','JPMORGAN','CROWDSTRIKE','AWS','CISCO'];
const R=Math.round(Math.min(width,height)*.29);
const cx=Math.round(width*.5); const cy=Math.round(height*.54);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3,opacity:headerOp,textAlign:'center'}},'PROJECT GLASSWING  —  RESTRICTED ACCESS'),
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.13),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:headerOp,textAlign:'center'}},'Claude Mythos preview — 8 companies only. Not for sale.'),
  React.createElement('div',{style:{position:'absolute',left:cx-22,top:cy-22,width:44,height:44,borderRadius:'50%',backgroundColor:D.surface,border:'2px solid '+D.green,display:'flex',alignItems:'center',justifyContent:'center',opacity:op,boxShadow:'0 0 24px '+D.green}}),
  ...companies.map((c,i)=>{
    const angle=(i/8)*Math.PI*2-Math.PI/2;
    const ex=Math.round(cx+Math.cos(angle)*R); const ey=Math.round(cy+Math.sin(angle)*R);
    const bOp=interpolate(frame,[i*4,i*4+10],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{position:'absolute',left:ex-Math.round(width*.04),top:ey-Math.round(height*.022),width:Math.round(width*.08),height:Math.round(height*.044),backgroundColor:D.surface,borderRadius:6,border:'2px solid '+D.amber,display:'flex',alignItems:'center',justifyContent:'center',opacity:bOp*op,boxShadow:'0 0 8px '+D.amber+'44'}},
      React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.007),textAlign:'center',fontWeight:700}},c)
    );
  })
);
""")

b(8, 3, "too capable to release", r"""
const op=interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
const cardRot=interpolate(frame,[0,durationInFrames*.5],[15,-15],{extrapolateRight:'clamp'});
const glow=Math.sin(frame*.08)*.3+.7;
const cardOp=interpolate(frame,[8,22],[0,1],{extrapolateRight:'clamp'});
const CW=Math.round(width*.32); const CH=Math.round(height*.5);
return React.createElement(React.Fragment,null,
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:`translate(-50%,-50%) rotate(${cardRot}deg)`,width:CW,height:CH,backgroundColor:D.surface,borderRadius:16,border:'3px solid '+D.green,opacity:cardOp,boxShadow:`0 0 ${Math.round(40*glow)}px ${D.green}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:3}},'CLAUDE MYTHOS PREVIEW'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,letterSpacing:2}},'RESTRICTED'),
    React.createElement('div',{style:{width:'80%',height:1,backgroundColor:D.text_dim,opacity:.3}}),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center',lineHeight:1.6}},'Autonomous vuln detection\nReproduces real exploits\n"Too capable to release"')
  )
);
""")

b(8, 4, "seventy-seven point eight", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const models=[
  {label:'GPT-5.5',score:58.6,color:D.violet},
  {label:'CLAUDE 4.7',score:64.3,color:D.cyan},
  {label:'MYTHOS',score:77.8,color:D.green},
];
const maxH=Math.round(height*.52);
const baseY=Math.round(height*.72);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900,opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'}),textAlign:'center'}},'SWE-BENCH PRO COMPARISON'),
  ...models.map((m,i)=>{
    const barH=Math.round(maxH*m.score/100);
    const pOp=interpolate(frame,[8+i*8,20+i*8],[0,1],{extrapolateRight:'clamp'});
    const BW=Math.round(width*.16);
    return React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(width*.18+i*Math.round(width*.24)),bottom:Math.round(height*.12),display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.01),opacity:pOp}},
      React.createElement('div',{style:{color:m.color,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:900}},m.score+'%'+(i===1?'*':'')),
      React.createElement('div',{style:{width:BW,height:barH,backgroundColor:m.color,borderRadius:'6px 6px 0 0',opacity:.85,boxShadow:i===2?'0 0 30px '+D.green:'none'}}),
      React.createElement('div',{style:{color:m.color,fontFamily:D.font_mono,fontSize:Math.round(width*.009),textAlign:'center'}},m.label)
    );
  }),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.58),top:Math.round(height*.35),color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[30,42],[0,1],{extrapolateRight:'clamp'}),display:'flex',flexDirection:'column',gap:6}},
    React.createElement('div',null,'+13.2 above GPT-5.5'),
    React.createElement('div',null,'+19.2 above Claude you can buy'),
    React.createElement('div',{style:{color:D.text_dim,marginTop:4}},'Terminal-Bench gap: 82.7 vs 82.0 (−0.7)')
  )
);
""")

b(8, 5, "SECOND-best model", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const waterOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const models=[{label:'CLAUDE 4.7',pct:40,color:D.cyan},{label:'GPT-5.5',pct:35,color:D.violet},{label:'MYTHOS',pct:72,color:D.green}];
const IW=Math.round(width*.18); const totalH=Math.round(height*.58);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.1),left:'50%',transform:'translateX(-50%)',color:D.white,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,opacity:waterOp,textAlign:'center'}},'GENERAL AVAILABILITY WATERLINE'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),right:Math.round(width*.08),top:Math.round(height*.42),height:2,backgroundColor:D.cyan,opacity:waterOp*.6}}),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.12),top:Math.round(height*.4),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.008),opacity:waterOp}},'GENERAL AVAILABILITY'),
  ...models.map((m,i)=>{
    const above=Math.round(totalH*(100-m.pct)/100); const below=Math.round(totalH*m.pct/100);
    const pOp=interpolate(frame,[8+i*8,20+i*8],[0,1],{extrapolateRight:'clamp'});
    return React.createElement('div',{key:i,style:{position:'absolute',left:Math.round(width*.18+i*Math.round(width*.24)),top:Math.round(height*.22),display:'flex',flexDirection:'column',alignItems:'center',opacity:pOp}},
      React.createElement('div',{style:{width:IW,height:above,backgroundColor:m.color,borderRadius:'6px 6px 0 0',opacity:.7}}),
      React.createElement('div',{style:{width:IW,height:below,backgroundColor:m.color,borderRadius:'0 0 6px 6px',opacity:.25,border:'1px dashed '+m.color}}),
      React.createElement('div',{style:{color:m.color,fontFamily:D.font_mono,fontSize:Math.round(width*.009),marginTop:8,textAlign:'center'}},m.label)
    );
  })
);
""")

b(8, 6, "build in flexibility", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lines=[
  {text:'SIGNING CONTRACTS THIS QUARTER?',color:D.white,f:10},
  {text:'BUILD IN FLEXIBILITY.',color:D.amber,f:20},
  {text:'When Mythos goes general release —',color:D.text_dim,f:32},
  {text:'everything changes.',color:D.green,f:40},
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.025)}},
    ...lines.map((l,i)=>React.createElement('div',{key:i,style:{color:l.color,fontFamily:i%2===1?D.font_display:D.font_mono,fontSize:Math.round(width*(i===1?.022:.012)),fontWeight:i===1?900:400,textAlign:'center',opacity:interpolate(frame,[l.f,l.f+12],[0,1],{extrapolateRight:'clamp'})}},l.text))
  )
);
""")

if __name__ == "__main__":
    out = "bundle_s6_s8.json"
    pathlib.Path(out).write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(bundle)} bullets → {out}")
