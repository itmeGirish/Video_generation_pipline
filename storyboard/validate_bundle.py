"""
Pre-seed static validator for a bullet bundle JSON.

Run BEFORE seed_bullet_cache.py to catch forbidden patterns that would produce
BLOCK COMPILE ERROR or BLOCK RUNTIME ERROR frames in the final render.

Usage:
  python storyboard/validate_bundle.py <bundle.json>

Exit 0 = clean. Exit 1 = violations found (do NOT seed until fixed).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


FORBIDDEN = [
    (r'#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])',
     "bare hex color (use D.* token)"),
    (r"\btransition\s*:",
     "CSS transition: (use interpolate/spring)"),
    (r"\banimation\s*:",
     "CSS animation: (use interpolate/spring)"),
    (r"<[A-Za-z][A-Za-z0-9]*[\s/>]",
     "JSX tag (use React.createElement)"),
    (r"\bimport\b|\brequire\s*\(",
     "import/require (no module system at runtime)"),
]

HEX_ALLOWLIST = re.compile(r"D\.\w+\s*\+\s*['\"]#[0-9a-fA-F]{2}['\"]")


def check_bundle(path: Path) -> list[str]:
    try:
        bundle = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        return [f"JSON parse error: {e}"]

    errors: list[str] = []

    for entry in bundle:
        scene = entry.get("scene", "?")
        bullet = entry.get("bullet", "?")
        code = entry.get("code", "")
        tag = f"S{scene}-B{bullet}"

        if not entry.get("anchor", "").strip():
            errors.append(f"{tag}: missing audio_anchor")

        for pattern, description in FORBIDDEN:
            for m in re.finditer(pattern, code):
                # Allow D.cyan + '#AA' opacity suffix pattern
                if "hex color" in description:
                    context = code[max(0, m.start()-10):m.end()+10]
                    if HEX_ALLOWLIST.search(context):
                        continue
                errors.append(f"{tag}: {description} — `{m.group()}`")

        # REPLACE bullet must start root from AbsoluteFill with background
        if "backgroundColor:D.bg" not in code.replace(" ", "") and \
           "backgroundColor: D.bg" not in code:
            # Only flag if this looks like a REPLACE bullet (contains AbsoluteFill)
            if "AbsoluteFill" in code and "backgroundColor" not in code:
                errors.append(f"{tag}: REPLACE bullet has no backgroundColor:D.bg on root — prior bullets bleed through")

    return errors


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python storyboard/validate_bundle.py <bundle.json>")
        return 1

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"ERROR: {path} not found")
        return 1

    errors = check_bundle(path)

    if not errors:
        bundle = json.loads(path.read_text(encoding="utf-8"))
        print(f"OK — {len(bundle)} bullets, no violations found")
        return 0

    print(f"VIOLATIONS ({len(errors)}) — fix before seeding:\n")
    for e in errors:
        print(f"  • {e}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
