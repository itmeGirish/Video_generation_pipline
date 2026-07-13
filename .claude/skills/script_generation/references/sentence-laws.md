# Sentence Laws — the machine-checkable consistency floor for narration (script-writer S5)

Every narration sentence must obey these. The subset marked **[LINT]** is enforced mechanically by
`../scripts/sentence_laws_lint.py`; the rest are human-checked at the S5/S7 gates. Consistency comes from
making as many of these mechanical as possible.

| # | Law | Check |
|---|---|---|
| 1 | **One idea per sentence** | [LINT] flags a second independent clause doing new work (`; ` or ` and ` joining two verbs) — split it |
| 2 | **Speakable: ≤22 words, no nested clauses** | [LINT] word count ≤22; numbers written as SPOKEN words, numeral kept in `display_value` |
| 3 | **Active voice, present tense for mechanisms** | [LINT] flags passive patterns ("is/are/was/were … by") in `role: mechanism` |
| 4 | **Concrete nouns** — running-example nouns in ≥60% of sentences | human at S5 (lint reports the ratio if example nouns are supplied) |
| 5 | **`role` from the closed set** | [LINT] `hook,stake,proof,mechanism,example,tension,release,interrupt,reanchor,boundary,takeaway,breath` |
| 6 | **≥1 `breath` sentence per chapter** | [LINT] per-chapter breath count ≥1 |
| 7 | **`visual_intent` is one phrase** (a hint) | [LINT] present + ≤12 words |
| 8 | **≤1 emphasis word per sentence** | [LINT] `emphasis_word` is a single token appearing in `text` |
| 9 | **No visual narration** | [LINT] flags "as you can see", "on the screen", "below", "above", "here we see" |
| 10 | **Numbers ramp** — a number appears only after its components | human at S5 |
| 11 | **Commentary Law** — world-subject + operational verb; rhetorical sentences (paradox/aphorism/promise/address) ≤1 per chapter, riding a beat whose world shows the point | human at S5 + the S7 cold-read |

Plus the voice lint (banned-words.txt) applied after `personality-pass`.

## The sentence object (what the lint reads)
```json
{ "id":"<sNNN>","chapter":"<chN>","text":"<the sentence>","role":"<closed-set role>",
  "concept_tag":"<this script's concept id>","visual_intent":"<one-phrase hint>",
  "emphasis_word":"<one word from text>","display_value":"<ledger numeral, if any>" }
```

## Run it
```
python .claude/skills/script_generation/scripts/sentence_laws_lint.py <draft-script.json> \
    [--banned .claude/skills/script_generation/references/banned-words.txt]
```
Exit 0 = clean; exit 1 = violations printed (id · law · detail). Fix and re-run until clean before S6/S7.
