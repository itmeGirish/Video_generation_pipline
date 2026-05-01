import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';
import { ModelOrb, Bg } from './HE01_HorseNoHarness';

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

const COMPONENTS = [
  { icon: '🔁', label: 'Loop',       sub: 'the agent loop',           phrase: 'loop that calls' },
  { icon: '🔧', label: 'Tools',      sub: 'read, write, run, search', phrase: 'tools the model' },
  { icon: '🧠', label: 'Memory',     sub: 'AGENTS.md + history',       phrase: 'memory that lets' },
  { icon: '📦', label: 'Sandbox',    sub: 'safe execution',            phrase: 'sandbox that contains' },
  { icon: '🛡️', label: 'Guardrails', sub: 'allowed commands only',     phrase: 'guardrails that stop' },
  { icon: '📡', label: 'Feedback',   sub: 'signals back to the model', phrase: 'feedback signals' },
];

const PRODUCTS = ['Claude Code', 'Cursor', 'OpenAI Codex', 'Deep Agents', 'OpenCode', 'Aider'];

export const HE02_AgentFormula: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'he02';
  const total = getSceneDurationFrames(KEY);

  // Phases
  const formulaSpring = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const compressStart = findWordFrame(KEY, 'An agent equals', 160);
  const assembleStart = findWordFrame(KEY, 'loop that calls', 300);
  const productsStart = findWordFrame(KEY, 'Claude Code is a harness', total - 300);

  // Formula position: center → top
  const compressed = frame > compressStart;
  const compressP = compressed ? spring({ frame: frame - compressStart, fps, config: { damping: 16 } }) : 0;
  const formulaScale = interpolate(compressP, [0, 1], [1, 0.4]);
  const formulaY = interpolate(compressP, [0, 1], [0, -420]);

  const centerX = 960;
  const centerY = compressed ? 580 : 540;

  // Ring of 6 components
  const ringRadius = 280;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Formula */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '50%',
        transform: `translateY(calc(-50% + ${formulaY}px)) scale(${formulaScale})`,
        textAlign: 'center',
        opacity: formulaSpring,
        fontFamily: INTER, fontSize: 96, fontWeight: 900, letterSpacing: 2,
      }}>
        <span style={{ color: C.white }}>AGENT </span>
        <span style={{ color: C.white }}>= </span>
        <span style={{ color: C.amber, textShadow: `0 0 40px ${C.amber}66` }}>MODEL </span>
        <span style={{ color: C.white }}>+ </span>
        <span style={{ color: C.cyan, textShadow: `0 0 40px ${C.cyan}66` }}>HARNESS</span>
      </div>

      {/* Orb + ring (after compression) */}
      {compressed && (
        <>
          <ModelOrb x={centerX} y={centerY} size={140} />

          {/* 6 harness components in ring */}
          {COMPONENTS.map((comp, i) => {
            const angle = (i / COMPONENTS.length) * Math.PI * 2 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;

            const appearFrame = findWordFrame(KEY, comp.phrase, assembleStart + i * 40);
            const p = spring({ frame: frame - appearFrame, fps, config: { damping: 14 } });
            if (frame < appearFrame) return null;

            return (
              <React.Fragment key={i}>
                {/* Connector */}
                <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={1920} height={1080}>
                  <line x1={centerX} y1={centerY} x2={x} y2={y}
                    stroke={C.cyan} strokeWidth={1.5} opacity={p * 0.6} strokeDasharray={4} />
                </svg>

                {/* Tile */}
                <div style={{
                  position: 'absolute', left: x - 110, top: y - 50,
                  width: 220, height: 100, borderRadius: 14,
                  backgroundColor: C.card, border: `1.5px solid ${C.cyan}`,
                  boxShadow: `0 0 15px ${C.cyan}33`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transform: `scale(${p})`, opacity: p,
                  padding: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 24 }}>{comp.icon}</div>
                    <div style={{ fontFamily: INTER, fontSize: 16, fontWeight: 800, color: C.white }}>
                      {comp.label}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: MONO, fontSize: 11, color: C.dim, marginTop: 4, textAlign: 'center',
                  }}>
                    {comp.sub}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* Product logos (bottom phase) */}
      {frame >= productsStart && (
        <div style={{
          position: 'absolute', bottom: 60, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap',
          opacity: interpolate(frame - productsStart, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          {PRODUCTS.map((p, i) => {
            const s = spring({ frame: frame - productsStart - i * 6, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{
                padding: '10px 22px',
                fontFamily: INTER, fontSize: 16, fontWeight: 700, color: C.cyan,
                backgroundColor: C.card, border: `1px solid ${C.cyan}`, borderRadius: 8,
                transform: `scale(${s})`, opacity: s,
              }}>
                {p}
              </div>
            );
          })}
        </div>
      )}

      {frame >= productsStart + 100 && (
        <div style={{
          position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center',
          fontFamily: INTER, fontSize: 16, color: C.dim, letterSpacing: 1,
          opacity: interpolate(frame - productsStart - 100, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          Every one of these is a harness. They all point at different models.
        </div>
      )}
    </div>
  );
};
