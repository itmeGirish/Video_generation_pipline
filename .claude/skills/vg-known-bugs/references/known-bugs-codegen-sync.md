# Known Bugs — Per-Bullet Codegen / Visual + Anchor-Sync + Render Monitoring (Class N…N+13)

Reference catalog for `vg-known-bugs`. Read the relevant class before authoring bullet React code, diagnosing a 'frozen'-looking render, or chasing audio-sync drift. Includes the Scene Verification Checklist (run after every render). Router lives in the parent SKILL.md.

---

## Class N — audio_anchor fails narration verbatim check due to `<pause Xs>` tokens

**Symptom:** `build_video.py` raises `RuntimeError: cached audio_anchor '...' is not a verbatim phrase in narration` even though the phrase visually appears in the narration text.

**Root cause:** The narration validator tokenises with `r"[a-z0-9]+"` which includes `<pause 0.3s>` → tokens `["pause","0","3s"]`. Any anchor phrase that spans a `<pause>` break is non-contiguous in the token list → validation fails.

**Examples that fail:**
- Narration: `"Ethics? <pause 0.3s> …GPT."` → anchor `"Ethics GPT Yeah"` fails because `["ethics","gpt","yeah"]` are not contiguous.
- Narration: `"nine hundred million weekly"` → anchor `"900 million weekly"` fails (Whisper outputs numerals, narration has words).
- Narration: `"OpenAI wins"` → anchor `"Open AI wins"` fails (one word vs two in narration).

**Fix rules:**
1. Anchor must be verbatim in the narration as written (not as Whisper transcribes it).
2. Never span a `<pause Xs>` boundary — use a phrase from one side of the pause.
3. For number words ("nine hundred") the fuzzy Whisper matcher handles digit form ("900") at alignment time — write the anchor as it appears in the narration.
4. For "OpenAI" (one word in narration, Whisper says "Open AI") — use "OpenAI" in the anchor; fuzzy tier 4 (SequenceMatcher) handles the split at alignment time.

**Now prevented by:** These rules are documented here. Before authoring any anchor, visually confirm it is a verbatim substring of the narration text with no `<pause>` in between.

---

---

## Class N+1 — Minimal bullet code produces visually meaningless output

**Symptom:** Rendered scene shows thin lines, blinking cursors, or single abstract shapes with no narrative connection. Viewer cannot tell what the narration is talking about.

**Root cause:** Bullets like "Hairline crack appears" or "Cursor blinks; silence" were coded as literal abstract effects (2-3 thin lines, a blinking glyph) with zero text context. The LLM optimised for visual correctness of the description rather than viewer comprehension.

**Rule:** Every bullet code must answer: *"If you muted the audio and watched this frame, could the viewer understand what topic is being discussed?"* If not, add:
- A title/label showing the subject (e.g. `'ARTIFICIAL ANALYSIS — HALLUCINATION BENCHMARK'`)
- A stat, quote, or data point visible on screen
- Enough context text that the visual is self-explanatory

Short transition bullets (< 2s) are exempt, but any bullet > 3s with no readable text is a production failure.

**Now prevented by:** Read this rule before authoring any bullet with a vague headline (e.g. "crack appears", "cursor blinks", "wipe", "transition"). Always add context text.

---

---

## MANDATORY PRE-RENDER GATE — Visual Walkthrough (rule 19 § 10)

Before ANY render of a new scene: write a one-line "muted viewer sees:" description for
every bullet and apply the FAIL test. No render starts until all bullets pass.
Full procedure is in **rule 19 § 10**. This gate catches the bug classes below before
a 25-min render bakes them in.

---

---

## Class N+2 — ADDITIVE bullet assumes previous bullet's visuals are still visible

**Symptom:** An ADDITIVE bullet that "adds on top of" the previous bullet shows only its own content with no context. E.g. B7 (checkmarks) showed floating ✓/⚠ symbols with no octopus body, no arms, no tool labels — because those were in B6 which had already ended.

**Root cause:** In slot-based rendering (`UniversalScene.tsx`), each bullet renders ONLY during its own `[framesFrom, framesTo]` window. When B7's slot begins, B6's slot has ended — B6's React code is no longer running. There is no "accumulation" of previous bullets' visuals.

**Rule:** Every ADDITIVE bullet must be visually self-contained and self-explanatory. It cannot rely on previous bullet content being visible.  
- Copy the relevant background/context elements from the previous bullet into the new one.  
- If B6 shows an octopus + arms, B7 (which adds checkmarks) must ALSO render the octopus body + arms + labels, then ADD the checkmarks on top.

**Fix checklist before authoring any ADDITIVE bullet:**
1. Ask: "If this bullet played with all previous bullets invisible, would a viewer understand what topic is on screen?"
2. If no: add the essential context elements (labels, title, background shapes) directly in THIS bullet's code.
3. Short stagger bullets (<2s) that add a single label or stat are exempt — but the BASE visual (chart, diagram, workspace) must already be present in a REPLACE bullet before them.

**Now prevented by:** This rule. Apply it during every bullet authoring session before seeding cache.

---

---

## Class N+3 — Empty container: border drawn, inner content missing

**Symptom:** Rendered scene shows colored-border rectangles/boxes with nothing visible inside. E.g. S05 B7 showed two colored boxes (red border for "lawyer", green for "founder") with zero readable text — empty drawers. Viewer has no idea what they represent.

**Root cause:** The LLM authored the container `div` with a border, but placed the inner content (title label, body text, stat line) as sibling `divs` that either: (a) had incorrect positioning so they rendered outside the container bounds, (b) had `opacity: 0` from an animation that never triggered because `frame` started from 0 before the parent's `bgOp` reached 1, or (c) were simply missing — the LLM "completed" the visual description with the container alone.

**Rule:** Every bordered box/card must have at minimum:
1. A TITLE label (color-matched to the border, `fontFamily: D.font_mono`, `fontWeight: 700`)
2. A body line with the actual content claim (stat, quote, outcome)
3. Text must be inside `padding` or at `position: absolute` with explicit `top/left` inside the container — never rely on flexbox gap alone

**Muted-viewer test:** If you cover the border, is there still readable text that tells the viewer what this card is about? If not, the card is empty.

**Fix pattern:** When authoring a labeled card:
```js
React.createElement('div', {style: {backgroundColor: D.surface, borderRadius: 8, border: '2px solid ' + D.red, padding: `${Math.round(height*.022)}px ${Math.round(width*.022)}px`}},
  React.createElement('div', {style: {color: D.red, fontFamily: D.font_mono, fontSize: Math.round(width*.009), fontWeight: 700, marginBottom: Math.round(height*.012)}}, 'CARD TITLE'),
  React.createElement('div', {style: {color: D.text, fontFamily: D.font_mono, fontSize: Math.round(width*.01), lineHeight: 1.6}}, 'Body content here.')
)
```
The title and body must be INSIDE the container element, not as siblings.

**Now prevented by:** This rule. Check every card/box element during the pre-render walkthrough (rule 19 § 10).

---

---

## Class N+4 — Multiple position:absolute at same coordinates (duplicate overlay bug)

**Symptom:** Two or three identical-looking elements stacked exactly on top of each other — only the topmost is visible. E.g. S07 B4 had three `position:absolute` divs placed at the same `left/bottom` coordinates; one was an empty green-bordered card overlapping the numbers div, making the numbers look wrong.

**Root cause:** LLM creates multiple elements but uses the same computed position for each — often because it reuses `Math.round(height*.1)` as `bottom` for all siblings, or copies a container's position to all children without adding offsets.

**Detection rule:** Before seeding cache, visually trace every `position:absolute` element and ask: "does this element share the same `top/left/bottom/right` as any sibling?" If yes, the later sibling is invisible or obscures the earlier one.

**Fix:** Use either:
- `flexDirection: 'column'` with `gap` for vertically-stacked elements (no `position:absolute` needed)
- Or explicitly stagger: `top: Math.round(height*.1)` for el1, `top: Math.round(height*.25)` for el2, etc.

**Common case:** The "result card" pattern (stat + badges) — use a single centered column flex container, not multiple `position:absolute` siblings.

**Now prevented by:** This rule + the pre-render walkthrough checklist item: "do any two elements have identical computed position?"

---

---

## Class N+5 — Diagonal line coded as filled rectangle

**Symptom:** Code attempts to draw diagonal connections between two points using a `div` with `width: Math.abs(dx)` and `height: Math.abs(dy)` — this creates a solid filled rectangle, not a line. E.g. S03 B6 "octopus arms" created 8 filled colored rectangles instead of the intended diagonal lines from center to tool cards.

**Root cause:** LLM correctly computes the `dx/dy` offset between two points, then uses those as `width/height` of a `div` — creating a rectangular fill, not a line. The visual result is a grid of colored blocks, not connecting arms.

**Correct pattern for diagonal lines using CSS:**
```js
const dx = x2 - x1; const dy = y2 - y1;
const len = Math.round(Math.sqrt(dx*dx + dy*dy));
const angle = Math.atan2(dy, dx) * 180 / Math.PI;
React.createElement('div', {style: {
  position: 'absolute',
  left: x1, top: y1,
  width: len, height: 2,
  backgroundColor: D.cyan,
  transform: `rotate(${angle}deg)`,
  transformOrigin: '0 50%'
}})
```

**Alternative (when connecting two anchor points):** Instead of diagonal lines, use a grid of labeled cards (simpler, more readable, no trigonometry needed). The 8-tool grid pattern is the canonical replacement for "hub-and-spoke" diagrams.

**Rule:** NEVER use `width: Math.abs(x2-x1), height: Math.abs(y2-y1)` on a `div` to draw a line. Either use the `rotate + thin height` pattern above, or replace the hub-spoke design with a labeled card grid.

**Now prevented by:** This rule. Grep for `Math.abs(` in width/height props during code review — if both `width` and `height` use `Math.abs` of a coordinate difference, it is this bug.

---

---

## Class N+6 — Two-panel comparison split across two ADDITIVE bullets

**Symptom:** A pipeline or A-vs-B comparison has two panels — LEFT card (step 1) and RIGHT card (step 2). Each is coded as a separate ADDITIVE bullet. When either bullet plays, viewer sees ONE card on the left or right half of the screen with the other 50-60% completely black.

**Example:** S07 pipeline — B2 (GPT DRAFT, left-only) → B3 (Claude FACT-CHECK, right-only). In additive mode, B3 was supposed to join B2 on screen. In slot-based rendering, B3 plays alone: viewer sees only the right card, left half is empty.

**Root cause:** The author designed the two bullets as "additive overlay" (B2 sets up left, B3 adds right). In slot-based rendering, this assumption breaks — each bullet must be self-contained.

**Rule:** When a visual story requires TWO panels to be understood simultaneously (pipeline A→B, before/after, comparison), use ONE OF:

Option A — Single REPLACE bullet showing both panels:
```js
// Both LEFT and RIGHT cards in one bullet
React.createElement(AbsoluteFill, {style: {backgroundColor: D.bg}},
  React.createElement('div', {style: {position:'absolute', left: Math.round(width*.06), ...}}, /* LEFT card */),
  React.createElement('div', {style: {position:'absolute', right: Math.round(width*.06), ...}}, /* RIGHT card */)
)
```

Option B — Each bullet self-contained with both panels, active one bright, inactive one dimmed (opacity .25):
```js
// B2: LEFT active (bright), RIGHT waiting (dimmed)
// B3: LEFT done (dimmed), RIGHT active (bright)
```

**The test:** Cover one panel. Can the viewer still understand what the other panel means? If not, the panels are co-dependent and must appear together.

**Now prevented by:** This rule. Whenever authoring two bullets that show "left half → right half", immediately ask: "would either look coherent alone?" If no → use Option A or Option B.

---

---

## Class N+7 — Unlabeled data bars (benchmark bars with no model identity)

**Symptom:** Animated bar chart shows colored horizontal bars filling to some percentage, but the only labels are the percentage numbers. Viewer cannot tell which bar represents which model. E.g. S04 B2/B3/B4/B7/B8 showed violet bar 82.7% and cyan bar 69.4% with no "GPT-5.5" or "CLAUDE 4.7" text visible.

**Root cause:** The REPLACE bullet (B1) set up the track layout WITH model labels at `left: width*.08`. The ADDITIVE bullets (B2-B8) only drew the bars, not the labels — they depended on B1's labels still being visible. In slot-based rendering, B1 is gone when B2 plays.

**Rule:** EVERY benchmark bar bullet (whether REPLACE or ADDITIVE) must include:
1. **Benchmark round context** — `'ACTING ROUND — BENCHMARK-NAME'` or `'REASONING ROUND — BENCHMARK-NAME'` at `top: height*.1` centered
2. **Model identity labels** at `left: width*.08` for each bar track:
   - Left of top track: `color: D.violet, 'GPT-5.5'` (or `D.cyan, 'CLAUDE 4.7'` depending on which model is on top)
   - Left of bottom track: the other model label
3. Score **percentage** at the right end of the bar
4. **Winner badge** (e.g. `'+13.3 PTS'`) appearing after bar fills

The pattern `left: width*.08, top: TY1+TH*.25` for model label and `left: width*.14` for bar start leaves a natural label column.

**Now prevented by:** This rule. For every bar chart bullet, write the pre-render walkthrough entry as: "Viewer sees: [ROUND] label, [MODEL A] top bar at X%, [MODEL B] bottom bar at Y%, winner badge." If any of those elements is missing from the description, the bullet is incomplete.

---

---

## Class N+8 — Pipeline output appears frozen in background tasks (false hang diagnosis)

**Symptom:** Background task output stops at exactly "Race 1: Terminal-Bench, MAGENTA leads." (S04 B2 in step 7). Operator concludes pipeline is hung, kills it, restarts — repeating the loop. The mp4s never appear because the pipeline is killed before it finishes rendering. This loop has recurred across build sessions.

**Root cause:** Python's stdout is **block-buffered** when its output goes to a pipe (PowerShell background task output capture). Python accumulates ~8KB in a memory buffer before flushing to the file. The pipeline prints ~8KB of lint warnings and step 7 frame ranges for S01-S04, then the buffer fills and stops flushing until the process exits or the buffer overflows again. Meanwhile the pipeline IS running step 7 for S05-S10, then step 8, then step 9 (Remotion render) — completely invisible in the output file.

**Why "Race 1: Terminal-Bench":** That line happens to be the point where the ~8KB buffer fills for a large project (dozens of bullets worth of lint + step 7 frame output). A different project with more/fewer bullets would have a different stopping line, but the underlying cause is always the same buffer fill.

**Confirmed NOT a hang:** The pipeline processed all 10 scenes and rendered S04 (chat-5-5-s04.mp4, 6.6 MB, 22:32 timestamp) while the output file was still showing the frozen line. The render completed silently in the background.

**Fix (use ALL of these):**

1. **Use `python -u` flag** (unbuffered) when running in any background context. This disables block buffering so each `print()` writes immediately:
   ```powershell
   python -u storyboard/build_video.py ... > C:\tmp\build_s05.log 2>&1
   ```

2. **Redirect to a log file + read tail** instead of reading task output. The log file grows in real time with `-u`:
   ```powershell
   Get-Content C:\tmp\build_s05.log -Encoding Unicode -Tail 30
   ```

3. **Check for rendered mp4s, NOT task output**, to determine render progress:
   ```bash
   ls -la remotion/out/chat-5-5-s*.mp4
   ```
   If a new mp4 appeared with a recent timestamp → that scene rendered. Task output is irrelevant.

4. **Never kill a pipeline because output looks frozen.** Wait for either: (a) a new mp4 appears, (b) the task notification fires (completed/failed), or (c) 60+ minutes pass with no new mp4 AND no node.exe or python.exe process visible in `Get-Process`.

**What a healthy stuck-looking run looks like:**
```
# Task output (frozen at):
        [anchor] 646-745f  Race 1: Terminal-Bench, MAGENTA leads.

# But Get-Process shows:
node.exe    Id=XXXX  CPU=high  Working=1.2GB   ← Remotion rendering

# And remotion/out/ has:
chat-5-5-s05.mp4  22:58  5.1 MB   ← appeared while "frozen"
```

**What a genuinely stuck run looks like:**
- No `node.exe` or `python.exe` process visible in `Get-Process`
- No new mp4 appeared after 30+ minutes
- Task status is still "running" (harness lag)

In that case, kill and restart with `python -u ... > C:\tmp\build.log 2>&1` to see the real error.

---

---

## Class N+9 — Remotion (node) render progress invisible in log files

**Symptom:** `build_video.py` log ends at `rendering 1 scenes: ['chat-5-5-s05']` and nothing appears after — not frame counters, not success/failure, nothing. Operator concludes render crashed silently. Kills task. Restarts. Loop repeats. `CREATE_NO_WINDOW` is the cause.

**Root cause:** `build_video.py` spawns `node render_scenes.mjs` via:
```python
subprocess.Popen(
    ["node", "render_scenes.mjs"] + to_render,
    cwd=str(REMOTION_DIR), env=env,
    creationflags=CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
)
```
`CREATE_NO_WINDOW` on Windows tells the OS to create the child process **without an attached console**. A side effect: Windows does NOT inherit the parent's stdout/stderr handles to a consoleless child. Node's stdout (frame progress `100/5711`, `200/5711`, ...) and stderr go to NUL — discarded. The Python parent is blocked on `proc.wait()` and prints nothing until node exits. The log appears dead.

**How this differs from Class N+8:** Class N+8 is Python's own block-buffered stdout (fixed with `-u`). Class N+9 is a different process entirely — node's stdout is structurally discarded, not buffered. Even `python -u` makes no difference for node's output.

**Proof it was running:** When `node render_scenes.mjs chat-5-5-s05` is run directly (not via `build_video.py`) with output captured, frames print normally: `100/5711 ... 200/5711 ...`. The render IS running; the log just shows nothing.

**What the correct diagnostic looks like:**
```powershell
# 1. Is node still alive?
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, CPU, StartTime

# 2. Any inprogress file growing?
Get-ChildItem remotion/out/ | Sort-Object LastWriteTime -Descending

# 3. Final verdict — did the mp4 appear?
Get-ChildItem remotion/out/chat-5-5-s*.mp4 | Sort-Object LastWriteTime -Descending
```
If `node.exe` is visible with high CPU → render is running. Period. Do not kill it.

**Fix for future monitoring:** Run node directly (bypassing `build_video.py`) if you need visible frame progress:
```powershell
$env:PROJECT = "<name>"
Set-Location remotion
node render_scenes.mjs chat-5-5-s05 > C:\tmp\render_s05.log 2>&1
# C:\tmp\render_s05.log will contain live frame counters
```
Or just watch for the mp4 to appear in `remotion/out/`.

**NEVER kill a node.exe/python.exe that started within the last 20 minutes just because the log looks frozen.** That is always Class N+8 or N+9, not a hung process.

---

---

## Class N+10 — Canvas underutilization (content <60% of screen)

**Symptom:** Rendered frame shows large black empty areas — top 25%+ blank, or right/left 30%+ unused. Elements are technically present but clustered in a small region of the 1920×1080 canvas. Viewer feels like they're watching a tiny postage stamp. Dull, amateurish.

**Root cause:** Per-bullet code uses size constants that are too small (e.g. `MW=width*.14, MH=height*.22`) and/or positions them via center-clustering logic that fails to spread elements across the full canvas. Often occurs in multi-element grid layouts (2×2 or 4-item) where author anchored all positions relative to a narrow center band.

**Canonical examples:**
- S06 B1: 4 vending machines at `MW=width*.14, MH=height*.22` with positions `{x:.16,y:.35},{x:.38,y:.28},{x:.6,y:.35},{x:.38,y:.58}` → machines small, top 28% and right 33% unused.

**Prevention rules:**
1. For 2×2 grid: machine/card must be at minimum `MW=width*.38, MH=height*.28`. Column centers at ~26% and ~74%. Row tops at ~22% and ~58%.
2. Canvas coverage check before render: `min(element top) ≤ 0.20`, `max(element bottom) ≥ 0.80`, `min(element left) ≤ 0.08`, `max(element right) ≥ 0.88`
3. 4-item layouts MUST span from column 6% to 94% and row 18% to 88% (allowing for title at top).
4. Single card layouts: card width ≥ `width*.55`, card height ≥ `height*.55`.
5. After authoring multi-element code, verify every `MW=`, `MH=`, and position multiplier meets the above minimums before seeding cache.

**Fix pattern for 2×2 grid:**
```javascript
const positions=[{cx:.26,cy:.22},{cx:.74,cy:.22},{cx:.26,cy:.58},{cx:.74,cy:.58}];
const MW=Math.round(width*.40); const MH=Math.round(height*.30);
// left = Math.round(width*p.cx) - Math.round(MW/2)
// top  = Math.round(height*p.cy)
```

---

---

## Class N+11 — Absolute overlay collides with card header (stamp/badge overlap)

**Symptom:** A stamp, badge, or floating label is positioned at canvas coordinates that put it within 5% of a card's `top:` value. When the element rotates (e.g. `rotate(-12deg)`), it bleeds across the card's top edge and covers the header text. Viewer sees unreadable overlapping text.

**Root cause:** Author positions the overlay at canvas-level `top:` only slightly above (or equal to) the card's `top:` — e.g. stamp at `top:height*.26` when card is at `top:height*.28`. The 2% gap is smaller than the rotated element's visual extent, causing collision. The card header (`CLAUDE RESPONSE`, `CUSTOMER EMAIL`, etc.) is rendered at the very top of the card with only marginBottom:8px separation.

**Canonical examples:**
- S06 B3: Stamp `REFUND: NEVER SENT` at `top:height*.26` overlaps right panel header `CLAUDE RESPONSE` at `top:height*.28`. Only 2% canvas height gap; rotation spreads stamp across header.

**Prevention rules:**
1. Any stamp/badge overlay over a card MUST be positioned at least 20% of the card's height below the card's `top:` value. Formula: `stampTop = cardTop + cardHeight * 0.55` (lower 45% of card).
2. If stamp is canvas-absolute (not inside the card element), ensure `stampTop ≥ cardTop + cardHeight * 0.35`.
3. Prefer positioning stamp BELOW the card entirely (`top: cardTop + cardHeight + gap`) when it should feel like a verdict, not content inside the card.
4. Never use `transform:rotate(Xdeg)` on a canvas-absolute element that shares a `top:` within 8% of any other element's `top:`.
5. Test visually: stamp center Y + (font_size / 2) + rotation_spread must NOT overlap any text line above it.

**Fix pattern:**
```javascript
// Card at top:height*.28, height:height*.24
// Stamp INSIDE lower panel area — safe:
top: Math.round(height*.28 + height*.24 * 0.55)  // = height*.412 → well below header
// OR stamp below both panels:
top: Math.round(height*.58)  // below panel bottom (52%) with visible gap
```

---

---

## Session progress record (an example build)

**State at session end:**
- S01 mp4: ✓ rendered (19:59)
- S02 mp4: ✓ rendered (20:02)
- S03 mp4: ✓ rendered (20:52)
- S04 mp4: ✓ rendered (22:32) — **all 9 muted-viewer fixes applied** (see below)
- S05 mp4: **rendering in progress** (task bo9fcepne, started ~23:07, `C:\tmp\render_s05.log`)
- S06-S10: not yet rendered

**S04 muted-viewer fixes applied:**
- B2/B3/B4: Added "ACTING ROUND — [BENCHMARK]" header + GPT-5.5/CLAUDE 4.7 model labels at each bar track (Class N+7)
- B7/B8: Added "REASONING ROUND — [BENCHMARK]" header + labels, Claude on top/TY1 (Class N+7)
- B11: Rewrote as full self-contained BENCHMARK SUMMARY scene (was floating badges on black — Class N+2)
- S06 B2: Added VENDING-BENCH context header + machine body (Class N+3)
- S06 B4: Centered two panels (was right-60%+ only — Class N+6)
- S07 B2: Added RIGHT card dimmed (opacity .2) showing full pipeline (Class N+6)
- S07 B3: Added LEFT card dimmed (opacity .3) showing full pipeline (Class N+6)

**Canonical scene JSON state:**
- S04: 22:09 timestamp — has all fixes ✓
- S06: 22:09 — has fixes ✓
- S07: 22:09 — has fixes ✓
- S05/S08-S10: older timestamps — **no muted-viewer issues identified**, OK to render as-is

**To continue (next session):**
1. Check S05: `Get-Content C:\tmp\render_s05.log | Select-String "\d+/5711" | Select-Object -Last 1`
2. If S05 done (mp4 in `remotion/out/`): run `python -u storyboard/build_video.py projects/structured_scripts/<name>.txt --skip-layout > C:\tmp\build_all.log 2>&1` — pipeline auto-skips S01-S05
3. Monitor S06-S10 render: `Get-Process node` for liveness; `Get-ChildItem remotion/out/chat-5-5-s*.mp4` for new files — NOT the log
4. After all 10 rendered: pipeline auto-stitches → `projects/<name>/out/<output>.mp4`

---

---

## Class N+12 — Anchor phrase tokenization mismatch → interpolated framesFrom lands seconds off

**Symptom:** `verify_sync.py` reports anchor NOT FOUND for a block. Pipeline interpolates `framesFrom` from neighbors. Visual appears 1–3+ seconds before or after narration says the matching phrase. In extreme cases (e.g. S05 B3 in one build): +3.02s drift — visual appears 3 seconds AFTER the words are spoken.

**Root cause — three specific mismatch patterns confirmed in production:**

1. **Decimal spoken as split number tokens** — anchor `"seventy-seven point eight"` normalizes to target `["77","point","eight"]`. But Whisper transcribes `77.8` as two tokens: `"77"` and `".8."` — no `"point"` word ever appears as a separate token. Matcher fails on the missing middle token.

2. **Percentage as single Whisper token** — anchor `"thirty-six percent"` normalizes to `["36","percent"]`. But Whisper outputs `"36%."` as ONE token — `"percent"` never appears as a separate word. Two-token target has no match.

3. **Compound word split by Whisper** — anchor `"OpenAI isn't"` normalizes to `["openai","isnt"]`. Whisper transcribes as `"Open"` `"AI"` `"isn't"` (three tokens). First token `"open"` ≠ `"openai"` → exact match fails. Fuzzy tier 4 (SequenceMatcher) sometimes catches this; sometimes doesn't.

**Confirmed production impact:**
- S05 B3 "thirty-six percent" → interpolated to 23.60s, spoken at 20.58s → **+3.02s CRITICAL drift**
- S03 B5 "Now watch GPT" → adjacent-block interpolation landed at 36.07s, spoken at 35.42s → **+0.65s drift**
- S08 B4 "seventy-seven point eight" → interpolated to 63.60s, spoken at 63.84s → -0.24s (minor)

**Anchor phrase rules (mandatory):**
1. **Never use decimal numbers as anchors.** `"seventy-seven point eight"`, `"four point seven"`, etc. always fail. Use the surrounding sentence instead: `"Mythos scores"` instead of `"seventy-seven point eight"`.
2. **Never use number+unit as anchor.** `"thirty-six percent"`, `"fifty million"` fail if Whisper merges them. Use context: `"the needle"` or `"coin flip"` for nearby spoken words.
3. **Compound words (OpenAI, SWEbench, TerminalBench):** fuzzy tier 4 usually handles these but is unreliable. Prefer surrounding plain words: `"isn't competing"` instead of `"OpenAI isn't"`.
4. **Always use a phrase of 2–4 plain words from the surrounding sentence** — not the statistic or measurement being displayed.

**Verification procedure (mandatory after every alignment step):**
Run `verify_sync.py` (copy of alignment functions from `build_video.py`) against all scene captions BEFORE rendering. Any block showing MISSED or DRIFT >0.5s must be fixed in the scene JSON (`framesFrom`/`framesTo`) before rendering starts. Re-rendering after sync fixes is required — fixing JSON alone is not enough since the master render uses pre-rendered scene mp4s.

```python
# Correct procedure for a missed anchor:
# 1. Load captions/<sid>.json (Whisper word timestamps)
# 2. Find the word index where the anchor phrase is actually spoken
# 3. Set framesFrom = round(words[idx]['start'] * FPS)
# 4. Set prior block's framesTo = same value
# 5. Re-render the scene
```

**Fix order in production:**
- S03 B5: framesFrom 1082 → 1063, B4 framesTo 1082 → 1063
- S05 B3: framesFrom 708 → 617, B2 framesTo 708 → 617
- S08 B4: framesFrom 1908 → 1915, B3 framesTo 1908 → 1915

**Now prevented by:** These anchor rules + mandatory `verify_sync.py` run before any render.

**Structural guard added (build_video.py Step 7):** a *drift-plausibility check* on every
fuzzy anchor hit. Tiers 3–4 of `find_phrase_fuzzy` scan the whole rest of the scene by
similarity only, so a loose phrase can match a window far from where the bullet belongs
and return a confident-but-wrong index (the +3s drift above). The guard:
- never touches an EXACT match (those are trustworthy),
- for a FUZZY match, compares the matched word index to the bullet's expected position
  (`bullet_i / n_bullets × scene_word_count`) with a generous ±50%-of-scene band,
- if the hit is past the band, it's REJECTED and treated as a miss — filled by
  neighbor interpolation (more reliable than a bad match; never source-script time).
Verified: normal in-order anchors all pass (no false rejects); a bullet-1 anchor that
matches near the scene end is rejected. Regression test: `test_pipeline_fixes.py [13b]`.

---

---

---

## Scene Verification Checklist (run after every render, before master stitch)

These are **general quality gates** that apply to every video project — not
project-specific. Check each rendered scene mp4 against all conditions below.
If any condition fails: fix the scene JSON / bullet code, delete the scene mp4,
re-render, and verify again. Do **not** move to the next scene until the current
scene passes all conditions.

### Conditions

| # | Condition | How to check |
|---|-----------|-------------|
| V1 | **Screen utilization** — no block should leave >60% of canvas empty | Inspect bullet code: at least one element must span ≥40% of width or height |
| V2 | **No overlapping text or visuals** — elements at similar top/left values must have different time phases or non-overlapping layout areas | Read all `top`/`left`/`right`/`bottom` values in block code; flag same-position siblings that are simultaneously visible |
| V3 | **Audio / visual sync** — framesFrom must match the spoken word within ±0.5s | Run `verify_sync.py`; any DRIFT > 0.5s or MISSED anchor with wrong interpolation = fail |
| V4 | **Text readability** — body text ≥ `width * 0.009`, headline text ≥ `width * 0.022` | Grep bullet code for `fontSize:Math.round(width*` and confirm values meet minimums |
| V5 | **Animation quality** — every block must use at least one `spring()` or `interpolate()` for motion; static renders are forbidden | Grep block code for `spring(` or `interpolate(`; zero matches = fail |
| V6 | **Block duration** — no block shorter than 0.5s (15 frames) unless it is a deliberate flash transition | Check `(framesTo - framesFrom) / fps`; flag any block < 15 frames |
| V7 | **Scene flow consistency** — no gap between consecutive blocks (framesTo of block N must equal framesFrom of block N+1) | Check JSON: `blocks[i].framesTo === blocks[i+1].framesFrom` for all i |
| V8 | **Narration coverage** — every narration sentence must have a visual block active while it is spoken | Cross-check Whisper word timestamps against block [framesFrom, framesTo] windows |

### Failure workflow

```
FOR each scene S01..S10:
  VERIFY all V1..V8
  IF any fail:
    IDENTIFY failing block(s)
    FIX bullet code or framesFrom/framesTo in scene JSON
    DELETE old scene mp4
    RE-RENDER scene
    RE-VERIFY
    REPEAT until all V1..V8 pass
  MARK scene PASSED
  MOVE to next scene
RE-RENDER master only after all 10 scenes pass
```

### Quick verification commands

```bash
# Sync check (V3)
python C:/tmp/verify_sync.py

# Block duration / gap check (V6, V7)
python -c "
import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
FPS = 30
for i in range(1, 11):
    sid = f'chat-5-5-s{i:02d}'
    blocks = json.loads(Path(f'remotion/public/scenes/{sid}.json').read_text(encoding='utf-8'))
    for j, b in enumerate(blocks):
        dur = (b['framesTo'] - b['framesFrom']) / FPS
        if dur < 0.5:
            print(f'{sid} B{j+1}: DURATION {dur:.2f}s < 0.5s — FAIL V6')
        if j > 0 and blocks[j-1]['framesTo'] != b['framesFrom']:
            gap = (b['framesFrom'] - blocks[j-1]['framesTo']) / FPS
            print(f'{sid} B{j+1}: GAP {gap:.2f}s after B{j} — FAIL V7')
print('Duration/gap check done')
"
```

---

---

## Class N+13 — Render hangs forever (parent-side `proc.wait()` with no ceiling)

**Symptom:** The build reaches the render step and never returns. No error, no
progress, the session is stuck — minutes (sometimes the whole session) lost before
anyone notices and kills it manually.

**Root cause:** `render_scenes.mjs` has an internal 120s no-frame-progress watchdog
(Class N+8/N+9), but it only covers a render that's *actively stalled mid-frame*. It
does NOT cover:
- node deadlocking BETWEEN scenes (cleanup / file write — no `renderMedia` running, so
  no watchdog active),
- the watchdog firing `cancel()` but an orphaned Chromium keeping the node event loop
  alive so the process never exits,
- a hang before the first `onProgress`.
In all three, `build_video.py` was calling a **bare `proc.wait()`** on the node
subprocess — which blocks the Python parent **indefinitely**.

**Fix (build_video.py render step):** `proc.wait(timeout=_render_ceiling_s)` with a
wall-clock ceiling sized PER SCENE (`render_timeout_per_scene_s`, default 900s, ×
number of scenes rendering; floor 900s). On `TimeoutExpired` the render tree (node +
Chromium) is force-killed via the shared `_kill_render_tree()` helper and the build
exits **124** (timed-out convention). Completed scenes are kept; re-run resumes the
rest. The ceiling is generous so a legitimately long batch never false-trips; override
with config `build.render_timeout_per_scene_s` or env `RENDER_TIMEOUT_PER_SCENE_S`.

**Prevention:** never call `proc.wait()` without a timeout on a long-running render or
LLM/TTS subprocess — an unbounded wait turns any downstream hang into a frozen session.

---

---
