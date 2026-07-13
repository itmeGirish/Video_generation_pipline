---
name: tempo-sync-engine
description: STAGE 18 of the Visual Story Engine. Synchronizes narration, beats, pauses, music, and event timing onto ONE timeline — each visual event lands on its narration anchor word, pauses sit where the picture needs to breathe, and the beat cadence matches the emotional pace. Uses the audio_anchor → word-timestamp → frame mapping so sync is derived mechanically, never guessed. Input = Script + Motion. Output = the TIMELINE. Runs after physics, before audio design. Owns "when everything happens", not the sound assets (audio-design-engine) or the physics feel (physics-engine).
when_to_use: Use after physics to place every event on the timeline in sync with narration and pacing — anchor words, pauses, cadence. Owns timing + narration↔visual sync.
model: opus
---

# tempo-sync-engine — Script + Motion → Timeline (STAGE 18)

Everything now exists (events, operators, physics, narration) but not yet placed in TIME. This stage builds
the single timeline: each event lands exactly when its narration says it, pauses breathe where the picture
needs them, and the cadence matches the emotional pace. Bad sync — a reveal landing a second off its word —
reads as broken no matter how good the motion is.

## The anchor mechanism (sync is DERIVED, not guessed)

Every beat carries an `audio_anchor` — a 2–4 word verbatim phrase from its own narration. Sync is mechanical:
```
audio_anchor phrase  →  Whisper word-timestamp  →  frame (timestamp × fps)  →  the event fires on that frame
```
This is why the anchor must be verbatim from the beat's own `>` line, must not span a `<pause>`, and must
avoid decimals/units (they transcribe unpredictably). The payoff visual lands ON the anchor word — the
discovery-led rule still holds (the visual can fire a beat BEFORE the confirming line, but the confirming
word is the anchor). Get the anchor right and drift is impossible; get it wrong and every downstream sync
check fails.

## Placing pauses (the picture breathes)

- **After a hero number/reveal** — a `<pause>` so the value lands and the viewer registers it before the next
  line. The peak especially needs silence before it (the drop that makes the reveal hit).
- **Before a discovery** — a short held beat so the visual event lands and the realization forms BEFORE the
  narration confirms.
- Pauses are real silence derived from `<pause Xs>` in the narration — they are timeline events, not filler.

## Cadence (match timing to the emotional pace)

- **Fast scenes** — events tight, short holds, quick cuts (escalation, chaos, accumulation).
- **Slow scenes** — events spaced, long holds, room to feel (the reveal, the thesis, the wonder beat).
- **~one meaningful event per second** as a rhythm floor, but each must advance the story (cadence ≠ flashing).
- **Duration fits events** — a beat's frame length must hold its number of events with the final reveal
  landing by ~0.9 of the beat (no crammed 8-event 2s beat → freeze/cut-off/drift; no dead tail). Flag any beat
  whose events don't fit its duration back to the scene plan.

## The Timeline (your output — consumed by audio-design + the render)

One ordered timeline per scene: every event's fire-frame (from its anchor), every pause (frame + length), the
beat cadence, and the scene's total frame length. This is the temporal spine music, sfx, and the render all
lock to.

## Boundary

You own WHEN things happen (timing + sync). You do NOT choose sound assets (`audio-design-engine`), the
physics feel (`physics-engine`), or the operator (`motion-operator-engine`). Hand the timeline forward.
(Phase-2 `vg-narration-alignment` implements the anchor→frame alignment on the real Whisper output.)
