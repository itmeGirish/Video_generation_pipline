# Rich-Animation Recipe Bank

Reusable, fully-described motion recipes for animation bullets (rule 03). Pick the one
that fits the beat and fill in your real content — these are buildable as-is (frame-driven
transforms / springs / value-over-range), not vibes. Combine recipes across consecutive
bullets so no two adjacent beats animate the same way.

---

**Number arrival (for a hero stat)**
Counter ticks 0→value over ~20 frames (easeOutCubic); the digits scale 0.8→1 on a heavy
spring; a soft glow grows behind them; lands with a 2-frame shake; then holds with a
±1.5% breathe.

**Race / overtake (for a comparison)**
Two bars fill from 0 simultaneously, D.cyan vs D.violet; the trailing bar accelerates and
crosses the leader mid-beat; value labels travel pinned to each bar's leading edge; the
winner's bar pulses once on landing.

**Staggered reveal (for a list / set)**
N items enter one-by-one with a per-item delay (~8–12 frames apart), each sliding up 30px
+ scaling 0.9→1 (snappy); already-placed items dim slightly as the next arrives, then all
settle to full with a gentle shared drift.

**Fill / drain (for a level or capacity)**
A container's fill animates source→target over the beat; particles flow along the path;
the surface line wobbles slightly; a percentage label counts in sync.

**Build-and-connect (for a system / flow)**
Nodes pop in (bouncy, staggered); then connecting lines draw between them (stroke length
0→full); a pulse travels along each line once drawn, showing direction of flow.

**Impact / break (for a failure or shock)**
The subject scales up then snaps down on a heavy spring; 8–12 shard particles fly outward
and fade; a red flash (opacity spike) on the frame of impact; a short camera-style shake.

**Push-in reveal (for a photo / hero image)**
Image enters scale 1.06→1.0 + opacity 0→1, then a continuous slow Ken Burns drift; a
vignette deepens slightly; a lower-third title card slides up to meet it.

**Sweep / scan (for "analyzing / searching")**
A beam sweeps left→right across the subject; whatever it passes lights up in sequence;
a counter tallies what's found; the beam parks at the end and pulses.
