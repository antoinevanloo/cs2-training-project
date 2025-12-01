'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  Lightbulb,
  Zap,
  RefreshCw,
  ChevronRight,
  Flame,
  Award,
  Clock
} from 'lucide-react';
import { getCategoryStyle, getScoreColor } from '@/lib/design/tokens';
import type { AnalysisCategory } from '@/lib/preferences/types';
import { cn } from '@/lib/utils';

// Types
interface QuickInsight {
  id: string;
  type: 'focus' | 'quick_win' | 'trend_alert' | 'personal_best' | 'streak' | 'tip';
  title: string;
  description: string;
  category?: AnalysisCategory;
  value?: number;
  previousValue?: number;
  targetValue?: number;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  priority: 'high' | 'medium' | 'low';
  timestamp?: Date;
}

interface QuickInsightsProps {
  userId?: string;
  insights?: QuickInsight[];
  onRefresh?: () => void;
  onInsightClick?: (insight: QuickInsight) => void;
  maxItems?: number;
  variant?: 'full' | 'compact' | 'widget';
  className?: string;
}

// Insight type configurations
const INSIGHT_CONFIGS = {
  focus: {
    icon: Target,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: "Focus du jour",
  },
  quick_win: {
    icon: Zap,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Quick Win',
  },
  trend_alert: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'Alerte Tendance',
  },
  personal_best: {
    icon: Trophy,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Record Personnel',
  },
  streak: {
    icon: Flame,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Série en cours',
  },
  tip: {
    icon: Lightbulb,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Conseil',
  },
};

// Single Insight Card
function InsightCard({
  insight,
  onClick,
  variant = 'full'
}: {
  insight: QuickInsight;
  onClick?: () => void;
  variant?: 'full' | 'compact' | 'widget';
}) {
  const config = INSIGHT_CONFIGS[insight.type];
  const Icon = config.icon;
  const categoryStyle = insight.category ? getCategoryStyle(insight.category) : null;

  const isCompact = variant === 'compact' || variant === 'widget';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:scale-[1.02]',
        config.bgColor,
        config.borderColor,
        'border',
        isCompact ? 'p-3' : 'p-4'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'p-2 rounded-lg',
          config.bgColor
        )}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type label */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium', config.color)}>
              {config.label}
            </span>
            {insight.category && categoryStyle && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${categoryStyle.color}20`,
                  color: categoryStyle.color
                }}
              >
                {categoryStyle.label}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-white font-medium text-sm mb-1 truncate">
            {insight.title}
          </h4>

          {/* Description */}
          {!isCompact && (
            <p className="text-gray-400 text-xs line-clamp-2">
              {insight.description}
            </p>
          )}

          {/* Value display */}
          {insight.value !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-lg font-bold"
                style={{ color: getScoreColor(insight.value) }}
              >
                {insight.value.toFixed(1)}
              </span>
              {insight.previousValue !== undefined && (
                <span className={cn(
                  'text-xs flex items-center gap-0.5',
                  insight.value > insight.previousValue ? 'text-green-400' : 'text-red-400'
                )}>
                  {insight.value > insight.previousValue ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(insight.value - insight.previousValue).toFixed(1)}
                </span>
              )}
              {insight.targetValue !== undefined && (
                <span className="text-xs text-gray-500">
                  / {insight.targetValue.toFixed(1)}
                </span>
              )}
            </div>
          )}

          {/* Action button */}
          {insight.action && !isCompact && (
            <Button
              variant="ghost"
              size="sm"
              className={cn('mt-2 p-0 h-auto', config.color)}
              onClick={(e) => {
                e.stopPropagation();
                insight.action?.onClick?.();
              }}
            >
              {insight.action.label}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        {/* Priority indicator */}
        {insight.priority === 'high' && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>
    </Card>
  );
}

// Today's Focus Card (Special)
function TodaysFocusCard({
  insight,
  onStartTraining
}: {
  insight: QuickInsight;
  onStartTraining?: () => void;
}) {
  const categoryStyle = insight.category ? getCategoryStyle(insight.category) : null;

  return (
    <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 font-semibold">Focus du jour</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {categoryStyle && (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${categoryStyle.color}20` }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: categoryStyle.color }}
              >
                {insight.value?.toFixed(0) || '?'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-white text-lg font-bold mb-1">
              {insight.title}
            </h3>
            <p className="text-gray-400 text-sm">
              {insight.description}
            </p>
          </div>
        </div>

        {/* Progress to target */}
        {insight.targetValue && insight.value && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progression</span>
              <span>{Math.round((insight.value / insight.targetValue) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((insight.value / insight.targetValue) * 100, 100)}%`,
                  backgroundColor: categoryStyle?.color || '#3b82f6'
                }}
              />
            </div>
          </div>
        )}

        <Button
          className="w-full gap-2"
          onClick={onStartTraining}
        >
          <Zap className="w-4 h-4" />
          Commencer l'entraînement
        </Button>
      </CardContent>
    </Card>
  );
}

// Main QuickInsights Component
export function QuickInsights({
  insights = [],
  onRefresh,
  onInsightClick,
  maxItems = 5,
  variant = 'full',
  className,
}: QuickInsightsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedInsights, setDisplayedInsights] = useState<QuickInsight[]>([]);

  useEffect(() => {
    // Sort by priority and limit
    const sorted = [...insights]
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, maxItems);
    setDisplayedInsights(sorted);
  }, [insights, maxItems]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Find today's focus
  const todaysFocus = displayedInsights.find(i => i.type === 'focus');
  const otherInsights = displayedInsights.filter(i => i.type !== 'focus');

  if (variant === 'widget') {
    return (
      <div className={cn('space-y-3', className)}>
        {displayedInsights.slice(0, 3).map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            variant="widget"
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
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">Insights Rapides</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn(
            'w-4 h-4',
            isRefreshing && 'animate-spin'
          )} />
        </Button>
      </div>

      {/* Today's Focus (if exists) */}
      {todaysFocus && variant === 'full' && (
        <TodaysFocusCard
          insight={todaysFocus}
          onStartTraining={() => onInsightClick?.(todaysFocus)}
        />
      )}

      {/* Other insights grid */}
      <div className={cn(
        'grid gap-3',
        variant === 'full' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
      )}>
        {otherInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            variant={variant}
            onClick={() => onInsightClick?.(insight)}
          />
        ))}
      </div>

      {/* Empty state */}
      {displayedInsights.length === 0 && (
        <Card className="p-8 text-center">
          <Award className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">
            Jouez quelques parties pour obtenir des insights personnalisés !
          </p>
        </Card>
      )}
    </div>
  );
}

// Hook to generate insights from user data
export function useQuickInsights(userId: string) {
  const [insights, setInsights] = useState<QuickInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/insights`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchInsights();
    }
  }, [userId]);

  return { insights, loading, refresh: fetchInsights };
}

// Export components
export { InsightCard, TodaysFocusCard };