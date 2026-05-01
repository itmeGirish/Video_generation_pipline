import React, { createContext, useContext } from 'react';
import { useCurrentFrame } from 'remotion';
import { TIMELINES, Phase as PhaseType } from './timelines';

interface PhaseContextValue {
  phase: PhaseType;
  sceneFrame: number;
  sceneDurationFrames: number;
}

const PhaseContext = createContext<PhaseContextValue | null>(null);

/**
 * <Scene> routes the current frame into the correct <Phase> child.
 *
 * Envelope crossfade:
 *   If the frame is within `enterFrames` of a phase boundary, BOTH the outgoing
 *   and incoming phase are rendered simultaneously with opacity interpolation.
 *   This eliminates hard cuts — visual transitions are automatic and uniform.
 *
 * Structural guarantees:
 *   - Every frame is covered (validator enforces contiguous phases)
 *   - If a declared phase has no matching <Phase id=> child → throw at mount
 *   - No silent skips; no blank gaps
 */
export const Scene: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const sceneFrame = useCurrentFrame();
  const timeline = TIMELINES[id];

  if (!timeline) {
    throw new Error(
      `[Scene] No timeline for id="${id}". Did you run \`python storyboard/compile.py ${id}\`?`,
    );
  }

  const phases = timeline.phases;

  // Locate current phase (the one whose [fromFrame, toFrame) contains sceneFrame)
  let currentIdx = phases.findIndex(
    (p) => sceneFrame >= p.fromFrame && sceneFrame < p.toFrame,
  );
  if (currentIdx === -1) {
    // Last-frame inclusive fallback
    if (phases.length && sceneFrame === phases[phases.length - 1].toFrame) {
      currentIdx = phases.length - 1;
    } else {
      return null;
    }
  }

  const current = phases[currentIdx];
  const prev = currentIdx > 0 ? phases[currentIdx - 1] : null;
  const next = currentIdx < phases.length - 1 ? phases[currentIdx + 1] : null;

  // ═════════════════════════════════════════════════════════════════════
  // Transition resolution — each phase declares how it enters:
  //   - crossfade (default): overlap opacity envelope with predecessor
  //   - hard_cut:  no overlap — predecessor instantly cleared at boundary
  //   - blackout:  predecessor fades to black (first half of window),
  //                then current fades in from black (second half).
  //   - slide:     predecessor slides off-screen left while next phase slides
  //                in from the right (push-style). NO opacity blend, NO dark
  //                frame. Best for phases with very different layouts.
  // ═════════════════════════════════════════════════════════════════════

  // easeInOutCubic for natural slide motion
  const easeInOut = (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const currentTransition = current.transitionIn ?? 'crossfade';
  const nextTransition = next?.transitionIn ?? 'crossfade';

  const inEnterWindow = prev && sceneFrame < current.fromFrame + current.enterFrames;
  const enterRaw = inEnterWindow
    ? (sceneFrame - current.fromFrame) / current.enterFrames
    : 1;

  const inExitWindow = next && sceneFrame >= current.toFrame - current.exitFrames;
  const exitRaw = inExitWindow
    ? (current.toFrame - sceneFrame) / current.exitFrames
    : 1;

  // Per-layer opacity AND translateX (% of width). 0 = on-screen.
  let prevOpacity = 0, prevTranslateX = 0;
  let currentOpacity = 1, currentTranslateX = 0;
  let nextOpacity = 0, nextTranslateX = 0;
  let blackoutOpacity = 0;

  if (inEnterWindow && prev) {
    switch (currentTransition) {
      case 'crossfade':
        prevOpacity = 1 - enterRaw;
        currentOpacity = enterRaw;
        break;
      case 'hard_cut':
        prevOpacity = 0;
        currentOpacity = 1;
        break;
      case 'blackout':
        if (enterRaw < 0.5) {
          prevOpacity = 1 - enterRaw * 2;
          currentOpacity = 0;
          blackoutOpacity = enterRaw * 2;
        } else {
          prevOpacity = 0;
          currentOpacity = (enterRaw - 0.5) * 2;
          blackoutOpacity = 1 - (enterRaw - 0.5) * 2;
        }
        break;
      case 'slide': {
        // Both phases at full opacity; eased translate
        const t = easeInOut(enterRaw);
        prevOpacity = 1;
        prevTranslateX = -100 * t;       // 0% → -100% (slides off to left)
        currentOpacity = 1;
        currentTranslateX = 100 * (1 - t); // +100% → 0% (slides in from right)
        break;
      }
    }
  } else if (inExitWindow && next) {
    switch (nextTransition) {
      case 'crossfade':
        currentOpacity = exitRaw;
        nextOpacity = 1 - exitRaw;
        break;
      case 'hard_cut':
        currentOpacity = 1;
        nextOpacity = 0;
        break;
      case 'blackout':
        if (exitRaw > 0.5) {
          currentOpacity = (exitRaw - 0.5) * 2;
          nextOpacity = 0;
          blackoutOpacity = 1 - (exitRaw - 0.5) * 2;
        } else {
          currentOpacity = 0;
          nextOpacity = 1 - exitRaw * 2;
          blackoutOpacity = exitRaw * 2;
        }
        break;
      case 'slide': {
        // Symmetric to enter — current slides off left, next slides in from right
        const t = easeInOut(1 - exitRaw); // 0 at start of exit window, 1 at end
        currentOpacity = 1;
        currentTranslateX = -100 * t;
        nextOpacity = 1;
        nextTranslateX = 100 * (1 - t);
        break;
      }
    }
  }

  return (
    <>
      {(prevOpacity > 0 || prevTranslateX !== 0) && prev && (
        <PhaseLayer
          phase={prev}
          sceneFrame={sceneFrame}
          sceneDurationFrames={timeline.durationFrames}
          opacity={prevOpacity}
          translateX={prevTranslateX}
        >
          {children}
        </PhaseLayer>
      )}

      <PhaseLayer
        phase={current}
        sceneFrame={sceneFrame}
        sceneDurationFrames={timeline.durationFrames}
        opacity={currentOpacity}
        translateX={currentTranslateX}
      >
        {children}
      </PhaseLayer>

      {(nextOpacity > 0 || nextTranslateX !== 0) && next && (
        <PhaseLayer
          phase={next}
          sceneFrame={sceneFrame}
          sceneDurationFrames={timeline.durationFrames}
          opacity={nextOpacity}
          translateX={nextTranslateX}
        >
          {children}
        </PhaseLayer>
      )}

      {blackoutOpacity > 0 && (
        <div
          style={{
            position: 'absolute', inset: 0, backgroundColor: '#000',
            opacity: blackoutOpacity, zIndex: 999, pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

const PhaseLayer: React.FC<{
  phase: PhaseType;
  sceneFrame: number;
  sceneDurationFrames: number;
  opacity: number;
  translateX?: number;
  children: React.ReactNode;
}> = ({ phase, sceneFrame, sceneDurationFrames, opacity, translateX = 0, children }) => {
  const matching = React.Children.toArray(children).find((child) => {
    if (!React.isValidElement(child)) return false;
    return (child.props as { id?: string })?.id === phase.id;
  }) as React.ReactElement | undefined;

  if (!matching) {
    throw new Error(
      `[Scene] Timeline declares phase "${phase.id}" but no <Phase id="${phase.id}"> ` +
        `child exists. Add one or remove the phase from the YAML.`,
    );
  }

  return (
    <PhaseContext.Provider value={{ phase, sceneFrame, sceneDurationFrames }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity,
          transform: translateX !== 0 ? `translateX(${translateX}%)` : undefined,
          willChange: translateX !== 0 ? 'transform' : undefined,
          pointerEvents: opacity === 0 ? 'none' : undefined,
        }}
      >
        {matching}
      </div>
    </PhaseContext.Provider>
  );
};

/** Declarative phase marker. */
export const Phase: React.FC<{ id: string; children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

/**
 * Hook returning phase-relative timing info.
 *
 * `progress` ∈ [0, 1] across the phase duration — preferred animation driver
 * over raw frame numbers. Components built with `progress` automatically
 * stretch or compress to fit whatever duration the phase gives them,
 * eliminating "animation finished early, now static" bugs.
 */
export function usePhase() {
  const ctx = useContext(PhaseContext);
  if (!ctx) {
    throw new Error('usePhase() must be called inside a <Phase> rendered by a <Scene>.');
  }
  const { phase, sceneFrame, sceneDurationFrames } = ctx;
  const duration = phase.toFrame - phase.fromFrame;
  const phaseFrame = sceneFrame - phase.fromFrame;
  return {
    phaseId: phase.id,
    phaseFrame,
    phaseDuration: duration,
    progress: Math.max(0, Math.min(1, phaseFrame / duration)),
    sceneFrame,
    sceneDurationFrames,
  };
}
