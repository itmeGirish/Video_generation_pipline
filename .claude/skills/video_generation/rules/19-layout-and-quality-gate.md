---
name: layout-and-quality-gate
description: Layout discipline + common-issue prevention + pre-render checklist for per-bullet emitted React. Read when bullet visuals look small/empty, when elements clip, or before shipping a render.
metadata:
  tags: layout, canvas, quality, checklist, qa, animation-timing
---

# Layout and Quality Gate

The per-bullet LLM (rule 04) authors React.createElement code for each bullet
in isolation. That isolation is fast and cache-friendly but it has a cost: the
LLM has no global sense of canvas, phase timing, or repeated failure modes.
This rule is the discipline layer the bullet body must encode so the LLM
produces well-shaped output.

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

### CAVEAT — flex/grid is INNER fix; cross-bullet stacking needs REPLACE

Flex/grid prevents siblings INSIDE one bullet from overlapping. It does NOT
prevent two whole BULLETS (different bullet indexes) from sitting at the same
canvas position.

Under additive layering (rule 04 § "Additive-layering contract"), every bullet's
`<Sequence>` extends to scene end. If bullet 2 and bullet 3 both place their
outermost wrapper at canvas-center (e.g. both use a centered `_scnCard`), they
will visibly stack — bullet 3 paints on top of bullet 2 which is still rendering.

**Decision rule per bullet:**

| Does the bullet's outermost wrapper share canvas region with a prior bullet's? | Action |
|---|---|
| No (e.g. cards top, hero bottom, icons above-LEFT — different regions) | Additive (default). They naturally don't overlap. |
| Yes (every bullet is a centered card, like multi-card "card sequence" scenes) | **MUST be REPLACE** — paint a `D.bg` backdrop at frame 0-3 to hide the prior bullet entirely |

In scene 1 the bullets used different canvas regions so additive worked. In
scenes 2-10 every bullet was a centered card — additive caused visible
stacking. Fix: every bullet in those scenes is REPLACE.

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

This is the lesson from chat_5_5 scene 3 B7 ("floating checkmarks") and scene 1 B3/B4 ("blinking cursor", "thin lines") — both were caught only after a 25-min render because the walkthrough was skipped.

---

## 7. Pre-render layout validator (Step 8.6)

`storyboard/layout_validator.py` runs as build step 8.6 (between scene-JSON
sync and the actual render). For each bullet, it evaluates the React tree
in a Node stub environment at four post-entrance sample frames (45/65/85/97%
of the bullet's local duration) and walks the tree to extract every
`position:'absolute'` element's `(x, y, w, h)`. Then it checks:

- **OUT_OF_BOUNDS** — element exceeds 1920×1080 (with 80px slack for
  legitimate over-edge animation). Boxes with `transform: ...` or
  `opacity < 0.05` are skipped (transform-origin makes static box checks
  meaningless).
- **CROSS_BULLET_OVERLAP** — under additive layering, two elements from
  different bullets occupy the same canvas region simultaneously. Skips
  full-canvas backdrops (REPLACE pattern), transformed elements, and
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
