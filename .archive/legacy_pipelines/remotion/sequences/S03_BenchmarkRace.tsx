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
  white: '#E8F4FF', dimWhite: '#4A5568', gpt: '#10A37F', gemini: '#4285F4',
};

const Bar: React.FC<{
  name: string; score: number; color: string;
  leader?: boolean; loss?: boolean; delay: number;
}> = ({ name, score, color, leader, loss, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 80 } });
  const w = interpolate(p, [0, 1], [0, score]);
  const barColor = loss ? c.amber : color;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, opacity: interpolate(p, [0, 0.1], [0, 1], { extrapolateRight: 'clamp' }) }}>
      <div style={{ width: 130, textAlign: 'right', fontFamily: MONO, fontSize: 18, color: c.dimWhite, flexShrink: 0 }}>{name}</div>
      <div style={{ flex: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${barColor}B3, ${barColor})`, boxShadow: leader ? `0 0 20px ${barColor}66` : 'none' }} />
      </div>
      <div style={{ width: 90, fontFamily: MONO, fontSize: 22, fontWeight: leader ? 800 : 400, color: leader ? color : c.white, flexShrink: 0 }}>
        {leader && '★ '}{loss && '⚠ '}{score.toFixed(1)}%
      </div>
    </div>
  );
};

const BenchGroup: React.FC<{ title: string; headerBadge?: string; headerBadgeColor?: string; children: React.ReactNode }> = ({ title, headerBadge, headerBadgeColor, children }) => (
  <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
      <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: c.white, letterSpacing: 2 }}>{title}</div>
      {headerBadge && <div style={{ fontFamily: MONO, fontSize: 14, color: headerBadgeColor || c.amber, backgroundColor: `${headerBadgeColor || c.amber}22`, padding: '4px 12px', borderRadius: 6, fontWeight: 700 }}>{headerBadge}</div>}
    </div>
    <div style={{ width: 1000 }}>{children}</div>
  </div>
);

const Group1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgeScale = spring({ frame: frame - 50, fps, config: { damping: 10 } });
  return (
    <BenchGroup title="SWE-bench Verified">
      <Bar name="Opus 4.7" score={87.6} color={c.purple} leader delay={10} />
      <Bar name="Gemini 3.1" score={80.6} color={c.gemini} delay={20} />
      <Bar name="GPT-5.4" score={80.0} color={c.gpt} delay={30} />
      <div style={{ fontFamily: MONO, fontSize: 16, color: c.green, marginTop: 16, backgroundColor: `${c.green}15`, padding: '6px 14px', borderRadius: 8, display: 'inline-block', transform: `scale(${badgeScale})` }}>+6.8 from 4.6</div>
    </BenchGroup>
  );
};

const Group2: React.FC = () => (
  <BenchGroup title="SWE-bench Pro">
    <Bar name="Opus 4.7" score={64.3} color={c.purple} leader delay={10} />
    <Bar name="GPT-5.4" score={57.7} color={c.gpt} delay={20} />
    <Bar name="Gemini 3.1" score={54.2} color={c.gemini} delay={30} />
  </BenchGroup>
);

const Group3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase1 = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const phase1Width = interpolate(phase1, [0, 1], [0, 58]);
  const snapStart = 35;
  const phase2 = spring({ frame: frame - snapStart, fps, config: { damping: 8, stiffness: 200 } });
  const finalWidth = frame > snapStart ? interpolate(phase2, [0, 1], [58, 70]) : phase1Width;
  const badgePop = spring({ frame: frame - snapStart - 5, fps, config: { damping: 8, stiffness: 150 } });
  const flashOpacity = frame >= snapStart && frame < snapStart + 3 ? 0.05 : 0;
  return (
    <BenchGroup title="CursorBench">
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#fff', opacity: flashOpacity, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <div style={{ width: 130, textAlign: 'right', fontFamily: MONO, fontSize: 18, color: c.dimWhite }}>Opus 4.7</div>
        <div style={{ flex: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: `${finalWidth}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${c.purple}B3, ${c.purple})`, boxShadow: `0 0 20px ${c.purple}66` }} />
        </div>
        <div style={{ width: 90, fontFamily: MONO, fontSize: 22, fontWeight: 800, color: c.purple }}>{finalWidth.toFixed(0)}%</div>
        <div style={{ fontFamily: MONO, fontSize: 18, color: c.green, fontWeight: 800, transform: `scale(${badgePop})`, opacity: badgePop }}>+12</div>
      </div>
    </BenchGroup>
  );
};

const Group4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leftSlide = spring({ frame, fps, config: { damping: 14 } });
  const rightSlide = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const contractLines = ['§4.2 Indemnification Clause', 'Party A shall be liable for...', 'Maximum exposure: $2,450,000', 'Effective date: March 1, 2026'];
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <div style={{ width: 700, padding: 40, backgroundColor: c.card, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', transform: `translateX(${interpolate(leftSlide, [0, 1], [-200, 0])}px)`, opacity: leftSlide, position: 'relative' }}>
        <div style={{ fontFamily: MONO, fontSize: 18, color: c.dimWhite, marginBottom: 24, fontWeight: 700 }}>OPUS 4.6 — 1.15 MP</div>
        {contractLines.map((line, i) => <div key={i} style={{ fontFamily: MONO, fontSize: 16, color: c.white, marginBottom: 8, filter: 'blur(1.5px)', opacity: 0.35 }}>{line}</div>)}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: MONO, fontSize: 24, fontWeight: 800, color: c.amber, letterSpacing: 4 }}>UNREADABLE</div>
      </div>
      <div style={{ width: 700, padding: 40, backgroundColor: c.card, borderRadius: 16, border: `1px solid ${c.green}44`, boxShadow: `0 0 30px ${c.green}15`, transform: `translateX(${interpolate(rightSlide, [0, 1], [200, 0])}px)`, opacity: rightSlide }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: c.white, fontWeight: 700 }}>OPUS 4.7 — 3.75 MP</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: c.green, backgroundColor: `${c.green}22`, padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>3x RESOLUTION</div>
        </div>
        {contractLines.map((line, i) => <div key={i} style={{ fontFamily: MONO, fontSize: 16, color: c.white, marginBottom: 8 }}>{line}</div>)}
      </div>
    </div>
  );
};

const Group5: React.FC = () => (
  <BenchGroup title="BrowseComp — Web Research" headerBadge="⚠ CLAUDE TRAILS HERE" headerBadgeColor={c.amber}>
    <Bar name="GPT-5.4" score={89.3} color={c.gpt} leader delay={10} />
    <Bar name="Gemini 3.1" score={85.9} color={c.gemini} delay={20} />
    <Bar name="Opus 4.7" score={79.3} color={c.purple} loss delay={30} />
  </BenchGroup>
);

const Group6: React.FC = () => (
  <BenchGroup title="GPQA Diamond — Reasoning">
    <Bar name="GPT-5.4" score={94.4} color={c.gpt} delay={10} />
    <Bar name="Gemini 3.1" score={94.3} color={c.gemini} delay={15} />
    <Bar name="Opus 4.7" score={94.2} color={c.purple} delay={20} />
    <div style={{ fontFamily: MONO, fontSize: 16, color: c.dimWhite, marginTop: 24, textAlign: 'center' }}>Effectively tied. This benchmark is saturated.</div>
  </BenchGroup>
);

const Group7: React.FC = () => (
  <BenchGroup title="Tool Use — MCP-Atlas">
    <Bar name="Opus 4.7" score={77.3} color={c.purple} leader delay={10} />
    <Bar name="Gemini 3.1" score={73.9} color={c.gemini} delay={20} />
    <Bar name="GPT-5.4" score={68.1} color={c.gpt} delay={30} />
  </BenchGroup>
);

// Order matches narration — each group appears when narrator mentions it.
const S03_MARKERS = [
  { name: 'sweVerified', phrase: "Let's talk numbers" },
  { name: 'swePro',      phrase: 'SWE-bench Pro' },
  { name: 'cursor',      phrase: 'CursorBench' },
  { name: 'vision',      phrase: 'Vision got' },
  { name: 'mcp',         phrase: 'Tool use' },
  { name: 'browse',      phrase: 'BrowseComp' },
];

const S03_COMPONENTS: Record<string, React.FC> = {
  sweVerified: Group1, swePro: Group2, cursor: Group3,
  vision: Group4, mcp: Group7, browse: Group5,
};

export const S03_BenchmarkRace: React.FC = () => {
  const subs = deriveSubSequences('s03', S03_MARKERS);
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000' }}>
      {subs.map((s) => {
        const Comp = S03_COMPONENTS[s.name];
        return (
          <Sequence key={s.name} from={s.from} durationInFrames={s.duration}>
            <Comp />
          </Sequence>
        );
      })}
    </div>
  );
};
