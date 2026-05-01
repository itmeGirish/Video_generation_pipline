---
name: narration-and-clarity
description: Quality bar for engaging narration + visually clear scenes. Read when output feels flat or visuals feel generic.
metadata:
  tags: quality, narration, clarity, engagement
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

`storyboard/visual_designer.py` system+user prompt enforces:
- One primitive per bullet
- Concrete props (verbatim quotes, real numbers, real lists)
- ANCHOR FIDELITY — the audio_anchor phrase MUST identify the exact narration moment
- CLARITY > CLEVERNESS — max 3-5 elements per screen, big legible text
- Visual must DIRECTLY ILLUSTRATE what's being said (horse → show horse)

**If output is still generic:**
- The bullets in the structured script are too vague ("The reveal." gives the LLM nothing).
  Rewrite as concrete actions: "Show 3 cards appearing one by one labeled X, Y, Z".
- Or upgrade `llm.designer_model` in `config.yaml` to `claude-opus-4-6` (default is `claude-opus-4-6` since 2026-04).

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
