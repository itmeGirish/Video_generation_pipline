"""Transcribe all scenes and print comprehensive sync data."""
from faster_whisper import WhisperModel
import os, sys
sys.stdout.reconfigure(encoding="utf-8")

AUDIO_DIR = "c:/Girish/Fundamental_Projects/video_generation/video_explainer/projects/goose_vs_claude/audio"
model = WhisperModel("base", compute_type="int8")

scenes = ["s02", "s03", "s04", "s05", "s06", "s07", "s09"]

for scene in scenes:
    print(f"\n{'='*70}\n{scene.upper()}\n{'='*70}")
    segments, info = model.transcribe(f"{AUDIO_DIR}/vo-{scene}.mp3", word_timestamps=True)
    all_words = []
    for seg in segments:
        if seg.words:
            for w in seg.words:
                all_words.append({"word": w.word.strip(), "start": w.start, "end": w.end})
    # Print all words
    for w in all_words:
        print(f"  {w['start']:6.1f}s (f{int(w['start']*30):5d}) {w['word']}")
