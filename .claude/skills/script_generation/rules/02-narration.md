---
name: narration
description: How to write cinematic narration — pauses, trigger words, dramatic arc, hero numbers.
metadata:
  tags: narration, pauses, trigger-words, hero-numbers, dramatic-arc, sentence-style
---

# Step 4a — Writing Cinematic Narration

Narration is not a script read aloud. It is a performance scored for a specific voice.
Every sentence serves two purposes: tells the story AND triggers a visual at the right moment.

---

## The three functions of every narration line

1. **Story** — advances the viewer's understanding by one step
2. **Trigger** — contains the spoken word that fires the next visual (`audio_anchor`)
3. **Pacing** — uses pauses and sentence length to control viewing time

All three must be satisfied in every scene.

---

## Narration format rules (parser requirements)

```
### Narration
> First sentence of narration. <pause 0.3s>
> Second sentence.
> Third sentence with the hero word. <pause 0.5s>
```

- Every line starts with `>`
- `<pause Xs>` inserts a TTS pause (e.g. `<pause 0.4s>`)
- Blank lines between `>` lines are ignored by parser
- Section starts with exactly `### Narration` (three hashes, space, capital N)

---

## Pause placement — where and how long

| Situation | Pause length |
|---|---|
| After a hero number or key stat | 0.4s – 0.6s |
| After a contradiction or surprise | 0.5s – 0.8s |
| After naming a model / entity | 0.2s – 0.3s |
| Before the answer to a question | 0.3s – 0.5s |
| Hard cut to a new metaphor | 0.3s |
| Normal sentence break (optional) | 0.2s |

The pause after a hero number is viewing time — the visual just appeared and the viewer needs to absorb it.
Do not pause before the trigger word — pause after, so the visual lands then holds.

**Pattern:**
```
> [YOUR_KEY_STAT_AS_WORDS]. <pause 0.5s>
```
`[YOUR_KEY_STAT_AS_WORDS]` spoken → stat slams on screen → 0.5s of silence → viewer sees the number.

---

## Sentence length and rhythm

Short sentences punch. Long sentences explain. Alternate them.

> **DERIVE DON'T COPY — examples below show sentence PATTERNS, not content to reuse.**
> Your narration must use your topic's facts from research. Never copy these sentences.

**Punchy pattern (for reveals and stats):**
```
> Same [YOUR_ENTITY]. <pause 0.2s> [YOUR_CONTRADICTION_WORD].
> [YOUR_DATE_OR_EVENT]. [YOUR_ENTITY_A]. [YOUR_ENTITY_B]. <pause 0.2s>
```

**Building pattern (for explanation):**
```
> Think about what [YOUR_SUBJECT] does — [ACTION_1],
> [ACTION_2], [ACTION_3].
> What happens when [YOUR_FAILURE_CONDITION]?
```

**Verdict pattern (for conclusions):**
```
> Don't ask [WRONG_QUESTION]. <pause 0.3s>
> Ask [RIGHT_QUESTION].
```

---

## Hero words — how to write trigger phrases

The `audio_anchor` for each bullet comes from 2-4 verbatim words in the narration.
Write narration so the trigger phrase is obvious, unique, and spoken at exactly the right moment.

**Rules for trigger phrases:**
- Numbers anchor reliably: `"[YOUR_NUMBER_AS_WORDS]"` e.g. spoken stat, count, duration
- Entity/subject names anchor reliably: `"watch the [YOUR_METAPHOR_OBJECT]"`, `"[YOUR_ENTITY_A] stops"`
- Imperative commands anchor well: `"watch the [YOUR_KEY_VISUAL]"`, `"watch the [YOUR_ACTION]"`
- Generic words miss: `"and"`, `"the"`, `"this"` → do not use as anchors

**Pattern — imperative + pause:**
```
> Watch the [YOUR_KEY_VISUAL]. <pause 0.3s>
```
`"watch the [YOUR_KEY_VISUAL]"` spoken → visual fires → 0.3s of silence → viewer watches it.

**Pattern — number reveal:**
```
> [YOUR_ENTITY_A] — [YOUR_NUMBER_1_AS_WORDS]. <pause 0.3s>
> [YOUR_ENTITY_B]. <pause 0.5s>
> [YOUR_NUMBER_2_AS_WORDS]. <pause 0.5s>
```
Each number is the trigger for its own visual block.

---

## Writing numbers as words

TTS and Whisper handle numbers in word form more reliably than digits:
- Write: `"thirty-six percent"` → both TTS speaks it and Whisper transcribes it as exact words
- Do not write: `"36%"` → TTS may say "thirty-six percent" but Whisper may write "36" in the transcript

Use word form for all numbers in narration:
- Percentages: `"eighty-six percent"`, `"thirty-six percent"`
- Decimals: `"ninety-four point two percent"`, `"one point two seconds"`
- Large numbers: `"seven thousand nine hundred eighty dollars"`
- Multipliers: `"two and a half times"`, `"seven times faster"`

---

## Scene-level narration arc

Every scene's narration must follow a mini arc:

```
Opening:  State the question or tension (1-2 sentences)
Body:     Build the answer with evidence (3-6 sentences)
Reveal:   Land the key insight or number (1-2 sentences + pause)
Close:    One-line consequence or bridge to next scene (optional)
```

**Template — fill with YOUR scene's content:**
```
Opening:  "Now here's where I need you to lean in — [YOUR_SCENE_UNIQUE_ANGLE]."
Body:     "[YOUR_BENCHMARK_OR_EVIDENCE_NAME]. Watch the [YOUR_KEY_VISUAL]."
          "[YOUR_ENTITY_A] — [YOUR_NUMBER_1_AS_WORDS]." [pause]
          "[YOUR_ENTITY_B] — [YOUR_NUMBER_2_AS_WORDS]." [pause]
          "[YOUR_ENTITY_C]." [pause]
          "[YOUR_HERO_NUMBER_AS_WORDS]." [long pause]
Reveal:   "But here's the thing. [YOUR_REFRAME_SENTENCE]." [pause] "[YOUR_CONSEQUENCE]." [pause]
Close:    "And [YOUR_BRIDGE_TO_NEXT_SCENE]."
```

---

## What NOT to write in narration

- Long run-on sentences with no pauses — viewer cannot sync visuals to audio
- Generic filler: "So as you can see here...", "Moving on to..." — waste of TTS time
- Incomplete clauses that assume the visual completes them — narration must stand alone
- More than 5 sentences before a pause — visual designer has no anchor opportunities
- Repeating the bullet headline verbatim — the visual shows it; narration adds meaning

---

## Written for EARS — the spoken English rules

Narration read aloud must feel natural, not like a blog post.
The single biggest gap between flat and listenable scripts: prose written to be READ sounds wrong when SPOKEN.

**Rule 1 — One idea per sentence. Hard stop.**
```
Wrong: "[YOUR_ENTITY_A] leads on [METRIC_1], but [YOUR_ENTITY_B] outperforms it on [METRIC_2], which matters for [USE_CASE]."
Right: "[YOUR_ENTITY_A] is [QUALITY_1]. [YOUR_ENTITY_B] is [QUALITY_2]. For [USE_CASE], that gap matters."
```

**Rule 2 — 8–16 words per sentence maximum for narration**
Sentences over 16 words force the listener to hold too much before the verb lands.
Count the words. If over 16, split.

**Rule 3 — Contractions everywhere**
```
Wrong: "It is not [YOUR_CLAIM]. It is [YOUR_REFRAME]."
Right: "It's not [YOUR_CLAIM]. It's [YOUR_REFRAME]."
```
Contractions sound human. Formal English sounds like a textbook being read aloud.

**Rule 4 — Read every line aloud before writing the next**
If you stumble reading it — rewrite it. If it feels unnatural to say — the listener feels it too.
The test: can you speak it naturally at `rate: '+15%'` without losing clarity?

**Rule 5 — Anticipate the viewer's thought and name it**
```
"I know what you're thinking — [YOUR_STAT_OR_CLAIM] sounds impossible."
"You've probably already seen [YOUR_TOPIC]. Here's what nobody explained about it."
```
This creates intimacy. The viewer feels heard, not lectured.

**Rule 6 — Vary sentence length deliberately**
Fast-fast-fast → SLOW is the most powerful rhythm pattern.
Three short punchy sentences followed by one long building sentence.
Then silence.

```
> Same [YOUR_ENTITY]. <pause 0.2s> Same [YOUR_CONDITION]. <pause 0.2s> Completely different [YOUR_OUTCOME].
> <pause 0.5s>
> And the reason comes down to a single [YOUR_ROOT_CAUSE] that nobody has actually explained.
```

---

## Emotion layer — engineer wonder, dread, and surprise

Emotion is not decoration. It is the retention mechanism.
Stories with emotional dimension retain 300% more viewers than fact-lists.

Every scene must have ONE of these three emotional registers:

| Register | When to use | How to write it |
|---|---|---|
| **Wonder** | Revealing something beautiful, elegant, or larger than expected | Slow the pace. Use long sentences. Name the scale: *"[YOUR_SCALE_FACT_AS_WORDS], [YOUR_SCOPE_CONTEXT]."* |
| **Dread** | Revealing a risk, failure mode, or consequence | Short sentences. State the worst case plainly: *"If [YOUR_FAILURE_CONDITION]. You [YOUR_CONSEQUENCE]. [YOUR_STAKES]."* |
| **Surprise** | Delivering the counterintuitive fact | Hard pause before the reveal. Let it land alone: *"[YOUR_HERO_NUMBER_AS_WORDS]. <pause 0.5s> [YOUR_CONTRADICTION_SENTENCE]."* |

**Apply in practice:** before writing each scene's narration, decide: is this a WONDER scene, a DREAD scene, or a SURPRISE scene? Then write every sentence to reinforce that register.

---

## What NOT to write in narration

- Long run-on sentences with no pauses — viewer cannot sync visuals to audio
- Generic filler: "So as you can see here...", "Moving on to..." — waste of TTS time
- Incomplete clauses that assume the visual completes them — narration must stand alone
- More than 5 sentences before a pause — visual designer has no anchor opportunities
- Repeating the bullet headline verbatim — the visual shows it; narration adds meaning

---

## Narration quality check (apply per scene before proceeding)

- [ ] Does the scene open with a question or tension?
- [ ] Is there at least one hero number, spoken as words?
- [ ] Is there at least one `<pause>` after a key reveal?
- [ ] Does every sentence either advance the story OR trigger a visual (ideally both)?
- [ ] Are there 1-4 clear trigger phrases that will become audio_anchors?
- [ ] Does the scene close with a consequence or bridge?
- [ ] Is the narration readable aloud at `rate: '+15%'` without sounding rushed?
- [ ] Are all sentences ≤ 16 words? (count the longest one)
- [ ] Are contractions used throughout? (search for "it is", "do not", "you will" — replace all)
- [ ] Does each scene have a named emotional register: wonder / dread / surprise?
- [ ] Is there at least one "you" address per scene?
