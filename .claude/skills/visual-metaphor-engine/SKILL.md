---
name: visual-metaphor-engine
description: STAGE 4 of the Visual Story Engine. Chooses the visual metaphors that make abstract ideas physical — the ONE human story-world whose mechanics match the concept (parser→shredder, database→library, context→backpack), and the concrete OBJECT that carries each cognitive shape. Input = Cognitive Model. Output = the VISUAL METAPHOR LIBRARY (the world + per-beat object metaphors + the consistency rule). Runs after the cognitive model, before the visual story. This is where abstract nouns become physical things. Not for sequencing beats into cinematic story (visual-story-engine) or building the scene's object graph (visual-world-engine).
when_to_use: Use after the cognitive model to turn abstract concepts into physical metaphor objects and pick the one governing world, before the story is made cinematic. Owns "what physical thing represents this idea".
model: opus
---

# visual-metaphor-engine — Cognitive Model → Visual Metaphor Library (STAGE 4)

Abstract ideas are unmemorable and unanimatable. Your job: make every idea **physical** by choosing the
real-world object/system that carries it — and, above all, the ONE governing WORLD the whole video lives
in. This is the skill that decides *what the viewer literally sees* instead of concepts.

> **THE LAW THAT GOVERNS EVERYTHING DOWNSTREAM: the subject is a physical OBJECT, never text.** The thing
> that will move and transform is always a thing with form — a page · machine · vessel · figure · tile ·
> card · gear · pile · door. Never a number, a label, a highlighted cell, a tag. Text/numbers are *welded
> to an object as labels* and ride along; the OBJECT acts. Pick metaphors that are objects, not diagrams.

## Job 1 — find the ONE governing WORLD (start from a story, not a concept)

The classic failure is a *concept-first* video: "explain parsing" → a diagram of parsing. The fix is
**story-first**: find the human world whose MECHANICS actually match the concept, and tell that world's
story. Great explainers are not a sequence of scenes — they are **ONE coherent world seen at different
scales** (planet → cell → economy → society = one universe).

- **Match by mechanics, not by surface.** parser→a shredder (both destroy structure to extract);
  database→a library (both store and retrieve by index); context window→a backpack (fills up, gets heavy).
- **One world, transformed — not a new metaphor per scene.** Decide the 2–4 recurring OBJECTS + the ONE
  rule they all obey. Every scene is *the same world differently*, so the visuals stay as continuous as the
  narration. (The failure this prevents: seven unrelated metaphors under one voice-over — a bar, a track,
  an IDE, a race, a thread — visuals that reset every scene while the words flow.)
- **The 12-year-old golden rule.** If a smart 12-year-old wouldn't instantly picture the metaphor, it's
  too abstract — pick a more concrete world.

## Job 2 — give each cognitive shape a concrete object

For each beat's cognitive model (stage 3), pick the physical object that carries that shape:

- **flow** → a thing that travels through stations (a packet down a line, a part down a conveyor);
- **comparison** → two physical things placed in tension (two vessels, two machines racing);
- **decomposition** → a whole object that opens/comes apart (a machine whose casing lifts off);
- **hierarchy** → nested physical containers (boxes in boxes, a tree that grows);
- **accumulation** → objects that stack/fill (a pile, a filling vessel, a loading board);
- **transformation** → the hero object literally becomes another (the table SHREDS, the page REASSEMBLES).

**NO NAKED NUMBER — a quantity's home is an INSTRUMENT, never a text pill.** When a beat's point IS a
quantity, the medium you select is an instrument OBJECT: something with a scale, a unit, and a limit,
whose reading visibly changes as its driver changes. A value that merely stamps onto the screen as
typography shows the number but hides the scale, the threshold, and the cause — the viewer can't judge
"is that a lot?". The instrument belongs to the cast (a home, states); the number rides it as its reading.

**You are selecting STATE MACHINES, not pictures.** A metaphor object is chosen WITH its sketch of states —
the handful of conditions it will pass through across the video (its idle state, its acting states, its
end state). If you can't list 3+ meaningful states for an object, it's a diagram, not a metaphor — it can
only sit there. Name each object's STATE-IN → STATE-OUT per beat (the transformation seed); the full
state machine is formalized downstream (`object-library-engine`), but the *capacity for states* is the
selection criterion HERE. This is also what makes the metaphor renderer-native by construction: an object
with states maps directly onto a component with props.

## Job 3 — the consistency rule (one metaphor per concept, held all video)

**Never swap metaphors for the same concept.** If context = a backpack, it stays a backpack — not a bar
in scene 2 and a meter in scene 5. Swapping the physical form for one idea breaks the world and the muted
test. Record each concept → its ONE object, and that binding is immutable for the whole video.

## The Visual Metaphor Library (your output — the typed artifact stage 5 consumes)

- **The world**: the governing metaphor + the 2–4 recurring objects + the one rule they obey.
- **Per beat**: concept → the concrete physical object → its STATE-IN → STATE-OUT (the transformation seed).
- **The consistency table**: each concept and the single object bound to it (immutable).
- **`rejected_worlds`** — REQUIRED: the alternative governing worlds considered and why each lost
  (mirrors `angle-engine`'s `rejected_angles`). Forces the comparison to actually happen instead of
  first-idea-wins — the world is the most load-bearing creative decision in the pipeline, and a choice
  with no recorded alternatives was never really a choice.
- **Reality-first note**: for anything real (a UI, a page, a product), the metaphor rides on the REAL asset
  (a screenshot animated) with the drawn metaphor acting on top — never a fake redraw of a real surface.

## Boundary

You choose the physical things. You do NOT sequence them into cinematic story beats (`visual-story-engine`)
or build the per-scene object graph/hierarchy/environment (`visual-world-engine`). Hand the library forward.
The world you pick here is the single most load-bearing creative decision in the pipeline — choose it well.
