---
name: script-validator
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

### Escalation rules — a thin script must FAIL, not pass with WARNs

WARNs are not free. A pile of them across the script means the render is weak even though
each scene "technically" parses. Apply ALL of these — any one triggers NOT READY:

- **3+ WARNs on one scene** = that scene FAILs.
- **Systemic WARN** — the SAME check WARNs on ≥ half the scenes (e.g., density low on 3 of
  5 scenes) = that check is a script-level **FAIL**, not a per-scene WARN. A flaw repeated
  everywhere is a design flaw, not a nitpick.
- **WARN budget** — 6+ total WARNs across the whole script = NOT READY, regardless of
  distribution. Fix the top offenders until under budget.
- **Required-element WARNs are FAILs** — a missing CTA (Check 8) or a missing/undocumented
  quote (Check 2) is a FAIL, not a WARN. See those checks.

"0 FAILs" is only meaningful if the WARN count is also low. Report the total WARN count
in the verdict and apply the escalation before declaring READY.

---

## Check 1 — FORMAT (FAIL if any fail)

Validates against `source_parser.py` regex. A single format error aborts the build.

| What to check | Rule | FAIL condition |
|---|---|---|
| Scene header | `## SCENE N — "Title" (M:SS – M:SS)` | Wrong case (`Scene` not `SCENE`), missing time window, colon instead of em-dash |
| Scene header single line | No line breaks inside | Header wraps to second line |
| Narration present | legacy: `### Narration` block (all content lines start `>`); pair-block: `>` line(s) inside the bullets | no narration found in EITHER form |
| Animation present | legacy: `### Animation` block; pair-block: `- **…` bullets directly under the `## SCENE` header | no bullets found |
| Format not mixed | a scene is legacy (both `###` headers) OR pair-block (neither) | one `###` header present without the other |
| Bullet start | Each bullet starts with `- **` | Bullet starts with `-` only or `*` only |
| Bullet time | `M:SS – M:SS` with en-dash or hyphen | Missing time, wrong format `MM:SS:FF` |
| Bullet separator | `—` or `-` between time and headline | Colon `:` used instead |
| Headline closes | `.**` ends the headline | Headline runs into body without `**` |
| No hex literals | No `#[0-9a-fA-F]{3,6}` in bullet body | `#00F0FF` found in body |
| No JSX | No `<div>`, `<Component>`, `</` in bullet body | JSX found in body |
| Output path | File is at `projects/structured_scripts/<name>.txt` | File saved to wrong location |

**Pair-block note:** the PREFERRED format couples narration into each bullet (no `###`
headers) — see `script-format-validation`. In pair-block, Check 5 (anchors) is stricter and
easier: each bullet's `audio_anchor` must be a verbatim substring of that **same bullet's**
`>` narration line. This co-location is what eliminates anchor drift — verify it per bullet.

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
| Quote present OR write-around documented | a named verbatim quote, OR the research comment explicitly states why none fits and what replaces it | no quote AND no documented reason → **FAIL** |

**Quote rule:** a missing quote is a **FAIL** unless the `<!-- RESEARCH SOURCES -->` block
documents the deliberate write-around (e.g., "no natural named quote for a docs-mechanics
topic; substituted a sourced contrast"). Silence ≠ acceptable. Either quote, or say why not.

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

### 4f — FACTOR-SPEC COMPLETENESS (the lint — every bullet is a complete brief)

Each bullet must NAME its production factors so video_generation isn't guessing at code
time (see `script-animation-bullets` §"Per-bullet factor spec"). Run this lint over the
structured script and report missing factors per bullet:

```python
import re
from pathlib import Path

txt = Path("projects/structured_scripts/<name>.txt").read_text(encoding="utf-8")
# split into bullets: a line starting "- **" begins a bullet; body = lines until next bullet/scene
lines = txt.splitlines()
bullets, cur = [], None
for ln in lines:
    if re.match(r"\s*-\s+\*\*", ln):
        if cur: bullets.append(cur)
        cur = {"head": ln, "body": []}
    elif ln.startswith("## SCENE") or ln.startswith("### "):
        if cur: bullets.append(cur); cur = None
    elif cur is not None:
        cur["body"].append(ln)
if cur: bullets.append(cur)

# required factor cues (case-insensitive) in head+body
def has(b, *pats):
    blob = (b["head"] + "\n" + "\n".join(b["body"])).lower()
    return any(p in blob for p in pats)

CORE = ["what-happens", "audio_anchor"]   # missing either = incomplete brief
total_missing = 0
for i, b in enumerate(bullets, 1):
    miss = []
    if not has(b, "what happens"):                         miss.append("what-happens")  # the beat sequence (the animation, as story)
    if not has(b, "text:"):                                miss.append("text")
    if not (has(b,"image:","[asset:")):                   miss.append("image")   # 'image: none' counts
    if not has(b, "audio_anchor"):                         miss.append("audio_anchor")
    core_miss = [m for m in miss if m in CORE]
    if miss:
        total_missing += 1
        sev = "FAIL-brief" if core_miss else "WARN"
        print(f"B{i}: missing {miss}  [{sev}]  {b['head'][:60]}")
print(f"\n{total_missing}/{len(bullets)} bullets missing a field")
```

| Result | Verdict |
|---|---|
| a bullet missing `text` or `image` (non-core) | **WARN** |
| a bullet missing **`what happens`** (the beat sequence) or `audio_anchor` | **FAIL** — no brief; the render will guess the animation |
| ≥ half the bullets missing a field | **systemic FAIL** — the script isn't a brief; write the beat sequences |

`image: none` and the `[REPLACE]`/ADD tag both satisfy their factor (explicit is the point).
The `text:` factor (labels/title/number) is REQUIRED, not penalized — a visual with no label
fails the deaf-viewer test. What fails is `visual:` being a text card (text AS the content);
`visual:` must name a non-text object, with `text:` labeling it. Labels yes, text-slide no.
A bullet that fully specifies its factors is what lets the `vg-code-*` recipes produce
production-grade code on the first render — incomplete briefs are the root of flat output.

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

**Systemic density FAIL:** if density is below minimum on ≥ half the scenes, the whole
video renders sparse — this is a **script-level FAIL**, not a collection of soft WARNs.
A 60–90s scene with only 3–4 bullets is under-built; bring every scene into range before
shipping. (A cold-open hook scene may sit at the low end of its band, but not below it.)

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

**FAIL (not WARN) within Check 8:** the final scene having **no CTA** (no subscribe / next-step
ask), or **not answering the Scene 1 hook**, is a structural FAIL — these are required
elements of the arc, not polish. Everything else in Check 8 stays WARN.

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
