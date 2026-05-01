import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';

const C = {
  bg: '#0A1628', blue: '#00ADE4', violet: '#7C5CFF',
  green: '#22C55E', amber: '#F59E0B',
  white: '#E8F4FF', dim: '#4A5568', card: '#111E34',
};
const MONO = 'JetBrains Mono, monospace';
const SANS = 'Inter, sans-serif';

const Background: React.FC = () => (
  <>
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: C.bg,
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,173,228,0.08), transparent 60%)',
    }} />
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.4,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }} />
  </>
);

// ─── PANEL A: Logo grid (0-240 frames) ───
const LogoGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logos = [
    { icon: '🏦', label: 'BANK' },
    { icon: '🚗', label: 'CAR' },
    { icon: '☕', label: 'COFFEE' },
    { icon: '🛍️', label: 'RETAIL' },
  ];
  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Background />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80,
      }}>
        {logos.map((logo, i) => {
          const p = spring({ frame: frame - i * 20, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: `scale(${p}) translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
              opacity: p,
            }}>
              <div style={{ fontSize: 90, marginBottom: 16 }}>{logo.icon}</div>
              <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 700, color: C.white }}>{logo.label}</div>
              <div style={{
                fontFamily: MONO, fontSize: 14, color: C.blue, marginTop: 10,
                opacity: interpolate(spring({ frame: frame - 120 - i * 15, fps }), [0, 1], [0, 1]),
              }}>running on software.</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PANEL B: Pipeline with stall (240-600) ───
const PipelineStall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes = ['Build','Test','Scan','Stage','Approve','Deploy','Verify','Release'];
  // Packet travels then stalls at node 3 (Scan)
  const packetProgress = interpolate(frame, [30, 150], [0, 2.5/8], { extrapolateRight: 'clamp' });
  // After frame 150, packet just wiggles at scan
  const packetX = 100 + packetProgress * 1500 + (frame > 150 ? Math.sin(frame * 0.3) * 8 : 0);
  const showWarning = frame > 180;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Background />
      <div style={{ position: 'absolute', top: 200, left: 100, right: 100 }}>
        <div style={{ fontFamily: MONO, fontSize: 20, color: C.blue, marginBottom: 20 }}>
          commit a3f9b21 → PRODUCTION
        </div>
        <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'center' }}>
          {/* Track */}
          <div style={{ position: 'absolute', left: 80, right: 80, height: 3, backgroundColor: C.dim, top: '50%' }} />
          {/* Commit source */}
          <div style={{
            position: 'absolute', left: 0, width: 80, height: 80, borderRadius: 8,
            backgroundColor: C.card, border: `2px solid ${C.blue}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: MONO, fontSize: 12, color: C.blue, fontWeight: 700,
          }}>
            git ✓
          </div>
          {/* Nodes */}
          {nodes.map((name, i) => {
            const nodeIn = spring({ frame: frame - 30 - i * 4, fps, config: { damping: 14 } });
            const x = 120 + (i * 1500 / 8);
            const isStalled = i === 2 && frame > 150;
            return (
              <div key={i} style={{
                position: 'absolute', left: x, top: '50%', transform: `translate(-50%, -50%) scale(${nodeIn})`,
                width: 90, height: 50, borderRadius: 6,
                backgroundColor: isStalled ? `${C.amber}22` : C.card,
                border: `1px solid ${isStalled ? C.amber : C.blue}88`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontSize: 11, color: isStalled ? C.amber : C.white, fontWeight: 600,
              }}>
                {name}
              </div>
            );
          })}
          {/* Production globe */}
          <div style={{
            position: 'absolute', right: 0, width: 80, height: 80, borderRadius: '50%',
            backgroundColor: C.card, border: `2px solid ${C.green}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
          }}>
            🌐
          </div>
          {/* Packet */}
          <div style={{
            position: 'absolute', top: '50%', left: packetX, transform: 'translate(-50%, -50%)',
            width: 18, height: 18, borderRadius: '50%', backgroundColor: C.blue,
            boxShadow: `0 0 20px ${C.blue}`,
          }} />
          {/* Warning */}
          {showWarning && (
            <div style={{
              position: 'absolute', left: packetX, top: -20, transform: 'translate(-50%, 0)',
              fontSize: 32,
              animation: 'bounce 0.6s infinite',
            }}>⚠️</div>
          )}
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 18, color: C.amber, textAlign: 'center', marginTop: 30,
          opacity: interpolate(frame - 200, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          Stalled at Scan. Multiply by dozens of pipelines.
        </div>
      </div>
    </div>
  );
};

// ─── PANEL C: Tool sprawl (600-1050) ───
const ToolSprawl: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tools = ['Jenkins','ArgoCD','SonarQube','Jira','Splunk','Datadog','Bamboo','CircleCI','GitLab CI','Artifactory','PagerDuty','Terraform'];
  const toolsCount = interpolate(frame, [0, 120], [0, 147], { extrapolateRight: 'clamp' });
  const pctCount = interpolate(frame, [60, 180], [0, 62], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Background />
      {/* Swirling tool logos */}
      {tools.map((tool, i) => {
        const angle = (i / tools.length) * Math.PI * 2 + frame * 0.008;
        const radius = 280 + Math.sin(i * 1.3) * 60;
        const cx = 960 + Math.cos(angle) * radius;
        const cy = 540 + Math.sin(angle) * radius;
        const p = spring({ frame: frame - i * 6, fps, config: { damping: 12 } });
        return (
          <div key={i} style={{
            position: 'absolute', left: cx - 50, top: cy - 18,
            padding: '8px 16px', borderRadius: 20, backgroundColor: C.card,
            border: `1px solid ${C.dim}`, fontFamily: MONO, fontSize: 13,
            color: C.dim, transform: `scale(${p})`, opacity: p,
          }}>{tool}</div>
        );
      })}
      {/* Center stats */}
      <div style={{
        position: 'absolute', top: 480, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: SANS, fontSize: 140, fontWeight: 800, color: C.amber, lineHeight: 1 }}>
          {Math.floor(toolsCount)}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 18, color: C.white, letterSpacing: 4, marginTop: 8 }}>
          TOOLS IN THE AVERAGE ENTERPRISE
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 28, fontWeight: 700, color: C.violet, marginTop: 30,
          opacity: interpolate(frame - 60, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          {Math.floor(pctCount)}% of engineer time → not writing code.
        </div>
      </div>
    </div>
  );
};

// ─── PANEL D: Harness wordmark (1050-end) ───
const HarnessReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wordScale = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 } });
  const taglineChars = Math.min(Math.floor((frame - 90) * 1.5), 34);
  const tagline = 'Rewriting the pipeline — with AI.';

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Background />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: SANS, fontSize: 180, fontWeight: 900, color: C.blue,
          letterSpacing: -4, transform: `scale(${interpolate(wordScale, [0, 1], [0.8, 1])})`,
          textShadow: `0 0 60px ${C.blue}66`, opacity: wordScale,
        }}>
          HARNESS
        </div>
        <div style={{
          fontFamily: MONO, fontSize: 24, color: C.violet, marginTop: 30, letterSpacing: 2,
          whiteSpace: 'pre',
        }}>
          {tagline.substring(0, Math.max(0, taglineChars))}
        </div>
      </div>
    </div>
  );
};

export const H01_DeliveryProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const KEY = 'h01';
  // Word-triggered transitions
  const pipelineStart = findWordFrame(KEY, 'A single change', 240);
  const toolsStart = findWordFrame(KEY, 'typical enterprise', 720);
  const harnessStart = findWordFrame(KEY, 'Its name is Harness', 1200);
  const total = getSceneDurationFrames(KEY);

  if (frame < pipelineStart) return <LogoGrid />;
  if (frame < toolsStart) return <PipelineStall />;
  if (frame < harnessStart) return <ToolSprawl />;
  return <HarnessReveal />;
};
