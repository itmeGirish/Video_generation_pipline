---
name: graphics-and-assets
description: How to use user-supplied graphics (logos, screenshots, photos, diagrams, SVGs) in animation bullets. The per-bullet LLM emits an Img element from React; this rule covers file placement and reference syntax.
metadata:
  tags: graphics, images, assets, logos, screenshots, public, staticFile
---

# Graphics & assets in scripts

The pipeline has **no fixed `image_asset` primitive** — per-bullet codegen
(rule 04) emits whatever React.createElement tree fits the bullet body. When
a bullet body references an image file, the LLM authors a Remotion `<Img>`
(or plain `<img>`) element pointing at the file via `staticFile()`.

This rule covers: where to put the files, how to reference them in the
structured script, and what file types work.

## Where files go

Put assets in the project's `public/` directory (Remotion's `staticFile()` root):

```
projects/<name>/
  config.yaml              ← per-project design + voice config (rule 00 §2)
  public/                  ← create this folder, drop assets in
    <asset_1>
    <asset_2>
    ...
```

(The script itself lives at `projects/scripts/<name>.txt` raw and
`projects/structured_scripts/<name>.txt` canonical — not under the project folder.)

`build_video.py` passes the project's `public/` as Remotion's `publicDir`, so
any file under it is reachable from emitted bullet code via
`staticFile("filename.ext")`. The LLM's emitted `code` field has access to
this — `staticFile` is a Remotion runtime export and the LLM is told it can
construct image elements.

## How the writer references a graphic

In an animation bullet, mention the asset filename inline OR with the
`[asset: ...]` shorthand. Both forms tell the per-bullet LLM "this bullet
needs to render an image":

```
- **<M:SS> – <M:SS> — Show <description>.** [asset: <filename>] centered, "<caption>" underneath.

- **<M:SS> – <M:SS> — Display <description>.** Show <filename> at <N>% width with caption "<caption>".
```

DO NOT copy the placeholder words above into a project. Replace every `<...>`
with real values from THIS project's structured script and ensure the file
actually exists in `projects/<name>/public/`.

## Verification before run

Before running the pipeline, verify each referenced asset is on disk:

```bash
# List declared asset references in the structured script
grep -oE '\[asset:[^]]+\]|[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|svg|gif)' \
    projects/structured_scripts/<name>.txt | sort -u

# List files actually on disk
ls projects/<name>/public/
```

Mismatch → either drop the asset from the bullet or add the missing file.
A missing asset becomes a broken `<Img>` at render time (visible in the
final mp4 — `validate_output.py` will flag the bullet's midpoint frame as
suspicious if the broken image leaves a blank area).

## Supported file types

Anything a browser can render natively:
- **Raster:** PNG, JPG/JPEG, WebP, AVIF, GIF (animated GIFs auto-loop)
- **Vector:** SVG (scales perfectly to 1080p)
- **Don't use:** PSD, AI, EPS, RAW (browsers can't display these)

## What the per-bullet LLM does with an asset bullet

When the bullet body names a real on-disk file (or uses `[asset: ...]`), the
LLM typically emits something like:

```js
const src = staticFile('logo.png');
return React.createElement('div', {
  style: { position: 'absolute', inset: 0, display: 'flex',
           alignItems: 'center', justifyContent: 'center' },
}, React.createElement('img', {
  src,
  style: { maxWidth: width * 0.6, maxHeight: height * 0.7, objectFit: 'contain' },
}));
```

The LLM picks scale, position, entrance animation, and any caption from the
bullet body — there is no fixed prop schema, so the more concrete the body
the more faithful the output. Use rule 19's layout discipline (≥60% canvas
utilization, proportional sizing) when describing the desired footprint.

## Limits

- Avoid 4K-source images; downscale to ≤2× output resolution
  (3840×2160 max) — larger images slow down rendering and can crash Chromium.
- Animated GIFs over ~10s with complex frames may cause memory pressure
  during render. If you hit issues, convert to mp4 and tell the bullet body
  to use Remotion's `<OffthreadVideo>` instead of `<img>` — `OffthreadVideo`
  is a Remotion export and can be imported in scaffold code, but it is NOT
  in the bullet runtime bindings (rule 04). For mp4 assets, exposing
  `OffthreadVideo` to `DynamicBlock.tsx` would be required first.
- SVGs with embedded fonts: the font must be installed system-wide,
  otherwise it renders fallback. Convert text-to-paths in the SVG before
  saving to be safe.

## File-naming guidance

- Use snake_case or kebab-case (`agent_diagram.svg`, `gpt-logo.png`).
- Avoid spaces, parentheses, accented characters — they survive `staticFile()`
  but are easy to typo in bullet bodies.
- Group by purpose if you have many: `public/logos/openai.png`,
  `public/diagrams/agent_loop.svg`. Reference with the path:
  `staticFile('logos/openai.png')`.
