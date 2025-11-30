'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { MapIcon, KillIcon, DeathIcon } from '@/components/ui/icons/CS2Icons';

// Types
interface Position {
  x: number;
  y: number;
  type: 'death' | 'kill' | 'flash' | 'smoke' | 'position';
  round?: number;
  weapon?: string;
  wasTraded?: boolean;
  wasBlind?: boolean;
  wasWallbanged?: boolean;
  timestamp?: number;
  details?: string;
}

interface HeatmapProps {
  positions: Position[];
  mapName: string;
  title?: string;
  showLegend?: boolean;
  showControls?: boolean;
  showInsights?: boolean;
  height?: number;
  className?: string;
}

// Map configurations (coordonnées normalisées 0-1024)
const MAP_CONFIGS: Record<string, {
  displayName: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  callouts: { name: string; x: number; y: number }[];
}> = {
  de_dust2: {
    displayName: 'Dust 2',
    bounds: { minX: -2476, maxX: 2127, minY: -1262, maxY: 3239 },
    callouts: [
      { name: 'A Site', x: 0.75, y: 0.25 },
      { name: 'B Site', x: 0.25, y: 0.65 },
      { name: 'Mid', x: 0.5, y: 0.5 },
      { name: 'Long', x: 0.85, y: 0.55 },
      { name: 'Short', x: 0.6, y: 0.3 },
      { name: 'Tunnels', x: 0.15, y: 0.75 },
      { name: 'CT Spawn', x: 0.55, y: 0.15 },
      { name: 'T Spawn', x: 0.2, y: 0.9 },
    ],
  },
  de_mirage: {
    displayName: 'Mirage',
    bounds: { minX: -3230, maxX: 1713, minY: -3401, maxY: 1569 },
    callouts: [
      { name: 'A Site', x: 0.7, y: 0.3 },
      { name: 'B Site', x: 0.25, y: 0.35 },
      { name: 'Mid', x: 0.45, y: 0.55 },
      { name: 'Palace', x: 0.85, y: 0.25 },
      { name: 'Apartments', x: 0.15, y: 0.45 },
      { name: 'Connector', x: 0.55, y: 0.4 },
      { name: 'Window', x: 0.45, y: 0.35 },
    ],
  },
  de_inferno: {
    displayName: 'Inferno',
    bounds: { minX: -2087, maxX: 2919, minY: -1161, maxY: 2869 },
    callouts: [
      { name: 'A Site', x: 0.75, y: 0.25 },
      { name: 'B Site', x: 0.25, y: 0.25 },
      { name: 'Banana', x: 0.3, y: 0.55 },
      { name: 'Mid', x: 0.55, y: 0.6 },
      { name: 'Apartments', x: 0.65, y: 0.5 },
      { name: 'Pit', x: 0.8, y: 0.35 },
      { name: 'Library', x: 0.7, y: 0.3 },
    ],
  },
  de_nuke: {
    displayName: 'Nuke',
    bounds: { minX: -3453, maxX: 3893, minY: -4290, maxY: 7005 },
    callouts: [
      { name: 'A Site', x: 0.5, y: 0.3 },
      { name: 'B Site', x: 0.5, y: 0.6 },
      { name: 'Outside', x: 0.8, y: 0.5 },
      { name: 'Ramp', x: 0.35, y: 0.45 },
      { name: 'Secret', x: 0.2, y: 0.55 },
      { name: 'Heaven', x: 0.55, y: 0.25 },
    ],
  },
  de_ancient: {
    displayName: 'Ancient',
    bounds: { minX: -2953, maxX: 2164, minY: -2318, maxY: 2874 },
    callouts: [
      { name: 'A Site', x: 0.75, y: 0.35 },
      { name: 'B Site', x: 0.3, y: 0.4 },
      { name: 'Mid', x: 0.55, y: 0.55 },
      { name: 'Donut', x: 0.65, y: 0.45 },
      { name: 'Cave', x: 0.25, y: 0.5 },
    ],
  },
  de_anubis: {
    displayName: 'Anubis',
    bounds: { minX: -2796, maxX: 1843, minY: -1858, maxY: 2823 },
    callouts: [
      { name: 'A Site', x: 0.7, y: 0.25 },
      { name: 'B Site', x: 0.3, y: 0.3 },
      { name: 'Mid', x: 0.5, y: 0.55 },
      { name: 'Canal', x: 0.4, y: 0.65 },
      { name: 'Connector', x: 0.55, y: 0.4 },
    ],
  },
};

// Couleurs pour les types de position
const POSITION_COLORS = {
  death: { fill: '#ef4444', stroke: '#dc2626', glow: 'rgba(239, 68, 68, 0.5)' },
  kill: { fill: '#22c55e', stroke: '#16a34a', glow: 'rgba(34, 197, 94, 0.5)' },
  flash: { fill: '#fbbf24', stroke: '#f59e0b', glow: 'rgba(251, 191, 36, 0.5)' },
  smoke: { fill: '#6b7280', stroke: '#4b5563', glow: 'rgba(107, 114, 128, 0.5)' },
  position: { fill: '#3b82f6', stroke: '#2563eb', glow: 'rgba(59, 130, 246, 0.5)' },
};

export function Heatmap({
  positions,
  mapName,
  title,
  showLegend = true,
  showControls = true,
  showInsights = true,
  height = 500,
  className = '',
}: HeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedType, setSelectedType] = useState<Position['type'] | 'all'>('all');
  const [hoveredPosition, setHoveredPosition] = useState<Position | null>(null);
  const [showCallouts, setShowCallouts] = useState(true);

  const mapConfig = MAP_CONFIGS[mapName] || MAP_CONFIGS.de_dust2;

  // Normaliser les coordonnées du jeu vers 0-1
  const normalizePosition = useCallback((x: number, y: number) => {
    const { bounds } = mapConfig;
    // Si les coordonnées sont déjà normalisées (0-1), les garder
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      return { x, y };
    }
    // Sinon, normaliser depuis les coordonnées du jeu
    const normalizedX = (x - bounds.minX) / (bounds.maxX - bounds.minX);
    const normalizedY = 1 - (y - bounds.minY) / (bounds.maxY - bounds.minY); // Inverser Y
    return {
      x: Math.max(0, Math.min(1, normalizedX)),
      y: Math.max(0, Math.min(1, normalizedY)),
    };
  }, [mapConfig]);

  // Normaliser toutes les positions
  const normalizedPositions = useMemo(() => {
    return positions.map(p => ({
      ...p,
      ...normalizePosition(p.x, p.y),
    }));
  }, [positions, normalizePosition]);

  // Filtrer les positions par type
  const filteredPositions = useMemo(() => {
    if (selectedType === 'all') return normalizedPositions;
    return normalizedPositions.filter(p => p.type === selectedType);
  }, [normalizedPositions, selectedType]);

  // Calculer les clusters de positions (heatmap effect)
  const clusters = useMemo(() => {
    const clusterRadius = 0.05; // 5% de la map
    const clusterMap = new Map<string, { x: number; y: number; count: number; type: Position['type'] }>();

    filteredPositions.forEach(pos => {
      const clusterX = Math.round(pos.x / clusterRadius) * clusterRadius;
      const clusterY = Math.round(pos.y / clusterRadius) * clusterRadius;
      const key = `${clusterX}-${clusterY}-${pos.type}`;

      if (clusterMap.has(key)) {
        clusterMap.get(key)!.count++;
      } else {
        clusterMap.set(key, { x: clusterX, y: clusterY, count: 1, type: pos.type });
      }
    });

    return Array.from(clusterMap.values());
  }, [filteredPositions]);

  // Insights automatiques
  const insights = useMemo(() => {
    const deaths = positions.filter(p => p.type === 'death');
    const kills = positions.filter(p => p.type === 'kill');

    // Zone de mort la plus fréquente
    const deathZones = new Map<string, number>();
    deaths.forEach(d => {
      const zone = mapConfig.callouts.find(c =>
        Math.abs(c.x - d.x) < 0.15 && Math.abs(c.y - d.y) < 0.15
      );
      if (zone) {
        deathZones.set(zone.name, (deathZones.get(zone.name) || 0) + 1);
      }
    });

    const topDeathZone = Array.from(deathZones.entries())
      .sort((a, b) => b[1] - a[1])[0];

    // Morts tradées vs non-tradées
    const tradedDeaths = deaths.filter(d => d.wasTraded).length;
    const tradeRate = deaths.length > 0 ? (tradedDeaths / deaths.length * 100).toFixed(0) : 0;

    return {
      totalDeaths: deaths.length,
      totalKills: kills.length,
      topDeathZone: topDeathZone ? topDeathZone[0] : null,
      topDeathCount: topDeathZone ? topDeathZone[1] : 0,
      tradeRate,
      blindDeaths: deaths.filter(d => d.wasBlind).length,
    };
  }, [positions, mapConfig]);

  // Types disponibles dans les données
  const availableTypes = useMemo(() => {
    const types = new Set(positions.map(p => p.type));
    return Array.from(types);
  }, [positions]);

  return (
    <div className={`rounded-xl bg-gray-900/50 border border-gray-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      {(title || showControls) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cs2-accent/20 flex items-center justify-center">
              <MapIcon size={20} className="text-cs2-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{title || 'Position Heatmap'}</h3>
              <p className="text-sm text-gray-400">{mapConfig.displayName}</p>
            </div>
          </div>

          {showControls && (
            <div className="flex items-center gap-2">
              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as Position['type'] | 'all')}
                className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white"
              >
                <option value="all">Tous ({positions.length})</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'death' ? '💀 Morts' :
                     type === 'kill' ? '🎯 Kills' :
                     type === 'flash' ? '⚡ Flashs' :
                     type === 'smoke' ? '💨 Smokes' : '📍 Positions'}
                    {' '}({positions.filter(p => p.type === type).length})
                  </option>
                ))}
              </select>

              {/* Callouts toggle */}
              <button
                onClick={() => setShowCallouts(!showCallouts)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  showCallouts
                    ? 'bg-cs2-accent text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Callouts
              </button>

              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights bar */}
      {showInsights && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-800/30 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <DeathIcon size={16} className="text-red-400" />
            <span className="text-sm text-gray-400">Morts:</span>
            <span className="text-sm font-bold text-white">{insights.totalDeaths}</span>
          </div>
          <div className="flex items-center gap-2">
            <KillIcon size={16} className="text-green-400" />
            <span className="text-sm text-gray-400">Kills:</span>
            <span className="text-sm font-bold text-white">{insights.totalKills}</span>
          </div>
          {insights.topDeathZone && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Zone critique:</span>
              <span className="text-sm font-bold text-red-400">{insights.topDeathZone}</span>
              <span className="text-xs text-gray-500">({insights.topDeathCount}x)</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Trade rate:</span>
            <span className={`text-sm font-bold ${
              Number(insights.tradeRate) >= 50 ? 'text-green-400' : 'text-red-400'
            }`}>
              {insights.tradeRate}%
            </span>
          </div>
        </div>
      )}

      {/* Map container */}
      <div
        className="relative overflow-hidden"
        style={{ height }}
      >
        {/* Map background SVG */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/maps/${mapName}_radar.svg')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center',
          }}
        />

        {/* SVG overlay pour les positions */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center',
          }}
        >
          {/* Définitions pour les effets */}
          <defs>
            {Object.entries(POSITION_COLORS).map(([type, colors]) => (
              <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}

            {/* Gradient radial pour heatmap effect */}
            <radialGradient id="heatGradient">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
              <stop offset="50%" stopColor="rgba(239, 68, 68, 0.3)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
            </radialGradient>
          </defs>

          {/* Callouts */}
          {showCallouts && mapConfig.callouts.map((callout) => (
            <g key={callout.name}>
              <text
                x={callout.x * 100}
                y={callout.y * 100}
                textAnchor="middle"
                className="fill-gray-500 text-[2px] font-medium pointer-events-none"
                style={{ userSelect: 'none' }}
              >
                {callout.name}
              </text>
            </g>
          ))}

          {/* Heatmap circles (clusters) */}
          {clusters.map((cluster, i) => (
            <circle
              key={`cluster-${i}`}
              cx={cluster.x * 100}
              cy={cluster.y * 100}
              r={Math.min(5, 1 + cluster.count * 0.5)}
              fill={POSITION_COLORS[cluster.type].glow}
              opacity={Math.min(0.8, 0.3 + cluster.count * 0.1)}
              className="transition-all duration-200"
            />
          ))}

          {/* Individual positions */}
          {filteredPositions.map((pos, i) => {
            const colors = POSITION_COLORS[pos.type];
            const isHovered = hoveredPosition === pos;

            return (
              <g key={i}>
                {/* Glow effect quand hovered */}
                {isHovered && (
                  <circle
                    cx={pos.x * 100}
                    cy={pos.y * 100}
                    r="3"
                    fill={colors.glow}
                    className="animate-pulse"
                  />
                )}

                {/* Position marker */}
                <circle
                  cx={pos.x * 100}
                  cy={pos.y * 100}
                  r={isHovered ? 1.5 : 1}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.3"
                  filter={`url(#glow-${pos.type})`}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredPosition(pos)}
                  onMouseLeave={() => setHoveredPosition(null)}
                />

                {/* Special indicators */}
                {pos.wasBlind && (
                  <circle
                    cx={pos.x * 100 + 1.5}
                    cy={pos.y * 100 - 1.5}
                    r="0.5"
                    fill="#fbbf24"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPosition && (
          <div
            className="absolute z-10 px-3 py-2 rounded-lg bg-gray-900/95 border border-gray-700 shadow-lg pointer-events-none"
            style={{
              left: `${hoveredPosition.x * 100}%`,
              top: `${hoveredPosition.y * 100}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">
                {hoveredPosition.type === 'death' ? '💀' :
                 hoveredPosition.type === 'kill' ? '🎯' : '📍'}
              </span>
              <span className="font-medium text-white capitalize">
                {hoveredPosition.type}
              </span>
              {hoveredPosition.round && (
                <span className="text-xs text-gray-400">Round {hoveredPosition.round}</span>
              )}
            </div>
            {hoveredPosition.weapon && (
              <p className="text-xs text-gray-400">{hoveredPosition.weapon}</p>
            )}
            {hoveredPosition.wasBlind && (
              <p className="text-xs text-yellow-400">⚡ Flashed</p>
            )}
            {hoveredPosition.wasTraded && (
              <p className="text-xs text-green-400">✓ Traded</p>
            )}
            {hoveredPosition.details && (
              <p className="text-xs text-gray-400 mt-1">{hoveredPosition.details}</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-4 p-4 border-t border-gray-700/50 bg-gray-800/20">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Légende:</span>
          {availableTypes.map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: POSITION_COLORS[type].fill }}
              />
              <span className="text-xs text-gray-400 capitalize">{type}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-xs text-gray-400">Flashed</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini heatmap pour les cards de dashboard
interface MiniHeatmapProps {
  positions: Position[];
  mapName: string;
  size?: number;
  className?: string;
}

export function MiniHeatmap({ positions, mapName, size = 120, className = '' }: MiniHeatmapProps) {
  const mapConfig = MAP_CONFIGS[mapName] || MAP_CONFIGS.de_dust2;

  // Normaliser les positions
  const normalizedPositions = useMemo(() => {
    return positions.map(p => {
      const { bounds } = mapConfig;
      // Si déjà normalisé
      if (p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) {
        return p;
      }
      // Normaliser
      const normalizedX = (p.x - bounds.minX) / (bounds.maxX - bounds.minX);
      const normalizedY = 1 - (p.y - bounds.minY) / (bounds.maxY - bounds.minY);
      return {
        ...p,
        x: Math.max(0, Math.min(1, normalizedX)),
        y: Math.max(0, Math.min(1, normalizedY)),
      };
    });
  }, [positions, mapConfig]);

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-gray-800/50 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        {normalizedPositions.slice(0, 50).map((pos, i) => (
          <circle
            key={i}
            cx={pos.x * 100}
            cy={pos.y * 100}
            r="2"
            fill={POSITION_COLORS[pos.type].fill}
            opacity="0.7"
          />
        ))}
      </svg>
      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-gray-900/80 text-xs text-gray-400">
        {positions.length}
      </div>
    </div>
  );
}
