---
name: graphics-and-assets
description: How to use user-supplied graphics (logos, screenshots, photos, diagrams, SVGs) in animation bullets. The per-bullet LLM emits an Img element from React; this rule covers file placement and reference syntax.
metadata:
  tags: graphics, images, assets, logos, screenshots, public, staticFile
---

# Graphics & assets in scripts

The pipeline has **no fixed `image_asset` primitive** — per-bullet codegen
(rule 04) emits whatever React.createElement tree fits the bullet body. When
a bullet body references an image file, the LLM authors a Remotion `Img`
element (never HTML `<img>`) pointing at the file via `staticFile()`.

This rule covers: where to put the files, how to reference them in the
structured script, and what file types work.

## Where files go

Put assets under `projects/<name>/public/`. The Remotion config sets
`publicDir = projects/<name>/` (the whole project directory), so the
`public/` subdirectory name **IS part of the staticFile path**:

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

Since `publicDir = projects/<name>/`, the correct staticFile call is:

```js
staticFile('public/logo.png')   // → projects/<name>/public/logo.png  ✓
staticFile('logo.png')          // → projects/<name>/logo.png          ✗ WRONG
```

**Always include the `public/` prefix in every staticFile call.**
The LLM's emitted `code` field has access to `staticFile` as a runtime binding
(DynamicBlock.tsx wires it in). The system prompt already shows the correct
`staticFile('public/...')` form.

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
const src = staticFile('public/logo.png');  // publicDir=projects/<name>/ — always include subfolder
return React.createElement('div', {
  style: { position: 'absolute', inset: 0, display: 'flex',
           alignItems: 'center', justifyContent: 'center' },
}, React.createElement(Img, {
  src,
  style: { maxWidth: width * 0.6, maxHeight: height * 0.7, objectFit: 'contain' },
}));
```

**CRITICAL:** Always use `Img` (Remotion component, available in bindings), NEVER
the HTML string `'img'`. The HTML `<img>` element does not wait for the asset to
load before the frame is rendered — it causes blank frames in the final mp4.
`Img` blocks the frame render until the asset is loaded.

The LLM picks scale, position, entrance animation, and any caption from the
bullet body — there is no fixed prop schema, so the more concrete the body
the more faithful the output. Use rule 19's layout discipline (≥60% canvas
utilization, proportional sizing) when describing the desired footprint.

## Video assets — canDecode check required

If a bullet references a video file (`.mp4`, `.webm`, `.mov`), the browser
(Chromium headless) must be able to decode it before Remotion can render it.
Use `canDecode` from the remotion skill (`can-decode.md`) to validate first:

```ts
import { Input, ALL_FORMATS, UrlSource } from "mediabunny";

export const canDecode = async (src: string): Promise<boolean> => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src, { getRetryDelay: () => null }),
  });
  try { await input.getFormat(); } catch { return false; }
  const videoTrack = await input.getPrimaryVideoTrack();
  if (videoTrack && !(await videoTrack.canDecode())) return false;
  const audioTrack = await input.getPrimaryAudioTrack();
  if (audioTrack && !(await audioTrack.canDecode())) return false;
  return true;
};
```

**When to call it:** In `validate_pipeline.py` or as a pre-render check before
passing the video asset path to the LLM-emitted code. If `canDecode` returns
false, swap the asset for a still frame or remove the bullet rather than letting
the render silently produce blank frames.

**Why it matters:** Remotion renders in headless Chromium. Codec support depends
on the Chromium build. H.264 in mp4 containers works reliably. AV1, HEVC, and
ProRes may fail silently — the frame renders black with no build error.

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
