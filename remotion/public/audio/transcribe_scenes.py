"""Transcribe per-scene audio to get actual word timestamps for sync."""
from faster_whisper import WhisperModel
import json

AUDIO_DIR = "c:/Girish/Fundamental_Projects/video_generation/video_explainer/projects/goose_vs_claude/audio"

# Key phrases that mark sub-animation boundaries within each scene
SCENE_MARKERS = {
    "s02": {
        "file": f"{AUDIO_DIR}/vo-s02.mp3",
        "total_frames": 2484,
        "markers": [
            ("MythosReveal", "called Claude Mythos"),
            ("ZeroDayCounter", "thousands of zero-day"),
            ("TimelineBugs", "twenty-seven-year-old bug"),
            ("GlasswingOrbit", "Anthropic did something"),
            ("Opus47Entrance", "But yesterday"),
        ],
    },
    "s03": {
        "file": f"{AUDIO_DIR}/vo-s03.mp3",
        "total_frames": 2723,
        "markers": [
            ("SWE-bench Verified", "SWE-bench Verified"),
            ("SWE-bench Pro", "SWE-bench Pro"),
            ("CursorBench", "CursorBench"),
            ("Vision", "Vision got"),
            ("BrowseComp", "BrowseComp dropped"),
            ("MCP-Atlas", "Tool use"),
        ],
    },
    "s04": {
        "file": f"{AUDIO_DIR}/vo-s04.mp3",
        "total_frames": 1773,
        "markers": [
            ("EffortDial", "xhigh effort"),
            ("TaskBudget", "task budgets"),
            ("Ultrareview", "ultrareview command"),
        ],
    },
    "s05": {
        "file": f"{AUDIO_DIR}/vo-s05.mp3",
        "total_frames": 3065,
        "markers": [
            ("DiffReduced", "differentially reduce"),
            ("ExploitPipeline", "FreeBSD source code"),
            ("ExploitChain", "four browser vulnerabilities"),
            ("SandboxEscape", "escaped its sandbox"),
            ("CyberGymGap", "seventy-three point one"),
        ],
    },
}

print("Loading Whisper model (base)...")
model = WhisperModel("base", compute_type="int8")

for scene_name, scene_data in SCENE_MARKERS.items():
    print(f"\n{'='*70}")
    print(f"SCENE: {scene_name} ({scene_data['total_frames']} frames)")
    print(f"{'='*70}")

    segments, info = model.transcribe(scene_data["file"], word_timestamps=True)

    # Collect all words with timestamps
    all_words = []
    for segment in segments:
        if segment.words:
            for word in segment.words:
                all_words.append({
                    "word": word.word.strip(),
                    "start": word.start,
                    "end": word.end,
                })

    print(f"  Total words: {len(all_words)}")
    print(f"  Audio duration: {info.duration:.1f}s")

    # Find each marker phrase
    full_text = " ".join(w["word"].lower() for w in all_words)

    found_times = {}
    for sub_name, marker_phrase in scene_data["markers"]:
        marker_lower = marker_phrase.lower()
        marker_words = marker_lower.split()

        found = False
        for i in range(len(all_words) - len(marker_words) + 1):
            match = True
            for j, mw in enumerate(marker_words):
                aw = all_words[i + j]["word"].lower().strip(".,!?;:'\"")
                if mw not in aw and aw not in mw:
                    match = False
                    break
            if match:
                start_sec = all_words[i]["start"]
                start_frame = int(start_sec * 30)
                print(f"  {sub_name:20s} → {start_sec:7.1f}s (frame {start_frame:5d}) — \"{marker_phrase}\"")
                found_times[sub_name] = start_frame
                found = True
                break

        if not found:
            # Try fuzzy: just find first marker word
            for i, w in enumerate(all_words):
                if marker_words[0] in w["word"].lower():
                    start_sec = w["start"]
                    start_frame = int(start_sec * 30)
                    print(f"  {sub_name:20s} → {start_sec:7.1f}s (frame {start_frame:5d}) — (fuzzy: \"{w['word']}\")")
                    found_times[sub_name] = start_frame
                    break
            else:
                print(f"  {sub_name:20s} → *** NOT FOUND ***")

    # Print recommended Sequence values
    print(f"\n  RECOMMENDED <Sequence> values for {scene_name}:")
    keys = list(found_times.keys())
    for i, key in enumerate(keys):
        start = found_times[key]
        # Duration extends to next marker or end
        if i < len(keys) - 1:
            dur = found_times[keys[i + 1]] - start
        else:
            dur = scene_data["total_frames"] - start
        print(f"    <Sequence from={{{start}}} durationInFrames={{{dur}}}>  /* {key} */")
