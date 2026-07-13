"""Audio-layer mixer — voice + ducked music bed + sfx one-shots → one master track.

This is the render-side executor of the `vg-sound-design` skill. It takes the
loudnormed narration master and mixes in:
  - a MUSIC bed (looped/trimmed to length, side-chain DUCKED under the voice), and
  - the SFX one-shots from the `sfx_emitter` cue JSONs, each placed at its master-timeline
    time at its cue volume,
then re-measures the whole mix to YouTube's -14 LUFS / -1 dBTP.

Design contract (so it can NEVER break a build):
  - OFF by default. With no music path AND sfx disabled → returns the narration unchanged.
  - Missing sound files are skipped (mix only what exists). All sfx missing + no music → no-op.
  - ANY ffmpeg/IO failure → logs a warning and returns the original narration path.

Cue frames in the per-scene JSONs are SCENE-LOCAL; we offset each by the cumulative start
frame (from scene_timings, same order/durations the master <Series> uses) → master seconds.

Standalone:
    python -m storyboard.audio_mixer <project> [--out mixed.mp3]
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_NOWIN = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0  # type: ignore[attr-defined]

# Priority for the cap: structural/reveal sounds beat the dense per-word ticks.
_SOUND_PRIORITY = {
    "reveal_hit": 0, "transition_whoosh": 1, "impact_soft": 2, "ui_pop": 3, "text_tick": 4,
}


def build_master_cues(project_dir: Path, scene_timings: list[dict], fps: int) -> list[dict]:
    """Load each scene's sfx cue JSON, offset its scene-local frames onto the master
    timeline, and return a flat list of {sound, time_sec, volume, source}."""
    sfx_dir = project_dir / "sfx"
    out: list[dict] = []
    start_frame = 0
    for t in scene_timings:
        sid = t["id"]
        dur = int(t["durationFrames"])
        cue_file = sfx_dir / f"{sid}_cues.json"
        if cue_file.exists():
            try:
                data = json.loads(cue_file.read_text(encoding="utf-8"))
                for c in data.get("cues", []):
                    f = int(c.get("frame", 0))
                    if 0 <= f < dur:  # keep only in-scene cues
                        out.append({
                            "sound": c.get("sound", ""),
                            "time_sec": (start_frame + f) / fps,
                            "volume": float(c.get("volume", 0.1)),
                            "source": f"{sid}: {c.get('source', '')}",
                        })
            except Exception as e:  # noqa: BLE001 — a bad cue file must never break the build
                print(f"      [audio_mixer] WARN skipping {cue_file.name}: {e}")
        start_frame += dur
    return out


def _resolve_sound(sfx_dir: Path, sound: str) -> Path | None:
    for ext in (".wav", ".mp3", ".ogg", ".flac"):
        p = sfx_dir / f"{sound}{ext}"
        if p.exists():
            return p
    return None


def mix_audio_layer(
    narration: Path,
    out_path: Path,
    *,
    project_dir: Path,
    scene_timings: list[dict],
    fps: int,
    music: Path | None = None,
    music_gain_db: float = -20.0,
    sfx_enabled: bool = False,
    sfx_dir: Path | None = None,
    sfx_max: int = 48,
    lufs: float = -14.0,
    true_peak: float = -1.0,
) -> Path:
    """Mix voice + ducked music + sfx → out_path. Returns out_path on success, or the
    unchanged `narration` path on no-op / any failure."""
    sfx_dir = sfx_dir or (project_dir / "assets" / "sfx")

    # ---- gather sfx inputs (only those whose sound file exists) ----
    placed: list[tuple[Path, float, float]] = []  # (file, time_sec, volume)
    if sfx_enabled:
        cues = build_master_cues(project_dir, scene_timings, fps)
        cues.sort(key=lambda c: (_SOUND_PRIORITY.get(c["sound"], 9), c["time_sec"]))
        for c in cues:
            if len(placed) >= sfx_max:
                break
            f = _resolve_sound(sfx_dir, c["sound"])
            if f:
                placed.append((f, c["time_sec"], c["volume"]))
        placed.sort(key=lambda x: x[1])

    has_music = bool(music and Path(music).exists())

    # ---- no-op: nothing to add → keep the (already loudnormed) narration ----
    if not has_music and not placed:
        if sfx_enabled or music:
            print("      [audio_mixer] nothing to mix (no music file + no sfx sound files found) -- "
                  "keeping narration; add files under the sfx/music paths to activate")
        return narration

    # ---- duration of the master timeline (matches the <Series> master) ----
    total_frames = sum(int(t["durationFrames"]) for t in scene_timings) or 1
    dur = total_frames / fps

    # ---- build ffmpeg inputs + filtergraph ----
    inputs: list[str] = ["-i", str(narration)]              # input 0 = voice
    idx = 1
    music_idx = None
    if has_music:
        inputs += ["-stream_loop", "-1", "-i", str(music)]  # loop the bed
        music_idx = idx
        idx += 1
    sfx_idx0 = idx
    for f, _t, _v in placed:
        inputs += ["-i", str(f)]
        idx += 1

    parts: list[str] = []
    mix_labels: list[str] = []

    if has_music:
        # split the voice: one copy feeds the mix, one keys the side-chain ducker
        parts.append("[0:a]asplit=2[vmix][vkey]")
        parts.append(
            f"[{music_idx}:a]atrim=0:{dur:.3f},asetpts=PTS-STARTPTS,"
            f"volume={music_gain_db}dB[mbed]"
        )
        # duck the bed under the voice (key = voice)
        parts.append(
            "[mbed][vkey]sidechaincompress=threshold=0.04:ratio=8:attack=20:release=300[mduck]"
        )
        mix_labels += ["[vmix]", "[mduck]"]
    else:
        mix_labels.append("[0:a]")

    for k, (_f, t_sec, vol) in enumerate(placed):
        ms = max(0, int(round(t_sec * 1000)))
        lbl = f"[s{k}]"
        parts.append(f"[{sfx_idx0 + k}:a]adelay={ms}|{ms},volume={vol:.3f}{lbl}")
        mix_labels.append(lbl)

    n = len(mix_labels)
    parts.append(
        "".join(mix_labels)
        + f"amix=inputs={n}:duration=longest:normalize=0[mx]"
    )
    parts.append(
        f"[mx]loudnorm=I={lufs}:TP={true_peak}:LRA=11,"
        f"alimiter=limit={10 ** (true_peak / 20):.4f}[out]"
    )
    filtergraph = ";".join(parts)

    out_inprogress = out_path.with_suffix(out_path.suffix + ".inprogress")
    cmd = (
        ["ffmpeg", "-y", *inputs,
         "-filter_complex", filtergraph,
         "-map", "[out]",
         "-ar", "48000", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "192k",
         "-f", "mp3",                       # force muxer (staging file has a .inprogress suffix)
         str(out_inprogress)]
    )
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                           creationflags=_NOWIN, timeout=600)
        if r.returncode != 0 or not out_inprogress.exists() or out_inprogress.stat().st_size < 1024:
            tail = (r.stderr or "")[-500:]
            print(f"      [audio_mixer] WARN ffmpeg mix failed -- using plain narration.\n{tail}")
            out_inprogress.unlink(missing_ok=True)
            return narration
        import os
        os.replace(out_inprogress, out_path)
        print(f"      [audio_mixer] mixed: voice"
              f"{' + ducked music' if has_music else ''}"
              f"{f' + {len(placed)} sfx' if placed else ''} -> {out_path.name} (re-normalized {lufs} LUFS)")
        return out_path
    except Exception as e:  # noqa: BLE001 -- never break a build over the audio layer
        print(f"      [audio_mixer] WARN mix raised {e!r} -- using plain narration")
        out_inprogress.unlink(missing_ok=True)
        return narration


def _load_scene_timings(project_dir: Path, fps: int) -> list[dict]:
    """Derive scene_timings from the scene JSONs (last bullet's framesTo) for standalone runs."""
    scenes_dir = project_dir / "scenes"
    out = []
    for sj in sorted(scenes_dir.glob("*.json")):
        blocks = json.loads(sj.read_text(encoding="utf-8"))
        dur = max((b.get("framesTo", 0) for b in blocks), default=0)
        out.append({"id": sj.stem, "durationFrames": int(dur)})
    return out


def main(argv: list[str] | None = None) -> int:
    import argparse
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("project")
    ap.add_argument("--out", default=None)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--music", default=None)
    ap.add_argument("--music-gain-db", type=float, default=-20.0)
    ap.add_argument("--sfx", action="store_true")
    args = ap.parse_args(argv)
    sys.stdout.reconfigure(encoding="utf-8")

    pdir = ROOT / "projects" / args.project
    audio_dir = pdir / "audio"
    narr = next(audio_dir.glob("vo-*-full.mp3"), None) or next(audio_dir.glob("*.mp3"), None)
    if not narr:
        print(f"ERROR: no narration mp3 in {audio_dir}")
        return 1
    out = Path(args.out) if args.out else audio_dir / ("mix-" + narr.name)
    st = _load_scene_timings(pdir, args.fps)
    res = mix_audio_layer(
        narr, out, project_dir=pdir, scene_timings=st, fps=args.fps,
        music=Path(args.music) if args.music else None,
        music_gain_db=args.music_gain_db, sfx_enabled=args.sfx,
    )
    print(f"result: {res}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
