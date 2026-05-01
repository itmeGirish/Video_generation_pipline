"""Harness Film (engagement-focused) — audio + timestamps pipeline."""
import asyncio, json, os, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")

import edge_tts
from faster_whisper import WhisperModel

VOICE = "en-US-GuyNeural"
FPS = 30

PROJECT_ROOT = "c:/Girish/Fundamental_Projects/video_generation/video_explainer"
AUDIO_DIR = f"{PROJECT_ROOT}/projects/goose_vs_claude/audio"
TIMESTAMPS_TS = f"{PROJECT_ROOT}/remotion/src/harness3-timestamps.ts"
os.makedirs(AUDIO_DIR, exist_ok=True)

SCENES = {
    "hf01": """One million lines of code. Shipped to production. Five months. Zero humans wrote a single line of it.
This actually happened. At OpenAI. Eight months ago. And almost nobody is talking about how they did it. Because the how is more interesting than the what.
The models didn't get magically smarter. The engineers didn't work harder. They built something around the model that made it trustworthy enough to let loose.
That something has a name now. It's called a harness. And building it has become the hottest new discipline in software engineering.
Nobody's teaching it in school yet. Nobody's hiring for it by name yet. But if you've been waiting for the next big thing in AI — the thing after prompt engineering, the thing after context engineering — this is it.
Stick with me for the next six minutes and you'll get it. All of it.""",

    "hf02": """Okay. What is a harness? Forget AI for a second. Think about a horse.
A horse is powerful. Fast. Useful. But a horse without a harness? Runs wherever it wants. Takes you nowhere.
Now here's the metaphor the whole industry has quietly agreed on. The AI model is the horse. It's brilliant, it's strong, it's unpredictable. The harness is everything you build around the model to turn that raw power into actual work.
The tools it can use. The memory it keeps. The sandbox that contains its mistakes. The feedback signals that tell it when it messed up.
Put it in a formula — agent equals model plus harness. The model is the intelligence. The harness is what makes the intelligence useful.
Claude Code? Harness. Cursor? Harness. OpenAI Codex? Harness. They all point at different models — but the real engineering lives in what wraps them.""",

    "hf03": """Here's the part that clicks everything into place. Every good harness has exactly two halves.
The first half — guides. Guides steer the model before it acts. Think of them like giving a new employee their first-day onboarding. The AGENTS.md file. The coding conventions. The skill that explains how your team handles API errors. Guides raise the chances the agent gets it right on the first try.
The second half — sensors. Sensors catch what the guides missed. Tests. Type checkers. Linters. Another AI that reviews the first AI's work. Sensors watch after the model acts and push the mistake back in, so the agent can fix itself — usually before a human even sees it.
Here's the punchline. Guides alone, and your agent never learns. Sensors alone, and your agent keeps making the same mistake forever. You need both.
When you have both — that's a harness. That's when it starts to feel like magic.""",

    "hf04": """Remember that team? Three engineers. One million lines. Five months. Here's how they actually pulled it off.
August 2025. Empty repo. One rule — not a single line of code can be written by a human.
Month one? Disaster. They moved at one-tenth the speed of writing it themselves. Every day, agents would fail. Wrong file. Wrong pattern. Wrong dependency.
But here's what the team did that changed everything. When the agent failed, they did not fix the code. They fixed the harness.
Agent forgot a convention? Add it to AGENTS.md. Agent made the same mistake twice? Write a linter that catches it automatically. Agent couldn't find a file? Give it a better search tool. Every failure became a permanent upgrade to the system.
Month two — they caught up. Month three — they passed themselves. Month five — one million lines. Three engineers. Zero keystrokes of code.
This is what harness engineering actually looks like in the wild.""",

    "hf05": """Maybe you're still thinking — Okay, but really, the model is what matters. The harness is just wrapping paper.
Here's the single fact that ends that argument.
Late 2025. LangChain takes their agent to a benchmark called TerminalBench. Same model — GPT-5.2 Codex. They run it. They rank outside the top thirty. Middle of the pack. Not great.
Now watch this. They don't touch the model. They rebuild the harness. Better planning. Smarter context management. Sub-agents. Tighter feedback loops.
Same exact model. They run it again. Rank five. Top of the leaderboard.
Let that sink in. Same model. Same weights. Same everything. Only the harness changed. From rank thirty-plus to rank five.
And it gets weirder. A research team used another AI to rewrite the harness automatically — hit a seventy-six percent task pass rate. Beat every human-designed system in the competition.
The model is becoming a commodity. Anyone can rent GPT. Anyone can rent Claude. What they can't rent — is your harness. That's where the engineering lives now.""",

    "hf06": """Okay. Everything I've shown you — it's not theory. People are doing this work right now.
And here's the thing most people are missing. These jobs don't really have a title yet. Nobody on LinkedIn is officially a harness engineer. Which means if you learn this now, before the title exists, you're early.
So what does the work actually look like?
You write AGENTS.md files that teach the agent the shape of your codebase. You build skills — small focused instruction packs the agent loads when it needs them. You set up sandboxes so the agent can run code without nuking your laptop. You wire up review agents that critique other agents' work. You write custom linters that turn your team's taste into machine-readable rules.
And the most important thing — every time the agent screws up, you don't just fix the bug. You fix the harness. So that exact screw-up becomes impossible. Forever. For every teammate. For every future run.
The keyboard work got automated. The thinking work got bigger. You in?""",

    "hf07": """Quick context before you go. Because everyone's going to try to tell you AI is changing engineering — and that's true, but it's too vague to act on. Here's the specific version.
For sixty years, engineers wrote code. That era is ending. Not because writing code doesn't matter — it still does — but because the person at the keyboard is no longer the only one who can do it. Or the fastest. Or often, the best.
What stays uniquely human? Deciding what to build. Constraining it. Verifying it. Teaching the system to catch its own mistakes.
That work has a name now. Harness engineering. And the wave is early. So early that if you start this week, you are ahead of ninety-nine percent of the industry.
Four things to do on Monday.
One — read the LangChain post titled The Anatomy of an Agent Harness.
Two — read OpenAI's Harness Engineering essay by Ryan Lopopolo.
Three — open Claude Code or Cursor, and for your next project, write an AGENTS.md file.
Four — next time your agent makes a mistake, don't just fix it. Fix the harness.
That's the whole job. That's the shift. You're early. Don't blow it.""",
}


async def generate_audio(name, text):
    out = f"{AUDIO_DIR}/vo-{name}.mp3"
    c = edge_tts.Communicate(text.strip(), VOICE, rate="+5%", pitch="-2Hz")
    await c.save(out)
    r = subprocess.run(["ffprobe","-v","quiet","-print_format","json","-show_format", out], capture_output=True, text=True)
    return out, float(json.loads(r.stdout)["format"]["duration"])


def transcribe(model, path):
    segs, _ = model.transcribe(path, word_timestamps=True)
    words = []
    for s in segs:
        if s.words:
            for w in s.words:
                words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
    return words


def write_ts(all_ts):
    lines = [
        "// AUTO-GENERATED by build_harness3.py",
        "",
        "import type { SceneAudio } from './audio-timestamps';",
        "",
        f"export const FPS = {FPS};",
        "",
        "export const HARNESS3_AUDIO: Record<string, SceneAudio> = {",
    ]
    for name, data in all_ts.items():
        lines.append(f"  {name}: {{")
        lines.append(f"    duration: {data['duration']},")
        lines.append(f"    durationFrames: {int(data['duration'] * FPS)},")
        lines.append(f"    words: [")
        for w in data["words"]:
            we = w["word"].replace("\\","\\\\").replace("'","\\'")
            lines.append(f"      {{ word: '{we}', start: {w['start']}, end: {w['end']} }},")
        lines.append(f"    ],")
        lines.append(f"  }},")
    lines.append("};\n")
    with open(TIMESTAMPS_TS, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n✓ {TIMESTAMPS_TS}")


async def main():
    print("=" * 60)
    print("HARNESS FILM V3 — audio pipeline")
    print("=" * 60)
    paths, durs = {}, {}
    for name, text in SCENES.items():
        p, d = await generate_audio(name, text)
        paths[name] = p
        durs[name] = d
        print(f"  {name}: {d:6.1f}s → vo-{name}.mp3")
    print("\n[Whisper...]")
    model = WhisperModel("base", compute_type="int8")
    all_ts = {}
    for n, p in paths.items():
        w = transcribe(model, p)
        all_ts[n] = {"duration": durs[n], "words": w}
        print(f"  {n}: {len(w):4d} words")
    write_ts(all_ts)
    total = sum(durs.values())
    print(f"\nTotal: {total:.1f}s ({total/60:.1f}min)")


asyncio.run(main())
