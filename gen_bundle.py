#!/usr/bin/env python3
"""
Combine all scene parts into bundle_chat_5_5.json.
Run: python gen_bundle.py
"""
import json, pathlib, importlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

def load_part(module_name):
    mod = importlib.import_module(module_name)
    return mod.bundle

parts = ["gen_bundle_s1_s3", "gen_bundle_s4_s5", "gen_bundle_s6_s8", "gen_bundle_s9_s10"]

full_bundle = []
for p in parts:
    entries = load_part(p)
    full_bundle.extend(entries)

# Verify counts
expected = {1:8, 2:5, 3:10, 4:14, 5:10, 6:7, 7:6, 8:6, 9:10, 10:10}
actual = {}
for e in full_bundle:
    s = e["scene"]
    actual[s] = actual.get(s, 0) + 1

print(f"\nBundle summary — {len(full_bundle)} total bullets:")
all_ok = True
for s in sorted(expected):
    exp = expected[s]
    got = actual.get(s, 0)
    status = "OK" if got == exp else f"MISMATCH (expected {exp})"
    print(f"  Scene {s:2d}: {got:2d} bullets  {status}")
    if got != exp:
        all_ok = False

if not all_ok:
    print("\nERROR: bullet count mismatch — fix before seeding")
    sys.exit(1)

out = pathlib.Path("bundle_chat_5_5.json")
out.write_text(json.dumps(full_bundle, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"\nWrote {len(full_bundle)} bullets → {out}")
print("\nNext steps:")
print("  python storyboard/validate_bundle.py bundle_chat_5_5.json")
print("  python storyboard/seed_bullet_cache.py projects/scripts/chat_5_5.txt --json bundle_chat_5_5.json")
