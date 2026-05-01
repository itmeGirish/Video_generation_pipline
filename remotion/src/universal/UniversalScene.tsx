import React from 'react';
import { Sequence, useVideoConfig } from 'remotion';
import { Backdrop } from './Backdrop';
import { DynamicBlock } from './DynamicBlock';

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

type SceneProps = { blocks: VisualBlock[] };

export const UniversalScene: React.FC<SceneProps> = ({ blocks }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      <Backdrop />
      {blocks.map((b, i) => {
        const dur = b.framesTo - b.framesFrom;
        if (dur <= 0) return null;
        return (
          <Sequence
            key={i}
            from={b.framesFrom}
            durationInFrames={dur}
            premountFor={fps}
          >
            <DynamicBlock code={b.code} />
          </Sequence>
        );
      })}
    </>
  );
};
