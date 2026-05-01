"""
Scene Generator — reads script.json, generates .tsx scene components per scene.

Flow:
  1. Read script.json
  2. For each scene, build a prompt from visual_description + voiceover + key_elements
  3. Call LLM (claude --print) to generate the React/Remotion component
  4. Write to projects/{project}/scenes/{scene_id}.tsx
  5. Generate projects/{project}/scenes/index.ts registry

Usage from CLI:
  python -m src.cli generate-scenes --project goose_vs_claude

Usage from code:
  from src.scenes.scene_generator import generate_all_scenes
  generate_all_scenes(script_path, output_dir)
"""

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

from ..planning.script_beat_parser import (
    AnimationBeat,
    ParsedSceneBeats,
    fill_beat_gaps,
    parse_script_file,
)
from .scene_validator import (
    SceneValidationReport,
    ValidationIssue,
    format_report,
    validate_beat_coverage,
    validate_generated_scene,
)


# ============================================================
# PROMPT TEMPLATE — tells the LLM exactly what to generate
# ============================================================

SYSTEM_PROMPT = """You are a Remotion scene component generator. Output ONLY valid TypeScript/TSX code — no explanations, no markdown fences.

CRITICAL: You MUST use the SceneFramework components. They ENFORCE visual quality rules.

REQUIRED IMPORTS:
```
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { SceneLayout, Phase, Section, Panel, findWordFrame } from "@remotion-components/SceneFramework";
import type { WordTS } from "@remotion-components/SceneFramework";
```

## THE #1 RULE: USE <Phase> TO DISTRIBUTE CONTENT ACROSS THE FULL SCENE

The voiceover IS the timeline. Each topic/sentence in the voiceover = one Phase.
Phase auto-calculates start/end frames from wordTimestamps.
At any frame in the scene, exactly ONE Phase is visible.

WRONG (content front-loaded, 80% of scene is static):
```
<SceneLayout>
  <div style={{opacity: frame > 30 ? 1 : 0}}>ALL CONTENT HERE</div>
</SceneLayout>
```

RIGHT (content distributed across full voiceover duration):
```
<SceneLayout wordTimestamps={wordTimestamps}>
  <Phase trigger="terminal" until="twenty dollars">
    <Section>{/* Terminal demo — visible while narrator discusses terminals */}</Section>
  </Phase>
  <Phase trigger="twenty dollars" until="goose">
    <Section>{/* Pricing — visible while narrator discusses pricing */}</Section>
  </Phase>
  <Phase trigger="goose">
    <Section>{/* Goose section — visible until scene ends */}</Section>
  </Phase>
</SceneLayout>
```

HOW TO PICK PHASES:
1. Read the voiceover text
2. Split it into 3-6 topic segments (each segment = different visual content)
3. Pick the FIRST distinctive word of each segment as the `trigger`
4. Set `until` to the next phase's trigger word
5. Last phase has no `until` — it stays until scene ends

AVAILABLE FRAMEWORK COMPONENTS:
- SceneLayout: Root wrapper. Props: sectionLabel, title, accentColor, wordTimestamps. ENFORCES overflow:hidden, padding, fonts. Provides SceneContext for Phase timing.
- Phase: Voiceover-driven content window. Props: trigger (word), until (word), fallbackStart, fallbackEnd. Auto-calculates timing from wordTimestamps. GUARANTEES content is visible only during its voiceover segment.
- Section: Layout slot. Props: flex, direction, gap, align, justify. ENFORCES overflow:hidden.
- Panel: Bordered container. Props: borderColor, background, flex, padding. ENFORCES overflow:hidden.
- findWordFrame(text, wts, fps): Returns frame number. Use for animations WITHIN a Phase.

RULES:
1. MUST wrap in SceneLayout with wordTimestamps prop
2. MUST use Phase to split content across voiceover segments (minimum 2 Phases per scene)
3. Use Section for layout areas — enforces flexbox (no overlapping)
4. Use Panel for bordered containers — enforces overflow:hidden
5. Animations WITHIN a Phase use interpolate/spring with useCurrentFrame
6. NO position:absolute inside content
7. NO boxShadow, textShadow, filter, radial-gradient
8. Accent colors: #00AAFF blue, #FF6B2B orange, #7C5CFC purple, #00D68F green, #FF4757 red, #FFAA00 yellow
9. Export as BOTH named export AND default export
"""

SCENE_PROMPT = '''Generate a React/Remotion scene component using SceneFramework.

SCENE TITLE: {title}
VISUAL DESCRIPTION: {visual_description}
VOICEOVER (for timing reference): {voiceover}
KEY ELEMENTS: {key_elements}
DURATION: ~{duration}s ({frames} frames at 30fps)
COMPONENT NAME: {component_name}

{beat_plan}

STRUCTURE:
```
import React from "react";
import {{ useCurrentFrame, useVideoConfig, interpolate, spring, Easing }} from "remotion";
import {{ SceneLayout, Phase, Section, Panel, findWordFrame }} from "@remotion-components/SceneFramework";
import type {{ WordTS }} from "@remotion-components/SceneFramework";

interface {component_name}Props {{
  startFrame?: number;
  durationInFrames?: number;
  wordTimestamps?: WordTS[];
}}

export const {component_name}: React.FC<{component_name}Props> = ({{
  wordTimestamps = [],
}}) => {{
  const frame = useCurrentFrame();
  const {{ fps }} = useVideoConfig();

  // Split voiceover into phases — each phase = different visual content
  return (
    <SceneLayout sectionLabel="..." title="..." accentColor="..." wordTimestamps={{wordTimestamps}}>
      <Phase trigger="first_topic_word" until="second_topic_word">
        <Section direction="row" gap={{24}}>
          {{/* Content for voiceover segment 1 */}}
        </Section>
      </Phase>
      <Phase trigger="second_topic_word" until="third_topic_word">
        <Section direction="row" gap={{24}}>
          {{/* Content for voiceover segment 2 */}}
        </Section>
      </Phase>
      <Phase trigger="third_topic_word">
        <Section direction="row" gap={{24}}>
          {{/* Content for voiceover segment 3 — stays until scene ends */}}
        </Section>
      </Phase>
    </SceneLayout>
  );
}};

export default {component_name};
```

Render EXACTLY what visual_description says. Every element described must appear.
Use findWordFrame() to sync element entrances to when narrator mentions them.

HARD CONTRACT — you MUST satisfy all four rules or the scene is rejected:
1. Emit EXACTLY one <Phase> per beat listed in BEAT PLAN above (if present). Use
   the listed `sync_word` as the Phase `trigger`; the next beat's sync_word is
   the `until`. Last beat has no `until`.
2. Each Phase MUST receive both `fallbackStart` and `fallbackEnd` (numbers from
   BEAT PLAN) so it never collapses if TTS word-matching fails.
3. Inside every Phase: ALWAYS include at least one element that animates
   continuously (breathing, drifting, pulsing) — never a single static frame.
4. Export `animationCompletionFrames = durationInFrames` at the end of the
   file. This is the Animation Completion Contract the player uses to detect
   dead air. Example:
     export const animationCompletionFrames = (durationInFrames?: number) =>
       durationInFrames ?? {frames};

Output ONLY the .tsx code. Start with `import React`.
'''


def _format_beat_plan(beats: list[AnimationBeat], fps: int = 30) -> str:
    """Render the per-beat Phase plan that goes into the LLM prompt.
    The LLM gets exact fallback frames — no more guessing."""
    if not beats:
        return ""
    lines = [
        "BEAT PLAN (one <Phase> per row, IN ORDER — do NOT invent extra phases):",
        "",
        "| # | sync_word (trigger) | fallbackStart | fallbackEnd | what to render |",
        "|---|---|---|---|---|",
    ]
    # fallback frames are RELATIVE to scene start, in frames at `fps`
    scene_start = beats[0].start_seconds
    for i, b in enumerate(beats):
        rel_start = max(0.0, b.start_seconds - scene_start)
        rel_end = max(rel_start + 0.5, b.end_seconds - scene_start)
        fb_start = int(round(rel_start * fps))
        fb_end = int(round(rel_end * fps))
        trigger = b.sync_word or f"(none — use fallbackStart={fb_start})"
        desc = (b.description or b.title).replace("\n", " ").replace("|", "/")[:140]
        lines.append(f"| {i+1} | {trigger} | {fb_start} | {fb_end} | {desc} |")
    lines.append("")
    lines.append(
        "For each row, emit:\n"
        "  <Phase trigger=\"WORD\" until=\"NEXT_WORD\" fallbackStart={N} fallbackEnd={M}>\n"
        "    ... render the 'what to render' content here, with continuous motion ...\n"
        "  </Phase>"
    )
    return "\n".join(lines)


def _scene_id_to_component_name(scene_id: str) -> str:
    """Convert scene_id to a valid PascalCase JS identifier.

    e.g. 'cold_open'                   → 'ColdOpenScene'
         '01_one_million_lines'        → 'Scene01OneMillionLinesScene'

    JS identifiers cannot start with a digit, so scene_ids beginning with
    a number get a 'Scene' prefix. This keeps the registry import in
    index.ts syntactically valid.
    """
    parts = [w for w in re.split(r"[_\-\s]+", scene_id) if w]
    name = "".join(w.capitalize() for w in parts) + "Scene"
    if name and name[0].isdigit():
        name = "Scene" + name
    return name


COLD_OPEN_HINT = """
COLD-OPEN MODE — THIS IS THE FIRST SCENE.

The player automatically delays narration by 5 seconds so the viewer sees
SILENT visuals first. You MUST:
  1. Pass `chromeless` and `preRollFrames={{{preRollFrames}}}` to <SceneLayout>
     so the first 5 seconds render full-bleed with no corner header.
  2. Read props.preRollFrames (number, default 150 = 5s).
     During frames 0..preRollFrames, render the silent hook visuals
     (usually the big numbers / title punch from the script, on pure black).
     DO NOT use any <Phase> here — phases are voiceover-driven and there
     is no voiceover in the pre-roll.
  3. After preRollFrames, switch to the normal <Phase> timeline for the
     narrated content. The BEAT PLAN above still applies but its frame
     numbers are measured FROM PRE-ROLL END, not scene start.
  4. Keep the pre-roll background pure #000000 with white/red typography.
     This is a "stop scrolling" moment — no accent washes.

Minimal structure for a cold-open scene:
```
{{
  const preRoll = props.preRollFrames ?? 150;
  if (frame < preRoll) {{
    // Silent hook — pure visual, no SceneLayout chrome
    return <SilentHook frame={{frame}} />;
  }}
  return (
    <SceneLayout chromeless={{false}} preRollFrames={{0}} wordTimestamps={{wordTimestamps}}>
      <Phase ...> ... </Phase>
    </SceneLayout>
  );
}}
```
"""


def _build_prompt(
    scene: dict,
    beats: list[AnimationBeat] | None = None,
    is_cold_open: bool = False,
) -> str:
    """Build the generation prompt for one scene.

    If `beats` is provided, the prompt includes an explicit Phase plan pinned
    to the script's per-timeslice animation spec (architectural fix #2).
    If `is_cold_open` is True, the prompt adds the cold-open hook spec
    (silent pre-roll + chromeless layout + hard cut).
    """
    scene_id = scene.get("scene_id", "scene")
    duration = scene.get("duration_seconds", 30)

    base = SCENE_PROMPT.format(
        title=scene.get("title", ""),
        visual_description=scene.get("visual_description", ""),
        voiceover=(scene.get("voiceover", "") or "")[:600],
        key_elements=", ".join(scene.get("key_elements", [])),
        duration=duration,
        frames=int(duration * 30),
        component_name=_scene_id_to_component_name(scene_id),
        beat_plan=_format_beat_plan(beats or []),
    )
    if is_cold_open:
        base += COLD_OPEN_HINT.format(preRollFrames=150)
    return base


def _is_cold_open(scene: dict, index: int) -> bool:
    """Detect whether this scene should get the cold-open treatment.

    Triggers on: scene_index 0 AND (scene_type hook/cold_open OR explicit
    pre_roll_seconds field on the scene dict).
    """
    if index != 0:
        return False
    scene_type = (scene.get("scene_type") or "").lower()
    if scene_type in {"hook", "cold_open"}:
        return True
    if scene.get("pre_roll_seconds"):
        return True
    return False


def _extract_code(response: str) -> str:
    """Extract TSX code from LLM response. Strips markdown fences if present."""
    # Remove markdown code fences
    response = re.sub(r'^```(?:tsx?|jsx?|react)?\s*\n', '', response.strip())
    response = re.sub(r'\n```\s*$', '', response.strip())

    # Must start with import
    if not response.startswith('import '):
        # Try to find the import statement
        match = re.search(r'(import React.*)', response, re.DOTALL)
        if match:
            return match.group(1).strip()

    return response.strip()


def _call_llm(prompt: str, system_prompt: str, timeout: int = 300) -> str:
    """Call claude --print to generate code.

    This runs the Claude Code CLI in headless mode.
    Works when called from a normal terminal (not nested inside Claude Code).
    """
    cmd = [
        "claude",
        "--print",
        "--model", "claude-sonnet-4-20250514",
        "--system-prompt", system_prompt,
        prompt,
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )

        if result.returncode != 0:
            raise RuntimeError(f"claude --print failed: {result.stderr[:500]}")

        out = result.stdout.strip()
        if not out:
            # Empty stdout with exit 0 — surface stderr for diagnosis instead
            # of letting downstream quietly treat it as 'missing component'.
            stderr_snip = (result.stderr or "").strip()[:500] or "(empty)"
            raise RuntimeError(
                f"claude --print returned empty stdout (exit 0). "
                f"stderr: {stderr_snip}"
            )
        return out

    except FileNotFoundError:
        raise RuntimeError(
            "claude CLI not found. Install Claude Code: npm install -g @anthropic-ai/claude-code"
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"claude --print timed out after {timeout}s")


def _generate_index_ts(scene_ids: list[str]) -> str:
    """Generate index.ts that exports the component map AND the completion map.

    Namespace imports are used so scenes that haven't yet been regenerated
    (and therefore don't export `animationCompletionFrames`) don't break the
    build — the completion lookup just returns undefined and the player
    falls back to "no gap" (safe default).
    """
    ns_imports: list[str] = []
    scene_entries: list[str] = []
    completion_entries: list[str] = []
    for sid in scene_ids:
        comp = _scene_id_to_component_name(sid)
        ns = f"Mod_{re.sub(r'[^A-Za-z0-9_]', '_', sid)}"
        ns_imports.append(f'import * as {ns} from "./{sid}";')
        scene_entries.append(f'  "{sid}": {ns}.{comp} as SceneComponent,')
        # Optional completion export — feed a safe default if the scene
        # hasn't adopted the contract yet (pre-regen legacy scenes).
        completion_entries.append(
            f'  "{sid}": (typeof ({ns} as any).animationCompletionFrames === "function") '
            f'? ({ns} as any).animationCompletionFrames '
            f': (d?: number) => (d ?? 0),'
        )

    return f"""import React from "react";
{chr(10).join(ns_imports)}

export type SceneComponent = React.FC<any>;

export const PROJECT_SCENES: Record<string, SceneComponent> = {{
{chr(10).join(scene_entries)}
}};

// Animation Completion Contract (architectural fix #3) — per-scene
// frame counts the player uses to detect dead air. Scenes that don't
// export `animationCompletionFrames` get a safe identity fallback.
export const PROJECT_SCENE_COMPLETIONS: Record<string, (d?: number) => number> = {{
{chr(10).join(completion_entries)}
}};
"""


# ============================================================
# PUBLIC API
# ============================================================

def _augment_prompt_with_violations(
    base_prompt: str, report: SceneValidationReport
) -> str:
    """Feed validation violations back into the prompt for a retry."""
    lines = [
        "\n\n========== PREVIOUS OUTPUT REJECTED ==========",
        "Your previous generation failed the hard contract. Fix every",
        "issue listed below in this retry. Do NOT output the same code.",
        "",
    ]
    for issue in report.issues:
        lines.append(f"  - {issue.code}: {issue.message}")
    lines.append("")
    lines.append("Emit a FULL replacement .tsx that satisfies every rule.")
    return base_prompt + "\n".join(lines)


def generate_scene(
    scene: dict,
    output_path: Path,
    timeout: int = 300,
    beats: list[AnimationBeat] | None = None,
    max_retries: int = 2,
    is_cold_open: bool = False,
) -> bool:
    """Generate a single scene .tsx file, gated by the SceneValidator.

    Args:
        scene: Scene dict with visual_description, voiceover, key_elements, etc.
        output_path: Where to write the .tsx file
        timeout: LLM call timeout in seconds
        beats: Optional parsed AnimationBeats from the source markdown script.
               When provided, the LLM is pinned to one <Phase> per beat with
               pre-computed fallback frames (architectural fix #2).
        max_retries: Maximum extra LLM calls after initial attempt. Each retry
               feeds the validator's violations back into the prompt so the
               LLM has to fix the specific defects.

    Returns:
        True only if a generated file passes the SceneValidator contract.
        On validation failure after all retries, the best-effort output is
        still written but we return False so the caller records failure.
    """
    scene_id = scene.get("scene_id", "unknown")
    component_name = _scene_id_to_component_name(scene_id)

    base_prompt = _build_prompt(scene, beats=beats, is_cold_open=is_cold_open)
    current_prompt = base_prompt

    label = "❄ cold-open" if is_cold_open else ""
    print(f"    Generating {scene_id} → {component_name} {label}...", end=" ", flush=True)

    last_code = ""
    last_report: SceneValidationReport | None = None

    for attempt in range(max_retries + 1):
        try:
            response = _call_llm(current_prompt, SYSTEM_PROMPT, timeout=timeout)
            code = _extract_code(response)
        except Exception as e:
            print(f"✗ attempt {attempt + 1}/{max_retries + 1}: {e}")
            continue

        if "React" not in code or component_name not in code:
            last_code = code
            last_report = SceneValidationReport(
                scene_id=scene_id,
                passed=False,
                issues=[
                    ValidationIssue(
                        "missing_component",
                        f"Response lacks `React` import or `{component_name}`.",
                    )
                ],
            )
            current_prompt = _augment_prompt_with_violations(base_prompt, last_report)
            continue

        report = validate_generated_scene(code, scene_id=scene_id, beats=beats)
        last_code = code
        last_report = report

        if report.passed:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(code, encoding="utf-8")
            extras = (
                ""
                if not report.issues
                else f" (with {len(report.issues)} non-blocking warning(s))"
            )
            print(f"✓ {report.phase_count} phases{extras}")
            return True

        # Blocked — augment the prompt with every violation and retry.
        if attempt < max_retries:
            print(
                f"⚠ attempt {attempt + 1} rejected "
                f"({len(report.blocking_issues)} blocking) — retrying..."
            )
            current_prompt = _augment_prompt_with_violations(base_prompt, report)

    # Exhausted retries. Write the last attempt so a human can inspect it,
    # but signal failure so the pipeline doesn't ship.
    if last_code:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(last_code, encoding="utf-8")
    print(f"✗ validator blocked after {max_retries + 1} attempts")
    if last_report is not None:
        print(format_report(last_report))
    return False


def _load_beats_for_script(script_path: Path) -> list[list[AnimationBeat]]:
    """Find the source markdown for a script.json and parse its per-scene beats.

    Looks next to script.json for common names (source.md, script.md) and in
    projects/scripts/ for files matching the script id. Returns an empty list
    if no source markdown is found — caller falls back to legacy behavior.
    """
    script_dir = script_path.parent
    candidates = [
        script_dir / "source.md",
        script_dir / "script.md",
        script_dir / "script_source.md",
    ]
    # Also scan projects/scripts/*.txt for a matching stem
    project_name = script_dir.name
    for scripts_dir in [
        script_dir.parent.parent / "scripts",
        script_dir.parent / "scripts",
    ]:
        if scripts_dir.is_dir():
            for ext in ("*.md", "*.txt"):
                candidates.extend(scripts_dir.glob(ext))

    for cand in candidates:
        if cand.is_file():
            try:
                parsed = parse_script_file(cand)
                if not parsed:
                    continue
                # Gap-fill + log coverage issues so "dead air" can't reach
                # the generator from the beat stage.
                filled: list[list[AnimationBeat]] = []
                for scene_beats in parsed:
                    coverage_issues = validate_beat_coverage(
                        scene_beats.beats,
                        scene_beats.scene_start_seconds,
                        scene_beats.scene_end_seconds,
                    )
                    if coverage_issues:
                        print(
                            f"  ⚠ Scene {scene_beats.scene_index + 1} beat "
                            f"coverage issues — auto-bridging:"
                        )
                        for issue in coverage_issues:
                            print(f"      {issue}")
                    bridged = fill_beat_gaps(scene_beats)
                    filled.append(bridged.beats)
                return filled
            except Exception:
                continue
    return []


def generate_all_scenes(script_path: Path, output_dir: Path, timeout: int = 300) -> dict:
    """Generate .tsx scene components for every scene in a script.

    Args:
        script_path: Path to script.json
        output_dir: Directory to write scene files (e.g., projects/{id}/scenes/)
        timeout: Per-scene LLM timeout

    Returns:
        Dict with generation results: {total, succeeded, failed, scene_ids}
    """
    with open(script_path, encoding="utf-8") as f:
        script = json.load(f)

    scenes = script.get("scenes", [])
    if not scenes:
        print("  No scenes found in script.")
        return {"total": 0, "succeeded": 0, "failed": 0, "scene_ids": []}

    output_dir.mkdir(parents=True, exist_ok=True)

    # Architectural fix #2: pin Phase layout to the source markdown's beat grid.
    per_scene_beats = _load_beats_for_script(script_path)
    if per_scene_beats and len(per_scene_beats) == len(scenes):
        print(f"  ✓ Loaded {sum(len(b) for b in per_scene_beats)} beats from source markdown")
    else:
        if per_scene_beats:
            print(
                f"  ⚠ Beat parser found {len(per_scene_beats)} scenes but script has "
                f"{len(scenes)} — falling back to legacy prompt"
            )
        per_scene_beats = []

    print(f"\n  Generating {len(scenes)} scene components...")
    print(f"  Output: {output_dir}\n")

    scene_ids = []
    succeeded = 0
    failed = 0

    for i, scene in enumerate(scenes):
        scene_id = scene.get("scene_id", f"scene{i + 1}")
        scene_ids.append(scene_id)

        output_path = output_dir / f"{scene_id}.tsx"

        # Skip if file already exists and is non-empty
        if output_path.exists() and output_path.stat().st_size > 100:
            print(f"    {scene_id} — already exists, skipping")
            succeeded += 1
            continue

        scene_beats = per_scene_beats[i] if i < len(per_scene_beats) else None
        if generate_scene(
            scene,
            output_path,
            timeout=timeout,
            beats=scene_beats,
            is_cold_open=_is_cold_open(scene, i),
        ):
            succeeded += 1
        else:
            failed += 1

    # Generate index.ts registry
    index_code = _generate_index_ts(scene_ids)
    index_path = output_dir / "index.ts"
    index_path.write_text(index_code, encoding="utf-8")
    print(f"\n  ✓ Registry: {index_path}")

    print(f"  Results: {succeeded}/{len(scenes)} succeeded, {failed} failed")

    return {
        "total": len(scenes),
        "succeeded": succeeded,
        "failed": failed,
        "scene_ids": scene_ids,
    }


def regenerate_scene(script_path: Path, scene_id: str, output_dir: Path, timeout: int = 300) -> bool:
    """Regenerate a single scene (forces overwrite).

    Useful when a scene's .tsx has issues and needs to be regenerated.
    """
    with open(script_path, encoding="utf-8") as f:
        script = json.load(f)

    scene = None
    scene_index = -1
    for i, s in enumerate(script.get("scenes", [])):
        if s.get("scene_id") == scene_id:
            scene = s
            scene_index = i
            break

    if not scene:
        print(f"  Scene '{scene_id}' not found in script.")
        return False

    output_path = output_dir / f"{scene_id}.tsx"

    # Delete existing to force regeneration
    if output_path.exists():
        output_path.unlink()

    # Preserve cold-open status on regenerate so the hook doesn't silently
    # degrade into a normal scene after auto-refinement.
    result = generate_scene(
        scene,
        output_path,
        timeout=timeout,
        is_cold_open=_is_cold_open(scene, scene_index),
    )

    # Regenerate index.ts to be safe
    scene_ids = [s.get("scene_id", f"scene{i+1}") for i, s in enumerate(script.get("scenes", []))]
    index_code = _generate_index_ts(scene_ids)
    (output_dir / "index.ts").write_text(index_code, encoding="utf-8")

    return result
