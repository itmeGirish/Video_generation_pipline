# CLAUDE.md — Project Memory (auto-loaded into every session)

This file is loaded into every Claude Code session at this project root. Rules
here are NOT optional — they apply on every turn without being read.

---

## Project: video_generation / video_explainer

Production pipeline for YouTube explainer videos. Script → Remotion render →
ffmpeg stitch → final mp4. Per-bullet React code authored in-session, seeded
into cache. Pipeline does cache lookup only (never spawns claude CLI).

Key paths:
- Scripts: `projects/scripts/<name>.txt` (raw) → `projects/structured_scripts/<name>.txt` (canonical)
- Config: `projects/<name>/config.yaml`
- Bullet cache: `storyboard/.cache/designs/bullet-s{NN}-b{NN}-{hash16}.json`
- Scene JSONs: `projects/<name>/scenes/*.json` (mirror to `remotion/public/scenes/*.json`)
- Captions: `projects/<name>/captions/*.json` (Whisper word_timestamps)
- Rendered scenes: `remotion/out/<name>-s{NN}.mp4`
- Final video: `projects/<name>/out/<name>.mp4`

---

## HOW THIS PROJECT WORKS — INVOKE THE SKILL, NEVER WORK FROM MEMORY

Every step is a **skill** under `.claude/skills/`. **Before doing a step, INVOKE its skill
with the Skill tool** — do not work from memory or this digest. **"Give it now" / "auto" /
"continue" / urgency does NOT waive this** (see [[feedback_preflight_rules]]). If you reach a
step without having invoked its skill this session, STOP and invoke it first.

> ⛔ **THE DIGEST IS A POINTER, NOT THE SOURCE.** Everything below in this file (the SHIFT-LEFT
> failure modes, the per-scene loop, every "rule", every check list) is an INDEX that tells you
> WHICH SKILL to invoke — it is **NEVER** a substitute for invoking that skill. Reading a rule
> here and applying it from memory is the #1 way quality lapses. Rules: **(1)** Do a step ⇒ invoke
> its skill via the Skill tool FIRST — the skill body is the source of truth, this file is not.
> **(2)** If a skill you invoke says "invoke X" (e.g. `vg-verification-protocol` → "invoke
> `vg-visual-quality`"), that is a **Skill tool call to make**, not a checklist line to tick —
> running its checks by hand is NON-COMPLIANCE. **(3)** If you catch yourself executing a
> procedure (V-checks, freeze/PSNR, audio-sync, the quality scorecard, an author-time recipe)
> straight from this file or from an already-loaded skill's prose, STOP — you skipped a skill
> invocation; go invoke the owning skill. **(4)** "I already read it / it's in context" is not
> "I invoked it." The hooks only REMIND; this rule is what binds.

Two phases, in order. **Writing a script comes first; rendering the video comes after.**

### PHASE 1 — WRITE THE SCRIPT → invoke `script_generation` first

`script_generation` is the orchestrator. After invoking it, invoke each step's skill in order
— none skippable:

```
1   script-youtube-strategy        (title/thesis/thumbnail/loops)
2   script-research                (real sourced facts — INVOKE it, not inline websearch)
3   script-scene-structure         (scene list · arc · loops · patterns · rhythm — STRUCTURE only)
4   script-storytelling            (story spine — the most-skipped step)
5   script-scene-design            (the director's brief: GLOBAL STYLE · SCENE DESCRIPTION prose · blueprint · reference · cinematic · layout · shot — stops generic AI animation)
6   script-scene-design-validator  (gate: is every scene's brief complete? a missing field = the LLM invents)
7   script-narration               (narration to sync rules)
8   script-animation-bullets       ("what happens" director beats)
9   cut pass (≥10% removed)
    --- GATES (all must PASS before saving) ---
10  script-animation-validator     (per-bullet: sense/fit/motion/buildable)
11  script-narration-visual-sync   (/100 scorecard; <70 = NOT READY)
12  script-validator + script-format-validation
13  script-retention-engineering
14  script-human-review            (9 questions)
15  script-content-quality         (12 tests)
16  script-critique-improve        (fact-check gate + patch/rebuild)
17  save → projects/structured_scripts/<name>.txt + present for approval
```

### PHASE 2 — RENDER THE VIDEO → invoke `video_generation` (then `vg-when-script-received` first)

`video_generation` is the orchestrator. The moment a script arrives, invoke
`vg-when-script-received` FIRST. Then walk the steps below, invoking EVERY listed skill at
its step — these skills are the quality. Skipping them is how output goes flat.

```
1  CONVERT raw → canonical .txt
     vg-when-script-received (START HERE) · vg-source-script-format
     vg-rich-script-conversion (+ vg-script-conversion)
     vg-script-gen-integration  (only if the script came from the script_generation skill)
2  BUILD config.yaml from the structured comment blocks
     vg-build-and-run · vg-pipeline-architecture (overview, first time)
3  DECIDE the visual for each bullet (WHAT to draw)
     vg-visual-map · vg-visual-designer · vg-layout-quality-gate
     vg-graphics-assets  (any logo/screenshot/photo asset)
4  AUTHOR the per-bullet React code (HOW to draw it) — invoke BEFORE writing code:
     vg-render-code  (index of the 8 core recipes), then per factor:
       vg-code-animations · vg-code-timing · vg-code-sequencing · vg-code-transitions
       vg-code-text · vg-code-images · vg-code-tokens · vg-code-vchecks
     + the richness skills that lift it to channel quality:
       vg-code-artifacts   (draw the REAL mechanism, not a generic bar)
       vg-code-composition (dashboard / persistent title / reference-card layout)
       vg-code-motion-bank (scaffold→fill→payoff signature builds)
       vg-code-trimming    (reuse an animation mid-progress / embed a clip)
     + the `remotion` skill (source of truth for every primitive)
5  NARRATION + sync
     vg-ssml-narration  (dramatic TTS) · vg-narration-alignment (audio_anchor → frame)
     vg-narration-clarity  (pull these levers if a scene feels flat/generic)
6  SEED cache  →  storyboard/seed_bullet_cache.py
7  PER-SCENE RENDER → VERIFY → FIX LOOP (one scene at a time, mandatory):
     vg-verification-protocol   ("is it broken?" — 5-layer gate, V1–V13, audio sync)
     vg-visual-quality          ("is it production-grade?" — aggregates the 8 gates → /100):
       vg-quality-animations · vg-quality-timing · vg-quality-sequencing
       vg-quality-transitions · vg-quality-text-fit · vg-quality-images
       vg-quality-tokens · vg-quality-vchecks
     vg-output-validation       (every narration word + bullet actually in the render)
     → FAIL: vg-rerun-after-correction (error → file → cache → re-run)
8  STITCH (only after ALL scenes PASS)
     vg-scene-transitions
9  FINAL gate
     vg-verification-protocol Layer 3 + vg-youtube-validation · vg-video-duration
```

Each author-time recipe (`vg-code-*`) pairs 1:1 with its post-render gate (`vg-quality-*`);
`vg-visual-quality` rolls the eight gates into one /100 score — use BOTH (write right up
front, then score after render).

**Troubleshooting skills (invoke when the situation hits):**
`vg-known-bugs` (before editing any `storyboard/*.py`) · `vg-pipeline-internals` (build/render
failure) · `vg-rerun-after-correction` (a validator flagged an error) · `vg-script-writing-prompt`
(hand-writing a new source script).

---

## SHIFT-LEFT — a POINTER INDEX of failure modes (NOT a substitute for the skills)

> ⛔ This section is an **index of which skills own each failure mode** — it is NOT the rulebook
> to apply from memory. Before authoring ANY bullet code you must INVOKE the author-time skills:
> `vg-visual-map` → `vg-visual-designer` → `vg-render-code` + the per-factor `vg-code-*` recipes
> (`vg-code-animations · -timing · -sequencing · -transitions · -text · -images · -tokens ·
> -vchecks`) + the richness skills (`vg-code-artifacts · -composition · -motion-bank`) + the
> `remotion` skill. Each numbered item below names the failure a skill prevents — read it to know
> WHICH skill to invoke, then INVOKE it. Applying these from memory instead of invoking the skill
> is the lapse this whole section exists to stop.

Most verification failures are PREVENTABLE if the right author-time skill is invoked before
writing the code. The items below are the failure-prevention digest of `vg-verification-protocol`
+ the `vg-code-*` recipes — pointers to invoke, not rules to hand-apply.

### 1. Caption zone is RESERVED (bottom 12% of canvas)

Burned-in captions are disabled (long-form YouTube uses the separate `.srt`
sidecar). Still treat `top > h*0.88` and `bottom < h*0.10` as off-limits — keeps
layout future-proof if captions are ever re-enabled, and matches where most
players overlay user-toggled subtitles.

✅ Cap footer/punchline overlays at `top: h*0.82` max.

### 2. Audio anchor = VERBATIM word(s) from THIS scene's narration

The bullet's `audio_anchor` MUST match a 2-4 word phrase that Whisper will
hear in the narration. Otherwise framesFrom is randomly placed → audio sync
WARN/FAIL during verification.

Avoid abstract anchors (`"the reveal"`), decimals (`"seventy-seven point eight"` — Whisper
splits as `"77 .8"`), units (`"thirty-six percent"` — Whisper merges as `"36%."`), and anchors
spanning a `<pause>`. ✅ Good: `"the needle"`, `"twelve files"`, `"watch it"`, `"identical output"`.

### 3. ADDITIVE bullets MUST inline prior settled state

When a bullet is ADDITIVE (no `[REPLACE]` tag), the previous bullet's
ELEMENTS need to re-render at their settled final state. Slot-based
rendering uses `framesTo - framesFrom` per bullet — the canvas blanks
between bullets.

✅ Re-render the prior bullet's elements as static (no entry animation) plus the new element.
Every bullet is SELF-CONTAINED. There is no real cross-bullet
"ADD": a bullet that draws only a delta and depends on a prior bullet's
elements still being on screen renders as a floating fragment. Each bullet
must redraw ALL context it needs (prior boxes/bars/diagram at their settled
state) PLUS its own new element. Same trap for any "X appears beside the
previous bar" / "threads emerge from the prior bar" / "second row drops below
the first" bullet — redraw the prior element in the SAME bullet. When in
doubt, make it [REPLACE] and draw the full frame.

### 3b. Every visual needs a CONTEXT HEADER — bare shapes/numbers fail the deaf-viewer test

Stripping text to avoid a "text slide" can over-correct into a visual with NO
context, which is just as broken. A viewer must know WHAT they're looking at
without audio.

✅ Animation + minimal LABELS (`vg-visual-map` "show, don't tell": the picture makes
the point, text LABELS what it can't say). Every chart/diagram needs: a short
TITLE naming what it is ("EACH CLAUDE OPUS RELEASE — how big was the jump?"), the
entity labels, and the payoff tag ("4.8: barely a step · their word: 'modest'").
Text-only is banned; **context-free visuals are equally banned.** The bar that
matters keeps its name on screen.

### 3d. REAL legible content, NOT skeleton/placeholder bars (the muted-viewer test for documents/code/chat/UI)

A document, code panel, chat, table, or UI drawn as featureless **gray placeholder bars / empty
blocks / lorem-ipsum lines** is the same failure as a context-free visual: a muted viewer sees
"gray bars in a box" and **cannot tell it's a contract / code / a conversation / what's being
reviewed.** Skeleton bars are not content.

✅ The artifact must carry REAL legible content: a contract = a title (`MASTER SERVICES AGREEMENT`)
+ numbered clause HEADINGS (`4. LIABILITY`) + actual legal sentence fragments; code = real
syntax-colored lines; a chat = real message text. A "redline" must strike a REAL word/phrase and
insert a REAL replacement (`~~ninety (90) days~~ → thirty (30) days`), not recolor a blank bar. If
the picture only reads as the real thing once the narration is added, it FAILS the muted-viewer
test. Owner skills: `vg-visual-map` (Prohibited Patterns: "Skeleton/placeholder content") +
`vg-code-artifacts` (draw the real mechanism WITH its real content/labels) + `vg-code-text`.

### 3c. NO emoji glyphs in bullet code — they HANG the headless render

Headless Chromium has no emoji font → it stalls resolving the glyph, the frame never
signals "ready", and the render hangs to the per-scene ceiling (exit 124).

✅ Never put emoji in `code`. Draw icons as SVG primitives (a clock = circle +
two hand-lines; a magnifier = circle + diagonal line; a flag = pole + triangle; a
lock/shield = a small path/polygon) or use a short text label. BMP dingbats that DO
render reliably: ✓ ✗ ★ ▶ → ↑ ↓ ⚠ · — (these are fine; the astral-plane emoji are not).

### 4. REPLACE backdrop MUST be AbsoluteFill, not plain div

```js
// ✅ AbsoluteFill — a plain div with position:absolute;inset:0 leaks prior bullets through
const bd = React.createElement(AbsoluteFill, {style:{backgroundColor: D.bg}});
```

### 5. NO hex literals, NO dimension literals, NO fps literals

```js
// ✅ tokens + useVideoConfig (never {color:'#FF3B3B', width:1920, fontSize:32})
{color: D.red, width: w, fontSize: Math.round(w*0.018)}
```

### 6. Animation timeline must fit in `framesTo - framesFrom`

If your last animation phase starts at frame 64 of a 72-frame bullet,
only 8 frames are visible. V11 will FAIL.

✅ Use fractions of bullet duration:
```js
const phase1Op = interpolate(frame, [0, duration*0.30], [0, 1], {...});
const phase2Op = interpolate(frame, [duration*0.30, duration*0.60], [0, 1], {...});
const phase3Op = interpolate(frame, [duration*0.60, duration*0.90], [0, 1], {...});
```

### 7. Static frames > 3 seconds = A4 freeze FAIL (unless final-hold)

If a bullet shows the same frame for >3s mid-bullet, viewer thinks the
video froze. Add subtle motion: pulse glow, ticker counter, scanning beam,
breath-rate scale shift.

Final 2-3s of a scene's last bullet can be static (final-hold exception).

### 8. Primary visual must EXPLAIN — dense by AREA, causal, action-not-noun (V13 + scorecard)

The PRIMARY element can't be tiny in a sea of empty canvas — and "tiny" means **by AREA, not
width**. A `w*0.50`-wide × `h*0.045`-tall bar is 50% wide but ~2% of the canvas — a sliver, not
a primary.

✅ The beat must EXPLAIN, not display:
- **Dense by area:** the primary fills a real area (a grid of units, a tank with ticks, a
  segmented bar) ≥ `w*0.45 × h*0.40`; never a lone thin element on empty field.
- **Action over labels:** animate the VERB — the input visibly *consuming / draining / producing*
  the thing — not a static noun.
- **Cause→effect + invisible→visible:** the cause visibly feeds the effect on screen; show the
  invisible system as units/parts, not an abstract bar.
- **Mute test:** muted, the frame must say WHAT it is and what POINT it makes.

Full framework: `script_generation/references/explainer_animation_principles.md` (20 principles +
scorecard); render-gate teeth in `vg-quality-animations` §"CLEAN ≠ GOOD"; paper-gate in
`script-animation-validator` E4/E9/E10 + Check F. **Inspecting a frame and seeing it's "clean" is
NOT a pass — clean ≠ good. Score density, causality, and the mute test, or send it back.**

### 9. Text in elements (no empty bordered boxes)

✅ Always include title + body text INSIDE structural elements (no empty bordered boxes).

### 10. Real-image backdrops MUST stay VISIBLE (darken overlay ≤ 0.6)

A real photo used as a backdrop is there to be SEEN. The `D.bg` darken
overlay is for text legibility, NOT for hiding the photo.

✅ Overlay opacity 0.35–0.55 (0.60 absolute max). Tune to the lowest
value at which text stays readable. If unreadable at 0.6, add a *localized*
scrim/gradient behind the text block — don't darken the whole image. Full
recipe: `vg-code-images` §"legibility overlay".

### 11. NO bare-text-on-black frames — EVER (no thesis/closing/punchline exception)

Every bullet in a real-image video must be visually backed by a photo.
There is NO exception — not for thesis cards, not for 1-second closing
punchlines, not for scene-end "eye rest" moments. A bare-text frame
reads as a slide deck regardless of typography.

✅ Thematically-relevant backdrop (e.g. `win_senior.jpg` — a developer
at dual monitors for the "domain knowledge + AI" thesis, or
`cta_educating.jpg` — someone studying for the "who learned the tool"
closer) + overlay ≤0.6 + `textShadow: '0 2px 12px rgba(0,0,0,0.85)'` on
each text element so the type stays crisp over the photo. Pick the
backdrop **semantically** — the image IS an argument.

**Even 1-second closers get a real photo. No exceptions.**

### 11b. Photo-reuse rule — base-name = subject identity

A photo's **base-name** (`win_senior`, `retiring_worker`, `cta_educating`)
identifies the SUBJECT. Variants (`-1`, `-2`, `-3`) are alternate
framings of the SAME subject, not "fresh" photos. Across one project,
each base-name gets used in AT MOST ONE scene.

✅ Pick a base-name that no other scene in this project has
touched. Grep all scene JSONs for `staticFile('img/<basename>` before
authoring. Logos are exempt — they correctly repeat per brand mention.
Full rule: [[feedback-no-image-reuse-across-scenes]].

### 11c. Photo selection is SEMANTIC-FIRST, not filename-first

"Unused base-name" is necessary but NOT sufficient. The photo's SUBJECT
must match the bullet's MEANING. A file picked only because no other
scene used its name — but whose content is a stock-fill that doesn't
match the bullet's argument — reads as lazy and viewers feel it.

**Pre-bind checklist for any photo:**
1. Grep scene JSONs — confirm base-name unused (rule 11b).
2. **OPEN THE FILE.** View the actual photo content. Don't trust
   the filename. Asset names lie (e.g. `datacenter-2.jpg` is a
   boardroom; `cta_educating.jpg` is a classroom of school kids,
   not adult workers learning).
3. Ask: does this SUBJECT serve this bullet's MEANING? Adult-worker
   thesis → adult worker on a screen, not kids in a classroom. AI
   leverage → person doing the leveraging, not someone being taught.
4. If file is unused but subject is wrong → DO NOT bind it. Stop and
   ask the user for a new photo (or symbolic alternative).

✅ When the photo bank is depleted of semantically-fit options,
ASK the user to drop a new themed asset into
`projects/<name>/public/img/` rather than forcing a wrong-fit fresh
file. Filename freshness ≠ permission to bind. Subject fit is the
gate.

### 12. Image bullets — wrap foreground in `zIndex: 1` AbsoluteFill

When a bullet has an image backdrop (`AbsoluteFill` with `<Img>` + overlay),
the foreground text must live inside its own `AbsoluteFill` with `zIndex: 1`.

At opacity exactly 1.0 a flex child's stacking context drops and the absolute backdrop
paints over it.

✅ FIX:
```js
React.createElement(AbsoluteFill, {style:{backgroundColor: D.bg, opacity: fadeIn}},
  React.createElement(AbsoluteFill, {style:{overflow:'hidden'}}, /* Img + overlay */),
  React.createElement(AbsoluteFill, {style:{zIndex:1, display:'flex', ...}},
    /* all text elements live HERE */
  )
);
```
Any other `position:absolute` siblings (source citations, etc.) also need an
explicit `zIndex: 1`. Full recipe: `vg-code-images` §"stacking context".

### 13. NO source citations on-frame

Citations belong in the YouTube **video description**, not as a faint mono
line at the bottom of a frame. Do not author any `"source:"` / `"sources:"`
React text elements in bullet code.

✅ Keep the source in the structured-script comment block (for the
writer) and the YouTube description (for viewers). On-frame text is for
the message; provenance does not earn a pixel. Standing channel
preference — applies to every project unless explicitly overridden.

### 14. DynamicBlock reserved binding names — DO NOT re-declare

Per-bullet code runs inside `DynamicBlock.tsx` which injects these names as
function parameters. Re-declaring any of them with `const`/`let`/`var`
fails compilation with `Identifier 'X' has already been declared`. The
error renders on-screen as `BLOCK COMPILE ERROR`.

**Reserved (do NOT use as your variable name):**
`React, frame, fps, width, height, durationInFrames, interpolate, spring,
Easing, AbsoluteFill, Sequence, Series, Img, staticFile, AnimatedImage,
TransitionSeries, linearTiming, springTiming, fade, slide, wipe, D,
resolveColor, fitText, measureText, captions, findWord, findWordEnd`

✅ FIX: rename to a non-reserved variant — `fadeIn` instead of `fade`,
`wipeIn` instead of `wipe`, `slideX` instead of `slide`. Pattern: append
`In`/`X`/`Val` or any suffix that disambiguates.

### 15. Apostrophe in JS single-quoted string inside Python r"""..."""

When authoring JS code as a Python r-string and a single-quoted JS
string contains an apostrophe (`don't`, `aren't`, `it's`), write `\'`
NOT `\\'` in the Python source.

✅ FIX: `'The jobs aren\'t gone.'` — Python r-string preserves `\'`
literally; runtime JS sees `'The jobs aren\'t gone.'` and parses the
`\'` as an escaped apostrophe. Hit on S4 v4 in 3 places (B1/B4/B6).
**Better alternative**: use a curly apostrophe `'` (U+2019) directly
— Unicode, no escape needed in any quote style.

---

## HARD RULE — SCRIPT GENERATION: PASS EVERY GATE BEFORE SAVING

The PHASE 1 chain above is non-negotiable: invoke every step's skill AND run the gates
(steps 8–14) to a PASS **before** saving to `projects/structured_scripts/` or presenting.

**The trap:** producing the `.txt` is NOT the finish line — it is the *input* to the gates.
A clean parse / anchor check is NOT a substitute. If a script is written but the gates are
unrun, you are NOT done — STOP and run them. Never report "script ready" or save the DB
record while any gate is unrun or failing. Verify est. length matches the ask too.

This is the exact discipline that lapsed on `claude_code_limits` (2026-06-09): under "give me
the full script now" pressure, a self-made mechanical check was substituted for the real
gates and the story + critique steps were skipped. "Give it now" / "auto" / "continue" does
NOT waive this (see [[feedback_preflight_rules]]).

---

## HARD RULE — PER-SCENE RENDER → VERIFY → FIX LOOP

> ## ⛔⛔ STRICT — NO PARTIAL VERIFICATION. ALL VERIFICATION SKILLS MUST BE INVOKED, EVERY PASS.
> "Verification" is **only** complete when **ALL THREE** verify skills have been INVOKED via the Skill
> tool **this pass**: **`vg-verification-protocol`** + **`vg-visual-quality`** (→ its 8 `vg-quality-*`
> gates) + **`vg-output-validation`**. Invoking one or two = the SKIP = NOT verified.
> **HARD GATES (you may NOT do any of these until all three are invoked this pass):**
> - ❌ NO re-rendering · ❌ NO fixing/editing code · ❌ NO judging/scoring · ❌ NO SCENE-PASS ·
>   ❌ NO advancing to the next scene · ❌ NO "let me just quickly run X by hand".
> **Before ANY fix or re-render, literally check:** "Have I invoked vg-verification-protocol AND
> vg-visual-quality AND vg-output-validation THIS pass?" If any = no → INVOKE it NOW, first.
> Same for AUTHOR fixes: a code change is authoring → the owning author skill (`vg-code-animations` for
> motion, `vg-code-artifacts` for a new element, etc.) must be invoked BEFORE the edit, not after.
> This is the single most-repeated failure (2026-06-14): doing one check, then jumping to fix/re-render
> with the other skills un-invoked. The ledger MUST list every skill invoked this pass before SCENE-PASS.

> ### ⭐ THE PROCESS — FOLLOW EXACTLY, EVERY SCENE (invoking the skills + verifying every layer IS how quality output happens)
> Quality is not produced by coding and eyeballing — it is produced by **invoking the skill for each
> step and verifying every layer.** Skip a skill or a layer and the output drops. The sequence, no
> exceptions, every scene:
> 1. **AUTHOR — invoke the author skills BEFORE writing code.** `vg-visual-map` → `vg-visual-designer`
>    → `vg-render-code` + the `vg-code-*` recipe for what you're drawing (incl. **`vg-code-artifacts`
>    for ANY new mechanism/data layer** — a gauge, bar, meter, grid, etc.) + `vg-code-animations`/
>    `-timing`/`-sequencing` for the motion. Author AGAINST them. Adding a new visual element with no
>    author-skill invoked = lapse.
> 2. **RENDER** the scene.
> 3. **VERIFY — invoke ALL THREE verify skills and run EVERY layer under them:**
>    - **`vg-verification-protocol`** → EVERY layer: V1–V13, A1–A8 (A4 freeze, A5 PSNR), Layer 2
>      audio-sync, V9 overlap, V9c caption zone. Not a subset — every layer. **V9 overlap is checked
>      PROGRAMMATICALLY, not by eye:** run `python -m storyboard.layout_validator <project>` — any
>      `text_overlap` = V9 FAIL (it computes label/figure boxes at the SETTLED frame across the whole
>      scene; build_video also runs it at step 8.6). Re-run until `text_overlap: 0`. Don't hand-hunt overlaps.
>    - **`vg-visual-quality`** → ALL 8 gates (animations·timing·sequencing·transitions·text-fit·
>      images·tokens·vchecks).
>    - **`vg-output-validation`** → coverage (every word + every bullet present).
> 4. **COLLECT every bug+score in ONE list → FIX ALL → re-render → GO TO 3** (re-invoke all three,
>    re-run every layer). Loop until clean on EVERYTHING + every factor ≥7 (target 9 / ≥86%).
> 5. **LEDGER + SCENE-PASS** (`Skills invoked:` + `Verify loop:` lines) — only when genuinely clean.
> If at any point you are about to code without an author-skill, or judge a scene without invoking all
> three verify skills and every layer, STOP — that is the recurring lapse; go invoke first.
>
> ### 🔴 THE EDIT-TOOL TRIPWIRE (the mechanical gate — this is what actually stops the jump)
> Knowing the rule has NOT stopped the jump; the failure is letting "I have a fix in mind" override
> "invoke the skill first." So the gate is now mechanical and bound to the TOOL, not to memory:
> **Before EVERY `Edit`/`Write` on bullet code / a `gen_bundle_*.py` / a scene JSON, STOP and answer
> ONE question: "Have I invoked THIS change's author skill (via the Skill tool) THIS pass?"**
> - motion / anti-freeze / hold-alive → `vg-code-animations`
> - a new mechanism/data layer (gauge, bar, card, grid, scan, redline, KPI…) → `vg-code-artifacts`
> - stagger / lead-follow / cause→effect → `vg-code-sequencing` · easing/physics → `vg-code-timing`
> - text/labels/quote/fit → `vg-code-text` · image/backdrop → `vg-code-images` · tokens → `vg-code-tokens`
> If "no" → **the Edit does not happen.** Invoke the skill FIRST, then edit. "The guidance is already
> in my context from CLAUDE.md" is NOT "I invoked it" — that substitution IS the bug
> (see [[feedback-invoke-skill-not-digest]]). Same for verifying: before any re-render or PASS call,
> the three verify skills must have been invoked THIS pass. The Edit / Bash-render tool call is the
> tripwire — reaching for it with an un-invoked owning skill is a hard STOP.
>
> ⛔ **DON'T JUMP OFF-PROCESS.** The moment a render finishes, an issue is found, or a tool needs a
> tweak, the FIRST action is **INVOKE the verify skill** and do the work UNDER it — NOT hand-run a
> check, NOT go build/fix tooling, NOT start hand-patching, NOT "let me just quickly…". Found 162
> overlaps? That's the V9 layer of `vg-verification-protocol` — invoke it, run the validator under it,
> fix, re-invoke. Improving a tool (the overlap validator, a helper) is fine, but it happens INSIDE the
> invoked-skill loop, never as a detour that skips invoking the skill. **Sequence is always: invoke the
> skill → it tells you what to run/judge → run it → fix → re-invoke.** Jumping ahead into ad-hoc
> hand-work is the exact recurring failure (2026-06-14, repeatedly). If you catch yourself doing scene
> work without the owning skill invoked THIS pass — STOP and invoke it.
>
> ### 📋 COMPLETE VERIFICATION CHECKLIST (run ALL — under the invoked skills — every scene, every pass)
> | # | Check | Owner skill | PASS bar |
> |---|---|---|---|
> | 1 | Audio-sync drift (per bullet) | vg-verification-protocol L2 | every bullet −0.5..+1.5s (B1 opener f0 ok) |
> | 2 | A4 freeze | vg-verification-protocol L1.5 | no freeze >3s except last-bullet final-hold |
> | 3 | A5 PSNR motion | vg-verification-protocol L1.5 | <45dB every bullet |
> | 4 | V1–V13 frame checks (mid frame) | vg-verification-protocol L1 | all pass (V1 not-black, V4 readable+contrast, V5 fill, V13 prominence…) |
> | 5 | V9 text/element overlap (SETTLED frame) | vg-verification-protocol L1 | `python -m storyboard.layout_validator <project>` → `text_overlap: 0` |
> | 6 | V9c caption zone | vg-verification-protocol L1 | nothing top>0.88h or bottom<0.10h |
> | 7 | Rhythm / cross-beat consistency / viewer-sense | vg-verification-protocol L1 §g/h/i | evolving (not slideshow), reads cold |
> | 8 | 8 quality gates → /100 | vg-visual-quality | every factor ≥7 (target 9 / ≥86%) |
> | 9 | Narration coverage + animation visibility | vg-output-validation | coverage ≥90%, visibility 100%, 0 placeholder/error |
> | 10 | (final mp4 only) T1–T12 YouTube technical | vg-youtube-validation | upload gate |
> A bug in ANY row = NOT DONE → collect all → fix all → re-render → re-invoke the skills → re-run ALL.

> ⛔ **THE LOOP IS PER SCENE — IT RESETS FOR EVERY SINGLE SCENE.** Invoking the skills for scene 1
> does NOT cover scene 2. Each scene is a FRESH instance of BOTH steps, in this order:
> **(A) BEFORE you author scene N's code, INVOKE the author-time skills FOR scene N** — `vg-visual-map`
> → `vg-visual-designer` → `vg-render-code` + the `vg-code-*` recipes you need (`-animations`,
> `-timing`, `-sequencing`, `-transitions`, `-text`, `-images`, `-tokens`, `-vchecks`) +
> `vg-code-motion-bank`/`-composition`/`-artifacts` as the scene needs + the `remotion` skill. Author
> AGAINST them — do NOT write code first and invoke a recipe only after a render fails (that is the
> 2026-06-14 lapse: Scene 2 coded after only `vg-visual-map`, hit an A4 freeze that `vg-code-animations`
> would have prevented). **(B) AFTER you render scene N, INVOKE the verify skills FOR scene N** and
> run the **FULL battery in a loop. INVOKE the skill — do NOT hand-run checks as a substitute:**
>   0. ⛔ **VERIFYING = INVOKING the THREE verification skills via the Skill tool, EVERY pass:**
>      **(1) `vg-verification-protocol`** (is it broken? — V1–V13, A1–A8 freeze/PSNR, Layer 2
>      audio-sync, V9/V9c) **+ (2) `vg-visual-quality`** (production-grade /100 — which itself INVOKES
>      the 8 `vg-quality-*` gates: animations·timing·sequencing·transitions·text-fit·images·tokens·
>      vchecks) **+ (3) `vg-output-validation`** (coverage — every narration word + every bullet
>      actually in the render). Running ffmpeg freeze/PSNR or the audio-sync python by hand, from
>      memory, **WITHOUT invoking all three, IS THE SKIP — not verification.** The mechanical commands
>      execute UNDER the invoked skill, never instead of it. **Every loop pass you INVOKE all three
>      again.** Skipping ANY of the three to "save time" is bad — it is how quality silently drops.
>      (I have repeatedly dropped #2 and #3 — do not.)
>   0a. ⛔ **NEVER DEFER `vg-visual-quality` to "once the render is clean" — that defer IS the skip.**
>      The 2026-06-14 Scene-2 lapse: one check (A4 freeze) FAILed, so I tunnel-visioned into a
>      fix→re-render→re-check-freeze loop and pushed the quality scorecard to "later," which never
>      came — chasing one bug and treating sub-progress as verification. RULE: **on the FIRST verify
>      pass and EVERY pass, invoke BOTH skills BEFORE looking at any fix** — even while other checks
>      still fail. You run the FULL battery to get the COMPLETE bug+score list, THEN fix. Do not fix
>      one bug before the whole battery (ALL THREE skills) has run. Hand-running ffmpeg checks *feels*
>      like verifying and masks the missing skill — that feeling is the trap. Tick it on the todo as a
>      hard gate: a scene's verify is not "in progress" until all THREE skills are invoked THIS pass.
>   1. With those skills invoked, run the **COMPLETE** check set every pass — ALL layers (V1–V13,
>      A1–A8 incl. A4 freeze + A5 PSNR, Layer 2 audio-sync drift, V9 internal overlap, V9c caption
>      zone) AND ALL 8 quality gates. Do NOT cherry-pick one check.
>   2. **Collect EVERY bug in ONE list** (don't fix-and-forget a single issue and move on).
>   3. Fix ALL listed bugs, re-seed, re-render.
>   4. **Re-INVOKE all THREE verify skills and re-run the COMPLETE battery** — fixing one bug can
>      regress another; a partial re-verify hides it. **Loop 1→4 until the scene is clean on
>      EVERYTHING:** zero V-check FAILs, no freeze >3s (except last-bullet final-hold), audio-sync PASS
>      on every bullet, no overlap, `vg-output-validation` coverage ≥90%, and `vg-visual-quality` ≥
>      floor-7 on every factor (target 9). Then make the call: PASS only when genuinely clean. Always
>      invoke → verify → judge quality → decide; never skip.
> **SKILLS LEDGER (mandatory):** scene N's `verification.md` section must contain a `Skills invoked:`
> line naming the author-time AND verify skills you actually called for THAT scene, plus a `Verify
> loop:` line noting how many full-battery passes it took and the final per-factor scores. No ledger
> line = the scene is NOT done; `SCENE-PASS` written without it is a hallucinated pass. If you reach
> scene N and the ledger for scene N is empty, STOP — you skipped step (A); go invoke the author skills.

Tripwires, non-negotiable (a bug missed at scene 1 wastes 30+ min of compounded render):

0. PER SCENE: invoke author skills BEFORE coding it, verify skills AFTER rendering it, and write the
   `Skills invoked:` ledger line — every scene, no exceptions (see box above).
1. NEVER render scene **N+1** until scene **N** has PASSED verification.
2. NEVER render the **master** (final assembly) until **ALL** scenes have PASSED.
   Final assembly = the master render (`render_master.mjs`, master composition via
   TransitionSeries) — NOT an ffmpeg concat.
3. A scene is PASS only when its `projects/<name>/verification.md` section exists with real
   frame evidence — "looks right from the code" is NOT evidence.
4. "VERIFY" means you **INVOKED `vg-verification-protocol` AND `vg-visual-quality` via the Skill
   tool** (and `vg-visual-quality` in turn invokes the 8 `vg-quality-*` gates). Extracting frames
   and running the V-checks / freeze / PSNR / drift **by hand from the digest is NOT verification**
   — it is the lapse. No production-grade /100 from `vg-visual-quality` = scene is NOT verified,
   no matter how many frames you inspected.

**These are ENFORCED, not just asked.** `render_gate.sh` hard-blocks (exit 2) the render of
scene N+1 (`render_scenes.mjs`) and the final master render (`render_master.mjs`) until the proof
exists. The proof is a marker line you append to `projects/<name>/verification.md` once a scene is
genuinely verified: `SCENE-PASS: <name>-s0N` (e.g. `SCENE-PASS: claude_code_limits-s01`). No
marker = blocked. Only write it after `vg-verification-protocol` + `vg-visual-quality` ran on real
frames — a marker with no evidence behind it is the hallucinated pass the gate exists to stop.
(A partial preview master may set `MASTER_SCENES=<subset>` and is not hard-blocked.)

**How to run the loop** is Phase 2 step 7 above: invoke `vg-verification-protocol` ("is it
broken?") then `vg-visual-quality` ("is it production-grade?"). Those skills hold the procedure —
the loop steps, the audio-sync drift Python, and the **format** for the log. The log itself is a
file YOU write: `projects/<name>/verification.md` (tripwire 3). Skill = how; file = where you
record the proof.

---

## REGISTERED HOOKS — auto-inject the skill checklist so none is missed

Three hooks (in `.claude/settings.json`) inject the "which skills to invoke"
checklist into context automatically — you never have to remember it:

| Hook | Trigger | Injects |
|---|---|---|
| `skill_flow_gate.sh` | **UserPromptSubmit** — you ask to "write a script" or "build/render the video" | the FULL ordered skill list for that phase (Phase 1 = all `script-*`; Phase 2 = all `vg-*` mapped to steps) |
| `authoring_gate.sh` | **Edit/Write** on bullet code / structured script / scene JSON | the full author-time set — `vg-render-code` + 8 `vg-code-*` + the 4 richness skills + the SHIFT-LEFT failure modes |
| `render_gate.sh` | **Bash** containing `render_scenes.mjs` / `build_video.py` / `seed_bullet_cache.py` / `ffmpeg -f concat` | the per-scene verify checklist — `vg-verification-protocol` + `vg-visual-quality` (8 `vg-quality-*`) + `vg-output-validation` |

These are **reminders, not hard blocks** — `UserPromptSubmit`/`PreToolUse` hooks
inject context, they cannot force a Skill call. The discipline still applies even
if a hook is bypassed (command rephrased, etc.): this CLAUDE.md is loaded anyway
and carries the same flow above. If a hook fires and lists a skill you have not
invoked this session, STOP and invoke it.

---

## OTHER PROJECT-WIDE RULES

- NEVER spawn `claude` CLI from pipeline scripts. Cache-only lookup. Authored
  in-session, seeded via `storyboard/seed_bullet_cache.py`.
- Burned-in captions are DISABLED in `remotion/src/sequences/UniversalScenePreview.tsx`.
  Long-form YouTube uses separate SRT upload. (Caption-zone reserve = SHIFT-LEFT #1.)
- For audio quality jump (HIGH ROI — audio is ~half perceived quality): switch source TTS from
  `edge_tts` (24kHz mono 48kbps, robotic) to Piper (`pip install piper-tts` + `en_US-ryan-high.onnx`)
  or ElevenLabs, AND bake `loudnorm=I=-14:TP=-1.5:LRA=11` (YouTube's −14 LUFS target) into the pipeline.
- MASTER RENDER AUDIO: per-scene renders are VISUAL-ONLY (silent aac track). The master MUST overlay the
  concatenated narration (each scene mp3 padded/trimmed to its exact `frames/30`, concat `-c copy`, mux
  `-c:v copy`). ALWAYS `ffmpeg -i out.mp4 -af volumedetect -f null -` the final or it can ship SILENT.
  See [[reference-master-render-audio]].
- Final YouTube encode: encode by QUALITY, NOT a forced bitrate — `-c:v libx264 -preset slow -crf 16
  -pix_fmt yuv420p -c:a aac -b:a 384k -movflags +faststart` + the loudnorm above. Do NOT force 8 Mbps:
  proven this session that clean motion-graphics are visually transparent at ~2 Mbps; `-b:v 8M` either
  undershoots OR pads with meaningless `nal-hrd=cbr` filler (zero picture data). YouTube re-encodes every
  upload — give it a TRANSPARENT source, not a big number. The real quality ceiling is the per-scene
  render, not the final mux. Full upload gate: invoke `vg-youtube-validation` (+ `vg-verification-protocol`
  Layer 3). See [[reference-master-render-audio]].
- LAYOUT VALIDATOR now gates THREE more classes (run `python -m storyboard.layout_validator <project>`):
  `legibility_clutter` (bright payoff text over a dimmed-but-legible bg — overlay-aware "clean stage"),
  `sparse_canvas` (largest CONTIGUOUS empty region >44%, middle bullets only), `continuity_gap` (a
  persistent element missing from a BRACKETED bullet). See [[reference-overlap-validator]].
- HIGHEST-ROI OPEN IMPROVEMENT (verification): a VISION-MODEL QA gate — feed each bullet's settled frame +
  its narration sentence to a vision LLM and score density (V5) / sentence-test (V15) / reality-anchor /
  clutter. It is the structural fix for the quality checks still done MANUALLY (and missed: the generic-
  interface, sparse, and clutter misses this session). Authenticity + "is the motion meaningful" can't be
  made deterministic; density/dim-overlap/continuity now are (the 3 validator checks above).

---

## When in doubt

INVOKE the step's skill — don't work from memory. (The old `rules/NN-*.md` files are gone;
they were split into the named skills above.) The two routing tables live in:
- `script_generation/SKILL.md` — Phase 1 step→skill table
- `video_generation/SKILL.md` — Phase 2 phase→skill table + pipeline-step routing
