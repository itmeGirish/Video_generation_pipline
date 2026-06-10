---
name: script-human-review
description: Reviews the script as a HUMAN VIEWER, not a parser — run after the technical validator (rule 05). Simulate watching the whole script and react honestly: does it sound robotic or generic, will a real viewer understand it, why would they keep watching, is every claim shown with a concrete example, does it actually make sense? Use after the script passes technical validation, when judging whether the script feels human and engaging, or when a draft reads flat/AI-generated. Not for parser format (rule 04/05), animation design (rule 03), or research (rule 00).
---

# Step 5b — Human Script Review (watch it as a viewer)

Rule 05 proves the script is technically valid. This rule asks a different question:
**would a real person actually want to watch it, and would they understand it?**

A script can pass every format and anchor check and still be lifeless — robotic,
generic, full of claims with no examples, the kind of AI-sounding video people click
away from in ten seconds. This review catches that.

## How to run this — simulate the watch-through (hallucinate the viewer)

Do not check boxes mechanically. **Play the video in your head.** Read the script
start to finish as if you are a viewer who does not already know the topic, and react
honestly at each scene:

- "Wait, what does that mean?" → it's unclear.
- "I already knew that." → it's generic.
- "Why are they telling me this?" → no stakes, no reason to watch.
- "Prove it." → a claim with no example or evidence.
- "...this sounds like a robot." → flat, templated, no voice.
- "huh, I didn't know that — keep going." → this part works.

Imagine the viewer's thoughts and write them down per scene. That honest, imagined
reaction IS the review — be the audience, not the validator.

## Contents
- The viewer questions
- Q1 — Does it sound robotic, and is the tone right?
- Q2 — Is it too generic?
- Q3 — Will the viewer understand it?
- Q4 — Why should the viewer keep watching?
- Q5 — Is every claim shown with a concrete example?
- Q6 — Why should they watch at all, and what do they GET?
- Q7 — Does it make them think / feel something?
- Q8 — Does it actually make sense?
- Q9 — Does it flow with continuity?
- Q10 — Does it feel like a story, not a list?
- Output
- Guidelines

---

## The viewer questions

Every scene must pass all of these. Score each PASS / WEAK / FAIL with the imagined
viewer reaction as the evidence.

---

### Q1 — Does it sound robotic, and is the tone right?

Robotic = flat, templated, no human voice. The tell-tale signs:
- Every sentence the same length and shape
- Corporate/AI filler: "In today's fast-paced world," "It's important to note that,"
  "Let's dive in," "the realm of," "unlock the power of"
- No contractions, no direct address, no personality
- Lists of facts with no reaction, no opinion, no stakes

**Tone** — separately from robotic, is the tone right for this channel and topic?
- Matches the chosen tone (the saved preference, or Fireship-style if invoked)
- Consistent — doesn't lurch from jokey to academic to salesy scene to scene
- Fits the subject — not flippant about something serious, not stiff about something fun
- Sounds like ONE person with a point of view, not a committee

PASS: it sounds like a specific person talking to one viewer, with rhythm, a point of
view, and a tone that fits the channel and the topic.
FAIL: it reads like a generated explainer template, OR the tone is off / inconsistent /
wrong for the subject.

Fix: rewrite in spoken voice (rule 02), lock one consistent tone, and apply the channel
style (e.g. `.claude/skills/script_generation/references/fireship_format.md` if Fireship mode).

---

### Q2 — Is it too generic?

Generic = true of a hundred other videos on the topic. The viewer has heard it before.
- Surface-level facts a five-minute search would give
- No specific angle, no opinion, no "here's what nobody tells you"
- Could be retitled to a different but similar topic with no rewrite

PASS: it has a specific thesis, a fresh angle, and concrete details only this script has.
FAIL: it's a Wikipedia summary with narration.

Fix: sharpen the thesis (rule 07), bring in the specific researched facts (rule 00),
take a side.

---

### Q3 — Will the viewer understand it?

Comprehension for someone who does NOT already know the topic.
- Jargon used without being shown or explained
- A leap in logic — step B assumes something step A never established
- Too much at once — three ideas crammed where the viewer can hold one
- Abstract with nothing concrete to picture

PASS: a non-expert follows every step; each new idea is built on the previous one.
FAIL: the viewer is lost by the middle and can't say what the point was.

Fix: explain-then-reveal, one idea per scene (rule 01), add a concrete picture/example.

---

### Q4 — Why should the viewer keep watching?

At every scene, the viewer is deciding whether to stay. Each scene must earn it.
- The hook lands in the first 15 seconds (a real reason to care)
- Each scene raises a question or pays one off (open-loop chain, rule 01)
- There are stakes — what the viewer gains, loses, or avoids by knowing this
- No flat valley where nothing is at risk and nothing is promised

PASS: at any point there's an unanswered question or a stake pulling the viewer forward.
FAIL: a scene where a bored viewer would click away and miss nothing.

Fix: add a re-hook, raise the stakes, or cut the scene (rule 01 / rule 05a).

---

### Q5 — Is every claim shown with a concrete example?

Claims without examples don't land. "It's faster" means nothing; "it did in two
seconds what used to take two minutes" lands.
- Every abstract claim is followed by a specific, concrete instance
- Numbers are real and sourced (rule 00), not vague ("a lot," "much better")
- The example is something the viewer can picture or relate to

PASS: every important claim has a concrete example, number, or story right after it.
FAIL: the script asserts things and never shows them — "trust me" energy.

Fix: after each claim, add the example/number/story that proves it. Show, don't assert.

---

### Q6 — Why should they watch at all, and what do they GET?

Q4 is about staying scene-to-scene. THIS is the bigger promise: why click in the first
place, and what does the viewer walk away with? A video the viewer finishes but gains
nothing from is a failure even if they didn't leave.

- **The promise is clear and early** — within the first 15s the viewer knows what this
  video will give them (an answer, a skill, an edge, a settled debate).
- **The payoff is delivered** — by the end they actually got it, not a vague "it
  depends" or a teaser that never resolved.
- **Concrete benefit** — name what changes for the viewer: they can now DO something,
  DECIDE something, or UNDERSTAND something they couldn't before.
- **Worth their time** — the benefit justifies the runtime. A 10-minute video for a
  one-line takeaway fails this.

PASS: the viewer can finish and say "I got X out of that" — a specific, real benefit.
FAIL: they finish and think "okay… so what?" — entertained maybe, but no takeaway.

Fix: state the promise up front (rule 07 thesis), make the final scene deliver a
concrete, usable payoff (rule 01 verdict), cut runtime to match the value.

---

### Q7 — Does it make them think / feel something?

The videos people share and remember provoke a reaction — a reframe, a surprise, a
"huh, I never saw it that way," or a genuine laugh. Pure information transfer is
forgettable.

- **A reframe or insight** — it changes how the viewer sees the topic, not just adds facts
- **A reaction beat** — at least one moment that surprises, amuses, or lands emotionally
- **A shareable line** — one thing the viewer would repeat to a colleague tomorrow
- **Not a flat recital** — it has a point of view worth reacting to

PASS: at least one moment makes the viewer pause, react, or want to share it.
FAIL: it's information with no spark — true, complete, and totally forgettable.

Fix: sharpen the angle (rule 07), add the surprising reframe from research (rule 00),
plant one repeatable line (rule 05a retention).

---

### Q8 — Does it actually make sense?

Step back and read the whole thing as one argument.
- The thesis is clear and the scenes build to it
- The hook is answered by the end (no dropped promise)
- Nothing contradicts an earlier scene
- A viewer could tell a friend in one sentence what the video was about and why it mattered

PASS: it's a coherent argument with a beginning, a build, and a payoff that delivers.
FAIL: it's a pile of related facts that never resolves into a point.

Fix: realign scenes to the thesis (rule 07), make the final scene answer the hook (rule 01).

---

### Q9 — Does it flow with continuity?

Continuity is what turns separate scenes into one unbroken watch. Each scene must connect
to the next so the viewer is *pulled* forward — the curiosity from one scene is what makes
them watch the next. A video that's a series of disconnected segments lets attention reset
(and drop) at every cut.

- **Scenes link, they don't just sit next to each other** — each scene ends in a way that
  sets up the next (a question, a "but," a consequence), not a full stop.
- **No hard resets** — the next scene doesn't start a brand-new topic with no bridge from
  what just happened.
- **One through-line** — a single thread (the thesis / the central question) runs through
  every scene, so it feels like one story, not a playlist.
- **Curiosity carries across the cut** — at each scene boundary there's an open question or
  unfinished beat that the next scene answers (the loop chain, rule 01 / rule 05a).
- **Consistent world** — entities, metaphors, and color identity stay continuous so the
  viewer never has to re-orient.

PASS: the scenes feel like one continuous story; each cut pulls the viewer into the next
because they need what's coming.
FAIL: it reads as disconnected segments — each scene a fresh start, attention resets at
every cut, no thread pulling forward.

Fix: add a bridge at each scene end (a question/"but"/consequence that the next scene
resolves), keep one through-line, and chain the open loops (rule 01 structure, rule 05a
retention).

---

### Q10 — Does it feel like a story, not a list?

Information is forgettable; a story is remembered. Does the script feel like a story
being told — with stakes, a build, and a payoff — or a list of facts being read out?

- **Cause-and-effect** — scenes connect with "because of that," not "and then" (rule 01b).
- **Stakes** — the viewer feels why it matters early; there's something to gain or lose.
- **A build** — tension/curiosity rises through the middle; it doesn't flatten into exposition.
- **Transformation / payoff** — a before→after the viewer can feel by the end.
- **Viewer as hero** — it's framed around the viewer's problem and win, not the cleverness
  of the explanation.

PASS: it lands as a story — stakes set, tension rising, a payoff that delivers a change.
FAIL: it's a competent list of true facts with no stakes, no build, and no transformation.

Fix: apply the story layer (rule 01b) — pick a spine (hook/build/payoff or the story
spine), set the stakes in Scene 1, chain scenes by consequence, land the transformation.

---

## Output

Report per scene, with the imagined viewer reaction as the evidence:

```
HUMAN SCRIPT REVIEW — <name>
Scene | Robotic+Tone | Generic | Understand | Keep | Examples | Why-watch | Think | Sense | Flow | Story
  S1  |    PASS      |  PASS   |   PASS     | PASS |  PASS    |   PASS    | PASS  | PASS  | PASS | PASS
  S2  |    WEAK      |  FAIL   |   PASS     | WEAK |  FAIL    |   FAIL    | WEAK  | PASS  | FAIL | WEAK

FAILS / WEAKS (with the viewer's imagined reaction):
  S2 Generic:    "I've heard this exact intro on five other videos." — needs a specific angle
  S2 Examples:   "It claims the tool is powerful but never shows it doing anything." — add an example
  S2 Why-watch:  "I finished and got nothing I can use." — state the promise + deliver a payoff
  S2 Robotic:    "Sounds like a press release." — rewrite in spoken voice (rule 02)

VERDICT: NOT READY — S2 reads generic, unproven, and gives the viewer no takeaway
```

Any FAIL, or 2+ WEAKs on one scene, = not ready. Send back to the relevant writing rule,
revise, and re-run. Only when every scene would make a real viewer stay, understand,
care, and walk away with something is the script human-ready.

---

## Guidelines

### Always
- Read the whole script as a viewer who doesn't know the topic — imagine their reactions
- Write the imagined reaction as the evidence for each PASS/WEAK/FAIL
- Demand a concrete example or number behind every claim
- Confirm the viewer gets a real, usable benefit — and knows the promise early
- Check the tone fits the channel/topic and stays consistent
- Confirm at least one moment makes the viewer think, react, or want to share
- Check that every scene gives a reason to keep watching
- Check continuity — scenes link into one through-line so curiosity carries across each cut
- Check it feels like a story, not a list — stakes, a build, a payoff (rule 01b)
- Send failures back to the writing rule that owns them (02 voice, 07 thesis, 01 structure, 00 evidence, 05a retention)

### Never
- Pass a script that sounds robotic, off-tone, or generic just because it's technically valid
- Accept a claim with no example or sourced number
- Pass a script the viewer finishes with no takeaway ("okay… so what?")
- Approve a script you can't summarize in one sentence
- Pass a script that reads as disconnected segments with no thread pulling forward
- Mechanically tick boxes without simulating the watch-through
