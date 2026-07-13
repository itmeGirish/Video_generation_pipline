---
name: vg-sound-design
description: Design the AUDIO LAYER of a video — the half of perceived quality the visual skills ignore. Owns the 5 sound channels — VOICE (engine + expressiveness + loudness), MUSIC bed (+ ducking under the voice), SFX (stingers/whooshes/ticks on the anchored reveals), SILENCE (the deliberate drop before the peak), and SWELLS/STINGERS (stack on the peak). Says what's WIRED (Piper/edge TTS, −14 LUFS loudnorm, real silence from <pause>, and the music+sfx mix in audio_mixer.py — ducked music bed + sfx_emitter cues, enabled by config) vs the only gap left = the ASSETS you supply (sound files + a music bed). The Phase-2 executor of the audio plan that teaching-narrative-engine marks. Pairs with the vg-quality-audio verify gate. Use whenever building/improving a video's sound — choosing the TTS engine, planning music/sfx/silence, fixing flat/robotic/too-quiet/muddy audio, or before the master mux. Not the post-render audio SCORE (that's vg-quality-audio) or narration↔visual sync (vg-narration-alignment).
when_to_use: Use in Phase 2 after narration/sync and before the master mux, to DESIGN the audio layer (voice engine, music bed + ducking, sfx cues, deliberate silence, peak swells) and wire it. The render-side executor of the multi-channel plan from teaching-narrative-engine; author here, score with vg-quality-audio. Owns the sound-design decisions + the map to the pipeline's real audio capabilities (wired vs gap).
model: opus
---

# Sound Design — the missing half of perceived quality

Visuals are *one* half of how good a video feels; **audio is the other half**, and the 8 visual-quality
gates don't touch it. Today the pipeline ships **voice-only** — a TTS narration track with no music, no
sound effects, no deliberate silence beat. Premium explainer channels never do that: their reveals land on
a **voice + a counter tick + an impact sting + a music swell**, all on one frame. This skill designs that
layer and wires it to what the pipeline can actually do.

> **This is the audio counterpart of `vg-remotion-engineering`** (which says "use the full *visual* engine,
> not flat 2D"). Here: *use the full audio stack, not voice-on-silence.* And like that skill, it is **honest
> about what's WIRED vs what's a GAP needing a build step** — don't promise audio the pipeline can't mix yet.

## The 5 channels (plan them together; the emotional arc is the conductor)

| Channel | Job | How to specify it | Pipeline status |
|---|---|---|---|
| **VOICE** | the through-line; rhythm + emphasis | `config.yaml audio.engine` + `length_scale` + `rate` | ✅ WIRED |
| **MUSIC bed** | attention + emotional tone; swell on the build, drop before the payoff | `audio.music: path.mp3` + `audio.music_gain_db` (auto side-chain **ducked** under the voice) | ✅ **WIRED** — drop in a music file |
| **SFX** | *structure* the content — mark transitions, land the audio half of each reveal | `audio.sfx: true` mixes the `sfx_emitter.py` cues; sound files in `projects/<name>/assets/sfx/` | ✅ **WIRED** — drop in the sound files |
| **SILENCE** | the deliberate DROP — cut audio 1–2s before the biggest line so it lands | `<pause Xs>` in the narration | ✅ WIRED (real silence) |
| **SWELLS / STINGERS** | stack on the ONE peak — swell + sting + the quote line together | mark on the peak beat; a stinger = a loud sfx cue on the peak frame | ◐ mix WIRED — author the placement |

**Stack channels on the peaks; thin them on the rests.** The video's ONE peak (the Creative Director's Wonder
beat) = a visual transformation + an sfx sting + a music swell + the quote line, on the same frame. A flat
moment = voice over a static visual with constant music → the viewer scrolls.

**Where to stack is already marked — read the beat's `intensity:` / the compiled `cue:`.** You don't have to
re-derive the peaks: each beat carries an `intensity:` (`low·medium·impact·climax·wonder`,
`scene-composer`) and `vg-motion-compiler` compiles it to a `cue:` on the payoff row —
`impact → sting`, `climax → swell+sting`, `wonder → swell + 1–2s pre-silence`. So place the sting on every
`impact`/`climax` beat, the music swell on `climax`/`wonder`, and the `<pause>` silence right before a
`wonder`/`climax` line. `medium`/`low` beats stay thin. The intensity dial IS the channel-stacking map.

---

## What's WIRED today (use it now)

### VOICE — engine, expressiveness, loudness (all in `config.yaml audio:`)
```yaml
audio:
  engine: piper                       # 'edge_tts' (default, flat) | 'piper' (local, more expressive)
  model: models/piper/en_US-ryan-high.onnx   # piper voice
  length_scale: 1.0                   # piper: >1 = slower/weightier delivery, <1 = quicker
  rate: '+0%'                         # edge_tts speed
  loudnorm: true                      # bakes −14 LUFS / TP −1.5 / LRA 11 (YouTube target) — default on
  denoise: true                      # light voice denoise — default on
```
- **edge-tts STRIPS SSML** (emphasis/prosody tags are dropped) → flat, demo-grade voice. For an expressive
  read, **switch `engine: piper`** (`pip install piper-tts` + the `en_US-ryan-high.onnx` model) — local,
  no SSML but real prosody, and tune weight with `length_scale`. ElevenLabs would be best (true SSML) but is
  **not wired** — adding it is a build task. Mayer's Voice Principle: a machine-flat voice measurably hurts
  comprehension, so the engine choice is a *quality* decision, not cosmetic.
- **Loudness is already correct** — `loudnorm=I=-14:TP=-1.5:LRA=11` is baked into the narration master and
  the final mux (default on). Don't re-normalize; just keep it on.

### SILENCE — the most underused tool, and it works TODAY
A 1–2s pause **before** the biggest line sharpens attention (the brain leans in); beyond ~3s it drags. The
pipeline produces **real, exact-duration silence** from `<pause Xs>` markers (split-render-concat, so the
duration is honored even on edge-tts). So: **mark `<pause 1s>` right before the peak line** in the narration —
that silence beat is free and lands today. (Owned mechanically by `vg-ssml-narration` / the pause pipeline;
this skill decides *where* the dramatic silences go.)

### SFX — cues are auto-EMITTED (the mix is the gap, below)
`storyboard/sfx_emitter.py` already walks each scene's bullets and writes cue JSONs to
`projects/<name>/sfx/<scene_id>_cues.json`:
```json
{ "sound": "reveal_hit", "frame": 312, "volume": 0.12, "source": "bullet 4 spring(damping=8)" }
```
It auto-infers: `ui_pop` on each entrance, `transition_whoosh` on a REPLACE backdrop, `reveal_hit` on a
low-damping spring (the payoff), per-word typewriter ticks on typing bullets. **Review/curate these cues**
(cut the noisy ones, keep the sting on the real reveal, raise/lower `volume`). For a *bespoke* in-bullet sound,
the `Audio` binding is available in `DynamicBlock` (rare — the TTS track is the main audio).

---

## The MIX is WIRED — you supply the assets (config it in `config.yaml`)

The music+sfx **mix step is built**: `storyboard/audio_mixer.py`, called from `build_video.py` (step
10·pre) *before* the master render. It side-chain-**ducks** a music bed under the voice, places each
`sfx_emitter` cue at its master-timeline time + volume, then re-normalizes the whole mix to −14 LUFS /
−1 dBTP. Enable it:
```yaml
audio:
  music: assets/music/bed.mp3   # a music bed — looped/trimmed + auto-ducked. omit = no bed
  music_gain_db: -20            # bed level under the voice
  sfx: true                     # mix the sfx_emitter cues
  sfx_dir: assets/sfx           # default projects/<name>/assets/sfx/  (files: ui_pop.wav, reveal_hit.wav, …)
```
**OFF by default** — with no `music` and `sfx:false` the mixer no-ops to the plain narration. Missing sound
files are skipped; any mix failure falls back to narration (it can never break a build).

**The remaining gap is ASSETS, not code** (be honest in the plan; `vg-quality-audio` scores these as GAPs
until present):
1. **The sound-file LIBRARY** — `ui_pop` / `transition_whoosh` / `reveal_hit` / `text_tick` / `impact_soft`
   (`.wav`/`.mp3`) under `assets/sfx/`. **The repo ships none** — drop in CC-licensed one-shots to activate sfx.
2. **A music bed** track to point `audio.music` at. Then **curate** the auto-emitted cues (cut the noisy
   ticks; `sfx_max` caps the count) and mark the bed's swell/drop points.
3. **Swells/stingers** — now expressible: a stinger = a loud one-shot sfx cue on the peak frame; a swell =
   a louder/rising bed section into the peak.
4. **Still a code gap:** **ElevenLabs / true-SSML** voice (richer than piper — a TTS-adapter task).

Plan format: a once-per-video **SOUND PLAN** — the bed + its swell/drop points, the curated sfx cue list,
the dramatic-silence beats, and the peak stack (swell + sting + line on one frame).

---

## Loudness + mix targets (the spec the mux must hit)
- **Integrated −14 LUFS**, **true peak ≤ −1 dBTP**, LRA ~11 (YouTube) — already the loudnorm setting; the
  *final* mix (voice+music+sfx) must re-measure to this, not just the voice.
- **Music bed sits ~−18 to −22 LUFS** under the voice, ducking another ~6–9 dB while the voice speaks.
- **SFX one-shots** ~−12 to −18 dB relative to voice (the emitter's 0.08–0.12 volumes are a good start).
- **Never let any single −1 dBTP true-peak clip** after the amix — re-limit if needed.

---

## Where it runs + who it pairs with
- **Runs in Phase 2, after narration/sync (step 5), before the master mux (step 8)** — design the layer, set
  the config, curate the cues, mark the silences, then the mux assembles it.
- **Upstream plan:** `teaching-narrative-engine` (Phase 1) already marks the swell / sting / silence
  points as the *multi-channel* retention plan — this skill is the **render-side executor** of that plan.
- **Downstream score:** `vg-quality-audio` scores the result (voice expressiveness · −14 LUFS/TP · music+
  ducking · sfx-on-reveals · silence-at-peak · non-silent) into the MASTER-PASS `audio=<N>/10` field. Author
  here; score there. Music/sfx absent → it scores them as GAPs (honest), not failures.
- **Always run `ffmpeg -i <final> -af volumedetect -f null -`** on the final mp4 — a master that lost its
  audio overlay ships SILENT otherwise (a real recurring failure).

## Guidelines
### Always
- Treat audio as HALF the quality — a flawless visual with flat voice + dead silence is a 5/10 video
- Switch `engine: piper` for any video that should sound expressive (edge-tts is demo-grade)
- Put a deliberate `<pause 1s>` before the peak line — it works TODAY and costs nothing
- Curate the auto-emitted sfx cues (cut noise, keep the sting on the real reveal)
- Stack voice+sting+swell+line on the ONE peak; thin the channels on the rests
- Keep `loudnorm` on; re-measure the FINAL mix (voice+music+sfx) to −14 LUFS / −1 dBTP
- Be HONEST: mark music/sfx/ducking as GAPs in the plan until the mux step is built
### Never
- Ship voice-on-silence and call the audio done (that's the current default — this skill exists to fix it)
- Lay a music bed without ducking — it buries the voice
- Use a >3s silence (it drags) or silence at a random spot (only before a real reveal)
- Claim a video has music/sfx when the cues were emitted but never mixed
- Re-normalize loudness twice, or let the amix clip past −1 dBTP

## Grounded in
- YouTube loudness standard (−14 LUFS / −1 dBTP) · Mayer's *Voice Principle* (machine-flat voice harms
  comprehension) · film audio mixing (voice-led, ducked bed, sfx structure) · the project audio plan in
  `docs/SOUND.md` + the audit rationale in `improvements_docs/` (doc 06). Verify wired-vs-gap against
  `storyboard/build_video.py` (engine/loudnorm + the step-10·pre mix call), `storyboard/audio_mixer.py`
  (the ducked music + sfx mix), and `storyboard/sfx_emitter.py` (cue format) before promising.
