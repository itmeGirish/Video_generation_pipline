"""Calculate proportional scene timing from audio duration."""
import subprocess, json

# Get actual audio duration
r = subprocess.run(['ffprobe','-v','quiet','-print_format','json','-show_format',
    'c:/Girish/Fundamental_Projects/video_generation/video_explainer/projects/goose_vs_claude/audio/claude47-voiceover.mp3'],
    capture_output=True, text=True)
d = json.loads(r.stdout)
audio_dur = float(d['format']['duration'])

# Word counts per scene VO (more accurate than char count for speech timing)
scene_words = {
    "S01": 28,   # "An AI found...sleeping"
    "S02": 200,  # "That AI was built...you can't"
    "S03": 192,  # "Let's talk numbers...gap matters"
    "S04": 137,  # "But benchmarks...ninety seconds"
    "S05": 263,  # "Here's where...ten full points"
    "S06": 193,  # "Who should care...deliverables"
    "S07": 119,  # "Let's zoom out...is ahead"
    "S08": 97,   # "What Anthropic did...yesterday"
    "S09": 55,   # "An AI found...next one"
}

total_words = sum(scene_words.values())
FPS = 30
total_frames = 18000

print(f"Audio duration: {audio_dur:.1f}s ({audio_dur/60:.1f}min)")
print(f"Video frames: {total_frames} ({total_frames/FPS:.0f}s)")
print(f"Total VO words: {total_words}")
print()

orig_frames = {"S01": 0, "S02": 150, "S03": 2250, "S04": 5400, "S05": 7650,
               "S06": 10800, "S07": 13500, "S08": 15750, "S09": 17100}
orig_durations = {"S01": 150, "S02": 2100, "S03": 3150, "S04": 2250, "S05": 3150,
                  "S06": 2700, "S07": 2250, "S08": 1350, "S09": 900}

# Calculate new timing based on word proportion of audio
cumulative_words = 0
new_starts = {}
new_durations = {}

print(f"{'Scene':<6} {'Words':>6} {'AudioStart':>11} {'AudioFrame':>11} {'OrigFrame':>10} {'Drift':>8} {'NewDur':>8}")
print("=" * 72)

for name, wc in scene_words.items():
    start_sec = (cumulative_words / total_words) * audio_dur
    dur_sec = (wc / total_words) * audio_dur
    start_frame = round(start_sec * FPS)
    dur_frames = round(dur_sec * FPS)

    orig_f = orig_frames[name]
    drift = start_frame - orig_f

    new_starts[name] = start_frame
    new_durations[name] = dur_frames

    print(f"  {name:<6} {wc:5d}  {start_sec:9.1f}s  {start_frame:9d}   {orig_f:9d} {drift:+7d}  {dur_frames:7d}")
    cumulative_words += wc

# Ensure last scene extends to video end
last_scene = "S09"
new_durations[last_scene] = total_frames - new_starts[last_scene]

print()
print("=" * 72)
print("COPY THESE INTO Claude47Video.tsx:")
print("=" * 72)
scenes_list = list(scene_words.keys())
for i, name in enumerate(scenes_list):
    # Duration extends to next scene start (or video end)
    if i < len(scenes_list) - 1:
        next_start = new_starts[scenes_list[i+1]]
        dur = next_start - new_starts[name]
    else:
        dur = total_frames - new_starts[name]

    print(f'  <Sequence from={{{new_starts[name]}}} durationInFrames={{{dur}}}>')
    print(f'    <{name}_... />')
    print(f'  </Sequence>')
    print()
