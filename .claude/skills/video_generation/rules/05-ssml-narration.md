---
name: ssml-narration
description: How to write SSML for dramatic, non-flat narration. Auto-emphasis on hero words, breaks on em-dashes, prosody on punchlines.
metadata:
  tags: ssml, narration, tts, edge-tts, emphasis, prosody, voice
---

# SSML Narration

> **STATUS: ACTIVE.** `storyboard/ssml_compiler.py` is wired into Step 4 of
> `build_video.py`. Plain narration from the structured script (`projects/structured_scripts/<name>.txt`) is auto-converted to SSML
> with emphasis on hero words, pauses on em-dashes, and punchline prosody on
> the last sentence of each scene. Per-scene `### Pacing` overrides are honored.

`storyboard/ssml_compiler.py` converts plain narration text to SSML before passing to edge-tts.

## Why SSML matters

Without SSML, edge-tts produces flat monotone narration. With SSML:
- Hero words (numbers, key concepts) get emphasis + slight slowdown
- Em-dashes get natural pauses
- Last sentence of each scene gets lower pace + higher pitch (punchline delivery)
- Per-scene pacing overrides from `### Pacing` block in the structured script

## SSML tags edge-tts supports

```xml
<speak>
  <!-- Emphasis: "strong", "moderate", "reduced" -->
  <emphasis level="strong">ONE MILLION</emphasis>

  <!-- Prosody: rate, pitch, volume -->
  <prosody rate="-15%" pitch="+5%">final punchline sentence.</prosody>

  <!-- Break: pause in milliseconds -->
  <break time="400ms"/>
</speak>
```

## ssml_compiler.py rules

### Rule 1: Wrap everything in `<speak>`
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  ...
</speak>
```

### Rule 2: Numbers and ALL-CAPS words → emphasis + slow
Find: numbers (digits or written-out), and words in ALL CAPS in the narration.
```xml
<emphasis level="strong"><prosody rate="-15%">ONE MILLION</prosody></emphasis>
```

### Rule 3: Em-dashes → pause
Replace ` — ` with `<break time="400ms"/>`:
```
"almost nobody noticed — but the engineers who did"
→ "almost nobody noticed<break time='400ms'/> but the engineers who did"
```

### Rule 4: End-of-paragraph → break
Add `<break time="300ms"/>` at the end of each narration paragraph (sentence ending in `.`).

### Rule 5: Last sentence → punchline prosody
Wrap the last sentence of each scene narration:
```xml
<prosody rate="-10%" pitch="+5%">They never looked back.</prosody>
```

### Rule 6: Per-scene `### Pacing` overrides
If source scene has `### Pacing: rate=-8% emphasis=heavy`:
- `rate=-8%` → wrap entire scene narration in `<prosody rate="-8%">`
- `emphasis=heavy` → use `level="strong"` (default is `level="moderate"`)

## config.yaml voice settings

The voice is one of the FOUR pinned constants per rule 00 §2a — do not override per-project:

```yaml
audio:
  voice: en-US-AndrewMultilingualNeural   # pipeline-pinned constant (rule 00 §2a)
  rate: "+0%"                              # base rate (per-scene Pacing overrides this via SSML)
  pitch: "+0Hz"                            # base pitch
  full_audio_filename: vo-<name>-full.mp3
```

The pipeline-pinned voice is `en-US-AndrewMultilingualNeural` (warm, confident, well-suited for tech
explainers and benchmarks). Per rule 00 Critical Contract #8 (in SKILL.md), `audio.voice` is one of
4 pipeline constants and never changes per-project. To switch the channel's voice globally, update
both rule 00 §2a and this rule together.

## Example input → SSML output

**Input narration:**
```
In 2024, something shifted. ONE MILLION lines of code — written by machines.
Almost nobody noticed. But the engineers who did — they never looked back.
```

**Output SSML:**
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
<prosody rate="-5%">
In 2024, something shifted.<break time="300ms"/>
<emphasis level="strong"><prosody rate="-15%">ONE MILLION</prosody></emphasis> lines of code<break time="400ms"/> written by machines.<break time="300ms"/>
Almost nobody noticed.<break time="300ms"/>
<prosody rate="-10%" pitch="+5%">But the engineers who did<break time="400ms"/> they never looked back.</prosody>
</prosody>
</speak>
```

## Hero word detection algorithm

```python
def find_hero_words(narration: str, animation_bullets: list[AnimationBullet]) -> list[str]:
    heroes = []
    # 1. All-caps words in narration
    heroes += re.findall(r'\b[A-Z]{2,}\b', narration)
    # 2. Numbers (digit strings)
    heroes += re.findall(r'\b\d[\d,\.]*\b', narration)
    # 3. Words from animation bullet headlines that also appear in narration
    for b in animation_bullets:
        for word in b.headline.split():
            w = word.strip('.*:,').upper()
            if len(w) > 4 and w in narration.upper():
                heroes.append(w)
    return list(set(heroes))
```

## TTS hash / cache

The hash for TTS caching is `sha256(full_ssml_text)`.
If SSML changes (e.g. you add emphasis), delete the hash marker file in `projects/<name>/audio/`:
```
projects/<name>/audio/.<filename>.mp3.<hash>.hash
```
This forces a fresh TTS generation.
