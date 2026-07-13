# Playwright-MCP per-scene geometry QA (runbook)

Use the Playwright MCP + the Remotion **Studio** to read **real DOM geometry** of a per-scene
composition — the deterministic complement to `layout_validator.py` (estimated boxes) and the
vision-model gate (meaning). Interactive/ad-hoc; no new pipeline code.

**Scope:** the per-scene composition `<project>-sNN` only. **Never the master** — it's video-of-videos
(no DOM). Master + audio = ffmpeg.

---

## One-time setup
1. **Reload Claude Code** so the Playwright MCP loads (you should see `mcp__playwright__*` tools, and
   `claude mcp list` shows `playwright`). Enabled already via `.claude/settings.json`.
2. **Build the scene into the Studio's data** (the Studio reads `remotion/public/scenes/<sceneId>.json`):
   ```
   python storyboard/build_video.py <script_path> --scene N      # or seed + a preview render
   ```
   The scene JSON + `timelines.ts` must exist, or the composition won't appear.
3. **Start the Studio** (leave it running):
   ```
   cd remotion && npm run dev          # → http://localhost:3000
   ```

---

## Per scene (repeat for each)
1. **Navigate** the MCP browser to the composition:
   `http://localhost:3000/<project>-sNN`  (e.g. `chat-5-5-s01`) — composition id = scene id (hyphens).
2. **Seek to the SETTLED frame** (~p85–p95 of the bullet — where every element is at full opacity +
   final position; the midpoint hides overlaps). The reliable way (verified on `fable_5_power`):
   `browser_evaluate` →
   ```js
   () => { window.remotion_setFrame(240, '<project>-sNN'); return 'ok'; }   // 3-arg: (frame, compositionId, 0)
   ```
   then wait ~2s for the re-render. (Judge `mid` separately for fill/motion; judge overlap/clip/fit at
   the settled frame — same rule as `vg-quality-vchecks`.)
3. **Read the geometry** — run `mcp__playwright__browser_evaluate` with the snippet below. It returns
   `{scale, elements, violations[]}` in **composition pixels** (1920×1080).

### The evaluate snippet (verified working on fable_5_power)
> Scopes to the **composition root's subtree** — critical: filtering by screen position instead picks up
> the Studio's own chrome ("Help", "Fit", "1x") as false positives (learned on the first real run).
```js
() => {
  const W = 1920, H = 1080;
  const all = [...document.querySelectorAll('*')];
  // find the scaled 16:9 composition root in the Studio preview (largest ~16:9 element)
  let rootEl = null, best = 0;
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width < 300 || r.height < 1) continue;
    if (Math.abs((r.width / r.height) - (W / H)) < 0.03 && r.width > best) { best = r.width; rootEl = el; }
  }
  if (!rootEl) return { error: 'no 16:9 root found — set scale = displayedPreviewWidth/1920 manually' };
  const stage = rootEl.getBoundingClientRect();
  const scale = stage.width / W;
  const C = (r) => ({ x: Math.round((r.left-stage.left)/scale), y: Math.round((r.top-stage.top)/scale),
                      w: Math.round(r.width/scale), h: Math.round(r.height/scale) });
  // EFFECTIVE VISIBILITY up the ancestor chain — Remotion premounts/postmounts adjacent <Sequence>s at
  // opacity 0 (the next/prev bullet mounted early/late). Those are NOT visible in the render, so they
  // must be skipped or they produce phantom overlaps (verified false-positive class on pixel_rag).
  // visibility:hidden is skipped too (hidden elements keep their boxes at opacity 1).
  const effOp = (el) => { let o=1, n=el; while (n && n!==rootEl.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden') return 0;
      const val = parseFloat(cs.opacity); if (!isNaN(val)) o*=val; n=n.parentElement; } return o; };
  const items = [];
  for (const el of rootEl.querySelectorAll('*')) {   // ← ONLY composition descendants (no Studio chrome)
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (el.childElementCount !== 0) continue;        // leaf
    const t = (el.textContent||'').trim(); if (!t) continue;
    if (effOp(el) < 0.05) continue;                  // skip premounted/postmounted (invisible) bullets
    const cs = getComputedStyle(el);
    items.push({ box: C(r), text: t.slice(0,42), fontPx: Math.round(parseFloat(cs.fontSize)/scale),
      overflow: el.scrollWidth > el.clientWidth + 2 });
  }
  const v = [];
  if (/BLOCK (COMPILE|RUNTIME) ERROR/.test(rootEl.innerText)) v.push({type:'render_error'});
  for (const it of items) {
    const {x,y,w,h} = it.box;
    if (x < -2 || y < -2 || x+w > W+2 || y+h > H+2) v.push({type:'out_of_bounds', text:it.text, box:it.box});
    if (y+h > H*0.88) v.push({type:'caption_zone', text:it.text, yBottomPct:Math.round((y+h)/H*100)});
    if (it.fontPx < Math.round(W*0.009)) v.push({type:'tiny_text', text:it.text, fontPx:it.fontPx});
    if (it.overflow) v.push({type:'overflow_wrap', text:it.text});
  }
  for (let i=0;i<items.length;i++) for (let j=i+1;j<items.length;j++){            // text-on-text overlap
    if (items[i].text === items[j].text) continue;   // skip identical-text (Studio keeps a 2nd buffer copy)
    const a=items[i].box, b=items[j].box;
    const ox = Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
    const oy = Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
    if (ox>4 && oy>4) v.push({type:'text_overlap', a:items[i].text+'@y'+a.y, b:items[j].text+'@y'+b.y});
  }
  return { scale:+scale.toFixed(3), texts:[...new Set(items.map(i=>i.text))], violations: v };
}
```

---

## What it checks (→ which V-check)
| Violation | Maps to | Fix owner |
|---|---|---|
| `render_error` | BLOCK COMPILE/RUNTIME error frame | re-author the bullet |
| `out_of_bounds` | V7 clipping | reflow inside `[0..W]×[0..H]` |
| `text_overlap` | V9 overlap (settled frame) | move the label to the gap — `vg-quality-vchecks` |
| `overflow_wrap` | V10 text-fit | `fitText` / shorten — `vg-code-text` |
| `caption_zone` | V9c (bottom 12% reserved) | cap footers at `top: h*0.82` |
| `tiny_text` | V4 readable size | bump to ≥ `w*0.009` |

`violations: []` = the geometric layer is clean at that frame. This does NOT judge meaning/density/
motion — that's still the vision-model gate and the muted/sentence test.

---

## Caveats (honest)
- **Scale detection** uses a 16:9-stage heuristic. If `scale` looks wrong, read the Studio preview
  width yourself and set `scale = previewWidthPx / 1920` in the snippet.
- **Studio-version-dependent:** the DOM structure is the Studio's; if a future Remotion update changes
  the preview wrapper, the stage heuristic may need a tweak.
- **Per-scene only** — never run this on `<project>-master` (no element DOM there).
- **Frame discipline:** overlap/clip/fit at the **settled** frame; fill/prominence/motion at `mid`.
- **Premount phantoms:** sequences use `premountFor` (~1s) — near a bullet boundary the NEXT bullet's
  subtree is mounted at effective opacity 0. The snippet's `effOp()` skip is what excludes it; if you
  modify the snippet, keep that check, and prefer sampling ≥1s away from bullet boundaries so a
  premounted subtree isn't in the DOM at all. A `role:'stage'` block renders OUTSIDE sequences and is
  always visible — it is correctly INCLUDED at every sampled frame.
- For a fully-automated headless gate (no Studio, scriptable in the verify loop), the harness is a
  separate mini-project (the scene data uses webpack `require.context`, so it needs Remotion's own
  bundler + driving the served site's internal page API) — out of scope for this interactive runbook.
