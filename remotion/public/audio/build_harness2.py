"""Harness Engineering Film — audio + timestamps pipeline."""
import asyncio, json, os, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")

import edge_tts
from faster_whisper import WhisperModel

VOICE = "en-US-GuyNeural"
FPS = 30

PROJECT_ROOT = "c:/Girish/Fundamental_Projects/video_generation/video_explainer"
AUDIO_DIR = f"{PROJECT_ROOT}/projects/goose_vs_claude/audio"
TIMESTAMPS_TS = f"{PROJECT_ROOT}/remotion/src/harness2-timestamps.ts"
os.makedirs(AUDIO_DIR, exist_ok=True)

SCENES = {
    "he01": """In 2025, something strange happened in engineering. The AI models got so good at writing code that the people using them stopped being impressed — and started being frustrated.
The models would write brilliant code in one file and break something in another. They would fix a bug and introduce three. They would pass every test, then fail the first time a real user touched the product.
It was not that the models were weak. It was that they were strong in the wrong way.
There is an old word for this kind of power. A horse. Fast, powerful, useful — but only when you put a harness on it. Without the reins, without the bit, without the saddle, a horse does not take you anywhere. It just runs.
This is exactly where AI engineering found itself. The model was the horse. And somebody needed to build the harness.""",

    "he02": """Here is the cleanest definition in the field, from the engineers at LangChain and Anthropic and OpenAI who are living this every day.
An agent equals a model, plus a harness.
The model is the intelligence — the thing that reasons and generates. The harness is everything else.
It is the loop that calls the model over and over. It is the tools the model can use — read a file, run a command, search the web, edit code. It is the memory that lets the agent remember what it did yesterday. It is the sandbox that contains its mistakes. It is the guardrails that stop it from doing dangerous things, and the feedback signals that tell it when it got something wrong.
A raw model is not an agent. Put a harness around it, and it becomes one.
Claude Code is a harness. Cursor is a harness. OpenAI Codex is a harness. They all point at different models — but the real engineering is in what wraps them.""",

    "he03": """But how does a harness actually work? Every good harness has two halves.
The first half is guides. Guides are everything that steers the model before it acts — the system prompt, an AGENTS.md file, a skill describing how your team writes code, a linter rule, a coding convention document. Guides raise the probability that the agent does the right thing the first time.
The second half is sensors. Sensors are everything that watches after the model acts — tests, type checkers, static analysis, a review agent that reads the output, a script that runs every commit. Sensors catch mistakes and feed them back so the agent can self-correct, often without a human ever seeing the error.
Guides alone, and the agent never learns it got something wrong. Sensors alone, and the agent keeps repeating the same mistake. You need both.
Together they form a loop. And that loop — not the model — is where reliability comes from.""",

    "he04": """In August 2025, a small team at OpenAI called Frontier Product Exploration ran an experiment that nobody believed would work.
They set one rule — no human would write a single line of code. Everything would be written, reviewed, and merged by AI agents.
They started with an empty repository. Five months later, they had shipped a working internal product with over one million lines of code, across more than one thousand five hundred pull requests. Three engineers. Then seven. Not one line typed by a human hand.
How? The team lead, Ryan Lopopolo, made the point clearly — the first six weeks were painful. They moved at one-tenth the speed of writing it themselves. But every time an agent failed, they did not fix the code. They fixed the harness. A missing tool. A clearer architecture document. A sharper linter rule. A better review agent.
They paid the upfront tax. And then the system compounded. It became faster than any human engineer.
This was not the rise of AI code. This was the rise of harness engineering.""",

    "he05": """If you still think the model is what matters most, here is the one fact that changes the argument.
In late 2025, the LangChain team took an existing agent — same model, same weights, same version — and ran it on a benchmark called TerminalBench. It ranked outside the top thirty.
Then they changed nothing about the model. They only rebuilt the harness around it. Better planning. Better context management. Better sub-agents. Better feedback.
Same exact model. They ran it again. It jumped to rank five.
Same model. Different harness. Dramatically different results.
This is not a one-off. A separate research group hit a seventy-six percent task pass rate just by having another language model automatically rewrite the harness itself — beating every hand-designed system in the benchmark.
The lesson is uncomfortable and important. The model is becoming a commodity. Anyone can rent it. But the harness — the thing that wraps the model — is where the real engineering lives.
The model is the horse. The harness is the race.""",

    "he06": """So what does a harness engineer actually do all day? It is not prompt engineering. Prompts are for a single turn. It is not context engineering either — though context is part of it.
A harness engineer designs the whole system around the model. They write AGENTS.md files that teach the agent the shape of the codebase. They build skills — small focused instruction packs the agent can load when it needs them. They configure sandboxes so the agent can run code without breaking the host machine. They wire up review agents that critique the output of other agents. They install pre-commit hooks and custom linters that feed clean, machine-readable signals back into the loop.
And most importantly — every time the agent makes a mistake, they do not just fix the code. They fix the harness so that specific mistake becomes impossible, for every future run, for every teammate, forever.
The coding got automated. The thinking got bigger.""",

    "he07": """Step back for a moment. For sixty years, the job of a software engineer was to write code. That is over.
Not because writing code stopped mattering — it did not — but because the person at the keyboard is no longer the only one who can do it, or the fastest, or in many cases the best.
What remains uniquely human is the thing that was always the hardest part anyway — deciding what to build, how to constrain it, how to verify it, how to teach a system to catch its own mistakes, how to keep a codebase from rotting as it grows a thousand times faster than it used to.
That work has a name now. It is called harness engineering. And it is, quietly, the fastest-growing specialty in the industry.
The companies that invest in it will ship software at a scale and speed the last decade could not imagine. The companies that do not will be out-built by teams a tenth their size.
The model is powerful. But the harness is the discipline. Learn it early. Learn it well.
It is the engineering shift of the decade — and it is already here.""",
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
        "// AUTO-GENERATED by build_harness2.py",
        "",
        "import type { SceneAudio } from './audio-timestamps';",
        "",
        f"export const FPS = {FPS};",
        "",
        "export const HARNESS2_AUDIO: Record<string, SceneAudio> = {",
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
    print("HARNESS ENGINEERING FILM — audio pipeline")
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
