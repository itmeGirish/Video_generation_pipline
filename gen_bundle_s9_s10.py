#!/usr/bin/env python3
"""Generate bundle entries for Scenes 9-10 (10 bullets each = 20 total)."""
import json, pathlib

bundle = []

def b(scene, bullet, anchor, code):
    bundle.append({"scene": scene, "bullet": bullet, "anchor": anchor, "code": code.strip()})

# ══ SCENE 9 — The Race That Isn't A Race (10 bullets) ════════════════════════
# Anchors verified against chat-5-5-s09.json Whisper timestamps

# B1 anchor: "something bigger" @1.54s — EKG initializes
b(9, 1, "something bigger", r"""
const fadeIn=interpolate(frame,[0,15],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const titleOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const lineOp=interpolate(frame,[18,32],[0,1],{extrapolateRight:'clamp'});
const svgW=Math.round(width*.84); const svgH=Math.round(height*.28);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:fadeIn}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:5,opacity:titleOp}},'PLATFORM  vs  PRECISION'),
  React.createElement('svg',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.35),width:svgW,height:svgH,opacity:lineOp},viewBox:`0 0 ${svgW} ${svgH}`},
    React.createElement('line',{x1:0,y1:Math.round(svgH*.38),x2:svgW,y2:Math.round(svgH*.38),stroke:D.violet,strokeWidth:2.5,opacity:.7}),
    React.createElement('line',{x1:0,y1:Math.round(svgH*.72),x2:svgW,y2:Math.round(svgH*.72),stroke:D.cyan,strokeWidth:2,opacity:.5})
  ),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.59),color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.007),opacity:lineOp*.7}},'OPENAI  —  6 models / 8 months'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),top:Math.round(height*.67),color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.007),opacity:lineOp*.6}},'ANTHROPIC  —  3 models / same period')
);
""")

# B2 anchor: "OpenAI isn't" @7.48s — Statement card center (narration: "OpenAI isn't")
b(9, 2, "OpenAI isn't", r"""
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const textOp=interpolate(frame,[12,28],[0,1],{extrapolateRight:'clamp'});
const pulseVal=Math.sin(frame*.12)*.15+.85;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.03)}},
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900,opacity:textOp,textShadow:`0 0 ${Math.round(40*pulseVal)}px ${D.violet}`,textAlign:'center',lineHeight:1.3}},'OpenAI isn\'t competing'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.028),fontWeight:900,opacity:textOp,textShadow:`0 0 ${Math.round(40*pulseVal)}px ${D.violet}`,textAlign:'center',lineHeight:1.3}},'with Anthropic.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[30,44],[0,1],{extrapolateRight:'clamp'}),marginTop:Math.round(height*.02)}},'I know.  Sounds wrong.')
  )
);
""")

# B3 anchor: "heartbeat getting" @21.02s — EKG six releases accelerating
b(9, 3, "heartbeat getting", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const gptSpikes=[
  {x:.06,h:.28,label:'GPT-5',gap:38},{x:.18,h:.32,label:'5.1',gap:32},
  {x:.28,h:.36,label:'5.2',gap:26},{x:.36,h:.40,label:'5.3',gap:20},
  {x:.43,h:.44,label:'5.4',gap:14},{x:.49,h:.48,label:'5.5',gap:0}
];
const claudeSpikes=[
  {x:.58,h:.44,label:'4.5'},{x:.72,h:.52,label:'4.6'},{x:.86,h:.60,label:'4.7'}
];
const svgW=Math.round(width*.92); const svgH=Math.round(height*.58);
const baseY=Math.round(svgH*.55); const scale=Math.round(svgH*.85);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:3,opacity:.6}},'RELEASE CADENCE — acceleration toward tachycardia'),
  React.createElement('svg',{style:{position:'absolute',left:Math.round(width*.04),top:Math.round(height*.16),width:svgW,height:svgH},viewBox:`0 0 ${svgW} ${svgH}`},
    React.createElement('line',{x1:0,y1:baseY,x2:svgW,y2:baseY,stroke:D.text_dim,strokeWidth:1,opacity:.2}),
    ...gptSpikes.map((s,i)=>{
      const spOp=interpolate(frame,[6+i*4,16+i*4],[0,1],{extrapolateRight:'clamp'});
      const sH=Math.round(scale*s.h); const sX=Math.round(svgW*s.x);
      return React.createElement('g',{key:'g'+i,opacity:spOp},
        React.createElement('rect',{x:sX-3,y:baseY-sH,width:6,height:sH,fill:D.violet}),
        React.createElement('text',{x:sX,y:baseY-sH-8,textAnchor:'middle',fill:D.violet,fontSize:11,fontFamily:'monospace'},s.label)
      );
    }),
    React.createElement('text',{x:Math.round(svgW*.02),y:baseY+20,fill:D.violet,fontSize:11,fontFamily:'monospace',opacity:.7},'OPENAI — spacing shrinks ↓'),
    ...claudeSpikes.map((s,i)=>{
      const spOp=interpolate(frame,[14+i*6,24+i*6],[0,1],{extrapolateRight:'clamp'});
      const sH=Math.round(scale*s.h); const sX=Math.round(svgW*s.x);
      return React.createElement('g',{key:'c'+i,opacity:spOp},
        React.createElement('rect',{x:sX-4,y:baseY-sH,width:8,height:sH,fill:D.cyan}),
        React.createElement('text',{x:sX,y:baseY-sH-8,textAnchor:'middle',fill:D.cyan,fontSize:11,fontFamily:'monospace'},s.label)
      );
    }),
    React.createElement('text',{x:Math.round(svgW*.56),y:baseY+20,fill:D.cyan,fontSize:11,fontFamily:'monospace',opacity:.7},'ANTHROPIC — wider gaps, bigger leaps')
  )
);
""")

# B4 anchor: "retired gone." @30.46s — GPT-5 and 5.1 flatline, RETIRED stamps
b(9, 4, "retired gone.", r"""
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const stamp1Op=interpolate(frame,[4,14],[0,1],{extrapolateRight:'clamp'});
const stamp2Op=interpolate(frame,[14,24],[0,1],{extrapolateRight:'clamp'});
const textOp=interpolate(frame,[20,32],[0,1],{extrapolateRight:'clamp'});
const svgW=Math.round(width*.92); const svgH=Math.round(height*.5); const baseY=Math.round(svgH*.55);
const scale=Math.round(svgH*.85);
const allSpikes=[
  {x:.06,h:.28,label:'GPT-5',retired:true},{x:.18,h:.32,label:'5.1',retired:true},
  {x:.28,h:.36,label:'5.2',retired:false},{x:.36,h:.40,label:'5.3',retired:false},
  {x:.43,h:.44,label:'5.4',retired:false},{x:.49,h:.48,label:'5.5',retired:false}
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('svg',{style:{position:'absolute',left:Math.round(width*.04),top:Math.round(height*.18),width:svgW,height:svgH},viewBox:`0 0 ${svgW} ${svgH}`},
    React.createElement('line',{x1:0,y1:baseY,x2:svgW,y2:baseY,stroke:D.text_dim,strokeWidth:1,opacity:.2}),
    ...allSpikes.map((s,i)=>{
      const sH=Math.round(scale*s.h); const sX=Math.round(svgW*s.x);
      const color=s.retired?D.red:D.violet;
      const retiredStampOp=s.retired?(i===0?stamp1Op:stamp2Op):0;
      return React.createElement('g',{key:'s'+i},
        React.createElement('rect',{x:sX-3,y:baseY-sH,width:6,height:sH,fill:color}),
        s.retired?React.createElement('line',{x1:sX-12,y1:baseY-4,x2:sX+12,y2:baseY-4,stroke:D.red,strokeWidth:3,opacity:retiredStampOp}):null,
        React.createElement('text',{x:sX,y:baseY-sH-8,textAnchor:'middle',fill:color,fontSize:11,fontFamily:'monospace'},s.label),
        s.retired?React.createElement('text',{x:sX,y:baseY-sH-22,textAnchor:'middle',fill:D.red,fontSize:10,fontFamily:'monospace',opacity:retiredStampOp},'RETIRED'):null
      );
    }),
    React.createElement('text',{x:Math.round(svgW*.02),y:baseY+20,fill:D.text_dim,fontSize:11,fontFamily:'monospace',opacity:.7},'OPENAI')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.18),left:'50%',transform:'translateX(-50%)',color:D.red,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:textOp,textAlign:'center'}},
    'Model from last August?  Gone.'
  )
);
""")

# B5 anchor: "They're building toward" @38.92s — 900M users, IPO numbers float
b(9, 5, "They're building toward", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const stats=[
  {label:'900M',sub:'weekly users',color:D.violet,f:6},
  {label:'50M',sub:'paying subscribers',color:D.violet,f:22},
  {label:'#1',sub:'Largest tech IPO in history',color:D.amber,f:38},
  {label:'1 app',sub:'ChatGPT + Codex + Atlas + Agents',color:D.violet,f:54},
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:'50%',transform:'translateX(-50%)',color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.012),fontWeight:700,letterSpacing:3,opacity:interpolate(frame,[10,22],[0,1],{extrapolateRight:'clamp'})}},'OPENAI BY THE NUMBERS'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.1),right:Math.round(width*.1),top:Math.round(height*.2),display:'flex',flexWrap:'wrap',gap:Math.round(height*.03)}},
    ...stats.map((s,i)=>{
      const sp=spring({frame:Math.max(0,frame-s.f),fps,config:{damping:14,stiffness:160}});
      const op=interpolate(frame,[s.f,s.f+12],[0,1],{extrapolateRight:'clamp'});
      const scale=interpolate(sp,[0,1],[.7,1],{extrapolateRight:'clamp'});
      return React.createElement('div',{key:i,style:{width:Math.round(width*.36),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.025)}px ${Math.round(width*.02)}px`,opacity:op,transform:`scale(${scale})`}},
        React.createElement('div',{style:{color:s.color,fontFamily:D.font_display,fontSize:Math.round(width*.038),fontWeight:900,lineHeight:1}},s.label),
        React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),marginTop:Math.round(height*.008)}},s.sub)
      );
    })
  )
);
""")

# B6 anchor: "a platform company" @47.82s — PLATFORM declaration
b(9, 6, "a platform company", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1Op=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const l2Op=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const pulseVal=Math.sin(frame*.1)*.2+.8;
const ghostOp=interpolate(frame,[28,42],[0,.06],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.025)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.013),opacity:l1Op,textDecoration:'line-through',textDecorationColor:D.red}},"That's not a model company."),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(60*pulseVal)}px ${D.violet}`,textAlign:'center',lineHeight:1.2}},"That's a"),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.052),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(80*pulseVal)}px ${D.violet}`,letterSpacing:6}},'PLATFORM'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(60*pulseVal)}px ${D.violet}`}},'company.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:ghostOp*15,marginTop:Math.round(height*.02),textAlign:'center',lineHeight:1.8}},'Competing with Google Search  ·  Microsoft Office  ·  manual computer use')
  )
);
""")

# B7 anchor: "Now look at" @59.8s — Anthropic precision focus, scrolling stats
b(9, 7, "Now look at", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const titleOp=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const lines=[
  {text:'Three releases.  Bigger jumps each time.',f:14,color:D.cyan},
  {text:'Built a model too powerful to release.',f:28,color:D.cyan},
  {text:'Defense partnership — $8T companies.',f:42,color:D.cyan},
  {text:'Hallucination rate: 36%  (competition: 86%)',f:56,color:D.green},
  {text:'Anthropic isn\'t competing with OpenAI.',f:72,color:D.text_dim},
  {text:'Competing with McKinsey.  Deloitte.',f:84,color:D.text_dim},
];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.08),left:Math.round(width*.08),color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.012),fontWeight:700,letterSpacing:3,opacity:titleOp}},'ANTHROPIC — THE PRECISION COMPANY'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.08),right:Math.round(width*.08),top:Math.round(height*.2),display:'flex',flexDirection:'column',gap:Math.round(height*.028)}},
    ...lines.map((ln,i)=>{
      const op=interpolate(frame,[ln.f,ln.f+12],[0,1],{extrapolateRight:'clamp'});
      const xSlide=interpolate(frame,[ln.f,ln.f+16],[-Math.round(width*.03),0],{extrapolateRight:'clamp'});
      return React.createElement('div',{key:i,style:{color:ln.color,fontFamily:D.font_mono,fontSize:Math.round(width*.01),opacity:op,transform:`translateX(${xSlide}px)`,borderLeft:`2px solid ${ln.color}`,paddingLeft:Math.round(width*.012)}},ln.text);
    })
  )
);
""")

# B8 anchor: "a precision company" @77.64s — PRECISION declaration
b(9, 8, "a precision company", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1Op=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const l2Op=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const pulseVal=Math.sin(frame*.1)*.2+.8;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.025)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.013),opacity:l1Op,textDecoration:'line-through',textDecorationColor:D.red}},"That's not a platform company."),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(60*pulseVal)}px ${D.cyan}`,textAlign:'center',lineHeight:1.2}},"That's a"),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.052),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(80*pulseVal)}px ${D.cyan}`,letterSpacing:6}},'PRECISION'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.032),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(60*pulseVal)}px ${D.cyan}`}},'company.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),opacity:interpolate(frame,[36,50],[0,1],{extrapolateRight:'clamp'}),marginTop:Math.round(height*.02),textAlign:'center',lineHeight:1.8}},'Competing with McKinsey  ·  Deloitte  ·  paying an expert to get it right')
  )
);
""")

# B9 anchor: "OpenAI wins" @90.42s — Two planets split screen (narration: "OpenAI wins")
b(9, 9, "OpenAI wins", r"""
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const lOp=interpolate(frame,[12,26],[0,1],{extrapolateRight:'clamp'});
const rOp=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const PR=Math.round(Math.min(width,height)*.18);
const pulseMag=Math.sin(frame*.08)*.2+.8;
const pulseCy=Math.sin(frame*.08+1.2)*.15+.85;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),letterSpacing:4,opacity:.5}},'OPENAI WINS IF…  vs  ANTHROPIC WINS IF…'),
  React.createElement('div',{style:{position:'absolute',left:Math.round(width*.06),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),opacity:lOp}},
    React.createElement('div',{style:{width:PR*2,height:PR*2,borderRadius:'50%',backgroundColor:D.violet,opacity:.65*pulseMag,boxShadow:`0 0 ${Math.round(60*pulseMag)}px ${D.violet}`,display:'flex',alignItems:'center',justifyContent:'center'}},
      React.createElement('div',{style:{color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.008),textAlign:'center',lineHeight:1.6,fontWeight:700}},`900M users\n50M subs`)
    ),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,letterSpacing:2}},'THE PLATFORM'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),textAlign:'center',lineHeight:1.7}},'AI does everything\ngood enough\nall in one place')
  ),
  React.createElement('div',{style:{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.018),opacity:.3}},'vs'),
  React.createElement('div',{style:{position:'absolute',right:Math.round(width*.06),top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:Math.round(height*.02),opacity:rOp}},
    React.createElement('div',{style:{width:PR*2,height:PR*2,borderRadius:'50%',backgroundColor:D.cyan,opacity:.55*pulseCy,boxShadow:`0 0 ${Math.round(40*pulseCy)}px ${D.cyan}`,display:'flex',alignItems:'center',justifyContent:'center'}},
      React.createElement('div',{style:{color:D.bg,fontFamily:D.font_mono,fontSize:Math.round(width*.008),textAlign:'center',lineHeight:1.6,fontWeight:700}},'36%\nhalluc.')
    ),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.016),fontWeight:900,letterSpacing:2}},'THE CONSULTANT'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),textAlign:'center',lineHeight:1.7}},'AI does the hard things\ncorrectly\nyou trust the output')
  )
);
""")

# B10 anchor: "That's an ecosystem" @111.92s — Ecosystem conclusion
b(9, 10, "That's an ecosystem", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1Op=interpolate(frame,[8,20],[0,1],{extrapolateRight:'clamp'});
const l2Op=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const l3Op=interpolate(frame,[32,46],[0,1],{extrapolateRight:'clamp'});
const l4Op=interpolate(frame,[46,60],[0,1],{extrapolateRight:'clamp'});
const pulseMag=Math.sin(frame*.12)*.15+.85;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.028)}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_mono,fontSize:Math.round(width*.011),opacity:l1Op,letterSpacing:2}},'EVERY COMPANY NEEDS'),
    React.createElement('div',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.038),fontWeight:900,opacity:l2Op,textShadow:`0 0 ${Math.round(50*pulseMag)}px ${D.violet}`}},'A SEARCH ENGINE'),
    React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_display,fontSize:Math.round(width*.038),fontWeight:900,opacity:l3Op,textShadow:'0 0 40px '+D.cyan}},'AND A CONSULTANT.'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.012),fontWeight:700,opacity:l4Op,marginTop:Math.round(height*.02),letterSpacing:2}},"THAT'S NOT A RIVALRY.  THAT'S AN ECOSYSTEM.")
  )
);
""")


# ══ SCENE 10 — Verdict + CTA + Loop-Back (10 bullets) ═══════════════════════
# Anchors verified against chat-5-5-s10.json Whisper timestamps
# NOTE: Whisper transcribes "Claude" as "Crude" throughout scene 10

# Departure board data — used across B2-B7
# rows: [cat, finalResult, color, settled_from_b]
# settled_from_b indicates first bullet where this row shows settled state

# B1 anchor: "So did GPT" @0.0s — Opening question void
b(10, 1, "So did GPT", r"""
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const textOp=interpolate(frame,[12,28],[0,1],{extrapolateRight:'clamp'});
const qPulse=Math.sin(frame*.14)*.3+.7;
const qOp=interpolate(frame,[28,42],[0,1],{extrapolateRight:'clamp'});
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.02)}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.026),fontWeight:900,opacity:textOp,textAlign:'center',lineHeight:1.3}},'Did GPT-5.5 beat'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.026),fontWeight:900,opacity:textOp,textAlign:'center',lineHeight:1.3}},'Claude Opus 4.7?'),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_display,fontSize:Math.round(width*.06),fontWeight:900,opacity:qOp,textShadow:`0 0 ${Math.round(60*qPulse)}px ${D.amber}`}},'?')
  )
);
""")

# B2 anchor: "answer is on" @6.06s — Departure board materializes (all dashes)
b(10, 2, "answer is on", r"""
const bgOp=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const boardOp=interpolate(frame,[6,20],[0,1],{extrapolateRight:'clamp'});
const rows=[
  {cat:'DOING THINGS'},{cat:'THINKING'},{cat:'HONESTY'},{cat:'ETHICS'},{cat:'VALUE'}
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68);
const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:interpolate(frame,[4,16],[0,1],{extrapolateRight:'clamp'})}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008),opacity:boardOp}},
    ...rows.map((r,i)=>React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:D.surface,borderRadius:6,overflow:'hidden'}},
      React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
      React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.01)}},'--------')
    ))
  )
);
""")

# B3 anchor: "Doing things" @8.04s — Row 1 DOING THINGS flips → GPT-5.5
b(10, 3, "Doing things", r"""
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const target0='GPT-5.5';
const settled0=frame>22;
const cyc0=chars[Math.floor(frame*2.4)%chars.length];
const txt0=settled0?target0:cyc0.repeat(target0.length);
const col0=settled0?D.violet:D.text_dim;
const rows=[
  {cat:'DOING THINGS',txt:txt0,color:col0,settled:settled0},
  {cat:'THINKING',txt:'--------',color:D.text_dim,settled:false},
  {cat:'HONESTY',txt:'--------',color:D.text_dim,settled:false},
  {cat:'ETHICS',txt:'--------',color:D.text_dim,settled:false},
  {cat:'VALUE',txt:'--------',color:D.text_dim,settled:false},
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:.6}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const bg=i===0&&r.settled?D.violet+'22':D.surface;
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:bg,borderRadius:6,overflow:'hidden',transition:'none'}},
        React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:r.settled?700:400}},r.txt)
      );
    })
  )
);
""")

# B4 anchor: "Claude Not close" @14.14s — Rows 2-3 flip (Whisper: "Crude"="Claude" via fuzzy)
b(10, 4, "Claude Not close", r"""
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const target1='CLAUDE 4.7'; const target2='CLAUDE 4.7';
const settled1=frame>18; const settled2=frame>30;
const c1=chars[Math.floor(frame*2.2)%chars.length]; const c2=chars[Math.floor((frame-6)*2.2)%chars.length];
const txt1=settled1?target1:c1.repeat(target1.length);
const txt2=settled2?target2:c2.repeat(target2.length);
const rows=[
  {cat:'DOING THINGS',txt:'GPT-5.5',color:D.violet,settled:true},
  {cat:'THINKING',txt:txt1,color:settled1?D.cyan:D.text_dim,settled:settled1},
  {cat:'HONESTY',txt:txt2,color:settled2?D.green:D.text_dim,settled:settled2},
  {cat:'ETHICS',txt:'--------',color:D.text_dim,settled:false},
  {cat:'VALUE',txt:'--------',color:D.text_dim,settled:false},
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:.6}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const bgMap=[D.violet+'22',D.cyan+'22',D.green+'22',D.surface,D.surface];
      const bg=r.settled?bgMap[i]:D.surface;
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:bg,borderRadius:6,overflow:'hidden'}},
        React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:r.settled?700:400}},r.txt)
      );
    })
  )
);
""")

# B5 anchor: "Ethics" @16.76s — Row 4 ETHICS flips (pause breaks multi-word span; single-word exact)
b(10, 5, "Ethics", r"""
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const target3='GPT-5.5';
const flickerLen=40;
const settled3=frame>flickerLen;
const c3=chars[Math.floor(frame*2.8)%chars.length];
const fakeClau=frame>12&&frame<28;
const displayTxt=settled3?target3:(fakeClau?'CLAU----':c3.repeat(target3.length));
const rows=[
  {cat:'DOING THINGS',txt:'GPT-5.5',color:D.violet,settled:true},
  {cat:'THINKING',txt:'CLAUDE 4.7',color:D.cyan,settled:true},
  {cat:'HONESTY',txt:'CLAUDE 4.7',color:D.green,settled:true},
  {cat:'ETHICS',txt:displayTxt,color:settled3?D.green:D.amber,settled:settled3},
  {cat:'VALUE',txt:'--------',color:D.text_dim,settled:false},
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:.6}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const bgMap=[D.violet+'22',D.cyan+'22',D.green+'22',D.green+'22',D.surface];
      const bg=r.settled?bgMap[i]:D.surface;
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:bg,borderRadius:6,overflow:'hidden'}},
        React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:r.settled?700:400}},r.txt)
      );
    })
  ),
  settled3?React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.12),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:interpolate(frame,[flickerLen+8,flickerLen+22],[0,1],{extrapolateRight:'clamp'})}},'Yeah.  That surprised me too.'):null
);
""")

# B6 anchor: "Build the pipeline" @22.54s — Row 5 VALUE → BUILD THE PIPELINE (narration exact)
b(10, 6, "Build the pipeline", r"""
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.- ';
const target4='BUILD THE PIPELINE';
const settled4=frame>24;
const c4=chars[Math.floor(frame*2.6)%chars.length];
const txt4=settled4?target4:c4.repeat(Math.min(target4.length,Math.floor(frame*1.8)));
const rows=[
  {cat:'DOING THINGS',txt:'GPT-5.5',color:D.violet,settled:true},
  {cat:'THINKING',txt:'CLAUDE 4.7',color:D.cyan,settled:true},
  {cat:'HONESTY',txt:'CLAUDE 4.7',color:D.green,settled:true},
  {cat:'ETHICS',txt:'GPT-5.5',color:D.green,settled:true},
  {cat:'VALUE',txt:txt4,color:settled4?D.amber:D.text_dim,settled:settled4},
];
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',top:Math.round(height*.06),left:'50%',transform:'translateX(-50%)',color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.008),letterSpacing:4,opacity:.6}},'FINAL VERDICT'),
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.17),display:'flex',flexDirection:'column',gap:Math.round(height*.008)}},
    ...rows.map((r,i)=>{
      const bgMap=[D.violet+'22',D.cyan+'22',D.green+'22',D.green+'22',D.amber+'22'];
      const bg=r.settled?bgMap[i]:D.surface;
      return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:RH,width:RW,backgroundColor:bg,borderRadius:6,overflow:'hidden'}},
        React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009)}},r.cat),
        React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:r.settled?700:400}},r.txt)
      );
    })
  ),
  settled4?React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.12),left:'50%',transform:'translateX(-50%)',color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,opacity:interpolate(frame,[26,40],[0,1],{extrapolateRight:'clamp'})}},'Stop guessing.  Start building.'):null
);
""")

# B7 anchor: "somewhere in a" @26.04s — Vault callback + board settled
b(10, 7, "somewhere in a", r"""
const bgOp=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const vaultOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const pipeOp=interpolate(frame,[20,34],[0,1],{extrapolateRight:'clamp'});
const vaultPulse=Math.sin(frame*.1)*.2+.8;
const RH=Math.round(height*.1); const RW=Math.round(width*.68); const boardL=Math.round((width-RW)/2);
const rows=[
  {cat:'DOING THINGS',txt:'GPT-5.5',color:D.violet},{cat:'THINKING',txt:'CLAUDE 4.7',color:D.cyan},
  {cat:'HONESTY',txt:'CLAUDE 4.7',color:D.green},{cat:'ETHICS',txt:'GPT-5.5',color:D.green},
  {cat:'VALUE',txt:'BUILD THE PIPELINE',color:D.amber},
];
const bgMap=[D.violet+'22',D.cyan+'22',D.green+'22',D.green+'22',D.amber+'22'];
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',left:boardL,top:Math.round(height*.06),display:'flex',flexDirection:'column',gap:Math.round(height*.006)}},
    ...rows.map((r,i)=>React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',height:Math.round(RH*.8),width:RW,backgroundColor:bgMap[i],borderRadius:4,overflow:'hidden'}},
      React.createElement('div',{style:{width:Math.round(RW*.38),height:'100%',backgroundColor:D.bg,display:'flex',alignItems:'center',paddingLeft:Math.round(width*.012),color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075)}},r.cat),
      React.createElement('div',{style:{flex:1,height:'100%',display:'flex',alignItems:'center',paddingLeft:Math.round(width*.014),color:r.color,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700}},r.txt)
    ))
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.28),left:Math.round(width*.06),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.018)}px ${Math.round(width*.018)}px`,border:`1px solid ${D.green}`,opacity:vaultOp,maxWidth:Math.round(width*.32)}},
    React.createElement('div',{style:{color:D.green,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700,textShadow:`0 0 10px ${D.green}`,opacity:vaultPulse}},'⬡  MYTHOS IS WAITING.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),marginTop:Math.round(height*.008)}},'Restricted to 8 companies.')
  ),
  React.createElement('div',{style:{position:'absolute',bottom:Math.round(height*.28),right:Math.round(width*.06),backgroundColor:D.surface,borderRadius:8,padding:`${Math.round(height*.018)}px ${Math.round(width*.018)}px`,border:`1px solid ${D.amber}`,opacity:pipeOp,maxWidth:Math.round(width*.32)}},
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.009),fontWeight:700}},'⚙  BUILD THIS MONDAY.'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.0075),marginTop:Math.round(height*.008)}},'GPT draft  →  Claude verify  →  ship.')
  )
);
""")

# B8 anchor: "winner of April" @38.08s — Developer wins use-both card
b(10, 8, "winner of April", r"""
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const l1Op=interpolate(frame,[12,26],[0,1],{extrapolateRight:'clamp'});
const l2Op=interpolate(frame,[28,42],[0,1],{extrapolateRight:'clamp'});
const l3Op=interpolate(frame,[46,60],[0,1],{extrapolateRight:'clamp'});
const l4Op=interpolate(frame,[62,76],[0,1],{extrapolateRight:'clamp'});
const bothGlow=Math.sin(frame*.1)*.2+.8;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.025),paddingLeft:Math.round(width*.08),paddingRight:Math.round(width*.08)}},
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.018),fontWeight:400,opacity:l1Op,textAlign:'center',lineHeight:1.4}},'The winner of April 2026 isn\'t a model.'),
    React.createElement('div',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:700,opacity:l2Op,textAlign:'center',lineHeight:1.4}},"It's the developer who stops asking"),
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:Math.round(width*.012),opacity:l2Op}},
      React.createElement('span',{style:{color:D.violet,fontFamily:D.font_display,fontSize:Math.round(width*.022),fontWeight:900}},'which one'),
      React.createElement('span',{style:{color:D.text,fontFamily:D.font_display,fontSize:Math.round(width*.022)}},'and starts building systems that use'),
      React.createElement('span',{style:{color:'transparent',fontFamily:D.font_display,fontSize:Math.round(width*.026),fontWeight:900,backgroundImage:`linear-gradient(90deg,${D.cyan},${D.violet})`,WebkitBackgroundClip:'text',backgroundClip:'text',textShadow:'none',filter:`drop-shadow(0 0 ${Math.round(14*bothGlow)}px ${D.cyan})`}},'BOTH')
    ),
    React.createElement('div',{style:{display:'flex',gap:Math.round(width*.02),opacity:l3Op,marginTop:Math.round(height*.02)}},
      React.createElement('div',{style:{backgroundColor:D.cyan+'22',border:`1px solid ${D.cyan}`,borderRadius:6,padding:`${Math.round(height*.016)}px ${Math.round(width*.016)}px`,color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),lineHeight:1.7}},`Code you can't afford\nto get wrong →\nUse Claude.`),
      React.createElement('div',{style:{backgroundColor:D.violet+'22',border:`1px solid ${D.violet}`,borderRadius:6,padding:`${Math.round(height*.016)}px ${Math.round(width*.016)}px`,color:D.violet,fontFamily:D.font_mono,fontSize:Math.round(width*.0085),lineHeight:1.7}},'Systems that need\nto act →\nGPT-5.5.')
    ),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:l4Op,textAlign:'center'}},"They're not rivals.  They're different species.")
  )
);
""")

# B9 anchor: "Hit subscribe" @66.78s — Subscribe CTA
b(10, 9, "Hit subscribe", r"""
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
const target='SUBSCRIBE';
const settled=frame>32;
const cycleStr=settled?target:target.split('').map((_,i)=>chars[Math.floor((frame+i*3)*.8)%chars.length]).join('');
const btnOp=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const subOp=interpolate(frame,[26,40],[0,1],{extrapolateRight:'clamp'});
const commentOp=interpolate(frame,[42,56],[0,1],{extrapolateRight:'clamp'});
const blinkOn=Math.floor(frame/18)%2===0;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.03)}},
    React.createElement('div',{style:{width:Math.round(width*.6),height:Math.round(height*.13),backgroundColor:D.surface,borderRadius:8,border:`2px solid ${D.cyan}`,display:'flex',alignItems:'center',justifyContent:'center',opacity:btnOp}},
      React.createElement('div',{style:{color:D.cyan,fontFamily:D.font_mono,fontSize:Math.round(width*.022),fontWeight:700,letterSpacing:5}},cycleStr)
    ),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.009),opacity:subOp,textAlign:'center',lineHeight:2}},
      'Real benchmarks.  Real developer reactions.  Real money math.\nNo hype.  No fluff.'
    ),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.011),fontWeight:700,opacity:commentOp,textAlign:'center'}},
      'PLATFORM OR PRECISION? — ',
      React.createElement('span',{style:{color:blinkOn?D.amber:D.surface}},'YOU')
    )
  )
);
""")

# B10 anchor: "It IS incredible" @90.02s — Loop-back 86%, smarter ≠ more honest
b(10, 10, "It IS incredible", r"""
const bgOp=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const q1Op=interpolate(frame,[10,24],[0,1],{extrapolateRight:'clamp'});
const q2Op=interpolate(frame,[22,36],[0,1],{extrapolateRight:'clamp'});
const chars='1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
const targetNum='86%';
const settledNum=frame>54;
const cycleNum=settledNum?targetNum:chars[Math.floor(frame*.8)%chars.length]+chars[Math.floor(frame*.6)%chars.length]+'%';
const numOp=interpolate(frame,[38,54],[0,1],{extrapolateRight:'clamp'});
const tagOp=interpolate(frame,[58,72],[0,1],{extrapolateRight:'clamp'});
const numPulse=settledNum?Math.sin(frame*.15)*.1+.9:1;
return React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg,opacity:bgOp}},
  React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:Math.round(height*.03)}},
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.012),opacity:q1Op,textAlign:'center',fontStyle:'italic'}},'"Like having a limb amputated."'),
    React.createElement('div',{style:{color:D.text_dim,fontFamily:D.font_mono,fontSize:Math.round(width*.012),opacity:q2Op,textAlign:'center',fontStyle:'italic'}},'He\'s right.  It IS incredible.'),
    React.createElement('div',{style:{color:D.red,fontFamily:D.font_display,fontSize:Math.round(width*.1),fontWeight:900,opacity:numOp*numPulse,textShadow:`0 0 ${Math.round(60*numPulse)}px ${D.red}`}},settledNum?'86%':cycleNum),
    React.createElement('div',{style:{color:D.amber,fontFamily:D.font_mono,fontSize:Math.round(width*.014),fontWeight:700,opacity:tagOp,letterSpacing:2}},'smarter  ≠  more honest')
  )
);
""")


if __name__ == "__main__":
    out = "bundle_s9_s10.json"
    pathlib.Path(out).write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(bundle)} bullets to {out}")
    for e in bundle:
        print(f"  S{e['scene']}-B{e['bullet']}: anchor={e['anchor']!r}")
