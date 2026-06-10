---
name: vg-code-trimming
description: AUTHOR-TIME code recipe for TRIMMING in a bullet's render code — trim the start/end of an animation with Sequence from/durationInFrames, and trim a Video/Audio clip to the segment you need (startFrom/endAt/trimBefore). Use BEFORE/WHILE writing a bullet that reuses an animation mid-progress or embeds a clip. Grounded in remotion trimming.md + videos.md/audio.md + the DynamicBlock Sequence/Video/Audio bindings.
---

# Code recipe — trimming (animations & clips)

Use trimming when a beat should start an animation partway through, end it early, or play
only a segment of a `Video`/`Audio` clip. (In the pipeline the bullet SLOT already trims to
`framesFrom..framesTo`; this is for trimming WITHIN a bullet.)

## Trim the START of an animation (begin partway through)
```js
// negative `from` shifts time back → useCurrentFrame() starts at 15, not 0
React.createElement(Sequence, {from: -15}, /* <inner animation> */);
```

## Trim the END (unmount after N frames)
```js
React.createElement(Sequence, {durationInFrames: Math.round(fps*1.5)}, /* plays 45f then unmounts */);
```

## Trim + delay (both) — nest sequences
```js
React.createElement(Sequence, {from: 30},                       // delay 30f
  React.createElement(Sequence, {from: -15}, /* trim first 15f */ /* <anim> */));
```

## Trim a Video / Audio clip to a segment
```js
// play only seconds 2.0 → 5.0 of the clip
React.createElement(Video, {src: staticFile('clips/demo.mp4'),
  trimBefore: Math.round(fps*2), trimAfter: Math.round(fps*5),
  style:{width:'100%', height:'100%', objectFit:'cover'}});
React.createElement(Audio, {src: staticFile('sfx/whoosh.mp3'),
  trimBefore: 0, trimAfter: Math.round(fps*0.4), volume: 0.5});
```
> `Video`/`Audio` are DynamicBlock bindings. Most bullets are images+vector — only use a
> clip when the beat genuinely needs motion footage; otherwise prefer Ken Burns on an `Img`.

## Anti-patterns
```js
// ❌ rendering a 10s clip in a 3s slot with no trim → it just cuts off mid-action
// ❌ using a Video for what a still + Ken Burns would do (heavier, decode cost, can hang)
// ❌ trimming so the visible window misses the clip's key moment (trim to the payoff)
```

## Before you write, confirm
- [ ] If reusing an animation mid-progress → `Sequence {from: -N}` (trim start)
- [ ] If it must end early → `Sequence {durationInFrames: N}` (trim end)
- [ ] Any `Video`/`Audio` is trimmed (`trimBefore`/`trimAfter`) to the exact segment shown
- [ ] The trimmed window contains the clip's key moment, and fits the bullet's slot
- [ ] A still image would NOT do the job better (prefer `vg-code-images` Ken Burns if it would)
