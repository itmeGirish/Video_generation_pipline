"""
Storyboard compiler: scene.yaml → timeline.json

Pipeline:
  1. Load YAML
  2. Generate audio via Edge TTS (cached by content hash)
  3. Transcribe with Whisper (cached by audio hash)
  4. Resolve each anchor to an exact word index (normalized matching, must be unique)
  5. Compile phases to absolute frame numbers
  6. Validate: ordering, coverage, min duration
  7. Emit timeline.json

FAILS LOUD on any unresolved anchor, ambiguous match, or invalid phase graph.
No silent fallbacks.
"""
import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

import edge_tts
import yaml
from faster_whisper import WhisperModel

# ─── CONFIG ───
FPS = 30
VOICE = "en-US-AndrewMultilingualNeural"  # pipeline-pinned voice
RATE = "+5%"
PITCH = "-2Hz"
MIN_PHASE_DURATION_FRAMES = 30  # 1 second — anything shorter is suspicious
# Default enter/exit envelope: 12 frames (400ms) crossfade at every phase boundary.
# Can be overridden per-phase in YAML via `enter:` and `exit:`.
DEFAULT_ENVELOPE_FRAMES = 12

ROOT = Path("c:/Girish/Fundamental_Projects/video_generation/video_explainer")
SCENES_DIR = ROOT / "storyboard" / "scenes"
TIMELINES_DIR = ROOT / "storyboard" / "timelines"
AUDIO_DIR = ROOT / "projects" / os.environ.get("PROJECT", "harness_3") / "audio"
CACHE_DIR = ROOT / "storyboard" / ".cache"

for d in [TIMELINES_DIR, CACHE_DIR, AUDIO_DIR]:
    d.mkdir(parents=True, exist_ok=True)


class CompileError(Exception):
    """Loud failure. No silent fallbacks allowed."""
    pass


# ─── NORMALIZATION ───
DIGIT_WORDS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
    "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
    "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen",
    "14": "fourteen", "15": "fifteen", "16": "sixteen", "17": "seventeen",
    "18": "eighteen", "19": "nineteen", "20": "twenty", "30": "thirty",
    "40": "forty", "50": "fifty", "60": "sixty", "70": "seventy",
    "80": "eighty", "90": "ninety", "100": "hundred",
}
WORD_DIGITS = {v: k for k, v in DIGIT_WORDS.items()}


def normalize_token(s: str) -> str:
    """Lowercase, strip punctuation, normalize digits↔words."""
    s = s.lower().strip()
    s = re.sub(r"[.,!?;:\"'\-_]", "", s)
    s = s.strip()
    # Convert standalone digit tokens to words for matching
    if s in DIGIT_WORDS:
        return DIGIT_WORDS[s]
    return s


def normalize_phrase(phrase: str) -> list[str]:
    return [normalize_token(w) for w in phrase.split() if normalize_token(w)]


# ─── MATCHING ───
def find_anchor_positions(words: list[dict], phrase: str) -> list[int]:
    """Return list of starting word indices where phrase matches."""
    phrase_tokens = normalize_phrase(phrase)
    if not phrase_tokens:
        raise CompileError(f"Empty phrase: '{phrase}'")

    matches = []
    n = len(words)
    plen = len(phrase_tokens)
    for i in range(n - plen + 1):
        match = True
        for j, pt in enumerate(phrase_tokens):
            wt = normalize_token(words[i + j]["word"])
            # Strict: equality OR one of the digit/word pairs
            if wt == pt:
                continue
            # Bidirectional digit check
            if wt in DIGIT_WORDS and DIGIT_WORDS[wt] == pt:
                continue
            if pt in DIGIT_WORDS and DIGIT_WORDS[pt] == wt:
                continue
            match = False
            break
        if match:
            matches.append(i)
    return matches


# ─── TTS + WHISPER (cached) ───
async def generate_audio(text: str, output_path: Path) -> float:
    """Return duration in seconds."""
    if not output_path.exists():
        communicate = edge_tts.Communicate(text.strip(), VOICE, rate=RATE, pitch=PITCH)
        await communicate.save(str(output_path))
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(output_path)],
        capture_output=True, text=True,
    )
    return float(r.stdout.strip())


def transcribe_audio(audio_path: Path) -> list[dict]:
    """Returns [{word, start, end}, ...]. Cached by audio file hash."""
    # Hash audio file for cache
    h = hashlib.sha256(audio_path.read_bytes()).hexdigest()[:16]
    cache_file = CACHE_DIR / f"transcript-{h}.json"
    if cache_file.exists():
        return json.loads(cache_file.read_text(encoding="utf-8"))

    model = WhisperModel("base", compute_type="int8")
    segments, _ = model.transcribe(str(audio_path), word_timestamps=True)
    words = []
    for seg in segments:
        if seg.words:
            for w in seg.words:
                words.append({
                    "word": w.word.strip(),
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                })
    cache_file.write_text(json.dumps(words, indent=2), encoding="utf-8")
    return words


# ─── COMPILE ───
async def compile_scene(yaml_path: Path) -> dict:
    scene = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
    scene_id = scene["id"]
    print(f"\n[{scene_id}] Compiling from {yaml_path.name}")

    # 1. Generate audio
    audio_path = AUDIO_DIR / scene["audio_file"]
    duration = await generate_audio(scene["narration"], audio_path)
    frames = int(duration * FPS)
    print(f"  audio: {duration:.2f}s ({frames} frames)")

    # 2. Transcribe
    words = transcribe_audio(audio_path)
    print(f"  transcript: {len(words)} words")

    # 3. Resolve anchors — EVERY anchor must resolve to exactly one position.
    #    Supports `alt: [...]` list of fallback phrases for TTS/Whisper drift.
    anchor_frames = {}
    anchor_errors = []
    for aname, aconfig in scene.get("anchors", {}).items():
        # Build phrase candidate list: primary + any alts
        candidates = [aconfig["phrase"]] + list(aconfig.get("alt") or [])
        occurrence = aconfig.get("occurrence", 0)

        # Try each candidate; pick the first that matches
        chosen_phrase = None
        chosen_positions = []
        for phrase in candidates:
            positions = find_anchor_positions(words, phrase)
            if positions:
                chosen_phrase = phrase
                chosen_positions = positions
                break

        if not chosen_positions:
            tried = " / ".join(f'"{c}"' for c in candidates)
            transcript_head = " ".join(w["word"] for w in words[:40])
            anchor_errors.append(
                f"  [{scene_id}] anchor '{aname}': none of {tried} found in transcript.\n"
                f"     Transcript head: {transcript_head}..."
            )
            continue
        if len(chosen_positions) > 1 and "occurrence" not in aconfig:
            anchor_errors.append(
                f"  [{scene_id}] anchor '{aname}': phrase \"{chosen_phrase}\" matches "
                f"{len(chosen_positions)} times at word positions {chosen_positions}. "
                f"Must specify 'occurrence: N' (0-indexed)."
            )
            continue
        if occurrence >= len(chosen_positions):
            anchor_errors.append(
                f"  [{scene_id}] anchor '{aname}': occurrence={occurrence} but only "
                f"{len(chosen_positions)} match(es)."
            )
            continue

        word_idx = chosen_positions[occurrence]
        word_time = words[word_idx]["start"]
        frame = int(word_time * FPS)
        anchor_frames[aname] = frame
        tag = f' (alt: "{chosen_phrase}")' if chosen_phrase != aconfig["phrase"] else ""
        print(f"  anchor {aname:25s} → frame {frame:5d} ({word_time:6.2f}s) [word #{word_idx}]{tag}")

    if anchor_errors:
        raise CompileError("\n\nANCHOR RESOLUTION FAILED:\n" + "\n".join(anchor_errors))

    # 4. Compile phases — resolve from/to
    def resolve_ref(ref, is_end=False):
        if ref == "start":
            return 0
        if ref == "end":
            return frames
        if isinstance(ref, str) and ref.startswith("@"):
            name = ref[1:]
            if name not in anchor_frames:
                raise CompileError(f"  [{scene_id}] unknown anchor @{name}")
            return anchor_frames[name]
        if isinstance(ref, (int, float)):
            return int(ref * FPS) if ref < 1000 else int(ref)  # seconds vs frames
        raise CompileError(f"  [{scene_id}] bad phase ref: {ref}")

    def parse_envelope(val):
        """enter/exit can be an int (frames), a float (seconds), or None (default)."""
        if val is None:
            return DEFAULT_ENVELOPE_FRAMES
        if isinstance(val, (int, float)):
            return int(val * FPS) if val < 30 else int(val)  # small=sec, large=frames
        raise CompileError(f"bad enter/exit value: {val!r}")

    VALID_TRANSITIONS = {"crossfade", "hard_cut", "blackout"}
    phases = []
    for p in scene.get("phases", []):
        t_in = p.get("transition_in", "crossfade")
        if t_in not in VALID_TRANSITIONS:
            raise CompileError(
                f"  [{scene_id}/{p['id']}] transition_in='{t_in}' not in {VALID_TRANSITIONS}"
            )
        phases.append({
            "id": p["id"],
            "fromFrame": resolve_ref(p["from"]),
            "toFrame": resolve_ref(p["to"], is_end=True),
            "enterFrames": parse_envelope(p.get("enter")),
            "exitFrames": parse_envelope(p.get("exit")),
            "transitionIn": t_in,
        })

    # 5. Validate
    errors = []
    # 5a. each phase well-formed
    for ph in phases:
        if ph["toFrame"] <= ph["fromFrame"]:
            errors.append(f"  [{scene_id}/{ph['id']}] toFrame ({ph['toFrame']}) <= fromFrame ({ph['fromFrame']})")
        elif ph["toFrame"] - ph["fromFrame"] < MIN_PHASE_DURATION_FRAMES:
            errors.append(
                f"  [{scene_id}/{ph['id']}] duration {ph['toFrame'] - ph['fromFrame']} frames "
                f"< min {MIN_PHASE_DURATION_FRAMES}"
            )
    # 5b. contiguous coverage
    if phases:
        if phases[0]["fromFrame"] != 0:
            errors.append(f"  [{scene_id}] first phase must start at frame 0, got {phases[0]['fromFrame']}")
        for a, b in zip(phases, phases[1:]):
            if a["toFrame"] != b["fromFrame"]:
                errors.append(
                    f"  [{scene_id}] gap/overlap between '{a['id']}' (ends {a['toFrame']}) "
                    f"and '{b['id']}' (starts {b['fromFrame']})"
                )
        if phases[-1]["toFrame"] != frames:
            errors.append(f"  [{scene_id}] last phase must end at {frames}, got {phases[-1]['toFrame']}")

    if errors:
        raise CompileError("\n\nPHASE VALIDATION FAILED:\n" + "\n".join(errors))

    # 6. Emit
    timeline = {
        "id": scene_id,
        "durationFrames": frames,
        "durationSeconds": round(duration, 3),
        "fps": FPS,
        "audioFile": scene["audio_file"],
        "anchors": anchor_frames,
        "phases": phases,
    }
    out_path = TIMELINES_DIR / f"{scene_id}.json"
    out_path.write_text(json.dumps(timeline, indent=2), encoding="utf-8")
    print(f"  ✓ wrote {out_path.name}")
    for ph in phases:
        print(f"      {ph['id']:25s} frames {ph['fromFrame']:5d} → {ph['toFrame']:5d}  "
              f"({(ph['toFrame'] - ph['fromFrame']) / FPS:5.1f}s)")
    return timeline


def emit_typescript_module(timelines: list[dict], source_hashes: dict[str, str]):
    """Generate a TS file the renderer can import.
    Emits STALENESS_SOURCE_HASHES so the runtime can verify YAML hasn't changed
    since last compile. Also emits literal union types for phase/anchor IDs
    so typos in TSX become compile errors.
    """
    out = ROOT / "remotion" / "src" / "storyboard" / "timelines.ts"
    lines = [
        "// ═══════════════════════════════════════════════════════════════",
        "// AUTO-GENERATED by storyboard/compile.py",
        "// DO NOT EDIT. Re-run the compiler to refresh.",
        "// ═══════════════════════════════════════════════════════════════",
        "",
        "export type PhaseTransition = 'crossfade' | 'hard_cut' | 'blackout';",
        "export interface Phase {",
        "  id: string;",
        "  fromFrame: number;",
        "  toFrame: number;",
        "  /** Crossfade-in length in frames (overlaps with previous phase's exit). */",
        "  enterFrames: number;",
        "  /** Crossfade-out length in frames (overlaps with next phase's enter). */",
        "  exitFrames: number;",
        "  /** How this phase enters from its predecessor:",
        "   *  - crossfade (default): overlapping opacity envelope",
        "   *  - hard_cut: instant swap at boundary (clean slate for hero moments)",
        "   *  - blackout: prev fades to black, then next fades in (breath beat)",
        "   */",
        "  transitionIn: PhaseTransition;",
        "}",
        "export interface Timeline {",
        "  id: string;",
        "  durationFrames: number;",
        "  durationSeconds: number;",
        "  fps: number;",
        "  audioFile: string;",
        "  anchors: Record<string, number>;",
        "  phases: Phase[];",
        "}",
        "",
        "export const TIMELINES: Record<string, Timeline> = {",
    ]
    for t in timelines:
        lines.append(f"  {t['id']}: " + json.dumps(t, indent=2).replace("\n", "\n  ") + ",")
    lines.append("};")
    lines.append("")

    # Emit LITERAL UNION TYPES: typos in <Phase id="..."> become TS compile errors
    for t in timelines:
        sid = t["id"]
        phase_ids = " | ".join(f'"{p["id"]}"' for p in t["phases"])
        anchor_ids = " | ".join(f'"{a}"' for a in t["anchors"]) or '"_never_"'
        lines.append(f'export type {sid.capitalize()}PhaseId = {phase_ids};')
        lines.append(f'export type {sid.capitalize()}AnchorId = {anchor_ids};')
    lines.append("")

    # STALENESS GUARD: runtime can check these hashes against live YAML
    lines.append("// Hashes of source YAML files at compile time.")
    lines.append("// If YAML changes without recompile, the runtime will detect + refuse.")
    lines.append("export const SOURCE_HASHES: Record<string, string> = " +
                 json.dumps(source_hashes, indent=2).replace("\n", "\n") + ";")
    lines.append("")

    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n✓ wrote {out}")


def emit_build_manifest(timelines: list[dict], source_hashes: dict[str, str]):
    """Provenance: what inputs produced this build? Used for reproducibility."""
    import platform
    manifest = {
        "schema_version": 1,
        "compiler_version": "0.1.0",
        "tts_voice": VOICE,
        "tts_rate": RATE,
        "tts_pitch": PITCH,
        "whisper_model": "base",
        "fps": FPS,
        "min_phase_frames": MIN_PHASE_DURATION_FRAMES,
        "python": platform.python_version(),
        "built_at_utc": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "source_hashes": source_hashes,
        "scenes": [
            {
                "id": t["id"],
                "durationFrames": t["durationFrames"],
                "phaseCount": len(t["phases"]),
                "anchorCount": len(t["anchors"]),
            }
            for t in timelines
        ],
    }
    out = ROOT / "storyboard" / "timelines" / "manifest.json"
    out.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"✓ wrote {out.name}")


async def main():
    # Accept scene IDs or compile everything
    if len(sys.argv) > 1:
        scene_files = [SCENES_DIR / f"{name}.yaml" for name in sys.argv[1:]]
    else:
        scene_files = sorted(SCENES_DIR.glob("*.yaml"))

    timelines = []
    source_hashes = {}
    for f in scene_files:
        if not f.exists():
            raise CompileError(f"Scene file not found: {f}")
        source_hashes[f.stem] = hashlib.sha256(f.read_bytes()).hexdigest()[:16]
        timelines.append(await compile_scene(f))

    emit_typescript_module(timelines, source_hashes)
    emit_build_manifest(timelines, source_hashes)
    print(f"\nAll {len(timelines)} scene(s) compiled successfully.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except CompileError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
