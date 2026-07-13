"""Effort / bug analytics for the video pipeline.

SOURCE (live, per scene): each project's `projects/<name>/verification.md` carries a
"### Bug ledger" table — one row per bug fixed:
    | attempt | bug (symptom) | type | sev | owner skill | fix applied | min | resolved |
(owned by vg-verification-protocol; written during the per-scene VERIFY→FIX loop).

STORE (durable, measurable): `effort/<project>.json` + `effort/<project>.md` — a per-project
effort record DERIVED from that ledger (regenerated, never hand-edited, so it can't drift).
`effort/_SUMMARY.md` aggregates every project → "where is the pipeline weakest?".

Usage:
    python -m storyboard.bug_stats --save            # (re)build effort/ for every project
    python -m storyboard.bug_stats --save <project>  # one project
    python -m storyboard.bug_stats                   # aggregate report (reads effort/, writes _SUMMARY.md)
    python -m storyboard.bug_stats <project>         # one project's report
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EFFORT_DIR = ROOT / "effort"

TYPE_VOCAB = {
    "layout", "animation", "timing", "sequencing", "transitions", "text",
    "tokens", "images", "audio", "assets", "rendering",
}
_EXAMPLE_FIXES = {"moved footer to top:h*0.82", "added overshoot + stagger",
                  "fixed framesfrom in json+mirror", "moved label", "fittext"}


def _parse_ledger(md_path: Path) -> list[dict]:
    """Bug rows under every '### Bug ledger' section of one verification.md."""
    rows: list[dict] = []
    in_ledger = False
    cur_scene = "?"
    for line in md_path.read_text(encoding="utf-8", errors="replace").splitlines():
        s = line.strip()
        m = re.match(r"##\s+Scene\s+(\S+)", s)
        if m:
            cur_scene = m.group(1)
        if s.lower().startswith("### bug ledger"):
            in_ledger = True
            continue
        if in_ledger and (s.startswith("###") or s.startswith("##") or s.startswith("**")):
            in_ledger = False
        if not in_ledger or not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if len(cells) < 8:
            continue
        attempt, bug, btype, sev, owner, fix, mins, resolved = cells[:8]
        if attempt.lower() in ("attempt", "") or set(attempt) <= {"-", ":"}:
            continue
        if fix.lower() in _EXAMPLE_FIXES:
            continue
        try:
            minutes = float(re.sub(r"[^0-9.]", "", mins) or 0)
        except ValueError:
            minutes = 0.0
        try:
            att = int(re.sub(r"[^0-9]", "", attempt) or 0)
        except ValueError:
            att = 0
        rows.append({"scene": cur_scene, "attempt": att, "bug": bug, "type": btype.lower(),
                     "sev": sev.lower(), "owner": owner, "min": minutes,
                     "resolved": resolved.lower().startswith("y")})
    return rows


def _parse_invoked(md_path: Path) -> dict[str, list[str]]:
    """Return {scene: [skills invoked]} from each '### Skills invoked' section
    ('- author:' / '- verify:' lines, ·-separated)."""
    out: dict[str, list[str]] = {}
    in_block = False
    cur_scene = "?"
    for line in md_path.read_text(encoding="utf-8", errors="replace").splitlines():
        s = line.strip()
        m = re.match(r"##\s+Scene\s+(\S+)", s)
        if m:
            cur_scene = m.group(1)
        if s.lower().startswith("### skills invoked"):
            in_block = True
            continue
        if in_block and s.startswith("###"):
            in_block = False
        if in_block and re.match(r"-\s*(author|verify)\s*:", s, re.I):
            names = s.split(":", 1)[1]
            for raw in re.split(r"[·,]", names):
                name = raw.strip()
                if name and name not in ("…", "..."):
                    out.setdefault(cur_scene, [])
                    if name not in out[cur_scene]:
                        out[cur_scene].append(name)
    return out


def project_record(project: str) -> dict | None:
    md = ROOT / "projects" / project / "verification.md"
    if not md.exists():
        return None
    bugs = _parse_ledger(md)
    invoked_by_scene = _parse_invoked(md)
    scenes = sorted({b["scene"] for b in bugs} | set(invoked_by_scene))
    passes = sum(max((b["attempt"] for b in bugs if b["scene"] == s), default=0) for s in scenes)
    invoked_count: Counter = Counter()  # skill -> # scenes it was invoked in
    for sk_list in invoked_by_scene.values():
        invoked_count.update(set(sk_list))
    return {
        "project": project,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "scenes": len(scenes),
        "total_bugs": len(bugs),
        "total_fix_min": round(sum(b["min"] for b in bugs), 1),
        "passes_total": passes,
        "by_type": dict(Counter(b["type"] for b in bugs).most_common()),
        "by_owner": dict(Counter(b["owner"] for b in bugs).most_common()),
        "by_severity": dict(Counter(b["sev"] for b in bugs).most_common()),
        "invoked_count": dict(invoked_count.most_common()),
        "invoked_by_scene": invoked_by_scene,
        "unresolved": sum(1 for b in bugs if not b["resolved"]),
        "bugs": bugs,
    }


def _record_md(rec: dict) -> str:
    L = [f"# Effort record — {rec['project']}", "",
         f"_generated {rec['generated_at']} from projects/{rec['project']}/verification.md "
         f"(derived — do not hand-edit)._", "",
         f"- scenes: **{rec['scenes']}**", f"- total bugs: **{rec['total_bugs']}**",
         f"- total fix time: **{rec['total_fix_min']} min**",
         f"- rework passes: **{rec['passes_total']}**",
         f"- unresolved: {rec['unresolved']}", "", "## By type", ""]
    tot = rec["total_bugs"] or 1
    for t, n in rec["by_type"].items():
        L.append(f"- {t}: {n} ({100*n/tot:.0f}%)")
    L += ["", "## By owner skill (most-reworked first)", ""]
    for o, n in rec["by_owner"].items():
        L.append(f"- {o}: {n}")
    if rec.get("invoked_count"):
        L += ["", "## Skills invoked (frequency)", ""]
        for sk, n in rec["invoked_count"].items():
            owned = rec["by_owner"].get(sk, 0)
            flag = f"  ⚠ still owned {owned} bug(s) despite invocation" if owned else ""
            L.append(f"- {sk}: {n} scene(s){flag}")
    return "\n".join(L) + "\n"


def save(project: str | None) -> list[str]:
    EFFORT_DIR.mkdir(exist_ok=True)
    projects = ([project] if project else
                sorted(p.parent.name for p in (ROOT / "projects").glob("*/verification.md")))
    written = []
    for proj in projects:
        rec = project_record(proj)
        if not rec or rec["total_bugs"] == 0:
            continue
        (EFFORT_DIR / f"{proj}.json").write_text(json.dumps(rec, indent=2, ensure_ascii=False), encoding="utf-8")
        (EFFORT_DIR / f"{proj}.md").write_text(_record_md(rec), encoding="utf-8")
        written.append(proj)
    return written


def _load_records(project: str | None) -> list[dict]:
    """Prefer the persisted effort/ store; fall back to parsing verification.md live."""
    if project:
        rec = project_record(project)
        return [rec] if rec and rec["total_bugs"] else []
    recs = []
    if EFFORT_DIR.exists() and any(EFFORT_DIR.glob("*.json")):
        for jf in sorted(EFFORT_DIR.glob("*.json")):
            try:
                recs.append(json.loads(jf.read_text(encoding="utf-8")))
            except Exception:  # noqa: BLE001
                pass
    else:
        for p in sorted((ROOT / "projects").glob("*/verification.md")):
            r = project_record(p.parent.name)
            if r and r["total_bugs"]:
                recs.append(r)
    return recs


def _bar(n: int, total: int, w: int = 24) -> str:
    f = 0 if total == 0 else round(w * n / total)
    return "#" * f + "." * (w - f)


def report(project: str | None) -> None:
    recs = _load_records(project)
    if not recs:
        print("No bug-ledger data. Scenes record it in projects/*/verification.md under "
              "'### Bug ledger'; run `--save` to build effort/.")
        return
    by_type: Counter = Counter()
    by_owner: Counter = Counter()
    by_sev: Counter = Counter()
    invoked: Counter = Counter()      # skill -> # scenes invoked
    owner_min: dict = defaultdict(float)
    total = mins = 0
    for r in recs:
        by_type.update(r["by_type"]); by_owner.update(r["by_owner"]); by_sev.update(r["by_severity"])
        invoked.update(r.get("invoked_count", {}))
        total += r["total_bugs"]; mins += r["total_fix_min"]
        for b in r.get("bugs", []):
            owner_min[b["owner"]] += b["min"]

    lines = [f"=== EFFORT / BUG STATS — {total} bugs across {len(recs)} project(s), {mins:.0f} min fix time ===", ""]
    lines.append("By TYPE (where the bugs are):")
    for t, n in by_type.most_common():
        lines.append(f"  {t:12s} {n:3d}  {100*n/total:4.0f}%  {_bar(n, total)}")
    lines.append("")
    lines.append("By OWNER SKILL (weakest = most-reworked → fix at the source):")
    for o, n in by_owner.most_common():
        extra = f"  {owner_min[o]:4.0f} min" if owner_min.get(o) else ""
        lines.append(f"  {o:26s} {n:3d} bugs{extra}")
    lines.append("")
    lines.append("By SEVERITY: " + " · ".join(f"{k}={v}" for k, v in by_sev.most_common()))

    if invoked:
        lines += ["", "SKILL INVOCATION (how often each skill was actually run):"]
        for sk, n in invoked.most_common():
            lines.append(f"  {sk:26s} invoked in {n:3d} scene(s)")
        # EFFECTIVENESS: a skill invoked yet still owning bugs = its guidance isn't landing → improve the skill
        eff = [(sk, by_owner.get(sk, 0), inv) for sk, inv in invoked.items() if by_owner.get(sk, 0) > 0]
        if eff:
            lines += ["", "EFFECTIVENESS — invoked but STILL bugged (bugs ÷ scenes-invoked → fix the SKILL, not just the scene):"]
            for sk, bugs_owned, inv in sorted(eff, key=lambda x: x[1] / max(x[2], 1), reverse=True):
                lines.append(f"  {sk:26s} {bugs_owned:2d} bugs / {inv:2d} invocations  = {bugs_owned/inv:.2f} bugs per use")
    out = "\n".join(lines)
    print(out)

    if not project and recs:
        EFFORT_DIR.mkdir(exist_ok=True)
        (EFFORT_DIR / "_SUMMARY.md").write_text(
            "# Effort — cross-project summary\n\n```\n" + out + "\n```\n", encoding="utf-8")
        print(f"\n(wrote {EFFORT_DIR.name}/_SUMMARY.md)")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("project", nargs="?", default=None)
    ap.add_argument("--save", action="store_true", help="(re)build effort/<project>.json+.md from verification.md")
    args = ap.parse_args(argv)
    sys.stdout.reconfigure(encoding="utf-8")
    if args.save:
        w = save(args.project)
        print(f"effort/ updated for {len(w)} project(s): {', '.join(w) or '(none with bugs)'}")
    report(args.project)
    return 0


if __name__ == "__main__":
    sys.exit(main())
