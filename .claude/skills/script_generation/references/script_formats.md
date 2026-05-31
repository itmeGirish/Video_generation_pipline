---
name: script-formats-reference
description: Reference guide for YouTube video format types (educational, listicle, story, review, vlog, commentary), script component breakdowns (hook, intro, CTA), tone guidelines, timing targets by video length, engagement techniques, locked voice and TTS configuration, and common mistakes to avoid. Use this skill whenever drafting or reviewing a YouTube script, choosing a video format, writing hooks or CTAs, deciding video length, picking tone, generating voiceover, or auditing a script before production. Triggers include "write a script," "draft a hook," "fix my intro," "what video length," "which format," "generate VO," "voice settings," "tone for my channel," or any request to plan or edit YouTube content. Do NOT use for animation bullet writing, Remotion specs, thumbnail design, or SEO descriptions.
---

# YouTube Script Formats and Structures

## Voice and TTS configuration (locked)

This is the locked voice configuration for all scripts produced under this skill. Do not substitute another voice without explicit instruction from the user.

**TTS engine:** `edge-tts` (Microsoft Edge Text-to-Speech, free endpoint, no API key required)
**Voice:** `en-US-AndrewMultilingualNeural`
**Default rate:** `+0%` (natural pace) — adjust per script if needed
**Default pitch:** `+0Hz` (default tone)
**Default volume:** `+0%`

### Why this voice

- American accent — fits the channel's primary target audience (US/UK/Canada/Australia developers)
- Neural quality — production-grade output, indistinguishable from professional VO for most viewers
- Free — no API costs, no rate limits at small volume
- Multilingual capable — handles technical terms, model names, and code well

### How to invoke

Standard generation command:

```bash
edge-tts --voice en-US-AndrewMultilingualNeural --text "YOUR_SCRIPT" --write-media output.mp3
```

For scripts with pause markers, use SSML:

```bash
edge-tts --voice en-US-AndrewMultilingualNeural --file script.ssml --write-media output.mp3
```

SSML pause syntax inside narration:

```xml
<break time="200ms"/>   <!-- short pause, mid-sentence emphasis -->
<break time="500ms"/>   <!-- standard pause between beats -->
<break time="1s"/>      <!-- dramatic pause for reveals -->
```

### Pacing direction in scripts

When writing narration, include pace markers inline:

```
[pace: faster]    — for setup beats and quick transitions
[pace: normal]    — default for most narration
[pace: slower]    — for stakes, reveals, key takeaways
```

These are notes for the narrator/script editor. Convert to SSML `<prosody rate="...">` tags only when generating the final audio.

### Voice limitations to write around

- Andrew handles most technical terms well but can mispronounce: model version numbers (write "four point seven" not "4.7"), acronyms (write "M C P" not "MCP" when the letter pronunciation matters), and some non-English proper nouns. Write phonetically when in doubt.
- For numbers, spell out under 10 and over 100 selectively for clarity ("fifty-six percent" reads better than "56 percent")
- Em-dashes (—) are read as a pause; en-dashes (–) are skipped. Use em-dashes for emphasis pauses.

## Common YouTube Video Types

### 1. Educational/Tutorial Videos

**Structure:**
- Hook (0-10 seconds)
- Introduction (10-30 seconds)
- Main content with clear sections (bulk of video)
- Recap/Summary
- Call to action

**Characteristics:**
- Clear, step-by-step explanations
- Visual cues mentioned ("as you can see here")
- Numbered points or sections
- Pause points for viewer to follow along

### 2. Listicle/Top X Videos

**Structure:**
- Hook with the promise
- Quick intro
- Item #X (countdown or count up)
- Each item: Name → Explanation → Why it matters
- Conclusion with recap
- CTA

**Characteristics:**
- High energy
- Quick pace
- Transitions between items
- Suspense building (save best for last)

### 3. Story/Narrative Videos

**Structure:**
- Compelling hook
- Setup/Context
- Rising action
- Climax
- Resolution
- Reflection/Lesson
- CTA

**Characteristics:**
- Emotional connection
- Descriptive language
- Pacing variety
- Character development
- Plot twists or reveals

### 4. Review Videos

**Structure:**
- Hook with verdict tease
- Introduction to product/subject
- Pros
- Cons
- Comparisons (if applicable)
- Final verdict
- Who it's for
- CTA

**Characteristics:**
- Balanced perspective
- Specific examples
- Personal experience
- Clear criteria
- Honest assessment

### 5. Vlog Style

**Structure:**
- Energetic hook
- What's happening today
- Chronological or thematic sections
- Behind-the-scenes moments
- Reflection/Lesson learned
- CTA

**Characteristics:**
- Conversational
- Personal
- Authentic
- Energy shifts
- Direct address to camera

### 6. Commentary/Opinion Videos

**Structure:**
- Hook with controversial/interesting take
- Context/Background
- Main argument with supporting points
- Counter-arguments addressed
- Conclusion with final stance
- CTA

**Characteristics:**
- Strong voice
- Persuasive language
- Evidence and examples
- Conversational yet authoritative
- Engagement with opposing views

## Script Components Breakdown

### The Hook (First 5-10 seconds)

**Purpose:** Stop the scroll, capture attention immediately

**Techniques:**
- Question: "Have you ever wondered why...?"
- Bold statement: "This changed everything I thought I knew about..."
- Conflict: "I made a huge mistake and here's what happened..."
- Promise: "By the end of this video, you'll know exactly how to..."
- Shock: "I lost $10,000 in 5 minutes..."
- Pattern interrupt: "Stop! Before you [common action], watch this..."

**Examples:**
- "In the next 60 seconds, I'm going to show you a trick that will save you hours"
- "This is the most important thing I've learned in 10 years of..."
- "Everyone gets this wrong, and it's costing them..."

### The Introduction (10-45 seconds)

**Purpose:** Establish credibility, set expectations, deliver on hook promise

**Elements:**
- Who you are (if relevant)
- What the video is about
- Why it matters to viewer
- What they'll learn/gain
- Quick preview of main points

**Note for faceless channels:** Skip the "Hey everyone, I'm [Name]" template. Faceless channels build credibility through content quality and visual authority, not personal introduction. Replace with a direct stakes statement and what the viewer will learn.

### The Main Content

**Purpose:** Deliver the value promised in hook and intro

**Best Practices:**
- Break into clear sections
- Use transitions
- Repeat key points
- Provide examples
- Address common objections
- Maintain energy
- Include visual references

**Transition Phrases:**
- "Now that we've covered X, let's move on to Y"
- "Here's where it gets interesting..."
- "The next point is crucial..."
- "Before we continue, quick note about..."

### The Conclusion

**Purpose:** Reinforce key takeaways, create satisfaction

**Elements:**
- Summarize main points
- Restate key benefit
- Final thoughts or reflection
- Bridge to CTA

### The Call to Action (CTA)

**Purpose:** Guide viewer to next action

**Types:**
- Subscribe: "If you found this helpful, subscribe for more..."
- Like/Comment: "Let me know in the comments..."
- Watch next: "Check out this video where I show you..."
- External link: "Grab my free guide in the description..."
- Social follow: "Follow me on Instagram for..."

**Best Practices:**
- One primary CTA
- Make it specific
- Explain the benefit
- Create urgency (if appropriate)

## Tone Guidelines

### Professional/Authoritative
- Confident language
- Industry terminology (with explanations)
- Cited sources
- Measured pace
- Clear structure

### Casual/Friendly
- Conversational language
- Personal anecdotes
- "You" and "I" language
- Relaxed structure
- Humor when appropriate

### Energetic/Enthusiastic
- Exclamation points
- Quick pace
- Dynamic vocabulary
- Momentum building
- High energy throughout

### Educational/Patient
- Clear explanations
- Step-by-step approach
- Anticipate questions
- Reassuring language
- Allow processing time

### Inspirational/Motivational
- Empowering language
- Story-driven
- Emotional connection
- Aspirational examples
- Encouraging tone

## Timing Guidelines

### Short Form (3-5 minutes)
- 450-750 words
- Single focused topic
- Quick hook (5 seconds)
- Streamlined content
- Fast pace

### Medium Form (7-12 minutes)
- 1,050-1,800 words
- 2-3 main points
- Standard hook (8-10 seconds)
- Moderate depth
- Balanced pace

### Long Form (15-30 minutes)
- 2,250-4,500 words
- Deep dive
- Strong hook (10-15 seconds)
- Multiple sections
- Varied pace

**Note for new channels:** Long form (15-30 min) is high-risk for channels with fewer than 10 uploads. Audience retention math makes hitting 40%+ APV very hard. Default to 7-9 minutes until retention is proven across 5-10 uploads.

## Engagement Techniques

### Pattern Interrupts
- Unexpected statements
- Questions
- Tone shifts
- Visual changes
- Sound effects

### Storytelling Elements
- Characters
- Conflict
- Resolution
- Emotional arc
- Relatability

### Social Proof
- Statistics
- Expert quotes
- Case studies
- Personal results
- Testimonials

### Curiosity Gaps
- Tease information
- "But here's the thing..."
- "Wait until you see..."
- "The surprising part is..."

## Common Script Mistakes to Avoid

1. **Burying the lede** — Get to the point quickly
2. **Rambling introduction** — Hook first, context later
3. **No clear structure** — Viewers need signposts
4. **Talking too fast** — Leave room for visuals
5. **Being too formal** — YouTube is conversational
6. **No personality** — Let your unique voice shine
7. **Forgetting the CTA** — Always guide next steps
8. **Too much information** — Focus on key takeaways
9. **No energy variation** — Monotone loses viewers
10. **Ignoring target audience** — Speak directly to them
11. **Fabricated statistics** — Every claim must be verifiable; cite sources for any specific number
12. **Wrong length for channel age** — New channels lose retention on long videos before earning the audience

## Visual Cues in Scripts

Include directions for yourself:

```
[B-roll: Show example of X]
[On-screen text: "Key Point"]
[Cut to close-up]
[Show product]
[Demonstrate step]
[Pause for emphasis]
[Smile/React]
```

These help during filming and editing.

## Audience-Specific Adjustments

### Beginners
- Define terminology
- Slower pace
- More examples
- Encouragement
- Step-by-step

### Intermediate
- Assume baseline knowledge
- Faster pace
- Advanced tips
- Comparisons
- Nuance

### Expert
- Industry language
- Quick pace
- Deep insights
- Technical details
- Cutting-edge info

## Platform-Specific Considerations

### YouTube Shorts (Under 60 seconds)
- Immediate hook
- Single point
- No intro
- Fast cuts
- Vertical format
- Text on screen

### YouTube Main Feed
- Strong thumbnail/title synergy
- 8-15 minute sweet spot
- Watch time optimization
- Chapter markers
- End screen elements

### Educational Content
- Thorough explanations
- Longer acceptable
- Downloadable resources
- Chapters crucial
- Timestamps helpful

## Examples

### Example 1: Generating VO for a 7-minute script

```bash
# Step 1: Write narration to a plain text file (script.txt)
# Step 2: Generate VO with the locked voice
edge-tts --voice en-US-AndrewMultilingualNeural \
         --file script.txt \
         --write-media output.mp3 \
         --write-subtitles output.vtt
```

### Example 2: Script narration formatted for the locked voice

```
Every frontier AI model now has a dial that controls how hard it thinks. <break time="300ms"/>
Turn it up and you'd expect better answers. <break time="500ms"/>
But when researchers tested GPT five last February, turning it to high actually
lowered accuracy — and cost fifty-six percent more.
<break time="800ms"/>
Same model. <break time="200ms"/> Higher setting. <break time="200ms"/> Worse results.
```

Notes on this example:
- "GPT five" not "GPT 5" — Andrew pronounces digits inconsistently
- "fifty-six percent" not "56 percent" — reads more naturally
- Em-dashes used for pause emphasis
- `<break>` tags for precise pause control

## Guidelines

### Always
- Use `en-US-AndrewMultilingualNeural` as the locked voice unless the user explicitly requests a substitution
- Spell out numbers under 10 and pronunciation-ambiguous figures
- Use em-dashes (—) for emphasis pauses
- Use `<break time="..."/>` for precise control
- Match script tone to channel positioning
- Default to 7-9 minute length for new channels

### Never
- Substitute a paid TTS service (ElevenLabs, PlayHT, etc.) without explicit user instruction
- Include API keys or credentials in scripts
- Write "Hey everyone, I'm [Name]" intros for faceless channels
- Use fabricated statistics or unverified claims
- Recommend 15-30 minute videos for channels with fewer than 10 uploads
