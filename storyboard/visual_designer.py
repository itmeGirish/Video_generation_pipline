"""
Visual designer: per-bullet code generation, parallelized.

For each animation bullet in the structured script, the LLM emits a
self-contained `React.createElement` function body that renders the bullet
as a Remotion scene. The renderer's `DynamicBlock.tsx` compiles + invokes
this code per frame.

There is NO fixed primitive registry. The "primitive" for each bullet is
derived directly from the bullet body — so bespoke cinematography (glass
shatter, vault doors, multi-tentacled metaphors, lie detectors, planets,
flap boards, ballistic arcs, etc.) is rendered as the bullet describes it.

Design choice: ONE LLM CALL PER BULLET, not per scene. Per-scene calls
produced ~3000+ lines of TSX in a single response and timed out at 15 min.
Per-bullet calls produce ~150-300 lines, return in 30-90s, and run in
parallel (default 4 workers). Per-bullet cache means a single transient
failure only re-runs that one bullet.

Cache layout:
    storyboard/.cache/designs/
      bullet-s{scene}-b{idx}-{content_hash}.json   ← one LLM result per bullet
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

from .source_parser import AnimationBullet, Scene  # noqa: F401

# Windows-only: hide the brief cmd window flash when spawning the claude CLI.
# CREATE_NO_WINDOW = 0x08000000 tells Windows not to allocate a console for
# the child. Without this, every per-bullet LLM call flashes a black window.
_NOWIN = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0

# Default model — overridable by env var DESIGNER_MODEL (set by build_video.py
# from config.yaml `llm.designer_model`).
DEFAULT_DESIGNER_MODEL = "claude-opus-4-6"

# Concurrency: how many bullets to codegen in parallel. Each call is one
# subprocess invocation of the claude CLI; too many at once will saturate
# the API. 4 is conservative; bump if your account allows higher RPM.
DEFAULT_PARALLELISM = int(os.environ.get("DESIGNER_PARALLELISM", "2"))


# ─── paths ───
ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "storyboard" / ".cache" / "designs"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

CLAUDE_BIN = (
    shutil.which("claude")
    or shutil.which("claude.cmd")
    or "claude"
)


# ─── output type ───
@dataclass
class VisualBlock:
    code: str                       # LLM-emitted React.createElement function body
    audio_anchor: str               # 2-4 word phrase from narration aligning with framesFrom
    time_from_sec: float
    time_to_sec: float
    source_headline: str


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
    h.update(b"prompt-v3-per-bullet")  # bump when prompt template changes
    return h.hexdigest()[:16]


# ─── prompt builders (per bullet) ───
def _make_system_prompt(design_tokens: dict) -> str:
    """Build the system prompt from project design tokens (no hardcoded values)."""
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
  AbsoluteFill       — Remotion AbsoluteFill component
  Sequence           — Remotion Sequence component
  Series             — Remotion Series component
  Img                — Remotion <Img> component (preferred for image assets — handles loading)
  staticFile         — staticFile('filename.ext') → URL for files in projects/<name>/public/.
                       USE THIS for any asset the bullet body references (logos, screenshots,
                       SVGs, photos): React.createElement(Img, {{ src: staticFile('logo.png') }}).
                       The bullet body's filename or [asset: ...] tag tells you the file name.
  D                  — design tokens object. Available keys (use these,
                       never hex literals): {", ".join(sorted(design_tokens.keys()))}
  resolveColor       — (name) => hex; use to resolve token names
  fitText            — fitText({{ text, withinWidth, fontFamily, fontWeight }}) → {{ fontSize }}.
                       USE THIS for any user-supplied long string (titles, quotes, labels)
                       so it auto-shrinks instead of clipping. fontFamily MUST be D.font_display
                       or D.font_mono — measurements are font-correct only for those two
                       (Root.tsx awaits them before render begins).
                       Always cap the result: `Math.min(fitText({{...}}).fontSize, MAX_PX)`.
  measureText        — measureText({{ text, fontFamily, fontSize, fontWeight }}) → {{ width, height }}.
                       Use for centering / positioning logic that needs the actual rendered size.
                       Same font-loading constraint as fitText.

The function body MUST return a single React element (or null). Wrap
multiple top-level elements in React.createElement(React.Fragment, null, ...).

## ANIMATION RULES — Remotion contract

- All animation comes from `frame`. Do NOT use CSS keyframes, transitions,
  or `animation:` declarations — they will not animate during render.
- Use interpolate(frame, [inFrame, outFrame], [from, to], {{ extrapolateLeft:'clamp', extrapolateRight:'clamp' }})
  for any value that changes over time.
- Use spring({{frame: frame - delay, fps, config: {{damping, stiffness}}}}) for
  bouncy reveals. The project's default spring physics is
  damping={spring_damping}, stiffness={spring_stiffness}; deviate only when
  the bullet calls for a clearly different feel.
- IMPORTANT: any `[inFrame, outFrame]` range you pass to interpolate MUST
  satisfy outFrame > inFrame, even when durationInFrames is small. Use
  Math.max(inFrame + 1, outFrame) defensively.
- frame is block-relative (starts at 0 each block) — do not assume a
  global frame counter.

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

## NO-BLEED CONTRACT

1. PROP VALUES come from THIS bullet body and THIS scene's narration only.
2. Field counts (number of items, number of stats, number of shards) match
   the bullet body exactly — never default counts to look "balanced".
3. audio_anchor must be a verbatim phrase from the narration text shown to
   you. Pick a phrase that uniquely marks WHEN this visual should start.
4. NEVER invent placeholder content like "Untitled" or "Lorem ipsum".

## CODE STYLE

- Use `const` for everything. No imports, no `require`, no top-level `await`.
- Inline styles only — no CSS files, no className.
- Keep the body under ~150 lines; for repeated elements use Array.from + map
  rather than copy-paste.
- Strings with quotes inside: escape per JSON rules in the `code` field.

Output JSON only. No prose. No markdown fences."""


def _make_bullet_prompt(scene: Scene, bullet_idx: int) -> str:
    bullet = scene.animation[bullet_idx]
    return f"""SCENE {scene.number} — "{scene.title}"

## Scene narration (use to pick audio_anchor; do NOT include verbatim in visuals unless the bullet says to)
{scene.narration}

## THIS bullet (you are designing only this one)

bullet {bullet_idx + 1} of {len(scene.animation)} — window {bullet.time_from_sec:.0f}-{bullet.time_to_sec:.0f}s
HEADLINE: {bullet.headline}
BODY: {bullet.body}

## Task

Return ONE JSON object: {{"code": "...", "audio_anchor": "...", "source_headline": "..."}}.
Inside `code`, the bindings React, frame, fps, width, height, durationInFrames,
interpolate, spring, Easing, AbsoluteFill, Sequence, Series, Img, staticFile,
D, resolveColor, fitText, measureText are in scope.
DO NOT use JSX. DO NOT use imports. DO NOT use hex color literals.

Output JSON only — no markdown fences, no commentary."""


class RateLimitError(RuntimeError):
    """Claude CLI exited with the empty-stderr/exit-1 signature that means
    rate-limit. Caller backs off MUCH longer than for ordinary errors."""


class CodegenTimeoutError(RuntimeError):
    """LLM took longer than the configured timeout to produce a response.
    Retrying with the same prompt will likely time out again, so the caller
    skips remaining attempts and surfaces a clear error pointing to the bullet."""


# ─── LLM call ───
def _call_llm(prompt: str, system_prompt: str, timeout: int = 900) -> str:
    """Invoke claude CLI in headless print mode. Per-bullet call → 15 min ceiling.

    Iterated 300s → 600s → 900s as we observed which complex bullets hit the wall:
    - 300s wall: 8-tentacle octopus with 8 distinct tools
    - 600s wall: per-letter burn-in animations with multi-stage entrance variants,
                 word-by-word reveals with 4 distinct entrance animations each
    15 min gives Claude Opus 4.6 enough headroom to emit ~500-700 lines of TSX
    for the most cinematic bullets without prompting users to split them.

    Rate limit signature observed in this project: returncode=1 with empty
    stderr (Claude CLI doesn't print anything when API throttles). Surface it
    as a distinct exception so the caller can back off longer."""
    model = os.environ.get("DESIGNER_MODEL", DEFAULT_DESIGNER_MODEL)
    cmd = [
        CLAUDE_BIN,
        "--print",
        "--model", model,
        "--append-system-prompt", system_prompt,
    ]
    try:
        proc = subprocess.run(
            cmd,
            input=prompt,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=timeout,
            creationflags=_NOWIN,
        )
    except subprocess.TimeoutExpired as e:
        # Distinct error class — retrying the same prompt almost always times out
        # again, so the caller skips further attempts.
        raise CodegenTimeoutError(
            f"claude CLI exceeded {timeout}s timeout — bullet body may be too "
            f"complex to render in one call. Consider splitting it in the structured script."
        ) from e
    if proc.returncode != 0:
        stderr = (proc.stderr or "").strip()
        if not stderr:
            # Empty stderr + non-zero exit = rate limit (observed signature).
            raise RateLimitError(f"claude CLI rate-limited (exit {proc.returncode}, empty stderr)")
        raise RuntimeError(f"claude CLI failed (exit {proc.returncode}): {stderr[-1000:]}")
    return proc.stdout.strip()


def _parse_json_response(raw: str) -> dict:
    raw = raw.strip()
    fence_match = re.match(r"^```(?:json)?\s*(.*?)\s*```\s*$", raw, re.DOTALL)
    if fence_match:
        raw = fence_match.group(1).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        raise RuntimeError(f"LLM returned non-JSON: {raw[:500]!r}") from e


# ─── single-bullet validator ───
def _validate_bullet_response(parsed: dict, scene: Scene) -> None:
    """Raises RuntimeError if the LLM response is malformed."""
    code = parsed.get("code", "")
    if not isinstance(code, str) or not code.strip():
        raise RuntimeError("response missing or empty `code` field")
    if "React.createElement" not in code and "React.Fragment" not in code:
        raise RuntimeError("`code` field has no React.createElement call")

    anchor = parsed.get("audio_anchor", "").strip()
    if anchor:
        narr_norm = re.sub(r"[^a-z0-9 ]", "", scene.narration.lower())
        a_norm = re.sub(r"[^a-z0-9 ]", "", anchor.lower())
        if a_norm and a_norm not in narr_norm:
            raise RuntimeError(
                f"audio_anchor {anchor!r} not in narration — pick a verbatim phrase"
            )


# ─── per-bullet design ───
def _design_bullet(
    scene: Scene,
    bullet_idx: int,
    design_tokens: dict,
    system_prompt: str,
    max_attempts: int = 3,
) -> VisualBlock:
    """Codegen for ONE bullet (with cache + retry). Thread-safe — does not
    mutate shared state outside its cache file."""
    bullet = scene.animation[bullet_idx]
    key = _bullet_cache_key(scene, bullet_idx, design_tokens)
    cache_file = CACHE_DIR / f"bullet-s{scene.number}-b{bullet_idx + 1}-{key}.json"

    if cache_file.exists():
        parsed = json.loads(cache_file.read_text(encoding="utf-8"))
    else:
        prompt = _make_bullet_prompt(scene, bullet_idx)
        last_err: Exception | None = None
        parsed = None
        # Rate-limit retries: keep short so placeholders kick in fast when
        # the per-account API quota is fully exhausted. 30s/90s = ~2 min total
        # spread; if those two retries fail, the bullet becomes a placeholder
        # and the build continues. A daily-quota wall doesn't recover in 17 min
        # anyway, so longer retries just wasted wall-clock time.
        rate_limit_backoff = (30, 90)                      # 2 retries for RL
        normal_backoff     = (20, 40, 60)                  # 3 retries for other errors
        rate_limit_hits = 0
        attempt = 0
        max_total = 6
        while attempt < max_total:
            attempt += 1
            try:
                raw = _call_llm(prompt, system_prompt)
                parsed = _parse_json_response(raw)
                _validate_bullet_response(parsed, scene)
                break
            except CodegenTimeoutError as e:
                # Don't retry timeouts — same prompt will time out again. Surface
                # immediately so the user can split the bullet body if they want.
                last_err = e
                break
            except RateLimitError as e:
                last_err = e
                if rate_limit_hits < len(rate_limit_backoff):
                    backoff_s = rate_limit_backoff[rate_limit_hits]
                    rate_limit_hits += 1
                    time.sleep(backoff_s)
                    continue
                break
            except Exception as e:
                last_err = e
                # Non-rate-limit errors get the normal short backoff
                non_rl_idx = attempt - 1 - rate_limit_hits
                if non_rl_idx < len(normal_backoff):
                    time.sleep(normal_backoff[non_rl_idx])
                    continue
                break
        if parsed is None:
            raise RuntimeError(
                f"scene {scene.number} bullet {bullet_idx + 1} failed after {attempt} attempts "
                f"({rate_limit_hits} rate-limit retries). Last error: {last_err}"
            )
        # Wipe stale entries for this bullet, write fresh
        for old in CACHE_DIR.glob(f"bullet-s{scene.number}-b{bullet_idx + 1}-*.json"):
            old.unlink()
        cache_file.write_text(json.dumps(parsed, indent=2, ensure_ascii=False), encoding="utf-8")

    return VisualBlock(
        code=parsed["code"],
        audio_anchor=parsed.get("audio_anchor", "").strip(),
        time_from_sec=bullet.time_from_sec,
        time_to_sec=bullet.time_to_sec,
        source_headline=bullet.headline,
    )


# ─── placeholder for failed bullets ───
def _placeholder_block(scene: Scene, bullet_idx: int, error_msg: str) -> VisualBlock:
    """Emit a visible-but-clearly-broken placeholder when a bullet's codegen fails
    (typically API rate-limit exhaustion). The pipeline can complete with a
    placeholder visible on screen; the user re-runs later to fill it in.

    Cache file is NOT written for placeholders — re-run will retry the LLM."""
    bullet = scene.animation[bullet_idx]
    # JSON-safe text for the JS string literals we build into `code`
    headline = bullet.headline.replace('"', '\\"').replace('\n', ' ')[:140]
    error_short = error_msg.replace('"', '\\"').replace('\n', ' ')[:200]
    label = f"PLACEHOLDER — bullet {bullet_idx + 1} of scene {scene.number}"
    err_msg = f"codegen failed — re-run to fill in: {error_short}"

    # Build the JS function body via plain string concatenation. f-strings
    # collide with the JS '{}' braces, and %-formatting collides with CSS '%'
    # literals (e.g. maxWidth:'80%') — concatenation sidesteps both.
    code = (
        "const opacity = interpolate(frame, [0, 12], [0, 1], "
        "{ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });"
        "return React.createElement('div', { style: { position:'absolute', inset:0, "
        "display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', "
        "gap:24, padding:60, backgroundColor:D.bg, color:D.text_dim, "
        "fontFamily:D.font_mono, opacity } }, "
        "React.createElement('div', { style: { fontSize:18, color:D.amber, letterSpacing:4 } }, "
        '"' + label + '"), '
        "React.createElement('div', { style: { fontSize:32, color:D.text, fontFamily:D.font_display, "
        "fontWeight:800, textAlign:'center', maxWidth:'80%' } }, "
        '"' + headline + '"), '
        "React.createElement('div', { style: { fontSize:14, color:D.red, opacity:0.7, "
        "textAlign:'center', maxWidth:'70%' } }, "
        '"' + err_msg + '"));'
    )
    # First narration word as a defensive anchor (better than empty string —
    # locks the placeholder to the start of THIS bullet's narration moment).
    first_words = scene.narration.strip().split()[:3]
    anchor = " ".join(first_words[:2]) if len(first_words) >= 2 else (first_words[0] if first_words else "")
    return VisualBlock(
        code=code,
        audio_anchor=anchor,
        time_from_sec=bullet.time_from_sec,
        time_to_sec=bullet.time_to_sec,
        source_headline=bullet.headline,
    )


# ─── design ───
def design_scene(
    scene: Scene,
    design_tokens: dict,
    parallelism: int | None = None,
) -> list[VisualBlock]:
    """Codegen all bullets of one scene. Returns blocks in scene order.

    Failed bullets get a visible placeholder block (no cache file written) so the
    pipeline can complete and the user re-runs later to fill them in. Only fully-
    catastrophic scenes (every bullet failed) raise — that's a hard stop."""
    n = len(scene.animation)
    workers = max(1, min(n, parallelism or DEFAULT_PARALLELISM))
    system_prompt = _make_system_prompt(design_tokens)

    print(f"      [scene {scene.number}] codegen for {n} bullets ({workers} parallel workers)...")
    results: dict[int, VisualBlock] = {}
    failures: list[tuple[int, str]] = []

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {
            ex.submit(_design_bullet, scene, i, design_tokens, system_prompt): i
            for i in range(n)
        }
        completed = 0
        for fut in as_completed(futures):
            i = futures[fut]
            try:
                results[i] = fut.result()
                completed += 1
                print(f"        OK  bullet {i + 1}/{n} done ({completed}/{n} complete)")
            except Exception as e:
                failures.append((i, str(e)))
                print(f"        ERR bullet {i + 1}/{n} FAILED — using placeholder: {e}")
                results[i] = _placeholder_block(scene, i, str(e))

    if failures:
        print(f"      [scene {scene.number}] {len(failures)} of {n} bullet(s) used placeholders. "
              f"Re-run to retry; cached bullets skip.")
        if len(failures) == n:
            # Every bullet in this scene is a placeholder — the scene will render
            # as a series of placeholder cards. Pipeline still completes; user
            # re-runs after API quota refreshes to fill in the real cinematography.
            print(f"      [scene {scene.number}] WARNING: every bullet failed — scene "
                  f"will render as ALL placeholders until next codegen run.")

    return [results[i] for i in range(n)]


def design_script(
    scenes: list[Scene],
    design_tokens: dict,
    parallelism: int | None = None,
) -> dict[int, list[VisualBlock]]:
    """Design every scene; returns {scene_number: [VisualBlock, ...]}."""
    return {sc.number: design_scene(sc, design_tokens, parallelism) for sc in scenes}


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
