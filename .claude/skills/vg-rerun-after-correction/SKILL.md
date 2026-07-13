---
name: vg-rerun-after-correction
description: "When a validator flags an error: maps error to file to fix to exact command to re-run, clearing only the right caches. Use whenever a build fails, a validator reports an issue, or any request like "rerun after fix," "clear cache," "fix and rerun," "which flag to use," "pipeline error," or "how to fix this build error.""
model: opus
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
| `--redesign` | All bullet caches | The cached React for one or more bullets is wrong; you want to re-author + re-seed every bullet |
| `--retts` | TTS hash | SSML compiler logic changed, audio needs re-gen |
| `--force` | designs + transcripts + TTS hash + scene renders | something is deeply wrong; nuclear option |
| `--scene N` | one scene's render only | iterating on a single scene's visuals |

> **Important:** `--redesign` and `--force` only DELETE the cache. They do NOT
> re-author the bullet code — the pipeline never spawns `claude` CLI. After
> deleting, re-author the affected bullets in this Claude Code session, then
> re-seed via `seed_bullet_cache.py`, then re-run the build.

**To re-author ONE bullet only:**
```bash
# 1. delete the stale cache file
rm storyboard/.cache/designs/bullet-s{N}-b{M}-*.json

# 2. re-author the bullet here (read scene N bullet M from the structured script,
#    write fresh React.createElement code + audio_anchor)

# 3. seed it back
python storyboard/seed_bullet_cache.py projects/scripts/<name>.txt \
    --scene N --bullet M --anchor '<verbatim phrase>' --code-file path/to/code.js

# 4. re-run
python -m storyboard.build_video projects/<name>/
```

For batch re-authoring, write a JSON bundle and pass `--json bundle.json`.

---

## Error class → fix → re-run command

### Step 2 — visual codegen errors

**`scene N bullet M: cache miss` (CacheMissError)**
→ The bullet has no cached design. The pipeline does NOT generate it for you —
  re-author it here in-session and seed via `seed_bullet_cache.py`. The error
  message shows the exact bullet body and seed command.

**`scene N bullet M: cache file has empty/missing 'code' field`**
→ Cache file is corrupted or the seed bundle wrote an empty entry. Delete the
  cache file, re-author, re-seed.
→ Edit the bullet body in the structured script to be more concrete (vague bullets
   give YOU, the in-session author, nothing concrete to render either).
→ Delete that bullet's cache file, re-author here, re-seed.

**`scene N bullet M: cached 'code' has no React.createElement call`**
→ The seeded code was bad (e.g. JSX accidentally written). Re-author with
  `React.createElement(...)` syntax only, no JSX. Re-seed.

**`scene N bullet M: cached audio_anchor 'X' is not a verbatim phrase in narration`**
→ The anchor you authored doesn't appear word-for-word in scene N's narration.
  Pick 1–4 contiguous narration words and re-seed.

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
UniversalScene, etc. — the runtime scaffold, not the LLM-emitted bullet code)?
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

## When build_video.py exits non-zero — decode the exit code

| Exit | Meaning | What to do |
|---|---|---|
| 0 | success | nothing — final mp4 is in `projects/<name>/out/` |
| 1 | fatal error (bundle failed, parser rejected, render fatal) | read the stderr; usually a structured-script syntax issue or a missing dependency |
| 2 | render PARTIAL — some scenes failed both retries in render_scenes.mjs; stitch was aborted | re-run the same command; the resume-skip path will pick up only the missing scenes (rule 10 Class 8 atomic-write defenses ensure the successful scenes' mp4s are intact) |
| 3 | quality gate (`--strict-anchors`) — Step 7 anchor coverage below threshold | tighten the structured script: rules 08 (audio_anchor), 15 (narration richness), 19 (bullet density). Re-run `verify_structured_script.py` to confirm before retrying. |
| 130 | Ctrl+C — render tree killed via `taskkill /F /T /PID` | re-run the same command; the per-scene resume-skip + atomic writes ensure no corrupt mp4 was left on disk and successful scenes are preserved |

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

---

## Examples

### Cache miss on Scene 2 Bullet 3

```
Error: CacheMissError — scene 2 bullet 3: "Shows the 86% fabrication bar"
  Expected cache key: storyboard/.cache/designs/bullet-s2-b3-<hash>.json

Fix:
  1. Read scene 2 bullet 3 body from structured script
  2. Author React.createElement code for a bar chart showing 86%
  3. python storyboard/seed_bullet_cache.py projects/scripts/<name>.txt \
       --scene 2 --bullet 3 --anchor 'eighty-six percent' --code-file /tmp/s2b3.js
  4. python storyboard/build_video.py projects/<name>/
```

### audio_anchor mismatch

```
Error: scene 3 bullet 1: cached audio_anchor 'rapidly grows' is not a verbatim phrase in narration

Narration text: "...where usage has grown rapidly across the industry..."

Fix: anchor must be verbatim. Change anchor to 'grown rapidly' (exact match).
  → Delete: storyboard/.cache/designs/bullet-s3-b1-*.json
  → Re-seed with --anchor 'grown rapidly'
  → Re-run normally (no flag needed)
```

### Midpoint frame BLACK in Scene 4

```
Error: visual_qa.py — scene 4: midpoint frame is BLACK

Diagnosis:
  1. cat projects/<name>/scenes/<project>-s04.json | jq '.blocks[2].code' | head -20
     → code field shows generic/shallow fallback code
  2. Structured-script bullet 2 body: "Shows performance" (too vague)

Fix:
  → Rewrite bullet 2 body in structured script: be concrete ("Shows 3× latency bar, label 'GPT-5', '3.1s'")
  → Run: python storyboard/build_video.py projects/<name>/ --redesign
```

### Narration coverage 61% on Scene 5

```
Error: validate_output.py — scene 5: narration coverage only 61%

Cause: scene boundary detection placed start at wrong word (Whisper mis-heard opening)
Fix:
  → Edit scene 5 narration opening to start with a more distinctive phrase
  → Run: python storyboard/build_video.py projects/<name>/ --retts
```

---

## Guidelines

**Decision tree summary — which flag to use:**
- Bullet code wrong/missing → re-author + re-seed, then run with no flag (hash auto-invalidates)
- ALL bullet visuals wrong → `--redesign`
- Audio wrong or narration changed → `--retts`
- Multiple layers broken → `--force` (nuclear option)
- One scene iterating → `--scene N` (10s vs 5min)

**Always:**
- Delete ONLY the specific bullet's cache file when re-authoring one bullet — don't use `--redesign` if only one bullet needs fixing
- Verify `audio_anchor` is a verbatim 2-4-word substring of the scene narration before re-seeding
- Re-run `verify_structured_script.py` after fixing a structured-script issue before re-running the full build

**Never:**
- Use `--force` as the first response to any error — it deletes TTS audio hash, causing unnecessary regeneration (slow)
- Manually edit files under `storyboard/.cache/` — always use the seed script or the appropriate `--flag`
- Re-seed with JSX (`<div>`, `<span>`) — only `React.createElement(...)` syntax; the pipeline's DynamicBlock runs in a non-JSX eval context
- Skip cache deletion before re-seeding — seeding to the same key does overwrite, but only if the hash matches exactly
