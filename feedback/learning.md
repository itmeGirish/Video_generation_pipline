# learning.md — pixel_rag_v2 final vs the reference video (second benchmark pass)

Compared: `projects/pixel_rag_v2/out/pixel_rag_v2_final.mp4` (6:51, the overhauled pipeline's output)
vs `documents/videoplayback.webm` (31-min professional explainer — the same reference as `lessons.md` /
`principles.md`). Frame sweeps: ours 1f/10s, reference 1f/40s, plus full-res spot checks. This file records
the **delta since the overhaul** — what visibly closed, what still separates us, and the defects found in
this specific master. Principles are generic (no topic hardcoding); scene numbers appear only as evidence.

---

## A. What the overhaul visibly FIXED (gaps from lessons.md that closed)

1. **An object world now exists.** The video is carried by physical things with fixed homes (a document, a
   machine, a scan-head, an index panel, a wall of tiles) that transform across acts — not text slides.
   The through-line object recurs and is re-lit at the close (the callback lands).
2. **Derive, don't assert — adopted.** Every load-bearing number is visibly produced from a prior on-screen
   number (factor chips → result → scaled → ratio). This was the reference's signature move and it now
   reads correctly in ours.
3. **Semantic color constancy holds.** Green/red/amber/cyan keep one meaning video-wide; the viewer learns
   the palette in act 1 and reads later scenes faster.
4. **A persistent progress spine.** The top-band case strip (five stops filling as proven) mirrors the
   reference's episode/series chips — the viewer always knows where they are in the argument.
5. **Pacing rhythm exists.** Interstitials + designed holds create act boundaries; the two dark interludes
   read as intentional breath, like the reference's title cards.
6. **Same-object contrast.** The two pipelines are compared on the SAME document (intact → destroyed →
   photographed → answered), which is the reference's strongest teaching pattern.

## B. The MAJOR remaining deltas (reference has it; ours still doesn't)

1. **Density of the running simulation.** Reference frames average 3–6 live instruments at once
   (utilization sidebars, pinned reference cards, axis-labeled charts, live counters, diagnosis strips) —
   the world feels like a machine that runs whether or not you watch. Ours averages 1–2 active elements on
   a large empty stage; the world still feels staged per beat. → Scene design should budget a PERIPHERY of
   small live instruments around the hero (pinned context card, running counter, status strip), not just
   the hero + one rail.
2. **Instrumentation language.** In the reference every quantity lives inside a labeled instrument: axes,
   units, tick marks, thresholds, annotated operating points. Ours renders numbers as chips/tags; only two
   real instruments exist (gauge, meter), and the bars/timers carry no scale marks. → Adopt "no naked
   number": a quantity's home is an instrument with axis/unit/threshold, not a pill.
3. **Light mastery / contrast as hierarchy.** The reference's dark stage makes glowing data the light
   source — hierarchy IS contrast. Our light paper world is a legitimate style but currently washes out:
   white-on-beige elements sit near the legibility floor (the sorted-pile documents read as blank cards at
   full res). → On a light stage, every content element needs a contrast floor (ink lines at ≥0.5 opacity,
   tinted fills, real borders); faintness may only come from opacity on a legible ink, never from
   near-white-on-white.
4. **Progressive annotation of ONE diagram.** The reference holds a single chart on stage for minutes and
   layers 8 successive annotations onto it (operating points, gap arrows, diagnosis chips) — the camera
   stays, the DATA evolves. Ours redraws a new stage per scene; only one morph (meter → scoreboard)
   carries an object across a cut. → Prefer annotate-in-place over re-staging; a diagram that survives
   three beats teaches more than three diagrams.
5. **Typographic scale range.** Reference payoffs tower: display numbers at ~20:1 over the label size
   (whole-frame verdicts), then instantly back to dense small mono. Ours lives in a narrow ~4:1 band, so
   payoffs never dominate the frame. → Give the one payoff number per act a display size that owns the
   frame (≥0.08–0.12 of width), with everything else dimmed under it.
6. **Micro-labels everywhere (the caption layer).** The reference annotates nearly every element with a
   tiny mono caption (what it is · its unit · its role), which is what makes dense frames still legible.
   Ours labels the hero but leaves supporting elements unnamed. → Every visible instrument gets its
   two-word mono caption; unnamed shapes fail the deaf-viewer test at density.
7. **The hero artifact is content-real.** The reference's chat window, token strips, and memory grids look
   like the real artifact down to plausible content. Ours got the main document right, but secondary
   artifacts (sorted documents, console) degrade to outline placeholders. → The "REAL legible content"
   rule must extend to EVERY artifact instance, not only the protagonist.

## C. Defects found in THIS master (2026-07-10 build — fix before any ship)

1. **Scene 11 final beat throws at runtime**: `BLOCK RUNTIME ERROR — inputRange must be strictly
   monotonically increasing but got [336,336]`, and the video's tail renders black after it. Cause class:
   an `interpolate()` whose two anchor-derived input points collapsed to the same frame after the rebuild
   re-derived the beat window (anchor-frame + offset chains must be strictly ordered; guard every
   `[a,b]` with `b = Math.max(b, a+1)`). Ship-blocker.
2. **Sorted-pile documents render as blank white cards** (inner layout strokes below the contrast floor on
   the light stage) — the act-3 rule beat loses its evidence. Same root as B.3.
3. Master-level gates that PASSED on this build for the record: audio-sync drift 35/35 in tolerance;
   layout validator 0 violations; non-silent audio (−20.4 dB mean); A4 freeze windows addressed by
   raising declared hold-alive systems to visibility (verify on next render).

## D. THE ANIMATION STRATEGIES OF VIDEO 1 — why its motion is "perfect" and video 2's isn't

Extracted from frame-by-frame sequences (1 fps over live segments), not stills. Seven concrete strategies,
each with the root cause of why video 2 lacks it:

1. **THE LOOP IS THE ANIMATION — a running mechanism cycle, not entrance tweens.**
   Video 1's core primitive is a repeating machine cycle: a block travels the bus → the compute floor
   pulses → a token chip appends → the cycle repeats, for 12+ seconds on one fixed stage. The viewer can
   study the mechanism on the 2nd and 3rd pass — THAT is why it explains. Motion demonstrates the concept
   operating; it is never "something arriving."
   *Why video 2 lacks it:* our motion vocabulary is one-shot ops (Enter/Transform/Emphasize/Exit). There is
   no LOOP/CYCLE primitive in the grammar, so every beat animates arrival once and then must "hold alive."
   → Add a `cycle` topology (travel→process→emit, repeating) to the motion grammar; prefer one running
   loop over N entrance tweens for any mechanism beat.

2. **ONE MOVER AT A TIME — serial attention, everything else frozen.**
   At any instant exactly one object moves; the rest of the frame is pixel-still. Events are acknowledged
   by a single small pulse, then stillness until the next event. The eye is never split.
   *Why video 2 lacks it:* our quality gates demand the opposite (≥8 live systems, hold-alive on every
   element, coupled secondaries on each primary) — video 1 would FAIL our motion-density gate. The gate
   optimizes busy-ness; the reference optimizes attention. → Re-aim the density gate at the PERIPHERY
   (dim, static-until-relevant instruments) and require ONE kinetic focus at a time on stage.

3. **TEXT NEVER MOVES WHILE BEING READ.**
   Every label/caption in video 1 enters fully-formed by fade and then never translates, scales, or ticks.
   No typewriters mid-scene, no labels riding moving objects, no text on springing cards. Type hierarchy
   (3 fixed sizes: tiny mono caps · body · towering display) does the emphasis work motion would do.
   *Why video 2 lacks it:* we attach captions to movers (a meter riding a scan head), typewrite text, and
   put text inside spring-overshooting cards — text in motion is text you can't read. → Rule: text enters
   AFTER its parent settles, detached from movers; typewriter only for terminal/console artifacts.

4. **NO OVERLAP BY CONSTRUCTION — the final composite is designed FIRST, then revealed.**
   Video 1 scenes are one pre-designed composite (every element has a reserved slot; generous void between
   zones) revealed progressively: each beat fades in the next occupant of an EMPTY reserved zone.
   Overlap is impossible because nothing is ever placed onto occupied space — reservation, not detection.
   *Why video 2 lacks it:* we author per-bullet with per-beat absolute coordinates and catch collisions
   AFTER with a validator. Prevention lives in the design step video 1 does and we skip. → Scene design
   must emit the settled FINAL FRAME layout (all beats' elements placed together, zones reserved) before
   any bullet is coded; bullets then only reveal it in stages.

5. **ENTRANCES ARE INVISIBLE — fade + a few pixels, ~0.3–0.5s, no physics.**
   Video 1 uses fade-in, small rises, draw-on lines, count-ups. No overshoot, no bounce, no scale-pops on
   content. The "premium" feel is surgical timing + restraint, so the MECHANISM's motion (strategy 1) is
   the only expressive movement on screen.
   *Why video 2 lacks it:* our recipes prescribe spring/overshoot/anticipation on every hero entrance, so
   arrival motion competes with meaning motion. → Reserve expressive physics for the per-act payoff only;
   default entrance = 10–14-frame fade+rise, ease-out, no overshoot.

6. **SCENE CHANGES: everything exits TOGETHER, then axes-first rebuild.**
   A cut in video 1 = the whole composite fades as one → beat of black → the next scene's FRAME (title,
   axes, empty instrument) draws first → data enters last. The viewer always meets an empty labeled stage
   before content populates it.
   *Why video 2 lacks it:* our REPLACE is a backdrop painted over the prior bullet mid-scene, and new
   stages arrive with content already animating. → Transition discipline: composite-out → skeleton-in
   (title/axes/zone frames) → data-in, as three ordered micro-phases.

7. **AMBIENT LIFE = THE MECHANISM, not decorative breathing.**
   What keeps video 1's long holds alive is the mechanism still cycling (the wave still oscillating, the
   block still traveling) — meaningful motion that can run forever. Nothing breathes for the sake of an
   anti-freeze detector.
   *Why video 2 lacks it:* our anti-freeze fixes add sine-breathes/shimmers to satisfy freezedetect —
   motion with no meaning, which reads as wobble at scale. → The A4 fix for a long beat is strategy 1
   (make the mechanism loop), never amplitude on decoration.

**The root cause in one sentence:** video 2 is authored per-bullet with gates that reward motion quantity,
so it produces many small arrivals; video 1 is authored per-scene as one designed composite where a single
running mechanism carries meaning — reveal is quiet, the loop is loud.

## E. The one-line takeaway

The pipeline now builds the reference's *bones* — object world, derivation chains, semantic color, a
progress spine. What still separates the two is the reference's *flesh*: a denser running world of labeled
instruments, one diagram annotated in place instead of restaged, towering payoff typography, and a hard
contrast floor so every artifact stays content-real. Those are authoring-level disciplines (scene design +
code recipes), not renderer limits.
