"""
Visual designer: per-bullet code lookup. NO subprocess to claude CLI.

For each animation bullet in the structured script, the renderer expects a
self-contained `React.createElement` function body. That code is authored
upstream — by Claude Code in-session via `seed_bullet_cache.py`, OR by hand —
and dropped into the cache directory before this module runs.

This module USED to spawn the `claude` CLI per bullet to generate code on
demand. That path was removed because:
  • the spawned CLI is its own Claude Code session, paying full system-prompt +
    context tokens for every one of 70+ bullets — extremely expensive
  • Claude Code refuses to launch inside Claude Code, so the spawn fails
    whenever the parent IS Claude Code anyway
  • the in-session author already has the structured script loaded and can
    write all bullets with shared context for a fraction of the tokens

Cache layout:
    storyboard/.cache/designs/
      bullet-s{scene}-b{idx}-{content_hash}.json   ← one JSON per bullet
                                                     {code, audio_anchor, source_headline}

When a bullet is missing from the cache, this module raises a clear error
naming the bullet and pointing to `storyboard/seed_bullet_cache.py`. It does
NOT silently fall back to a placeholder — silent placeholders shipped broken
videos in the past.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

from .source_parser import AnimationBullet, Scene  # noqa: F401

# Concurrency: how many bullets to look up in parallel. Lookups are now pure
# disk reads + JSON parses — parallelism mostly hides Windows file-stat latency.
DEFAULT_PARALLELISM = int(os.environ.get("DESIGNER_PARALLELISM", "8"))


# ─── paths ───
ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "storyboard" / ".cache" / "designs"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


# ─── output type ───
@dataclass
class VisualBlock:
    code: str                       # LLM-emitted React.createElement function body
    audio_anchor: str               # 2-4 word phrase from narration aligning with framesFrom
    time_from_sec: float
    time_to_sec: float
    source_headline: str
    anchor_mode: str = "appear"     # sync-to-meaning: appear (word_start) | through (start→end) | land (word_end)
    placeholder: bool = False       # True if codegen failed and a placeholder card was substituted
    placeholder_error: str = ""     # short error message for diagnostics (only set when placeholder=True)


# ─── color palette derived from config ───
_NON_COLOR_DESIGN_KEYS = frozenset({
    "font_display", "font_mono", "font_body",
    "dot_grid_opacity", "dot_grid_spacing",
    "spring_damping", "spring_stiffness",
    "fade_frames", "type_speed_cps",
})
_STRUCTURAL_COLOR_KEYS = frozenset({"bg", "surface", "text", "text_dim"})


def _color_palette(design_tokens: dict) -> list[str]:
    """Decorative-color slot names from `config.yaml design:`. No allowlist —
    derived purely from which keys hold a hex value and aren't structural."""
    palette: list[str] = []
    for name, value in design_tokens.items():
        if name in _NON_COLOR_DESIGN_KEYS or name in _STRUCTURAL_COLOR_KEYS:
            continue
        if isinstance(value, str) and value.startswith("#"):
            palette.append(name)
    return palette


# ─── cache ───
def _bullet_cache_key(scene: Scene, bullet_idx: int, design_tokens: dict) -> str:
    h = hashlib.sha256()
    b = scene.animation[bullet_idx]
    h.update(scene.narration.encode("utf-8"))                 # narration drives audio_anchor
    h.update(f"{bullet_idx}|{b.time_from_sec}-{b.time_to_sec}".encode("utf-8"))
    h.update(f"{b.headline}|{b.body}".encode("utf-8"))
    h.update(json.dumps(design_tokens, sort_keys=True).encode("utf-8"))
    h.update(b"prompt-v14-per-bullet")  # bump when prompt template changes
    return h.hexdigest()[:16]


# ─── prompt builders kept ONLY so callers / tooling can render the same
# prompt offline (e.g. seed_bullet_cache.py companion tools) — they are NOT
# invoked anywhere inside this module. There is no subprocess to feed.
def _make_system_prompt(design_tokens: dict) -> str:
    """Build the system prompt from project design tokens (no hardcoded values).

    Retained as a reference template for in-session bullet authoring. NOT used
    by `_design_bullet` — cache is the only source of truth at runtime."""
    palette = _color_palette(design_tokens)
    palette_str = ", ".join(palette)
    spring_damping = design_tokens.get("spring_damping")
    spring_stiffness = design_tokens.get("spring_stiffness")

    return f"""You are a video-direction LLM that writes Remotion scene code.

You receive ONE animation bullet at a time and emit ONE JavaScript function
body that returns ONE React element rendering that bullet as a self-contained
scene. You are NOT picking from a fixed primitive list — you are AUTHORING
the primitive directly from the bullet body. Bespoke cinematography (glass
shatter, vault doors, multi-tentacled metaphors, lie detectors, planets,
flap boards, ballistic arcs, etc.) is rendered as the bullet describes it.

## OUTPUT — exactly this JSON, nothing else

{{
  "code": "<function body — see RUNTIME below>",
  "audio_anchor": "<2-4 word phrase that exists verbatim in the narration>",
  "source_headline": "<the bullet's headline, copied verbatim>"
}}

No markdown fences. No commentary. JSON only.

## RUNTIME — what is in scope inside `code`

Your `code` is a function body. It runs every frame inside a Remotion
Sequence whose duration matches the bullet's time window. These bindings
are available; do NOT import anything:

  React              — use React.createElement and React.Fragment ONLY.
                       JSX is NOT supported (no Babel at runtime).
  frame              — current frame number, 0..durationInFrames-1
  fps                — frames per second (number)
  width, height      — video dimensions (number, number)
  durationInFrames   — duration of THIS block (use for block-relative timing)
  interpolate        — Remotion interpolate (frame, range, output, options)
  spring             — Remotion spring ({{frame, fps, config}})
  Easing             — Remotion Easing. Use as `interpolate(..., {{ easing: Easing.out(Easing.quad) }})`.
                       Variants: Easing.in, Easing.out, Easing.inOut.
                       Curves: Easing.quad, Easing.sin, Easing.exp, Easing.circle.
                       Custom: Easing.bezier(x1, y1, x2, y2). Default is linear.
  AbsoluteFill       — Remotion AbsoluteFill component (fills parent container)
  Sequence           — Remotion Sequence. Props:
                         from            — frame offset (int). Negative = trim animation start
                                           (child enters mid-motion). Default 0.
                         durationInFrames — trims the end. Omit to fill remaining block.
                         layout          — 'absolute-fill' (default, wraps child in AbsoluteFill)
                                           | 'none' (no wrapper — use when child positions itself).
                         premountFor     — ALWAYS set to fps (1 second). Pre-renders the child
                                           before it becomes visible, preventing a flash-of-blank.
                       Example (staggered reveal):
                         React.createElement(Sequence, {{from: 0,      premountFor: fps}}, titleEl)
                         React.createElement(Sequence, {{from: fps*0.5, premountFor: fps}}, subtitleEl)
                       Inside a Sequence, frame resets to 0 — animate relative to that local 0.
                       Nested Sequences for complex timing (background + staggered foreground):
                         React.createElement(Sequence, {{from: 0, durationInFrames: durationInFrames}},
                           backgroundEl,
                           React.createElement(Sequence, {{from: 15, layout: 'none'}}, titleEl),
                           React.createElement(Sequence, {{from: 30, layout: 'none'}}, subtitleEl)
                         )
  Series             — Sequential playback with no gap. Children MUST be Series.Sequence.
                       Use Series when items play one-after-another; Sequence for precise offsets.
                       React.createElement(Series, null,
                         React.createElement(Series.Sequence, {{durationInFrames: fps*1.5}}, stepAEl),
                         React.createElement(Series.Sequence, {{durationInFrames: fps*2}},   stepBEl),
                         React.createElement(Series.Sequence, {{offset: -10, durationInFrames: fps}}, stepCEl)
                       )
                       offset: negative = starts N frames before previous item ends (cross-fade/overlap).
  Img                — Remotion Img component. ALWAYS use this, NEVER use HTML <img> or
                       CSS background-image — they break during headless render.
                       React.createElement(Img, {{ src: staticFile('public/logo.png'), style: {{...}} }})
  staticFile         — staticFile(path) → URL. Remotion's publicDir is projects/<name>/, so:
                       • files in projects/<name>/public/ → staticFile('public/filename.ext')
                       • files in projects/<name>/icons/  → staticFile('icons/filename.ext')
                       ALWAYS prefix with the subfolder — never omit it.
                       USE THIS for any asset the bullet body references (logos, screenshots,
                       SVGs, photos). The bullet body's [asset: ...] tag gives the filename.
  D                  — design tokens object. Available keys (use these,
                       never hex literals): {", ".join(sorted(design_tokens.keys()))}
  resolveColor       — (name) => hex; use to resolve token names
  fitText            — fitText({{ text, withinWidth, fontFamily, fontWeight }}) → {{ fontSize }}.
                       USE THIS for any user-supplied long string (titles, quotes, labels)
                       so it auto-shrinks instead of clipping. fontFamily MUST be D.font_display
                       or D.font_mono — Root.tsx awaits these fonts before render begins;
                       any other fontFamily gives wrong measurements.
                       Always cap: Math.min(fitText({{...}}).fontSize, Math.round(width * 0.06))
  measureText        — measureText({{ text, fontFamily, fontSize, fontWeight }}) → {{ width, height }}.
                       Use for centering/positioning that needs actual rendered size.
                       Same font constraint as fitText — only D.font_display / D.font_mono.
  fillTextBox        — fillTextBox({{ lines, box }}) → {{ lines, exceedsBox }}.
                       Use to detect overflow: if exceedsBox is true, reduce font size and retry.
                       box = {{ maxLines: N, maxWidth: px }}.
  AnimatedImage      — Remotion AnimatedImage for GIF/APNG/WebP animated assets.
                       React.createElement(AnimatedImage, {{
                         src: staticFile('public/animation.gif'),
                         width: Math.round(width * 0.5),
                         height: Math.round(height * 0.4),
                         fit: 'contain',              // 'fill' | 'contain' | 'cover'
                         loopBehavior: 'loop',         // 'loop' | 'pause-after-finish' | 'clear-after-finish'
                         playbackRate: 1,
                         style: {{ position:'absolute', top: height*0.3, left: width*0.25 }}
                       }})
                       NEVER use <img> or <Img> for animated GIFs — only AnimatedImage syncs with timeline.
  TransitionSeries   — @remotion/transitions for smooth multi-step sequences within a bullet.
                       React.createElement(TransitionSeries, null,
                         React.createElement(TransitionSeries.Sequence, {{durationInFrames: Math.round(durationInFrames*0.45)}}, stepAEl),
                         React.createElement(TransitionSeries.Transition, {{
                           presentation: fade(),
                           timing: linearTiming({{durationInFrames: 10}})
                         }}),
                         React.createElement(TransitionSeries.Sequence, {{durationInFrames: Math.round(durationInFrames*0.45)}}, stepBEl)
                       )
                       NOTE: total duration = sum(sequences) - sum(transition durations). Budget accordingly.
  linearTiming       — linearTiming({{durationInFrames: N}}) — constant-speed transition timing.
  springTiming       — springTiming({{config: {{damping:200}}, durationInFrames: N}}) — organic timing.
  fade               — fade() — cross-dissolve between two elements.
  slide              — slide({{direction: 'from-left'}}) — slide in from direction.
                       Directions: 'from-left' | 'from-right' | 'from-top' | 'from-bottom'
  wipe               — wipe({{direction: 'from-left'}}) — wipe reveal transition.
  Video              — @remotion/media <Video> for mp4/webm clip playback (blocks frame until loaded).
                       ALWAYS run canDecode check before referencing a video asset (rule 17).
                       React.createElement(Video, {{
                         src: staticFile('public/clip.mp4'),
                         startFrom: 0,
                         endAt: Math.round(durationInFrames * 0.9),
                         volume: 0,
                         style: {{ width: Math.round(width*0.7), height: Math.round(height*0.6),
                                   position:'absolute', top: height*0.2, left: width*0.15 }}
                       }})
                       H.264/mp4 safe. AV1/HEVC may render black — run canDecode first.
  Audio              — @remotion/media <Audio> for in-bullet SFX (rare; TTS track is the main audio).
                       React.createElement(Audio, {{ src: staticFile('public/sfx.mp3'), volume: 0.5 }})

The function body MUST return a single React element (or null). Wrap
multiple top-level elements in React.createElement(React.Fragment, null, ...).

## ANIMATION RULES — Remotion contract

- All animation comes from `frame`. FORBIDDEN (will not animate during render):
    CSS keyframes, CSS transitions, `animation:` declarations, Tailwind animation classes.
  Drive everything from `interpolate(frame, ...)` or `spring({{frame, fps, ...}})`.
- Use interpolate(frame, [inFrame, outFrame], [from, to], {{ extrapolateLeft:'clamp', extrapolateRight:'clamp' }})
  for any value that changes over time.
- spring() outputs 0→1. Map to any range with interpolate:
    const progress = spring({{frame, fps, config: {{damping: 20, stiffness: 200}}}});
    const scale = interpolate(progress, [0, 1], [0.8, 1]);

- spring() built-in delay and duration (prefer over manual frame offsets):
    spring({{frame, fps, delay: 20}})                  — starts 20 frames in
    spring({{frame, fps, durationInFrames: fps * 1.5}}) — stretches spring to 1.5s
    spring({{frame, fps, delay: 20, config: {{damping: 8}}}}) — delayed bouncy entrance
  Manual stagger for lists: spring({{frame: frame - idx * 12, fps, config}})

- Spring in+out (element enters then exits within same block):
    const inSp  = spring({{frame, fps, config: {{damping: 200}}}});
    const outSp = spring({{frame, fps, durationInFrames: fps, delay: durationInFrames - fps}});
    const scale = inSp - outSp;   // 0→1 on entry, 1→0 on exit

- Project default spring: damping={spring_damping}, stiffness={spring_stiffness}.
  Use preset table (QUALITY GATES section) — project default is last resort only.

- IMPORTANT: interpolate does NOT clamp by default. ALWAYS add:
    interpolate(frame, [a, b], [x, y], {{ extrapolateLeft:'clamp', extrapolateRight:'clamp' }})
- IMPORTANT: any `[inFrame, outFrame]` range you pass to interpolate MUST
  satisfy outFrame > inFrame. Use Math.max(inFrame + 1, outFrame) defensively.
- frame is block-relative (starts at 0 each block) — do not assume a global frame counter.

- Easing — combine convexity + curve:
    Easing.inOut(Easing.quad)    — smooth in-out (most common)
    Easing.out(Easing.exp)       — fast start, slow settle
    Easing.in(Easing.circle)     — slow start, sharp finish
    Easing.bezier(0.42,0,0.58,1) — CSS ease-in-out equivalent
  Default is linear — always specify easing for non-mechanical motion.

- Negative `from` on Sequence trims the start of an animation (entry mid-motion):
    React.createElement(Sequence, {{from: -15, premountFor: fps}}, child)
    Child's local frame starts at 15 when visible — enters already in motion.

### Text animation patterns
- Typewriter (progressive reveal): drive character count from frame. N frames per char controls speed.
    const CHAR_FRAMES = 2;  // 2 frames per char ≈ fast; 4 = slow deliberate
    const charsToShow = Math.min(text.length, Math.floor(frame / CHAR_FRAMES));
    const visible = text.slice(0, charsToShow);
    // Blinking cursor: interpolate on frame % blinkCycle
    const BLINK = 16;
    const cursorOpacity = interpolate(frame % BLINK, [0, BLINK/2, BLINK], [1, 0, 1],
      {{extrapolateLeft:'clamp', extrapolateRight:'clamp'}});
    // Render: React.createElement('span', null, visible, React.createElement('span', {{style:{{opacity:cursorOpacity}}}}, '▌'))
  NEVER animate per-character opacity in a loop — it creates N elements and kills performance.
- Word highlight wipe (spring scaleX behind the word — dramatic, not just color swap):
    const scaleX = Math.min(1, spring({{frame, fps, config:{{damping:200}}, delay: startFrame, durationInFrames: 18}}));
    // Outer span: position:relative, display:inline-block
    // Inner highlight span: position:absolute, left:0, right:0, top:'50%', height:'1.05em',
    //   transform: `translateY(-50%) scaleX(${{scaleX}})`, transformOrigin:'left center',
    //   backgroundColor: D.amber (or D.cyan), borderRadius: '0.18em', zIndex:0
    // Text span: position:relative, zIndex:1
    // Compose: [highlight-bg-span, text-span] inside outer span

## DESIGN RULES — what to draw

- Only use colors from the project palette: {palette_str}.
  Reference them as D.<name> (e.g. D.{palette[0] if palette else 'white'}).
  Never use hex literals.
- Use D.font_display for hero text, D.font_mono for technical labels.
- Background and structural surfaces: D.bg, D.surface, D.text, D.text_dim.
- Focus on the SINGLE most important idea in the bullet body. Don't pack
  everything onto one screen.
- Show what the narration is literally saying at that moment. If the script
  says "octopus with 8 tentacles each grabbing a tool", draw eight curved
  tentacle paths radiating from a central body, with a tool icon at each tip.
- Big legible text. High contrast. Position elements with absolute coords
  inside a wrapping div with style {{position:'absolute', inset:0}}.
  Use `width` and `height` runtime values to place things proportionally
  (e.g. left: width*0.5).

## QUALITY GATES — enforced minimums (violating these produces a bad scene)

### Canvas utilization
- Main visual element MUST cover ≥60% of canvas width × height.
  A lone card at 20% width reads as empty on a 1920×1080 canvas.
  Fill the frame. Scale hero elements to Math.round(width * 0.6) or wider.
- Nothing that carries meaning should be smaller than Math.round(width * 0.02) wide.
- Margins from canvas edge: ≥ Math.round(width * 0.04) on each side.

### Typography — proportional to canvas width, never hardcoded px
- Hero / title text:  fontSize = Math.round(width * 0.024)   (~46px at 1920w)
- Body / explanation: fontSize = Math.round(width * 0.012)   (~23px at 1920w)
- Label / caption:    fontSize = Math.round(width * 0.009)   (~17px at 1920w)
- Always cap fitText results: Math.min(fitText({{...}}).fontSize, Math.round(width * 0.06))

### Phase timing — fractions, never frame literals
- Multi-step animations MUST use durationInFrames fractions as phase boundaries:
    phase1End = Math.round(durationInFrames * 0.30)
    phase2End = Math.round(durationInFrames * 0.60)
    phase3End = Math.round(durationInFrames * 0.90)
  This way the animation rescales automatically if the bullet's frame range changes.

### Stagger for lists
- For any list of 2+ items: stagger entrance by 10–12 frames per item.
    delay = itemIndex * 12  →  spring({{frame: frame - delay, fps, config}})
  Less than 8 frames = items blur together. More than 15 = feels sluggish.

### Spring presets — match intent (PRESET WINS over project default)
Pick the preset that matches the bullet's visual intent. The project default
({spring_damping}/{spring_stiffness}) is a fallback — use it ONLY when none of
the four intents below apply. If the bullet says "snappy", "bouncy", "dramatic",
or "subtle", use the matching preset regardless of project default.

- Snappy (cards, UI labels, badges, list items):  {{damping: 20, stiffness: 200}}
- Bouncy (hero numbers, punchlines, big reveals):  {{damping: 8}}
- Smooth (subtle backdrop reveals, ambient):       {{damping: 200}}
- Heavy (dramatic entrances, vault doors):         {{damping: 15, stiffness: 80, mass: 2}}
- Project default ({spring_damping}/{spring_stiffness}): use when bullet has no motion intent cue.

### Never static
- Every bullet MUST animate at least one property across its duration.
  No element may sit at full opacity from frame 0 — fade or spring in from 0.
  If the bullet window is short (< 2s), a fast spring-in + hold is fine.

### No text overlap — explicit positioning contract
- NEVER place two text elements at the same top/left coordinates.
- When stacking elements vertically, compute each element's top from the
  previous element's bottom:
    const line1Top  = height * 0.30;
    const line2Top  = line1Top + fontSize1 + gap;   // gap ≥ Math.round(height * 0.03)
    const line3Top  = line2Top + fontSize2 + gap;
  Do NOT guess fixed pixel offsets like top:400 — they collide on different content lengths.
- For label + value pairs (e.g. "Step 1" above a big number), reserve explicit
  vertical bands: label in top 30%, value in middle 40%, sub-label in bottom 30%.
- When using flexDirection:'column', always set gap ≥ Math.round(height * 0.025)
  between children so they never touch.
- Never let text overflow its container. Set maxWidth on every text element:
    maxWidth: Math.round(width * 0.80)
  and add overflow:'hidden', textOverflow:'ellipsis' for single-line labels,
  or whiteSpace:'pre-wrap' for multi-line bodies.
- For horizontally placed cards/columns (2–4 across), compute each card's left
  from its index:
    const cardW = Math.round(width * 0.20);
    const totalW = cards.length * cardW + (cards.length - 1) * gap;
    const startX = (width - totalW) / 2;
    const cardLeft = startX + idx * (cardW + gap);
  Never hardcode card positions — they overlap at different counts.

## NO-BLEED CONTRACT — ZERO TOLERANCE

1. PROP VALUES come from THIS bullet body and THIS scene's narration ONLY.
   Every string, number, percentage, label, and stat on screen MUST be
   copied verbatim from the bullet body or narration. If it's not there, it
   does not appear on screen.

2. NUMBERS AND PERCENTAGES — hardest rule:
   - NEVER invent a number, percentage, score, or statistic.
   - If the bullet says "86%" → show 86%. If the bullet says nothing → show nothing.
   - A fabricated "86%" on screen while the narrator says something unrelated
     destroys viewer trust and makes the scene nonsensical.

3. Field counts match the bullet body EXACTLY — never add extra items to
   "look balanced". If bullet says 3 cards, render 3 cards, not 4.

4. audio_anchor MUST be a verbatim phrase from the OPENING of the narration shown to you.
   Pick the first 2-4 words the narrator says when THIS visual FIRST APPEARS on screen.
   RULE: anchor = the OPENING words of this block's topic, never a climax/ending phrase.
   BAD: block shows NVIDIA quote → anchor "limb amputated" (end of sentence — fires too late)
   GOOD: block shows NVIDIA quote → anchor "Fact one" or "an NVIDIA" (opening words — fires on time)
   The anchor is a START marker, not a highlight. Always choose from the first sentence.

5. NEVER invent placeholder content: no "Untitled", "Lorem ipsum", "Example",
   "Sample", "N/A", "TBD", or any text not present in the bullet body.

6. SENSE CHECK before emitting: ask yourself "Does this visual directly
   illustrate what the narrator is saying at this exact moment?" If no → redesign.
   The visual must be the image version of the spoken words, not a decoration.

## CODE STYLE

- Use `const` for everything. No imports, no `require`, no top-level `await`.
- Inline styles only — no CSS files, no className.
- Keep the body under ~150 lines; for repeated elements use Array.from + map
  rather than copy-paste.
- Strings with quotes inside: escape per JSON rules in the `code` field.

Output JSON only. No prose. No markdown fences."""


def _narration_for_bullet(scene: Scene, bullet_idx: int) -> str:
    """Return narration sentences that overlap with this bullet's time window.

    Uses proportional sentence assignment: splits narration into sentences,
    maps each sentence to a [0,1] position based on its index, and returns
    sentences whose position overlaps the bullet's time-window fraction.
    This gives the LLM the exact words spoken while this visual is on screen
    so it can constrain on-screen text to match narration."""
    import re as _re
    b = scene.animation[bullet_idx]
    scene_dur = scene.window_to_sec - scene.window_from_sec
    if scene_dur <= 0:
        return scene.narration
    sentences = _re.split(r"(?<=[.!?])\s+", scene.narration.strip())
    if not sentences:
        return scene.narration
    b_start = b.time_from_sec / scene_dur
    b_end = b.time_to_sec / scene_dur
    n = len(sentences)
    assigned = [s for i, s in enumerate(sentences)
                if (i / n) < b_end and ((i + 1) / n) > b_start]
    return " ".join(assigned) if assigned else scene.narration


def _make_bullet_prompt(scene: Scene, bullet_idx: int) -> str:
    bullet = scene.animation[bullet_idx]
    bullet_narration = _narration_for_bullet(scene, bullet_idx)
    return f"""SCENE {scene.number} — "{scene.title}"

## Words the narrator speaks DURING this visual (your on-screen text MUST come from these words)
{bullet_narration}

## Full scene narration (for CONTEXT ONLY — do NOT pick audio_anchor from here; pick from the OPENING WORDS section above)
{scene.narration}

## THIS bullet (you are designing only this one)

bullet {bullet_idx + 1} of {len(scene.animation)} — window {bullet.time_from_sec:.0f}-{bullet.time_to_sec:.0f}s
HEADLINE: {bullet.headline}
BODY: {bullet.body}

## HARD RULE — USE NARRATION_TEXT FOR ALL ON-SCREEN TEXT
The constant `NARRATION_TEXT` is automatically prepended to your code and contains
the exact words the narrator speaks while this visual is on screen.

- Use `NARRATION_TEXT` (or sub-strings of it) for ALL text you display on screen.
- DO NOT write any string literals for user-visible text. Use NARRATION_TEXT.
- You MAY split NARRATION_TEXT into words or sentences using .split() in JS.
- The bullet BODY may have quoted labels — those are guaranteeed to appear in NARRATION_TEXT.
- Violating this causes audio/visual mismatch flagged by QA.

## Task

Return ONE JSON object: {{"code": "...", "audio_anchor": "...", "source_headline": "..."}}.
Inside `code`, ALL of the following bindings are in scope (use them freely):
  React, frame, fps, width, height, durationInFrames,
  interpolate, spring, Easing,
  AbsoluteFill, Sequence, Series,
  Img, staticFile, AnimatedImage,
  TransitionSeries, linearTiming, springTiming, fade, slide, wipe,
  Video, Audio,
  D, resolveColor, fitText, measureText, fillTextBox,
  captions, findWord,
  NARRATION_TEXT  ← string of narration words spoken during this visual (use for all text)
DO NOT use JSX. DO NOT use imports. DO NOT use hex color literals.

Output JSON only — no markdown fences, no commentary."""


def _generate_spotlight_code(scene: Scene, bullet_idx: int) -> tuple[str, str]:
    """Deterministic SPOTLIGHT code — no LLM. All items visible, one highlighted
    at a time via findWord() as narrator mentions each item.

    Returns (code, audio_anchor). The audio_anchor is the first item's first word."""
    bullet = scene.animation[bullet_idx]
    items = bullet.spotlight_items or []
    n = len(items)
    colors = ['D.cyan', 'D.violet', 'D.amber', 'D.green', 'D.red']

    def _first_word(label: str) -> str:
        words = re.findall(r'[a-zA-Z][a-zA-Z0-9]*', label)
        return words[0] if words else label

    anchor_words = [_first_word(item) for item in items]

    thresh_vars = '\n'.join(
        f"const _st{i} = findWord({json.dumps(anchor_words[i])}) ?? {0 if i == 0 else 99999};"
        for i in range(n)
    )
    items_js = ',\n'.join(
        f"  {{label: {json.dumps(item)}, color: {colors[i % len(colors)]}}}"
        for i, item in enumerate(items)
    )
    thresh_list = ', '.join(f'_st{i}' for i in range(n))

    code = f"""const __bgOp = interpolate(frame, [0, 10], [0, 1], {{extrapolateLeft:'clamp', extrapolateRight:'clamp'}});
const __backdrop = React.createElement(AbsoluteFill, {{style: {{backgroundColor: D.bg, opacity: __bgOp, pointerEvents: 'none'}}}});
const _intro = interpolate(frame, [0, 20], [0, 1], {{extrapolateLeft:'clamp', extrapolateRight:'clamp'}});
const _items = [
{items_js}
];
{thresh_vars}
const _thresh = [{thresh_list}];
let _activeIdx = 0;
for (let _ii = _thresh.length - 1; _ii >= 0; _ii--) {{
  if (frame >= _thresh[_ii]) {{ _activeIdx = _ii; break; }}
}}
const _els = _items.map((itm, idx) => {{
  const _on = idx === _activeIdx;
  return React.createElement('div', {{
    key: idx,
    style: {{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '28px 32px', borderRadius: 20,
      backgroundColor: _on ? itm.color + '18' : D.surface,
      border: '3px solid ' + (_on ? itm.color : D.surface),
      opacity: _intro * (_on ? 1.0 : 0.22),
      transform: 'scale(' + (_on ? 1.05 : 1.0) + ')',
    }},
  }},
    React.createElement('div', {{
      style: {{fontFamily: D.font, fontSize: 34, fontWeight: 900,
               color: _on ? itm.color : D.text_dim, letterSpacing: 2, textAlign: 'center'}},
    }}, itm.label),
  );
}});
return React.createElement(AbsoluteFill, null,
  __backdrop,
  React.createElement('div', {{
    style: {{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'row',
             alignItems: 'center', justifyContent: 'center', gap: 32, padding: '0 72px'}},
  }}, ..._els),
);"""
    return code, anchor_words[0]


# ─── cache-miss diagnostic ───
class CacheMissError(RuntimeError):
    """A bullet has no cached design and this module no longer spawns claude CLI.

    The user (or a calling Claude Code session) must seed the cache via
    `storyboard/seed_bullet_cache.py` before re-running the pipeline."""


def _strip_js_comments(code: str) -> str:
    """Remove // line and /* block */ comments from JS — kept as a public helper
    for validators that want to look past commented-out React.createElement calls."""
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)
    code = re.sub(r"//[^\n]*", "", code)
    return code


def _validate_cached_entry(parsed: dict, scene: Scene, bullet_idx: int) -> None:
    """Sanity-check a cache file we loaded. Catches corrupted / truncated cache
    entries before they reach the renderer."""
    code = parsed.get("code", "")
    if not isinstance(code, str) or not code.strip():
        raise RuntimeError(
            f"scene {scene.number} bullet {bullet_idx + 1}: cache file has empty/missing `code` field"
        )
    code_no_comments = _strip_js_comments(code)
    if ("React.createElement" not in code_no_comments
            and "React.Fragment" not in code_no_comments):
        raise RuntimeError(
            f"scene {scene.number} bullet {bullet_idx + 1}: cached `code` has no "
            f"React.createElement call — cache file is corrupt"
        )

    anchor = parsed.get("audio_anchor", "").strip()
    if anchor:
        def _tokens(s: str) -> list[str]:
            return re.findall(r"[a-z0-9]+", s.lower())

        narr_tokens = _tokens(scene.narration)
        anchor_tokens = _tokens(anchor)
        if anchor_tokens:
            n = len(anchor_tokens)
            matched = any(narr_tokens[i:i + n] == anchor_tokens
                          for i in range(len(narr_tokens) - n + 1))
            if not matched:
                raise RuntimeError(
                    f"scene {scene.number} bullet {bullet_idx + 1}: cached audio_anchor "
                    f"{anchor!r} is not a verbatim phrase in narration — re-seed this bullet"
                )


def _design_bullet(
    scene: Scene,
    bullet_idx: int,
    design_tokens: dict,
) -> VisualBlock:
    """Look up ONE bullet from cache. NEVER spawns claude CLI.

    SPOTLIGHT bullets bypass the cache — code is generated deterministically.
    All bullets get NARRATION_TEXT prepended so the narration words are always
    available as a constant in bullet code.

    Raises CacheMissError when the cache file is absent for non-SPOTLIGHT bullets."""
    bullet = scene.animation[bullet_idx]
    narration_text = _narration_for_bullet(scene, bullet_idx)
    narration_preamble = f'const NARRATION_TEXT = {json.dumps(narration_text)};\n'

    # SPOTLIGHT: deterministic, no cache needed
    if bullet.spotlight_items:
        code, anchor = _generate_spotlight_code(scene, bullet_idx)
        return VisualBlock(
            code=narration_preamble + code,
            audio_anchor=anchor,
            time_from_sec=bullet.time_from_sec,
            time_to_sec=bullet.time_to_sec,
            source_headline=bullet.headline,
        )

    key = _bullet_cache_key(scene, bullet_idx, design_tokens)
    cache_file = CACHE_DIR / f"bullet-s{scene.number}-b{bullet_idx + 1}-{key}.json"

    if not cache_file.exists():
        # Build a precise, actionable error so the operator knows exactly what
        # to seed. Bullet body is included so it can be pasted into a follow-up
        # session as the input to author the React code from.
        try:
            display_path = cache_file.relative_to(ROOT)
        except ValueError:
            # Tests monkeypatch CACHE_DIR to a tmp dir outside ROOT — fall back
            # to absolute path so the error message stays useful.
            display_path = cache_file
        raise CacheMissError(
            f"scene {scene.number} bullet {bullet_idx + 1}: cache miss\n"
            f"  expected: {display_path}\n"
            f"  headline: {bullet.headline}\n"
            f"  body:     {bullet.body[:300]}{'…' if len(bullet.body) > 300 else ''}\n"
            f"  window:   {bullet.time_from_sec:.1f}-{bullet.time_to_sec:.1f}s\n"
            f"\n"
            f"  Seed it via: python storyboard/seed_bullet_cache.py "
            f"<script_path> --scene {scene.number} --bullet {bullet_idx + 1} "
            f"--anchor '<verbatim narration phrase>' --code-file <path/to/code.js>\n"
            f"  Or batch via: python storyboard/seed_bullet_cache.py "
            f"<script_path> --json <bundle.json>"
        )

    parsed = json.loads(cache_file.read_text(encoding="utf-8"))
    _validate_cached_entry(parsed, scene, bullet_idx)

    _mode = str(parsed.get("anchor_mode", "appear")).strip().lower()
    if _mode not in ("appear", "through", "land"):
        _mode = "appear"

    return VisualBlock(
        code=narration_preamble + parsed["code"],  # NARRATION_TEXT always available
        audio_anchor=parsed.get("audio_anchor", "").strip(),
        time_from_sec=bullet.time_from_sec,
        time_to_sec=bullet.time_to_sec,
        source_headline=bullet.headline,
        anchor_mode=_mode,
    )


def design_scene(
    scene: Scene,
    design_tokens: dict,
    parallelism: int | None = None,
    strict_fidelity: bool = False,  # accepted for backward-compat; lookups never fall back to placeholders
) -> list[VisualBlock]:
    """Look up all bullets of one scene from cache, in parallel.

    Any cache miss raises — there is NO silent placeholder fallback now that
    the codegen subprocess is gone. Run `seed_bullet_cache.py` first to fill
    the cache, then re-run the pipeline."""
    n = len(scene.animation)
    workers = max(1, min(n, parallelism or DEFAULT_PARALLELISM))

    print(f"      [scene {scene.number}] cache lookup for {n} bullets ({workers} parallel workers)...")
    results: dict[int, VisualBlock] = {}
    misses: list[str] = []

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {
            ex.submit(_design_bullet, scene, i, design_tokens): i
            for i in range(n)
        }
        completed = 0
        for fut in as_completed(futures):
            i = futures[fut]
            try:
                results[i] = fut.result()
                completed += 1
                print(f"        OK  bullet {i + 1}/{n} ({completed}/{n} complete)")
            except CacheMissError as e:
                misses.append(str(e))
                print(f"        MISS bullet {i + 1}/{n} — cache file absent")
            except Exception as e:
                misses.append(f"scene {scene.number} bullet {i + 1}: {e}")
                print(f"        ERR bullet {i + 1}/{n} — {e}")

    if misses:
        joined = "\n\n".join(misses)
        raise RuntimeError(
            f"[scene {scene.number}] {len(misses)} of {n} bullet(s) missing from cache. "
            f"Seed them via storyboard/seed_bullet_cache.py before re-running the pipeline.\n\n"
            f"{joined}"
        )

    return [results[i] for i in range(n)]


def design_script(
    scenes: list[Scene],
    design_tokens: dict,
    parallelism: int | None = None,
    strict_fidelity: bool = False,
) -> dict[int, list[VisualBlock]]:
    """Design every scene; returns {scene_number: [VisualBlock, ...]}."""
    return {sc.number: design_scene(sc, design_tokens, parallelism, strict_fidelity) for sc in scenes}


# ─── self-test ───
if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    from .source_parser import parse
    if len(sys.argv) < 3:
        print("Usage: python visual_designer.py <path/to/source.txt> <path/to/config.yaml> [--scene N] [--parallelism N]")
        sys.exit(1)
    src = sys.argv[1]
    cfg_path = sys.argv[2]
    scene_only = None
    parallel = None
    args = sys.argv[3:]
    while args:
        a = args.pop(0)
        if a == "--scene": scene_only = int(args.pop(0))
        elif a == "--parallelism": parallel = int(args.pop(0))
    import yaml
    cfg = yaml.safe_load(Path(cfg_path).read_text(encoding="utf-8"))
    script = parse(src)
    target_scenes = [s for s in script.scenes if scene_only is None or s.number == scene_only]
    designs = {s.number: design_scene(s, cfg["design"], parallel) for s in target_scenes}
    for n, blocks in designs.items():
        print(f"\n-- Scene {n} ({len(blocks)} blocks)")
        for b in blocks:
            preview = b.code.replace("\n", " ")[:60]
            print(f"   anchor='{b.audio_anchor}' from={b.time_from_sec}s code={preview}...")
