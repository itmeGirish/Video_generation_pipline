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

If anything fails, see rule 13 for the right re-run flag — never delete cache
files manually.
