'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Footprints,
  Crosshair,
  ArrowUp,
  ArrowDown,
  Activity,
  Filter,
  Target,
} from 'lucide-react';

// Types
interface Position {
  x: number;
  y: number;
  z: number;
}

interface ShotEvent {
  tick: number;
  timestamp: number;
  position: Position;
  velocity: number; // Vitesse au moment du tir
  isMoving: boolean;
  isCounterStrafed: boolean;
  counterStrafeQuality: 'perfect' | 'good' | 'poor' | 'none';
  isCrouching: boolean;
  isScoped: boolean;
  isJumping: boolean;
  weapon: string;
  isHit: boolean;
  isHeadshot: boolean;
  isKill: boolean;
}

interface MovementSegment {
  startTick: number;
  endTick: number;
  startPosition: Position;
  endPosition: Position;
  avgVelocity: number;
  isRunning: boolean;
  isWalking: boolean;
}

interface MovementOverlayProps {
  shots: ShotEvent[];
  movements?: MovementSegment[];
  mapName: string;
  mapWidth?: number;
  mapHeight?: number;
  showVelocityVectors?: boolean;
  showCounterStrafeQuality?: boolean;
  filterType?: 'all' | 'hits' | 'kills' | 'moving' | 'counterStrafed';
  variant?: 'heatmap' | 'scatter' | 'vectors';
  className?: string;
}

// Couleurs pour la qualité du counter-strafe
const COUNTER_STRAFE_COLORS = {
  perfect: { color: '#22c55e', label: 'Parfait (<34 u/s)' },
  good: { color: '#eab308', label: 'Bon (34-64 u/s)' },
  poor: { color: '#f97316', label: 'Moyen (64-100 u/s)' },
  none: { color: '#ef4444', label: 'Aucun (>100 u/s)' },
};

// Stats des shots
function MovementStats({ shots }: { shots: ShotEvent[] }) {
  const stats = useMemo(() => {
    const total = shots.length;
    const moving = shots.filter((s) => s.isMoving).length;
    const counterStrafed = shots.filter((s) => s.isCounterStrafed).length;
    const perfectCS = shots.filter((s) => s.counterStrafeQuality === 'perfect').length;
    const crouching = shots.filter((s) => s.isCrouching).length;
    const jumping = shots.filter((s) => s.isJumping).length;

    const avgVelocity = total > 0
      ? shots.reduce((sum, s) => sum + s.velocity, 0) / total
      : 0;

    const hitRate = total > 0
      ? (shots.filter((s) => s.isHit).length / total) * 100
      : 0;

    const movingHitRate = moving > 0
      ? (shots.filter((s) => s.isMoving && s.isHit).length / moving) * 100
      : 0;

    const stationaryHitRate = (total - moving) > 0
      ? (shots.filter((s) => !s.isMoving && s.isHit).length / (total - moving)) * 100
      : 0;

    return {
      total,
      moving,
      counterStrafed,
      perfectCS,
      crouching,
      jumping,
      avgVelocity,
      hitRate,
      movingHitRate,
      stationaryHitRate,
      counterStrafeRate: total > 0 ? (counterStrafed / total) * 100 : 0,
    };
  }, [shots]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Crosshair className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-400">Tirs total</span>
        </div>
        <div className="text-xl font-bold text-white">{stats.total}</div>
        <div className="text-xs text-gray-500">
          {stats.hitRate.toFixed(0)}% touchés
        </div>
      </div>

      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-gray-400">Vitesse moy.</span>
        </div>
        <div className="text-xl font-bold text-white">
          {stats.avgVelocity.toFixed(0)}
        </div>
        <div className="text-xs text-gray-500">unités/seconde</div>
      </div>

      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Footprints className="w-4 h-4 text-green-400" />
          <span className="text-xs text-gray-400">Counter-strafe</span>
        </div>
        <div className="text-xl font-bold text-green-400">
          {stats.counterStrafeRate.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-500">
          {stats.perfectCS} parfaits
        </div>
      </div>

      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-gray-400">En mouvement</span>
        </div>
        <div className="text-xl font-bold text-orange-400">
          {stats.moving}
        </div>
        <div className="text-xs text-gray-500">
          {stats.movingHitRate.toFixed(0)}% touchés
        </div>
      </div>
    </div>
  );
}

// Counter-strafe quality distribution
function CounterStrafeDistribution({ shots }: { shots: ShotEvent[] }) {
  const distribution = useMemo(() => {
    const counts = {
      perfect: shots.filter((s) => s.counterStrafeQuality === 'perfect').length,
      good: shots.filter((s) => s.counterStrafeQuality === 'good').length,
      poor: shots.filter((s) => s.counterStrafeQuality === 'poor').length,
      none: shots.filter((s) => s.counterStrafeQuality === 'none' || !s.isCounterStrafed).length,
    };
    const total = shots.length || 1;
    return Object.entries(counts).map(([quality, count]) => ({
      quality: quality as keyof typeof COUNTER_STRAFE_COLORS,
      count,
      percentage: (count / total) * 100,
    }));
  }, [shots]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400">Qualité Counter-strafe</div>
      <div className="h-4 flex rounded-lg overflow-hidden">
        {distribution.map(({ quality, percentage }) => (
          <div
            key={quality}
            className="transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: COUNTER_STRAFE_COLORS[quality].color,
            }}
            title={`${COUNTER_STRAFE_COLORS[quality].label}: ${percentage.toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {distribution.map(({ quality, count, percentage }) => (
          <div key={quality} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COUNTER_STRAFE_COLORS[quality].color }}
            />
            <span className="text-gray-400">
              {COUNTER_STRAFE_COLORS[quality].label.split(' ')[0]}:
            </span>
            <span className="text-white font-medium">{percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Velocity histogram
function VelocityHistogram({ shots }: { shots: ShotEvent[] }) {
  const bins = useMemo(() => {
    const ranges = [
      { min: 0, max: 34, label: '0-34', color: '#22c55e' },
      { min: 34, max: 64, label: '34-64', color: '#eab308' },
      { min: 64, max: 100, label: '64-100', color: '#f97316' },
      { min: 100, max: 150, label: '100-150', color: '#ef4444' },
      { min: 150, max: Infinity, label: '150+', color: '#dc2626' },
    ];

    return ranges.map((range) => ({
      ...range,
      count: shots.filter((s) => s.velocity >= range.min && s.velocity < range.max).length,
    }));
  }, [shots]);

  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400">Distribution des vitesses</div>
      <div className="flex items-end gap-1 h-24">
        {bins.map((bin) => (
          <div key={bin.label} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all duration-300"
              style={{
                height: `${(bin.count / maxCount) * 100}%`,
                minHeight: bin.count > 0 ? '4px' : '0',
                backgroundColor: bin.color,
              }}
            />
            <div className="text-[10px] text-gray-500 mt-1">{bin.label}</div>
            <div className="text-[10px] text-white font-medium">{bin.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Shot scatter plot (SVG-based mini map visualization)
function ShotScatterPlot({
  shots,
  mapWidth = 400,
  mapHeight = 400,
  filterType = 'all',
  showVelocityVectors = false,
}: {
  shots: ShotEvent[];
  mapWidth?: number;
  mapHeight?: number;
  filterType?: string;
  showVelocityVectors?: boolean;
}) {
  // Filter shots
  const filteredShots = useMemo(() => {
    switch (filterType) {
      case 'hits':
        return shots.filter((s) => s.isHit);
      case 'kills':
        return shots.filter((s) => s.isKill);
      case 'moving':
        return shots.filter((s) => s.isMoving);
      case 'counterStrafed':
        return shots.filter((s) => s.isCounterStrafed);
      default:
        return shots;
    }
  }, [shots, filterType]);

  // Normalize positions to fit the SVG
  const normalizedShots = useMemo(() => {
    if (filteredShots.length === 0) return [];

    const xs = filteredShots.map((s) => s.position.x);
    const ys = filteredShots.map((s) => s.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    return filteredShots.map((shot) => ({
      ...shot,
      normalizedX: ((shot.position.x - minX) / rangeX) * (mapWidth - 40) + 20,
      normalizedY: ((shot.position.y - minY) / rangeY) * (mapHeight - 40) + 20,
    }));
  }, [filteredShots, mapWidth, mapHeight]);

  return (
    <svg
      width={mapWidth}
      height={mapHeight}
      className="bg-gray-900/50 rounded-lg"
    >
      {/* Grid */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Shots */}
      {normalizedShots.map((shot, index) => {
        const color = COUNTER_STRAFE_COLORS[shot.counterStrafeQuality].color;
        const size = shot.isKill ? 8 : shot.isHit ? 6 : 4;

        return (
          <g key={index}>
            {/* Velocity vector */}
            {showVelocityVectors && shot.isMoving && (
              <line
                x1={shot.normalizedX}
                y1={shot.normalizedY}
                x2={shot.normalizedX + (shot.velocity / 10)}
                y2={shot.normalizedY}
                stroke={color}
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            {/* Shot point */}
            <circle
              cx={shot.normalizedX}
              cy={shot.normalizedY}
              r={size}
              fill={shot.isHit ? color : 'transparent'}
              stroke={color}
              strokeWidth={2}
              opacity={0.8}
            >
              <title>
                {`Velocity: ${shot.velocity.toFixed(0)} u/s\n`}
                {`Counter-strafe: ${shot.counterStrafeQuality}\n`}
                {`Hit: ${shot.isHit ? 'Yes' : 'No'}`}
              </title>
            </circle>
            {/* Kill indicator */}
            {shot.isKill && (
              <circle
                cx={shot.normalizedX}
                cy={shot.normalizedY}
                r={12}
                fill="none"
                stroke="#22c55e"
                strokeWidth={1}
                opacity={0.5}
              />
            )}
          </g>
        );
      })}

      {/* Legend */}
      <text x={10} y={mapHeight - 10} className="text-[10px]" fill="#9ca3af">
        {filteredShots.length} tirs affichés
      </text>
    </svg>
  );
}

// Composant principal
export function MovementOverlay({
  shots,
  movements,
  mapName,
  mapWidth = 400,
  mapHeight = 400,
  showVelocityVectors = true,
  showCounterStrafeQuality = true,
  filterType = 'all',
  variant = 'scatter',
  className,
}: MovementOverlayProps) {
  const [activeFilter, setActiveFilter] = useState<typeof filterType>(filterType);

  const filterOptions = [
    { value: 'all', label: 'Tous', count: shots.length },
    { value: 'hits', label: 'Touchés', count: shots.filter((s) => s.isHit).length },
    { value: 'kills', label: 'Kills', count: shots.filter((s) => s.isKill).length },
    { value: 'moving', label: 'En mouvement', count: shots.filter((s) => s.isMoving).length },
    { value: 'counterStrafed', label: 'Counter-strafed', count: shots.filter((s) => s.isCounterStrafed).length },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Analyse Movement</h3>
          <span className="text-xs text-gray-500">({mapName})</span>
        </div>
      </div>

      {/* Stats */}
      <MovementStats shots={shots} />

      {/* Counter-strafe distribution */}
      {showCounterStrafeQuality && <CounterStrafeDistribution shots={shots} />}

      {/* Velocity histogram */}
      <VelocityHistogram shots={shots} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex flex-wrap gap-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value as typeof filterType)}
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                activeFilter === option.value
                  ? 'bg-cs2-accent/20 text-cs2-accent'
                  : 'bg-gray-700/50 text-gray-400 hover:text-white'
              )}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {/* Scatter plot */}
      <div className="flex justify-center">
        <ShotScatterPlot
          shots={shots}
          mapWidth={mapWidth}
          mapHeight={mapHeight}
          filterType={activeFilter}
          showVelocityVectors={showVelocityVectors}
        />
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        {Object.entries(COUNTER_STRAFE_COLORS).map(([quality, config]) => (
          <div key={quality} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-gray-400">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export types
export type { ShotEvent, MovementSegment, MovementOverlayProps };
