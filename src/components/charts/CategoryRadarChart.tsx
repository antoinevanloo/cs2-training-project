'use client';

import { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { AnalysisCategory } from '@/lib/preferences/types';
import {
  CATEGORY_STYLES,
  CATEGORY_ORDER,
  getCategoryLabel,
  getScoreColor,
} from '@/lib/design/tokens';

// Types pour les scores des 9 catégories
interface CategoryScores {
  aim?: number;
  positioning?: number;
  utility?: number;
  economy?: number;
  timing?: number;
  decision?: number;
  movement?: number;
  awareness?: number;
  teamplay?: number;
}

interface ComparisonData {
  label: string;
  scores: CategoryScores;
  color: string;
  strokeDasharray?: string;
  fillOpacity?: number;
}

interface CategoryRadarChartProps {
  scores: CategoryScores;
  comparison?: ComparisonData[];
  comparisonScores?: CategoryScores; // Legacy prop for simple comparison
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showGlow?: boolean;
  animated?: boolean;
  language?: 'fr' | 'en';
  playerColor?: string;
  playerLabel?: string;
  className?: string;
  /** Catégories à afficher (toutes si non spécifié) - FILTER mode */
  enabledCategories?: AnalysisCategory[];
  /** Catégories désactivées (grisées mais visibles) - GRAY OUT mode */
  disabledCategories?: AnalysisCategory[];
  onCategoryClick?: (category: AnalysisCategory) => void;
}

// Configuration par défaut des 9 catégories
const DEFAULT_CATEGORY_CONFIG = CATEGORY_ORDER.map((key, index) => ({
  key,
  angle: (360 / 9) * index - 90, // Commence en haut (-90°)
}));

// Helper pour créer une config filtrée avec angles recalculés
function createFilteredConfig(enabledCategories?: AnalysisCategory[]) {
  const categories = enabledCategories && enabledCategories.length > 0
    ? CATEGORY_ORDER.filter(cat => enabledCategories.includes(cat))
    : CATEGORY_ORDER;

  const count = categories.length;
  return categories.map((key, index) => ({
    key,
    angle: (360 / count) * index - 90, // Angles recalculés selon le nombre de catégories
  }));
}

// Helpers géométriques
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getPolygonPoints(
  scores: CategoryScores,
  center: number,
  maxRadius: number,
  categoryConfig: { key: string; angle: number }[]
): string {
  return categoryConfig.map((cat) => {
    const score = scores[cat.key as keyof CategoryScores] || 0;
    const radius = (score / 100) * maxRadius;
    const point = polarToCartesian(center, center, radius, cat.angle);
    return `${point.x},${point.y}`;
  }).join(' ');
}

function getPolygonPath(
  scores: CategoryScores,
  center: number,
  maxRadius: number,
  categoryConfig: { key: string; angle: number }[]
): string {
  const points = categoryConfig.map((cat, index) => {
    const score = scores[cat.key as keyof CategoryScores] || 0;
    const radius = (score / 100) * maxRadius;
    const point = polarToCartesian(center, center, radius, cat.angle);
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  });
  return points.join(' ') + ' Z';
}

export function CategoryRadarChart({
  scores,
  comparison = [],
  comparisonScores,
  size = 300,
  showLabels = true,
  showValues = true,
  showLegend = true,
  showGrid = true,
  showGlow = true,
  animated = true,
  language = 'fr',
  playerColor = '#f97316',
  playerLabel = 'Toi',
  className = '',
  enabledCategories,
  disabledCategories = [],
  onCategoryClick,
}: CategoryRadarChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<AnalysisCategory | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    category: AnalysisCategory;
    score: number;
  } | null>(null);

  const center = size / 2;
  const maxRadius = size / 2 - (showLabels ? 45 : 15);

  // Configuration des catégories (filtrées si enabledCategories est fourni)
  const categoryConfig = useMemo(
    () => createFilteredConfig(enabledCategories),
    [enabledCategories]
  );

  // Helper pour vérifier si une catégorie est désactivée
  const isCategoryDisabled = useCallback((categoryKey: string) => {
    return disabledCategories.includes(categoryKey as AnalysisCategory);
  }, [disabledCategories]);

  // Gestion du legacy comparisonScores prop
  const allComparisons = useMemo(() => {
    if (comparisonScores) {
      return [
        ...comparison,
        {
          label: 'Comparaison',
          scores: comparisonScores,
          color: '#8b5cf6', // purple
          strokeDasharray: '4 2',
          fillOpacity: 0.1,
        },
      ];
    }
    return comparison;
  }, [comparison, comparisonScores]);

  // Cercles de référence (20%, 40%, 60%, 80%, 100%)
  const referenceCircles = useMemo(() => {
    return [0.2, 0.4, 0.6, 0.8, 1].map((percent) => ({
      radius: maxRadius * percent,
      label: `${percent * 100}`,
    }));
  }, [maxRadius]);

  // Lignes des axes
  const axisLines = useMemo(() => {
    return categoryConfig.map((cat) => {
      const point = polarToCartesian(center, center, maxRadius, cat.angle);
      return {
        ...cat,
        x2: point.x,
        y2: point.y,
        style: CATEGORY_STYLES[cat.key as AnalysisCategory],
      };
    });
  }, [center, maxRadius, categoryConfig]);

  // Positions des labels
  const labelPositions = useMemo(() => {
    return categoryConfig.map((cat) => {
      const labelRadius = maxRadius + 30;
      const point = polarToCartesian(center, center, labelRadius, cat.angle);
      const style = CATEGORY_STYLES[cat.key as AnalysisCategory];
      return {
        ...cat,
        x: point.x,
        y: point.y,
        label: getCategoryLabel(cat.key as AnalysisCategory, language),
        style,
      };
    });
  }, [center, maxRadius, language, categoryConfig]);

  // Gestion du hover sur une catégorie
  const handleCategoryHover = useCallback((
    category: AnalysisCategory | null,
    point?: { x: number; y: number }
  ) => {
    setHoveredCategory(category);
    if (category && point) {
      const score = scores[category as keyof CategoryScores] || 0;
      setTooltip({ x: point.x, y: point.y, category, score });
    } else {
      setTooltip(null);
    }
  }, [scores]);

  // Click handler
  const handleCategoryClick = useCallback((category: AnalysisCategory) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  }, [onCategoryClick]);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size}
        className="overflow-visible"
        style={{ filter: showGlow ? 'drop-shadow(0 0 10px rgba(0,0,0,0.3))' : undefined }}
      >
        <defs>
          {/* Gradient pour le polygone du joueur */}
          <radialGradient id="playerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={playerColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={playerColor} stopOpacity="0.2" />
          </radialGradient>

          {/* Glow filter */}
          {showGlow && (
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Cercles de référence */}
        {showGrid && referenceCircles.map((circle, i) => (
          <g key={i}>
            <circle
              cx={center}
              cy={center}
              r={circle.radius}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
              className="text-gray-400 dark:text-gray-600"
            />
            {/* Labels des cercles (seulement à droite) */}
            {i % 2 === 1 && (
              <text
                x={center + circle.radius + 5}
                y={center}
                className="text-[9px] fill-gray-400 dark:fill-gray-500"
                dominantBaseline="middle"
              >
                {circle.label}
              </text>
            )}
          </g>
        ))}

        {/* Lignes des axes */}
        {axisLines.map((axis) => {
          const isDisabled = isCategoryDisabled(axis.key);
          return (
            <line
              key={axis.key}
              x1={center}
              y1={center}
              x2={axis.x2}
              y2={axis.y2}
              stroke={hoveredCategory === axis.key ? axis.style.color : 'currentColor'}
              strokeOpacity={isDisabled ? 0.08 : (hoveredCategory === axis.key ? 0.5 : 0.15)}
              strokeWidth={hoveredCategory === axis.key ? 2 : 1}
              strokeDasharray={isDisabled ? '4 4' : undefined}
              className={cn(
                'text-gray-400 dark:text-gray-600',
                animated && 'transition-all duration-200'
              )}
            />
          );
        })}

        {/* Polygones de comparaison */}
        {allComparisons.map((comp, index) => (
          <polygon
            key={`comparison-${index}`}
            points={getPolygonPoints(comp.scores, center, maxRadius, categoryConfig)}
            fill={comp.color}
            fillOpacity={comp.fillOpacity ?? 0.1}
            stroke={comp.color}
            strokeWidth={1.5}
            strokeDasharray={comp.strokeDasharray ?? '4 2'}
            className={cn(animated && 'transition-all duration-500')}
          />
        ))}

        {/* Polygone du joueur */}
        <path
          d={getPolygonPath(scores, center, maxRadius, categoryConfig)}
          fill="url(#playerGradient)"
          stroke={playerColor}
          strokeWidth={2.5}
          strokeLinejoin="round"
          filter={showGlow ? 'url(#glow)' : undefined}
          className={cn(
            animated && 'transition-all duration-500',
            animated && 'animate-in fade-in zoom-in-95 duration-700'
          )}
        />

        {/* Points des scores */}
        {categoryConfig.map((cat) => {
          const score = scores[cat.key as keyof CategoryScores] || 0;
          const radius = (score / 100) * maxRadius;
          const point = polarToCartesian(center, center, radius, cat.angle);
          const isHovered = hoveredCategory === cat.key;
          const isDisabled = isCategoryDisabled(cat.key);
          const categoryStyle = CATEGORY_STYLES[cat.key as AnalysisCategory];

          return (
            <g
              key={cat.key}
              onMouseEnter={() => !isDisabled && handleCategoryHover(cat.key, point)}
              onMouseLeave={() => handleCategoryHover(null)}
              onClick={() => !isDisabled && handleCategoryClick(cat.key)}
              className={cn(
                !isDisabled && 'cursor-pointer',
                animated && 'transition-transform duration-200'
              )}
              style={{
                transform: isHovered && !isDisabled ? 'scale(1.2)' : 'scale(1)',
                transformOrigin: `${point.x}px ${point.y}px`,
                opacity: isDisabled ? 0.3 : 1,
              }}
            >
              {/* Outer glow on hover */}
              {isHovered && showGlow && !isDisabled && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={12}
                  fill={categoryStyle.color}
                  fillOpacity={0.3}
                  className={cn(animated && 'animate-pulse')}
                />
              )}
              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isHovered && !isDisabled ? 7 : 5}
                fill={isDisabled ? '#6b7280' : (isHovered ? categoryStyle.color : playerColor)}
                stroke={isDisabled ? '#4b5563' : 'white'}
                strokeWidth={2}
              />
            </g>
          );
        })}

        {/* Labels des catégories */}
        {showLabels && labelPositions.map((label) => {
          const isHovered = hoveredCategory === label.key;
          const isDisabled = isCategoryDisabled(label.key);
          const score = scores[label.key as keyof CategoryScores] || 0;
          const scoreColor = getScoreColor(score);

          return (
            <g
              key={label.key}
              onMouseEnter={() => !isDisabled && handleCategoryHover(label.key)}
              onMouseLeave={() => handleCategoryHover(null)}
              onClick={() => !isDisabled && handleCategoryClick(label.key)}
              className={cn(!isDisabled && 'cursor-pointer')}
              style={{ opacity: isDisabled ? 0.35 : 1 }}
            >
              {/* Label text */}
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  'text-[11px] font-medium',
                  animated && 'transition-all duration-200',
                  isHovered && !isDisabled ? 'opacity-100' : 'opacity-80'
                )}
                fill={isDisabled ? '#6b7280' : (isHovered ? label.style.color : 'currentColor')}
                style={{ fill: isDisabled ? '#6b7280' : (isHovered ? label.style.color : undefined) }}
              >
                {label.label}
              </text>

              {/* Score value */}
              {showValues && (
                <text
                  x={label.x}
                  y={label.y + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={cn(
                    'text-[10px] font-bold',
                    animated && 'transition-all duration-200'
                  )}
                  fill={isDisabled ? '#4b5563' : (isHovered ? label.style.color : scoreColor)}
                >
                  {isDisabled ? '-' : score.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <g transform={`translate(${tooltip.x}, ${tooltip.y - 30})`}>
            <rect
              x="-55"
              y="-18"
              width="110"
              height="32"
              rx="8"
              fill="#1f2937"
              fillOpacity="0.95"
              stroke={CATEGORY_STYLES[tooltip.category].color}
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="-4"
              textAnchor="middle"
              className="text-[10px]"
              fill="#9ca3af"
            >
              {getCategoryLabel(tooltip.category, language)}
            </text>
            <text
              x="0"
              y="10"
              textAnchor="middle"
              className="text-sm font-bold"
              fill={getScoreColor(tooltip.score)}
            >
              {tooltip.score.toFixed(0)}/100
            </text>
          </g>
        )}
      </svg>

      {/* Légende */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: playerColor }}
            />
            <span className="text-gray-400 dark:text-gray-500">{playerLabel}</span>
          </div>
          {allComparisons.map((comp, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-0.5"
                style={{
                  backgroundColor: comp.color,
                  borderStyle: comp.strokeDasharray ? 'dashed' : 'solid',
                }}
              />
              <span className="text-gray-400 dark:text-gray-500">{comp.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Version mini pour les cards
export function CategoryRadarMini({
  scores,
  size = 100,
  color = '#f97316',
  className,
}: {
  scores: CategoryScores;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <CategoryRadarChart
      scores={scores}
      size={size}
      showLabels={false}
      showValues={false}
      showLegend={false}
      showGrid={true}
      showGlow={false}
      animated={false}
      playerColor={color}
      className={className}
    />
  );
}

// Version avec comparaison de rang
export function CategoryRadarWithRank({
  scores,
  rankAverage,
  targetRankAverage,
  size = 300,
  language = 'fr',
  className,
  onCategoryClick,
}: {
  scores: CategoryScores;
  rankAverage?: CategoryScores;
  targetRankAverage?: CategoryScores;
  size?: number;
  language?: 'fr' | 'en';
  className?: string;
  onCategoryClick?: (category: AnalysisCategory) => void;
}) {
  const comparison: ComparisonData[] = [];

  if (rankAverage) {
    comparison.push({
      label: language === 'fr' ? 'Moyenne rang' : 'Rank average',
      scores: rankAverage,
      color: '#6b7280',
      strokeDasharray: '2 2',
      fillOpacity: 0.05,
    });
  }

  if (targetRankAverage) {
    comparison.push({
      label: language === 'fr' ? 'Rang cible' : 'Target rank',
      scores: targetRankAverage,
      color: '#22c55e',
      strokeDasharray: '4 2',
      fillOpacity: 0.08,
    });
  }

  return (
    <CategoryRadarChart
      scores={scores}
      comparison={comparison}
      size={size}
      language={language}
      className={className}
      onCategoryClick={onCategoryClick}
    />
  );
}

// Export types
export type { CategoryScores, ComparisonData, CategoryRadarChartProps };
