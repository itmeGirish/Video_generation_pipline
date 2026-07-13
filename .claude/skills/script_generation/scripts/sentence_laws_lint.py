#!/usr/bin/env python3
"""sentence_laws_lint.py — machine-checkable subset of the Sentence Laws (script-writer S5).

The consistency floor for narration: reads a draft-script.json and flags every sentence that violates
a mechanically-checkable law. Exit 0 = clean, exit 1 = violations (printed as: <id> | <law> | <detail>).

Usage:
  python sentence_laws_lint.py draft-script.json
  python sentence_laws_lint.py draft-script.json --banned ../references/banned-words.txt

Input schema (draft-script.json):
  { "sentences": [ { "id","chapter","text","role","concept_tag","visual_intent","emphasis_word",
                     "display_value"(optional) }, ... ] }

Laws enforced here (see references/sentence-laws.md for the full set):
  L2  ≤22 words           L3  active voice in mechanisms   L5  role in closed set
  L6  ≥1 breath/chapter   L7  visual_intent present ≤12w   L8  ≤1 emphasis word, present in text
  L9  no visual-narration phrases    (+ banned-words voice lint if --banned given)
  L1  crude two-idea heuristic (a warning, not a hard fail)
"""
import sys, json, re, os

ROLES = {"hook","stake","proof","mechanism","example","tension","release",
         "interrupt","reanchor","boundary","takeaway","breath"}
VISUAL_NARRATION = ["as you can see","on the screen","here we see","below","above",
                    "as shown","you can see here","on screen"]
PASSIVE = re.compile(r"\b(is|are|was|were|be|been|being)\b\s+\w+ed\b.*\bby\b", re.I)
WORD = re.compile(r"[A-Za-z0-9']+")

def load_banned(path):
    out=[]
    if path and os.path.exists(path):
        for ln in open(path, encoding="utf-8"):
            ln=ln.split("#",1)[0].strip()
            if ln: out.append(ln.lower())
    return out

def wc(t): return len(WORD.findall(t))

def main():
    args=[a for a in sys.argv[1:] if not a.startswith("--")]
    banned_path=None
    if "--banned" in sys.argv:
        i=sys.argv.index("--banned")
        if i+1 < len(sys.argv): banned_path=sys.argv[i+1]
    if not args:
        print("usage: sentence_laws_lint.py <draft-script.json> [--banned <file>]"); return 2
    data=json.load(open(args[0], encoding="utf-8"))
    sents=data.get("sentences",[])
    banned=load_banned(banned_path)

    violations=[]; warnings=[]
    chapter_breath={}
    for s in sents:
        sid=s.get("id","<no-id>"); text=s.get("text",""); role=s.get("role","")
        low=text.lower()
        ch=s.get("chapter","<none>")
        chapter_breath.setdefault(ch,0)
        if role=="breath": chapter_breath[ch]+=1

        # L5 role in closed set
        if role not in ROLES:
            violations.append((sid,"L5-role",f"role '{role}' not in closed set"))
        # L2 <=22 words
        n=wc(text)
        if n>22:
            violations.append((sid,"L2-length",f"{n} words (>22)"))
        # L3 passive in mechanism
        if role=="mechanism" and PASSIVE.search(text):
            violations.append((sid,"L3-passive","passive voice in a mechanism sentence"))
        # L7 visual_intent present + <=12 words
        vi=s.get("visual_intent","")
        if not vi.strip():
            violations.append((sid,"L7-visual_intent","missing visual_intent hint"))
        elif wc(vi)>12:
            violations.append((sid,"L7-visual_intent",f"visual_intent {wc(vi)} words (>12) — should be a hint"))
        # L8 emphasis word: single token, present in text
        ew=s.get("emphasis_word","")
        if ew:
            if len(ew.split())>1:
                violations.append((sid,"L8-emphasis",f"emphasis_word '{ew}' is not a single word"))
            elif ew.lower() not in low:
                violations.append((sid,"L8-emphasis",f"emphasis_word '{ew}' not found in text"))
        # concept_tag present
        if not s.get("concept_tag","").strip():
            violations.append((sid,"tag","missing concept_tag"))
        # L9 no visual narration
        for p in VISUAL_NARRATION:
            if p in low:
                violations.append((sid,"L9-visual-narration",f"phrase '{p}'")); break
        # banned words
        for b in banned:
            if re.search(r"(?<![a-z])"+re.escape(b)+r"(?![a-z])", low):
                # 'just' is a soft warning (minimizer only)
                (warnings if b=="just" else violations).append((sid,"banned",f"'{b}'"))
        # L1 crude two-idea heuristic (warning)
        if "; " in text or (n>14 and len(re.findall(r"\b(and|but|which|because)\b", low))>=2):
            warnings.append((sid,"L1-two-ideas","possible two ideas — check split"))

    # L6 >=1 breath per chapter
    for ch,cnt in chapter_breath.items():
        if cnt==0:
            violations.append((f"chapter:{ch}","L6-breath","no breath sentence in this chapter"))

    for sid,law,det in warnings:
        print(f"WARN  {sid} | {law} | {det}")
    for sid,law,det in violations:
        print(f"FAIL  {sid} | {law} | {det}")
    print(f"\n{len(sents)} sentences | {len(violations)} violations | {len(warnings)} warnings")
    return 1 if violations else 0

if __name__=="__main__":
    sys.exit(main())
