# Review — `feed_back/Pixel RAG.mp4`

**Reviewed:** 2026-07-03 · against the render contract `projects/structured_scripts/pixel_rag.json`
**File probed:** 1920×1080 @ 30fps · 300.0s (5:00) · 227 MB · **one stream only (h264 video — no audio stream)**
**Method:** ffprobe stream/audio analysis + 34 frames sampled at 9s intervals (4 contact sheets), checked against the contract's scenes/beats/values and the pipeline's quality-gate criteria.

---

## ⚡ RESOLUTION STATUS (updated 2026-07-03, post-review)

The mp4 itself cannot be patched — **a re-render is required**. What WAS fixed is the architecture that let
these failures happen silently: the review exposed that the contract carried no audio spec, no spatial
layout, and no render constraints — so ANY renderer could produce this result while technically "following"
the contract. Three architectural fixes are now LIVE in `pixel_rag.json` (and the schema + skills, for all
future contracts):

| Review issue | Contract-side fix (DONE) | Still needs |
|---|---|---|
| F1 no audio | contract now carries the full `audio` section (voice engine + −14 LUFS, music arc + duck, 22 sfx cues, 3 designed silences, GAP list) + constraint "AUDIO IS MANDATORY… silent render is non-conformant" | re-render with TTS+mux |
| F2 truncated at 300s | constraint "RENDER THE FULL RUNTIME = clock.runtime_total_s (±2%); truncating scenes is non-conformant" (runtime 397.8s is locked in `clock`) | re-render all 8 scenes |
| M1 burned captions | constraint "CAPTIONS: sidecar-only (.srt); NEVER burn narration; on-screen text = the beat's `text` labels only" | re-render |
| M2 tiny elements / ghost contrast | every scene now has a **LAYOUT spatial spec** (exact %w×%h + attachment + z-order, hero ≥50% height) + SHOT/FRAMING + fill/contrast constraints | re-render |
| M3 text collisions | LAYOUT z-order per scene + constraint "NO TEXT COLLISION at settled frames" | re-render |
| M4 shred rendered as a fade | constraint "TRANSFORM EVENTS MUST BE SEEN — a Transform in what_happens must produce a visible shape change; fade-only = non-conformant" | re-render |
| M5 stale-element bleed | constraint "ADDITIVE BEATS ARE SELF-CONTAINED — redraw persistent elements at settled positions" | re-render |
| M6 flat peak / unraced race | LAYOUT pins S5's staging (the ONE lit pool, sizes); the lighting/mood fields were already in the contract — conformance is checked at the QA gate | re-render |

Also fixed at the architecture level (applies to every future video): `docs/render-contract.schema.json`
gained `audio` + `constraints` sections; `scene-composer` regained the LAYOUT + SHOT fields it had lost;
`render-contract-compiler` now requires both sections. Lesson recorded in project memory
(*the contract is the seam — rules that live only in skills never reach an external renderer*).

**Next action:** re-render from the updated contract — either through the project pipeline
(`python storyboard/build_video.py projects/structured_scripts/pixel_rag.json`, where every issue above is
hard-gated) or by the external renderer now that the contract carries the constraints it violated.

---

## Verdict

The render got the **content** right (every number, label, cite, and story element from the contract is present and correct — zero invented values) but fails on **execution**: 2 fatal + 6 major issues. It would not pass the pipeline's own gates.

---

## ✅ What it got right

- All contract values correct: `$29 / $59 / $200` table · `32×32 = 1,024` · `1,030 vectors · 128-dim` · `257.5 KB / page` · `20.1 h vs 65 min · 18.5×` · `81 vs 67` · `~30 ms` · `+18.1%`
- Story structure followed: wrong-price hook → crossed-out parser → case board → shred chapter → patches → beams → race
- On-screen citations partially present (PixelRAG arXiv on the +18.1%; "one L4 GPU" sub-caption on 20.1h; ColPali arXiv 2407.01449)
- The S5 beam mechanism (query chips → beams → score stack → `$200 CORRECT`) is structurally the strongest scene
- Warm-cream editorial style followed; the docked `257.5 KB / page` tag persists top-right as designed

---

## 🔴 FATAL

### F1 — No audio track at all
The file contains a single h264 video stream. No narration, no music, no sfx. Every sync decision in the contract (36 audio anchors, 24 designed pauses, the master clock) is meaningless without the voice. For a narration-anchored explainer this is a non-video.
*Pipeline gate that catches this: the `volumedetect` non-silence check.*

### F2 — The video is cut off: Scenes 7 and 8 are missing
Runs 300s and ends at the S6 scoreboard (~4:54). Missing entirely:
- **Scene 7 — The Bill** (the honesty chapter: 2.6 GB vs 20 MB, 129×, heavier indexes, VLM cost, the poisoned tile, text-native exemption)
- **Scene 8 — The Rule** (the takeaway: "photograph the page / parse born-text", the sort, the quote *"They were pictures all along."*)

Worse: S5 explicitly plants *"the bill for those one thousand thirty vectors lands in two minutes"* (the tag pulses red) — **a promised loop that is never closed**. The video ends with no payoff, no decision rule, no quote.
*Gate: the fidelity gate (bullet count = rendered blocks) + contract runtime (397.8s locked vs 300s delivered).*

---

## 🟠 MAJOR

### M1 — Full narration burned in as subtitles
Every sentence renders as bottom-of-frame captions with orange keyword highlights. Design law violated: on-screen text = headline + labels (≤3 words or one number); narration is AUDIO; captions belong in the `.srt` sidecar. The caption zone (bottom 12%) is permanently occupied.

### M2 — Canvas underutilization + washed-out contrast
Most frames use ~25–30% of the canvas — small cards floating in empty cream. Several beats nearly invisible:
- the S1 fork (PARSE | PHOTOGRAPH) is a ghost at ~15% opacity
- the case board renders pale-violet-on-cream, labels illegible at 1080p
- ghost overlays and dimmed states drop below legibility
The muted test fails exactly where the design needed it to pass.
*Gates: V1/V3 canvas-fill + readable-contrast checks.*

### M3 — Text collision / garbling (V9 class)
The S3 word-stream renders THROUGH other elements — readable garbage like **"Prban"**, **"Bi$29ng"** where the stream text crosses the pricing table and the board; the `257.5 KB / page` tag prints over the `1,030 vectors · 128-dim` label. Multiple beats show z-fighting text.
*Gate: `layout_validator` → `text_overlap: 0` required.*

### M4 — The signature transformation never happens (shred = fade)
The crime the whole video is built on — the page physically SHREDDING into strips that re-weave into a flat stream — renders as: parser box appears → a paragraph of text fades in below it. No strips, no flutter, no destructive transform. "Pro drifts away from its own price" reads as static highlighted text. The contract's `Transform` events were flattened into fades — slide, not shot.
*Gate: Visual Proof transformation-Δ (near-identical keyframes = mechanical FAIL) + SUBJECT-MOVED.*

### M5 — Stale-element bleed between beats
Prior beats' elements linger mispositioned into later beats (e.g. the `$29` answer card floating top-left over a subsequent beat's table + parser cluster). The additive-redraw discipline (each beat self-contained, prior elements redrawn at settled positions) was not followed.

### M6 — The peak and the race play at ~40% intensity
- **S5 (the peak):** the room is flat grey-brown instead of near-black with ONE light pool; beams are hairline-thin; region "ignites" are small cell highlights with no bloom; chips are small. The wonder beat is structurally present but emotionally flat. The beam-lock frame (the video's designed screenshot/thumbnail frame) doesn't hit.
- **S6 (the race):** both time bars appear already-filled in adjacent samples — the race isn't *raced* (no visible crawl-vs-sprint). Error-dot "breeding" renders as a few tiny dots, easy to miss. The 81 vs 67 shows as two unlabeled squares (no `nDCG@5 · ViDoRe` context visible).

---

## 🟡 MINOR

- Scene timing compressed overall (300s vs the locked 397.8s) — pauses/holds largely dropped, so the designed stillness (the "landed" moments) is gone
- The S2 board labels type on but remain too small to read comfortably
- The green-check "PARSE: OK ✓" beat renders (good) but the dark-comedy beat has no emphasis (no lamp flash bloom, no sound anyway)
- End card / final hold absent (video just ends — consequence of F2)

---

## Root cause

Every issue above is a failure class the Phase-2 pipeline gates were built to block; this external render bypassed all of them:

| Issue | The gate that would have blocked it |
|---|---|
| F1 silent | `ffmpeg volumedetect` non-silence check (MASTER RENDER AUDIO rule) |
| F2 missing scenes | fidelity gate (bullet count = rendered blocks) + duration check |
| M1 captions | project rule: burned-in captions DISABLED (`.srt` sidecar) |
| M2 fill/contrast | V1/V3 + readable-contrast + `vg-visual-quality` factors |
| M3 overlaps | `layout_validator` (`text_overlap: 0`) |
| M4 flat transforms | Visual Proof transformation-Δ + `vg-quality-animations` SUBJECT-MOVED |
| M5 bleed | ADDITIVE self-containment rule (SHIFT-LEFT #3) |
| M6 flat peak | lighting track conformance + `vg-scene-validator` (12-layer contract check) |

## Fix priority

1. **Audio** (F1) — non-negotiable
2. **Render the missing Scenes 7–8** (F2) — the video currently has no ending
3. **The shred transform** (M4) — the premise must be *seen*
4. **Remove burned captions** (M1) → `.srt`
5. **Fill + contrast pass** (M2) — scale content to ≥60% canvas, fix the ghost beats
6. **Overlap fixes** (M3)
7. **Peak intensity + race choreography** (M6), bleed cleanup (M5)

Alternative: render the same contract through the project pipeline (`python storyboard/build_video.py projects/structured_scripts/pixel_rag.json`), where each of these failures is hard-blocked before ship.
