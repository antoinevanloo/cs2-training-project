'use client';

import { FireIcon, StarIcon, TrophyIcon } from './icons/CS2Icons';

// Achievement Badge Component
interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'fire' | 'headshot' | 'clutch' | 'ace';
  unlocked?: boolean;
  progress?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

const RARITY_STYLES = {
  common: {
    bg: 'bg-gray-600/20',
    border: 'border-gray-500',
    glow: '',
    text: 'text-gray-300',
  },
  rare: {
    bg: 'bg-blue-600/20',
    border: 'border-blue-500',
    glow: 'shadow-glow-ct',
    text: 'text-blue-400',
  },
  epic: {
    bg: 'bg-purple-600/20',
    border: 'border-purple-500',
    glow: 'shadow-[0_0_20px_rgba(147,51,234,0.4)]',
    text: 'text-purple-400',
  },
  legendary: {
    bg: 'bg-amber-600/20',
    border: 'border-amber-400',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.5)]',
    text: 'text-amber-400',
  },
};

const BADGE_ICONS = {
   trophy: '🏆',
  star: '⭐',
  fire: '🔥',
  headshot: '🎯',
  clutch: '💪',
  ace: '🌟',
};

export function AchievementBadge({
  title,
  description,
  icon,
  unlocked = false,
  progress = 0,
  rarity = 'common',
}: AchievementBadgeProps) {
  const styles = RARITY_STYLES[rarity];

  return (
    <div
      className={`
        relative p-4 rounded-xl
        ${unlocked ? styles.bg : 'bg-gray-800/50'}
        border ${unlocked ? styles.border : 'border-gray-700'}
        ${unlocked ? styles.glow : ''}
        transition-all duration-300
        hover:scale-102
        ${!unlocked ? 'opacity-60 grayscale' : ''}
      `}
    >
      {/* Badge Icon */}
      <div className="flex items-start gap-3">
        <div
          className={`
            w-12 h-12 rounded-lg
            flex items-center justify-center
            text-2xl
            ${unlocked ? styles.bg : 'bg-gray-700/50'}
            ${unlocked ? 'animate-bounce-subtle' : ''}
          `}
        >
          {BADGE_ICONS[icon]}
        </div>

        <div className="flex-1">
          <h4 className={`font-semibold ${unlocked ? styles.text : 'text-gray-500'}`}>
            {title}
          </h4>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>

          {/* Progress Bar (if not unlocked) */}
          {!unlocked && progress > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cs2-accent to-cs2-accent-light rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Rarity indicator */}
      {unlocked && (
        <div
          className={`
            absolute top-2 right-2
            px-2 py-0.5 rounded-full
            text-xs font-medium
            ${styles.bg} ${styles.text}
            capitalize
          `}
        >
          {rarity}
        </div>
      )}
    </div>
  );
}

// Streak Counter Component
interface StreakCounterProps {
  count: number;
  label?: string;
  maxStreak?: number;
  isActive?: boolean;
}

export function StreakCounter({
  count,
  label = 'Day Streak',
  maxStreak,
  isActive = true,
}: StreakCounterProps) {
  const isOnFire = count >= 3;

  return (
    <div
      className={`
        relative p-4 rounded-xl
        bg-gradient-to-br from-orange-600/20 to-red-600/20
        border border-orange-500/30
        ${isOnFire ? 'animate-pulse-glow' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Fire Icon */}
        <div className={`relative ${isOnFire ? 'animate-bounce-subtle' : ''}`}>
          <FireIcon
            size={40}
            className={isActive ? 'text-orange-400' : 'text-gray-500'}
          />
          {isOnFire && (
            <div className="absolute -top-1 -right-1">
              <span className="text-xs">🔥</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-orange-400">{count}</span>
            <span className="text-sm text-gray-400">jours</span>
          </div>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>

      {/* Max streak indicator */}
      {maxStreak && maxStreak > count && (
        <div className="mt-2 text-xs text-gray-500">
          Record: {maxStreak} jours
        </div>
      )}

      {/* Streak milestones */}
      {count > 0 && (
        <div className="mt-3 flex gap-1">
          {[7, 14, 30, 60, 100].map((milestone) => (
            <div
              key={milestone}
              className={`
                w-8 h-1.5 rounded-full
                ${count >= milestone ? 'bg-orange-400' : 'bg-gray-700'}
                transition-all duration-300
              `}
              title={`${milestone} jours`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// XP Progress Bar Component
interface XPBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  showDetails?: boolean;
}

export function XPBar({ currentXP, requiredXP, level, showDetails = true }: XPBarProps) {
  const percentage = Math.min(100, (currentXP / requiredXP) * 100);

  return (
    <div className="w-full">
      {showDetails && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div
              className="
                w-8 h-8 rounded-lg
                bg-gradient-to-br from-cs2-accent to-cs2-accent-dark
                flex items-center justify-center
                font-bold text-white text-sm
                shadow-glow-sm
              "
            >
              {level}
            </div>
            <span className="text-sm text-gray-400">Niveau {level}</span>
          </div>
          <span className="text-sm text-gray-500">
            {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
          </span>
        </div>
      )}

      <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className="
            h-full
            bg-gradient-to-r from-cs2-accent via-cs2-accent-light to-cs2-accent
            rounded-full
            transition-all duration-700 ease-out
            relative
            overflow-hidden
          "
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <div
            className="
              absolute inset-0
              bg-gradient-to-r from-transparent via-white/30 to-transparent
              animate-shimmer
            "
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
      </div>

      {showDetails && (
        <p className="text-xs text-gray-500 mt-1 text-right">
          {(requiredXP - currentXP).toLocaleString()} XP jusqu&apos;au niveau {level + 1}
        </p>
      )}
    </div>
  );
}

// Stat Card with Gaming Style
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: 'accent' | 'ct' | 't' | 'win' | 'loss';
  size?: 'sm' | 'md' | 'lg';
}

const STAT_COLORS = {
  accent: 'from-cs2-accent/20 to-transparent border-cs2-accent/30 text-cs2-accent',
  ct: 'from-cs2-ct/20 to-transparent border-cs2-ct/30 text-cs2-ct',
  t: 'from-cs2-t/20 to-transparent border-cs2-t/30 text-cs2-t',
  win: 'from-green-500/20 to-transparent border-green-500/30 text-green-400',
  loss: 'from-red-500/20 to-transparent border-red-500/30 text-red-400',
};

export function GamingStatCard({
  label,
  value,
  change,
  icon,
  color = 'accent',
  size = 'md',
}: StatCardProps) {
  const colorClasses = STAT_COLORS[color];

  return (
    <div
      className={`
        relative p-${size === 'sm' ? '3' : size === 'lg' ? '6' : '4'}
        rounded-xl
        bg-gradient-to-br ${colorClasses}
        border
        transition-all duration-300
        hover:scale-102
        hover:shadow-card-hover
        group
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p
            className={`
              ${size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'}
              font-bold text-white mt-1
            `}
          >
            {value}
          </p>

          {change !== undefined && (
            <p
              className={`
                text-sm mt-1 flex items-center gap-1
                ${change >= 0 ? 'text-green-400' : 'text-red-400'}
              `}
            >
              {change >= 0 ? '\u2191' : '\u2193'}
              {Math.abs(change)}%
            </p>
          )}
        </div>

        {icon && (
          <div className="opacity-50 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Match Result Badge
interface MatchResultProps {
  result: 'win' | 'loss' | 'draw';
  score?: string;
  map?: string;
  size?: 'sm' | 'md';
}

export function MatchResult({ result, score, map, size = 'md' }: MatchResultProps) {
  const resultConfig = {
    win: {
      label: 'VICTOIRE',
      bg: 'bg-green-500/20',
      border: 'border-green-500/50',
      text: 'text-green-400',
      glow: 'shadow-glow-win',
    },
    loss: {
      label: 'DÉFAITE',
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      glow: 'shadow-glow-loss',
    },
    draw: {
      label: 'ÉGALITÉ',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400',
      glow: '',
    },
  };

  const config = resultConfig[result];

  return (
    <div
      className={`
        inline-flex items-center gap-2
        ${size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'}
        rounded-lg
        ${config.bg}
        border ${config.border}
        ${config.glow}
      `}
    >
      <span className={`font-bold ${config.text} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {config.label}
      </span>
      {score && (
        <span className={`text-white font-mono ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {score}
        </span>
      )}
      {map && <span className="text-gray-500 text-xs">{map}</span>}
    </div>
  );
}

// Animated Counter
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// Kill Feed Style Entry
interface KillFeedEntryProps {
  attacker: string;
  victim: string;
  weapon: string;
  headshot?: boolean;
  wallbang?: boolean;
  noscope?: boolean;
}

export function KillFeedEntry({
  attacker,
  victim,
  weapon,
  headshot,
  wallbang,
  noscope,
}: KillFeedEntryProps) {
  return (
    <div
      className="
        inline-flex items-center gap-2
        px-3 py-1.5
        rounded-lg
        bg-gray-900/80
        border border-gray-700/50
        text-sm
        animate-slide-in-right
      "
    >
      <span className="text-cs2-ct font-medium">{attacker}</span>

      <div className="flex items-center gap-1 text-gray-500">
        {wallbang && <span title="Wallbang">🧱</span>}
        {noscope && <span title="No Scope">🎯</span>}
        <span className="text-xs font-mono">[{weapon}]</span>
        {headshot && <span title="Headshot" className="text-red-400">💀</span>}
      </div>

      <span className="text-cs2-t font-medium">{victim}</span>
    </div>
  );
}