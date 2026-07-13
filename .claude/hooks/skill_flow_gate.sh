#!/usr/bin/env bash
# .claude/hooks/skill_flow_gate.sh
#
# UserPromptSubmit hook.
# Fires when the user asks to write a script OR build/render a video, and
# injects the FULL ordered skill-invocation checklist for that phase so no
# skill gets skipped during the process. stdout is added to the agent context.
#
# Windows Git Bash friendly: grep on raw JSON (no jq dependency).

set -u

INPUT="$(cat || true)"
# Lowercase for matching
LOWER="$(echo "$INPUT" | tr '[:upper:]' '[:lower:]')"

PRINTED=0

# ── PHASE 1 — script writing ──────────────────────────────────────
if echo "$LOWER" | grep -qE '(write|generate|create|make|need|draft).{0,30}(script)|youtube script|script for |new script|script generation'; then
  cat <<'P1_EOF'
═══════════════════════════════════════════════════════════════════
 📝  SCRIPT-GENERATION FLOW — invoke EVERY skill in order (auto-injected)
═══════════════════════════════════════════════════════════════════
Invoke the orchestrator FIRST:  Skill → script_generation
Then invoke each STAGE's skill with the Skill tool — NONE skippable. The Visual Story Engine is a COMPILER:
32 core stages, each ONE job → a typed artifact for the next; 10 cross-cutting skills run throughout.
Working from memory = gates skipped.

  SCRIPT PRODUCTION (the MASTER CLOCK — S1–S6 = VERIFIED DRAFT; the LOCK comes AFTER stage 23; visuals bind to sentence IDs)
  S1 topic-intelligence (GO/NO-GO)  S2 research-engine (mechanism MODELS · series/trace · running example)  S3 angle-engine (WATCHABLE stake · tension · loops)
  S4 narrative-architect (mechanism-segment chapters · hook = a world EVENT · ≤30s)  S5 script-writer (11 sentence laws incl. the COMMENTARY LAW → run scripts/sentence_laws_lint.py)
  S6 personality-pass (voice serves the picture; banned-words clean)  S7 verification-pass (runs AFTER stage 23: 4 rounds + TTS-time + LOCK = master clock)
  → the visual stages below design the world to the VERIFIED DRAFT; scene-composer may adjust WORDING, then S7 locks (words-serve-the-seen).

  DESIGN (produce the story + world)
   1  research-engine            Topic → Knowledge Package        2  teaching-narrative-engine → Teaching Narrative
   3  cognitive-model-engine     → Cognitive Model                4  visual-metaphor-engine    → Visual Metaphor Library
   5  visual-story-engine        → Story Beats (WONDER <8=NOT READY)   6  scene-planner        → Scene Plan
   7  visual-world-engine        → World Model                    8  object-library-engine     → Object Library
  COMPILE (states → events → motion)
   9  state-graph-compiler       → State Graph                    10 event-graph-compiler      → Event Graph
  11  event-validator            → Validated Event Graph          12 object-continuity-engine  → Continuity Graph
  13  attention-director  14 camera-director  15 lighting-director   16 motion-operator-engine  17 physics-engine
  18  tempo-sync-engine (anchor→frame)  19 audio-design-engine  20 transition-designer  21 visual-style-engine  22 idiom-library-engine
  COMPOSE + CONTRACT
  23  scene-composer             → Scene Spec (STAGE composite+process FIRST, then beats as modulations + cut pass)
  24  render-contract-compiler   → deterministic Render Contract (cast · stage · semantics · camera/attention/transition · concepts · ledger)  25 contract-linter → VALIDATED CONTRACT (.json)
   ── stages 1–25 produce the .json; SCRIPT-READY gate: contract-linter (MECHANICAL FLOOR: contract_scorecard.py + composite_lint.py, both exit 0) + testing-engine (12 tests) + knowledge-validator + feedback-optimizer ──
  RENDER (video_generation runs these)
  26 remotion-component-mapper  27 asset-manager  28 remotion-composer  29 render-validator (GO: sync+MUTED proof)
  30 remotion-renderer  31 quality-assurance-engine (SHIP: muted test on real frames)  32 feedback-optimizer (iterate)
  CROSS-CUTTING (throughout): knowledge-validator · design-system-manager · documentation-engine · testing-engine ·
     debug-engine · performance-optimizer · component-library-manager · token-sync-engine · code-review-engine · deployment-engine

Writing the .txt is NOT the finish line — it is the INPUT to the gates. Do not say "script ready" until they pass.
visual-story-engine (Wonder) is the DIVERGENT counterweight; the MUTED test (render-validator/QA) is the overriding metric.
LOCKED invariants (feedback-optimizer re-verifies): accuracy · buildable/muted · Wonder ≥8 · sync ≥70.
═══════════════════════════════════════════════════════════════════
P1_EOF
  PRINTED=1
fi

# ── PHASE 2 — video build / render ────────────────────────────────
if echo "$LOWER" | grep -qE '(build|render|make|produce|generate).{0,30}(video|mp4|scene)|run the pipeline|i have a script|script (is )?ready|build_video|render_scenes|seed (the )?cache'; then
  cat <<'P2_EOF'
═══════════════════════════════════════════════════════════════════
 🎬  VIDEO-GENERATION FLOW — invoke EVERY skill at its step (auto-injected)
═══════════════════════════════════════════════════════════════════
Invoke the orchestrator FIRST:  Skill → video_generation
When a script just arrived:     Skill → vg-when-script-received (START HERE)
These skills ARE the quality. Skipping them is how output goes flat.
NATIVE flow — NO per-scene mp4 render→verify loop: prove CHEAP per scene (Visual Proof),
render the master ONCE, then gate the MASTER.

  1 CONVERT raw → canonical
      vg-when-script-received · vg-source-script-format
      vg-script-conversion (the converter; movie-script = its MODE B)
      vg-script-gen-integration   (if from the script_generation skill)
  2 CONFIG  vg-build-and-run · vg-pipeline-architecture (first time)
  3 DECIDE VISUAL  vg-visual-map · vg-visual-designer · vg-layout-quality-gate
      vg-graphics-assets  (any logo/screenshot/photo)
  3b COMPILE MOTION  vg-motion-compiler — the writer's STORY beats → the motion GRAMMAR
      (el/op/topology/params/token); the writer NEVER authors grammar
      (grammar/target defined by vg-remotion-engineering §THE MOTION SYSTEM)
  4 AUTHOR CODE — invoke BEFORE writing code:
      vg-render-code, then per factor:
        vg-code-animations · vg-code-timing · vg-code-sequencing · vg-code-transitions
        vg-code-text · vg-code-images · vg-code-tokens · vg-code-vchecks
      richness (channel quality):
        vg-code-artifacts · vg-code-composition · vg-code-motion-bank · vg-code-trimming
      + vg-remotion-engineering (break flat-2D) + the remotion skill
  5 NARRATION + SOUND  vg-ssml-narration · vg-narration-alignment · vg-narration-clarity
      vg-sound-design  (the AUDIO LAYER — voice engine · music+duck · sfx cues · deliberate silence; wired vs GAP)
  6 SEED  storyboard/seed_bullet_cache.py
  6b VISUAL PROOF (cheap, per scene, BEFORE the render — MANDATORY):
      python storyboard/preview_bullet.py <script> --scene N --visual-proof
      → 5-keyframe FILMSTRIP from the LIVE composition (no TTS/Whisper/full render).
      Judge 3 proofs vs the scene's DDI (route to owners; never score from memory):
        Composition (vg-visual-quality factors 5-8 + layout_validator) ·
        Narrative (muted test, render-validator) · Transformation (mechanical Δ vs DDI)
      PASS → record in projects/<name>/verification.md:
        VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%
      render_gate.sh HARD-BLOCKS the master render until EVERY scene has its marker.
  6c HUMAN VISUAL CHECK (present a SAMPLE, get the GO — MANDATORY before the master render):
      Prove the SAMPLE scenes (scene 1 + scene 2) → READ their filmstrips → PRESENT both to the
      user with your honest read (composition · muted-narrative · transformation). Then STOP and
      ASK: "how is it?" Do NOT master-render on your own judgement — the user decides.
        • user says GOOD  → go straight to step 7 (master render), no per-scene belabouring.
        • user wants FIXES → route to the owner (flat→vg-code-animations, text→vg-code-text),
          re-seed, re-prove that scene, re-present. Never self-approve.
  7 MASTER RENDER (the ONE expensive step)  render_master.mjs — the LIVE per-scene
      COMPONENTS composed via plain <Series> (zero overlap → sync-safe; NOT TransitionSeries);
      NO per-scene mp4 stitch; only fade = per-scene Backdrop (vg-scene-transitions).
      render_scenes.mjs = OPTIONAL debug render-to-watch only, never a gate.
  8 FINAL GATE — ON THE RENDERED MASTER (invoke ALL):
      vg-verification-protocol   (V1-V13 + AUDIO-SYNC drift + volumedetect on the REAL final)
      vg-visual-quality → 8 gates:
        vg-quality-animations · vg-quality-timing · vg-quality-sequencing
        vg-quality-transitions · vg-quality-text-fit · vg-quality-images
        vg-quality-tokens · vg-quality-vchecks
      vg-quality-audio           (the other half of perceived quality)
      vg-output-validation       (every word + bullet in the render)
      video-narrative-editor     (holistic editorial cut — watch WHOLE video, muted — SHIP|RE-CUT)
      vg-scene-validator         (SEMANTIC CONFORMANCE — the render vs each scene's 12-layer
                                  Motion-Native Contract + cross-scene continuity — VIOLATION blocks MASTER-PASS)
      vg-youtube-validation · vg-video-duration
      PASS → record MASTER-PASS: <name> | visual=<NN>/100 audio=<N>/10 transform=<min-Δ>%
      FAIL → BUG ROUTER (CLAUDE.md): ONE symptom → ONE owner → fix bullet code/DDI →
             re-seed → re-prove (6b) → re-render the master (vg-rerun-after-correction)

  Trouble: vg-known-bugs (before editing storyboard/*.py) ·
           vg-pipeline-internals (build/render failure)
═══════════════════════════════════════════════════════════════════
P2_EOF
  PRINTED=1
fi

exit 0
