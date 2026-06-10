---
name: vg-narration-clarity
description: "Quality bar for engaging narration and visually clear scenes. Four levers to pull when output feels flat or generic. Use whenever the video feels boring, narration is monotone, visuals are generic, or any request like "narration feels flat," "visuals are generic," "improve quality," "clarity bar," or "output is boring.""
---

# Narration + Visual Clarity Bar

The pipeline can produce a technically-correct video that still feels boring. This rule
defines the quality bar and the levers to pull when output is flat.

## What "good" looks like

1. **Narration is loud, dramatic, and varied in pace.** Hero words punch. Sentences
   have rhythm. The voice never sounds like a TTS demo.
2. **Each visual directly illustrates the words being spoken at that moment.** When
   the narrator says "horse", a horse is on screen. Not a generic chart.
3. **Visuals are READABLE in 1 second.** One idea per screen, big legible text,
   high contrast. If the viewer needs to read 4 lines of small text, the visual is wrong.
4. **Visuals change every 5-10 seconds.** No primitive sits unchanged for 15s+.

---

## Lever 1 — Narration quality

`edge-tts` (Microsoft free voices) **does NOT parse SSML** — it speaks `<break>` tags
literally. `ssml_compiler.py` output is therefore stripped to plain text in
`build_video.py` step 4. This means we lose `<emphasis>`, `<break>`, `<prosody rate>`.

**To get dramatic narration:**
- **Best:** switch to ElevenLabs or Azure Neural TTS in `build_video.py` step 4 (paid, SSML works).
- **Free fallback:** rely on punctuation. Comma = short pause. Period = full stop. Em dash = dramatic pause. **Write narration in the structured script with very short sentences and aggressive punctuation** — that's the only pacing edge-tts respects.
- **Voice:** the pipeline-pinned voice is `en-US-AndrewMultilingualNeural` (Warm, Confident,
  Authentic, Honest — what most YouTube tech channels sound like). This is one of the FOUR pinned
  constants per rule 00 §2a + SKILL.md Critical Contract #8 — never override per-project.

---

## Lever 2 — Visual clarity (designer prompt)

`storyboard/visual_designer.py` does cache lookup only — there is no LLM prompt to
tune anymore. The same fidelity contracts now apply to the **active Claude Code
session** authoring each bullet (you):
- One primitive per bullet
- Concrete props (verbatim quotes, real numbers, real lists)
- ANCHOR FIDELITY — the audio_anchor phrase MUST identify the exact narration moment
- CLARITY > CLEVERNESS — max 3-5 elements per screen, big legible text
- Visual must DIRECTLY ILLUSTRATE what's being said (horse → show horse)

**If output is still generic, the fix order is:**
1. The bullets in the structured script are too vague ("The reveal." gives YOU nothing
   concrete to render). Rewrite as concrete actions: "Show 3 cards appearing one by
   one labeled X, Y, Z, each with [color] border, staggered 12 frames apart".
2. Re-author the bullet — read the bullet body again, look for missed concrete details,
   write more specific React.createElement code, re-seed via `seed_bullet_cache.py`.
3. Make sure you (the author) are on **Opus 4.7** for authoring — Sonnet 4.6 is fine
   for routing/mechanical work but tends to under-specify creative compositions
   (see SKILL.md § "MODEL STRATEGY"). Switch via `/model opus` if you're not on it.

---

## Lever 3 — Sync (visual ↔ narration moment)

Each visual block has an `audio_anchor` — a phrase from the narration that anchors
the block's start frame to the actual spoken word (via Whisper word timestamps).

**`build_video.py` uses `find_phrase_fuzzy`** which falls back through:
1. Exact phrase match
2. Shorter prefix (anchor's first 4, 3, 2 words)
3. Sliding-window content-word overlap (≥60% of anchor tokens in window)

**Anchor coverage report** (printed in step 7) must be ≥95%. If lower:
- Whisper mis-transcribed (rare with good audio)
- Anchor phrase isn't in the narration (designer hallucinated it — reject the design)
- Anchor uses words that get hyphenated/compound-merged by TTS

### Anchor + bullet body: the exact word → exact visual contract

The goal: **narration says "testing" → testing button appears on screen at that exact moment.**

**How to write it (concrete example):**

Narration: *"Claude runs four steps: testing, validation, linting, and deploy."*

```
**0:10 – 0:14 — Testing button.**
[anchor: testing]
Green button labeled "RUN TESTS" pulses center screen. Progress bar fills beneath it in cyan. Label "Step 1" in dim above.

**0:14 – 0:18 — Validation badge.**
[anchor: validation]
Blue shield icon with checkmark labeled "VALIDATE" bounces in from right. Counter "42/42" in amber below.
```

When "testing" is spoken → green button appears. When "validation" is spoken → shield appears.

**The two rules that make this work:**

| Rule | What it means |
|------|--------------|
| Anchor = exact word from narration | `[anchor: testing]` only works if "testing" is verbatim in the narration for that scene |
| Bullet body = what is ON screen | Not "show the testing step" — but "green button labeled RUN TESTS, progress bar in cyan." LLM renders exactly what you describe |

**Bad vs good:**

| Bad | Good |
|-----|------|
| `[anchor: the steps]` — too generic, multiple matches | `[anchor: testing]` — unique word, single moment |
| Bullet: "Show the testing phase." | Bullet: "Green button 'RUN TESTS' pulses center. Progress bar cyan beneath it." |
| One bullet for all 4 steps | Four bullets, one per word, each anchored to its spoken word |

**Checklist per bullet:**
1. Pick the 1–2 words from narration that trigger this visual
2. Set `[anchor: <those exact words>]`
3. Describe elements: shape, label text, color token, position, animation
4. One idea per bullet — never pack two visuals into one

---

## Lever 4 — Pacing (more visuals per scene)

If a scene feels static: each `### Animation` bullet in the structured script = one visual block.
6 bullets in 60s = avg 10s per visual. To get more change:
- **Edit `projects/structured_scripts/<name>.txt`** — split each bullet into 2-3 sub-bullets (one per beat).
- 8-12 bullets per 60s scene is the sweet spot for engagement.

---

## When you ship a video, verify all four levers

1. Listen to `audio/vo-*.mp3` alone. Is it dramatic? Or flat? → Lever 1
2. Watch the video muted. Does each scene's visual tell the story without audio? → Lever 2
3. Watch with audio. Do visuals change at the moment the narrator says a key word? → Lever 3
4. Count visual changes per minute. <8 = too slow. → Lever 4
