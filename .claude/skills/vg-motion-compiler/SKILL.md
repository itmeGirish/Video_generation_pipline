---
name: vg-motion-compiler
description: The MOTION COMPILER — the layer between the story script and the Remotion codegen. Reads each bullet's STORY beat (event/change/result/sync, written by the writer) + the scene's cast (object graph) + the motion system, and INFERS the motion grammar (el/op/topology/params/token) automatically. This is what lets writers author STORY ("the table tears apart") while the renderer gets deterministic motion grammar ("Transform·shatter") — the separation that keeps videos cinematic instead of forcing writers to author YAML animation specs. Use in Phase 2, AFTER the script's story beats exist and BEFORE per-bullet codegen, to translate story → motion grammar.
when_to_use: Phase 2, between the canonical script (story beats) and per-bullet codegen. Run per scene to compile every bullet's event/change/result into the motion: grammar the codegen builds React from. Pairs with vg-remotion-engineering (the grammar/target), scene-composer (the story input), vg-render-code (consumes the output).
model: opus
---

# Motion Compiler — story (what happens) → motion grammar (how it moves)

The script is **story**. The render needs **motion grammar**. This skill is the layer that translates one
into the other — so the **writer never authors `op/topology/params`** (that kills storytelling) and the
**renderer never guesses from prose** (that's non-deterministic). Four layers, three owners:

```
L1  narrative event   ← the WRITER (script):   "the table tears apart"            (scene-composer)
L2  visual intent          ← the COMPILER:      "destructive separation"
L3  motion grammar         ← the COMPILER:      op: Transform · topology: shred
L4  params                 ← the COMPILER:      gravity 0.8 · stagger 6f          (render tunes within tokens)
```

The writer owns **L1 only**. You (the compiler) own **L2→L4**: read the story + the cast + the motion
system, and emit the parseable motion grammar. The codegen (`vg-render-code`) then builds **dynamic React**
from your grammar. That is the AAA-pipeline separation — *story · motion grammar · code* — not all three
crammed onto the writer.

---

## Input → Output

**INPUT (per bullet)** — the writer's story beat (from the canonical script) + the scene context:
```
event:  the table enters the shredder
change: rows tear apart · headers detach · the answer cell falls loose
result: the structure is gone
sync:      "drop it entirely"
intensity: impact          # how BIG (emphasis dial → camera/scale/glow/cue) — rule 7
animation_pattern: cascade # how it FLOWS (choreography dial → choreo/stagger/order) — rule 4
# + the scene's CAST (object graph, from <!-- SCENE DESIGN --> CAST) and the through-line
```

**OUTPUT** — the motion grammar as an **EVENT-MARKER TIMELINE**. This is the data model (confirmed by
research on phrase-synced motion: *event markers mark the points where motions trigger; as playback
reaches each marker the animation actions fire, in order*). Each row is **one event marker**:

- the **`sync:` phrase IS the marker** — the verbatim narration words the row fires on (runtime
  `findWord(phrase)` → start, `findWordEnd(phrase)` → end of a sustained move);
- everything else on the row is the marker's **`do:` — a DYNAMIC grammar tuple** `{el, op, topology,
  params, token}`, composed fresh per scene. **Never a named action-template** (`slam18`, `tearTable`) —
  a named template is the static-template trap; the codegen builds bespoke React from the tuple.

Rows are emitted in **narration order**, and **one phrase can carry several rows** — a beat's
setup→action→payoff each fire on a different spoken word (the multi-anchor micro-sync, rule 5). The
canonical emitted form is the parseable `motion:` block (`source_parser.py` `_extract_motion_ops` →
`AnimationBullet.ops`); the `sync:` field is what makes it a timeline.

```yaml
motion:    # event-marker timeline — fires top→bottom as narration reaches each sync: phrase
  - {el: table,      op: Transform, topology: shred,  params: {split: rows, stagger: 6f, gravity: 0.8, tilt: 8deg}, token: settle, sync: "drop it entirely"}
  - {el: headers,    op: Move,      topology: detach, params: {dir: up},      token: glide, choreo: lead-follow}   # same beat, follows
  - {el: answerCell, op: Move,      topology: drop,   params: {gravity: 0.9}, token: settle}                       # same beat, follows
```

Read the same thing phrase-first (the conceptual `audio:` view — markers grouped by the word they hit;
the emitted form above is the parseable serialization of this):
```
audio:   # which spoken phrase triggers which do:
  - phrase: "drop it entirely"   do: {el: table, op: Transform, topology: shred, params: {...}, token: settle}
  - phrase: "headers float off"  do: {el: headers, op: Move, topology: detach, ...}
```

You write the grammar to the bullet's `motion:` block (or its sidecar) for the codegen; the writer's
`.txt` keeps the story.

---

## THE SHOT-SHEET IR — the deterministic expansion (beats → shots → microbeats, per-object, dependency-chained)

The flat `motion:` rows above are the SPINE; the **shot sheet** is the full IR the codegen builds from — the
layer that makes the render *deterministic and reusable* instead of hand-improvised. **This is the
compiler's job, NOT the script's:** the writer stays in story (`event/change/result/sustain/carry`); YOU
expand it here into shots, frames, per-object specs, and the dependency graph. Four expansions:

### 1. SUBDIVIDE the beat into SHOTS → microbeats, with FRAME RANGES (you derive frames; the script can't)
A beat is not one move — it's a tiny sequence of shots (`lift · tile · orbit · read · reveal`), each a few
microbeats. **You own the frames** because you have the audio: anchor each shot's start to its `sync:` word
via `findWord`, then lay microbeats inside it scaled by the `token` duration (`instant 6f · fast 12f · base
20f · slow 35f`). The script never carries frames (timing is TTS-derived) — the compiler emits them:
```yaml
shots:                          # one beat → N shots; frames are bullet-relative, derived from findWord + token
  - shot: lift   frames: [0,18]    anchor: "what if it just looked"   # page rises
  - shot: tile   frames: [18,40]   anchor: "tiles that keep the layout"
  - shot: orbit  frames: [40,72]   anchor: "reads the whole picture"
  - shot: reveal frames: [72,96]   anchor: "it just looked"           # the amber cell blooms
```

### 2. PER-OBJECT spec on every row (material · physics · anchor/pivot/z · bounds)
Extend each `do:` tuple with the object's physical identity, so the codegen doesn't guess weight/pivot/depth:
```yaml
  - {el: page,  op: Enter, topology: rise, params:{dist:0.06h}, token: settle,
     material: paper,  physics:{weight: 2.0, drag: 0.18},  anchor: bottom, z: 3,  bounds: stage}
  - {el: lens,  op: Move,  topology: orbit, params:{radius:0.2w}, token: glide,
     material: glass,  physics:{weight: 0.4, spring: 0.8},  pivot: center, z: 8}
  - {el: count, op: Reveal, topology: count, params:{to:40}, token: pop,
     material: ink,    physics:{bounce: 0.6},               anchor: center, z: 6}
```
`material` picks the easing + light behaviour (catalog: `vg-code-composition` §materials — paper flutters/
bends · glass refracts + slides a specular · metal rigid + hard specular · glow massless soft · ink stamps).
`physics` is **per-object** (a 2kg page drags; a 0.4 lens springs) — not one global spring. `z` is the depth
index (paint order + parallax rate); `anchor/pivot` the transform-origin; `bounds` the stage region it stays in.

### 3. The DEPENDENCY GRAPH — primary DRIVES its reactions (not a flat list)
A premium beat is a *chain*: the primary fires, and reactions/camera/light/audio fire OFF it. Emit it
explicitly with `drives:` so the codegen couples them (read off the primary's progress var, lagged ~3f) —
this is what `vg-quality-animations` MOTION DENSITY counts:
```yaml
  - {el: page, op: Move, topology: dock, ..., id: P1,
     drives: [shadowFollow, keyBrighten, dustKick, camCompensate]}   # P1's progress drives these
  # reaction rows (no own sync — they trigger off P1, lagged):
  - {el: pageShadow, op: Move,    topology: follow, token: glide, trigger: P1, lag: 3f}
  - {el: keyLight,   op: Emphasize, topology: glow, token: glide, trigger: P1, lag: 4f}
  - {el: dust,       op: Emphasize, topology: drift, trigger: P1, lag: 2f}
  - {el: camera,     op: Camera,  topology: push, params:{amt:0.02}, trigger: P1}
  - cue: swell  trigger: P1                                          # the audio hit chains too (vg-sound-design)
```
Rule: the beat's **PAYOFF primary** drives 1–3 reactions (shadow/light/camera/cue) — the world acknowledges
the hit. Supporting rows drive NOTHING and stay still once landed. **ONE KINETIC FOCUS at a time:** at any
instant exactly one object (the current row's subject, or the scene's running `cycle` mechanism) is in
visible motion; everything else is settled. Reference-grade explainers are serial, not parallel — a frame
where several systems animate at once splits attention and reads as noise, not richness. (A primary with no
reaction at the PAYOFF is inert; a frame where everything reacts is equally broken.)

### 4. TIMING BUDGET + rhythm (per beat — not every object gets equal time)
Split the beat's frame span into **attention → explanation → payoff** (the eye lands, understands, then the
hit), and tag the rhythm so the cut isn't `motion·motion·motion`:
```yaml
budget: {attention: 0.2, explain: 0.5, payoff: 0.3}   # of the beat's frames
rhythm: hit-hold-breathe                               # vary it scene-to-scene (fast · pause · silence · hold)
```
The payoff window is where `intensity` spends its amplitude (the slam + glow + camera + `cue`); the attention
window is the entrance; the explain window is the sustain. (Budget derives from `intensity` × pace.)

**The shot sheet is the IR codegen consumes** (`vg-render-code` builds from it; `vg-quality-animations`
verifies the render matches it). It is still **emitted by the compiler from the story beat** — the `.txt`
never carries frames/params/materials. (If the compiler is run by hand today, produce this sheet per scene
*before* writing React, and build to it — that's what makes the motion deterministic instead of improvised.)

---

## How to compile — the verb → topology map (the core inference)

Each clause in `change:` (and `event`/`result`) carries a **motion-rich verb** → map it to `el` (the cast
object it acts on) + `op` (the grammar) + `topology` (the named behavior). The mapping (extend as needed;
full vocabulary in `vg-remotion-engineering` §THE MOTION SYSTEM):

Writers are told to use **physical verbs, not UI verbs** (`scene-composer`) — so the map below
favors physical verbs. If a writer slips a UI verb in (`docks/stamps/counter/marker`), still compile it,
but prefer the physical reading.

| story verb (what the writer wrote) | op | topology | typical params |
|---|---|---|---|
| tears apart · shatters · breaks up | Transform | `shatter` | split, groups, stagger, gravity, tilt |
| snaps · detaches · floats off · falls · spills | Move/Transform | `detach`/`drop` | dir, gravity |
| scatters · disperses · spills loose · multiplies | Transform/Enter | `swarm` | count, scatter, stagger |
| collapses · folds | Transform | `fold` | axis, segments |
| slices into a grid · tiles | Transform | `tile` | cols, rows, gap, lift |
| melts · dissolves · peels to text | Transform | `melt` | drip, speed |
| becomes · morphs into | Transform | `morph` | via (path/scale) |
| assembles · comes together · reassembles · is preserved | Transform | `assemble` | groups, stagger |
| locks · holds still · is preserved (no change) | Recolor/none | `lock` | (the contrast — often no force) |
| slides · travels · enters | Move/Enter | `slide` | dir, dist |
| each/every X · per-token · repeatedly · streams through · keeps running | Move | `cycle` | path (stations), period ≥1.5s, emit (tally) — the MECHANISM LOOP: one object runs the circuit repeatedly; the beat's honest hold-alive |
| floods · fills · grows to N · the bar climbs | Reveal | `fill` | axis, to |
| the number races / climbs to N | Reveal | `count` | to, decimals |
| a line draws · connects | Connect | `link`/`draw` | dir |
| pulses · throbs · breathes | Emphasize | `pulse` | amp |
| glows · ignites · blooms · lights up | Emphasize/Recolor | `glow`/`ignite` | color, intensity |
| dims · greys · fades out | Recolor | `dim` | to |
| push in / pull back / pan | Camera | `push`/`pull`/`pan` | target, amt |

**Rules of the compile:**
1. **One `change:` clause → one motion row** (usually). The verb picks op+topology; the object is the cast
   element the clause names.
2. **token** = the *feel* implied by the verb + the scene's pace: heavy/destructive → `settle`; a landing
   number/tag → `pop`; a calm enter/camera → `glide`. Keep it consistent with the rest of the video.
3. **params** = the structured knobs the topology needs, inferred from the story adverbs: "falls **loose**"
   → gravity high; "tear apart" → split:rows + tilt; "one by one" → stagger. The writer said "falls
   heavily" — you decide `gravity: 0.9`.
4. **choreo — driven by the writer's `animation_pattern` (the choreography dial).** The writer tags how the
   beat's clauses FLOW (`morph·domino·cascade·together·assemble·compare·escalate·conveyor·bloom`,
   `scene-composer`); you EXPAND that one word into the concrete `choreo`/`stagger`/ordering across
   the rows. This is what removes the "domino vs 4 cuts vs morph" ambiguity — the pattern is the *meaning*
   (a domino = causal launching; a morph = one transformation), so honor it exactly:

   | animation_pattern | how you compile it (the row choreography) |
   |---|---|
   | **morph** | ONE continuous `Transform` (use `via`); no discrete stagger between "stages" — interpolate straight through, no cut |
   | **domino** | `choreo: sequence`; each row starts as the previous LANDS (causal stagger = prior row's payoff frame) — the launching read |
   | **cascade** | `choreo: lead-follow` (or `together`)+ small uniform `stagger` (6–8f); same op/topology across the elements, in a wave |
   | **together** | `choreo: together`, `stagger: 0` — all rows fire on the same frame |
   | **assemble** | many `Move`→a shared center, `choreo: together`+slight stagger, settle into one body |
   | **compare** | two parallel tracks `together`; then `Emphasize` the winner — the scoreboard |
   | **escalate** | `choreo: sequence`; each row scaled/intensity up from the last (rising) |
   | **conveyor** | continuous `Move` along a path through the station anchors — one linear flow, not steps |
   | **bloom** | `choreo: together` + RADIAL stagger from a center point (center-out) |

   **Sequence order = the `change:` clause order — never reorder.** The writer wrote the clauses in execution
   order (`scene-composer`), so for `domino`/`cascade`/`escalate`/`conveyor` the first clause is the
   first row, top→bottom. You map clause-1 → row-1; you do NOT infer a different order.

   **Direction qualifier → the stagger FUNCTION (origin + spread).** A pattern may carry a one-word direction
   (`bloom from-center`, `cascade left-to-right`) — it's *semantic* (force/progress/discovery/organic), so
   compile it to the spatial stagger, not a new op:
   - `all-at-once` → `stagger: 0`, all rows same frame (the unified hit)
   - `left-to-right` → stagger ordered by each el's x (ascending) — a forward wave
   - `from-center` → RADIAL stagger: delay ∝ distance from the named/centroid origin (emergence)
   - `scattered` → randomized (seeded) per-el offsets within the window — organic, no single order
   No qualifier → the pattern's natural default (bloom=from-center, cascade=lead-follow order).

   **You own the stagger SECONDS — the writer never does.** Derive the actual gap from pattern × token ×
   intensity: a `domino` spaces each row at the prior's payoff frame; a `cascade`/`bloom` uses ~6–8f
   (`stagger` token), tightened on `impact`, lengthened/lingered on `climax`/`wonder`. The writer gave you the
   *pattern + direction + intensity* — the frames are yours to compute.

   **Camera target = the beat's most-emphasized el (its payoff / the scene's through-line), unless prose names
   another.** Default the `Camera` op to push/pull on that el (magnitude from `intensity`, rule 7). Keep the
   scene's through-line object (e.g. the amber answer-cell) at ≥ secondary emphasis on EVERY beat it's
   present — never let a callback object go under-lit (`scene-composer` declares it in the CAST).

   If the writer left it blank, infer the default from the verbs (a chain of consequence verbs → domino; the
   same verb on N elements → cascade; "becomes/into" → morph) — but a SET pattern always wins over inference.
5. **sync — auto-derive the MULTI-ANCHOR micro-sync (the compiler's job, NOT the writer's).** This is what
   turns the rows into the event-marker timeline: **each row's `sync:` is its marker.** The writer
   gives one main `sync:` and a `change:` of clauses **in narration order** — they do NOT tag each clause
   with a word. **YOU align them:** walk the narration's stressed phrases left→right and the change clauses
   in parallel, and assign each motion row the verbatim phrase it lands on (`findWord(phrase)`; run across
   `findWord(p)`→`findWordEnd(p)` for a sustained move). So one beat fires several sub-animations at
   DIFFERENT spoken words — the counter starts on the setup phrase, the slam on the payoff phrase — without
   the writer hardcoding anything. A single-clause beat → one sync. Every emitted phrase MUST be verbatim
   in this bullet's narration. The writer gives **exactly one** `sync:` (the memorable payoff) — never a
   list; YOU derive the in-between sub-anchors. Example (writer wrote only `sync: "eighteen percent"` + the
   two clauses):
   ```
   > Not by a rounding error. By eighteen percent.
   change: the counter starts climbing · then +18% slams in with a green flash
   → you derive:
     - {el: counter, op: Reveal,    topology: count, params: {to: 18},      token: base, sync: "rounding error"}
     - {el: tag18,   op: Emphasize, topology: glow,  params: {color: green}, token: pop,  sync: "eighteen percent"}
   ```
6. **el must be in the scene's CAST** — if the story names an object not in the object graph, that's a
   scene-design gap (flag it), not an invented element.
7. **intensity → the EMPHASIS treatment (the highest-leverage knob you compile).** The writer tags each
   beat's `intensity:` (`low·medium·impact·climax·wonder`, default `medium`) — the director's "how big is
   this moment." It is NOT a timing field; it scales the *weight* of the beat across every channel. Compile
   it to the treatment, applied to the beat's payoff row(s):

   | intensity | token | camera | scale / glow | sound cue (`cue:` — for `vg-sound-design`) | hold |
   |---|---|---|---|---|---|
   | **low** | `glide`/`fast`, small move | none | normal, no glow | — | short |
   | **medium** | `base`/`settle` | slight or none | normal | light sfx optional | normal |
   | **impact** | `pop`/`bounce`, fast | quick punch-in | scale spike + flash | `cue: sting` on the hit | brief |
   | **climax** | `settle`, deliberate, max amplitude | **push-in** | max emphasis, hero glow | `cue: swell+sting` | hold the frame |
   | **wonder** | `slow` settle | **pull-back / slow orbit** | bloom / soft glow | `cue: swell` + 1–2s pre-silence | long hold |

   Rules: scale the **payoff row** by intensity (don't inflate supporting rows); keep `token` within the
   film's set; emit a **`cue:` marker** on the row (`sting|swell|silence`) so the sound layer
   can stack the channel on the peak (`teaching-narrative-engine` "stack channels on the peaks"). One
   `climax`/`wonder` is a *peak* — treat it as the scene's hero moment, not a routine beat. `impact` is
   sharp/punchy (a hit); `climax`/`wonder` are sustained (the held reveal) — don't collapse them to the
   same treatment.

---

## Buildability + consistency (the two gates on your output)

- **BUILDABLE** — every `topology` must be a Remotion-native one (`vg-remotion-engineering`: interpolate /
  spring / transform / SVG / camera-wrapper). No physics engine — `gravity`/`tilt` are *faked* via easing +
  rotate. If a story verb implies real physics ("the glass shatters into 200 shards"), compile it to the
  buildable equivalent (`shatter` with `groups: 4`), don't emit an unbuildable op.
- **CONSISTENCY** — the SAME story verb compiles to the SAME topology everywhere (tear→shred always), and
  `token` stays within the film's set — so the whole video moves with one hand even though every scene's
  grammar is different. Same topology + different `el`/`params` = consistent, never templated.

---

## Where it runs + the contract

```
canonical script (story beats: event/change/result/sync/intensity/animation_pattern)  ← scene-composer
        │
        ▼   vg-motion-compiler  (story → grammar · intensity → emphasis · animation_pattern → choreography)
motion: grammar  {el, op, topology, params, token, sync, cue, choreo}  ← parsed by source_parser.py (AnimationBullet.ops)
        │
        ▼   vg-render-code + the vg-code-* recipes
dynamic React (Remotion)
```

- The writer's `.txt` is never edited to carry grammar — it stays story. The compiler emits grammar to the
  bullet's `motion:` block (or a sidecar the seed step reads).
- The grammar is **parseable + validatable** (op ∈ closed 9, topology ∈ the vocabulary, el ∈ cast) — run
  that validation as you emit, so a malformed compile is caught before codegen.
- The codegen builds **bespoke** React per `op·topology·params` — dynamic, not a template; `token` keeps it
  consistent.

### Always
- Read the writer's STORY beat — never ask the writer to write grammar
- Map each motion-rich verb → op + topology; infer params from the story's adverbs
- Keep the same verb→topology mapping across the video (consistency); keep token in the film's set
- Validate the emitted grammar (closed vocab; el in cast) before handing to codegen
- Compile over-reach verbs to their buildable equivalent (no physics engine)
- Compile `intensity:` → the emphasis treatment (camera/scale/glow/token/`cue:`) on the payoff row; treat one `climax`/`wonder` as the scene's hero moment
- Compile `animation_pattern:` → the row choreography (`choreo`/`stagger`/order); honor the writer's pattern exactly (domino = causal, morph = continuous), infer only when blank

### Never
- Push `op/topology/params` back onto the writer — that's the layer-mixing that kills story
- Emit a topology that isn't Remotion-buildable, or an `el` not in the scene's cast
- Re-interpret prose at codegen time — compile it to grammar first (deterministic)
- Invent a different feel per beat — token is the film-wide consistency layer
- Treat a `climax`/`wonder` beat like a routine one — under-emphasizing the peak is the flatline this dial exists to fix
- Expect a `sync:` list — the writer gives exactly ONE; you derive the in-between micro-anchors
