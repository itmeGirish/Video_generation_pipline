"""
Single-command video builder. Zero hardcoded scene names or project names.

Usage:
    python storyboard/build_video.py projects/<name>/

Reads:
    PROJECT_DIR/source.txt       — script (THE truth — no script.md intermediate)
    PROJECT_DIR/config.yaml      — design tokens, voice, output name

Produces:
    PROJECT_DIR/audio/{full_audio_filename}    — continuous TTS
    PROJECT_DIR/scenes/{scene_id}.json         — per-scene visual blocks (CANONICAL)
    PROJECT_DIR/captions/{scene_id}.json       — per-scene word timestamps (CANONICAL)
    remotion/public/scenes/{scene_id}.json     — build-time mirror of project scenes
    remotion/public/captions/{scene_id}.json   — build-time mirror of project captions
    remotion/src/universal/config_tokens.json  — design tokens for build
    PROJECT_DIR/out/{output}                   — final stitched video

Pipeline:
    1.   Load config
    2.   Parse source.txt → scenes (source_parser.py)
    3.   Visual design via LLM → React.createElement code per bullet (visual_designer.py)
    4.   Continuous TTS of all narration (edge-tts)
    5.   Whisper transcribe → word timestamps
    6.   Locate scene boundaries in transcript
    7.   Compute framesFrom/framesTo + emit scene JSONs to PROJECT_DIR/scenes/
    7.5  Sync PROJECT_DIR/scenes/ → remotion/public/scenes/ (purge stale entries from other projects)
    8.   Patch timelines.ts entries
    9.   Render each scene via Remotion (silent, resume-safe)
    10.  Stitch scenes + mux audio → final mp4
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys
from dataclasses import asdict
from pathlib import Path

import edge_tts
import yaml
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding="utf-8")

# Windows-only: hide the brief cmd window flash when spawning ffmpeg / node /
# claude / ffprobe etc. CREATE_NO_WINDOW (0x08000000) tells Windows not to
# allocate a console for the child. Without this every subprocess call flashes
# a black window.
_NOWIN = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0

# Add project root to path so we can import storyboard modules
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from storyboard.source_parser import parse as parse_source, lint as lint_source
from storyboard.visual_designer import design_script
from storyboard.ssml_compiler import compile_narration
from storyboard.visual_qa import run_qa
from storyboard.validate_pipeline import validate as validate_pipeline
from storyboard.validate_output import validate_output

# ─── ARGS ───
parser = argparse.ArgumentParser(description=(
    "Build a video from a script. Accepts EITHER a project directory OR a "
    "script file path. Examples:\n"
    "  python build_video.py projects/<name>/                 # uses projects/<name>/source.txt\n"
    "  python build_video.py projects/scripts/<name>.txt      # uses that script, project name = stem"
))
parser.add_argument("project_or_script",
                    help="Path to project dir (containing source.txt + config.yaml), OR path to a .txt script file")
parser.add_argument("--scene", type=int, default=None,
                    help="Re-render only one scene (1-indexed). Skips TTS + Whisper if cached. Faster iteration.")
parser.add_argument("--whisper-model", default="base",
                    help="Whisper model size: tiny, base, small, medium, large. tiny=fast/lower quality, large=slow/best.")
parser.add_argument("--no-validate", action="store_true",
                    help="(deprecated; primitive registry was removed) — kept for back-compat with old call sites.")
parser.add_argument("--force", action="store_true",
                    help="Clear all caches (designs, transcripts, TTS hash, scene renders) and re-run from scratch.")
parser.add_argument("--redesign", action="store_true",
                    help="Clear LLM design cache only (force re-pick of primitives). Keeps TTS+Whisper.")
parser.add_argument("--retts", action="store_true",
                    help="Clear TTS hash only (force re-generation of audio). Triggers Whisper re-transcribe.")
args = parser.parse_args()


# ─── RESOLVE INPUT — directory or script file ───
# Supports two layouts:
#  (a) projects/<name>/                 → source.txt + config.yaml inside
#  (b) projects/scripts/<name>.txt      → script in shared folder, project = stem,
#                                          config at projects/<stem>/config.yaml
input_path = Path(args.project_or_script).resolve()

if input_path.is_file() and input_path.suffix == ".txt":
    # Layout (b): raw script in projects/scripts/ (or anywhere).
    # Auto-convert to clean format and save to projects/structured_scripts/<name>.txt
    # — that is the canonical, parser-ready location.
    # The project folder projects/<name>/ still holds config.yaml + audio/ + out/.
    # convert_with_fallback: regex first (fast), LLM if regex output isn't parseable.
    from storyboard.script_converter import convert_with_fallback

    PROJECT             = input_path.stem
    PROJECT_DIR         = ROOT / "projects" / PROJECT
    STRUCTURED_DIR      = ROOT / "projects" / "structured_scripts"
    PROJECT_DIR.mkdir(parents=True, exist_ok=True)
    STRUCTURED_DIR.mkdir(parents=True, exist_ok=True)

    SOURCE_FILE  = STRUCTURED_DIR / f"{PROJECT}.txt"
    CONFIG_FILE  = PROJECT_DIR / "config.yaml"

    raw_text = input_path.read_text(encoding="utf-8")
    clean_text = convert_with_fallback(raw_text)
    if not SOURCE_FILE.exists() or SOURCE_FILE.read_text(encoding="utf-8") != clean_text:
        SOURCE_FILE.write_text(clean_text, encoding="utf-8")
        print(f"      converted {input_path.relative_to(ROOT)} → {SOURCE_FILE.relative_to(ROOT)}")
    else:
        print(f"      using cached conversion at {SOURCE_FILE.relative_to(ROOT)}")
    print(f"      project: '{PROJECT}'")
elif input_path.is_dir():
    # Layout (a): project directory
    PROJECT_DIR  = input_path
    PROJECT      = PROJECT_DIR.name
    SOURCE_FILE  = PROJECT_DIR / "source.txt"
    CONFIG_FILE  = PROJECT_DIR / "config.yaml"
else:
    print(f"ERROR: '{input_path}' is neither a directory nor a .txt script file"); sys.exit(1)

AUDIO_DIR    = PROJECT_DIR / "audio"
OUT_DIR      = PROJECT_DIR / "out"
# All scene-related data is owned by the project. The project folder is the
# canonical source of truth; the global remotion/public/{scenes,captions}/
# folders are build-time mirrors the Remotion bundler reads at /scenes/<id>.json
# and /captions/<id>.json. Mirrors are purged of other projects' files on
# every build to prevent cross-project leakage in the bundle.
PROJECT_SCENES_DIR   = PROJECT_DIR / "scenes"        # canonical scene blocks
PROJECT_CAPTIONS_DIR = PROJECT_DIR / "captions"      # canonical word-timestamps
SCENES_PUBLIC_DIR    = ROOT / "remotion" / "public" / "scenes"     # build mirror
CAPTIONS_PUBLIC_DIR  = ROOT / "remotion" / "public" / "captions"   # build mirror
CACHE_DIR    = ROOT / "storyboard" / ".cache"
TIMELINES_TS = ROOT / "remotion" / "src" / "storyboard" / "timelines.ts"
TOKENS_JSON  = ROOT / "remotion" / "src" / "universal" / "config_tokens.json"
TIMING_JSON  = PROJECT_DIR / "build_timing.json"

if not SOURCE_FILE.exists():
    print(f"ERROR: script not found at {SOURCE_FILE}"); sys.exit(1)
if not CONFIG_FILE.exists():
    print(f"ERROR: config.yaml not found at {CONFIG_FILE}"); sys.exit(1)

for d in [AUDIO_DIR, OUT_DIR,
          PROJECT_SCENES_DIR, PROJECT_CAPTIONS_DIR,
          SCENES_PUBLIC_DIR, CAPTIONS_PUBLIC_DIR,
          CACHE_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# ─── 0. CACHE INVALIDATION (per --force/--redesign/--retts) ───
DESIGN_CACHE = CACHE_DIR / "designs"
if args.force:
    print(f"[0]   --force: clearing all caches...")
    if DESIGN_CACHE.exists():
        for f in DESIGN_CACHE.glob("*"):
            f.unlink()
    for f in CACHE_DIR.glob("transcript-*.json"):
        f.unlink()
    for f in AUDIO_DIR.glob(".*.hash"):
        f.unlink()
    for f in (ROOT / "remotion" / "out").glob("*.mp4"):
        f.unlink()
    print(f"      cleared: designs, transcripts, TTS hash, scene renders")
elif args.redesign:
    print(f"[0]   --redesign: clearing LLM design cache only...")
    if DESIGN_CACHE.exists():
        for f in DESIGN_CACHE.glob("*"):
            f.unlink()
elif args.retts:
    print(f"[0]   --retts: clearing TTS hash only...")
    for f in AUDIO_DIR.glob(".*.hash"):
        f.unlink()


# ─── 1. LOAD CONFIG (with schema check) ───
print(f"[1/10] Loading config from {CONFIG_FILE.name}...")
config = yaml.safe_load(CONFIG_FILE.read_text(encoding="utf-8"))

# Required design keys are the source of truth in remotion/src/universal/design.ts
# (DesignTokens type). Parse them so the schema check auto-syncs when you add a token.
DESIGN_TS = ROOT / "remotion" / "src" / "universal" / "design.ts"
_design_text = DESIGN_TS.read_text(encoding="utf-8")
_dt_match = re.search(r"type\s+DesignTokens\s*=\s*\{([^}]*)\}", _design_text, re.DOTALL)
if not _dt_match:
    print(f"ERROR: cannot find DesignTokens type in {DESIGN_TS}"); sys.exit(1)
REQUIRED_DESIGN_KEYS = set(re.findall(r"(\w+)\s*:\s*\w+", _dt_match.group(1)))

missing_design = REQUIRED_DESIGN_KEYS - set(config.get("design", {}).keys())
if missing_design:
    print(f"ERROR: config.yaml design section missing required keys: {sorted(missing_design)}")
    print(f"       Required keys come from {DESIGN_TS.relative_to(ROOT)} (DesignTokens type).")
    print(f"       Without these, design tokens will be undefined — visuals will be broken.")
    sys.exit(1)
for k in ("video", "audio", "output"):
    if k not in config:
        print(f"ERROR: config.yaml missing required top-level key: {k}"); sys.exit(1)

FPS              = config["video"]["fps"]
VOICE            = config["audio"]["voice"]
RATE             = config["audio"]["rate"]
PITCH            = config["audio"]["pitch"]
FULL_AUDIO_NAME  = config["audio"]["full_audio_filename"]
OUTPUT_NAME      = config["output"]
PROJECT_PREFIX   = re.sub(r"[^a-z0-9]", "-", PROJECT.lower()).strip("-")

# Optional LLM model override from config.yaml top-level `llm:` section.
# Example:
#   llm:
#     designer_model: claude-opus-4-6
# Defaults to claude-opus-4-6 if not set (the pipeline-pinned design model).
DESIGNER_MODEL = config.get("llm", {}).get("designer_model")
if DESIGNER_MODEL:
    os.environ["DESIGNER_MODEL"] = DESIGNER_MODEL
    print(f"      LLM designer model override: {DESIGNER_MODEL}")

TOKENS_JSON.write_text(json.dumps(config["design"], indent=2), encoding="utf-8")
print(f"      design tokens → {TOKENS_JSON.name}")


# ─── Engineering tunables (config-overridable; defaults baked here) ───
# Each is read from config.yaml's optional `build:` / `stitch:` / `whisper:` /
# `narration:` sections. Defaults are sane for the typical chat-explainer
# project; override only when a project demands different pacing or codec.
_build_cfg = config.get("build", {})
_stitch_cfg = config.get("stitch", {})
_whisper_cfg = config.get("whisper", {})

# Visual-block timing
MIN_BLOCK_SECONDS         = float(_build_cfg.get("min_block_seconds", 2.0))
SCENE_BOUNDARY_WORDS      = int(_build_cfg.get("scene_boundary_words", 8))
FUZZY_MATCH_MIN_RATIO     = float(_build_cfg.get("fuzzy_match_min_ratio", 0.6))
SCENE_BOUNDARY_MIN_RATIO  = float(_build_cfg.get("scene_boundary_min_ratio", 0.5))

# ffmpeg quality knobs
SCENE_CLEAN_PRESET = str(_stitch_cfg.get("scene_clean_preset", "fast"))
SCENE_CLEAN_CRF    = str(_stitch_cfg.get("scene_clean_crf", 20))
FINAL_PRESET       = str(_stitch_cfg.get("final_preset", "medium"))
FINAL_CRF          = str(_stitch_cfg.get("final_crf", 19))
AUDIO_BITRATE      = str(_stitch_cfg.get("audio_bitrate", "192k"))

# Whisper quantization
WHISPER_COMPUTE_TYPE = str(_whisper_cfg.get("compute_type", "int8"))

# Pass narration-pacing config through to ssml_compiler via env vars (so we
# don't have to import + re-thread through every call site)
_narr_cfg = config.get("narration", {})
os.environ.setdefault("SSML_EMPHASIS_RATE",      str(_narr_cfg.get("emphasis_rate",     "-15%")))
os.environ.setdefault("SSML_PUNCHLINE_RATE",     str(_narr_cfg.get("punchline_rate",    "-10%")))
os.environ.setdefault("SSML_PUNCHLINE_PITCH",    str(_narr_cfg.get("punchline_pitch",   "+5%")))
os.environ.setdefault("SSML_EM_DASH_PAUSE_MS",   str(_narr_cfg.get("em_dash_pause_ms",  400)))
os.environ.setdefault("SSML_SENTENCE_PAUSE_MS",  str(_narr_cfg.get("sentence_pause_ms", 250)))


# ─── 2. PARSE source.txt (with linter) ───
print(f"[2/10] Parsing source.txt...")
lint_warnings = lint_source(SOURCE_FILE)
for w in lint_warnings:
    print(f"      [lint] {w}")
script = parse_source(SOURCE_FILE)
scenes_raw = script.scenes
scene_ids  = [f"{PROJECT_PREFIX}-s{i+1:02d}" for i in range(len(scenes_raw))]
print(f"      {len(scenes_raw)} scenes: {scene_ids}")
for s in scenes_raw:
    print(f"      scene {s.number}: {len(s.animation)} animation bullets")


# ─── 2.5 (REMOVED) primitive registry no longer exists — codegen pipeline ───
# Primitives are now LLM-emitted React.createElement code per bullet (no fixed
# registry). DynamicBlock.tsx compiles + invokes the code at render time.
# Validation is shifted to render time: code that fails to parse or run shows
# a visible error frame instead of crashing the bundle.


# ─── 3. VISUAL DESIGN (LLM codegen per bullet) ───
print(f"[3/10] Visual design (LLM codegen per bullet)...")
designs = design_script(scenes_raw, config["design"])   # {scene_number: [VisualBlock, ...]}
for sc in scenes_raw:
    blocks = designs[sc.number]
    print(f"      scene {sc.number}: {len(blocks)} visual blocks (fidelity gate passed)")


# ─── 4. CONTINUOUS TTS (with SSML for non-flat narration) ───
print(f"[4/10] Continuous TTS (SSML-enhanced)...")
full_ssml      = compile_narration(scenes_raw)
text_hash      = hashlib.sha256(full_ssml.encode()).hexdigest()[:16]
full_audio     = AUDIO_DIR / FULL_AUDIO_NAME
hash_marker    = AUDIO_DIR / f".{FULL_AUDIO_NAME}.{text_hash}.hash"


async def gen_tts():
    if full_audio.exists() and hash_marker.exists():
        print(f"      using cached audio (hash {text_hash})")
        return
    print(f"      generating TTS via {VOICE} (hash {text_hash})...")
    # edge-tts Communicate() does NOT parse SSML — it speaks tags literally.
    # Strip XML tags; convert <break time="Nms"/> to a comma for a short pause.
    # Defense in depth: html.unescape() decodes any HTML-escaped entities (e.g.
    # &lt;pause 0.3s&gt;) so the second strip-tags pass actually catches them.
    # Without this, author-supplied markers that got escaped by ssml_compiler's
    # _escape() would survive as literal text and TTS would speak them aloud.
    import html as _html
    plain = re.sub(r'<break\b[^/>]*/>', ', ', full_ssml)
    plain = re.sub(r'<[^>]+>', '', plain)
    plain = _html.unescape(plain)
    plain = re.sub(r'<[^>]+>', '', plain)        # second pass after entity decode
    plain = re.sub(r'\s+', ' ', plain).strip()
    c = edge_tts.Communicate(plain, VOICE, rate=RATE, pitch=PITCH)
    await c.save(str(full_audio))
    for old in AUDIO_DIR.glob(f".{FULL_AUDIO_NAME}.*.hash"):
        old.unlink()
    hash_marker.write_text("", encoding="utf-8")


asyncio.run(gen_tts())

probe = subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration",
     "-of", "default=nw=1:nk=1", str(full_audio)],
    capture_output=True, text=True,
    creationflags=_NOWIN,
)
total_sec    = float(probe.stdout.strip())
total_frames = int(total_sec * FPS)
print(f"      audio: {total_sec:.2f}s ({total_frames} frames)")


# ─── 5. WHISPER ───
print(f"[5/10] Whisper transcribe (cached by audio hash)...")
audio_hash = hashlib.sha256(full_audio.read_bytes()).hexdigest()[:16]
cache_file = CACHE_DIR / f"transcript-{audio_hash}.json"
if cache_file.exists():
    all_words = json.loads(cache_file.read_text(encoding="utf-8"))
    print(f"      cached transcript ({len(all_words)} words)")
else:
    model = WhisperModel(args.whisper_model, compute_type=WHISPER_COMPUTE_TYPE)
    segs, _ = model.transcribe(str(full_audio), word_timestamps=True)
    all_words = []
    for seg in segs:
        if seg.words:
            for w in seg.words:
                all_words.append({
                    "word":  w.word.strip(),
                    "start": round(w.start, 3),
                    "end":   round(w.end, 3),
                })
    cache_file.write_text(json.dumps(all_words, indent=2), encoding="utf-8")
    print(f"      transcribed: {len(all_words)} words")


# ─── 6. LOCATE SCENE BOUNDARIES ───
# DIGIT_WORDS maps single-token digit forms to their spoken word equivalents.
# Whisper transcribes spoken numbers in MIXED forms — sometimes as digits
# ("16", "23", "2026"), sometimes as words ("sixteen", "twenty-three",
# "twenty twenty six"). The script's narration may use either form.
# Normalizing one direction (digit→word) gives a single canonical form.
#
# We expand to 0-99 so that boundary detection works on phrases like
# "April 23" or "version 16". Years (e.g. "2026") and large numbers fall
# back to the digit form unchanged — Whisper usually keeps these as digits.
DIGIT_WORDS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
    "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
    "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen",
    "14": "fourteen", "15": "fifteen", "16": "sixteen", "17": "seventeen",
    "18": "eighteen", "19": "nineteen", "20": "twenty",
    "30": "thirty", "40": "forty", "50": "fifty", "60": "sixty",
    "70": "seventy", "80": "eighty", "90": "ninety", "100": "hundred",
}
WORD_DIGITS = {v: k for k, v in DIGIT_WORDS.items()}


def expand_decimals(text: str) -> str:
    """Expand decimal numbers like "5.5" → "5 point 5" so token-by-token
    matching against Whisper transcripts works. Whisper transcribes spoken
    "five point five" as three tokens; the script's "5.5" is one token that
    _norm() collapses to "55" — they never match.

    Uses lookbehind/lookahead so the digit characters aren't consumed —
    that way overlapping decimals like "4.7.1" become "4 point 7 point 1"
    (not "4 point 7.1").

    Examples:
      "GPT-5.5"        → "GPT-5 point 5"
      "version 4.7.1"  → "version 4 point 7 point 1"
      "$5,000"         → "$5,000"  (no change — comma is thousands separator)
      "3.14"           → "3 point 14"
    """
    return re.sub(r'(?<=\d)\.(?=\d)', ' point ', text)


def normalize_for_match(text: str) -> str:
    """Single normalization helper used by BOTH scene-boundary detection AND
    audio_anchor matching. Brings script-side text into the same token shape
    Whisper produces for spoken audio.

    Steps:
      1. Strip <...> markup (e.g. <pause 0.3s> author markers)
      2. Expand decimals: "5.5" → "5 point 5"
      3. Replace hyphens with spaces: "Vending-Bench" → "Vending Bench"

    The previous implementation applied these only to scene-boundary opening
    words but NOT to audio_anchor matching — that's why anchors like
    "GPT-5.5", "Vending-Bench", "three-point-one Pro" silently failed and
    fell back to time-based positioning (~23 of 73 in chat_5_5)."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = expand_decimals(text)
    text = text.replace("-", " ")
    return text


def _norm(w: str) -> str:
    s = re.sub(r"[^\w]", "", w.lower())
    return DIGIT_WORDS.get(s, s)


def find_phrase(words: list, phrase: str, start_idx: int = 0) -> int:
    """Exact match. Returns word index or -1.
    Phrase is normalized via `normalize_for_match` before tokenizing — so
    inputs containing decimals ("5.5"), hyphens ("Vending-Bench"), or stray
    `<pause>` markers are all handled by a single rule, identical to scene-
    boundary detection."""
    target = [_norm(t) for t in normalize_for_match(phrase).split() if _norm(t)]
    if not target:
        return -1
    for i in range(start_idx, len(words) - len(target) + 1):
        if all(_norm(words[i + k]["word"]) == target[k] for k in range(len(target))):
            return i
    return -1


def find_phrase_fuzzy(words: list, phrase: str, start_idx: int = 0,
                      min_ratio: float | None = None) -> int:
    """Fuzzy phrase locator: try exact first, then progressively shorter prefixes,
    then a sliding-window content-word overlap. Returns best word index, else -1.
    Used for audio_anchor matching when Whisper drops/mishears words.
    Phrase normalized via `normalize_for_match` (decimals, hyphens, <...> markers)."""
    if min_ratio is None:
        min_ratio = FUZZY_MATCH_MIN_RATIO
    exact = find_phrase(words, phrase, start_idx)
    if exact >= 0:
        return exact
    target = [_norm(t) for t in normalize_for_match(phrase).split() if _norm(t)]
    if len(target) < 2:
        return -1
    # Try shorter prefixes (anchor's first 4, 3, 2 words)
    for span in range(min(len(target), 4), 1, -1):
        idx = find_phrase(words, " ".join(target[:span]), start_idx)
        if idx >= 0:
            return idx
    # Sliding window: find span where >=min_ratio of target tokens are present
    target_set = set(target)
    win = max(len(target), 3)
    best_i, best_score = -1, 0.0
    for i in range(start_idx, len(words) - win + 1):
        window_set = {_norm(words[i + k]["word"]) for k in range(win)}
        score = len(target_set & window_set) / len(target_set)
        if score > best_score and score >= min_ratio:
            best_score, best_i = score, i
    return best_i


print(f"[6/10] Locating scene boundaries...")
scene_start_word_idx: list[int] = []
search_from = 0
for sc in scenes_raw:
    # Clean narration before tokenizing for boundary detection:
    # Single normalization helper handles <pause Xs> markers, decimals, hyphens.
    # Same rules as audio_anchor matching — guarantees consistent behavior.
    opening_words = normalize_for_match(sc.narration).strip().split()[:SCENE_BOUNDARY_WORDS]
    found = -1
    # Pass 1: exact match, decreasing prefix length SCENE_BOUNDARY_WORDS → 2 words
    for span in range(len(opening_words), 1, -1):
        idx = find_phrase(all_words, " ".join(opening_words[:span]), search_from)
        if idx >= 0:
            found = idx; break
    # Pass 2: fuzzy match (handles digit/word mismatches like "twenty twenty-six" vs "2026")
    if found < 0:
        idx = find_phrase_fuzzy(all_words, " ".join(opening_words), search_from, min_ratio=SCENE_BOUNDARY_MIN_RATIO)
        if idx >= 0:
            found = idx
            print(f"      scene {sc.number}: fuzzy-matched opening (Whisper drift)")
    # Pass 3: time-based fallback. When phrase matching cannot find the scene
    # boundary in the transcript, fall back to a proportional-position estimate.
    #
    # Old approach (broken): use the script's stated `window_from_sec` directly.
    # That fails when actual TTS audio is much longer than the script estimated
    # (e.g. due to bug-1 audio bloat) — the script time falls BEFORE the search
    # constraint and the fallback picks the very first word after `search_from`,
    # giving the previous scene a near-zero duration.
    #
    # New approach: scale the script time proportionally to the actual audio
    # duration. If the script estimates total = T_script and actual audio is
    # T_audio, then scene N's actual start ≈ (script_start_sec / T_script) × T_audio.
    # If the proportional time is still before search_from's earliest word, we
    # fall back to evenly distributing remaining scenes across remaining audio.
    if found < 0:
        script_start = float(sc.window_from_sec)

        # Robust script_total: pick the LAST defined window_to_sec or window_from_sec
        # across all scenes — guards against last scene having window_to_sec=0
        # which would make the ratio degenerate to 1.0 (all targets snap to end).
        script_total = 0.0
        for _s in scenes_raw:
            if _s.window_to_sec and _s.window_to_sec > script_total:
                script_total = float(_s.window_to_sec)
            if _s.window_from_sec and _s.window_from_sec > script_total:
                script_total = float(_s.window_from_sec)

        if script_total > 0:
            scaled_target = (script_start / script_total) * total_sec
        else:
            scaled_target = script_start

        # If scaled target is BEFORE the search constraint (because actual audio
        # diverged from script estimate at THIS scene), distribute remaining
        # audio evenly across remaining scenes. This is the "I have no signal"
        # fallback — better than picking the very next word (gives 0-duration
        # scenes for the previous one).
        remaining_scenes = max(1, len(scenes_raw) - sc.number + 1)
        earliest_t = all_words[search_from]["start"] if search_from < len(all_words) else total_sec
        if scaled_target < earliest_t:
            audio_left = max(0.0, total_sec - earliest_t)
            # The current scene gets the FIRST slice of remaining audio.
            # E.g. if 3 scenes share 30s, scene k starts at slice 0 → earliest_t.
            # The NEXT scene starts at earliest_t + slice. So this scene starts
            # exactly at earliest_t.
            scaled_target = earliest_t
            print(f"      scene {sc.number}: scaled target before audio cursor — "
                  f"using earliest available word at t={earliest_t:.2f}s "
                  f"(remaining audio {audio_left:.1f}s for {remaining_scenes} scenes)")
        target_sec = scaled_target
        # Find the word with timestamp closest to target_sec, after search_from
        best_idx, best_delta = -1, float("inf")
        for j in range(search_from, len(all_words)):
            delta = abs(all_words[j]["start"] - target_sec)
            if delta < best_delta:
                best_delta = delta
                best_idx = j
            elif all_words[j]["start"] > target_sec + 30:
                # Well past target; best found already (widened from 5s to 30s
                # because the proportional estimate has more uncertainty)
                break
        if best_idx >= 0:
            found = best_idx
            print(f"      scene {sc.number}: time-based fallback "
                  f"(script t={script_start:.1f}s → scaled t={target_sec:.1f}s, "
                  f"picked word t={all_words[best_idx]['start']:.2f}s, delta={best_delta:.2f}s)")
    if found < 0:
        print(f"      ERROR: cannot locate scene {sc.number} narration in transcript")
        print(f"        opening words: {opening_words}")
        print(f"        searching from idx {search_from}")
        sys.exit(1)
    scene_start_word_idx.append(found)
    print(f"      scene {sc.number}: word #{found} (t={all_words[found]['start']:.2f}s)")
    search_from = found + 1


# ─── 7. COMPUTE FRAME RANGES + EMIT JSONS ───
print(f"[7/10] Computing visual block frame ranges...")
scene_timings = []
anchor_hits = 0
anchor_misses = 0

# Pre-compute scene start frames as a CUMULATIVE sequence so the sum of all
# scene durations exactly equals the audio duration. Doing per-scene
# `int(duration_sec * FPS)` truncates each scene independently — across N
# scenes that's up to N/FPS seconds of cumulative drift, which makes the
# final mux's `-shortest` clip the tail of the audio. Anchoring to a single
# cumulative frame timeline keeps total video duration == total audio.
_total_audio_frames = round(total_sec * FPS)
_scene_start_frames = [round(all_words[scene_start_word_idx[i]]["start"] * FPS)
                       for i in range(len(scenes_raw))]
_scene_end_frames = _scene_start_frames[1:] + [_total_audio_frames]

for i, sc in enumerate(scenes_raw):
    word_idx  = scene_start_word_idx[i]
    start_sec = all_words[word_idx]["start"]
    end_sec   = (all_words[scene_start_word_idx[i + 1]]["start"]
                 if i + 1 < len(scenes_raw) else total_sec)
    duration_sec    = end_sec - start_sec
    duration_frames = _scene_end_frames[i] - _scene_start_frames[i]

    # Build captions (word timestamps relative to scene start)
    next_idx    = scene_start_word_idx[i + 1] if i + 1 < len(scenes_raw) else len(all_words)
    scene_words = [
        {"word": w["word"],
         "start": round(w["start"] - start_sec, 3),
         "end":   round(w["end"]   - start_sec, 3)}
        for w in all_words[word_idx:next_idx]
    ]

    sid = scene_ids[i]
    # Canonical: project-owned captions JSON. Step 7.5 mirrors to public/captions/.
    captions_path = PROJECT_CAPTIONS_DIR / f"{sid}.json"
    captions_path.write_text(json.dumps(scene_words, ensure_ascii=False), encoding="utf-8")

    # Convert VisualBlock time windows → frame numbers (local to scene).
    # Priority: audio_anchor phrase found in Whisper transcript → use actual spoken timestamp.
    # Fallback: source script time_from_sec (approximate).
    # Then enforce: (a) first block starts at frame 0 (no black opening),
    # (b) anchor frames are monotonically increasing in script order,
    # (c) each block displays for >= MIN_BLOCK_FRAMES (1 second at project fps) so primitives don't degenerate.
    visual_blocks = designs[sc.number]
    n = len(visual_blocks)

    # MIN_BLOCK_FRAMES = N seconds × fps. Configurable via config.yaml `build.min_block_seconds`.
    # Gives complex visual blocks headroom for their lead-in interpolations.
    # CRITICAL: clamp to scene duration. For very short scenes (e.g. 11-frame
    # silence beat) where MIN_BLOCK_FRAMES × num_blocks would exceed the
    # scene's total duration, we shrink the per-block minimum so all blocks fit.
    # Without this clamp, framesTo silently exceeds durationInFrames and Remotion
    # truncates the block — collapsing 3 blocks into a single overlapping flash.
    nominal_min = round(FPS * MIN_BLOCK_SECONDS)
    if n > 0 and nominal_min * n > duration_frames:
        # Distribute the available frames evenly; floor so we don't overshoot
        MIN_BLOCK_FRAMES = max(1, duration_frames // n)
        print(f"      [scene {sc.number}] very short scene ({duration_frames}f for "
              f"{n} blocks); shrinking MIN_BLOCK_FRAMES from {nominal_min} → {MIN_BLOCK_FRAMES}")
    else:
        MIN_BLOCK_FRAMES = nominal_min

    # Step 1: resolve raw anchor frame for each bullet, AND track which blocks
    # actually got an anchor (vs fell back to time). The anchor-hit flag is
    # used by the coverage counter below — using `find_phrase_fuzzy` here AND
    # there guarantees fuzzy hits don't get mislabeled as time-fallback.
    # Use round() not int() — int() truncates toward zero and can shift the
    # visual block one frame earlier than the spoken word, accumulating drift.
    raw_anchors: list[int] = []
    anchor_hit_flags: list[bool] = []
    for vb in visual_blocks:
        anchor_frame: int | None = None
        hit = False
        if vb.audio_anchor and vb.audio_anchor.strip():
            idx = find_phrase_fuzzy(scene_words, vb.audio_anchor)
            if idx >= 0:
                anchor_frame = round(scene_words[idx]["start"] * FPS)
                hit = True
        if anchor_frame is None:
            anchor_frame = round(vb.time_from_sec * FPS)
        raw_anchors.append(max(0, min(anchor_frame, duration_frames - 1)))
        anchor_hit_flags.append(hit)

    # Step 2: enforce monotonic order + first-block-at-0 + min spacing.
    # Note: forcing first block to frame 0 means we OVERRIDE its anchor result
    # for positioning, but we still credit the anchor for coverage purposes.
    frames_from: list[int] = []
    for j, raw in enumerate(raw_anchors):
        if j == 0:
            frames_from.append(0)  # first visual must paint from t=0
        else:
            min_start = frames_from[j - 1] + MIN_BLOCK_FRAMES
            frames_from.append(max(raw, min_start))
    # Final clamp: each frames_from must leave room for MIN_BLOCK_FRAMES before scene end
    for j in range(n):
        max_start = duration_frames - MIN_BLOCK_FRAMES * (n - j)
        if frames_from[j] > max_start:
            frames_from[j] = max(0, max_start)

    blocks_out = []
    for j, vb in enumerate(visual_blocks):
        framesFrom = frames_from[j]
        framesTo = frames_from[j + 1] if j + 1 < n else duration_frames
        # Bug-E fix: framesTo MUST never exceed duration_frames. The previous
        # `max(framesFrom + MIN_BLOCK_FRAMES, …)` could overshoot duration_frames
        # for tiny scenes — Remotion then silently truncated. Now we cap.
        framesTo = min(framesTo, duration_frames)
        # Ensure each block has at least 1 frame; if MIN_BLOCK_FRAMES wouldn't fit,
        # take what's available (shrunk MIN_BLOCK_FRAMES already accounts for this
        # in the very-short-scene branch above).
        if framesTo <= framesFrom:
            framesTo = min(framesFrom + MIN_BLOCK_FRAMES, duration_frames)
            framesTo = max(framesFrom + 1, framesTo)
        block = {
            "framesFrom": framesFrom,
            "framesTo": framesTo,
            "code": vb.code,
            "audio_anchor": vb.audio_anchor,
            "source_headline": vb.source_headline,
        }
        blocks_out.append(block)
        # Use the anchor_hit_flag computed in Step 1 (fuzzy-aware) — the OLD
        # coverage counter re-ran exact-only `find_phrase` here and missed
        # every fuzzy hit, dragging coverage from ~95% to 68% in the chat_5_5 build.
        is_anchor = anchor_hit_flags[j]
        anchor_src = "anchor" if is_anchor else "time"
        if is_anchor:
            anchor_hits += 1
        else:
            anchor_misses += 1
        # Show first ~60 chars of headline so the log is meaningful without dumping code
        head = (vb.source_headline or "")[:60]
        print(f"        [{anchor_src}] {framesFrom}-{framesTo}f  {head}")

    blocks_json = json.dumps(blocks_out, ensure_ascii=False, indent=2)
    # Canonical: project-owned scene JSON. The project folder is the source of truth.
    blocks_path = PROJECT_SCENES_DIR / f"{sid}.json"
    if not blocks_path.exists() or blocks_path.read_text(encoding="utf-8") != blocks_json:
        blocks_path.write_text(blocks_json, encoding="utf-8")

    scene_timings.append({"id": sid, "durationFrames": duration_frames})
    print(f"      {sid}: {duration_frames}f ({duration_sec:.1f}s), {len(blocks_out)} blocks")


total_blocks = anchor_hits + anchor_misses
if total_blocks > 0:
    pct = 100 * anchor_hits / total_blocks
    print(f"      audio_anchor coverage: {anchor_hits}/{total_blocks} ({pct:.0f}%)")
    if pct < 70:
        print(f"      WARNING: low anchor coverage ({pct:.0f}%) — visuals may drift from narration.")
        print(f"               Improve anchor phrases in source.txt, then delete storyboard/.cache/designs/")


# ─── 7.5 SYNC project-owned scenes/ + captions/ → remotion/public/{scenes,captions}/ ───
# All per-scene data lives canonically under projects/<name>/{scenes,captions}/.
# Remotion's bundler can only read from remotion/public/, so we mirror the
# active project's data there each build. Stale files from OTHER projects are
# purged to prevent cross-project leakage in the bundle.
print(f"[7.5] Syncing project scenes/ + captions/ to bundler-readable paths...")
import shutil as _shutil
active_files = {f"{sid}.json" for sid in scene_ids}


def _sync_dir(canonical: Path, mirror: Path, kind: str) -> None:
    # 1) purge mirror entries that don't belong to the active project
    for stale in mirror.glob("*.json"):
        if stale.name in active_files:
            continue  # will be overwritten below
        if not (canonical / stale.name).exists():
            stale.unlink()
    # 2) copy canonical → mirror for each active scene id (when content differs)
    for sid in scene_ids:
        src = canonical / f"{sid}.json"
        dst = mirror / f"{sid}.json"
        if not src.exists():
            print(f"      ERROR: {src.relative_to(ROOT)} missing — {kind} step did not write it"); sys.exit(1)
        if not dst.exists() or dst.read_text(encoding="utf-8") != src.read_text(encoding="utf-8"):
            _shutil.copyfile(src, dst)
    print(f"      mirrored {len(scene_ids)} {kind} → {mirror.relative_to(ROOT)}")


_sync_dir(PROJECT_SCENES_DIR,   SCENES_PUBLIC_DIR,   "scenes")
_sync_dir(PROJECT_CAPTIONS_DIR, CAPTIONS_PUBLIC_DIR, "captions")


# ─── 8. WRITE timelines.ts ───
# The pipeline is single-project: each build's timelines.ts contains ONLY the
# active project's scene entries. Stale entries from prior projects are not
# preserved — the file is rewritten from scratch every build.
print(f"[8/10] Writing timelines.ts...")


def _emit_scene(t: dict) -> str:
    return (
        f'  "{t["id"]}": {{\n'
        f'    "id": "{t["id"]}",\n'
        f'    "durationFrames": {t["durationFrames"]},\n'
        f'    "durationSeconds": {round(t["durationFrames"] / FPS, 3)},\n'
        f'    "fps": {FPS},\n'
        f'    "audioFile": "{FULL_AUDIO_NAME}",\n'
        f'    "anchors": {{}},\n'
        f'    "phases": [\n'
        f'      {{\n'
        f'        "id": "scene",\n'
        f'        "fromFrame": 0,\n'
        f'        "toFrame": {t["durationFrames"]},\n'
        f'        "enterFrames": 0,\n'
        f'        "exitFrames": 0,\n'
        f'        "transitionIn": "hard_cut"\n'
        f'      }}\n'
        f'    ]\n'
        f'  }}'
    )


_timeline_entries = ",\n".join(_emit_scene(t) for t in scene_timings)
_timelines_ts_content = (
    "// Auto-generated by storyboard/build_video.py — DO NOT EDIT BY HAND.\n"
    "// Contains only the active project's scenes. Rewritten on every build.\n"
    "//\n"
    "// Read by remotion/src/Root.tsx + UniversalScenePreview.tsx.\n\n"
    "export type SceneTimeline = {\n"
    "  id: string;\n"
    "  durationFrames: number;\n"
    "  durationSeconds: number;\n"
    "  fps: number;\n"
    "  audioFile: string;\n"
    "  anchors: Record<string, number>;\n"
    "  phases: Array<{\n"
    "    id: string;\n"
    "    fromFrame: number;\n"
    "    toFrame: number;\n"
    "    enterFrames: number;\n"
    "    exitFrames: number;\n"
    "    transitionIn: string;\n"
    "  }>;\n"
    "};\n\n"
    "export const TIMELINES: Record<string, SceneTimeline> = {\n"
    f"{_timeline_entries}\n"
    "};\n"
)
TIMELINES_TS.write_text(_timelines_ts_content, encoding="utf-8")
print(f"      wrote {len(scene_timings)} entries (replaced any prior project's entries)")

TIMING_JSON.write_text(json.dumps({
    "project":          PROJECT,
    "fps":              FPS,                  # downstream tools (visual_qa, validate_output) read this
    "total_sec":        total_sec,
    "total_frames":     total_frames,
    "audio_filename":   FULL_AUDIO_NAME,
    "output_filename":  OUTPUT_NAME,
    "scene_ids":        scene_ids,
    "scene_timings":    scene_timings,
}, indent=2), encoding="utf-8")
print(f"      wrote {TIMING_JSON.name}")


# ─── 8.5 PRE-RENDER PIPELINE VALIDATION ───
# Catches scene/caption JSON missing, timelines.ts gaps, ID format issues,
# config_tokens drift — all the orchestration concerns the Remotion framework
# does not check itself. Fails in 1s instead of after a 30s+ webpack bundle.
if validate_pipeline(scene_ids, project_dir=PROJECT_DIR) != 0:
    print("ERROR: pipeline validation failed. Fix errors above before rendering.")
    sys.exit(1)


# ─── 9. RENDER (per scene, silent, resume-safe) ───
print(f"[9/10] Rendering {len(scene_ids)} scenes...")
REMOTION_DIR = ROOT / "remotion"
RENDER_OUT   = REMOTION_DIR / "out"

# Auto-stub projects/<name>/scenes/index.ts for the @project-scenes webpack alias.
# build_video.py renders via UniversalScenePreview reading remotion/public/scenes/*.json,
# but the entry tree imports @project-scenes which webpack must resolve.
if not (PROJECT_SCENES_DIR / "index.ts").exists():
    PROJECT_SCENES_DIR.mkdir(parents=True, exist_ok=True)
    (PROJECT_SCENES_DIR / "index.ts").write_text(
        'import React from "react";\n'
        'export type SceneComponent = React.ComponentType<any>;\n'
        'export const PROJECT_SCENES: Record<string, SceneComponent> = {};\n',
        encoding="utf-8",
    )
    print(f"      auto-stubbed {PROJECT_SCENES_DIR / 'index.ts'} for webpack @project-scenes alias")

env = {
    **os.environ,
    "PROJECT": PROJECT,
    "PYTHONIOENCODING": "utf-8",
    "VIDEO_FPS": str(FPS),
    "VIDEO_WIDTH": str(config["video"]["width"]),
    "VIDEO_HEIGHT": str(config["video"]["height"]),
}

# mp4 health check — defends against silently-skipping a corrupt scene
# rendered by a prior killed build. ffprobe must report a positive duration
# AND the file must be at least ~100KB (smaller = render almost certainly
# failed). Returns False on any ffprobe error so we re-render rather than
# trust a possibly-broken file.
def _mp4_is_healthy(path: Path, min_size_bytes: int = 100_000) -> bool:
    if not path.exists() or path.stat().st_size < min_size_bytes:
        return False
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, timeout=10,
            creationflags=_NOWIN,
        )
        return r.returncode == 0 and float(r.stdout.strip() or 0) > 0.05
    except Exception:
        return False


# Determine which scenes need rendering (resume logic)
# If --scene N given, force re-render that scene only.
to_render = []
target_scene_ids = scene_ids
if args.scene is not None:
    if args.scene < 1 or args.scene > len(scene_ids):
        print(f"ERROR: --scene {args.scene} out of range (1..{len(scene_ids)})"); sys.exit(1)
    target_scene_ids = [scene_ids[args.scene - 1]]
    print(f"      --scene {args.scene} → only rendering {target_scene_ids[0]} (forced)")
    out_file = RENDER_OUT / f"{target_scene_ids[0]}.mp4"
    if out_file.exists():
        out_file.unlink()
    to_render = list(target_scene_ids)
else:
    for sid in scene_ids:
        out_file   = RENDER_OUT / f"{sid}.mp4"
        scene_json = PROJECT_SCENES_DIR / f"{sid}.json"
        # Resume-skip ONLY when: file exists, source JSON unchanged, AND the
        # mp4 itself is structurally valid (ffprobe-readable, non-trivial size).
        # The third check defends against a prior build that was killed mid-write —
        # without it the skip path would silently propagate a corrupt mp4 into stitch.
        if (
            out_file.exists()
            and scene_json.exists()
            and out_file.stat().st_mtime >= scene_json.stat().st_mtime
            and _mp4_is_healthy(out_file)
        ):
            print(f"      -- {sid} already rendered ({out_file.stat().st_size // 1024 // 1024} MB), skipping")
        else:
            if out_file.exists():
                # Always unlink — if it's stale (older than JSON) it's wrong;
                # if it's unhealthy (truncated) it would silently fail stitch.
                out_file.unlink()
            to_render.append(sid)

# Bundle once, render all pending scenes in a single node call.
# Exit-code contract with render_scenes.mjs:
#   0 → all requested scenes rendered + size-validated
#   1 → fatal error (bundle failed, etc) — abort entire build
#   2 → partial failure (per-scene retries exhausted on >=1 scene). Other
#       scenes succeeded; we surface the failure list and abort stitch
#       (no point assembling a video missing scenes).
if to_render:
    print(f"      rendering {len(to_render)} scenes: {to_render}")
    r = subprocess.run(
        ["node", "render_scenes.mjs"] + to_render,
        cwd=str(REMOTION_DIR), env=env, shell=True,
        creationflags=_NOWIN,
    )
    if r.returncode == 1:
        print(f"      RENDER FAILED (fatal)"); sys.exit(1)
    if r.returncode == 2:
        print(f"      RENDER PARTIAL — some scenes failed retries (see render_scenes.mjs log).")
        print(f"      Re-run to retry only the missing scenes; aborting stitch.")
        sys.exit(2)
    # Post-render integrity check — guards against the rare 0-exit-code
    # render that wrote a corrupt mp4 (e.g. ffmpeg muxer sync issue not
    # caught by Remotion's size guard). Fails fast with a named scene list.
    bad = [sid for sid in to_render if not _mp4_is_healthy(RENDER_OUT / f"{sid}.mp4")]
    if bad:
        print(f"      RENDER PRODUCED CORRUPT mp4 for: {bad}")
        print(f"      delete {RENDER_OUT}/<sid>.mp4 for those scenes and re-run")
        sys.exit(1)


# ─── 9.5 VISUAL QA (post-render sanity check) ───
run_qa(
    scene_ids=target_scene_ids if args.scene is not None else scene_ids,
    scenes_dir=PROJECT_SCENES_DIR,
    render_out=RENDER_OUT,
    fps=FPS,
)

# ─── 10. STITCH + MUX ───
if args.scene is not None:
    sid = target_scene_ids[0]
    preview = RENDER_OUT / f"{sid}.mp4"
    print(f"\n-- SINGLE-SCENE MODE: skipped stitch. Preview at: {preview}")
    sys.exit(0)

print(f"[10/10] Stitching + muxing audio...")
TMP = ROOT / "storyboard" / ".build_work"
TMP.mkdir(exist_ok=True)

for sid in scene_ids:
    src = RENDER_OUT / f"{sid}.mp4"
    dst = TMP / f"{sid}_clean.mp4"
    # Atomic write: ffmpeg produces an .inprogress file, we os.replace to the
    # final name only on success. Killing ffmpeg mid-encode then leaves an
    # orphan .inprogress (cleanly identifiable) and the previous valid
    # _clean.mp4 (if any) is untouched — stitch can still proceed after a
    # restart that re-renders only the failed scene.
    inprogress = dst.with_suffix(dst.suffix + ".inprogress")
    if inprogress.exists():
        inprogress.unlink()
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src),
         "-c:v", "libx264", "-preset", SCENE_CLEAN_PRESET, "-crf", SCENE_CLEAN_CRF,
         "-an", "-pix_fmt", "yuv420p", "-r", str(FPS), str(inprogress)],
        capture_output=True, text=True, check=True,
        creationflags=_NOWIN,
    )
    if not _mp4_is_healthy(inprogress):
        inprogress.unlink(missing_ok=True)
        print(f"      _clean.mp4 produced for {sid} failed health check — aborting stitch")
        sys.exit(1)
    os.replace(inprogress, dst)

# Use filter_complex concat (not -f concat demuxer) for tighter A/V sync.
# Demuxer concat copies stream timestamps, which can drift if any source mp4
# has minor PTS irregularities. filter_complex re-times the stream from frame 0.
# Each scene mp4 is silent (-an); audio is the separately-generated TTS mp3.
# Removed -shortest: total video duration is now computed to equal total audio
# duration exactly (see Step 7 cumulative-frame fix), so neither input needs
# to be truncated. Letting both run to completion preserves the full narration.
final_out = OUT_DIR / OUTPUT_NAME
ffmpeg_inputs: list[str] = []
for sid in scene_ids:
    ffmpeg_inputs += ["-i", str((TMP / f"{sid}_clean.mp4").resolve())]
ffmpeg_inputs += ["-i", str(full_audio)]
n_video = len(scene_ids)
concat_filter = "".join(f"[{i}:v:0]" for i in range(n_video)) + f"concat=n={n_video}:v=1:a=0[outv]"

# Atomic write to final_out: ffmpeg writes to .inprogress, we move on success.
# This is the most important atomic-write site in the pipeline — without it,
# Ctrl+C during the final mux leaves a partial mp4 with no moov atom that
# crashes every player. The .inprogress orphan is harmless and easy to spot.
final_inprogress = final_out.with_suffix(final_out.suffix + ".inprogress")
if final_inprogress.exists():
    final_inprogress.unlink()
r = subprocess.run(
    ["ffmpeg", "-y", *ffmpeg_inputs,
     "-filter_complex", concat_filter,
     "-map", "[outv]", "-map", f"{n_video}:a:0",
     "-c:v", "libx264", "-preset", FINAL_PRESET, "-crf", FINAL_CRF,
     "-c:a", "aac", "-b:a", AUDIO_BITRATE, "-pix_fmt", "yuv420p",
     str(final_inprogress)],
    capture_output=True, text=True,
    creationflags=_NOWIN,
)
if r.returncode != 0:
    print("STITCH FAILED:")
    print(r.stderr[-2000:])
    final_inprogress.unlink(missing_ok=True)
    sys.exit(1)
if not _mp4_is_healthy(final_inprogress):
    print(f"STITCH PRODUCED CORRUPT mp4 (no playable duration) — aborting")
    final_inprogress.unlink(missing_ok=True)
    sys.exit(1)
os.replace(final_inprogress, final_out)

sz = final_out.stat().st_size // 1024 // 1024
print(f"\n-- DONE: {final_out}  ({sz} MB, {total_sec:.1f}s)")

# ─── 10.5 OUTPUT VALIDATION (script ↔ final video) ───
# Verifies narration words actually got spoken (Whisper transcript match) AND
# every animation bullet's midpoint frame is visible (non-black) in the render.
# Issues are reported but do not fail the build — final mp4 is already produced.
print()
validate_output(PROJECT_DIR, extract_frames=False)
