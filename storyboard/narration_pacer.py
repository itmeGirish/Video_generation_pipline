"""
narration_pacer — fundamental fix for visual-display-time underflow.

PROBLEM (proven on difference_txt scene 1, 2026-05-07):
  The audio_anchor system positions each bullet's framesFrom at the spoken-word
  frame correctly (rule 08). But the bullet's DISPLAY DURATION is bounded by
  the gap between its anchor and the next bullet's anchor. When source
  narration packs anchors close together (e.g. "Eight minutes. No fluff." —
  two anchors 1.4s apart), the bullet only displays for 1.4s — too short for
  a 4-row checklist to be read while it is being read.

SOLUTION:
  Insert <pause Xs> markers in the narration BEFORE consecutive-bullet anchors
  whose natural audio gap is shorter than the bullet's required display time.
  The narration text grows; the SSML compiler converts <pause> → <break time/>;
  edge-tts produces longer audio; Whisper still finds the same anchor words at
  later timestamps; framesFrom stays anchor-locked but the display window
  widens. Video gets longer; saying matches showing.

REQUIRED display time per bullet:
  max( source_script_window_seconds,    # author's stated intent
       content_heuristic_seconds,       # text-density estimate
       MIN_DISPLAY_SECONDS )            # floor

The source script's `time_from_sec` / `time_to_sec` fields are NOT used for
positioning (that's anchor-only — see rule 08). They are used here ONLY as a
declaration of intended display duration. That's a different role.
"""
from __future__ import annotations

import re

from .source_parser import Scene, AnimationBullet


# Minimum display per bullet, regardless of script/content
MIN_DISPLAY_SECONDS = 1.5
# Hard cap so a verbose script can't blow up scene length.
# 2.0s means narration flows continuously — only tiny pauses inserted.
# Large script windows (e.g. 5s curriculum card) no longer cause multi-second silences.
MAX_DISPLAY_SECONDS = 2.0
# Buffer added on top of estimated shortfall (covers TTS-rate-estimate error)
SHORTFALL_BUFFER_SECONDS = 0.3
# Don't bother inserting tiny pauses (< 300ms reads as noise)
MIN_INSERT_SECONDS = 0.3


def _strip_ssml(text: str) -> str:
    """Strip <…> tags so word/punctuation counts reflect what TTS will speak."""
    return re.sub(r"<[^>]+>", "", text)


def estimate_audio_seconds(text: str, rate_pct: int = 0) -> float:
    """Estimate edge-tts audio duration from plain text.

    Calibrated for en-US-AndrewMultilingualNeural at 0% rate ≈ 2.7 wps.
    Punctuation contributes natural breath pauses on top of the word rate.
    Approximation good to ~10% — enough to decide whether to inject a pause.
    """
    text = _strip_ssml(text)
    words = len(text.split())
    rate_factor = 1.0 + rate_pct / 100.0
    base = words / (2.7 * rate_factor)
    pauses = (
        text.count(",") * 0.18
        + text.count(".") * 0.40
        + text.count(";") * 0.30
        + text.count("!") * 0.35
        + text.count("?") * 0.35
        + text.count(":") * 0.25
    )
    return base + pauses


def _anchor_char_position(narration: str, anchor: str, search_from: int = 0) -> int:
    """Find the character index of `anchor` (verbatim phrase) in `narration`.
    Returns -1 if not found. Case-insensitive on first letter only — anchors
    are usually authored in matching case but the LLM occasionally drifts.
    """
    if not anchor:
        return -1
    pat = re.escape(anchor)
    m = re.search(pat, narration[search_from:])
    if m:
        return search_from + m.start()
    # Soft retry: case-insensitive on first letter (anchor 'Eight' vs narration 'eight')
    if anchor[:1].isupper() or anchor[:1].islower():
        alt = anchor[:1].swapcase() + anchor[1:]
        m = re.search(re.escape(alt), narration[search_from:])
        if m:
            return search_from + m.start()
    return -1


def _required_display_seconds(b: AnimationBullet) -> float:
    """How long should this bullet's visual stay on screen?

    Uses ONLY content-density heuristic — NOT the script time window.
    Script windows caused multi-second silence when narration was shorter than
    the declared window (e.g. 5s window with 'Eight minutes.' = 0.5s narration
    → 4.5s forced silence). Removing the window dependency eliminates that silence.
    Display time is now driven purely by body text length (how long the viewer
    needs to read the visual) capped at MAX_DISPLAY_SECONDS.
    """
    body_len = len(b.body or "")
    content = max(MIN_DISPLAY_SECONDS, body_len / 80.0 + 0.5)
    return min(content, MAX_DISPLAY_SECONDS)


def pace_scene_narration(
    scene: Scene,
    audio_anchors: list[str] | None = None,
) -> tuple[str, list[tuple[int, float]]]:
    """Return (paced_narration, inserted_pauses).

    `audio_anchors` is the per-bullet anchor phrase list from Step 2's visual
    designer (one entry per AnimationBullet, in order). Anchors live on the
    VisualBlock produced by the LLM, not on the source-parser's AnimationBullet,
    so they must be threaded in by the caller.

    paced_narration: the scene's narration text with `<pause Xs>` markers
        inserted before consecutive-bullet anchors whose natural audio gap is
        shorter than the prior bullet's required display time.
    inserted_pauses: list of (bullet_index_after_which_inserted, seconds), for
        logging.

    The narration is NOT mutated in place — the caller assigns the result.
    """
    narration = scene.narration
    bullets: list[AnimationBullet] = list(scene.animation or [])
    if len(bullets) == 0:
        return narration, []
    if audio_anchors is None or len(audio_anchors) != len(bullets):
        # Pacer is a no-op when anchor list is unavailable — caller must pass them.
        return narration, []

    # Locate each anchor's character position; search forward so duplicates
    # of a phrase pick the first occurrence after the previous anchor.
    positions: list[int] = []
    cursor = 0
    for anchor in audio_anchors:
        pos = _anchor_char_position(narration, anchor or "", cursor)
        positions.append(pos)
        cursor = max(cursor, pos + 1) if pos >= 0 else cursor

    inserts: list[tuple[int, float]] = []  # (char_pos_to_insert_at, seconds)
    log: list[tuple[int, float]] = []

    # For each pair (b[i], b[i+1]): if estimated gap audio < required[i], insert pause
    # before b[i+1]'s anchor.
    pacing_rate = 0  # default 0%; per-scene rate handled later by SSML compiler
    rate_match = re.search(r"rate\s*=\s*([+-]?\d+)%", scene.pacing or "")
    if rate_match:
        pacing_rate = int(rate_match.group(1))

    for i in range(len(bullets) - 1):
        if positions[i] < 0 or positions[i + 1] < 0:
            continue
        between_text = narration[positions[i]: positions[i + 1]]
        estimated_gap = estimate_audio_seconds(between_text, pacing_rate)
        required = _required_display_seconds(bullets[i])
        shortfall = required - estimated_gap
        if shortfall >= MIN_INSERT_SECONDS:
            insert_seconds = round(shortfall + SHORTFALL_BUFFER_SECONDS, 2)
            inserts.append((positions[i + 1], insert_seconds))
            log.append((i, insert_seconds))

    # Last bullet: trailing display window = (end_of_scene_narration - lastAnchor).
    # If insufficient, append `<pause Xs>` at end of scene narration.
    last_idx = len(bullets) - 1
    if positions[last_idx] >= 0:
        trailing_text = narration[positions[last_idx]:]
        estimated_trailing = estimate_audio_seconds(trailing_text, pacing_rate)
        required_last = _required_display_seconds(bullets[last_idx])
        shortfall = required_last - estimated_trailing
        if shortfall >= MIN_INSERT_SECONDS:
            insert_seconds = round(shortfall + SHORTFALL_BUFFER_SECONDS, 2)
            # Insert at end of narration (preserve trailing whitespace).
            tail_strip = narration.rstrip()
            tail_ws = narration[len(tail_strip):]
            inserts.append((len(tail_strip), insert_seconds))
            # Re-key tail_ws: handled in apply step
            log.append((last_idx, insert_seconds))

    # Apply inserts in REVERSE order (so earlier positions stay valid).
    paced = narration
    for pos, seconds in sorted(inserts, key=lambda t: t[0], reverse=True):
        marker = f" <pause {seconds:.2f}s> "
        paced = paced[:pos] + marker + paced[pos:]
    return paced, log


def pace_scenes(
    scenes: list[Scene],
    audio_anchors_by_scene: dict[int, list[str]] | None = None,
    verbose: bool = True,
) -> list[Scene]:
    """Walk every scene, mutate scene.narration in place to add pauses.

    `audio_anchors_by_scene[scene.number]` is the list of audio_anchor strings
    from each bullet's VisualBlock (Step 2's designer output), in bullet order.
    The narration text grows; SSML compiler then converts <pause Xs> →
    <break time="Xms"/>.
    """
    for sc in scenes:
        anchors = (audio_anchors_by_scene or {}).get(sc.number)
        paced, inserts = pace_scene_narration(sc, anchors)
        if inserts:
            if verbose:
                total = sum(s for _, s in inserts)
                print(
                    f"      [scene {sc.number}] inserted {len(inserts)} pause(s) totaling "
                    f"{total:.2f}s to honor bullet display-time requirements:"
                )
                for bullet_idx, seconds in inserts:
                    b = sc.animation[bullet_idx]
                    head = (b.headline or "")[:40]
                    print(f"        +{seconds:.2f}s after b{bullet_idx + 1}  {head!r}")
            sc.narration = paced
    return scenes


# ─── self-test ───
if __name__ == "__main__":
    """Self-test reads anchors from the per-bullet design cache (Step 2 output)
    instead of running visual_designer. Each bullet cache file contains the
    audio_anchor field. This makes the self-test fast + deterministic.
    """
    import sys, json, glob, os, re as _re
    from .source_parser import parse

    if len(sys.argv) < 2:
        print("Usage: python -m storyboard.narration_pacer <path/to/structured_script.txt>")
        sys.exit(1)
    sys.stdout.reconfigure(encoding="utf-8")
    script = parse(sys.argv[1])

    # Load anchors from cache (one file per bullet: bullet-s{S}-b{B}-{hash}.json)
    cache_dir = os.path.join(os.path.dirname(__file__), ".cache", "designs")
    anchors_by_scene: dict[int, list[str]] = {}
    for sc in script.scenes:
        anchors: list[str] = []
        for b_idx in range(1, len(sc.animation) + 1):
            files = glob.glob(os.path.join(cache_dir, f"bullet-s{sc.number}-b{b_idx}-*.json"))
            if not files:
                anchors.append("")
                continue
            data = json.load(open(files[0], encoding="utf-8"))
            anchors.append(data.get("audio_anchor", "") or "")
        anchors_by_scene[sc.number] = anchors

    pace_scenes(script.scenes, anchors_by_scene, verbose=True)
    for sc in script.scenes:
        if "<pause" in sc.narration:
            print()
            print(f"--- SCENE {sc.number} ---")
            print(sc.narration)
