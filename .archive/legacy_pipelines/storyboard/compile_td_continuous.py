"""
Continuous-narration compiler for td scenes.

Architecture (Option A — fixes 'narrator restarts each scene'):
1. Concatenate all 10 scene narrations into ONE text.
2. Generate ONE TTS audio file (vo-trading-full.mp3) so the narrator's prosody
   is naturally continuous — no per-scene start/end intonation resets.
3. Whisper-transcribe the full audio once → unified word timestamps.
4. For each scene, find where its narration STARTS in the global transcript.
   That word's timestamp = scene start time.
5. Each scene's duration = (next scene start) - (this scene start).
   Last scene runs to end of audio.
6. Emit per-scene timings (duration, anchor frames, phase boundaries) keyed to
   the scene's local timeline (relative to scene start, so existing TSX works).
7. Slice global transcript per scene → per-scene caption JSONs (times relative
   to scene start, so VideoCaptions component works unchanged).
8. PATCH timelines.ts — replace td entries only, leave hf/rh untouched.

After this:
- Each td scene composition renders SILENT (audio removed from TdScenePreview).
- Final video = concat of silent scene mp4s + the continuous audio overlaid.
- Result: zero per-scene intonation seams. Narrator never restarts.
"""
import os
import asyncio
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts
import yaml
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
SCENES = [f"td{i:02d}" for i in range(1, 11)]
SCENES_DIR = ROOT / "storyboard" / "scenes"
AUDIO_DIR = ROOT / "projects" / os.environ.get("PROJECT", "harness_3") / "audio"
TIMELINES_DIR = ROOT / "storyboard" / "timelines"
CAPTIONS_DIR = ROOT / "remotion" / "public" / "captions"
CACHE_DIR = ROOT / "storyboard" / ".cache"
TS_OUT = ROOT / "remotion" / "src" / "storyboard" / "timelines.ts"
TIMING_OUT = ROOT / "storyboard" / "td_timing.json"
FULL_AUDIO_NAME = "vo-trading-full.mp3"
FPS = 30
VOICE = "en-US-AndrewMultilingualNeural"  # pipeline-pinned voice
RATE = "+0%"
PITCH = "+0Hz"

for d in [TIMELINES_DIR, CAPTIONS_DIR, CACHE_DIR, AUDIO_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# ─── helpers ───
def normalize(w: str) -> str:
    return re.sub(r"[^\w]", "", w.lower())


DIGIT_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "twenty": "20", "thirty": "30",
}


def word_match(transcript_word: str, target_word: str) -> bool:
    a, b = normalize(transcript_word), normalize(target_word)
    if a == b:
        return True
    if a in DIGIT_WORDS and DIGIT_WORDS[a] == b:
        return True
    if b in DIGIT_WORDS and DIGIT_WORDS[b] == a:
        return True
    return False


def find_phrase(words: list, phrase: str, start_idx: int = 0) -> int:
    """Return word index where phrase begins, or -1."""
    target = phrase.split()
    n_target = len(target)
    if n_target == 0:
        return -1
    for i in range(start_idx, len(words) - n_target + 1):
        if all(word_match(words[i + k]["word"], target[k]) for k in range(n_target)):
            return i
    return -1


# ─── 1. Load all yamls ───
print("Loading scene yamls...")
scene_configs = []
for s in SCENES:
    y = yaml.safe_load((SCENES_DIR / f"{s}.yaml").read_text(encoding="utf-8"))
    scene_configs.append(y)
print(f"  {len(scene_configs)} scenes loaded")


# ─── 2. Build continuous narration ───
# Single newline join — Edge TTS treats this as a sentence break with a SHORT
# pause (~0.3s) instead of double-newline's 1.0s paragraph pause.
# Result: continuous prosody AND tight scene boundaries.
full_text = "\n".join(s["narration"].strip() for s in scene_configs)
print(f"Full narration: {len(full_text)} chars, {len(full_text.split())} words")


# ─── 3. Generate continuous TTS (cached by content hash) ───
text_hash = hashlib.sha256(full_text.encode()).hexdigest()[:16]
hash_marker = AUDIO_DIR / f".vo-trading-full.{text_hash}.hash"
full_audio = AUDIO_DIR / FULL_AUDIO_NAME


async def generate_tts():
    if full_audio.exists() and hash_marker.exists():
        print(f"  using cached audio (hash {text_hash})")
        return
    print(f"  generating TTS (hash {text_hash})...")
    c = edge_tts.Communicate(full_text, VOICE, rate=RATE, pitch=PITCH)
    await c.save(str(full_audio))
    # Mark cache
    for old in AUDIO_DIR.glob(".vo-trading-full.*.hash"):
        old.unlink()
    hash_marker.write_text("", encoding="utf-8")


asyncio.run(generate_tts())

probe = subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration",
     "-of", "default=nw=1:nk=1", str(full_audio)],
    capture_output=True, text=True,
)
total_sec = float(probe.stdout.strip())
total_frames = int(total_sec * FPS)
print(f"  audio: {total_sec:.2f}s ({total_frames} frames)")


# ─── 4. Whisper-transcribe (cached by audio hash) ───
audio_hash = hashlib.sha256(full_audio.read_bytes()).hexdigest()[:16]
cache = CACHE_DIR / f"transcript-{audio_hash}.json"
if cache.exists():
    print(f"  using cached transcript ({audio_hash})")
    all_words = json.loads(cache.read_text(encoding="utf-8"))
else:
    print(f"  transcribing (Whisper, hash {audio_hash})...")
    model = WhisperModel("base", compute_type="int8")
    segs, _ = model.transcribe(str(full_audio), word_timestamps=True)
    all_words = []
    for seg in segs:
        if seg.words:
            for w in seg.words:
                all_words.append({
                    "word": w.word.strip(),
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                })
    cache.write_text(json.dumps(all_words, indent=2), encoding="utf-8")
print(f"  transcript: {len(all_words)} words")


# ─── 5. Find each scene's start in the global transcript ───
# Use the first 4-6 words of the scene's narration as a unique fingerprint.
# (Anchors might appear non-uniquely across scenes; opening phrases are scene-bound.)
print("\nLocating scene boundaries in global transcript...")
scene_start_word_idx = []
search_from = 0
for i, sc in enumerate(scene_configs):
    opening = sc["narration"].strip().split()[:6]
    found = -1
    # Try widest opening first, narrow down
    for span in range(len(opening), 1, -1):
        idx = find_phrase(all_words, " ".join(opening[:span]), search_from)
        if idx >= 0:
            found = idx
            break
    if found < 0:
        # Fallback: try first anchor
        anchors = sc.get("anchors", {})
        if anchors:
            first_anchor = next(iter(anchors.values()))
            for cand in [first_anchor["phrase"]] + list(first_anchor.get("alt") or []):
                idx = find_phrase(all_words, cand, search_from)
                if idx >= 0:
                    found = idx
                    break
    if found < 0:
        print(f"  ERROR: cannot locate {sc['id']} in transcript")
        sys.exit(1)
    scene_start_word_idx.append(found)
    print(f"  {sc['id']}: starts at word #{found} (t={all_words[found]['start']:.2f}s)")
    search_from = found + 1


# ─── 6. Compute per-scene boundaries + emit timings ───
print("\nComputing per-scene timings...")
scene_data = []
for i, sc in enumerate(scene_configs):
    word_idx = scene_start_word_idx[i]
    start_sec = all_words[word_idx]["start"]
    if i + 1 < len(scene_configs):
        end_sec = all_words[scene_start_word_idx[i + 1]]["start"]
    else:
        end_sec = total_sec
    start_frame = int(start_sec * FPS)
    end_frame = int(end_sec * FPS)
    duration_frames = end_frame - start_frame

    # Words for THIS scene (relative timestamps)
    next_idx = scene_start_word_idx[i + 1] if i + 1 < len(scene_configs) else len(all_words)
    scene_words = []
    for w in all_words[word_idx:next_idx]:
        scene_words.append({
            "word": w["word"],
            "start": round(w["start"] - start_sec, 3),
            "end": round(w["end"] - start_sec, 3),
        })

    # Save per-scene captions (relative times)
    (CAPTIONS_DIR / f"{sc['id']}.json").write_text(
        json.dumps(scene_words, ensure_ascii=False), encoding="utf-8"
    )

    # Resolve anchors within this scene's word slice
    anchor_frames = {}
    for aname, aconfig in sc.get("anchors", {}).items():
        candidates = [aconfig["phrase"]] + list(aconfig.get("alt") or [])
        for cand in candidates:
            idx = find_phrase(scene_words, cand)
            if idx >= 0:
                anchor_frames[aname] = int(scene_words[idx]["start"] * FPS)
                break

    def resolve_ref(ref, dur=duration_frames):
        if ref == "start":
            return 0
        if ref == "end":
            return dur
        if isinstance(ref, str) and ref.startswith("@"):
            return anchor_frames.get(ref[1:], 0)
        return int(ref)

    phases = []
    for p in sc.get("phases", []):
        phases.append({
            "id": p["id"],
            "fromFrame": resolve_ref(p["from"]),
            "toFrame": resolve_ref(p["to"]),
            "enterFrames": 12,
            "exitFrames": 12,
            # Default to "hard_cut" — professional editor standard.
            # Continuous audio carries continuity across boundaries; ANY visual
            # transition (slide/fade/blackout) draws the eye to the cut.
            # Hard cut + continuous narration = invisible cut (documentary style).
            "transitionIn": p.get("transition_in", "hard_cut"),
        })

    scene_data.append({
        "id": sc["id"],
        "global_start_sec": start_sec,
        "global_end_sec": end_sec,
        "global_start_frame": start_frame,
        "global_end_frame": end_frame,
        "durationFrames": duration_frames,
        "durationSeconds": round(end_sec - start_sec, 3),
        "fps": FPS,
        "audioFile": FULL_AUDIO_NAME,
        "anchors": anchor_frames,
        "phases": phases,
    })
    print(f"  {sc['id']}: {duration_frames}f ({duration_frames/FPS:.1f}s) "
          f"global [{start_frame}→{end_frame}]")

# Save global timing manifest
TIMING_OUT.write_text(json.dumps({
    "total_sec": total_sec,
    "total_frames": total_frames,
    "audioFile": FULL_AUDIO_NAME,
    "scenes": scene_data,
}, indent=2), encoding="utf-8")


# ─── 7. PATCH timelines.ts: replace td entries only ───
print(f"\nPatching {TS_OUT.name}...")
existing = TS_OUT.read_text(encoding="utf-8")


def strip_scene_block(text: str, scene_id: str) -> str:
    """Remove a top-level scene entry (name: {...}) by brace-counting.
    Handles arbitrary nesting since regex with nested braces is unreliable.
    """
    lines = text.split("\n")
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Match a scene entry start at indent 2 (inside TIMELINES object)
        if line.lstrip().startswith(f"{scene_id}:") and line.lstrip().rstrip().endswith("{"):
            # Brace-count until matching close
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                depth += lines[j].count("{") - lines[j].count("}")
                j += 1
            # Skip the trailing comma if present on the closing line
            # j now points to the line AFTER the closing }, or past end
            # If the closing line ended with "}," trim that comma — but easier to
            # let the close brace stay; we'll add a comma later if needed.
            # Just skip i..j-1 entirely
            i = j
            # Also drop any blank line that immediately follows
            if i < len(lines) and lines[i].strip() == "":
                i += 1
            continue
        out.append(line)
        i += 1
    return "\n".join(out)


for s in SCENES:
    existing = strip_scene_block(existing, s)

# Build new td block string
def emit_phase(p):
    return ("      {\n"
            f'        "id": "{p["id"]}",\n'
            f'        "fromFrame": {p["fromFrame"]},\n'
            f'        "toFrame": {p["toFrame"]},\n'
            f'        "enterFrames": {p["enterFrames"]},\n'
            f'        "exitFrames": {p["exitFrames"]},\n'
            f'        "transitionIn": "{p["transitionIn"]}"\n'
            "      }")


def emit_scene(sd):
    anchors_str = ",\n".join(f'      "{k}": {v}' for k, v in sd["anchors"].items())
    phases_str = ",\n".join(emit_phase(p) for p in sd["phases"])
    return (f'  {sd["id"]}: {{\n'
            f'    "id": "{sd["id"]}",\n'
            f'    "durationFrames": {sd["durationFrames"]},\n'
            f'    "durationSeconds": {sd["durationSeconds"]},\n'
            f'    "fps": {sd["fps"]},\n'
            f'    "audioFile": "{sd["audioFile"]}",\n'
            f'    "anchors": {{\n{anchors_str}\n    }},\n'
            f'    "phases": [\n{phases_str}\n    ]\n'
            f'  }}')


td_block = ",\n".join(emit_scene(sd) for sd in scene_data)

# Insert td block before the closing "};" of TIMELINES specifically.
# The file has TIMELINES + (later) STALENESS_SOURCE_HASHES, both end with "};",
# so we must locate the TIMELINES open and brace-count to its close.
timelines_open = existing.find("export const TIMELINES")
if timelines_open == -1:
    print("ERROR: cannot find 'export const TIMELINES'")
    sys.exit(1)
brace_open_pos = existing.find("{", timelines_open)
if brace_open_pos == -1:
    print("ERROR: cannot find TIMELINES opening brace")
    sys.exit(1)
depth = 1
i = brace_open_pos + 1
while i < len(existing) and depth > 0:
    if existing[i] == "{":
        depth += 1
    elif existing[i] == "}":
        depth -= 1
    i += 1
if depth != 0:
    print("ERROR: unbalanced braces in TIMELINES object")
    sys.exit(1)
closing_idx = i - 1  # position of the closing '}' of TIMELINES

# Find the last comma before closing — make sure we add comma if needed
before = existing[:closing_idx].rstrip()
if not before.endswith(","):
    before = before + ","
patched = before + "\n" + td_block + "\n" + existing[closing_idx:]
# Sanity check: ensure td blocks are now inside TIMELINES (before STALENESS_SOURCE_HASHES)
staleness_idx = patched.find("STALENESS_SOURCE_HASHES")
first_td_idx = patched.find("\n  td01: {")
if staleness_idx > -1 and first_td_idx > staleness_idx:
    print("ERROR: td blocks ended up AFTER STALENESS_SOURCE_HASHES — patcher logic broken")
    sys.exit(1)
TS_OUT.write_text(patched, encoding="utf-8")
print(f"  emitted {len(scene_data)} td entries into timelines.ts")

print("\nDONE.")
print(f"  Audio: {full_audio}")
print(f"  Timing: {TIMING_OUT}")
print(f"  Captions: {CAPTIONS_DIR}/td*.json")
