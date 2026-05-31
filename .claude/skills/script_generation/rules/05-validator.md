---
name: 05-validator
description: Technical quality gate for a completed structured script — format, research, narration, bullets, anchors, density, canvas, and arc checks against source_parser.py before render. Catches format errors, missing anchors, weak narration, and empty bullets before a long render. Use when validating a script before render, running the technical gate, checking if a script is ready, verifying audio anchors, or auditing bullet quality. Not for content quality (rule 06), animation design (03/03b), or research (00).
---

# Script Validator

Run this validator on the completed `projects/structured_scripts/<name>.txt`
**before** invoking `video_generation`. Every FAIL must be fixed. WARNINGs should be fixed
if time allows — they produce low-quality renders, not build failures.

---

## How to run

Read the full structured script file. Go scene by scene.
For each scene fill out the checklist below.
Report results as a table: one row per scene, columns = check name, PASS/FAIL/WARN.

```
Scene | Format | Research | Narration | Bullets | Anchors | Density | Color
  S1  |  PASS  |   PASS   |   PASS    |  FAIL   |  PASS   |  WARN   | PASS
  S2  |  PASS  |   PASS   |   WARN    |  PASS   |  FAIL   |  PASS   | PASS
...
```

Any FAIL = do not proceed to video_generation. Fix and re-validate.
3+ WARNINGs on one scene = treat as FAIL.

---

## Check 1 — FORMAT (FAIL if any fail)

Validates against `source_parser.py` regex. A single format error aborts the build.

| What to check | Rule | FAIL condition |
|---|---|---|
| Scene header | `## SCENE N — "Title" (M:SS – M:SS)` | Wrong case (`Scene` not `SCENE`), missing time window, colon instead of em-dash |
| Scene header single line | No line breaks inside | Header wraps to second line |
| Narration block | `### Narration` present, all content lines start with `>` | Missing block, line without `>` |
| Animation block | `### Animation` present | Missing block |
| Bullet start | Each bullet starts with `- **` | Bullet starts with `-` only or `*` only |
| Bullet time | `M:SS – M:SS` with en-dash or hyphen | Missing time, wrong format `MM:SS:FF` |
| Bullet separator | `—` or `-` between time and headline | Colon `:` used instead |
| Headline closes | `.**` ends the headline | Headline runs into body without `**` |
| No hex literals | No `#[0-9a-fA-F]{3,6}` in bullet body | `#00F0FF` found in body |
| No JSX | No `<div>`, `<Component>`, `</` in bullet body | JSX found in body |
| Output path | File is at `projects/structured_scripts/<name>.txt` | File saved to wrong location |

**Partial validation rule:** If Check 1 (Format) fails on any scene, skip Checks 2–8 for that scene. The file will not parse, so other checks are moot until format is fixed.

---

## Check 2 — RESEARCH (FAIL if any fail)

| What to check | Rule | FAIL condition |
|---|---|---|
| Research comment present | `<!-- RESEARCH ... -->` block at top of file | Comment block missing |
| Hook fact sourced | `Hook:` line has a citation | Hook fact has no source |
| Numbers sourced | Every stat in narration has a source in the comment | Stat appears in narration but no source in comment |
| Real quote present | Named person + verbatim quote | Quote is paraphrased or person unnamed |
| No invented numbers | All stats were found via WebSearch | A stat was written from memory without search |

---

## Check 3 — NARRATION QUALITY (WARN if any fail, FAIL if 3+ in one scene)

| What to check | Rule | FAIL/WARN |
|---|---|---|
| Pauses present | At least 1 `<pause Xs>` per scene | WARN — no pause = no visual breathing room |
| Pause after hero number | `<pause 0.3s+>` follows every key stat | WARN |
| Numbers as words | `"thirty-six percent"` not `"36%"` | FAIL — Whisper may not anchor correctly |
| Trigger phrases present | 1-4 clear anchor targets per scene | WARN if 0 clear triggers |
| Short clauses at reveals | Reveal sentences ≤ 10 words | WARN if reveal sentence > 15 words |
| Scene opens with tension | First sentence raises a question or states tension | WARN if scene opens with filler |
| No generic filler | No "So as you can see", "Moving on to", "In this section" | WARN |
| No run-on without pause | No more than 5 sentences without a `<pause>` | WARN |
| Scene narration self-contained | Scene makes sense if heard alone | WARN if scene requires prior scene to understand |

---

## Check 4 — ANIMATION BULLET QUALITY (FAIL if any fail)

### 4a — Named metaphor (per scene)
Every scene's first bullet must name a specific physical or visual object.

| FAIL | PASS |
|---|---|
| `"Show the comparison"` | `"Two parallel capsule race lanes, MAGENTA top, CYAN bottom"` |
| `"A chart appears"` | `"Three horizontal bars grow left-to-right, staggered 12 frames"` |
| `"Visual transition"` | `"[REPLACE] a named metaphor object enters, e.g. a brass scale tipping"` |

Check: does the first bullet of every scene contain a named object? FAIL if not.

### 4b — Color identity (per script)
Every entity that appears in multiple scenes must use the same color token throughout.

Steps:
1. List all entities named in Scene 1 with their assigned tokens
2. Check every subsequent scene — does the same entity use the same token?
3. FAIL if any entity changes token between scenes

| FAIL | PASS |
|---|---|
| entity A is D.cyan in S1, D.green in S4 | entity A is D.cyan in every scene |
| entity B is D.violet in S2, D.amber in S5 | entity B is D.violet in every scene |

### 4c — Quantities (per bullet)
Every bullet with repeated elements must state exact counts.

| FAIL | PASS |
|---|---|
| `"shards fly outward"` | `"30-40 irregular shards fly outward"` |
| `"some circles animate"` | `"10-15 fading circles, 16px each"` |
| `"staggered cards"` | `"three cards, staggered 12 frames each"` |
| `"several tentacles"` | `"8 tentacles"` |

Check every bullet — does every repeated element have a count? FAIL if any are missing.

### 4d — Physics intent (per animated bullet)
Every bullet with an entrance animation must name a spring intent.

| FAIL | PASS |
|---|---|
| `"card springs in"` | `"card springs in, snappy (damping 20, stiffness 200)"` |
| `"number bounces"` | `"number bounces in, bouncy spring (damping 8)"` |
| `"stamp drops"` | `"stamp drops with heavy spring (damping 12, stiffness 90, mass 2)"` |

Allowed intent words: `bouncy` / `snappy` / `heavy` / `smooth`. FAIL if none present.

### 4e — REPLACE vs ADDITIVE (per bullet)
- REPLACE bullets must have `[REPLACE]` in the headline
- REPLACE bullet body must describe a full-canvas backdrop covering prior content
- ADDITIVE bullets must NOT have `[REPLACE]`
- Every scene must have at least one REPLACE (Scene 1 always starts REPLACE — blank canvas)

| FAIL condition |
|---|
| Scene 1 bullet 1 is not REPLACE |
| REPLACE bullet body has no backdrop description |
| Two consecutive bullets both ADDITIVE when narration says "cut to new scene" |

---

## Check 5 — AUDIO ANCHOR VALIDITY (FAIL if any fail)

For every bullet's implied audio_anchor:

1. Identify the 2-4 word phrase in the bullet body that echoes a narration moment
2. Find that phrase (or its key words) in the scene's narration
3. FAIL if the phrase does not exist verbatim in the narration

| FAIL | PASS |
|---|---|
| Bullet body: `"the needle launches"` but narration has no `"needle"` | Narration: `"watch the needle"` and bullet body contains `"the needle"` |
| Bullet body echoes a phrase from a DIFFERENT scene's narration | Bullet echoes a phrase from THIS scene's narration |
| Bullet body contains generic words only (`"appears"`, `"card"`, `"shows"`) | Bullet body contains a distinctive noun or number from narration |

---

## Check 6 — BULLET DENSITY (WARN if outside range)

| Scene length | Min bullets | Max bullets |
|---|---|---|
| < 30s | 2 | 4 |
| 30s – 60s | 5 | 9 |
| 60s – 90s | 7 | 12 |
| > 90s | 9 | 14 |

WARN if below minimum (scene feels static).
WARN if above maximum (changes too fast, no absorption time).

---

## Check 7 — CANVAS FILL ESTIMATE (WARN if fail)

For each bullet, estimate: if this renders at 1920×1080, does the visual cover >40% of the canvas?

**Automatic WARN triggers:**
- Bullet describes only text with no size specified → likely renders small
- Bullet describes a centered element with no width/height → likely renders small
- Bullet has no `width * 0.N` or `height * 0.N` sizing → likely too small
- Bullet describes "a small icon" or "a caption" with no canvas footprint context

**Automatic PASS:**
- Bullet has explicit footprint: `"88% canvas width"`, `"30% canvas width each"`, `"full canvas width"`
- Bullet describes a full-canvas backdrop (REPLACE) → passes by definition
- Bullet describes side-by-side cards that together fill canvas → passes

---

## Check 8 — SCENE ARC (WARN if fail)

| What to check | Rule | WARN condition |
|---|---|---|
| Scene 1 is a hook | Opens with surprising fact, contradiction, or question | Scene 1 opens with background/context |
| Scene N is verdict + CTA | Last scene answers the hook and includes subscribe ask | Last scene ends mid-argument |
| No two adjacent scenes cover the same idea | Each scene has a distinct focus | Two scenes feel like they cover the same thing |
| Body scenes build on each other | Each scene advances the argument | Body scenes feel like an unordered list |

---

## Examples

### Validator output for a script with 2 failures

Report as a structured table plus action items:

```
SCRIPT VALIDATION — <name>.txt
Scenes: N   Estimated length: M:SS

CHECK RESULTS:
Scene | Format | Research | Narration | Bullets | Anchors | Density | Canvas | Arc
  S1  |  PASS  |   PASS   |   PASS    |  PASS   |  PASS   |  PASS   |  PASS  | PASS
  S2  |  PASS  |   PASS   |   WARN    |  FAIL   |  PASS   |  WARN   |  PASS  | PASS
  S3  |  PASS  |   PASS   |   PASS    |  PASS   |  FAIL   |  PASS   |  WARN  | PASS

FAILS (must fix before video_generation):
  S2 Bullets: Bullet 3 has no named metaphor — "Show the transition" is not a named object
  S3 Anchors: Bullet 2 anchor target "smooth" not found in S3 narration

WARNINGS (fix for production quality):
  S2 Narration: No <pause> after "eighty-six percent"
  S2 Canvas: Bullet 4 has no footprint — add width/height guidance
  S3 Canvas: Bullet 1 describes "a small badge" — specify canvas percentage

VERDICT: NOT READY — 2 FAILs must be fixed
```

Only when all checks show PASS or WARN (with fewer than 3 WARNs per scene):
```
VERDICT: READY FOR video_generation
Next: invoke /video_generation with project name <name>
```

---

## Guidelines

### Always
- Run this validator on the full `projects/structured_scripts/<name>.txt` file, not a draft
- Report results as the structured table — every scene, every check, one row per scene
- If Check 1 fails on a scene, skip Checks 2–8 for that scene
- Treat 3+ WARNINGs on one scene as a FAIL — cumulative quality issues block the build
- Include specific action items in the output — name the scene, the check, and the exact problem

### Never
- Proceed to video_generation with any unresolved FAIL
- Accept vague action items ("fix the bullets") — every FAIL must name the exact scene and bullet
- Mark a script READY if any scene has 3+ WARNINGs

### Severity reference

| Level | Meaning | Action |
|---|---|---|
| FAIL | Hard error — build will break or output will be wrong | Must fix before video_generation |
| WARN | Quality issue — build succeeds but output is degraded | Fix if time allows; 3+ on one scene = FAIL |
| PASS | Meets the standard | No action needed |
