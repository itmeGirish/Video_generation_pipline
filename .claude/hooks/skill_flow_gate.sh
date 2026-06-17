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
Then invoke each step's skill with the Skill tool — NONE skippable.
Working from memory = the gates get skipped. "Give it now"/auto does NOT waive this.

   1  script-youtube-strategy        title/thesis/thumbnail/loops
   2  script-research                real sourced facts (INVOKE it)
   3  script-scene-structure         scene list · arc · loops · patterns · rhythm
   4  script-storytelling            story spine (most-skipped)
   5  script-scene-design            director's brief: style·description·blueprint·reference·cinematic·layout·shot
   6  script-scene-design-validator  brief complete? (stops the LLM inventing)
   7  script-narration               narration to sync rules
   8  script-animation-bullets       director beats
   9  cut pass (≥10% removed)
   ── GATES — ALL must PASS before saving ──
  10  script-animation-validator     sense/fit/motion/buildable
  11  script-narration-visual-sync   /100 (<70 = NOT READY)
  12  script-validator + script-format-validation
  13  script-retention-engineering
  14  script-human-review            9 questions
  15  script-content-quality         12 tests
  16  script-critique-improve        fact-check + rebuild
  17  save → projects/structured_scripts/<name>.txt + present

Writing the .txt is NOT the finish line — it is the INPUT to the gates (10-16).
If any gate is unrun/failing, you are NOT done. Do not say "script ready".
5.6 script-scene-design + 5.7 its validator are NEW — the director's brief that stops generic AI animation.
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

  1 CONVERT raw → canonical
      vg-when-script-received · vg-source-script-format
      vg-rich-script-conversion (+ vg-script-conversion)
      vg-script-gen-integration   (if from the script_generation skill)
  2 CONFIG  vg-build-and-run · vg-pipeline-architecture (first time)
  3 DECIDE VISUAL  vg-visual-map · vg-visual-designer · vg-layout-quality-gate
      vg-graphics-assets  (any logo/screenshot/photo)
  4 AUTHOR CODE — invoke BEFORE writing code:
      vg-render-code, then per factor:
        vg-code-animations · vg-code-timing · vg-code-sequencing · vg-code-transitions
        vg-code-text · vg-code-images · vg-code-tokens · vg-code-vchecks
      richness (channel quality):
        vg-code-artifacts · vg-code-composition · vg-code-motion-bank · vg-code-trimming
      + the remotion skill
  5 NARRATION  vg-ssml-narration · vg-narration-alignment · vg-narration-clarity
  6 SEED  storyboard/seed_bullet_cache.py
  7 PER-SCENE RENDER→VERIFY→FIX (one scene at a time):
      vg-verification-protocol   (is it broken? V1-V13 + audio sync)
      vg-visual-quality → 8 gates:
        vg-quality-animations · vg-quality-timing · vg-quality-sequencing
        vg-quality-transitions · vg-quality-text-fit · vg-quality-images
        vg-quality-tokens · vg-quality-vchecks
      vg-output-validation       (every word + bullet in the render)
      FAIL → vg-rerun-after-correction
  8 STITCH (only after ALL pass)  vg-scene-transitions
  9 FINAL  vg-verification-protocol Layer 3 + vg-youtube-validation · vg-video-duration

  Trouble: vg-known-bugs (before editing storyboard/*.py) ·
           vg-pipeline-internals (build/render failure)
═══════════════════════════════════════════════════════════════════
P2_EOF
  PRINTED=1
fi

exit 0
