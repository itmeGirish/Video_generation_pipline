"""
Forced alignment of KNOWN narration text → word-level {word, start, end} timestamps.

Why: we already know the exact narration (we wrote it), so aligning the known text
to the audio is far more accurate than ASR word-timestamps. On clean TTS audio this
yields ~20-50 ms word boundaries vs ~100-300 ms from faster-whisper `base`.

Engine: torchaudio's CTC forced alignment (`torchaudio.pipelines.MMS_FA`) — pip-only,
offline, no Kaldi/conda. (MFA is marginally more accurate but heavy to install; for
clean TTS, MMS_FA is the practical best — see research notes in the skill.)

Returns the SAME shape build_video already consumes from Whisper:
    [{"word": str, "start": float, "end": float}, ...]

This module is OPT-IN (config `whisper.aligner: torchaudio`) and any failure here is
caught by the caller, which falls back to faster-whisper. So a bug or a missing
dependency degrades to the current behavior — it never breaks the build.

NOTE: untested end-to-end until torchaudio is installed and a build is run; the design
follows the official torchaudio CTC forced-alignment tutorial.
"""
from __future__ import annotations

import re


def _load_audio_16k_mono(path: str, target_sr: int = 16000):
    """Decode any audio (mp3/wav) → 16 kHz mono float32 torch tensor [1, T].
    Uses ffmpeg (already a pipeline dependency) + stdlib `wave`, so we avoid
    torchaudio.load's torchcodec backend dependency entirely."""
    import os
    import subprocess
    import tempfile
    import wave

    import numpy as np
    import torch

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
        tmp = tf.name
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", path, "-ac", "1", "-ar", str(target_sr),
             "-c:a", "pcm_s16le", "-f", "wav", tmp],
            check=True, capture_output=True,
        )
        with wave.open(tmp, "rb") as w:
            sw = w.getsampwidth()
            raw = w.readframes(w.getnframes())
        data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        return torch.from_numpy(data).unsqueeze(0), target_sr
    finally:
        try:
            os.unlink(tmp)
        except OSError:
            pass


_DIGIT_WORDS = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
                "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine"}


def _normalize_words(text: str) -> list[str]:
    """Lowercase, drop markup, and reduce to the MMS_FA tokenizer's alphabet
    (a-z + apostrophe). Narration spells numbers as words (pipeline rule), so
    digits are rare — but we map any stray digit to its word so the tokenizer
    never KeyErrors, then strip everything else."""
    text = re.sub(r"<[^>]+>", " ", text)              # strip <pause ...> markers
    text = text.lower()
    text = re.sub(r"\d", lambda m: f" {_DIGIT_WORDS[m.group()]} ", text)  # 4 → four
    text = re.sub(r"[^a-z'\s]", " ", text)            # keep only a-z + apostrophe
    return [w for w in text.split() if w]


def align(audio_path: str, transcript_text: str) -> list[dict]:
    """Force-align `transcript_text` to `audio_path`. Returns word dicts with
    start/end in seconds. Raises on any failure (caller handles fallback)."""
    import torch
    import torchaudio

    words = _normalize_words(transcript_text)
    if not words:
        raise ValueError("forced_align: empty transcript after normalization")

    bundle = torchaudio.pipelines.MMS_FA
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = bundle.get_model(with_star=False).to(device)
    tokenizer = bundle.get_tokenizer()
    aligner = bundle.get_aligner()

    # Decode via ffmpeg → 16 kHz mono (MMS_FA sample rate); avoids torchcodec.
    waveform, sample_rate = _load_audio_16k_mono(audio_path, bundle.sample_rate)

    with torch.inference_mode():
        emission, _ = model(waveform.to(device))
        token_spans = aligner(emission[0], tokenizer(words))

    num_frames = emission.size(1)
    ratio = waveform.size(1) / num_frames          # audio samples per emission frame

    out: list[dict] = []
    for word, spans in zip(words, token_spans):
        start = (spans[0].start * ratio) / sample_rate
        end = (spans[-1].end * ratio) / sample_rate
        out.append({"word": word, "start": round(float(start), 3), "end": round(float(end), 3)})
    return out
