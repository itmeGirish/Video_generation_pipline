# Feedback Lessons — reference-video benchmark comparisons

Lessons extracted from full end-to-end watches comparing pipeline output against professional
reference videos. Apply these at AUTHOR time (Phase-2 steps 3–4) and verify them at the
VISUAL-PROOF (6b) and MASTER gates — they are the recurring gap classes between "passes the
gates" and "looks like the reference."

---

## 2026-07-08 — `documents/videoplayback.webm` (reference) vs `projects/pixel_rag/out/pixel_rag_UPLOAD_final.mp4`

**The comparison.** Reference: 31-min 4K professional explainer, episode 1 of an LLM-inference
series (memory wall → roofline → KV cache → TTFT/TPOT/goodput); the file ships with NO audio
stream, which made it a literal muted-test benchmark. Pipeline output: pixel_rag, 5:45, 1080p,
ColPali / pixel-based RAG.

**Verdict: the reference won decisively on visual craft.** It passes the muted test at reference
grade for 31 straight minutes — every frame is a living machine (persistent telemetry ticker,
packets flowing through the routing stack, counters climbing, a chip-utilization panel that
re-diagnoses itself as the workload switches). pixel_rag was competitive on protagonist
through-line (the pricing card travels the whole video; the five-stops roadmap is set up and paid
off) and on story economy (stakes → contest shown → honest cost → decision rule), but its frames
still behaved like polished slides in stretches.

**Concrete failures observed in pixel_rag (the evidence):**
- ~4 seconds of blank cream canvas before the title fades in at 0:00 — the real hook (CONFIDENT →
  WRONG) lands ~25s in.
- The "$29 AI ANSWER" card sits visibly unchanged for close to a minute in Scene 1.
- 10–15s near-identical holds ("Geometry is kept", the pipeline chips).
- Single small elements floating in a large empty canvas ("Three plans, three prices" card at ~25%
  width; "The rule" as a bare title on a void).
- Discrete card-swaps between beats instead of one continuously growing picture — the reference
  built its roofline chart over ~4 minutes, annotation by annotation, so the viewer's eye never
  re-orients.

**The 6 lessons (apply to every video):**

1. **No dead open.** Frame one is already the world in motion — never a blank fade-in. Judge hook
   CONCEPT and hook EXECUTION separately: pixel_rag's concept (a confident wrong answer) was
   stronger than the reference's, but its execution wasted the most valuable seconds of the video.
2. **Nothing sits still.** No element holds static for tens of seconds (the A4-freeze class).
   Ambient life — tickers, counters, breathing — is constant. The motion must be honest and on the
   SUBJECT, never a decorative beam.
3. **Fill the canvas.** Density by AREA; no lone card in a void (`layout_validator`
   `sparse_canvas`). The reference fills the frame with structured dashboards.
4. **Grow ONE diagram across beats** instead of swapping cards. Progressive disclosure on a single
   evolving picture beats a sequence of tableaux — continuity is what separates film from slides.
5. **A persistent live HUD/telemetry strip** as cross-scene glue, layered on top of the story's
   protagonist through-line.
6. **Semantic color that carries diagnosis.** State should be readable from color alone before any
   label is read (reference: cyan = compute/prefill, orange = decode/memory, red = cost/failure).

**Scope note:** the reference is a professional series episode, not a fair baseline for a 5:45
generated explainer — treat it as the North Star. What pixel_rag already does at reference level
and must keep: the recurring protagonist object across every scene, showing the contest (both
sides on screen, one losing), stating the honest cost, and closing on a decision rule.
