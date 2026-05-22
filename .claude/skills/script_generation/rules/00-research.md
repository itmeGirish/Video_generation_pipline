---
name: research
description: How to research a topic before writing any scene. Real facts only — no invented statistics. Topic-specific search strategies for AI, software, business, science, health, and history.
metadata:
  tags: research, facts, statistics, sources, web-search, pre-writing
---

# Step 2 — Research Before Writing

Never write a single scene until this step is complete.
Generic scripts come from writing from memory. Cinematic scripts come from research.

---

## What to find before writing

For every topic, find ALL of the following before touching the script:

### 1. The surprising fact (becomes the hook)
The one thing the viewer does not expect. The number that seems impossible.
The contradiction. The twist.

Examples:
- "GPT-5.5 has the highest factual accuracy AND the highest hallucination rate of any frontier model"
- "The transformer architecture is 8 years old and we still haven't found its ceiling"
- "Claude solved concurrency bugs that every previous Claude model choked on"

Use WebSearch to find this. Do not invent it.

### 2. Two or three real numbers
Statistics that prove the central claim. Spoken out loud in narration — these become
the best audio anchors because Whisper transcribes numbers with high confidence.

- "eighty-six percent" → near-certain Whisper hit
- "sixty-two tokens per second" → clean anchor
- "twelve hundred lines, zero tests" → pair of numbers, dramatic contrast

### 3. One real quote from a real person
A named engineer, developer, researcher, or user who said something memorable.
Name, role, and verbatim quote. These become testimonial scene material.

### 4. A physical metaphor the topic naturally suggests
The topic's real-world analogue:
- Database migration → water flowing between tanks
- Model hallucination → a lie detector that fails
- AI agents → an octopus with 8 arms grabbing different tools
- Parallel processing → multiple conveyor belts running simultaneously

This metaphor will become the visual language for the whole video.
If the topic doesn't suggest one, look for what the developers themselves use
as an analogy in documentation or talks.

### 5. The before/after or the race
Most compelling videos show a clear before and after, or two things competing.
Find the evidence for it:
- Before transformer: LSTM needed 2 weeks to train. After: 2 days.
- GPT-5.5 vs Claude: Terminal-Bench 82.7% vs 69.4%.
- Before migration: 1200 lines. After: 555 lines.

---

## Universal search sequence (run for every topic)

Run these 4 searches first regardless of topic. Stop when you have all 5 items above.

```
WebSearch: "<topic> statistics surprising fact"
WebSearch: "<topic> real world case study results"
WebSearch: "<topic> expert quote interview"
WebSearch: "<topic> before after comparison"
```

If any of the 5 items is still missing after these 4 searches, run the topic-specific
searches below for the relevant category.

---

## Topic-specific search strategies

### AI / Machine Learning

Best sources: Artificial Analysis, LMSYS Chatbot Arena, HuggingFace Open LLM Leaderboard,
official model cards, company engineering blogs.

```
WebSearch: "artificial analysis <model name> benchmark speed quality"
WebSearch: "<company> engineering blog <topic>"
WebSearch: "LMSYS chatbot arena <model name> elo score"
WebSearch: "<model name> hallucination rate evaluation study"
WebSearch: "HuggingFace open llm leaderboard <model name>"
WebSearch: "<model name> vs <model name> developer survey results"
```

Hook targets: hallucination rates, benchmark contradictions (high accuracy + high confabulation),
speed vs quality tradeoffs, cost-per-token surprises, context window failures.

---

### Software Architecture / Engineering

Best sources: Stack Overflow Developer Survey, GitHub state-of-octoverse, engineering blogs
(Netflix Tech Blog, Uber Engineering, Cloudflare Blog, Stripe Engineering), ACM papers.

```
WebSearch: "Stack Overflow developer survey <topic> statistics <year>"
WebSearch: "<company> engineering blog <topic> case study"
WebSearch: "<topic> production incident post-mortem"
WebSearch: "<technology> adoption statistics enterprise"
WebSearch: "<topic> performance benchmark real world"
WebSearch: "github octoverse <topic> developer trends"
```

Hook targets: adoption numbers that surprise (e.g. "74% of Fortune 500 run Kubernetes"),
incident costs, migration timelines, lines-of-code before/after, latency improvements.

---

### Business / Finance / Economics

Best sources: McKinsey Global Institute, Harvard Business Review, Statista, World Bank,
Forbes, Bloomberg, company earnings reports, SEC filings.

```
WebSearch: "<topic> McKinsey report statistics"
WebSearch: "<topic> Harvard Business Review findings"
WebSearch: "<company or industry> revenue growth statistics <year>"
WebSearch: "<topic> economic impact cost study"
WebSearch: "<topic> startup failure rate statistics"
WebSearch: "site:hbr.org <topic>"
WebSearch: "<topic> Statista market size"
```

Hook targets: failure rates, cost-per-unit surprises, market size vs perception gaps,
time-to-payback numbers, winner-takes-all concentration statistics.

---

### Science / Technology (non-AI)

Best sources: Nature, Science, MIT Technology Review, Ars Technica, NASA, CERN,
university press releases, peer-reviewed abstracts.

```
WebSearch: "site:nature.com <topic> findings study"
WebSearch: "MIT technology review <topic>"
WebSearch: "<topic> peer reviewed study results surprising"
WebSearch: "<topic> record broken measurement"
WebSearch: "Ars Technica <topic> explained"
WebSearch: "<topic> NASA ESA discovery data"
```

Hook targets: scale numbers (distances, temperatures, timescales that break intuition),
record-breaking measurements, study results that contradict folk wisdom, comparison
to everyday objects ("the virus is 100x smaller than a human hair").

---

### Health / Medicine / Biology

Best sources: CDC, WHO, NIH, PubMed, Mayo Clinic, NEJM (New England Journal of Medicine),
The Lancet, peer-reviewed meta-analyses.

```
WebSearch: "CDC statistics <topic> prevalence rate"
WebSearch: "WHO global data <topic>"
WebSearch: "PubMed meta-analysis <topic> results"
WebSearch: "NIH <topic> clinical trial findings"
WebSearch: "<topic> misdiagnosis rate study"
WebSearch: "<condition> survival rate improvement last 20 years"
```

Hook targets: misdiagnosis rates, survival rate improvements, drug efficacy gaps
(what works in trials vs real world), cost-of-illness vs cost-of-prevention comparisons.

---

### History / Culture / Society

Best sources: Pew Research, Gallup, academic journals (JSTOR), Wikipedia citations
(follow to primary sources), BBC History, Smithsonian, primary documents.

```
WebSearch: "Pew Research <topic> survey data"
WebSearch: "Gallup poll <topic> statistics"
WebSearch: "<historical event> primary source eyewitness account"
WebSearch: "<topic> historical data trend <decade>"
WebSearch: "JSTOR <topic> academic paper"
WebSearch: "<topic> demographic shift statistics"
```

Hook targets: attitude reversals (what people believed then vs now), demographic
tipping points, cost-in-today's-dollars for historical events, "it was invented X
years earlier than you think" facts.

---

### Product / Startup / Company Analysis

Best sources: Crunchbase, Pitchbook, company blog posts, SEC S-1 filings, Product Hunt,
Y Combinator blog, a16z essays, founder interviews (Lex Fridman, Acquired podcast).

```
WebSearch: "<company> S-1 filing revenue growth metrics"
WebSearch: "<product> user growth statistics monthly active users"
WebSearch: "<founder name> interview quote <topic>"
WebSearch: "<company> product launch results metrics"
WebSearch: "Y Combinator <topic> advice statistics"
WebSearch: "Crunchbase <company> funding valuation history"
WebSearch: "acquired podcast <company> episode"
```

Hook targets: revenue-per-employee outliers, growth rate surprises, valuation-to-revenue
multiples, pivot stories (what it was before), churn rates vs public narrative.

---

## What to do with the research

Write a brief research summary at the TOP of the script file as a comment block:

```
<!--
RESEARCH SOURCES
Hook fact: [fact] — Source: [URL or citation]
Key numbers: [number 1] — [source]; [number 2] — [source]
Real quote: "[quote]" — [Name, Role, Source]
Metaphor: [what you chose and why]
Before/after: [what the contrast is]
-->
```

Parser ignores HTML comments. This block never appears in the rendered video.
It is only for reference during the authoring + QA phase.

---

## Hard rule: no invented numbers

If you cannot find a real statistic via WebSearch, do not include that statistic.
Write the narration without it, or write around it:
- "I've seen this pattern in dozens of real codebases" (no number needed)
- "The performance gap is real — I'll show you the benchmark" (tease, then show chart)
- "One developer put it best:" (pivot to quote instead of stat)

Invented numbers that Whisper transcribes become the audio_anchor target for a visual
that shows a false statistic. That is a quality failure and a trust failure.

---

## Research quality bar

Before moving to scene structure, verify:

- [ ] Hook fact is surprising enough that a viewer would stop scrolling
- [ ] Every number has a named source (URL, publication, company report)
- [ ] The real quote is verbatim — not paraphrased
- [ ] The metaphor is specific (not "like a machine" — like WHICH machine)
- [ ] The before/after has real numbers on both sides, not vague descriptions

If any item is missing → run more searches. Do not proceed with gaps.
A script built on weak research produces a generic video no matter how good the writing is.
