---
name: 00-research
description: Researches an AI/tech topic before any scene is written, sourcing real facts only — no invented statistics. Covers the 5 required items (hook fact, real numbers, named quote, physical metaphor, before/after), a no-invented-numbers rule, an AI-topic research-intelligence playbook (what signals to hunt and where), a universal search sequence, and a fallback for non-AI domains. Use when researching a topic, finding facts or statistics for a video, fact-checking a claim, finding a hook fact, sourcing a real quote, or verifying numbers before writing a script. Not for writing narration, animation bullets, or rendering.
---

# Step 2 — Research Before Writing

Never write a single scene until this step is complete.
Generic scripts come from writing from memory. Cinematic scripts come from research.

## Contents
- What to find before writing — the 5 required items (hook fact, numbers, quote, metaphor, before/after)
- Hard rule: no invented numbers
- AI-topic research intelligence — the signals to hunt and how to read them
- Universal search sequence (run for every topic)
- Fallback: non-AI domains
- What to do with the research — the `<!-- RESEARCH SOURCES -->` comment block
- Guidelines — Always / quality bar

---

## What to find before writing

For every topic, find ALL of the following before touching the script. Each item
below describes the SHAPE of what to find — fill it with real, sourced facts from
search, never with the descriptions themselves.

### 1. The surprising fact (becomes the hook)
The one thing the viewer does not expect: the number that seems impossible, the
contradiction, the twist. Use WebSearch to find it. Do not invent it.

### 2. Two or three real numbers
Statistics that prove the central claim, spoken out loud in narration — these make
the best audio anchors because Whisper transcribes numbers with high confidence.
Prefer numbers that are clean to say as words and that pair into a contrast.

### 3. One real quote from a real person
A named engineer, researcher, founder, or user who said something memorable.
Capture name, role, and the verbatim quote. These become testimonial scene material.

### 4. A physical metaphor the topic naturally suggests
The topic's real-world analogue — a specific object or process the visual language
can be built on. If the topic doesn't suggest one, look for the analogy the
builders themselves use in their docs, papers, or talks. Name a specific machine
or process, never "like a machine."

### 5. The before/after or the race
Most compelling videos show a clear before and after, or two things competing.
Find the evidence for it with real numbers on both sides.

---

## Hard rule: no invented numbers

**This is the most important rule. Apply it before running any searches.**

If you cannot find a real statistic via WebSearch, do not include that statistic.
Write the narration without it, or write around it:
- pivot to a qualitative pattern instead of a number
- tease the gap and show the benchmark on screen instead of speaking a figure
- pivot to a named quote instead of a stat

If sources conflict, cite both with their dates and let the script acknowledge the
uncertainty rather than picking one silently.

Invented numbers that Whisper transcribes become the audio_anchor target for a
visual that shows a false statistic. That is a quality failure and a trust failure.

---

## AI-topic research intelligence

AI is the primary domain for this channel. Treat AI research as intelligence work:
the goal is the surprising, current, sourced signal — not a recap of what the model
maker announced.

**Freshness is non-negotiable.** Frontier facts go stale in weeks. Always include
the current year/quarter in queries and prefer the most recent primary source.
A benchmark or price from a year ago may already be wrong — verify it still holds.

**Signals to hunt (each can be the hook):**
- Benchmark contradictions — strong on one axis, weak on another
- Capability vs reliability gaps — what it can do vs how often it fails
- Speed / quality / cost tradeoffs — the figure that breaks the marketing story
- Context-window or long-horizon failures — where it falls apart at scale
- Adoption vs perception gaps — who actually uses it vs who claims to
- Eval methodology caveats — when a headline number doesn't mean what it implies

**Where the real signal lives (let search surface the specific source):**
- Primary benchmark and evaluation results, with their methodology
- Independent leaderboards and head-to-head rankings
- Official model/system cards and release notes — then verify claims independently
- Engineering and research write-ups with reproducible detail
- Practitioner reports from people running the thing in production

**How to read it:**
- Separate the maker's claim from independently verified results — note which is which
- Prefer numbers you can attribute to a named report or measurement, with a date
- When a figure looks too clean, find the methodology before trusting it
- Convert findings into Whisper-friendly spoken numbers for the narration

**Query patterns** (replace `<topic>` and the year; let the result reveal the source):
```
WebSearch: "<topic> benchmark results <year>"
WebSearch: "<topic> independent evaluation methodology"
WebSearch: "<topic> leaderboard ranking comparison"
WebSearch: "<topic> failure mode limitation study"
WebSearch: "<topic> cost speed tradeoff <year>"
WebSearch: "<topic> production case study results"
WebSearch: "<topic> practitioner review interview quote"
```

---

## Universal search sequence (run for every topic)

**Tool selection:** Use `WebSearch` for discovery (returns results with snippets).
Use `WebFetch` when you have a specific URL to verify — it fetches the full page.

Run these first, regardless of topic. Stop when you have all 5 items above.
```
WebSearch: "<topic> statistics surprising fact <year>"
WebSearch: "<topic> real world case study results"
WebSearch: "<topic> expert quote interview"
WebSearch: "<topic> before after comparison"
```

If any of the 5 items is still missing, deepen with the AI-intelligence patterns
above (for AI topics) or the fallback patterns below (for non-AI topics).

---

## Fallback: non-AI domains

If the topic is not AI/tech, keep the same discipline — surprising, sourced,
current — and prefer primary, authoritative sources. Let search surface the
specific source rather than pre-committing to a site.

```
WebSearch: "<topic> peer reviewed study findings"
WebSearch: "<topic> official report statistics <year>"
WebSearch: "<topic> primary source data"
WebSearch: "<topic> expert interview quote"
WebSearch: "<topic> before after trend"
```

---

## What to do with the research

Write a brief research summary at the TOP of the script file as a comment block:
```
<!--
RESEARCH SOURCES
Hook fact: [fact] — Source: [URL or citation, with date]
Key numbers: [number 1] — [source]; [number 2] — [source]
Real quote: "[quote]" — [Name, Role, Source]
Metaphor: [what you chose and why]
Before/after: [the contrast, with real numbers on both sides]
-->
```

Parser ignores HTML comments. This block never appears in the rendered video.
It is only for reference during the authoring + QA phase.

---

## Guidelines

### Always
- Complete all 5 items (hook fact, numbers, quote, metaphor, before/after) before writing a single scene
- Cite every number with its source — URL or publication name, with a date
- Use `WebSearch` for discovery; use `WebFetch` when you have a specific URL to verify
- For AI topics: prefer the most recent primary source — frontier facts go stale fast
- Separate a maker's claim from independently verified results
- If sources conflict: cite both with dates, let the script acknowledge the uncertainty
- Write the `<!-- RESEARCH SOURCES -->` comment block at the top of the script file before any scene

### Quality bar — verify before proceeding to scene structure
- [ ] Hook fact is surprising enough that a viewer would stop scrolling
- [ ] Every number has a named source (URL, publication, report) with a date
- [ ] The real quote is verbatim — not paraphrased
- [ ] The metaphor is specific (a named machine or process, not "like a machine")
- [ ] The before/after has real numbers on both sides, not vague descriptions
- [ ] For AI topics: the key facts are current and independently verifiable
