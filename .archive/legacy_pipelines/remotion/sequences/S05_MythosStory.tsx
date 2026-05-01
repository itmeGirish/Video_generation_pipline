import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
import { deriveSubSequences } from '../utils/audioSync';

const MONO = 'JetBrains Mono, monospace';
const c = {
  bg: '#060A12', card: '#0C1220', cyan: '#00F0FF', purple: '#7C5CFC',
  red: '#FF3B5C', mythos: '#CC0000', green: '#00FF88', amber: '#FFB800',
  white: '#E8F4FF', dimWhite: '#4A5568', gpt: '#10A37F',
};

// ─── SUB A: "DIFFERENTIALLY REDUCED" ───
const DifferentiallyReduced: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const text = 'experimented with efforts to differentially reduce';
  // Slower reveal — 150 frames (5s) to match deliberate narration
  const revealX = interpolate(frame, [20, 170], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Highlight words AFTER reveal completes. Whisper: "differentially reduce" @ frame 348 in S05,
  // but DifferentiallyReduced sub-sequence starts at S05 frame 0, so local frame ~348 (11.5s in)
  const highlightFrame = 330;
  const diffHighlight = interpolate(frame - highlightFrame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const reduceHighlight = interpolate(frame - highlightFrame - 15, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const words = text.split(' ');

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', maxWidth: 1200, overflow: 'hidden' }}>
        {/* Text with redaction bar */}
        <div style={{ fontFamily: MONO, fontSize: 36, color: c.white, lineHeight: 1.6, textAlign: 'center' }}>
          {words.map((word, i) => {
            const isDiff = word === 'differentially';
            const isReduce = word === 'reduce';
            let wordColor = c.white;
            let weight = 400;
            let glow = 'none';

            if (isDiff) {
              wordColor = interpolate(diffHighlight, [0, 1], [0, 1]) > 0.5 ? c.amber : c.white;
              weight = diffHighlight > 0.5 ? 800 : 400;
              glow = diffHighlight > 0.5 ? `0 0 15px ${c.amber}` : 'none';
            }
            if (isReduce) {
              wordColor = reduceHighlight > 0.5 ? c.red : c.white;
              weight = reduceHighlight > 0.5 ? 800 : 400;
              glow = reduceHighlight > 0.5 ? `0 0 15px ${c.red}` : 'none';
            }

            return (
              <span key={i} style={{ color: wordColor, fontWeight: weight, textShadow: glow }}>
                {word}{' '}
              </span>
            );
          })}
        </div>
        {/* Redaction bar: starts covering text, slides RIGHT to reveal */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(90deg, #000, #000 98%, transparent)',
          transform: `translateX(${revealX}%)`,
          pointerEvents: 'none',
        }} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 14, color: c.dimWhite, marginTop: 30,
        opacity: interpolate(frame - 220, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        — Anthropic, April 16, 2026
      </div>
    </div>
  );
};

// ─── SUB B: EXPLOIT PIPELINE ───
const ExploitPipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { icon: '📁', label: 'SOURCE CODE', sub: 'FreeBSD 500K+ files', borderColor: c.cyan, delay: 20 },
    { icon: '🔍', label: 'AUTONOMOUS SCAN', sub: 'Several hours', borderColor: c.amber, delay: 50 },
    { icon: '🚨', label: 'VULN FOUND', sub: 'CVE-2026-4747', borderColor: c.red, delay: 80 },
    { icon: '{ }', label: 'EXPLOIT WRITTEN', sub: 'Root access', borderColor: '#DD0000', delay: 110 },
    { icon: '💀', label: 'SYSTEM COMPROMISED', sub: 'From anywhere', borderColor: c.mythos, delay: 140 },
  ];

  const allVisible = frame > 170;
  const humanLine = spring({ frame: frame - 200, fps, config: { damping: 12 } });

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((step, i) => {
          const scaleIn = spring({ frame: frame - step.delay, fps, config: { damping: 12 } });
          const arrowWidth = i < steps.length - 1
            ? interpolate(spring({ frame: frame - step.delay - 20, fps, config: { damping: 14 } }), [0, 1], [0, 60])
            : 0;

          return (
            <React.Fragment key={i}>
              {/* Box */}
              <div style={{
                width: 220, height: 150, borderRadius: 12,
                backgroundColor: c.card, border: `2px solid ${step.borderColor}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transform: `scale(${scaleIn})`, opacity: scaleIn,
                boxShadow: i >= 3 ? `0 0 20px ${step.borderColor}33` : 'none',
              }}>
                <div style={{ fontSize: 32 }}>{step.icon}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: c.white, marginTop: 8, textAlign: 'center' }}>{step.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: c.dimWhite, marginTop: 4 }}>{step.sub}</div>
              </div>
              {/* Arrow */}
              {i < steps.length - 1 && (
                <div style={{ width: arrowWidth, height: 3, backgroundColor: step.borderColor, position: 'relative', overflow: 'visible' }}>
                  {/* Spark dot */}
                  <div style={{
                    position: 'absolute', top: -3, width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: step.borderColor, boxShadow: `0 0 8px ${step.borderColor}`,
                    left: `${interpolate(frame % 30, [0, 30], [0, 100])}%`,
                  }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* HUMAN INVOLVEMENT: 0% */}
      {allVisible && (
        <div style={{
          fontFamily: MONO, fontSize: 28, color: c.mythos, letterSpacing: 2,
          marginTop: 50, fontWeight: 700,
          opacity: interpolate(Math.sin(frame * 0.15), [-1, 1], [0.4, 1]),
          transform: `translateY(${interpolate(humanLine, [0, 1], [20, 0])}px)`,
        }}>
          HUMAN INVOLVEMENT: 0%
        </div>
      )}
    </div>
  );
};

// ─── SUB C: BROWSER EXPLOIT CHAIN PUZZLE ───
const ExploitChain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pieces = [
    { icon: '🔓', label: 'RENDERER VULN', delay: 0 },
    { icon: '💉', label: 'JIT HEAP SPRAY', delay: 15 },
    { icon: '📦', label: 'SANDBOX ESCAPE', delay: 30 },
    { icon: '👑', label: 'KERNEL ESCALATION', delay: 45 },
  ];

  const snapFrame = 250;
  const snapped = frame > snapFrame;
  const snapProgress = spring({ frame: frame - snapFrame, fps, config: { damping: 10, stiffness: 120 } });
  const gapSize = snapped ? interpolate(snapProgress, [0, 1], [20, 0]) : 20;
  const flashOpacity = frame >= snapFrame && frame < snapFrame + 3 ? 0.05 : 0;

  const labelOpacity = spring({ frame: frame - snapFrame - 20, fps, config: { damping: 12 } });

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Flash */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#fff', opacity: flashOpacity, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', gap: gapSize }}>
        {pieces.map((piece, i) => {
          const activate = spring({ frame: frame - piece.delay * 3, fps, config: { damping: 12 } });
          const isActive = activate > 0.5;

          return (
            <div key={i} style={{
              width: 150, height: 150, borderRadius: 12,
              backgroundColor: isActive ? `${c.mythos}33` : c.card,
              border: `2px solid ${isActive ? c.mythos : c.dimWhite}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              opacity: interpolate(activate, [0, 1], [0.3, 1]),
              transform: `scale(${interpolate(activate, [0, 1], [0.8, 1])})`,
            }}>
              <div style={{ fontSize: 28 }}>{piece.icon}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: c.white, marginTop: 8, textAlign: 'center' }}>
                {piece.label}
              </div>
            </div>
          );
        })}
      </div>

      {snapped && (
        <div style={{
          fontFamily: MONO, fontSize: 22, color: c.mythos, letterSpacing: 3, marginTop: 40,
          opacity: labelOpacity,
        }}>
          4 VULNS → 1 EXPLOIT → ZERO HUMANS
        </div>
      )}
    </div>
  );
};

// ─── SUB D: SANDBOX ESCAPE ───
const SandboxEscape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Orb floating inside sandbox
  const orbX = Math.sin(frame * 0.05) * 30;
  const orbY = Math.cos(frame * 0.07) * 20;

  const escapeFrame = 150;
  const escaped = frame > escapeFrame;
  const connectionGrow = spring({ frame: frame - escapeFrame, fps, config: { damping: 14 } });
  const connectionWidth = interpolate(connectionGrow, [0, 1], [0, 200]);

  const breached = connectionGrow > 0.9;
  const warningIn = spring({ frame: frame - escapeFrame - 50, fps, config: { damping: 12 } });

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {/* Sandbox box */}
        <div style={{
          width: 200, height: 180, borderRadius: 16,
          border: `2px solid ${c.dimWhite}`, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: c.dimWhite, position: 'absolute', top: 8, left: 12 }}>SANDBOX</div>
          {/* Orb */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `radial-gradient(circle, ${c.mythos}, ${c.mythos}88)`,
            boxShadow: `0 0 20px ${c.mythos}66`,
            transform: escaped
              ? `translate(80px, 0px)`
              : `translate(${orbX}px, ${orbY}px)`,
          }} />
          {/* Crack */}
          {escaped && (
            <svg style={{ position: 'absolute', right: -5, top: '30%' }} width="10" height="60" viewBox="0 0 10 60">
              <path d="M5 0 L3 15 L7 25 L2 40 L8 50 L5 60" fill="none" stroke={c.mythos} strokeWidth={2} />
            </svg>
          )}
        </div>

        {/* Connection line */}
        <div style={{
          width: connectionWidth, height: 3,
          background: `linear-gradient(90deg, ${c.mythos}, ${c.red})`,
          boxShadow: `0 0 10px ${c.mythos}66`,
        }} />

        {/* Globe */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          border: `2px solid ${breached ? c.mythos : c.dimWhite}`,
          backgroundColor: breached ? `${c.mythos}11` : 'transparent',
          boxShadow: breached ? `0 0 30px ${c.mythos}33` : 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 36 }}>🌐</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: breached ? c.mythos : c.dimWhite, fontWeight: 700 }}>
            {breached ? 'BREACHED' : 'INTERNET'}
          </div>
        </div>
      </div>

      {/* Warning */}
      <div style={{
        fontFamily: MONO, fontSize: 24, color: c.mythos, letterSpacing: 4, marginTop: 50,
        opacity: warningIn,
        transform: `translateY(${interpolate(warningIn, [0, 1], [20, 0])}px)`,
      }}>
        ⚠ MODEL ESCAPED CONTAINMENT
      </div>
    </div>
  );
};

// ─── SUB E: CYBERGYM GAP ───
const CyberGymGap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bars = [
    { name: 'MYTHOS', score: 83.1, color: c.mythos, delay: 10, icon: '🔒', label: 'RESTRICTED' },
    { name: 'OPUS 4.7', score: 73.1, color: c.purple, delay: 25, icon: '✓', label: 'AVAILABLE' },
    { name: 'GPT-5.4', score: 66.3, color: c.gpt, delay: 40 },
  ];

  // Bracket animation
  const bracketDraw = interpolate(frame - 60, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 28, color: c.white, marginBottom: 40, fontWeight: 700, letterSpacing: 2 }}>
        CyberGym
      </div>
      <div style={{ width: 1000, position: 'relative' }}>
        {bars.map((bar, i) => {
          const p = spring({ frame: frame - bar.delay, fps, config: { damping: 14, stiffness: 80 } });
          const w = interpolate(p, [0, 1], [0, bar.score]);

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, opacity: interpolate(p, [0, 0.1], [0, 1], { extrapolateRight: 'clamp' }) }}>
              <div style={{ width: 130, textAlign: 'right', fontFamily: MONO, fontSize: 18, color: c.dimWhite }}>{bar.name}</div>
              <div style={{ flex: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${w}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${bar.color}B3, ${bar.color})` }} />
              </div>
              <div style={{ width: 80, fontFamily: MONO, fontSize: 22, fontWeight: 700, color: bar.color }}>{bar.score}%</div>
              {(bar as any).icon && (
                <div style={{ fontFamily: MONO, fontSize: 12, color: (bar as any).label === 'RESTRICTED' ? c.mythos : c.green, backgroundColor: (bar as any).label === 'RESTRICTED' ? `${c.mythos}22` : `${c.green}22`, padding: '3px 10px', borderRadius: 4 }}>
                  {(bar as any).icon} {(bar as any).label}
                </div>
              )}
            </div>
          );
        })}

        {/* Bracket between MYTHOS and OPUS */}
        <svg style={{ position: 'absolute', right: -180, top: 5 }} width="160" height="60" viewBox="0 0 160 60">
          <path
            d="M 0 5 L 20 5 L 20 55 L 0 55"
            fill="none" stroke={c.amber} strokeWidth={2}
            strokeDasharray={160}
            strokeDashoffset={interpolate(bracketDraw, [0, 1], [160, 0])}
          />
          <text x="30" y="35" fill={c.amber} fontFamily={MONO} fontSize="13">
            10 pts — intentionally reduced
          </text>
        </svg>
      </div>
    </div>
  );
};

const S05_MARKERS = [
  { name: 'redacted',  phrase: "Here's where" },
  { name: 'pipeline',  phrase: 'FreeBSD source' },
  { name: 'chain',     phrase: 'four browser' },
  { name: 'sandbox',   phrase: 'escaped its sandbox' },
  { name: 'cybergym',  phrase: 'nerfed version' },
];

const S05_COMPONENTS: Record<string, React.FC> = {
  redacted: DifferentiallyReduced, pipeline: ExploitPipeline, chain: ExploitChain,
  sandbox: SandboxEscape, cybergym: CyberGymGap,
};

export const S05_MythosStory: React.FC = () => {
  const subs = deriveSubSequences('s05', S05_MARKERS);
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000' }}>
      {subs.map((s) => {
        const Comp = S05_COMPONENTS[s.name];
        return (
          <Sequence key={s.name} from={s.from} durationInFrames={s.duration}>
            <Comp />
          </Sequence>
        );
      })}
    </div>
  );
};
