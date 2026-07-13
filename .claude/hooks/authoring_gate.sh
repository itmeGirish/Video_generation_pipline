#!/usr/bin/env bash
# .claude/hooks/authoring_gate.sh
#
# PreToolUse hook for Edit / Write tools.
# Fires when the agent edits bullet-code generation files
# (gen_bundle_*.py, projects/structured_scripts/*.txt) to remind it of the
# failure-prevention rules BEFORE the bullet is authored.
#
# This is the shift-left counterpart to render_gate.sh.

set -u

INPUT="$(cat || true)"

# Match edits to bullet-code or structured-script files.
# NOTE: matches ANY *bundle*.py and *_s<N>*.py / seed file — earlier the regex only caught
# gen_bundle_s<N>.py, so a bundle named _s1_bundle.py slipped through and the author-time
# skill checklist was never injected (root-cause lapse 2026-06-14).
if echo "$INPUT" | grep -qE '([Bb]undle.*\.(py|json)|_s[0-9]+_.*\.(py|json)|seed_bullet_cache|structured_scripts/.*\.txt|/scenes/.*-s[0-9]+\.json)'; then
  cat <<'GATE_EOF'
═══════════════════════════════════════════════════════════════════
 ✏️   AUTHORING GATE — failure prevention (auto-injected)
═══════════════════════════════════════════════════════════════════

You are editing a bullet-code or structured-script file.

▶ FIRST, IF NOT ALREADY DONE THIS SESSION: invoke the authoring skills
  (Skill tool) and follow them — do NOT author from memory.
  WHAT to draw:   `vg-visual-map` · `vg-visual-designer` · `vg-layout-quality-gate`
                  `vg-graphics-assets` (any logo/photo/screenshot)
  HOW to code it: `vg-render-code`, then per factor —
                  `vg-code-animations` · `vg-code-timing` · `vg-code-sequencing`
                  `vg-code-transitions` · `vg-code-text` · `vg-code-images`
                  `vg-code-tokens` · `vg-code-vchecks`
  Channel-quality richness (do NOT skip — this is what stops flat output):
                  `vg-code-artifacts` · `vg-code-composition`
                  `vg-code-motion-bank` · `vg-code-trimming`
  + the `remotion` skill (source of truth for every primitive you use)

Then check these failure modes (each one cost real time on prior projects):

  ① CAPTION ZONE — no element top>h*0.88 or bottom<h*0.10
    Footer/punchline cap: top: Math.round(h*0.82) max
    Bottom 12% reserved (burned-in captions disabled; YouTube uses separate SRT)

  ② AUDIO ANCHOR — must be VERBATIM 2-4 words from this scene's narration
    No abstract anchors ("the reveal")
    No decimal anchors ("seventy-seven point eight" — Whisper splits)
    No unit anchors ("thirty-six percent" — Whisper merges)
    No <pause> spans

  ③ ADDITIVE bullets — re-render prior bullet's settled elements as static
    Slot-based rendering blanks the canvas between bullets
    Forgetting this = visual story breaks

  ④ REPLACE backdrop — use AbsoluteFill, NOT plain div
    React.createElement(AbsoluteFill, ...) — not <div position:absolute inset:0>

  ⑤ NO HEX literals → use D.cyan / D.red / D.bg / D.surface etc.
    NO dimension literals → use w, h from useVideoConfig()
    NO fps literals → use fps from useVideoConfig()

  ⑥ ANIMATION TIMELINE must fit in framesTo - framesFrom
    Use durationInFrames * 0.30/0.60/0.90 fractions, not hard frame counts
    Last phase starting at frame 64 of a 72-frame bullet → V11 FAIL

  ⑦ STATIC > 3s = A4 FREEZE FAIL (unless final-hold of last bullet)
    Add subtle motion: pulse, scan, counter, glow shift

  ⑧ PRIMARY VISUAL prominence ≥ 50% of canvas (V13)
    Stamp 32% wide on black void → V13 FAIL
    Width: Math.round(w*0.50) minimum for primary element

  ⑨ EMPTY BORDERED BOXES are unfinished
    Always include title + body text INSIDE structural elements

  ⑩ ADDITIVE bullet's prior elements should NOT animate again
    Re-mount with opacity:1 at their settled position, no entry spring

  ⑪ FRAME ONE POPULATED — bullet 1 opens with the stage visible at frame 0,
    first hero motion underway ≤~15f. No blank-canvas wait, no slow fade
    from nothing (scene 1's open IS the hook). `vg-code-sequencing` §FRAME ONE

  ⑫ DERIVE key numbers, never assert — the beat's load-bearing value arrives
    via Kit.FormulaChips / Kit.Counter / Kit.StackedLedger (operands → result).
    A pasted static stat chip on first appearance = FAIL. `vg-code-artifacts`

  ⑬ INSTRUMENTS RE-DIAGNOSE — any Gauge/MeterBar/RefCard on stage is wired to
    the scene driver and visibly flips value+state+verdict at thresholds.
    An instrument that never re-reads the world is decoration. `vg-code-artifacts`

  ⑭ NO STALE ELEMENT — no load-bearing element pixel-identical across ≥2 beat
    boundaries; each held element RE-REACTS per beat (value update / state
    change / dim-lift with focus). `vg-quality-animations` §STALE-ELEMENT

  ⑮ COMPARISON = the SAME object in two states, same framing (default idiom);
    two side-by-side items only for two genuinely different contenders.

  ⑯ CONNECTORS REGISTER — any line/beam/arrow's endpoints DERIVE from the
    layout variables of the two elements it connects (never guessed canvas
    fractions; flex-placed endpoints must be computed). Pairing comes from
    the contract; one link fires at a time; the target REACTS on landing.
    `vg-code-motion-bank` §P11 CONNECTOR REGISTRATION

  ⑰ NO TEXT-RICH BEAT — the bullet's `headline` is machine metadata: NEVER
    draw it on the frame. On-screen words = the opt-in `text` field +
    instrument readings ONLY. A quantity is an instrument's reading, never a
    floating chip. A beat that needs a caption to be understood has a WORLD
    problem — fix the mechanism (make it RUN — `cycle`), don't caption it.
    `vg-code-text` §HEADLINE IS NOT ON-SCREEN TEXT · linter 3g

  ⑱ SCENE-DRIVEN — author the STAGE once per scene ({"scene":N,"stage":true,
    "code":…} in the bundle): the persistent world + running mechanisms on
    scene-local frames (cycles never reset at beat boundaries). Bullets
    render ONLY their modulation/delta on top — a bullet that redraws the
    world is double-painting. Legacy (no stage): bullets self-contained.
    `vg-visual-designer` §SCENE-DRIVEN layering contract

  ⑲ TAG THE CAST — every world-object/instrument's top-level element carries
    'data-cast-id': '<contract cast id>' (+ 'data-state' when stateful).
    The RuntimeProbe measures tagged boxes during every render; telemetry_rules
    verifies them against the contract (zones · corridors · overlap ·
    accumulation · HOME drift). Untagged = unmeasurable = invisible to
    Rendering Intelligence. `vg-code-artifacts` §THE TELEMETRY CONTRACT

Full pre-authoring rules in CLAUDE.md (loaded into context).
Full post-render verification: invoke `vg-verification-protocol`
  (.claude/skills/vg-verification-protocol/SKILL.md)
═══════════════════════════════════════════════════════════════════
GATE_EOF
fi

exit 0
