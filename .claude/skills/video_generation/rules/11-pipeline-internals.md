---
name: pipeline-internals
description: Pipeline orchestration concepts the remotion skill does NOT cover — how scene JSONs, captions, env vars, and Sequences flow through the build. Read when debugging build/render failures (not primitive bugs).
metadata:
  tags: bundling, webpack, publicDir, env, require.context, premount
---

# Pipeline Internals

The `.claude/skills/remotion/` skill explains Remotion-the-framework. This file
explains **our pipeline's specific patterns** — things the framework does not
prescribe and the remotion skill does not cover.

## ENFORCEMENT — pipeline validator

Every pattern below is enforced by `storyboard/validate_pipeline.py`, which
runs as Step 8.5 of `build_video.py` (right before the slow webpack bundle).

It checks:
1. Every target scene has a JSON in `projects/<name>/scenes/` (canonical) AND `remotion/public/scenes/` (build mirror)
2. Every scene has a captions JSON (warning, not fatal)
3. Every scene ID is in `timelines.ts` (else Root.tsx won't auto-discover)
4. No scene ID uses a legacy prefix (`hf`, `rh`, `td`) — those are filtered out
5. Composition IDs match `[a-zA-Z0-9-]+` (Remotion rejects underscores/spaces)
6. `config_tokens.json` has every key required by `design.ts` `DesignTokens`
7. `render_scenes.mjs` exists

Run standalone:
```bash
python storyboard/validate_pipeline.py projects/<name>/
```

(The earlier `validate_primitives.py` Step 2.5 was removed when the pipeline
moved off a fixed primitive registry to per-bullet codegen — see rule 04.)

---

## How scene JSONs reach the rendered mp4

```
build_video.py Step 7
    writes projects/<name>/scenes/<sid>.json   ← CANONICAL (owned by project)
        │
        ▼
build_video.py Step 7.5 — sync
    copies projects/<name>/scenes/*.json  →  remotion/public/scenes/*.json
    purges scene JSONs that belong to OTHER projects (so the bundler ships
    only the active project's data)
        │
        ▼
render_scenes.mjs `bundle()` runs
    webpack scans `require.context('../../public/scenes', false, /\.json$/)`
    in UniversalScenePreview.tsx — picks up every JSON in that folder
        │
        ▼
SCENE_BLOCKS becomes a compile-time map: { sid: blocks[] }
        │
        ▼
makeUniversalScenePreview(id) reads SCENE_BLOCKS[id] → renders
```

**Implications:**
- The CANONICAL location is `projects/<name>/scenes/<sid>.json`. Edit those if
  you ever need to hand-tweak a block.
- The `remotion/public/scenes/` folder is a build-time mirror — anything you
  write there directly will be overwritten on next build. Don't edit it.
- The mirror is purged of other projects' scene files on every build, so a
  stale `harness-3-s01.json` from a previous run won't leak into the
  chat-5-5 bundle.
- Naming: `<scene-id>.json` exactly. Hyphens only — the require.context regex
  is `\.json$` so no extension confusion.

---

## How captions reach the renderer

Same pattern as scene JSONs:
```
build_video.py Step 7
    writes projects/<name>/captions/<sid>.json   ← CANONICAL (owned by project)
        ▼
build_video.py Step 7.5 — sync
    copies projects/<name>/captions/*.json  →  remotion/public/captions/*.json
    purges captions JSONs that belong to OTHER projects
        ▼
require.context('../../public/captions', ...) → CAPTIONS_JSON map
        ▼
makeUniversalScenePreview reads CAPTIONS_JSON[id] for word timestamps
```

---

## How config.yaml propagates to Remotion

There are TWO channels:

**Channel 1 — design tokens (colors, fonts, springs):**
```
config.yaml.design
    ▼
build_video.py Step 1: writes remotion/src/universal/config_tokens.json
    ▼
design.ts: import tokens from './config_tokens.json'
    ▼
D.amber, D.surface, D.font_display, etc. throughout primitives
```

**Channel 2 — video dimensions and fps:**
```
config.yaml.video.{fps,width,height}
    ▼
build_video.py: env = {VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT}
    ▼
node render_scenes.mjs (subprocess inherits env)
    ▼
Root.tsx: const VIDEO_FPS = Number(process.env.VIDEO_FPS) || 30;
    ▼
<Composition fps={TIMELINES[id].fps} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} />
```

`TIMELINES[id].fps` is also written by build_video.py (Step 8) — same value.
Both must agree. If you ever see a mismatch, fps in config.yaml didn't
propagate — check the env in the subprocess call.

---

## Why `Sequence` uses `premountFor`

```tsx
<Sequence from={framesFrom} durationInFrames={dur} premountFor={fps}>
  <Comp {...props} />
</Sequence>
```

`premountFor={fps}` (1 second of frames) tells Remotion to mount the component
1 second before its `from`. Without this, complex primitives that load fonts
or do layout calculation flash on first frame.

Don't remove it without testing.

---

## The bundle-once-render-many pattern

`build_video.py` calls `node render_scenes.mjs <id1> <id2> ... <idN>` ONCE.
`render_scenes.mjs` bundles webpack ONCE, then loops `selectComposition` +
`renderMedia` for each scene.

The first version called `node render_scenes.mjs <id>` per scene — bundled 7×
for a 7-scene video. Now bundles once. **Do not regress this.**

---

## webpack aliases used by `render_scenes.mjs`

```
@project-scenes        → projects/<name>/scenes/        (legacy beat-based scenes)
@project-short-scenes  → projects/<name>/short/default/scenes/
@remotion-components   → remotion/src/components/
```

These exist for the LEGACY storyboard pipeline. The universal pipeline does
NOT use these — it uses `require.context` on `remotion/public/scenes/`.

When debugging "module not found" errors, check whether the file is on the
legacy or universal path.

---

## DefinePlugin for storyboard JSON injection (legacy only)

```js
new webpack.DefinePlugin({
  'process.env.__STORYBOARD_JSON__': storyboardJson,
  'process.env.__SHORTS_STORYBOARD_JSON__': shortsStoryboardJson,
})
```

Only used by the legacy `DynamicStoryboardPlayer` and `ShortsPlayer`. The
universal pipeline ignores these. Don't touch unless working on legacy code.

---

## What gets rendered vs what gets played

| File | Rendered | Played |
|------|----------|--------|
| `remotion/out/<sid>.mp4` | yes (silent, per-scene) | only by `--scene` preview |
| `projects/<name>/audio/<file>.mp3` | yes (TTS) | as audio track in final |
| `projects/<name>/out/<title>.mp4` | yes (concat + mux) | THE final video |

Each per-scene mp4 is silent (audio is muxed only at the end). If a scene mp4
plays silently in QuickTime, that's NORMAL — audio comes from ffmpeg mux.

---

## Cache invalidation cheat sheet

| Cache | Invalidate by |
|-------|---------------|
| Visual design (LLM codegen) | Now PER-BULLET — each bullet is its own cache file `storyboard/.cache/designs/bullet-s{N}-b{M}-*.json`. Editing the structured script bullet body changes the hash for THAT bullet only. To force re-codegen of one bullet: delete its specific file. To force all bullets in a scene: `rm storyboard/.cache/designs/bullet-s{N}-*.json`. To force everything: `rm -rf storyboard/.cache/designs/`. Cache key includes design tokens — changing palette/spring values invalidates all bullets. |
| Whisper transcript | Edit narration or change voice in config.yaml → audio changes → hash changes. Delete `storyboard/.cache/transcript-*.json` to force. |
| TTS audio | Edit narration or SSML compiler logic → SSML hash changes. Delete `projects/<name>/audio/.<file>.mp3.<hash>.hash` to force re-TTS. |
| Scene render | Touch the canonical scene JSON (`projects/<name>/scenes/<sid>.json`) — Step 7.5 will re-mirror it; mtime check on the bundler-side copy then triggers re-render. Or use `--scene N` to force. |
| Webpack bundle | Always rebuilt on each `node render_scenes.mjs` call. No cache to invalidate. |

---

## Frame extraction — why ffmpeg, not Mediabunny

The remotion skill's `rules/extract-frames.md` documents `extractFrames()` from
Mediabunny — a browser-side library using the canvas API and `VideoSampleSink`.

**We do NOT use it.** Reason:
- Our `visual_qa.py` and `validate_output.py` extract frames from already-
  rendered MP4 files in **Python** (server-side), not in a browser.
- Mediabunny is a JavaScript/canvas library — wrong language and runtime.
- ffmpeg is the right tool: already a pipeline dependency, fast, no setup,
  and `signalstats` filter gives us pixel-luma analysis directly.

If a future task needs to extract frames *inside* a Remotion composition (e.g.
showing a thumbnail strip in a primitive), THEN read `extract-frames.md`. For
post-render Python validation: keep using ffmpeg.

## Text overflow — using `@remotion/layout-utils`

For primitives that take user-supplied text (TitleReveal, TitleCard, PullQuote,
Provocation), text would otherwise overflow the frame when the structured script has long
strings. Use `fitText()` to auto-shrink:

```tsx
import { fitText } from '@remotion/layout-utils';

const { fontSize: fitted } = fitText({
  text, fontFamily: D.font_display, fontWeight: '900',
  withinWidth: width - 200,
});
const fontSize = Math.min(MAX_DESIGNED_SIZE, fitted);
```

For multi-line bodies (PullQuote), use `fillTextBox()`:
```tsx
import { fillTextBox } from '@remotion/layout-utils';

const box = fillTextBox({ maxBoxWidth: width - 280, maxLines: 4 });
for (const word of text.split(/\s+/)) {
  if (box.add({ text: word + ' ', fontFamily, fontSize, fontWeight }).exceedsBox) {
    // shrink fontSize and retry
  }
}
```

This closes the biggest residual aesthetic gap (overflowing text). When adding
new primitives, ALWAYS use `fitText` for any prop that accepts arbitrary user
text. See `.claude/skills/remotion/rules/measuring-text.md` for the full API.

## When debugging a render failure

1. Did the scene JSON write to the canonical location? `ls projects/<name>/scenes/`
2. Did Step 7.5 mirror it to the bundler path? `ls remotion/public/scenes/`
3. Do the JSONs match? `diff projects/<name>/scenes/<sid>.json remotion/public/scenes/<sid>.json`
4. Does the JSON have valid blocks (with `code` field)? `cat projects/<name>/scenes/<sid>.json | jq`
5. Does the scene appear in `timelines.ts`? `grep <sid> remotion/src/storyboard/timelines.ts`
6. Did the bundle find the composition? Look for "selectComposition" output
7. Check the silent mp4: `ls -lh remotion/out/<sid>.mp4` — small file = empty render
8. Run visual QA: `python storyboard/visual_qa.py projects/<name>/`

Steps 1–4 are pipeline; step 5–6 are render. Failures cluster — knowing which
half failed cuts debugging time in half.
