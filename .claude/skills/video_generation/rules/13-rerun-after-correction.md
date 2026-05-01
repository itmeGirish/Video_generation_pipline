---
name: rerun-after-correction
description: When a validator flags an error, this rule maps the error → the file to fix → the exact command to re-run efficiently (clearing only the right caches).
metadata:
  tags: rerun, cache, debugging, workflow, recovery
---

# Re-run After Correction

When `build_video.py` finishes (or fails) and a validator reports issues,
follow this exact workflow. Each error class maps to (1) what file to edit,
(2) which cache to invalidate, (3) the right re-run command.

The pipeline is **resumable** — caches are keyed by content hashes, so changing
the right input automatically invalidates the right downstream stage. The
`--force/--redesign/--retts` flags exist for the cases where you want to
override that.

---

## Re-run flags

| Flag | What it clears | When to use |
|------|----------------|-------------|
| (none) | nothing — relies on hash invalidation | normal iteration after editing the structured script |
| `--redesign` | All LLM bullet caches | LLM-emitted React was wrong, but TTS+audio are fine |
| `--retts` | TTS hash | SSML compiler logic changed, audio needs re-gen |
| `--force` | designs + transcripts + TTS hash + scene renders | something is deeply wrong; nuclear option |
| `--scene N` | one scene's render only | iterating on a single scene's visuals |

To re-codegen ONE bullet only (faster than --redesign which clears all):
```bash
rm storyboard/.cache/designs/bullet-s{N}-b{M}-*.json
python -m storyboard.build_video projects/<name>/
```

---

## Error class → fix → re-run command

### Step 3 — visual codegen errors

**`scene N bullet M failed after K attempts. Last error: claude CLI rate-limited`**
→ Per-account API throttle is active. Wait 5–10 min for the throttle to clear, then re-run.
→ The bullet's cache file isn't written (so the failed bullet automatically retries).
→ Cached bullets in the same scene (and earlier scenes) are kept; only the failed bullet re-runs.
→ To reduce future rate hits: set `DESIGNER_PARALLELISM=1` env var.

**`scene N bullet M: response missing or empty 'code' field`**
→ LLM returned malformed JSON. Auto-retry up to 3× with 20/40/60s backoff.
→ If it still fails, edit the bullet body in the structured script to be more concrete
   (vague bullets like "the reveal" give the LLM nothing to render).
→ Re-run: source hash changes auto-invalidate that bullet's cache.

**`scene N bullet M: 'code' field has no React.createElement call`**
→ LLM emitted JSX (forbidden) or some other shape. Same fix as above.

**`scene N bullet M: audio_anchor 'X' not in narration — pick a verbatim phrase`**
→ LLM hallucinated the anchor. Auto-retry up to 3×.
→ If persistent, the bullet body may not provide enough hints for the LLM to pick a
   real phrase. Add explicit anchor candidates inside the bullet body.

---

### Step 1 — config schema check errors

**`config.yaml design section missing required keys: ['surface']`**
→ Edit `projects/<name>/config.yaml` — add the missing key under `design:`.
→ Re-run normally. `config_tokens.json` is overwritten on every run.

---

### Step 2 — structured-script linter warnings

**`scene N: missing ### Narration block`** (or Animation block)
→ Edit `projects/structured_scripts/<name>.txt` — add the missing block.
→ Re-run with `--redesign`: source change invalidates design cache automatically,
  but if the cache file isn't picking up the change, force it.
→ Command: `python storyboard/build_video.py projects/<name>/ --redesign`

**`line N: scene header malformed`**
→ Fix the time window format `(M:SS – M:SS)`.
→ Re-run normally — source hash will change, designs auto-invalidate.

---

### Step 3 — LLM/fidelity errors

**`LLM returned X blocks but scene has Y bullets` (after 3 retries)**
→ Edit `projects/structured_scripts/<name>.txt` — make the animation bullets clearer
  (each bullet should clearly describe ONE visual block).
→ Re-run with `--redesign` to force fresh LLM call.

**`LLM picked unknown primitive 'X'`**
→ Either: add `X.tsx` to primitives dir + register in `UniversalScene.tsx`, OR
→ Edit the structured-script bullet to better match an existing primitive's description.
→ Re-run with `--redesign`.

---

### Step 8.5 — `validate_pipeline.py` errors

**`scene-id: scene JSON missing`**
→ Step 7 didn't write it. Usually means LLM design failed silently.
→ Re-run with `--redesign`.

**`scene-id: not in timelines.ts`**
→ Step 8 patch failed. Re-run normally — patcher is idempotent.

**`config_tokens.json missing keys required by DesignTokens: [...]`**
→ Either: add field to `config.yaml.design`, OR remove field from
  `design.ts DesignTokens` if no longer needed.
→ Re-run normally.

---

### Step 9.5 — `visual_qa.py` warnings

**`scene-id: midpoint frame is BLACK`**
→ Likely the scene JSON has bad blocks or LLM-emitted code threw at runtime.
→ Inspect: `cat projects/<name>/scenes/<sid>.json | jq`
→ If `code` field looks wrong / shallow → fix the structured-script bullet body + `--redesign`
→ If render shows `BLOCK COMPILE ERROR` / `BLOCK RUNTIME ERROR` → LLM-emitted code is broken; `--redesign` to regenerate

**`primitive distribution heavily skewed`**
→ LLM is stuck on one type. Make structured-script animation bullets more varied
  (use different verbs, different visual concepts).
→ Re-run with `--redesign`.

---

### Step 10.5 — `validate_output.py` errors

**`scene N: narration coverage only X%`**
→ Most likely cause: scene boundary detection picked the wrong span.
→ Check: was the scene's first sentence misheard by Whisper?
→ Fix: edit narration's opening words to be more distinctive in the structured script
→ Re-run with `--retts` (forces re-TTS + re-Whisper).

**`scene N bullet J: midpoint frame is BLACK`**
→ The specific bullet's LLM-emitted code rendered nothing.
→ Inspect: look at `projects/<name>/scenes/<sid>.json` block J — check the `code` field.
→ If `code` is shallow / generic: fix the structured-script bullet body → `--redesign`
→ If `code` looks right but render is empty: re-run with `--redesign` (LLM may have emitted a runtime no-op)

**`fidelity broken: X bullets, Y blocks`**
→ Should have been caught at Step 3. If you see it here, design cache is stale.
→ Re-run with `--redesign`.

---

## Quick decision tree

```
Did the error mention a `.tsx` file in `remotion/src/` (Backdrop, DynamicBlock,
VideoCaptions, etc. — the runtime scaffold, not the LLM-emitted bullet code)?
  YES → Fix that .tsx, re-run normally (no cache flag).
  NO  ↓

Did the error mention structured-script format or content?
  YES → Fix the structured script, re-run normally (source hash auto-invalidates per-bullet codegen).
  NO  ↓

Did the error mention an emitted `code` field that throws (BLOCK COMPILE/RUNTIME ERROR overlay)?
  YES → Fix the structured-script bullet body to be more concrete, re-run with --redesign
        (or delete just the offending bullet's cache file: storyboard/.cache/designs/bullet-s{N}-b{M}-*.json).
  NO  ↓

Did the error mention narration coverage or audio?
  YES → Fix the structured-script narration, re-run with --retts.
  NO  ↓

Something else broken? → --force and start fresh.
```

---

## What survives a `--force`

- `projects/structured_scripts/<name>.txt` — your script
- `projects/<name>/config.yaml` — your config
- `projects/<name>/scenes/*.json` — these get rewritten next run anyway (canonical, but regenerated from cache + script)
- `remotion/public/scenes/*.json` — build mirror, refreshed on every run
- `remotion/src/universal/DynamicBlock.tsx` — runtime code interpreter (no per-primitive .tsx files anymore)

## What `--force` deletes

- `storyboard/.cache/designs/scene-N-*.json` — LLM design results
- `storyboard/.cache/transcript-*.json` — Whisper transcripts
- `projects/<name>/audio/.*.hash` — TTS hash markers (audio mp3 stays)
- `remotion/out/*.mp4` — per-scene silent renders

The TTS audio mp3 itself is NOT deleted (only the hash). On next run, the new
hash will mismatch and the mp3 will be regenerated naturally.

---

## Single-scene fast iteration loop

When tweaking one specific scene's primitive or animation:

```bash
# 1. Edit projects/structured_scripts/<name>.txt (just the one scene's bullets)
# 2. Run only that scene — skips all other scenes' renders
python storyboard/build_video.py projects/<name>/ --scene 3

# 3. Watch the preview
# Output: remotion/out/<scene-id>.mp4 (no audio, ~10s render)

# 4. If primitive choice was wrong, force redesign of just this run
python storyboard/build_video.py projects/<name>/ --scene 3 --redesign
```

This loop is ~10 seconds per iteration vs ~5 minutes for a full build.
