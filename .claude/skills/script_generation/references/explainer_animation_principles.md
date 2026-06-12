# Universal explainer-animation principles (any topic)

The 20 principles every explainer animation must design against — AI, programming, history,
finance, science, business, startups. Topic-agnostic. These are the **content/meaning** layer
of animation (what the shot must DO), sitting above the motion-physics (`animation_principles.md`)
and the director/animator split. Grounded in show-don't-tell as the primary language of
animation, controlled-reveal sequencing, and cognitive-load reduction (AWN; Binus DKV;
data-storytelling motion-graphics practice; Kurzgesagt method).

Read this BEFORE writing any scene's `what happens` beats. Each principle has the **diagnostic
question** to ask of every beat.

---

## The 20 principles

1. **State change** — every shot must CHANGE something (small→large, whole→broken, A→B). 
   *Ask: "What changed in this shot?" If "nothing" → the shot is weak.*
2. **Cause → effect** — show the chain, not the conclusion (revenue drops → cash gone → layoffs → failure), so the viewer understands WHY. *Ask: "Is the causality visible, or just stated?"*
3. **Action over labels** — animate VERBS, never nouns. Not "Innovation / Growth" — show the factory speed up, orders increase, output double. *Ask: "Am I animating a thing, or a thing DOING something?"*
4. **Show, then tell** — the visual reveals it FIRST (empty store, bills piling up), narration confirms after. Viewer discovers, then is told. *Ask: "Does the picture land before the words explain it?"*
5. **One idea per shot** — one focus per beat; never 5 concepts at once. *Ask: "What is THE one thing here?"*
6. **Physical metaphor** — make abstractions physical (context→backpack, debt→weight, competition→race, memory→notebook, growth→balloon). *Ask: "What real object is this like?"*
7. **Transformation** — a scene starts and ends DIFFERENT (problem → transformation → solution). Viewers remember transformations. *Ask: "Is the end-state visibly different from the start?"*
8. **Visual hierarchy** — every frame has a primary, a secondary, a background; the eye knows where to look in <0.5s. *Ask: "Where do my eyes go first?"*
9. **Progressive reveal** — build the diagram part-by-part (1 → 2 → 3 → whole), don't dump it whole. *Ask: "Am I revealing in steps, or all at once?"*
10. **Character / agent** — a person/robot/mascot/object-with-personality beats a chart for memorability. *Ask: "Can an agent carry this instead of a graph?"*
11. **Comparison** — learning happens through contrast (before vs after, slow vs fast, old vs new, wrong vs right). *Ask: "What is this AGAINST?"*
12. **Accumulation** — if something GROWS, show the growth (1 → 5 → 20 → 50 messages), don't say "it got large." *Ask: "Is the increase shown as it builds?"*
13. **Reduction** — if something SIMPLIFIES, show it shrink (50 files → 10 → 1), don't say "we optimized." *Ask: "Is the decrease shown happening?"*
14. **Invisible → visible (the core job)** — animation's whole purpose is to make invisible systems visible (packets, CPU ops, AI reasoning, supply chains, token consumption). If the audience can already see it, animation adds little. *Ask: "What invisible thing am I making visible?"*
15. **Mute test** — audio off, can a viewer roughly understand? If no, the animation carries too little. *Ask: "Does it read muted?"*
16. **10-second rule** — every 5–10s something MEANINGFUL happens (new question / reveal / transformation / comparison) — meaning, not just movement. *Ask: "What new meaning lands in this 10s?"*
17. **Narrative question** — each scene answers ONE question (why did this happen? how does it work? what's the problem/solution? what changes?). 5 questions = confusing. *Ask: "What ONE question does this scene answer?"*
18. **Cognitive load** — the viewer tracks 1 thing (maybe 2), never 5. When the screen crowds → remove / hide / fade / collapse. *Ask: "How many things am I asking them to track?"*
19. **Motion with purpose** — no motion-for-motion's-sake (spinning icons, bouncing arrows). Every movement teaches. *Ask: "What does this motion explain?"*
20. **Emotion** — the best explainers make the viewer FEEL (confusion, relief, surprise, pressure, frustration, satisfaction). Learning without feeling = low retention. *Ask: "What does the viewer feel here?"*

---

## The Universal Animation Review Scorecard

Run on EVERY scene (script-side) and re-run at frame-inspection (render-side). A scene should
hit most of these; the **bold four are non-negotiable** (their failure is the "sparse, explains
nothing" render):

```
□ Does something TRANSFORM?                         (1, 7)
□ Is CAUSE/EFFECT visible?                           (2)            ← non-negotiable
□ Is ACTION shown instead of labels?                 (3)            ← non-negotiable
□ Is there ONE focus?                                (5, 8, 18)
□ Is there a COMPARISON?                             (11)
□ Is GROWTH / REDUCTION visible (if quantity changes)?(12, 13)
□ Is an INVISIBLE system being revealed?             (14)           ← non-negotiable
□ Can it be understood MUTED?                        (15)           ← non-negotiable
□ Is motion MEANINGFUL?                              (19)
□ Does the viewer FEEL something?                    (20)
```

**Gate:** any non-negotiable unchecked → the scene FAILS, redesign it. < 6 of 10 total → REVISE.

---

## How this would have caught the claude_code_limits S1 failure (2026-06-10)

The first build of scene 1 was a thin usage-bar + a command on empty canvas. Against this
scorecard it fails almost every box:
- ❌ **Action over labels** — it animated a NOUN (a "meter"), not the VERB (the command
  *consuming* the budget). #3 violated.
- ❌ **Cause/effect** — command and meter sat in separate regions, unlinked. #2 violated.
- ❌ **Invisible→visible** — token consumption (the actual invisible thing) was never shown as
  units being eaten; just an abstract bar shrinking. #14 violated.
- ❌ **Mute test** — muted, "a command and a bar going down" doesn't explain the point. #15.
- ⚠️ thin bar on empty field → no hierarchy/density (#8), nothing really transforms beyond a
  number ticking (#1 weak).

**The fix the scorecard forces:** show the budget as a **grid of units** (invisible→visible),
have the command **visibly consume/drain a third of them** (action + cause→effect), with the
disproportion felt (emotion) — dense, causal, self-explaining. That is the difference between
"displays" and "explains."

---

## The SCENE-DESCRIPTION template — WHERE / WHAT objects / WHAT moves / WHAT changes

Before the beats, describe each scene like a **film shot**, not a sentence. "Claude reads login.ts"
tells the animator nothing — *are we in VS Code? a terminal? a diagram?* The viewer's first
question is always **"where am I and what am I looking at?"** (this is exactly why earlier scene 1
felt abstract — no established place). Answer four things per scene; then the animation almost
designs itself:

1. **LOCATION (WHERE are we?)** — the setting, established + held: e.g. `VS Code workspace` ·
   `Claude Code terminal` · `Context-window visualization` · `Split-screen Dev A vs Dev B`. Pick ONE
   and keep it for the scene so the viewer is oriented.
2. **CAMERA** — `screen-recording style` · `wide` · `close-up` · `top-down`. How we view the location.
3. **VISIBLE OBJECTS (WHAT exists?)** — the named objects on screen: e.g. `login.ts editor`,
   `Claude Code terminal`, `Context Window panel`, `usage gauge`. List them — this is what the
   animator builds.
4. **ACTION (WHAT moves?)** — the beat sequence: `user types "> fix login bug" → Claude opens
   login.ts → login.ts flies into the Context Window`. (verbs, flow)
5. **STATE CHANGE (WHAT changes?)** — Before → After: `Context 2% → 12%`. No state change = no
   animation.

Write this as a scene-setting header, then the beats become the ACTION + STATE CHANGE inside that
established place. Example:

```
SCENE 1
Location:  VS Code workspace
Camera:    screen-recording style
Visible:   login.ts editor · Claude Code terminal (docked below) · usage gauge (top-right)
Action:    user types "> fix login bug" → Claude scans files → login.ts, auth.ts fly in
State:     usage gauge 100% → 67% (a third drained)
```

**The 4 questions, every scene:** *WHERE are we? WHAT objects exist? WHAT moves? WHAT changes?* If
those four are clear, the animation is unambiguous — and the scene description is often **more
important than the narration**, because it's what the visual is built from.

---

## NO NARRATION ON SCREEN — VISUAL-FIRST, text is LABELS ONLY (the slide-deck killer)

If a scene is understood by *reading text on screen*, it's a slide deck with motion, not animation.
**70–90% of viewer understanding must come from the VISUAL** (object movement, transformation,
comparison, highlight, cause→effect); only **10–30%** from text. **Never put a narration sentence /
paragraph on screen.** On-screen text is limited to: **labels · metrics · short callouts (1–4 words) ·
UI element names · before/after tags · error messages · counters.** A row of sentences, a checklist of
phrases, two columns of statements = FAIL (that's reading, not watching).

Every scene must answer (in the VISUAL, not text): **(1) What is moving? (2) What is transforming?
(3) What is being compared? (4) What is the viewer looking at? (5) What visual PROOF supports the
narration?** If a concept can be shown, SHOW it — don't write it.

| ❌ text-as-animation (slide deck) | ✅ visual demonstration (labels only) |
|---|---|
| narration sentence types in / highlights word-by-word | the thing the sentence describes HAPPENS on screen |
| a 6-row checklist of habit phrases | a context pile that visibly SHRINKS as each habit fires (label: the habit, 2–3 words) |
| two columns of myth/truth sentences | a meter that DOESN'T move when you trim the prompt, then JUMPS when context loads (labels: "trim words", "CONTEXT") |
| "Claude reads your codebase" as text | files fly into context, a token counter climbs, relevant files glow (labels: "Scanning", "Context Retrieved") |

**The test:** delete every word of on-screen text longer than ~4 words. Is the concept still clear from
the motion? If no, the scene is text-carried → redesign it as a visual demonstration. (Real failure,
claude_code_limits S8/S9: a habit checklist + myth/truth columns — read like subtitles; the bars/meter
did the work, the sentences were narration on screen.)

---

## THE VIEWER'S-EYE — design for comprehension (the gate that overrides everything)

An animation exists to be UNDERSTOOD by a viewer, audio off, who has never seen it before. Design
every beat from inside that viewer's head, not the author's. Four research-grounded rules (Kurzgesagt /
Vox flat-explainer practice + cognitive-load theory — the brain has limited processing, abstract
overwhelms, recognizable cuts the load):

1. **Make it LOOK like the real thing — recognizable/tangible, not abstract shapes.** A viewer must
   name what each element IS at a glance. A chat must look like a **chat** (message bubbles with text:
   *you* right, *Claude* left), a file like a **file** (name + lines), a terminal like a **terminal**
   (prompt + output), a budget like a **gauge/tank**. Bare coloured rectangles labelled with one tiny
   word ("you", "ctx", "node") FAIL — the viewer sees "blue and purple bars," learns nothing. Recognizable
   beats realistic; flat + clear + labelled, but unmistakably the real object. (Real failure: S3 "you/claude"
   colour bars — rendered fine, made no sense; fixed by drawing an actual chat with message text.)
2. **Visual hierarchy — ONE primary gets prominence; support stays subdued.** Guide the eye to the single
   thing that matters this beat (size, contrast, motion, position). If everything is equally bright/big/
   moving, the viewer doesn't know where to look → nothing lands. Hero loud, context quiet.
3. **Motion EXPLAINS, synced to the point — never decoration.** Every movement must carry meaning the
   viewer reads (the sweep IS the re-read, the drain IS the cost). Motion with no meaning is noise that
   adds load. If you can't say what a motion teaches, cut it.
4. **One idea at a time — respect limited viewer processing.** Reveal one new thing per beat; build up,
   don't dump. A frame doing three things at once teaches none of them.

**The test (run on every beat, in the VIEWER's words):** freeze the midpoint, audio off — *"what do I
think I'm looking at, and what's the point?"* If the honest answer is "some coloured bars… usage went
down?" it FAILS. A beat must be recognizable, hierarchical, meaningfully-moving, and single-idea — or
the viewer doesn't get it, no matter how cleanly it renders. (This is the authoring side of the
vg-verification-protocol "VIEWER-SENSE TEST.")

---

## The animation-generating script formula — Cause → Effect → Cost (write THIS, not abstract narration)

The biggest authoring mistake: write abstract narration first ("Claude has a context window… it
re-reads… it uses tokens"), THEN try to invent animation → you get decorative, disconnected motion.
Instead, **write every beat so the animation already exists inside it.** The formula:

> **Cause → Effect → Cost** — *someone does something, to something, which visibly changes
> something — and you show what it cost.* (i.e., "Someone doing something to something which
> changes something.")

If a beat is written this way, the animation is automatic and REAL. Eight levers make it concrete:

1. **State change** — every line CHANGES something on screen ("Claude forgets the reply" → the reply *fades*, not "Claude has no memory").
2. **Container** — give the idea something that fills/drains (context window, backpack, queue, fuel tank): "user adds a file → the container grows."
3. **Flow** — things MOVE ("files *flow into* context": `login.ts ──▶ context`), not "Claude reads files."
4. **Before / After** — Before (context 10%) → action → After (context 60%); the contrast teaches.
5. **VISIBLE COST (the strongest for this domain)** — every action carries its number on screen:
   `read login.ts → +400 tokens`, `run tests → 3,000 log lines → +6,000 tokens`. Showing the
   per-action cost is what makes "where did my usage go?" concrete instead of a vibe.
6. **Living objects** — the SAME objects recur all video (usage meter, context window, conversation
   history) and become *characters* the viewer knows — never a fresh metaphor per scene.
7. **Cause → Effect → Cost** — the per-beat chain: `"fix login bug" → reads 3 files → context grows
   +Xk`; `"try again" → re-reads everything → usage +Yk`. The animation falls out of the chain.
8. **Physicalize everything** — abstract → physical object: usage → a draining fuel tank/meter;
   memory → a notebook; context → blocks stacking. Never the abstract word; always the object acting.

**The Golden Rule (the mute test, quantified):** for every scene ask — *"if the narration vanished,
would a viewer still understand ~70% of what's happening?"* If no, the beat is too abstract: rewrite
it as Someone-does-something-to-something-with-a-visible-cost. A beat that animates a noun changing
(a grid recolouring) with no ACTOR and no visible COST fails this — that's "decorative motion," not
explanation.

---

## The 4-level model — design every shot at all four levels at once

Top-tier explainers (Fireship, Johnny Harris, Veritasium, Lemmino, Branch Education, Kurzgesagt)
think at four levels *simultaneously*. **Most people only think about Level 4 (motion) — that's
why their animations move but don't feel great.** Climb the levels for every shot:

- **LEVEL 1 — STORY:** the scene answers ONE question · has tension (what / why / how) · has a
  transformation (the viewer AND the visual state go from "doesn't know" to "knows", start ≠ end).
- **LEVEL 2 — INFORMATION:** show **cause → effect** (never just the result) · show **process,
  not outcome** (message→message→message→huge context, not "context became huge") · reveal the
  **hidden/invisible system** (CPU, AI, memory, packets, economics) · make abstract things
  **physical** with a consistent metaphor.
- **LEVEL 3 — VISUAL DESIGN:** **one focus per frame** (eye knows where to look in 0.5s) ·
  controlled **eye flow** (prompt → Claude → files → usage, never random jumps) · **remove visual
  noise** (any icon/label/arrow that doesn't teach) · **size = importance** (hierarchy) · **ONE
  consistent metaphor** per concept (never backpack→bar→meter→pie for the same thing).
- **LEVEL 4 — MOTION:** motion must **teach** (motivated by a meaning change, never spin-for-spin)
  · prefer **transformation** (A morphs into B: chat→notebook, prompt→task) · animate
  **relationships**, not just objects (A *depends on* B — beginners animate objects, experts
  animate relationships) · animate **decisions** (watch the choosing: wrong → wrong → right) ·
  show **accumulation** (1→5→20→40, not 40) and **reduction** (2000→500→50→1) · show
  **consequences physically** (backpack gets heavier, worker slows — not "usage increased").

### Timing
- **New information every 5–10s** (question → reveal → question → reveal).
- **Hold the important moment** — let the discovery land; don't rush the reveal.
- **Compress repetition** — if an action repeats (read page, read page, …), speed up later repeats.

### The four tests (every scene)
- **Mute test** — muted, can you roughly follow what's happening?
- **Screenshot test** — pause ANY frame: can a viewer understand that frame alone?
- **Child test** — could a smart 12-year-old understand this visual? (no → too abstract)
- **Memory test** — in 24h, what's remembered? (metaphors, comparisons, transformations, stories
  — never labels). Design for what survives a day.

---

## Per-shot Production Checklist — run on EVERY beat

```
□ What is the viewer looking at?
□ Why are they looking there?            (one focus + eye flow)
□ What CHANGED?                          (state change)
□ What CAUSED that change?               (cause → effect)
□ What did the viewer LEARN?             (the one question answered)
□ Could this be understood MUTED?
□ Is there only ONE focus?
□ Is the motion TEACHING something?      (motivated, not decoration)
□ Is this showing PROCESS (not just outcome)?
□ Is this showing CONSEQUENCE (physical)?
□ Is there a TRANSFORMATION (start ≠ end)?
□ Is there visual CLUTTER to remove?
□ Is the metaphor CONSISTENT with the rest of the video?
□ Is the animation emotionally FELT?
□ Will the viewer REMEMBER this tomorrow?
```

A shot that scores high here is a **premium explainer animation**, not a collection of moving
icons and text. The sharpest levers beginners miss: **animate relationships and decisions**
(Level 4), **show consequences physically**, and the **screenshot test** (every frozen frame
must communicate on its own).
