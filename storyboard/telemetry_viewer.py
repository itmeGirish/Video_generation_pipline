"""telemetry_viewer.py — TELEMETRY REPLAY: a DevTools-style inspector for render telemetry.

Generates one self-contained HTML file from a project's runtime telemetry
(projects/<name>/out/telemetry/*.json, emitted by the RuntimeProbe): a timeline you
scrub, a canvas that draws every tagged cast element's real layout box at the selected
sample (id + state labels), and the telemetry_rules violations listed per sample.
Debugging becomes: click the frame → see the world as Chromium laid it out.

Usage:
    python -m storyboard.telemetry_viewer <project>
    → writes projects/<project>/out/telemetry_viewer.html (open in any browser)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<title>Telemetry Replay — __PROJECT__</title>
<style>
 body{margin:0;font-family:ui-monospace,Consolas,monospace;background:#111;color:#ddd}
 #bar{padding:10px 14px;background:#1b1b1b;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
 #bar b{color:#7dd3fc} select,input[type=range]{accent-color:#7dd3fc}
 #range{flex:1;min-width:200px}
 #stage{position:relative;margin:10px auto;background:#000;outline:1px solid #333}
 .box{position:absolute;border:1.5px solid #7dd3fc;background:rgba(125,211,252,.08);box-sizing:border-box}
 .box.dim{border-color:#555;background:rgba(255,255,255,.03)}
 .box .tag{position:absolute;top:-16px;left:0;font-size:10px;color:#7dd3fc;white-space:nowrap}
 .box.dim .tag{color:#777}
 #info{padding:8px 14px;font-size:12px;color:#aaa}
 #viol{padding:0 14px 20px;font-size:12px;color:#f87171;white-space:pre-wrap}
</style></head><body>
<div id="bar"><b>__PROJECT__</b>
 <label>scene <select id="scene"></select></label>
 <input id="range" type="range" min="0" max="0" value="0">
 <span id="lbl"></span></div>
<div id="stage"></div>
<div id="info"></div><div id="viol"></div>
<script>
const DATA=__DATA__; const VIOL=__VIOL__;
const SCALE=0.45; const stage=document.getElementById('stage');
const sceneSel=document.getElementById('scene'), range=document.getElementById('range'),
      lbl=document.getElementById('lbl'), info=document.getElementById('info'), viol=document.getElementById('viol');
const scenes=[...new Set(DATA.map(d=>d.scene))].sort();
scenes.forEach(s=>{const o=document.createElement('option');o.value=o.textContent=s;sceneSel.appendChild(o);});
function samplesFor(s){return DATA.filter(d=>d.scene===s).sort((a,b)=>a.frame-b.frame);}
function draw(){
  const s=sceneSel.value, arr=samplesFor(s), i=Math.min(+range.value,arr.length-1), t=arr[i];
  if(!t)return;
  const W=(t.canvas&&t.canvas.w)||1920, H=(t.canvas&&t.canvas.h)||1080;
  stage.style.width=(W*SCALE)+'px'; stage.style.height=(H*SCALE)+'px'; stage.innerHTML='';
  (t.items||[]).forEach(it=>{
    const d=document.createElement('div'); d.className='box'+((it.op??1)<0.15?' dim':'');
    d.style.left=(it.x*SCALE)+'px'; d.style.top=(it.y*SCALE)+'px';
    d.style.width=(it.w*SCALE)+'px'; d.style.height=(it.h*SCALE)+'px';
    const tag=document.createElement('span'); tag.className='tag';
    tag.textContent=it.id+(it.state?(' · '+it.state):'')+((it.op??1)<1?(' · op '+it.op):'');
    d.appendChild(tag); stage.appendChild(d);
  });
  lbl.textContent='f'+t.frame+'  ('+(i+1)+'/'+arr.length+')';
  const vis=(t.items||[]).filter(it=>(it.op??1)>=0.15).length;
  info.textContent='visible cast elements: '+vis+' / tagged: '+(t.items||[]).length;
  const key=s+' f'+t.frame;
  const hits=VIOL.filter(v=>v.includes(s)&&(v.includes('f'+t.frame+':')||v.includes('f'+t.frame+' ')||!/f\\d+/.test(v)));
  viol.textContent=hits.length?('violations @ this sample / scene-wide:\\n• '+hits.join('\\n• ')):'no violations at this sample';
}
sceneSel.onchange=()=>{range.max=samplesFor(sceneSel.value).length-1;range.value=0;draw();};
range.oninput=draw;
sceneSel.onchange();
</script></body></html>"""


def main(project: str) -> int:
    tel_dir = ROOT / "projects" / project / "out" / "telemetry"
    files = sorted(tel_dir.glob("*.json")) if tel_dir.exists() else []
    if not files:
        print(f"telemetry_viewer: no telemetry at {tel_dir}")
        return 1
    data = [json.loads(f.read_text(encoding="utf-8")) for f in files]

    # Inline the current violations so the replay shows judgment next to geometry.
    import io
    from contextlib import redirect_stdout
    from storyboard.telemetry_rules import run as rules_run
    buf = io.StringIO()
    with redirect_stdout(buf):
        rules_run(project, strict=False)
    viol = [ln.strip("• ").strip() for ln in buf.getvalue().splitlines() if ln.strip().startswith("•")]

    html = (PAGE.replace("__PROJECT__", project)
                .replace("__DATA__", json.dumps(data))
                .replace("__VIOL__", json.dumps(viol)))
    out = ROOT / "projects" / project / "out" / "telemetry_viewer.html"
    out.write_text(html, encoding="utf-8")
    print(f"telemetry_viewer: {len(data)} samples, {len(viol)} violations → {out}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
