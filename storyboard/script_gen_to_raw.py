"""
Bridge: script_generation skill output → projects/scripts/<name>.txt (raw)

The script_generation skill (.claude/script_generation) emits YouTube-style
scripts with bracketed time sections like:

    [HOOK - 0:00-0:10]
    "narration text..."

    [INTRO - 0:10-0:45]
    "..."

    [MAIN CONTENT - 0:45-8:30]
    [Section 1: Topic - 1:00-2:30]
    "..."
    [Visual cue: Show foo]

    [CONCLUSION - 8:30-9:30]
    [CALL TO ACTION - 9:30-10:00]

Our pipeline parser eats a different format (rule 01 / rule 18):

    # Title
    <!-- ## DESIGN TOKENS ... -->
    ## SCENE 1 — "Hook" (0:00 – 0:10)
    ### Narration
    > narration text
    ### Animation
    - **0:00 – 0:10 — Headline.** Body.

This module reads the script_generation output and writes a raw script in the
expected format. After that, the EXISTING pipeline takes over unchanged:

    1. python storyboard/script_gen_to_raw.py <input.txt> <project-name>
       → writes projects/scripts/<project-name>.txt
    2. python storyboard/build_video.py projects/scripts/<project-name>.txt
       → runs Step 0.5 (script_converter) → Step 1 (parser) → ... → final mp4

Design contract (intentionally narrow — easy to test, easy to audit):
- Each top-level [BRACKET - M:SS-M:SS] becomes one SCENE
- [MAIN CONTENT - ...] is a wrapper; its child [Section N: Title - M:SS-M:SS]
  blocks become individual SCENEs (the wrapper itself is dropped)
- Narration prose inside each section → ### Narration
- [Visual cue: ...] notes → ### Animation bullets (one per cue, time window
  inferred by spreading evenly across the section)
- Bullet density: if a section has fewer than `MIN_BULLETS_PER_SCENE`,
  the converter writes a `<!-- TODO: add more animation bullets -->` marker
  so the user (or a downstream LLM pass) knows to densify before running
- DESIGN TOKENS block: a placeholder is emitted at the top with a clear
  TODO so the user fills in their palette before running build_video.py
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Bullet density target — matches rule 15 ("5–8 bullets per ~60s scene")
MIN_BULLETS_PER_SCENE = 3   # below this, emit a TODO marker
TARGET_WPM = 170            # matches build_video.py / rule 16 word-per-minute estimate
# Densify target: when --densify is on, generate at most ONE bullet per this
# many seconds of scene duration (so a 60s scene caps at ~6 bullets, matching rule 15).
DENSIFY_SECONDS_PER_BULLET = 10


# ─── Regex patterns for script_generation output ────────────────────────────
# Top-level: [HOOK - 0:00-0:10]   or   [INTRO - 0:10-0:45]   or   [CONCLUSION - 8:30-9:30]
TOP_BRACKET_RE = re.compile(
    r"^\s*\[\s*([A-Z][A-Z\s]+?)\s*[-–]\s*(\d+:\d+)\s*[-–]\s*(\d+:\d+)\s*\]\s*$",
    re.MULTILINE,
)

# Sub-section inside [MAIN CONTENT]: [Section 1: App #1 - 1:00-2:30]
SUB_SECTION_RE = re.compile(
    r"^\s*\[\s*Section\s+(\d+)\s*[:\-]\s*(.+?)\s*[-–]\s*(\d+:\d+)\s*[-–]\s*(\d+:\d+)\s*\]\s*$",
    re.MULTILINE,
)

# [Visual cue: Show foo]   or   [Visual: Show bar]
VISUAL_CUE_RE = re.compile(
    r"\[\s*(?:Visual cue|Visual)\s*:\s*([^\]]+?)\s*\]",
    re.IGNORECASE,
)

# Title:   ... title line ...
TITLE_RE = re.compile(r"^\s*Title\s*:\s*(.+?)\s*$", re.MULTILINE)


def _mss_to_seconds(s: str) -> int:
    """0:45 → 45,  10:30 → 630"""
    m, sec = s.split(":")
    return int(m) * 60 + int(sec)


def _seconds_to_mss(n: int) -> str:
    """45 → 0:45,  630 → 10:30"""
    return f"{n // 60}:{n % 60:02d}"


def _strip_quotes_and_clean(text: str) -> str:
    """Narration in script_generation output is wrapped in straight or smart
    quotes. Strip leading/trailing quotes, collapse whitespace, drop empty
    lines and any [Visual cue: ...] / [Section N: ...] markers that may have
    been embedded mid-paragraph."""
    text = re.sub(r"\[\s*(?:Visual cue|Visual)\s*:[^\]]*\]", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"\[\s*Section\s+\d+\s*[:\-][^\]]*\]", " ", text)
    lines = [ln.strip().strip('"').strip("'").strip("“").strip("”") for ln in text.split("\n")]
    lines = [ln for ln in lines if ln]
    return " ".join(lines)


def _extract_blocks(src: str) -> list[dict]:
    """Walk the source line-by-line and emit one block per top-level bracket
    or per Section sub-bracket. Order is preserved. [MAIN CONTENT] wrapper
    is dropped — its Section children become first-class scenes."""
    blocks: list[dict] = []
    current = None
    for raw in src.split("\n"):
        # Skip the "===" separator banners and metadata header lines
        if raw.strip().startswith("===") or raw.lower().startswith(("title:", "duration:", "style:", "word count")):
            continue

        m_sub = SUB_SECTION_RE.match(raw)
        if m_sub:
            if current:
                blocks.append(current)
            current = {
                "kind": "section",
                "label": m_sub.group(2).strip(),
                "from": _mss_to_seconds(m_sub.group(3)),
                "to":   _mss_to_seconds(m_sub.group(4)),
                "body": [],
            }
            continue

        m_top = TOP_BRACKET_RE.match(raw)
        if m_top:
            label = m_top.group(1).strip().title()
            # Skip the MAIN CONTENT wrapper — its children carry the content
            if label.upper().replace(" ", "") == "MAINCONTENT":
                if current:
                    blocks.append(current)
                current = None
                continue
            if current:
                blocks.append(current)
            current = {
                "kind": "top",
                "label": label,
                "from": _mss_to_seconds(m_top.group(2)),
                "to":   _mss_to_seconds(m_top.group(3)),
                "body": [],
            }
            continue

        if current is not None:
            current["body"].append(raw)

    if current:
        blocks.append(current)
    return blocks


def _split_narration_to_sentences(narration: str) -> list[str]:
    """Split narration prose into sentences for bullet densification.
    Conservative split — only on `.`, `!`, `?` followed by whitespace + uppercase
    (avoids decimal numbers and abbreviations breaking incorrectly)."""
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])", narration.strip())
    return [p.strip() for p in parts if p.strip()]


def _content_words_for_headline(text: str) -> list[str]:
    """Distinctive ≥3-letter content words from text — used to build short
    visual-label headlines that don't duplicate the body verbatim. Numbers
    and capitalized tokens (proper nouns / brand names) get priority."""
    tokens = re.findall(r"[A-Za-z]+|\d+[\d.]*", text)
    # Stopwords (small set tuned for headline distinctiveness)
    stop = {"the", "a", "an", "and", "or", "but", "of", "to", "in", "on",
            "is", "are", "was", "for", "with", "by", "as", "at", "it",
            "i", "you", "we", "this", "that", "these", "those", "use", "used"}
    out: list[str] = []
    for t in tokens:
        lo = t.lower()
        if lo in stop:
            continue
        if len(t) < 3 and not t.isdigit():
            continue
        out.append(t)
    return out


def _bullet_from_text(text: str, b_from: int, b_to: int, scene_from: int) -> str:
    """Render one bullet line.

    F18 fix: headline is a short VISUAL LABEL derived from the most
    distinctive content words (proper nouns, numbers, key verbs/nouns) —
    NOT the body text verbatim. The headline is what shows up in scene
    JSON `source_headline` for debug/QA; body is what the per-bullet LLM
    reads to author React.createElement code (rule 04). Duplicating them
    wastes the LLM's signal.
    """
    words = _content_words_for_headline(text)
    if words:
        # 3-5 distinctive words make a usable visual label
        headline = " ".join(words[:5]).rstrip(",.").rstrip() + "."
    else:
        # Fallback if the text was all stopwords (very rare)
        headline = " ".join(text.split()[:5]).rstrip(",.").rstrip() + "."
    return (
        f"- **{_seconds_to_mss(b_from - scene_from)} – "
        f"{_seconds_to_mss(b_to - scene_from)} — {headline}** {text}"
    )


def _walk_body_in_order(body_lines: list[str]) -> list[tuple[str, str]]:
    """Walk the source body line-by-line and emit (kind, text) tuples in
    ORIGINAL ORDER. kind ∈ {'sentence', 'cue'}. This is what makes
    densification time-faithful: cues stay where the author put them and
    sentence-bullets fill the gaps in narration order — NOT shoved to the
    end of the scene where the anchor would land in the wrong second.

    F3 fix: previous implementation appended sentence-bullets after all
    cue-bullets, which inverted the bullet-to-narration time relationship
    and made audio_anchor selection pick anchors that land at the wrong
    spoken word.
    """
    items: list[tuple[str, str]] = []
    sentence_buf: list[str] = []

    def _flush() -> None:
        if not sentence_buf:
            return
        joined = " ".join(sentence_buf).strip()
        sentence_buf.clear()
        if not joined:
            return
        # Split the buffered prose into individual sentences so each becomes
        # one bullet candidate.
        for s in _split_narration_to_sentences(joined):
            items.append(("sentence", s))

    for raw in body_lines:
        # Pull cues out of the line — anything left is narration prose
        cues_in_line = [c.strip() for c in VISUAL_CUE_RE.findall(raw)]
        prose = re.sub(r"\[\s*(?:Visual cue|Visual)\s*:[^\]]*\]", " ", raw, flags=re.IGNORECASE)
        prose = prose.strip().strip('"').strip("'").strip("“").strip("”").strip()
        if prose:
            sentence_buf.append(prose)
        # When we hit a cue, flush any buffered narration FIRST so its
        # sentences land in time order, then add the cue.
        if cues_in_line:
            _flush()
            for c in cues_in_line:
                items.append(("cue", c))
    _flush()
    return items


def _scene_for_block(block: dict, scene_num: int, densify: bool = True) -> str:
    """Render one block as a SCENE in our canonical format.

    When `densify=True` (the default), bullets are emitted in NARRATION
    ORDER — interleaving [Visual cue: ...] notes and narration sentences as
    they appear in the source. This is critical: bullet ordering dictates
    where the per-bullet LLM positions its audio_anchor, and anchor position
    dictates which spoken word the visual locks to (rule 08). Out-of-order
    bullets → out-of-order anchors → visuals desync from narration.
    """
    label = block["label"]
    t_from = _seconds_to_mss(block["from"])
    t_to   = _seconds_to_mss(block["to"])
    duration_sec = max(1, block["to"] - block["from"])

    # narration text for the ### Narration block (cues stripped, prose joined)
    narration = _strip_quotes_and_clean("\n".join(block["body"]))

    # F19 fix: scale minimum bullets with scene duration. A 10-second hook
    # with 3 bullets switches every 3.3s — too rapid. Use rule 15's
    # "5-8 per ~60s" target to scale BOTH min and max with duration.
    scaled_min = max(1, round(duration_sec / 60.0 * 5))   # 5 per 60s baseline
    scaled_max = max(scaled_min, round(duration_sec / 60.0 * 8))  # 8 per 60s ceiling
    # Cap by DENSIFY_SECONDS_PER_BULLET so we never go faster than 1 bullet
    # per ~10s regardless of scaling
    rate_cap = max(1, duration_sec // DENSIFY_SECONDS_PER_BULLET)
    target_count = max(scaled_min, min(scaled_max, rate_cap))

    # Bullet candidates in original narration order
    if densify:
        items = _walk_body_in_order(block["body"])
        # F17 fix: ALWAYS keep cues (author intent) + interleave sentences up
        # to target_count. Earlier behaviour dropped sentences entirely when
        # cues alone met the target — losing anchor candidates the LLM could
        # have used to tighten visual sync.
        cues_in_order = [it for it in items if it[0] == "cue"]
        # Sentences are kept up to (target_count - len(cues)), but at least 1
        # per cue gap if narration has more sentences than cues
        sents_budget = max(0, target_count - len(cues_in_order))
        kept_sentences: set[tuple] = set()
        sentence_count = 0
        for it in items:
            if it[0] == "sentence" and sentence_count < sents_budget:
                kept_sentences.add(it)
                sentence_count += 1
        kept_items = [it for it in items if it[0] == "cue" or it in kept_sentences]
        # If we have FEWER items than target_count (sparse source), don't
        # synthesize fake bullets — let the TODO marker below flag it
    else:
        # Sparse mode: cues only, in original order. Likely too few bullets;
        # TODO marker below will warn the user.
        kept_items = [("cue", c.strip()) for c in VISUAL_CUE_RE.findall("\n".join(block["body"]))]

    # F21 fix: distribute time slots so the LAST bullet ends exactly at the
    # scene's end (no leftover seconds).
    bullets: list[str] = []
    n = len(kept_items)
    if n:
        cursor = block["from"]
        for j, (_kind, text) in enumerate(kept_items):
            # Even split with the final bullet absorbing any rounding remainder
            if j == n - 1:
                b_to = block["to"]
            else:
                b_to = block["from"] + ((j + 1) * duration_sec) // n
            b_from = cursor
            cursor = b_to
            bullets.append(_bullet_from_text(text, b_from, b_to, block["from"]))
    else:
        # Fallback: one full-duration placeholder bullet
        bullets.append(
            f"- **0:00 – {_seconds_to_mss(duration_sec)} — Visual for {label.lower()}.** "
            f"(no [Visual cue: ...] notes and no narration in source — please add)"
        )

    todo = ""
    if len(bullets) < scaled_min:
        todo = (
            f"\n\n<!-- TODO: only {len(bullets)} animation bullet(s) in this scene; "
            f"target ≥{scaled_min} for ~{duration_sec}s. Add more "
            f"### Animation bullets to densify the visual track."
            + (" Re-run with --no-densify removed if you used it." if not densify else "")
            + " -->"
        )

    return (
        f'## SCENE {scene_num} — "{label}" ({t_from} – {t_to})\n'
        "\n"
        "### Narration\n"
        f"> {narration}\n"
        "\n"
        "### Animation\n"
        + "\n".join(bullets)
        + todo
    )


_DESIGN_TOKENS_PLACEHOLDER = """<!-- ## DESIGN TOKENS - PLACEHOLDER, replace with project palette before running build_video.py
BASE:        #0A1628
SURFACE:     #0F1E33
WHITE:       #F5F7FA
DIM:         #94A3B8
CYAN:        #22D3EE
AMBER:       #F59E0B
GREEN:       #10B981
RED:         #EF4444
MAGENTA:     #A78BFA
FONT_DISPLAY: Inter
FONT_MONO:    JetBrains Mono
-->

<!-- ## GLOBAL VISUAL SYSTEM
Dot grid: CYAN at 4% opacity, 40px spacing.
Scene transitions: HARD CUTS (set stitch.mode: hard_cut in config.yaml).
-->

<!-- ## TITLE OPTIONS
1. {title}.mp4
-->
"""


def convert(src_text: str, project_name: str, densify: bool = True) -> str:
    """Top-level conversion. Returns the raw-script content."""
    title_match = TITLE_RE.search(src_text)
    title = title_match.group(1).strip() if title_match else project_name.replace("_", " ").title()
    safe_title = re.sub(r"[^\w\s-]", "", title).strip()

    blocks = _extract_blocks(src_text)
    if not blocks:
        raise ValueError(
            "No bracketed time sections found in input. Expected lines like "
            "'[HOOK - 0:00-0:10]' or '[Section 1: Title - 1:00-2:30]'. "
            "Is this really a script_generation skill output?"
        )

    out = [
        f"# {title}",
        "",
        _DESIGN_TOKENS_PLACEHOLDER.replace("{title}", safe_title.replace(" ", "_")),
        "",
    ]
    for i, blk in enumerate(blocks, start=1):
        out.append(_scene_for_block(blk, i, densify=densify))
        out.append("")
    return "\n".join(out)


# Stub config.yaml — emitted when --init-project is set.
# Mirrors rule 00 §2's 4 pinned constants. Design values use the same
# placeholder hex set as the script's <!-- ## DESIGN TOKENS --> block, so
# editing one prompts the user to edit both. F4/F5/F10 fix.
_CONFIG_YAML_STUB = """# Auto-generated by script_gen_to_raw.py --init-project.
# Edit BEFORE running build_video.py:
#   - design.* values must match the script's <!-- ## DESIGN TOKENS --> block
#   - audio.voice / video.fps/width/height are pipeline-pinned; do NOT change
#   - output is the final mp4 filename (rule 00 §2)

project: {project}
output: {title}.mp4

audio:
  voice: en-US-AndrewMultilingualNeural   # pipeline-pinned (warm YouTube voice)
  rate: "+0%"                              # global speaking rate (per-scene Pacing overrides)
  pitch: "+0Hz"                            # global pitch shift
  full_audio_filename: vo-{project}-full.mp3

video:
  fps: 30                                  # pipeline-pinned
  width: 1920                              # pipeline-pinned
  height: 1080                             # pipeline-pinned

design:
  bg:        '#0A1628'   # PLACEHOLDER — replace with script's BASE
  surface:   '#0F1E33'   # PLACEHOLDER — replace with script's SURFACE
  text:      '#F5F7FA'   # PLACEHOLDER — replace with script's WHITE
  text_dim:  '#94A3B8'   # PLACEHOLDER — replace with script's DIM
  cyan:      '#22D3EE'   # PLACEHOLDER — replace with script's CYAN
  amber:     '#F59E0B'   # PLACEHOLDER — replace with script's AMBER
  green:     '#10B981'   # PLACEHOLDER — replace with script's GREEN
  red:       '#EF4444'   # PLACEHOLDER — replace with script's RED
  violet:    '#A78BFA'   # PLACEHOLDER — replace with script's MAGENTA
  white:     '#F5F7FA'   # PLACEHOLDER — same as text
  font_display: "'Inter', sans-serif"
  font_mono:    "'JetBrains Mono', monospace"
  dot_grid_opacity: 0.04
  dot_grid_spacing: 40
  # Animation defaults required by remotion/src/universal/design.ts DesignTokens type.
  # Without these, build_video.py Step 1 fails with "config.yaml design section
  # missing required keys".
  fade_frames: 6           # ~0.2s at 30fps — Backdrop scene fade in/out duration
  spring_damping: 20       # snappy default (rule 19)
  spring_stiffness: 200    # snappy default
  type_speed_cps: 25       # typewriter chars/sec

stitch:
  mode: hard_cut
"""


def _init_project_dir(project_name: str, title: str) -> Path:
    """Scaffold projects/<project>/ with config.yaml + public/ stub.
    Returns the project directory path."""
    project_dir = Path("projects") / project_name
    project_dir.mkdir(parents=True, exist_ok=True)
    (project_dir / "public").mkdir(exist_ok=True)
    config_path = project_dir / "config.yaml"
    if not config_path.exists():
        safe_title = re.sub(r"[^\w\s-]", "", title).strip().replace(" ", "_")
        config_path.write_text(
            _CONFIG_YAML_STUB.format(project=project_name, title=safe_title),
            encoding="utf-8",
        )
    return project_dir


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Convert script_generation skill output → projects/scripts/<name>.txt (raw).",
    )
    ap.add_argument("input", help="Path to the script_generation output (.txt or .md).")
    ap.add_argument("project_name", help="Project name (file stem). E.g. 'productivity_apps'.")
    ap.add_argument("--out-dir", default="projects/scripts",
                    help="Output directory for the raw script. Default: projects/scripts/")
    ap.add_argument("--no-densify", action="store_true",
                    help="Disable bullet densification from narration sentences. "
                         "By default densify is ON because sparse [Visual cue: ...] notes "
                         "(typical script_generation output) → low audio_anchor coverage "
                         "→ visuals desync from narration. Only disable if you'll write "
                         "all the ### Animation bullets manually.")
    ap.add_argument("--no-init-project", action="store_true",
                    help="Skip scaffolding projects/<name>/ + config.yaml. "
                         "By default the project dir is created with a stub config.yaml "
                         "(placeholder palette) so build_video.py doesn't error out on "
                         "the very first attempt.")
    args = ap.parse_args(argv)

    src = Path(args.input).read_text(encoding="utf-8")
    densify = not args.no_densify
    raw = convert(src, args.project_name, densify=densify)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{args.project_name}.txt"
    out_path.write_text(raw, encoding="utf-8")

    title_match = TITLE_RE.search(src)
    title = title_match.group(1).strip() if title_match else args.project_name.replace("_", " ").title()

    project_dir = None
    if not args.no_init_project:
        project_dir = _init_project_dir(args.project_name, title)

    print(f"Wrote {out_path} ({len(raw)} chars, {raw.count('## SCENE')} scenes"
          f"{', densified' if densify else ', SPARSE — narration may desync from visuals'}).")
    if project_dir:
        print(f"Scaffolded {project_dir}/ with stub config.yaml + public/ folder")
    print()
    print("Next steps:")
    print(f"  1. Edit {out_path} — refine bullets, narration; remove TODO markers")
    if project_dir:
        print(f"  2. Edit {project_dir}/config.yaml — replace PLACEHOLDER hex values "
              f"with the colors from your <!-- ## DESIGN TOKENS --> block")
    print(f"  3. Pre-flight: python storyboard/verify_structured_script.py {out_path}")
    print(f"  4. Iterate steps 1-3 until pre-flight is clean (exit 0)")
    print(f"  5. Build: python storyboard/build_video.py {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
