---
name: script-writing-prompt
description: Copy-paste prompt for writing scripts (output goes to projects/scripts/<name>.txt; converter writes structured form to projects/structured_scripts/<name>.txt) that this pipeline can render with high fidelity. Use when starting a new video.
metadata:
  tags: prompt, script, structured-scripts, authoring
---

# How to write a script the pipeline understands

Copy the prompt below, fill in the topic, and give it to a strong LLM (Opus/Sonnet).
The output will drop straight into `projects/structured_scripts/<name>.txt`.

---

## The prompt

```
You are writing a source script for an automated video pipeline. The pipeline parses
your output into scenes, generates TTS narration, designs visuals from your animation
bullets, and renders a 1920×1080 explainer video.

# TOPIC
<your topic in 1-2 sentences — concrete enough that the LLM can mine narrative from it>

# OUTPUT FORMAT (STRICT — the parser is regex-based)

# <Video Title>

## SCENE 1 — "<6-word headline that teases the scene>" (0:00 – 1:00)
### Narration
> One paragraph. 80-130 words. Short sentences. One idea per sentence.
> Plain text only — NO markdown, NO asterisks, NO em-dashes. Use commas and periods.
> Mention concrete nouns (numbers, product names, people) — these become hero words.

### Animation
- **0:00 – 0:08 — <PRIMITIVE INTENT>.** <One concrete sentence describing what's on screen.>
- **0:08 – 0:18 — <PRIMITIVE INTENT>.** <One concrete sentence.>
- (5-8 bullets per 60s scene — every 7-12 seconds something changes)

## SCENE 2 — ...
(repeat for 5-8 scenes total, each ~60 seconds)

# RULES THE PIPELINE ENFORCES

1. EVERY animation bullet must START with a 4-word time window like `**0:08 – 0:18 — `
   (em-dash between times is OK, hyphen is OK, the parser accepts both).

2. The bullet HEADLINE (between **) describes WHAT you want viewers to see in 2-5
   plain-English words. Examples: "Big number slam.", "Code scrolling fast.",
   "Three labeled cards.", "Typewriter question.", "Bar chart climbs.",
   "Title fades in.", "Side-by-side comparison.", "Logos fly in.".
   Do NOT name a specific primitive — the LLM authors React.createElement code
   per bullet (rule 04) from the headline + body, so describe the visual intent
   in plain English and let the body carry the concrete content.

3. The bullet BODY must be CONCRETE. Don't write "The reveal." — write
   "Three cards appear left-to-right labeled GUIDES, SENSORS, FEEDBACK in cyan/amber/violet."

4. Quoted strings ("six minutes", "$0") and exact numbers (688, 76%, 30→5) get extracted
   verbatim into primitive props. Be specific.

5. EVERY animation bullet should anchor to a SHORT VERBATIM PHRASE that appears in the
   narration of the same scene. Example narration says "rank thirty to rank five" → a
   bullet about that moment will use "rank thirty" as its audio_anchor (the LLM extracts
   this; you don't write it explicitly, but write narration with quotable hero phrases).

6. KEEP NARRATION TIGHT. 80-130 words per scene = ~32-50 seconds spoken at 170 wpm.
   Allow ~10s slack per scene for visual moments. Don't write 200-word walls.

7. PUNCTUATION DRIVES PACING (free TTS doesn't parse SSML). Use commas for short pauses,
   periods for full stops, ellipses sparingly. NO em-dashes, NO semicolons (TTS reads
   them awkwardly).

8. AVOID HYPHENATED COMPOUNDS like "show-don't-tell" or "plus-one" — TTS turns them into
   one weird word. Write "show, don't tell" instead.

9. CITE REAL SOURCES. Made-up names (e.g. fake author surnames) get mistranscribed and
   look unprofessional. Use real product names, real benchmarks, real numbers.

9b. USING YOUR OWN GRAPHICS. If you have logos/screenshots/diagrams in
    `projects/<name>/public/`, reference them inline:
      - **<M:SS> - <M:SS> — Show <asset description>.** [asset: <filename>] centered, caption "<caption>" underneath.
    The per-bullet LLM (rule 04) emits `<Img src={staticFile('<filename>')} />` and uses the filename verbatim.
    Supported: PNG, JPG, WebP, GIF, SVG, AVIF. See rule 17 for full details.
    DO NOT copy the placeholder words above into a project — replace every `<...>` with
    real values from THIS project (and ensure the file actually exists in `public/`).

10. ENGAGEMENT RULES (the playbook):
    - Hook in 8 seconds — open with the most jaw-dropping fact
    - Pattern interrupt every 10-15 seconds — new visual/angle/pace
    - Cliffhanger between scenes — end on a tease, not a summary
    - Show, don't tell — if narrator says a number, the number is on screen

# DO NOT

- Do NOT write `script.md`, `storyboard.json`, or any other file. Only the canonical structured script at `projects/structured_scripts/<name>.txt` (Step 1 of rule 00).
- Do NOT use markdown tables, code fences, headers other than `## SCENE N` and `### Narration` / `### Animation`.
- Do NOT add a preamble before `# <Title>` (Visual Language sections, Scene Maps, etc. confuse the parser — keep them out).
- Do NOT name specific primitive types in the headline (let the pipeline choose).
- Do NOT exceed 8 scenes or 480 seconds total runtime.

# EXAMPLE OF GOOD VS BAD

BAD bullet:
- **0:00 – 0:08 — The reveal.** Show what's important.

GOOD bullet:
- **0:00 – 0:08 — Number punch.** "1,000,000" slot-machines into the center in amber, then "0 humans" appears below in red, then "5 months" tags in cyan. Background is the dot-grid navy.

BAD narration:
> So as we've discussed, the model — which is, of course, the AI — needs a kind of
> wrapper, that being the harness, around it, in order to function properly within
> production-grade systems...

GOOD narration:
> The model is the brain. The harness is everything else. Tools. Memory. Sandbox. Tests.
> Without a harness, the model just guesses. With one, it ships code.

Now produce the script for the topic above. Output ONLY the script content (raw or canonical, depending on which file you are writing),
starting with `# <Title>` and ending after the last scene's `### Animation` block.
```

---

## How to use

1. Copy the prompt above, fill in `# TOPIC`
2. Paste into Claude (Opus 4.7 recommended)
3. Save the output to `projects/scripts/<name>.txt`
4. Run: `python storyboard/build_video.py projects/<name>/`

The pipeline will auto-convert your script to canonical form (rule 14) before parsing.

---

## Why these rules exist

Each rule maps to a known pipeline failure mode:

| Rule | Failure it prevents |
|---|---|
| Time-window bullets | Parser regex requires `**N:NN – N:NN — `; warning otherwise |
| Concrete bullet bodies | Vague bullets → LLM picks generic primitive (caption_card) |
| Anchor phrases in narration | Anchor verification (rule 15) rejects designs whose anchors aren't in narration |
| 80-130 words/scene | Long narration → audio length drift, scenes don't fit |
| Punctuation pacing | edge-tts ignores SSML — only punctuation respects pacing |
| No hyphens-in-compounds | Whisper mistranscription → low narration coverage |
| Real sources | Made-up names mispronounced + look fake on screen |
| Max 8 scenes | Pipeline tested up to 8; renders take ~3-4 min/scene |
