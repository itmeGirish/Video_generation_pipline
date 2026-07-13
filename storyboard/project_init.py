"""project_init.py — SCAFFOLD a project's folder + its tracking record (the infra step).

Creates `projects/<name>/` with the standard structure AND pre-fills `verification.md` with the
per-project TRACKING record the coverage/bug tools already read — so tracking is "tick as you go"
from the start, not "remember to author from scratch":

  ## Skill Invocation Tracker   — the full Phase-1 (S1-S7 + 32 stages) + Phase-2 skill checklist as
                                   [ ] items → mark [x] as each is INVOKED. Feeds skill_coverage.py.
  ## Bug Ledger                  — the table header. Feeds bug_stats.py.
  (+ the VISUAL-PROOF / MASTER-PASS placeholder lines the render gates grep.)

One file (verification.md), read by skill_coverage.py + bug_stats.py + render_gate.sh — single source
of truth (no separate skill.md/bug.md to drift). Idempotent: never overwrites an existing verification.md.

Usage:
    python -m storyboard.project_init <name>
"""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The pipeline's skill spine — the checklist scaffolded into every project.
PHASE1_SCRIPT = [
    "topic-intelligence (S1)", "research-engine (S2)", "angle-engine (S3)",
    "narrative-architect (S4)", "script-writer (S5)", "personality-pass (S6)",
    "verification-pass (S7 · LOCK after stage 23)",
]
PHASE1_DESIGN = [
    "teaching-narrative-engine", "cognitive-model-engine", "visual-metaphor-engine",
    "visual-story-engine (Wonder ≥8)", "scene-planner", "visual-world-engine", "object-library-engine",
]
PHASE1_COMPILE = [
    "state-graph-compiler", "event-graph-compiler", "event-validator", "object-continuity-engine",
    "attention-director", "camera-director", "lighting-director", "motion-operator-engine",
    "physics-engine", "tempo-sync-engine", "audio-design-engine", "transition-designer",
    "visual-style-engine", "idiom-library-engine",
]
PHASE1_CONTRACT = [
    "scene-composer (STAGE first, beats as modulations)", "render-contract-compiler",
    "contract-linter (MECHANICAL floor: contract_scorecard.py + composite_lint.py exit 0)",
    "testing-engine (12 tests)", "knowledge-validator", "feedback-optimizer (evidenced SCRIPT-READY)",
]
PHASE2_AUTHOR = [
    "vg-when-script-received", "vg-visual-map", "vg-visual-designer", "vg-motion-compiler",
    "vg-render-code", "vg-code-animations", "vg-code-timing", "vg-code-sequencing",
    "vg-code-transitions", "vg-code-text", "vg-code-images", "vg-code-tokens", "vg-code-vchecks",
    "vg-code-artifacts (+ TELEMETRY CONTRACT tagging)", "vg-code-composition", "vg-sound-design",
]
PHASE2_VERIFY = [
    "vg-verification-protocol", "vg-visual-quality (8 gates)", "vg-quality-audio",
    "vg-output-validation", "video-narrative-editor", "vg-scene-validator", "vg-youtube-validation",
    "telemetry_rules.py (runtime R1-R7)", "skill_coverage.py (was any skill MISSED?)",
]


def _checklist(title: str, items: list[str]) -> str:
    return f"### {title}\n" + "\n".join(f"- [ ] {it}" for it in items) + "\n"


def _scaffold_verification(name: str) -> str:
    L = [
        f"# {name} — verification & tracking record",
        f"Scaffolded {date.today().isoformat()} by `project_init.py`. "
        f"Read by skill_coverage.py · bug_stats.py · render_gate.sh (single source of truth).",
        "",
        "## Skill Invocation Tracker",
        "_Tick [x] as each skill is INVOKED (the Skill tool call — not 'read from memory'). "
        "`skill_coverage.py` verifies the mandatory floor; the `### Skills invoked` per-scene blocks below "
        "feed bug_stats effectiveness._",
        "",
        "**PHASE 1 — script production**",
        _checklist("Script (S1–S7)", PHASE1_SCRIPT),
        _checklist("Design (1–8)", PHASE1_DESIGN),
        _checklist("Compile (9–22)", PHASE1_COMPILE),
        _checklist("Compose + Contract (23–25 + gate)", PHASE1_CONTRACT),
        "**PHASE 2 — video generation**",
        _checklist("Author (per scene)", PHASE2_AUTHOR),
        _checklist("Verify (on the master)", PHASE2_VERIFY),
        "## Bug Ledger",
        "_One row per bug FIXED (the attempt). `type`→pillar: layout/transitions/rendering=COMPOSITION · "
        "text/images/sequencing=DENSITY · tokens/assets=CONSISTENCY. Feeds bug_stats.py._",
        "",
        "| attempt | bug (symptom) | type | pillar | sev | owner skill | fix | min | resolved |",
        "|---|---|---|---|---|---|---|---|---|",
        "",
        "## Human approval gates",
        "_The pipeline pauses at TWO human-in-the-loop checkpoints; the markers are written ONLY after the "
        "user explicitly approves (never self-approve). `render_gate.sh` HARD-BLOCKS `build_video.py` until "
        "SCRIPT-APPROVED exists._",
        "",
        "- [ ] GATE 1 (script → before render): `SCRIPT-APPROVED: " + name + " | <YYYY-MM-DD> | approved by user`",
        "- [ ] GATE 2 (video → before upload):  `VIDEO-APPROVED: " + name + "  | <YYYY-MM-DD> | approved by user`",
        "",
        "## Per-scene records",
        "_Append one block per scene as you build it (VISUAL-PROOF marker + `### Skills invoked` + "
        "SCENE observations). Template: vg-verification-protocol §The verification.md artifact._",
        "",
        "<!-- VISUAL-PROOF markers go here, one per scene: "
        "VISUAL-PROOF: <name>-s0N | composition=PASS narrative=PASS transform=<Δ>% -->",
        "",
        "## Final",
        "<!-- MASTER-PASS: <name> | visual=<NN>/100 audio=<N>/10 transform=<min-Δ>% "
        "+ SKILL-COVERAGE line + telemetry violations=0 -->",
        "",
    ]
    return "\n".join(L)


CONFIG_STUB = """# {name} — project config (fill before seeding; design_tokens are in the cache key)
design:
  bg: "#0E0E12"
  text: "#F4EFE6"
  # accent tokens, fonts, spacing … (see an existing project's config.yaml)
audio:
  engine: piper          # piper (expressive) | edge_tts
  rate: "+0%"
stitch:
  mode: remotion_master  # the native one-live-master render
"""


def main(name: str) -> int:
    proj = ROOT / "projects" / name
    created = []
    for sub in ("", "scenes", "captions", "audio", "out"):
        d = proj / sub if sub else proj
        if not d.exists():
            d.mkdir(parents=True, exist_ok=True)
            created.append(str(d.relative_to(ROOT)) + "/")
    cfg = proj / "config.yaml"
    if not cfg.exists():
        cfg.write_text(CONFIG_STUB.format(name=name), encoding="utf-8")
        created.append(str(cfg.relative_to(ROOT)))
    ver = proj / "verification.md"
    if not ver.exists():
        ver.write_text(_scaffold_verification(name), encoding="utf-8")
        created.append(str(ver.relative_to(ROOT)))

    if created:
        print(f"project_init: scaffolded '{name}':")
        for c in created:
            print("  +", c)
    else:
        print(f"project_init: '{name}' already scaffolded (nothing overwritten).")
    print("Next: write the contract → projects/structured_scripts/" + name + ".json (Phase 1),")
    print("      then tick the Skill Invocation Tracker as you invoke each skill.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
