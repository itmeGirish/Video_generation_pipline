---
name: vg-layout-quality-gate
description: "Layout discipline and pre-render quality checklist for per-bullet React code. Use whenever bullet visuals look small or empty, elements clip, canvas utilization is low, or any request like "layout issues," "elements too small," "canvas utilization," "pre-render checklist," "visuals clipping," or "layout discipline.""
model: opus
---

# Layout and Quality Gate

The per-bullet LLM (rule 04) authors React.createElement code for each bullet
in isolation. That isolation is fast and cache-friendly but it has a cost: the
LLM has no global sense of canvas, phase timing, or repeated failure modes.
This rule is the discipline layer the bullet body must encode so the LLM
produces well-shaped output.

> **The `remotion` skill is the source of truth for how the visual actually behaves.**
> This rule governs layout discipline (canvas %, phase timing, sizing); the *correctness*
> of any motion/text/image primitive is defined by the remotion rules. Animation →
> `remotion/rules/animations.md` + `timing.md`; text overflow → `measuring-text.md`
> (`fitText()`); transitions → `transitions.md`; images → `images.md`. Author against
> those rules — the same ones rule 23 Layers 1 / 1.5 verify against — so a bullet passes
> at write time instead of failing after render.

---

## 0. FLEX/GRID-FIRST AUTHORING CONTRACT (read this before authoring any bullet)

**Inner `position: 'absolute'` is FORBIDDEN.** Author with the browser's flex
and grid layout engines, NOT with hand-computed pixel offsets.

### Why

Every layout collision class observed in production (stamps covering totals,
labels clipping headers, hero overflowing into cards, paths slicing through
cards) traced to the same root cause: the LLM **guessed** rendered text
metrics from `fontSize` declarations and got positions wrong. The browser
already knows where text lays out — that is its entire job. Hand-positioning
duplicates that work and then asks the LLM to do it correctly via arithmetic
on numbers it cannot verify.

Flex/grid eliminates the class of bug by construction: siblings in a flex
container CANNOT overlap, because the layout engine assigns each one a
non-overlapping track from each child's actual rendered size.

### The contract

| Element | Allowed positioning | Why |
|---|---|---|
| **Outermost wrapper** of each bullet | `position: 'absolute', inset: 0` (cover the canvas) | One absolute element per bullet positions the whole block; everything inside is relative to it |
| **Section containers** within the bullet (card, icon row, hero block, etc.) | `position: 'absolute'` ON THE WRAPPER, with explicit `left/top/width/height` driven by `width`/`height` bindings | Multiple bullet sections that don't share content area are still allowed to be absolute — they're at the bullet level, not inside a content block |
| **Children inside a section** (header/title/items/total inside a card; icons inside a row) | **`display: 'flex'` or `display: 'grid'`** with `gap`, `justify-content`, `align-items`. Explicit `position: 'absolute'` for siblings inside a card body / icon row / total row / etc. is FORBIDDEN | The browser places each child in its own non-overlapping track from rendered size |
| **Decorative overlays** (stamp on a total row, badge on a card corner) | A flex sibling with `marginLeft: 'auto'` or grid `gridArea: 'badge'`, plus a `transform: rotate(...) translate(...)` to tilt it — NOT a `position:'absolute'` overlay | The flex track guarantees the stamp gets its own space. The transform is purely cosmetic. |
| **Animation entrance** (slide-in, scale, fade) | Any. Transforms and opacity don't trigger reflow. | Layout system stays stable during entrance; only the visual presentation moves |

### Forbidden patterns (will fail the layout validator)

```js
// FORBIDDEN: stamp absolute-positioned over a total row
React.createElement('div', {
  style: { position: 'relative' }
},
  React.createElement('span', null, 'TOTAL  $12,400'),
  React.createElement('div', {
    style: { position: 'absolute', top: -10, right: -8, ... }   // ← FORBIDDEN
  }, 'OVERPAYING')
)
```

### Canonical pattern

```js
// CORRECT: total row is flex; stamp is a sibling track with marginLeft:auto
React.createElement('div', {
  style: { display: 'flex', alignItems: 'baseline', gap: 12 }
},
  React.createElement('span', { style: { fontWeight: 900 } }, 'TOTAL'),
  React.createElement('span', { style: { fontSize: 60, color: D.red } }, '$12,400'),
  React.createElement('span', {
    style: {
      marginLeft: 'auto',
      border: '2px solid ' + D.red, padding: '2px 6px',
      transform: 'rotate(-15deg)',
      fontSize: 16, color: D.red
    }
  }, 'OVERPAYING')
)
```

The stamp **cannot overlap `$12,400`** in this version, because flex put it in
its own track. The transform tilts it visually but the layout engine still
reserves its space.

### Where absolute IS still allowed

- **Bullet's outermost wrapper** (one per bullet) — positions the block on the canvas.
- **Major section wrappers** (e.g. LEFT card, RIGHT card, hero block) — when they don't share content area with each other.
- **Animation transforms** (`transform: 'translate(...)'`, `transform: 'scale(...)'`) — these don't change layout, only visual position.
- **REPLACE backdrops** (`position:'absolute', inset: 0, backgroundColor: D.bg, opacity: ...`) — they cover the whole canvas, not part of it.

### CAVEAT — flex/grid is the INNER fix; the cross-layer risks are STAGE-vs-BEAT and SLOT emptiness

Flex/grid prevents siblings INSIDE one element from overlapping. It does NOT resolve the two cross-layer
risks of the **scene-driven** model (`vg-visual-designer` §SCENE-DRIVEN — this supersedes the old
"additive layering" model, where sequences wrongly extended to scene end):

- **STAGE-vs-BEAT double-paint** — the persistent STAGE draws the world; if a BEAT also redraws a cast
  element the stage already carries, both instances render (the ghost — runtime telemetry R7 catches it).
  Fix: beats render ONLY their delta; the stage owns persistents.
- **Empty SLOT** — each beat's `<Sequence>` runs for EXACTLY its `framesFrom→framesTo` window (the prior
  beat UNMOUNTS — beats do NOT co-render), so a beat authored as a bare delta shows alone on the stage.
  Fix: the stage carries the settled world; the beat's delta rides on top. (Legacy no-stage scenes: the
  beat must be self-contained OR paint a full `AbsoluteFill` `D.bg` REPLACE backdrop.)

### Enforcement

`storyboard/layout_validator.py` flags **inner** `position:'absolute'` (i.e.
`position:'absolute'` not at the outermost wrapper of a bullet) as a violation
class `inner_absolute_positioning` starting from this rule's adoption. The
fix is to refactor those into flex/grid siblings.

---

All values reference the bindings already in scope inside the emitted `code`
(rule 04): `D.*` (design tokens from `config.yaml`), `useVideoConfig()`,
`interpolate`, `spring`. **Never name raw hex, raw fps, or canvas literals
in the bullet body** — the LLM will copy them straight through.

---

## 1. Canvas utilization

| Rule | Why |
|---|---|
| Main visual element fills ≥ 60% of `width × height` | Tiny centered blobs read as "empty render" — the most common quality failure |
| Margin from edge ≥ `width * 0.03` | Edge-flush text gets clipped on some players + looks accidental |
| No two visual blocks at the same `framesFrom..framesTo` | Frame ranges are computed in rule 04 / Step 7 — overlap means a block never paints |

If a bullet body asks for "a small caption with a number", give the LLM the
intended footprint: "caption fills ~60% of canvas width, ~30% height, centered".
Without it, defaults shrink.

---

## 2. Phase timing inside one bullet

For multi-step bullets (intro → reveal → hold), use `durationInFrames`-relative
phase boundaries — never frame literals:

```js
const p1End = durationInFrames * 0.30;
const p2End = durationInFrames * 0.60;
const p3End = durationInFrames * 0.90;
```

This rescales automatically when the bullet's frame range changes (rule 08
recomputes `framesFrom..framesTo` every build from the actual TTS audio). Frame
literals like `frame > 30` break as soon as the spoken word lands at a different
timestamp.

### 2a. The animation must SPAN the window — no dead tail (rule 23 A4/A5)

Using `durationInFrames` fractions is necessary but not sufficient. The hard rule:
**the bullet must keep VISIBLE motion for its whole window — it cannot finish early
and sit static.** `validate_output.py` runs ffmpeg `freezedetect` per bullet and FAILs
any non-final bullet frozen > 3s (rule 23 A4/A5).

The failure pattern (hit on a real render — every bullet of one scene froze ~5s):
- the last animation phase ended at `frame 240` but the window was `374` frames →
  the last ~4.5s had nothing moving;
- the only "ongoing" motion was drifting particles at `opacity 0.02–0.08` — **below
  what a viewer (or freezedetect) can see**, so the frame read as frozen.

**Two requirements to pass A4:**

1. **Phases reach the end.** The final phase must run to ~`durationInFrames * 0.95`,
   not stop at `0.6`. If the real content settles early, the held element still needs
   ongoing motion (next point) — don't just leave it static.
2. **"Alive" motion must be VISIBLE.** A held element keeps a continuous motion the
   viewer can actually see: a ticking counter, a breathing scale (`±1.5%`), a slow
   pan/Ken Burns, or a pulse at **opacity ≥ 0.15** (not 0.05). Drift/glow below ~0.15
   opacity does not count — it fails freezedetect and the viewer's eye alike.

```js
// ✅ visible breathing hold that runs the whole window
const breathe = 1 + 0.015 * Math.sin(frame * 0.12);      // ±1.5% scale, always on
// ✅ counter that ticks across the full window, not just the first third
const shown = Math.round(interpolate(frame, [0, durationInFrames * 0.9], [0, FINAL],
  { extrapolateRight: 'clamp' }));
// ❌ invisible: ambient particles at opacity 0.05 — fails A4, viewer sees a frozen frame
```

The final bullet of a scene is exempt (a held closing frame is the intended "final-hold").

---

## 3. Spring presets (match intent to physics)

Don't use a single spring config for everything — visual intent maps to physics:

| Intent | Config | Use for |
|---|---|---|
| Smooth | `{ damping: 200 }` | Subtle text reveal, ambient elements |
| Snappy | `{ damping: 20, stiffness: 200 }` | Cards, UI labels, list items |
| Bouncy | `{ damping: 8 }` | Hero numbers, punchline reveals |
| Heavy | `{ damping: 15, stiffness: 80, mass: 2 }` | Dramatic entrances, large tiles |

For staggered groups, offset by 8–15 frames per item:

```js
const p = spring({ frame: frame - i * 10, fps, config: { damping: 20, stiffness: 200 } });
```

Stagger less than 8 frames feels chaotic; more than 15 feels lazy.

---

## 4. Typography sizing — proportional, not pixel

Text sizes must scale with canvas, not be raw px:

```js
const { width } = useVideoConfig();
const titleSize = Math.round(width * 0.024);   // ~46 at 1920w
const bodySize  = Math.round(width * 0.011);   // ~21
const labelSize = Math.round(width * 0.008);   // ~15
```

Range guidance (in canvas-fraction units):
- Hero / title: 0.020 – 0.026 of width
- Body / explanation: 0.010 – 0.012
- Label / caption: 0.007 – 0.009

For long user-supplied strings (titles, quotes), call `fitText` directly — it
is in scope inside the bullet runtime (rule 04). Cap the result so it doesn't
inflate beyond your intended hero size:

```js
const { fontSize: rawSize } = fitText({
  text: headline,
  withinWidth: width * 0.80,
  fontFamily: D.font_display,
  fontWeight: 'bold',
});
const fontSize = Math.min(rawSize, Math.round(width * 0.06));
```

`fitText` measurements are only correct for `D.font_display` and `D.font_mono`
— Root.tsx awaits those before render. Calling `fitText` with any other font
family silently measures against a fallback and returns the wrong size.

For polished entrances, pair `interpolate` with `Easing` (also in scope):

```js
const reveal = interpolate(
  frame, [0, 18], [0, 1],
  { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' },
);
```

---

## 5. Common failure modes (LLM-emitted code)

| Symptom | Root cause | What to put in the bullet body |
|---|---|---|
| Text clips off the right edge | Hardcoded font size + long string | "wrap headline with fitText, max width 80% of canvas" |
| Two elements overlap at end of bullet | Final-frame positions not computed | "fade out the entry element before the next one springs in" |
| List items appear all at once | No stagger | "items appear with 12-frame stagger" |
| Animation feels jerky | CSS transition (forbidden, gets ignored) | The LLM should never emit CSS transition; if you see it, the bullet body probably said "fade smoothly" — say "interpolate opacity 0→1 over 18 frames" instead |
| Visual lasts 0.2s and disappears | `framesTo` cap kicked in (rule 10 Class 4) | Reduce bullet count for that scene OR widen the time window in the structured script |
| Whole bullet is black | Emitted code threw at runtime | Check the red `BLOCK RUNTIME ERROR` overlay; usually a token name not in `D.*` (e.g. `D.purple` when the project palette has `D.violet`) |
| Narration says X but visual shows Y | `audio_anchor` missed | Tighten the anchor phrase in the bullet body (rule 08) — 2–4 distinctive words from THIS scene's narration |

---

## 6. Pre-render quality checklist

Apply against the structured script BEFORE running `build_video.py`:

**Canvas + layout**
- [ ] No bullet body names raw hex, raw fps, or canvas literals
- [ ] Each bullet describes a footprint (e.g. "centered, 60% width") OR an explicit position
- [ ] At most one bullet per `framesFrom` (no two-blocks-same-time)

**Animation**
- [ ] Multi-phase bullets describe phases as fractions, not frame counts
- [ ] Final phase reaches ~`durationInFrames * 0.95` — no dead static tail (rule 23 A4)
- [ ] Every non-final bullet has VISIBLE ongoing motion (counter / breathe ±1.5% / pan / pulse at opacity ≥ 0.15) — not sub-visible drift
- [ ] Stagger described in frames, not "fast"/"slow" adjectives
- [ ] Spring intent stated (snappy / bouncy / smooth / heavy) so the LLM picks matching physics

**Content**
- [ ] Color names in the body are token names (`amber`, `cyan`, `violet`) NOT hex
- [ ] Font intent stated as `display` or `mono`, not a font family name
- [ ] User-supplied strings flagged for `fitText` if length is unbounded

**Sync**
- [ ] Each bullet's `audio_anchor` is 2–4 verbatim content words from THIS scene's narration
- [ ] Bullet count vs scene length: ~5–8 bullets per ~60s, no more (rule 15)

**Output verification (after build)**
- [ ] `audio_anchor coverage ≥ 70%` in Step 7 log
- [ ] No `BLOCK COMPILE ERROR` / `BLOCK RUNTIME ERROR` red frames in any scene
- [ ] `validate_output.py` reports no TEXT-ONLY (V12) or FROZEN (A4/A5) bullets
- [ ] `validate_output.py` Step 10.5 reports narration coverage ≥ 90% and animation visibility 100%
- [ ] Step 8.6 layout validator reports `OK — no layout collisions` (or, if violations, they are entrance-frame false-positives the validator's slack already filters)

If anything fails, see rule 13 for the right re-run flag — never delete cache
files manually.

---

## 10. MANDATORY PRE-RENDER VISUAL WALKTHROUGH — NO EXCEPTIONS

**This gate must run BEFORE any `build_video.py` call for any scene being rendered for the first time.**

For every bullet in every scene about to be rendered, write a one-line answer to:

> *"If audio is muted and this bullet is on screen, what does the viewer see?"*

Then apply the FAIL test to each bullet:

| FAIL condition | Example (real bugs hit) | Fix |
|---|---|---|
| Answer is "abstract shape with no text" | "thin red diagonal lines" | Add title/label/stat visible on screen |
| Answer contains only icons/symbols with no labels | "green checkmarks floating on black" | Add tool names, context header, status text |
| Answer is "a blinking cursor / empty workspace" | "cursor blinks on black" | Replace with actual content card showing the topic |
| ADDITIVE bullet's answer relies on "plus the octopus arms from B6" | "checkmarks on top of B6 arms" | B6 is gone — make B7 fully self-contained |
| Answer is "nothing / black / fade" for >2s | "scene fades to black" | Only valid for <2s transitions |

**Format the walkthrough as a table, one row per bullet:**

```
Scene N Visual Walkthrough — describe what a muted viewer sees:

B1  [REPLACE] "Black screen, AI chat window, prompt types: 'Summarize SEC filing...'"
B2  [ADD]     "Quote card slides in from right: 'Losing access feels like amputation' — NVIDIA engineer"
B3  [ADD]     "FACT 2 / Artificial Analysis / Hallucination Benchmark glows amber center-screen"
B4  [ADD]     "Benchmark card: question prompt box + GPT response + ⚠ INVENTED warning in red"
...
```

**Rule: no render starts until the walkthrough is written AND each bullet passes the FAIL test.**

If a bullet fails: fix the `gen_bundle_s*.py` code, reseed, then re-run the walkthrough for that bullet before rendering.

This is the lesson from a prior build: scene 3 B7 ("floating checkmarks") and scene 1 B3/B4 ("blinking cursor", "thin lines") — both were caught only after a 25-min render because the walkthrough was skipped.

---

## 7. Pre-render layout validator (Step 8.6)

`storyboard/layout_validator.py` runs as build step 8.6 (between scene-JSON
sync and the actual render). For each bullet, it evaluates the React tree
in a Node stub environment at four post-entrance sample frames (45/65/85/97%
of the bullet's local duration) and walks the tree to extract every
`position:'absolute'` element's `(x, y, w, h)`. Then it checks:

> **This section is the single OWNER of the `layout_validator.py` tool** — its commands, flags, and ALL
> violation classes below. `vg-quality-vchecks` (V9 scoring) references here instead of re-documenting the
> tool, so the two can't drift. The V9/V-check *definitions* themselves are owned by `vg-verification-protocol`.

- **TEXT_OVERLAP** — a text label's box intersects a figure/bar/another label at the SETTLED frame (the V9
  bug class). Caps `vg-quality-vchecks` factor 8 at ≤4 until `text_overlap: 0`. Binds `Kit` + estimates
  text/container boxes, so it runs on ANY scene (Kit terminals, bespoke divs).
- **INNER_ABSOLUTE_POSITIONING** — a `position:'absolute'` sibling INSIDE a card/row body (flagged per the
  flex/grid rule earlier in this skill) — the layout engine can't guarantee it won't overlap.
- **OUT_OF_BOUNDS** — element exceeds 1920×1080 (with 80px slack for
  legitimate over-edge animation). Boxes with `transform: ...` or
  `opacity < 0.05` are skipped (transform-origin makes static box checks
  meaningless).
- **CROSS_BULLET_OVERLAP** — two elements from different bullets occupy the same
  canvas region simultaneously (in the scene-driven model this is the STAGE-vs-BEAT
  double-paint; runtime telemetry R7 is the authoritative single-instance check).
  Skips full-canvas backdrops (REPLACE pattern), transformed elements, and
  low-opacity ghosts (< 20%).

Run standalone:
```bash
python -m storyboard.layout_validator <project>           # report
python -m storyboard.layout_validator <project> --strict  # exit 1 on violation
```

Build flags:
- `--strict-layout` — hard-fail the build if any violation reported.
- `--skip-layout` — bypass step 8.6 entirely (use only for fast iteration).

The validator catches the bug class where two bullets' visual elements
overlap because of layout math the author didn't sanity-check
(stamp-covers-total, label-clips-card-header, hero-cuts-card). Without it,
you only learn after a full 25-min render.

**Known limit — trajectories, and where the REAL gate lives.** This validator samples a handful of
frames and skips transform-positioned boxes — a MOVER crossing occupied space mid-flight can pass every
sampled instant and still overlap on screen. Snapshot checks cannot prove a trajectory safe. The overlap
GATE is script-side: the contract's `stage.zones` (reserved rects incl. movers' CORRIDORS) verified
mechanically by `composite_lint.py` at `contract-linter` 3h — overlap is settled before any render
exists. This validator is the render-side BACKSTOP, necessary but not sufficient on scenes with movers.

---

## 7b. Deterministic DOM geometry QA via Playwright-MCP (run this, don't eyeball frames)

`layout_validator.py` (§7) estimates boxes from the React tree in a Node stub. The **authoritative**
geometry check reads the **real rendered DOM** of the per-scene composition in the Remotion **Studio**
via the Playwright MCP — exact `(x,y,w,h)` in composition pixels, so overlap/clip/caption-zone/tiny-text
are caught with coordinates, NOT guessed from a screenshot. **This is the geometry layer of the per-scene
verify loop — prefer it over eyeballing ffmpeg frames.** (Frames are still right for *motion* across the
filmstrip and for *meaning*; this is for *geometry*.)

**Runbook: `remotion/PLAYWRIGHT_MCP_QA.md`** (the full procedure + the verified `browser_evaluate` snippet).
**⛔ PREMOUNT PHANTOMS:** sequences premount (`premountFor`) — near a bullet boundary the NEXT bullet's
subtree exists in the DOM at effective opacity 0. Any DOM box-scan MUST skip subtrees whose effective
opacity ≈ 0 or visibility is hidden (the runbook snippet's `effOp()` does this — keep it if you modify
the snippet), and prefer sampling away from bullet boundaries. Otherwise the scan reports overlaps from
elements that are invisible in the render — a verified false-positive class. A `role:'stage'` block
renders outside sequences (always visible) and is correctly included at every frame.
The short loop, per scene:
1. Build the scene so the Studio has its data (`remotion/public/scenes/<sid>.json` + `timelines.ts` exist).
2. Start the Studio once: `cd remotion && npm run dev` (→ `http://localhost:3000`), leave it running.
3. `mcp__playwright__browser_navigate` → `http://localhost:3000/<project>-sNN` (composition id = scene id, hyphens).
4. For EACH bullet, seek to its **settled frame** (~p90 of the bullet's window — midpoints hide overlaps):
   `browser_evaluate` → `window.remotion_setFrame(<frame>, '<project>-sNN')`, wait ~2s.
5. `browser_evaluate` the runbook snippet → returns `{scale, texts, violations[]}` in 1920×1080 px.
   `violations: []` = geometry clean at that frame. Map each violation → its V-check (runbook table:
   `out_of_bounds`→V7, `text_overlap`→V9, `caption_zone`→V9c, `overflow_wrap`→V10, `tiny_text`→V4,
   `render_error`→re-author).

**Scope:** the per-scene composition `<project>-sNN` ONLY — **never** `<project>-master` (video-of-videos,
no element DOM; master + audio = ffmpeg). Caveat: the snippet's scale heuristic finds the 16:9 stage; if
`scale` looks wrong, set `scale = previewWidthPx/1920` by hand (runbook §Caveats). Frame discipline:
overlap/clip/fit at the **settled** frame; fill/prominence/motion at `mid`.

---

## 8. Multi-resolution support

`build_video.py --resolution {480p|720p|1080p|1440p|4k}` overrides
config.yaml's pinned 1920×1080. The pin still applies for the default
build; the override is opt-in per-build.

Layout math should already use `width`/`height` bindings (% of canvas),
so layouts scale naturally. Absolute pixel sizes (e.g. `fontSize: 60`)
won't — the bullet body should always express dimensions as
`Math.round(width * 0.025)` style.

---

## 9. SFX cue auto-emitter (optional)

`storyboard/sfx_emitter.py` infers SFX cues from bullet metadata + Whisper
captions and writes per-scene cue JSONs to
`projects/<name>/sfx/<scene_id>_cues.json`.

```bash
python -m storyboard.sfx_emitter <project>             # write JSON files
python -m storyboard.sfx_emitter <project> --dry-run   # print to stdout
```

Detection rules (compatible with docs/SOUND.md sound library):
- Each bullet's `framesFrom` → `ui_pop` (entrance)
- REPLACE bullet → `transition_whoosh` at framesFrom
- Bullet with `spring(damping ≤ 10)` → `reveal_hit` at framesFrom + 6
- Bullet with typewriter pattern (`cps`/`visChars`) → `text_tick` per word
- Bullet with `findWord(...)` → `impact_soft` per word match
- Last bullet's framesTo - 6 → `impact_soft` (hard cut)

Cues are recommendations only. Wiring SFX into the final mp4's audio mix is
a future build_video.py step (placeholder hook lives in step 10 stitch).
