---
name: vg-known-bugs
description: "Concrete bugs that have hit this pipeline, why they happened, and what now prevents them. Read before editing build_video.py, ssml_compiler.py, or visual_designer.py. Use whenever editing pipeline Python files, debugging a regression, or any request like "edit pipeline code," "known bugs," "regression prevention," or "what went wrong before.""
model: opus
---


# Known Bugs and Prevention

This file is the **post-mortem**. Every bug listed here was real. Each is now
either fixed in code, structurally prevented by a regression test
(`storyboard/test_pipeline_fixes.py`), or flagged in docs so it cannot
silently regress.

---

> **This catalog was 1208 lines — over the skill load limit, so its tail truncated on load.**
> The per-class detail now lives in two on-demand reference files; READ THE RELEVANT ONE when you
> hit (or might cause) a class. This body keeps the router + the process rule.

- **Build / TTS / render-pipeline bugs — Class 1–20** → `references/known-bugs-build-pipeline.md`
  (read before editing `build_video.py`, `ssml_compiler.py`, `narration_pacer.py`, `visual_designer.py`).
- **Per-bullet codegen / visual + anchor-sync + render-monitoring — Class N…N+13** + the Scene
  Verification Checklist → `references/known-bugs-codegen-sync.md`
  (read before authoring bullet code or diagnosing a 'frozen' render / sync drift).

---

## Bug-class to defense matrix

| Bug class | Defense | Where enforced |
|-----------|---------|----------------|
| `<pause Xs>` leak into TTS | `_convert_author_pauses` before `_escape` + `html.unescape` in strip pipeline | `ssml_compiler.py`, `build_video.py` (HARD) |
| Anchor miss on decimals/hyphens | `normalize_for_match` + `expand_decimals` | `build_video.py` (HARD) |
| Fuzzy hits credited as time | `anchor_hit_flags` from single fuzzy call | `build_video.py` Step 7 (HARD) |
| MIN_BLOCK overshoot tiny scene | shrink to `duration_frames // n` + cap framesTo | `build_video.py` Step 7 (HARD) |
| Time-fallback picks earliest word | proportional scaling + remaining-audio distribution | `build_video.py` Step 6 (HARD) |
| Cmd-window flash on Windows | `creationflags=_NOWIN` on every subprocess | 4 storyboard `.py` files (HARD) |
| Killed mid-write → corrupt mp4 | `.inprogress` + `os.replace()` atomic write | `build_video.py` Step 9 + Step 10 (HARD) |
| Resume-skip trusts a corrupt mp4 | `_mp4_is_healthy()` gates the skip path | `build_video.py` Step 9 (HARD) |
| Render exits 0 but mp4 is corrupt | post-render `_mp4_is_healthy` sweep | `build_video.py` Step 9 (HARD) |
| Stitch exits 0 but final mp4 is unplayable | health-check `.inprogress` before `os.replace` | `build_video.py` Step 10 (HARD) |
| Per-bullet codegen failure | per-bullet retry + per-bullet cache | `visual_designer.py` (HARD per bullet) |
| Bad scene ID format | `validate_pipeline.py` | Step 8.5 (HARD) |
| Bad structured script | parser raises + linter warns | `source_parser.py` (HARD/SOFT) |
| `config.yaml` missing field | schema check from `design.ts` | Step 1 (HARD) |
| Scene JSON missing pre-render | `validate_pipeline.py` | Step 8.5 (HARD) |
| `config_tokens.json` ↔ `design.ts` drift | `validate_pipeline.py` | Step 8.5 (HARD) |
| Empty/black render output | `visual_qa.py` brightness check | Step 9.5 (WARN) |
| Low audio_anchor coverage | `build_video.py` reports % | Step 7 (WARN) |
| Block code throws at runtime | red `BLOCK RUNTIME ERROR` overlay | `DynamicBlock.tsx` (VISIBLE) |
| Visual layout / contrast / overflow | needs vision-model QA | manual review (SOFT) |
| Visuals fast / sound slow (TTS rate) | WPM check + `[time]` scaling fix | Step 4 (WARN) |
| Video stuck / silence gaps (pacer uses script windows) | `_required_display_seconds` uses body-length only, NOT `time_to_sec - time_from_sec`; `MAX_DISPLAY_SECONDS=2.0` | `narration_pacer.py` (HARD) |

---

---

---

## Index — which class lives in which reference file

- Class 1 — `<pause Xs>` markers leaked into spoken TTS  → `build-pipeline`
- Class 2 — Audio-anchor missed words containing decimals or hyphens  → `build-pipeline`
- Class 3 — Fuzzy anchor hits mislabeled as time-fallback  → `build-pipeline`
- Class 4 — `MIN_BLOCK_FRAMES` overflowed scene duration on tiny scenes  → `build-pipeline`
- Class 5 — Time-based fallback computed wrong target second  → `build-pipeline`
- Class 6 — Cmd window flashes on every subprocess (Windows)  → `build-pipeline`
- Class 7 — Hardcoded fps / dimensions in emitted React code  → `build-pipeline`
- Class 8 — Render crashes left corrupt mp4s on disk  → `build-pipeline`
- Class 9 — Slow render (re-bundle per scene)  → `build-pipeline`
- Class 10 — "Visuals fast, sound slow" — TTS rate too slow for script windows  → `build-pipeline`
- Class 11 — Placeholder block masquerades as real codegen  → `build-pipeline`
- Class 12 — Cache hit serves stale output after config change  → `build-pipeline`
- Class 13 — Crash mid-write corrupts a build artifact  → `build-pipeline`
- Class 14 — `int()` vs `round()` frame-conversion drift  → `build-pipeline`
- Class 15 — ffmpeg INPUT seek lands on a black keyframe  → `build-pipeline`
- Class 16 — DynamicBlock RUNTIME_KEYS / args drift (off-by-one binding)  → `build-pipeline`
- Class 17 — Production sidecars missing from final mp4  → `build-pipeline`
- Class 18 — Per-bullet `claude` CLI subprocess (token blowout)  → `build-pipeline`
- Class 19 — Narration pacer silence blowout from script time windows  → `build-pipeline`
- Class 20 — Scene JSON syntax errors baked into render bundle  → `build-pipeline`
- Class 21 — Scene boundary exact-matched a LATER scene's words (Whisper contraction "here's")  → `build-pipeline`
- Class N — audio_anchor fails narration verbatim check due to `<pause Xs>` tokens  → `codegen-sync`
- Class N+1 — Minimal bullet code produces visually meaningless output  → `codegen-sync`
- MANDATORY PRE-RENDER GATE — Visual Walkthrough (rule 19 § 10)  → `codegen-sync`
- Class N+2 — ADDITIVE bullet assumes previous bullet's visuals are still visible  → `codegen-sync`
- Class N+3 — Empty container: border drawn, inner content missing  → `codegen-sync`
- Class N+4 — Multiple position:absolute at same coordinates (duplicate overlay bug)  → `codegen-sync`
- Class N+5 — Diagonal line coded as filled rectangle  → `codegen-sync`
- Class N+6 — Two-panel comparison split across two ADDITIVE bullets  → `codegen-sync`
- Class N+7 — Unlabeled data bars (benchmark bars with no model identity)  → `codegen-sync`
- Class N+8 — Pipeline output appears frozen in background tasks (false hang diagnosis)  → `codegen-sync`
- Class N+9 — Remotion (node) render progress invisible in log files  → `codegen-sync`
- Class N+10 — Canvas underutilization (content <60% of screen)  → `codegen-sync`
- Class N+11 — Absolute overlay collides with card header (stamp/badge overlap)  → `codegen-sync`
- Session progress record (an example build)  → `codegen-sync`
- Class N+12 — Anchor phrase tokenization mismatch → interpolated framesFrom lands seconds off  → `codegen-sync`
- Scene Verification Checklist (run after every render, before master stitch)  → `codegen-sync`
- Class N+13 — Render hangs forever (parent-side `proc.wait()` with no ceiling)  → `codegen-sync`

---

## What to do when you hit something not in this list

1. Add it here as a new class with symptom + root cause + defense.
2. If structural prevention is possible (regression test in
   `test_pipeline_fixes.py`), add it.
3. If only docs can prevent, mark it in the relevant rule with `**KNOWN ISSUE:**`.

The principle: **every bug we hit twice is a process failure, not a code bug.**
Each Class above shipped with a regression test in
`storyboard/test_pipeline_fixes.py` — run that file (`python -m
storyboard.test_pipeline_fixes`) before any change to the matching code area.
