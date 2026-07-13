import React from 'react';
import { Sequence, useVideoConfig } from 'remotion';
import { Backdrop } from './Backdrop';
import { DynamicBlock } from './DynamicBlock';
import { RuntimeProbe } from './RuntimeProbe';
import type { WordTimestamp } from '../types';

// Visual block from the structured script via visual_designer.
// Each block is an LLM-emitted React.createElement function body that the
// DynamicBlock component compiles + invokes at runtime. There is no fixed
// primitive registry — primitives are derived per-bullet from the
// structured script's animation body.
export type VisualBlock = {
  framesFrom: number;
  framesTo: number;
  code: string;            // LLM-emitted function body returning a React element
  audio_anchor?: string;
  source_headline?: string;
  role?: string;           // 'stage' = the scene's PERSISTENT WORLD (see below)
};

type SceneProps = { blocks: VisualBlock[]; captions?: WordTimestamp[]; sceneId?: string };

// SCENE-DRIVEN contract (supersedes the old slot-based contract):
//
// STAGE layer — a block with role:'stage' is the scene's PERSISTENT WORLD: the composite
// (zones, cast at settled states, atmosphere) plus the scene's RUNNING MECHANISMS
// (`cycle` processes). It renders OUTSIDE any <Sequence>, so its `frame` is SCENE-LOCAL
// (0 → scene end): the world persists across every beat and a mechanism loop NEVER
// resets phase at a bullet boundary. Painted first = always behind the beat layers.
//
// BEAT layer — every other block is a MODULATION of the stage (the beat's delta/payoff:
// spotlight a station, change a rate, land a verdict). Each runs in its exclusive
// <Sequence> window framesFrom → framesTo (frame restarts at 0 per beat — correct for
// entrance timing). Beat code renders ONLY its delta; the stage carries the world.
//
// Back-compat: a scene with NO stage block renders exactly as before (each block
// self-contained in its slot).
export const UniversalScene: React.FC<SceneProps> = ({ blocks, captions, sceneId }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const captionsArr = captions ?? [];
  const stageBlocks = blocks.filter((b) => b.role === 'stage');
  const beatBlocks = blocks.filter((b) => b.role !== 'stage');
  return (
    <>
      <Backdrop />
      {/* Rendering Intelligence telemetry tap — layout-inert, emits [data-cast-id]
          boxes as Artifacts at sampled scene-local frames (collected by onArtifact
          in the render scripts; verified by storyboard/telemetry_rules.py). It
          queries ONLY within the [data-scene-root] wrapper below, so in the master
          <Series> it never captures a premounted adjacent scene's elements. */}
      {sceneId ? <RuntimeProbe sceneId={sceneId} /> : null}
      {/* SCENE ROOT — layout-neutral full-canvas container (absolute inset:0, so
          absolutely-positioned children keep the same (0,0,W,H) reference box and
          pixels are unchanged) that scopes the probe's [data-cast-id] query to THIS
          scene. Identical in the per-scene comps and the master, so proof==ship holds. */}
      <div
        data-scene-root={sceneId ?? 'scene'}
        style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
      >
        {stageBlocks.map((b, i) => (
          <DynamicBlock
            key={`stage-${i}`}
            code={b.code}
            captions={captionsArr}
            blockFramesFrom={0}
          />
        ))}
        {beatBlocks.map((b, i) => {
          const seqDur = b.framesTo - b.framesFrom;
          if (seqDur <= 0) return null;
          return (
            <Sequence
              key={i}
              from={b.framesFrom}
              durationInFrames={seqDur}
              premountFor={fps}
            >
              <DynamicBlock
                code={b.code}
                captions={captionsArr}
                blockFramesFrom={b.framesFrom}
              />
            </Sequence>
          );
        })}
      </div>
    </>
  );
};
