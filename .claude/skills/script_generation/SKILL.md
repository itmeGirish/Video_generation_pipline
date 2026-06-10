---
name: script-writer
description: Generates complete production-grade YouTube video scripts in pipeline format (narration + animation bullets) saved to `projects/structured_scripts/<name>.txt`. Collects user style preferences on first use and maintains them across sessions. Output feeds directly into the video_generation pipeline with zero reformatting.
when_to_use: Use when the user wants to write a new YouTube video script. Handles the full pre-production flow — strategy, research, scene structure, storytelling, narration, animation bullets, then validation, retention engineering, human review, content gate, and a world-class critique-and-improve pass — before handing off to video_generation for rendering.
model: opus
---

# Script Writer — Production Grade

Transforms a topic into a complete `projects/structured_scripts/<name>.txt` file
with cinematic narration and animation bullets, ready for `build_video.py` to render.

**Two inputs → one output:**
- Your style preferences (collected once, reused forever)
- The topic / title for this video
- Output: `projects/structured_scripts/<name>.txt`

---

## MANDATORY — load each step's skill (never work from memory)

This is a plugin: every step below is its own skill. **Before doing a step's work, INVOKE
that step's skill with the Skill tool** — that loads its full rules as an active skill, not
just a file you skimmed. Working from memory is exactly how rules get skipped (hook, retention,
human-review, and critique passes are the ones most often dropped). The contract:

| Step | Invoke this skill (Skill tool) |
|---|---|
| 3 — Pre-production strategy | `script-youtube-strategy` |
| 4 — Research | `script-research` |
| 5 — Scene structure | `script-scene-structure` |
| 5.5 — Story layer | `script-storytelling` |
| 6 — Narration | `script-narration` |
| 6 — Animation bullets | `script-animation-bullets` |
| 7a — Animation validator (broken?) | `script-animation-validator` |
| 7a2 — Narration-visual sync (good?) | `script-narration-visual-sync` |
| 7b — Technical validator | `script-validator` (and `script-format-validation`) |
| 7c — Retention engineering | `script-retention-engineering` |
| 7d — Human review | `script-human-review` |
| 7e — Content quality gate | `script-content-quality` |
| 7f — Critique / rebuild | `script-critique-improve` |

**Rule: if you arrive at a step without having invoked its skill this session, STOP and invoke
it first.** Do not paraphrase a step's rules from memory — load the skill and follow it.

---

## Workflow

### Step 1 — Check preferences

```bash
python3 .claude/skills/script_generation/scripts/script_db.py is_initialized
```

If `false` → collect preferences (Step 2).
If `true` → load preferences, skip to Step 3.

---

### Step 2 — Collect preferences (first use only)

Ask the user for each of these once. Save them. Never ask again unless the user asks to update.

| Preference | Options |
|---|---|
| **Tone** | Analytical / Dramatic / Educational / Story-driven / Casual |
| **Audience** | Beginner / Intermediate / Expert |
| **Hook style** | Bold statement / Contradiction / Question / Number reveal |
| **Sentence style** | Short punchy / Medium balanced / Long flowing |
| **Use of humor** | Yes / Sparingly / No |
| **Personal stories** | Frequently / Occasionally / Rarely |
| **Video length default** | Short 3-5 min / Medium 8-12 min / Long 15-20 min |
| **CTA preference** | Direct / Soft / Minimal |
| **Channel niche** | (free text — e.g. "AI tools", "developer productivity") |

Save using:
```bash
python3 .claude/skills/script_generation/scripts/script_db.py save_preferences '<json>'
```

---

### Step 3 — Pre-production strategy → first **invoke the `script-youtube-strategy` skill**

Before researching or writing, establish the 5 strategic foundations:

1. **Title** — write the final title before the script. Under 60 chars. Contains a contradiction, impossible number, or "why/how/actually". Test: would you click this?
2. **Thesis** — what the video ARGUES (not just what it covers). One sentence. Takes a side.
3. **Thumbnail moment** — which scene and bullet creates the thumbnail frame. Decide now.
4. **Shareable insight** — the one thing viewers will repeat to a colleague tomorrow.
5. **Open loop map** — 4 loops: hook, planted, mid-video, pre-CTA. Map where each is raised and resolved.

Do not proceed until all 5 are written out. A weak strategy = weak video regardless of production quality.

---

### Step 4 — Research the topic → first **invoke the `script-research` skill**

**Before writing a single word of script**, use WebSearch to find:

1. **The hook fact** — the surprising, counterintuitive, or shocking thing about this topic
2. **2-3 real statistics** — spoken as words in narration (`"eighty-six percent"`, not `"86%"`)
3. **One real quote** — named person, verbatim quote, source
4. **The central metaphor** — what physical object or process this topic resembles
5. **The before/after or the race** — the contrast that proves the point

No invented numbers. Every statistic must have a source.
Write a brief research summary comment at the top of the output file (parser ignores HTML comments):

```
<!--
RESEARCH
Hook: [surprising fact] — Source: [citation]
Numbers: [stat 1] — [source]; [stat 2] — [source]
Quote: "[text]" — [Name, Role]
Metaphor: [named object chosen]
Contrast: [before vs after or entity A vs entity B]
-->
```

---

### Step 5 — Design the scene structure → first **invoke the `script-scene-structure` skill**

Map the video into scenes. Write the scene list, then proceed directly to Step 6 — no confirmation needed.

**Scene arc (required):**

```
Scene 1:      Cold open / hook        — The surprising fact or contradiction
Scene 2:      Context                 — Why this topic exists and what the stakes are
Scene 3–N-1:  Body scenes             — One idea per scene, one metaphor per scene
Scene N-1:    The turn                — The angle no other video covers
Scene N:      Verdict + CTA           — Answer the hook, decision rule, subscribe ask
```

**Scene count by length:**

| Length | Scenes | Avg scene |
|---|---|---|
| 3–5 min | 4–5 | ~50s |
| 8–12 min | 7–9 | ~75s |
| 15–20 min | 10–12 | ~90s |

One idea per scene. If a scene title needs "and" — split it into two scenes.

---

### Step 5.5 — Layer the story → first **invoke the `script-storytelling` skill**

Before writing narration, turn the scene list from a list of facts into a STORY. Apply a
narrative spine (hook/build/payoff or the story spine), connect scenes with "because of
that" not "and then", and make sure the script has stakes, conflict, and a transformation
with the viewer as the hero. A story is far more memorable and watchable than a list.

---

### Step 6 — Write each scene (PAIR-BLOCK: narration + visual coupled per beat)

Author each scene in **pair-block format** — every beat couples its narration sentence(s)
with the visual that depicts them and the anchor that fires it, all in one bullet. This is
the preferred format: it **eliminates narration↔animation sync drift**, because the anchor
must come from the bullet's OWN narration (no second block to keep in sync). The parser
auto-detects it (a scene with no `### Animation` header) and reassembles the full narration
by concatenating each bullet's `>` lines in order — TTS/Whisper/render run identically.

**Pair-block format (preferred):**
```
## SCENE N — "Title" (M:SS – M:SS)
- **M:SS – M:SS — [REPLACE if applicable] Headline.**
  > The narration sentence(s) for THIS beat. <pause 0.3s>
  Visual / animation description (motion, color tokens, position).
  audio_anchor: a 2–4 word verbatim phrase from this bullet's own `>` line
- **M:SS – M:SS — Next headline.**
  > Next narration sentence(s). <pause 0.5s>
  Visual description...
  audio_anchor: phrase from THIS bullet's narration
```
Rule: the `audio_anchor` MUST be a verbatim substring of the same bullet's `>` narration.
That co-location is the whole point — it makes the anchor check and the sentence test
trivial and drift impossible. (Legacy two-block `### Narration` / `### Animation` still
parses, but author new scripts pair-block.)

For each beat, write the narration and the visual together:

#### 6a — The narration line → **invoke the `script-narration` skill**

Write each beat's `>` narration to the user's style AND the pipeline sync rules. Crucially,
the **concatenated** narration (all `>` lines in order) must still read as continuous,
natural speech — don't fragment the prose just because beats are separate.

**Pipeline sync rules (non-negotiable regardless of style):**
- `<pause Xs>` after every hero number or key reveal
- Numbers spoken as words: `"thirty-six percent"`, not `"36%"`
- Each beat's narration contains the phrase its `audio_anchor` will use
- Short clauses before dramatic reveals, longer sentences for explanation

**Style application:** Dramatic → short punchy + longer pauses; Educational → explain-then-
reveal; Casual → conversational openers; Story-driven → entity named early.
Apply the user's hook style to Scene 1's first beat (bold statement / contradiction /
question / number reveal).

#### 6b — The visual + anchor → **invoke the `script-animation-bullets` skill**

For each beat's visual, follow it: clarity first (the motion must MEAN something — pass the
muted test), motion not bare fades, show-don't-tell (no text slides), rich/choreographed,
answer the 10-point checklist. Every beat must be one Remotion can build, and its
`audio_anchor` must be verbatim from the beat's own `>` line. (Validated in Step 7a by 03b
+ the Check-E catalog, and scored in 7a2.)

**6 techniques — every bullet must apply all that are relevant:**

**1. Named metaphor** — every scene's first bullet names a specific object:
   Not `"a comparison visual"` → `"Two parallel capsule race lanes, MAGENTA top, CYAN bottom."`

**2. Color identity** — assign tokens to entities in Scene 1, never break them:
   Every bullet that shows an entity uses its token: `D.cyan`, `D.violet`, `D.amber`, `D.red`, `D.green`

**3. Exact quantities** — numbers not adjectives:
   Not `"shards fly out"` → `"30-40 irregular shards fly outward"`

**4. Physics intent** — name one of four:
   `bouncy spring` (damping 8) / `snappy spring` (damping 20, stiffness 200) / `heavy spring` (damping 12-15, stiffness 80-100, mass 2) / `smooth reveal` (damping 200)

**5. Audio anchor target** — bullet body echoes the narration trigger phrase:
   Narration says `"watch the needle"` → bullet body contains `"needle"` → anchor picks itself

**6. Real image vs coded vector** — for a NAMED real-world thing (logo, person, place),
   reference `[asset: img/<name>.ext>]` in the body AND name the motion
   (`KEN BURNS 1.0→1.08` / `LOGO POP (bouncy damping 9)` / `PUSH-IN reveal`). Otherwise vector.
   Static image = A4 freeze fail. Build's Step 2.6 auto-fetches missing assets from Openverse
   (CC commercial-safe); pre-place by hand for named logos / specific charts. See rule 03 §7.5
   and video_generation rule 24.

**REPLACE vs ADDITIVE:**
- ADDITIVE (default): bullet adds to what's already on screen
- REPLACE: bullet wipes everything and starts fresh → mark `[REPLACE]` in headline

**Bullet density:** 6-9 bullets per 60s scene. 3-5 per 30s scene.

---

### Step 6.5 — Cut pass (CGP Grey rule)

Before validation, do one cutting pass. Tighter = higher retention every time.
CGP Grey writes 30–50 drafts. The cut IS the craft.

**For every scene, ask:**
1. Does this scene serve the thesis? (rule 07 Step 3) — if not, cut it
2. Does this scene raise a question OR answer a prior one? — if neither, cut it
3. Is there a sentence that explains what the visual already shows? — cut the sentence
4. Is there background/context the viewer already knows? — cut it
5. Does this scene have "and" in the title? — split it or cut the weaker half

**For every narration sentence, ask:**
1. Does this sentence advance the story OR trigger a visual? — if neither, cut it
2. Is this filler: "So as you can see...", "Moving on...", "Let me explain..." — cut it
3. Can this be said in fewer words with no loss of meaning? — rewrite it shorter

**Target:** remove at least 10% of sentences from the first draft.
A scene that survives the cut is a stronger scene.

**The cut test:** read the script without the scene you're considering cutting.
Does the video still make sense? Does it flow better? If yes — it was padding.

---

### Step 7 — Validate, critique, and improve until ready

Run these passes in order. Each has its own rule file. Do not skip any — every pass we
built exists to catch a different failure. Retry as many times as needed; never proceed
to Step 8 with an unresolved FAIL.

Order matters: validate the build is sound → engineer retention → judge it as a viewer →
gate the content → critique and (if weak) rebuild.

---

#### 7a — Animation validator → **invoke `script-animation-validator`**

Per scene, per bullet: does the animation MAKE SENSE, FIT the scene, read as MOTION (not
a text slide), and can Remotion actually BUILD it? Plus the "can Remotion build it" gate,
the no-full-text-scenes rule, and the Check E known-render-failure catalog. Fix failing
beats in rule 03, re-run. (03b = is it BROKEN.)

#### 7a2 — Narration-visual sync scorecard → **invoke `script-narration-visual-sync`**

Quality gate, runs right after 7a. 03b cleared "broken"; this scores "is it GOOD?" — a
10-factor /100 scorecard (narration-visual sync, muted test, cause-effect, cognitive load,
transformation, motion purpose, memorability, emotional impact) grounded in multimedia-
learning research. Any scene under **70 = NOT READY** (target ≥80); the usual fix is
**consequence visualization** (show the cost, don't state it). Fix in rule 03, re-score.

#### 7b — Technical validator → **invoke `script-validator`** (and `script-format-validation`)

Format, research, narration, bullets, anchors, density, canvas, arc. Fix every FAIL
(pipeline aborts on any FAIL) and any scene with 3+ WARNs. Re-run the fixed scenes.

#### 7c — Retention engineering → **invoke `script-retention-engineering`**

Engineer the curve: 30-second hook, pattern interrupts, re-hooks, no front-loaded payoff,
strong ending. Fix the slow points before judging it as a viewer.

#### 7d — Human script review → **invoke `script-human-review`**

Watch it as a viewer — all 9 questions: robotic+tone, generic, understand, keep-watching,
examples, why-watch/value, think/feel, makes-sense, and continuity (flow across cuts).
Any FAIL or 2+ WEAKs on a scene → send back to the owning rule, revise, re-run.

#### 7e — Content quality gate → **invoke `script-content-quality`**

All 12 tests: hook, unique angle, value, evidence, tension-resolution, "so what",
freshness, human-not-AI, not-generic, not-over-polished, the critique pass, and viewer
psychology. Verdict must be STRONG or ACCEPTABLE — fix FAIL/WEAK and re-run.

#### 7f — Critique and improve / rebuild → **invoke `script-critique-improve`**

Final senior pass: critique the script as a world-class YouTube writer from every angle,
fact-check every claim (hard gate), score the quality factor, then PATCH if strong or
REBUILD if weak at the core (< 0.6, or a broken hook/value/thesis). Loop until it clears
the bar.

---

#### Retry budget

There is no maximum retry limit. Keep validating, critiquing, and improving until every
pass is clean. After each retry, show the updated table so the user can see progress.
Never save to Step 8 while any pass is failing.

---

### Step 8 — Save to pipeline path

```
projects/structured_scripts/<project_name>.txt
```

`<project_name>` = snake_case, matches `config.yaml` `project:` field.

File must start with:
```
# <Video Title> — PRODUCTION DOCUMENT
```

Then research comment block, then scenes.

After saving, present the script for human approval:

---

**SCRIPT REVIEW — <Video Title>**

Show the user:
1. Full script (all scenes, narration + bullets)
2. Scene count + estimated total duration
3. One-line anchor summary per scene (which word fires the first visual)
4. Content quality verdict (rule 06) + critique/quality-factor result (rule 06b)

Then ask exactly this:

> "Script is ready. Does this look good to you, or would you like any changes before I render the video?"

**WAIT for explicit approval before proceeding to video_generation.**

**On user response — 3 cases:**

**Case 1 — User approves:**
User says yes / looks good / go ahead → save record to database → hand off to `video_generation`

**Case 2 — User provides a modified script:**
User pastes or describes their own version of the script.
- Apply their changes EXACTLY as given — do not second-guess, do not add your own edits
- Run the technical validator only (rule 05 — format, narration format, bullet format, anchors)
- If it PASSES → show updated script → ask for approval again
- If it FAILS → show exactly which checks failed with specific line numbers
  → Ask: "These format issues will break the pipeline. Should I fix just these technical errors and keep everything else exactly as you wrote it?"
  → If yes → fix ONLY the technical errors, nothing else → re-show → ask approval
  → If no → leave as-is and wait for user's next instruction

**Case 3 — User says script is not good, gives new direction:**
User says "rewrite scene 3", "change the hook", "make it shorter" etc.
- Apply their direction exactly
- Re-run the Step 7 passes (validate → retention → human review → content → critique/improve)
- Re-show updated script for approval
- Do NOT invoke video_generation until user explicitly approves

**One rule above all: the user's script is the user's script.**
Never rewrite content the user provided unless they ask you to.
Only fix technical format errors that would break the pipeline — and only with permission.

Save script record to database only after approval:
```bash
python3 .claude/skills/script_generation/scripts/script_db.py add_script '<json>'
```

---

## What this skill produces vs what it does not

| Produces | Does NOT produce |
|---|---|
| `projects/structured_scripts/<name>.txt` | Rendered video |
| Narration in user's preferred style | Bullet cache (`storyboard/.cache/`) |
| Animation bullets for pipeline | TTS audio |
| Format-validated, parser-ready output | Scene JSON files |

The video_generation pipeline picks up where this skill ends.

---

## Style + pipeline: how they work together

The user's style preferences control the narration voice. The pipeline rules control the animation bullets.
They do not conflict — they operate on different parts of the script.

| Script element | What controls it |
|---|---|
| Narration tone (casual/dramatic/educational) | User preferences |
| Narration sentence length | User preferences |
| Narration hook style | User preferences |
| `<pause Xs>` placement | Pipeline sync rules (non-negotiable) |
| Numbers spoken as words | Pipeline sync rules (non-negotiable) |
| Animation bullet metaphors | Cinematic rules (rule 03) |
| Color tokens | Cinematic rules (rule 03) |
| Physics intent | Cinematic rules (rule 03) |
| REPLACE/ADDITIVE | Cinematic rules (rule 03) |

---

## Cross-references

- `docs/script.md` — complete format reference with 5 worked examples
- `../script-research/SKILL.md` — finding real facts before writing
- `../script-scene-structure/SKILL.md` — scene arc and count rules
- `../script-storytelling/SKILL.md` — narrative layer: hook/build/payoff, story spine, cause-and-effect, stakes, transformation
- `../script-narration/SKILL.md` — pause placement, trigger phrases, hero numbers
- `../script-animation-bullets/SKILL.md` — clarity→motion→show-don't-tell→rich; 10-point checklist; Remotion-buildable
- `../script-animation-validator/SKILL.md` — does each beat make sense, fit the scene, read as motion, and can Remotion build it (is it BROKEN)
- `../script-narration-visual-sync/SKILL.md` — animation QUALITY scorecard (/100): narration-visual sync, cognitive load, cause-effect, transformation, consequence visualization (is it GOOD)
- `references/animation_sentence_test.md` — worked good/bad pairs for the sentence test (visual explanation vs visual noise)
- `../script-format-validation/SKILL.md` — parser format rules
- `../script-validator/SKILL.md` — technical quality gate (format, anchors, bullets, density)
- `../script-retention-engineering/SKILL.md` — keeping viewers: 30s hook, pattern interrupts, mid-video surprise, strong ending (runs after validator, before human review)
- `../script-human-review/SKILL.md` — watch it as a viewer: robotic/tone, generic, understand, why-watch, value, psychology
- `../script-content-quality/SKILL.md` — content quality gate (hook, unique angle, viewer benefit, evidence, freshness, human-not-AI, critique, psychology)
- `../script-critique-improve/SKILL.md` — world-class critique + fact-check, score, patch or rebuild
- `../script-youtube-strategy/SKILL.md` — pre-production: title, thesis, thumbnail, open loops, shareable insight

---

## Example interaction

```
User: write a script about why Kubernetes is hard

Step 1: Load preferences → dramatic tone, expert audience, bold statement hook
Step 2: (preferences already saved)
Step 3: WebSearch → find real stats, a real quote, the central metaphor
Step 4: Design scene list → show user → confirm
Step 6: Write each scene → narration first, then bullets → cut pass
Step 7: Validate + critique → 7a animation (03b), 7b technical (05), 7c retention (05a),
        7d human review (05b), 7e content gate (06, 12 tests), 7f critique/improve (06b)
Step 8: Save to projects/structured_scripts/kubernetes_hard.txt
        Report: scene count, est. length, anchor summary, content + quality-factor verdict
        Next: run video_generation skill to render
```
