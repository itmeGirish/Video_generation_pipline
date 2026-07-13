---
name: vg-graphics-assets
description: "How to use user-supplied graphics (logos, screenshots, diagrams, SVGs) in animation bullets. Use whenever adding images to bullets, or any request like "add an image," "use a logo," "add screenshots," "graphics assets," "staticFile()," "Img element," or "image in animation bullet.""
model: opus
---

# Graphics & assets in scripts

> **Need an image you DON'T already have?** Fetch a real photo/logo from the web
> license-safely with `storyboard/fetch_images.py` (Openverse CC / Wikimedia /
> direct URL — monetized channel → CC/PD/editorial only, attribution recorded to
> `CREDITS.md`). Inspect candidates with the Read tool, keep the best, and place it
> in `projects/<name>/public/`. It is then referenced exactly as this rule
> describes. Every real image MUST move (Ken Burns zoom / push-in / logo pop) —
> a static image fails the A4 freeze gate (rule 23).

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

## VERIFY ASSETS — the 6-check validation protocol (run before render)

An asset is **VALID only if it passes ALL six.** Checks 1–3 + 6 are programmatic; **4 (semantic) and 5
(legibility) are the ones that catch the costly failures** — an image that *exists and isn't corrupt* but
shows the **wrong** or an **unreadable** thing (the existence check rubber-stamps it).

| # | Check | Method / tool | PASS bar | catches |
|---|---|---|---|---|
| 1 | **EXISTENCE** | `grep '\[asset:'` declared vs `ls public/img/` | every `[asset:]` is a file on disk | missing → broken `<Img>` / blind auto-fetch |
| 2 | **FORMAT + DECODE** | browser-renderable type; video → `canDecode` | PNG/JPG/WebP/SVG; H.264 mp4 | corrupt file · AV1/HEVC silent-black |
| 3 | **DIMENSIONS** | `PIL Image.size` | ≤ 2× output (≤ 3840px) · not a sliver · aspect not worse than ~1:2 · file ≤ ~5 MB | 4K crash · absurd aspect |
| 4 | **SEMANTIC** (the hard one) | **VISION** — OPEN the image (Read tool renders it) OR a **CLIP image↔text score** | the subject MATCHES the asset's declared **INTENT** | **"names lie"** — a real photo of the *wrong* thing |
| 5 | **LEGIBILITY** | view AT the render crop; center-80% safe area; high contrast | the key content is readable at 1080p; **not a fake/skeleton** | a real-but-*unreadable* image (a dense table) |
| 6 | **LICENSE** (monetized) | `fetch_images.py` → `CREDITS.md` | CC / PD / editorial | copyright |

### The SEMANTIC check (check 4) — why it needs VISION, and how

Existence + dimensions can't see the *content*. To verify "is this image *the right thing*," you must
compare the **pixels** to the asset's **INTENT** (what the `REAL ASSET:` field / bullet says it must show):
- **In-session (do this now):** the agent **OPENS the image with the Read tool** (it renders the pixels)
  and judges it against an explicit intent rubric — *"is this a real pricing table with prominent `$`
  prices + one clear 'answer' cell? Y/N + why."* A NO = INVALID, even though the file exists.
- **Automatable (the roadmap gate):** a **CLIP score** — embed the image + the intent string in CLIP's
  shared space, take the cosine similarity; below a threshold → REJECT. Zero-shot, no training, the
  standard image-text-alignment measure ([CLIP](https://viso.ai/deep-learning/clip-machine-learning/),
  [overview](https://www.pingcap.com/article/a-comprehensive-guide-to-openais-clip-model/)). This is the
  project's highest-ROI open item — a `verify_assets.py` running checks 1–5 (CLIP for 4–5) would gate the
  build the way `layout_validator` gates layout.

### The 6 failure modes (what "invalid" means)
`MISSING` (1) · `CORRUPT / UNDECODABLE` (2) · `OVERSIZE / WRONG-ASPECT` (3) · `WRONG-SUBJECT` (4 — the
real-but-wrong trap) · `ILLEGIBLE / FAKE-SKELETON` (5 — real-but-unreadable) · `UNLICENSED` (6).
*Real example:* two same-scene photos `<subject_a>.png` + `<subject_b>.png` = **MISSING** (fail 1);
`ecommerce_page.png` (2148×6571 spec table) = **WRONG-SUBJECT + ILLEGIBLE** (passes 1–3, fails 4 & 5).

### Hand-capture, never blind auto-fetch, for screenshots/logos/charts
**Auto-fetch (build_video.py Step 2.6):** a missing `[asset:]` is auto-sourced from the web using the
bullet description (default Openverse, CC commercial-use) → `projects/<name>/public/` → license to
`CREDITS.md`; if none, the build **HARD-FAILS**. Auto-fetch keeps the top candidate **blind** — it passes
existence (1) but routinely fails semantic (4). So for **screenshots, logos, charts, real UIs** (where the
wrong image is costly), **pre-place by hand** (the browser-screenshot method) and run all 6 checks; it's
left untouched if already on disk. Knobs: `assets.auto_fetch` (default true), `assets.source`.

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
