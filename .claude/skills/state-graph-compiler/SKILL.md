---
name: state-graph-compiler
description: STAGE 9 of the Visual Story Engine. Converts every scene into typed WORLD STATES — a discrete, declarative snapshot of every object's properties (position, size, visibility, color/accent, value, lifecycle state) at each key moment of the scene. Turns the World Model + Object Library into the State Graph: an ordered list of typed states per scene that the event-graph-compiler will connect with transitions. Input = World Model. Output = the STATE GRAPH. Runs after object-library-engine, before the event-graph. Owns "what is TRUE on screen at each moment", not the transitions between states (event-graph-compiler).
when_to_use: Use after the object library to snapshot each scene as a sequence of typed world states — the declarative before/after every beat operates on. Owns the per-moment truth of the scene.
model: opus
---

# state-graph-compiler — World Model → State Graph (STAGE 9)

The world model says WHAT objects exist; the story says they must CHANGE. Before you can describe a change
you need a precise BEFORE and AFTER. This stage compiles each scene into **typed world states** — declarative
snapshots — so every later change is a well-defined `stateN → stateN+1`, never a vague "it animates."

## What a world state is (the typed snapshot)

A state is the complete, declarative truth of the scene at one moment: for **every** object on stage, its
typed properties —
- **presence** — on screen or not (visible / hidden / not-yet-entered / exited);
- **transform** — position (as fraction of canvas), size, rotation, depth-plane;
- **identity props** — accent color, material, lifecycle state (from the object library's state machine, e.g.
  `map: folded`);
- **value/label** — any number or label welded to the object and its current value;
- **emphasis** — is it the current focus (lit/foreground) or quiet (dim/background).

A state is a *noun* (the scene frozen), never a *verb*. If you're describing motion, you're in the wrong
stage — that's the event graph.

**EXCEPTION — a state may carry a RUNNING PROCESS (steady-state ≠ static).** The reference-grade beat the
old model couldn't express: a mechanism OPERATING in a loop (a payload travels a circuit → a station
processes → a tally emits, repeating) is a *steady state* — no snapshot-level diff, yet the world is
visibly running. Model it as a state property: `process: {object, circuit (station ids), emits (tally
target), rate}` on the state that holds it. Without this field, "no diff = no event" DELETES mechanism
beats (the documented arrivals-only script bug, `feedback/learning.md` §D.1) — a beat whose narration
describes per-unit/rate behavior ("each X…", "every token…", "keeps…") MUST set `process` on its state.

## How to compile a scene into states

1. **Enumerate the key moments** — one state per beat boundary (the settled frame the beat arrives at, plus
   the scene's opening state and final state). A 3-beat scene ≈ 4 states (open → beat1 → beat2 → final).
2. **For each moment, write every object's typed props** — completely. An object not mentioned in a state is
   assumed unchanged from the prior state (declarative inheritance), but the HERO and any changing object
   must be fully specified in both the before and after states.
3. **Anchor to the object library's lifecycle** — each persistent object's lifecycle-state in this scene's
   states must be a valid step of its state machine (you can't jump `folded → burned` if `opened` is between).
4. **The opening state must be reachable** — for a persistent object, its opening state = its exit state from
   the prior scene (continuity is the object-continuity-engine's job, but the states must be consistent with it).

## Why typed states matter (what they buy the pipeline)

- The event graph derives `state → event → state` mechanically — no ambiguity about what changed.
- Continuity can be checked (does object X's exit state in scene 2 = its entry state in scene 3?).
- The render is deterministic: the same typed state always produces the same frame.
- A "nothing changes" beat is caught HERE — if `stateN` equals `stateN+1` for the hero, the beat has no event.

## The State Graph (your output — the typed artifact stages 10 & 12 consume)

Per scene: an ordered list of typed world states (opening → per-beat → final), each fully specifying the
hero + any changing object and referencing the object library's identities/lifecycle. This is the
declarative backbone the event-graph-compiler turns into transitions and the object-continuity-engine checks
across scenes.

**Your diffs EXPORT — they no longer die in-memory.** Each adjacent-state diff becomes the contract's
`semantics.transitions` (object · from · to · cause) at stage 24, so the renderer receives the typed
before/after instead of re-deriving it from prose. A state graph that exists only in this session's context
is the documented "rich text" failure — compile it knowing it ships.

## Boundary

You own the declarative per-moment TRUTH (the states). You do NOT describe the transitions between them
(`event-graph-compiler`), the operators that perform them (`motion-operator-engine`), or cross-scene identity
(`object-continuity-engine`). States are nouns; hand them forward.
