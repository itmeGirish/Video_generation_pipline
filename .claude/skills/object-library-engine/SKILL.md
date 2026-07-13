---
name: object-library-engine
description: STAGE 8 of the Visual Story Engine. Generates the reusable visual OBJECTS with persistent identities — the through-line element that recurs across every scene, each persistent object's STATE MACHINE across the whole video (state0→state1→…→stateN), and the component-first model (objects own state; scenes render a state, never re-invent the object). Input = World Model. Output = the OBJECT LIBRARY. Runs after the world model, before the directors. Owns object identity + lifecycle across scenes, not per-scene cast (visual-world-engine) or motion.
when_to_use: Use after the world model to define which objects persist across scenes, their identity, and their state lifecycle over the whole video, as reusable components. Owns "what recurs, and how it changes across the video".
model: opus
---

# object-library-engine — World Model → Object Library (STAGE 8)

The world model gave each scene its cast. Here you decide which objects are **the same object across
scenes** — the reusable, persistent identities that make a video feel like ONE authored world instead of
seven clips. This is the component library the render assembles from.

> **COMPONENT-FIRST — objects own state; scenes render a state.** Each persistent object is a reusable
> COMPONENT with a state lifecycle. The SAME object recurs across scenes by changing STATE (props over
> time) — it is never redrawn from scratch per scene. The render builds ONE component per object and renders
> its state per beat. State the lifecycle as a DECISION (`map: folded→opened→marked→burned`), never as code.

## Job 1 — the THROUGH-LINE element (the visual protagonist)

**The failure this fixes: continuous narration, disconnected visuals.** If each scene invents a brand-new
metaphor and hard-cuts to it, the picture resets every scene while the words flow — seven clips under one
voice-over. The fix: name ONE persistent visual protagonist present and recognizably the same in every
scene. Pick a form:

- **A morph chain (strongest)** — one shape IS every scene's metaphor in turn (the migration bar *becomes*
  the race track *becomes* the code timeline *becomes* the thread). Each cut is a MORPH of the same element.
- **A recurring protagonist object** — one entity that re-appears, evolves, and pays off in the finale
  (the Kurzgesagt bird, the 3Blue1Brown number line).
- **An accumulating artifact** — a board that gains a piece each scene and is whole at the end.

Plant **≥1 visual callback** — a specific object/frame that appears early, leaves, then RETURNS as a payoff
(name the scene it plants in and the scene it pays off). The return is what makes a video feel authored.

**The test:** read only each scene's primary metaphor object in order. Can you draw an arrow from each to
the next that says "this *becomes* that"? If it's a different unrelated object each time, commit a
through-line before going further.

## Job 2 — the STATE MACHINE per persistent object

For each object that persists, define its lifecycle across the WHOLE video as a sequence of states:
`state0 → state1 → … → stateN` (e.g. map: `folded → opened → marked → burned`). **Beats RENDER a state;
objects OWN the state.** This is what lets the render carry an object across scenes by changing props rather
than re-drawing it — and it's the seed of every "the object is already at its settled state when the next
scene opens." Also define each object's transitions: what state it enters a scene in, and what it exits in.

**EVERY LIFECYCLE ENDS IN A TERMINAL STATE (the retirement rule — objects never just linger).** Each
object's state machine must close with exactly one of: **exited** (leaves with direction, toward where
the story sends it) · **retired-to-periphery** (docks small + dim as context — the two-tier texture
class) · **carried** (the through-line, handed to the next scene's stage). An object that stopped
serving the scene but still sits at full prominence is TEMPORAL ACCUMULATION — the scene crowds over
time, attention splits, and no spatial check can catch it because nothing overlaps. A cast whose members
have no terminal state is an unfinished lifecycle → not ready.

## Job 3 — the reusable identity (visual constancy)

Each persistent object has a fixed identity — same form, same accent color, same material feel — every time
it appears. A persistent object that looks different scene-to-scene isn't persistent. Record the identity
(form + accent token + material) once; it is immutable for the whole video.

## The Object Library (your output — the typed artifact the directors consume)

**The Object Library IS the video's COMPONENT GRAPH** — exactly how React thinks: NODES = the objects
(each with identity + state machine, mapping 1:1 onto a component with props), EDGES = their relationships
(ownership / cause→effect couplings from the World Model), LIFECYCLE = each node's state timeline across
scenes. The render's component-mapper (stage 26) consumes this graph directly — a well-formed library here
means zero invention there.

- **The through-line element** — its form + how it morphs/carries scene→scene + the callback (plant → payoff).
- **Per persistent object (node)** — its fixed identity (form/accent/material) + its state machine across the
  video (state0→…→stateN) + its enter/exit state per scene + its edges (what it acts on / contains).
- **The PERSISTENT ELEMENT decision** — the one element that survives across the whole video (the
  through-line piece), authoritative and immutable downstream.

## Boundary

You own object identity + lifecycle across scenes. You do NOT decide where the eye goes, camera, or light
(the directors), or author motion grammar / React (Phase-2 render). The library you emit is what makes the
render component-first instead of redrawing every bullet. Hand it forward.
