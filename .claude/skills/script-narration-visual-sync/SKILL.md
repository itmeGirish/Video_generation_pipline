---
name: script-narration-visual-sync
description: Scores animation QUALITY — how much understanding it creates per second — using multimedia-learning research (Mayer's principles, narration-centric design) and the 12 animation principles. Runs AFTER the animation validator (03b clears "is it broken?"; this answers "is it GOOD and memorable?"). A 10-factor /100 scorecard across narration-visual sync, cognitive load, cause-effect, transformation, and craft. Use after animation bullets pass 03b, when judging whether the animation actually teaches, when a scene feels flat/forgettable/over-animated, or to verify consequence is shown not just stated. Not for catching render bugs (rule 23) or build errors.
---

# Step 4d — Narration-Visual Synchronization (animation quality scorecard)

Run AFTER the animation validator (rule 03b). 03b catches what's *broken* (pass/fail).
This judges what's *good*: **animation is not judged by how smooth it looks — it's judged
by how much understanding it creates per second.** A scene can pass 03b (nothing broken)
and still be forgettable, decorative, or over-animated. This gate scores that.

Grounded in: Mayer's Cognitive Theory of Multimedia Learning (words + graphics reinforce,
manage cognitive load), narration-centric animation design (link spoken concepts to
visuals), and the 12 principles of animation (motion needs motivation, anticipation,
hierarchy).

### Where it sits (don't confuse the three)
- **03b animation-validator** — is it BROKEN? (pass/fail: sense, fit, motion-not-text, buildable, known-failures)
- **this gate** — is it GOOD? (0–100 quality score: understanding-per-second, memorability)
- **rule 23 / vg-verification-protocol** — does it actually RENDER right? (the only layer that sees pixels)

All three are required. This one is the quality bar between "technically correct" and
"memorable."

## Contents
- Tier 1 — Communication (most important)
- Tier 2 — Cognitive load
- Tier 3 — Storytelling
- Tier 4 — Animation craft
- The 10-factor scorecard + thresholds (the gate)
- The #1 lever — consequence visualization
- Output + guidelines

---

## Tier 1 — Communication (weight this highest)

### 1. Narration-visual synchronization
Every important **noun, verb, and outcome** in the narration must have a visual counterpart
firing at that moment.

- Narration "the cache expired" → timer hits zero, "EXPIRED" appears, cost spikes.
- NOT → a random camera move or abstract particles while those words are spoken.

Check per scene: list the key nouns/verbs/outcomes; confirm each has a visual event on its
word. Unmatched key words = lost teaching moments.

### 2. Information transfer (the muted test)
**Mute the audio. Can a viewer understand 60–70% of the idea from the visuals alone?**
- Yes → the animation is *explanatory*.
- No → it's *decorative* — the visuals aren't carrying the meaning. Redesign.

### 3. Visual echo
Important words become visual *events*, not static labels.
- "cost explodes" → the meter explodes. "context shrinks" → the block physically shrinks.
- The motion mirrors the verb. Words and graphics reinforce each other (Mayer).

---

## Tier 2 — Cognitive load (where most AI videos fail)

### 4. One idea per moment
Unnecessary simultaneous motion raises cognitive load and kills comprehension.
- ❌ graph moving + text moving + icon moving + background moving, all at once.
- ✅ one primary visual action at a time.
- **Test:** pause every ~5 seconds. Can you explain that frame in ONE sentence? If not, too
  much is happening — cut secondary motion.

### 5. Attention guidance
The viewer's eyes need ONE destination per moment.
- **Ask:** "where should my eyes go right now?" If there's more than one answer, the scene
  is weak — establish a clear hero and demote the rest.

### 6. Decorative-motion ratio
`meaningful motions ÷ total motions`. Meaningful = it teaches (context grows, meter rises).
Decorative = floating particles, random zooms, idle sparkle.
- **Target ≥ 80% meaningful.** Below that, the scene is animated for its own sake — strip the
  decoration.

---

## Tier 3 — Storytelling

### 7. State transformation
Every scene should show **State A → change → State B**, not a static fact.
- Small context → /compact → smaller context. Without a transformation the scene feels
  inert. Explainers teach *relationships and change*, not standalone facts.

### 8. Cause → effect visibility
The viewer should **see** causality, not infer it.
- "cache expires → full price": show the expiry, THEN the price jump, linked by motion/time.
- If the cause and the effect aren't visually connected, the point doesn't land.

### 9. Escalation
Each scene should feel more important than the last — tension, consequence, or
understanding increasing. A flat sequence of equally-weighted scenes loses viewers.

---

## Tier 4 — Animation craft (the 12 principles still apply)

### 10. Motion motivation
Every movement needs a reason. "the graph rises because the value rises" = motivated;
"the graph spins because it looks cool" = unmotivated → cut or replace it.

### 11. Anticipation
Important events need a setup beat. Meter *starts shaking* → THEN explodes. A reveal with
no wind-up reads abrupt and is easy to miss.

### 12. Visual hierarchy
Primary element = strong motion; secondary = small motion; background = nearly still.
Equal motion everywhere = the viewer gets lost. One hero, supporting cast, quiet backdrop.

---

## The 10-factor scorecard (the gate)

Score every scene, 0–10 per factor, total /100:

```
ANIMATION QUALITY — <name>, Scene N
  Narration sync     /10   (Tier 1.1 — key words have visual events)
  Visual clarity     /10   (Tier 1.2 — muted test, 60–70% understandable)
  Cause-effect       /10   (Tier 3.8 — causality is shown, not inferred)
  Attention focus    /10   (Tier 2.5 — one clear destination for the eyes)
  Cognitive load     /10   (Tier 2.4 — one idea per moment; 5s pause test)
  Transformation     /10   (Tier 3.7 — State A → change → State B)
  Story progression  /10   (Tier 3.9 — escalation across the scene)
  Motion purpose     /10   (Tier 4.10 — every move is motivated; ≥80% meaningful)
  Memorability       /10   (would a viewer recall/redraw this beat tomorrow?)
  Emotional impact   /10   (is the stake/consequence FELT, not just shown?)
  ─────────────────────────
  TOTAL              /100
```

### Thresholds → action (the teeth)
| Score | Meaning | Action |
|---|---|---|
| **90–100** | Elite (Kurzgesagt / Fireship level) | ship |
| **80–89** | Very strong | ship; optionally lift the lowest factor |
| **70–79** | Good but forgettable | **REVISE** — patch the 2 lowest factors, re-score toward 80 |
| **60–69** | Over-animated or under-explained | **REVISE hard** — usually a cognitive-load or sync failure |
| **< 60** | Animation is hurting comprehension | **REDESIGN the scene** (back to rule 03) |

**Gate rule:** a scene under **70 is NOT READY** — fix and re-score. Target ≥80 for every
scene. Report the per-factor scores, not just the total, so the weakest factor is obvious.
Lowest factor ≤ 4 on any scene = fix it even if the total clears 70.

---

## The #1 lever — consequence visualization

The single biggest quality jump for explainer animation is **showing the consequence**, not
just the fact. Make the viewer *feel* the cost, don't just state it.

- ❌ fact only: "CLAUDE.md gets smaller."
- ✅ consequence shown: "a huge CLAUDE.md duplicated into 20 prompts → the meter explodes →
  shrink it → the meter collapses."

The second makes the viewer feel the cost. That's the difference between technically correct
and memorable — and it directly lifts the Cause-effect, Transformation, Memorability, and
Emotional-impact factors at once. When a scene scores 70–79 ("forgettable"), this is almost
always the missing piece: add the consequence beat.

---

## Output + guidelines

### Output
Per scene: the 10-factor scorecard with the total, the single weakest factor named, and the
one change that would most raise the score. Then the action per the threshold table.

### Always
- Run this AFTER 03b passes — quality only matters once nothing is broken
- Weight Tier 1 (communication) highest — sync and the muted test are the core
- Apply the 5-second pause test and the muted test literally, per scene
- For any 70–79 scene, check consequence visualization first
- Report per-factor scores; fix any factor ≤ 4 and any scene under 70
- Keep going until every scene clears 70 (target 80+)

### Never
- Call a scene done on smoothness alone — smooth + meaningless still fails the muted test
- Pass a scene with simultaneous competing motions (cognitive-load fail)
- Pass decorative motion as if it teaches (keep meaningful ratio ≥ 80%)
- Confuse this with 03b (broken-or-not) or rule 23 (rendered frames) — all three are required
