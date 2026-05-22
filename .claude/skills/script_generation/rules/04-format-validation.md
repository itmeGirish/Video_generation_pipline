---
name: format-validation
description: How to validate the completed script against source_parser.py regex before saving. Parser errors abort the build before TTS.
metadata:
  tags: format, validation, parser, regex, source-parser, pipeline-compatibility
---

# Step 5 — Format Validation

Run this check mentally on every scene before saving the file.
A single format error causes `source_parser.py` to raise `ValueError` and abort the entire build before TTS.
Fixing it after costs zero time. Finding it after a 25-minute render costs the full render.

---

## Parser regex — what it looks for

Source: `storyboard/source_parser.py` lines 76-79 and 218-221.

### Scene header regex
```
^## SCENE N — "Title" (M:SS – M:SS)$
```

**Exact rules:**
- Starts with `##` (two hashes), space, word `SCENE`
- Integer scene number
- Separator: `—` (em-dash) OR `-` (hyphen)
- Title: any text, optionally in `"double quotes"`
- Opening paren `(` then time `M:SS`
- Time separator: `–` (en-dash) OR `-` (hyphen)
- Closing time `M:SS` then `)`
- Must be a SINGLE LINE — no line breaks inside

**Valid examples:**
```
## SCENE 1 — "Cold Open" (0:00 – 0:13)
## SCENE 2 - Context (0:13 - 0:52)
## SCENE 10 — "Verdict + CTA + Loop-Back" (15:08 – 16:44)
```

**Invalid examples:**
```
## Scene 1 — Cold Open (0:00 – 0:13)    ← "Scene" not "SCENE"
## SCENE 1: "Cold Open" (0:00 – 0:13)   ← colon not em-dash
## SCENE 1 — Cold Open                  ← missing time window
```

---

### Narration block check

- Must start with `### Narration` (three hashes, space, capital N)
- Every content line must start with `>`
- `<pause Xs>` is allowed anywhere in `>` lines
- Blank lines between `>` lines are OK
- Missing `### Narration` block → `ValueError` on that scene

---

### Animation block check

- Must start with `### Animation` (three hashes, space, capital A)
- Each bullet must start with `- **`
- Bullet format: `- **M:SS – M:SS — Headline.** body`
- Time format: `M:SS` where M is minutes (any number) and SS is two-digit seconds
- Separator between time and headline: `—` or `-`
- Headline must be inside `**...**`
- Missing `### Animation` block → `ValueError` on that scene

**Valid bullet examples:**
```
- **0:00 – 0:05 — Clean AI interface fades in.** ChatGPT-style dark-mode UI.
- **1:42 – 1:50 — [REPLACE] Lie detector materializes.** Art-deco machine.
- **15:08 – 15:30 — Subscribe CTA.** CYAN border card types "SUBSCRIBE" at 22 cps.
```

**Invalid bullet examples:**
```
- 0:00 – 0:05 — Clean AI interface.              ← missing ** markers
- **0:00 – 0:05 Clean AI interface.** body        ← missing — separator
- **0:00-0:05 — Clean AI interface** body         ← missing closing .** after headline
```

---

## Full file structure check

```
# Video Title — PRODUCTION DOCUMENT          ← one # heading at top (optional)

## SCENE 1 — "Title" (0:00 – M:SS)           ← ## SCENE header
### Narration                                 ← ### Narration
> Narration text. <pause 0.3s>               ← > lines only
> More narration.

### Animation                                 ← ### Animation
- **0:00 – 0:05 — Headline.** Body.          ← - ** bullets

## SCENE 2 — "Title" (M:SS – M:SS)           ← next scene, no blank line required
### Narration
...
```

No other heading levels between `## SCENE` headers.
No `# Section` or `### Sub-section` headers that are not `Narration` or `Animation`.

---

## Time window consistency check

- Scene 1 starts at `0:00`
- Each scene's start time equals the previous scene's end time (approximately)
- Scene N's end time approximates the total video length

These do not need to be exact — the parser extracts them but the renderer ignores them for positioning. However, wildly wrong times (Scene 3 ends at 2:00 but Scene 4 starts at 5:00) suggest a missing scene.

---

## Validation checklist — run before saving

**Header checks (every scene):**
- [ ] `## SCENE N` with uppercase SCENE
- [ ] Em-dash or hyphen after scene number
- [ ] Title present (quoted or unquoted)
- [ ] Time window in `(M:SS – M:SS)` format
- [ ] Single line — no wrap

**Narration checks (every scene):**
- [ ] `### Narration` present
- [ ] Every content line starts with `>`
- [ ] `<pause Xs>` uses correct syntax (no missing `s`, no space before `>`)

**Animation checks (every scene):**
- [ ] `### Animation` present
- [ ] Every bullet starts with `- **`
- [ ] Every bullet has `M:SS – M:SS — Headline.**` format
- [ ] No bullet has headline text outside the `**...**` markers

**Content checks:**
- [ ] No hex literals in bullet bodies (e.g. `#00F0FF`) — use `D.cyan` only
- [ ] No JSX in bullet bodies (`<div>`, `<Component>`)
- [ ] Every named color is a D.* token name, not a CSS color name

---

## Where to save

Output path: `projects/structured_scripts/<project_name>.txt`

- `<project_name>` must be snake_case and match the `project:` field in `config.yaml`
- Never save to `projects/scripts/` — that is for raw unprocessed input
- Never save to `projects/<name>/source.txt` — that is a legacy path

After saving, confirm the file exists and report the path to the user.
