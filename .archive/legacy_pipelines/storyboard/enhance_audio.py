"""
Audio enhancement pipeline for rh scenes:
1. Slow VO by 13% for better pacing (atempo=0.87)
2. Inject 2s silence at rh05 pattern break (between "Memory" and "With just those three")
3. Generate low ambient music drone per scene, mix under VO at -22dB
4. Write enhanced audio back to projects/$PROJECT/audio/vo-rhNN.mp3

Preserves original VO files as vo-rhNN.orig.mp3 on first run.
"""
import os
import hashlib
import json
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "projects" / os.environ.get("PROJECT", "harness_3") / "audio"
CACHE_DIR = ROOT / "storyboard" / ".cache"
TMP_DIR = ROOT / "storyboard" / ".audio_work"
TMP_DIR.mkdir(exist_ok=True)

SCENES = [f"rh{i:02d}" for i in range(1, 13)]
SLOW_FACTOR = "0.87"  # 13% slower
MUSIC_DB = "-22"       # music bed level under VO

# Pattern break split phrase — find "with just those three" in rh05 words
PATTERN_BREAK_SCENE = "rh05"
PATTERN_BREAK_BEFORE_PHRASE = ["with", "just", "those", "three"]
PATTERN_BREAK_SILENCE_SEC = 2.0

# Per-scene music mood (freqs=3 sine tones, lowpass=filter cutoff, echo=reverb delay ms)
# Maps script "audio cues" notes to synth parameters.
MUSIC_PROFILES = {
    "rh01": dict(freqs=(55, 82.5, 110),    lowpass=800,  echo="0.6:0.5:500:0.3", vol=0.35),  # cold ambient
    "rh02": dict(freqs=(65, 98, 130),      lowpass=1200, echo="0.7:0.6:350:0.4", vol=0.40),  # title bright
    "rh03": dict(freqs=(45, 67, 90),       lowpass=600,  echo="0.6:0.5:700:0.5", vol=0.30),  # system hum tension
    "rh04": dict(freqs=(60, 90, 120),      lowpass=900,  echo="0.7:0.6:450:0.4", vol=0.32),  # calm definition
    "rh05": dict(freqs=(55, 82.5, 110),    lowpass=800,  echo="0.6:0.5:500:0.3", vol=0.30),  # neutral five parts
    "rh06": dict(freqs=(50, 75, 100, 150), lowpass=700,  echo="0.7:0.5:400:0.5", vol=0.40),  # tension building
    "rh07": dict(freqs=(40, 60, 80),       lowpass=500,  echo="0.8:0.6:600:0.6", vol=0.38),  # minor key dark
    "rh08": dict(freqs=(65, 97.5, 130),    lowpass=1100, echo="0.7:0.6:400:0.4", vol=0.35),  # CEG triad bright
    "rh09": dict(freqs=(58, 87, 116),      lowpass=900,  echo="0.8:0.6:550:0.5", vol=0.32),  # cinematic pullback
    "rh10": dict(freqs=(70, 105, 140),     lowpass=1200, echo="0.6:0.5:350:0.3", vol=0.35),  # friendly CTA
    "rh11": dict(freqs=(55, 82.5, 110),    lowpass=800,  echo="0.6:0.5:500:0.3", vol=0.38),  # loopback + slam
    "rh12": dict(freqs=(60, 90, 120),      lowpass=1000, echo="0.7:0.6:400:0.4", vol=0.30),  # outro warmth
}


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print("FAIL:", " ".join(str(c) for c in cmd))
        print(r.stderr[-1000:])
        sys.exit(1)
    return r


def backup_originals():
    for scene in SCENES:
        src = AUDIO_DIR / f"vo-{scene}.mp3"
        orig = AUDIO_DIR / f"vo-{scene}.orig.mp3"
        if src.exists() and not orig.exists():
            orig.write_bytes(src.read_bytes())
            print(f"  backup vo-{scene}.orig.mp3")


def find_pattern_break_time(scene="rh05"):
    """Find audio timestamp where 'with just those three' begins — split point for silence injection."""
    audio = AUDIO_DIR / f"vo-{scene}.orig.mp3"
    h = hashlib.sha256(audio.read_bytes()).hexdigest()[:16]
    cache = CACHE_DIR / f"transcript-{h}.json"
    if not cache.exists():
        print(f"  no cache for {scene}, cannot inject silence")
        return None
    words = json.loads(cache.read_text(encoding="utf-8"))
    # Find first occurrence of the sequence
    target = [w.lower() for w in PATTERN_BREAK_BEFORE_PHRASE]
    for i in range(len(words) - len(target)):
        seq = [words[i + k]["word"].strip(".,").lower() for k in range(len(target))]
        if seq == target:
            return float(words[i]["start"])
    return None


def enhance_scene(scene, slow_factor=SLOW_FACTOR, inject_silence_at=None):
    """Slow + optionally inject silence, mix music, write back to vo-{scene}.mp3."""
    orig = AUDIO_DIR / f"vo-{scene}.orig.mp3"
    if not orig.exists():
        print(f"  skip {scene}: no backup")
        return

    # Step 1: slow down VO
    slowed = TMP_DIR / f"{scene}-slow.mp3"
    run(["ffmpeg", "-y", "-i", str(orig),
         "-filter:a", f"atempo={slow_factor}",
         "-ar", "44100", "-ac", "2", str(slowed)])

    # Step 2: optionally inject silence at a timestamp (scaled by 1/slow_factor)
    if inject_silence_at is not None:
        adj_t = inject_silence_at / float(slow_factor)
        with_silence = TMP_DIR / f"{scene}-silence.mp3"
        # Split → silence → concat
        # Use filter_complex: split, silence, concat
        run(["ffmpeg", "-y", "-i", str(slowed),
             "-af", f"adelay=0|0,asetpts=PTS-STARTPTS,"
                    f"apad=pad_dur=0",  # no-op, we'll do via concat
             "-ar", "44100", "-ac", "2", str(with_silence)])
        # Simpler: use concat filter with trim
        pre = TMP_DIR / f"{scene}-pre.wav"
        post = TMP_DIR / f"{scene}-post.wav"
        sil = TMP_DIR / f"{scene}-sil.wav"
        run(["ffmpeg", "-y", "-i", str(slowed), "-t", str(adj_t),
             "-ar", "44100", "-ac", "2", str(pre)])
        run(["ffmpeg", "-y", "-ss", str(adj_t), "-i", str(slowed),
             "-ar", "44100", "-ac", "2", str(post)])
        run(["ffmpeg", "-y", "-f", "lavfi",
             "-i", f"anullsrc=r=44100:cl=stereo",
             "-t", str(PATTERN_BREAK_SILENCE_SEC), str(sil)])
        list_file = TMP_DIR / f"{scene}-list.txt"
        list_file.write_text(f"file '{pre.resolve()}'\nfile '{sil.resolve()}'\nfile '{post.resolve()}'\n",
                             encoding="utf-8")
        run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
             "-i", str(list_file), "-c:a", "libmp3lame", "-b:a", "192k",
             str(with_silence)])
        slowed = with_silence

    # Step 3: get duration of slowed audio
    probe = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "json", str(slowed)])
    dur = float(json.loads(probe.stdout)["format"]["duration"])

    # Step 4: generate ambient music bed — scene-specific mood
    profile = MUSIC_PROFILES.get(scene, MUSIC_PROFILES["rh01"])
    music = TMP_DIR / f"{scene}-music.mp3"
    freq_inputs = []
    mix_parts = []
    base_vols = [0.5, 0.3, 0.2, 0.15]
    for idx, f in enumerate(profile["freqs"]):
        freq_inputs += ["-f", "lavfi", "-i", f"sine=frequency={f}:duration={dur}"]
        mix_parts.append(f"[{idx}]volume={base_vols[idx] if idx < len(base_vols) else 0.1}[a{idx}]")
    mix_join = "".join(f"[a{i}]" for i in range(len(profile["freqs"])))
    filter_chain = (
        ";".join(mix_parts) +
        f";{mix_join}amix=inputs={len(profile['freqs'])}:normalize=0[mix];"
        f"[mix]lowpass=f={profile['lowpass']},highpass=f=40,"
        f"volume={MUSIC_DB}dB,"
        f"aecho={profile['echo']},"
        "apad=pad_dur=0.2[out]"
    )
    run(["ffmpeg", "-y", *freq_inputs,
         "-filter_complex", filter_chain,
         "-map", "[out]", "-ar", "44100", "-ac", "2",
         "-c:a", "libmp3lame", "-b:a", "128k", str(music)])

    # Step 5: mix VO + music (scene-specific music volume)
    final = AUDIO_DIR / f"vo-{scene}.mp3"
    run(["ffmpeg", "-y",
         "-i", str(slowed), "-i", str(music),
         "-filter_complex",
         f"[0:a]volume=1.0[vo];"
         f"[1:a]volume={profile['vol']}[mus];"
         f"[vo][mus]amix=inputs=2:duration=first:dropout_transition=0[out]",
         "-map", "[out]", "-ar", "44100", "-ac", "2",
         "-c:a", "libmp3lame", "-b:a", "192k", str(final)])

    sz = final.stat().st_size // 1024
    print(f"  OK {scene}: {dur:.1f}s, {sz}kB")


def main():
    print("Backing up originals...")
    backup_originals()

    print("\nFinding rh05 pattern break timestamp...")
    pb_t = find_pattern_break_time("rh05")
    if pb_t is None:
        print("  not found — continuing without pattern break silence")
    else:
        print(f"  pattern break at t={pb_t:.2f}s (original)")

    print("\nEnhancing audio (slow + music mix)...")
    for scene in SCENES:
        inject = pb_t if scene == PATTERN_BREAK_SCENE else None
        enhance_scene(scene, inject_silence_at=inject)

    print("\nDone. Clear storyboard/.cache/ next so compile.py re-transcribes.")


if __name__ == "__main__":
    main()
