import React from 'react';
import { Sequence, useVideoConfig } from 'remotion';
import { Backdrop } from './Backdrop';
import { DynamicBlock } from './DynamicBlock';
import type { WordTimestamp } from '../components/VideoCaptions';

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
};

type SceneProps = { blocks: VisualBlock[]; captions?: WordTimestamp[] };

// SLOT-BASED contract:
// Each block's <Sequence> runs for exactly its assigned time slot: framesFrom → framesTo.
// framesTo is set by build_video.py as the next bullet's framesFrom (or scene end for
// the last bullet). This guarantees zero overlap between bullets — each bullet occupies
// its own exclusive window. The authored code is responsible for rendering the full
// visual state needed during its slot.
export const UniversalScene: React.FC<SceneProps> = ({ blocks, captions }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const captionsArr = captions ?? [];
  return (
    <>
      <Backdrop />
      {blocks.map((b, i) => {
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
    </>
  );
};
