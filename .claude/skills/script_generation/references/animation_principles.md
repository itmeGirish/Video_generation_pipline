# Animation principles — the foundation for world-class motion (reference)

The deep "why" behind great animation, in four stacked layers. These are **principles, not
numbers** — apply the judgment; the right size/timing follows. Read this before designing a
scene's beats; it's the theory under `scene-composer` (composition, sequencing,
rhythm, density). World-class = all four layers true at once, timed to the voiceover.

A beat that feels "off / amateur" is almost always breaking one specific principle below —
name it, and the fix is obvious.

---

## GOVERNING RULE — purpose & restraint (read FIRST, overrides everything below)

**Apply these principles ONLY where they improve clarity, storytelling, or engagement.** They
are tools, not quotas. **Do not force a principle into every beat.** Every animation must have a
purpose: if a motion, transition, or effect doesn't help the viewer *understand* the concept,
*emphasize* a key moment, or *improve engagement* — **omit it.** Prioritize **clarity over visual
complexity**; a calm, clear beat beats a busy, principle-stuffed one.

This governs the whole reference, the density bar, and the rhythm rule: "rich" and "dense" mean
*as much as serves comprehension, and no more* — never decoration or complexity for its own sake.

**When to reach for each (conditional, not mandatory):**
- **Staging** — when attention needs directing to a specific element.
- **Timing** — always honor: visuals align with narration and stay on screen long enough to read.
- **Anticipation** — before an *important* reveal/transition/action, when it builds expectation. Not on minor beats.
- **Slow In / Slow Out** — on movement, so it isn't robotic. (Easing is cheap and almost always right.)
- **Secondary action** — only when it *reinforces* the main idea without distracting. If it competes, cut it.
- **Exaggeration** — only on the one beat that must land; everywhere else is restraint.
- **Squash & stretch / arcs** — when they add believable life to a real motion; skip on abstract/static elements.
- **Appeal** — keep frames clean and well-composed, but **add no unnecessary elements.**

**Don't punt on doubt — RESOLVE it.** "Unsure" is not a reason to drop something; it's a reason
to think it through. For any element or motion, run the purpose test: *what does this help the
viewer do — understand, emphasize, or engage?*
- If it HAS a purpose → keep it, and design it to serve that purpose *well* (the right treatment,
  not a vague version).
- If it genuinely has NONE → cut it, deliberately.
- If you can't tell → that's a signal the **beat's intent isn't defined yet** — go back and decide
  what this beat is teaching, then the element's fate is obvious.

Decide by the purpose test every time, never by a coin-flip feeling, and never ship a beat
left half-resolved. Resolve, then commit.

---

## DIVISION OF LABOR — the SCRIPT describes WHAT; the render is "the animator" (HOW)

The single most important rule for *writing*: **the script never names animation principles or
specifies low-level physics.** The script describes **what the audience sees and understands** —
a plain sequence of visual beats. The render (the `vg-code-*` recipes = "the animator") supplies
*how* the motion behaves (easing, arcs, settle, overshoot) automatically. **Principles EMERGE from
a well-described sequence — they are not authored by listing them.**

| Principle | Script specifies (in plain beats) | Render applies (automatic) |
|---|---|---|
| **Staging** | ✅ what to look at | |
| **Timing** | ✅ how long to hold the idea | |
| **Anticipation** | ✅ what happens *before* a reveal | |
| **Secondary action** | ✅ what supporting motion reinforces it | |
| **Appeal** | ✅ metaphor obvious in ~1s | |
| **Exaggeration** | ✅ *sometimes* (the one beat that must land) | |
| Slow-in / slow-out | | ✅ usually (easing) |
| Arcs | | ✅ usually |
| Follow-through / overlap | | ✅ usually |
| Squash & stretch | | ✅ usually |
| Solid design / pose-to-pose | | ✅ usually |

❌ **Animator language (WRONG in a script):**
> Apply anticipation, squash & stretch, follow-through, arcs, slow-in/out, overlapping, secondary action.

✅ **Storytelling language (RIGHT):**
> 1. The user prompt enters. 2. Everything freezes for a beat. 3. Branching paths rapidly expand
> from the prompt. 4. Most fade away. 5. One path brightens and becomes the response.

The ✅ version *naturally* uses anticipation (the freeze), staging (focus on the surviving path),
timing (the pause), secondary action (the fading branches), and appeal (clean hierarchy) — and the
render adds slow-in/out + arcs — **without the script naming any of them.**

**The 5 questions the writer answers per beat (the ONLY principles you specify — as plain beats):**
1. **What should the viewer look at?** → Staging
2. **What happens before the reveal?** → Anticipation
3. **How long does the viewer need to process this idea?** → Timing
4. **What supporting motion reinforces the point?** → Secondary action
5. **Is the visual metaphor obvious within ~1 second?** → Appeal

Write the answers as a **plain visual-beat sequence** (what appears / happens / changes). Do NOT
write springs, easing, arcs, damping, or principle names in the script — that's the render's job.
Layer 1 below is reference for *understanding* the physics; the script does not author it.

---

## Scene level — a scene is ONE continuous build, not a slideshow of beats

Above individual beats sits the SCENE. Top-quality scenes are designed as a single continuous
build, not a series of separate cards. This is the highest-leverage layer — get it wrong and no
amount of per-beat polish saves it.

- **Arc** — every scene **establishes → develops → reveals → resolves (payoff)**. It goes
  somewhere; the last beat lands the point the first beat set up.
- **One anchor visual that EVOLVES** — establish one diagram/object, then evolve it across the
  scene (a label changes, a highlight moves, an element is added) instead of wiping to new
  visuals each beat. **Continuity is the #1 thing separating "explanation" from "slideshow."**
- **Continuity through MOTION, not cuts** — connect beats by movement and shared elements
  (match-cut, element dock / carry-over, a value that persists). Movement-based transitions read
  as one flow; too many hard cuts break immersion. Reserve a clean cut for a real subject change.
- **Camera as a tool** — push in to focus on a detail, pull back to reveal context, let a beat
  begin mid-motion of the prior (visual glue). Whole-composition moves (scale/pan) guide attention
  and bind beats.
- **Staggered / overlapping action** — across the scene, elements enter, change, and exit at
  *different* times — never all at once — so the scene stays alive and the eye keeps moving.
- **Rhythm to the voiceover** — change in step with the narration's flow and emphasis; meaningful
  change as meaning is added; no dead air, no overload (rhythm at scene scale).
- **Build to a payoff** — the scene escalates to ONE clear takeaway/climax; reserve the strongest
  motion (exaggeration) for that one moment, keep the rest restrained.
- **Scene→scene transitions are deliberate** — carry an element across the cut, or use a motion
  transition (push / zoom / wipe), so the whole video flows as one piece, not a deck of slides.

In the script, this scene flow IS the **`what happens` beat sequence across the scene's bullets**:
a storyboard of how one anchor visual evolves from establish to payoff, each beat connected to the
next. Design the scene's flow first (`scene-planner` §anchor visual), then the beats.

---

## Layer 1 — The 12 Principles of Animation (believable motion)

*(For understanding only. The **bold director rows** are what the script implies via plain beats;
the rest are applied automatically by the render — see the Division of Labor table above.)*
Disney's foundation (Thomas & Johnston, *The Illusion of Life*), applied to our motion-graphics.

1. **Timing & Spacing** — *speed* + how the movement's distance is *distributed* give motion its
   weight, character, and emotion. Even spacing = mechanical; uneven = alive. → never move at a
   constant rate; ease.
2. **Slow-in / Slow-out** — things accelerate and decelerate; they don't start or stop instantly.
   → every reveal eases (out-cubic arriving, in-out travelling). Linear only for ambient loops.
3. **Anticipation** — a small wind-up precedes a significant action (pull back before the leap),
   giving the eye time to prepare. → a beat's hero "loads" before it bursts/lands.
4. **Follow-through & Overlapping Action** — parts keep moving after the main stop; elements
   settle/overshoot and trail; not everything halts on the same frame. → springs settle; staggered
   stops; a counter overshoots and settles.
5. **Squash & Stretch** — flexibility and impact; mass reads through deformation. → a hero number
   stretches as it arrives and squashes as it lands; a bar nudges on impact.
6. **Arcs** — natural motion travels along curves, not dead-straight lines. → entrances drift along
   a slight arc, not a ruler-straight slide.
7. **Staging** — direct the viewer's attention; present ONE clear action at a time with a readable
   silhouette. → one hero leads each beat; the rest support or hold.
8. **Secondary Action** — supporting motion that *reinforces* the main action (a glow pulse, a
   drift, particles on impact) without stealing focus. → always ≥1 alive supporting motion.
9. **Exaggeration** — push the key beat past literal so it lands emotionally (the slam is heavier,
   the number bigger). → the moment that matters is dialed up, not flat.
10. **Appeal** — clarity + charm; clean, confident, legible. → not busy, not noisy; designed.
- *(Straight-ahead vs pose-to-pose and solid drawing adapt loosely: build keyframe-to-keyframe
  with `interpolate`/`spring`; keep depth/weight consistent.)*

**The amateur tell:** linear motion (breaks 1+2), instant stops (breaks 4), no wind-up (breaks 3),
one-move-then-frozen (breaks 7+8). Fix = name the broken principle.

---

## Layer 2 — Composition (arranging a single frame)
- **One focal point** — the eye instantly knows where to look; rank everything (hero > support > labels).
- **Hierarchy & contrast** — biggest/boldest/most-saturated = most important; context recedes (dim/small/grey).
- **Reading path** — arrange so the eye flows in the order to be understood; alignment & leading lines carry it.
- **Grid & alignment** — shared grid, consistent margins; alignment is what reads as "designed."
- **Negative space** — empty space *frames* the hero (breathing room ≠ dead canvas; an unframed element in a void = dead canvas).
- **Gestalt grouping** — related elements grouped by proximity + shared style so structure parses at a glance.
- **Balance** — distribute visual weight; don't pile everything on one side.
- **Anchored context** — a persistent title/reference/unit keeps "what am I looking at?" answered (deaf-viewer test).
- **One consistent system** — reuse the same component styles + tokens everywhere (this is the `Kit`).

---

## Layer 3 — Sequencing (how a beat unfolds over time)
- **Staging in time** — one idea at a time; never reveal everything at once.
- **Order = meaning** — elements appear in the order they should be understood (cause before effect, scaffold before data).
- **Anticipation → action → settle** — wind-up, move, settle; never instant.
- **Cause-and-effect chains** — one element's motion triggers the next; the beat tells a micro-story.
- **Continuity over reset** — carry & evolve a visual across beats (match-cut / dock) rather than wiping.
- **Sync to meaning** — a thing enters/moves/climaxes as the narration reaches it; visual climax on the semantic climax.
- **Progressive disclosure** — scaffold → populate → conclude (payoff); never more than the viewer can read at once.
- **Rhythm** — the screen keeps changing in step with the meaning the narrator adds; no dead air, no overload.

---

## Layer 4 — Cognition (it's an EXPLAINER — learning theory governs)
Mayer's multimedia-learning principles — break these and the animation fails even if it's pretty.
- **Coherence** — cut everything that doesn't teach; decorative motion adds cognitive load, not understanding.
- **Signaling** — cue what matters *now* (highlight / isolate / dim the rest); guide attention explicitly.
- **Segmenting** — deliver one chunk at a time, paced to the narration (this is rhythm + progressive disclosure).
- **Spatial contiguity** — put the label ON the thing it names, not in a separate legend.
- **Temporal contiguity** — reveal the visual AS the word is spoken (sync-to-meaning / audio anchors).
- **Modality** — pair narration with a PICTURE, not with the same words on screen.
- **Redundancy** — don't dump the narration sentence as on-screen text; labels only.

---

## The synthesis (how to design a world-class scene)
1. **Voiceover first** — the narration sets all timing; anchor every visual to a spoken word.
2. **One anchor visual per scene** — design the scene as ONE diagram that EVOLVES across beats (Layer 3 continuity), not N separate visuals.
3. **Compose from the system** — build from reusable `Kit` components (Layer 2 consistency), passing data, not hand-authoring.
4. **Animate by the 12 principles** — ease everything, wind-up→settle, one hero + secondary motion, exaggerate the key beat (Layer 1).
5. **Keep cognitive load low** — show the picture, label on it, cut the decoration, one chunk at a time (Layer 4).
6. **Rhythm & restraint** — change in step with meaning; confident, clean, not busy (Layer 1 appeal + Layer 3 rhythm).

When a beat isn't world-class, diagnose by layer: *Is the motion linear/instant (L1)? No focal
point or unframed (L2)? Everything at once / no continuity (L3)? Decorative or text-dumped (L4)?*
That names the fix — never a magic number.
