---
name: script-writer
description: Generates complete production-grade YouTube video scripts in pipeline format (narration + animation bullets) saved to `projects/structured_scripts/<name>.txt`. Collects user style preferences on first use and maintains them across sessions. Output feeds directly into the video_generation pipeline with zero reformatting.
when_to_use: Use when the user wants to write a new YouTube video script. Handles the full pre-production flow — strategy, research, scene structure, narration, animation bullets, content quality gate, and technical validation — before handing off to video_generation for rendering.
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

### Step 3 — Pre-production strategy (read rules/07-youtube-strategy.md)

Before researching or writing, establish the 5 strategic foundations:

1. **Title** — write the final title before the script. Under 60 chars. Contains a contradiction, impossible number, or "why/how/actually". Test: would you click this?
2. **Thesis** — what the video ARGUES (not just what it covers). One sentence. Takes a side.
3. **Thumbnail moment** — which scene and bullet creates the thumbnail frame. Decide now.
4. **Shareable insight** — the one thing viewers will repeat to a colleague tomorrow.
5. **Open loop map** — 4 loops: hook, planted, mid-video, pre-CTA. Map where each is raised and resolved.

Do not proceed until all 5 are written out. A weak strategy = weak video regardless of production quality.

---

### Step 4 — Research the topic

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

### Step 5 — Design the scene structure

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

### Step 6 — Write each scene

For each scene, write in this order: **narration first, then animation bullets.**

#### 5a — Narration (apply user's tone and style preferences)

Write narration that matches the user's style preference AND follows pipeline sync rules:

**Narration format:**
```
### Narration
> First sentence. <pause 0.3s>
> Second sentence with the hero word. <pause 0.5s>
> Third sentence.
```

**Pipeline sync rules (non-negotiable regardless of style):**
- `<pause Xs>` after every hero number or key reveal
- Numbers spoken as words: `"thirty-six percent"`, not `"36%"`
- 1-4 clear trigger phrases per scene (these become audio_anchors)
- Short clauses before dramatic reveals, longer sentences for explanation

**Style application:**
- Dramatic tone → short punchy sentences, longer pauses, declarative reveals
- Educational tone → building sentences, explain-then-reveal pattern
- Casual tone → conversational openers, personal anecdotes, shorter pauses
- Story-driven → scene-setting opening, character/entity named early

Apply the user's hook style to Scene 1:
- Bold statement: opens with the shocking fact directly
- Contradiction: opens with two true things that seem to contradict
- Question: opens with the question the video answers
- Number reveal: opens with the number, then explains what it means

#### 5b — Animation bullets (apply cinematic rules)

For every bullet, answer all 8 questions from `Script_Agent/rules/03-animation-bullets.md` before writing the body.

**Bullet format:**
```
### Animation
- **M:SS – M:SS — [REPLACE if applicable] Headline.** Body.
  Continuation body text.
```

**5 techniques — every bullet must apply all that are relevant:**

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

### Step 7 — Validate and retry until PASS (read rules/06-content-quality.md FIRST, then rules/05-validator.md)

Two gates in order. Do not run gate 2 until gate 1 passes.
**Never proceed to Step 8 until BOTH gates report PASS. Retry as many times as needed.**

---

#### Gate 1 — Content quality (rules/06-content-quality.md)

6 tests: hook, unique angle, viewer benefit, evidence, tension-resolution, "so what".

**On FAIL or WEAK verdict → retry loop:**

1. List every failing test with the exact reason it failed
2. Identify the root cause: weak hook? generic angle? no evidence? no consequence sentence?
3. Rewrite only the failing parts — do not rewrite the whole script unless 3+ scenes fail
4. Re-run Gate 1
5. Repeat until verdict is STRONG or ACCEPTABLE

Do not proceed to Gate 2 until Gate 1 is STRONG or ACCEPTABLE.

---

#### Gate 2 — Technical quality (rules/05-validator.md)

8 checks: format, research, narration, bullets, anchors, density, canvas, arc.

**On any FAIL or 3+ WARNs on one scene → retry loop:**

1. List every FAIL and WARN with scene number and check name
2. Fix each FAIL first (pipeline will abort on any FAIL)
3. Fix WARNs where 3+ are on the same scene
4. Re-run Gate 2 on the fixed scenes only
5. Repeat until all checks are PASS or isolated WARNs (fewer than 3 per scene)

---

#### Retry budget

There is no maximum retry limit. Keep rewriting and re-validating until both gates pass.
After each retry, show the updated validation table so the user can see progress.
Never save to Step 8 while either gate is failing.

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
4. Content quality verdict (Gate 1 result)

Then ask exactly this:

> "Script is ready. Does this look good to you, or would you like any changes before I render the video?"

**WAIT for explicit approval before proceeding to video_generation.**

**On user response — 3 cases:**

**Case 1 — User approves:**
User says yes / looks good / go ahead → save record to database → hand off to `video_generation`

**Case 2 — User provides a modified script:**
User pastes or describes their own version of the script.
- Apply their changes EXACTLY as given — do not second-guess, do not add your own edits
- Run Gate 2 technical validation only (format, narration format, bullet format, anchors)
- If Gate 2 PASS → show updated script → ask for approval again
- If Gate 2 FAIL → show exactly which checks failed with specific line numbers
  → Ask: "These format issues will break the pipeline. Should I fix just these technical errors and keep everything else exactly as you wrote it?"
  → If yes → fix ONLY the technical errors, nothing else → re-show → ask approval
  → If no → leave as-is and wait for user's next instruction

**Case 3 — User says script is not good, gives new direction:**
User says "rewrite scene 3", "change the hook", "make it shorter" etc.
- Apply their direction exactly
- Re-run both gates (content + technical)
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
- `rules/00-research.md` — finding real facts before writing
- `rules/01-scene-structure.md` — scene arc and count rules
- `rules/02-narration.md` — pause placement, trigger phrases, hero numbers
- `rules/03-animation-bullets.md` — 8-question checklist, 5 techniques
- `rules/04-format-validation.md` — parser format rules
- `rules/05-validator.md` — technical quality gate (format, anchors, bullets, density)
- `rules/06-content-quality.md` — content quality gate (hook, unique angle, viewer benefit, evidence)
- `rules/07-youtube-strategy.md` — pre-production: title, thesis, thumbnail, open loops, shareable insight
- `rules/08-retention-engineering.md` — keeping viewers: 30s hook, pattern interrupts, mid-video surprise, strong ending

---

## Example interaction

```
User: write a script about why Kubernetes is hard

Step 1: Load preferences → dramatic tone, expert audience, bold statement hook
Step 2: (preferences already saved)
Step 3: WebSearch → find real stats, a real quote, the central metaphor
Step 4: Design scene list → show user → confirm
Step 5: Write each scene → narration first, then bullets
Step 6: Validate format
Step 7: Save to projects/structured_scripts/kubernetes_hard.txt
        Report: 8 scenes, ~10 min, anchor summary per scene
        Next: run video_generation skill to render
```
