#!/usr/bin/env bash
# .claude/hooks/render_gate.sh
#
# PreToolUse hook for the Bash tool.
# Injects per-scene verification reminder when the agent tries to render scenes
# or run the build pipeline.
#
# Hook protocol:
#   - Receives tool input as JSON on stdin
#   - stdout is shown to the agent as system context
#   - exit 0 = allow tool, exit 2 = block tool

set -u

# Read the tool input from stdin
INPUT="$(cat || true)"

# Match render / build / stitch commands. Use the JSON blob directly because
# jq is not guaranteed on Windows Git Bash; grep on the raw JSON is reliable.
if echo "$INPUT" | grep -qE '(render_scenes\.mjs|render_master\.mjs|build_video\.py|seed_bullet_cache\.py|ffmpeg.*-f concat)'; then
  cat <<'GATE_EOF'
═══════════════════════════════════════════════════════════════════
 🎬  PIPELINE GATE — VERIFICATION RULES (auto-injected)
═══════════════════════════════════════════════════════════════════

You are about to run a render / build / seed / stitch command.

▶ FIRST, IF NOT ALREADY DONE THIS SESSION: invoke the
  `vg-verification-protocol` skill (Skill tool) and follow it.
  Do NOT verify from memory — load the skill. This is the step most often skipped.

MANDATORY checklist for this step:

  1. ONE SCENE AT A TIME
     • If rendering, the command must target a single scene
       (e.g.  node render_scenes.mjs <name>-s0N  with one scene ID)
     • Never batch-render scenes 1-7 before scene 1 passes verification

  2. AFTER RENDER → RUN AUDIO SYNC CHECK (see CLAUDE.md or rule 23)
     • For every bullet: drift = framesFrom/fps − Whisper word_start
     • Use Whisper substitutions (twelve↔12, fifty↔50, multi-step↔multi -step)
     • PERFECT < ±0.05s,  PASS ±0.5..+1.5s,  WARN +1.5..+2.0s,  FAIL > +2.0s
     • Any WARN/FAIL → fix framesFrom in BOTH scene JSON + remotion/public mirror

  3. AFTER RENDER → EXTRACT 5 FRAMES PER BULLET
     • ffmpeg -ss <t> -i <mp4> -frames:v 1 frame_pNN.jpg
     • Read each jpg, verify V1-V13 (composition, caption zone, overflow)

  4. ON FAIL
     • Fix bullet React code OR bullet body in structured script
     • rm storyboard/.cache/designs/bullet-s0N-bXX-*.json
     • Re-seed via seed_bullet_cache.py
     • rm remotion/out/<name>-s0N.mp4
     • Re-render the SAME scene. Do NOT advance.

  5. ON PASS
     • Mark scene N PASS in TodoWrite (this enforces honest tracking)
     • ONLY THEN advance to scene N+1

  6. STITCHING
     • Final ffmpeg concat happens ONCE at the end after ALL scenes pass.
     • Never stitch mid-loop.

Full protocol: invoke `vg-verification-protocol`
  (.claude/skills/vg-verification-protocol/SKILL.md)
═══════════════════════════════════════════════════════════════════
GATE_EOF
fi

exit 0
