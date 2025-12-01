'use client';

import React, { useMemo } from 'react';
import {
  Crosshair,
  MapPin,
  Flame,
  Coins,
  Clock,
  Brain,
  Footprints,
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisCategory } from '@/lib/preferences/types';
import {
  CATEGORY_STYLES,
  getScoreLevel,
  TREND_COLORS,
} from '@/lib/design/tokens';

// Map des icônes par catégorie
const CATEGORY_ICONS: Record<AnalysisCategory, LucideIcon> = {
  aim: Crosshair,
  positioning: MapPin,
  utility: Flame,
  economy: Coins,
  timing: Clock,
  decision: Brain,
  movement: Footprints,
  awareness: Eye,
  teamplay: Users,
};

// Types pour les métriques affichées
interface MetricValue {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  format?: 'percent' | 'decimal' | 'integer' | 'time';
}

// Props du composant
interface ScoreCardProps {
  category: AnalysisCategory;
  score: number;
  previousScore?: number;
  benchmark?: number;
  goal?: number;
  metrics?: MetricValue[];
  variant?: 'compact' | 'detailed' | 'mini';
  showTrend?: boolean;
  showBenchmark?: boolean;
  showGoal?: boolean;
  interactive?: boolean;
  animate?: boolean;
  onClick?: () => void;
  className?: string;
}

// Composant de trend
function TrendIndicator({
  current,
  previous,
  className,
}: {
  current: number;
  previous: number;
  className?: string;
}) {
  const diff = current - previous;
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  const trend = isPositive ? 'positive' : isNegative ? 'negative' : 'stable';
  const trendStyle = TREND_COLORS[trend];
  const Icon = trend === 'positive' ? TrendingUp : trend === 'negative' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm font-medium',
        className
      )}
      style={{ color: trendStyle.color }}
    >
      <Icon className="h-4 w-4" />
      <span>
        {isPositive ? '+' : ''}
        {diff.toFixed(1)}
      </span>
    </div>
  );
}

// Composant de barre de progression
function ProgressBar({
  value,
  max = 100,
  color,
  showLabel = false,
  height = 'h-2',
  className,
}: {
  value: number;
  max?: number;
  color: string;
  showLabel?: boolean;
  height?: string;
  className?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('relative', className)}>
      <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', height)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500')}
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-5 text-xs text-gray-500 dark:text-gray-400">
          {value.toFixed(0)}/{max}
        </span>
      )}
    </div>
  );
}

// Composant principal ScoreCard
export function ScoreCard({
  category,
  score,
  previousScore,
  benchmark,
  goal,
  metrics = [],
  variant = 'detailed',
  showTrend = true,
  showBenchmark = false,
  showGoal = false,
  interactive = true,
  animate = true,
  onClick,
  className,
}: ScoreCardProps) {
  const style = CATEGORY_STYLES[category];
  const scoreLevel = getScoreLevel(score);
  const Icon = CATEGORY_ICONS[category];

  // Calcul de la progression vers l'objectif
  const goalProgress = useMemo(() => {
    if (!goal || !previousScore) return null;
    const startValue = previousScore;
    const progress = ((score - startValue) / (goal - startValue)) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [goal, previousScore, score]);

  // Variants de style
  const cardClasses = useMemo(() => {
    const base = cn(
      'rounded-xl border transition-all duration-300',
      animate && 'transform',
      interactive && 'cursor-pointer hover:scale-[1.02]',
      'dark:border-gray-700',
    );

    switch (variant) {
      case 'mini':
        return cn(base, 'p-2');
      case 'compact':
        return cn(base, 'p-3');
      case 'detailed':
      default:
        return cn(base, 'p-4');
    }
  }, [variant, animate, interactive]);

  // Mini variant
  if (variant === 'mini') {
    return (
      <div
        className={cn(
          cardClasses,
          'flex items-center gap-2',
          className
        )}
        onClick={onClick}
        style={{
          borderColor: `${style.color}30`,
          backgroundColor: `${style.color}08`,
        }}
      >
        <div
          className="p-1 rounded"
          style={{ backgroundColor: `${style.color}20` }}
        >
          <Icon className="h-4 w-4" style={{ color: style.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {style.label}
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: scoreLevel.color }}
          >
            {score.toFixed(0)}
          </div>
        </div>
        {showTrend && previousScore !== undefined && (
          <TrendIndicator current={score} previous={previousScore} />
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          cardClasses,
          'relative overflow-hidden',
          className
        )}
        onClick={onClick}
        style={{
          borderColor: `${style.color}30`,
        }}
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(135deg, ${style.color} 0%, transparent 50%)`,
          }}
        />

        <div className="relative flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              'p-2 rounded-lg',
              animate && 'transition-transform hover:scale-110'
            )}
            style={{
              backgroundColor: `${style.color}20`,
              boxShadow: interactive ? `0 0 15px ${style.color}30` : undefined,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: style.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {style.label}
              </span>
              {showTrend && previousScore !== undefined && (
                <TrendIndicator current={score} previous={previousScore} />
              )}
            </div>

            {/* Score */}
            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl font-bold"
                style={{ color: scoreLevel.color }}
              >
                {score.toFixed(0)}
              </span>
              <span className="text-xs text-gray-400">/100</span>
            </div>

            {/* Progress bar */}
            <ProgressBar
              value={score}
              color={style.color}
              className="mt-2"
            />
          </div>
        </div>

        {/* Benchmark indicator */}
        {showBenchmark && benchmark !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Target className="h-3 w-3" />
            <span>Moyenne rang: {benchmark.toFixed(0)}</span>
            {score >= benchmark && (
              <span className="text-green-500 ml-1">+{(score - benchmark).toFixed(0)}</span>
            )}
            {score < benchmark && (
              <span className="text-red-500 ml-1">{(score - benchmark).toFixed(0)}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant (default)
  return (
    <div
      className={cn(
        cardClasses,
        'relative overflow-hidden',
        className
      )}
      onClick={onClick}
      style={{
        borderColor: `${style.color}30`,
      }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${style.color} 0%, transparent 60%)`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Icon with glow effect */}
            <div
              className={cn(
                'p-2.5 rounded-xl',
                animate && 'transition-all duration-300',
                interactive && 'hover:scale-110'
              )}
              style={{
                backgroundColor: `${style.color}20`,
                boxShadow: `0 0 20px ${style.color}40`,
              }}
            >
              <Icon className="h-6 w-6" style={{ color: style.color }} />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {style.label}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {style.description}
              </p>
            </div>
          </div>

          {/* Trend */}
          {showTrend && previousScore !== undefined && (
            <TrendIndicator current={score} previous={previousScore} />
          )}
        </div>

        {/* Score display */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-bold tabular-nums"
              style={{ color: scoreLevel.color }}
            >
              {score.toFixed(0)}
            </span>
            <span className="text-sm text-gray-400">/100</span>
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${scoreLevel.color}20`,
                color: scoreLevel.color,
              }}
            >
              {scoreLevel.label}
            </span>
          </div>

          {/* Main progress bar */}
          <ProgressBar
            value={score}
            color={style.color}
            className="mt-3"
            height="h-2.5"
          />
        </div>

        {/* Goal progress */}
        {showGoal && goal !== undefined && goalProgress !== null && (
          <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                Progression vers objectif
              </span>
              <span className="font-medium" style={{ color: style.color }}>
                {goalProgress.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{previousScore?.toFixed(0)}</span>
              <div className="flex-1">
                <ProgressBar
                  value={goalProgress}
                  color={style.color}
                  height="h-1.5"
                />
              </div>
              <span className="text-xs font-medium" style={{ color: style.color }}>
                {goal.toFixed(0)}
              </span>
            </div>
          </div>
        )}

        {/* Benchmark comparison */}
        {showBenchmark && benchmark !== undefined && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">vs Rang:</span>
            <span
              className="font-medium"
              style={{
                color: score >= benchmark ? TREND_COLORS.positive.color : TREND_COLORS.negative.color,
              }}
            >
              {score >= benchmark ? '+' : ''}
              {(score - benchmark).toFixed(1)}
            </span>
          </div>
        )}

        {/* Metrics list */}
        {metrics.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {metric.label}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatMetricValue(metric)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper pour formater les valeurs de métrique
function formatMetricValue(metric: MetricValue): string {
  const { value, unit, format } = metric;

  if (typeof value === 'string') return value;

  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(2);
    case 'integer':
      return value.toFixed(0);
    case 'time':
      return `${value.toFixed(1)}s`;
    default:
      return unit ? `${value.toFixed(1)}${unit}` : value.toFixed(1);
  }
}

// Export des sous-composants
export { TrendIndicator, ProgressBar };

// Types
export type { ScoreCardProps, MetricValue };
