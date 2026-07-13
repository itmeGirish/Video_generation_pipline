"""contract_scorecard.py — the SCRIPT-side verification scorecard (countable, not judged).

The premium bar is a VERIFICATION property: every authoring law must be counted by a gate,
or it is advice. This tool scores a render contract mechanically on the dimensions the
prose gates cannot count, and prints an evidence block for the SCRIPT-READY line.

Dimensions (each with a hard bar for NEW contracts; legacy contracts = report-only):
  1. SEMANTICS coverage    — every bullet carries `semantics` (authoritative beat spec).
  2. PROCESS coverage      — every bullet whose narration describes per-unit/rate/repeated
                             behavior carries `semantics.process` (or its scene has
                             `stage.process`). Arrival-where-process-taught = FAIL.
  3. TEXT budget           — per scene: non-empty `text` fields ≤ TEXT_BUDGET_PER_SCENE
                             (one display line + a handful of micro-labels; linter 3g).
  4. STAGE coverage        — every scene carries `stage` with `composite` (+ zones for the
                             geometry gate; composite_lint.py checks the geometry itself).
  5. RENDER-SHAPED DATA    — ledger `series` present when any scene plans a chart-like
                             visual; `trace` present when any process exists (evidence
                             counts printed; hard-fail only when zero despite processes).

Usage:
    python .claude/skills/script_generation/scripts/contract_scorecard.py <contract.json>

Exit 0 = all bars met (or legacy report-only). Exit 1 = violations listed.
Legacy detection: a contract where NO scene has `stage` is scored report-only (WARN).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

TEXT_BUDGET_PER_SCENE = 5      # one display-class line + a handful of micro-labels (3g)
CONTAINERS_PER_SCENE = 6       # the canvas negotiates a handful of containers (containment law)
ENTRIES_PER_BEAT = 3           # arrivals cost attention — a beat introduces at most a couple of elements
_ENTRY_STATES = {"absent", "hidden", "not-yet-entered"}
PROCESS_NARRATION = re.compile(
    r"\b(each|every|per)\s+\w+|\bkeeps?\s+\w+ing\b|\bstreams?\b|\brepeated(ly)?\b|\bone\s+at\s+a\s+time\b",
    re.IGNORECASE,
)


def score(path: Path) -> int:
    d = json.loads(path.read_text(encoding="utf-8"))
    scenes = d.get("scenes", [])
    legacy = not any(sc.get("stage") for sc in scenes)

    # CONCEPT COVERAGE — the provenance spine: every concept taught by >=1 beat, every beat traced.
    concept_ids = {c.get("id") for c in (d.get("concepts") or []) if c.get("id")}
    taught: set = set()
    untraced_beats: list[str] = []

    fails: list[str] = []
    n_bullets = sum(len(sc.get("bullets", [])) for sc in scenes)
    n_sem = 0
    proc_needed = 0
    proc_have = 0
    text_over: list[str] = []
    stage_missing: list[int] = []
    load_over: list[str] = []

    for sc in scenes:
        num = sc.get("number")
        stage = sc.get("stage") or {}
        if not stage.get("composite"):
            stage_missing.append(num)
        scene_proc = bool(stage.get("process"))
        # VISUAL LOAD — containers: element/text zones the canvas negotiates (containment law)
        zones = stage.get("zones") or []
        n_containers = sum(1 for z in zones if z.get("kind") in ("element", "text"))
        if n_containers > CONTAINERS_PER_SCENE:
            load_over.append(f"scene {num}: {n_containers} canvas containers (> {CONTAINERS_PER_SCENE}) — "
                             f"density belongs INSIDE containers, not in more of them")
        texts = 0
        for i, b in enumerate(sc.get("bullets", []), 1):
            sem = b.get("semantics") or {}
            if sem:
                n_sem += 1
            if concept_ids:
                cid = str(sem.get("concept", "")).strip()
                if cid in concept_ids:
                    taught.add(cid)
                elif not cid:
                    untraced_beats.append(f"scene {num} bullet {i}")
                else:
                    fails.append(f"scene {num} bullet {i}: semantics.concept '{cid}' not in the contract's concepts list")
            if str(b.get("text", "")).strip():
                texts += 1
            # VISUAL LOAD — entries: transitions arriving from an off-stage state cost attention
            entries = sum(1 for t in sem.get("transitions", [])
                          if str(t.get("from", "")).strip().lower() in _ENTRY_STATES)
            if entries > ENTRIES_PER_BEAT:
                load_over.append(f"scene {num} bullet {i}: {entries} elements ENTER in one beat "
                                 f"(> {ENTRIES_PER_BEAT}) — arrivals cost attention; spread or cut")
            narr = " ".join(s.get("text", "") for s in b.get("narration", []))
            if PROCESS_NARRATION.search(narr):
                proc_needed += 1
                if sem.get("process") or scene_proc:
                    proc_have += 1
                else:
                    fails.append(
                        f"scene {num} bullet {i}: narration describes per-unit/rate behavior "
                        f"but carries NO process (semantics.process / stage.process) — an "
                        f"arrival where a process is taught")
        if texts > TEXT_BUDGET_PER_SCENE:
            text_over.append(f"scene {num}: {texts} rendered-text fields (> {TEXT_BUDGET_PER_SCENE})")

    series = len(((d.get("numbers_ledger") or {}).get("series")) or [])
    trace_steps = len((((d.get("numbers_ledger") or {}).get("trace")) or {}).get("steps") or [])
    any_process = proc_needed > 0 or any((sc.get("stage") or {}).get("process") for sc in scenes)

    if n_sem < n_bullets:
        fails.append(f"semantics coverage {n_sem}/{n_bullets} — every bullet needs its semantics block")
    if concept_ids:
        untaught = sorted(concept_ids - taught)
        if untaught:
            fails.append(f"CONCEPT COVERAGE: concept(s) never taught by any beat: {untaught} — "
                         f"a concept the viewer never sees is a silent curriculum hole")
        if untraced_beats:
            fails.append(f"beats with no semantics.concept (untraced): {untraced_beats[:6]}"
                         f"{'…' if len(untraced_beats) > 6 else ''}")
    fails.extend(text_over)
    fails.extend(load_over)
    if stage_missing:
        fails.append(f"stage.composite missing on scene(s): {stage_missing}")
    if any_process and trace_steps == 0:
        fails.append("processes exist but numbers_ledger.trace is empty — cycles will be decorative "
                     "(no real per-pass values); research the trace")

    proc_pct = 100 if proc_needed == 0 else round(100 * proc_have / proc_needed)
    concepts_str = (f"concepts={len(taught)}/{len(concept_ids)}" if concept_ids else "concepts=absent")
    print(f"SCRIPT-SCORECARD: semantics={n_sem}/{n_bullets} process={proc_have}/{proc_needed} "
          f"({proc_pct}%) {concepts_str} text_budget={'OK' if not text_over else 'OVER'} "
          f"load={'OK' if not load_over else 'OVER'} "
          f"stage={len(scenes)-len(stage_missing)}/{len(scenes)} series={series} trace_steps={trace_steps}")

    if legacy:
        if fails:
            print(f"legacy contract (no stage anywhere) — report-only; {len(fails)} gap(s):")
            for f in fails:
                print("  •", f)
        return 0
    if fails:
        print(f"{len(fails)} violation(s):")
        for f in fails:
            print("  •", f)
        return 1
    print("scorecard: all bars met")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(score(Path(sys.argv[1])))
