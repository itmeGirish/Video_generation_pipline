# Storytelling principles — the FIRST priority (any explainer topic)

**Story is primary. Animation is last.** The order that separates Fireship / Veritasium /
Johnny Harris / Neo / Lemmino from "moving icons and text":

```
Storytelling  →  Information Design  →  Visual Design  →  Animation
```

Most videos fail because they optimize **animation before story**. Get the story right first —
on the page, before a single beat is drawn. If the story is strong, weak animation still works;
if the story is weak, no animation saves it. Grounded in: the curiosity gap / Zeigarnik open
loops (open loops ≈ **+32% watch time**), the "YouTube Wave" (one big gap → a chain of mini
payoffs + re-hooks), emotional oscillation, and escalating stakes.

Design every scene against the 15 parameters below; each has the **review question** to ask.

---

## The 15 storytelling parameters

1. **Curiosity gap** — every scene creates a QUESTION (why did this happen? how is this possible?
   what's next? how do we fix it?), not a row of facts. *Ask: "What question is the viewer asking right now?"* — if none, retention drops.
2. **Open loops** — delay the answer ("4 words drained 30% of usage. But that isn't the real problem."). *Ask: "What unresolved mystery exists right now?"*
3. **Stakes** — give the fact a consequence ("Claude rereads context — that's why your usage vanished"). *Ask: "Why should the viewer care?"*
4. **Cause-and-effect chain** — each scene happens BECAUSE of the last (no memory → rereading → context growth → usage drain → expensive retries); the viewer feels "of course." *Ask: "Does Scene B happen because of Scene A?"*
5. **Narrative momentum** — every scene pushes forward (problem → cause → bigger problem → solution), not "topic, then another topic." *Ask: "Why does this scene come NEXT?"*
6. **Escalation** — things get BIGGER (one message → ten → long chat → retry spiral → half your usage gone). *Ask: "Is this bigger than the previous scene?"*
7. **Specificity** — concrete beats generic ("one failing test, 40 messages later, half the window gone" beats "a developer debugging"). *Ask: "Can I picture this happening?"*
8. **Relatability** — the viewer sees themselves ("try again… no, not that… one more attempt"). *Ask: "Has the viewer experienced this?"*
9. **Mental models** — one carrying metaphor per section (memory→notebook, context→backpack, debt→weight, competition→race). People remember models, not facts. *Ask: "What's the ONE metaphor carrying this section?"*
10. **Progressive understanding** — knowledge GROWS (mystery → hint → reveal → deeper reveal), not everything at once. *Ask: "What does the viewer know now that they didn't 30s ago?"*
11. **Emotional progression** — even technical videos need emotion (confusion → curiosity → surprise → understanding → relief); oscillate states. *Ask: "What should the viewer FEEL here?"*
12. **Contrast** — learning happens through comparison (before/after, wrong/right, Dev A vs Dev B, old/new). *Ask: "What am I comparing?"*
13. **Payoff density** — a reward (reveal / insight / aha) every **20–40 seconds**; delay too long and retention drops (the Wave: mini-payoffs that each re-hook). *Ask: "What payoff happened recently?"*
14. **Avoid explanation loops** — never repeat the same idea in new words ("context grows… context grows…"). *Ask: "Am I teaching something NEW, or repeating?"*
15. **Scene purpose clarity** — every scene has ONE job (S1 create mystery · S2 explain budget · … · S10 payoff). *Ask: "What is the single purpose of this scene?"*

---

## Storytelling Scorecard (run on EVERY scene)

```
□ Creates curiosity (a question)?
□ Has stakes (a consequence)?
□ Has ONE clear purpose?
□ Advances the narrative (pushes forward)?
□ Escalates tension (bigger than last)?
□ Uses specificity (picturable)?
□ Feels relatable (viewer sees self)?
□ Builds / uses the mental model?
□ Adds NEW understanding?
□ Contains a contrast?
□ Has a payoff (recent reward)?
□ Avoids repetition (new, not restated)?
□ Produces an emotion?
□ Naturally leads to the next scene?
```

A scene scoring high here is strong **before animation exists**. Score the story FIRST; only
then design the beats (`explainer_animation_principles.md`).

---

## The three biggest storytelling mistakes in technical explainers

```
Too much explanation   →   not enough curiosity
Too many facts         →   not enough stakes
Too many concepts      →   not enough narrative progression
```

Optimize these BEFORE touching animation. If a scene is a pile of facts with no question, no
stake, and no forward pull, it fails as story — and animating it just makes a prettier lecture.

---

## How this orders the rest of script generation

- This (storytelling) is **Step 5.5** and it governs everything downstream.
- `script-scene-structure` builds the scene list as a retention plan (purpose + loop chain + escalation).
- `script-content-quality` + `script-retention-engineering` gate curiosity / payoff / emotion.
- ONLY after the story scores well do `script-animation-bullets` + `explainer_animation_principles.md`
  turn each beat into motion. **Never the reverse.**
