"""Find missing markers and get all word timestamps for s03 and s05."""
from faster_whisper import WhisperModel
import os
os.environ["PYTHONIOENCODING"] = "utf-8"

AUDIO_DIR = "c:/Girish/Fundamental_Projects/video_generation/video_explainer/projects/goose_vs_claude/audio"
model = WhisperModel("base", compute_type="int8")

# S03 - find all benchmark transitions
print("=" * 70)
print("S03 - Full word timeline")
print("=" * 70)
segments, info = model.transcribe(f"{AUDIO_DIR}/vo-s03.mp3", word_timestamps=True)
all_words = []
for seg in segments:
    if seg.words:
        for w in seg.words:
            all_words.append({"word": w.word.strip(), "start": w.start, "end": w.end})

# Print key words with timestamps
keywords = ["numbers", "swe", "pro", "cursor", "vision", "tool", "mcp", "efficiency", "browse", "agents"]
for w in all_words:
    if any(kw in w["word"].lower() for kw in keywords):
        print(f"  {w['start']:6.1f}s (f{int(w['start']*30):5d}) - {w['word']}")

# S05 - find CyberGym
print("\n" + "=" * 70)
print("S05 - looking for CyberGym/nerfed/scores")
print("=" * 70)
segments, info = model.transcribe(f"{AUDIO_DIR}/vo-s05.mp3", word_timestamps=True)
all_words = []
for seg in segments:
    if seg.words:
        for w in seg.words:
            all_words.append({"word": w.word.strip(), "start": w.start, "end": w.end})

keywords = ["nerfed", "scores", "seventy", "cyber", "gym", "gap", "escaped", "sandbox", "carlini", "internet"]
for w in all_words:
    if any(kw in w["word"].lower() for kw in keywords):
        print(f"  {w['start']:6.1f}s (f{int(w['start']*30):5d}) - {w['word']}")
