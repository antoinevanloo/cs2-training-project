'use client';

import { ReactNode, useState } from 'react';
import { RankUpIcon, CrosshairIcon } from '@/components/ui/icons/CS2Icons';

// Types pour les insights
interface InsightCardProps {
  type: 'improvement' | 'strength' | 'warning' | 'tip' | 'achievement';
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string | number;
    target?: string | number;
    unit?: string;
  };
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  priority?: 'high' | 'medium' | 'low';
  expandable?: boolean;
  expandedContent?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const TYPE_STYLES = {
  improvement: {
    bg: 'from-red-500/10 to-transparent',
    border: 'border-red-500/30',
    accent: 'text-red-400',
    icon: '📈',
    label: 'À améliorer',
  },
  strength: {
    bg: 'from-green-500/10 to-transparent',
    border: 'border-green-500/30',
    accent: 'text-green-400',
    icon: '💪',
    label: 'Point fort',
  },
  warning: {
    bg: 'from-yellow-500/10 to-transparent',
    border: 'border-yellow-500/30',
    accent: 'text-yellow-400',
    icon: '⚠️',
    label: 'Attention',
  },
  tip: {
    bg: 'from-blue-500/10 to-transparent',
    border: 'border-blue-500/30',
    accent: 'text-blue-400',
    icon: '💡',
    label: 'Conseil',
  },
  achievement: {
    bg: 'from-purple-500/10 to-transparent',
    border: 'border-purple-500/30',
    accent: 'text-purple-400',
    icon: '🏆',
    label: 'Achievement',
  },
};

const PRIORITY_INDICATORS = {
  high: { color: 'bg-red-500', pulse: true },
  medium: { color: 'bg-yellow-500', pulse: false },
  low: { color: 'bg-gray-500', pulse: false },
};

export function InsightCard({
  type,
  title,
  description,
  metric,
  action,
  priority,
  expandable = false,
  expandedContent,
  icon,
  className = '',
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = TYPE_STYLES[type];
  const priorityStyle = priority ? PRIORITY_INDICATORS[priority] : null;

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden
        bg-gradient-to-br ${styles.bg}
        border ${styles.border}
        transition-all duration-300
        hover:shadow-card-hover
        ${className}
      `}
    >
      {/* Priority indicator */}
      {priorityStyle && (
        <div className="absolute top-0 left-0 right-0 h-1">
          <div
            className={`h-full ${priorityStyle.color} ${priorityStyle.pulse ? 'animate-pulse' : ''}`}
          />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`text-2xl ${styles.accent}`}>
            {icon || styles.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Type label */}
            <span className={`text-xs font-medium ${styles.accent} uppercase tracking-wider`}>
              {styles.label}
            </span>

            {/* Title */}
            <h4 className="text-white font-semibold mt-0.5 leading-tight">
              {title}
            </h4>

            {/* Description */}
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {/* Metric */}
        {metric && (
          <div className="mt-4 p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{metric.label}</span>
              {metric.target && (
                <span className="text-xs text-gray-500">
                  Objectif: {metric.target}{metric.unit}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white">
                {metric.value}
              </span>
              {metric.unit && (
                <span className="text-sm text-gray-400">{metric.unit}</span>
              )}
            </div>
            {metric.target && (
              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    Number(metric.value) >= Number(metric.target)
                      ? 'bg-green-500'
                      : 'bg-cs2-accent'
                  }`}
                  style={{
                    width: `${Math.min(100, (Number(metric.value) / Number(metric.target)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Expandable content */}
        {expandable && expandedContent && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>{isExpanded ? 'Voir moins' : 'Voir plus'}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-700/50 animate-fade-in">
                {expandedContent}
              </div>
            )}
          </>
        )}

        {/* Action button */}
        {action && (
          <div className="mt-4">
            {action.href ? (
              <a
                href={action.href}
                className={`
                  inline-flex items-center gap-2
                  px-4 py-2 rounded-lg
                  bg-gradient-to-r from-cs2-accent to-cs2-accent-light
                  text-white text-sm font-medium
                  hover:shadow-glow-sm transition-all
                `}
              >
                <RankUpIcon size={16} />
                {action.label}
              </a>
            ) : (
              <button
                onClick={action.onClick}
                className={`
                  inline-flex items-center gap-2
                  px-4 py-2 rounded-lg
                  bg-gray-800 hover:bg-gray-700
                  text-white text-sm font-medium
                  border border-gray-700
                  transition-all
                `}
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Insight - Version compacte pour les listes
interface QuickInsightProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function QuickInsight({ icon, label, value, trend, className = '' }: QuickInsightProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 ${className}`}>
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{value}</span>
          {trend && trend !== 'neutral' && (
            <span className={trend === 'up' ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Insight Summary - Vue résumée de toutes les insights
interface InsightSummaryProps {
  improvements: number;
  strengths: number;
  warnings: number;
  tips: number;
  topPriority?: {
    title: string;
    type: InsightCardProps['type'];
  };
  className?: string;
}

export function InsightSummary({
  improvements,
  strengths,
  warnings,
  tips,
  topPriority,
  className = '',
}: InsightSummaryProps) {
  return (
    <div className={`p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 ${className}`}>
      <h4 className="text-sm font-medium text-gray-400 mb-3">Résumé des insights</h4>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{improvements}</div>
          <div className="text-xs text-gray-500">À améliorer</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{strengths}</div>
          <div className="text-xs text-gray-500">Points forts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{warnings}</div>
          <div className="text-xs text-gray-500">Attention</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{tips}</div>
          <div className="text-xs text-gray-500">Conseils</div>
        </div>
      </div>

      {topPriority && (
        <div className="p-3 rounded-lg bg-gray-900/50 border-l-2 border-cs2-accent">
          <span className="text-xs text-cs2-accent font-medium">Priorité #1</span>
          <p className="text-sm text-white mt-0.5">{topPriority.title}</p>
        </div>
      )}
    </div>
  );
}

// Category Insight - Insight pour une catégorie spécifique
interface CategoryInsightProps {
  category: string;
  score: number;
  maxScore?: number;
  trend?: 'up' | 'down' | 'stable';
  insights: {
    type: 'good' | 'bad' | 'neutral';
    text: string;
  }[];
  icon?: ReactNode;
  color?: string;
  className?: string;
}

export function CategoryInsight({
  category,
  score,
  maxScore = 100,
  trend,
  insights,
  icon,
  color = 'cs2-accent',
  className = '',
}: CategoryInsightProps) {
  const percentage = (score / maxScore) * 100;
  const scoreColor =
    percentage >= 80 ? 'text-green-400' :
    percentage >= 60 ? 'text-yellow-400' :
    percentage >= 40 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className={`p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className={`text-${color}`}>{icon}</span>}
          <span className="font-medium text-white">{category}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
          {trend && (
            <span className={
              trend === 'up' ? 'text-green-400' :
              trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
          )}
        </div>
      </div>

      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full bg-gradient-to-r from-${color} to-${color}-light rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {insights.slice(0, 3).map((insight, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={
              insight.type === 'good' ? 'text-green-400' :
              insight.type === 'bad' ? 'text-red-400' : 'text-gray-400'
            }>
              {insight.type === 'good' ? '✓' : insight.type === 'bad' ? '✕' : '•'}
            </span>
            <span className="text-xs text-gray-400">{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Actionable Insight - Insight avec action concrète
interface ActionableInsightProps {
  title: string;
  problem: string;
  solution: string;
  exercise?: {
    name: string;
    workshopId?: string;
    duration: string;
  };
  impact: 'high' | 'medium' | 'low';
  className?: string;
}

export function ActionableInsight({
  title,
  problem,
  solution,
  exercise,
  impact,
  className = '',
}: ActionableInsightProps) {
  const impactColors = {
    high: 'border-red-500/50 bg-red-500/5',
    medium: 'border-yellow-500/50 bg-yellow-500/5',
    low: 'border-gray-500/50 bg-gray-500/5',
  };

  return (
    <div className={`rounded-xl overflow-hidden ${impactColors[impact]} border ${className}`}>
      {/* Impact banner */}
      <div className={`px-4 py-2 ${
        impact === 'high' ? 'bg-red-500/20' :
        impact === 'medium' ? 'bg-yellow-500/20' : 'bg-gray-500/20'
      }`}>
        <span className="text-xs font-medium uppercase tracking-wider text-white">
          Impact {impact === 'high' ? 'élevé' : impact === 'medium' ? 'moyen' : 'faible'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <h4 className="font-semibold text-white">{title}</h4>

        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="text-red-400 text-sm">❌</span>
            <p className="text-sm text-gray-400">{problem}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-green-400 text-sm">✅</span>
            <p className="text-sm text-gray-300">{solution}</p>
          </div>
        </div>

        {exercise && (
          <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CrosshairIcon size={16} className="text-cs2-accent" />
                <span className="text-sm font-medium text-white">{exercise.name}</span>
              </div>
              <span className="text-xs text-gray-500">{exercise.duration}</span>
            </div>
            {exercise.workshopId && (
              <a
                href={`steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=${exercise.workshopId}`}
                className="mt-2 inline-flex items-center gap-1 text-xs text-cs2-accent hover:text-cs2-accent-light transition-colors"
              >
                Ouvrir dans Steam →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
