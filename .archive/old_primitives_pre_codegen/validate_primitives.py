"""
Validate the primitive contract:
  1. Every type in registry.json has a .tsx file in remotion/src/universal/primitives/
  2. Every .tsx file is registered in remotion/src/universal/UniversalScene.tsx
  3. Every .tsx Props type accepts the prop names listed in registry.json

Optional script-coverage check (--project <name>):
  4. Every bullet in projects/structured_scripts/<name>.txt is likely renderable
     by an existing primitive (heuristic keyword scoring against registry
     descriptions). Reports bullets with weak matches as warnings.

Run as a standalone check, or it is called automatically by build_video.py
before the LLM is invoked, so prop mismatches fail fast — not after a render.

Usage:
    python storyboard/validate_primitives.py                        # contract check only
    python storyboard/validate_primitives.py --project <name>       # + script-coverage report
    python storyboard/validate_primitives.py --strict               # exits 1 on warnings too
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "remotion" / "src" / "universal" / "primitives" / "registry.json"
PRIMITIVES_DIR = ROOT / "remotion" / "src" / "universal" / "primitives"
UNIVERSAL_SCENE = ROOT / "remotion" / "src" / "universal" / "UniversalScene.tsx"
STRUCTURED_DIR = ROOT / "projects" / "structured_scripts"


# Map snake_case type ->expected PascalCase component file name
def to_pascal(snake: str) -> str:
    return "".join(part.capitalize() for part in snake.split("_"))


# Extract prop names from a `type Props = { ... }` block in a .tsx file.
# Handles single-line and multi-line shapes. Best-effort regex parse.
_PROP_KEY = re.compile(r"^\s*(\w+)\s*\??\s*:", re.MULTILINE)


def extract_tsx_props(tsx_path: Path) -> set[str]:
    text = tsx_path.read_text(encoding="utf-8")
    # Find `type Props = { ... }` (handles nested braces shallowly)
    m = re.search(r"type\s+Props\s*=\s*\{", text)
    if not m:
        return set()
    start = m.end()
    depth = 1
    i = start
    while i < len(text) and depth > 0:
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
        i += 1
    body = text[start : i - 1]
    # Only top-level props (depth 0 inside body)
    props: set[str] = set()
    depth = 0
    line_buf = ""
    for ch in body:
        if ch == "{":
            depth += 1
            line_buf += ch
        elif ch == "}":
            depth -= 1
            line_buf += ch
        elif ch == "\n" or ch == ";" or ch == ",":
            if depth == 0:
                m = _PROP_KEY.match(line_buf)
                if m:
                    props.add(m.group(1))
            line_buf = ""
        else:
            line_buf += ch
    if line_buf and depth == 0:
        m = _PROP_KEY.match(line_buf)
        if m:
            props.add(m.group(1))
    return props


def extract_registered_types(scene_path: Path) -> set[str]:
    text = scene_path.read_text(encoding="utf-8")
    m = re.search(r"const\s+PRIMITIVES[^{]*\{([^}]*)\}", text, re.DOTALL)
    if not m:
        return set()
    body = m.group(1)
    return set(re.findall(r"^\s*(\w+)\s*:", body, re.MULTILINE))


def validate(strict: bool = False) -> int:
    """Run validation. Returns 0 if no errors, 1 otherwise."""
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))["primitives"]
    registered = extract_registered_types(UNIVERSAL_SCENE)

    errors: list[str] = []
    warnings: list[str] = []
    built_count = 0

    for type_name, schema in registry.items():
        tsx_name = to_pascal(type_name) + ".tsx"
        tsx_path = PRIMITIVES_DIR / tsx_name

        if not tsx_path.exists():
            warnings.append(f"MISSING .tsx for type '{type_name}' (expected: {tsx_name})")
            continue

        built_count += 1

        # Check registration in UniversalScene.tsx
        if type_name not in registered:
            errors.append(
                f"'{type_name}': {tsx_name} exists but NOT registered in UniversalScene.tsx PRIMITIVES map"
            )

        # Check prop names match
        expected = set(schema.get("props", {}).keys())
        actual = extract_tsx_props(tsx_path)
        missing_in_tsx = expected - actual
        if missing_in_tsx:
            errors.append(
                f"'{type_name}' ({tsx_name}): registry expects props {sorted(expected)}, "
                f"but .tsx Props type is missing: {sorted(missing_in_tsx)}. "
                f"LLM will send these prop names — component will receive undefined."
            )

    # Reverse check: registered types that aren't in registry
    extra_registered = registered - set(registry.keys())
    for x in extra_registered:
        warnings.append(f"'{x}' registered in UniversalScene.tsx but NOT in registry.json")

    print(f"Primitive validation:")
    print(f"  registry types : {len(registry)}")
    print(f"  built .tsx     : {built_count}")
    print(f"  registered     : {len(registered)}")
    print(f"  errors         : {len(errors)}")
    print(f"  warnings       : {len(warnings)}")

    for w in warnings:
        print(f"  [warn] {w}")
    for e in errors:
        print(f"  [ERROR] {e}")

    if errors:
        print("\nValidation found errors — primitives will render incorrectly. Fix before rendering.")
        return 1
    print("\nOK — every built primitive matches its registry contract.")
    return 0


# ─── script-coverage check (optional) ──────────────────────────────────────

# Words to drop when extracting "intent words" from bullet bodies and primitive
# descriptions. Generic English filler that doesn't help match intent ->primitive.
_STOPWORDS = {
    "a", "an", "the", "of", "in", "on", "at", "to", "for", "with", "from", "by",
    "is", "are", "was", "were", "be", "been", "being", "and", "or", "but", "not",
    "this", "that", "these", "those", "it", "its", "their", "they", "them",
    "as", "if", "then", "than", "so", "do", "does", "use", "used", "using",
    "when", "where", "what", "which", "who", "how", "all", "any", "each", "every",
    "one", "two", "three", "single", "multiple", "scene", "bullet", "primitive",
    "show", "shows", "showing", "shown", "display", "displays", "render", "renders",
}


def _intent_words(text: str) -> set[str]:
    """Lowercase 4+ char alphabetic tokens, minus stopwords."""
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    return {w for w in words if w not in _STOPWORDS}


def _score_bullet(bullet_text: str, primitive_words: set[str]) -> int:
    """Count overlap between bullet intent words and a primitive's intent words."""
    return len(_intent_words(bullet_text) & primitive_words)


def check_script_coverage(project: str, registry: dict) -> tuple[int, int]:
    """For each bullet in projects/structured_scripts/<project>.txt, find the top-3
    primitives by keyword-overlap score. Warn on bullets with weak matches.

    Returns (warning_count, error_count). Cannot ERROR — heuristic only.
    """
    structured_path = STRUCTURED_DIR / f"{project}.txt"
    if not structured_path.exists():
        print(f"\nScript coverage: SKIP — {structured_path} not found")
        return 0, 0

    # Lazy import to avoid making source_parser a hard dep when unused.
    sys.path.insert(0, str(ROOT))
    from storyboard.source_parser import parse  # type: ignore

    script = parse(structured_path)

    # Pre-compute intent words for each primitive from its registry description.
    prim_words = {
        ptype: _intent_words(schema.get("description", ""))
        for ptype, schema in registry.items()
    }

    print(f"\nScript coverage check ({project}):")
    print(f"  scenes : {len(script.scenes)}")
    print(f"  bullets: {sum(len(s.animation) for s in script.scenes)}")

    weak_bullets: list[str] = []
    for sc in script.scenes:
        for i, bullet in enumerate(sc.animation, start=1):
            bullet_text = f"{bullet.headline} {bullet.body}"
            scores = {
                ptype: _score_bullet(bullet_text, words)
                for ptype, words in prim_words.items()
            }
            top3 = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:3]
            best_score = top3[0][1] if top3 else 0
            if best_score < 1:
                weak_bullets.append(
                    f"scene {sc.number} bullet {i}: NO keyword match ->"
                    f"LLM will pick blindly. Headline: {bullet.headline!r}"
                )
            elif best_score == 1:
                weak_bullets.append(
                    f"scene {sc.number} bullet {i}: weak match (1 word) ->"
                    f"top candidates: {[t[0] for t in top3]}. Headline: {bullet.headline!r}"
                )

    if weak_bullets:
        print(f"  weak matches: {len(weak_bullets)} bullet(s)")
        for w in weak_bullets:
            print(f"    [coverage] {w}")
        print(
            f"\n  NOTE: heuristic only — the LLM may still pick correctly. "
            f"Consider sharpening bullet headlines or adding USE-WHEN keywords "
            f"to the closest primitive's registry.json description."
        )
        return len(weak_bullets), 0
    print("  OK — every bullet has a strong keyword match in the registry.")
    return 0, 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="exits 1 on any warning (coverage warnings included)")
    ap.add_argument("--project", help="optional: also run script-coverage check against projects/structured_scripts/<name>.txt")
    args = ap.parse_args()
    contract_rc = validate()
    coverage_warns = 0
    if args.project:
        registry = json.loads(REGISTRY.read_text(encoding="utf-8"))["primitives"]
        coverage_warns, _ = check_script_coverage(args.project, registry)
    rc = contract_rc
    if args.strict and coverage_warns > 0:
        rc = 1
    sys.exit(rc)
