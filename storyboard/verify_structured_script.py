"""
Pre-flight check for a structured script BEFORE running build_video.py.

build_video.py runs TTS (Step 4, ~30s) and Whisper (Step 5, ~60s) before
reaching the audio_anchor coverage check at Step 7. If anchor coverage is
low, you've burned ~90s of compute + API tokens to find out the script
was unsuited.

This tool runs in <1s and reports the same risk signals up front:

  1. Scene structure: every scene has narration + animation + valid time window
  2. Bullet density: rule 15 says 5-8 per 60s; warn if any scene has <3
  3. Narration richness: distinct content words per bullet (proxy for anchor
     candidate diversity — if the LLM has 50 unique nouns in narration but
     8 bullets, anchor selection is easy; if narration is 30 words, hard)
  4. Anchor candidates per bullet: do bullet bodies reference distinctive
     phrases that ALSO appear in the scene's narration? If not, the
     per-bullet codegen LLM (rule 04) will pick weak anchors.
  5. Design tokens block: present + filled (no PLACEHOLDER strings)
  6. Word count vs scene duration: warns if a scene's narration is wildly
     under/over the 150-170 wpm target

Exit codes:
  0 — no issues
  1 — warnings only (build will run, but quality may suffer)
  2 — hard errors (build will fail or produce broken output)

Usage:
  python storyboard/verify_structured_script.py projects/scripts/<name>.txt
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from storyboard.source_parser import parse  # uses the same parser as build_video.py


# Stopwords for "distinct content word" analysis (mirrors validate_output.py)
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "they", "them", "their", "we", "us", "our", "you", "your", "he", "she",
    "his", "her", "i", "me", "my", "if", "so", "as", "from", "into",
    "what", "when", "where", "who", "how", "why", "which",
}

WPM_TARGET_LOW  = 130   # below this, narration is too sparse for the duration
WPM_TARGET_HIGH = 200   # above this, TTS will run longer than the scene window
BULLETS_PER_SCENE_MIN = 3
BULLETS_PER_60S_TARGET = (5, 8)


def _content_words(text: str) -> set[str]:
    raw = re.findall(r"[a-zA-Z]+", text.lower())
    return {w for w in raw if w not in STOPWORDS and len(w) > 2}


def _looks_like_anchor_candidate(bullet_body: str, narration: str) -> bool:
    """Does the bullet body share at least 1 distinctive ≥4-letter word with
    the narration? If yes, the LLM has a hook to pick a verbatim anchor."""
    body_words = {w for w in _content_words(bullet_body) if len(w) >= 4}
    narr_words = _content_words(narration)
    return bool(body_words & narr_words)


def verify(path: Path) -> int:
    errors: list[str] = []
    warnings: list[str] = []

    # 1. Parse — this is the hard gate. If parsing fails, build_video.py fails too.
    try:
        script = parse(path)
    except Exception as e:
        print(f"FAIL: parser rejected the script:\n  {e}")
        return 2

    print(f"\n=== Pre-flight check: {path.name} ===")
    print(f"    {len(script.scenes)} scenes parsed")

    # 2. Design tokens — placeholder strings means user forgot to fill them in.
    src_text = path.read_text(encoding="utf-8")
    if "PLACEHOLDER" in src_text:
        warnings.append(
            "DESIGN TOKENS block still contains PLACEHOLDER. The default palette "
            "will be used, which makes every video look the same. Fill in the "
            "<!-- ## DESIGN TOKENS -->  block at the top of the script before render."
        )
    if "TODO:" in src_text:
        n = src_text.count("TODO:")
        warnings.append(
            f"{n} TODO marker(s) in the script. These are leftover from the "
            f"converter — review each one (most are 'add more bullets here')."
        )

    # 3. Per-scene checks
    for sc in script.scenes:
        scene_dur = max(1.0, sc.window_to_sec - sc.window_from_sec)
        n_bullets = len(sc.animation)

        # 3a. Bullet density vs duration
        target_min, target_max = BULLETS_PER_60S_TARGET
        scaled_min = max(BULLETS_PER_SCENE_MIN, round(scene_dur / 60.0 * target_min))
        scaled_max = round(scene_dur / 60.0 * target_max)
        if n_bullets < scaled_min:
            warnings.append(
                f"scene {sc.number} ({scene_dur:.0f}s): only {n_bullets} bullet(s); "
                f"target ≥{scaled_min}. Sparse bullets → low anchor coverage at Step 7. "
                f"Re-run script_gen_to_raw.py with --densify, or add bullets manually."
            )
        elif n_bullets > scaled_max:
            warnings.append(
                f"scene {sc.number} ({scene_dur:.0f}s): {n_bullets} bullets is dense "
                f"(target ≤{scaled_max}). Visuals will switch every ~{scene_dur/n_bullets:.1f}s "
                f"— may feel hectic."
            )

        # 3b. Narration richness vs bullet count
        narr_words = _content_words(sc.narration)
        if narr_words and n_bullets:
            unique_per_bullet = len(narr_words) / n_bullets
            if unique_per_bullet < 4:
                warnings.append(
                    f"scene {sc.number}: only {len(narr_words)} unique content words "
                    f"in narration for {n_bullets} bullets ({unique_per_bullet:.1f}/bullet). "
                    f"LLM has limited anchor candidates — anchors may be reused or weak."
                )

        # 3c. Bullets that don't reference any narration word
        weak = [
            i + 1 for i, b in enumerate(sc.animation)
            if not _looks_like_anchor_candidate(b.headline + " " + b.body, sc.narration)
        ]
        if weak:
            warnings.append(
                f"scene {sc.number}: bullets {weak} share no distinctive ≥4-letter word "
                f"with the scene's narration. The LLM (rule 04) will struggle to pick "
                f"a meaningful audio_anchor → visual lands on wrong spoken word."
            )

        # 3d. Word count vs duration (150-170 wpm target)
        wc = len(re.findall(r"\b\w+\b", sc.narration))
        if scene_dur >= 5.0:  # skip very short bumper scenes
            wpm = wc / (scene_dur / 60.0)
            if wpm < WPM_TARGET_LOW:
                warnings.append(
                    f"scene {sc.number}: only {wc} words for {scene_dur:.0f}s "
                    f"(={wpm:.0f} wpm; target ≥{WPM_TARGET_LOW}). Audio will end "
                    f"early; pipeline will pad with silence or stretch visuals."
                )
            elif wpm > WPM_TARGET_HIGH:
                warnings.append(
                    f"scene {sc.number}: {wc} words for {scene_dur:.0f}s "
                    f"(={wpm:.0f} wpm; target ≤{WPM_TARGET_HIGH}). TTS will run "
                    f"longer than scene window; later scenes shift later in time."
                )

        # 3e. Bullet time windows must fit inside scene window
        for i, b in enumerate(sc.animation):
            if b.time_from_sec < 0 or b.time_to_sec > scene_dur + 0.1:
                errors.append(
                    f"scene {sc.number} bullet {i+1}: time window "
                    f"{b.time_from_sec}-{b.time_to_sec}s is outside scene duration "
                    f"({scene_dur:.0f}s). Build will reject."
                )
            if b.time_from_sec >= b.time_to_sec:
                errors.append(
                    f"scene {sc.number} bullet {i+1}: time window "
                    f"{b.time_from_sec}-{b.time_to_sec}s is empty/inverted."
                )

    # 4. Summary
    print()
    if errors:
        print(f"[ERRORS] {len(errors)} hard issue(s) — build will fail:")
        for e in errors:
            print(f"  ✗ {e}")
    if warnings:
        print(f"[WARN] {len(warnings)} quality issue(s) — build will run but may degrade:")
        for w in warnings:
            print(f"  ! {w}")
    if not errors and not warnings:
        print("[OK] script looks clean — safe to run build_video.py.")

    if errors:
        return 2
    if warnings:
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    # Force UTF-8 so Windows cp1252 doesn't choke on warning text containing
    # ≥/≤/→ and other non-ASCII glyphs commonly used in our structured scripts.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser(
        description="Pre-flight check for a structured script — runs in <1s, "
                    "reports issues that would otherwise surface 90s into build_video.py.",
    )
    ap.add_argument("script_path",
                    help="Path to projects/scripts/<name>.txt OR projects/structured_scripts/<name>.txt")
    args = ap.parse_args(argv)
    return verify(Path(args.script_path).resolve())


if __name__ == "__main__":
    sys.exit(main())
