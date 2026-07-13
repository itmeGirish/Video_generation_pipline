---
name: vg-scene-transitions
description: "How scene-to-scene and within-scene transitions work. Backdrop fade, block sequencing, within-block stagger, and stitch mode. Use whenever adding transitions, configuring crossfade, fixing overlap artifacts, or any request like "scene transitions," "crossfade," "hard cut," "backdrop fade," "stitch mode," or "within-block stagger.""
model: opus
---

# Scene Transitions

> **Source of truth for the transition primitives = `remotion/rules/transitions.md`** (for
> *within-bullet* transitions — `<TransitionSeries>` / `linearTiming` / `springTiming`).
> **At the MASTER level there is NO crossfade:** `remotion_master` plays scenes through a plain
> `<Series>` (zero overlap) so the master audio and video stay frame-for-frame aligned. A master
> `<TransitionSeries>` crossfade was rejected (it overlaps scenes → ~12 frames of audio drift per
> transition). The only scene-to-scene fade is the per-scene `<Backdrop>` (Layer 4). `crossfade_frames`
> in config is therefore inert for the master.

Four layers of transition, from finest to coarsest.

## Transition OPERATORS — the morph vocabulary (how the carried object CROSSES, not a cut)
The mechanics below are *how the layers fade*; this is *what the protagonist DOES* at a boundary so the cut
reads as one continuous take instead of a slide-swap. Pick an operator (the script's `carry:` / `BEAT n→n+1
TRANSITION` names it); build it as a `frame`-driven transform on the carried element — **never an opacity
cut on the protagonist**:
| Operator | What the object does | Build |
|---|---|---|
| **carry** | stays on screen, just moves to its new spot/state | interpolate its x/y/scale from old→new across the boundary |
| **dock** | shrinks into a corner to persist as a reference | scale-down + translate to a corner anchor |
| **match-move / match-morph** | keeps the SAME screen position+scale across the cut → the eye doesn't see a cut | author the prior scene's LAST frame and the next scene's FIRST frame at identical transform |
| **split** | divides into parts that become the next beat's elements | clip/translate the parts apart |
| **fold / collapse** | folds/crushes down, the next thing unfolds from it | scaleY→0 then the next scaleY→1 from the same edge |
| **flow / thread / conveyor** | travels along a path into the next station | translate along an SVG path (`getPointAtLength`) |
| **pour / explode** | bursts into particles that reform as the next element | the particle field (`vg-code-composition` §8c) as the bridge |
| **snap** | a hard, deliberate cut WITH a motion accent (whip-pan + sound hit) | reserve for an energy break — the one intentional cut |
**Within a scene** these are free (one composition). **Scene→scene** is capped by the architecture: the master
plays separate scene mp4s via a plain `<Series>` (Layer 4) — so a true cross-scene morph isn't renderable
today; the **match-move** illusion (identical transform on the last/first frames either side of the cut) is the
closest achievable, and real cross-scene object continuity needs the master-composition re-architecture
(`vg-pipeline-architecture`).

## Layer 1: Within-scene (block-to-block) — ADDITIVE LAYERING

Each scene has N visual blocks. `build_video.py` Step 7 writes
`block[i].framesTo == block[i+1].framesFrom` to the scene JSON for downstream
sequencing math (audio_anchor sync, validators), but at **runtime** every block's
`<Sequence>` extends from its `framesFrom` to the **end of the scene**, not to
`framesTo`. See `remotion/src/universal/UniversalScene.tsx`:

```tsx
const seqDur = sceneEnd - b.framesFrom;
<Sequence key={i} from={b.framesFrom} durationInFrames={seqDur} premountFor={fps}>
  <DynamicBlock ... />
</Sequence>
```

⚠ **CORRECTED — beats do NOT stack additively (scene-driven model).** Each beat's `<Sequence>` runs for
EXACTLY its `framesFrom→framesTo` window and the prior beat UNMOUNTS; the persistent world is carried by
the separate `role:'stage'` block (rendered outside any Sequence, scene-local frames). So a beat renders
its DELTA on top of the always-present STAGE — not on top of the prior beat. The scene reads continuous
("cards slide in → rows fill inside → totals appear") because the STAGE holds the settled world, not
because beats pile up. (`vg-visual-designer` §SCENE-DRIVEN.)

### Two modes per beat

The per-beat `code` (rule 04) chooses one of:

- **Evolve (default)**: draw your delta on the persistent STAGE (which already shows the settled world).
  Legacy no-stage scenes: redraw prior settled elements + the delta (self-contained).
- **Replace**: when the bullet should wipe the prior canvas (scene transitions
  to a new metaphor), the bullet's emitted code is wrapped at build time
  (`build_bundle.py`) in a Fragment of `[__replaceBackdrop, __mainWrap]`:
  - `__replaceBackdrop` — opaque `D.bg` div, opacity ramps `0 → 1` over **10
    frames** (≈0.33s @ 30fps). It hides the prior bullet's content.
  - `__mainWrap` — the bullet's main element wrapped in a div whose opacity
    ramps `0 → 1` over the same 10 frames. The new content fades in as the
    backdrop covers — clean cross-fade, no instant pop.

  This 10-frame window is intentionally matched to the master composition's
  inter-scene `TRANSITION_FRAMES` (Layer 4) so every transition (sub-scene AND
  scene boundary) shares the same rhythm. Without `__mainWrap`, the new
  content appears instantly at frame 0 of the bullet while the backdrop is
  still ramping — visible "pop" the user complained about. See
  `vg-visual-designer` §SCENE-DRIVEN + `vg-code-transitions` §REPLACE for the pattern.

### When to use which

| Beat intent | Mode |
|---|---|
| "Card slides in" / "Rows fill inside card" | Evolve (delta on the stage) |
| "Cards fade, paths render across screen" | Replace |
| "USE THIS FOR card slides in from below" | Evolve if prior content is contained, Replace if it dominates |
| Final "hard cut to black" beat | Replace with full-opacity D.bg in last frames |

### Old framesTo-windowing model (deprecated)

Earlier versions of this rule said each block runs in `[framesFrom, framesTo)`
and disappears when the next block starts. That is no longer true after the
additive-layering architectural change. The `framesTo` field in the scene JSON
is now used only by validators and the audio_anchor system — **not by the
runtime renderer**.

## Layer 2: Within-block (element stagger)

Inside each block's emitted `code`, multi-element reveals stagger with spring delays:

```js
const items = bullet_body_items;  // however many items the bullet body listed
return React.createElement(React.Fragment, null,
  ...items.map((item, i) => {
    const p = spring({ frame: frame - i * 10, fps, config: { damping: 20, stiffness: 200 } });
    return React.createElement('div', { key: i, style: { opacity: p, transform: `translateY(${(1-p)*20}px)` } }, item);
  })
);
```

Stagger of 8–15 frames per item reads as deliberate. Less than 8 feels chaotic; more than 15 feels lazy. The LLM (rule 04) is told this in its system prompt and rule 19 reinforces it.

## Layer 3: Scene-to-scene (Backdrop fade)

`Backdrop.tsx` (in `remotion/src/`) wraps every scene and drives a fade-in / fade-out using `useCurrentFrame()`:

```tsx
const fadeIn  = interpolate(frame, [0, fade_frames], [0, 1], { clamp });
const fadeOut = interpolate(frame, [durationInFrames - fade_frames, durationInFrames], [1, 0], { clamp });
const opacity = Math.min(fadeIn, fadeOut);
```

- `fade_frames` defaults to ~6 (≈0.2s at 30fps); configurable via `config.yaml` `design.fade_frames` if the project's design tokens block declares it
- Scene starts black → fades in
- Scene ends by fading out → black
- Next scene fades in from black → clean cut-to-black transition

**To change transition speed**, set `fade_frames` in the project's `config.yaml`:
```yaml
design:
  fade_frames: 12    # ~0.4s at 30fps — slower, more cinematic
```

## Layer 4: Final assembly (master Remotion composition)

`build_video.py` Step 10 produces the final mp4 via the master Remotion
composition — audio + visuals together in ONE render. The legacy ffmpeg
stitch path is **eliminated** as the default and kept only as back-compat.

**Single-scene preview also uses the master composition** (with `MASTER_SCENES`
filter), not silent per-scene mp4. `build_video.py --scene N` renders the
master composition for that one scene + the corresponding audio window —
output: `projects/<name>/out/<sid>-preview.mp4`.

Config: `stitch.mode` in `config.yaml`. Order of preference:
`remotion_master` > `crossfade` (legacy) > `hard_cut` (legacy).

### Remotion master composition (RECOMMENDED — avoids the entire ffmpeg-stitch class of bugs)
```yaml
stitch:
  mode: remotion_master    # the master plays scenes via <Series>; it ignores crossfade_frames
```

A single Remotion render produces audio + visuals together. The master composition
(`remotion/src/MasterComposition.tsx`) registers one `<project>-master` Composition that plays the
scene mp4s through a plain **`<Series>`** (ZERO overlap) under the master `<Audio>` — **NO inter-scene
fade.** (`TransitionSeries` was tried and **rejected**: it overlaps adjacent scenes by the transition
duration, so the video ends up shorter than the full-length audio → ~12 frames of drift per transition.)

```tsx
<Audio src={staticFile(MASTER_AUDIO_FILE)} />
<Series>
  {scenes.map((sid) => (
    <Series.Sequence key={sid} durationInFrames={tl[sid].durationFrames}>
      <Video src={staticFile(`out/${sid}.mp4`)} startFrom={0} endAt={tl[sid].durationFrames} />
    </Series.Sequence>
  ))}
</Series>
```
The ONLY scene-to-scene fade is the per-scene `<Backdrop>` (Layer 4 below), baked into each scene mp4.

`build_video.py` Step 10 detects `mode: remotion_master`, runs
`node render_master.mjs <output>` with `PROJECT`, `MASTER_AUDIO_FILE`, and
`VIDEO_FPS/WIDTH/HEIGHT` env vars (the master takes NO transition-frames input), and writes
the final mp4 atomically. **No ffmpeg concat / xfade / mux step runs.**

**Why this is the recommended mode**:
- Audio + visuals are aligned by Remotion's internal timeline — no cumulative
  drift from ffmpeg `xfade` chained-trim quirks (only first/last xfade
  reliably trims; middle ones can leave the timeline longer than expected,
  causing audio-to-video drift by scene N-1).
- Single render path; no intermediate ffmpeg-stitch artifacts to debug.
- The master is a plain **`<Series>`** — scenes play back-to-back with **NO master fade**
  (`TransitionSeries` was rejected: its ~12-frame/transition overlap drifts audio sync).

**Keep `fade_frames > 0` here — the per-scene `<Backdrop>` fade is the ONLY transition.**
The master adds no fade of its own, so nothing stacks (the old "set it to 0" guidance assumed
a master fade that no longer exists — zeroing it now gives HARD CUTS). Raise/lower `fade_frames`
to tune the ~`fade_frames`-long dip to `D.bg` at each boundary.

### MASTER_SCENES filter (single-scene preview)

`MasterComposition.tsx` reads `MASTER_SCENES` env (comma-separated scene IDs).
When set, only those scenes are included in the master timeline. Used by
`build_video.py --scene N` to render one scene + corresponding audio window.

Caveat: master `<Audio>` plays from t=0 of the master timeline. Filtering is
correct ONLY when filtered scenes start at the script's beginning (e.g. `s01`
alone, or `s01,s02`). Mid-script subsets (e.g. just `s05`) would need a
per-scene `start_sec` shift on the audio — not implemented.

### Crossfade (legacy ffmpeg path — has known drift bug)
```yaml
stitch:
  mode: crossfade
  crossfade_frames: 15
```

`build_video.py` Step 10 detects `mode: crossfade` and chains ffmpeg `xfade`
filters. For N scenes, the filter graph is:
```
[0:v][1:v]xfade=transition=fade:duration=D:offset=O0[v01];
[v01][2:v]xfade=transition=fade:duration=D:offset=O1[v02];
... (N-1 chained xfade filters)
```
Each `offsetₖ = sum(durationₛ for s in 0..k) - (k+1) * D`.

**Known bug**: ffmpeg chained-xfade only reliably trims the timeline at the
first and last xfade. Middle xfades can leave the cumulative video timeline
longer than expected, causing audio-to-video drift by scene 8-10. Prefer
`remotion_master` unless you have a specific reason to stay on ffmpeg.

If `mode: crossfade` is specified but `n_video < 2`, falls back to hard_cut.
Any unrecognized mode value falls back to hard_cut with a WARNING log.

**Important — set `fade_frames: 0` when using crossfade**:
```yaml
design:
  fade_frames: 0
```
Otherwise Backdrop's per-scene black fade-in + fade-out STACKS with xfade's
crossfade dim and the visual goes too dark in the overlap zone.

### Hard cut
```yaml
stitch:
  mode: hard_cut
```
Scenes are concatenated directly via `filter_complex concat`. The Backdrop fade handles visual softness — fadeout-of-A then fadein-of-B reads as a smooth black cut.

## Summary: what controls what

| Concern | Where to change |
|---------|----------------|
| Block entrance animation | Inside the bullet body (concrete description) → emitted `code` |
| Within-block element stagger | The bullet body's described stagger interval; LLM emits matching spring delay |
| Block-to-block timing within a scene | `audio_anchor` (verbatim phrase from THIS scene's narration — rule 08) |
| Block-to-block soft cross-fade | The next block's REPLACE backdrop fade-in (≤3 frames) covers the stage before the new content lands — see `vg-code-transitions` §REPLACE |
| Scene fade in/out speed | `design.fade_frames` in `config.yaml` |
| Scene-to-scene stitch | `stitch.mode` in `config.yaml` |

## Common issues

**Black flash between scenes**: Normal with `hard_cut` + Backdrop fade.
Fix: increase `fade_frames` to 12, or switch to `crossfade` (and zero out `fade_frames`).

**Two BEATS on screen at once**: under the scene-driven model this is a BUG (beats are exclusive slots —
the prior unmounts), EXCEPT the brief `premountFor` window at a boundary (the next beat mounts early at
opacity 0 — invisible in the render; only DOM QA sees it, and it's excluded there). What SHOULD coexist:
the persistent `role:'stage'` block (the world) + the active beat's delta on top — that's correct, not a
stack. If two visible beats genuinely overlap, a beat is double-drawing the stage's world (redraw the
DELTA only) or a REPLACE backdrop is missing/too slow (opaque `D.bg` `AbsoluteFill`, ramp ≤10 frames).
Runtime telemetry R7 (duplicate-instance) is the authoritative catch.

**Visual appears before narration mentions it**: audio_anchor pointing to a phrase that occurs earlier in narration than intended.
Fix: edit the bullet body → pick a phrase from later in the narration (rule 08).

**Visual appears after narration has passed**: anchor phrase not found in transcript → fell back to `time_from_sec`. Step 7 logs `[time]` instead of `[anchor]` for that block.
Fix: shorten the anchor phrase to 2–3 distinctive words verbatim from THIS scene's narration. Decimal- and hyphen-bearing anchors are now handled (rule 10 Class 2), but rare or compound numbers may still miss.
