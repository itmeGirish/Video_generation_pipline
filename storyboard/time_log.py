"""time_log.py — per-project PHASE TIME LOG (how long script-gen · video-gen · verification took).

Records wall-clock time per pipeline phase into the project, so every video carries its own timing
record. Machine store: `projects/<name>/time_log.json` (append-only). Human report:
`projects/<name>/time_log.md` (regenerated on every write). Distinct from build_timing.json (the video's
PLAYBACK durations) — this is the WALL-CLOCK cost to produce it.

Canonical phases (free-form allowed): `script-generation` · `video-generation` · `verification`.
It also auto-ingests `production_time.json` (build_video's own render wall-clock) as `video-generation`
so the render time flows in without double-entry.

Modes:
    python -m storyboard.time_log <project> start <phase>              # stopwatch: mark start
    python -m storyboard.time_log <project> stop  <phase> [--note ..]  # stopwatch: record elapsed
    python -m storyboard.time_log <project> log   <phase> <seconds> [--note ..]   # record a known duration
    python -m storyboard.time_log <project> wrap  <phase> -- <cmd...>  # time a subprocess, record it
    python -m storyboard.time_log <project> report                    # (re)generate + print time_log.md

Exit 0 on success; `wrap` propagates the wrapped command's exit code.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _proj_dir(project: str) -> Path:
    return ROOT / "projects" / project


def _hms(seconds: float) -> str:
    s = int(round(seconds))
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    if h:
        return f"{h}h {m:02d}m"
    if m:
        return f"{m}m {sec:02d}s"
    return f"{sec}s"


def _load(project: str) -> dict:
    f = _proj_dir(project) / "time_log.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    return {"project": project, "entries": [], "_running": {}}


def _ingest_production_time(project: str, data: dict) -> None:
    """Fold build_video's own render wall-clock (production_time.json) into video-generation once."""
    pt = _proj_dir(project) / "production_time.json"
    if not pt.exists():
        return
    try:
        p = json.loads(pt.read_text(encoding="utf-8"))
    except Exception:
        return
    secs = p.get("build_seconds")
    if not secs:
        return
    key = f"video-generation@{p.get('build_started', '')}"
    if any(e.get("_src") == key for e in data["entries"]):
        return
    data["entries"].append({
        "phase": "video-generation", "seconds": round(float(secs), 1),
        "started": p.get("build_started", ""), "note": "build_video render (from production_time.json)",
        "_src": key,
    })


def _regen_md(project: str, data: dict) -> None:
    _ingest_production_time(project, data)
    entries = data["entries"]
    total = sum(e.get("seconds", 0) for e in entries)
    # per-phase rollup
    from collections import OrderedDict
    roll: "OrderedDict[str, float]" = OrderedDict()
    for e in entries:
        roll[e["phase"]] = roll.get(e["phase"], 0) + e.get("seconds", 0)

    # video runtime for a build-ratio, if known
    ratio = ""
    bt = _proj_dir(project) / "build_timing.json"
    if bt.exists():
        try:
            vsec = json.loads(bt.read_text(encoding="utf-8")).get("total_sec")
            if vsec:
                ratio = f"   ·   video runtime {_hms(vsec)} → **{total / vsec:.0f}× real-time to produce**"
        except Exception:
            pass

    L = [
        f"# {project} — time log",
        f"_Wall-clock cost to PRODUCE this video, per pipeline phase. Regenerated "
        f"{datetime.now(timezone.utc).astimezone().strftime('%Y-%m-%d %H:%M')}._",
        "",
        "## By phase",
        "| phase | total |",
        "|---|---|",
    ]
    for ph, sec in roll.items():
        L.append(f"| {ph} | {_hms(sec)} ({sec:.0f}s) |")
    L += [f"| **TOTAL** | **{_hms(total)} ({total:.0f}s)**{ratio} |", "", "## Entries", "| phase | started | duration | note |", "|---|---|---|---|"]
    for e in entries:
        L.append(f"| {e['phase']} | {e.get('started','')[:16].replace('T',' ')} | "
                 f"{_hms(e.get('seconds',0))} | {e.get('note','')} |")
    L.append("")
    (_proj_dir(project) / "time_log.md").write_text("\n".join(L), encoding="utf-8")


def _save(project: str, data: dict) -> None:
    d = _proj_dir(project)
    d.mkdir(parents=True, exist_ok=True)
    (d / "time_log.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    _regen_md(project, data)


def _add_entry(data: dict, phase: str, seconds: float, started: str, note: str) -> None:
    data["entries"].append({"phase": phase, "seconds": round(seconds, 1),
                            "started": started, "note": note})


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("project")
    ap.add_argument("mode", choices=["start", "stop", "log", "wrap", "report"])
    ap.add_argument("phase", nargs="?", default="")
    ap.add_argument("rest", nargs="*", help="seconds (log) | -- cmd... (wrap)")
    ap.add_argument("--note", default="")
    args, _ = ap.parse_known_args(argv)
    # split off the wrap command after `--`
    raw = argv if argv is not None else sys.argv[1:]
    cmd = raw[raw.index("--") + 1:] if "--" in raw else []

    data = _load(args.project)
    now = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")

    if args.mode == "report":
        _save(args.project, data)
        print((_proj_dir(args.project) / "time_log.md").read_text(encoding="utf-8"))
        return 0

    if args.mode == "start":
        data["_running"][args.phase] = time.time()
        _save(args.project, data)
        print(f"time_log: started '{args.phase}' for {args.project}")
        return 0

    if args.mode == "stop":
        t0 = data["_running"].pop(args.phase, None)
        if t0 is None:
            print(f"time_log: no running '{args.phase}' — use `log` to record a known duration")
            return 1
        _add_entry(data, args.phase, time.time() - t0, now, args.note)
        _save(args.project, data)
        print(f"time_log: '{args.phase}' = {_hms(time.time() - t0)}")
        return 0

    if args.mode == "log":
        try:
            secs = float(args.phase and args.rest[0])
        except (IndexError, ValueError):
            print("time_log: `log <phase> <seconds>` — seconds required")
            return 2
        _add_entry(data, args.phase, secs, now, args.note)
        _save(args.project, data)
        print(f"time_log: '{args.phase}' = {_hms(secs)}")
        return 0

    if args.mode == "wrap":
        if not cmd:
            print("time_log: `wrap <phase> -- <command...>` — command required after --")
            return 2
        t0 = time.time()
        rc = subprocess.run(cmd).returncode
        _add_entry(data, args.phase, time.time() - t0, now, args.note or " ".join(cmd)[:60])
        _save(args.project, data)
        print(f"time_log: '{args.phase}' = {_hms(time.time() - t0)} (exit {rc})")
        return rc
    return 0


if __name__ == "__main__":
    sys.exit(main())
