---
name: script-scene-design-validator
description: Validation gate for the SCENE DESIGN — checks that every scene's director's brief is COMPLETE so the render has nothing to invent. Runs right after script-scene-design, before narration/beats. Verifies the global visual style, each scene's prose SCENE DESCRIPTION (6 parts), the SCENE DESIGN fields (location · reality anchor · reference assets · cinematic · layout · shot · spatial environment · attention flow · beat transitions), the 10 hard rules, and reference-asset resolution. Use to confirm a scene is buildable-by-design before writing beats. Not for animation motion (03b), narration sync, or the technical parser gate.
when_to_use: Use after script-scene-design produces the per-scene briefs, to gate that each is complete and the LLM won't have to invent the look. A scene missing the description, a real-UI reference, layout, shot, cinematic, or beat transitions is NOT READY.
model: opus
---

# Scene Design Validator — is the brief complete enough to stop guessing?

`script-scene-design` writes the director's brief. This gate confirms it's **complete** — that the
per-bullet code author will derive the scene, not invent it. A missing field is a guess waiting to
happen (generic UI, random art style, floated elements, invented cuts). Run it per scene before
narration and beats.

This is a PAPER gate on the BRIEF (not the rendered pixels — that's `vg-verification-protocol`). It
answers one question per scene: **"could two people read this brief and picture the same scene?"** If
not, it's incomplete.

## How to run
Read the whole `.txt`. Check the global blocks once, then each scene. Report a table: one row per
scene, PASS / FAIL per check, with the specific missing field as the action item.

---

## Check 0 — GLOBAL blocks (once per script)

| Check | PASS | FAIL |
|---|---|---|
| GLOBAL VISUAL STYLE present | a `<!-- GLOBAL VISUAL STYLE -->` block at the top (look · render style · texture · shape · type · palette · lighting) | missing → every scene will pick its own aesthetic → inconsistent video |
| STYLE has real DESIGN TOKENS | the PALETTE names actual **hex** values + token names (`D.cyan #22D3EE`…) AND **fonts** (display + mono) — not just role labels | "palette: cyan, violet" with no hex / no fonts → the render guesses the exact colors + typography |
| STYLE names a render style | RENDER STYLE picks ONE (flat / gradient / glassmorphic / line-art / 3D) + a shape language (radius/stroke) | vague "modern, clean" → the look drifts scene-to-scene |
| REFERENCE ASSETS manifest | if ANY scene shows real software, a `<!-- REFERENCE ASSETS -->` manifest lists each screenshot (filename · what it shows) | real-UI scene but no manifest |
| Brand logos named | every named brand/product (company logos, e.g. Cursor, Anthropic, VS Code) has a logo asset in the manifest | a brand is named on screen but no logo asset → the render fakes/omits the mark |

---

## Check 1 — SCENE DESCRIPTION (prose, per scene)

| Check | FAIL condition |
|---|---|
| Present + prose | no `<!-- SCENE DESCRIPTION -->`, or it's a task list ("show X, show Y") not a brief |
| All 6 parts | missing Environment / Situation / Viewer Realization / Emotional Journey / Visual Transformation / Final Image |
| Largest block | the description is shorter than the field block (it should be the largest — it's the source) |
| Transformation is real | Visual Transformation describes a real start→end change, not a static state |

A scene with no real description = the #1 cause of generic animation. FAIL → send to `script-scene-design`.

---

## Check 2 — SCENE DESIGN fields (per scene)

Every field must be present and concrete. FAIL any that's missing or vague:

| Field | PASS | FAIL |
|---|---|---|
| LOCATION | a concrete place; for REAL software the FULL workspace (VS Code + Claude Code docked + tree + status), not just "a terminal" | "a terminal" / "somewhere" → each model invents its own UI |
| REALITY ANCHOR | names the real system | missing |
| **REFERENCE** | real software → a concrete `[asset: img/x.png]` named (or "none (metaphor scene)") | names real UI but no asset filename + no manifest entry → the render WILL invent fake UI |
| ENVIRONMENT (spatial) | surfaces + what sits WHERE (left/right/center/above) | one word ("assembly line") with no spatial detail |
| **LAYOUT** (spatial SPEC) | exact size as **% of width×height** per element + **attachment** (floating/docked/attached-beneath) + **z-order** + the **camera projection** (front-orthographic / perspective / top-down) | only a zone label ("terminal left") with no %, no attachment, no projection → "terminal huge, tree tiny, timeline floating" guessing |
| **SHOT / FRAMING** | wide / medium / close / extreme-close named | missing → camera distance guessed |
| **VISUAL SPEC (abstract→concrete)** | every ABSTRACT element names its concrete form + color + effect ("thread = cyan cable · node = circular checkpoint · snap = red fracture") | a bare abstract noun ("a thread, a support, a node") → models render radically different scenes |
| PRIMARY FOCUS (ranked) | #1 hero (and ideally #2/#3) | "the visual" / unranked / everything equal-weight |
| **CINEMATIC INTENT** | camera + depth + light + color named | missing → flat generic vector |
| ATTENTION FLOW | an eye path with as many steps as beats | missing / fewer steps than beats |
| ENTRY / EXIT / NEXT HOOK | how we enter, leave, and what carries over | missing the cross-scene handoff |

---

## Check 3 — Beats carry SHOT + TRANSITIONS

| Check | FAIL condition |
|---|---|
| Beat SHOT | a beat whose framing differs from the scene default doesn't say so |
| **BEAT n → n+1 TRANSITION** | any two adjacent beats with no named transition → the render invents the cut |
| Beat count fits purpose | a Reveal padded to 4+ beats, or an accumulation crammed into 1 (beat count must match SCENE PURPOSE) |

---

## Check 4 — The 10 hard rules (per scene)

Run the 10 rules from `script-scene-design`. The ALWAYS rules (1,3,4,5,8,9,10) must pass on every
scene. The CONTEXT rules (2,6,beat-count) may be intentionally broken ONLY for a dramatic Reveal —
verify the break is deliberate (SCENE PURPOSE = Reveal, metaphor = "none (dramatic)"), not an omission.

Hardest gate — the **deaf-viewer test** per scene: from the brief alone, can you answer *Where am I?
What am I looking at? What changed? Why?* If not, the brief is incomplete.

---

## Check 5 — Rhythm across the video (whole script)

Read the SCENE PURPOSE + PACE column top to bottom. FAIL (re-orchestrate) if:
- the same PURPOSE repeats back-to-back on 3+ scenes, OR
- the PACE is uniform (all medium) — the video will feel monotone regardless of per-scene quality.
(This pairs with `script-scene-structure` §"Vary the rhythm".)

---

## Output + verdict

```
SCENE-DESIGN VALIDATION — <name>
Global: STYLE ✓   ASSETS ✓

Scene │ Description │ Fields │ Beats(shot/trans) │ 10-rules │ Verdict
  S1  │   PASS      │  PASS  │      PASS          │   PASS    │ READY
  S4  │   PASS      │  FAIL  │      FAIL          │   PASS    │ NOT READY

FAILS:
  S4 Fields: LAYOUT missing — placement/size will be guessed; add a spatial map
  S4 Beats:  B2→B3 has no transition — the cut will be invented; name it

Rhythm: Hook·fast → Tension·med → Explain·med → Reveal·fast … (varied) — PASS

VERDICT: NOT READY — S4 incomplete
```

**Gate rule:** any scene with a missing required field, or the script missing the global style /
asset manifest, is **NOT READY** — fix in `script-scene-design` and re-run. Only when every scene's
brief is complete does the LLM stop inventing. Then proceed to narration + beats.

### Always
- Run per scene AFTER `script-scene-design`, BEFORE narration/beats
- Name the exact missing field as the action item (not "fix the design")
- Treat a real-UI REFERENCE with no asset filename as a FAIL (it guarantees invented UI)
- Verify a broken CONTEXT rule is a deliberate dramatic choice, not an omission

### Never
- Pass a scene whose description is a task list, or shorter than its field block
- Pass a real-software scene with no `[asset:]` + no manifest entry
- Pass adjacent beats with no named transition
- Confuse this with motion validation (03b) or the parser gate (05)
