# Generic explainer-video principles — with how video 1 designed them (and video 2 didn't)

Universal craft principles for any explainer video. Extracted 2026-07-08 from a full end-to-end
watch of **video 1** (`documents/videoplayback.webm`, 31-min professional LLM-inference explainer)
vs **video 2** (`projects/pixel_rag/out/pixel_rag_UPLOAD_final.mp4`, 5:45 pipeline output).
Each principle: the generic rule → the concrete DESIGN technique video 1 used to achieve it →
what video 2 did instead. `feedback/lessons.md` holds the overall verdict.

---

## 1. The world runs; it is never posed

A scene is a system in operation, not a sequence of still arrangements. A beat changes the
system's state; it never pauses the world.
- **How video 1 designed it:** a persistent telemetry ticker (TPS · TTFT · TPOT · UTIL · BW)
  renders live under entire chapters; request packets animate through the routing/scheduler stack;
  money and token counters climb ($462B → $700B, 21.60T tokens/day); even "holds" are the machine
  idling with ambient motion.
- **Missing in video 2:** cards appear and then freeze — the "$29 AI ANSWER" card sat unchanged
  for ~1 minute; 10–15s near-identical holds between beats.

## 2. Derive numbers on screen; never assert them

An asserted stat is trivia the viewer must trust; a derived one is understanding the viewer owns.
- **How video 1 designed it:** the operands are placed on screen and visibly combined:
  `100 billion ops ÷ 10¹⁵ ops/s ≈ 0.1 ms` builds line by line; the ridge point is computed as an
  annotation ON the chart (`989 / 3.35 = 295 ops/byte`); the decode ceiling is derived under the
  diagram (`3.35 TB/s ÷ 140 GB = 24 tokens/sec`).
- **Missing in video 2:** "+18.1%", "257.5 KB/page", "129×" appear as finished chips; only
  `257.5 KB × 10,000 pages = 2.6 GB` was derived in view.

## 3. Let instruments tell the story

Give the world gauges and let them move; the viewer reads the claim off a live instrument instead
of being told.
- **How video 1 designed it:** a docked CHIP UTILIZATION panel (tensor-cores %, HBM-bandwidth bar,
  and a text `diagnosis:` line) re-diagnoses the SAME scene as the workload switches — prefill:
  tensor cores 95%, "compute-bound"; decode: tensor cores 1%, bus "saturated, flooding",
  "memory-bound". A live-TTFT-samples window scores requests red/blue against a target line.
- **Missing in video 2:** one static scoreboard (81.3 vs 67.0); no instrument ever observes the
  world while it runs.

## 4. Compare by changing the state of ONE object

Keep the object and framing constant; change only its state. Two states of one body are felt;
two side-by-side cards are read.
- **How video 1 designed it:** the identical compute-floor diagram is shown twice in the same
  framing — fully lit under PREFILL ("all tokens processed simultaneously") vs a single lone dot
  under DECODE ("sequential, one at a time"). The thesis of the whole video is that one contrast.
- **Missing in video 2:** the contest is drawn as different objects — a green bar vs a red bar,
  a PARSE card vs a PHOTOGRAPH card — never the same body in two states.

## 5. Pin hard-won context to the frame

Definitions and results that are still load-bearing dock small at the frame edge and persist;
the video remembers so the viewer doesn't have to.
- **How video 1 designed it:** after "arithmetic intensity = ops / bytes moved" is introduced, a
  small REFERENCE card stays docked top-right for the rest of the chapter; the ridge point stays
  annotated while prefill and decode are plotted against it; the NVIDIA H100 spec card persists
  beside the roofline.
- **Missing in video 2:** every concept vanishes when its beat ends; nothing introduced earlier
  is visible when later beats depend on it.

## 6. Stage the felt experience before the abstraction

Make the viewer live the problem, then name it — the term then labels a feeling they just had.
- **How video 1 designed it:** before defining TTFT/TPOT it stages a real chat session UI: the
  prompt sent → a `waiting · 0.3s` spinner → the reply streaming in. The whole video opens on
  watching an AI type, one token every 30 ms, under a ticking ruler.
- **Missing in video 2:** it opens on the concept's artifacts (a pricing card, an answer chip);
  the human moment — asking and being wrongly answered — is implied, never staged as an experience.

## 7. Causality is a path the eye can travel

Draw cause and effect as one wired mechanism; watch costs accumulate step by step. If the
mechanism happens between two frames, it didn't happen for the viewer.
- **How video 1 designed it:** HBM → memory bus → layer-weights tile → compute floor are one
  connected machine, so decode starvation is SEEN (bus saturated, arithmetic units dark); the
  KV-recompute pyramid grows row by row with red work-per-token bars accumulating to
  "21 redone K,V … by token 1000, one token redoes 999 prior calculations."
- **Missing in video 2:** strong before/after states (binding intact → dissolved) but the causal
  middle is usually a cut, not a visible mechanism.

## 8. Color is a semantic system, not decoration

Every recurring concept owns a color for the entire video; meaning is readable from color alone.
- **How video 1 designed it:** cyan = prefill/compute, orange = decode/memory/weights,
  red = cost/waste/failure, purple = KV cache — held rigidly for 31 minutes across every diagram,
  chart, panel, and title. The compute-vs-bandwidth divergence chart, the roofline bands, and the
  recap all reuse the same assignments.
- **Missing in video 2:** red = parse/wrong, green = photograph/win is a start, but the system
  stops there — most objects are neutral, so color rarely answers "what am I looking at."

## 9. Make scale visceral, not stated

Any magnitude that matters gets an area/count/fill comparison the eye can measure directly.
- **How video 1 designed it:** "~300× wasted" is a vast grid with only a few lit cells; "every
  forward pass pulls all 140 GB" is watched transferring (`0/140 → 137/140 GB`) across the bus;
  KV-cache growth fills racks 320 MB → 3.2 GB → 32 GB until one conversation visibly rivals the
  model's own weights.
- **Missing in video 2:** one good instance (the 2.6 GB tile-grid dwarfing the 20 MB chip) — the
  exception, not the method.

## 10. Promise → chapters → callback → recap

Open a question the video owes an answer to; mark acts; call the question back; close by
answering it in its own words.
- **How video 1 designed it:** poses "where does the time go?" as THE CENTRAL QUESTION card,
  promises the payoff ("we'll know exactly where the time goes"), marks acts with title cards
  (THE MEMORY WALL) and defocus transitions, calls the question back mid-video, and closes with an
  episode recap plus a "rest of the series" map of 8 chapter cards.
- **Partially present in video 2:** the five-stops roadmap is set up and paid off with green
  checks (good) — but no central question is posed, called back, or answered verbatim, and there
  is no recap.

## 11. The first frame is already the story

No dead open: frame one shows the world in motion. Hook CONCEPT and hook EXECUTION are judged
separately — a strong concept delivered late is a dead hook.
- **How video 1 designed it:** frame one is the reply already streaming token-by-token under the
  ticking "one token every 30 ms" ruler — subject, motion, and question present at second zero.
- **Missing in video 2:** ~4 seconds of blank cream before the title fades in; the (stronger)
  hook concept — a confident wrong answer — lands ~25 seconds in.

## 12. Density by area; one growing diagram over many swapped cards

Fill the canvas with the world, and grow one picture across beats so the eye never re-orients and
each addition inherits all prior context.
- **How video 1 designed it:** full-frame structured dashboards throughout; the roofline chart is
  built over ~4 minutes — axes → compute ceiling → bandwidth slope → ridge point → prefill plotted
  → decode plotted → memory/compute-bound bands — one diagram, annotation by annotation.
- **Missing in video 2:** lone small cards float in a large empty canvas ("Three plans, three
  prices" at ~25% width; "The rule" as a bare title on a void), and beats mostly swap discrete
  cards instead of growing one picture.

---

**Already at reference level in video 2 (keep):** the recurring protagonist object (the pricing
card travels every scene) · the contest shown with a visible loser · the honest cost of the
winning approach · closing on a decision rule.

---

## Where each principle lives in the skills (wired 2026-07-08 — the skills are the enforcement)

This file is the observation log; the RULES live in the owner skills below (single ownership — if a
principle needs refining, edit the OWNER, then note it here). All wording in the skills is generic /
topic-agnostic so every future video inherits it.

| # | Principle | Owner skill (the enforcement) |
|---|---|---|
| 1 | World runs, never posed | `vg-code-animations` (hold-alive, §SPOTLIGHT-DIM) + `vg-quality-animations` §STALE-ELEMENT FAIL (per-element staleness across beats — **added**) |
| 2 | Derive numbers, don't assert | `explainer_animation_principles.md` principle 21 + scorecard (**added**) · `vg-code-artifacts` Rules "a load-bearing number is DERIVED" (**added**; mechanism: `Kit.FormulaChips`/`Counter`/`StackedLedger`, motion-bank P10) |
| 3 | Instruments tell the story | `vg-code-artifacts` Rules "an instrument RE-DIAGNOSES, or it's decoration" (**added**; components: `Kit.Gauge/MeterBar/RefCard`) |
| 4 | Compare states of ONE object | `idiom-library-engine` comparison idiom — same-object-two-states is the DEFAULT (**changed**) · `explainer_animation_principles.md` #11 (**strengthened**) |
| 5 | Pin hard-won context | `vg-code-composition` `Kit.RefCard` + cross-bullet carryover (already owned) |
| 6 | Felt experience first | `narrative-architect` concrete-before-abstract · `visual-story-engine` discovery-led (already owned) |
| 7 | Causality is a path | `explainer_animation_principles.md` #2 + Cause→Effect→Cost formula (already owned) |
| 8 | Semantic color system | `visual-style-engine` immutable entity→accent-token map (already owned) |
| 9 | Visceral scale | `explainer_animation_principles.md` #12/#13 + grid-of-units pattern (already owned) |
| 10 | Promise → chapters → callback → recap | `angle-engine` open loops/re-hook (owned) + `narrative-architect` `close` block: verbatim promise answer + recap beat (**added**) |
| 11 | First frame is the story | `video-narrative-editor` HOOK gate (owned) + `vg-code-sequencing` §FRAME ONE no-dead-open author rule (**added**) |
| 12 | Density + one growing diagram | dense-by-area (`vg-quality-animations` canvas-fill) + `sparse_canvas` validator + EVOLVE-zones (`vg-code-transitions` §B) (already owned) |

**Second pass (2026-07-08, the three honest gaps + reference-Remotion patterns):**
- **Enforcement no longer memory-dependent:** `authoring_gate.sh` now auto-injects rules ⑪–⑮ (frame-one
  populated · derive numbers · instruments re-diagnose · no stale element · same-object comparison) on
  every bullet-code edit.
- **STALE-ELEMENT is mechanical:** `vg-quality-animations` §STALE-ELEMENT carries an ffmpeg element-box
  SSIM recipe across beat boundaries (like SUBJECT-MOVED) — run, not eyeballed.
- **Reference-grade Remotion patterns encoded** (what the reference's craft had that no skill named):
  `vg-code-composition` §7b CHAPTER ANCHOR (one diagram = the set across consecutive scenes) ·
  `vg-code-composition` §1–4 HUD/telemetry strip (a wired, always-on instrument band) ·
  `vg-code-motion-bank` P12 stream/type-on-as-the-subject. The rest of the reference's camera/optics
  craft (rack-focus, DOF, macro-zoom, layered bloom, parallax, grain/light/material, particle+light rigs)
  was ALREADY documented in `vg-remotion-engineering` + `vg-code-composition` §8–8d — that gap is usage,
  not capability.
- **Still open (cannot be fixed by skill text):** the vision-model QA gate (judged → fully mechanical
  scoring) remains the top roadmap item; 3D (`ThreeCanvas`) remains blocked by the known render bug;
  taste/ceiling converges over gate-feedback iterations, not in one pass.

## Why video 1 is special — the ENGINEERING (the invisible half)

The design principles above are what you SEE; video 1 can hold them for 31 minutes because it is
**computed, not drawn** — it behaves like a well-architected application, and every frame is an output of
that architecture. The evidence and the engineering behind it:

1. **One data model drives everything.** The same quantities appear in the reference card, on the chart,
   and in the on-screen derivation — and they always agree, for half an hour. That is not discipline, it
   is architecture: constants defined ONCE, every panel/chart/derivation COMPUTED from them. Change one
   number and the whole video updates. *(Ours: the ONE-VALUE law + the `numbers_ledger`, now carried
   END-TO-END: `research-engine` emits it → `render-contract-compiler` exports it →
   `docs/render-contract.schema.json` top-level `numbers_ledger` → `contract-linter` Check 3b verifies
   every on-screen number resolves to it → raw contract JSON reaches the codegen author →
   `vg-code-artifacts` rule 3 consumes it. CLOSED 2026-07-08.)*
2. **A real component system.** The reference card, utilization panel, timeline ruler, and telemetry
   ticker recur pixel-consistent across chapters — components with props, never redrawn art. *(Ours: the
   `Kit` library — same architecture, must be USED everywhere.)*
3. **Charts are functions, not illustrations.** The log-log roofline is mathematically correct — the
   ridge sits exactly where the model's numbers put it; annotations are computed positions. A chart drawn
   by eye could never stay consistent across a 4-minute build. *(Ours: `Kit.LineChart` takes data; the
   discipline is that its geometry derives from ledger values, never eyeballed.)*
4. **Seeded, deterministic "live" data.** The sample windows, per-user streams, and flowing packets have
   plausible variance yet repeat identically — seeded simulation driven by the frame counter, an
   application's idle animation, not a hand-keyframed one. *(Ours: rule #16 frame-determinism + seeded
   particle fields — the "seeded live-data feed for instruments" is a pattern worth naming when first used.)*
5. **State machines, not scenes.** The utilization panel doesn't get redrawn for decode — the SAME
   component re-renders under a different workload state (values, colors, verdict all flip together).
   Scenes are states of one system, which is why nothing ever contradicts anything. *(Ours: component
   state props — "a beat is a state TRANSITION on components already on stage".)*
6. **An encode budget that protects the design.** 4K + generous bitrate is why 1px hairlines, thin cyan
   curves, and dark gradients survive compression. A design language of fine lines on near-black is an
   ENGINEERING bet on resolution. *(Ours: 1080p CRF16 — fine for our current shape language; going
   video-1-fine-lined would require the 4K/bitrate decision with it.)*

**The lesson in one line:** video 1 is special because *nothing in it is manual twice* — data, components,
charts, simulations, and states are all derived from one model, so 31 minutes stays coherent at a cost a
hand-built video could never afford. Our pipeline has the same skeleton (Kit · tokens · determinism ·
ONE-VALUE · now the ledger); what remains is carrying the ledger through the contract and spending the
component system everywhere.

**Third pass (2026-07-08, the production-SYSTEM principles — clean is the floor; these make the video
ONE designed system):**
| Principle | Owner (status) |
|---|---|
| Typographic hierarchy, dramatic scale contrast | `vg-code-text` §THE TYPOGRAPHY SYSTEM — 4 levels, one HERO/beat (**already owned**, no duplicate added) |
| One layout grid + spacing scale, video-wide | `visual-style-engine` GRID+SPACING (**added**) + `vg-code-composition` §0 "ONE GRID, video-wide" (**added**) |
| Screen geography — recurring elements have HOMES | `visual-world-engine` §4 HOMES (**added**) + `object-continuity-engine` Job 1 "the home is part of the identity" (**added**) |
| The numbers ledger — a quantified world that agrees with itself | `research-engine` `numbers_ledger` in the Knowledge Package (**added**) + `vg-code-artifacts` selection rule 3 (consume, never invent) (**added**) |
| Interstitial breath scenes — act punctuation | `scene-planner` `purpose: Interstitial` (**added**) + `vg-code-composition` §10 archetype + `vg-quality-animations` canvas-fill exemption (**added**) |
| Luminance ranks importance | `lighting-director` (**already owned** script-side) + `vg-quality-animations` CLEAN≠GOOD test 6 squint check (**added** verify-side) |
