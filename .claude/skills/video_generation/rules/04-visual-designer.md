---
name: visual-designer
description: How the LLM authors React.createElement code per animation bullet. Read before touching visual_designer.py or scene JSON shape.
metadata:
  tags: visual-designer, llm, codegen, blocks, fidelity
---

# Visual Designer (per-bullet codegen)

`storyboard/visual_designer.py` — called from `build_video.py` Step 2 (per
rule 02 pipeline diagram). Step 3 is `ssml_compiler.py`.

## What it does

For each animation bullet in the structured script, makes ONE LLM call (Claude
CLI in headless mode) that takes:
- The full scene narration (for context + audio_anchor selection)
- THIS bullet's headline + body
- The project's design tokens (palette + spring physics)

And returns a function body that `DynamicBlock.tsx` compiles + invokes per
frame to render that bullet. **There is NO fixed primitive registry.** The
"primitive" for each bullet is whatever React.createElement tree the LLM
emits from the bullet body.

## Output: VisualBlock

```python
@dataclass
class VisualBlock:
    code: str           # function body returning React.createElement(...)
    audio_anchor: str   # 2-4 word phrase from narration aligning with framesFrom
    time_from_sec: float
    time_to_sec: float
    source_headline: str
```

## Concurrency + retry policy

| Knob | Default | Purpose |
|---|---|---|
| Per-call timeout | 300s (5 min) | A single bullet's TSX is bounded |
| Parallel workers | `DESIGNER_PARALLELISM=2` (env) | Avoids rate-limit storms |
| Normal retries | 3 attempts, 20s/40s/60s backoff | Transient JSON errors |
| Rate-limit retries | up to 6 attempts spread over ~17 min | When `claude` CLI exits 1 with empty stderr (the rate-limit signature) |

The script categorises errors:
- `RateLimitError` (empty stderr + exit 1) → 60s/180s/300s × 6 backoff
- `RuntimeError` (any other failure) → 20s/40s/60s × 3 backoff
- After exhausting retries, `design_scene` raises with the offending bullet number.

## Cache (per-bullet)

Keyed by `sha256(scene narration + bullet idx + bullet headline+body + design_tokens + prompt-version-tag)`.
Location: `storyboard/.cache/designs/bullet-s{scene}-b{idx}-{hash16}.json`

**To force re-design ONE bullet**: delete its cache file.
**To force re-design all bullets**: delete `storyboard/.cache/designs/`.

A single bullet's failure or success is independent of every other bullet — a
rerun only re-attempts the missing ones, so transient API issues don't reset
hours of completed codegen.

## Fidelity contracts (hard-fail)

1. **Per-bullet `code` must contain `React.createElement` or `React.Fragment`** —
   else rejected before cache write.
2. **`audio_anchor` must appear verbatim (case+punct insensitive) in the scene
   narration** — else rejected before cache write.
3. **All N bullets must succeed** before `design_scene` returns. If any fail
   after retry, `RuntimeError` lists the offending bullet numbers.

## Scene JSON output format

After `build_video.py` step 7, blocks are written to:
`projects/<name>/scenes/<scene-id>.json` (canonical, project-owned)

A build-time mirror is synced to `remotion/public/scenes/<scene-id>.json` for
the Remotion bundler. **Never edit the build-time mirror — edit the canonical.**

```json
[
  {
    "framesFrom": <int>,
    "framesTo": <int>,
    "code": "<JS function body returning React.createElement(...)>",
    "audio_anchor": "<verbatim phrase from narration>",
    "source_headline": "<bullet headline for debug/QA>"
  },
  ...
]
```

## Runtime contract for the LLM-emitted `code`

The function body runs every frame inside a Remotion `<Sequence>`. These
bindings are in scope (LLM is told NOT to import anything):

| Binding | Type | Source |
|---|---|---|
| `React` | namespace | use `React.createElement` and `React.Fragment` ONLY (no JSX) |
| `frame` | number | block-relative current frame, 0..durationInFrames-1 |
| `fps` | number | from `useVideoConfig()` |
| `width, height` | number | from `useVideoConfig()` |
| `durationInFrames` | number | THIS block's duration |
| `interpolate` | function | Remotion `interpolate(frame, range, output, options)` |
| `spring` | function | Remotion `spring({frame, fps, config})` |
| `Easing` | object | Remotion easing curves — `Easing.in / out / inOut`, `Easing.quad / sin / exp / circle`, `Easing.bezier(...)`. Pass via `interpolate` `options.easing`. |
| `AbsoluteFill, Sequence, Series` | components | Remotion containers |
| `Img` | component | Remotion `<Img>` — preferred over native `<img>`; handles asset loading and avoids race-condition flicker. |
| `staticFile` | function | `staticFile('logo.png')` → URL for files under `projects/<name>/public/`. Use for any logo / screenshot / SVG referenced by a bullet body. See rule 17. |
| `D` | object | design tokens (D.bg, D.cyan, D.amber, etc. — keys come from config.yaml `design:`) |
| `resolveColor` | function | (name) => hex; resolves `"cyan"` → D.cyan |
| `fitText` | function | `@remotion/layout-utils` — auto-shrink text to fit width. **Only correct for `D.font_display` / `D.font_mono` (Root.tsx awaits these); other font families silently fall back and measure wrong.** |
| `measureText` | function | `@remotion/layout-utils` — measured `{ width, height }` for layout math. Same font-load constraint as `fitText`. |

Forbidden inside `code`:
- JSX (no Babel at runtime)
- Imports / require / top-level await
- Hex color literals (must use D.* tokens)
- CSS keyframes / `animation:` / `transition:` (won't animate during render)
- Class names / external CSS

## How `framesFrom/framesTo` are computed (Step 7)

```python
# Whisper says: word "eighty-six" starts at scene-relative 4.87s
anchor_frame = round(scene_words[idx]["start"] * FPS)   # NOT int() — round() avoids drift

# Then Step 7 enforces: monotonic order + first block at 0 + MIN_BLOCK_FRAMES min spacing
```

`framesFrom/framesTo` are LOCAL to the scene (always start from 0 at scene
start). This matches how `<Sequence from={framesFrom}>` works inside Remotion.

## Improving LLM output quality

If the LLM emits shallow/generic code:
1. Make the structured-script bullet body MORE concrete (specific elements, counts, animations)
2. Increase per-bullet timeout in `_call_llm` if 5 min is too tight for complex visuals
3. Try `claude-opus-4-6` (the pipeline default) — bumping to a different model rarely helps; the bottleneck is the bullet body's specificity

If the LLM hits the rate limit:
1. Reduce `DESIGNER_PARALLELISM` env (default 2) — `DESIGNER_PARALLELISM=1` for the gentlest pace
2. Wait — the rate-limit retries already spread requests over ~17 min per bullet
3. Check if the Claude API account is throttled (usually clears in 1-3 min for typical tier)

## Model

Pinned to `claude-opus-4-6` (one of the 4 user-mandated constants). Override via
env `DESIGNER_MODEL` or config.yaml `llm.designer_model`. Pipeline default is
**not** subject to LLM-of-the-month — codegen quality is the bottleneck.
