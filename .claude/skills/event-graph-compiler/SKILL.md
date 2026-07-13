---
name: event-graph-compiler
description: STAGE 10 of the Visual Story Engine. Generates the State → Event → State transitions using the event grammar — for each adjacent pair of world states, the typed EVENT that carries the scene from one to the next (which object changes, from what to what, caused by what). Turns the State Graph into the Event Graph: the ordered, typed list of everything that HAPPENS. Input = State Graph. Output = the EVENT GRAPH. Runs after the state graph, before validation. Owns "what happens between states" as typed events, not the concrete motion operator (motion-operator-engine) or physics (physics-engine).
when_to_use: Use after the state graph to derive the typed events that transition each state to the next — the verbs of the scene. Owns the State→Event→State transition list.
model: opus
---

# event-graph-compiler — State Graph → Event Graph (STAGE 10)

States are nouns; the story is verbs. For every adjacent pair of world states, this stage emits the typed
**EVENT** that carries `stateN → stateN+1` — the declarative description of what happens, so the render has
an unambiguous list of every change, in order.

## The event grammar (each event is typed, not prose)

An event is a record:
```
EVENT
  subject:   the object that changes (the HERO or a prop — never a bare label; text rides on an object)
  subject_class: world-object | instrument   ← from the cast's `kind`: a PHYSICAL thing changing vs a
                                               panel/card/meter DISPLAYING a new value. Tag every event.
  from:      its property values in stateN        (the before)
  to:        its property values in stateN+1       (the after)
  kind:      the change class — Enter · Exit · Move · Transform · Reveal · Emphasize · Connect · Recolor · Camera
  cause:     what drives it (a prior event, a viewer-facing trigger, the narration anchor) — the "because"
  order:     its rank in the beat (what happens first / next) — one focus at a time
```
**Why `subject_class`:** a verdict card flipping blank→wrong is a legal Transform — and still a slide if
it's the only kind of change on stage. Instrument-state flips are information; world-object changes are
animation. The validator enforces a world-object floor per beat; tag honestly here.

**RELATIONSHIPS are legal subjects.** The most important change in a scene is often not an object but an
EDGE between objects — adjacency(label,value) going 1.0 → 0.0, a dependency strengthening, a link dying.
Emit these as events with `subject: relationship(edge)` and numeric from/to strengths; they export to the
contract's `semantics.relationships`. A binding dissolving expressed only as two objects drifting is the
weaker spec — the edge IS the teaching; make it the subject.
The `kind` is the abstract change; the concrete operator (shred vs morph vs tile) is chosen downstream by
`motion-operator-engine`. Here you only assert *that* the subject goes `from → to` and *why*.

## How to compile events from states

1. **Diff each adjacent state pair.** Every object whose typed props differ between `stateN` and `stateN+1`
   produces an event. No diff = no event (a held object emits nothing).
2. **Name the cause for each event** — the chain is `A → therefore B → therefore C`. An event with no cause
   is decoration; either give it a cause or drop it. Cause is what makes the scene teach, not just move.
3. **Order the events within a beat** — the attention path (one focus at a time). Events that must be
   simultaneous are flagged; most are staggered (lead-and-follow).
4. **The hero event per beat is a Transform / Move / Reveal / Recolor** (the subject changes STATE) — an
   Enter(fade) + Camera-only beat is a slide, not a shot. Flag any beat whose only events are Enter/Camera.

## The closed event kinds (the vocabulary — concrete operators come later)

`Enter/Exit` (rise·pop·sweep·fade) · `Move` (sweep·dock·travel·orbit) · `Transform` (shatter·shred·morph·
tile·extract·fold·assemble) · `Reveal` (fill·count·draw·wipe) · `Emphasize` (pulse·glow·shake·slam) ·
`Connect` (link) · `Recolor` (ignite·dim·flash·crumble) · `Camera` (push·pull·orbit·whip·macro·parallax) ·
**`Run`** (start/sustain a REPEATING mechanism cycle — the subject traverses its circuit and the cycle
repeats for the beat's span; sourced from the state's `process` field).
"APPEARS" (opacity 0→1) is a transition, allowed only for a supporting label — never the main event of a beat.

**`Run` is mandatory for process narration.** When a beat's narration describes per-unit, rate, or
repeated behavior, the beat MUST carry a `Run` event (subject · circuit · what each pass emits). One-shot
arrival events cannot teach a process — that substitution is the documented arrivals-only script failure.
`Run` maps downstream to the `cycle` operator and is the beat's honest hold-alive; it may coexist with one
hero Transform (the cycle continues behind the event).

## The Event Graph (your output — the typed artifact stages 11, 16 consume)

Per scene: the ordered list of typed events (subject · from · to · kind · cause · order), one per state diff,
grouped by beat. This is the complete, declarative "what happens" the validator checks and the
motion-operator-engine turns into concrete operators.

## Boundary

You emit typed events (the verbs). You do NOT choose the concrete motion operator (`motion-operator-engine`),
assign springs/easing (`physics-engine`), or validate pre/postconditions (`event-validator`). Hand the graph on.
