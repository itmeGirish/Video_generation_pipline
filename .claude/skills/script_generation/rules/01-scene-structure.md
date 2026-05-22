---
name: scene-structure
description: How to design the scene list — count, order, arc. Read before writing any narration.
metadata:
  tags: scene-structure, arc, scene-count, outline, cold-open, cta
---

# Step 3 — Scene Structure Design

Before writing narration, map the whole video as a scene list.
A bad scene structure produces a video that feels like a lecture.
A good scene structure produces a video that feels like a story.

---

## Scene count by video length

| Target length | Scene count | Avg scene length |
|---|---|---|
| 3–5 min | 4–5 scenes | ~45–60s each |
| 8–12 min | 7–9 scenes | ~70–90s each |
| 15–20 min | 10–12 scenes | ~90–100s each |

Scenes shorter than 30s feel rushed. Scenes longer than 120s lose attention.
If a topic needs more than 120s, split it into two scenes with different angles.

---

## Scene arc — required structure

Every video must follow this arc regardless of topic:

```
Scene 1:    COLD OPEN / HOOK        — The surprising fact. The question. The tension.
Scene 2:    CONTEXT / BACKGROUND    — Why this topic exists. What the landscape looks like.
Scene 3–N:  BODY                    — One idea per scene. Build the argument.
Scene N-1:  THE TURN                — The unexpected angle. The thing no other video covers.
Scene N:    VERDICT + CTA           — Answer the hook. Tell the viewer what to do.
```

The hook in Scene 1 must be answered in Scene N. If the hook asks a question,
Scene N must answer it. If the hook shows a contradiction, Scene N must explain it.

---

## One idea per scene — strict rule

Every scene header title must complete this sentence:
> "This scene explains ___________."

If the blank requires "and" — split the scene.

**Bad (two ideas):**
```
## SCENE 4 — "Benchmarks and What Developers Say" (2:18 – 4:10)
```

**Good (one idea each):**
```
## SCENE 4 — "The Benchmark Track" (2:18 – 4:10)
## SCENE 5 — "What Developers Actually Say" (4:10 – 5:30)
```

---

## Scene title naming rules

Scene titles must be memorable and specific:
- Name the visual metaphor if one exists: `"The Race Track"`, `"The Lie Detector"`, `"The Transfer"`
- Name the tension: `"Why the Smartest Model Lies the Most"`
- Name the comparison: `"The Seven-Day War"` (both models launched 7 days apart)
- Avoid generic labels: `"Section 3"`, `"Main Content"`, `"The Data"` ← all bad

---

## Time windows

Scene time windows `(M:SS – M:SS)` in the header are approximate.
They tell the visual designer how long each scene runs.
Actual timing comes from TTS duration — the parser does not enforce these times.

Guidelines:
- Estimate based on word count: ~2.5 words per second at `rate: '+15%'`
- Leave 5–10s slack per scene — TTS is never exactly the estimate
- Scene 1 (cold open): usually 20–40s regardless of total video length

---

## Scene list output format

Write the scene list as a numbered table before writing any narration:

```
Scene list for: <video title>
Total target: <length>

1.  "Cold Open"              ~30s   Hook: [what the surprising fact is]
2.  "Context"                ~60s   Covers: [what background the viewer needs]
3.  "The First Idea"         ~70s   Covers: [first body idea]
4.  "The Second Idea"        ~70s   Covers: [second body idea]
5.  "The Turn"               ~80s   Covers: [unexpected angle]
6.  "Verdict + CTA"          ~45s   Answers: [the hook question]
```

Show this to the user before writing. Confirm it covers the right topics.
Adjust based on feedback. Only then proceed to Step 4.

---

## Body scene patterns — pick one per scene

| Scene content | Pattern to use |
|---|---|
| Two things competing or compared | Race track + scoreboard |
| How something works step-by-step | Build-up bullets, numbered steps |
| A surprising statistic | Lie detector / gauge / single large number |
| A physical process (flow, transfer, fill) | Named metaphor object (tank, pipe, valve) |
| Developer testimonial | Quote card with speaker identity |
| Before and after a change | Split panel, REPLACE cut at the midpoint |
| Timeline of events | Horizontal spine with staggered nodes |
| The decision framework | 2×2 matrix or two-column card |

One scene = one pattern. Never mix two patterns in one scene.
If the content requires two patterns, that is two scenes.

---

## CTA scene — always last

Scene N (the final scene) must:
1. Answer the hook question or resolve the hook tension
2. Give the viewer a clear decision rule or action
3. Include a subscribe/comment/next-video call to action

CTA bullets:
- Subscribe ask: viewer sees "SUBSCRIBE" typewriter animation (standard)
- Comment prompt: a question for the viewer appears on screen
- Next video: brief tease of what the next video covers

The CTA scene is typically 30–45s. Keep it short — the viewer has already learned what they came for.
