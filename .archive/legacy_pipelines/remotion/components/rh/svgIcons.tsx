import React from 'react';

type IconProps = { size?: number; color?: string };

const base = (size: number, color: string): React.SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: color, strokeWidth: 1.8,
  strokeLinecap: 'round', strokeLinejoin: 'round',
});

export const IconGlobe: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
  </svg>
);

export const IconDatabase: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <ellipse cx="12" cy="5" rx="8" ry="2.5" />
    <path d="M4 5v7c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5M4 12v7c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-7" />
  </svg>
);

export const IconCalculator: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <rect x="7" y="6" width="10" height="3" />
    <circle cx="8" cy="13" r=".6" fill={color} />
    <circle cx="12" cy="13" r=".6" fill={color} />
    <circle cx="16" cy="13" r=".6" fill={color} />
    <circle cx="8" cy="17" r=".6" fill={color} />
    <circle cx="12" cy="17" r=".6" fill={color} />
    <circle cx="16" cy="17" r=".6" fill={color} />
  </svg>
);

export const IconFile: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </svg>
);

export const IconBrain: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 4 3 3 0 0 0 4 3h1V4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 4 3 3 0 0 1-4 3h-1V4z" />
    <path d="M9 10h2M13 10h2M9 14h2M13 14h2" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconBook: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z" />
    <path d="M4 5v14M20 5v14M12 3v18" />
  </svg>
);

// Workshop icons
export const IconWrench: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M14 5a4 4 0 0 1 5 5l-9 9a2 2 0 0 1-2.8 0l-2.2-2.2a2 2 0 0 1 0-2.8z" />
    <circle cx="16" cy="8" r="1.2" fill={color} />
  </svg>
);

export const IconBolt: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
  </svg>
);

export const IconLightbulb: React.FC<IconProps> = ({ size = 28, color = '#FFB300' }) => (
  <svg {...base(size, color)}>
    <path d="M9 21h6M10 17h4M12 3a6 6 0 0 1 4 10.5V16H8v-2.5A6 6 0 0 1 12 3z" />
  </svg>
);

export const IconSpiral: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M12 3a9 9 0 1 1-9 9 7 7 0 0 1 7-7 5 5 0 0 1 5 5 3 3 0 0 1-3 3 1 1 0 0 1-1-1" />
  </svg>
);

// Pentagon slot icons
export const IconInbox: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M4 13l2-7h12l2 7M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M4 13h5l2 2h2l2-2h5" />
  </svg>
);

export const IconOutbox: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M4 13l2-7h12l2 7M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    <path d="M12 16V7M9 10l3-3 3 3" />
  </svg>
);

export const IconLoop: React.FC<IconProps> = ({ size = 28, color = '#00E5FF' }) => (
  <svg {...base(size, color)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M21 3v5h-5M3 21v-5h5" />
  </svg>
);

// Mapping for legacy emoji → SVG
export const EmojiToIcon: Record<string, React.FC<IconProps>> = {
  '🌐': IconGlobe,
  '🗄️': IconDatabase,
  '🧮': IconCalculator,
  '📁': IconFile,
  '📖': IconBook,
  '🧠': IconBrain,
  '⏰': IconClock,
  '📅': IconCalendar,
  '🛠️': IconWrench,
  '🔩': IconBolt,
  '💡': IconLightbulb,
  '🌀': IconSpiral,
  '🔧': IconWrench,
  '📥': IconInbox,
  '📤': IconOutbox,
  '🔁': IconLoop,
};

export const SvgForEmoji: React.FC<{ emoji: string; size?: number; color?: string }> = ({
  emoji, size = 28, color = '#00E5FF',
}) => {
  const Icon = EmojiToIcon[emoji];
  if (!Icon) return <span style={{ fontSize: size }}>{emoji}</span>;
  return <Icon size={size} color={color} />;
};
