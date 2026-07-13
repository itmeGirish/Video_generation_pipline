---
name: vg-quality-animations
description: Production-quality gate for ANIMATION RICHNESS & MEANING — scores a scene's motion 0-10. Grounded in remotion animations.md. A beat must be a layered entrance + choreographed order + ≥1 supporting motion, all serving ONE clear meaning; never a bare fade or one-move-then-frozen. Use after a scene renders (score from frames), when motion looks flat/amateur/decorative, or before advancing a scene. One of the 8 visual-quality factors (see vg-visual-quality).
model: opus
---

# Quality Factor 1 — Animation richness & meaning

Score from the EXTRACTED FRAMES (not the code). Source of truth: `remotion/rules/animations.md`
+ video-generation-conventions Motion discipline. This is the #1 separator between an
"AI slideshow" and a Fireship/Kurzgesagt render.

> ⛔ **MOTION CANNOT BE JUDGED FROM ONE FRAME — score from the FILMSTRIP.** Easing, anticipation,
> overshoot, follow-through, and stagger are all *temporal* — a single midpoint still looks identical
> whether the motion was linear-and-dead or eased-and-alive. So for this factor (and timing/sequencing/
> transitions) you MUST score from a **5-frame filmstrip per bullet** — extract at p10/p30/p50/p70/p90
> (`vg-verification-protocol` Layer 1.5 already pulls these) and read the motion ACROSS them:
> - does the value ACCELERATE then settle (eased), or move equal distance each frame (linear → robotic)?
> - is there a wind-up (anticipation) before the launch, or an overshoot-then-back at the land?
> - do supporting elements LAG the hero (follow-through), or move in lockstep?
> - do multi-element reveals arrive STAGGERED across the strip, or all on one frame?
> If you only looked at one frame, you did not score motion — you scored layout. Pull the strip.

## What production-grade looks like (10)
- Each beat = a **layered entrance** (2–3 transforms: slide+scale+slight-rotate, not one move)
  + **choreographed order** (a hero lands, supporting labels follow) + **≥1 supporting motion**
  (glow pulse, particle, drifting backdrop) — all serving ONE clear meaning.
- **Motion maps to meaning:** up=more, down=less, apart=growing gap, converge=agreement,
  fast=sudden, big=dominant. The movement itself teaches the point.
- **Muted test passes:** with audio off, the motion alone makes the point.
- **One hero leads the eye** per beat; the rest support or hold.

## Failure signals (low)
- Bare opacity fade as the whole animation; element enters then freezes.
- Lots of motion that explains nothing (spinning shapes, drifting particles as the main event).
- Motion contradicts meaning (a "rising cost" bar that shrinks).
- Two unrelated things animate equally → split attention.
- Decoration IS the main event; nothing teaches.
- **THIN / sparse beat (the #1 real-world miss):** one element on a near-empty canvas; numbers
  that just APPEAR instead of counting up; no scaffold; almost no labels; static after the
  entrance. It animates but reads amateur. If half the canvas is empty and nothing is counting
  or moving at the midpoint, it's thin → fails. (See `vg-code-motion-bank` + `vg-code-composition`
  density; script side `scene-composer` §Density bar.)

## The fix
Rebuild the beat: pick the script verb → make the visual DO it; layer 2–3 transforms on the
hero; stagger the supporting elements; add one supporting motion; ensure the direction/size
encodes the meaning. Cut decoration that doesn't serve the one point.

## Did the render honor the beat's `intensity`? (the emphasis amplitude)
If the beat carries an `intensity` (from the script), the peak must READ as a peak across the strip:
- **climax / wonder** → the scene's biggest move: bigger entrance scale + hero glow + a camera push-in
  (`climax`) or pull-back (`wonder`) + a HELD final frame. If the marked peak looks like an ordinary beat,
  the emphasis was flattened → REVISE (this is the "flatline" the dial exists to fix).
- **impact** → a sharp, punchy hit (overshoot + flash), clearly stronger than the `medium` beats around it.
- **low** → genuinely subdued (a supporting label) — must NOT compete with the beat's payoff.
A video where every beat lands at the same amplitude (no visible hierarchy between a `medium` and a
`climax`) caps at ≤6, even if each beat is individually rich.

## 0–10 rubric
- **9–10:** layered + choreographed + supporting motion, meaning unmistakable muted, one hero leads; the beat's `intensity` is visibly honored (peaks read as peaks).
- **7–8:** real entrance + some support, meaning clear, but a bit thin or one missed hero.
- **5–6:** single transform, mostly one-move; meaning needs the narration; little support.
- **3–4:** bare fades or motion that doesn't map to meaning; or competing motions.
- **0–2:** static/frozen, or pure decoration that teaches nothing.

**The purpose test (governs both directions):** every motion must help the viewer *understand*,
*emphasize a key moment*, or *improve engagement*. Ask of each animation: "what does this help the
viewer do?" No answer → it's decoration → cut it. This cuts BOTH ways:
- **Thin/sparse** (empty canvas, numbers that appear vs count, no labels) caps the scene at **≤5** —
  density that serves comprehension is required.
- **Over-animated** (motion with no purpose, principles forced onto every element, busy/competing
  movement that adds load not clarity) ALSO caps at **≤5** — clarity beats complexity.
The target is the middle: *as much motion as serves understanding, and no more.*

**Gate:** < 7 → REVISE the beat. A frozen/decorative-only beat caps at ≤4. Report the weakest
beat + the one change that raises it most (add a purposeful counter/scaffold/label if thin;
remove purposeless motion if busy).

---

## MOTION DENSITY — ONE KINETIC FOCUS + a RUNNING MECHANISM (corrected 2026-07-10)

> ⛔ **This gate previously scored "≥8 live systems even at the quietest moment" as 9–10. That rule was a
> BUG** (benchmarked against the reference explainer, `feedback/learning.md` §D): it rewards motion
> QUANTITY, splits attention, and pushed authors to add decorative breathes/shimmers to satisfy a count.
> The reference-grade frame is the opposite — SERIAL attention: one thing moves, everything else is
> pixel-still, and long beats stay alive because the beat's MECHANISM keeps running, not because eight
> layers wobble.

Density now asks two questions:

1. **Is there a RUNNING MECHANISM?** A beat explaining a process/rate/per-unit behavior must have its
   mechanism visibly operating in a loop (`cycle` op: travel→process→emit, repeating) — studyable on the
   2nd and 3rd pass. A mechanism beat rendered as one entrance + a static hold = FAIL.
2. **Is there exactly ONE KINETIC FOCUS at a time?** At any instant, one object is in visible motion (the
   current subject, or the running mechanism between events) + at most a dim periphery (a slow ambient
   light/dust layer at low prominence). Everything settled is pixel-still — stillness is DESIGNED, not a
   defect.

Score from the FULL-beat filmstrip:
- **9–10:** the mechanism runs through the beat; one mover at a time; events punctuated by real stillness;
  periphery instruments present but dim/static until relevant.
- **7–8:** mechanism present but intermittent, or two movers occasionally compete.
- **5–6:** no mechanism — entrance tweens + breathing holds carry the beat ("arrivals, then wobble").
- **≤4:** EITHER a frozen tail (built-then-dead) OR everything animating at once (attention shatter).
  **Both cap the scene at ≤5.** Motion quantity never compensates for a missing mechanism.

**THE FROZEN-TAIL FAIL (judge p50→p90, not the midpoint).** If a beat's late frames are near-identical to
its mid frame, the beat *built then froze* = a PowerPoint appear-animation → density FAIL. (This is the hole
the old midpoint-only check missed: "there was motion early" passed a beat that's dead for its last 4 seconds.)

**⛔ THE STALE-ELEMENT FAIL (judge ACROSS beats, per element — the hole A4 + SUBJECT-MOVED both miss).**
A4 gates the whole FRAME (something somewhere moves → pass) and SUBJECT-MOVED gates the hero WITHIN one
beat. Neither catches this: a **load-bearing element (a verdict card, headline stat, hero panel) that stays
pixel-identical across MULTIPLE consecutive beats** — tens of seconds — while other things change around
it. The world moved on; that element stopped being part of it, and the frame reads as a slide with a sticker
on it. Check from the SCENE filmstrip, per prominent element: at each beat boundary, did the element
**re-react** — update its value, change state, get re-emphasized (dim/lift as focus moves), or at least
acknowledge the beat (a coupled reaction)? An element unchanged across ≥2 beat boundaries (~≥10s) → stale →
**cap density ≤6** and route: re-reaction/dim-lift → `vg-code-animations` §SPOTLIGHT-DIM + hold-alive;
value updates → `vg-code-artifacts` (wire it to the scene driver). A deliberate constant (a docked
`Kit.RefCard`) is exempt from VALUE change but still must breathe and still gets dimmed/lifted with focus.

**Run it MECHANICALLY (like SUBJECT-MOVED — never eyeballed under "looks fine"):** crop the ELEMENT's box
at consecutive beat-boundary frames and SSIM them:
```bash
# EX/EY/EW/EH = the held element's box; tN = a frame just AFTER each beat boundary (from the scene JSON's
# framesFrom values). Compare the element across boundaries — not within one beat.
ffmpeg -ss <t_beat_k>  -i scene.mp4 -vf "crop=EW:EH:EX:EY" -frames:v 1 ek.png
ffmpeg -ss <t_beat_k+2> -i scene.mp4 -vf "crop=EW:EH:EX:EY" -frames:v 1 ek2.png
ffmpeg -i ek.png -i ek2.png -lavfi "ssim" -f null -
```
- **SSIM(element, boundary k → k+2) ≳ 0.99 → the element ignored two beats → STALE → cap density ≤6.**
  (A breathe registers as ~0.97–0.99 at matched phase — that alone is the RefCard exemption, not a pass for
  a verdict card whose VALUE/state should have changed.) Run it on every element you'd call load-bearing:
  the verdict/answer card, the headline stat, the hero panel. Record the worst pair in the scene's notes.

### ⛔ THE SUBJECT-MOVED GATE — mechanical, deterministic, BLOCKS MASTER-PASS (the anti-PPT teeth)
This is the one gate that actually stops the "beautiful slide" from shipping — and it must be **run
mechanically, not eyeballed under "looks fine".** The failure: ambient layers (camera, dust, breathing) move,
but the **hero SUBJECT is in the same STATE at the start and end of the beat** → a slide with decoration.
**The deterministic check (run it, per beat — like the overlap validator, not by vibe):**
```bash
# crop the SUBJECT region (the hero object's box, NOT the whole frame — the camera/dust move globally),
# at p10 and p90 of the beat; if the subject pixels barely changed, the subject FROZE.
ffmpeg -ss <p10> -i scene.mp4 -vf "crop=SW:SH:SX:SY" -frames:v 1 a.png   # subject box at p10
ffmpeg -ss <p90> -i scene.mp4 -vf "crop=SW:SH:SX:SY" -frames:v 1 b.png   # subject box at p90
ffmpeg -i a.png -i b.png -lavfi "ssim" -f null -                         # SSIM of the SUBJECT region
```
- **SSIM(subject p10, p90) ≳ 0.97 → the SUBJECT DID NOT TRANSFORM → HARD FAIL** (caps factor ≤4, **blocks
  MASTER-PASS**). It moved/morphed/extracted/recolored? SSIM drops. It only "appeared then held" while the
  camera drifted? The subject box SSIM stays ~1.0 → caught. (Crop the SUBJECT, not the frame — a moving camera
  makes the whole-frame diff lie; the subject-region diff doesn't.)
- This is the mechanical mirror of `render-validator`'s "would it look like a slide if paused?"
  and `visual-story-engine`'s STATE-IN ≠ STATE-OUT. The script SPECS it; **this gate ENFORCES it on the
  pixels** — the binding that makes the anti-PPT rules real instead of advisory.
- **Transformation evidence:** the subject-moved delta feeds the transformation proof — recorded as
  `transform=<Δ>%` in `VISUAL-PROOF:` (per scene, pre-render) and `transform=<min-Δ>%` in `MASTER-PASS:`
  (whole video). The lowest subject-region SSIM across beats (target ≤0.90) IS that Δ: a static subject
  (SSIM ≳0.97 → Δ≈0) fails the transformation proof — it can't ship just because the camera moved. Pair
  with the FROZEN-TAIL check (subject p50 vs p90).

### ⛔ THE TEXT-MOTION RATIO — premium animates OBJECTS, cheap animates TEXT (the template tell)
The fastest tell of a cheap template is *what is actually moving.* Score it from the filmstrip per beat:
classify each MOVING element as **TEXT-motion** (a word/number/label/title that flies in · scales · glows ·
bounces · types on) or **OBJECT-motion** (a thing with form — page/chart/card/vessel/figure — that
transforms). **If TEXT-motion drives >~20% of the beat's motion (by count AND by on-screen area), the beat is
text-animated → cap ≤4.** The fix is not "animate the text better" — it's *replace the animated text with an
animated object, and let the text confirm it after* (the "35%" appears only once the graph has already
fallen). This is the render-side enforcement of `visual-story-engine` LAW 3. (A pure title card or a
1-line closer is exempt — judge the EXPLANATORY beats.)

### ⛔ ENTRANCE VARIETY — the same entrance on everything is a template signature
Read the entrances across the scene's beats (and against earlier scenes if you have them). **If every element
arrives the same way — one `fade+scale`, or all sliding from the same edge — that sameness IS the "looks like
a template" signal → cap the Sequencing-coupled score ≤5 and flag it.** Premium motion VARIES the entrance to
carry meaning (rise=growth · drop=consequence · scale-from-point=emphasis · draw=connection —
`vg-visual-map` direction map): the entrance should be *chosen per element by what it means*, never one stamp
reused. Repetition across the whole video is the same flag at video scale — surface it as a systemic fix.

**⛔ CHEAP DENSITY ONLY (the render-safety floor).** Density is premium **only if every added system is
compositor-cheap** — `transform` (scale/translate/rotate), `opacity`, gradient/background-position. Adding
density via **`filter:blur`, animated `boxShadow` blur (HANGS the render — `vg-known-bugs`), `backdrop-filter`,
displacement/heat/refraction, real smoke** is a trap that balloons render time or hangs it. **8 cheap systems
beats 12 expensive ones.** Fake the "expensive" looks: motion-blur → a few low-opacity trailing copies;
refraction/heat → a gradient overlay; bloom → stacked low-opacity screen-blend layers (`vg-code-composition`).

**Owner fixes when density fails:** missing mechanism loop → `vg-code-animations` (§HOLD-ALIVE = the
mechanism) + the `cycle` op (`vg-motion-compiler`); parallel movers / attention shatter →
`vg-code-sequencing` §SERIAL ATTENTION; dead periphery → `vg-code-composition` (dim static instruments,
not added motion). Author-time, the scene's plan declares its RUNNING MECHANISM + the one-mover sequence
(`vg-render-code` 0c) so both failure directions are caught before render, not after.

**IR-CONFORMANCE (when the beat has a compiled SHOT-SHEET).** If `vg-motion-compiler` emitted a shot sheet for
the beat, the render must MATCH it, not approximate it — check the filmstrip against the IR:
- **dependency chain FIRED** — for each primary row with `drives:`, its reactions are visibly present (the
  shadow followed, the key brightened, dust kicked, the camera compensated). A primary whose reactions are
  missing = the inert beat → FAIL (this is most of the density count).
- **per-object specs honored** — `material` reads (glass slides a specular, paper flutters, metal is rigid),
  `physics` is per-object (the heavy thing drags, the light thing springs — not one global spring), the
  `anchor/pivot` is right (no corner-scaling), `z` order matches.
- **shots present** — the beat's sub-phases land on the IR's shot frame-ranges (no single build-then-freeze).
A render that drew the spine (the primary) but skipped the body (reactions/material/per-object physics) caps
the factor at ≤6 even if the primary is clean — the IR exists so the motion is built, not improvised.

---

## CLEAN ≠ GOOD — the rubber-stamp trap (read before scoring a frame)

The #1 way a bad scene ships is inspecting the rendered frame, seeing it's *clean and readable*,
and scoring it PASS. **Clean is not the bar. Dense + explanatory + causal is the bar.** (Real
failure: a thin meter bar + a command on empty off-white
rendered perfectly clean and was scored PASS — the user rejected it as explaining nothing.)

Apply these MEASURABLE tests to every frame, not a vibe:

1. **Canvas-fill (hard):** does the primary visual occupy a real AREA — roughly **≥25–30% of the
   frame** — and is **less than half the frame empty background**? A wide *thin* bar fails: it can
   be 50% wide but ~2% area. If the frame is mostly empty field with a sliver + a few words →
   **cap ≤4** (this is `render-validator` E9 at render time). *(Exempt: a PLANNED `Interstitial`/awe
   beat — `scene-planner` purpose + negative-space composition — judge it as composition-for-feeling,
   not fill. Unplanned sparseness is still the fail.)*
2. **Causality (hard):** if the beat has a cause and an effect, are they **visually connected** on
   the frame (arrow / flow / the input entering the thing it changes)? Two related elements in
   separate corners with no link → **cap ≤5** (E10).
3. **Deaf-viewer explanation (hard):** with audio off, does the frame say WHAT it is and what
   POINT it makes? If the honest read is "a command and a bar, usage went down I guess" → it does
   not explain → **cap ≤5**.
4. **State-change ENACTED, not FAKED (hard) — score from the FILMSTRIP:** when the beat's verb is a
   TRANSFORMATION (tear / collapse / flatten / shred / merge / split / grow / drain / lose), the real
   elements must PHYSICALLY do it across the strip. A transformation conveyed instead by a **CSS filter**
   (`grayscale()`/`blur()` over a still card), a **global opacity fade**, **gray placeholder bars sliding
   off** in place of the real content transforming, or a **text LABEL that names the change** while the
   thing barely moves → the verb is FAKED → **cap ≤5**. The pixels must show the thing *happening to the
   thing* — the table's columns coming apart, the cell ripped out — not a recolor or a caption announcing
   it. (Real miss: "throws the page away, keeps only the words" rendered as the table
   fading to grayscale + 7 gray strips — clean, but the destruction is never enacted. This is the
   render-time mirror of render-validator's "animates a NOUN not a verb → cap ≤5" and the
   verify-time STORY-VERB test, vg-verification-protocol step j.)

5. **PREMIUM / not-a-flat-template (the "looks AI-generated" tell):** would this frame survive a cut next to
   Kurzgesagt / Apple / Johnny Harris — or does it read as a clean *motion-graphics template / dashboard / slide*?
   The flat-vector tells, each of which caps the scene's premium read: **(a)** matte flat-`#fill` shapes on one
   plane — no texture/grain, no light pool/vignette, no material (gradient/soft shadow) → looks "digital flat";
   **(b)** everything on ONE plane — no fg/mg/bg parallax that READS; **(c)** motion that only *appears-and-settles*
   — no anticipation (wind-up), no overshoot-with-character, no secondary motion (a label lagging the hero),
   no follow-through. A beat that is flat-fill + one-plane + appears-and-settles is a **template, cap ≤6 on
   premium-feel** even if mechanically clean. The fix is author-side `vg-code-composition` §8 (parallax) + §8b
   (grain·light·material) + motion character here; the ONE hero beat breaks the 2D ceiling via `vg-remotion-engineering`
   (real 3D/Lottie). (Real miss: 83% mechanical score on a flat dark-vector scene a creative
   director read as "premium infographic, not cinematic" — the craft gates were blind to texture/depth/character.)

6. **LUMINANCE RANKS IMPORTANCE (the light-hierarchy check):** on the settled frame, squint — is the
   HERO the brightest / highest-contrast patch on screen? Light is how the eye ranks a frame before
   reading anything. If a support panel, a decorative accent, or the background out-brightens the hero,
   the light hierarchy is inverted → **cap ≤6**; a flat, evenly-lit frame (no luminance ranking at all)
   reads clean but gives the eye nowhere to go → same cap. Route: `vg-code-composition` §8b (the light
   pool + vignette) / script intent `lighting-director` ("the hero sits in the light pool").

If you cannot point to the dense primary, the causal link, the explained point, AND the physically-enacted
verb in the actual pixels, do NOT score it ≥7 — send it back to re-author. Never report "frames are clean"
as the verdict; report whether the frame is dense, causal, self-explaining, and enacts its verb.
