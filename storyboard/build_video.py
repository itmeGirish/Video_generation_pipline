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
import time

# Wall-clock start of the production run — used to report how long the whole
# pipeline took to produce the final video (TTS + Whisper + render + stitch),
# distinct from the video's playback length. Written to production_time.json at the end.
_BUILD_START_T = time.time()
from datetime import datetime, timezone
_BUILD_START_ISO = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
from dataclasses import asdict
from pathlib import Path

import edge_tts
try:
    from piper import PiperVoice, SynthesisConfig
except Exception:
    PiperVoice = None
    SynthesisConfig = None
import yaml
from difflib import SequenceMatcher
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding="utf-8")

# Windows-only: hide the brief cmd window flash when spawning ffmpeg / node /
# claude / ffprobe etc. CREATE_NO_WINDOW (0x08000000) tells Windows not to
# allocate a console for the child. Without this every subprocess call flashes
# a black window.
_NOWIN = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0


def atomic_write_text(path: Path, content: str, encoding: str = "utf-8") -> None:
    """Write text atomically: write to <path>.inprogress, then os.replace.

    Ctrl+C between open() and close() leaves a half-written file. Atomic
    write makes that impossible: either the old file is still there OR the
    new file is fully there. Used for timelines.ts, scene/caption JSON,
    config_tokens.json — every artifact whose corruption would break a
    future build until restored from git.
    """
    inprogress = path.with_suffix(path.suffix + ".inprogress")
    try:
        inprogress.write_text(content, encoding=encoding)
        os.replace(inprogress, path)
    finally:
        # Clean up if os.replace failed (e.g. perms / disk full)
        if inprogress.exists():
            try:
                inprogress.unlink()
            except OSError:
                pass


def atomic_copy(src: Path, dst: Path) -> None:
    """Copy src → dst atomically: copy to <dst>.inprogress, then os.replace.

    Without atomic copy, Ctrl+C during _shutil.copyfile leaves a half-written
    mirror that the renderer reads as garbage."""
    import shutil as _shutil
    inprogress = dst.with_suffix(dst.suffix + ".inprogress")
    try:
        _shutil.copyfile(src, inprogress)
        os.replace(inprogress, dst)
    finally:
        if inprogress.exists():
            try:
                inprogress.unlink()
            except OSError:
                pass

# Add project root to path so we can import storyboard modules
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from storyboard.source_parser import parse as parse_source, lint as lint_source
from storyboard.bullet_linter import lint_bullets, print_lint_report
from storyboard.visual_designer import design_script
from storyboard.ssml_compiler import compile_narration
from storyboard.narration_pacer import pace_scenes
from storyboard.validate_pipeline import validate as validate_pipeline
from storyboard.validate_output import validate_output
from storyboard.fetch_images import fetch_one as fetch_image_one
from storyboard.sfx_emitter import emit_for_project
from storyboard.audio_mixer import mix_audio_layer

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
parser.add_argument("--strict-bullets", action="store_true",
                    help="Hard-fail the build if any animation bullet scores VAGUE in the "
                         "bullet linter (step 2.5). Without this flag, vague bullets are "
                         "warned but the build continues — LLM may hallucinate content.")
parser.add_argument("--strict-anchors", action="store_true",
                    help="Hard-fail the build if Step 7 audio_anchor coverage drops below "
                         "STRICT_ANCHOR_MIN_PCT (default 70%%). Without this flag, low coverage "
                         "is a SOFT warn and the build proceeds — visuals may desync from narration.")
parser.add_argument("--strict-anchor-min-pct", type=int, default=70,
                    help="Coverage percent threshold for --strict-anchors (default 70). "
                         "Ignored when --strict-anchors is not set.")
parser.add_argument("--strict-fidelity", action="store_true",
                    help="Hard-fail the build if ANY bullet's codegen fails (instead of "
                         "substituting a placeholder card). Use in CI/CD that rejects "
                         "partial fidelity. Without this flag, placeholders are emitted "
                         "WITH a placeholder=True marker so validate_output flags them.")
parser.add_argument("--strict-layout", action="store_true",
                    help="Hard-fail the build if the layout validator reports any "
                         "out-of-bounds element or cross-bullet overlap. Runs in step 8.6 "
                         "before render. Without this flag, layout violations are warnings only.")
parser.add_argument("--skip-layout", action="store_true",
                    help="Skip the layout validator (step 8.6) entirely. Use when iterating "
                         "and you want to bypass false-positives quickly.")
parser.add_argument("--resolution", default=None,
                    choices=["480p", "720p", "1080p", "1440p", "4k"],
                    help="Render resolution. Defaults to config.yaml's pinned 1920x1080. "
                         "Override with 480p/720p/1440p/4k for shorter renders or higher "
                         "quality. Note: bullets author with %%-of-width math so layouts "
                         "scale, but absolute pixel sizes (e.g. fontSize:60) won't.")
args = parser.parse_args()


# Resolution presets — keys match CLI.md § render conventions
_RESOLUTION_PRESETS = {
    "480p":  (854, 480),
    "720p":  (1280, 720),
    "1080p": (1920, 1080),
    "1440p": (2560, 1440),
    "4k":    (3840, 2160),
}


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

    # Respect rule 18 hand-conversions: if the structured file exists AND is
    # newer than the raw script, treat it as authoritative (the user manually
    # converted a rich script the regex converter can't handle). Without this
    # guard the converter overwrites careful hand-conversions with a partial
    # regex-only output that drops ### Narration / ### Animation blocks.
    if SOURCE_FILE.exists() and SOURCE_FILE.stat().st_mtime > input_path.stat().st_mtime:
        print(f"      using HAND-CONVERTED structured script at {SOURCE_FILE.relative_to(ROOT)}")
        print(f"      (newer than raw input — see rule 18; auto-converter SKIPPED)")
    else:
        raw_text = input_path.read_text(encoding="utf-8")
        clean_text = convert_with_fallback(raw_text)
        if not SOURCE_FILE.exists() or SOURCE_FILE.read_text(encoding="utf-8") != clean_text:
            SOURCE_FILE.write_text(clean_text, encoding="utf-8")
            print(f"      converted {input_path.relative_to(ROOT)} → {SOURCE_FILE.relative_to(ROOT)}")
        else:
            print(f"      using cached conversion at {SOURCE_FILE.relative_to(ROOT)}")
    print(f"      project: '{PROJECT}'")
elif input_path.is_file() and input_path.suffix == ".json":
    # Layout (c): JSON RENDER CONTRACT — the canonical machine handover from the script
    # pipeline (docs/render-contract.schema.json). Already structured: NO converter runs.
    # source_parser.parse() branches on the .json extension; everything downstream of the
    # parser (TTS/anchors/codegen/master/verify) is format-agnostic.
    PROJECT             = input_path.stem
    PROJECT_DIR         = ROOT / "projects" / PROJECT
    STRUCTURED_DIR      = ROOT / "projects" / "structured_scripts"
    PROJECT_DIR.mkdir(parents=True, exist_ok=True)
    STRUCTURED_DIR.mkdir(parents=True, exist_ok=True)

    SOURCE_FILE  = STRUCTURED_DIR / f"{PROJECT}.json"
    CONFIG_FILE  = PROJECT_DIR / "config.yaml"
    if input_path != SOURCE_FILE:
        # Copy into the canonical location (atomic-ish; contract is small)
        SOURCE_FILE.write_text(input_path.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"      copied render contract → {SOURCE_FILE.relative_to(ROOT)}")
    else:
        print(f"      using render contract at {SOURCE_FILE.relative_to(ROOT)}")
    print(f"      project: '{PROJECT}'")
elif input_path.is_dir():
    # Layout (a): project directory
    PROJECT_DIR  = input_path
    PROJECT      = PROJECT_DIR.name
    SOURCE_FILE  = PROJECT_DIR / "source.txt"
    CONFIG_FILE  = PROJECT_DIR / "config.yaml"
else:
    print(f"ERROR: '{input_path}' is neither a directory nor a .txt/.json script file"); sys.exit(1)

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
ENGINE           = str(config["audio"].get("engine", "edge_tts")).lower()
PIPER_MODEL      = config["audio"].get("model", "models/piper/en_US-ryan-high.onnx")
LENGTH_SCALE     = float(config["audio"].get("length_scale", 1.0))
# Loudness normalization to YouTube's −14 LUFS target, baked into the narration
# mp3 INSIDE gen_tts (once per hash) so BOTH stitch paths benefit. The active
# remotion_master path feeds full_audio to Remotion directly and never reaches
# the ffmpeg-stitch loudnorm at the final mux — so without this, master renders
# ship un-normalized (the level-jump fatigue rule in CLAUDE.md). Default on; set
# audio.loudnorm: false to ship raw TTS levels.
LOUDNORM         = bool(config["audio"].get("loudnorm", True))
# Light voice denoise, applied before loudnorm in the gen_tts master encode.
# highpass kills sub-60Hz DC/rumble; afftdn does a conservative spectral noise
# cut (nr=12dB). Piper output is already clean, so this is gentle insurance, not
# heavy gating (heavy denoise warbles synthetic speech). Set audio.denoise:false
# to disable.
DENOISE          = bool(config["audio"].get("denoise", True))
# Sound-design layer (vg-sound-design): mix a ducked MUSIC bed + the sfx_emitter SFX
# cues onto the narration before the master render. OFF by default — with no music
# file AND audio.sfx:false the mixer no-ops and the plain narration is used. Missing
# sound files are skipped; any mix failure falls back to narration (never breaks a build).
MUSIC_PATH       = config["audio"].get("music")           # path to a music bed mp3 (optional)
MUSIC_GAIN_DB    = float(config["audio"].get("music_gain_db", -20.0))
SFX_ENABLED      = bool(config["audio"].get("sfx", False))
SFX_DIR_CFG      = config["audio"].get("sfx_dir")          # default: projects/<name>/assets/sfx/
TTS_SR, TTS_BR   = (22050, "96k") if ENGINE == "piper" else (24000, "48k")
OUTPUT_NAME      = config["output"]
PROJECT_PREFIX   = re.sub(r"[^a-z0-9]", "-", PROJECT.lower()).strip("-")

# ─── PINNED CONSTANTS (SKILL.md contract #9) ───
# These four config values are pipeline-wide invariants. Reading them from
# config.yaml is allowed (so projects can SEE them) but a typo'd value would
# silently produce off-spec video. Fail loud at config-load time.
# Apply --resolution override (after config load, before pin check). The pin
# enforces the DEFAULT only — explicit --resolution opts the user out.
_resolution_override = None
if args.resolution:
    _resolution_override = _RESOLUTION_PRESETS[args.resolution]
    config["video"]["width"], config["video"]["height"] = _resolution_override
    print(f"      --resolution {args.resolution} → "
          f"{_resolution_override[0]}x{_resolution_override[1]} (overrides config.yaml pinned 1920x1080)")

_PINNED = {
    "video.fps":     (FPS,             30),
    "audio.voice":   (VOICE, "en-US-AndrewMultilingualNeural"),
}
# When NO --resolution override, keep the original 1920x1080 pin in effect.
if _resolution_override is None:
    _PINNED["video.width"] = (config["video"]["width"], 1920)
    _PINNED["video.height"] = (config["video"]["height"], 1080)

_pin_errors = [(k, actual, expected) for k, (actual, expected) in _PINNED.items()
               if actual != expected]
if _pin_errors:
    print("ERROR: config.yaml has off-spec PINNED values (SKILL.md contract #9):")
    for k, actual, expected in _pin_errors:
        print(f"       {k} = {actual!r}  (expected {expected!r})")
    print("       Edit config.yaml to match the pinned values, or pass --resolution.")
    sys.exit(1)

# NOTE: the previous `llm.designer_model` config knob and `DESIGNER_MODEL` env
# var were removed alongside the claude CLI subprocess. Per-bullet React code
# is now authored in-session by the active Claude Code agent (rule 04). The
# acting agent's model — Opus 4.7 for authoring/correction/QA, Sonnet 4.6 for
# mechanical work — is selected via `/model` in Claude Code, not config.yaml.

atomic_write_text(TOKENS_JSON, json.dumps(config["design"], indent=2))
print(f"      design tokens → {TOKENS_JSON.name}")


# ─── Engineering tunables (config-overridable; defaults baked here) ───
# Each is read from config.yaml's optional `build:` / `stitch:` / `whisper:` /
# `narration:` sections. Defaults are sane for the typical chat-explainer
# project; override only when a project demands different pacing or codec.
_build_cfg = config.get("build", {})
_stitch_cfg = config.get("stitch", {})
_whisper_cfg = config.get("whisper", {})

# Visual-block timing
MIN_BLOCK_SECONDS         = float(_build_cfg.get("min_block_seconds", 1.0))
SCENE_BOUNDARY_WORDS      = int(_build_cfg.get("scene_boundary_words", 8))
FUZZY_MATCH_MIN_RATIO     = float(_build_cfg.get("fuzzy_match_min_ratio", 0.6))
FUZZY_MATCH_SEQ_RATIO     = float(_build_cfg.get("fuzzy_match_seq_ratio", 0.75))
SCENE_BOUNDARY_MIN_RATIO  = float(_build_cfg.get("scene_boundary_min_ratio", 0.5))

# ffmpeg quality knobs
SCENE_CLEAN_PRESET = str(_stitch_cfg.get("scene_clean_preset", "fast"))
# Intermediate "clean" re-encode is generation #2 of 3 on the ffmpeg stitch path
# (Remotion h264 → scene_clean → final stitch). Each H.264 pass compounds loss
# (softer text, gradient banding). The intermediate must be near-LOSSLESS so it
# adds no visible loss before the final encode; CRF 14 is perceptually transparent
# at ~2× temp size (the _clean.mp4 is deleted after stitch, so the size is throwaway).
# Was 20 — that baked lossy artifacts in, then re-compressed them at final. Don't
# raise above ~16. qp 0 (true lossless) is wasteful — the lossy final encode caps quality anyway.
SCENE_CLEAN_CRF    = str(_stitch_cfg.get("scene_clean_crf", 14))
FINAL_PRESET       = str(_stitch_cfg.get("final_preset", "medium"))
FINAL_CRF          = str(_stitch_cfg.get("final_crf", 19))
AUDIO_BITRATE      = str(_stitch_cfg.get("audio_bitrate", "256k"))
# Bitrate FLOOR for the final encode. rule 22/23 T4 require ≥8 Mbps; CLAUDE.md states
# the YouTube target -b:v 8M -maxrate 10M -b:a 384k.
# MEASURED (real 59s scene): plain CRF 19 → 5.3 Mbps (FAILS T4). Adding -maxrate/-bufsize
# to CRF → still 5.3 Mbps (a ceiling can't raise a low average). ABR -b:v 8M → 8.17 Mbps
# (PASSES). So a real floor REQUIRES ABR target-bitrate mode, not capped-CRF.
# Therefore final_bitrate defaults to 8M (ABR). Set final_bitrate: null in config to
# fall back to quality-targeted capped-CRF (smaller files, but may miss the T4 gate).
FINAL_MAXRATE      = str(_stitch_cfg.get("final_maxrate", "10M"))
FINAL_BUFSIZE      = str(_stitch_cfg.get("final_bufsize", "20M"))
FINAL_BITRATE      = (_stitch_cfg["final_bitrate"] if "final_bitrate" in _stitch_cfg
                      else "8M")   # ABR hard floor by default; null → capped-CRF

# Whisper quantization
WHISPER_COMPUTE_TYPE = str(_whisper_cfg.get("compute_type", "int8"))
# Timestamp source: "whisper" (default, faster_whisper ASR) or "torchaudio"
# (forced alignment of the known narration → far tighter word boundaries).
# torchaudio is opt-in + fallback-safe: any failure reverts to whisper.
WHISPER_ALIGNER = str(_whisper_cfg.get("aligner", "whisper")).strip().lower()

# Sync-to-meaning config (anchor_mode: appear / through / land). framesFrom is
# computed from the anchor word's start/end + the bullet's anchor_mode:
#   appear → round(word_start*fps) − lead   (small visual lead reads cleaner; AV research)
#   through→ round(word_start*fps)          (motion runs across the word)
#   land   → round(word_end*fps) − entrance (impact climax lands on word completion)
_sync_cfg = config.get("sync", {})
SYNC_LEAD_FRAMES     = int(_sync_cfg.get("anchor_lead_frames", 2))    # visual lead for `appear`
SYNC_ENTRANCE_FRAMES = int(_sync_cfg.get("entrance_frames", 12))      # wind-up length for `land`

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


# ─── 2.5 BULLET VAGUENESS LINT ───
print(f"[2.5] Bullet vagueness lint...")
_bullet_warnings = lint_bullets(scenes_raw)
_vague_count = print_lint_report(_bullet_warnings, strict=args.strict_bullets)
if args.strict_bullets and _vague_count > 0:
    print(f"\n[2.5] STRICT-BULLETS: {_vague_count} vague bullet(s) — aborting before LLM codegen.")
    print(f"      Fix the flagged bullets in the structured script, then re-run.")
    sys.exit(3)


# ─── 2.6 ASSET RESOLUTION (auto-fetch missing [asset:] images from description) ───
# The SCRIPT drives this: every [asset: <path>] token names a file that must
# exist at PROJECT_DIR/public/<path> before render. If it's missing and
# assets.auto_fetch is on (default), source a license-safe image automatically
# using the bullet description as the search query (default Openverse —
# CC/commercial-use), keep the top candidate, and record attribution to
# CREDITS.md. A token that still can't be resolved is a hard error — we never
# render a broken <Img>. Projects with no [asset:] refs incur zero network cost.
print(f"[2.6] Asset resolution (auto-fetch missing [asset:] images)...")
_ASSET_TOKEN_RE   = re.compile(r"\[asset:\s*([^\]\|]+?)\s*(?:\|[^\]]*)?\]", re.IGNORECASE)
_assets_cfg       = config.get("assets") or {}
_assets_autofetch = _assets_cfg.get("auto_fetch", True)
_assets_source    = _assets_cfg.get("source", "openverse")
PUBLIC_DIR        = PROJECT_DIR / "public"
CREDITS_FILE      = PROJECT_DIR / "CREDITS.md"


def _asset_query(headline: str, body: str) -> str:
    """Build a concise web-search query from a bullet's description text."""
    text = f"{headline} {body}".strip()
    text = _ASSET_TOKEN_RE.sub("", text)        # drop the [asset:] token itself
    text = re.sub(r"\[[^\]]*\]", "", text)      # drop any other [..] annotations
    text = re.sub(r"[*_`>#]", "", text)         # strip markdown marks
    text = re.sub(r"[\"“”'’]", "", text)        # strip quotes
    text = re.sub(r"\s+", " ", text).strip(" .—–-")
    return " ".join(text.split()[:10])          # cap length — short queries search better


def _append_credit(meta: dict, asset_rel: str) -> None:
    if not CREDITS_FILE.exists():
        atomic_write_text(CREDITS_FILE, "# Image Credits\n\n")
    lic    = meta.get("license") or "unknown"
    credit = meta.get("attribution") or meta.get("creator") or "unknown"
    src    = meta.get("source_url") or meta.get("image_url") or ""
    with CREDITS_FILE.open("a", encoding="utf-8") as f:
        f.write(f"- **{asset_rel}** — {credit} — {lic} — {src}\n")


# Collect every [asset:] reference from the parsed script with its query + locus.
_asset_refs: list[tuple[str, str, int, int]] = []
for sc in scenes_raw:
    for _bi, _b in enumerate(sc.animation):
        for _m in _ASSET_TOKEN_RE.finditer(f"{_b.headline} {_b.body}"):
            _rel = re.sub(r"^public/", "", _m.group(1).strip())  # token is path UNDER public/
            _asset_refs.append((_rel, _asset_query(_b.headline, _b.body), sc.number, _bi + 1))

_assets_present = _assets_fetched = 0
for _rel, _query, _sc_no, _b_no in _asset_refs:
    _dest = PUBLIC_DIR / _rel
    if _dest.exists():
        _assets_present += 1
        continue
    if not _assets_autofetch:
        print(f"\n[2.6] MISSING asset {_rel!r} (S{_sc_no}B{_b_no}) and assets.auto_fetch is off — aborting.")
        sys.exit(4)
    print(f"      fetching {_rel}  (S{_sc_no}B{_b_no})  query={_query!r}  source={_assets_source}")
    _meta = None
    try:
        _meta = fetch_image_one(_query, _dest, source=_assets_source)
    except Exception as _e:
        print(f"      [2.6] fetch error for {_rel}: {_e}")
    if _meta is None or not _dest.exists():
        _out_dir = PUBLIC_DIR / Path(_rel).parent
        print(
            f"\n[2.6] ASSET FAIL: could not source {_rel!r} for S{_sc_no}B{_b_no}.\n"
            f"      Source one manually, inspect, and keep the best candidate:\n"
            f"        python storyboard/fetch_images.py --query {_query!r} "
            f"--out {_out_dir} --name {Path(_rel).stem} --source {_assets_source}\n"
        )
        sys.exit(4)
    _append_credit(_meta, _rel)
    _assets_fetched += 1
print(f"      {_assets_present} present, {_assets_fetched} auto-fetched, {len(_asset_refs)} total [asset:] refs")


# ─── 3. VISUAL DESIGN (LLM codegen per bullet) ───
print(f"[3/10] Visual design (LLM codegen per bullet)...")
designs = design_script(
    scenes_raw, config["design"],
    strict_fidelity=args.strict_fidelity,
)   # {scene_number: [VisualBlock, ...]}
for sc in scenes_raw:
    blocks = designs[sc.number]
    print(f"      scene {sc.number}: {len(blocks)} visual blocks (fidelity gate passed)")


# ─── 3.5 NARRATION PACING ───
# Inject <pause Xs> markers in scene narration so each bullet's NATURAL audio
# gap (between its anchor word and the next bullet's anchor word) is at least
# the bullet's required display duration. Without this, dense back-to-back
# anchor phrases ("Eight minutes. No fluff.") collapse the bullet's display
# window to ~1s — too short to read multi-line content. See rule 08
# § "Narration pacer (Step 3.5)".
print(f"[3.5] Narration pacer (display-time enforcement)...")
_anchors_by_scene: dict[int, list[str]] = {
    sc.number: [vb.audio_anchor or "" for vb in designs[sc.number]]
    for sc in scenes_raw
}
pace_scenes(scenes_raw, _anchors_by_scene, verbose=True)


# ─── 4. CONTINUOUS TTS (with SSML for non-flat narration) ───
print(f"[4/10] Continuous TTS (SSML-enhanced)...")
full_ssml      = compile_narration(scenes_raw)
# Cache key MUST include voice/rate/pitch — changing any of these in config.yaml
# changes the rendered audio bytes, so the cached mp3 must be invalidated.
# (Spec contract: cache by sha256(SSML) was incomplete — voice/rate/pitch were
# silent invalidation holes that returned stale audio after the user "fixed"
# config.yaml.)
_tts_cache_input = f"{ENGINE}|{VOICE}|{RATE}|{PITCH}|{LENGTH_SCALE}|{LOUDNORM}|{DENOISE}|{full_ssml}"
text_hash      = hashlib.sha256(_tts_cache_input.encode()).hexdigest()[:16]
full_audio     = AUDIO_DIR / FULL_AUDIO_NAME
hash_marker    = AUDIO_DIR / f".{FULL_AUDIO_NAME}.{text_hash}.hash"


import html as _html
import tempfile

# ─── Helpers for split-render-concat TTS (Strategy B for honoring pause durations) ───
# edge-tts uses Microsoft's FREE Edge TTS endpoint, which filters non-conforming
# SSML — it does NOT honor <break time="..."/>. Verified in github.com/rany2/edge-tts
# issue #173. Without this code, every <pause Xs> marker collapses to a generic
# comma and the duration value is lost.
#
# Strategy B (community canonical, verified in moha-abdi gist + edge-tts issues
# #58, #136): split the SSML on <break time="Nms"/>, render each text chunk
# separately via edge-tts, generate exact-duration silence per break with ffmpeg
# anullsrc, concat losslessly via ffmpeg concat demuxer (-c copy).
#
# Format match is critical: silence files MUST be 24kHz mono 48kbps libmp3lame
# to match edge-tts's exact output format (audio-24khz-48kbitrate-mono-mp3).
# Mismatch → -c copy concat fails or produces glitches.

_BREAK_SPLIT_RE = re.compile(r'<break\s+time="(\d+)(ms|s)"\s*/>', re.IGNORECASE)


def _ms_from_break_match(value: str, unit: str) -> int:
    n = int(value)
    return n if unit.lower() == "ms" else n * 1000


def _strip_ssml_to_plain(plain: str) -> str:
    """Mirror the rule 10 Class 1 defense pipeline. Strip tags, decode HTML
    entities, strip again to catch any entity-decoded <pause> patterns.
    Variable named `plain` (not `text`) because the regression test in
    test_pipeline_fixes.py group [7] greps for the exact string
    `_html.unescape(plain)` to ensure the defense doesn't regress."""
    plain = re.sub(r'<[^>]+>', '', plain)
    plain = _html.unescape(plain)
    plain = re.sub(r'<[^>]+>', '', plain)
    plain = re.sub(r'\s+', ' ', plain).strip()
    return plain


def _generate_silence_mp3(duration_ms: int, out_path: Path) -> None:
    """Generate exact-duration silent mp3 in edge-tts format (24kHz mono 48kbps)."""
    duration_sec = duration_ms / 1000.0
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi",
         "-i", f"anullsrc=r={TTS_SR}:cl=mono",
         "-t", f"{duration_sec:.3f}",
         "-c:a", "libmp3lame", "-b:a", TTS_BR, "-ar", str(TTS_SR), "-ac", "1",
         str(out_path)],
        capture_output=True, check=True,
        creationflags=_NOWIN,
    )


def _concat_mp3s_lossless(input_paths: list[Path], out_path: Path) -> None:
    """Concat mp3s via ffmpeg concat demuxer with -c copy (lossless, no re-encode)."""
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False,
                                     encoding="utf-8") as f:
        list_path = Path(f.name)
        for p in input_paths:
            # ffmpeg concat demuxer requires forward-slash paths even on Windows
            f.write(f"file '{p.resolve().as_posix()}'\n")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
             "-i", str(list_path), "-c", "copy", str(out_path)],
            capture_output=True, check=True,
            creationflags=_NOWIN,
        )
    finally:
        list_path.unlink(missing_ok=True)


def _piper_render_chunk(voice, text, out_path):
    """Synthesize one text chunk with Piper → mp3 (22050 mono 96k, matches the
    silence format so lossless -c copy concat doesn't glitch)."""
    import wave as _wave
    wav_tmp = out_path.with_suffix(".wav")
    with _wave.open(str(wav_tmp), "wb") as wf:
        voice.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=LENGTH_SCALE))
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_tmp),
         "-c:a", "libmp3lame", "-b:a", "96k", "-ar", "22050", "-ac", "1",
         str(out_path)],
        capture_output=True, check=True, creationflags=_NOWIN,
    )
    wav_tmp.unlink(missing_ok=True)
    if not out_path.exists() or out_path.stat().st_size == 0:
        raise RuntimeError(f"Piper produced 0-byte chunk: {out_path.name}")


async def gen_tts():
    if full_audio.exists() and hash_marker.exists():
        print(f"      using cached audio (hash {text_hash})")
        return
    print(f"      generating TTS via {VOICE} (hash {text_hash})...")

    # 1. Split SSML on <break time="Nms"/>. Each chunk is the text BEFORE a
    # break; the break's duration is the silence to insert AFTER that chunk.
    # Last chunk has no break after it.
    cursor = 0
    chunks: list[tuple[str, int]] = []   # (plain_text, ms_pause_after)
    for m in _BREAK_SPLIT_RE.finditer(full_ssml):
        chunk_ssml = full_ssml[cursor:m.start()]
        ms_after = _ms_from_break_match(m.group(1), m.group(2))
        chunks.append((_strip_ssml_to_plain(chunk_ssml), ms_after))
        cursor = m.end()
    chunks.append((_strip_ssml_to_plain(full_ssml[cursor:]), 0))

    # 2. Render each non-empty text chunk + generate silence per break.
    work_dir = AUDIO_DIR / ".pause_chunks"
    work_dir.mkdir(parents=True, exist_ok=True)
    # Only wipe stale files whose index is not in the current chunk list
    current_names = {f"chunk_{i:04d}.mp3" for i, (t, _) in enumerate(chunks) if t}
    current_names |= {f"silence_{i:04d}.mp3" for i, (_, ms) in enumerate(chunks) if ms > 0}
    for stale in work_dir.glob("*.mp3"):
        if stale.name not in current_names:
            stale.unlink(missing_ok=True)

    # Defensive sweep: any 0-byte mp3 in work_dir from a previous crashed run
    # is stale (TTS write completed without bytes — typically a websocket
    # drop). Delete them so the size>0 check below treats them as missing
    # and re-renders. Without this sweep a 0-byte file would trip the
    # "after 6 attempts still 0 bytes" guard if the immediate retries also
    # hit network trouble — better to start fresh.
    for stale_zero in work_dir.glob("*.mp3"):
        if stale_zero.stat().st_size == 0:
            stale_zero.unlink(missing_ok=True)

    _PIPER_VOICE = None
    if ENGINE == "piper":
        if PiperVoice is None:
            raise RuntimeError("audio.engine=piper but piper-tts not importable (pip install piper-tts)")
        _mp = Path(PIPER_MODEL)
        if not _mp.is_absolute() and not _mp.exists():
            _mp = Path(__file__).resolve().parents[1] / PIPER_MODEL
        _PIPER_VOICE = PiperVoice.load(str(_mp))
        print(f"      Piper voice loaded: {_mp.name}")

    parts: list[Path] = []
    n_chunks_rendered = 0
    n_chunks_skipped = 0
    n_pauses = 0
    # Per-chunk websocket-save timeout (seconds). edge-tts has no built-in
    # ceiling on `Communicate.save()` — a stalled bing speech websocket can
    # hang the build forever. 30s is generous for any normal chunk
    # (typically 50-150 KB) and ensures the retry loop actually fires.
    PER_CHUNK_TTS_TIMEOUT_S = 30
    for i, (text, ms_after) in enumerate(chunks):
        if text:
            chunk_path = work_dir / f"chunk_{i:04d}.mp3"
            if chunk_path.exists() and chunk_path.stat().st_size > 0:
                n_chunks_skipped += 1
            elif ENGINE == "piper":
                # Piper is synchronous + fully local (no websocket / retry loop):
                # synthesize the chunk directly. Without this branch engine=piper
                # silently fell through to edge_tts below — the half-wired bug
                # that made layoffs_2026's engine:piper a no-op.
                _piper_render_chunk(_PIPER_VOICE, text, chunk_path)
                n_chunks_rendered += 1
            else:
                for _attempt in range(6):
                    if _attempt > 0:
                        await asyncio.sleep(3.0 * _attempt)
                    c = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
                    try:
                        await asyncio.wait_for(c.save(str(chunk_path)), timeout=PER_CHUNK_TTS_TIMEOUT_S)
                    except asyncio.TimeoutError:
                        # Partial / 0-byte file may exist — wipe it so the
                        # next attempt isn't fooled into thinking it succeeded.
                        if chunk_path.exists():
                            chunk_path.unlink(missing_ok=True)
                        continue
                    except Exception:
                        # Network glitch, websocket drop, etc. — same cleanup.
                        if chunk_path.exists() and chunk_path.stat().st_size == 0:
                            chunk_path.unlink(missing_ok=True)
                        continue
                    if chunk_path.exists() and chunk_path.stat().st_size > 0:
                        break
                if not chunk_path.exists() or chunk_path.stat().st_size == 0:
                    raise RuntimeError(f"TTS wrote 0-byte file after 6 attempts: chunk_{i:04d}.mp3")
                await asyncio.sleep(0.15)
                n_chunks_rendered += 1
            parts.append(chunk_path)
        if ms_after > 0:
            silence_path = work_dir / f"silence_{i:04d}.mp3"
            if not silence_path.exists():
                _generate_silence_mp3(ms_after, silence_path)
            parts.append(silence_path)
            n_pauses += 1

    if not parts:
        raise RuntimeError("No TTS chunks rendered — full_ssml has no spoken text?")

    # 3. Concat (or rename if only one chunk and no pauses).
    if len(parts) == 1:
        os.replace(parts[0], full_audio)
    else:
        _concat_mp3s_lossless(parts, full_audio)

    if ENGINE == "piper" or LOUDNORM or DENOISE:
        # Final master encode of the narration mp3 — two jobs in one pass:
        #   (a) Uniform CBR mono stream. Piper chunks (libmp3lame) + silence
        #       don't share byte-identical mp3 frame params, so the -c copy
        #       concat above leaves inconsistent frames → faster_whisper raises
        #       "Frame does not match AudioFifo parameters". Re-encoding once
        #       gives every downstream consumer (Whisper, ffmpeg mux, the
        #       Remotion master) a clean stream.
        #   (b) Bake YouTube's −14 LUFS loudness target so narration ships at a
        #       consistent, non-fatiguing level. The remotion_master stitch feeds
        #       this file to Remotion directly and never hits the final-mux
        #       loudnorm — so this is the only place master audio gets normalized.
        # Single-pass loudnorm preserves duration, so the frame math below (the
        # ffprobe at ~line 810) is unaffected.
        _filters = []
        if DENOISE:
            # highpass first (remove rumble), then a gentle FFT denoise. Order
            # matters: clean the spectrum BEFORE loudnorm measures/normalizes it.
            _filters += ["highpass=f=60", "afftdn=nr=12:nf=-35"]
        if LOUDNORM:
            _filters += ["loudnorm=I=-14:TP=-1.5:LRA=11"]
        _af = ["-af", ",".join(_filters)] if _filters else []
        _norm = full_audio.with_name(full_audio.stem + ".norm.mp3")
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(full_audio),
             *_af,
             "-c:a", "libmp3lame", "-b:a", "128k", "-ar", str(TTS_SR), "-ac", "1",
             str(_norm)],
            capture_output=True, check=True, creationflags=_NOWIN,
        )
        os.replace(_norm, full_audio)

    # 4. Cleanup work dir + roll hash marker.
    for f in work_dir.glob("*.mp3"):
        f.unlink(missing_ok=True)
    try:
        work_dir.rmdir()
    except OSError:
        pass  # non-empty (concurrent stale files); harmless

    for old in AUDIO_DIR.glob(f".{FULL_AUDIO_NAME}.*.hash"):
        old.unlink()
    hash_marker.write_text("", encoding="utf-8")

    skip_msg = f", {n_chunks_skipped} resumed from cache" if n_chunks_skipped else ""
    if n_pauses:
        print(f"      rendered {n_chunks_rendered} chunk(s){skip_msg} + {n_pauses} "
              f"exact-duration pause(s) honored")
    else:
        print(f"      rendered {n_chunks_rendered} chunk(s){skip_msg} (no pause markers in narration)")


asyncio.run(gen_tts())

probe = subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration",
     "-of", "default=nw=1:nk=1", str(full_audio)],
    capture_output=True, text=True,
    creationflags=_NOWIN,
)
total_sec    = float(probe.stdout.strip())
# round() not int() — int() truncates and drifts 1 frame from the cumulative
# scene-frame math at line ~756 (which uses round()). Two values for the same
# quantity = silent 1-frame drift in build_timing.json vs the rendered video.
total_frames = round(total_sec * FPS)
print(f"      audio: {total_sec:.2f}s ({total_frames} frames)")

# WPM sanity check: actual wpm vs 150 wpm target.
# If TTS speaks slower than 150 wpm, visual block durations (derived from
# script M:SS windows designed at 150 wpm) will finish before narration —
# "visuals fast, sound slow." Warn early so the user can fix audio.rate.
import re as _re
_narration_words = sum(len(_re.findall(r'\b\w+\b', sc.narration)) for sc in scenes_raw)
_actual_wpm = _narration_words / max(1.0, total_sec / 60.0)
_TARGET_WPM = 150
if _actual_wpm < _TARGET_WPM * 0.88:
    _suggested_rate = round((_TARGET_WPM / _actual_wpm - 1) * 100)
    print(f"      WARNING: TTS rate is {_actual_wpm:.0f} wpm (target {_TARGET_WPM} wpm). "
          f"Visuals will finish before narration. "
          f"Fix: set audio.rate: '+{_suggested_rate}%' in config.yaml and re-run.")
else:
    print(f"      WPM: {_actual_wpm:.0f} (target {_TARGET_WPM})")


# ─── 5. WHISPER ───
print(f"[5/10] Whisper transcribe (cached by audio hash + model + compute_type)...")
# Cache key MUST include the Whisper model name and compute_type. Without them,
# `--whisper-model large` after a prior run with `--whisper-model base` returns
# the OLD cached `base` transcript silently — user explicitly asked for higher
# quality, gets the lower one.
_whisper_cache_input = (
    full_audio.read_bytes()
    + f"|{args.whisper_model}|{WHISPER_COMPUTE_TYPE}|aligner={WHISPER_ALIGNER}".encode()
)
audio_hash = hashlib.sha256(_whisper_cache_input).hexdigest()[:16]
cache_file = CACHE_DIR / f"transcript-{audio_hash}.json"
if cache_file.exists():
    all_words = json.loads(cache_file.read_text(encoding="utf-8"))
    print(f"      cached transcript ({len(all_words)} words)")
elif WHISPER_ALIGNER == "torchaudio":
    # Forced alignment of the KNOWN narration → tighter word boundaries.
    # Fallback-safe: any failure reverts to faster_whisper below.
    all_words = None
    try:
        from forced_align import align as _force_align
        _transcript = " ".join(sc.narration for sc in scenes_raw)
        all_words = _force_align(str(full_audio), _transcript)
        cache_file.write_text(json.dumps(all_words, indent=2), encoding="utf-8")
        print(f"      forced-aligned (torchaudio MMS_FA): {len(all_words)} words")
    except Exception as e:
        print(f"      WARNING: torchaudio forced alignment failed ({type(e).__name__}: {e}); "
              f"falling back to faster_whisper")
        all_words = None
    if all_words is None:
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
        print(f"      transcribed (whisper fallback): {len(all_words)} words")
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

# BUG1 fix: "eighty-six" in an anchor splits to TWO tokens ["eighty","six"] while
# Whisper writes the digit form "86" — ONE token. Token-level _norm() can't bridge
# this multi-token gap. _compress_written_numbers() collapses adjacent tens+ones pairs
# in the ANCHOR token list so both sides compare as the same digit string "86".
# Only compound patterns are collapsed; standalone tens/ones pass through so
# "eighty percent" stays ["eighty","percent"] and still matches Whisper "eighty".
_WRITTEN_TENS: dict[str, int] = {
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
}
_WRITTEN_ONES_COMPOUND: dict[str, int] = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9,
}


def _compress_written_numbers(tokens: list[str]) -> list[str]:
    """Collapse adjacent (tens + ones) word pairs to their digit string.
    ["eighty","six"] → ["86"], ["forty","four"] → ["44"].
    Standalone tokens pass through unchanged."""
    result: list[str] = []
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if (t in _WRITTEN_TENS
                and i + 1 < len(tokens)
                and tokens[i + 1] in _WRITTEN_ONES_COMPOUND):
            result.append(str(_WRITTEN_TENS[t] + _WRITTEN_ONES_COMPOUND[tokens[i + 1]]))
            i += 2
        else:
            result.append(t)
            i += 1
    return result


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


def _contraction_variant(text: str) -> str:
    """Contracted twin of `text` for transcript matching (bug Class 21).

    Whisper often transcribes clearly-spoken 'here is' as \"here's\" — one
    token, which `_norm` collapses to 'heres'. The script-side tokens
    ['here','is'] then NEVER exact-match at the true position, and the
    shrinking-prefix boundary pass can instead hit the same words verbatim
    inside a LATER scene (pixel_rag 2026-07-04: scene 2 'Here is the whole
    map' matched scene 8's 'So here is the rule' at t=319.5s → scenes 2-7
    collapsed to ~0.2s each). Boundary matching therefore tries BOTH the
    as-written opening and this contracted variant and takes the earliest hit.
    """
    subs = [
        (r"\b(here|there|that|what|it|she|he|who|where|how)\s+is\b", r"\1's"),
        (r"\b(you|we|they)\s+are\b", r"\1're"),
        (r"\b(you|we|they|i)\s+will\b", r"\1'll"),
        (r"\b(you|we|they|i)\s+have\b", r"\1've"),
        (r"\bdo\s+not\b", "don't"),
        (r"\bdoes\s+not\b", "doesn't"),
        (r"\bdid\s+not\b", "didn't"),
        (r"\bis\s+not\b", "isn't"),
        (r"\bare\s+not\b", "aren't"),
        (r"\bwill\s+not\b", "won't"),
        (r"\bcannot\b", "can't"),
        (r"\blet\s+us\b", "let's"),
        (r"\bi\s+am\b", "i'm"),
    ]
    out = text
    for pat, rep in subs:
        out = re.sub(pat, rep, out, flags=re.IGNORECASE)
    return out


def find_phrase(words: list, phrase: str, start_idx: int = 0) -> int:
    """Exact match. Returns word index or -1.
    Phrase is normalized via `normalize_for_match` before tokenizing — so
    inputs containing decimals ("5.5"), hyphens ("Vending-Bench"), or stray
    `<pause>` markers are all handled by a single rule, identical to scene-
    boundary detection. Written compound numbers are compressed to digit form
    so "eighty-six" → target token "86" matches Whisper's digit transcript."""
    target = _compress_written_numbers(
        [_norm(t) for t in normalize_for_match(phrase).split() if _norm(t)]
    )
    if not target:
        return -1
    for i in range(start_idx, len(words) - len(target) + 1):
        if all(_norm(words[i + k]["word"]) == target[k] for k in range(len(target))):
            return i
    return -1


def find_phrase_fuzzy(words: list, phrase: str, start_idx: int = 0,
                      min_ratio: float | None = None) -> int:
    """Fuzzy phrase locator. Four-tier fallback:
    1. Exact match (find_phrase, includes digit compression).
    2. Shorter prefix exact match (first 4, 3, 2 anchor words).
    3. Sliding-window token-set overlap — handles dropped words.
    4. SequenceMatcher phrase similarity — handles phonetic substitutions
       (claude→cloud, openai→open ai, want to→wanna). Window is n..n+2
       to absorb cases where Whisper splits one anchor word into two.
    Returns best word index or -1."""
    if min_ratio is None:
        min_ratio = FUZZY_MATCH_MIN_RATIO
    exact = find_phrase(words, phrase, start_idx)
    if exact >= 0:
        return exact
    target = _compress_written_numbers(
        [_norm(t) for t in normalize_for_match(phrase).split() if _norm(t)]
    )
    if len(target) < 2:
        return -1
    # Tier 2: shorter prefixes (anchor's first 4, 3, 2 words)
    for span in range(min(len(target), 4), 1, -1):
        idx = find_phrase(words, " ".join(target[:span]), start_idx)
        if idx >= 0:
            return idx
    # Tier 3: sliding window token-set overlap
    target_set = set(target)
    win = max(len(target), 3)
    best_i, best_score = -1, 0.0
    for i in range(start_idx, len(words) - win + 1):
        window_set = {_norm(words[i + k]["word"]) for k in range(win)}
        score = len(target_set & window_set) / len(target_set)
        if score > best_score and score >= min_ratio:
            best_score, best_i = score, i
    # Tier 4: SequenceMatcher — character-level similarity on joined phrase strings.
    # Catches systematic phonetic substitutions that token-set overlap misses.
    # Uses a fixed threshold higher than min_ratio to avoid false positives.
    target_str = " ".join(target)
    for extra in range(0, 3):
        win_sm = len(target) + extra
        if win_sm < 2:
            continue
        for i in range(start_idx, len(words) - win_sm + 1):
            window_str = " ".join(_norm(words[i + k]["word"]) for k in range(win_sm))
            score = SequenceMatcher(None, target_str, window_str).ratio()
            if score > best_score and score >= FUZZY_MATCH_SEQ_RATIO:
                best_score, best_i = score, i
    return best_i


print(f"[6/10] Locating scene boundaries...")
scene_start_word_idx: list[int] = []
search_from = 0

# Proportional-position sanity gate (bug Class 21). A WRONG-but-exact prefix
# match (a later scene reusing the opening's words verbatim) used to bypass
# every fallback. Any boundary match — exact or fuzzy — whose timestamp
# deviates from the proportionally-scaled script position by more than this
# window is rejected, letting the next pass / scaled fallback take over.
_script_total_sec = 0.0
for _s in scenes_raw:
    if _s.window_to_sec and float(_s.window_to_sec) > _script_total_sec:
        _script_total_sec = float(_s.window_to_sec)
    if _s.window_from_sec and float(_s.window_from_sec) > _script_total_sec:
        _script_total_sec = float(_s.window_from_sec)
BOUNDARY_MAX_DEV_SEC = max(30.0, 0.15 * total_sec)

for sc in scenes_raw:
    # Clean narration before tokenizing for boundary detection:
    # Single normalization helper handles <pause Xs> markers, decimals, hyphens.
    # Same rules as audio_anchor matching — guarantees consistent behavior.
    # Class 21: also try the CONTRACTED variant ("here is"→"here's") — Whisper
    # contracts spoken copulas; _norm strips the apostrophe so tokens align.
    opening_words = normalize_for_match(sc.narration).strip().split()[:SCENE_BOUNDARY_WORDS]
    _alt_words = normalize_for_match(_contraction_variant(sc.narration)).strip().split()[:SCENE_BOUNDARY_WORDS]
    variants = [opening_words] + ([_alt_words] if _alt_words != opening_words else [])
    if _script_total_sec > 0:
        _expected_t = (float(sc.window_from_sec) / _script_total_sec) * total_sec
    else:
        _expected_t = float(sc.window_from_sec)
    def _sane(idx: int) -> bool:
        return 0 <= idx < len(all_words) and abs(all_words[idx]["start"] - _expected_t) <= BOUNDARY_MAX_DEV_SEC
    found = -1
    # Pass 1: exact match, decreasing prefix length SCENE_BOUNDARY_WORDS → 2 words,
    # over BOTH opening variants — earliest hit wins at each span length.
    _max_span = max(len(v) for v in variants)
    for span in range(_max_span, 1, -1):
        cands = []
        for v in variants:
            if len(v) >= span:
                idx = find_phrase(all_words, " ".join(v[:span]), search_from)
                if idx >= 0:
                    cands.append(idx)
        if cands:
            found = min(cands); break
    if found >= 0 and not _sane(found):
        print(f"      scene {sc.number}: REJECTED exact match at t={all_words[found]['start']:.1f}s "
              f"(expected ~{_expected_t:.1f}s ± {BOUNDARY_MAX_DEV_SEC:.0f}s — likely a later scene's words); trying fuzzy")
        found = -1
    # Pass 2: fuzzy match (handles digit/word mismatches like "twenty twenty-six" vs "2026")
    if found < 0:
        fz = []
        for v in variants:
            idx = find_phrase_fuzzy(all_words, " ".join(v), search_from, min_ratio=SCENE_BOUNDARY_MIN_RATIO)
            if idx >= 0 and _sane(idx):
                fz.append(idx)
        if fz:
            found = min(fz)
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
    atomic_write_text(captions_path, json.dumps(scene_words, ensure_ascii=False))

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

    # ─── FUNDAMENTAL DESIGN ───
    # framesFrom is driven 100% by where the anchor word actually lands in the
    # rendered TTS audio (Whisper-detected). The source script's time_from_sec
    # / window_from_sec are ADVISORY ONLY — they describe the script author's
    # intent but the rendered audio runs at a different rate, so using them
    # for positioning desyncs visual from narration. Pre-2026-05 version of
    # this code fell back to script time-windows when an anchor was missed,
    # then a uniform-spacing tail clamp pulled bullets BACKWARD before their
    # anchor word. That produced 1-1.5s visual-ahead-of-narration drift in
    # back-loaded scenes (proven on difference_txt scene 1, 2026-05-06).
    #
    # New algorithm:
    #   Step A: resolve audio_anchor → frame for every bullet that has one.
    #           If anchor missed, mark None; we'll interpolate.
    #   Step B: interpolate missed anchors from neighbors.
    #   Step C: enforce monotonic order + MIN_BLOCK_FRAMES gap (later bullet
    #           pushed FORWARD if anchor lands too close to prev).
    #   Step D: clamp ONLY the LAST bullet's framesFrom so it leaves
    #           MIN_BLOCK_FRAMES of display before scene end. Earlier bullets
    #           keep their anchor positions intact.
    # Use round() not int() — int() truncates and accumulates drift.

    # Step A — anchor lookup
    # _anchor_search_from enforces monotonic ordering: bullet N's anchor is
    # searched only in words AFTER bullet N-1's match. This eliminates the
    # first-occurrence ambiguity — if the same phrase appears multiple times
    # in the narration (e.g. "Different jobs" at t=7.1s and t=30.5s), the
    # pipeline always finds the CORRECT later occurrence instead of the first.
    raw_anchors: list[int | None] = []
    anchor_hit_flags: list[bool] = []
    _anchor_search_from: int = 0
    _n_bullets = len(visual_blocks)
    _scene_word_count = len(scene_words)
    for _bi, vb in enumerate(visual_blocks):
        f: int | None = None
        if vb.audio_anchor and vb.audio_anchor.strip():
            idx = find_phrase_fuzzy(scene_words, vb.audio_anchor, start_idx=_anchor_search_from)
            if idx >= 0:
                # Drift-plausibility guard (rule 10 Class N+12): tiers 3-4 of the
                # fuzzy matcher scan the WHOLE rest of the scene by similarity only,
                # so a loose match can land far from where this bullet belongs and
                # produce a confident-but-wrong framesFrom (documented +3s drift).
                # An EXACT match is trustworthy and never rejected. A fuzzy match is
                # rejected (→ treated as a miss, filled by neighbor interpolation,
                # which is more reliable than a bad match) only when its word index
                # is implausibly far past where this bullet should sit.
                is_exact = (find_phrase(scene_words, vb.audio_anchor, _anchor_search_from) == idx)
                plausible = True
                if not is_exact and _n_bullets > 1 and _scene_word_count > 0:
                    # Expected position: bullets spread across the scene's words.
                    # Allow a generous band (±50% of the scene span) so only
                    # egregious outliers are rejected — never the normal case.
                    expected_idx = (_bi / _n_bullets) * _scene_word_count
                    band = 0.5 * _scene_word_count
                    if idx > expected_idx + band:
                        plausible = False
                        print(f"      [scene {sc.number}] bullet {_bi+1}: rejected fuzzy anchor "
                              f"{vb.audio_anchor!r} at word {idx} (expected ~{expected_idx:.0f}, "
                              f"+{idx-expected_idx:.0f} past band) — interpolating instead "
                              f"(rule 10 Class N+12)")
                if plausible:
                    # Sync-to-meaning: framesFrom depends on the bullet's anchor_mode
                    # and the anchor word's start/end (rule: appear/through/land).
                    mode = (getattr(vb, "anchor_mode", "appear") or "appear").lower()
                    _target = _compress_written_numbers(
                        [_norm(t) for t in normalize_for_match(vb.audio_anchor).split() if _norm(t)])
                    _last = min(idx + max(1, len(_target)) - 1, len(scene_words) - 1)
                    _start_f = round(scene_words[idx]["start"] * FPS)
                    _end_f = round(scene_words[_last].get("end", scene_words[_last]["start"]) * FPS)
                    if mode == "land":
                        f = max(0, _end_f - SYNC_ENTRANCE_FRAMES)
                    elif mode == "through":
                        f = _start_f
                    else:  # appear (default) — small visual lead
                        f = max(0, _start_f - SYNC_LEAD_FRAMES)
                    _anchor_search_from = idx + 1
        raw_anchors.append(f)
        anchor_hit_flags.append(f is not None)

    # Step B — interpolate missed anchors from neighbors. If an anchor is
    # missing AND has a neighbor on each side that hit, place it midway.
    # Edge cases: leading misses → 0; trailing misses → uniform spacing
    # between last hit and scene end. NO source-script time_from_sec ever.
    def _interpolate(arr: list[int | None]) -> list[int]:
        n_local = len(arr)
        out: list[int] = [0] * n_local
        # leading run of None
        first_hit = next((i for i, v in enumerate(arr) if v is not None), None)
        if first_hit is None:
            # zero hits at all — pure uniform fallback (rare; warn loudly)
            print(f"      [scene {sc.number}] WARN — zero audio_anchor hits, using uniform spacing")
            for i in range(n_local):
                out[i] = round(i * (duration_frames - 1) / max(1, n_local))
            return out
        for i in range(first_hit + 1):
            out[i] = arr[first_hit] if i == first_hit else round(i * arr[first_hit] / max(1, first_hit))
        # interior + trailing
        last_hit = first_hit
        for i in range(first_hit + 1, n_local):
            if arr[i] is not None:
                # fill interior gap (last_hit, i) by linear interp
                gap = i - last_hit
                if gap > 1:
                    for k in range(1, gap):
                        out[last_hit + k] = round(arr[last_hit] + (arr[i] - arr[last_hit]) * k / gap)
                out[i] = arr[i]
                last_hit = i
        # trailing miss(es) after last hit
        if last_hit < n_local - 1:
            tail_anchor = arr[last_hit]
            tail_count = n_local - last_hit
            tail_gap = max(MIN_BLOCK_FRAMES, (duration_frames - tail_anchor) // max(1, tail_count))
            for i in range(last_hit + 1, n_local):
                out[i] = min(duration_frames - 1, tail_anchor + (i - last_hit) * tail_gap)
        return out

    interpolated = _interpolate(raw_anchors)
    # First block always starts at 0 (no black opening).
    interpolated[0] = 0
    # Clamp every value into [0, duration-1]
    interpolated = [max(0, min(f, duration_frames - 1)) for f in interpolated]

    # Step C — monotonic + min spacing (forward push only)
    frames_from: list[int] = [interpolated[0]]
    for j in range(1, n):
        min_start = frames_from[j - 1] + MIN_BLOCK_FRAMES
        frames_from.append(max(interpolated[j], min_start))

    # Step D — LAST-bullet-only clamp. The previous loop applied a uniform
    # `max_start = duration - MIN*(n-j)` to every bullet, which pulled later
    # anchors BACKWARDS away from their spoken-word frame. The only correct
    # constraint is: the last bullet must leave MIN frames of display.
    if n > 0:
        last_max_start = duration_frames - MIN_BLOCK_FRAMES
        if frames_from[-1] > last_max_start:
            # Clamp last bullet, but never earlier than the prior bullet + 1.
            floor = frames_from[-2] + 1 if n > 1 else 0
            frames_from[-1] = max(floor, last_max_start)

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
            "anchor_mode": getattr(vb, "anchor_mode", "appear"),
            "source_headline": vb.source_headline,
        }
        # Surface placeholder flag in scene JSON so validate_output.py can flag
        # the scene as fidelity-degraded. Without this, a placeholder block was
        # indistinguishable from a real LLM-emitted block in scene JSON, and
        # the fidelity gate ("count of bullets == count of blocks") passed
        # silently while the actual visuals were placeholder cards.
        if getattr(vb, "placeholder", False):
            block["placeholder"] = True
            block["placeholder_error"] = getattr(vb, "placeholder_error", "")
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
        if is_anchor:
            print(f"        [anchor] {framesFrom}-{framesTo}f  {head}")
        else:
            print(f"        [interp] {framesFrom}-{framesTo}f  {head}  (anchor missed; linear-interpolated from neighbors)")

    # SCENE-DRIVEN: prepend the scene's STAGE block when one is seeded — the persistent
    # world component rendered on scene-local frames (UniversalScene renders role:'stage'
    # OUTSIDE bullet Sequences, so mechanism cycles never reset at beat boundaries).
    # Scenes without a seeded stage render exactly as before (back-compat).
    from storyboard.visual_designer import lookup_stage as _lookup_stage
    _stage_code = _lookup_stage(sc, design_tokens)
    if _stage_code:
        blocks_out.insert(0, {
            "framesFrom": 0,
            "framesTo": duration_frames,
            "code": _stage_code,
            "audio_anchor": "",
            "anchor_mode": "appear",
            "source_headline": "[STAGE]",
            "role": "stage",
        })
        print(f"        [stage ] 0-{duration_frames}f  persistent world (scene-driven)")

    blocks_json = json.dumps(blocks_out, ensure_ascii=False, indent=2)
    # Canonical: project-owned scene JSON. The project folder is the source of truth.
    blocks_path = PROJECT_SCENES_DIR / f"{sid}.json"
    if not blocks_path.exists() or blocks_path.read_text(encoding="utf-8") != blocks_json:
        atomic_write_text(blocks_path, blocks_json)

    scene_timings.append({"id": sid, "durationFrames": duration_frames})
    print(f"      {sid}: {duration_frames}f ({duration_sec:.1f}s), {len(blocks_out)} blocks")


total_blocks = anchor_hits + anchor_misses
if total_blocks > 0:
    pct = 100 * anchor_hits / total_blocks
    print(f"      audio_anchor coverage: {anchor_hits}/{total_blocks} ({pct:.0f}%)")
    if pct < 70:
        print(f"      WARNING: low anchor coverage ({pct:.0f}%) — visuals may drift from narration.")
        print(f"               Improve anchor phrases in source.txt, then delete storyboard/.cache/designs/")
    # --strict-anchors gate: hard-fail the build if coverage is below the
    # configured threshold. Lets CI/CD reject low-quality builds before
    # render burns Chromium time.
    if args.strict_anchors and pct < args.strict_anchor_min_pct:
        print(f"      STRICT-ANCHORS: coverage {pct:.0f}% < threshold "
              f"{args.strict_anchor_min_pct}% — aborting build.")
        print(f"               Tighten the structured script (rules 08, 15, 19) and re-run.")
        sys.exit(3)   # distinct exit code 3 = quality gate failure


# ─── 7.5 SYNC project-owned scenes/ + captions/ → remotion/public/{scenes,captions}/ ───
# All per-scene data lives canonically under projects/<name>/{scenes,captions}/.
# Remotion's bundler can only read from remotion/public/, so we mirror the
# active project's data there each build. Stale files from OTHER projects are
# purged to prevent cross-project leakage in the bundle.
print(f"[7.5] Syncing project scenes/ + captions/ to bundler-readable paths...")
import shutil as _shutil
active_files = {f"{sid}.json" for sid in scene_ids}


def _sync_dir(canonical: Path, mirror: Path, kind: str) -> None:
    # 1) Purge ALL mirror entries that aren't part of the active project's
    #    expected scene IDs. The mirror is build-time scratch — anything not
    #    in active_files is stale (from a prior build of this or another project)
    #    and must go, otherwise webpack ships unrelated scenes in the bundle.
    for stale in mirror.glob("*.json"):
        if stale.name not in active_files:
            stale.unlink()
    # Also clean up any orphaned .inprogress staging files from a prior crash.
    for orphan in mirror.glob("*.inprogress"):
        orphan.unlink()
    # 2) Atomic-copy canonical → mirror for each active scene (when content differs)
    for sid in scene_ids:
        src = canonical / f"{sid}.json"
        dst = mirror / f"{sid}.json"
        if not src.exists():
            print(f"      ERROR: {src.relative_to(ROOT)} missing — {kind} step did not write it"); sys.exit(1)
        if not dst.exists() or dst.read_text(encoding="utf-8") != src.read_text(encoding="utf-8"):
            atomic_copy(src, dst)
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
atomic_write_text(TIMELINES_TS, _timelines_ts_content)
print(f"      wrote {len(scene_timings)} entries (replaced any prior project's entries)")

atomic_write_text(TIMING_JSON, json.dumps({
    "project":          PROJECT,
    "fps":              FPS,                  # downstream tools (visual_qa, validate_output) read this
    "total_sec":        total_sec,
    "total_frames":     total_frames,
    "audio_filename":   FULL_AUDIO_NAME,
    "output_filename":  OUTPUT_NAME,
    "scene_ids":        scene_ids,
    "scene_timings":    scene_timings,
}, indent=2))
print(f"      wrote {TIMING_JSON.name}")


# ─── 8.5 PRE-RENDER PIPELINE VALIDATION ───
# Catches scene/caption JSON missing, timelines.ts gaps, ID format issues,
# config_tokens drift — all the orchestration concerns the Remotion framework
# does not check itself. Fails in 1s instead of after a 30s+ webpack bundle.
if validate_pipeline(scene_ids, project_dir=PROJECT_DIR) != 0:
    print("ERROR: pipeline validation failed. Fix errors above before rendering.")
    sys.exit(1)


# ─── 8.6 PRE-RENDER LAYOUT VALIDATION ───
# For each bullet, run the Node bounds extractor at sample frames, gather
# every absolute-positioned element's (x, y, w, h), and check:
#   - OUT_OF_BOUNDS: element exceeds 1920x1080 canvas (with 80px slack for
#     animation entrance and ignoring transformed/low-opacity elements)
#   - CROSS_BULLET_OVERLAP: under additive layering, two elements from
#     different bullets occupy the same canvas region simultaneously
# Surfaces layout collisions BEFORE the 25-min render, so author can fix them
# in seconds. --strict-layout makes it a hard error; --skip-layout disables.
if not args.skip_layout:
    try:
        from storyboard.layout_validator import validate_project as _layout_validate
        print(f"[8.6] Layout validator (project={PROJECT})...")
        layout_violations = _layout_validate(PROJECT)
        if layout_violations:
            kinds: dict[str, int] = {}
            for v in layout_violations:
                kinds[v["type"]] = kinds.get(v["type"], 0) + 1
            print(f"      {len(layout_violations)} layout violation(s):")
            for t, n in sorted(kinds.items()):
                print(f"        {t}: {n}")
            for v in layout_violations[:8]:
                print(f"          • {v.get('msg', v)}")
            if len(layout_violations) > 8:
                print(f"          … {len(layout_violations) - 8} more "
                      f"(run `python -m storyboard.layout_validator {PROJECT}` for full report)")
            if args.strict_layout:
                print("ERROR: --strict-layout: aborting render.")
                sys.exit(1)
            else:
                print("      WARNING: not strict, continuing render despite violations.")
        else:
            print("      OK — no layout collisions.")
    except Exception as _layout_err:
        # Don't block builds if Node isn't installed or extractor crashes.
        print(f"      WARNING: layout validator failed: {_layout_err}. Continuing.")
else:
    print(f"[8.6] Layout validator skipped (--skip-layout)")


# ─── 9. (NATIVE) NO per-scene render — the LIVE master composes the scene components ───
# There is no per-scene mp4 render and no stitch: render_master.mjs (step 10) composes the
# live scene components in ONE render. (The cheap per-scene catch is Visual Proof, the
# agent's pre-render gate — CLAUDE.md step 6b.)
print(f"[9/10] Native flow — no per-scene render; the LIVE master composes {len(scene_ids)} scene components in ONE render (step 10).")
REMOTION_DIR = ROOT / "remotion"

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


# ─── master-render process management (Class N+13: render hangs forever) ───
# The master render is the ONE long step (~minutes/scene). A bare subprocess.run with
# no timeout blocks the session FOREVER if node/Chromium deadlocks; and on Windows,
# killing only the node parent leaves orphan chrome-headless-shell children rendering.
def _kill_render_tree(proc) -> None:
    """Windows tree-kill: taskkill /F /T takes node AND its Chromium children."""
    try:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                       capture_output=True, creationflags=_NOWIN)
    except Exception:
        pass


def _log_tail(log_path: Path, n: int = 2000) -> str:
    try:
        return log_path.read_text(encoding="utf-8", errors="replace")[-n:]
    except Exception:
        return "(no render log)"


def _run_master_render(cmd: list, env: dict, n_scenes: int, label: str) -> tuple[int, Path]:
    """Run render_master.mjs with a bounded ceiling + tree-kill. Returns (returncode, log_path).
    Ceiling = render_timeout_per_scene_s (config [render] section, or env
    RENDER_TIMEOUT_PER_SCENE_S) × scene count — configurable, never a bare wait."""
    per_scene = float(os.environ.get(
        "RENDER_TIMEOUT_PER_SCENE_S",
        (config.get("render", {}) or {}).get("render_timeout_per_scene_s", 600),
    ))
    ceiling = max(600.0, per_scene * max(1, n_scenes))
    log_path = OUT_DIR / f"render_master_{label}.log"
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(log_path, "w", encoding="utf-8", errors="replace") as lf:
        proc = subprocess.Popen(
            cmd, cwd=str(REMOTION_DIR), env=env,
            stdout=lf, stderr=subprocess.STDOUT, text=True,
            creationflags=_NOWIN | subprocess.CREATE_NEW_PROCESS_GROUP,
        )
        try:
            rc = proc.wait(timeout=ceiling)
        except subprocess.TimeoutExpired:
            print(f"RENDER STUCK — no exit after {ceiling:.0f}s ({label}); killing render tree")
            _kill_render_tree(proc)
            sys.exit(124)
        except KeyboardInterrupt:
            print(f"KeyboardInterrupt — killing render tree ({label})")
            _kill_render_tree(proc)
            sys.exit(130)
    return rc, log_path


# Single-scene preview (--scene N) renders that ONE scene via the live master + MASTER_SCENES (step 10).
target_scene_ids = scene_ids
if args.scene is not None:
    if args.scene < 1 or args.scene > len(scene_ids):
        print(f"ERROR: --scene {args.scene} out of range (1..{len(scene_ids)})"); sys.exit(1)
    target_scene_ids = [scene_ids[args.scene - 1]]
    print(f"      --scene {args.scene} → single-scene preview of {target_scene_ids[0]} (live master, MASTER_SCENES)")

# ─── 10. FINAL ASSEMBLY (Remotion master composition) ───
# Single-scene mode: render scene N + corresponding audio in ONE Remotion render
# via the master composition with MASTER_SCENES filter. Same architecture as full
# render — never produce silent per-scene mp4 + leave audio off.
if args.scene is not None:
    sid = target_scene_ids[0]
    # Remotion's renderMedia validates the extension (must be .mp4/.mkv/.mov),
    # so the in-progress filename has to keep .mp4 — we use a `.tmp.mp4` suffix
    # instead of `.mp4.inprogress`.
    preview_inprogress = OUT_DIR / f"{sid}-preview.tmp.mp4"
    preview_final = OUT_DIR / f"{sid}-preview.mp4"
    if preview_inprogress.exists():
        preview_inprogress.unlink()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sscene_full_audio = AUDIO_DIR / config["audio"]["full_audio_filename"]
    print(f"\n[single-scene final assembly] master composition with MASTER_SCENES={sid}")
    rc, rlog = _run_master_render(
        ["node", "render_master.mjs", str(preview_inprogress.resolve())],
        env={
            **os.environ,
            "PROJECT": PROJECT,
            "MASTER_AUDIO_FILE": sscene_full_audio.name,
            "VIDEO_FPS": str(FPS),
            "VIDEO_WIDTH": str(config["video"]["width"]),
            "VIDEO_HEIGHT": str(config["video"]["height"]),
            "MASTER_SCENES": sid,
            "PYTHONIOENCODING": "utf-8",
        },
        n_scenes=1, label=f"preview_{sid}",
    )
    if rc != 0:
        print("SINGLE-SCENE MASTER RENDER FAILED:")
        print(_log_tail(rlog))
        preview_inprogress.unlink(missing_ok=True)
        sys.exit(1)
    if not _mp4_is_healthy(preview_inprogress):
        print(f"SINGLE-SCENE PREVIEW CORRUPT — aborting")
        preview_inprogress.unlink(missing_ok=True)
        sys.exit(1)
    os.replace(preview_inprogress, preview_final)
    sz = preview_final.stat().st_size // 1024 // 1024
    print(f"\n-- SINGLE-SCENE PREVIEW: {preview_final}  ({sz} MB)")
    sys.exit(0)

print(f"[10/10] Final assembly — ONE live master render (render_master.mjs)...")

# Use filter_complex concat (not -f concat demuxer) for tighter A/V sync.
# Demuxer concat copies stream timestamps, which can drift if any source mp4
# has minor PTS irregularities. filter_complex re-times the stream from frame 0.
# Each scene mp4 is silent (-an); audio is the separately-generated TTS mp3.
# Removed -shortest: total video duration is now computed to equal total audio
# duration exactly (see Step 7 cumulative-frame fix), so neither input needs
# to be truncated. Letting both run to completion preserves the full narration.
final_out = OUT_DIR / OUTPUT_NAME

# stitch.mode controls between-scene visual transition.
#   hard_cut         — ffmpeg concat (default). Visual timeline == audio timeline.
#   crossfade        — chain ffmpeg xfade transitions. NOTE: chained xfade in
#                      ffmpeg has a known timeline-drift bug (rule 09 Layer 4).
#                      Prefer remotion_master for smooth crossfade.
#   remotion_master  — render the master Remotion composition that chains per-scene
#                      mp4s via a plain <Series> (zero overlap) + master <Audio>.
#                      Frame-accurate sync by construction. NO ffmpeg stitch step.
# DEFAULT (and only supported path) is remotion_master — the native one-render live master.
# Any other value errors out below (the legacy per-scene render + ffmpeg stitch was removed).
_stitch_mode = str(_stitch_cfg.get("mode", "remotion_master")).lower()

# ─── 10·pre. SOUND-DESIGN MIX (vg-sound-design) ───
# Mix a side-chain-DUCKED music bed + the sfx_emitter cues onto the narration, then
# feed the result to the master render. OFF by default: with no music file AND
# audio.sfx:false, the mixer no-ops and the plain (loudnormed) narration is used.
# Missing sound files are skipped; any failure falls back to narration — never breaks a build.
MASTER_AUDIO_NAME = FULL_AUDIO_NAME
if MUSIC_PATH or SFX_ENABLED:
    try:
        if SFX_ENABLED:
            emit_for_project(PROJECT, FPS)        # (re)write projects/<name>/sfx/<sid>_cues.json
        _music = None
        if MUSIC_PATH:
            _mp = Path(MUSIC_PATH)
            if not _mp.is_absolute():
                _cand = PROJECT_DIR / MUSIC_PATH
                _mp = _cand if _cand.exists() else (ROOT / MUSIC_PATH)
            _music = _mp if _mp.exists() else None
            if _music is None:
                print(f"      [audio_mixer] WARN music not found: {MUSIC_PATH} — skipping bed")
        _sfx_dir = Path(SFX_DIR_CFG) if SFX_DIR_CFG else (PROJECT_DIR / "assets" / "sfx")
        _mixed = mix_audio_layer(
            full_audio, AUDIO_DIR / ("mix-" + FULL_AUDIO_NAME),
            project_dir=PROJECT_DIR, scene_timings=scene_timings, fps=FPS,
            music=_music, music_gain_db=MUSIC_GAIN_DB,
            sfx_enabled=SFX_ENABLED, sfx_dir=_sfx_dir,
        )
        MASTER_AUDIO_NAME = _mixed.name
    except Exception as _e:  # noqa: BLE001 — the audio layer must never break a build
        print(f"      [audio_mixer] WARN sound-design mix skipped ({_e!r}) — using narration")
        MASTER_AUDIO_NAME = FULL_AUDIO_NAME


# ─── 10a. REMOTION MASTER STITCH ───
# Single Remotion render of the master composition produces audio + visuals
# in one shot. Replaces the entire ffmpeg concat / xfade / mux pipeline.
if _stitch_mode == "remotion_master":
    print(f"      stitch.mode=remotion_master — single Remotion render of master composition")
    # Remotion's renderMedia validates the extension (must be .mp4/.mkv/.mov),
    # so we use `.tmp.mp4` instead of `.mp4.inprogress` for the staging file.
    final_inprogress = final_out.with_name(final_out.stem + ".tmp.mp4")
    if final_inprogress.exists():
        final_inprogress.unlink()
    rc, rlog = _run_master_render(
        ["node", "render_master.mjs", str(final_inprogress.resolve())],
        env={
            **os.environ,
            "PROJECT": PROJECT,
            "MASTER_AUDIO_FILE": MASTER_AUDIO_NAME,   # narration, or the sound-design mix
            "VIDEO_FPS": str(FPS),
            "VIDEO_WIDTH": str(config["video"]["width"]),
            "VIDEO_HEIGHT": str(config["video"]["height"]),
            # NOTE: no MASTER_TRANSITION_FRAMES — the master uses a plain <Series>
            # (no crossfade); the only scene fade is the per-scene Backdrop (design.fade_frames).
            "PYTHONIOENCODING": "utf-8",
        },
        n_scenes=len(target_scene_ids), label="final",
    )
    if rc != 0:
        print("REMOTION MASTER STITCH FAILED:")
        print(_log_tail(rlog))
        final_inprogress.unlink(missing_ok=True)
        sys.exit(1)
    if not _mp4_is_healthy(final_inprogress):
        print(f"REMOTION MASTER STITCH PRODUCED CORRUPT mp4 — aborting")
        final_inprogress.unlink(missing_ok=True)
        sys.exit(1)
    os.replace(final_inprogress, final_out)
    print(f"      ✓ master mp4: {final_out.name}")
    sz = final_out.stat().st_size // 1024 // 1024
    print(f"\n-- DONE: {final_out}  ({sz} MB, {total_sec:.1f}s)")
else:
    print(f"ERROR: stitch.mode={_stitch_mode!r} — the legacy per-scene render + ffmpeg-stitch path "
          f"was REMOVED. Use stitch.mode=remotion_master (the native one live-master render).")
    sys.exit(1)


# ─── 10.6 PRODUCTION SIDECAR ARTIFACTS ───
# Emit YouTube-grade extras alongside the final mp4. All optional; failures
# log and continue (the main mp4 is already on disk).
def _ffprobe_streams(mp4: Path) -> dict | None:
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-print_format", "json",
             "-show_format", "-show_streams", str(mp4)],
            capture_output=True, text=True, timeout=30,
            creationflags=_NOWIN,
        )
        if r.returncode == 0:
            return json.loads(r.stdout)
    except Exception:
        return None
    return None


# 1. ffprobe report — codec/duration/bitrate/resolution sanity print
_probe = _ffprobe_streams(final_out)
if _probe and _probe.get("streams"):
    v = next((s for s in _probe["streams"] if s.get("codec_type") == "video"), {})
    a = next((s for s in _probe["streams"] if s.get("codec_type") == "audio"), {})
    fmt = _probe.get("format", {})
    fmt_dur = float(fmt.get("duration", 0) or 0)
    print(f"[probe]  video : {v.get('codec_name')} {v.get('width')}x{v.get('height')} "
          f"@ {v.get('r_frame_rate', '?')} fps")
    print(f"[probe]  audio : {a.get('codec_name')} {a.get('sample_rate')}Hz "
          f"{a.get('channels')}ch")
    print(f"[probe]  size  : {fmt.get('size')} bytes  duration: {fmt_dur:.2f}s  "
          f"bitrate: {fmt.get('bit_rate')} bps")

    # 2. A/V length-equality gate — Step 7's cumulative-frame math should make
    #    sum(scene durations) == total audio frames. If they drift here, the
    #    final mp4 either has silent video tail or clipped audio tail. Warn.
    expected_dur = total_sec
    if expected_dur > 0 and abs(fmt_dur - expected_dur) > 0.5:
        print(f"[probe]  WARNING: final duration {fmt_dur:.2f}s drifted "
              f"{fmt_dur - expected_dur:+.2f}s from expected {expected_dur:.2f}s — "
              f"check Step 7 cumulative-frame math or audio mux for truncation.")

# 3. Subtitle export (.srt) — concatenate all caption JSONs into one .srt.
def _format_srt_time(t: float) -> str:
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t - 60 * (m + 60 * h)
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

try:
    srt_lines: list[str] = []
    counter = 1
    scene_offsets: list[float] = []   # absolute start time of each scene
    cumulative = 0.0
    for st in scene_timings:
        scene_offsets.append(cumulative)
        cumulative += st["durationFrames"] / FPS
    for sid, offset in zip(scene_ids, scene_offsets):
        cap = PROJECT_CAPTIONS_DIR / f"{sid}.json"
        if not cap.exists():
            continue
        words = json.loads(cap.read_text(encoding="utf-8"))
        # Group words into ~5-7 word phrases for readable subtitles
        chunk: list[dict] = []
        for w in words:
            chunk.append(w)
            if len(chunk) >= 7 or w["word"].endswith((".", "?", "!")):
                start = chunk[0]["start"] + offset
                end = chunk[-1]["end"] + offset
                text = " ".join(c["word"].strip() for c in chunk).strip()
                if text:
                    srt_lines += [
                        str(counter),
                        f"{_format_srt_time(start)} --> {_format_srt_time(end)}",
                        text,
                        "",
                    ]
                    counter += 1
                chunk = []
        if chunk:
            start = chunk[0]["start"] + offset
            end = chunk[-1]["end"] + offset
            text = " ".join(c["word"].strip() for c in chunk).strip()
            if text:
                srt_lines += [
                    str(counter),
                    f"{_format_srt_time(start)} --> {_format_srt_time(end)}",
                    text,
                    "",
                ]
                counter += 1
    if srt_lines:
        srt_path = final_out.with_suffix(".srt")
        atomic_write_text(srt_path, "\n".join(srt_lines))
        print(f"[srt]    wrote {srt_path.name} ({counter - 1} cues)")
except Exception as _e:
    print(f"[srt]    skipped: {_e}")

# 4. Chapter markers — write timestamps.txt suitable for YouTube description
try:
    chapter_lines = []
    for sc, offset in zip(scenes_raw, scene_offsets):
        mm = int(offset // 60)
        ss = int(offset % 60)
        chapter_lines.append(f"{mm:02d}:{ss:02d} {sc.title}")
    chapters_path = final_out.with_name(final_out.stem + ".chapters.txt")
    atomic_write_text(chapters_path, "\n".join(chapter_lines) + "\n")
    print(f"[chap]   wrote {chapters_path.name} ({len(chapter_lines)} chapters)")
except Exception as _e:
    print(f"[chap]   skipped: {_e}")

# 5. Preview thumbnail — first interesting frame (3s in, after fade-in)
try:
    thumb_path = final_out.with_name(final_out.stem + "_thumbnail.jpg")
    thumb_inprogress = thumb_path.with_suffix(thumb_path.suffix + ".inprogress")
    r = subprocess.run(
        ["ffmpeg", "-y", "-i", str(final_out), "-ss", "3",
         "-vframes", "1", "-q:v", "2", str(thumb_inprogress)],
        capture_output=True, text=True, timeout=30,
        creationflags=_NOWIN,
    )
    if r.returncode == 0 and thumb_inprogress.exists():
        os.replace(thumb_inprogress, thumb_path)
        print(f"[thumb]  wrote {thumb_path.name}")
    else:
        thumb_inprogress.unlink(missing_ok=True)
except Exception as _e:
    print(f"[thumb]  skipped: {_e}")

# ─── 10.5 OUTPUT VALIDATION (script ↔ final video) ───
# Verifies narration words actually got spoken (Whisper transcript match) AND
# every animation bullet's midpoint frame is visible (non-black) in the render.
# Issues are reported but do not fail the build — final mp4 is already produced.
print()
validate_output(PROJECT_DIR, extract_frames=False)

# ─── 10.7 PRODUCTION TIME (how long the pipeline took to make the video) ───
# Wall-clock time for the whole run (TTS + Whisper + align + render + stitch + QA),
# NOT the video's playback length. Saved so you can track production cost per project
# and per output minute. In single-scene mode the numbers cover only that scene.
_build_elapsed_s = time.time() - _BUILD_START_T
try:
    _ratio = _build_elapsed_s / total_sec if total_sec else 0.0   # build seconds per output second
except NameError:
    _ratio = 0.0
_h, _rem = divmod(int(_build_elapsed_s), 3600)
_m, _s = divmod(_rem, 60)
_hms = (f"{_h}:{_m:02d}:{_s:02d}" if _h else f"{_m}:{_s:02d}")
print(f"\n-- PRODUCTION TIME: {_hms} ({_build_elapsed_s:.0f}s) to produce "
      f"{total_sec:.0f}s of video  →  {_ratio:.1f}x realtime")
atomic_write_text(PROJECT_DIR / "production_time.json", json.dumps({
    "project":              PROJECT,
    "build_started":        _BUILD_START_ISO,
    "build_seconds":        round(_build_elapsed_s, 1),
    "build_hms":            _hms,
    "video_seconds":        round(total_sec, 1),
    "build_per_video_ratio": round(_ratio, 2),
    "single_scene":         args.scene is not None,
}, indent=2))
