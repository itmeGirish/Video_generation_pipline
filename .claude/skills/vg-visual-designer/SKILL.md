---
name: vg-visual-designer
description: "How per-bullet React.createElement code is authored in-session and seeded into the cache. NO subprocess to claude CLI. Use whenever authoring bullet code, seeding the cache, debugging a BLOCK RUNTIME ERROR, or any request like "author bullet code," "visual designer," "per-bullet codegen," "seed cache," "write the React code," or "DynamicBlock.""
---

# Visual Designer (per-bullet authoring + cache lookup)

`storyboard/visual_designer.py` — called from `build_video.py` Step 2 (per
rule 02 pipeline diagram). Step 3 is `ssml_compiler.py`.

**Architectural invariant:** this module does pure cache lookup. It does NOT
spawn the `claude` CLI, run LLM subprocesses, or generate code at runtime.
Re-introducing `subprocess.run`, `CLAUDE_BIN`, or any LLM call here breaks the
preflight suite.

> **Before authoring ANY bullet code, the `remotion` skill is the source of truth.**
> Read the matching remotion rule first — authoring against it is what prevents the
> Layer 1 / 1.5 verification failures in rule 23:
> - any animation → `remotion/rules/animations.md` (`useCurrentFrame()`-driven only, **no CSS transitions/animations**) + `remotion/rules/timing.md` (interpolate clamping, spring configs)
> - staggered / sequenced reveals → `remotion/rules/sequencing.md`
> - typewriter / text reveals → `remotion/rules/text-animations.md`
> - scene / REPLACE transitions → `remotion/rules/transitions.md`
> - long / user text that may overflow → `remotion/rules/measuring-text.md` (`fitText()`)
> - real images → `remotion/rules/images.md`; fonts → `remotion/rules/fonts.md`
>
> Code that violates a remotion rule will fail rule 23 verification — fix it at write
> time, not after a 25-minute render.
>
> **Author-time code recipes (copy-paste patterns per quality factor): `vg-render-code`**
> → `vg-code-animations` / `-timing` / `-sequencing` / `-transitions` / `-text` / `-images`
> / `-tokens` / `-vchecks`. Read the relevant recipe WHILE writing each bullet so it's
> production-grade by construction; the same 8 factors are scored after render by
> `vg-visual-quality`.

## EXECUTION — converting the script's "what happens" into animation (you are the animator)

The script is the **director layer**: each bullet's `what happens` is a plain beat sequence (WHAT
the viewer sees) + an `audio_anchor`/`anchor_mode`. Your job is **translation, not invention** —
turn each beat into a `Kit` composition; the physics is applied automatically. Per bullet:

1. **Timing (mechanical, already done):** the build set `framesFrom` from the bullet's
   `audio_anchor` (+ appear/through/land). Sequence the beats across `[0, durationInFrames]` —
   scaffold ~0–10%, fill ~10–60%, payoff ~80–95%; a sub-beat that names a word can sync via
   `findWord`/`findWordEnd`.
2. **Meaning → component:** for each "what happens" beat, name what it MEANS and pick the `Kit`
   component (`vg-code-artifacts` map: quantity→`Kit.BarChart`, process→`Kit.Pipeline`,
   states→`Kit.TokenGrid`, metric→`Kit.KPI`, %→`Kit.Gauge`, code→`Kit.CodePanel`,
   big-number→`Kit.BigStat`, constant→`Kit.RefCard`, header→`Kit.Title`).
3. **Fill with data:** pass THIS script's values (labels/numbers/colors). Topic-agnostic — no hardcoding.
4. **Physics is AUTOMATIC:** `Kit` + `vg-code-timing` apply the 12 animator principles
   (`spring()` organic entrances, eased `interpolate()` values, slow-in/out, arcs, anticipation,
   follow-through/settle). Do NOT hand-tune these per beat; do NOT itemize springs in code that a
   `Kit` component already handles.
5. **Continuity (evolve):** if the bullet ADDs to the scene's anchor, redraw the anchor at its
   settled state (`settled:true`) + animate only the delta (the beat's change). Don't re-enter the anchor.
6. **Restraint + verify:** only the motion the beats call for — cut anything that serves no beat
   (purpose test). Then render + frame-verify (rule 23 + `vg-visual-quality`).

The `what happens` sequence is the **interface** between script and render. Because `Kit`
encapsulates physics + polish, conversion is *"map meaning → component, fill data"* — reliable,
not bespoke. (Theory: `script_generation/references/animation_principles.md` §Division of Labor.)

## What it does

For each animation bullet, looks up `storyboard/.cache/designs/bullet-s{scene}-b{idx}-{hash16}.json`.
If found and valid, returns it as a `VisualBlock`. If not found, raises
`CacheMissError` naming the bullet body and the seed command — the build aborts
before TTS.

## Where the code comes from

The active **Claude Code session** (you, when a script is being built) authors
each bullet's React.createElement code by reading
`projects/structured_scripts/<name>.txt` directly. For each bullet:

1. Read the bullet's headline + body + the scene narration
2. Choose `audio_anchor`: 1-4 verbatim contiguous words from the scene narration
3. Write the function body — `React.createElement` only, no JSX, no imports
4. Add the entry to a JSON bundle: `{"scene": N, "bullet": M, "anchor": "...", "code": "..."}`
5. Once all bullets are authored (whole scene or whole script), seed in one call:

```bash
python storyboard/seed_bullet_cache.py projects/scripts/<name>.txt --json bundle.json
```

`seed_bullet_cache.py` mirrors `_bullet_cache_key` from `visual_designer.py`
EXACTLY (`prompt-v14-per-bullet` constant) so the cache file lands at the path
the build will look it up at.

## Output: VisualBlock

```python
@dataclass
class VisualBlock:
    code: str           # function body returning React.createElement(...)
    audio_anchor: str   # 1-4 word phrase from narration aligning with framesFrom
    time_from_sec: float
    time_to_sec: float
    source_headline: str
```

(The previous `placeholder: bool` and `placeholder_error: str` fields remain
on the dataclass for backward compatibility but are never set — the placeholder
substitution path was removed alongside the subprocess.)

## Cache (per-bullet)

Cache key (must match `seed_bullet_cache._bullet_cache_key`):

```
sha256(
  scene_narration
  + f"{bullet_idx}|{time_from}-{time_to}"
  + f"{headline}|{body}"
  + json.dumps(design_tokens, sort_keys=True)
  + b"prompt-v14-per-bullet"
)[:16]
```

Cache file: `storyboard/.cache/designs/bullet-s{scene}-b{idx}-{hash16}.json`
Schema: `{"code": str, "audio_anchor": str, "source_headline": str}`

**Forcing a re-author of ONE bullet:** delete its cache file, edit the bundle
entry for that bullet, re-seed.
**Forcing a re-author of all bullets:** delete `storyboard/.cache/designs/`.

## Fidelity contracts (hard-fail at lookup time)

1. **Cached `code` must contain `React.createElement` or `React.Fragment`** —
   else `_validate_cached_entry` raises (cache file is corrupt; re-author).
2. **`audio_anchor` must be a verbatim contiguous-token phrase in the scene
   narration** — else raised at lookup time. Tokenization is `[a-z0-9]+` lowered.
3. **Every bullet MUST be in cache.** A single missing bullet aborts the build
   before TTS — no silent placeholder fallback.

## Scene JSON output format

After `build_video.py` step 7, blocks are written to:
`projects/<name>/scenes/<scene-id>.json` (canonical, project-owned)

A build-time mirror is synced to `remotion/public/scenes/<scene-id>.json` for
the Remotion bundler. **Never edit the build-time mirror — edit the canonical.**

```json
[
  {
    "framesFrom": <int>,
    "framesTo": <int>,
    "code": "<JS function body returning React.createElement(...)>",
    "audio_anchor": "<verbatim phrase from narration>",
    "source_headline": "<bullet headline for debug/QA>"
  },
  ...
]
```

## Additive-layering contract (CRITICAL — read before authoring)

**Each bullet's `<Sequence>` extends from its `framesFrom` to the end of the
scene** (set in `UniversalScene.tsx`). Blocks STACK visually in array order:
bullet 1 keeps rendering while bullet 2 paints ON TOP, then bullet 3 on top of
that, and so on.

This matches how scripts naturally describe a scene:

> "Two scorecards slide in" → "ACT benchmark rows fill" → "REASON benchmark rows fill"
> The script intends the rows to appear INSIDE the cards drawn by bullet 1.

Without additive layering, each bullet would have to redraw every persistent
element from prior bullets — easy to forget, brittle, and produces
mid-scene "the cards disappeared" bugs.

### What every bullet must do under additive layering

- **Default (additive)**: just draw your own delta. The previous bullets'
  visuals are still on screen underneath; you stack on top.
- **Replace (whole-canvas transition)**: when the bullet's intent is "the
  scene transitions to a new metaphor and the prior visuals should disappear"
  (e.g. cards fade out → new card materializes), the FIRST element your code
  returns must be an opaque backdrop fading in over a short window (≤10
  frames, ≤333ms). Under additive layering, the prior bullet's `<Sequence>`
  is still rendering during the fade, so the only thing hiding it is your
  backdrop's opacity.
  ```js
  React.createElement(AbsoluteFill, {
    style: {
      backgroundColor: D.bg,
      opacity: interpolate(frame, [0, 10], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})
    }
  }),
  ```
  Then your new content renders on top of that backdrop, hiding earlier blocks.

  **MUST use `AbsoluteFill`, not a hand-rolled `<div position:absolute inset:0>`.**
  The div approach empirically leaks prior bullets' content through under
  additive layering — verified 2026-05-07 on `difference_txt` scene 1 where
  b4's diagonal routing paths bled through outside b5's curriculum card
  through frame 540 (68 frames into b5, well past the opacity ramp).
  AbsoluteFill is a Remotion runtime binding (in `DynamicBlock.tsx`
  `RUNTIME_KEYS`) that expands to explicit per-side coordinates plus
  width/height 100% — the only reliable full-coverage primitive. Same applies
  to any wrapper around the bullet's main content (e.g. `__mainWrap` opacity
  fade-in container in `build_bundle.py`).
- **Partial replace (some elements stay, others fade)**: paint an
  `AbsoluteFill` with partial opacity (`backgroundColor: D.bg + 'cc'`) —
  earlier blocks ghost through.

### When to use each mode

| Bullet intent in script | Mode |
|---|---|
| "X slides in" / "Y appears below X" / "Z fills inside X" | **Additive** (default) |
| "X fades, Y materializes" / "Cut to Z" / "New scene begins" | **Replace** (paint backdrop first) |
| "X shrinks to corner, Y builds at center" | **Additive** — re-author X at smaller scale, then add Y |
| "USE THIS FOR card slides in from below" | **Additive** if prior content is small/contained, **Replace** if it dominates the screen |

---

## CONTENT-FIRST AUTHORING (read before writing a single line of code)

> **ALL visual content comes from the script bullet — never from rule 21 examples.**
> Rule 21 code skeletons use ALL_CAPS placeholders (`SCRIPT_VALUE`, `SCRIPT_LABEL`, `ROWS`, `STEPS`, `QUOTE_TEXT`, etc.).
> Every placeholder must be replaced with the actual value from the current script's bullet body and narration.
> Leaving an example value in the code means the wrong content plays in the video.

Before writing any React code, answer these two questions IN ORDER. Do not skip to code until both are answered.

**Q1. What must the viewer UNDERSTAND from this bullet — in one sentence?**
Write it out, using the actual content from the script (not a generic example). If you can't state it, the animation will be random.

**Q2. What is the SIMPLEST visual that PROVES that understanding — without audio?**
If a viewer saw only the screen (no narration), would they get the point? If the answer is "no, they'd just see something dramatic," you have the wrong visual.

### Content-type → visual-type map

Pick the template that matches the bullet's content. DO NOT invent a visual type not in this list unless the script body explicitly describes a bespoke animation.

| Content type | Correct visual | Wrong visual |
|---|---|---|
| Single statistic (N%, $N, Nx) | Large number centered with label + ONE comparison bar OR spark ring showing scale | Screen shattering, explosion, dramatic reveal |
| Quote / testimonial | Clean quote card: big italic text + attribution line below. No UI chrome. | Fake chat interface, typing into an input box |
| Ranked comparison (A vs B vs C) | Bar chart or side-by-side cards with labeled values | Abstract motion, orbiting circles |
| Step-by-step process | Numbered steps appearing in sequence, left-to-right or top-down | Random icon burst |
| Before / after | Horizontal split: left=before, right=after, divider line animates in | Overlapping fades with no structure |
| Timeline | Horizontal spine with labeled nodes appearing in order | Floating cards with no spatial relationship |
| Concept definition | Term large at top, definition body below, key word highlighted | Decorative background animation |
| List of items | Staggered bullet rows sliding in from left, one per narration beat | All items appearing at once |
| Benchmark / test score | Score prominently displayed + context row showing where it ranks | Arbitrary gauge or meter |
| Abstract metaphor | Only use if the script bullet body EXPLICITLY names the metaphor and its visual form | Never invent a metaphor not in the script |

### Animation intent rule

Every animation must serve the understanding stated in Q1. Ask: "does this motion help the viewer grasp the point, or does it just look impressive?"

**Permitted:**
- Elements entering to draw attention to new information
- Bars growing to show magnitude
- Numbers counting up to show scale
- Steps appearing in sequence to show order
- Highlights / color changes to show comparison

**Prohibited unless the script body EXPLICITLY requests it:**
- Screen breaking, shattering, cracking
- Explosion, burst, shards flying outward
- Words assembling from scattered random positions
- Spinning / orbiting elements with no data meaning
- Heartbeat / pulsing rings with no data meaning
- Dramatic zoom-out or zoom-in not tied to revealing new information

### Required structural elements (every scene)

**Bullet 1 of every scene** must include a scene indicator in the top-left:
```js
React.createElement('div', {style:{
  position:'absolute',
  top: Math.round(height * 0.03),
  left: Math.round(width * 0.03),
  color: D.text_dim,
  fontFamily: D.font_mono,
  fontSize: Math.round(width * 0.008),
  opacity: 0.6,
}}, `S${SCENE_NUM}`)
```
Replace `SCENE_NUM` with the actual scene number (1, 2, 3...).

### Self-check before seeding

Before calling `seed_bullet_cache.py`, verify each bullet's code passes ALL of these:

**Static checks (grep the bundle JSON):**
- [ ] No bare hex color literals (no `#[0-9a-fA-F]` strings — only D.* tokens)
- [ ] No `transition:` or `animation:` in any style object (use interpolate/spring)
- [ ] No JSX (`<div>`, `<Component>`, `</` tags)
- [ ] No `import` or `require` statements
- [ ] No `position: 'absolute'` inside a flex/grid content block (only on outermost wrappers)
- [ ] Every REPLACE bullet's return root is `React.createElement(AbsoluteFill, {style:{backgroundColor:D.bg}}, …)`
- [ ] Every scene's bullet 1 contains the scene indicator

**Runtime check (after seeding, before render):**
```bash
python -m storyboard.layout_validator <project_name>
```
Fix ALL violations before running the render. A `extract_error` violation means the bullet threw a JS exception — that bullet will show "BLOCK COMPILE ERROR" in the video. Finding it after a 25-minute render wastes the full run.

**Authoring checklist:**
- [ ] Q1 answer written (what must viewer understand?)
- [ ] Q2 answer written (what visual proves it without audio?)
- [ ] Visual type matches the content-type map above
- [ ] No prohibited animation patterns
- [ ] Bullet 1 has scene indicator (or non-bullet-1 has it removed)

---

### Authoring checklist (per bullet)

1. Read the bullet body — is it ADDITIVE or REPLACE?
2. If REPLACE, your first element is an opaque (or fading) backdrop covering the canvas.
3. Use `interpolate(frame, [0, ...], ...)` with `extrapolateRight:'clamp'`
   so entrance animations resolve and HOLD through end of scene (they'll
   keep rendering long after `durationInFrames`).
4. Avoid time-based math that escalates indefinitely (`frame * 10` will
   eventually run off-screen). Prefer clamped interpolations or
   bounded oscillations (`Math.sin(frame * 0.05)`).
5. **Animations MUST finish well before the next bullet's start.** Each
   bullet's `[framesFrom, framesTo)` is set by the audio_anchor system —
   it locks visuals to where the anchor word lands in the TTS output, NOT
   to the M:SS times you wrote in the structured script. The actual window
   can be much shorter than you expect (often 30–90 frames between two
   anchors a few words apart in the narration). If the next bullet is
   REPLACE, its backdrop fades in from `framesTo` and hides yours. So
   author every animation to complete in roughly 50% of the bullet's
   nominal window — anything longer risks getting truncated by the next
   bullet's REPLACE backdrop. The build log shows the actual computed
   ranges (`[anchor] X-Yf  <headline>`); compare the budget against your
   spring/typewriter durations BEFORE submitting the bundle.

### Why this design

The previous architecture played each block in its own `[framesFrom, framesTo)`
window with no overlap — when block N+1 started, block N's visuals vanished.
That meant every author had to redraw cumulative state in every bullet, which
was brittle (one missing redraw → an entire 5-second hold of empty cards in
the middle of a scene). The additive-stack design pushes the responsibility
to the renderer so authors can express the script's intent directly.

## Runtime contract for the LLM-emitted `code`

The function body runs every frame inside a Remotion `<Sequence>`. These
bindings are in scope (LLM is told NOT to import anything):

| Binding | Type | Source |
|---|---|---|
| `React` | namespace | use `React.createElement` and `React.Fragment` ONLY (no JSX) |
| `frame` | number | block-relative current frame, 0..durationInFrames-1 |
| `fps` | number | from `useVideoConfig()` |
| `width, height` | number | from `useVideoConfig()` |
| `durationInFrames` | number | THIS block's duration |
| `interpolate` | function | Remotion `interpolate(frame, range, output, options)` |
| `spring` | function | Remotion `spring({frame, fps, config})` |
| `Easing` | object | Remotion easing curves — `Easing.in / out / inOut`, `Easing.quad / sin / exp / circle`, `Easing.bezier(...)`. Pass via `interpolate` `options.easing`. |
| `AbsoluteFill, Sequence, Series` | components | Remotion containers |
| `Img` | component | Remotion `<Img>` — preferred over native `<img>`; handles asset loading and avoids race-condition flicker. |
| `staticFile` | function | `staticFile('logo.png')` → URL for files under `projects/<name>/public/`. Use for any logo / screenshot / SVG referenced by a bullet body. See rule 17. |
| `D` | object | design tokens (D.bg, D.cyan, D.amber, etc. — keys come from config.yaml `design:`) |
| `resolveColor` | function | (name) => hex; resolves `"cyan"` → D.cyan |
| `fitText` | function | `@remotion/layout-utils` — auto-shrink text to fit width. **Only correct for `D.font_display` / `D.font_mono` (Root.tsx awaits these); other font families silently fall back and measure wrong.** |
| `measureText` | function | `@remotion/layout-utils` — measured `{ width, height }` for layout math. Same font-load constraint as `fitText`. |
| `captions` | array | Whisper word timestamps for THIS scene: `[{ word, start_seconds, end_seconds }, …]`. Use for sub-bullet word-level sync (e.g. flash an icon when its matching word is spoken). Tokenizing/matching follows the same `[a-z0-9]+` lowered rule as audio_anchor (rule 04 contract #2). |
| `findWord` | function | `(text, nth?=0) => frame \| null` — returns the BULLET-relative frame number where the Nth occurrence of `text` begins in `captions`, or `null` if Whisper didn't transcribe that word. Always null-coalesce to a fallback so the bullet still renders if a word is missing. Multi-token `text` (e.g. `"fact-checks"`) is treated as a contiguous token sequence. |

Forbidden inside `code`:
- JSX (no Babel at runtime)
- Imports / require / top-level await
- Hex color literals (must use D.* tokens)
- CSS keyframes / `animation:` / `transition:` (won't animate during render)
- Class names / external CSS
- **Inner `position: 'absolute'`** — siblings inside a card body, total row,
  icon row, or any content container MUST be laid out with
  `display: 'flex'` or `display: 'grid'`. Hand-computed pixel offsets between
  text-bearing siblings are the root cause of every observed layout collision
  (stamp covers total, label clips header, hero overflows). See rule 19 § 0.
  Outer-wrapper / section-wrapper / animation transforms / REPLACE backdrops
  may still use `position:'absolute'`.

## How `framesFrom/framesTo` are computed (Step 7)

```python
# Whisper says: word "eighty-six" starts at scene-relative 4.87s
anchor_frame = round(scene_words[idx]["start"] * FPS)   # NOT int() — round() avoids drift

# Then Step 7 enforces: monotonic order + first block at 0 + MIN_BLOCK_FRAMES min spacing
```

`framesFrom/framesTo` are LOCAL to the scene (always start from 0 at scene
start). This matches how `<Sequence from={framesFrom}>` works inside Remotion.

## Improving authored-code quality

If a bullet renders shallow/generic, the fix is almost never "use a different model" —
it's "make the bullet body more concrete":

1. Edit `projects/structured_scripts/<name>.txt` so this bullet's body names specific
   elements, counts, colors, positions, animations. Vague body (`the reveal`) →
   generic visual; concrete body (`8 cyan tentacles spring out from center, each
   with a tool icon at the tip`) → bespoke visual.
2. Re-author this bullet in the active session (you), re-seed via `seed_bullet_cache.py`.
3. If you (Opus 4.7) authored a thin layout, the right answer is to re-read the bullet
   body, look for missed concrete details, and rewrite — not to switch models.

There is no rate limit to manage anymore — the pipeline is pure cache lookup.
`DESIGNER_PARALLELISM` now controls disk-read parallelism only (default 8).

## Model selection (which Claude does authoring vs. routing)

The pipeline does NOT pin a model in config — there's no subprocess to feed.
The acting Claude Code session's model is what authors each bullet:

- **Opus 4.7** — Step 2 authoring, Step 10.5 quality check, any correction rewrite.
- **Sonnet 4.6** — running `seed_bullet_cache.py`, running `build_video.py`,
  watching logs. Delegated to Sonnet via subagent (NOT a manual `/model` switch).
- **Haiku 4.5** — status polls and file-existence checks (subagent).

**Enforcement is via subagents, not discipline.** When you finish authoring bullets,
do NOT run `python storyboard/seed_bullet_cache.py` directly from the Opus session —
that pays Opus rates for command execution. Instead spawn a Sonnet subagent using:

```
Agent(
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "...",
  prompt: "..."
)
```

The recipe is in `SKILL.md` § "ENFORCEMENT". The `Agent` tool's `model` parameter
is the actual enforcement — verified working in Claude Code 2026-05 (Sonnet
billed as Sonnet, isolated context window). Manual `/model` switching is
documented as a fallback. NOTE: file-based custom subagents at
`.claude/agents/<name>.md` were tested and are NOT supported by this Claude Code
build — only the 5 builtin subagent types resolve. Stick with the inline-model
pattern on `general-purpose`.
