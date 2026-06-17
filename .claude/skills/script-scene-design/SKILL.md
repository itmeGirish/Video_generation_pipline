---
name: script-scene-design
description: Designs the VISUAL of each scene — the director's brief that stops the LLM inventing. Produces, per scene, a prose SCENE DESCRIPTION (Environment · Situation · Viewer Realization · Emotional Journey · Visual Transformation · Final Image) and a SCENE DESIGN field block (location · reality anchor · reference assets · cinematic intent · layout · shot · spatial environment · attention flow · beat transitions), plus a once-per-video GLOBAL VISUAL STYLE. Use AFTER scene structure (rule 01) and storytelling, BEFORE narration/beats. Not for the scene list/arc/loops (that's script-scene-structure) or the technical gate.
when_to_use: Use after the scene list exists and the story is set, to design how each scene LOOKS and FEELS before writing beats. Owns the director's brief, art direction, reference screenshots, camera/depth/light/color, layout, and shot framing.
model: opus
---

# Scene Design — the director's brief (what stops the LLM inventing)

The scene list (script-scene-structure) decides WHICH scenes and in what order. This skill
decides what each scene LOOKS like — the **director's brief** the per-bullet code author derives
from. Without it the render invents environment, camera, mood, hierarchy, UI, and art style →
generic AI animation. With it, the animation communicates.

**Order of work per scene: write the SCENE DESCRIPTION (prose) FIRST → fill the SCENE DESIGN
fields → (then narration + beats execute it).** Plus one GLOBAL VISUAL STYLE for the whole video.

## Contents
- The stop-the-guessing set (what this skill produces)
- 1. GLOBAL VISUAL STYLE (once, top of script)
- 2. SCENE DESCRIPTION (prose brief — the largest block)
- 3. SCENE DESIGN field block (the structured spec)
- The 10 hard rules (ALWAYS vs CONTEXT-DEPENDENT)
- Reference material + REFERENCE ASSETS (real software)
- Cinematic intent (the minute details)
- What you save (description + design blocks) — and the importance ranking

---

## The stop-the-guessing set

A scene that specifies all of these leaves the render almost nothing to invent:

| Element | Stops the LLM inventing |
|---|---|
| **GLOBAL VISUAL STYLE** | the art direction (flat/3D/neon/line-art) — picked randomly per scene otherwise |
| **SCENE DESCRIPTION** (prose) | the story / feel / scale / transformation / final image |
| **LOCATION + REALITY ANCHOR** | where we are + which real system |
| **REFERENCE ASSETS** (`[asset:]`) | the real UI (a named screenshot, not a guessed terminal) |
| **CINEMATIC** (camera/depth/light/color) | the look — generic flat vector otherwise |
| **LAYOUT** | exact placement + size |
| **SHOT / FRAMING** | camera distance (wide/medium/close) |
| **ENVIRONMENT** (spatial) | the set, concretely |
| **BEAT → BEAT transitions** | the cuts |

The only things left to the render after this are motion physics (easing/spring — its job) and
pixels (the screenshots — an asset to provide).

---

## 1. GLOBAL VISUAL STYLE — the art direction (write ONCE at the top of the script)

Define the look every scene inherits. Without it the LLM picks a different style per scene and the
video looks inconsistent. A storyboard opens with a style frame; this is its text form. Put it in a
`<!-- GLOBAL VISUAL STYLE -->` block at the TOP of the `.txt`.

```
<!-- GLOBAL VISUAL STYLE (all scenes inherit this)
  LOOK:            the aesthetic in one line ("dark technical dashboard, neon-on-charcoal" / "flat pastel vector")
  RENDER STYLE:    flat / gradient-rich / glassmorphic / line-art / 3D-ish — pick ONE, hold it
  TEXTURE:         clean / subtle grain / scanlines / none
  SHAPE LANGUAGE:  corner radius, stroke weight, fill vs outline — consistent everywhere
  TYPE:            display font + mono font; weight + scale hierarchy (hero / label / caption)
  PALETTE:         base bg + entity accent tokens (D.cyan = X, D.violet = Y …) + when to desaturate
  LIGHTING:        flat / soft glow on hero / vignette — the default mood
  REFERENCE:       1 style reference (a channel/look to match) if helpful
-->
```
**One style, held across all scenes** — that's what makes 8 scenes feel like ONE video. The
per-scene CINEMATIC INTENT is the scene's *application* of this, never a contradiction.

---

## 2. SCENE DESCRIPTION — the prose director's brief (write FIRST, the LARGEST block)

A scene description is **NOT a task list.** ❌ "Show context window. Show files." → the LLM asks
"what window? how large? terminal? camera? what should the viewer learn?" — every gap is a guess.
✅ A director's brief answers them in prose.

Write these six parts (prose, the largest block in the scene):
```
<!-- SCENE DESCRIPTION
  Environment:           where we physically are (the real software / the set)
  Situation:             what is happening, in plain story terms
  Viewer Realization:    the "oh — I didn't expect that" this scene delivers
  Emotional Journey:     X → Y → Z   (curiosity → surprise → respect)
  Visual Transformation: how the frame CHANGES start → end (small → vast, calm → chaos, one → many)
  Final Image:           the exact frame the scene ends on -->
```
*Emotional Journey* + *Visual Transformation* tell the render how the frame must change start→end;
*Final Image* is the last frame — build toward it.

---

## 3. SCENE DESIGN — the field block (derived from the description)

The structured spec. Fill every field FROM the description (they must agree). A field you can't
answer = the scene isn't designed yet.

```
<!-- SCENE DESIGN
  SCENE PURPOSE:    Hook / Explain / Reveal / Compare / Escalate / Tension / Resolution (set by script-scene-structure)
  PACE:             fast / medium / slow  (varies scene-to-scene)
  LEARNING GOAL:    the ONE thing the viewer should learn
  LOCATION:         where we are — for REAL software, name the FULL workspace, not just "a terminal":
                    e.g. "VS Code; Claude Code docked in the integrated terminal; project tree in the sidebar;
                    /status + context indicator visible". A "black void" is valid for a dramatic reveal.
  REALITY ANCHOR:   the real software/system this is based on  [REQUIRED]
  REFERENCE:        for REAL software — the asset to MATCH (see "Reference material"); "none (metaphor scene)" otherwise
  VISUAL METAPHOR:  how the concept is shown  [CONTEXT — "none (dramatic)" for a pure-impact reveal]
  ENVIRONMENT:      the set, SPATIAL + concrete (surfaces, what sits WHERE — not "assembly line" but
                    "industrial workshop, dark floor, 14 stations left→right, Skill line above station 1")
  LAYOUT:           a SPATIAL SPEC, not a zone label. Per element give: (a) exact size as % of width×height
                    ("terminal 40%w · file-tree 35%w · timeline bottom 15%h"); (b) ATTACHMENT — floating panel /
                    docked-to-<edge> / attached-beneath-<panel>; (c) Z-ORDER (what's in front). Plus the CAMERA
                    PROJECTION: front-orthographic (flat UI) / perspective / top-down. This removes the "terminal
                    huge, tree tiny, timeline floating" guessing — give the render ONE arrangement, not a vibe.
  SHOT / FRAMING:   wide / medium / close / extreme-close for the scene's key beats
  VISUAL SPEC:      for any ABSTRACT element, name its CONCRETE form + color token + effect — never a bare noun.
                    ❌ "a thread · a support · a node · a snap"   ✅ "thread = a cyan cable · support = a dashboard
                    pillar · node = a circular checkpoint · snap = a red fracture". Bare abstract nouns are exactly
                    where different models render radically different scenes — pin the form.
  OBJECTS:          the things that MOVE
  PRIMARY FOCUS:    #1 hero · #2 supporting · #3 context (ranked — not equal-weight)
  CINEMATIC INTENT: CAMERA (push-in/pull-back/parallax) · DEPTH (fg/mg/bg, focal plane) ·
                    LIGHT+MOOD (glow/vignette/gradient-never-flat) · COLOR (1 hero accent, desaturate context)
  ENTRY / INITIAL:  how we enter · how the scene begins
  ATTENTION FLOW:   the eye path (as many steps as beats)
  FINAL / EXIT:     how it ends · how it leaves
  NEXT SCENE HOOK:  the visual element that carries to the next scene (the match-cut handle) -->
```
Each beat then carries: PURPOSE · SHOT (if it changes) · VISUAL ACTION · STATE CHANGE · TEXT, and a
**BEAT n → n+1 TRANSITION** (match-cut on X / crossfade / dock / hard cut / morph) so the render
never invents the cut.

---

## The 10 hard rules — ALWAYS vs CONTEXT-DEPENDENT

**Rules 1, 3, 4, 5, 8, 9, 10 are ALWAYS. Rules 2, 6, beat-count are CONTEXT-DEPENDENT** — an Explain
obeys them; a dramatic Reveal may break them (forcing them on every scene = robotic, same-shaped video).

1. Every scene has a **LOCATION** (a black void counts).  [ALWAYS]
2. Every EXPLANATORY scene has a **VISUAL METAPHOR** — a Reveal may have none ("none (dramatic)").  [CONTEXT]
3. Every **beat** contains a **STATE CHANGE** (start ≠ end).  [ALWAYS]
4. **Animation explains first, narration supports.**  [ALWAYS]
5. Understandable **70–80% MUTED**.  [ALWAYS]
6. **No floating objects** without environmental context — UNLESS a deliberate dramatic reveal (black + one number).  [CONTEXT]
7. **On-screen text = a 2–5-word headline + a few labels / numbers** — never a paragraph or full sentence.
8. **Every beat→beat transition is named** (the render doesn't invent the cut).  [ALWAYS]
9. Every scene answers, without narration: **Where am I? What am I looking at? What changed? Why?**  [ALWAYS]
10. **If an animation could be replaced by text, redesign it** — the picture carries the meaning.  [ALWAYS]

**Beat count = 1–7 by NEED, never a quota.** A Reveal may be ONE bare beat ("black → 58/100 → done");
an accumulation may be seven. Padding to a number is the #1 cause of robotic rhythm.

---

## Reference material + REFERENCE ASSETS (software explainers)

For a video about real software, real references matter as much as the description — without them the
LLM renders a generic/fake terminal and viewers feel "AI-generated."

- **Name the actual screenshot file**, not a text note. A REFERENCE ASSETS manifest at the TOP of the
  script lists every required screenshot: filename · what it must show · must-preserve.
  ```
  <!-- REFERENCE ASSETS (place real screenshots in projects/<name>/public/img/ BEFORE render)
    claude_code_prompt.png — Claude Code prompt box: rounded input, ✻ mark, /-command menu, footer line-count
    skill_invocation.png   — terminal "Skill → script_generation" + a ⏺ Read / ⎿ result row
    scorecard_100.png      — the real /100 scorecard: 8 factor rows + a total -->
  ```
- On the bullet that shows it: `image: [asset: img/<name>.png]` (NOT `image: none`).
- **MUST PRESERVE** the real layout / spacing / typography / tool-call rows; **animate ONLY the changes.**
- **Sourcing (honest):** product UI does NOT come from auto-fetch (generic stock = reject). Real Claude
  Code / VS Code screenshots must be PROVIDED or captured. Until the file exists, build an ACCURATE
  vector from documented real details (the `✻` prompt box, `/status` for usage, `⏺`/`⎿` rows — NOT an
  invented "usage bar") — never a fake. Research the real look: `script-research` §"The REAL interface".

---

## Cinematic intent — the minute details that beat "generic"

Top explainers look better because of a STACK of small choices. Name the INTENT (the render supplies
the exact easing/spring/blur):
- **Camera tells the story** — push IN to focus, pull BACK to reveal scale, parallax for depth. Name WHY.
- **Depth, not flat** — fg/mg/bg layers; one focal plane sharp, the rest softened.
- **Light + atmosphere** — a glow on the hero, a vignette, a GRADIENT backdrop (never a flat fill).
- **Color = emotion + hierarchy** — one hero accent; desaturate the context so the hero pops.
- **Composition** — one focal point, leading lines, negative space framing it.
- **Continuity** — match-cut / carry an element / dock to a corner — one continuous world.
- **Alive, never dead** — at least one ambient motion always; frozen >3s reads as "stopped".
- **Texture & consistency** — same corner radius / stroke / type scale everywhere (inherit GLOBAL VISUAL STYLE).

Full theory: `references/animation_principles.md` (12 principles + composition) and
`references/explainer_animation_principles.md` (20 principles). This is the director's selection per scene.

---

## What you save — and the importance ranking

In the saved `.txt`, each scene opens with **`<!-- SCENE DESCRIPTION -->` then `<!-- SCENE DESIGN -->`**
(description first, the largest block), then the beats. The `<!-- … -->` comment blocks are ignored by
`source_parser.py` (they parse cleanly — see `vg-source-script-format`) and drive the per-bullet code
author (`vg-visual-designer` step 0). The whole script opens with one `<!-- GLOBAL VISUAL STYLE -->` +
a `<!-- REFERENCE ASSETS -->` manifest.

**Importance ranking (software explainers):** Scene Description 10/10 · Real Reference Images 10/10 ·
Location 9.5 · Attention Flow 9 · Cinematic Intent 9 · Animation Beats 8. The description + a real
reference, together, are what make animation feel authentic instead of AI-generated.

Validate the result with **`script-scene-design-validator`** before narration/beats.
