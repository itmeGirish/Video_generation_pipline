---
name: vg-verification-protocol
description: "5-layer YouTube production quality gate: pre-render image-asset validation (presence + decode + license + relevance), V1-V13 visual frame inspection incl. V14 image-actually-rendered, A1-A8 animation filmstrip incl. Ken Burns motion for image bullets, audio WPM/coverage + anchor-drift, YouTube T1-T12 technical standards. Run after every render before advancing to next scene. Use whenever verifying a render, validating fetched images, running QA, or any request like "verify the render," "V1-V8 check," "image asset gate," "quality gate," "filmstrip," "audio sync verification," "frame inspection," or "is this scene done.""
model: opus
---

# Verification Protocol — YouTube Production Quality Gate

Four layers run in order. A scene does not advance until its layer passes.
The final mp4 does not upload until all four layers pass.

```
LAYER 1   Visual Quality       (before authoring + after render)
LAYER 1.5 Animation Validation (after render — filmstrip + motion checks)
LAYER 2   Audio Quality        (after TTS + after final render)
LAYER 3   YouTube Technical    (final mp4 only — upload gate)
```

> **What the layers PROVE — the render EXECUTES the motion-native contract, it doesn't invent.** Layers 1–3
> verify *broken? · production-grade? · upload-ready?* — but the render executes the **12-layer motion-native
> contract**, so the SAME loop must prove the **Motion Story Quality Gates** (CLAUDE.md): **`vg-scene-validator`**
> (render CONFORMS to the contract) · **`vg-quality-animations`** (anti-PPT teeth: SUBJECT-MOVED·text-ratio·density)
> · **`video-narrative-editor`** (holistic muted read). Pass V-checks but VIOLATE the contract = FAIL MASTER-PASS.

---

## Contents

- The verification model — cheap per-scene PROOF (pre-render) + the MASTER battery (post-render)
- The `verification.md` artifact — MANDATORY written record
- Scene s01 — <scene-id>
- 🔊 AUDIO SYNC CHECK — MANDATORY PER SCENE
- LAYER 0.5 — IMAGE ASSET VALIDATION (pre-render gate)
- LAYER 1 — VISUAL QUALITY
- LAYER 1.5 — ANIMATION VALIDATION
- LAYER 2 — AUDIO QUALITY
- LAYER 3 — YOUTUBE TECHNICAL STANDARDS
- Where this fits in the pipeline

---

## The verification model — cheap per-scene PROOF (pre-render) + the MASTER battery (post-render)

**NATIVE flow: there is NO per-scene mp4 render→verify→fix loop.** The one expensive step is the LIVE
MASTER render (all scene components composed via `<Series>`, ONE render). So the checks below run in TWO
places: **(1)** CHEAP, per scene, BEFORE the render — the 5-keyframe VISUAL-PROOF filmstrip (step 6b), the
only per-scene catch; and **(2)** in FULL, on the rendered MASTER's per-scene frames, AFTER the one render
— the battery that feeds MASTER-PASS. **PROVE every scene cheap before the master; never render a scene
to its own mp4 to verify it** (`render_scenes.mjs` is an OPTIONAL debug watch, never a gate).

### ⬇ COPY THIS CHECKLIST into your response and tick each box as you go

This is the official "workflow checklist" pattern (Agent Skills best-practices): copy it — per scene for
the pre-render VISUAL-PROOF, and once on the assembled MASTER for the final battery — so no verify step is
silently skipped. **Do NOT write MASTER-PASS until every box is ticked.**

```
VERIFY scene N on the MASTER (the cheap pre-render pass is the 6b VISUAL-PROOF) — copy & check off
- [ ] SAMPLE scene N from the rendered MASTER (its frame range) — NOT a per-scene mp4 render
- [ ] vg-verification-protocol  — V1–V13, A1–A8 freeze/PSNR, audio-sync drift, V9c caption zone
- [ ] vg-visual-quality         — 8 gates → /100; MOTION factors 1–4 read from the 5-frame FILMSTRIP; every factor ≥7
- [ ] vg-quality-audio          — voice · −14 LUFS/TP<−1 · music+duck · sfx · silence · non-silent (GAPs recorded)
- [ ] video-narrative-editor    — HOLISTIC editorial pass (AFTER mechanics clean): watch the WHOLE scene
                                   muted end-to-end; clarity·attention·hierarchy·camera·SIMPLIFICATION·mute·
                                   retention·storytelling; make the CUT + route fixes; SHIP or RE-CUT
- [ ] vg-output-validation      — coverage ≥90%, visibility 100%, 0 placeholder/error
- [ ] layout_validator          — python -m storyboard.layout_validator <project> → text_overlap: 0
- [ ] Playwright-MCP geometry    — PREFERRED for V7/V9/V9c/V10/V4: real DOM bounds at the settled frame,
                                   not eyeballed pixels. Per-scene composition only (never master).
                                   How-to owned by vg-layout-quality-gate §7b; runbook remotion/PLAYWRIGHT_MCP_QA.md
                                   ⚠ GEOMETRY-CLEAN IS NOT A PASS — see the banner below. It only proves
                                   nothing overlaps/clips; it says NOTHING about meaning/motion/story.
- [ ] STORY-VERB enacted          — step j: the narration's transformation verb (tear/collapse/flatten/
                                   shred/merge/grow) is PHYSICALLY enacted on the elements, NOT faked with a
                                   CSS filter (grayscale/blur), a global opacity fade, or a text label.
- [ ] BRIEF-FIDELITY              — step k: the render DELIVERS the scene's own SCENE DESIGN promises —
                                   CINEMATIC camera move · ENVIRONMENT depth · PRIMARY FOCUS prominence/
                                   single eye-destination · ATTENTION FLOW · through-line protagonist present+acting.
- [ ] Collected EVERY bug into ONE list → fixed ALL → re-rendered → re-ran this whole list (loop until clean)
- [ ] Wrote the scene's section to projects/<name>/verification.md WITH real frame evidence
- [ ] EFFORT recorded: <N> passes; redo factor(s) = <e.g. 2x text-fit, 1x animations>
- [ ] Per-scene VISUAL-PROOF marker (pre-render) recorded, and the MASTER-PASS line appended WITH EVIDENCE:
        VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%
        MASTER-PASS: <name> | visual=<NN>/100 audio=<N>/10 transform=<min-Δ>%
```

⛔ **The gate is HARD on evidence.** `render_gate.sh` blocks the MASTER render (`render_master.mjs`) until
EVERY scene has its `VISUAL-PROOF:` marker, and blocks `build_video.py` until the script is `SCRIPT-APPROVED`.
The evidenced `MASTER-PASS` fields (`visual=`/`audio=`/`transform=`) are the proof you actually ran the
quality + audio + transformation gates on the rendered master; without running them you can't fill them in.

> ⛔ **GEOMETRY-CLEAN IS NOT VERIFIED — the false-confidence trap.** Playwright-MCP `violations: []` and
> `layout_validator → text_overlap: 0` are the *deterministic geometry layer ONLY*: they prove nothing
> overlaps, clips, or sits in the caption zone. They say **NOTHING** about whether the picture tells the
> story. A scene can be 100% geometry-clean and still: show the narration's destruction as a greyscale
> filter, leave the brief's push-in/depth unbuilt, have no single eye-destination, and fail the mute test
> — and a human spots all of it in ten seconds. **The easy deterministic check must NEVER stand in for
> the judgment gates** (`vg-visual-quality` 8-factor filmstrip · `render-validator` mute/
> consequence · the viewer-sense step i · STORY-VERB step j · BRIEF-FIDELITY step k). Geometry is
> necessary, not sufficient — run ALL of them, every scene. (Real miss: I scored
> `violations: []` and treated the scene as verified; the meaning/motion/brief gates were never run, and
> a human immediately found the visuals don't enact the story.)

```
FOR each scene N, applied to the RENDERED MASTER (ONE render for all scenes) — the SAME checks the cheap 6b VISUAL-PROOF ran pre-render:
  0. IMAGE ASSETS (pre-render gate — Layer 0.5):
       - every [asset:] in the scene resolves to a real, decodable file
       - each auto-fetched image inspected with the Read tool (relevance)
       - license recorded in a sidecar / CREDITS.md
       - skip if the scene has no [asset:] refs
  1. SAMPLE scene N's span from the master mp4 (its frame range) — no per-scene mp4 render
  2. VERIFY scene N (run ALL of the checks below — no skipping):
       a. Visual: V1-V13 frame inspection
       a'. V14 — every [asset:] bullet shows the image (not broken-box)
       b. Animation: A1-A8 filmstrip + freeze + PSNR — image bullets MUST pass
          A4 (Ken Burns means no freeze) and A5 (visible motion)
       c. AUDIO SYNC: anchor-drift check (MUST run — see block below)
       d. Audio coherence: mid-bullet topical match
       e. Caption zone: V9c top<h*0.88 + bottom>h*0.10
       f. PRODUCTION-QUALITY SCORECARD: invoke `vg-visual-quality` — it runs the
          8 factor gates (`vg-quality-animations` / `-timing` / `-sequencing` /
          `-transitions` / `-text-fit` / `-images` / `-tokens` / `-vchecks`) on the
          extracted frames. Scene must score ≥70% (target 80+); any factor ≤4/10,
          any V-check fail, or a systemic weakness = NOT READY. V-checks (a) answer
          "is it broken?"; this answers "is it production-grade?" — both required.
       g. RHYTHM (dead-air check): for each beat, does the visual keep changing while
          its narration keeps adding meaning? A beat whose visual sits UNCHANGED while
          the narrator delivers several distinct ideas = dead air → FAIL: subdivide that
          span into evolving sub-beats (scene-composer §Rhythm). Judge by
          meaning vs visual change, not a fixed duration. (Real failure: a hook visual
          held static through three spoken ideas — 8s of one label.)
       h. CROSS-BEAT CONSISTENCY (continuity — the evolve test): a scene is ONE evolving
          visual, not 4 slides. Every PERSISTENT element — the anchor visual (grid/chart/
          diagram), the command/title card, the corner status indicator, the labels — must
          hold the SAME position and size across all beats; only its CONTENT may change.
          Compare the same element across the beat frames: if the status indicator (e.g.
          "100%" → "−33%" → "?") JUMPS position or size between beats, or the anchor shifts/
          resizes, it reads as a slideshow → FAIL. Fix: anchor each persistent element to ONE
          fixed position across all beats; evolve only the content/color. (Real failure,
          a prior build: the top-right status used three different
          mechanisms — Kit.Tag, then the Pool metric, then a custom div — in three different
          spots, so it jumped around between beats. Also color identity must hold: an entity
          keeps its token every beat.)
       i. VIEWER-SENSE TEST (does the animation MAKE SENSE? — the hardest, most-skipped gate):
          for each verified frame, do NOT ask "is it clean / does it render?" Ask: **"a viewer
          who hits this frame cold, audio off — what do they THINK they're looking at, and does
          it explain the concept?"** Answer out loud, in the viewer's words, per frame:
          - Can they name WHAT each element IS? Abstract coloured bars/blocks/shapes labelled with
            one tiny word ("you", "claude", "ctx") FAIL — a viewer sees "blue and purple bars," not
            "a conversation being re-read." The visual must LOOK like the real thing (a chat with
            message text, a file with a name + lines, a terminal with output) — not a bare rectangle.
          - Can they see the POINT / the cause→effect? If a number on the right ("+9,000") is not
            visibly PRODUCED by something on screen (a sweep over the pile, a flow into the meter),
            the viewer can't connect them → FAIL.
          - Is the motion CLEAN and legible — one clear thing happening, readable, not jittery or
            ambiguous? "Renders without error" is NOT "makes sense."
          If you cannot state, in a viewer's own words, what the frame means and what point it makes,
          the beat FAILS the viewer-sense test → redesign so the picture reads as the real thing.
          (Real failure: "you"/"claude" coloured bars — rendered fine, but a
          viewer can't tell it's a conversation; abstract, made no sense.)

       j. STORY-VERB ENACTMENT TEST (is the transformation SHOWN, or FAKED? — the sharpest meaning gate):
          the viewer-sense test (i) asks "can I NAME the elements?"; this asks the harder question —
          **"does the picture physically ENACT the narration's verb, or fake it with a shortcut?"** When
          the narration's verb is a TRANSFORMATION (tear · collapse · flatten · shred · merge · split ·
          grow · drain · lose), the elements themselves must visibly DO it across the filmstrip:
          - ✅ ENACTED: the table's columns literally come apart and the cells reflow into a run-on text
            line; the answer-cell is visibly ripped out and lost; the meter physically drains.
          - ❌ FAKED (all CAP the beat — see vg-quality-animations cap #4): the state-change is conveyed by
            a **CSS filter** (`grayscale()`/`blur()` over a still card), a **global opacity fade**, generic
            **gray placeholder bars flying off** in place of the real content transforming, or a **text
            LABEL that NAMES the change** ("step one: page → text") while the thing on screen barely moves.
          The test: cover the labels and the audio — can you SEE the destruction/transformation happen to
          the actual content? If the only evidence the transformation occurred is a filter, a fade, or a
          word, it is FAKED → the beat is NOT READY; re-author so the real artifact physically transforms
          (vg-code-artifacts "draw the real mechanism" + the consequence-visualization lever in
          render-validator). (Real miss: "throws the page away and
          keeps only the words" was rendered as the table fading to grayscale + 7 gray strips sliding off —
          geometry-clean, named-able, but the parser's destruction of structure is never SHOWN.)

       k. BRIEF-FIDELITY TEST (did the render DELIVER the director's brief? — the missing gate):
          the scene's `<!-- SCENE DESIGN -->` block authored concrete promises; the render must KEEP them.
          Open the brief, read these fields, and confirm each is actually IN the pixels (filmstrip for
          motion, settled frame for layout). A promise the brief makes but the code never builds = FAIL:
          - **CINEMATIC** (e.g. "push-in on the amber cell", "pull-back", "tilt", "orbit") → is the named
            camera move present across the strip? A specified push-in with a fixed-scale page = FAIL.
          - **ENVIRONMENT / RENDER STYLE depth** (e.g. "fg/mg/bg parallax", "page mg, lens fg") → are there
            real depth layers moving at different rates, or is everything on one flat centred plane?
          - **PRIMARY FOCUS** (the ranked list) → does the #1 element actually DOMINATE (prominence +
            a single eye-destination), and does the named villain/hero carry the weight the rank implies?
            Every element at equal visual weight = FAIL (no hierarchy → viewer doesn't know where to look).
          - **THROUGH-LINE / protagonist** → is the recurring element present AND acting (not just sitting
            lit)? A callback object that never reacts to the scene's event = FAIL.
          If the render contradicts or silently drops a brief field, the beat is NOT READY → re-author to
          honor it (camera/depth owner: vg-remotion-engineering; prominence: vg-visual-map; through-line:
          visual-story-engine). The brief is a CONTRACT, not a suggestion — verify it like one. (Real
          miss: the brief specified push-in + fg/mg/bg depth; the code shipped a
          flat, fixed-scale, dead-centre page — and NO gate compared the brief to the render.)

  ⚠ FRAME SAMPLING: extract verify frames at each bullet's MIDPOINT
    (`framesFrom + (framesTo−framesFrom)/2`), NOT at fixed wall-clock intervals.
    Fixed intervals land on bullet STARTS where entrance springs read ~0, so elements
    look "missing" — a false alarm. Always sample mid-beat.
  ⚠ FULL RESOLUTION ONLY: read each verify frame at FULL 1920×1080 (`-q:v 2`), ONE frame
    per Read. NEVER judge overlap/alignment from a downscaled filmstrip/contact-sheet
    (tile=NxM, scale=480) — small tiles HIDE element overlaps and misalignment (real miss,
    a prior build: a status tag overlapping the command card was invisible
    in 480px tiles, caught only at full res). Use a filmstrip ONLY to confirm motion-over-time;
    use full-res single frames to judge layout, overlap, and consistency.
  3. IF FAIL (route the symptom to its ONE owner — CLAUDE.md BUG ROUTER):
       - for AUDIO SYNC failure: update framesFrom = round(word_start*fps) in scene JSON + remotion/public mirror
       - for QUALITY-SCORECARD failure: improve the weakest factor per its
         `vg-quality-*` skill (motion/easing/stagger are the usual culprits), re-author
       - for VISUAL failure: fix React.createElement code OR bullet body
       - delete bullet cache: rm storyboard/.cache/designs/bullet-s0N-bXX-*.json → re-seed via seed_bullet_cache.py
       - THEN re-prove that scene cheap (6b VISUAL-PROOF) and re-render the MASTER (one master fix re-renders
         the whole video — the cheap 6b proof is what keeps these re-renders rare)
  4. IF PASS:
       - WRITE the scene's section to projects/<name>/verification.md (mandatory record — see below)
       - the master already contains every scene; there is no per-scene render ordering to gate
```

A scene is NOT recorded as verified until its `verification.md` section is written with real frame evidence
(from the master's frames). "Looks right from the code" is the absence of a check, not a check.

There is ONE master render (`render_master.mjs`) — no per-scene mp4 stitch. The full battery runs ONCE on
that assembled master; the cheap 6b VISUAL-PROOF per scene is what catches problems before that render.

---

## The `verification.md` artifact — MANDATORY written record

Every project keeps ONE verification log at **`projects/<name>/verification.md`**.
It is the durable proof that each scene was inspected — not assumed. Each scene gets its `VISUAL-PROOF`
marker (pre-render) + a section written from the master's frames; the `MASTER-PASS` line + the final
upload report are appended once after the master render.

**Rules:**
- ONE file per project: `projects/<name>/verification.md`. Append per scene; never
  silently overwrite the whole file. On a re-render after a fix, **replace that one
  scene's section** with the latest result.
- A scene is NOT marked PASS until its section is written here with frame evidence —
  real ffmpeg-extracted frame paths (from `c:/tmp/verify`, `c:/tmp/filmstrip`) that
  were actually opened with the Read tool, and real drift numbers printed by the
  audio-sync script.
- Every verdict cell must trace to evidence. A `✅` with no frame path or no printed
  number behind it is a hallucinated pass — the exact failure mode this file exists
  to prevent.
- Write with `build_video.atomic_write_text` semantics if scripting it; a hand-written
  file via the Write/Edit tool is fine.

### Template — one block per scene (copy, fill, append)

```markdown
# <name> — Verification Log

Project: <name>   fps: 30   resolution: 1920×1080
Native flow: cheap per-scene VISUAL-PROOF (pre-render) + the MASTER battery (post-render). Each scene
below was inspected from the master's extracted frames, not code.

---

## Scene s01 — <scene-id>
Rendered: <YYYY-MM-DD HH:MM>   mp4: remotion/out/<scene-id>.mp4
Bullets: <N>   Frames read: <N×2 mid+sync> + <N×5 filmstrip>

### Audio sync  (drift = framesFrom/fps − word_start; PERFECT ±0.05s, PASS −0.5..+1.5s)
| Bullet | anchor | fire | word@start | drift | verdict |
|---|---|---|---|---|---|
| B1 | "..." | 0.00s | "..."@0.00s | +0.00s | PERFECT |

### Layer 1 — Visual V1–V13  (✅ pass / ❌ fail / — n/a)
| Bullet | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 | V9 | V10 | V11 | V13 | frame evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B1 |   |   |   |   |   |   |   |   |   |    |    |    | c:/tmp/verify/<scene-id>_b1_mid.jpg |

### Layer 1.5 — Animation A1–A8
| Bullet | p10≠p30 | p70≈p90 | p50 visible | freeze<3s | PSNR | REPLACE | verdict |
|---|---|---|---|---|---|---|---|
| B1 |   |   |   |   |   | — |   |

### Layer 2 — Audio (scene-level)
WPM: ___   coverage: ___%   pause literals: none/___   silence >2s: none/___
Audio quality (vg-quality-audio): voice ___/10 · loudness −14LUFS/TP<−1 pass/fail · music+sfx GAP/___

### Observations  (one line per bullet — what is ACTUALLY on screen)
- B1: ___

### Skills invoked  (the INVOCATION track — which skills were actually run for THIS scene; · -separated)
- author: vg-visual-map · vg-render-code · vg-code-animations · vg-code-artifacts · remotion
- verify: vg-verification-protocol · vg-visual-quality · vg-quality-audio · vg-output-validation

### Bug ledger  (ONE row per bug fixed this scene — the machine-readable history; `effort=` derives from it)
| attempt | bug (symptom) | type | sev | owner skill (from BUG ROUTER) | fix applied | min | resolved |
|---|---|---|---|---|---|---|---|
| 1 | text overlap (V9) | layout | med | vg-layout-quality-gate | moved footer to top:h*0.82 | 2 | yes |
| 2 | flat motion (factor 1) | animation | high | vg-code-animations | added overshoot + stagger | 5 | yes |
| 3 | audio drift +0.8s | audio | low | vg-narration-alignment | fixed framesFrom in JSON+mirror | 3 | yes |

**SCENE VERDICT:** [ ] PASS   [ ] FAIL
VISUAL-PROOF: <scene-id> | composition=PASS narrative=PASS transform=<Δ>%   (pre-render, per scene)
```

> Two machine-readable markers the `render_gate.sh` hook greps for:
> - **`VISUAL-PROOF: <scene-id> | composition=PASS narrative=PASS transform=<Δ>%`** — one per scene,
>   PRE-render. The hook HARD-BLOCKS (exit 2) the MASTER render (`render_master.mjs`) until EVERY scene
>   has one. This is the cheap per-scene catch (step 6b).
> - **`MASTER-PASS: <name> | visual=<NN>/100 audio=<N>/10 transform=<min-Δ>%`** — one per VIDEO, POST-render.
>   The evidenced fields are the proof you ran `vg-visual-quality` (visual), `vg-quality-audio` (audio), and
>   the transformation/SUBJECT-MOVED gate (`transform`) on the rendered master. A bare line with no fields
>   is a hallucinated pass. On a re-render after a fix, re-prove (6b) + re-run the battery; keep MASTER-PASS
>   only if it still passes. (Per-scene rework is still logged in the Bug Ledger `effort=` field below.)

### The BUG LEDGER — structured per-bug history (the analytics seed)

The `effort=<N>x-<factor>` field is only a *summary* (pass count + the one dominant factor). The **Bug
ledger table** above is the structured detail — one row per bug actually fixed, so the pipeline accrues a
real, queryable production history instead of just a number. Discipline:

- **One row per bug fixed**, each time you re-render after a fix (the row IS the attempt). Fill every column.
- **`type`** is a fixed vocabulary (so it aggregates): `layout · animation · timing · sequencing ·
  transitions · text · tokens · images · audio · assets · rendering`.
- **Each `type` maps to a QUALITY-TRIANGLE pillar** (the top-level triage — every visual bug is one of
  three engineering domains): **COMPOSITION** ("can the scene physically exist without conflict?" —
  layout · transitions · rendering) · **DENSITY** ("can the viewer comfortably process it?" — text ·
  images · sequencing, plus load/crowding symptoms of animation) · **CONSISTENCY** ("does it feel like
  ONE film, script-world to pixels?" — tokens · assets, plus style/identity drift in any type).
  `timing`/`audio` are mechanics (sync), outside the triangle. Classify the pillar first, then route:
  a bug that resists its owner's fix is usually filed under the wrong pillar.
- **`owner skill`** = the BUG ROUTER's owner for that symptom (CLAUDE.md "BUG ROUTER" — text-overlap →
  `vg-layout-quality-gate`, flat-motion → `vg-code-animations`, sync-drift → `vg-narration-alignment`…).
  The ledger and the router share one mapping, so the data is consistent.
- **`sev`** = `low/med/high` · **`min`** = wall-clock minutes the fix took · **`resolved`** = yes/no.
- **`effort=` DERIVES from this table:** `N` = the scene's highest `attempt`; `<factor>` = the most
  frequent (tie → highest-sev) `type`/owner. So the two never disagree — the ledger is the source.

**The INVOCATION track (`### Skills invoked` block):** also record, per scene, the **author + verify skills
actually run** (·-separated). This is the compliance + *effectiveness* signal — `bug_stats` cross-references
it with the bug owners to compute **"invoked but STILL bugged"**: a skill that was invoked every scene yet
keeps owning bugs (`vg-code-animations` 2 bugs / 2 invocations = 1.0/use) means the *skill's guidance isn't
landing* → fix the **skill**, not just the scene. (A bug owned by a skill that was NOT in the invoked list =
a skip — the author skill should have been run and wasn't.)

**⛔ COVERAGE — was any MANDATORY skill MISSED? (run it, don't eyeball).** Record the `### Skills invoked`
block per scene AS YOU GO, then at MASTER-PASS run `python -m storyboard.skill_coverage <project>`: it
compares the invoked track against the pipeline's non-skippable floor — the per-scene author set
(`vg-visual-map`·`vg-render-code`·`vg-code-vchecks`·`vg-code-tokens`) + the final gate battery
(`vg-verification-protocol`·`vg-visual-quality`·`vg-quality-audio`·`vg-output-validation`·
`video-narrative-editor`·`vg-scene-validator`·`vg-youtube-validation`) — and prints exactly which skills
were MISSED, per scene and project-wide. A silently-skipped skill is the #1 way output goes flat; this is
the mechanical catch, and its `SKILL-COVERAGE:` line goes in the record alongside MASTER-PASS. (An empty
invocation track = coverage cannot be verified = the discipline wasn't followed → fill it.)

**Cross-video analytics:** `python -m storyboard.bug_stats` reads the bug ledger + invocation track from
every project (via the `effort/` store) and reports: totals by `type`, by `owner skill` + fix-minutes,
**skill invocation frequency**, and the **effectiveness** (invoked-but-bugged) ranking — *"40% of all bugs
are layout; `vg-code-animations` is invoked every scene but still owns the most bugs."* That tells you
exactly which skill/definition to fix upstream — the payoff a bare pass count can't give.

### Final section — appended once after stitch

After the master render passes the battery, append the **MASTER-PASS** line + the **Final Upload Report**
block (the `YOUTUBE VALIDATION` template in Layer 3 §"Final Upload Report") to the bottom of the same
`verification.md`. That makes the one file the complete record: every scene's VISUAL-PROOF, the MASTER-PASS,
plus the Layer 3 upload gate.

---

## 🔊 AUDIO SYNC CHECK — MANDATORY PER SCENE

**Run AFTER every render. NEVER advance to next scene with a sync WARN or FAIL.**

This check verifies that each bullet's `framesFrom` matches the actual Whisper
word timestamp for its `audio_anchor`. Production bugs in `ai_thinking_levels`
proved this slips through visual inspection — must be run programmatically
on every scene.

### Step 1 — Read the data

```python
import json
from pathlib import Path

scene_id = "ai-thinking-levels-s01"   # change per scene
fps      = 30

scene_path = Path(f"projects/<name>/scenes/{scene_id}.json")
caps_path  = Path(f"projects/<name>/captions/{scene_id}.json")

scene = json.loads(scene_path.read_text(encoding="utf-8"))
words = json.loads(caps_path.read_text(encoding="utf-8"))
```

### Step 2 — For each bullet, compute drift

```python
def find_word(anchor, words):
    """Find anchor in Whisper words. Try several substitution forms because
    Whisper transcribes numbers/words inconsistently."""
    anchor_low = anchor.lower().strip()
    # Whisper-form substitutions (extend per project):
    subs = [
        anchor_low,
        anchor_low.replace("twelve", "12"),
        anchor_low.replace("fifty",  "50"),
        anchor_low.replace("twenty-three", "23"),
        anchor_low.replace("multi-step", "multi -step"),   # Whisper splits hyphens
        anchor_low.replace("scratchpad", "scratch pad"),
        anchor_low.replace("forty-nine point six", "49 .6"),
        anchor_low.replace("forty-eight point one", "48 .1"),
    ]
    first_word = anchor_low.split()[0]
    closest = None
    for w in words:
        wlow = w["word"].lower().strip(".,!?\":;-")
        if first_word in wlow or wlow in first_word:
            return w
    return None

for i, b in enumerate(scene):
    fire_s    = b["framesFrom"] / fps
    anchor    = b["audio_anchor"]
    word      = find_word(anchor, words)
    if not word:
        print(f"B{i+1}: anchor {anchor!r} NOT FOUND — try more substitutions OR check anchor exists in narration")
        continue
    drift = fire_s - word["start"]
    verdict = (
        "PERFECT" if abs(drift) < 0.05 else
        "PASS"    if -0.50 <= drift <= +1.50 else
        "WARN"    if +1.50 <  drift <= +2.00 else
        "FAIL"
    )
    print(f"B{i+1}: fire={fire_s:.2f}s  word={word['word']!r}@{word['start']:.2f}s  "
          f"drift={drift:+.2f}s  [{verdict}]")
```

### Step 3 — Verdict thresholds (DO NOT SKIP WARN)

| Drift | Verdict | Action |
|---|---|---|
| ±0.05s | ✅ PERFECT | Continue |
| −0.50s to +1.50s | ✅ PASS | Continue |
| +1.50s to +2.00s | ⚠ **WARN** | **MUST FIX** — set `framesFrom = round(word_start*fps)`, re-render, do NOT advance |
| > +2.00s | ❌ FAIL | Same fix as WARN |
| < −1.00s | ⚠ WARN | Either move framesFrom earlier OR confirm it's the first-bullet PASS-FIRST exemption (scene opens before any spoken word) |

### Step 4 — On WARN/FAIL: fix in BOTH locations

The scene JSON exists in TWO places and BOTH must be updated:

```python
import json, shutil
fix_scene = "projects/<name>/scenes/ai-thinking-levels-s0N.json"
with open(fix_scene, encoding="utf-8") as f:
    scene = json.load(f)
scene[bullet_idx]["framesFrom"] = round(word_start * 30)
# Also update previous bullet's framesTo to match if needed
with open(fix_scene, "w", encoding="utf-8") as f:
    json.dump(scene, f, indent=2, ensure_ascii=False)
# CRITICAL: mirror to remotion/public/scenes/ — Remotion reads from this path
shutil.copy(fix_scene, "remotion/public/scenes/ai-thinking-levels-s0N.json")
```

Then delete `remotion/out/<name>-s0N.mp4` and re-render the scene.

### Step 5 — The constraint case

If moving `B[N].framesFrom` earlier would collapse `B[N-1]` below
`MIN_BLOCK_SECONDS` (default 1.0s), do ONE of:
- Accept +1.5–2.0s WARN on B[N], document why (B[N-1] needs minimum visible time)
- Add an earlier anchor in the script that fires B[N-1] sooner
- Combine B[N-1] and B[N] into one bullet

### Why this is mandatory (lessons from production)

- **+1.83s WARN on multi-step proofs** in pre-S2 build slipped through because
  the verifier's anchor-matcher was loose with hyphenation. The Whisper-form
  substitutions in Step 2 above are the structural fix.
- **+0.65s drift on B4** in S6 ai_thinking_levels production: badges fired
  during "Low effort," instead of on "$23" word. Caught only after Layer 2
  systematic check, NOT after visual inspection.
- A scene that LOOKS right but has +1.7s audio drift makes the viewer
  hear "while AI says X" and see "the visual for Y" — viewer mentally
  disconnects narration from visuals. Worse than a render bug because
  it's invisible to the developer doing visual-only review.

---

---

## The 6 verification layers — run each; HOW-TO detail in references

The checklist above lists WHAT to check; these references hold HOW to run each layer (extract frames,
compute, thresholds). Invoke this skill, then open the layer reference you're running:

| Layer | Checks | Detail file |
|---|---|---|
| 0.5 Image assets | presence (HARD) · relevance · license (HARD) · V14 rendered | `references/layers-visual.md` |
| 1 Visual V1–V13 | muted test · canvas fill · typography · sync · V7–V8 frame inspection · V9 overlap · V10 fit · V11 timeline | `references/layers-visual.md` |
| 1.5 Animation A1–A8 | filmstrip · per-frame · signatures · A4 freeze · A5 PSNR · A6 REPLACE · A7 spring · A8 summary | `references/layers-animation-audio-youtube.md` |
| 2 Audio | listen test · −14 LUFS / TP<−1 · coverage · 2.5 mid-bullet coherence · 4 quality levers | `references/layers-animation-audio-youtube.md` |
| 3 YouTube technical | T1–T12 · side artifacts · final upload report | `references/layers-animation-audio-youtube.md` |

Audio-sync (Layer 2 drift) detail is kept inline above — the most-run check. `vg-visual-quality` scores the
8 production gates separately.

---

## Where this fits in the pipeline

`build_video.py`: Step 3 author (run 1.1 muted-viewer BEFORE) · Step 9 render · Step 9.5 visual_qa
brightness (auto) · Step 10 stitch+mux · Step 10.5 validate_output (auto). **After each scene render:**
Layer 1 (V1–V13 frames) → Layer 1.5 (A1–A8 filmstrip+freeze+PSNR) → Layer 2 (audio listen+coverage) →
steps i/j/k (viewer-sense · story-verb · brief-fidelity). **After final stitch:** Layer 3 (T1–T12 + artifacts).
