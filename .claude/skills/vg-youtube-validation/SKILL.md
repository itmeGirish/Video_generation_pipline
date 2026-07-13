---
name: vg-youtube-validation
description: "Final YouTube upload standards check: resolution, codec, bitrate, frame rate, audio, captions, thumbnail, chapters. The technical gate (T1–T12) lives in rule 23 Layer 3 — this file points there and documents what YouTube does to non-compliant videos. Use whenever checking if a video is upload-ready, or any request like \"YouTube upload check,\" \"is this ready to upload,\" \"ffprobe validation,\" \"codec check,\" \"bitrate,\" \"upload standards,\" or \"T1 to T12 gate.\""
model: opus
---

# YouTube Output Validation — Rule 22

The YouTube technical upload gate is **Layer 3 of rule 23** (the full verification
protocol). To avoid two copies of the same spec drifting apart, the checks live in **one
place — rule 23 Layer 3 (T1–T12 + side artifacts)**. This file is a pointer plus the
"why it matters" context.

## The technical gate → rule 23 Layer 3

Run the upload gate from **[rule 23](23-verification-protocol.md) → "LAYER 3 — YOUTUBE
TECHNICAL STANDARDS."** It covers, via a single `ffprobe` call:

- **T1** resolution 1920×1080 · **T2** 30 fps · **T3** H.264 High ≥L4.0
- **T4** video bitrate ≥8 Mbps · **T5–T8** audio (AAC, 2ch stereo, ≥192 kbps, 48 kHz)
- **T9** duration drift ≤3s · **T10/T11** first/last frame not black · **T12** faststart moov
- **Side artifacts:** SRT captions, chapters.txt (starts `0:00`), thumbnail 1280×720
- The fix commands (re-mux with faststart, re-encode at target bitrate)
- The consolidated upload report to fill out before uploading

Run it **after rule 12 (output coverage) passes** and after rule 23 Layers 1, 1.5, and 2.
Any T-check FAIL = do not upload.

## What YouTube does to a non-compliant video (the stakes)

This is the context for *why* each rule-23 T-check exists — the real consequence of
shipping a video that fails it:

| Issue (which T-check) | YouTube consequence |
|---|---|
| Wrong codec (T3) | Re-encodes — 1–4 hour processing delay, quality loss |
| Low bitrate (T4) | Visible blocking artifacts on animations, especially text |
| Mono audio (T5–T6) | Left-ear-only on many mobile devices |
| Missing captions (side) | Auto-captions used — errors common on technical terms |
| No thumbnail (side) | YouTube picks a random frame — usually a transition or black frame |
| No chapters (side) | Viewers cannot navigate; drop-off higher on 8+ min videos |
| Below 1080p (T1) | YouTube serves a lower quality tier; smaller in search results |
| moov atom at end (T12) | No progressive playback — viewer waits for full download before play |

## Verdict levels

| Verdict | Meaning |
|---|---|
| **UPLOAD-READY** | All rule-23 Layer 3 checks PASS. Upload now. |
| **UPLOAD-READY WITH WARNINGS** | No FAILs, some WARNs. Upload OK but fix WARNs for best quality. |
| **NOT READY** | One or more FAILs. Fix before uploading — YouTube may reject or heavily re-compress. |
