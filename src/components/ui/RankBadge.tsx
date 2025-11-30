'use client';

import { CS2Rank } from '@prisma/client';

interface RankBadgeProps {
  rank: CS2Rank | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showGlow?: boolean;
  animated?: boolean;
}

// Rank configurations
const RANK_CONFIG: Record<CS2Rank, {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  gradient: string;
  icon: string;
}> = {
  SILVER: {
    label: 'Silver',
    shortLabel: 'S',
    color: 'text-gray-300',
    bgColor: 'bg-gray-600/20',
    borderColor: 'border-gray-500',
    glowColor: 'shadow-[0_0_15px_rgba(156,163,175,0.4)]',
    gradient: 'from-gray-500 to-gray-700',
    icon: '\u2605',
  },
  GOLD_NOVA: {
    label: 'Gold Nova',
    shortLabel: 'GN',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-600/20',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]',
    gradient: 'from-yellow-500 to-yellow-700',
    icon: '\u2605',
  },
  MASTER_GUARDIAN: {
    label: 'Master Guardian',
    shortLabel: 'MG',
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/20',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    gradient: 'from-blue-500 to-blue-700',
    icon: '\u2726',
  },
  LEGENDARY_EAGLE: {
    label: 'Legendary Eagle',
    shortLabel: 'LE',
    color: 'text-purple-400',
    bgColor: 'bg-purple-600/20',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-[0_0_15px_rgba(147,51,234,0.4)]',
    gradient: 'from-purple-500 to-purple-700',
    icon: '\u2734',
  },
  SUPREME: {
    label: 'Supreme',
    shortLabel: 'SMFC',
    color: 'text-pink-400',
    bgColor: 'bg-pink-600/20',
    borderColor: 'border-pink-500',
    glowColor: 'shadow-[0_0_15px_rgba(236,72,153,0.4)]',
    gradient: 'from-pink-500 to-pink-700',
    icon: '\u2756',
  },
  GLOBAL: {
    label: 'Global Elite',
    shortLabel: 'GE',
    color: 'text-amber-300',
    bgColor: 'bg-amber-600/20',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',
    gradient: 'from-amber-400 to-amber-600',
    icon: '\u2730',
  },
  PREMIER_0_5000: {
    label: 'Premier 0-5K',
    shortLabel: '5K',
    color: 'text-gray-400',
    bgColor: 'bg-gray-600/20',
    borderColor: 'border-gray-500',
    glowColor: 'shadow-[0_0_15px_rgba(107,114,128,0.4)]',
    gradient: 'from-gray-500 to-gray-700',
    icon: 'P',
  },
  PREMIER_5000_10000: {
    label: 'Premier 5K-10K',
    shortLabel: '10K',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-600/20',
    borderColor: 'border-cyan-500',
    glowColor: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    gradient: 'from-cyan-500 to-cyan-700',
    icon: 'P',
  },
  PREMIER_10000_15000: {
    label: 'Premier 10K-15K',
    shortLabel: '15K',
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/20',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    gradient: 'from-blue-500 to-blue-700',
    icon: 'P',
  },
  PREMIER_15000_20000: {
    label: 'Premier 15K-20K',
    shortLabel: '20K',
    color: 'text-violet-400',
    bgColor: 'bg-violet-600/20',
    borderColor: 'border-violet-500',
    glowColor: 'shadow-[0_0_15px_rgba(139,92,246,0.4)]',
    gradient: 'from-violet-500 to-violet-700',
    icon: 'P',
  },
  PREMIER_20000_PLUS: {
    label: 'Premier 20K+',
    shortLabel: '20K+',
    color: 'text-rose-400',
    bgColor: 'bg-rose-600/20',
    borderColor: 'border-rose-500',
    glowColor: 'shadow-[0_0_20px_rgba(244,63,94,0.5)]',
    gradient: 'from-rose-500 to-rose-700',
    icon: 'P',
  },
};

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
};

const LABEL_SIZE_CLASSES = {
  sm: 'text-xs mt-1',
  md: 'text-sm mt-1.5',
  lg: 'text-base mt-2',
  xl: 'text-lg mt-2',
};

export function RankBadge({
  rank,
  size = 'md',
  showLabel = false,
  showGlow = true,
  animated = true,
}: RankBadgeProps) {
  if (!rank) {
    return (
      <div className="flex flex-col items-center">
        <div
          className={`
            ${SIZE_CLASSES[size]}
            flex items-center justify-center
            rounded-full
            bg-gray-800/50
            border border-gray-700
            text-gray-500
          `}
        >
          ?
        </div>
        {showLabel && (
          <span className={`${LABEL_SIZE_CLASSES[size]} text-gray-500`}>
            Non classé
          </span>
        )}
      </div>
    );
  }

  const config = RANK_CONFIG[rank];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          ${SIZE_CLASSES[size]}
          flex items-center justify-center
          rounded-full
          ${config.bgColor}
          border-2 ${config.borderColor}
          ${config.color}
          font-bold
          ${showGlow ? config.glowColor : ''}
          ${animated ? 'transition-all duration-300 hover:scale-110' : ''}
          relative
          overflow-hidden
        `}
      >
        {/* Gradient background */}
        <div
          className={`
            absolute inset-0
            bg-gradient-to-br ${config.gradient}
            opacity-20
          `}
        />

        {/* Icon */}
        <span className="relative z-10">{config.icon}</span>

        {/* Animated shine effect */}
        {animated && (
          <div
            className="
              absolute inset-0
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              animate-shimmer
              pointer-events-none
            "
            style={{ backgroundSize: '200% 100%' }}
          />
        )}
      </div>

      {showLabel && (
        <span className={`${LABEL_SIZE_CLASSES[size]} ${config.color} font-medium`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Compact version for inline use
export function RankBadgeInline({
  rank,
  showRating = false,
  rating,
}: {
  rank: CS2Rank | null | undefined;
  showRating?: boolean;
  rating?: number;
}) {
  if (!rank) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-sm">
        Non classé
      </span>
    );
  }

  const config = RANK_CONFIG[rank];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        rounded-full
        ${config.bgColor}
        border ${config.borderColor}
        ${config.color}
        text-sm font-medium
        transition-all duration-200
        hover:scale-105
      `}
    >
      <span>{config.icon}</span>
      <span>{config.shortLabel}</span>
      {showRating && rating && (
        <span className="text-gray-400 ml-1">({rating.toFixed(2)})</span>
      )}
    </span>
  );
}