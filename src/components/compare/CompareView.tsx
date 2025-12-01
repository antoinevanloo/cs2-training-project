'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getCategoryStyle, CATEGORY_STYLES, CATEGORY_ORDER } from '@/lib/design/tokens';
import { getCategoryIcon } from '@/lib/design/icons';
import { ANALYSIS_CATEGORIES, type AnalysisCategory } from '@/lib/preferences/types';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  GitCompare,
  Calendar,
  Trophy,
  User,
  Users,
  ChevronDown,
  Filter,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

// Types
export interface CompareData {
  id: string;
  label: string;
  type: 'match' | 'average' | 'benchmark' | 'pro';
  date?: Date;
  scores: Record<AnalysisCategory, number>;
  metrics?: Record<string, number>;
  color?: string;
}

interface CompareViewProps {
  primary: CompareData;
  secondary: CompareData;
  tertiary?: CompareData;
  variant?: 'side-by-side' | 'overlay' | 'table' | 'radar';
  showDiff?: boolean;
  showChart?: boolean;
  highlightThreshold?: number;
  onCategoryClick?: (category: AnalysisCategory) => void;
  className?: string;
}

// Color palette for comparison
const COMPARE_COLORS = {
  primary: '#3b82f6',
  secondary: '#22c55e',
  tertiary: '#f97316',
};

// Helper functions
function getDiff(a: number, b: number): { value: number; percent: number } {
  return {
    value: a - b,
    percent: b !== 0 ? ((a - b) / b) * 100 : 0,
  };
}

function DiffIndicator({
  diff,
  threshold = 3,
  showPercent = false,
}: {
  diff: { value: number; percent: number };
  threshold?: number;
  showPercent?: boolean;
}) {
  const isSignificant = Math.abs(diff.value) >= threshold;
  const isPositive = diff.value > 0;
  const isNegative = diff.value < 0;

  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-sm font-medium',
        isSignificant && isPositive && 'text-green-400',
        isSignificant && isNegative && 'text-red-400',
        !isSignificant && 'text-gray-500'
      )}
    >
      {isPositive ? (
        <ArrowUp className="w-4 h-4" />
      ) : isNegative ? (
        <ArrowDown className="w-4 h-4" />
      ) : (
        <Minus className="w-4 h-4" />
      )}
      {showPercent
        ? `${diff.percent >= 0 ? '+' : ''}${diff.percent.toFixed(1)}%`
        : `${diff.value >= 0 ? '+' : ''}${diff.value.toFixed(1)}`}
    </span>
  );
}

// Category comparison row
function CategoryRow({
  category,
  primary,
  secondary,
  tertiary,
  showDiff,
  highlightThreshold,
  onClick,
}: {
  category: AnalysisCategory;
  primary: number;
  secondary: number;
  tertiary?: number;
  showDiff: boolean;
  highlightThreshold: number;
  onClick?: () => void;
}) {
  const style = getCategoryStyle(category);
  const Icon = getCategoryIcon(category);
  const diff = getDiff(primary, secondary);
  const isSignificant = Math.abs(diff.value) >= highlightThreshold;

  return (
    <div
      className={cn(
        'grid gap-4 p-3 rounded-lg transition-colors',
        isSignificant && diff.value > 0 && 'bg-green-500/5',
        isSignificant && diff.value < 0 && 'bg-red-500/5',
        onClick && 'cursor-pointer hover:bg-gray-800/50'
      )}
      style={{
        gridTemplateColumns: tertiary ? '1fr auto auto auto auto' : '1fr auto auto auto',
      }}
      onClick={onClick}
    >
      {/* Category */}
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" color={style.color} />
        <span className="text-white font-medium">{style.label}</span>
      </div>

      {/* Primary score */}
      <div className="text-right">
        <span
          className="text-lg font-bold"
          style={{ color: COMPARE_COLORS.primary }}
        >
          {primary.toFixed(0)}
        </span>
      </div>

      {/* Secondary score */}
      <div className="text-right">
        <span
          className="text-lg font-bold"
          style={{ color: COMPARE_COLORS.secondary }}
        >
          {secondary.toFixed(0)}
        </span>
      </div>

      {/* Tertiary score */}
      {tertiary !== undefined && (
        <div className="text-right">
          <span
            className="text-lg font-bold"
            style={{ color: COMPARE_COLORS.tertiary }}
          >
            {tertiary.toFixed(0)}
          </span>
        </div>
      )}

      {/* Diff */}
      {showDiff && (
        <div className="text-right min-w-[60px]">
          <DiffIndicator diff={diff} threshold={highlightThreshold} />
        </div>
      )}
    </div>
  );
}

// Side by side comparison
function SideBySideView({
  primary,
  secondary,
  tertiary,
  showDiff,
  highlightThreshold,
  onCategoryClick,
}: {
  primary: CompareData;
  secondary: CompareData;
  tertiary?: CompareData;
  showDiff: boolean;
  highlightThreshold: number;
  onCategoryClick?: (category: AnalysisCategory) => void;
}) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div
        className="grid gap-4 px-3 py-2 text-sm text-gray-500"
        style={{
          gridTemplateColumns: tertiary ? '1fr auto auto auto auto' : '1fr auto auto auto',
        }}
      >
        <div>Catégorie</div>
        <div className="text-right" style={{ color: primary.color || COMPARE_COLORS.primary }}>
          {primary.label}
        </div>
        <div className="text-right" style={{ color: secondary.color || COMPARE_COLORS.secondary }}>
          {secondary.label}
        </div>
        {tertiary && (
          <div className="text-right" style={{ color: tertiary.color || COMPARE_COLORS.tertiary }}>
            {tertiary.label}
          </div>
        )}
        {showDiff && <div className="text-right">Diff</div>}
      </div>

      {/* Category rows */}
      {ANALYSIS_CATEGORIES.map(category => (
        <CategoryRow
          key={category}
          category={category}
          primary={primary.scores[category]}
          secondary={secondary.scores[category]}
          tertiary={tertiary?.scores[category]}
          showDiff={showDiff}
          highlightThreshold={highlightThreshold}
          onClick={() => onCategoryClick?.(category)}
        />
      ))}

      {/* Average row */}
      <div
        className="grid gap-4 p-3 mt-2 border-t border-gray-700"
        style={{
          gridTemplateColumns: tertiary ? '1fr auto auto auto auto' : '1fr auto auto auto',
        }}
      >
        <div className="flex items-center gap-2 font-semibold text-white">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          Score moyen
        </div>
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: primary.color || COMPARE_COLORS.primary }}>
            {(Object.values(primary.scores).reduce((a, b) => a + b, 0) / ANALYSIS_CATEGORIES.length).toFixed(0)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: secondary.color || COMPARE_COLORS.secondary }}>
            {(Object.values(secondary.scores).reduce((a, b) => a + b, 0) / ANALYSIS_CATEGORIES.length).toFixed(0)}
          </span>
        </div>
        {tertiary && (
          <div className="text-right">
            <span className="text-lg font-bold" style={{ color: tertiary.color || COMPARE_COLORS.tertiary }}>
              {(Object.values(tertiary.scores).reduce((a, b) => a + b, 0) / ANALYSIS_CATEGORIES.length).toFixed(0)}
            </span>
          </div>
        )}
        {showDiff && (
          <div className="text-right min-w-[60px]">
            <DiffIndicator
              diff={getDiff(
                Object.values(primary.scores).reduce((a, b) => a + b, 0) / ANALYSIS_CATEGORIES.length,
                Object.values(secondary.scores).reduce((a, b) => a + b, 0) / ANALYSIS_CATEGORIES.length
              )}
              threshold={highlightThreshold}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Overlay bar chart
function OverlayChart({
  primary,
  secondary,
  tertiary,
}: {
  primary: CompareData;
  secondary: CompareData;
  tertiary?: CompareData;
}) {
  const data = ANALYSIS_CATEGORIES.map(category => {
    const style = getCategoryStyle(category);
    return {
      category: style.label,
      [primary.label]: primary.scores[category],
      [secondary.label]: secondary.scores[category],
      ...(tertiary && { [tertiary.label]: tertiary.scores[category] }),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="category"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar
          dataKey={primary.label}
          fill={primary.color || COMPARE_COLORS.primary}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey={secondary.label}
          fill={secondary.color || COMPARE_COLORS.secondary}
          radius={[4, 4, 0, 0]}
        />
        {tertiary && (
          <Bar
            dataKey={tertiary.label}
            fill={tertiary.color || COMPARE_COLORS.tertiary}
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Radar overlay chart
function RadarOverlay({
  primary,
  secondary,
  tertiary,
}: {
  primary: CompareData;
  secondary: CompareData;
  tertiary?: CompareData;
}) {
  const data = ANALYSIS_CATEGORIES.map(category => {
    const style = getCategoryStyle(category);
    return {
      category: style.label,
      [primary.label]: primary.scores[category],
      [secondary.label]: secondary.scores[category],
      ...(tertiary && { [tertiary.label]: tertiary.scores[category] }),
      fullMark: 100,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name={primary.label}
          dataKey={primary.label}
          stroke={primary.color || COMPARE_COLORS.primary}
          fill={primary.color || COMPARE_COLORS.primary}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar
          name={secondary.label}
          dataKey={secondary.label}
          stroke={secondary.color || COMPARE_COLORS.secondary}
          fill={secondary.color || COMPARE_COLORS.secondary}
          fillOpacity={0.2}
          strokeWidth={2}
        />
        {tertiary && (
          <Radar
            name={tertiary.label}
            dataKey={tertiary.label}
            stroke={tertiary.color || COMPARE_COLORS.tertiary}
            fill={tertiary.color || COMPARE_COLORS.tertiary}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        )}
        <Legend />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Summary cards
function SummaryCards({
  primary,
  secondary,
}: {
  primary: CompareData;
  secondary: CompareData;
}) {
  const stats = useMemo(() => {
    let better = 0;
    let worse = 0;
    let same = 0;
    let totalDiff = 0;

    ANALYSIS_CATEGORIES.forEach(cat => {
      const diff = primary.scores[cat] - secondary.scores[cat];
      totalDiff += diff;
      if (diff > 3) better++;
      else if (diff < -3) worse++;
      else same++;
    });

    const avgDiff = totalDiff / ANALYSIS_CATEGORIES.length;
    const primaryAvg = Object.values(primary.scores).reduce((a, b) => a + b, 0) / ANALYSIS_CATEGORIES.length;
    const secondaryAvg = Object.values(secondary.scores).reduce((a, b) => a + b, 0) / ANALYSIS_CATEGORIES.length;

    return { better, worse, same, avgDiff, primaryAvg, secondaryAvg };
  }, [primary, secondary]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3 bg-gray-800/50 rounded-lg text-center">
        <div className="text-sm text-gray-400 mb-1">Score moyen</div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl font-bold" style={{ color: COMPARE_COLORS.primary }}>
            {stats.primaryAvg.toFixed(0)}
          </span>
          <span className="text-gray-500">vs</span>
          <span className="text-xl font-bold" style={{ color: COMPARE_COLORS.secondary }}>
            {stats.secondaryAvg.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="p-3 bg-green-500/10 rounded-lg text-center">
        <div className="text-sm text-gray-400 mb-1">Supérieur</div>
        <div className="text-2xl font-bold text-green-400">{stats.better}</div>
        <div className="text-xs text-gray-500">catégories</div>
      </div>

      <div className="p-3 bg-red-500/10 rounded-lg text-center">
        <div className="text-sm text-gray-400 mb-1">Inférieur</div>
        <div className="text-2xl font-bold text-red-400">{stats.worse}</div>
        <div className="text-xs text-gray-500">catégories</div>
      </div>

      <div className="p-3 bg-gray-800/50 rounded-lg text-center">
        <div className="text-sm text-gray-400 mb-1">Diff. moyenne</div>
        <DiffIndicator
          diff={{ value: stats.avgDiff, percent: 0 }}
          threshold={3}
        />
      </div>
    </div>
  );
}

// Main component
export function CompareView({
  primary,
  secondary,
  tertiary,
  variant = 'side-by-side',
  showDiff = true,
  showChart = true,
  highlightThreshold = 5,
  onCategoryClick,
  className,
}: CompareViewProps) {
  const [activeView, setActiveView] = useState<'table' | 'bar' | 'radar'>(
    variant === 'radar' ? 'radar' : variant === 'overlay' ? 'bar' : 'table'
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Comparaison</h3>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            className={cn(
              'px-3 py-1.5 rounded text-sm transition-colors',
              activeView === 'table'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveView('table')}
          >
            Tableau
          </button>
          <button
            className={cn(
              'px-3 py-1.5 rounded text-sm transition-colors',
              activeView === 'bar'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveView('bar')}
          >
            Barres
          </button>
          <button
            className={cn(
              'px-3 py-1.5 rounded text-sm transition-colors',
              activeView === 'radar'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveView('radar')}
          >
            Radar
          </button>
        </div>
      </div>

      {/* Data labels */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: primary.color || COMPARE_COLORS.primary }}
          />
          <span className="text-sm text-white">{primary.label}</span>
          {primary.date && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {primary.date.toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: secondary.color || COMPARE_COLORS.secondary }}
          />
          <span className="text-sm text-white">{secondary.label}</span>
          {secondary.date && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {secondary.date.toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>

        {tertiary && (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tertiary.color || COMPARE_COLORS.tertiary }}
            />
            <span className="text-sm text-white">{tertiary.label}</span>
            {tertiary.date && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {tertiary.date.toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <SummaryCards primary={primary} secondary={secondary} />

      {/* Main comparison view */}
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
        {activeView === 'table' && (
          <SideBySideView
            primary={primary}
            secondary={secondary}
            tertiary={tertiary}
            showDiff={showDiff}
            highlightThreshold={highlightThreshold}
            onCategoryClick={onCategoryClick}
          />
        )}

        {activeView === 'bar' && (
          <OverlayChart primary={primary} secondary={secondary} tertiary={tertiary} />
        )}

        {activeView === 'radar' && (
          <RadarOverlay primary={primary} secondary={secondary} tertiary={tertiary} />
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 text-center">
        Les différences de ±{highlightThreshold} points ou plus sont mises en évidence
      </div>
    </div>
  );
}

// Export types
export type { CompareViewProps };
