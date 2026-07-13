#!/usr/bin/env bash
# .claude/hooks/render_gate.sh
#
# PreToolUse hook for the Bash tool — NATIVE Remotion flow (no per-scene mp4 verify loop).
#   - HARD BLOCK 1 (VISUAL PROOF before the MASTER): the ONE live master render
#       (render_master.mjs) is blocked until EVERY scene has a VISUAL-PROOF marker in
#       projects/<name>/verification.md — the cheap pre-render filmstrip proof (step 6b).
#       "Prove cheap before the expensive render." A partial preview (MASTER_SCENES=<subset>)
#       is NOT hard-blocked.
#   - HARD BLOCK 2 (script side): build_video.py is blocked while the structured script still
#       carries `SCRIPT-READY: REQUIRED`, or if a DIMENSION-LOCK score regressed (sync<70 / wonder<8).
#   - Otherwise INJECTS the native verification reminder (exit 0).
#
#   render_scenes.mjs is now an OPTIONAL debug render-to-watch — it is NOT gated.
#   The post-master FINAL gate (vg-verification-protocol + vg-visual-quality + video-narrative-editor
#   + vg-scene-validator + vg-youtube-validation) → MASTER-PASS is the agent's close before upload
#   (a post-render judgement, not a hook-enforceable command).
#
# Hook protocol: stdin = tool input JSON; stdout shown to agent; exit 2 = BLOCK.
# Windows Git Bash friendly: grep on raw JSON (no jq). Fail OPEN on parse uncertainty.

set -u

INPUT="$(cat || true)"
BASE="${CLAUDE_PROJECT_DIR:-.}"

# Helper: print a block banner to stderr (fed to the model on exit 2)
block() { printf '%s\n' "$1" >&2; exit 2; }

# ────────────────────────────────────────────────────────────────────
# HARD BLOCK 1 — VISUAL PROOF before the MASTER render
#   Block `render_master.mjs` (the one live render of all scene components) unless EVERY
#   scene JSON has a VISUAL-PROOF marker. The cheap per-scene filmstrip proof (6b) is the
#   only per-scene catch in the native flow, so it must pass before the expensive master.
#   A partial-subset preview (MASTER_SCENES=<subset>) is reminder-only.
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
        if [ ! -f "$VFILE" ] || ! grep -q "VISUAL-PROOF: $SID" "$VFILE"; then
          MISSING="$MISSING $SID"
        fi
      done
      if [ -n "$MISSING" ]; then
        block "═══════════════════════════════════════════════════════════════════
 ⛔  BLOCKED — VISUAL PROOF not done for every scene (render_gate.sh · cheap-pixels-first)
═══════════════════════════════════════════════════════════════════
You tried the LIVE MASTER render for '${NAME}', but these scenes have NO VISUAL-PROOF marker:
   ${MISSING}

The rule (native flow): there is NO per-scene mp4 verify loop. The ONE expensive step is the
live master render — so prove EVERY scene is cinematic on CHEAP keyframes BEFORE it. A flat
scene caught here costs seconds; caught after the master it re-renders the WHOLE video.

For each scene above (after its bullets are seeded):
  1. python storyboard/preview_bullet.py projects/structured_scripts/${NAME}.txt --scene <N> --visual-proof
     → renders the 5-keyframe FILMSTRIP from the live composition + the mechanical proofs.
  2. READ the filmstrip, judge the 3 proofs against the scene's DDI (route to the owners):
       • Composition — hero obvious in ~1s · hierarchy · no overlap · caption zone   (vg-visual-quality / layout_validator)
       • Narrative   — muted: attention travels + a viewer understands · through-line  (render-validator)
       • Transformation — the hero's STATE changed A→B across the strip (mechanical Δ)  (DDI / vg-scene-validator)
  3. PASS → append to projects/${NAME}/verification.md:
       VISUAL-PROOF: ${NAME}-s0N | composition=PASS narrative=PASS transform=<Δ>%
Then re-run the master. (A partial preview may set MASTER_SCENES=<subset>.)
After the master renders, run the FINAL gate (vg-verification-protocol + vg-visual-quality +
video-narrative-editor + vg-scene-validator + vg-youtube-validation) → record MASTER-PASS before upload.
═══════════════════════════════════════════════════════════════════"
      fi
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────────
# HARD BLOCK 2 — script-side gate (Phase-1 verification layer)
#   Block `build_video.py <script>` while the structured script still carries the
#   `SCRIPT-READY: REQUIRED` flag — i.e. its Phase-1 SCRIPT-READY gates (contract-linter 25 ·
#   render-validator 29 · testing-engine · knowledge-validator · feedback-optimizer 32) have not passed.
#   script_generation writes that flag when it drafts the .txt and REPLACES it with an
#   evidenced `SCRIPT-READY: <name> | sync=.. wonder=.. ..` line once the gates pass.
#   Scripts from the conversion path (vg-script-conversion) never carry the flag,
#   so they are NEVER blocked. Fail OPEN on any parse uncertainty.
# ────────────────────────────────────────────────────────────────────
if echo "$INPUT" | grep -qE 'build_video'; then   # matches both `build_video.py` and `-m storyboard.build_video`
  # Canonical script may be .txt (legacy authoring format) OR .json (the render contract —
  # its "script_ready" field carries the same literal SCRIPT-READY line, so the greps below
  # work unchanged on the raw JSON text).
  SP="$(echo "$INPUT" | grep -oE 'projects/structured_scripts/[A-Za-z0-9_]+\.(txt|json)' | head -1)"
  if [ -z "${SP:-}" ]; then
    PN="$(echo "$INPUT" | grep -oE 'projects/[A-Za-z0-9_]+/' | head -1 | sed -E 's#projects/##; s#/##')"
    if [ -n "${PN:-}" ]; then
      SP="projects/structured_scripts/$PN.txt"
      [ ! -f "$BASE/$SP" ] && [ -f "$BASE/projects/structured_scripts/$PN.json" ] && SP="projects/structured_scripts/$PN.json"
    fi
  fi
  SPF="$BASE/$SP"
  if [ -n "${SP:-}" ] && [ -f "$SPF" ] && grep -qiE 'SCRIPT-READY:[[:space:]]*REQUIRED' "$SPF"; then
    block "═══════════════════════════════════════════════════════════════════
 ⛔  BLOCKED — script not gated yet (render_gate.sh · Phase-1 verification)
═══════════════════════════════════════════════════════════════════
You tried to build '${SP}', but it still carries  SCRIPT-READY: REQUIRED  —
its Phase-1 SCRIPT-READY gates have NOT been recorded as passed.

The rule (symmetric to the render side): NEVER render a script whose gates haven't passed.

To proceed, run the Phase-1 verification layer and record the proof IN the script:
  25 contract-linter (completeness/consistency/format)
  29 render-validator (the muted test + buildability · sync=<NN>)
  —  testing-engine (12 content tests) + knowledge-validator (facts)
  32 feedback-optimizer (fact-check + reconcile · wonder=<N> from stage 5 visual-story-engine)
Then REPLACE the flag with the evidenced line at the top of the .txt:
  <!-- SCRIPT-READY: ${SP##*/} | sync=<NN>/100 wonder=<N>/10 gates=communication,contract,quality,retention,critique -->
A bare removal with no evidence line is the hallucinated pass this gate exists to stop.
(Conversion-path scripts never carry the flag and are never blocked.)
═══════════════════════════════════════════════════════════════════"
  fi

  # ── DIMENSION LOCK — the evidenced line exists but a LOCKED dimension regressed below bar.
  #    The locked bars are the SAME numbers the gates record: sync≥70 (stage 29 render-validator),
  #    wonder≥8 (stage 5 visual-story-engine).
  #    Numbers must MEET bar, not merely be present. Fail OPEN if the fields are absent.
  if [ -n "${SP:-}" ] && [ -f "$SPF" ] && grep -qiE 'SCRIPT-READY:[^R]' "$SPF"; then
    RLINE="$(grep -iE 'SCRIPT-READY:' "$SPF" | grep -ivE 'REQUIRED' | head -1)"
    SYNC="$(printf '%s' "$RLINE" | grep -oiE 'sync=[0-9]+' | head -1 | grep -oE '[0-9]+')"
    WONDER="$(printf '%s' "$RLINE" | grep -oiE 'wonder=[0-9]+' | head -1 | grep -oE '[0-9]+')"
    LOCKFAIL=""
    [ -n "${SYNC:-}" ]   && [ "$SYNC"   -lt 70 ] && LOCKFAIL="${LOCKFAIL} sync=${SYNC}/100 (bar 70)"
    [ -n "${WONDER:-}" ] && [ "$WONDER" -lt 8  ] && LOCKFAIL="${LOCKFAIL} wonder=${WONDER}/10 (bar 8)"
    if [ -n "$LOCKFAIL" ]; then
      block "═══════════════════════════════════════════════════════════════════
 ⛔  BLOCKED — DIMENSION LOCK regressed (render_gate.sh · creative-drift gate)
═══════════════════════════════════════════════════════════════════
'${SP}' has an evidenced SCRIPT-READY line, but a LOCKED dimension is BELOW bar:
  ${LOCKFAIL}

A locked dimension that passed earlier may NOT regress below its bar. The number being
present is not enough; it must MEET bar.

DO NOT just patch the number in the comment. Route it to the RECONCILER:
  • wonder<8  → restore the peak (visual-story-engine) then feedback-optimizer RECONCILE.
  • sync<70   → render-validator: re-align anchors / re-time beats.
The reconciler (feedback-optimizer) holds: accuracy > wonder/peak > retention-pacing.
Re-score, update the line to meet bar, then re-build.
═══════════════════════════════════════════════════════════════════"
    fi
  fi

  # ── HUMAN GATE 1 — script approval (the first human-in-the-loop checkpoint).
  #    After Phase 1 passes its gates, the SCRIPT must be VALIDATED BY THE USER before Phase 2
  #    spends render time. The pipeline pauses, presents the script, and only proceeds after the
  #    user approves — recorded as a `SCRIPT-APPROVED: <name>` line in projects/<name>/verification.md.
  #    Block build_video.py until that human approval exists. (Conversion-path/no-project: fail OPEN.)
  PNAME="$(echo "$SP" | sed -E 's#.*/##; s#\.(txt|json)$##')"
  VF="$BASE/projects/$PNAME/verification.md"
  if [ -n "${PNAME:-}" ] && [ -d "$BASE/projects/$PNAME" ] \
     && grep -qiE 'SCRIPT-READY:[^R]' "$SPF" 2>/dev/null \
     && { [ ! -f "$VF" ] || ! grep -qiE "SCRIPT-APPROVED:[[:space:]]*$PNAME" "$VF"; }; then
    block "═══════════════════════════════════════════════════════════════════
 ⛔  BLOCKED — HUMAN GATE 1: the script is not USER-APPROVED yet (render_gate.sh)
═══════════════════════════════════════════════════════════════════
'${SP}' passed its Phase-1 gates, but the FIRST human-in-the-loop checkpoint hasn't happened:
the USER must VALIDATE the script before Phase 2 spends render time.

Do this, in order:
  1. PRESENT the script/contract to the user (the narration + the per-scene visual plan) and ASK
     for approval — do NOT start Phase 2 authoring/rendering without it.
  2. On approval, record it:  projects/${PNAME}/verification.md  →  add a line:
       SCRIPT-APPROVED: ${PNAME} | <YYYY-MM-DD> | approved by user
  3. Then re-run the build.
If the user requested changes, revise the script (reopens S7) — do NOT write the marker.
(This is a human decision; never self-approve.)
═══════════════════════════════════════════════════════════════════"
  fi
fi

# ────────────────────────────────────────────────────────────────────
# REMINDER (exit 0) — fires on any render/build/seed/proof command (NATIVE flow)
# ────────────────────────────────────────────────────────────────────
if echo "$INPUT" | grep -qE '(render_master\.mjs|render_scenes\.mjs|build_video\.py|seed_bullet_cache\.py|preview_bullet\.py|ffmpeg.*-f concat)'; then
  cat <<'GATE_EOF'
═══════════════════════════════════════════════════════════════════
 🎬  PIPELINE GATE — NATIVE VERIFICATION (auto-injected)
═══════════════════════════════════════════════════════════════════

Native Remotion flow — NO per-scene mp4 render→verify loop. Two catches:

  ▶ PER SCENE (cheap, BEFORE the render) — VISUAL PROOF (step 6b):
      python storyboard/preview_bullet.py <script> --scene N --visual-proof
      → 5-keyframe FILMSTRIP from the LIVE composition (no TTS/Whisper/full-render).
      Judge 3 proofs vs the scene's DDI (route to owners; don't score from memory):
        Composition (vg-visual-quality/layout_validator) · Narrative (muted test) ·
        Transformation (DDI Δ). PASS → record:
        VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>%
      The master render is HARD-BLOCKED until EVERY scene has this marker.

  ▶ THE WHOLE VIDEO (after the ONE live master render) — the FINAL gate:
      Invoke the skills (do NOT verify from memory):
        vg-verification-protocol  (V1-V13 + AUDIO-SYNC drift + volumedetect on the REAL final)
        vg-visual-quality         (the 8 production factors from master frames/filmstrip)
        video-narrative-editor    (watch the WHOLE video MUTED — 8 lenses — SHIP|RE-CUT)
        vg-scene-validator        (12-layer Motion-Native conformance + cross-scene continuity)
        vg-youtube-validation · vg-video-duration
      ON FAIL → route the symptom to its ONE owner (CLAUDE.md "BUG ROUTER"), fix the bullet
      CODE / DDI, re-seed, re-run Visual Proof for that scene, re-render the master.
      ON PASS → record  MASTER-PASS: <name> | visual=<NN>/100 audio=<N>/10  then upload.

  render_scenes.mjs is OPTIONAL (debug render-to-watch), never a gate.
  ALWAYS confirm the final isn't silent: ffmpeg -i out.mp4 -af volumedetect -f null -
═══════════════════════════════════════════════════════════════════
GATE_EOF
fi

exit 0
