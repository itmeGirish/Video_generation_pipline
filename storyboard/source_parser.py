"""
Parse a source script (projects/<name>/source.txt) into a structured SourceScript.

Two formats are supported (auto-detected per scene):

LEGACY FORMAT — separate narration + animation sections:
    ## SCENE N — "Title" (M:SS – M:SS)
    ### Narration
    > narration text (single block, may span multiple lines)
    ### Animation
    - **0:00 – 0:08 — Hard cut. Plain horse silhouette.** Body text...
    - **0:08 – 0:18 — Title.** Body...

PAIR-BLOCK FORMAT — narration + animation coupled per bullet (anchor MUST appear
in the bullet's own narration; eliminates the dual-source-of-truth sync bug):
    ## SCENE N — "Title" (M:SS – M:SS)
    - **0:00 – 0:08 — Hard cut. Plain horse silhouette.**
      > narration sentence(s) for THIS bullet. <pause 0.4s>
      Body / animation description...
      audio_anchor: silhouette
    - **0:08 – 0:18 — Title.**
      > next narration sentence(s).
      Body...

In pair-block mode, scene.narration is reassembled by concatenating each
bullet's narration in order — downstream TTS/Whisper/anchor pipeline runs
identically. Detection: a scene with no `### Animation` header is pair-block.

Returns a SourceScript with per-scene narration + animation bullets.
Each animation bullet has a time window in seconds and the description text.

This is the SINGLE CONTRACT for downstream pipeline steps. No script.md
intermediate. No human/LLM rewrite. Source.txt is the only truth.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

try:
    import yaml  # PyYAML (already a dep — config.yaml). Used to parse the `motion:` op block.
except Exception:  # pragma: no cover - yaml is always present in this pipeline
    yaml = None


@dataclass
class AnimationBullet:
    time_from_sec: float       # seconds within scene (e.g. 0.0)
    time_to_sec: float         # seconds within scene (e.g. 8.0)
    headline: str              # the bold ALL-CAPS-ish first sentence ("Hard cut. Plain horse silhouette.")
    body: str                  # remainder of the bullet text
    spotlight_items: list[str] | None = None  # set when body contains [SPOTLIGHT: a | b | c]
    # The structured `motion:` block — a YAML list of motion-system OPERATORS, one per beat:
    #   - {op, obj, to, token, choreo, sync}   (op ∈ the closed 9; token ∈ the motion tokens)
    # Parsed deterministically so the codegen builds the canonical Remotion animation per op
    # (not LLM-interpreted prose). None for legacy bullets that still use prose `what happens`.
    ops: list[dict] | None = None
    # JSON render-contract path only: the bullet's ORIGINAL structured object, carried through
    # verbatim so the LLM codegen reads the full JSON (sentence roles/durations/pauses/emphasis/
    # visual_intent) directly — "parse for the machine, JSON-direct for the LLM's creative step".
    # None for .txt scripts. The mechanical spine (TTS/anchors/frames) never reads this.
    raw: dict | None = None


@dataclass
class Scene:
    number: int
    title: str
    window_from_sec: float     # absolute scene start in video (e.g. 60.0)
    window_to_sec: float
    narration: str             # raw narration text (single block)
    animation: list[AnimationBullet] = field(default_factory=list)
    pacing: str = ""           # optional ### Pacing block content
    # ─── director's brief (Phase-1 → Phase-2 bridge) ───────────────────────────
    # The <!-- SCENE DESCRIPTION --> / <!-- SCENE DESIGN --> comment blocks written by
    # script-scene-design. They were previously DROPPED by the parser, so the per-bullet
    # codegen never saw the scene's camera / layout / through-line / visual-metaphor intent
    # and re-invented it → generic output. Captured here so the brief is DATA, not the
    # in-session author's memory. `global_style` is the script-level GLOBAL VISUAL STYLE,
    # DENORMALIZED onto every scene so cache-key + prompt builders (which only receive a
    # Scene) can read it with zero signature churn. Empty for conversion-path scripts.
    description: str = ""      # <!-- SCENE DESCRIPTION ... -->  (environment/transformation/final image)
    design: str = ""           # <!-- SCENE DESIGN ... -->       (location/cinematic/layout/through-line state)
    global_style: str = ""     # <!-- GLOBAL VISUAL STYLE ... --> (copied from the script, per scene)


@dataclass
class SourceScript:
    title: str
    scenes: list[Scene]
    global_style: str = ""     # <!-- GLOBAL VISUAL STYLE ... --> (once, top of file)
    reference_assets: str = "" # <!-- REFERENCE ASSETS ... -->    (once, top of file)


# ─── helpers ───
_TIME_RE = r"(\d+):(\d{2})"


def _to_sec(m_str: str, s_str: str) -> float:
    return int(m_str) * 60 + int(s_str)


def _parse_window(window: str) -> tuple[float, float]:
    """Parse '0:00 – 1:00' (uses en-dash or hyphen) → (0.0, 60.0)."""
    m = re.match(rf"\s*{_TIME_RE}\s*[–-]\s*{_TIME_RE}\s*", window)
    if not m:
        raise ValueError(f"Cannot parse time window: {window!r}")
    return _to_sec(m.group(1), m.group(2)), _to_sec(m.group(3), m.group(4))


def _strip_markdown(text: str) -> str:
    """Light cleanup: collapse whitespace, strip markdown tickmarks/quotes around words."""
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_comment_block(text: str, label: str) -> str:
    """Return the inner content of an HTML comment block whose opening token matches
    `label`, e.g. label='SCENE DESIGN' captures the body of '<!-- SCENE DESIGN ... -->'.
    Non-greedy so it stops at the first '-->'. Empty string if absent.

    This is how the Phase-1 director's brief crosses into Phase-2: source_parser keeps
    these blocks (the renderer's source_parser used to drop every comment) and attaches
    them to the Scene / SourceScript so the per-bullet codegen sees the design intent."""
    m = re.search(rf"<!--\s*{re.escape(label)}\b(.*?)-->", text, re.DOTALL)
    return m.group(1).strip() if m else ""


# ─── scene split ───
_SCENE_HEADER = re.compile(
    r"^##\s*SCENE\s+(\d+)\s*[—-]\s*[\"“]?(.+?)[\"”]?\s*\((\d+:\d{2})\s*[–-]\s*(\d+:\d{2})\)\s*$",
    re.MULTILINE,
)


def lint(source_path: str | Path) -> list[str]:
    """Return list of human-readable warnings about common source.txt mistakes.
    Empty list = clean. Does NOT raise — just reports problems for the user to fix."""
    if Path(source_path).suffix.lower() == ".json":
        return _lint_json(Path(source_path))
    text = Path(source_path).read_text(encoding="utf-8")
    warnings: list[str] = []

    # Wrong em-dash chars in scene headers (must be – or -, not — or other)
    for i, line in enumerate(text.splitlines(), 1):
        if line.startswith("## SCENE"):
            if "(" not in line or ")" not in line:
                warnings.append(f"line {i}: scene header missing time window in parens")
            window_match = re.search(r"\(([^)]*)\)", line)
            if window_match:
                w = window_match.group(1)
                if "–" not in w and "-" not in w:
                    warnings.append(f"line {i}: scene header time window must use – or - between times")

    # Animation bullets: check time window format — ONLY inside ### Animation blocks
    # (preamble bullets in Visual Language / Engagement Playbook are not bullets the
    # parser cares about; flagging them is a false positive.)
    in_anim = False
    lines = text.splitlines()
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("###"):
            in_anim = re.match(r"^###\s*Animation\s*$", stripped, re.IGNORECASE) is not None
            continue
        if not in_anim:
            continue
        m = re.match(r"^-\s+\*\*([^*]+?)\*\*", line)
        if m:
            head = m.group(1)
            if not re.match(r"\d+:\d{2}\s*[–-]\s*\d+:\d{2}\s*[—-]", head):
                warnings.append(f"line {i}: animation bullet header malformed — expected '0:00 – 0:08 — Title'")

    # Per-scene structure: legacy needs both ### Narration and ### Animation;
    # pair-block has neither but must have bullets with `> narration` lines.
    scenes = list(_SCENE_HEADER.finditer(text))
    for i, m in enumerate(scenes):
        body_start = m.end()
        body_end = scenes[i + 1].start() if i + 1 < len(scenes) else len(text)
        body = text[body_start:body_end]
        if _is_pair_block_scene(body):
            bullets = list(_ANIM_BULLET.finditer(body))
            if not bullets:
                warnings.append(f"scene {m.group(1)}: pair-block format but no bullets found")
                continue
            for b in bullets:
                # find this bullet's slice and check for at least one `> ` narration line
                b_start = b.end()
                next_b = next((bn for bn in bullets if bn.start() > b_start), None)
                b_end = next_b.start() if next_b else body_end - body_start
                slice_ = body[b_start:b_end]
                if not any(ln.strip().startswith(">") for ln in slice_.splitlines()):
                    warnings.append(
                        f"scene {m.group(1)} bullet {b.group(1)}–{b.group(2)}: "
                        f"pair-block bullet has no `> narration` line"
                    )
        else:
            if "### Narration" not in body:
                warnings.append(f"scene {m.group(1)}: missing ### Narration block")
            if "### Animation" not in body:
                warnings.append(f"scene {m.group(1)}: missing ### Animation block")

    return warnings


def parse(source_path: str | Path) -> SourceScript:
    # ── JSON render contract (the canonical machine handover from the script pipeline) ──
    # projects/structured_scripts/<name>.json maps 1:1 onto SourceScript/Scene/AnimationBullet
    # (schema: docs/render-contract.schema.json). Everything downstream of the parser is
    # format-agnostic — TTS/Whisper/anchors/codegen/master/verify see the same dataclasses.
    if Path(source_path).suffix.lower() == ".json":
        return _parse_json(Path(source_path))

    text = Path(source_path).read_text(encoding="utf-8")

    # Extract document title (first H1)
    title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else Path(source_path).stem

    # Find scene boundaries
    scene_marks = list(_SCENE_HEADER.finditer(text))
    if not scene_marks:
        raise ValueError(
            f"No scenes found in {source_path}. "
            f"Expected headers like '## SCENE 1 — \"Title\" (0:00 – 1:00)'"
        )

    # Script-level director's brief (the Phase-1 → Phase-2 bridge): the GLOBAL VISUAL
    # STYLE + REFERENCE ASSETS blocks live in the preamble, before scene 1. Extract from
    # that region so a scene body can never shadow them. Empty for conversion-path scripts.
    preamble = text[: scene_marks[0].start()]
    global_style = _extract_comment_block(preamble, "GLOBAL VISUAL STYLE")
    reference_assets = _extract_comment_block(preamble, "REFERENCE ASSETS")

    scenes: list[Scene] = []
    for i, m in enumerate(scene_marks):
        body_start = m.end()
        body_end = scene_marks[i + 1].start() if i + 1 < len(scene_marks) else len(text)
        body = text[body_start:body_end]

        scene_num = int(m.group(1))
        scene_title = m.group(2).strip()
        win_from = _to_sec(*m.group(3).split(":"))
        win_to = _to_sec(*m.group(4).split(":"))

        pacing = _extract_pacing(body)

        if _is_pair_block_scene(body):
            narration, animation = _extract_pair_blocks(body)
            if not animation:
                raise ValueError(
                    f"Scene {scene_num} '{scene_title}' (pair-block format) has no bullets"
                )
            if not narration:
                raise ValueError(
                    f"Scene {scene_num} '{scene_title}' (pair-block format) has no '> narration' lines inside its bullets"
                )
        else:
            narration = _extract_narration(body)
            animation = _extract_animation(body)
            if not narration:
                raise ValueError(f"Scene {scene_num} '{scene_title}' missing ### Narration block")
            if not animation:
                raise ValueError(f"Scene {scene_num} '{scene_title}' missing ### Animation block")

        scenes.append(Scene(
            number=scene_num,
            title=scene_title,
            window_from_sec=win_from,
            window_to_sec=win_to,
            narration=narration,
            animation=animation,
            pacing=pacing,
            description=_extract_comment_block(body, "SCENE DESCRIPTION"),
            design=_extract_comment_block(body, "SCENE DESIGN"),
            global_style=global_style,   # denormalized so prompt/cache builders need only a Scene
        ))

    return SourceScript(
        title=title,
        scenes=scenes,
        global_style=global_style,
        reference_assets=reference_assets,
    )


# ─── section extractors ───
_SECTION_RE = re.compile(r"^###\s*(\w+)\s*$", re.MULTILINE)


def _extract_section(body: str, name: str) -> str:
    """Extract content of '### name' until next '###' or end."""
    sections = list(_SECTION_RE.finditer(body))
    for i, m in enumerate(sections):
        if m.group(1).lower() == name.lower():
            start = m.end()
            end = sections[i + 1].start() if i + 1 < len(sections) else len(body)
            return body[start:end].strip()
    return ""


def _extract_narration(body: str) -> str:
    raw = _extract_section(body, "Narration")
    if not raw:
        return ""
    # ONLY `>`-prefixed lines are narration. Any other text inside the section —
    # blueprint footer fields placed after the narration (EXIT TRANSITION /
    # NEXT SCENE HOOK / ON-SCREEN TEXT) or trailing build-notes — is design
    # scaffolding and must NOT be spoken. The old version appended EVERY non-empty
    # line, which leaked the template footer straight into the TTS audio (the
    # voice read "exit transition, battery docks to the corner…"), shifting every
    # anchor. All legacy scripts use `>`-prefixed narration, so this is behavior-
    # preserving for them and a correctness fix for the blueprint template.
    lines = [line.strip()[1:].strip()
             for line in raw.splitlines()
             if line.strip().startswith(">")]
    return _strip_markdown(" ".join(lines))


def _extract_pacing(body: str) -> str:
    return _extract_section(body, "Pacing")


# Spotlight annotation: [SPOTLIGHT: item1 | item2 | item3] anywhere in bullet body/tail
_SPOTLIGHT_RE = re.compile(r'\[SPOTLIGHT:\s*([^\]]+)\]', re.IGNORECASE)


# Animation bullet pattern: top-level "- " bullets with bold time-window header.
# `[ \t]*(.*)$` at the end restricts capture of the first-line tail to the SAME
# line as the header (legacy + pair-block both rely on this — otherwise `\s*`
# eats the newline and group(4) leaks into the next line).
_ANIM_BULLET = re.compile(
    r"^-\s+\*\*(\d+:\d{2})\s*[–-]\s*(\d+:\d{2})\s*[—-]\s*(.+?)\*\*[ \t]*(.*)$",
    re.MULTILINE,
)


def _extract_animation(body: str) -> list[AnimationBullet]:
    """Extract animation bullets, including their multi-line bodies and sub-bullets."""
    raw = _extract_section(body, "Animation")
    if not raw:
        return []

    # Find all top-level bullet starts
    matches = list(_ANIM_BULLET.finditer(raw))
    bullets: list[AnimationBullet] = []

    for i, m in enumerate(matches):
        start_body = m.end()
        end_body = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        body_text = raw[start_body:end_body].strip()
        # First-line tail (after the bold header) plus sub-content
        first_tail = m.group(4).strip()
        rest = _strip_markdown(body_text)
        body_full = f"{first_tail} {rest}".strip() if first_tail else rest

        from_sec = _to_sec(*m.group(1).split(":"))
        to_sec = _to_sec(*m.group(2).split(":"))
        headline = _strip_markdown(m.group(3))

        # Parse [SPOTLIGHT: item1 | item2 | ...] annotation
        spotlight_items = None
        sm = _SPOTLIGHT_RE.search(body_full)
        if sm:
            spotlight_items = [item.strip() for item in sm.group(1).split('|') if item.strip()]
            body_full = _SPOTLIGHT_RE.sub('', body_full).strip()

        bullets.append(AnimationBullet(
            time_from_sec=from_sec,
            time_to_sec=to_sec,
            headline=headline,
            body=body_full,
            spotlight_items=spotlight_items,
        ))

    return bullets


# ─── the structured `motion:` operator block (YAML; one op per row) ───
# Each row: {el, op, topology, params:{…}, token, sync}
#   op       ∈ the closed 9 (grammar)            topology ∈ the motion language (per op)
#   params   = scene-specific knobs (structured)  token    = the spring/duration feel
_OPS_VOCAB = {"Enter", "Exit", "Move", "Transform", "Reveal", "Emphasize", "Connect", "Recolor", "Camera"}
_TOKEN_VOCAB = {"instant", "fast", "base", "slow", "settle", "pop", "glide", "bounce", "stagger"}


def _extract_motion_ops(block: str) -> list[dict] | None:
    """Parse a bullet's `motion:` block — a YAML list of operator maps — into structured ops.

    The block looks like:
        motion:
          - {el: shredder, op: Enter, topology: rise, params: {}, token: glide}
          - {el: page.table, op: Transform, topology: shatter, params: {split: rows, stagger: 6f}, token: settle, sync: "..."}
    Returns the list of dicts, or None if there's no `motion:` block (legacy prose bullets).
    Determinism is the point — the codegen builds DYNAMIC Remotion from op·topology·params (not a fixed
    template, not re-interpreted prose). Malformed YAML returns None (the validator flags it).
    """
    if yaml is None:
        return None
    lines = block.splitlines()
    start = base_indent = None
    for i, line in enumerate(lines):
        m = re.match(r"^(\s*)motion:\s*$", line)
        if m:
            start, base_indent = i, len(m.group(1))
            break
    if start is None:
        return None
    items: list[str] = []
    for line in lines[start + 1:]:
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        # a sibling key (text:/image:/audio_anchor:/…) at ≤ the motion: indent ends the block
        if indent <= base_indent and re.match(r"^\s*\w+:", line):
            break
        items.append(line.strip())
    if not items:
        return None
    try:
        doc = yaml.safe_load("motion:\n" + "\n".join("  " + it for it in items))
        ops = doc.get("motion") if isinstance(doc, dict) else None
        return ops if isinstance(ops, list) and all(isinstance(o, dict) for o in ops) else None
    except Exception:
        return None


# ─── pair-block format (narration + animation coupled per bullet) ───
def _is_pair_block_scene(body: str) -> bool:
    """A scene is pair-block when it has no `### Animation` section header.

    Pair-block scenes interleave narration (`> ...` lines) with each bullet's
    animation description. Detection by absence of the legacy `### Animation`
    marker is sufficient — if a scene has bullets but no Animation header, the
    narration must live inside them.
    """
    return _SECTION_RE.search(body) is None or not any(
        m.group(1).lower() in ("animation", "narration")
        for m in _SECTION_RE.finditer(body)
    )


def _extract_pair_blocks(body: str) -> tuple[str, list[AnimationBullet]]:
    """Pair-block parser. Each bullet body contains:
      - one or more `> narration` lines (the spoken sentences for THIS bullet)
      - the animation description (everything else)
    Returns (concatenated_narration, animation_bullets).
    """
    matches = list(_ANIM_BULLET.finditer(body))
    bullets: list[AnimationBullet] = []
    narration_parts: list[str] = []

    for i, m in enumerate(matches):
        start_body = m.end()
        end_body = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        block = body[start_body:end_body]

        narr_lines: list[str] = []
        anim_lines: list[str] = []
        for line in block.splitlines():
            stripped = line.strip()
            if stripped.startswith(">"):
                narr_lines.append(stripped[1:].strip())
            else:
                anim_lines.append(line)

        first_tail = m.group(4).strip()
        anim_body_raw = " ".join([first_tail] + anim_lines).strip() if first_tail else " ".join(anim_lines)
        body_full = _strip_markdown(anim_body_raw)

        if narr_lines:
            narration_parts.append(" ".join(narr_lines))

        from_sec = _to_sec(*m.group(1).split(":"))
        to_sec = _to_sec(*m.group(2).split(":"))
        headline = _strip_markdown(m.group(3))

        spotlight_items = None
        sm = _SPOTLIGHT_RE.search(body_full)
        if sm:
            spotlight_items = [item.strip() for item in sm.group(1).split('|') if item.strip()]
            body_full = _SPOTLIGHT_RE.sub('', body_full).strip()

        bullets.append(AnimationBullet(
            time_from_sec=from_sec,
            time_to_sec=to_sec,
            headline=headline,
            body=body_full,
            spotlight_items=spotlight_items,
            ops=_extract_motion_ops(block),   # structured `motion:` YAML → op·topology·params
        ))

    narration = _strip_markdown(" ".join(narration_parts))
    return narration, bullets


# ─── JSON render contract (canonical machine handover) ───
def _lint_json(source_path: Path) -> list[str]:
    """Soft warnings for a JSON render contract. Hard violations raise in _parse_json;
    this reports quality gaps (missing briefs, thin bullets) the user should fix."""
    warnings: list[str] = []
    try:
        data = json.loads(source_path.read_text(encoding="utf-8"))
    except Exception as e:
        return [f"not valid JSON: {e}"]
    if not isinstance(data, dict) or not isinstance(data.get("scenes"), list):
        return ["not a render contract (missing top-level 'scenes' array)"]
    if not str(data.get("global_style", "")).strip():
        warnings.append("no global_style — every scene will guess the art direction")
    if not str(data.get("script_ready", "")).startswith("SCRIPT-READY:"):
        warnings.append("script_ready field missing or malformed (render gate reads it)")
    for sc in data["scenes"]:
        num = sc.get("number", "?")
        if not str(sc.get("description", "")).strip():
            warnings.append(f"scene {num}: no description (director's brief) — codegen will invent")
        if not str(sc.get("design", "")).strip():
            warnings.append(f"scene {num}: no design block — layout/camera/through-line unguided")
        for bi, b in enumerate(sc.get("bullets") or [], 1):
            if not str(b.get("what_happens", "")).strip():
                warnings.append(f"scene {num} bullet {bi}: no what_happens beat sequence")
    return warnings


def _parse_json(source_path: Path) -> SourceScript:
    """Parse the JSON render contract (docs/render-contract.schema.json) into the SAME
    SourceScript/Scene/AnimationBullet structure the .txt parser produces.

    Contract highlights (each mirrors a pair-block guarantee, enforced HARD here):
      - every bullet carries its OWN narration sentences → scene narration is their
        in-order concatenation (identical to pair-block assembly);
      - `pause_after_ms` ≥ 400 on a sentence emits an explicit `<pause X.Xs>` tag
        (same tag the .txt path uses — the TTS/SSML pipeline is unchanged);
      - `audio_anchor` MUST appear verbatim in the bullet's own narration (drift-proof
        by construction — a violation raises, it does not silently mis-sync);
      - labeled brief fields (what_happens/text/image/visual_intent/emphasis) are
        assembled into the bullet `body`, so downstream `audio_anchor:`/`anchor_mode:`
        extraction and the codegen brief work with zero changes.
    """
    data = json.loads(source_path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or "scenes" not in data:
        raise ValueError(f"{source_path}: not a render contract (missing top-level 'scenes')")
    title = str(data.get("title") or source_path.stem).strip()
    global_style = str(data.get("global_style", "")).strip()
    reference_assets = str(data.get("reference_assets", "")).strip()

    scenes: list[Scene] = []
    for si, sc in enumerate(data["scenes"], 1):
        try:
            scene_num = int(sc["number"])
            scene_title = str(sc["title"]).strip()
            win_from = float(sc["window_from_sec"])
            win_to = float(sc["window_to_sec"])
        except (KeyError, TypeError, ValueError) as e:
            raise ValueError(f"{source_path}: scene #{si} missing/invalid required field: {e}")
        if win_to <= win_from:
            raise ValueError(f"Scene {scene_num} '{scene_title}': window_to_sec must exceed window_from_sec")
        raw_bullets = sc.get("bullets") or []
        if not raw_bullets:
            raise ValueError(f"Scene {scene_num} '{scene_title}' has no bullets")

        narration_parts: list[str] = []
        bullets: list[AnimationBullet] = []
        for bi, b in enumerate(raw_bullets, 1):
            where = f"Scene {scene_num} bullet {bi}"
            try:
                from_sec = float(b["time_from_sec"])
                to_sec = float(b["time_to_sec"])
                headline = str(b["headline"]).strip()
                anchor = str(b["audio_anchor"]).strip()
                sentences = b["narration"]
            except (KeyError, TypeError, ValueError) as e:
                raise ValueError(f"{where}: missing/invalid required field: {e}")
            if not sentences or not isinstance(sentences, list):
                raise ValueError(f"{where}: 'narration' must be a non-empty array of sentence objects")

            sent_texts: list[str] = []
            emphasis_words: list[str] = []
            for s in sentences:
                t = str(s.get("text", "")).strip()
                if not t:
                    raise ValueError(f"{where}: a narration sentence has empty 'text'")
                pa = int(s.get("pause_after_ms") or 0)
                if pa >= 400 and "<pause" not in t[-20:]:
                    t += f" <pause {pa / 1000:.1f}s>"
                sent_texts.append(t)
                ew = str(s.get("emphasis_word", "")).strip()
                if ew:
                    emphasis_words.append(ew)
            bullet_narr = " ".join(sent_texts)
            narration_parts.append(bullet_narr)

            # Pair-block anchor guarantee, enforced (compare with pause tags stripped).
            plain = re.sub(r"<pause[^>]*>", " ", bullet_narr)
            plain = re.sub(r"\s+", " ", plain).lower()
            if anchor and anchor.lower() not in plain:
                raise ValueError(
                    f"{where}: audio_anchor '{anchor}' is not a verbatim phrase of the bullet's own narration"
                )

            # Assemble the free-form brief `body` — same labeled-line convention the
            # .txt path space-joins, so downstream extraction/codegen is unchanged.
            parts: list[str] = []
            if str(b.get("what_happens", "")).strip():
                parts.append("what happens: " + str(b["what_happens"]).strip())
            if str(b.get("text", "")).strip():
                parts.append("text: " + str(b["text"]).strip())
            if str(b.get("image", "")).strip():
                parts.append("image: " + str(b["image"]).strip())
            if str(b.get("visual_intent", "")).strip():
                parts.append("hint: " + str(b["visual_intent"]).strip())
            if emphasis_words:
                parts.append("emphasis: " + ", ".join(emphasis_words))
            parts.append("audio_anchor: " + anchor)
            parts.append("anchor_mode: " + str(b.get("anchor_mode", "appear")).strip().lower())
            body_full = " ".join(parts)

            spotlight_items = None
            sm = _SPOTLIGHT_RE.search(body_full)
            if sm:
                spotlight_items = [item.strip() for item in sm.group(1).split("|") if item.strip()]
                body_full = _SPOTLIGHT_RE.sub("", body_full).strip()

            ops = b.get("ops")
            if ops is not None and not (isinstance(ops, list) and all(isinstance(o, dict) for o in ops)):
                raise ValueError(f"{where}: 'ops' must be null or a list of operator objects")

            bullets.append(AnimationBullet(
                time_from_sec=from_sec,
                time_to_sec=to_sec,
                headline=headline,
                body=body_full,
                spotlight_items=spotlight_items,
                ops=ops,
                raw=b,   # the original structured object — LLM codegen reads this directly
            ))

        scenes.append(Scene(
            number=scene_num,
            title=scene_title,
            window_from_sec=win_from,
            window_to_sec=win_to,
            narration=" ".join(narration_parts),
            animation=bullets,
            pacing=str(sc.get("pacing", "")).strip(),
            description=str(sc.get("description", "")).strip(),
            design=str(sc.get("design", "")).strip(),
            global_style=global_style,
        ))

    return SourceScript(
        title=title,
        scenes=scenes,
        global_style=global_style,
        reference_assets=reference_assets,
    )


# ─── self-test ───
if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        print("Usage: python source_parser.py <path/to/source.txt>"); sys.exit(1)
    src = sys.argv[1]
    script = parse(src)
    print(f"Title: {script.title}")
    print(f"Scenes: {len(script.scenes)}")
    for s in script.scenes:
        print(f"\n── Scene {s.number}: {s.title} ({s.window_from_sec:.0f}-{s.window_to_sec:.0f}s)")
        print(f"   Narration: {len(s.narration.split())} words")
        print(f"   Animation: {len(s.animation)} bullets")
        for b in s.animation:
            print(f"     [{b.time_from_sec:>5.1f}-{b.time_to_sec:>5.1f}s] {b.headline[:60]}")
