'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { getCategoryStyle, CATEGORY_STYLES } from '@/lib/design/tokens';
import { getCategoryIcon } from '@/lib/design/icons';
import type { AnalysisCategory } from '@/lib/preferences/types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  ChevronRight,
  Zap,
  Award,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

// Types
export interface CategoryScore {
  category: AnalysisCategory;
  score: number;
  previousScore?: number;
  benchmark?: number;
  metrics?: Record<string, number>;
}

export interface Insight {
  id: string;
  type: 'strength' | 'weakness' | 'improvement' | 'warning' | 'achievement';
  category: AnalysisCategory;
  title: string;
  description: string;
  metric?: string;
  value?: number;
  previousValue?: number;
  targetValue?: number;
  priority: 'high' | 'medium' | 'low';
  actionable?: string;
}

interface QuickInsightsProps {
  scores: CategoryScore[];
  previousScores?: CategoryScore[];
  benchmarkScores?: CategoryScore[];
  playerRank?: string;
  variant?: 'full' | 'compact' | 'minimal';
  maxInsights?: number;
  showActions?: boolean;
  onInsightClick?: (insight: Insight) => void;
  onCategoryClick?: (category: AnalysisCategory) => void;
  className?: string;
}

// Helper functions
function calculateTrend(current: number, previous?: number): 'up' | 'down' | 'stable' {
  if (!previous) return 'stable';
  const diff = current - previous;
  if (diff > 2) return 'up';
  if (diff < -2) return 'down';
  return 'stable';
}

function getScoreLevel(score: number): 'poor' | 'average' | 'good' | 'excellent' {
  if (score < 40) return 'poor';
  if (score < 60) return 'average';
  if (score < 80) return 'good';
  return 'excellent';
}

function generateInsights(
  scores: CategoryScore[],
  previousScores?: CategoryScore[],
  benchmarkScores?: CategoryScore[]
): Insight[] {
  const insights: Insight[] = [];
  const previousMap = new Map(previousScores?.map(s => [s.category, s]));
  const benchmarkMap = new Map(benchmarkScores?.map(s => [s.category, s]));

  // Sort by score to identify strengths and weaknesses
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);
  const topCategories = sortedScores.slice(0, 3);
  const bottomCategories = sortedScores.slice(-3).reverse();

  // Generate strength insights (top 3 categories)
  topCategories.forEach((cat, index) => {
    if (cat.score >= 70) {
      const style = getCategoryStyle(cat.category);
      insights.push({
        id: `strength-${cat.category}`,
        type: 'strength',
        category: cat.category,
        title: `${style.label} - Point fort`,
        description: `Votre ${style.label.toLowerCase()} est excellent avec un score de ${cat.score.toFixed(0)}`,
        value: cat.score,
        priority: index === 0 ? 'high' : 'medium',
      });
    }
  });

  // Generate weakness insights (bottom 3 categories with low scores)
  bottomCategories.forEach((cat, index) => {
    if (cat.score < 50) {
      const style = getCategoryStyle(cat.category);
      insights.push({
        id: `weakness-${cat.category}`,
        type: 'weakness',
        category: cat.category,
        title: `${style.label} - À améliorer`,
        description: `Votre ${style.label.toLowerCase()} nécessite du travail (${cat.score.toFixed(0)})`,
        value: cat.score,
        priority: index === 0 ? 'high' : 'medium',
        actionable: `Focalisez-vous sur l'amélioration de votre ${style.label.toLowerCase()}`,
      });
    }
  });

  // Generate improvement insights (significant progress)
  scores.forEach(cat => {
    const prev = previousMap.get(cat.category);
    if (prev && cat.score - prev.score >= 5) {
      const style = getCategoryStyle(cat.category);
      insights.push({
        id: `improvement-${cat.category}`,
        type: 'improvement',
        category: cat.category,
        title: `${style.label} en progression`,
        description: `+${(cat.score - prev.score).toFixed(1)} points depuis la dernière analyse`,
        value: cat.score,
        previousValue: prev.score,
        priority: cat.score - prev.score >= 10 ? 'high' : 'medium',
      });
    }
  });

  // Generate warning insights (significant regression)
  scores.forEach(cat => {
    const prev = previousMap.get(cat.category);
    if (prev && prev.score - cat.score >= 5) {
      const style = getCategoryStyle(cat.category);
      insights.push({
        id: `warning-${cat.category}`,
        type: 'warning',
        category: cat.category,
        title: `${style.label} en baisse`,
        description: `${(prev.score - cat.score).toFixed(1)} points perdus depuis la dernière analyse`,
        value: cat.score,
        previousValue: prev.score,
        priority: prev.score - cat.score >= 10 ? 'high' : 'medium',
        actionable: `Revoir vos habitudes de jeu concernant ${style.label.toLowerCase()}`,
      });
    }
  });

  // Generate benchmark insights (above/below rank average)
  scores.forEach(cat => {
    const benchmark = benchmarkMap.get(cat.category);
    if (benchmark) {
      const diff = cat.score - benchmark.score;
      const style = getCategoryStyle(cat.category);

      if (diff >= 10) {
        insights.push({
          id: `above-benchmark-${cat.category}`,
          type: 'achievement',
          category: cat.category,
          title: `${style.label} au-dessus de la moyenne`,
          description: `+${diff.toFixed(0)} points au-dessus de votre rang`,
          value: cat.score,
          targetValue: benchmark.score,
          priority: 'medium',
        });
      } else if (diff <= -10) {
        insights.push({
          id: `below-benchmark-${cat.category}`,
          type: 'weakness',
          category: cat.category,
          title: `${style.label} sous la moyenne`,
          description: `${Math.abs(diff).toFixed(0)} points sous la moyenne de votre rang`,
          value: cat.score,
          targetValue: benchmark.score,
          priority: 'high',
          actionable: `Travaillez votre ${style.label.toLowerCase()} pour atteindre le niveau de votre rang`,
        });
      }
    }
  });

  // Sort by priority and type
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const typeOrder = { warning: 0, weakness: 1, improvement: 2, achievement: 3, strength: 4 };

  return insights.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

// Insight type config
const INSIGHT_CONFIG = {
  strength: {
    icon: Award,
    color: '#22c55e',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Point fort',
  },
  weakness: {
    icon: AlertTriangle,
    color: '#ef4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'À améliorer',
  },
  improvement: {
    icon: TrendingUp,
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Progression',
  },
  warning: {
    icon: AlertCircle,
    color: '#f97316',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'Attention',
  },
  achievement: {
    icon: CheckCircle,
    color: '#a855f7',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Réussite',
  },
};

// Insight Card Component
function InsightCard({
  insight,
  variant,
  showAction,
  onClick,
  onCategoryClick,
}: {
  insight: Insight;
  variant: 'full' | 'compact' | 'minimal';
  showAction?: boolean;
  onClick?: () => void;
  onCategoryClick?: () => void;
}) {
  const config = INSIGHT_CONFIG[insight.type];
  const categoryStyle = getCategoryStyle(insight.category);
  const Icon = config.icon;
  const CategoryIcon = getCategoryIcon(insight.category);

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
          config.bgColor,
          'hover:opacity-80'
        )}
        onClick={onClick}
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: config.color }} />
        <span className="text-sm text-white truncate">{insight.title}</span>
        {insight.value !== undefined && (
          <span className="text-xs text-gray-400 ml-auto">{insight.value.toFixed(0)}</span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'p-3 rounded-lg border cursor-pointer transition-all',
          config.bgColor,
          config.borderColor,
          'hover:scale-[1.02]'
        )}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-sm">{insight.title}</span>
              {insight.previousValue !== undefined && (
                <span className={cn(
                  'text-xs',
                  insight.value! > insight.previousValue ? 'text-green-400' : 'text-red-400'
                )}>
                  {insight.value! > insight.previousValue ? '+' : ''}
                  {(insight.value! - insight.previousValue).toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{insight.description}</p>
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all',
        config.bgColor,
        config.borderColor,
        onClick && 'cursor-pointer hover:scale-[1.01]'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">{insight.title}</span>
            <button
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick?.();
              }}
            >
              <CategoryIcon className="w-3 h-3" color={categoryStyle.color} />
              {categoryStyle.label}
            </button>
            <span
              className="px-1.5 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${config.color}20`,
                color: config.color,
              }}
            >
              {config.label}
            </span>
          </div>

          <p className="text-sm text-gray-400 mt-1">{insight.description}</p>

          {/* Value display */}
          {insight.value !== undefined && (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {insight.value.toFixed(0)}
                </span>
                {insight.previousValue !== undefined && (
                  <div className={cn(
                    'flex items-center gap-0.5 text-sm',
                    insight.value > insight.previousValue ? 'text-green-400' : 'text-red-400'
                  )}>
                    {insight.value > insight.previousValue ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    {Math.abs(insight.value - insight.previousValue).toFixed(1)}
                  </div>
                )}
              </div>

              {insight.targetValue !== undefined && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Target className="w-4 h-4" />
                  <span>Objectif: {insight.targetValue.toFixed(0)}</span>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          {showAction && insight.actionable && (
            <div className="mt-3 pt-3 border-t border-gray-700/50">
              <button className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                <Lightbulb className="w-4 h-4" />
                {insight.actionable}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Summary Stats Component
function SummaryStats({ scores, previousScores }: { scores: CategoryScore[]; previousScores?: CategoryScore[] }) {
  const stats = useMemo(() => {
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    const previousMap = new Map(previousScores?.map(s => [s.category, s]));

    let improvements = 0;
    let regressions = 0;

    scores.forEach(s => {
      const prev = previousMap.get(s.category);
      if (prev) {
        if (s.score > prev.score + 2) improvements++;
        if (s.score < prev.score - 2) regressions++;
      }
    });

    const strengths = scores.filter(s => s.score >= 70).length;
    const weaknesses = scores.filter(s => s.score < 50).length;

    return { avgScore, improvements, regressions, strengths, weaknesses };
  }, [scores, previousScores]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3 bg-gray-800/50 rounded-lg text-center">
        <div className="text-2xl font-bold text-white">{stats.avgScore.toFixed(0)}</div>
        <div className="text-xs text-gray-400">Score moyen</div>
      </div>
      <div className="p-3 bg-green-500/10 rounded-lg text-center">
        <div className="text-2xl font-bold text-green-400">{stats.strengths}</div>
        <div className="text-xs text-gray-400">Points forts</div>
      </div>
      <div className="p-3 bg-red-500/10 rounded-lg text-center">
        <div className="text-2xl font-bold text-red-400">{stats.weaknesses}</div>
        <div className="text-xs text-gray-400">À améliorer</div>
      </div>
      <div className="p-3 bg-blue-500/10 rounded-lg text-center">
        <div className="flex items-center justify-center gap-2">
          {stats.improvements > 0 && (
            <span className="text-green-400 flex items-center">
              <ArrowUp className="w-4 h-4" />{stats.improvements}
            </span>
          )}
          {stats.regressions > 0 && (
            <span className="text-red-400 flex items-center">
              <ArrowDown className="w-4 h-4" />{stats.regressions}
            </span>
          )}
          {stats.improvements === 0 && stats.regressions === 0 && (
            <span className="text-gray-400 flex items-center">
              <Minus className="w-4 h-4" />0
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400">Évolution</div>
      </div>
    </div>
  );
}

// Main Component
export function QuickInsights({
  scores,
  previousScores,
  benchmarkScores,
  playerRank,
  variant = 'full',
  maxInsights = 6,
  showActions = true,
  onInsightClick,
  onCategoryClick,
  className,
}: QuickInsightsProps) {
  const [showAll, setShowAll] = useState(false);

  const insights = useMemo(
    () => generateInsights(scores, previousScores, benchmarkScores),
    [scores, previousScores, benchmarkScores]
  );

  const displayedInsights = showAll ? insights : insights.slice(0, maxInsights);
  const hasMore = insights.length > maxInsights;

  if (variant === 'minimal') {
    return (
      <div className={cn('space-y-2', className)}>
        {displayedInsights.slice(0, 4).map(insight => (
          <InsightCard
            key={insight.id}
            insight={insight}
            variant="minimal"
            onClick={() => onInsightClick?.(insight)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-white">Insights rapides</h3>
          {playerRank && (
            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
              {playerRank}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">{insights.length} insights</span>
      </div>

      {/* Summary stats (full variant only) */}
      {variant === 'full' && (
        <SummaryStats scores={scores} previousScores={previousScores} />
      )}

      {/* Insights list */}
      <div className={cn(
        'space-y-3',
        variant === 'compact' && 'grid grid-cols-1 sm:grid-cols-2 gap-3 space-y-0'
      )}>
        {displayedInsights.map(insight => (
          <InsightCard
            key={insight.id}
            insight={insight}
            variant={variant}
            showAction={showActions}
            onClick={() => onInsightClick?.(insight)}
            onCategoryClick={() => onCategoryClick?.(insight.category)}
          />
        ))}
      </div>

      {/* Show more button */}
      {hasMore && !showAll && (
        <button
          className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
          onClick={() => setShowAll(true)}
        >
          Voir {insights.length - maxInsights} insights de plus
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* No insights fallback */}
      {insights.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Pas assez de données pour générer des insights</p>
        </div>
      )}
    </div>
  );
}

// Export types
export type { QuickInsightsProps };
