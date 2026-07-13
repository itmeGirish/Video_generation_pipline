---
name: vg-remotion-engineering
description: The Remotion DESIGN skill — where the script becomes Remotion design and the motion is finalized. Owns THE MOTION SYSTEM: the closed set of 9 motion OPERATORS (Enter/Exit/Move/Transform/Reveal/Emphasize/Connect/Recolor/Camera), the shared motion TOKENS (durations + spring presets), and choreography — the ONE motion language every scene composes from (scene-planner replicates it). Also maps Remotion as the FILM ENGINE beyond flat 2D — real video clips, GIFs, audio, Lottie, 3D camera-through-space, depth/parallax, the full transition set — which capabilities are wired into DynamicBlock vs need a one-line binding. Use to compose/build any bullet's motion, define the motion system, break the flat-2D ceiling for the hero scene, or understand the master vs scene fade.
when_to_use: Use BEFORE authoring a bullet that should be more than flat 2D — the hero scene, a camera move through space, footage, an illustrated/character moment, a GIF, an audio sting, or a non-fade boundary. Pairs with vg-code-composition, vg-visual-map TYPE 11, vg-code-images.
model: opus
---

# Remotion Engineering — stop rendering PowerPoint, start rendering a FILM

Remotion is a full **compositing engine**: video, audio, 3D, GIF, Lottie, camera, depth, transitions —
React that renders frames. This pipeline uses a thin slice of it: **divs and SVG on one flat plane,
counters and bars, cut together with fades.** That's a competent *chart renderer* — it's why output can
read "templated." This skill is the map to the rest of the engine: what each capability unlocks, whether
it's *already wired*, and when to reach for it so a scene becomes **interesting**, not just correct.

> **You are the EXECUTOR, not the discoverer.** The capability + feasibility DECISIONS were made upstream
> at script time by `visual-story-engine` (Phase 1, step 4c — the Technical Director): it already picked
> each scene's capability, **translated any impossible idea into a buildable one**, tagged complexity,
> flagged the bindings to add, and shipped the **VISUAL RICHNESS PLAN** (with per-scene implementation
> notes). Your job here is to **BUILD that plan + validate it** — you should rarely hit an "I can't render
> this" surprise. If you do, that's a 4c miss: send the scene back to re-translate, don't improvise a flat
> substitute at render time.

> **The rule of restraint (read first):** Most bullets SHOULD stay 2D vector — it's reliable, fast, has
> zero decode cost, and passes every gate. The heavy capabilities (3D, video, Lottie) are **deliberate,
> ~one-per-video moves** — the bespoke hero scene (`visual-story-engine` mandate / `vg-visual-map`
> TYPE 11), the one camera move, the one real clip. Reaching for 3D on every bullet is how you blow the
> render budget and hang the build. Use this skill to pick the ONE place a heavier capability earns its cost.

---

## THE MOTION SYSTEM — the Remotion design language the whole video composes from (source of truth)

This is where the script becomes **Remotion design** and the motion is *finalized*. A video is neither a
hand-described **screenplay** (timing re-invented every beat → drift) NOR a **static template** (one fixed
`Transform.tsx` → every scene fades/scales the same → "Canva / PPT / corporate explainer"). It is a
**composition in a motion LANGUAGE** with **three separated layers**, so motion is *both* consistent *and*
dynamically bespoke per scene:

```yaml
motion:                 # an ordered list — each row is ONE beat
  - el:        page.table     # the OBJECT (from the scene's cast)
    op:        Transform      # GRAMMAR — the operator type (validates; one of the closed 9)
    topology:  shatter        # MOTION LANGUAGE — the named behavior (identity WITHOUT templating)
    params:    {split: rows, detachHeaders: true, stagger: 6f, gravity: 0.8, tilt: 8deg}   # SCENE UNIQUENESS — structured, not prose
    token:     settle         # FILM-WIDE CONSISTENCY — the spring/duration feel
    sync:      "drop it entirely"   # the narration word the beat fires on
```

**Why three layers (the whole point).** `op` validates; `topology` gives motion identity; `params` make it
scene-specific; `token` keeps the feel film-wide. So `topology: shatter` is the *same motion language* for
**glass breaking**, a **table's rows separating**, and a **map fragmenting** — but different `el` + `params`
→ **consistent, never templated.** The codegen builds the Remotion code **dynamically from `topology`+`params`
for THIS scene** — it never stamps a fixed template. (S3 `shatter` ≠ S6 `tile`, even though both are `Transform`.)

### Layer 1 — OPERATORS (grammar; the closed 9)
`Enter · Exit · Move · Transform · Reveal · Emphasize · Connect · Recolor · Camera`. Each is a state
transition on a body; `op` is for validation/composition, **not** a code template.

### Layer 2 — TOPOLOGY (the motion language; the closed set per op — this is what kills templating)
| op | topologies | what each is |
|---|---|---|
| **Transform** | `shatter · tile · melt · fold · swarm · morph · assemble` | break-apart · grid-slice · flow-down · collapse · disperse · smooth A→B · converge |
| **Move** | `slide · dock · drift · orbit` | linear travel · to-anchor · float · circle |
| **Reveal** | `fill · count · draw · wipe` | level grows · number ticks · SVG stroke · mask |
| **Emphasize** | `pulse · glow · shake · bounce` | throb · light-up · jitter · spring |
| **Connect** | `link` | SVG line a→b draws |
| **Recolor** | `ignite · dim · flash` | color/opacity state change |
| **Camera** | `push · pull · pan · tilt · parallax · dolly · crane · orbit · arc · whip-pan · rack-focus · macro-zoom · match-move · split-zoom · reveal-pan · center-lock · handheld` | how the virtual camera behaves (parent-wrapper transform + fg/mg/bg depth) — see CAMERA GRAMMAR below |
| **Enter/Exit** | `rise · pop · sweep · fade` | the arrival/departure shape |

### CAMERA GRAMMAR — vary the move per scene (the "every scene push-ins" tell)
"push · hold · drift" on every scene reads templated by scene 4. A film changes camera grammar shot to shot.
Each move is a `frame`-driven transform on a wrapper around the scene (origin = the focal point) — all cheap:
| Move | How (wrapper transform) | When |
|---|---|---|
| **push / pull** | `scale` 1→1.06 / 1.06→1 about the focal | focus in / reveal scale |
| **dolly** | `translate` (lateral track), parallax planes at different rates | move past a subject |
| **crane** | `translateY` (down→up) + slight scale | rise to reveal a wide |
| **orbit / arc** | x-translate + a few-degree `rotate` (or real 3D for the hero) | examine a 3D-ish object (the lens beat) |
| **whip-pan** | fast `translateX` + a 2–3f directional blur-FAKE (low-opacity smear copies) | hard cut of energy between beats |
| **rack-focus** | static `filter:blur` on the OUT plane → swap which plane is sharp (the blur is STATIC per state, just toggled — never animate the radius) | shift attention fg↔bg |
| **macro-zoom** | big `scale` into one tiny detail (the amber cell), bg falls away | "look at THIS" |
| **match-move / match-morph** | the carried object keeps its screen position/scale across the cut → reads continuous | scene→scene continuity (`vg-scene-transitions`) |
| **split-zoom** | push the subject while pulling the bg (counter-scale) — the "vertigo" | dread / realization |
| **center-lock / handheld** | hold framing with a tiny seeded positional jitter (handheld life) | calm hold that's still alive |
**Rule: no two ADJACENT scenes repeat the same camera move.** The direction is the compiler's (it points at
the emphasis, `scene-composer`); the *which-move + the variety* is the director's call in the brief
(`scene-composer` CINEMATIC). **Cheap vs expensive:** scale/translate/rotate/parallax = free; real
`filter:blur` is fine ONLY as a static per-state value (rack-focus), never animated; true motion-blur/DOF
falloff = fake with low-opacity copies or skip (`vg-quality-animations` cheap-density rule).

**CAMERA PARAMS — the lens grammar (the `params:` on a `Camera` op in the IR; cheap analogues, not a real lens).**
A move is more than a direction — these are the knobs that make it read as a real camera, each a frame-driven
transform on the camera-wrapper:
| param | what it does | cheap build |
|---|---|---|
| **amt / speed / accel** | how far + the velocity curve | `scale`/`translate` range + the easing (`out` decel, `in` accel) — never linear |
| **focus-target** | what the move points at | `transform-origin` = the focal object's centre |
| **roll / dutch** | a tilt of the frame (unease) | a small `rotate()` on the wrapper (2–6°) |
| **DOF / focus-distance** | which plane is sharp | STATIC `filter:blur` on the OFF planes (toggled per state, radius never animated — rack-focus) |
| **perspective** | depth feel on a push | `perspective()` on the wrapper + parallax planes at different rates (§`vg-code-composition` §8) |
| **shake** | impact / handheld | a tiny seeded positional jitter (handheld) or a 2–3f decaying offset (impact) |
So `Camera{move: orbit, focus-target: tilePage, amt: 0.2, accel: ease-out, perspective: on, roll: 0}` is a
full lens spec the codegen builds directly — the IR carries it (`vg-motion-compiler` shot sheet), the brief
names the move (`scene-composer`).

### Layer 3 — PARAMS (scene uniqueness; structured key:value, never prose)
Per-topology knobs — e.g. shatter `{groups, stagger, gravity, tilt, spread}` · tile `{cols, rows, gap, lift}` ·
fill `{axis, to}` · count `{to, decimals}` · slide `{dir, dist}` · push `{target, amt}`. `gravity`/`tilt` are
**faked** (easing + rotate) — no physics engine; all Remotion-buildable. The render reads `topology`+`params`
and writes **bespoke** code: `shatter{groups:rows, gravity:0.8}` → rows translateY apart with eased fall+tilt.

### TOKENS (set once per video — the motion identity; owned by `vg-code-timing` + config)
```
durations (@30fps): instant 6f · fast 12f · base 20f · slow 35f
springs (extend config spring_damping/stiffness): settle (heavy, no overshoot) · pop (snappy overshoot) ·
   glide (smooth) · bounce (playful) · stagger 6f
```
Every beat binds to a token — no one-off hand-tuned springs. **CHOREOGRAPHY** (a `params` field or top-level
tag): `sequence · together · lead-follow` (+stagger); `sync` lands a row on its spoken word (`findWord`).

**The beat-level choreography comes from the writer's `animation_pattern` — the motion-language layer above
`choreo`.** A multi-clause beat is ambiguous (domino vs separate cuts vs one morph — and each *means*
something different: causal launching vs independent facts vs a single transformation). The director tags
one of `morph · domino · cascade · together · assemble · compare · escalate · conveyor · bloom`
(`scene-composer`), and `vg-motion-compiler` expands it into the `choreo`/`stagger`/ordering above:
`domino` → sequence with causal stagger (each starts as the last lands); `morph` → one continuous Transform,
no cuts; `cascade` → same op across N elements in a wave; `assemble` → converge to one; `bloom` → radial
center-out. So `op·topology` says *what moves*, `intensity` says *how big*, and `animation_pattern` says
*how the clauses flow* — three orthogonal dials, none of them a baked template.

**The grammar is an EVENT-MARKER TIMELINE.** The compiled `motion:` rows are not a flat list — they are a
timeline of **event markers**, each row's `sync:` phrase being the marker that triggers it. As narration
playback reaches each marked word the row's `do:` (`op·topology·params·token`) fires, rows in narration
order. This is the standard phrase-synced-motion model (markers trigger actions in sequence) — and it is
why the writer can stay in story while the motion still lands frame-on-word.

**MULTI-ANCHOR micro-sync (already wired — use it).** A beat usually has setup→action→payoff in the
narration, and each motion row carries its OWN `sync:` marker, so several sub-animations fire at DIFFERENT
spoken words inside one beat — the counter starts on "rounding error", the +18% slams on "eighteen
percent". The runtime supports this directly: `findWord(phrase, nth?)` → the bullet-relative frame of that
word, and `findWordEnd(phrase)` → where it finishes; run a motion across `[findWord(p), findWordEnd(p)]` or
start it at `findWord(p)`. The compiler (`vg-motion-compiler`) emits one row per marker and auto-derives
which phrase each lands on; codegen times each with `findWord`. Each `do:` is **dynamic grammar, never a
named action-template** — the marker triggers a freshly-composed op·topology·params, not a canned clip.
This word-level coupling is the difference between "the beat animates" and "the motion breathes with the
voice" — `vg-code-sequencing` builds it.

The render builds DYNAMICALLY from `op·topology·params`; `token` keeps it consistent. Same language, scene-
specific behavior — custom motion design, not template-generated animation. Owner of `topology`+`params`
implementations: `vg-code-motion-bank`; tokens: `vg-code-timing`; composition order: `scene-planner`.

**EMPHASIS magnitude comes from the beat's `intensity:`, not from the topology.** `op·topology` says *what
moves*; the writer's `intensity:` (`low·medium·impact·climax·wonder`) says *how big it lands*, and
`vg-motion-compiler` compiles it to the amplitude of the treatment — camera magnitude (push-in on `climax`,
pull-back on `wonder`), payoff scale + glow, the punchier vs sustained `token`, and the `cue:` for the audio
swell/sting/silence. So two beats with the same `Transform·shatter` grammar can land very differently — a
`medium` shatter vs a `climax` shatter — which is how the video gets an emphasis hierarchy instead of a flat
one-weight-fits-all motion. Don't bake "bigness" into a custom topology; read it from `intensity`.

**DIRECTION is semantic — it compiles to the stagger FUNCTION, not a new op.** A pattern's optional direction
qualifier (`bloom from-center`, `cascade left-to-right`) carries *meaning* (all-at-once = force · L→R =
progress · from-center = discovery · scattered = organic), so the compiler maps it to HOW the per-element
stagger is distributed: `from-center` → delay ∝ radial distance from the origin; `left-to-right` → delay
ordered by x; `all-at-once` → 0; `scattered` → seeded random offsets. Same `op·topology`, different stagger
field — a `bloom` that radiates outward vs one that sweeps L→R reads as *discovery* vs *progress* with zero
new grammar. The exact frame gaps are the compiler's (pattern × token × intensity); the writer only names
the direction. (`vg-motion-compiler` rule 4; `vg-code-sequencing` builds the stagger function.)

---

## What's ALREADY wired into DynamicBlock — unused, just author it

These bindings are **already injected** (`remotion/src/universal/DynamicBlock.tsx`) and available in every
bullet's `code` RIGHT NOW. The pipeline simply never uses them. No install, no binding change:

| Binding | Package | Unlocks | Status |
|---|---|---|---|
| **`Video`** | `@remotion/media` | real mp4/webm clips — a screen capture, footage, a product demo | ✅ wired, unused |
| **`Audio`** | `@remotion/media` | a sound sting / sfx inside a bullet (a reveal *ding*, a whoosh) | ✅ wired, unused |
| **`AnimatedImage`** | `remotion` | animated **GIF** / APNG / WebP (a reaction, a looping mechanism) | ✅ wired, unused |
| **`slide`** | `@remotion/transitions/slide` | slide/push boundary (`from-left/right/top/bottom`) | ✅ wired, unused |
| **`wipe`** | `@remotion/transitions/wipe` | wipe boundary | ✅ wired, unused |
| **`fade`, `TransitionSeries`, `linearTiming`, `springTiming`** | `@remotion/transitions` | multi-step transitions inside a bullet | ✅ wired (fade used) |
| `Img`, `staticFile`, `Sequence`, `Series`, `spring`, `interpolate`, `Easing`, `AbsoluteFill` | `remotion` | the 2D core | ✅ used |

**So "no real video clips" and "GIF unused" and "only fade" are not engine limits — they're unused
bindings.** A real screen-capture of the tool running (the most credible visual for a tech topic) is:
```js
// clip already trimmed to the segment + Ken-Burns-free because real footage moves (no A4 freeze risk)
React.createElement(Video, { src: staticFile('clips/demo.mp4'),
  trimBefore: Math.round(fps*2), trimAfter: Math.round(fps*7),
  style:{ width:'100%', height:'100%', objectFit:'cover' } });
```
A GIF mechanism loop: `React.createElement(AnimatedImage, { src: staticFile('img/loop.gif'), style:{…} })`.
An audio sting on a reveal: `React.createElement(Audio, { src: staticFile('sfx/ding.mp3'), trimAfter: Math.round(fps*0.5), volume: 0.5 })`.
(Trim recipe: `vg-code-trimming`. Decode-safety: run `can-decode` first — see Guardrails.)

---

## What needs a ONE-LINE binding add (then it's authorable)

These are *available in Remotion* but **not yet injected** into DynamicBlock. Each needs (a) the package
installed and (b) one import + one entry in the bindings object + one entry in the reserved-name list of
`DynamicBlock.tsx`. After that they're usable in bullet `code` like any other binding.

| Capability | Package | Binding | Unlocks |
|---|---|---|---|
| **3D / camera** ✅**WIRED NOW** | `@remotion/three` (+ `@react-three/fiber` + `drei`) | **`ThreeCanvas` — already injected, authorable** | a camera moving THROUGH a space, a rotating object, real depth/lighting/material. Inner R3F elements are string tags: `React.createElement('mesh'\|'ambientLight'\|'boxGeometry'\|'meshStandardMaterial', …)` |
| **POST-PROCESSING** ✅INSTALLED — still needs its component bindings | `@react-three/postprocessing` | `EffectComposer`+`Bloom`/`DepthOfField`/`ChromaticAberration`/`Vignette` (inside ThreeCanvas) | **real bloom · depth-of-field · chromatic aberration · vignette** — the "looks expensive" effects (one-line add each) |
| **flip / clockWipe** | `@remotion/transitions/flip` · `/clock-wipe` | `flip`, `clockWipe` | the rest of the boundary vocabulary |
| **Shaders** | via `@remotion/three` `shaderMaterial` | (through ThreeCanvas) | gradient fields, energy/flow effects, generative texture — `useCurrentFrame()`-driven uniforms |

> ✅ **`ThreeCanvas` IS NOW WIRED into `DynamicBlock`** (the binding + RUNTIME_KEYS + reserved-name list) — so
> **real 3D is authorable in any bullet RIGHT NOW** (basic geometry/lights/camera/materials via string tags).
> Only the **postprocessing components** (Bloom/DOF/…) and flip/clockWipe still need their own one-line binding
> add. The 3D stack is all in `package.json` already — no install. **Budget unchanged: 3D is the ~1-per-video
> HERO swing (render cost); keep the rest 2D** (`visual-story-engine` ≤1 HIGH/video).

**Adding the REMAINING bindings (postprocessing / flip / clockWipe — same pattern; ThreeCanvas is done):**
```ts
// 1) import at top of DynamicBlock.tsx (3D is already imported):
import { flip } from '@remotion/transitions/flip';
import { clockWipe } from '@remotion/transitions/clock-wipe';
// 2) add the name to RUNTIME_KEYS AND the value to runtimeBindings (the map — lockstep guard catches drift)
// 3) add the SAME name to the reserved-binding list (CLAUDE.md #14 · vg-code-tokens · video-generation-conventions)
```
(`vg-known-bugs` before editing pipeline TS; the reserved-name list is the one in CLAUDE.md SHIFT-LEFT #14.)

---

## PREMIUM TECHNIQUES — render the REAL effect, not an ICON of it (the "looks expensive" catalog)

The #1 reason a beat reads as *flat template* instead of *cinematic* is it draws a **symbol of a thing**
instead of **the thing's real behaviour**: a "lens" drawn as a stroked circle (vs glass that actually
magnifies + distorts), a "glow" as one flat radial gradient (vs light that blooms), a "shredder" as an
outlined box (vs a machine with depth + motion). **The fix is technique, and most of it is authorable in 2D
RIGHT NOW** (no binding) — reach for 3D+postprocessing only for the ONE hero beat. Each technique below =
what it replaces → how → binding status.

| Flat tell (icon) | Premium technique (the real effect) | How (2D, authorable now unless noted) |
|---|---|---|
| a "lens"/magnifier = a stroked circle | **REAL OPTICS via masking** — the circle MAGNIFIES the content beneath it | a 2nd **clone of the same content**, scaled ~1.4–1.6× about the focal point, **clipped to the circle** (`borderRadius:50%; overflow:hidden`), + a glass **rim** (`border` + `inset boxShadow`) + a specular **glint** (small soft-white ellipse top-left). Same trick = spotlight reveal, X-ray, before/after wipe-mask. |
| a "glow" = one flat radial gradient | **LAYERED BLOOM** — light that actually blooms | stack **2–3 progressively larger, lower-opacity STATIC-blurred copies** of the bright shape (or `mixBlendMode:'screen'` gradients); the hero beat → **real `Bloom`** (postprocessing, in `ThreeCanvas`). **⛔ GATE FIRST — see below.** |

> ⛔ **BLOOM IS LIGHT — only put it where a REAL light source is.** Bloom depicts *emitted/reflected light*:
> a screen glowing, a flash on a state-change (a "win" flash), a neon sign, fire, a bright object's halo,
> a lens flare. It is **NOT a way to say "this matters."** A glow blooming off a *table cell, a label, a
> box, an arrow* is decorative fiction (those things don't emit light) — and **decorative-glow-on-importance
> is the #1 generic-motion-graphics / AI tell**, the OPPOSITE of premium. Before any glow, ask: *"is this
> thing actually a light source?"* If no → **remove the glow** and mark importance *representationally*
> instead: a **highlight** (a marker fill), the **lens/optics** revealing it, **focus/DOF** (it sharp, the
> rest soft), desaturating everything else, a pointer/underline, or motion. (Real lapse: an
> amber glow bloomed off a static price cell — meaningless to a viewer, read as template. The fix was the
> highlight + the real lens, not a fancier glow.) Bloom used sparingly on real light = premium; bloom as
> decoration everywhere = amateur.
| everything equally sharp | **DEPTH OF FIELD** — focus falloff | a **static** `filter:blur()` on the bg/non-focal plane (sharp hero, soft surroundings) — static blur is render-safe; **never animate the blur radius** (`vg-known-bugs`). |
| a fast move that just teleports | **MOTION BLUR / TRAILS** — the move has speed | stack a few **low-opacity copies** of the element along its path (a fake trail), fading back; truly filmic = `@remotion/motion-blur` `<Trail>` (binding add). |
| a line/arrow drawn instantly | **PATH-TRACING** — it draws + things travel it | an SVG `path` with `stroke-dashoffset` to DRAW; `getPointAtLength()` to move an object ALONG it (`@remotion/paths`). |
| a flat diagram of "a space" | **3D + POST-PROCESSING** — the camera moves THROUGH it | `ThreeCanvas` + R3F geometry + an `EffectComposer` with `Bloom`+`DepthOfField`+`ChromaticAberration`+`Vignette`. **Installed, just wire it.** The ONE hero beat. |

**The principle (state it before authoring any focal object):** *"what is the REAL optical/physical behaviour
here, and which technique renders it?"* If the answer is "a stroked outline / a flat gradient / it just
appears," you're drawing an icon — pick the technique above. (Pairs with `vg-code-artifacts` "draw the real
mechanism" — that's *what* to draw; this is *how* to make it read as real. Light/material/grain global pass:
`vg-code-composition` §8b. Verify: `vg-quality-animations` test #5 premium tell.)

**Budget (the rule of restraint still holds):** the 2D techniques (real optics, layered bloom, DOF, trails,
path-tracing) are cheap + render-safe — use them liberally on focal objects. **3D + postprocessing is the ONE
hero swing per video** (camera through space) — wire `ThreeCanvas` once, spend it on the bespoke hero scene,
keep the rest 2D. Reaching for 3D on every beat blows the render budget and is not the point — a *real lens*
and a *real bloom* in clean 2D already separate "premium" from "template."

---

## Point-by-point — the capability you asked about, and how to use it

### 1 & 2. Everything is flat 2D on one plane → add DEPTH (the biggest cinematic win)
Two paths, cheap → expensive:
- **2D parallax (no new binding):** move fg/mg/bg layers at DIFFERENT rates on any camera push/drift —
  the multiplane illusion. Full recipe + code: **`vg-code-composition` §8.** Use this for ~every scene
  that has a camera move; it's free and turns a slide into a world.
- **Real 3D (`ThreeCanvas`):** for the ONE hero scene where the camera literally travels through space.
```js
// camera dollying through a corridor of server racks (the user's example) — frame-driven, never useFrame()
React.createElement(ThreeCanvas, { width, height },
  React.createElement('ambientLight', { intensity: 0.4 }),
  React.createElement('directionalLight', { position:[5,5,5], intensity: 0.8 }),
  // racks built from boxGeometry; camera z advances with the frame:
  // position the group so it slides past as `frame` grows → "moving THROUGH the racks"
);
```
Rule (3d.md): **everything animates via `useCurrentFrame()`** — `useFrame()` from R3F is FORBIDDEN (it
flickers in render). `<ThreeCanvas>` needs `width`+`height`; any inner `<Sequence>` needs `layout="none"`.

### 3. Real video clips → `Video` (already wired)
A trimmed `Video` is the most credible visual for "show the actual thing." See the snippet above +
`vg-code-trimming`. Prefer a still + Ken Burns (`vg-code-images`) for a *frame*; use `Video` only when the
*motion in the footage* is the point. ALWAYS `can-decode` first (Guardrails).

### 4. Lottie → illustrated feel + reusable character
The cheapest path from "shape-drawn" to "illustrated like Kurzgesagt." A small curated Lottie set gives a
recurring **character** (the visual through-line, `scene-composer` §1b) without hand-coding. Load
pattern (lottie.md): fetch JSON inside `delayRender()`/`continueRender()`, render `<Lottie animationData>`.
Keep it `useCurrentFrame()`-consistent (Remotion drives the Lottie frame in render).

### 5. 3D exists but is unused → use it for the ONE camera-through-space moment
Covered above (point 1&2). The instinct: don't draw `Server → Arrow → User`; *fly the camera down the
aisle.* That's the screenshot moment. One per video.

### 6. Depth/parallax isn't used → `vg-code-composition` §8 (2D) or `ThreeCanvas` (3D)
Same as point 1&2 — the fix is the fg/mg/bg-at-different-rates recipe. "Everything moves together" is the
flat tell; three planes at three speeds is depth.

### 7. GIF unused → `AnimatedImage` (already wired)
`AnimatedImage` plays animated GIF/APNG/WebP, timeline-synced. Use sparingly for a reaction or a looping
real mechanism. (Not a chart — a *texture* of life.)

### 8. Transition vocabulary is only fade → use the whole set
`fade`/`slide`/`wipe` are wired; `flip`/`clockWipe` need the one-line add. Map the cut to the beat's
MEANING (full table: `vg-code-transitions` §"Transition VARIETY" + `vg-scene-transitions`):
| Boundary | Use for |
|---|---|
| `fade()` | a calm Resolution / a soft topic change |
| `slide({direction})` | sequential momentum ("next", a list advancing) |
| `wipe({direction})` | a decisive reveal / a before↔after Compare |
| `flip()` | a perspective flip — "the other side of this" |
| `clockWipe()` | time passing / a cycle completing |
```js
React.createElement(TransitionSeries.Transition,
  { presentation: slide({direction:'from-right'}), timing: linearTiming({durationInFrames: 18}) });
```
Don't fade everything — identical boundaries are the monotone tell.

### 9. High cognitive complexity → the layering model (hold this in your head)
Three orthogonal axes — keep them separate and the composition stays sane:
- **Z (depth / who's in front):** `AbsoluteFill` children paint in order (later = on top); use explicit
  `zIndex` for image-foreground (CLAUDE.md #12). fg/mg/bg planes (§depth) live here.
- **T (time / when):** `Sequence {from, durationInFrames}` places a beat in its EXCLUSIVE window
  (`framesFrom→framesTo`; the prior beat unmounts). The persistent world is the `role:'stage'` block
  (outside any Sequence, scene-local frames) — a beat renders its delta on the stage, not on the prior
  beat (`vg-visual-designer` §SCENE-DRIVEN).
- **Motion (how it moves):** EVERY value comes from `useCurrentFrame()` → `interpolate`/`spring`. No CSS
  transitions, no `useFrame`, no self-animating Lottie/3D.
Mental model: **"z × t × frame-driven motion."** A bullet is a z-stack of elements, each entering at a
time, each moving by frame. That's the whole engine.

### 10. Scene transitions — the master adds NO fade (the "double-fade" is NOT possible by design)
**Current reality (read `remotion/src/MasterComposition.tsx`).** The master is a plain **`<Series>`** of
the per-scene mp4s + the master `<Audio>` — **zero overlap, zero master-level fade or crossfade.**
`TransitionSeries` was deliberately **rejected**: it overlaps adjacent scenes by ~12 frames each, which
shortens the video while the audio stays full-length → audio outruns video (~12 frames per transition).
So `Series` is the source-of-truth and `stitch.mode` (crossfade / remotion_master) is **dead config the
master never reads** — there is no master fade to stack against, and the old "master + scene double-fade"
cannot happen.

**The ONLY fade is the per-scene `<Backdrop>`** (`design.fade_frames`, default 8 ≈ 0.27s), which fades the
scene in from `D.bg` and out to `D.bg` at its own edges. That bakes into each scene mp4 once. The single
residual at a boundary is therefore a **~`fade_frames`-long dip to `D.bg`** (scene N fades out, scene N+1
fades in) — *one* dip, not a stacked double-dark. To tune it: lower `design.fade_frames` for a quicker dip,
or set it to `0` for hard cuts. A *true* crossfade needs overlap (= `TransitionSeries`) and would reintroduce
the sync drift, so with this frame-perfect-audio design the fade stays at the scene level. (Within a single
bullet/scene, stacking two fades — e.g. a REPLACE backdrop over a still-fading element — CAN double-dark;
that's `vg-code-transitions` / `vg-quality-transitions`, a different thing from the master.)

### (frame extraction) — intentionally NOT a bullet capability
Remotion can extract frames, but this pipeline does frame extraction with **ffmpeg** for QA (the
filmstrip motion-scoring, `vg-quality-animations`; `vg-verification-protocol` Layer 1.5) — not inside a
bullet. Keep it that way; it's a verification tool, not an animation lever.

---

## The decision rule — when to reach past flat 2D

```
Is this the bespoke HERO scene (TYPE 11) or the ONE camera-through-space moment?
  → yes: pick the capability that makes it unforgettable (3D camera / Lottie character / metaphor-as-world)
  → no:  stay 2D vector (fast, reliable) — but ADD 2D parallax depth (composition §8) + a non-fade cut
Is the most credible visual literally the real software running?
  → yes: a trimmed `Video` screen-capture (already wired) beats any drawn diagram
Does the concept need an illustrated/character feel the shapes can't give?
  → yes: Lottie (one binding add) — the cheapest path to "premium illustrated"
Otherwise → the 2D vocabulary is correct; make it move well (vg-code-animations) and cut it varied.
```

---

## Guardrails (using the heavy capabilities without breaking the build)

- **`Video` can hang the headless render** if the codec can't decode. **Run `can-decode` FIRST**
  (can-decode.md): H.264/mp4 is safe; **AV1/HEVC may fail silently**. Re-encode to H.264 before using.
- **Frame-driven only.** R3F `useFrame()` is forbidden (3d.md); Lottie/3D/shaders must animate by
  `useCurrentFrame()`, or they flicker / desync in render. No CSS `transition`/`animation`.
- **Performance budget.** 3D and video carry real cost — ONE heavy scene per video, not ten. A still +
  Ken Burns (`vg-code-images`) often does what a `Video` would, cheaper. Prefer it unless the footage
  motion is the point.
- **Every gate still applies.** A 3D/Lottie/video bullet still must pass the V-checks (fill, readable
  labels, not-frozen — real footage moves so A4 is satisfied), tokens for any 2D overlay (`vg-code-tokens`),
  and the muted/deaf-viewer test. Heavier ≠ exempt.
- **Tokens for overlays.** Text/labels over a `Video`/`ThreeCanvas` go in a `zIndex:1` AbsoluteFill with
  a legibility scrim ≤0.6 (`vg-code-images` stacking-context rule), all `D.*`.
- **No brand fakery / no spectacle.** A real logo clip is fine; an invented one isn't. 3D/shaders are for
  *meaning made vivid* (a camera through the real mechanism), never decorative neon (`vg-visual-map`
  Prohibited Patterns).

---

## Cross-references
- **Author-time 2D depth + composition→emotion + non-dashboard archetypes:** `vg-code-composition` §8–§10
- **The bespoke hero scene this skill builds:** `vg-visual-map` TYPE 11 (metaphor-as-world) + `vg-code-artifacts` §world artifacts
- **Transition variety (within-bullet):** `vg-code-transitions` · **scene boundaries / stitch:** `vg-scene-transitions`
- **Trim a clip/animation:** `vg-code-trimming` · **images + Ken Burns + stacking:** `vg-code-images`
- **Remotion rule files (the API source of truth):** `remotion/rules/` — `3d.md`, `lottie.md`,
  `videos.md`, `gifs.md`, `audio.md`, `transitions.md`, `can-decode.md`, `assets.md`
- **Before editing DynamicBlock / any pipeline TS:** `vg-known-bugs`
