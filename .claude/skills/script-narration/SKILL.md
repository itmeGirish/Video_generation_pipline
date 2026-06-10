---
name: script-narration
description: Writes narration that is cinematic, conversational, and TTS-sync-ready. Applies how experienced voiceover writers work — write for the ear, read aloud, vary sentence rhythm, strategic pauses, direct address — alongside the pipeline's non-negotiable sync mechanics: the `> ` blockquote format, `<pause Xs>` markers, hero numbers spelled as words, and verbatim audio anchors. Use when writing narration, voiceover, or spoken script text, placing pause markers, setting up audio anchors, or fixing TTS sync issues. Not for scene structure, animation bullet authoring, or research.
---

# Step 4 — Narration Writing

Narration is the spine of the video. The animation hangs off it.
Every word is spoken by TTS and transcribed by Whisper for timing.

The craft principle that governs everything below: **write for the ear, not the eye.**
A script that reads fine on the page can still be unspeakable. The page is not the
deliverable — the spoken audio is.

## Contents
- Write for the ear — the governing principle
- Specificity — the antidote to generic
- The banned-word list
- The narration format (pipeline-required)
- Pause placement — the rhythm of speech
- Hero numbers — the anchor targets
- Audio anchors — how narration drives animation
- Sentence rhythm — cinematic vs flat
- Read it aloud — the only real test
- Guidelines — Always / quality bar

---

## Write for the ear — the governing principle

Scripts meant to be heard need a different approach than text meant to be read.
Experienced voiceover writers follow a handful of rules that all serve the ear:

- **Conversational, not formal** — write how people talk, not how reports read.
- **Contractions** — "it's," "you're," "they've" — never the expanded forms.
- **Direct address** — "you" and "your." Speak to one viewer, not an audience.
- **Active voice** — "the model failed," not "the test was failed by the model."
- **No visual punctuation** — no semicolons, no parentheses, no em-dash asides. The
  ear can't hear them. Break the thought into separate sentences instead.
- **White space** — build in breathing points. Don't cram information without giving
  the listener time to process.

If a sentence only works on the page, it doesn't belong in narration.

---

## Specificity — the antidote to generic

Generic is the #1 reason a script sounds like AI. The cause: a model defaults to the
*average* of everything written on a topic — safe, balanced, vague. The single most
reliable fix is **specificity**: trade every vague claim for a concrete one.

Interrogate every line:
- It says "a lot / many / significant / better" → ask **"how much? which? better at what?"**
  and replace with the real number, name, or example (from research, rule 00).
- It states something true of any topic → make it true of THIS topic only. If you could
  swap the topic word and the sentence still works, it's generic — rewrite it.
- It asserts without proof → add the concrete instance right after (rule 06 Test 5).

Rule of thumb: **at least one concrete specific per scene** — a real number, a named
thing, a dated event, or a one-line example. Vague is the default; specific is the work.

❌ "AI models have improved a lot and many developers now rely on them."
✅ "[the specific benchmark jump you found] — and [named team]'s own numbers back it up."
(Fill with your real, sourced facts — never invent a specific to sound concrete.)

---

## The banned-word list

These words/phrases are AI-default filler — they make narration sound generated and
hedged. Do not use them. When tempted, the fix is almost always a concrete specific.

**Filler / AI-tells (ban):**
- "in today's fast-paced/ever-evolving world," "in the realm of," "the landscape of"
- "delve," "tapestry," "moreover," "furthermore," "it's important to note,"
  "needless to say," "at the end of the day," "unlock the power/potential of"
- "game-changer," "revolutionary," "cutting-edge," "seamless," "robust" (as vague praise)

**Vague quantifiers (ban unless followed by a real number):**
- "a lot," "many," "several," "some," "often," "usually," "significant,"
  "various," "numerous" — replace with the actual figure or named example.

**Hedge-into-blandness (ban):**
- "it depends," "there are pros and cons," "on the one hand / on the other hand" used to
  avoid taking a position. Take the stance (rule 07 thesis).

**Repeated transition openers (the #1 AI cadence tell — vary them):**
- "Here's the thing / Here's what's strange / Here's the wild part / Here's my honest
  read / Here's the part nobody…" — a human writer almost never opens scene after scene
  with the same "Here's the X" frame. Using it once is fine; using it as a recurring
  scene-opener screams generated.
- **Rule: no transition template opens more than ONE scene.** Scan all scene openers
  together; if two start with the same frame ("Here's…", "Now…", "So…", "But…"), rewrite
  one. Reach for varied, specific transitions that carry information:
  - ❌ "Here's the part nobody put in the headline." → ✅ "Buried in the system card was
    something nobody put in the headline."
  - ❌ "Here's the wild part." → ✅ "The way it earned that score is the strange part."
  A good transition states *what* is coming, not just *that* something is coming.

Filler openers and over-balanced both-sides phrasing are the clearest generic signals —
cutting them forces a sharper, more specific line.

---

## The narration format (pipeline-required)

This format is non-negotiable — the parser depends on it. There are two layouts; the `>`
blockquote rules are identical in both.

**Pair-block (PREFERRED) — each beat's narration lives inside its bullet:**
```
- **0:00 – 0:06 — [REPLACE] Headline.**
  > First sentence for this beat. <pause 0.3s>
  Visual description...
  audio_anchor: phrase from this line
- **0:06 – 0:12 — Next headline.**
  > Next sentence with the hero word. <pause 0.5s>
  Visual description...
```
The narration is the `>` line(s) under each bullet; the parser concatenates them in order
into the full scene narration. Because the words sit with the visual and the anchor, sync
drift is impossible. **Write each beat's narration so the concatenated whole still reads as
one continuous, natural take** — don't let beat boundaries fragment the speech.

**Legacy (still parses) — one narration block, then animation:**
```
### Narration
> First sentence. <pause 0.3s>
> Second sentence with the hero word. <pause 0.5s>
> Third sentence.
```

Rules (both layouts):
- Each sentence on its own `>` line
- `<pause Xs>` markers between sentences where you want a beat (seconds: `0.3s`, `0.5s`, `1.0s`)
- The `>` blockquote marker is required — the parser uses it to find narration
- In pair-block, each beat's `audio_anchor` must be a verbatim phrase from that beat's `>` line

---

## Pause placement — the rhythm of speech

Pauses are where meaning lands. Strategic silence gives the listener time to absorb
the important beat and creates emphasis. Place them deliberately, not by reflex.

**After the hook sentence** (let it hit):
```
> The strongest option on paper just failed the simplest test. <pause 0.8s>
```

**Before a reveal** (creates anticipation):
```
> And the result? <pause 1.0s>
```

**After a hero number** (lets it sink in):
```
> It handled twelve thousand requests a second. <pause 0.5s>
```

**Between list items** (rhythm):
```
> First, it reads the schema. <pause 0.3s>
> Then it checks the tests. <pause 0.3s>
```

**Pause duration guide:**
- `0.3s` — between list items, minor beats
- `0.5s` — after a sentence with a key point
- `0.8s` — after the hook, before a topic shift
- `1.0s+` — before a big reveal, after a shocking number

Don't over-pause. A pause after every sentence reads as hesitant, not dramatic.
Reserve the long pauses for the moments that earn them.

(Examples above are illustrative — fill them with your real, sourced facts.)

---

## Hero numbers — the anchor targets

A hero number is the single most important number in a scene. It becomes the
`audio_anchor` for the scene's key visual.

Rules:
- Spell them out: `"twelve thousand"` not `"12,000"` — Whisper transcribes words reliably
- One hero number per scene maximum
- Put it in its own short sentence for emphasis
- Follow it with a pause

**Good** (number isolated, then a beat):
```
> The cost? <pause 0.3s> Fourteen million dollars. <pause 0.8s>
```

**Bad** (number buried in a long sentence):
```
> The total cost of the system over the year came to about fourteen million dollars including overhead.
```

Every hero number must be a real, sourced figure from the research step — never
invented to fit a sentence.

---

## Audio anchors — how narration drives animation

An `audio_anchor` is a verbatim phrase from the narration that a visual locks onto.
When the TTS speaks that phrase, Whisper finds its timestamp, and the animation fires.

Rules:
- Anchors must be VERBATIM from narration — exact words
- 2–4 words is ideal — long enough to be unique, short enough to match
- Avoid a number as an anchor if the same number appears twice in the scene
- Pick distinctive phrases: a specific named object from the scene, not "this thing"
- Avoid anchoring on a phrase that spans a `<pause>` — the break splits the match

**In narration:**
```
> Watch the needle move. <pause 0.5s>
```

**In the bullet (rule 03):**
```
audio_anchor: "the needle"
```

---

## Sentence rhythm — cinematic vs flat

Vary sentence length. Short sentences hit hard. Long sentences explain. Alternating
them is what creates cadence — a flat string of same-length sentences reads as monotone
no matter how good the facts are.

**Flat** (all medium-length, no rhythm):
```
> The model was trained on a lot of data. It performed well on benchmarks. People were impressed by the results.
```

**Cinematic** (varied length, dramatic beats):
```
> They trained it on the entire internet. <pause 0.5s> And it worked. <pause 0.8s>
> Then they tried something nobody expected.
```

Pattern to reach for: a short punch, then a longer explanation, then a short payoff.

---

## Read it aloud — the only real test

The single most reliable check experienced writers use: **read every line out loud.**

- If you stumble, the listener stumbles — rewrite the line.
- If you run out of breath, the sentence is too long — split it.
- If it sounds like a textbook, it is one — make it conversational.
- If a pause feels unnatural when you speak it, move or remove it.

Do this pass before declaring the narration done. It catches what the eye misses.

---

## Guidelines

### Always
- Write for the ear: conversational, contractions, direct address, active voice
- Land at least one concrete specific per scene (number / name / example)
- Replace every vague quantifier with a real figure or named example
- Use the `### Narration` header before each scene's narration
- Put each sentence on its own `>` line
- Spell out hero numbers as words
- Place a pause after every hero number and before every reveal
- Keep one hero number per scene
- Read the narration aloud before finishing

### Never
- Use any banned-word filler ("delve," "in today's world," "it's important to note," etc.)
- Use a vague quantifier ("a lot," "many," "significant") without a real number after it
- Hedge into blandness ("it depends," "pros and cons") instead of taking the stance
- Write a line that would still work if you swapped the topic — that's generic
- Write numbers as digits in narration (Whisper needs words)
- Use semicolons, parentheses, or em-dash asides — the ear can't hear them
- Bury a hero number in a long sentence
- Use the same phrase twice if it's an audio_anchor
- Invent a number to fit a sentence — every figure is sourced
- Write narration longer than the scene's time window allows

### Quality bar
- [ ] Every scene has a `### Narration` block
- [ ] Every sentence is on its own `>` line
- [ ] At least one concrete specific per scene; no vague quantifier left unquantified
- [ ] No banned-word filler anywhere
- [ ] Hero numbers are spelled out as words, and each is sourced
- [ ] Every hero number is followed by a pause
- [ ] Audio anchors are verbatim phrases that don't span a pause
- [ ] Sentence length varies (not all the same)
- [ ] The narration has been read aloud and flows without stumbles
