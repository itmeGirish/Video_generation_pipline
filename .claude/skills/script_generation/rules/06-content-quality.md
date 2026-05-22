---
name: content-quality
description: Validates whether the script content is worth watching — not just technically correct. Viewers watch for content, not for animation quality. Run this BEFORE format validation.
metadata:
  tags: content, quality, hook, unique-angle, evidence, viewer-benefit, tension-resolution
---

# Content Quality Validation

**This is the most important check. Run it first.**

A script that fails format checks wastes a render.
A script that fails content checks wastes the viewer's time — and they never come back.

Technical validation checks if the pipeline can process the script.
Content validation checks if a human would want to watch it.

---

## The 6 content quality tests

Run each test by reading the script. Answer yes or no. No partial credit.

---

### Test 1 — The Hook Test

**Question:** If a viewer reads only Scene 1's narration, do they feel compelled to watch the rest?

A strong hook does ONE of these:
- States a fact that seems impossible: *"The most accurate AI model also lies the most."*
- Raises a question the viewer genuinely wants answered: *"Why does the smartest model hallucinate more than a dumber one?"*
- Shows a contradiction the viewer needs resolved: *"Same model. Same prompt. One engineer calls it indispensable. One benchmark says it fabricates 86% of the time."*
- Promises something specific and valuable: *"I spent four days pulling this apart. Let me show you what I found."*

**FAIL conditions:**
- Scene 1 opens with background/context instead of tension
- Scene 1 explains what the video is about instead of creating a question
- The hook could apply to any video on this topic (it is generic)
- No surprising fact in Scene 1

**Test:** Cover Scenes 2–N. Read only Scene 1. Ask: *"Would I stop scrolling for this?"*
If the answer is no or maybe → FAIL.

---

### Test 2 — The Unique Angle Test

**Question:** What does this video say that other videos on this topic do NOT say?

Every topic has 50 videos on YouTube. The viewer has already seen the basics.
If this script covers only what is commonly known, the viewer has no reason to watch.

A unique angle is ONE of:
- A counterintuitive fact most people get wrong
- The "WHY" behind a fact everyone knows but no one explains
- A real-world consequence that is obvious in hindsight but rarely shown
- A comparison that has never been made side-by-side in this way
- The thing companies or experts don't want to talk about

**Write the unique angle in one sentence** before validating:
> *"This video's unique angle is: _______________."*

**FAIL conditions:**
- You cannot complete that sentence
- The sentence is: "It explains what [topic] is" — that is a definition, not an angle
- The sentence describes something covered in the first Google result for this topic

**Test:** Search YouTube for `"<topic>"`. Watch the top 3 results for 60 seconds each.
Does this script cover something none of them cover? If no → FAIL.

---

### Test 3 — The Viewer Benefit Test

**Question:** After watching, what can the viewer DO or DECIDE that they could not before?

Viewers do not watch to be informed. They watch to be able to act differently.

Concrete benefits:
- *"I can now decide which AI model to use for my specific use case"*
- *"I can now explain to my team why we should migrate our database this way"*
- *"I now know the one question to ask before choosing a cloud provider"*
- *"I can now recognize the warning signs before a Kubernetes cluster fails"*

**Write the viewer benefit in one sentence:**
> *"After watching, the viewer can: _______________."*

**FAIL conditions:**
- The benefit is: "understand [topic]" — understanding is not action
- The benefit is vague: "learn about AI" / "know more about databases"
- The viewer could get the same benefit from reading a Wikipedia article
- No decision framework or rule is given anywhere in the script

**Test:** Read Scene N (verdict). Does it give a clear decision rule or action step?
*"If X, use A. If Y, use B."* or *"The rule is simple: do Z before doing W."*
If not → the script ends with information but no benefit → FAIL.

---

### Test 4 — The Evidence Test

**Question:** Is there at least one fact, number, or quote in this script that the viewer will remember 24 hours later?

Memorable evidence is:
- A number that seems wrong: *"86% of the time"* / *"7,980 dollars vs 5,838"*
- A quote from a named real person that is specific and surprising
- A before/after comparison where the gap is striking: *"14 days → 2 days"*
- A named real event or test result: *"Vending-Bench"*, *"SWE-bench 87.6%"*

Generic evidence is NOT memorable:
- *"Studies show that AI is getting better"* — no number, no source, no specificity
- *"Many developers prefer Claude for coding"* — vague, no evidence
- *"GPT is good at some things and Claude is good at others"* — states the obvious

**FAIL conditions:**
- No specific number in the entire script
- No named real person quoted
- No named real benchmark, test, or event
- All evidence is hedged: *"some studies suggest"*, *"reportedly"*, *"I've heard that"*

**Test:** Read the script. Can you name 2 specific facts you would repeat to a colleague tomorrow?
If no → FAIL.

---

### Test 5 — The Tension-Resolution Test

**Question:** Does the script's ending resolve what the beginning raised?

The hook creates a question or contradiction. The verdict must answer it.
If the ending answers a different question than the one the hook raised — the video is broken.

**Map the hook to the verdict:**

| Hook (Scene 1) | Expected resolution (Scene N) |
|---|---|
| "Why does the smartest model lie the most?" | Explains the design choice that causes it |
| "Two companies. Seven days apart." | Tells you which one won and why it matters |
| "Same model. Both facts true." | Reconciles the contradiction with a framework |
| "Water doesn't stay in Tank A" | Shows Tank B full, zero loss confirmed |

**FAIL conditions:**
- Scene N does not mention what Scene 1 raised
- Scene N gives general advice unrelated to the hook
- The viewer finishes the video still holding the same question they had at the start
- Scene N is only a CTA with no verdict

---

### Test 6 — The "So What" Test

**Question:** Does every body scene answer the viewer's unspoken question: *"So what does this mean for me?"*

Every scene that presents information must also state its consequence.
Information without consequence is a lecture. Consequence without information is a rant.
A good scene does both in the same breath.

**Pattern:**
```
Information:   "GPT leads Terminal-Bench by 13 points."
Consequence:   "If you're building CLI tools, that gap matters."
```

**FAIL per scene if:**
- The scene presents data but never says what the viewer should do with it
- The scene ends without a one-line consequence statement
- The consequence is obvious: *"So as you can see, higher is better"*

**Test:** For every body scene, find the consequence sentence.
If a scene has no consequence sentence → WARN (3+ WARNs = overall FAIL).

---

## Content quality output format

Report before the technical validator:

```
CONTENT QUALITY VALIDATION — <name>.txt

Test 1 — Hook:           PASS / FAIL  [reason]
Test 2 — Unique angle:   PASS / FAIL  [the angle stated in one sentence]
Test 3 — Viewer benefit: PASS / FAIL  [the benefit stated in one sentence]
Test 4 — Evidence:       PASS / FAIL  [the 2 most memorable facts named]
Test 5 — Tension/Res:    PASS / FAIL  [hook → verdict mapped]
Test 6 — "So what":      N scenes PASS, M scenes WARN, K scenes FAIL

CONTENT VERDICT: STRONG / ACCEPTABLE / WEAK / FAIL

STRONG     = all 6 pass. Ship it.
ACCEPTABLE = 5 pass, 1 WARN. Proceed, note the weakness.
WEAK       = 2+ WARNs or 1 FAIL. Fix before proceeding — weak content wastes a render.
FAIL       = 2+ FAILs. Rewrite the script. Do not validate technically until content passes.
```

---

## What content quality is NOT

Content quality is NOT:
- Whether the animations look good (that is technical quality)
- Whether the format is correct (that is format validation)
- Whether the anchors match (that is sync quality)

A video with perfect animations and broken content still has zero watch time.
A video with rough animations and exceptional content gets watched and shared.

**Content is the reason viewers come. Everything else is the reason they stay.**

---

## The one-paragraph test (fastest content check)

If you have no time to run all 6 tests, run this:

Write one paragraph that answers:
1. Who is the viewer?
2. What do they not know right now?
3. What will they know after watching?
4. Why will they trust this video over the 50 other videos on this topic?
5. What will they do differently after watching?

If you cannot write that paragraph in 5 minutes — the script is not ready.
If you can write it easily — the content is likely strong.

Write it. Then check that every scene in the script serves at least one of those 5 points.
Any scene that serves none of them → cut it or rewrite it.
