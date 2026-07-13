---
name: deployment-engine
description: CROSS-CUTTING skill of the Visual Story Engine. Packages, versions, and prepares the final build for production — the final encode settings, the output paths, the SRT/caption sidecar, the YouTube technical checks (resolution/fps/bitrate/loudness/duration), versioning the artifacts, and the upload-ready package. Runs after QA passes. Owns the ship packaging, not the render execution (remotion-renderer) or post-render QA (quality-assurance-engine).
when_to_use: Use after QA is SHIP to package, version, and prepare the final video for production/upload — encode, captions, YouTube technical checks, output paths. Owns deployment packaging.
model: opus
---

# deployment-engine — package + version + ship (CROSS-CUTTING)

QA said SHIP; this cross-cutting skill turns the passed video into a production-ready, versioned package —
correctly encoded, captioned, technically valid for the platform, and placed at the right output path.

## What it prepares

- **Final encode** — production settings (H.264, slow preset, low CRF, `yuv420p`, high-bitrate AAC,
  `+faststart`, loudness normalized). Encode by quality (CRF), never pad to a fixed bitrate.
- **Captions sidecar** — the `.srt` sidecar from the Whisper timestamps (burned-in captions are disabled for
  long-form; the sidecar carries them). Verify it aligns.
- **YouTube technical checks** — resolution/fps, bitrate, audio loudness (−14 LUFS), duration, and the final
  non-silence check (`volumedetect`). A technical fail here blocks upload even after QA passed.
- **Output paths** — the final mp4 at the canonical project output path; the intermediate artifacts placed/kept
  per the pipeline's path conventions.
- **Versioning** — version the shipped artifact + record what produced it (which contract/render), so a ship is
  reproducible and a regression is traceable.

## When it runs (cross-cutting, at the end)

After `quality-assurance-engine` returns SHIP and `feedback-optimizer` has closed any loop. It is the last
step before the video leaves the pipeline — nothing ships that didn't pass QA.

## The rule

Ship only what passed: the deployment package is assembled from a QA-passed, fact-checked render, technically
validated for the platform, versioned, and placed at the canonical path. An upload is EVIDENCED (the technical
checks recorded) — never "it rendered, ship it."

## Boundary

You package + version + ship. You do not execute the render (`remotion-renderer`), judge quality
(`quality-assurance-engine`), or drive fixes (`feedback-optimizer`). You produce the upload-ready artifact.
(In this pipeline the final encode/mux + `vg-youtube-validation` + `vg-video-duration` realize this.)
