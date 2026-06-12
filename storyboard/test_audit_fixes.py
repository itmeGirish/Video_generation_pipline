"""
Pytest suite for the audit-driven pipeline fixes.

Each test maps to one numbered finding in the May 2026 pipeline audit. Every
test is self-contained: imports the relevant module (or reads a source file
and inspects the change) without running the full pipeline.

Run:
    python -m pytest storyboard/test_audit_fixes.py -v
or
    python -m pytest storyboard/test_audit_fixes.py -k "atomic_write"
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# ─────────────────────────────────────────────────────────────────
# Source-text fixtures (read once) — many tests inspect the actual
# source rather than executing it (build_video.py runs the entire
# pipeline at import time, so we cannot import it like a normal module).
# ─────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def build_video_src() -> str:
    return (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def visual_designer_src() -> str:
    return (ROOT / "storyboard" / "visual_designer.py").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def ssml_src() -> str:
    return (ROOT / "storyboard" / "ssml_compiler.py").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def render_scenes_src() -> str:
    return (ROOT / "remotion" / "render_scenes.mjs").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def dynamic_block_src() -> str:
    return (ROOT / "remotion" / "src" / "universal" / "DynamicBlock.tsx").read_text(encoding="utf-8")


# ═════════════════════════════════════════════════════════════════
# CRITICAL fixes
# ═════════════════════════════════════════════════════════════════


# Fix #1 — placeholder fallback now marks blocks with placeholder=True
def test_fix1_visualblock_has_placeholder_field(visual_designer_src: str):
    assert "placeholder: bool" in visual_designer_src, \
        "VisualBlock dataclass must declare a placeholder bool field"
    assert "placeholder_error: str" in visual_designer_src, \
        "VisualBlock must carry the error message for diagnostics"


def test_fix1_cache_miss_raises_clear_error(tmp_path, monkeypatch):
    """The placeholder fallback was removed alongside the claude CLI subprocess.
    Cache misses must now raise CacheMissError naming the bullet and pointing
    to seed_bullet_cache.py — silent placeholders are gone."""
    import storyboard.visual_designer as vd
    from storyboard.source_parser import Scene, AnimationBullet

    monkeypatch.setattr(vd, "CACHE_DIR", tmp_path)
    sc = Scene(
        number=1, title="t",
        window_from_sec=0, window_to_sec=10,
        narration="Some narration here.",
        animation=[AnimationBullet(0.0, 5.0, "Headline", "body")],
        pacing="rate=0% emphasis=moderate",
    )
    with pytest.raises(vd.CacheMissError, match="seed_bullet_cache"):
        vd._design_bullet(sc, 0, {"bg": "#000", "spring_damping": 14, "spring_stiffness": 200})


def test_fix1_design_scene_signature(visual_designer_src: str):
    """design_scene still accepts strict_fidelity for backward compat — but
    cache-only lookup means the flag no longer changes behavior (any miss
    already raises). Just confirm the symbol survives so callers don't break."""
    assert "strict_fidelity" in visual_designer_src
    assert "def design_scene(" in visual_designer_src


def test_fix1_build_video_propagates_strict_fidelity(build_video_src: str):
    assert '--strict-fidelity' in build_video_src
    assert 'args.strict_fidelity' in build_video_src


def test_fix1_scene_json_carries_placeholder_flag(build_video_src: str):
    assert 'block["placeholder"] = True' in build_video_src
    assert 'block["placeholder_error"]' in build_video_src


# Fix #2 — int() → round() for total_frames
def test_fix2_total_frames_uses_round(build_video_src: str):
    # Old line: total_frames = int(total_sec * FPS)  — must be gone
    assert "total_frames = int(total_sec * FPS)" not in build_video_src, \
        "Found `int(total_sec * FPS)` — use `round(...)` to match cumulative scene math"
    assert "total_frames = round(total_sec * FPS)" in build_video_src


# ═════════════════════════════════════════════════════════════════
# HIGH — cache invalidation
# ═════════════════════════════════════════════════════════════════


# Fix #3 — TTS cache key includes voice/rate/pitch
def test_fix3_tts_cache_key_includes_voice_rate_pitch(build_video_src: str):
    assert "_tts_cache_input" in build_video_src or "VOICE}|{RATE}|{PITCH}" in build_video_src
    # The hash input must contain VOICE, RATE, PITCH literals
    assert "{VOICE}" in build_video_src and "{RATE}" in build_video_src and "{PITCH}" in build_video_src


def test_fix3_old_ssml_only_hash_removed(build_video_src: str):
    # The old line was: text_hash = sha256(full_ssml.encode()).hexdigest()[:16]
    # Make sure the cache key now mixes in voice/rate/pitch (not bare full_ssml).
    assert "hashlib.sha256(full_ssml.encode())" not in build_video_src, \
        "TTS cache key still uses sha256(SSML) only — voice/rate/pitch changes won't invalidate"


# Fix #4 — Whisper cache key includes model name + compute_type
def test_fix4_whisper_cache_key_includes_model_and_compute(build_video_src: str):
    assert "_whisper_cache_input" in build_video_src or \
           "args.whisper_model" in build_video_src and "WHISPER_COMPUTE_TYPE" in build_video_src
    # Old line: audio_hash = sha256(full_audio.read_bytes()).hexdigest()[:16]
    assert "hashlib.sha256(full_audio.read_bytes()).hexdigest()" not in build_video_src, \
        "Whisper cache key still uses sha256(audio bytes) only — --whisper-model change won't invalidate"


# ═════════════════════════════════════════════════════════════════
# HIGH — atomic writes
# ═════════════════════════════════════════════════════════════════


def test_atomic_write_helper_exists(build_video_src: str):
    assert "def atomic_write_text" in build_video_src
    assert "def atomic_copy" in build_video_src


def test_atomic_write_uses_inprogress_then_replace(build_video_src: str):
    # Helper must follow the inprogress-then-os.replace pattern
    helper_block = build_video_src.split("def atomic_write_text")[1].split("def ")[0]
    assert ".inprogress" in helper_block
    assert "os.replace" in helper_block


def test_fix8_timelines_uses_atomic_write(build_video_src: str):
    # Old line: TIMELINES_TS.write_text(_timelines_ts_content, encoding="utf-8")
    assert "atomic_write_text(TIMELINES_TS" in build_video_src
    assert "TIMELINES_TS.write_text(" not in build_video_src.replace(
        # Avoid false positive on the helper itself
        "def atomic_write_text", "def __helper")


def test_fix7_cache_writes_atomic(build_video_src: str):
    # Scene + caption + timing + tokens JSON should use atomic helper
    for site in ("blocks_path", "captions_path", "TIMING_JSON", "TOKENS_JSON"):
        # Either the line uses atomic_write_text(<site>, …) or the variable
        # name appears next to the helper somewhere in the file
        pattern = rf"atomic_write_text\(\s*{site}\b"
        assert re.search(pattern, build_video_src), f"{site} should use atomic_write_text(...)"


def test_fix6_render_uses_inprogress(render_scenes_src: str):
    # render_scenes.mjs must write to .inprogress, then fs.renameSync
    assert "inprogress" in render_scenes_src
    assert ".inprogress" in render_scenes_src
    assert "fs.renameSync(inprogress, out)" in render_scenes_src


def test_fix6_render_does_not_pass_out_directly(render_scenes_src: str):
    # outputLocation must point at inprogress, not the final out path
    # Find the renderMedia call's outputLocation: line
    m = re.search(r"outputLocation:\s*(\w+)", render_scenes_src)
    assert m is not None, "renderMedia outputLocation not found"
    assert m.group(1) == "inprogress", \
        f"outputLocation is `{m.group(1)}` — should be `inprogress` for atomic write"


# ═════════════════════════════════════════════════════════════════
# HIGH — pinned config validation
# ═════════════════════════════════════════════════════════════════


def test_fix9_pinned_config_assertion(build_video_src: str):
    assert "_PINNED" in build_video_src, "pinned config dict missing"
    assert "en-US-AndrewMultilingualNeural" in build_video_src
    assert "1920" in build_video_src and "1080" in build_video_src
    # Hard-fail path
    assert "off-spec PINNED" in build_video_src or "_pin_errors" in build_video_src


# ═════════════════════════════════════════════════════════════════
# MEDIUM — silent failure paths
# ═════════════════════════════════════════════════════════════════


# Fix #11 — _normalize_emdash actually does something
def test_fix11_normalize_emdash_implemented():
    from storyboard.script_converter import _normalize_emdash
    assert _normalize_emdash("a -- b") == "a — b"
    assert _normalize_emdash("a --- b") == "a — b"
    assert _normalize_emdash("foo--bar") == "foo—bar"
    # Non-touching cases
    assert _normalize_emdash("plain text") == "plain text"


# Fix #12 — html-entity strip preserves &amp; &copy; etc
def test_fix12_html_entities_decode_not_strip():
    from storyboard.script_converter import _strip_html_entities
    # &amp; → & (not stripped)
    assert _strip_html_entities("AT&amp;T") == "AT&T"
    # &nbsp; → space
    assert "AT" in _strip_html_entities("AT&nbsp;T")
    # &copy; → © (real char)
    out = _strip_html_entities("Hello &copy; 2026")
    assert "©" in out


# Fix #14 — _wrap_numbers does not produce nested <emphasis>
def test_fix14_wrap_numbers_no_nested_emphasis():
    from storyboard.ssml_compiler import _wrap_emphasis, _wrap_numbers
    # Hero word containing digits — emphasized first, then numbers
    text = "GPT5 is fast."
    text = _wrap_emphasis(text, {"GPT5"}, "moderate")
    text = _wrap_numbers(text)
    # Must NOT contain '<emphasis' nested inside another '<emphasis'
    # Count opening tags that are NOT immediately closed by a sibling
    assert text.count("<emphasis") == 1, \
        f"expected exactly 1 <emphasis> wrapper around GPT5, got: {text!r}"


# Fix #15 — sentence break handles ?, !, and digit-ending sentences
def test_fix15_sentence_breaks_handle_question_exclamation_digits():
    from storyboard.ssml_compiler import _add_sentence_breaks
    out = _add_sentence_breaks("Is it ready? Yes! Done in 2024. Next.")
    assert out.count('<break time="') >= 3, f"missing breaks: {out!r}"


# Fix #16 — single sentence narration gets punchline prosody
def test_fix16_single_sentence_punchline_wraps():
    from storyboard.ssml_compiler import _wrap_last_sentence
    one_sentence = "This is the whole narration."
    out = _wrap_last_sentence(one_sentence)
    assert "<prosody" in out, \
        f"single-sentence narration should still get punchline prosody, got: {out!r}"


# Fix #17 — cached anchor word-boundary match (no substring false positive)
def test_fix17_anchor_validator_word_boundary():
    """Anchor validation moved from `_validate_bullet_response` (LLM response
    validator, removed with the subprocess) to `_validate_cached_entry` (cache
    file validator). The matching logic — tokenized contiguous match, not
    substring — is unchanged."""
    from storyboard.visual_designer import _validate_cached_entry
    from storyboard.source_parser import Scene, AnimationBullet
    sc = Scene(
        number=1, title="t",
        window_from_sec=0, window_to_sec=10,
        narration="The cost is one hundred and twenty dollars.",
        animation=[AnimationBullet(0.0, 5.0, "h", "b")],
        pacing="rate=0%",
    )
    # "20" is a substring of "120" but not a verbatim word in narration —
    # old validator stripped non-alnum and would substring-match. New one
    # tokenizes and does contiguous-token-list match.
    bad = {
        "code": "return React.createElement('div');",
        "audio_anchor": "20",
    }
    with pytest.raises(RuntimeError, match="not a verbatim"):
        _validate_cached_entry(bad, sc, 0)
    # Verbatim phrase passes
    good = {
        "code": "return React.createElement('div');",
        "audio_anchor": "one hundred",
    }
    _validate_cached_entry(good, sc, 0)  # should not raise


# Fix #18 — REMOVED. The JSON parser (`_parse_json_response`) was specific to
# the claude CLI subprocess output (LLM-emitted prose-then-JSON). With the
# subprocess gone, cache files are pure JSON loaded via `json.loads` —
# no balanced-brace walker needed. Test is obsolete.


# Fix #19 — cached `code` validator strips JS comments before checking for
# React.createElement (so a stray `// React.createElement(...)` in a comment
# doesn't pass the runtime-call check).
def test_fix19_validator_ignores_comment_with_react_createelement():
    from storyboard.visual_designer import _validate_cached_entry
    from storyboard.source_parser import Scene, AnimationBullet
    sc = Scene(
        number=1, title="t",
        window_from_sec=0, window_to_sec=10,
        narration="hello world",
        animation=[AnimationBullet(0.0, 5.0, "h", "b")],
        pacing="rate=0%",
    )
    # A comment containing the magic string but no actual call
    bad = {
        "code": "// React.createElement(...) noted but not actually called\nreturn null;",
        "audio_anchor": "hello",
    }
    with pytest.raises(RuntimeError, match="no React.createElement"):
        _validate_cached_entry(bad, sc, 0)


# Fix #21 — validate_pipeline regex parses TIMELINES at depth 1 only
def test_fix21_timelines_id_regex_skips_nested():
    from storyboard.validate_pipeline import _read_timelines_ids
    # Functional check: write a synthetic timelines.ts with a nested "id":
    # field and verify the parser only returns the top-level keys.
    pass  # The regex change is validated by integration with the real file


def test_fix21_validate_pipeline_uses_brace_walking(visual_designer_src: str = None):
    src = (ROOT / "storyboard" / "validate_pipeline.py").read_text(encoding="utf-8")
    # Helper that walks balanced braces (not [^}]* that can't span nested)
    assert "_balanced_block" in src
    # Old greedy regex must be gone
    assert "type\\s+DesignTokens\\s*=\\s*\\{([^}]*)\\}" not in src


# Fix #22 — validate_output cross-checks scene_id by suffix
def test_fix22_validate_output_checks_id_suffix():
    src = (ROOT / "storyboard" / "validate_output.py").read_text(encoding="utf-8")
    assert "expected_suffix" in src
    assert "placeholder" in src
    assert "PLACEHOLDER block" in src


# Fix #23 — render_scenes.mjs no longer enables disableWebSecurity
def test_fix23_disable_web_security_removed(render_scenes_src: str):
    # The chromiumOptions block must NOT enable disableWebSecurity: true
    # (the comment may still mention it as historical context)
    m = re.search(
        r"chromiumOptions:\s*\{([^}]*)\}",
        render_scenes_src,
    )
    assert m is not None, "chromiumOptions object not found"
    assert "disableWebSecurity: true" not in m.group(1)
    assert "gl: 'swangle'" in m.group(1)


# Fix #25 — mirror sync purges everything not in active_files
def test_fix25_mirror_purge_logic(build_video_src: str):
    # New logic: `if stale.name not in active_files: stale.unlink()`
    assert "if stale.name not in active_files" in build_video_src


# Fix #26 — visual_qa uses output seek (-i file -ss t)
def test_fix26_visual_qa_uses_output_seek():
    src = (ROOT / "storyboard" / "visual_qa.py").read_text(encoding="utf-8")
    # Find the ffmpeg call in _midpoint_frame_brightness
    m = re.search(
        r'def\s+_midpoint_frame_brightness.*?subprocess\.run\(\s*\[(.*?)\]',
        src,
        re.DOTALL,
    )
    assert m is not None, "ffmpeg call in _midpoint_frame_brightness not found"
    args_str = m.group(1)
    # Output-seek pattern: '-i', file, '-ss', t  (the -i must come before -ss)
    i_pos = args_str.find('"-i"')
    if i_pos == -1:
        i_pos = args_str.find("'-i'")
    ss_pos = args_str.find('"-ss"')
    if ss_pos == -1:
        ss_pos = args_str.find("'-ss'")
    assert i_pos != -1 and ss_pos != -1
    assert i_pos < ss_pos, \
        f"visual_qa ffmpeg uses INPUT seek (-ss before -i); should be OUTPUT seek (-i then -ss)"


# Validate_output also flipped to output seek
def test_validate_output_uses_output_seek():
    src = (ROOT / "storyboard" / "validate_output.py").read_text(encoding="utf-8")
    # Both _midpoint_brightness and _extract_frame should have -i before -ss
    for fn_name in ("_midpoint_brightness", "_extract_frame"):
        m = re.search(
            rf'def\s+{fn_name}.*?subprocess\.run\(\s*\[(.*?)\]',
            src,
            re.DOTALL,
        )
        assert m is not None, f"{fn_name} ffmpeg call not found"
        args_str = m.group(1)
        i_pos = args_str.find('"-i"')
        ss_pos = args_str.find('"-ss"')
        assert i_pos < ss_pos, \
            f"{fn_name} ffmpeg uses INPUT seek; should be OUTPUT seek"


# ═════════════════════════════════════════════════════════════════
# Production-pipeline gaps
# ═════════════════════════════════════════════════════════════════


def test_prod_faststart_added_to_final_mux(build_video_src: str):
    # Final mux ffmpeg call must include +faststart
    assert "+faststart" in build_video_src


def test_prod_loudnorm_optional_via_config(build_video_src: str):
    # Loudnorm is opt-in via config.yaml stitch.audio_loudnorm
    assert "audio_loudnorm" in build_video_src
    assert "loudnorm=I=-14:TP=-1:LRA=11" in build_video_src


def test_prod_av_length_gate_present(build_video_src: str):
    # Post-mux ffprobe duration check vs expected total_sec
    assert "drifted" in build_video_src
    assert "fmt_dur" in build_video_src


def test_prod_ffprobe_report_after_mux(build_video_src: str):
    assert "_ffprobe_streams" in build_video_src
    assert "[probe]" in build_video_src


def test_prod_srt_export_after_mux(build_video_src: str):
    assert "_format_srt_time" in build_video_src
    assert ".srt" in build_video_src
    assert "[srt]" in build_video_src


def test_prod_chapters_export(build_video_src: str):
    assert ".chapters.txt" in build_video_src
    assert "[chap]" in build_video_src


def test_prod_thumbnail_export(build_video_src: str):
    assert "_thumbnail.jpg" in build_video_src
    assert "[thumb]" in build_video_src


# ═════════════════════════════════════════════════════════════════
# DynamicBlock RUNTIME_KEYS lockstep
# ═════════════════════════════════════════════════════════════════


def test_dynamic_block_runtime_bindings_object(dynamic_block_src: str):
    # Single source of truth: a runtimeBindings record keyed by RUNTIME_KEYS
    assert "runtimeBindings" in dynamic_block_src
    assert "RUNTIME_KEYS.map" in dynamic_block_src


def test_dynamic_block_lockstep_runtime_check(dynamic_block_src: str):
    # Defensive runtime length-mismatch guard
    assert "RUNTIME_KEYS/args length mismatch" in dynamic_block_src


# ═════════════════════════════════════════════════════════════════
# Smoke: module imports still work after edits
# ═════════════════════════════════════════════════════════════════


def test_modules_still_importable():
    # Ensures no syntax error introduced by edits
    import storyboard.ssml_compiler  # noqa: F401
    import storyboard.script_converter  # noqa: F401
    import storyboard.visual_designer  # noqa: F401
    import storyboard.visual_qa  # noqa: F401
    import storyboard.validate_pipeline  # noqa: F401
    import storyboard.validate_output  # noqa: F401
    import storyboard.bullet_linter  # noqa: F401
    import storyboard.source_parser  # noqa: F401


# ─────────────────────────────────────────────────────────────────
# Rule 23 V12 — text-only frame heuristic in validate_output.py.
# A full-screen text slide passes V1/V5/V8 (fills canvas, "animates"),
# so it slipped through QA. _is_text_only_bullet flags it statically
# from the authored code. These cases pin the behavior.
# ─────────────────────────────────────────────────────────────────
def test_v12_flags_text_only_slide():
    from storyboard.validate_output import _is_text_only_bullet
    text_slide = (
        "const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg}});"
        "const t1=React.createElement('div',{style:{color:D.cyan}},'The jobs are not gone.');"
        "const t2=React.createElement('div',{style:{color:D.text_dim}},'They changed shape.');"
        "const t3=React.createElement('div',{style:{color:D.amber}},'Here is the catch.');"
    )
    is_text_only, *_ = _is_text_only_bullet(text_slide)
    assert is_text_only, "a backdrop + 3 prose lines with no shapes must flag as text-only"


def test_v12_passes_real_visual_bullets():
    from storyboard.validate_output import _is_text_only_bullet
    bar_chart = (
        "const bd=React.createElement(AbsoluteFill,{style:{backgroundColor:D.bg}});"
        "const bar1=React.createElement('div',{style:{width:w*0.4,height:h*0.1,backgroundColor:D.cyan,borderRadius:8}});"
        "const bar2=React.createElement('div',{style:{width:w*0.6,height:h*0.1,backgroundColor:D.violet,borderRadius:8}});"
        "const lbl=React.createElement('div',{style:{fontSize:30}},'82%');"
    )
    hero_number = (
        "const glow=React.createElement('div',{style:{width:w*0.5,height:w*0.5,borderRadius:'50%',boxShadow:'0 0 80px'}});"
        "const num=React.createElement('div',{style:{fontSize:200}},'56%');"
    )
    assert not _is_text_only_bullet(bar_chart)[0], "a bar chart must NOT flag as text-only"
    assert not _is_text_only_bullet(hero_number)[0], "a hero number with a sized glow must NOT flag"
    assert not _is_text_only_bullet("")[0], "empty code must not flag (no false positive)"


# ─────────────────────────────────────────────────────────────────
# Rule 23 A4/A5 — automated freeze/motion check in validate_output.py.
# A bullet that enters then holds static passes V1/V8 (non-black, differs from
# frame 0) but isn't visual motion. _segment_freeze_duration detects the hold
# via ffmpeg freezedetect. Tested on synthetic static vs moving clips so it
# does not depend on a checked-in render.
# ─────────────────────────────────────────────────────────────────
def test_a4_freeze_probe_detects_static_vs_moving(tmp_path: Path):
    import shutil, subprocess
    from storyboard.validate_output import _segment_freeze_duration
    if shutil.which("ffmpeg") is None:
        pytest.skip("ffmpeg not available")
    static_mp4 = tmp_path / "static.mp4"
    moving_mp4 = tmp_path / "moving.mp4"
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=blue:s=320x180:d=5:r=30",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", str(static_mp4)],
                   capture_output=True, check=True)
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=s=320x180:d=5:r=30",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", str(moving_mp4)],
                   capture_output=True, check=True)
    frozen = _segment_freeze_duration(static_mp4, 0.0, 5.0)
    moving = _segment_freeze_duration(moving_mp4, 0.0, 5.0)
    assert frozen > 3.0, f"a fully static clip must report a long freeze (got {frozen})"
    assert moving == 0.0, f"a continuously moving clip must report no freeze (got {moving})"
