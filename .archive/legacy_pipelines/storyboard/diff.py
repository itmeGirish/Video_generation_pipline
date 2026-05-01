"""
storyboard diff — show timing changes between two compiled builds.
Uses manifest.json.snapshot + current timelines/ to compute shifts.

Usage:
  python storyboard/diff.py snapshot      → save current state as baseline
  python storyboard/diff.py               → compare current vs saved baseline
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path("c:/Girish/Fundamental_Projects/video_generation/video_explainer")
TIMELINES_DIR = ROOT / "storyboard" / "timelines"
SNAPSHOT = ROOT / "storyboard" / ".snapshot.json"


def collect_current():
    out = {}
    for f in sorted(TIMELINES_DIR.glob("*.json")):
        if f.name == "manifest.json":
            continue
        t = json.loads(f.read_text(encoding="utf-8"))
        out[t["id"]] = {
            "durationFrames": t["durationFrames"],
            "phases": {p["id"]: (p["fromFrame"], p["toFrame"]) for p in t["phases"]},
            "anchors": t["anchors"],
        }
    return out


def save_snapshot():
    data = collect_current()
    SNAPSHOT.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"✓ saved snapshot ({len(data)} scenes) → {SNAPSHOT}")


def diff():
    if not SNAPSHOT.exists():
        print("No snapshot. Run: python storyboard/diff.py snapshot")
        return 1

    old = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    new = collect_current()
    all_ids = sorted(set(old) | set(new))
    changes = 0

    for sid in all_ids:
        if sid not in old:
            print(f"+ {sid}  NEW scene ({new[sid]['durationFrames']}f)")
            changes += 1
            continue
        if sid not in new:
            print(f"- {sid}  REMOVED")
            changes += 1
            continue

        a, b = old[sid], new[sid]
        scene_changes = []

        if a["durationFrames"] != b["durationFrames"]:
            scene_changes.append(
                f"    duration: {a['durationFrames']}f → {b['durationFrames']}f "
                f"({(b['durationFrames']-a['durationFrames'])/30:+.1f}s)"
            )

        # Phase shifts
        all_phases = sorted(set(a["phases"]) | set(b["phases"]))
        for p in all_phases:
            if p not in a["phases"]:
                scene_changes.append(f"    + phase '{p}' added")
            elif p not in b["phases"]:
                scene_changes.append(f"    - phase '{p}' removed")
            elif tuple(a["phases"][p]) != tuple(b["phases"][p]):
                af, at = a["phases"][p]
                bf, bt = b["phases"][p]
                scene_changes.append(
                    f"    ~ phase '{p}': {af}-{at} → {bf}-{bt} "
                    f"(shift start {bf-af:+d}f / duration {(bt-bf)-(at-af):+d}f)"
                )

        # Anchor shifts
        for aname in sorted(set(a["anchors"]) | set(b["anchors"])):
            if aname not in a["anchors"]:
                scene_changes.append(f"    + anchor '{aname}' = {b['anchors'][aname]}f")
            elif aname not in b["anchors"]:
                scene_changes.append(f"    - anchor '{aname}' removed")
            elif a["anchors"][aname] != b["anchors"][aname]:
                scene_changes.append(
                    f"    ~ anchor '{aname}': {a['anchors'][aname]}f → {b['anchors'][aname]}f "
                    f"({(b['anchors'][aname]-a['anchors'][aname])/30:+.1f}s)"
                )

        if scene_changes:
            print(f"\n~ {sid}")
            for c in scene_changes:
                print(c)
            changes += len(scene_changes)

    if changes == 0:
        print("✓ no changes since last snapshot")
        return 0
    print(f"\n{changes} change(s) detected")
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "snapshot":
        save_snapshot()
    else:
        sys.exit(diff())
