'use client';

import { useMemo } from 'react';

interface CategoryScores {
  aim: number;
  positioning: number;
  utility: number;
  economy: number;
  timing: number;
  decision: number;
}

interface CategoryRadarChartProps {
  scores: CategoryScores;
  comparison?: {
    rankAverage?: CategoryScores;
    targetRankAverage?: CategoryScores;
  };
  size?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
}

const CATEGORIES = [
  { key: 'aim', label: 'Aim', icon: '🎯', angle: -90 },
  { key: 'positioning', label: 'Position', icon: '📍', angle: -30 },
  { key: 'timing', label: 'Timing', icon: '⏱️', angle: 30 },
  { key: 'decision', label: 'Décisions', icon: '🧠', angle: 90 },
  { key: 'economy', label: 'Économie', icon: '💰', angle: 150 },
  { key: 'utility', label: 'Utility', icon: '💣', angle: 210 },
] as const;

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getPolygonPoints(
  scores: CategoryScores,
  center: number,
  maxRadius: number
): string {
  return CATEGORIES.map((cat) => {
    const score = scores[cat.key as keyof CategoryScores] || 0;
    const radius = (score / 100) * maxRadius;
    const point = polarToCartesian(center, center, radius, cat.angle);
    return `${point.x},${point.y}`;
  }).join(' ');
}

export function CategoryRadarChart({
  scores,
  comparison,
  size = 200,
  showLabels = true,
  showLegend = true,
  className = '',
}: CategoryRadarChartProps) {
  const center = size / 2;
  const maxRadius = size / 2 - (showLabels ? 30 : 10);

  // Génère les cercles de référence (25%, 50%, 75%, 100%)
  const referenceCircles = useMemo(() => {
    return [0.25, 0.5, 0.75, 1].map((percent) => ({
      radius: maxRadius * percent,
      label: `${percent * 100}`,
    }));
  }, [maxRadius]);

  // Génère les lignes des axes
  const axisLines = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const point = polarToCartesian(center, center, maxRadius, cat.angle);
      return {
        ...cat,
        x2: point.x,
        y2: point.y,
      };
    });
  }, [center, maxRadius]);

  // Labels positions
  const labelPositions = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const labelRadius = maxRadius + 20;
      const point = polarToCartesian(center, center, labelRadius, cat.angle);
      return {
        ...cat,
        x: point.x,
        y: point.y,
      };
    });
  }, [center, maxRadius]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Cercles de référence */}
        {referenceCircles.map((circle, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={circle.radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        ))}

        {/* Lignes des axes */}
        {axisLines.map((axis) => (
          <line
            key={axis.key}
            x1={center}
            y1={center}
            x2={axis.x2}
            y2={axis.y2}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />
        ))}

        {/* Zone comparaison rank cible (si présente) */}
        {comparison?.targetRankAverage && (
          <polygon
            points={getPolygonPoints(comparison.targetRankAverage, center, maxRadius)}
            fill="rgba(249, 115, 22, 0.1)"
            stroke="rgba(249, 115, 22, 0.5)"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        )}

        {/* Zone comparaison rank actuel (si présente) */}
        {comparison?.rankAverage && (
          <polygon
            points={getPolygonPoints(comparison.rankAverage, center, maxRadius)}
            fill="rgba(156, 163, 175, 0.1)"
            stroke="rgba(156, 163, 175, 0.5)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}

        {/* Zone du joueur */}
        <polygon
          points={getPolygonPoints(scores, center, maxRadius)}
          fill="rgba(249, 115, 22, 0.3)"
          stroke="rgb(249, 115, 22)"
          strokeWidth={2}
        />

        {/* Points du joueur */}
        {CATEGORIES.map((cat) => {
          const score = scores[cat.key as keyof CategoryScores] || 0;
          const radius = (score / 100) * maxRadius;
          const point = polarToCartesian(center, center, radius, cat.angle);
          return (
            <circle
              key={cat.key}
              cx={point.x}
              cy={point.y}
              r={4}
              fill="rgb(249, 115, 22)"
              stroke="white"
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {showLabels &&
          labelPositions.map((label) => (
            <g key={label.key}>
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-gray-400"
              >
                <tspan>{label.icon}</tspan>
              </text>
              <text
                x={label.x}
                y={label.y + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-gray-500"
              >
                {scores[label.key as keyof CategoryScores]?.toFixed(0) || 0}
              </text>
            </g>
          ))}
      </svg>

      {/* Légende */}
      {showLegend && comparison && (
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cs2-accent" />
            <span className="text-gray-400">Toi</span>
          </div>
          {comparison.rankAverage && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-400" style={{ borderStyle: 'dashed' }} />
              <span className="text-gray-400">Moyenne rank</span>
            </div>
          )}
          {comparison.targetRankAverage && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-orange-400" style={{ borderStyle: 'dashed' }} />
              <span className="text-gray-400">Rank cible</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Version mini pour les cards
export function CategoryRadarMini({
  scores,
  size = 80,
}: {
  scores: CategoryScores;
  size?: number;
}) {
  return (
    <CategoryRadarChart
      scores={scores}
      size={size}
      showLabels={false}
      showLegend={false}
    />
  );
}
