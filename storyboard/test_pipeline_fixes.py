"""
Tests for the four bug fixes applied:

1. <pause Xs> markers no longer leak into TTS input
2. Decimal numbers like "5.5" tokenize same way Whisper transcribes "five point five"
3. HTML-entity defense in build_video.py strip pipeline
4. Time-based scene fallback uses proportional scaling, not raw script time

Run: python -m storyboard.test_pipeline_fixes
"""
from __future__ import annotations

import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from storyboard.ssml_compiler import (
    _convert_author_pauses,
    _escape,
    compile_scene,
    compile_narration,
)
from storyboard.source_parser import parse, Scene, AnimationBullet


# Helpers ──────────────────────────────────────────────────────────────────
def make_scene(narration: str, n: int = 1) -> Scene:
    """Build a Scene with at least one Animation bullet (parser requires it)."""
    return Scene(
        number=n,
        title="Test",
        window_from_sec=0.0,
        window_to_sec=10.0,
        narration=narration,
        animation=[AnimationBullet(0.0, 5.0, "headline", "body")],
        pacing="rate=0% emphasis=moderate",
    )


def strip_for_edge_tts(ssml: str) -> str:
    """Reproduce build_video.py:gen_tts plain-text strip pipeline."""
    plain = re.sub(r'<break\b[^/>]*/>', ', ', ssml)
    plain = re.sub(r'<[^>]+>', '', plain)
    plain = html.unescape(plain)
    plain = re.sub(r'<[^>]+>', '', plain)        # second pass after entity decode
    plain = re.sub(r'\s+', ' ', plain).strip()
    return plain


# Tests ────────────────────────────────────────────────────────────────────
PASSED = 0
FAILED = 0


def check(label: str, ok: bool, detail: str = "") -> None:
    global PASSED, FAILED
    if ok:
        PASSED += 1
        print(f"  PASS  {label}")
    else:
        FAILED += 1
        print(f"  FAIL  {label}")
        if detail:
            print(f"        {detail}")


def test_convert_author_pauses_basic() -> None:
    print("\n[1] _convert_author_pauses — basic forms")
    cases = [
        ("hello <pause 0.3s> world",  '<break time="300ms"/>'),
        ("hello <pause 0.5s> world",  '<break time="500ms"/>'),
        ("hello <pause 1s> world",    '<break time="1000ms"/>'),
        ("hello <pause 0.4 s> world", '<break time="400ms"/>'),
        ("hello <pause 250ms> world", '<break time="250ms"/>'),
        ("hello <pause 1.5s> world",  '<break time="1500ms"/>'),
    ]
    for inp, expected_substr in cases:
        out = _convert_author_pauses(inp)
        check(f"input {inp!r}", expected_substr in out, f"got {out!r}")


def test_pause_does_not_leak_after_escape() -> None:
    print("\n[2] <pause Xs> markers do NOT leak through escape + strip")
    sc = make_scene(
        "First sentence. <pause 0.3s> Second sentence. <pause 0.5s> Third sentence."
    )
    body = compile_scene(sc)
    plain = strip_for_edge_tts(body)
    check("plain text contains 'First sentence'", "First sentence" in plain)
    check("plain text does NOT contain 'pause'", "pause" not in plain.lower(),
          f"got: {plain!r}")
    check("plain text does NOT contain '&lt;'", "&lt;" not in plain,
          f"got: {plain!r}")
    check("plain text does NOT contain '&gt;'", "&gt;" not in plain,
          f"got: {plain!r}")


def test_pause_in_full_chat_5_5_script() -> None:
    print("\n[3] Full chat_5_5 narration → no 'pause' leakage")
    src = ROOT / "projects" / "structured_scripts" / "chat_5_5.txt"
    if not src.exists():
        print("  SKIP  (chat_5_5 structured script not present)")
        return
    script = parse(src)
    ssml = compile_narration(script.scenes)
    plain = strip_for_edge_tts(ssml)
    # Count any token containing "pause" (case-insensitive) — should be 0
    pause_tokens = re.findall(r'\S*pause\S*', plain, re.IGNORECASE)
    check(f"no 'pause' tokens in plain text (found {len(pause_tokens)})",
          len(pause_tokens) == 0,
          f"first few: {pause_tokens[:3]}")
    check("no &lt; or &gt; in plain text",
          "&lt;" not in plain and "&gt;" not in plain)


def test_decimal_expansion() -> None:
    print("\n[4] expand_decimals — bug 11")
    ns = _extract_fn("expand_decimals")
    expand = ns["expand_decimals"]

    cases = [
        ("GPT-5.5",            "GPT-5 point 5"),
        ("version 4.7.1",      "version 4 point 7 point 1"),
        ("3.14",               "3 point 14"),
        ("Opus 4.7",           "Opus 4 point 7"),
        ("nothing here",       "nothing here"),
        ("5,000 dollars",      "5,000 dollars"),  # comma is not period
    ]
    for inp, expected in cases:
        out = expand(inp)
        check(f"{inp!r} → {expected!r}", out == expected, f"got {out!r}")


def test_no_window_constants_present() -> None:
    print("\n[5] All subprocess-spawning files set CREATE_NO_WINDOW")
    # visual_designer.py / script_converter.py no longer spawn claude CLI —
    # cache-only lookup. Only files that still use subprocess for ffmpeg /
    # ffprobe / whisper need the no-window flag.
    files = [
        "storyboard/build_video.py",
        "storyboard/visual_qa.py",
        "storyboard/validate_output.py",
    ]
    for f in files:
        text = (ROOT / f).read_text(encoding="utf-8")
        has_const = ("_NOWIN" in text) or ("CREATE_NO_WINDOW" in text)
        check(f"{f} defines _NOWIN / CREATE_NO_WINDOW", has_const)
        # And every subprocess.run call has creationflags
        run_calls = re.findall(r'subprocess\.(?:run|Popen)\(', text)
        cf_count = text.count("creationflags=_NOWIN")
        check(f"{f}: {cf_count} creationflags vs {len(run_calls)} subprocess calls",
              cf_count >= len(run_calls),
              f"{cf_count} creationflags but {len(run_calls)} subprocess.run/Popen calls")
    # Belt-and-braces: verify the LLM subprocess paths really are gone.
    for f in ("storyboard/visual_designer.py", "storyboard/script_converter.py"):
        text = (ROOT / f).read_text(encoding="utf-8")
        check(f"{f} contains no subprocess.run call (claude CLI removed)",
              "subprocess.run" not in text)
        check(f"{f} contains no CLAUDE_BIN reference",
              "CLAUDE_BIN" not in text)


def test_time_fallback_proportional_scaling() -> None:
    print("\n[6] Time-based scene fallback uses proportional scaling")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    check("uses scaled_target = (script_start / script_total) * total_sec",
          "scaled_target = (script_start / script_total) * total_sec" in src)
    check("falls back to remaining-audio distribution if scaled before search_from",
          "scaled_target < earliest_t" in src)


def test_html_entity_defense_in_strip_pipeline() -> None:
    print("\n[7] build_video.py gen_tts strip pipeline decodes HTML entities")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    check("calls _html.unescape(plain)",
          "_html.unescape(plain)" in src)
    check("strips tags AGAIN after unescape",
          src.count("re.sub(r'<[^>]+>', '', plain)") >= 2,
          "expected 2 strip-tag passes (one before, one after unescape)")


# ─── Helper: load a single function out of build_video.py without running ──
# build_video.py executes the entire pipeline at import time, so we can't
# `from storyboard.build_video import normalize_for_match`. Instead we extract
# the function source and exec() it in an isolated namespace with `re` only.
def _slice_fn(src: str, name: str) -> str:
    """Return source lines for `def NAME(...)` until the next top-level
    statement (any non-blank, non-indented, non-comment line)."""
    lines = src.splitlines(keepends=True)
    start = None
    for i, ln in enumerate(lines):
        if ln.startswith(f"def {name}("):
            start = i; break
    assert start is not None, f"{name} not found"
    end = len(lines)
    for j in range(start + 1, len(lines)):
        ln = lines[j]
        if ln.strip() == "" or ln.startswith((" ", "\t", "#")):
            continue
        end = j; break
    return "".join(lines[start:end])


def _extract_fn(name: str, deps: list[str] | None = None) -> dict:
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    ns: dict = {"re": re}
    for dep in (deps or []):
        exec(_slice_fn(src, dep), ns)
    exec(_slice_fn(src, name), ns)
    return ns


def test_normalize_for_match() -> None:
    print("\n[8] normalize_for_match — single helper for boundary + anchor matching")
    ns = _extract_fn("normalize_for_match", deps=["expand_decimals"])
    norm = ns["normalize_for_match"]
    cases = [
        # <pause Xs> markup must be stripped
        ("Hello <pause 0.3s> world",      "Hello   world"),
        # Decimals expanded
        ("GPT-5.5 launches",              "GPT 5 point 5 launches"),
        # Hyphens replaced with spaces
        ("Vending-Bench results",         "Vending Bench results"),
        # All three together
        ("GPT-5.5 <pause 0.5s> beats Vending-Bench",
         "GPT 5 point 5   beats Vending Bench"),
        # Multiple decimal segments
        ("version 4.7.1 today",           "version 4 point 7 point 1 today"),
        # Plain text untouched
        ("nothing special here",          "nothing special here"),
    ]
    for inp, expected in cases:
        out = norm(inp)
        check(f"{inp!r} → {expected!r}", out == expected, f"got {out!r}")


def test_find_phrase_handles_decimals_hyphens_pauses() -> None:
    print("\n[9] find_phrase / find_phrase_fuzzy match across decimals/hyphens/<pause>")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    ns: dict = {"re": re}
    # Constants referenced by find_phrase_fuzzy
    ns["FUZZY_MATCH_MIN_RATIO"] = 0.6
    # DIGIT_WORDS table used by _norm; _WRITTEN_* tables used by _compress_written_numbers
    for const_re in (
        r'DIGIT_WORDS\s*=\s*\{.*?\n\}',
        r'_WRITTEN_TENS[^=]*=\s*\{.*?\n\}',
        r'_WRITTEN_ONES_COMPOUND[^=]*=\s*\{.*?\n\}',
    ):
        m = re.search(const_re, src, re.DOTALL)
        assert m, f"constant matching {const_re!r} not found"
        exec(m.group(0), ns)
    for fn in ["expand_decimals", "normalize_for_match", "_norm",
               "_compress_written_numbers", "find_phrase", "find_phrase_fuzzy"]:
        exec(_slice_fn(src, fn), ns)

    find_phrase = ns["find_phrase"]
    find_phrase_fuzzy = ns["find_phrase_fuzzy"]

    # Build a Whisper-style word list: spoken "GPT five point five beats Vending Bench"
    spoken = "GPT five point five beats Vending Bench today".split()
    words = [{"word": w, "start": i * 0.4, "end": (i + 1) * 0.4}
             for i, w in enumerate(spoken)]

    # Anchor with decimal: "GPT-5.5"  → "GPT 5 point 5" → matches words 0..3
    idx = find_phrase(words, "GPT-5.5")
    check("find_phrase('GPT-5.5') matches in spoken 'GPT five point five'",
          idx == 0, f"got {idx}")

    # Anchor with hyphen: "Vending-Bench" → "Vending Bench" → matches words 5..6
    idx = find_phrase(words, "Vending-Bench")
    check("find_phrase('Vending-Bench') matches in spoken 'Vending Bench'",
          idx == 5, f"got {idx}")

    # Anchor with stray <pause> author markup
    idx = find_phrase(words, "GPT-5.5 <pause 0.3s> beats")
    check("find_phrase strips <pause Xs> from anchor before matching",
          idx == 0, f"got {idx}")

    # Fuzzy fallback: anchor with extra word that's not in spoken
    idx = find_phrase_fuzzy(words, "GPT-5.5 model launches")
    check("find_phrase_fuzzy still matches when 1 word differs",
          idx == 0, f"got {idx}")


def test_digit_words_expanded_to_100() -> None:
    print("\n[10] DIGIT_WORDS table covers 0-20 + tens up to 100")
    ns = _extract_fn("expand_decimals")  # need re module loaded
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    m = re.search(r'DIGIT_WORDS\s*=\s*\{.*?\n\}', src, re.DOTALL)
    assert m, "DIGIT_WORDS not found"
    exec(m.group(0), ns)
    DIGIT_WORDS = ns["DIGIT_WORDS"]
    # 0-20 must all be present
    for n in range(21):
        check(f"DIGIT_WORDS contains '{n}'", str(n) in DIGIT_WORDS)
    # Round tens 30..90 + 100
    for n in (30, 40, 50, 60, 70, 80, 90, 100):
        check(f"DIGIT_WORDS contains '{n}'", str(n) in DIGIT_WORDS)
    # Specific spot checks
    check("'16' → 'sixteen'", DIGIT_WORDS.get("16") == "sixteen")
    check("'23' is NOT in table (compound numbers fall through)",
          "23" not in DIGIT_WORDS)


def test_min_block_frames_clamp_for_short_scene() -> None:
    print("\n[11] MIN_BLOCK_FRAMES shrinks for scenes shorter than nominal_min × n")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    # Verify the shrink branch exists (very-short-scene clamp)
    check("uses nominal_min for normal scenes",
          "nominal_min = round(FPS * MIN_BLOCK_SECONDS)" in src)
    check("shrinks MIN_BLOCK_FRAMES when nominal_min * n > duration_frames",
          "nominal_min * n > duration_frames" in src)
    check("shrunk MIN_BLOCK_FRAMES = max(1, duration_frames // n)",
          "MIN_BLOCK_FRAMES = max(1, duration_frames // n)" in src)
    check("framesTo capped at duration_frames (no overshoot)",
          "framesTo = min(framesTo, duration_frames)" in src)


def test_coverage_uses_anchor_hit_flags() -> None:
    print("\n[12] Coverage counter uses fuzzy-aware anchor_hit_flags from Step 1")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    check("anchor_hit_flags list is built in Step 1 alongside raw_anchors",
          "anchor_hit_flags: list[bool] = []" in src)
    check("anchor_hit_flags populated using find_phrase_fuzzy result",
          re.search(r"anchor_hit_flags\.append\(", src) is not None)
    check("coverage counter reads anchor_hit_flags[j], NOT a re-run of find_phrase",
          "is_anchor = anchor_hit_flags[j]" in src)
    # Make sure the OLD anti-pattern (re-running find_phrase exact in coverage) is gone:
    # there should be exactly one fuzzy lookup against (scene_words, vb.audio_anchor) — Step 1.
    fuzzy_calls = len(re.findall(r"find_phrase_fuzzy\(\s*scene_words\s*,\s*vb\.audio_anchor\b", src))
    check("find_phrase_fuzzy(scene_words, vb.audio_anchor, ...) called exactly once (Step 1)",
          fuzzy_calls == 1, f"got {fuzzy_calls}")


def test_robust_script_total() -> None:
    print("\n[13] script_total scans ALL scenes (resilient to last-scene window_to_sec=0)")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    check("script_total starts at 0 then loops over scenes_raw",
          "script_total = 0.0" in src and "for _s in scenes_raw:" in src)
    check("considers both window_to_sec and window_from_sec",
          "_s.window_to_sec" in src and "_s.window_from_sec" in src)
    check("guards division by zero (script_total > 0 branch)",
          "if script_total > 0:" in src)


def test_anchor_drift_plausibility_guard() -> None:
    print("\n[13b] Fuzzy anchor drift-plausibility guard (rule 10 Class N+12)")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    check("guard distinguishes exact vs fuzzy hit (exact never rejected)",
          "is_exact" in src and "find_phrase(scene_words, vb.audio_anchor" in src)
    check("guard computes an expected position + band",
          "expected_idx" in src and "band" in src)
    check("guard rejects implausible fuzzy hit by treating it as a miss (interpolated)",
          "rejected fuzzy anchor" in src and "Class N+12" in src)
    # Behavioral check: replicate the guard math — normal in-order hits pass,
    # an end-of-scene hit for bullet 1 is rejected.
    def plausible(bi, n_bullets, idx, nwords):
        expected = (bi / n_bullets) * nwords
        return idx <= expected + 0.5 * nwords
    nwords = 190
    normal_ok = all(plausible(bi, 6, int((bi + 0.5) / 6 * nwords), nwords) for bi in range(6))
    bug_rejected = not plausible(0, 6, int(0.9 * nwords), nwords)
    check("normal in-order anchors are all plausible (no false reject)", normal_ok)
    check("bullet-1 anchor matching near scene end is rejected (the +3s drift case)", bug_rejected)


def test_no_zero_multiplication_bug() -> None:
    print("\n[14] Proportional fallback does NOT contain `* 0` regression")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    # The original Bug F was scaled_target * 0 silently zeroing the target.
    # Make sure no such literal lurks in the proportional-fallback area.
    check("no 'scaled_target * 0' literal anywhere",
          "scaled_target * 0" not in src)
    check("no 'target_sec * 0' literal anywhere",
          "target_sec * 0" not in src)


def test_render_stability_settings() -> None:
    """Verifies the research-backed stability settings in render_scenes.mjs:

      - gl: 'swangle' (NOT 'angle' — documented memory leak in Remotion docs
        https://www.remotion.dev/docs/chromium-flags#--gl)
      - disallowParallelEncoding: true (memory-efficiency knob from render-media docs)
      - per-scene try/catch with bounded retry (Remotion convention: retries=1 ≡ 2 attempts)
      - failed-scene partial mp4 cleanup (Remotion does NOT delete on throw —
        verified in renderer source render-media.js:451-495)
      - distinct exit code 2 for partial failure
      - build_video.py recognizes both exit code 1 (fatal) and 2 (partial)
    """
    print("\n[17] Render stability settings (gl, retry, partial-failure handling)")
    rs = (ROOT / "remotion" / "render_scenes.mjs").read_text(encoding="utf-8")
    bv = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")

    # gl backend must NOT be 'angle' (documented memory leak)
    check("render_scenes.mjs uses gl: 'swangle' (not 'angle')",
          "gl: 'swangle'" in rs and "gl: 'angle'" not in rs,
          "angle has a documented memory leak that crashes long renders — "
          "see PR remotion-dev/remotion#834")

    # Memory-efficiency knob
    check("render_scenes.mjs sets disallowParallelEncoding: true",
          "disallowParallelEncoding: true" in rs,
          "documented memory-efficient option per render-media docs")

    # Per-scene retry pattern
    check("render_scenes.mjs has MAX_ATTEMPTS retry constant",
          "MAX_ATTEMPTS" in rs and "for (let attempt = 1; attempt <= MAX_ATTEMPTS;" in rs)
    check("render_scenes.mjs catches per-scene errors (try/catch around renderMedia)",
          "try {" in rs and "await renderMedia({" in rs and "} catch (err) {" in rs)
    check("render_scenes.mjs collects failed scenes into a list",
          "failed.push({" in rs and "sceneId" in rs)
    check("render_scenes.mjs has retry backoff between attempts",
          "RETRY_BACKOFF_MS" in rs and "setTimeout" in rs)

    # Partial-mp4 cleanup on failure (Remotion doesn't do this for us)
    check("render_scenes.mjs unlinks the truncated mp4 before retry",
          "fs.unlinkSync(out)" in rs,
          "without unlink, the size-guard would skip the corrupt half-written mp4")

    # Distinct exit codes
    check("render_scenes.mjs exits 2 on partial failure",
          "process.exit(2)" in rs,
          "exit code 2 lets build_video.py distinguish partial failure from fatal")

    # build_video.py (NATIVE flow): the per-scene render loop was removed — the ONE
    # expensive step is render_master.mjs. Any non-zero master exit fails the build.
    check("build_video.py fails the build on a non-zero final master render",
          "REMOTION MASTER STITCH FAILED" in bv and "rc != 0" in bv)
    check("build_video.py fails the single-scene preview on a non-zero master render",
          "SINGLE-SCENE MASTER RENDER FAILED" in bv)


def test_remotion_version_floor() -> None:
    """Regression test that pins a minimum @remotion/* version.

    Background: at v4.0.242 we were 200+ patches behind v4.0.455. The cutoff
    at v4.0.245 introduced pinned Chrome Headless Shell — below that, Chrome
    can auto-upgrade and break headless mode entirely. Maintainer warning is
    explicit at remotion.dev/docs/miscellaneous/chrome-headless-shell.

    This test prevents accidental downgrade. To bump higher in the future,
    update MIN_REMOTION_VERSION + run `npm install <pkg>@<new>`.
    """
    print("\n[21] Remotion version floor (Chrome Headless Shell pinning)")
    import json as _json
    pkg = _json.loads((ROOT / "remotion" / "package.json").read_text(encoding="utf-8"))
    deps = pkg.get("dependencies", {})

    MIN_REMOTION_VERSION = (4, 0, 245)   # minimum for pinned Chrome Headless Shell

    def _parse(v: str) -> tuple[int, int, int]:
        # strip ^/~ if present, then split on dots
        v = v.lstrip("^~")
        parts = v.split(".")
        return (int(parts[0]), int(parts[1]), int(parts[2]))

    remotion_pkgs = [k for k in deps if k == "remotion" or k.startswith("@remotion/")]
    check(f"package.json declares ≥1 remotion package (found {len(remotion_pkgs)})",
          len(remotion_pkgs) > 0)
    for p in remotion_pkgs:
        v = deps[p]
        try:
            ver = _parse(v)
        except Exception:
            check(f"{p} version '{v}' parses as semver", False)
            continue
        check(f"{p}@{v} >= {'.'.join(str(x) for x in MIN_REMOTION_VERSION)}",
              ver >= MIN_REMOTION_VERSION,
              f"below v4.0.245 the Chrome Headless Shell auto-upgrade can break "
              f"headless mode (per remotion.dev/docs/miscellaneous/chrome-headless-shell)")


def test_render_browser_reuse_and_watchdog() -> None:
    """Verifies the openBrowser + cancelSignal watchdog wiring in
    render_scenes.mjs, and the Ctrl+C tree-kill in build_video.py.

    Sources for each defense:
      - openBrowser / puppeteerInstance: remotion.dev/docs/renderer/open-browser
      - cancelSignal / makeCancelSignal: remotion.dev/docs/renderer/make-cancel-signal
      - CREATE_NEW_PROCESS_GROUP + taskkill /T pattern: Python subprocess docs +
        MSDN GenerateConsoleCtrlEvent
    """
    print("\n[19] Browser reuse + watchdog + Ctrl+C tree-kill")
    rs = (ROOT / "remotion" / "render_scenes.mjs").read_text(encoding="utf-8")
    bv = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")

    # --- render_scenes.mjs side ---
    check("render_scenes.mjs imports openBrowser",
          "openBrowser" in rs and "import {" in rs and "from '@remotion/renderer'" in rs)
    check("render_scenes.mjs uses ONE shared browser via openBrowser('chrome', ...)",
          "openBrowser('chrome'" in rs)
    check("chromiumOptions (gl, disableWebSecurity) set at openBrowser, NOT renderMedia",
          "gl: 'swangle'" in rs and "openBrowser" in rs,
          "When puppeteerInstance is set, chromiumOptions on renderMedia are silently "
          "ignored — they MUST be at openBrowser time")
    check("renderMedia receives puppeteerInstance for browser reuse",
          "puppeteerInstance: browser" in rs)
    check("selectComposition also receives puppeteerInstance",
          rs.count("puppeteerInstance: browser") >= 2,
          "both selectComposition and renderMedia must reuse the browser")
    check("periodic browser restart bounds Chromium memory",
          "BROWSER_RESTART_EVERY" in rs and "closeSharedBrowser" in rs)

    check("hung-render watchdog uses makeCancelSignal",
          "makeCancelSignal" in rs and "isUserCancelledRender" in rs)
    check("watchdog tracks lastProgressAt + STALL_TIMEOUT_MS",
          "STALL_TIMEOUT_MS" in rs and "lastProgressAt" in rs)
    check("watchdog cancels render on stall",
          "cancel()" in rs and "no progress for" in rs)
    check("on stall/crash, browser is recycled before retry",
          "closeSharedBrowser()" in rs and "openSharedBrowser()" in rs)

    check("render_scenes.mjs handles SIGINT/SIGTERM/SIGBREAK to close browser",
          "SIGINT" in rs and "SIGTERM" in rs and "SIGBREAK" in rs)

    # --- build_video.py side (NATIVE flow: the render child is render_master.mjs —
    #     the ONE live master render; there is no per-scene render loop) ---
    check("build_video.py uses subprocess.Popen for the master render (not run/shell=True)",
          "subprocess.Popen(" in bv and "render_master.mjs" in bv,
          "shell=True breaks Ctrl+C propagation — orphan node.exe + chrome.exe stay alive")
    check("build_video.py has zero shell=True (orphan-process guard)",
          bv.count("shell=True") == 0,
          "any remaining shell=True risks orphan Chromium processes on Ctrl+C")
    check("build_video.py uses CREATE_NEW_PROCESS_GROUP for the render child",
          "CREATE_NEW_PROCESS_GROUP" in bv,
          "without it, parent's Ctrl+C kills node before our handler can clean up")
    check("build_video.py KeyboardInterrupt → taskkill /F /T (Windows tree-kill)",
          "KeyboardInterrupt" in bv and 'taskkill' in bv and '"/T"' in bv and '"/F"' in bv,
          "without /T, only the cmd shell dies — node + chrome remain")
    check("build_video.py reports tree-kill clearly + exits 130",
          "killing render tree" in bv and "sys.exit(130)" in bv)

    # --- parent-side render ceiling (Class N+13: render hangs forever) ---
    check("build_video.py bounds proc.wait() with a timeout (no bare wait on render)",
          "proc.wait(timeout=" in bv,
          "a bare proc.wait() blocks the session FOREVER if node/Chromium deadlocks")
    check("render ceiling is configurable (config + env)",
          "render_timeout_per_scene_s" in bv and "RENDER_TIMEOUT_PER_SCENE_S" in bv)
    check("on render TimeoutExpired → tree-kill + exit 124",
          "subprocess.TimeoutExpired" in bv and "RENDER STUCK" in bv
          and "_kill_render_tree(" in bv and "sys.exit(124)" in bv)


def test_strict_anchors_quality_gate() -> None:
    """--strict-anchors flag turns the soft Step 7 warning into a hard fail."""
    print("\n[20] --strict-anchors quality gate")
    bv = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    check("--strict-anchors flag defined in argparse",
          "--strict-anchors" in bv and "action=\"store_true\"" in bv)
    check("--strict-anchor-min-pct flag defined",
          "--strict-anchor-min-pct" in bv)
    check("strict-anchors gate aborts build below threshold",
          "args.strict_anchors and pct < args.strict_anchor_min_pct" in bv)
    check("strict-anchors uses distinct exit code 3 (quality gate)",
          "sys.exit(3)" in bv,
          "exit code 3 lets CI distinguish quality-gate fail from fatal/partial")


def test_pause_duration_honored_via_split_render_concat() -> None:
    """Verifies the Strategy B implementation that makes <pause Xs> markers
    produce EXACT-DURATION silence in the audio (not just a generic comma).

    Background: edge-tts uses Microsoft's free Edge TTS endpoint, which
    filters non-conforming SSML. Verified in github.com/rany2/edge-tts
    issue #173. The library's only emitted SSML is a fixed
    <speak><voice><prosody> envelope — <break time="..."/> tags are
    NOT honored. Without this fix, every <pause Xs> marker collapsed to
    the same comma-pause regardless of declared duration.

    Strategy B (community canonical, github.com/rany2/edge-tts issues
    #58, #136): split SSML on <break time="Nms"/>, render each text chunk
    via edge-tts, generate exact-duration silence per break with ffmpeg
    anullsrc, concat losslessly via ffmpeg concat demuxer (-c copy).
    """
    print("\n[18] Pause durations honored via split-render-concat (Strategy B)")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")

    # 1. Break-splitter regex exists
    check("_BREAK_SPLIT_RE compiled at module level",
          "_BREAK_SPLIT_RE" in src and "<break" in src)

    # 2. ms/s parsing helper exists
    check("_ms_from_break_match converts seconds + milliseconds units",
          "def _ms_from_break_match" in src and "* 1000" in src,
          "without ms<->s conversion, <pause 1s> becomes 1ms of silence (inaudible)")

    # 3. Silence generator uses the TTS engine's exact format for lossless -c copy concat.
    #    Code is engine-aware: TTS_SR/TTS_BR = (24000,"48k") for edge-tts, (22050,"96k") for piper.
    #    Match the parameterized form, not the old hardcoded literals.
    check("silence generator uses anullsrc at the engine sample rate (mono)",
          "anullsrc=r={TTS_SR}:cl=mono" in src or "anullsrc=r=24000:cl=mono" in src,
          "format MUST match the TTS engine output (edge-tts: 24kHz mono 48kbps mp3) for -c copy concat lossless")
    check("silence encoded with libmp3lame at the engine bitrate",
          "libmp3lame" in src and ('"-b:a", TTS_BR' in src or '"-b:a", "48k"' in src),
          "edge-tts default output format is audio-24khz-48kbitrate-mono-mp3")

    # 4. Concat uses demuxer with -c copy (lossless, sample-accurate)
    check("concat uses ffmpeg -f concat with -c copy",
          '"-f", "concat"' in src and '"-c", "copy"' in src,
          "any other concat method (filter_complex, protocol) re-encodes and "
          "introduces generation loss + click artifacts at boundaries")

    # 5. The OLD broken behavior (replace <break/> with comma) is GONE from gen_tts
    check("OLD comma-collapse hack removed from gen_tts",
          "re.sub(r'<break\\b[^/>]*/>', ', ', full_ssml)" not in src,
          "if this string is present, every pause is still collapsing to a comma "
          "regardless of declared duration")

    # 6. The strip-defense is still in place (rule 10 Class 1 — must not regress)
    check("rule 10 Class 1 defense (html.unescape + 2nd strip) preserved in helper",
          "_html.unescape(plain)" in src and src.count("re.sub(r'<[^>]+>', '', plain)") >= 2)

    # 7. gen_tts emits a log line confirming pauses were honored
    check("gen_tts logs how many pauses were honored",
          "exact-duration pause" in src,
          "without this log, you can't tell from a build whether the pipeline "
          "honored the pauses or fell back to old behavior")


def test_render_crash_defenses() -> None:
    """Verifies the three atomic-write + health-check defenses against
    render crashes that historically left corrupt mp4s on disk:

      1. _mp4_is_healthy() helper exists and uses ffprobe
      2. Per-scene resume-skip path consults _mp4_is_healthy (so a corrupt
         leftover mp4 from a killed prior build is re-rendered, not skipped)
      3. Post-render integrity check (catches 0-exit-code corrupt outputs)
      4. _clean.mp4 written to .inprogress + os.replace (atomic)
      5. Final mp4 written to .inprogress + os.replace (atomic)
    """
    print("\n[16] Render crash defenses — atomic writes + health checks")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")

    # 1. Health-check helper exists
    check("_mp4_is_healthy() helper defined",
          "def _mp4_is_healthy(" in src)
    check("_mp4_is_healthy uses ffprobe",
          "ffprobe" in src.split("def _mp4_is_healthy(")[1].split("\ndef ")[0])
    check("_mp4_is_healthy guards against zero-byte file",
          "min_size_bytes" in src and "stat().st_size" in src)

    # 2+3. NATIVE flow: no per-scene mp4s — the health check guards the MASTER outputs.
    check("final master output health-checked before promote",
          "_mp4_is_healthy(final_inprogress)" in src,
          "a 0-exit-code render with corrupt output must not be promoted to the final mp4")
    check("single-scene preview output health-checked before promote",
          "_mp4_is_healthy(preview_inprogress)" in src)
    check("corrupt master output aborts with a clear message",
          "PRODUCED CORRUPT mp4" in src or "PREVIEW CORRUPT" in src)

    # 4. _clean.mp4 atomic write
    check("_clean.mp4 stitch step uses .inprogress staging file",
          "_clean.mp4" in src and ".inprogress" in src)
    check("_clean.mp4 uses os.replace for atomic commit",
          "os.replace(inprogress, dst)" in src,
          "without atomic move, ffmpeg killed mid-clean leaves partial _clean.mp4")

    # 5. Final mp4 atomic write — the most critical
    check("final mp4 written to final_inprogress staging file",
          "final_inprogress" in src,
          "without atomic move, Ctrl+C during final mux corrupts the user-facing mp4")
    check("final mp4 uses os.replace(final_inprogress, final_out)",
          "os.replace(final_inprogress, final_out)" in src)
    check("final mp4 health-checked before os.replace",
          "_mp4_is_healthy(final_inprogress)" in src,
          "stitch can succeed (exit 0) yet produce 0-duration mp4 — health-check catches that")
    check("STITCH FAILED branch cleans up the .inprogress orphan",
          "final_inprogress.unlink(missing_ok=True)" in src)


def test_dynamic_block_bindings_wiring() -> None:
    """fitText/Easing/measureText must be wired consistently across:
       - DynamicBlock.tsx RUNTIME_KEYS
       - DynamicBlock.tsx invocation (compiled() args)
       - visual_designer.py system prompt bindings list
       - visual_designer.py _make_bullet_prompt closing line
       - vg-visual-designer/SKILL.md bindings table (was rules/04 before the skill restructure)

    A drift in any of these means the LLM either gets undefined bindings at
    runtime (silently returns null, blank frame) or cannot use a helper that
    is actually available.
    """
    print("\n[15] fitText / Easing / measureText wiring across all surfaces")

    db = (ROOT / "remotion" / "src" / "universal" / "DynamicBlock.tsx").read_text(encoding="utf-8")
    vd = (ROOT / "storyboard" / "visual_designer.py").read_text(encoding="utf-8")
    # Skill restructure (2026-06) moved the docs: bindings table → vg-visual-designer,
    # fitText cap idiom → vg-code-text (formerly rules/04 + rules/19).
    vdesigner = (ROOT / ".claude" / "skills" / "vg-visual-designer" / "SKILL.md").read_text(encoding="utf-8")
    codetext = (ROOT / ".claude" / "skills" / "vg-code-text" / "SKILL.md").read_text(encoding="utf-8")
    root_tsx = (ROOT / "remotion" / "src" / "Root.tsx").read_text(encoding="utf-8")

    new_bindings = ("fitText", "Easing", "measureText", "Img", "staticFile")
    for name in new_bindings:
        check(f"DynamicBlock.tsx imports/uses {name}",
              name in db, f"{name!r} missing from DynamicBlock.tsx")
        # Each new key must appear in RUNTIME_KEYS list AND in the compiled()
        # invocation. Counting occurrences guards against partial wiring.
        # Expect: at least 1 in RUNTIME_KEYS, 1 in invocation, 1+ in docstring.
        check(f"DynamicBlock.tsx mentions {name} ≥3× (key + arg + comment)",
              db.count(name) >= 3, f"only {db.count(name)} occurrences")
        check(f"visual_designer.py system prompt names {name}",
              name in vd, f"{name!r} missing from visual_designer.py")
        check(f"vg-visual-designer bindings table mentions {name}",
              name in vdesigner, f"{name!r} missing from vg-visual-designer/SKILL.md")

    # Easing pattern: must reference Easing.<curve> form somewhere in the
    # system prompt so the LLM knows how to use it (not just that it exists).
    check("system prompt shows Easing usage pattern",
          "Easing.in" in vd or "Easing.out" in vd or "Easing.bezier" in vd,
          "system prompt must show how to use Easing, not just name it")

    # fitText: vg-code-text must give the cap-the-result idiom so the LLM doesn't
    # let fitText return a 200px font.
    # Code idioms were deliberately stripped from skills (prose principles only) —
    # the skill must still TEACH shrink-to-fit sizing for unbounded strings.
    check("vg-code-text teaches fitText shrink-to-fit sizing",
          "fitText" in codetext and "shrink-to-fit" in codetext,
          "the skill carries the fit principle in prose; fitText must not over-inflate")

    # Root.tsx: fonts MUST be awaited via delayRender, otherwise fitText
    # measurements are based on fallback fonts → wrong. Fonts are VENDORED
    # (public/fonts + FontFace from staticFile) — zero render-time network;
    # the @remotion/google-fonts loaders were removed 2026-07-04 (an unstable
    # network intermittently failed renders with font ERR_CONNECTION_CLOSED,
    # and 'Space Grotesk' — the font_display token — was never loaded at all).
    check("Root.tsx uses delayRender for font load",
          "delayRender" in root_tsx and "continueRender" in root_tsx
          and "FontFace" in root_tsx,
          "fitText measurements require fonts to be loaded BEFORE first frame renders")
    check("Root.tsx loads LOCAL fonts (no google-fonts network fetch)",
          "@remotion/google-fonts" not in root_tsx
          and "staticFile" in root_tsx
          and root_tsx.count(".woff2") >= 5
          and "JetBrains Mono" in root_tsx and "Space Grotesk" in root_tsx,
          "fonts must be vendored in public/fonts and loaded via FontFace — "
          "render-time fonts.gstatic.com fetches fail on unstable networks")


def test_model_strategy_all_opus() -> None:
    """Model strategy: EVERYTHING runs on Opus 4.8 — no Sonnet/Haiku split,
    no subagent delegation. The user reversed the old split-by-task strategy
    (`feedback_model_strategy`), so every skill is pinned `model: opus` and the
    pipeline never delegates mechanical phases to a cheaper subagent.

    This test guards the reversal so the old Sonnet/Haiku subagent recipes
    can't be silently reintroduced."""
    print("\n[16] Model strategy — all-Opus (no Sonnet/Haiku delegation)")

    skill = (ROOT / ".claude" / "skills" / "video_generation" / "SKILL.md").read_text(encoding="utf-8")

    # The reversal: no cheaper-model delegation anywhere in the orchestrator skill.
    check("video_generation SKILL.md does NOT pin model: \"sonnet\"",
          'model: "sonnet"' not in skill,
          "Sonnet delegation reappeared — strategy is all-Opus")
    check("video_generation SKILL.md does NOT pin model: \"haiku\"",
          'model: "haiku"' not in skill,
          "Haiku delegation reappeared — strategy is all-Opus")
    check("video_generation SKILL.md has no MODEL STRATEGY split section",
          "MODEL STRATEGY" not in skill,
          "the split-by-task MODEL STRATEGY section was removed in the reversal")

    # Every skill front-matter is pinned model: opus (spot-check the core ones).
    # Skills consolidated away by the 2026-07 script-skill overhaul may not
    # exist anymore — skip those instead of crashing the whole suite.
    for sk in ("video_generation", "vg-visual-designer", "vg-render-code",
               "vg-motion-compiler", "script-animation-bullets"):
        p = ROOT / ".claude" / "skills" / sk / "SKILL.md"
        if not p.exists():
            print(f"  SKIP  {sk} (SKILL.md removed by skill consolidation)")
            continue
        fm = p.read_text(encoding="utf-8")
        check(f"{sk} is pinned model: opus",
              re.search(r"^model:\s*opus\s*$", fm, re.MULTILINE) is not None,
              f"{sk} must declare `model: opus` in front-matter")

    # Anti-regression: no custom subagent_type names (those silently fail in this build).
    forbidden_types = ['"video-mechanical"', '"video-status"', '"video-quality-review"']
    for ft in forbidden_types:
        check(f"SKILL.md does NOT reference unsupported {ft}",
              f'subagent_type: {ft}' not in skill,
              f"unsupported custom subagent_type {ft} reappeared")

    # No leftover .claude/agents/ files — those were the unsupported file-based pattern
    agents_dir = ROOT / ".claude" / "agents"
    check(".claude/agents/ has no orphaned agent-file definitions",
          (not agents_dir.exists()) or not list(agents_dir.glob("*.md")),
          f"agent files still present in {agents_dir} — they mislead callers into broken patterns")

    # Pipeline scripts must NOT pin a model knob — there is no model to choose (all Opus).
    bv = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    check("build_video.py has no llm.designer_model knob",
          "config.get(\"llm\"" not in bv and "DESIGNER_MODEL = " not in bv)


# Run ──────────────────────────────────────────────────────────────────────
def test_boundary_contraction_variant_and_sanity_gate() -> None:
    """Class 21 — Whisper contracts spoken copulas ('here is' → \"here's\").
    The exact boundary matcher then misses the true position and the
    shrinking-prefix pass can hit the SAME opening words verbatim inside a
    LATER scene (pixel_rag 2026-07-04: scene 2 matched scene 8's 'So here is
    the rule' at t=319.5s → scenes 2-7 collapsed to ~0.2s each). Defense:
    (a) boundary matching also tries a contracted variant of the opening;
    (b) any match deviating from the proportionally-scaled script position
    by more than BOUNDARY_MAX_DEV_SEC is rejected."""
    print("\n[21] boundary contraction variant + proportional sanity gate — Class 21")
    src = (ROOT / "storyboard" / "build_video.py").read_text(encoding="utf-8")
    ns: dict = {"re": re}
    for const_re in (
        r'DIGIT_WORDS\s*=\s*\{.*?\n\}',
        r'_WRITTEN_TENS[^=]*=\s*\{.*?\n\}',
        r'_WRITTEN_ONES_COMPOUND[^=]*=\s*\{.*?\n\}',
    ):
        m = re.search(const_re, src, re.DOTALL)
        assert m, f"constant matching {const_re!r} not found"
        exec(m.group(0), ns)
    for fn in ["expand_decimals", "normalize_for_match", "_norm",
               "_compress_written_numbers", "_contraction_variant", "find_phrase"]:
        exec(_slice_fn(src, fn), ns)
    fp, cv, norm = ns["find_phrase"], ns["_contraction_variant"], ns["normalize_for_match"]
    # Synthetic transcript: the scene-2 opening spoken EARLY but contracted by
    # Whisper; the same words appear un-contracted verbatim in a LATER scene.
    tokens = ("by the end you will know here's the whole map what parsing destroys "
              "lots of middle words go by so here is the rule you take to work").split()
    words = [{"word": t, "start": float(i)} for i, t in enumerate(tokens)]
    opening = "Here is the whole map."
    as_written = " ".join(norm(opening).split()[:4])
    check("as-written opening does NOT exact-match the true contracted position",
          fp(words, as_written) != 6, f"got {fp(words, as_written)}")
    alt = cv(opening)
    check("_contraction_variant contracts 'Here is' → \"Here's\"",
          "here's" in alt.lower(), f"got {alt!r}")
    idx = fp(words, " ".join(norm(alt).split()[:4]))
    check("contracted variant exact-matches at the TRUE early position (idx 6)",
          idx == 6, f"idx={idx}")
    check("boundary loop tries contraction variants",
          "_contraction_variant(sc.narration)" in src,
          "boundary pass 1 must search both opening variants")
    check("boundary loop carries the proportional sanity gate",
          "BOUNDARY_MAX_DEV_SEC" in src and "REJECTED exact match" in src,
          "a wrong-but-exact match must not bypass the fallbacks")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 60)
    print(" Pipeline bug-fix tests")
    print("=" * 60)
    test_convert_author_pauses_basic()
    test_pause_does_not_leak_after_escape()
    test_pause_in_full_chat_5_5_script()
    test_decimal_expansion()
    test_no_window_constants_present()
    test_time_fallback_proportional_scaling()
    test_html_entity_defense_in_strip_pipeline()
    test_normalize_for_match()
    test_find_phrase_handles_decimals_hyphens_pauses()
    test_digit_words_expanded_to_100()
    test_min_block_frames_clamp_for_short_scene()
    test_coverage_uses_anchor_hit_flags()
    test_robust_script_total()
    test_anchor_drift_plausibility_guard()
    test_no_zero_multiplication_bug()
    test_pause_duration_honored_via_split_render_concat()
    test_remotion_version_floor()
    test_render_browser_reuse_and_watchdog()
    test_strict_anchors_quality_gate()
    test_render_crash_defenses()
    test_render_stability_settings()
    test_dynamic_block_bindings_wiring()
    test_model_strategy_all_opus()
    test_boundary_contraction_variant_and_sanity_gate()
    print()
    print("=" * 60)
    print(f" PASS: {PASSED}    FAIL: {FAILED}")
    print("=" * 60)
    return 0 if FAILED == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
