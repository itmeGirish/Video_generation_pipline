#!/usr/bin/env bash
# .claude/hooks/render_gate.sh
#
# PreToolUse hook for the Bash tool.
#   - ENFORCES the per-scene loop order with HARD BLOCKS (exit 2):
#       1. render scene N+1 is blocked until scene N is marked PASS
#       2. the final master render (render_master.mjs) is blocked until ALL scenes are PASS
#     The PASS marker is a line in projects/<name>/verification.md of the form
#       SCENE-PASS: <scene-id>            e.g.  SCENE-PASS: claude_code_limits-s01
#     A scene is only allowed to write that line after vg-verification-protocol +
#     vg-visual-quality have been run with real frame evidence (see those skills).
#   - Otherwise INJECTS the verification reminder (exit 0).
#
# Hook protocol: stdin = tool input JSON; stdout shown to agent; exit 2 = BLOCK.
# Windows Git Bash friendly: grep on raw JSON (no jq).

set -u

INPUT="$(cat || true)"
BASE="${CLAUDE_PROJECT_DIR:-.}"

# Helper: print a block banner to stderr (fed to the model on exit 2)
block() { printf '%s\n' "$1" >&2; exit 2; }

# ────────────────────────────────────────────────────────────────────
# ENFORCE 1 — per-scene render order
#   Block `render_scenes.mjs <name>-s0N` (N≥2) unless scene N-1 is PASS.
#   Fail OPEN on any parse uncertainty (never block what we can't read).
# ────────────────────────────────────────────────────────────────────
if echo "$INPUT" | grep -qE 'render_scenes\.mjs'; then
  SCENE_ID="$(echo "$INPUT" | grep -oE '[A-Za-z0-9_]+-s[0-9]{2,}' | head -1)"
  if [ -n "${SCENE_ID:-}" ]; then
    NAME="${SCENE_ID%-s*}"
    NUM="$(printf '%s' "$SCENE_ID" | grep -oE 's[0-9]{2,}$' | tr -d 's')"
    NUM=$((10#$NUM))
    if [ "$NUM" -ge 2 ]; then
      PREV_ID="$(printf '%s-s%02d' "$NAME" $((NUM-1)))"
      VFILE="$BASE/projects/$NAME/verification.md"
      if [ ! -f "$VFILE" ] || ! grep -q "SCENE-PASS: $PREV_ID" "$VFILE"; then
        block "═══════════════════════════════════════════════════════════════════
 ⛔  BLOCKED — per-scene loop order (render_gate.sh)
═══════════════════════════════════════════════════════════════════
You tried to render ${SCENE_ID}, but scene ${PREV_ID} is NOT marked PASS.

The rule: NEVER render scene N+1 until scene N has passed verification.

To proceed, scene ${PREV_ID} must FIRST be verified and recorded:
  1. Invoke  vg-verification-protocol  (V1-V13 + audio sync, real frames)
  2. Invoke  vg-visual-quality         (8 vg-quality-* gates → /100)
  3. Write its section to  projects/${NAME}/verification.md  with frame evidence
  4. Append the marker line:   SCENE-PASS: ${PREV_ID}
Then re-run this render. (Marker missing = not verified = blocked.)
═══════════════════════════════════════════════════════════════════"
      fi
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────────
# ENFORCE 2 — final master-render gate
#   Final assembly = `render_master.mjs` (master composition via TransitionSeries,
#   replaces the old ffmpeg stitch). Block it unless EVERY scene JSON has a PASS
#   marker. Also covers a legacy `ffmpeg -f concat` stitch if ever used.
#   A partial preview (MASTER_SCENES=<subset> set) is NOT hard-blocked.
# ────────────────────────────────────────────────────────────────────
if echo "$INPUT" | grep -qE 'render_master\.mjs|ffmpeg.*-f concat'; then
  if echo "$INPUT" | grep -qE 'MASTER_SCENES=[A-Za-z0-9]'; then
    :   # partial-subset preview master — reminder only, no hard block
  else
    NAME="$(echo "$INPUT" | grep -oE 'PROJECT=[A-Za-z0-9_]+' | head -1 | sed 's/PROJECT=//')"
    [ -z "${NAME:-}" ] && NAME="$(echo "$INPUT" | grep -oE 'projects/[A-Za-z0-9_]+/' | head -1 | sed -E 's#projects/##; s#/##')"
    [ -z "${NAME:-}" ] && NAME="$(echo "$INPUT" | grep -oE '[A-Za-z0-9_]+-s[0-9]{2,}' | head -1 | sed -E 's/-s[0-9]+$//')"
    if [ -n "${NAME:-}" ] && [ -d "$BASE/projects/$NAME/scenes" ]; then
      VFILE="$BASE/projects/$NAME/verification.md"
      MISSING=""
      for f in "$BASE/projects/$NAME/scenes/"*-s*.json; do
        [ -e "$f" ] || continue
        SID="$(basename "$f" .json)"
        if [ ! -f "$VFILE" ] || ! grep -q "SCENE-PASS: $SID" "$VFILE"; then
          MISSING="$MISSING $SID"
        fi
      done
      if [ -n "$MISSING" ]; then
        block "═══════════════════════════════════════════════════════════════════
 ⛔  BLOCKED — master render before all scenes pass (render_gate.sh)
═══════════════════════════════════════════════════════════════════
You tried to render the MASTER (final assembly) for project '${NAME}', but
these scenes are NOT marked PASS in projects/${NAME}/verification.md:
   ${MISSING}

The rule: NEVER render the master until ALL scenes have passed.

For each scene above: run vg-verification-protocol + vg-visual-quality,
record its section with frame evidence, then append:  SCENE-PASS: <scene-id>
Then re-run the master render. (A partial preview can set MASTER_SCENES=<subset>.)
═══════════════════════════════════════════════════════════════════"
      fi
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────────
# REMINDER (exit 0) — fires on any render/build/seed/stitch command
# ────────────────────────────────────────────────────────────────────
if echo "$INPUT" | grep -qE '(render_scenes\.mjs|render_master\.mjs|build_video\.py|seed_bullet_cache\.py|ffmpeg.*-f concat)'; then
  cat <<'GATE_EOF'
═══════════════════════════════════════════════════════════════════
 🎬  PIPELINE GATE — VERIFICATION RULES (auto-injected)
═══════════════════════════════════════════════════════════════════

You are about to run a render / build / seed / stitch command.

▶ FIRST, IF NOT ALREADY DONE THIS SESSION: invoke the verify skills
  (Skill tool) and follow them. Do NOT verify from memory — load the skills.
    `vg-verification-protocol`  (is it broken? — V1-V13 + audio sync)
    `vg-visual-quality`  → runs the 8 production gates:
       vg-quality-animations · vg-quality-timing · vg-quality-sequencing
       vg-quality-transitions · vg-quality-text-fit · vg-quality-images
       vg-quality-tokens · vg-quality-vchecks
    `vg-output-validation`  (every narration word + bullet is in the render)
  CLEAN ≠ GOOD: a frame that "looks clean" is NOT a pass — score it.

MANDATORY checklist for this step:

  1. ONE SCENE AT A TIME
     • If rendering, the command must target a single scene
       (e.g.  node render_scenes.mjs <name>-s0N  with one scene ID)
     • Never batch-render scenes 1-7 before scene 1 passes verification

  2. AFTER RENDER → RUN AUDIO SYNC CHECK (Python + thresholds in vg-verification-protocol)
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

  5. ON PASS  (REQUIRED to unblock the next render / the stitch)
     • Write the scene's section to projects/<name>/verification.md (frame evidence)
     • Append the marker line:   SCENE-PASS: <name>-s0N
     • Mark scene N PASS in TodoWrite
     • ONLY THEN advance to scene N+1

  6. FINAL ASSEMBLY = MASTER RENDER (render_master.mjs, not ffmpeg concat)
     • Run ONCE at the end after ALL scenes pass.
     • The master render is BLOCKED until every scene has its SCENE-PASS marker.
     • A partial preview master may set MASTER_SCENES=<subset> (not hard-blocked).

Full protocol: invoke `vg-verification-protocol`
  (.claude/skills/vg-verification-protocol/SKILL.md)
═══════════════════════════════════════════════════════════════════
GATE_EOF
fi

exit 0
