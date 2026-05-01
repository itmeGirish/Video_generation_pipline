import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';

const C = {
  bg: '#0A1628', blue: '#00ADE4', violet: '#7C5CFF',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444',
  white: '#E8F4FF', dim: '#4A5568', card: '#111E34',
};
const MONO = 'JetBrains Mono, monospace';
const SANS = 'Inter, sans-serif';

const Background: React.FC = () => (
  <>
    <div style={{ position: 'absolute', inset: 0, backgroundColor: C.bg }} />
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.3,
      backgroundImage: 'radial-gradient(circle, rgba(124,92,255,0.12) 1px, transparent 1px)',
      backgroundSize: '50px 50px',
    }} />
  </>
);

const AGENTS = [
  { name: 'DevOps Agent',  icon: '🔧', phrase: 'DevOps Agent' },
  { name: 'SRE Agent',     icon: '🚨', phrase: 'SRE Agent' },
  { name: 'AppSec Agent',  icon: '🛡️', phrase: 'AppSec Agent' },
  { name: 'Test Agent',    icon: '✅', phrase: 'Test Agent' },
  { name: 'FinOps Agent',  icon: '💰', phrase: 'FinOps Agent' },
];

// ─── Agent detail mini visualizations ───
const DevOpsDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const yaml = 'pipeline:\n  stages:\n    - build\n    - test\n    - deploy';
  const chars = Math.floor(frame * 1);
  return (
    <div style={{ fontFamily: MONO, fontSize: 12, color: C.green, whiteSpace: 'pre', textAlign: 'left' }}>
      {yaml.substring(0, chars)}
    </div>
  );
};

const SREDetail: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: 'relative', width: 120, height: 40 }}>
      <svg width={120} height={40}>
        <path d="M 0 20 L 30 18 L 50 35 L 80 15 L 120 12"
          fill="none" stroke={C.amber} strokeWidth={2} strokeDasharray={Math.max(0, 200 - frame * 3)} />
      </svg>
      {frame > 30 && <div style={{ fontFamily: MONO, fontSize: 10, color: C.green, backgroundColor: `${C.green}22`, padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>rolled back ✓</div>}
    </div>
  );
};

const AppSecDetail: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', width: 140 }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const isDup = i >= 3;
        const collapsing = frame > 20;
        const dim = isDup && collapsing;
        return (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: dim ? C.dim : (isDup ? C.red : C.red),
            opacity: dim ? 0.2 : 1,
            transform: dim ? 'scale(0.6)' : 'scale(1)',
          }} />
        );
      })}
    </div>
  );
};

const TestDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const show = frame > 10;
  return (
    <div style={{ textAlign: 'center' }}>
      {show && <div style={{ fontFamily: MONO, fontSize: 10, color: C.blue, marginBottom: 4 }}>"test login flow"</div>}
      {frame > 30 && <div style={{ fontFamily: MONO, fontSize: 12, color: C.green }}>login.test.ts ✓</div>}
    </div>
  );
};

const FinOpsDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const start = 12400;
  const end = 8150;
  const val = interpolate(frame, [0, 40], [start, end], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ fontFamily: MONO, fontSize: 14, color: C.green, fontWeight: 700 }}>
      ${Math.floor(val).toLocaleString()}
    </div>
  );
};

const AGENT_DETAILS: Record<string, React.FC> = {
  'DevOps Agent': DevOpsDetail, 'SRE Agent': SREDetail, 'AppSec Agent': AppSecDetail,
  'Test Agent': TestDetail, 'FinOps Agent': FinOpsDetail,
};

// ─── Knowledge graph substrate ───
const KnowledgeGraph: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  const nodes = [
    { x: 200, y: 100, label: 'builds' },
    { x: 350, y: 200, label: 'tests' },
    { x: 500, y: 80, label: 'deploys' },
    { x: 650, y: 220, label: 'incidents' },
    { x: 800, y: 120, label: 'cloud spend' },
    { x: 900, y: 250, label: 'commits' },
    { x: 1050, y: 100, label: 'alerts' },
    { x: 1200, y: 180, label: 'runs' },
    { x: 1350, y: 90, label: 'scans' },
    { x: 1500, y: 200, label: 'configs' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 300,
      opacity, pointerEvents: 'none',
    }}>
      <svg width={1920} height={300}>
        {nodes.map((n, i) =>
          nodes.slice(i + 1, i + 3).map((m, j) => (
            <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y}
              stroke={C.violet} strokeWidth={1} opacity={0.3} />
          ))
        )}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={5 + Math.sin(frame * 0.1 + i) * 1}
              fill={C.violet} opacity={0.8} />
            <text x={n.x} y={n.y + 22} fill={C.dim} fontFamily={MONO} fontSize={10}
              textAnchor="middle">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export const H03_AIAgents: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'h03';
  const total = getSceneDurationFrames(KEY);

  // Agent appearances — when narrator introduces each
  const agentStarts = AGENTS.map((a) => findWordFrame(KEY, a.phrase, 200));
  const knowledgeStart = findWordFrame(KEY, 'knowledge graph', total - 400);

  const centerX = 960;
  const centerY = 440;
  const ringRadius = 280;

  // Slow ring rotation
  const rotation = (frame / 300) * Math.PI * 2;

  // Orb pulse
  const pulse = 1 + Math.sin(frame * 0.1) * 0.05;

  // Everyone pulses together once at knowledge moment
  const graphOpacity = interpolate(frame - knowledgeStart, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Background />

      {/* AGENTS label above */}
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center',
        fontFamily: MONO, fontSize: 22, color: C.dim, letterSpacing: 8,
      }}>
        AGENTS
      </div>

      {/* Central orb */}
      <div style={{
        position: 'absolute', left: centerX - 80, top: centerY - 80,
        width: 160, height: 160, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.violet}, ${C.violet}44)`,
        boxShadow: `0 0 60px ${C.violet}aa`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${pulse})`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 900, color: C.white }}>HARNESS</div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, letterSpacing: 2 }}>AI</div>
        </div>
      </div>

      {/* Agent avatars in orbital ring */}
      {AGENTS.map((agent, i) => {
        const angle = rotation + (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * ringRadius;
        const y = centerY + Math.sin(angle) * ringRadius;
        const counterRot = -angle - Math.PI / 2;

        const enterSpring = spring({ frame: frame - agentStarts[i], fps, config: { damping: 12 } });
        if (frame < agentStarts[i]) return null;

        const Detail = AGENT_DETAILS[agent.name];

        return (
          <React.Fragment key={i}>
            {/* Connector line */}
            <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} width={1920} height={1080}>
              <line x1={centerX} y1={centerY} x2={x} y2={y}
                stroke={C.violet} strokeWidth={1} opacity={0.3 * enterSpring} strokeDasharray={4} />
            </svg>

            {/* Hex tile */}
            <div style={{
              position: 'absolute', left: x - 100, top: y - 70,
              width: 200, height: 140, borderRadius: 16,
              backgroundColor: C.card, border: `2px solid ${C.violet}`,
              boxShadow: `0 0 20px ${C.violet}44`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${enterSpring}) rotate(${counterRot}rad)`,
              opacity: enterSpring,
              padding: 12, gap: 6,
            }}>
              <div style={{ fontSize: 28 }}>{agent.icon}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: C.white, textAlign: 'center' }}>
                {agent.name}
              </div>
              <div style={{ minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Detail && <Detail />}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Knowledge graph substrate */}
      <KnowledgeGraph opacity={graphOpacity} />

      {/* Knowledge label */}
      {graphOpacity > 0.5 && (
        <div style={{
          position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
          fontFamily: MONO, fontSize: 18, color: C.violet, opacity: interpolate(graphOpacity, [0.5, 1], [0, 1]),
          letterSpacing: 2,
        }}>
          DevOps Knowledge Graph — the memory behind every agent.
        </div>
      )}
    </div>
  );
};
