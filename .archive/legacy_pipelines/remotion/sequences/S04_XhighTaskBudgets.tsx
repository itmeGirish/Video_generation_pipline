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
  red: '#FF3B5C', green: '#00FF88', amber: '#FFB800',
  white: '#E8F4FF', dimWhite: '#4A5568',
};

/*
 * S04 audio = 1773 frames (59.1s). Scale = 0.788 from original 2250.
 *
 * VO segments (137 words):
 *   xhigh effort (52w, 38%) → 674 frames
 *   task budgets (50w, 36.5%) → 647 frames
 *   ultrareview (35w, 25.5%) → 452 frames
 */

const EffortDial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scaled from original: 50→39, 130→102, 210→166, 300→236, 420→331
  const levels = [
    { name: 'LOW', color: c.dimWhite, frame: 39 },
    { name: 'MEDIUM', color: c.cyan, frame: 102 },
    { name: 'HIGH', color: c.green, frame: 166 },
    { name: 'XHIGH', color: c.amber, frame: 236 },
    { name: 'MAX', color: c.red, frame: 380 },
  ];

  let currentLevel = levels[0];
  for (const level of levels) {
    if (frame >= level.frame) currentLevel = level;
  }

  const targetAngles = [-120, -60, 0, 60, 120];
  const needleAngle = interpolate(frame, levels.map((l) => l.frame), targetAngles, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const arcProgress = interpolate(needleAngle, [-120, 120], [0, 1]);
  const isXhigh = currentLevel.name === 'XHIGH';
  const newBadge = spring({ frame: frame - 246, fps, config: { damping: 10 } });
  const boxesIn = spring({ frame: frame - 350, fps, config: { damping: 14 } });

  const cx = 250, cy = 250, r = 190;
  const startAngle = -210 * (Math.PI / 180);
  const endAngle = startAngle + arcProgress * 240 * (Math.PI / 180);
  const arcPath = `M ${cx + r * Math.cos(startAngle)} ${cy + r * Math.sin(startAngle)} A ${r} ${r} 0 ${arcProgress > 0.5 ? 1 : 0} 1 ${cx + r * Math.cos(endAngle)} ${cy + r * Math.sin(endAngle)}`;
  const needleRad = (needleAngle - 90) * (Math.PI / 180);
  const nx = cx + 170 * Math.cos(needleRad);
  const ny = cy + 170 * Math.sin(needleRad);

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 500, height: 300 }}>
        <svg width={500} height={300} viewBox="0 0 500 300">
          <path d={`M ${cx + r * Math.cos(startAngle)} ${cy + r * Math.sin(startAngle)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(startAngle + 240 * (Math.PI / 180))} ${cy + r * Math.sin(startAngle + 240 * (Math.PI / 180))}`} fill="none" stroke={c.dimWhite} strokeWidth={12} strokeLinecap="round" opacity={0.2} />
          <path d={arcPath} fill="none" stroke={currentLevel.color} strokeWidth={12} strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={c.white} strokeWidth={3} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={6} fill={c.white} />
        </svg>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 800, color: currentLevel.color, textShadow: isXhigh ? `0 0 20px ${c.amber}` : 'none', letterSpacing: 6, marginTop: -20 }}>{currentLevel.name}</div>
      {isXhigh && <div style={{ fontFamily: MONO, fontSize: 16, color: c.amber, backgroundColor: `${c.amber}22`, padding: '4px 14px', borderRadius: 8, marginTop: 12, transform: `scale(${newBadge})`, display: 'flex', alignItems: 'center', gap: 8 }}>✦ NEW — Default in Claude Code</div>}
      <div style={{ display: 'flex', gap: 30, marginTop: 40, transform: `translateY(${interpolate(boxesIn, [0, 1], [40, 0])}px)`, opacity: boxesIn }}>
        <div style={{ padding: '16px 24px', borderRadius: 12, border: `2px solid ${c.red}`, backgroundColor: `${c.red}0A`, fontFamily: MONO, fontSize: 15, color: c.red }}>Simple task + xhigh = wasted tokens</div>
        <div style={{ padding: '16px 24px', borderRadius: 12, border: `2px solid ${c.green}`, backgroundColor: `${c.green}0A`, fontFamily: MONO, fontSize: 15, color: c.green }}>Hard task + xhigh = self-verified output</div>
      </div>
    </div>
  );
};

const TaskBudget: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const goodFill = interpolate(frame, [0, 80], [0, 82], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const showSuccess = frame > 80;
  const successOpacity = spring({ frame: frame - 80, fps, config: { damping: 12 } });
  const badStart = 150;
  const badFill = interpolate(frame - badStart, [0, 60], [0, 120], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const showBad = frame > badStart;
  const badOverflow = badFill > 100;
  const dollarFrames = [210, 225, 240, 255, 270];

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 50 }}>
      <div style={{ width: 800 }}>
        <div style={{ fontFamily: MONO, fontSize: 18, color: c.white, marginBottom: 12, fontWeight: 700 }}>TOKEN BUDGET: 50,000</div>
        <div style={{ width: '100%', height: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(goodFill, 100)}%`, height: '100%', borderRadius: 8, background: `linear-gradient(90deg, ${c.green}B3, ${c.green})` }} />
        </div>
        {showSuccess && <div style={{ fontFamily: MONO, fontSize: 16, color: c.green, marginTop: 12, opacity: successOpacity }}>Task complete. Budget: 41,200 / 50,000 ✓</div>}
      </div>
      {showBad && (
        <div style={{ width: 800, position: 'relative' }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: c.dimWhite, marginBottom: 12 }}>WITHOUT BUDGET:</div>
          <div style={{ width: '100%', height: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'visible', position: 'relative' }}>
            <div style={{ width: `${badFill}%`, height: '100%', borderRadius: 8, background: badOverflow ? `linear-gradient(90deg, ${c.amber}, ${c.red})` : `linear-gradient(90deg, ${c.cyan}B3, ${c.cyan})` }} />
          </div>
          {badOverflow && dollarFrames.map((df, i) => {
            const floatY = spring({ frame: frame - df, fps, config: { damping: 6, stiffness: 40 } });
            if (frame < df) return null;
            return <div key={i} style={{ position: 'absolute', right: -20 + i * 60, top: -20, fontSize: 28, transform: `translateY(${interpolate(floatY, [0, 1], [0, -80])}px)`, opacity: interpolate(floatY, [0, 0.5, 1], [0, 1, 0.3]) }}>💸</div>;
          })}
          {badOverflow && <div style={{ fontFamily: MONO, fontSize: 16, color: c.red, marginTop: 12 }}>$$$$ — 3AM surprise bill</div>}
        </div>
      )}
    </div>
  );
};

const UltrareviewDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;
  // Scaled from original: compress to fit 452 frames
  const lines = [
    { text: '/ultrareview', color: c.white, start: 5, typing: true },
    { text: 'Spawning review agent...', color: c.cyan, start: 45 },
    { text: 'Scanning 47 changed files...', color: c.cyan, start: 85 },
    { text: '', color: 'transparent', start: 140 },
    { text: '⚠ auth.middleware.js:34 — Token refresh race condition', color: c.amber, start: 160, pulse: true },
    { text: '⚠ db.migrations.js:12 — Missing index on user_email', color: c.amber, start: 210, pulse: true },
    { text: '✓ 45 files passed review', color: c.green, start: 260 },
    { text: '', color: 'transparent', start: 300 },
    { text: 'Review complete — 87 seconds', color: c.green, start: 320, bold: true, badge: true },
  ];

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 1400, backgroundColor: 'rgba(6, 10, 18, 0.95)', borderRadius: 16, border: '1px solid rgba(0, 240, 255, 0.2)', boxShadow: '0 0 80px rgba(0, 240, 255, 0.08)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FEBC2E' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28C840' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', color: c.dimWhite, fontSize: 13, fontFamily: MONO }}>claude-code — ultrareview</div>
        </div>
        <div style={{ padding: '24px 28px' }}>
          {lines.map((line, i) => {
            if (!line.text) return <div key={i} style={{ height: 12 }} />;
            const relFrame = frame - line.start;
            if (relFrame < 0) return null;
            let displayText = line.text;
            if ((line as any).typing) { const chars = Math.min(Math.floor(relFrame * 3), line.text.length); displayText = line.text.substring(0, chars); }
            let opacity = 1;
            if ((line as any).pulse && relFrame < 20) { opacity = interpolate(Math.sin(relFrame * 0.5), [-1, 1], [0.4, 1]); }
            return (
              <div key={i} style={{ fontSize: 22, fontFamily: MONO, color: line.color, fontWeight: (line as any).bold ? 800 : 400, marginBottom: 8, opacity }}>
                {(line as any).typing && displayText.length < line.text.length ? <>{displayText}{cursorVisible && <span style={{ opacity: 0.8 }}>▊</span>}</> : <>{displayText}{(line as any).badge && <span style={{ backgroundColor: `${c.green}33`, color: c.green, padding: '2px 10px', borderRadius: 4, marginLeft: 10, fontSize: 16 }}>87 seconds</span>}</>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 16, color: c.dimWhite, marginTop: 30, opacity: interpolate(frame - 380, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        Senior engineer review. 87 seconds. Pennies.
      </div>
    </div>
  );
};

const S04_MARKERS = [
  { name: 'dial',        phrase: 'But benchmarks' },
  { name: 'budget',      phrase: 'task budgets' },
  { name: 'ultrareview', phrase: 'ultrareview command' },
];

const S04_COMPONENTS: Record<string, React.FC> = {
  dial: EffortDial, budget: TaskBudget, ultrareview: UltrareviewDemo,
};

export const S04_XhighTaskBudgets: React.FC = () => {
  const subs = deriveSubSequences('s04', S04_MARKERS);
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000' }}>
      {subs.map((s) => {
        const Comp = S04_COMPONENTS[s.name];
        return (
          <Sequence key={s.name} from={s.from} durationInFrames={s.duration}>
            <Comp />
          </Sequence>
        );
      })}
    </div>
  );
};
