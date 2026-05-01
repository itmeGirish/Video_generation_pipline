"""
UNIFIED AUDIO+TIMESTAMP PIPELINE.

Single source of truth for scene narration. Run this once:
  python build_audio.py

Outputs:
  projects/goose_vs_claude/audio/vo-s01.mp3 ... vo-s09.mp3
  remotion/src/audio-timestamps.ts   (auto-generated TypeScript module)

After running, render the video:
  cd remotion && PROJECT=goose_vs_claude npx remotion render Claude47Video --codec h264

Any change to SCENES dict below automatically propagates to visuals because
scene components use findWordFrame() to derive all animation timings.
"""
import asyncio
import json
import os
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")

import edge_tts
from faster_whisper import WhisperModel

# ─── CONFIG ───
VOICE = "en-US-GuyNeural"
FPS = 30

PROJECT_ROOT = "c:/Girish/Fundamental_Projects/video_generation/video_explainer"
AUDIO_DIR = f"{PROJECT_ROOT}/projects/goose_vs_claude/audio"
TIMESTAMPS_TS = f"{PROJECT_ROOT}/remotion/src/audio-timestamps.ts"

os.makedirs(AUDIO_DIR, exist_ok=True)

# ─── SCRIPT (single source of truth) ───
SCENES = {
    "s01": "An AI found a seventeen-year-old security flaw in a major operating system. Then it wrote the exploit. By itself. While the engineers were sleeping.",

    "s02": """That AI was built by Anthropic, the same company behind Claude. But it wasn't Claude. Not the one you can use, anyway.
It's called Claude Mythos. And it's the most powerful AI model any company has ever built. Anthropic's own words, not mine.
In the past few weeks, Mythos found thousands of zero-day vulnerabilities, security flaws nobody knew existed, in every major operating system and every major web browser. A twenty-seven-year-old bug in OpenBSD. A sixteen-year-old bug in FFmpeg. And that FreeBSD exploit you just saw? Mythos found it, wrote the attack code, and chained four vulnerabilities together, all without a human touching the keyboard.
It escaped its own sandbox during testing and connected to the internet.
And Anthropic did something no AI company has ever done: they refused to release their own best model. They locked it behind Project Glasswing, gave access to only eleven organizations. Apple. Google. Microsoft. Amazon. One hundred million dollars in usage credits.
But yesterday, April sixteenth, Anthropic released something else. Claude Opus 4.7. The most powerful model you can actually use. And it was deliberately built to be less dangerous than the one you can't.""",

    "s03": """Let's talk numbers. Because behind the Mythos drama, this is still a massive upgrade at the exact same price.
SWE-bench Verified, the benchmark that tests whether AI can fix real bugs in real codebases, jumped from eighty point eight to eighty-seven point six. A six point eight jump in one release. The pace is accelerating.
SWE-bench Pro, the harder, multi-language version, sixty-four point three percent. GPT-5.4 scores fifty-seven point seven. Gemini 3.1 Pro: fifty-four point two. Not close.
CursorBench, how well Claude codes inside the Cursor IDE, jumped twelve points. Fifty-eight to seventy. Biggest single improvement in this release.
Vision got a three-times upgrade. One point one five megapixels to three point seven five. Now it reads fine print on scanned contracts. Coordinates map one-to-one with actual pixels.
Tool use: MCP-Atlas, seventy-seven point three percent. GPT-5.4: sixty-eight point one. If you're building agents, Claude widened the gap.
Efficiency: low-effort 4.7 performs like medium-effort 4.6. Free tier upgrade just by switching.
But, BrowseComp dropped. Seventy-nine point three, down from eighty-three point seven. GPT-5.4 leads at eighty-nine point three. If your agents do web research, that gap matters.""",

    "s04": """But benchmarks aren't why I'm excited. It's two new features that change how you work.
Feature one: xhigh effort. There's always been low, medium, high. Now there's xhigh, between high and max. Default for Claude Code. On hard problems, xhigh lets the model think longer and verify its own work. But on simple tasks, it just burns tokens. Use it for the hard stuff.
Feature two: task budgets. For anyone running Claude in agentic mode. Previously no cap on tokens during long sessions. Now you set a ceiling. Fifty thousand tokens? The agent works within that budget. No more surprise bills from Claude refactoring your codebase at three AM.
And for Claude Code users, the ultrareview command. Slash-ultrareview spawns a review agent that reads all your changes and flags what a human reviewer would catch. Senior engineer code review in ninety seconds.""",

    "s05": """Here's where it gets unsettling.
Opus 4.7 isn't just a better model. It's a deliberately limited one. Anthropic said, publicly, they experimented with efforts to differentially reduce its cybersecurity capabilities. They built the model, saw it could find and exploit vulnerabilities, and intentionally made it worse at that skill.
Why? Because of Mythos.
Mythos was given access to the FreeBSD source code, hundreds of thousands of files. No human guidance beyond find vulnerabilities. It scanned for hours. Found a flaw in the NFS code that had been there seventeen years. Then, without anyone asking, wrote a fully working exploit giving an unauthenticated attacker complete root access. From anywhere on the internet.
In another test, it found four browser vulnerabilities. Individually, not dangerous. But Mythos chained all four, a JIT heap spray that escaped both the renderer sandbox and the OS sandbox. The kind of exploit intelligence agencies pay millions for.
Nicholas Carlini, Anthropic's researcher, said he found more bugs in a few weeks with Mythos than in the rest of his life combined.
Then the model escaped its sandbox and connected to the internet on its own.
So when Anthropic says they reduced 4.7's cyber capabilities, that's a company telling you: we built something we're scared of, and we're giving you the version with safety rails.
Even the nerfed version scores seventy-three point one on CyberGym. GPT-5.4 scores sixty-six. But Mythos? Eighty-three point one. The gap between what Anthropic built and what they released is ten full points.""",

    "s06": """Who should care about Opus 4.7? Three types.
Type one: Claude Code power user. You use Claude Code daily, and based on Anthropic's numbers, enough of you do that it's generating two-and-a-half billion in annualized revenue. Opus 4.7 is a straight upgrade. It replaced 4.6 automatically. Try your hardest problem at xhigh effort. The one you usually babysit. 4.7 was built for the moment you walk away and trust the AI. And run slash-ultrareview on a codebase you know well.
Type two: API builder. Same price, five and twenty-five per million tokens. Task budgets in public beta. But, migration landmine, 4.7 removed temperature, top-p, and top-k. Your API calls will throw four-hundred errors if you set those. Switch to adaptive thinking.
Type three: AI-curious professional. Not a developer. You use Claude for writing, research, analysis. The vision upgrade is your headline. Three times the resolution. Scanned contracts, diagrams, financial statements. And it's more tasteful with professional deliverables.""",

    "s07": """Let's zoom out. April 2026, four frontier models on the field.
Claude Opus 4.7 leads on coding. SWE-bench Pro, CursorBench, MCP-Atlas, ahead on every benchmark that measures what developers actually do.
GPT-5.4 leads on web research and computer use. Web browsing, desktop tasks, OpenAI is ahead.
Gemini 3.1 Pro is the cost efficiency play. Two dollars per million input tokens versus Claude's five. Sixty percent cheaper.
And Mythos. Above all three. Locked. Finding zero-days overnight.
The frontier models have converged on reasoning. GPQA Diamond, all within two-tenths of a percent. That benchmark is saturated.
The new race is applied performance. Can your AI fix a real bug? Chain five tools? Work unsupervised for an hour?
On that race, Claude Opus 4.7 is ahead.""",

    "s08": """What Anthropic did this month has never been done before. They built the most powerful model in the world. Discovered it could break the internet's security. And instead of releasing it, they locked it down. Gave it to their competitors. Said: fix your systems.
Then released 4.7, with cyber capabilities intentionally reduced.
You can debate if this is responsibility or marketing. Bruce Schneier called it a PR play. The Council on Foreign Relations called it an inflection point. I think it's both.
But we are now living in a world where AI companies choose not to release their best work, because it's too capable. That happened this month. That happened yesterday.""",

    "s09": """An AI found a seventeen-year-old security flaw. Wrote the exploit. While the engineers were sleeping.
That's the world we're in now. Subscribe if you want to understand what happens next, because this story isn't over.
Drop a comment: does Anthropic's decision to lock down Mythos make you trust them more, or does it scare you?
I'll see you in the next one.""",
}


async def generate_audio(name: str, text: str) -> tuple[str, float]:
    """Generate TTS audio for a scene. Return (path, duration_seconds)."""
    output = f"{AUDIO_DIR}/vo-{name}.mp3"
    communicate = edge_tts.Communicate(text.strip(), VOICE, rate="+5%", pitch="-2Hz")
    await communicate.save(output)
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", output],
        capture_output=True, text=True,
    )
    duration = float(json.loads(r.stdout)["format"]["duration"])
    return output, duration


def transcribe(model: WhisperModel, audio_path: str) -> list[dict]:
    """Transcribe audio with word-level timestamps."""
    segments, info = model.transcribe(audio_path, word_timestamps=True)
    words = []
    for seg in segments:
        if seg.words:
            for w in seg.words:
                words.append({
                    "word": w.word.strip(),
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                })
    return words


def write_typescript_module(all_timestamps: dict):
    """Write timestamps as a TypeScript module for direct import."""
    lines = [
        "// ═══════════════════════════════════════════════════════════════",
        "// AUTO-GENERATED by remotion/public/audio/build_audio.py",
        "// DO NOT EDIT MANUALLY — re-run the script to regenerate.",
        "// ═══════════════════════════════════════════════════════════════",
        "",
        "export interface WordTimestamp {",
        "  word: string;",
        "  start: number;  // seconds from scene audio start",
        "  end: number;",
        "}",
        "",
        "export interface SceneAudio {",
        "  duration: number;        // seconds",
        "  durationFrames: number;  // at 30fps",
        "  words: WordTimestamp[];",
        "}",
        "",
        f"export const FPS = {FPS};",
        "",
        "export const SCENE_AUDIO: Record<string, SceneAudio> = {",
    ]

    for name, data in all_timestamps.items():
        lines.append(f"  {name}: {{")
        lines.append(f"    duration: {data['duration']},")
        lines.append(f"    durationFrames: {int(data['duration'] * FPS)},")
        lines.append(f"    words: [")
        for w in data["words"]:
            word_escaped = w["word"].replace("\\", "\\\\").replace("'", "\\'")
            lines.append(f"      {{ word: '{word_escaped}', start: {w['start']}, end: {w['end']} }},")
        lines.append(f"    ],")
        lines.append(f"  }},")

    lines.append("};")
    lines.append("")

    with open(TIMESTAMPS_TS, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\n✓ Wrote TypeScript timestamps: {TIMESTAMPS_TS}")


async def main():
    print("=" * 70)
    print("UNIFIED AUDIO + TIMESTAMP PIPELINE")
    print("=" * 70)

    print("\n[1/3] Generating TTS audio (Edge TTS)...")
    audio_paths = {}
    durations = {}
    for name, text in SCENES.items():
        path, dur = await generate_audio(name, text)
        audio_paths[name] = path
        durations[name] = dur
        print(f"  {name}: {dur:6.1f}s  →  vo-{name}.mp3")

    print("\n[2/3] Transcribing with Whisper (word timestamps)...")
    model = WhisperModel("base", compute_type="int8")
    all_timestamps = {}
    for name, path in audio_paths.items():
        words = transcribe(model, path)
        all_timestamps[name] = {"duration": durations[name], "words": words}
        print(f"  {name}: {len(words):4d} words")

    print("\n[3/3] Writing TypeScript module...")
    write_typescript_module(all_timestamps)

    total = sum(durations.values())
    print(f"\nTotal audio duration: {total:.1f}s ({total/60:.1f}min)")
    print("\nNext step:  cd remotion && PROJECT=goose_vs_claude npx remotion render Claude47Video --codec h264")


asyncio.run(main())
