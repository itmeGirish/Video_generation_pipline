import React, {useEffect, useRef, useState} from 'react';
import {Artifact, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';

// RuntimeProbe — the Rendering Intelligence telemetry tap.
//
// Sits INSIDE the composition, between Chromium layout and Remotion's capture:
// at sampled frames it reads the real layout boxes of every element tagged with
// [data-cast-id] (the telemetry contract — authors tag cast elements with the
// contract's cast ids) and emits the measurements as a render Artifact.
// `onArtifact` in render_master.mjs collects the files; the rules engine
// (storyboard/telemetry_rules.py) verifies them AGAINST THE CONTRACT
// (zone occupancy · corridor clearance · overlap · accumulation · HOME drift ·
// teleport · duplicate-instance).
//
// Design constraints (load-bearing):
//  - LAYOUT-INERT: renders nothing visible; reads only. Frames are unchanged,
//    so render determinism (proof == ship) is preserved.
//  - Two-effect handshake: effect A measures after commit (layout is final) and
//    stores the payload; effect B releases the delayRender handle only AFTER the
//    re-render that mounts the <Artifact> — so capture cannot race the emission.
//  - Scene-local frames: mounted inside the scene component, so `frame` is
//    scene-relative in both the per-scene comps and the master <Series>.
//  - SCENE-SCOPED query: in the master <Series> the active scene AND the
//    premounted NEXT scene are both in the document, so the probe queries only
//    within its own scene root ([data-scene-root="<sceneId>"], set by
//    UniversalScene) — never the whole document (cross-scene contamination).
//  - ACTIVE-WINDOW guard: a premounted scene's local frame is NEGATIVE, and
//    (-5 % 5 === 0) in JS, so without the guard an invisible premounted scene
//    would emit telemetry. Only sample when frame >= 0 (the scene is on stage).
//  - EFFECTIVE opacity: multiplied up the ancestor chain to the scene root, so a
//    dimmed/premount wrapper is reflected (an element inside an opacity:0 group
//    reads as invisible, not op:1).
//  - Sampling: every PROBE_EVERY frames. A DOM read costs microseconds next to a
//    screenshot — negligible on the master. 5-frame cadence is what makes MOTION
//    rules meaningful: at coarser gaps a teleport averages to a plausible sweep
//    speed (telemetry_rules R6).

const PROBE_EVERY = 5; // sample cadence in frames (~0.17s @30fps)

type Sample = {f: number; json: string};

const effectiveOpacity = (el: HTMLElement, root: Element | null): number => {
  let o = 1;
  let n: HTMLElement | null = el;
  while (n) {
    const cs = getComputedStyle(n);
    if (cs.visibility === 'hidden' || cs.display === 'none') return 0;
    const v = parseFloat(cs.opacity || '1');
    if (!Number.isNaN(v)) o *= v;
    if (n === root) break;
    n = n.parentElement;
  }
  return o;
};

export const RuntimeProbe: React.FC<{sceneId: string}> = ({sceneId}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  // active only when on stage (frame >= 0 filters premounted scenes) and on cadence.
  const active = frame >= 0 && frame % PROBE_EVERY === 0;
  const [data, setData] = useState<Sample | null>(null);
  const handleRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    handleRef.current = delayRender(`probe-${sceneId}-f${frame}`);
    const root = document.querySelector(`[data-scene-root="${sceneId}"]`);
    const scope: ParentNode = root ?? document;
    const els = Array.from(scope.querySelectorAll('[data-cast-id]'));
    const items = els.map((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      return {
        id: el.getAttribute('data-cast-id'),
        state: el.getAttribute('data-state') || undefined,
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        op: Number(effectiveOpacity(el as HTMLElement, root).toFixed(3)),
      };
    });
    setData({
      f: frame,
      json: JSON.stringify({scene: sceneId, frame, canvas: {w: width, h: height}, items}),
    });
    // continueRender happens in the second effect, after the Artifact is mounted.
  }, [frame, active, sceneId, width, height]);

  useEffect(() => {
    if (data && data.f === frame && handleRef.current !== null) {
      continueRender(handleRef.current);
      handleRef.current = null;
    }
  }, [data, frame]);

  if (!data || data.f !== frame) return null;
  return (
    <Artifact
      filename={`telemetry/${sceneId}-f${String(frame).padStart(6, '0')}.json`}
      content={data.json}
    />
  );
};
