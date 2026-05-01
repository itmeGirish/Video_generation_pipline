"""
Harness video audio pipeline — generates TTS + Whisper timestamps.
Outputs to remotion/src/harness-timestamps.ts (separate from Claude47 video).
"""
import asyncio
import json
import os
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")

import edge_tts
from faster_whisper import WhisperModel

VOICE = "en-US-GuyNeural"
FPS = 30

PROJECT_ROOT = "c:/Girish/Fundamental_Projects/video_generation/video_explainer"
AUDIO_DIR = f"{PROJECT_ROOT}/projects/goose_vs_claude/audio"
TIMESTAMPS_TS = f"{PROJECT_ROOT}/remotion/src/harness-timestamps.ts"
os.makedirs(AUDIO_DIR, exist_ok=True)

SCENES = {
    "h01": """Every company is now a software company. Your bank is software. Your car is software. Your coffee shop is software. And behind every one of them sits an invisible problem — it is not writing code that is hard anymore. It is shipping it.
A single change to a modern application can touch a dozen services, pass through build pipelines, security scans, test suites, staging environments, and approval gates before it ever reaches a user.
A typical enterprise runs hundreds of these pipelines, stitched together from a tangle of tools — Jenkins, ArgoCD, scanners, scripts, spreadsheets. Engineers spend more time babysitting deployments than building features.
Releases get delayed. Rollbacks go wrong. Outages happen on Friday evenings. This is the silent tax on modern engineering — the gap between writing software and actually delivering it.
And for the last decade, one company has been quietly rebuilding that entire pipeline around AI. Its name is Harness.""",

    "h02": """Harness started with one idea — that continuous delivery should not be a pile of scripts engineers maintain by hand. It should be a platform.
Over the last decade, that platform has grown to cover the entire software delivery lifecycle. Continuous Integration. Continuous Delivery. Feature Flags. Security Testing. Infrastructure as Code. Cloud Cost Management. Internal Developer Portals. Chaos Engineering.
Each module is best-in-class on its own. Together, they replace the toolchain spaghetti that most companies have accumulated over fifteen years.
And in 2023, Harness did something the rest of the DevOps industry is still catching up to — it wove generative AI into every layer of that platform. Not as a chatbot bolted on top. As an intelligence that understands your code, your pipelines, your infrastructure, and the way your organization ships.
This is what AI-native software delivery actually means — and this is where the rise begins.""",

    "h03": """Ask Harness AI to do something, and you are not talking to a single model. You are talking to a network.
The DevOps Agent designs and fixes pipelines.
The SRE Agent watches production and proposes rollbacks before users notice an incident.
The AppSec Agent triages vulnerabilities, deduplicates noisy scanner output, and suggests fixes.
The Test Agent writes new tests from natural language and heals old ones when the UI changes.
The FinOps Agent hunts down cloud waste and recommends savings.
Underneath all of them sits a knowledge graph — a continuously updated map of every build, every test, every deployment, every incident, every cloud dollar spent across the entire organization.
That graph is what makes these agents different from a generic coding assistant. They are not guessing. They know your system. And they are getting smarter every day.""",

    "h04": """Let's make this concrete. A developer merges a pull request. In a traditional pipeline, that kicks off twenty minutes of builds, forty minutes of tests, a security scan that finds sixty vulnerabilities most of which are duplicates, and a deployment that breaks something in staging at 6 p.m. on a Thursday.
In an AI-native Harness pipeline, the same merge triggers Test Intelligence, which uses AI to run only the tests actually affected by the change — cutting test time by up to eighty percent.
The security agent prioritizes the three real vulnerabilities out of sixty and suggests the exact code fix.
Continuous Verification watches the deployment in real time, compares it to historical baselines, and rolls back automatically the moment error rates deviate.
What used to take an afternoon and a pager alert now takes eight minutes and no human drama. Same developer. Same code. Entirely different pipeline.""",

    "h05": """The claims only matter if the numbers back them up.
Harness customers report release cycles shortened from weeks to hours.
Build times cut by up to four-times. Test cycles compressed by up to eighty percent. Deployment failure rates reduced by more than half.
One customer, Ancestry, reduced the work required to add a new capability across every pipeline by a factor of eighty to one.
Another, Citibank, now releases each change within minutes of a pull request being merged — something that was unthinkable in a regulated banking environment five years ago.
Hundreds of enterprises — including some of the largest banks, retailers, and technology companies on Earth — now run their software delivery on Harness.
And the category itself has a name now. It is called AI-native software delivery, and it is one of the fastest-growing segments in enterprise software.""",

    "h06": """Here is what a typical day looks like on an AI-native Harness team.
A developer types a request in plain English — create a deployment pipeline to AWS with the team's standard scans and tests. The DevOps Agent generates it, pre-filled with the organization's approved templates and policies. The developer reviews the YAML, tweaks one line, merges.
A platform engineer watches a dashboard showing every pipeline across the company with drift, cost, and compliance highlighted automatically.
A security engineer gets a single morning digest — the three vulnerabilities that actually matter out of thousands surfaced by scanners overnight.
An SRE gets paged less, because incidents are rolled back before users notice.
An engineering manager gets a real-time view of lead time and deployment frequency, the two metrics that correlate with elite engineering teams.
The entire organization operates on the same substrate — with AI doing the glue work that humans used to do by hand.""",

    "h07": """So why does the rise of Harness engineering matter beyond DevOps? Because it is the first real answer to a question the AI industry has been avoiding.
Everyone talks about AI that writes code. Almost nobody talks about AI that ships it. And shipping is where software actually becomes real — where it meets users, regulations, customers, revenue, and risk.
The founder of Harness, Jyoti Bansal, saw this bottleneck a decade ago, before the generative AI wave even began.
The platform that was built to solve it is now positioned exactly where the industry is heading — toward engineering organizations where AI agents handle the toil, humans handle the judgment, and the gap between a good idea and a shipped feature collapses from weeks to minutes.
The rise of Harness engineering in AI is not a product story. It is a glimpse of what every engineering team on Earth is about to become.
The pipeline is no longer just a pipeline. It is a thinking system. And it is already here.""",
}


async def generate_audio(name: str, text: str) -> tuple[str, float]:
    output = f"{AUDIO_DIR}/vo-{name}.mp3"
    communicate = edge_tts.Communicate(text.strip(), VOICE, rate="+5%", pitch="-2Hz")
    await communicate.save(output)
    r = subprocess.run(["ffprobe","-v","quiet","-print_format","json","-show_format", output], capture_output=True, text=True)
    duration = float(json.loads(r.stdout)["format"]["duration"])
    return output, duration


def transcribe(model: WhisperModel, audio_path: str) -> list[dict]:
    segments, _ = model.transcribe(audio_path, word_timestamps=True)
    words = []
    for seg in segments:
        if seg.words:
            for w in seg.words:
                words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
    return words


def write_ts_module(all_timestamps: dict):
    lines = [
        "// AUTO-GENERATED by build_harness.py — do not edit manually.",
        "",
        "import type { SceneAudio, WordTimestamp } from './audio-timestamps';",
        "",
        f"export const FPS = {FPS};",
        "",
        "export const HARNESS_AUDIO: Record<string, SceneAudio> = {",
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
    print(f"\n✓ Wrote {TIMESTAMPS_TS}")


async def main():
    print("=" * 60)
    print("HARNESS VIDEO — Audio pipeline")
    print("=" * 60)

    print("\n[1/3] Generating TTS audio...")
    paths, durs = {}, {}
    for name, text in SCENES.items():
        path, dur = await generate_audio(name, text)
        paths[name] = path
        durs[name] = dur
        print(f"  {name}: {dur:6.1f}s  →  vo-{name}.mp3")

    print("\n[2/3] Transcribing with Whisper...")
    model = WhisperModel("base", compute_type="int8")
    all_ts = {}
    for name, path in paths.items():
        words = transcribe(model, path)
        all_ts[name] = {"duration": durs[name], "words": words}
        print(f"  {name}: {len(words):4d} words")

    print("\n[3/3] Writing TypeScript module...")
    write_ts_module(all_ts)

    total = sum(durs.values())
    print(f"\nTotal: {total:.1f}s ({total/60:.1f}min)")


asyncio.run(main())
