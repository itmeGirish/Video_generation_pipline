---
name: vg-narration-clarity
description: "The DIAGNOSTIC router for 'the video feels flat / boring / generic.' Maps that vague symptom to WHICH of the four perceived-quality channels failed (narration delivery · visual clarity · sync · pacing) and routes each to its OWNER skill. A dispatch table, not a teacher — it does not re-specify the audio_anchor contract, the visual rules, or the TTS engine (those live in their owners). Use when output feels boring/monotone/generic and you need to find which channel to fix."
model: opus
---

# Narration + Visual Clarity — the "feels flat" ROUTER

The pipeline can produce a **technically-correct video that still feels boring.** Every other gate is
single-channel; this skill exists for the *holistic* symptom — *"this just feels flat / generic / boring"* —
and its only job is to tell you **which of the four perceived-quality channels failed, and route you to that
channel's OWNER.** It does NOT re-teach the owners' rules (that is how content drifts out of sync — the very
redundancy this repo removes). Diagnose the channel, then invoke the owner.

## The four channels — diagnose which one is flat, then INVOKE its owner
| The video feels… | Failed channel | INVOKE the owner (don't fix it here) |
|---|---|---|
| narration is **monotone / sounds like a TTS demo** / no rhythm or punch | **Narration delivery** | `vg-ssml-narration` (write expressive SSML) · `vg-sound-design` (voice engine — `piper`, not flat edge-tts; music/sfx/silence) · `vg-quality-audio` (score it, −14 LUFS) |
| visuals are **generic / don't illustrate the words / cluttered / unreadable in 1s** | **Visual clarity** | `vg-visual-map` (the sentence test · Prohibited Patterns · the 3-element rule) · `vg-visual-quality` (score) · for the *script side*, `render-validator` (the muted test) |
| the visual **doesn't land on the spoken word** (anchor drift, wrong moment) | **Sync** | `vg-narration-alignment` (the `audio_anchor` → frame contract — exact-word anchors, ≥95% coverage, `find_phrase_fuzzy`) · `render-validator` (the sync gate) |
| a scene **sits static / too few changes per minute** | **Pacing** | `scene-planner` (SCENE PURPOSE + PACE / rhythm) · `teaching-narrative-engine` (pacing, multi-channel) · author-side `vg-code-trimming` (per-beat change) |

**Rule:** one flat symptom → one channel → its one owner. If you're tempted to *write* the audio_anchor rules,
the 3-element rule, or the TTS-engine choice here, stop — that content lives in the owners above; this skill
only points. (This mirrors CLAUDE.md's BUG ROUTER, but for the *vague* "feels flat" symptom rather than a
specific render bug.)

## The shipping check — verify all four channels (then route any failure above)
1. **Listen to the narration alone** (`audio/vo-*.mp3`). Dramatic, or flat? → Narration delivery channel.
2. **Watch the video MUTED.** Does each scene tell its story without audio? → Visual clarity channel.
3. **Watch with audio.** Do visuals change at the moment the narrator says the key word? → Sync channel.
4. **Count visual changes per minute.** < 8 = too slow → Pacing channel.

Each failed check routes to that channel's owner in the table above — this skill's whole value is turning
"it feels off" into "go fix channel X with skill Y," nothing more.
