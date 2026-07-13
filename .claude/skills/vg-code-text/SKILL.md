---
name: vg-code-text
description: AUTHOR-TIME code recipe for TEXT FIT in a bullet's render code — size every unbounded string with fitText/measureText so labels never wrap or clip, keep single-line labels single-line, and keep type on scale. Use BEFORE/WHILE writing a bullet's code. Pairs with the verify gate vg-quality-text-fit. Grounded in remotion measuring-text.md + the fitText/measureText bindings.
model: opus
---

# Code recipe — text that fits

**Labels are required, not banned.** Every visual needs a short title + entity labels +
any hero number (the deaf-viewer test) — animate them on. What's banned is text as the
whole beat (sentences/paragraphs/the narration typeset). Label the visual ✅; replace the
visual with text ❌. This recipe is about making those labels/numbers FIT.

## Size unbounded strings with fitText (shrink-to-fit a container)

## Check overflow / branch with measureText
> `fitText`/`measureText` are only correct with `D.font_display` / `D.font_mono` (Root.tsx
> preloads those). Any other family falls back to a default and the numbers are wrong.
> **A wrong measurement is a silent overlap** — the measured box must match the rendered box exactly:
> same fontFamily/fontSize/fontWeight/letterSpacing at measure and render; `outline` (never `border`)
> on measured boxes (border distorts the box); measured text gets `whiteSpace:'pre'`. NEVER estimate a
> text width from its fontSize by eye — only the layout engine knows where glyphs land; an estimated
> width is how a neighbor placed "just clear" collides.

## Keep single-line labels single-line

## THE HEADLINE IS NOT ON-SCREEN TEXT (the text-quota fix — added 2026-07-10)

The bullet's `headline` field is MACHINE METADATA (beat identity for logs/QA/cache) — **never draw it on
the frame.** The only words the code may render are the contract's opt-in `text` field and readings on
instruments. The habit of drawing every bullet's headline was a structural per-beat text quota — the
single biggest source of "text-rich animation." A beat that seems to NEED its headline rendered to be
understood is a beat whose WORLD isn't carrying the meaning — fix the mechanism/objects, don't caption
them (the caption is how the author games their own muted test).

## TEXT NEVER MOVES WHILE BEING READ (the reference-grade text law — added 2026-07-10)

Reading and tracking are incompatible: text in motion is text the viewer can't read. The rules
(benchmark: `feedback/learning.md` §D.3):
- **Text enters AFTER its parent settles** — fade in fully-formed (10–14f), then it is pixel-still for
  its whole readable life. Never translate/scale/tick a label the viewer is currently reading.
- **Never attach a caption/readout to a MOVING object** — a label riding a sweeping head/traveling block
  is unreadable. Put the readout at a FIXED position (its zone) and let it update by value; the mover
  stays unlabeled (its identity was named when it entered).
- **No typewriter mid-scene** — character-by-character typing is only legitimate INSIDE a terminal/console
  artifact where typing IS the content. Everywhere else text appears whole.
- **Emphasis on text = weight/size/color at entry, or a one-shot highlight pulse BEHIND it** — never
  motion of the glyphs themselves.

## Anti-patterns

## THE TYPOGRAPHY SYSTEM — retention type, not "developer text" (the #1 quality lever)

On-screen type is **visual communication, not UI labels.** A YouTube viewer does not *read* a wide
sentence — they *glance*. The job is to make the eye land on the ONE word that matters in <0.5s. The
failure mode: every caption a single, even-weight, full-width sentence — the viewer must read the whole
line to get the point, and nothing tells them what matters. That reads as *presentation slide*, not
*retention video*. Fix it with the system below. **Never pick a font size by feel — every string is one
of these 4 levels.**

> ⛔ **THE EXAMPLES BELOW ARE PLACEHOLDERS — DERIVE FROM THIS SCRIPT, NEVER COPY.** `HERO_WORD`,
> `SUPPORT_PHRASE`, `KEY_PHRASE`, and the example sizes/colors are *illustrations of the system*, not
> content to ship. Copying these strings (or another script's chunked lines) into a render is the
> copy-paste drift this skill exists to prevent — the words come from THIS bullet's narration, the
> accent from THIS scene's semantics, the size from the level ranges. Same trap as `vg-visual-map`'s
> "NO COPY-PASTE OF EXAMPLE VALUES."

### The 4 LEVELS (the only sizes — never a random px)
| Level | Role (one per beat) | Size (× w) | Font | Weight | Color |
|---|---|---|---|---|---|
| **HERO** | the ONE thing the beat lands on — a stat, a 1–2 word punch, the question | `0.060–0.110` | display | 800 | `D.text` or the semantic accent |
| **SUBHERO** | the supporting headline / scene title / the "what" line | `0.026–0.034` | display | 700 | `D.text` |
| **SUPPORT** | context, sub-lines, captions, labels | `0.014–0.018` | display | 400–600 | a LEGIBLE secondary (≥7:1) — see floor |
| **MACHINE** | LITERAL machine output ONLY — parser soup, code, OCR, terminal, raw data | `0.013–0.021` | **mono** | 400 | a LEGIBLE secondary (≥7:1) |

One HERO per beat (max). If two things are HERO, neither wins → demote one. The SCENE TITLE is a fixed
SUBHERO use (see the standard below).

### ⛔ CONTRAST FLOOR — secondary text must be DIM-BUT-LEGIBLE, never washed-out (the #1 legibility bug)
Hierarchy is made by **size + weight**, NOT by making support text so dim it's unreadable. **Every on-screen
TEXT string and every meaningful data LINE/axis must clear ≥7:1 contrast against its LOCAL background.** A
mid-grey like `#64748B` on a dark bg is **~4:1 — below WCAG AA (4.5:1)** and reads "dim / washed / amateur"
on video (compression + motion + mobile amplify it). The SUPPORT/MACHINE color must be a *legible* secondary
(e.g. a slate-400 ~`#94A3B8`, ≈7.4:1 on near-black), bright enough to read yet clearly below the white HERO so
hierarchy holds. **`D.text_dim` is allowed ONLY for purely decorative faint structure** (a dot-grid at low
opacity, a hairline border) — NEVER for meaningful text or a data line.

### TWO TIERS OF TEXT — FOCAL reads, PERIPHERAL is texture (the density-legibility system)
Dense frames stay readable because text is classified, not uniform:
- **FOCAL text** (the current container's title, readings, the labels the beat is about): full legibility —
  the ≥7:1 floor above, the size floor, counted in the scene's label budget (`contract-linter` 3g). This is
  the text the viewer is meant to READ right now.
- **PERIPHERAL text** (context instruments' micro-labels, a telemetry strip, a docked reference): a
  sanctioned TEXTURE class — rendered at reduced luminance (dimmed via opacity on a legible ink), strictly
  SLOTTED inside its container, uniform micro-mono size (≥ the V4 size floor — dimness is the tier marker,
  never tiny type), and NEVER load-bearing (nothing the beat teaches may live only in peripheral text).
  Peripheral text is exempt from the ≥7:1 floor BY DESIGN — it is context the eye can consult, not copy the
  viewer must read; when its container becomes focal, it brightens to the focal tier.
The failure both directions: peripheral text at full contrast competes with the hero (crowding); focal
text dimmed to peripheral is the washed-out bug above. Classify every string, then style by tier.

> ⛔ **CONTRAST IS PER-BACKGROUND — check the ACTUAL surface the text sits on, not just `D.bg`.** The *same*
> secondary color gives *different* contrast on different surfaces: a token tuned for the darkest `D.bg` loses
> contrast on any **lighter panel** (a `surface`/card panel, a tinted box) and can drop below the floor there
> even though it passes on the bg. The recurring trap: secondary text/mono on a `surface`-colored panel reads
> dim because `surface` is lighter than `bg`, so the gap shrinks. **For each text element, compute contrast
> against ITS panel's fill** (`(L_hi+0.05)/(L_lo+0.05)` ≥ 7). If a panel is too light for the secondary color,
> fix it one of two ways: **brighten the text** for that panel, or **darken/hollow the panel** (make the loser
> panel transparent so its text sits on the dark bg). Never assume "the token is legible" — it's only legible
> on the background it was tuned for. (Owner of the token VALUE: config + `vg-code-tokens`; the CHECK:
> `vg-quality-vchecks` V4b — which must test against the LOCAL surface, not the bg.)

### ⛔ COMPOSE FROM A SHARED SCALE — define ONCE per scene, never per-beat literals (the #1 inconsistency bug)
The 4 levels above are only consistent if the **whole scene shares ONE scale object**, not if each beat
re-types `fontSize:px(w*0.0xx)` by feel. Hand-picked sizes drift fast — a real audit found **17 distinct
font sizes in one scene** (a design system has ~5), which a viewer reads as "the text keeps changing size,
amateur." The fix is mechanical: in the scene's shared helper, define the scale + springs ONCE and have
every beat reference them — never a raw number.
- Every on-screen string → `T('level', …)` (or `fontSize:px(TYPE.level)`) — **no `fontSize:px(w*0.0xx)` literal.**
- Every entrance spring → `config:SPR.settle/pop/glide` — **no per-beat `{damping:N,stiffness:M}` hand-tuning.**
- The CARD/artifact's *internal* type may scale to the artifact (`pgW*…`); the SCREEN type (captions, headlines,
  labels) uses the shared `TYPE` scale. **A scene with >6 distinct screen font sizes or >4 spring configs has
  drifted** — collapse it. (Owner of the spring tokens: `vg-code-timing`; the CHECK: `vg-quality-text-fit`.)

### Rule 1 — CHUNK, don't sentence (break the line, stack 2–4 chunks)
A wide single line is a *scan*; stacked chunks are a *glance*. Break every multi-word caption into stacked
chunks, the key chunk at HERO/emphasis. Max ~12 chars on a HERO line, ~22 on a support line — wider → split.
❌ a full sentence on one even-weight line · ✅ the same words split into level-ranked chunks above.

### Rule 2 — EMPHASISE the key word(s) (the viewer's eye must have a target)
Within the chunks, the 1–2 words that carry the meaning get a STRONGER treatment than the rest: bigger
size, weight 800, OR the semantic accent color. Everything else stays support weight/dim. If every word is
the same weight, nothing is emphasised → the glance fails.

### Rule 3 — MONO = MACHINE ONLY (semantic discipline)
`D.font_mono` means *"this is literal machine text"* — parser output, code, OCR, a terminal, raw data. It is
NOT for general narration captions/headlines (those are `D.font_display`). Using mono for a human caption
muddies the one signal mono carries: a raw machine dump is correctly mono; the spoken-caption beside it is display.

### Rule 4 — TYPE CARRIES EMOTION (match the beat's `intensity`)
| Beat feeling | Type treatment |
|---|---|
| discovery / reveal | HERO + open `letterSpacing:0.06em`, calm fade-up |
| surprise / impact | HERO weight 800 + overshoot scale-in (the number SLAMS) |
| danger / loss | HERO in `D.red`, tight `letterSpacing:0`, hard cut |
| a question | open spacing, lighter weight, the `?` its own HERO |
| solution / payoff | confident display 700, settle (no jitter) |
Neutral type on an emotional beat is a miss — the type should *feel* like the moment.

### Rule 5 — PLACE type by its SUBJECT (kill eye-travel)
Put a label where the eye already is — next to the thing it names — not reflexively at the bottom. Reserve
the bottom band for the ONE scene-level caption. A center visual + a bottom caption forces page→caption→page
bounce; a label beside the subject does not. (Caption-zone rule still holds: nothing below `h*0.88`.)

## SCENE TITLE — ONE STANDARD across EVERY scene (typography consistency)

The scene heading MUST be identical in treatment across all scenes — a viewer should never see it
jump from a tiny mono label in one scene to a big bold title in the next (real bug: an earlier build used `mono w*0.013–0.014` while S6–S7 used `display 700 w*0.024`). The standard (matches
`vg-verification-protocol` §1.3 "Section headline"):
- **font_display, weight 700, `w*0.024`, letterSpacing `0.04em`, `D.text`, centered, `top:h*0.05`** — never
  `font_mono`, never `w*0.013/0.014`, never `text_dim`, never top-left for the TITLE.
- Full scale (use these exact sizes everywhere): title `w*0.024` · card title `w*0.015` · body `w*0.011` ·
  label `w*0.008` (floor). Subtitle (optional swapping sub-beat): `font_mono w*0.012–0.013 text_dim`.
- Dashboard scenes keep corner status chips, but the SCENE TITLE is still this centered standard.

## Before you write, confirm
- [ ] Every string is one of the **4 LEVELS** (HERO/SUBHERO/SUPPORT/MACHINE) — no random px sizes
- [ ] Multi-word captions are **CHUNKED** (stacked 2–4 lines), not one wide sentence to scan
- [ ] The key word(s) are **EMPHASISED** (size/weight 800/accent) — the glance has a target
- [ ] `D.font_mono` used ONLY for literal machine text (parser/code/OCR/data) — captions are `D.font_display`
- [ ] Type treatment matches the beat's emotion/`intensity` (Rule 4); ONE HERO per beat max
- [ ] The scene title uses the STANDARD above (display 700 w*0.024 centered) — identical every scene
- [ ] Every variable-length string is sized with `fitText` (or branched via `measureText`)
- [ ] Single-line labels use `whiteSpace:'nowrap'` and fit their container
- [ ] `fitText`/`measureText` use `D.font_display` or `D.font_mono` only
- [ ] Body ≥ w*0.009, headline ≥ w*0.022, and nothing exceeds canvas bounds
