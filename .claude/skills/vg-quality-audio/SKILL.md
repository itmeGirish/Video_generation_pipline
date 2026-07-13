---
name: vg-quality-audio
description: Production-quality gate for AUDIO — the half of perceived quality the 8 visual factors miss. Scores 0–10 on voice expressiveness (dramatic vs flat TTS), loudness (−14 LUFS integrated, true peak < −1 dBTP), music bed + ducking, sfx on anchored reveals, deliberate silence before the payoff, dynamic range, and the non-silence guard. The audio parallel to vg-visual-quality — run it in the per-scene verify loop and on the final mux. Use after TTS/render, when audio sounds flat/robotic/too-quiet/muddy, or before shipping.
when_to_use: Use in the per-scene verify loop (after TTS) and on the final master mux, to score whether the audio is production-grade — not just present. Closes the lopsided-QA gap where the pipeline has 8 visual gates and ~0 audio-quality gates. Not for narration↔visual sync (that's render-validator) or anchor-drift (vg-verification-protocol Layer 2).
model: opus
---

# Audio Quality — the missing half of the scorecard

> **This is the SCORE side. The AUTHOR side is `vg-sound-design`** — it designs/wires the audio layer
> (voice engine, music+ducking, sfx cues, deliberate silence, peak swell) and says what's wired vs a GAP.
> Author there, score here (same pairing as `vg-code-*` ↔ `vg-quality-*`).

The pipeline has **8 visual quality gates and, until now, ~0 audio-quality gates** — yet audio is
roughly **half** of perceived quality (audit doc 06). `vg-verification-protocol` Layer 2 checks audio
*correctness* (WPM, AAC specs, anchor coverage, not-silent); this scores audio *quality*: is it
**dramatic, loud-right, scored, and textured** — or a flat TTS demo over silence? Score 0–10 like the
visual factors, same teeth (< 7 = NOT READY).

> **Honest pipeline reality:** today the pipeline ships **narration only** — no music, no sfx
> (doc 06). So most scenes will score LOW here *by construction*, and that's the point: this gate makes
> the audio gap **visible and scored** instead of silently ignored. Until the audio layer lands, score
> what exists (voice + loudness + non-silence) and record the missing layers (music/sfx/silence) as the
> gap. Once music/sfx are added, the full rubric applies.

## The 7 things it scores

### 1. Voice expressiveness (is it dramatic, or a flat machine read?)
The narration should punch hero words, vary pace, and breathe — not sound like a TTS demo. **Mayer's
Voice Principle**: people comprehend worse from a flat *machine* voice than an expressive *human-like*
one. Check: does the `ssml_compiler` output actually reach the voice (edge-tts **strips SSML** → flat;
Piper/ElevenLabs/Azure **honor it** → dramatic — `vg-ssml-narration` / doc 06)? Flat monotone = cap ≤5.

### 2. Loudness (the technical floor)
- **Integrated ≈ −14 LUFS** (YouTube target; dialogue-heavy −16 is fine). Mastering louder buys nothing
  (YouTube turns it down); quieter = sounds quieter than every other video.
- **True peak < −1 dBTP.** Verify: `ffmpeg -i <out>.mp4 -af loudnorm=print_format=json -f null -` (or
  `volumedetect`). The pipeline's `stitch.audio_loudnorm` bakes `I=-14:TP=-1.5:LRA=11` — confirm it's ON.

### 3. Music bed + ducking
A music bed sets emotional tone and **carries pacing** (swell on the build, drop before the payoff). It
must sit **beneath** the voice (voice ≈ −6…−12 dB, music ≈ −18…−22 dB) and **duck** during narration
(sidechain/auto-duck) so words stay clear. No bed at all = the "feels cheap" tell; bed that buries the
voice = worse. (Not in pipeline yet → record as gap.)

### 4. Sfx on the reveals (the audio half of the visual peak)
Every anchored visual reveal should have an audio partner — a sting on the reveal, a whoosh on a cut, a
tick on a counter, an impact on a slam. The sync map is **already the `audio_anchor`s**. A reveal with a
visual punch and no sound is half-built. (Not in pipeline yet → record as gap.)

### 5. Deliberate silence before the payoff
A 1–2s drop of voice/music before the biggest line *sharpens* attention (the brain leans in) and makes
the reveal land. This lever **works today** via narration `<pause>` placement. Check the peak beat has
breathing room, not wall-to-wall sound.

### 6. Dynamic range (not flat-loud)
A good mix has soft AND loud moments. Over-compression to a constant loud wall is fatiguing and flattens
the emotional arc. Keep `LRA` reasonable (the −14/LRA-11 target preserves it). All-one-level = cap ≤6.

### 7. Non-silence + sync guard (the catastrophic-failure check)
The known worst-case is shipping a **silent** master (CLAUDE.md). ALWAYS:
`ffmpeg -i <final>.mp4 -af volumedetect -f null -` → confirm real levels (not −91 dB). And the
per-bullet anchor-drift must be within −0.5..+1.5s (that's `vg-verification-protocol` Layer 2 — this
gate assumes it passed).

## 0–10 rubric
- **9–10:** expressive human-like voice · −14 LUFS / TP < −1 · a ducked music bed that carries the arc ·
  sfx on the reveals · a deliberate silence at the peak · dynamic, never silent.
- **7–8:** good voice + correct loudness + a bed, but ducking slightly off OR sfx sparse OR no peak silence.
- **5–6:** correct loudness + non-silent, but FLAT voice or NO music bed / NO sfx (the current pipeline ceiling).
- **3–4:** robotic monotone, or loudness wrong (too quiet / clipping), or muddy (music buries voice).
- **0–2:** silent stretches, sync broken, or unlistenable.

**Gate:** < 7 → NOT READY on the audio axis. A flat machine voice caps at ≤5; a silent master is an
automatic 0 + hard fail. Report the score + the single highest-ROI fix (almost always: **swap the TTS
backend so SSML is honored**, then **add a ducked music bed** — doc 06).

## Aggregate line (record next to the visual scorecard)
```
AUDIO QUALITY — <name>, Scene N
  voice expressiveness  /10        loudness (−14 LUFS / TP<−1)  pass/fail
  music bed + ducking   /10 (or GAP)   sfx on reveals  /10 (or GAP)
  silence at peak       /10        dynamic range  /10        non-silent  pass/fail
  ── AUDIO SCORE  /10  → NOT READY if < 7
  GAPS (not-yet-in-pipeline): music · sfx   ← the doc-06 work to close
```

## Where it sits
- `vg-verification-protocol` Layer 2 = audio **correctness** (WPM, anchor coverage, not-silent) → first.
- **vg-quality-audio (this)** = audio **quality** (expressive · loud-right · scored · textured) → after.
- `vg-visual-quality` = the 8 VISUAL factors (the other half).
- `render-validator` = narration↔visual teaching-sync (a separate, script-side axis).
All required before a scene/video is truly done. Audio is half the product — score it, don't assume it.

## Sources
- YouTube **−14 LUFS / TP −1 dBTP**, dialogue above music + ducking — [Youlean loudness table](https://youlean.co/loudness-standards-full-comparison-table/) · [audio levels for video](https://www.tempolor.com/blog/audio-levels/)
- Machine vs human voice harms comprehension — Mayer's **Voice Principle** ([Educational Technology](https://educationaltechnology.net/mayers-principles-of-multimedia-learning/))
- Dynamic mix, true-peak < −1, ducking — [Krotos: balance music & sfx](https://krotos.studio/blog/how-to-balance-music-and-sound-effects)
