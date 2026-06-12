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

## SHIFT-LEFT — Read this BEFORE authoring any bullet code

Most verification failures are PREVENTABLE if you know the failure modes
before writing the code. This is the failure-prevention digest of rule 23.
Read it before opening `gen_bundle_s*.py` for any new scene.

### 1. Caption zone is RESERVED (bottom 12% of canvas)

Burned-in captions are disabled (long-form YouTube uses the separate `.srt`
sidecar). Still treat `top > h*0.88` and `bottom < h*0.10` as off-limits — keeps
layout future-proof if captions are ever re-enabled, and matches where most
players overlay user-toggled subtitles.

❌ FAIL example:
```js
const footer = React.createElement('div', {style: {
  position:'absolute', top: Math.round(h*0.92), ...   // INSIDE caption zone
}}, 'WAS $12.50');
```

✅ FIX: cap footer/punchline overlays at `top: h*0.82` max.

### 2. Audio anchor = VERBATIM word(s) from THIS scene's narration

The bullet's `audio_anchor` MUST match a 2-4 word phrase that Whisper will
hear in the narration. Otherwise framesFrom is randomly placed → audio sync
WARN/FAIL during verification.

❌ FAIL anchors:
- `"the reveal"`, `"the punchline"`  — abstract, not in narration
- `"seventy-seven point eight"`     — Whisper splits decimals as `"77 .8"`
- `"thirty-six percent"`            — Whisper merges as `"36%."`
- `"<pause 0.3s> the answer"`       — spans across a pause break

✅ GOOD anchors:
- `"the needle"`, `"twelve files"`, `"watch it"`, `"identical output"`

### 3. ADDITIVE bullets MUST inline prior settled state

When a bullet is ADDITIVE (no `[REPLACE]` tag), the previous bullet's
ELEMENTS need to re-render at their settled final state. Slot-based
rendering uses `framesTo - framesFrom` per bullet — the canvas blanks
between bullets.

❌ FAIL: B2 only renders the new badge → B1's panel disappears underneath.

✅ FIX: B2 includes B1's panel as a static element (no animation) plus
the new badge with its entrance animation.

❌ FAIL (hit on claude_4_8_vs_4_7 S1, 2026-06-03): B2 [REPLACE] drew two
answer-boxes; B3 (ADD) drew the LEFT box's red meter; B4 (ADD) drew the
RIGHT box's green meter — each relying on B2's boxes persisting. Under
slot-based rendering B2 was GONE by B4's window, so B4 rendered as a
**lone floating meter "30% / I don't know"** — no boxes, no left-vs-right
contrast, meaningless on screen. Caught only by inspecting the rendered frame.

✅ THE RULE — every bullet is SELF-CONTAINED. There is no real cross-bullet
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

❌ FAIL (hit on claude_4_8_vs_4_7 S1 B1, 2026-06-03): a clean staircase of bars
labeled only `4.5  4.6  4.7  4.8`. A viewer asks "4.5 *what*? what model? what
does the height mean?" — no title, no axis meaning. Meaningless without the
narration.

✅ FIX: animation + minimal LABELS (rule 21 "show, don't tell": the picture makes
the point, text LABELS what it can't say). Every chart/diagram needs: a short
TITLE naming what it is ("EACH CLAUDE OPUS RELEASE — how big was the jump?"), the
entity labels, and the payoff tag ("4.8: barely a step · their word: 'modest'").
Text-only is banned; **context-free visuals are equally banned.** The bar that
matters keeps its name on screen.

### 3c. NO emoji glyphs in bullet code — they HANG the headless render

❌ FAIL (hit on claude_4_8_vs_4_7 S3, 2026-06-04): bullets used emoji (⏰ 🔍 🐛 🏁
🔓 🛡). Headless Chromium on the render box has no emoji font, so it stalls
resolving the glyph and the frame never signals "ready" → the renderer hangs and
hits the 15-min per-scene ceiling (killed, exit 124). Scenes with NO emoji (S1, S2)
rendered fine; the first emoji scene (S3) hung. This also caused the earlier
"waiting for the page to render the React component: timeout 33000ms" errors.

✅ FIX: never put emoji in `code`. Draw icons as SVG primitives (a clock = circle +
two hand-lines; a magnifier = circle + diagonal line; a flag = pole + triangle; a
lock/shield = a small path/polygon) or use a short text label. BMP dingbats that DO
render reliably: ✓ ✗ ★ ▶ → ↑ ↓ ⚠ · — (these are fine; the astral-plane emoji are not).

### 4. REPLACE backdrop MUST be AbsoluteFill, not plain div

```js
// ❌ FAIL — prior bullets bleed through
const bd = React.createElement('div', {style:{position:'absolute',
  inset:0, backgroundColor: D.bg}});

// ✅ PASS
const bd = React.createElement(AbsoluteFill, {style:{backgroundColor: D.bg}});
```

### 5. NO hex literals, NO dimension literals, NO fps literals

```js
// ❌ FAIL
{color:'#FF3B3B', width:1920, fontSize: 32}

// ✅ PASS — use design tokens + useVideoConfig
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

❌ FAIL (hit on claude_code_limits S1, 2026-06-10): a thin usage bar + a command on empty
off-white. Rendered "clean," passed V13 by the old width-only rule, user rejected it — *"it
explains nothing."* Three things were wrong, and all three are now hard rules:
- **Sparse:** primary occupied ~2% area; ≥half the canvas empty.
- **Animated a NOUN:** a "meter" sitting there, not the VERB (the command *consuming* the budget).
- **No causality + invisible-not-shown:** command and bar disconnected; token consumption (the
  real invisible thing) never made visible.

✅ FIX — the beat must EXPLAIN, not display:
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

❌ FAIL: card with 4px border + no text inside. Looks unfinished.

✅ Always include title + body text INSIDE structural elements.

### 10. Bottom-overlay typography: cap at h*0.82, not h*0.95

Overlays at `bottom: h*0.04` (= `top: h*0.96`) fall INSIDE the caption
zone. Use `top: h*0.82` MAX for footers, punchlines, CTAs.

### 11. Real-image backdrops MUST stay VISIBLE (darken overlay ≤ 0.6)

A real photo used as a backdrop is there to be SEEN. The `D.bg` darken
overlay is for text legibility, NOT for hiding the photo.

❌ FAIL example (hit on layoffs_2026 Scene 1):
```js
// construction backdrop, then:
React.createElement(AbsoluteFill, {style:{backgroundColor: D.bg, opacity: 0.80}})
// → photo goes near-black, scene reads as "wall of text on dark"
```

✅ FIX: overlay opacity 0.35–0.55 (0.60 absolute max). Tune to the lowest
value at which text stays readable. If unreadable at 0.6, add a *localized*
scrim/gradient behind the text block — don't darken the whole image. Full
rule: rule 24 §"Authoring the bullet".

### 12. NO bare-text-on-black frames — EVER (no thesis/closing/punchline exception)

Every bullet in a real-image video must be visually backed by a photo.
There is NO exception — not for thesis cards, not for 1-second closing
punchlines, not for scene-end "eye rest" moments. A bare-text frame
reads as a slide deck regardless of typography.

❌ FAIL (hit on layoffs_2026 S1 B5):
4 lines of text centered on `D.bg`, no image — "Domain knowledge + AI /
= irreplaceable / alone = commodity / Here is the full picture."

❌ FAIL (hit on layoffs_2026 S6 B7, 2026-05-30):
1-second closing punchline "*who learned the tool.*" amber italic
centered on plain `D.bg` black. User rejected: "u bllod u same image
is prohibited". Even a 1s tail must have a real photo.

✅ FIX: thematically-relevant backdrop (e.g. `win_senior.jpg` — a developer
at dual monitors for the "domain knowledge + AI" thesis, or
`cta_educating.jpg` — someone studying for the "who learned the tool"
closer) + overlay ≤0.6 + `textShadow: '0 2px 12px rgba(0,0,0,0.85)'` on
each text element so the type stays crisp over the photo. Pick the
backdrop **semantically** — the image IS an argument.

**Even 1-second closers get a real photo. No exceptions.**

### 12b. Photo-reuse rule — base-name = subject identity

A photo's **base-name** (`win_senior`, `retiring_worker`, `cta_educating`)
identifies the SUBJECT. Variants (`-1`, `-2`, `-3`) are alternate
framings of the SAME subject, not "fresh" photos. Across one project,
each base-name gets used in AT MOST ONE scene.

❌ FAIL (hit on layoffs_2026 S6, 2026-05-30):
S1 used `win_senior.jpg` (developer at dual monitors) + S6 B3 used
`win_senior-1.jpg` (woman at multi-screen workstation — same archetype,
nearly the same shot). User: "same image is prohibited".

✅ FIX: pick a base-name that no other scene in this project has
touched. Grep all scene JSONs for `staticFile('img/<basename>` before
authoring. Logos are exempt — they correctly repeat per brand mention.
Full rule: [[feedback-no-image-reuse-across-scenes]].

### 12c. Photo selection is SEMANTIC-FIRST, not filename-first

"Unused base-name" is necessary but NOT sufficient. The photo's SUBJECT
must match the bullet's MEANING. A file picked only because no other
scene used its name — but whose content is a stock-fill that doesn't
match the bullet's argument — reads as lazy and viewers feel it.

**Pre-bind checklist for any photo:**
1. Grep scene JSONs — confirm base-name unused (rule 12b).
2. **OPEN THE FILE.** View the actual photo content. Don't trust
   the filename. Asset names lie (e.g. `datacenter-2.jpg` is a
   boardroom; `cta_educating.jpg` is a classroom of school kids,
   not adult workers learning).
3. Ask: does this SUBJECT serve this bullet's MEANING? Adult-worker
   thesis → adult worker on a screen, not kids in a classroom. AI
   leverage → person doing the leveraging, not someone being taught.
4. If file is unused but subject is wrong → DO NOT bind it. Stop and
   ask the user for a new photo (or symbolic alternative).

❌ FAIL (hit on layoffs_2026 S6 B7 v2, 2026-05-30):
After SHIFT-LEFT #12 forced a photo onto the 1s closer "*who learned
the tool.*", I picked `cta_educating.jpg` because it was the only
unused base-name. But the photo is a teacher with school children —
the closer is about ADULT workers who learned AI tools. User rejected:
"u bllody why use same image from differnt i said dont use right".
The semantic mismatch made it feel as wrong as a true file-reuse.

✅ FIX: when the photo bank is depleted of semantically-fit options,
ASK the user to drop a new themed asset into
`projects/<name>/public/img/` rather than forcing a wrong-fit fresh
file. Filename freshness ≠ permission to bind. Subject fit is the
gate.

### 13. Image bullets — wrap foreground in `zIndex: 1` AbsoluteFill

When a bullet has an image backdrop (`AbsoluteFill` with `<Img>` + overlay),
the foreground text must live inside its own `AbsoluteFill` with `zIndex: 1`.

❌ FAIL (hit on layoffs_2026 S1 B4): flex-centered root, backdrop first child,
plain `<div>` flex children for text. The +78M headline rendered because
`transform: scale()` kept its stacking context, but the label and sub
DISAPPEARED once their `opacity` animations reached **exactly** 1.0 — at
opacity:1 the stacking context drops and the absolute backdrop paints over
them.

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
explicit `zIndex: 1`. Full rule: rule 24 §"Stacking context".

### 14. NO source citations on-frame

Citations belong in the YouTube **video description**, not as a faint mono
line at the bottom of a frame. Do not author any `"source:"` / `"sources:"`
React text elements in bullet code.

❌ FAIL (hit on layoffs_2026 S1 B1/B2/B4): rendered "sources: Layoffs.fyi ·
Bain & Company" and "source: WEF Future of Jobs 2025" at `top: h*0.86`.
The user rejected it.

✅ FIX: keep the source in the structured-script comment block (for the
writer) and the YouTube description (for viewers). On-frame text is for
the message; provenance does not earn a pixel. Standing channel
preference — applies to every project unless explicitly overridden.

### 15. DynamicBlock reserved binding names — DO NOT re-declare

Per-bullet code runs inside `DynamicBlock.tsx` which injects these names as
function parameters. Re-declaring any of them with `const`/`let`/`var`
fails compilation with `Identifier 'X' has already been declared`. The
error renders on-screen as `BLOCK COMPILE ERROR`.

**Reserved (do NOT use as your variable name):**
`React, frame, fps, width, height, durationInFrames, interpolate, spring,
Easing, AbsoluteFill, Sequence, Series, Img, staticFile, AnimatedImage,
TransitionSeries, linearTiming, springTiming, fade, slide, wipe, D,
resolveColor, fitText, measureText, captions, findWord, findWordEnd`

❌ FAIL (hit on layoffs_2026 S1 B1: `const fade =`; S2 B1/B2/B6:
`const wipeIn` wait that was the fix; original: `const wipe =`).

✅ FIX: rename to a non-reserved variant — `fadeIn` instead of `fade`,
`wipeIn` instead of `wipe`, `slideX` instead of `slide`. Pattern: append
`In`/`X`/`Val` or any suffix that disambiguates.

### 16. Apostrophe in JS single-quoted string inside Python r"""..."""

When authoring JS code as a Python r-string and a single-quoted JS
string contains an apostrophe (`don't`, `aren't`, `it's`), write `\'`
NOT `\\'` in the Python source.

❌ FAIL: `'The jobs aren\\'t gone.'` — Python r-string preserves
`\\'` literally; runtime JS sees `'The jobs aren\\'`+`t gone.` which
ends the string early and dies with `BLOCK COMPILE ERROR: missing )
after argument list`.

✅ FIX: `'The jobs aren\'t gone.'` — Python r-string preserves `\'`
literally; runtime JS sees `'The jobs aren\'t gone.'` and parses the
`\'` as an escaped apostrophe. Hit on S4 v4 in 3 places (B1/B4/B6).
**Better alternative**: use a curly apostrophe `'` (U+2019) directly
— Unicode, no escape needed in any quote style.

---

## HARD RULE — SCRIPT GENERATION: INVOKE EVERY STEP'S SKILL + PASS EVERY GATE

When generating a script (the `script_generation` skill), you MUST invoke each step's
sub-skill with the Skill tool AND run every Step-7 gate to a PASS **before** saving to
`projects/structured_scripts/` or presenting the script. This is non-negotiable and is the
exact discipline that lapsed on `claude_code_limits` (2026-06-09): under "give me the full
script now" pressure, the script was written and a self-made mechanical check substituted
for the real gates — Steps 5.5 and 7a–7f were skipped. **"Give it now" / "auto" / "continue"
does NOT waive this** (see [[feedback_preflight_rules]]).

The full chain — none skippable, in order:

```
3   script-youtube-strategy        (title/thesis/thumbnail/loops)
4   script-research                (real sourced facts — INVOKE it, don't just websearch inline)
5   script-scene-structure         (scene list + anchor visual per scene)
5.5 script-storytelling            (story spine — the most-skipped step)
6a  script-narration               (narration to sync rules)
6b  script-animation-bullets       ("what happens" director beats)
6.5 cut pass (≥10% removed)
7a  script-animation-validator     (per-bullet: sense/fit/motion/buildable/Check-E)
7a2 script-narration-visual-sync   (/100 scorecard; <70 = NOT READY)
7b  script-validator + script-format-validation
7c  script-retention-engineering
7d  script-human-review            (9 questions)
7e  script-content-quality         (12 tests)
7f  script-critique-improve        (fact-check gate + patch/rebuild)
8   save + present for approval
```

**The trap to avoid:** producing the visible artifact (the `.txt`) is NOT the finish line —
it is the *input* to Steps 6.5–7. A clean parse / anchor check is NOT a substitute for the
gates. If you have written a script but not run 7a–7f, you are NOT done; STOP and run them.
Never report "script ready" or save the DB record while any gate is unrun or failing. The
duration target is a requirement too — verify est. length matches the ask before presenting.

---

## HARD RULE — PER-SCENE RENDER → VERIFY → FIX LOOP

**NEVER render scenes 2..N before scene 1 passes verification.**
**NEVER stitch the final video before ALL scenes pass.**

This is non-negotiable. Hard-won from production. A bug missed at scene 1
wastes 30+ min of compounded render time. The loop:

```
FOR each scene N (1, 2, 3, ... last):
  1. Render scene N only:
       cd remotion && PROJECT=<name> node render_scenes.mjs <name>-s0N
  2. Verify scene N (ALL of below — no skipping):
       a. Audio sync — for every bullet, drift = framesFrom/fps - word_start
          MUST be within ±0.05s (PERFECT) or within ±1.5s (PASS).
          WARN/FAIL → fix framesFrom = round(word_start * fps), mirror to
          remotion/public/scenes/, re-render.
       b. V9c caption zone — no element with top > h*0.88 or bottom < h*0.10
       c. V11 — last animation phase frame < (framesTo - framesFrom)
       d. A4 freeze — no static frame > 3s unless final-hold of scene
       e. V1-V13 — extract 5 frames per bullet (p10/p30/p50/p70/p90), inspect
  3. IF FAIL: fix bullet code → delete cache → re-seed → re-render → goto 1
  4. IF PASS: write the scene's section to projects/<name>/verification.md
     (real frame-evidence paths + drift numbers), THEN mark scene N PASS in
     TodoWrite. ONLY THEN advance to N+1.
```

The `verification.md` log is MANDATORY — the standard written record, one file
per project at `projects/<name>/verification.md`, appended per scene. A scene is
not PASS until its section exists with frame evidence. "Looks right from the
code" is not evidence. Template + schema: rule 23 §"The verification.md artifact".

See `.claude/skills/video_generation/rules/23-verification-protocol.md` for the
full protocol with copy-paste Python for audio sync drift check.

---

## AUDIO SYNC CHECK — copy-paste this Python per scene

```python
import json
from pathlib import Path

scene_id = "<name>-s01"  # change per scene
fps      = 30

scene = json.loads(Path(f"projects/<name>/scenes/{scene_id}.json").read_text(encoding="utf-8"))
words = json.loads(Path(f"projects/<name>/captions/{scene_id}.json").read_text(encoding="utf-8"))

# Whisper-form substitutions (Whisper transcribes numbers/hyphens inconsistently)
def normalize(s):
    return (s.lower()
        .replace("twelve", "12").replace("fifty", "50").replace("twenty-three", "23")
        .replace("multi-step", "multi -step").replace("scratchpad", "scratch pad"))

for i, b in enumerate(scene):
    fire_s = b["framesFrom"] / fps
    anchor = normalize(b["audio_anchor"])
    first = anchor.split()[0]
    closest = None
    for w in words:
        wlow = normalize(w["word"]).strip(".,!?\":;-")
        if first in wlow or wlow in first:
            if abs(w["start"] - fire_s) < 5.0 and (closest is None or
               abs(w["start"] - fire_s) < abs(closest["start"] - fire_s)):
                closest = w
    if not closest:
        print(f"B{i+1}: anchor {b['audio_anchor']!r} NOT FOUND — add substitution")
        continue
    drift = fire_s - closest["start"]
    verdict = ("PERFECT" if abs(drift) < 0.05 else
               "PASS"    if -0.50 <= drift <= +1.50 else
               "WARN"    if drift <= +2.00 else "FAIL")
    print(f"B{i+1}: fire={fire_s:.2f}s word={closest['word']!r}@{closest['start']:.2f}s "
          f"drift={drift:+.2f}s [{verdict}]")
```

If ANY bullet is WARN/FAIL → fix `framesFrom = round(word_start * 30)` in BOTH
the scene JSON and the `remotion/public/scenes/` mirror, then re-render that
scene. Do NOT advance.

---

## REGISTERED HOOK — gate reminder on render

A `.claude/settings.json` PreToolUse hook fires on Bash commands containing
`render_scenes.mjs` or `build_video.py`. It injects the per-scene verification
checklist into context. Hook script: `.claude/hooks/render_gate.sh`.

If the hook is bypassed (e.g., command rephrased), the discipline still applies
— this CLAUDE.md is loaded anyway and contains the same rule above.

---

## OTHER PROJECT-WIDE RULES

- NEVER spawn `claude` CLI from pipeline scripts. Cache-only lookup. Authored
  in-session, seeded via `storyboard/seed_bullet_cache.py`.
- Burned-in captions are DISABLED in `remotion/src/sequences/UniversalScenePreview.tsx`.
  Long-form YouTube uses separate SRT upload.
- Caption zone (bottom 12% of canvas) is reserved for the auto-overlay box that
  was present in older renders. New bullets must not place elements there.
- Bottom 12% caption zone applies whether captions are burned in or not — keeps
  layout future-proof if captions get re-enabled.
- For audio quality jump: switch source TTS from `edge_tts` (24kHz mono 48kbps)
  to Piper (`pip install piper-tts` + `en_US-ryan-high.onnx`) or ElevenLabs.
- Final YouTube re-encode: `-c:v libx264 -preset slow -b:v 8M -minrate 8M
  -maxrate 10M -pass 2 -pix_fmt yuv420p -c:a aac -b:a 384k -movflags +faststart`.
  See `.claude/skills/video_generation/rules/22-youtube-output-validation.md`.

---

## When in doubt

Read the skill rule for the step. The skill is at
`.claude/skills/video_generation/SKILL.md` with the rule routing table.
Per-scene loop is rule 00 §Step 4. Verification protocol is rule 23.
