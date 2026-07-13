---
name: verification-pass
description: STAGE S7 of the script sub-pipeline — the LOCK. Runs 4 verification rounds (claim re-extraction, an adversarial cold-read attack, a volatility re-check, a numbers audit), then times the script from real TTS and tags every sentence, producing the LOCKED, TIMED, TAGGED script — the MASTER CLOCK the whole visual pipeline binds to. Input = Voiced Script (+ Knowledge Package). Output = the locked script (sentence IDs · durations · pauses · cumulative start times · locked:true). Runs LAST in the script sub-pipeline, before the visual stages. Owns the lock + timing, not the sentences (script-writer) or the voice (personality-pass).
when_to_use: Use last in script production to fact-verify (4 rounds), TTS-time, tag, and LOCK the script into the master clock. Owns "is it verified, timed, and immutable".
model: opus
---

# verification-pass — Voiced Script → Locked Master Clock (STAGE S7)

The output of this stage is the **master clock**: a sentence-precise, TTS-timed, tagged, immutable script that
the entire visual pipeline binds to. Get this wrong and script defects become render defects. Verification is
iterative and adversarial — multiple independent rounds, not one proofread.

## The 4 verification rounds

1. **Claim re-extraction** — extract every factual claim from the FINAL voiced script (S6 may have subtly
   shifted meanings) and re-check each against the Knowledge Package sources. Claims not in the package → new
   research or cut.
2. **Adversarial cold read** — a FRESH context (a fork that has NOT seen the research reasoning) reads only the
   script and attacks it: "what would a domain-expert commenter call out?" Every attack gets a fix, a hedge
   ("as of <date>"), or a justified dismissal — all logged.
3. **Volatility re-check** — every fact marked `volatility: high` re-verified against live sources at lock time.
4. **Numbers audit** — recompute every on-screen number from raw inputs; confirm spoken word-numbers match the
   `display_value` numerals.

## Timing + tagging (then lock)

```json
{
  "sentences": [
    { "id": "<sNNN>", "text": "<the locked sentence>", "duration_ms": "<from TTS>",
      "timing_source": "tts_synthesis | wpm_estimate_150", "pause_after_ms": "<explicit ≥400ms pauses>",
      "chapter": "<chN>", "concept_tag": "<this script's concept id>",
      "emphasis_word": "<its one word>", "display_value": "<its ledger numeral>",
      "cumulative_start_ms": "<running total>" }
  ],
  "runtime_total_s": "<sum>", "verification_log": "verification-report.json",
  "locked": true, "locked_at": "<timestamp>"
}
```

- **Time from real TTS** (or 150 wpm fallback, flagged in `timing_source`).
- **Pauses ≥400ms are explicit `pause_after_ms`** — they become mandated stillness (HOLD) downstream. Place a
  pause after every `release` and `takeaway`, and after any dense `mechanism` chain.
- **`cumulative_start_ms`** gives every sentence its absolute position — this IS the master clock.

## The lock is sacred

Once `locked: true`, the script is IMMUTABLE. Any change — even one word — reopens S7 (and possibly S5/S6),
because downstream choreography binds to sentence IDs and durations. An unlocked script CANNOT enter the visual
pipeline. Runtime is checked against the blueprint's chapter budgets; drift > 10% → back to `script-writer`
with a cut list.

## Gate

Any Round 1–4 finding unresolved → NOT locked. No unlocked script proceeds. The scoring rubric
(`references/scoring-rubric.md`) must average ≥4 with no dimension at 2 before lock.

## Boundary

You own verification + timing + the LOCK. You do NOT write sentences (`script-writer`) or add voice
(`personality-pass`). Emit the locked master clock; the visual stages (visual-metaphor onward) bind to it —
`tempo-sync-engine` in particular uses `cumulative_start_ms`/`pause_after_ms` directly. (`knowledge-validator`
backs Round 1/3/4; the adversarial Round 2 is best a forked cold context.)
