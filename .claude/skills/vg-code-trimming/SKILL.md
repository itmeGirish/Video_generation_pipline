---
name: vg-code-trimming
description: AUTHOR-TIME code recipe for TRIMMING in a bullet's render code — trim the start/end of an animation with Sequence from/durationInFrames, and trim a Video/Audio clip to the segment you need (startFrom/endAt/trimBefore). Use BEFORE/WHILE writing a bullet that reuses an animation mid-progress or embeds a clip. Grounded in remotion trimming.md + videos.md/audio.md + the DynamicBlock Sequence/Video/Audio bindings.
model: opus
---

# Code recipe — trimming (animations & clips)

Use trimming when a beat should start an animation partway through, end it early, or play
only a segment of a `Video`/`Audio` clip. (In the pipeline the bullet SLOT already trims to
`framesFrom..framesTo`; this is for trimming WITHIN a bullet.)

## Trim the START of an animation (begin partway through)

## Trim the END (unmount after N frames)

## Trim + delay (both) — nest sequences

## Trim a Video / Audio clip to a segment
> `Video`/`Audio` are DynamicBlock bindings. Most bullets are images+vector — only use a
> clip when the beat genuinely needs motion footage; otherwise prefer Ken Burns on an `Img`.

## Anti-patterns

## Before you write, confirm
- [ ] If reusing an animation mid-progress → `Sequence {from: -N}` (trim start)
- [ ] If it must end early → `Sequence {durationInFrames: N}` (trim end)
- [ ] Any `Video`/`Audio` is trimmed (`trimBefore`/`trimAfter`) to the exact segment shown
- [ ] The trimmed window contains the clip's key moment, and fits the bullet's slot
- [ ] A still image would NOT do the job better (prefer `vg-code-images` Ken Burns if it would)
