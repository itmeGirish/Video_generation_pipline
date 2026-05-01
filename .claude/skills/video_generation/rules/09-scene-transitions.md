---
name: scene-transitions
description: How scene-to-scene and within-scene transitions work. Backdrop fade, block sequencing, within-block stagger, and stitch mode.
metadata:
  tags: transitions, fade, scene, stitch, overlap, backdrop
---

# Scene Transitions

Four layers of transition, from finest to coarsest.

## Layer 1: Within-scene (block-to-block)

Each scene has N visual blocks rendered via `<Sequence from={framesFrom} durationInFrames={dur}>`. The per-bullet emitted `code` (rule 04) runs inside each Sequence.

**No gaps, no overlaps** — `build_video.py` Step 7 ensures:
```
block[i].framesTo == block[i+1].framesFrom
```

Each block fills exactly until the next starts. If you want a cross-fade between two blocks within a scene, the safest path is to have the FIRST block's emitted code interpolate its opacity to 0 in its final ~6 frames AND have the SECOND block's code interpolate from 0 in its first ~6 frames — both blocks already overlap zero frames in the timeline (they're back-to-back), so the visual softness comes from the code, not from the framesFrom math.

Manually shifting `framesFrom` in the scene JSON to create real overlap is possible but breaks the audio_anchor → frame mapping (rule 08), so prefer the in-code fade.

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

## Layer 4: Scene-to-scene stitch (ffmpeg)

`build_video.py` Step 10 stitches per-scene mp4s via ffmpeg.
Config: `stitch.mode` in `config.yaml`.

### Hard cut (default)
```yaml
stitch:
  mode: hard_cut
```
Scenes are concatenated directly via `filter_complex concat`. The Backdrop fade handles visual softness — fadeout-of-A then fadein-of-B reads as a smooth black cut.

### Crossfade (optional)
```yaml
stitch:
  mode: crossfade
  crossfade_frames: 15    # ~0.5s overlap
```

`build_video.py` uses ffmpeg `xfade`:
```bash
ffmpeg -i scene1.mp4 -i scene2.mp4 \
  -filter_complex "[0][1]xfade=fade:duration=0.5:offset=<scene1_duration - 0.5>" \
  output.mp4
```

**Important**: if using crossfade, set `fade_frames: 0` in `design:` to avoid double-fading (Backdrop fade + xfade = too dark).

## Summary: what controls what

| Concern | Where to change |
|---------|----------------|
| Block entrance animation | Inside the bullet body (concrete description) → emitted `code` |
| Within-block element stagger | The bullet body's described stagger interval; LLM emits matching spring delay |
| Block-to-block timing within a scene | `audio_anchor` (verbatim phrase from THIS scene's narration — rule 08) |
| Block-to-block soft cross-fade | In-code opacity fade in both adjacent blocks' emitted code |
| Scene fade in/out speed | `design.fade_frames` in `config.yaml` |
| Scene-to-scene stitch | `stitch.mode` in `config.yaml` |

## Common issues

**Black flash between scenes**: Normal with `hard_cut` + Backdrop fade.
Fix: increase `fade_frames` to 12, or switch to `crossfade` (and zero out `fade_frames`).

**Two blocks on screen at once**: usually a `framesFrom` overlap caused by manual edits to scene JSON. Fix: re-run with `--redesign` or delete the affected bullet's cache file (rule 13) — Step 7 will re-derive `framesTo == next.framesFrom` cleanly.

**Visual appears before narration mentions it**: audio_anchor pointing to a phrase that occurs earlier in narration than intended.
Fix: edit the bullet body → pick a phrase from later in the narration (rule 08).

**Visual appears after narration has passed**: anchor phrase not found in transcript → fell back to `time_from_sec`. Step 7 logs `[time]` instead of `[anchor]` for that block.
Fix: shorten the anchor phrase to 2–3 distinctive words verbatim from THIS scene's narration. Decimal- and hyphen-bearing anchors are now handled (rule 10 Class 2), but rare or compound numbers may still miss.
