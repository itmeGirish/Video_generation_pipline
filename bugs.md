# Bug Log — Video Generation Pipeline

## BUG CLASS 1 — Late Audio Anchor (Visual Appears After Narration Starts)

**Status:** Partially fixed (prompt hardened; existing scenes need manual framesFrom patches)

### Root Cause
`audio_anchor` is authored by the LLM when seeding bullet cache. The LLM was given the full scene narration and allowed to pick ANY phrase as the anchor. It naturally gravitated toward **dramatic/climax phrases** (end of a sentence) instead of **opening phrases** (start of a sentence).

The pipeline resolves `framesFrom = round(whisper_word_start × FPS)` for whatever anchor phrase is given. If the anchor is at the END of the narration sentence, the visual appears seconds AFTER the narrator already started talking about it.

**Architecture gap:** No build-time detection that anchor fires late relative to when that block's topic began in the narration.

### Fix Applied (2026-05-17)
- `storyboard/visual_designer.py` rule 4 rewritten: anchor must be OPENING words of block's topic, with BAD/GOOD examples
- Full-scene narration in prompt now labeled "for CONTEXT ONLY — do NOT pick anchor from here"

### Known Affected Blocks (chat-5-5)

| Scene | Block | Anchor (wrong) | Fires at | Should fire at | Drift |
|-------|-------|----------------|----------|----------------|-------|
| S01 | B2 | "limb amputated" | 15.6s (frame 468) | 8.88s (frame 266) | **6.7s late** |
| S03 | B4 | "Warp" | 35.07s (frame 1052) | 23.76s (frame 713) | **11.3s late** |
| S04 | B6 | "fixing" | 41.0s (frame 1230) | 36.52s (frame 1096) | **4.5s late** |
| S06 | B5 | "$7,980" (digit tokenization) | 99.0s (frame 2970) | 62.38s (frame 1871) | **36.6s late** |

### Required JSON Patches

**S01 B2:**
```json
B1.framesTo: 468 → 266
B2.framesFrom: 468 → 266
```

**S03 B4:**
```json
B3.framesTo: (current) → 713
B4.framesFrom: 1052 → 713
```

**S04 B6:**
```json
B5.framesTo: (current) → 1096
B6.framesFrom: 1230 → 1096
```

**S06 B5 (most severe — block reordering needed):**
```json
B3.framesTo: 2661 → 1871
B5.framesFrom: 2970 → 1871
B5.framesTo: 3280 → 2661
B4.framesTo: 2970 → 3280
```

---

## BUG CLASS 2 — Screen Underutilization (V1 Fail)

**Status:** Partially fixed (S01 B1, B2 fixed; others TBD per scene verification)

### Root Cause
LLM authored bullet code with small/narrow elements — card width 46% of canvas, card positioned upper-left only, no background fill. Canvas appears mostly empty.

### Fix Pattern
- Increase card width to 70-80% of canvas width
- Add header label at top (8% height) and context line at bottom (bottom 10-12%)
- Add background texture (dot-grid radial-gradient) or large ghost text as fill
- For quote blocks: wide full-width card + label above + amber context below

### Known Fixed Blocks
- S01 B1: card 46%→54%, added dot-grid bg + header + tagline
- S01 B2: card 56%→80%, added FACT1 label + amber context footer
- S02 B5: "7 DAYS APART" text enlarged, amber glow added
- S03 B8: replaced corner quote with full-screen hero visual

---

## BUG CLASS 3 — Digit/Special Token Anchor Miss

**Status:** Pipeline workaround exists (fuzzy matching), but some digits still miss

### Root Cause
Whisper tokenizes numbers and model names differently from how they're written:
- "GPT-5.5" → "GPT", "5", ".5" or "GPT", "5.5" depending on context
- "$7,980" → "7", ",", "980" or separate tokens — anchor never matches

When `find_phrase_fuzzy()` fails to match, `framesFrom` is linear-interpolated from neighbors, which can place the visual wildly off (S06 B5: 36.6s late).

### Fix Applied
`normalize_for_match()` in `build_video.py` handles decimal expansion ("5.5" → "5 point 5") and hyphen removal. But comma-separated numbers ("$7,980") are not normalized.

### Pending Fix
Add comma-stripping to `normalize_for_match()` for digit sequences: `"7,980"` → `"7980"` or `"7 980"`.

---

## BUG CLASS 4 — Scene Transition Double-Dark Flash

**Status:** Fixed (remotion_master + crossfade_frames:12 + fade_frames:0)

Stacking both Backdrop fade and TransitionSeries fade caused double-darkening between scenes.

---

## BUG CLASS 5 — Slot Rendering vs Additive Rendering

**Status:** Fixed

`UniversalScene.tsx` must use `b.framesTo - b.framesFrom` (slot duration) not `sceneEnd - b.framesFrom` (additive). Additive mode stacks ALL bullets, causing visual overlap.

---

## How to Apply a framesFrom Patch

1. Edit `remotion/public/scenes/chat-5-5-sXX.json` AND `projects/chat_5_5/scenes/chat-5-5-sXX.json`
2. Update the affected block's `framesFrom` / `framesTo`
3. Delete `remotion/out/chat-5-5-sXX.mp4`
4. Re-render: `cd remotion && PROJECT=chat_5_5 node render_scenes.mjs chat-5-5-sXX`
5. Extract frames at block midpoints and verify V1-V8

---

## Verification Status (chat-5-5)

| Scene | Sync Fixed | Visual Fixed | Verified |
|-------|-----------|--------------|---------|
| S01 | B2 PENDING patch | B1 B2 DONE | IN PROGRESS |
| S02 | OK | B5 DONE | PENDING |
| S03 | B4 PENDING patch | B8 DONE | PENDING |
| S04 | B6 PENDING patch | OK | PENDING |
| S05 | OK | OK | PENDING |
| S06 | B5 PENDING patch | OK | PENDING |
| S07 | OK | OK | PENDING |
| S08 | OK | OK | PENDING |
| S09 | OK | OK | PENDING |
| S10 | OK | OK | PENDING |
