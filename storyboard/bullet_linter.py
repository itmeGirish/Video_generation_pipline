"""
Bullet vagueness linter — step 2.5 of build_video.py.

Checks every animation bullet in the parsed script for concreteness.
A vague bullet gives the LLM no content to render → it hallucinates numbers,
labels, or stats not in the script, producing scenes that don't match narration.

Vagueness is scored on 5 signals (each worth 1 point; 0 = concrete, 5 = vague):
  1. Body too short    — < 12 words: not enough to describe a visual
  2. No quoted labels  — no "quoted text": LLM must invent label content
  3. No numbers        — no digits: LLM invents stats/percentages
  4. Generic-only body — only vague verbs (show, display, reveal) with no subject
  5. No concrete nouns — none of the element words that anchor a real visual

Score ≥ 3 → VAGUE (warn + list what's missing)
Score 1-2 → WEAK  (advisory only)
Score 0   → OK

Returns a list of LintWarning objects. build_video.py decides whether to abort
(--strict-bullets) or warn and continue (default).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .source_parser import Scene

# ─── signal weights ───
_SHORT_BODY_THRESHOLD = 12       # words
_VAGUE_THRESHOLD      = 3        # score ≥ this → VAGUE

# Verbs that are fine as openers ONLY if paired with a concrete subject.
# If the entire body is built from these with nothing else, it's vague.
_GENERIC_OPENERS = re.compile(
    r"^(show|display|reveal|demonstrate|illustrate|present|highlight|visualize|animate|appear|fade)\b",
    re.IGNORECASE,
)

# Concrete element words — their presence means the bullet has a real subject.
_CONCRETE_NOUNS = re.compile(
    r"\b(button|card|bar|chart|graph|badge|label|icon|arrow|line|circle|box|grid|"
    r"column|row|list|table|panel|banner|header|title|subtitle|counter|timer|"
    r"progress|meter|gauge|ring|dot|checkmark|cross|shield|star|flag|tag|"
    r"number|percent|percentage|stat|score|metric|value|text|word|letter|"
    r"image|photo|logo|diagram|map|timeline|step|stage|phase|block|slot)\b",
    re.IGNORECASE,
)


@dataclass
class BulletLintWarning:
    scene_number: int
    bullet_index: int       # 1-based
    headline: str
    body: str
    score: int              # 0=ok, 1-2=weak, 3+=vague
    reasons: list[str] = field(default_factory=list)

    @property
    def level(self) -> str:
        if self.score >= _VAGUE_THRESHOLD:
            return "VAGUE"
        if self.score >= 1:
            return "WEAK"
        return "OK"

    def __str__(self) -> str:
        loc = f"scene {self.scene_number} bullet {self.bullet_index}"
        reasons = "; ".join(self.reasons) if self.reasons else "ok"
        return f"[{self.level}] {loc} — \"{self.headline}\": {reasons}"


def _score_bullet(body: str) -> tuple[int, list[str]]:
    score = 0
    reasons: list[str] = []
    words = body.split()

    # Signal 1: too short
    if len(words) < _SHORT_BODY_THRESHOLD:
        score += 1
        reasons.append(f"body only {len(words)} words (need ≥{_SHORT_BODY_THRESHOLD})")

    # Signal 2: no quoted labels
    if not re.search(r'"[^"]{2,}"', body):
        score += 1
        reasons.append("no quoted labels (LLM will invent text)")

    # Signal 3: no numbers
    if not re.search(r"\d", body):
        score += 1
        reasons.append("no numbers (LLM may invent stats or percentages)")

    # Signal 4: generic opener with no concrete follow-through
    if _GENERIC_OPENERS.match(body.strip()):
        # Only penalise if the rest of the body doesn't save it
        non_opener = re.sub(_GENERIC_OPENERS, "", body.strip()).strip()
        if len(non_opener.split()) < 5:
            score += 1
            reasons.append("generic verb opener with no concrete subject")

    # Signal 5: no concrete nouns
    if not _CONCRETE_NOUNS.search(body):
        score += 1
        reasons.append("no concrete element words (button, card, bar, label, number…)")

    return score, reasons


def lint_bullets(scenes: list[Scene]) -> list[BulletLintWarning]:
    """Check every animation bullet in every scene. Returns all warnings (OK excluded)."""
    warnings: list[BulletLintWarning] = []
    for scene in scenes:
        for idx, bullet in enumerate(scene.animation):
            score, reasons = _score_bullet(bullet.body or "")
            if score > 0:
                warnings.append(BulletLintWarning(
                    scene_number=scene.number,
                    bullet_index=idx + 1,
                    headline=bullet.headline,
                    body=bullet.body or "",
                    score=score,
                    reasons=reasons,
                ))
    return warnings


def print_lint_report(warnings: list[BulletLintWarning], strict: bool = False) -> int:
    """Print the lint report. Returns count of VAGUE bullets.
    If strict=True, also prints a hard-fail summary line."""
    vague = [w for w in warnings if w.level == "VAGUE"]
    weak  = [w for w in warnings if w.level == "WEAK"]

    if not warnings:
        print("      [bullet-lint] all bullets concrete — no vagueness detected")
        return 0

    for w in sorted(warnings, key=lambda x: (x.score, x.scene_number, x.bullet_index), reverse=True):
        print(f"      [bullet-lint] {w}")

    if vague:
        print(f"\n      [bullet-lint] {len(vague)} VAGUE bullet(s) — LLM will hallucinate content.")
        print(f"                    Fix: add quoted labels, specific numbers, and element words to each bullet body.")
        if strict:
            print(f"                    --strict-bullets: aborting build. Fix these bullets and re-run.")
    if weak:
        print(f"      [bullet-lint] {len(weak)} WEAK bullet(s) — consider adding more specifics.")

    return len(vague)
