# Effort folder — the pipeline's bug/effort history store

Durable, measurable production history — **one record per project**, derived from each project's
`projects/<name>/verification.md` **BUG LEDGER** (the live per-scene record the agent writes during the
RENDER → VERIFY → FIX loop, owned by `vg-verification-protocol`).

- `effort/<project>.json` — structured per-project record: scenes · total bugs · fix-minutes · rework
  passes · by-type · by-owner-skill · by-severity · the full bug list.
- `effort/<project>.md` — the same, human-readable.
- `effort/_SUMMARY.md` — cross-project aggregate (where the pipeline is weakest).

**These are DERIVED — regenerated, never hand-edited** (so they can't drift from the source). Rebuild:

```bash
python -m storyboard.bug_stats --save        # (re)build effort/ for every project
python -m storyboard.bug_stats               # cross-project report (+ writes _SUMMARY.md)
python -m storyboard.bug_stats <project>     # one project's report
```

After enough videos this answers "**40% of bugs are layout; `vg-code-animations` is the most-reworked
skill**" — i.e. exactly which skill / bug-class is the upstream thing to fix. The `owner skill` column
shares one mapping with the **BUG ROUTER** (CLAUDE.md), so live routing ↔ logging ↔ analytics agree.
