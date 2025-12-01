'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  MapPin,
  Flame,
  Coins,
  Clock,
  Brain,
  Footprints,
  Eye,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { AnalysisCategory } from '@/lib/preferences/types';
import {
  CATEGORY_STYLES,
  CATEGORY_ORDER,
  getScoreLevel,
  getScoreColor,
} from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

// Charts
import { EconomyFlow } from '@/components/charts/EconomyFlow';
import { TradeTimeline } from '@/components/charts/TradeTimeline';
import { MovementOverlay } from '@/components/charts/MovementOverlay';
import type { ChartData } from '@/lib/rounds';

// Types
interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  rating: number;
  headshotPercentage: number;
  kast: number;
  entryKills?: number;
  entryDeaths?: number;
  clutchesWon?: number;
  
  clutchesLost?: number;
  flashAssists?: number;
  tradesGiven?: number;
  tradesReceived?: number;
  avgBlindDuration?: number;
}

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

interface AnalysisData {
  aim: unknown | null;
  positioning: unknown | null;
  utility: unknown | null;
  economy: unknown | null;
  timing: unknown | null;
  decision: unknown | null;
  movement: unknown | null;
  awareness: unknown | null;
  teamplay: unknown | null;
}

interface MetricsTabProps {
  categoryScores: CategoryScores;
  analyses: Partial<AnalysisData>;
  playerStats: PlayerStats | null;
  chartData?: ChartData;
}

// Icons mapping
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

// Metrics configuration for v2 categories
const METRICS_CONFIG: Record<AnalysisCategory, { key: string; label: string; format: 'percent' | 'decimal' | 'integer' | 'time' | 'ratio' }[]> = {
  aim: [
    { key: 'headshotPercentage', label: 'HS %', format: 'percent' },
    { key: 'firstBulletAccuracy', label: 'First Bullet', format: 'percent' },
    { key: 'sprayControlScore', label: 'Spray Control', format: 'integer' },
    { key: 'avgReactionTime', label: 'Réaction', format: 'time' },
    { key: 'crosshairPlacementScore', label: 'Crosshair', format: 'integer' },
    { key: 'transferSpeed', label: 'Transfer Speed', format: 'time' },
  ],
  positioning: [
    { key: 'mapControlScore', label: 'Map Control', format: 'integer' },
    { key: 'avgAreaControlled', label: 'Zone Ctrl', format: 'percent' },
    { key: 'deathInBadPosition', label: 'Bad Deaths', format: 'integer' },
    { key: 'avgRotationTime', label: 'Rotation', format: 'time' },
    { key: 'exposedDeaths', label: 'Exposed Deaths', format: 'integer' },
    { key: 'advantageousPositions', label: 'Good Pos.', format: 'integer' },
  ],
  utility: [
    { key: 'flashEfficiency', label: 'Flash Eff.', format: 'percent' },
    { key: 'avgFlashDuration', label: 'Avg Flash', format: 'time' },
    { key: 'smokesUsedForExecute', label: 'Exec Smokes', format: 'integer' },
    { key: 'molotovDamage', label: 'Molotov Dmg', format: 'integer' },
    { key: 'heDamage', label: 'HE Damage', format: 'integer' },
    { key: 'utilityUsageRate', label: 'Usage Rate', format: 'percent' },
  ],
  economy: [
    { key: 'buyDecisionScore', label: 'Buy Score', format: 'integer' },
    { key: 'correctBuyDecisions', label: 'Correct Buys', format: 'percent' },
    { key: 'inappropriateSaves', label: 'Bad Saves', format: 'integer' },
    { key: 'avgMoneyAtDeath', label: 'Avg $ Death', format: 'integer' },
    { key: 'teamBuySync', label: 'Team Sync', format: 'percent' },
    { key: 'equipmentValue', label: 'Avg Equip', format: 'integer' },
  ],
  timing: [
    { key: 'peekTimingScore', label: 'Peek Score', format: 'integer' },
    { key: 'avgTradeTime', label: 'Trade Time', format: 'time' },
    { key: 'earlyRotations', label: 'Early Rot.', format: 'integer' },
    { key: 'lateRotations', label: 'Late Rot.', format: 'integer' },
    { key: 'prefireRate', label: 'Prefire', format: 'percent' },
    { key: 'postPlantTiming', label: 'Post Plant', format: 'integer' },
  ],
  decision: [
    { key: 'clutchWinRate', label: 'Clutch Win', format: 'percent' },
    { key: 'retakeScore', label: 'Retake', format: 'integer' },
    { key: 'aggressionLevel', label: 'Aggression', format: 'ratio' },
    { key: 'calculatedRisks', label: 'Good Risks', format: 'integer' },
    { key: 'recklessPlays', label: 'Reckless', format: 'integer' },
    { key: 'gameSenseScore', label: 'Game Sense', format: 'integer' },
  ],
  movement: [
    { key: 'counterStrafeRate', label: 'C-Strafe', format: 'percent' },
    { key: 'perfectCounterStrafes', label: 'Perfect CS', format: 'integer' },
    { key: 'avgSpeedAtShot', label: 'Speed@Shot', format: 'integer' },
    { key: 'crouchKillRate', label: 'Crouch Kill', format: 'percent' },
    { key: 'scopeDiscipline', label: 'Scope Disc.', format: 'integer' },
    { key: 'jumpShotRate', label: 'Jump Shots', format: 'percent' },
    { key: 'walkDiscipline', label: 'Walk Disc.', format: 'integer' },
  ],
  awareness: [
    { key: 'blindDeathRate', label: 'Blind Deaths', format: 'percent' },
    { key: 'flashDodgeRate', label: 'Flash Dodge', format: 'percent' },
    { key: 'bombAwarenessScore', label: 'Bomb Aware', format: 'integer' },
    { key: 'infoGatheringScore', label: 'Info Score', format: 'integer' },
    { key: 'soundAwarenessScore', label: 'Sound', format: 'integer' },
    { key: 'mapReadingScore', label: 'Map Read', format: 'integer' },
  ],
  teamplay: [
    { key: 'tradeRate', label: 'Trade Rate', format: 'percent' },
    { key: 'avgTradeTime', label: 'Trade Time', format: 'time' },
    { key: 'supportScore', label: 'Support', format: 'integer' },
    { key: 'coordinationScore', label: 'Coord.', format: 'integer' },
    { key: 'entryAttempts', label: 'Entry Att.', format: 'integer' },
    { key: 'entrySuccessRate', label: 'Entry Win', format: 'percent' },
    { key: 'flashAssists', label: 'Flash Ass.', format: 'integer' },
  ],
};

// Format helpers
function formatValue(value: unknown, format: string): string {
  if (value === null || value === undefined) return '-';

  const num = Number(value);
  if (isNaN(num)) return String(value);

  switch (format) {
    case 'percent':
      // Si la valeur est déjà un pourcentage (> 1), l'afficher directement
      return num > 1 ? `${num.toFixed(0)}%` : `${(num * 100).toFixed(0)}%`;
    case 'decimal':
      return num.toFixed(2);
    case 'integer':
      return Math.round(num).toString();
    case 'time':
      return `${num.toFixed(1)}s`;
    case 'ratio':
      return num.toFixed(1);
    default:
      return num.toString();
  }
}

function extractMetricValue(analysis: unknown, key: string): unknown {
  if (!analysis || typeof analysis !== 'object') return null;
  const data = analysis as Record<string, unknown>;

  // Chercher la valeur directement ou dans les sous-objets
  if (key in data) return data[key];

  // Chercher dans les sous-objets courants
  const subKeys = ['metrics', 'details', 'scores', 'stats'];
  for (const subKey of subKeys) {
    if (subKey in data && typeof data[subKey] === 'object') {
      const subData = data[subKey] as Record<string, unknown>;
      if (key in subData) return subData[key];
    }
  }

  return null;
}

export function MetricsTab({ categoryScores, analyses, playerStats, chartData }: MetricsTabProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Check if chart data is available
  const hasEconomyChart = chartData?.economyRounds && chartData.economyRounds.length > 0;
  const hasTradeChart = chartData?.trades && chartData.kills && chartData.playerSteamId !== undefined;
  const hasMovementChart = chartData?.shots && chartData.shots.length > 0 && chartData.mapName;

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Catégories triées par score (du plus bas au plus haut)
  const sortedCategories = useMemo(() => {
    return CATEGORY_ORDER
      .map((cat) => ({
        category: cat,
        score: categoryScores[cat as keyof CategoryScores],
        analysis: analyses[cat as keyof AnalysisData],
      }))
      .filter((item) => item.score !== undefined && item.score !== null);
  }, [categoryScores, analyses]);

  return (
    <div className="space-y-6">
      {/* Stats détaillées du joueur */}
      {playerStats && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Statistiques du match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Kills" value={playerStats.kills} />
              <StatCard label="Deaths" value={playerStats.deaths} />
              <StatCard label="Assists" value={playerStats.assists} />
              <StatCard label="Rating" value={playerStats.rating.toFixed(2)} highlight />
              <StatCard label="ADR" value={Math.round(playerStats.adr)} />
              <StatCard label="HS%" value={`${Math.round(playerStats.headshotPercentage)}%`} />
              <StatCard label="KAST" value={`${Math.round(playerStats.kast)}%`} />
              <StatCard
                label="K/D"
                value={(playerStats.kills / Math.max(1, playerStats.deaths)).toFixed(2)}
              />
              {playerStats.entryKills !== undefined && (
                <StatCard label="Entry K" value={playerStats.entryKills} />
              )}
              {playerStats.clutchesWon !== undefined && (
                <StatCard
                  label="Clutches"
                  value={`${playerStats.clutchesWon}/${(playerStats.clutchesWon || 0) + (playerStats.clutchesLost || 0)}`}
                />
              )}
              {playerStats.tradesGiven !== undefined && (
                <StatCard label="Trades" value={playerStats.tradesGiven} />
              )}
              {playerStats.flashAssists !== undefined && (
                <StatCard label="Flash Ass." value={playerStats.flashAssists} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Catégories avec scores - 9 catégories v2 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Analyse par catégorie (v2)</h3>
          <span className="text-xs text-gray-500">9 catégories</span>
        </div>

        {sortedCategories.map(({ category, score, analysis }) => {
          if (score === undefined || score === null) return null;

          const style = CATEGORY_STYLES[category];
          const Icon = CATEGORY_ICONS[category];
          const isExpanded = expandedCategories.has(category);
          const scoreLevel = getScoreLevel(score);
          const metrics = METRICS_CONFIG[category];

          return (
            <Card
              key={category}
              className={cn(
                'border transition-all duration-300',
                isExpanded ? 'ring-1' : ''
              )}
              style={{
                borderColor: `${style.color}30`,
                backgroundColor: `${style.color}08`,
                ...(isExpanded && { ringColor: `${style.color}50` }),
              }}
            >
              <CardContent className="p-0">
                {/* Header - toujours visible */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div
                        className="p-2.5 rounded-xl"
                        style={{
                          backgroundColor: `${style.color}20`,
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: style.color }} />
                      </div>
                      {/* Label & description */}
                      <div>
                        <h4 className="text-white font-semibold">{style.label}</h4>
                        <p className="text-xs text-gray-400">{style.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Score */}
                      <div className="text-right">
                        <div
                          className="text-2xl font-bold tabular-nums"
                          style={{ color: scoreLevel.color }}
                        >
                          {Math.round(score)}
                        </div>
                        <div
                          className="text-xs font-medium"
                          style={{ color: scoreLevel.color }}
                        >
                          {scoreLevel.label}
                        </div>
                      </div>
                      {/* Expand icon */}
                      {analysis !== null && analysis !== undefined && (
                        <div
                          className={cn(
                            'p-1 rounded transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        >
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${score}%`,
                        backgroundColor: style.color,
                      }}
                    />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-700/30 space-y-4">
                    {/* Metrics grid */}
                    {analysis !== null && analysis !== undefined ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {metrics.map((metric) => {
                          const value = extractMetricValue(analysis, metric.key);
                          const formattedValue = formatValue(value, metric.format);

                          return (
                            <div
                              key={metric.key}
                              className="p-3 bg-gray-800/50 rounded-lg text-center"
                            >
                              <div className="text-white font-medium text-sm">
                                {formattedValue}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {metric.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-4">
                        Détails non disponibles pour cette analyse
                      </p>
                    )}

                    {/* Economy chart */}
                    {category === 'economy' && hasEconomyChart && chartData?.economyRounds && (
                      <div className="mt-4 p-4 bg-gray-900/30 rounded-lg">
                        <EconomyFlow
                          rounds={chartData.economyRounds}
                          variant="combined"
                          showTeamSync={true}
                          showDecisions={true}
                        />
                      </div>
                    )}

                    {/* Trade timeline for teamplay */}
                    {category === 'teamplay' && hasTradeChart && chartData?.trades && chartData?.kills && chartData?.playerSteamId && (
                      <div className="mt-4 p-4 bg-gray-900/30 rounded-lg">
                        <TradeTimeline
                          trades={chartData.trades}
                          kills={chartData.kills}
                          playerSteamId={chartData.playerSteamId}
                          playerTeam={chartData.playerTeam || 2}
                          variant="compact"
                        />
                      </div>
                    )}

                    {/* Trade timeline for timing (compact version) */}
                    {category === 'timing' && hasTradeChart && chartData?.trades && chartData?.kills && chartData?.playerSteamId && (
                      <div className="mt-4 p-4 bg-gray-900/30 rounded-lg">
                        <TradeTimeline
                          trades={chartData.trades}
                          kills={chartData.kills}
                          playerSteamId={chartData.playerSteamId}
                          playerTeam={chartData.playerTeam || 2}
                          variant="mini"
                        />
                      </div>
                    )}

                    {/* Movement overlay for movement category */}
                    {category === 'movement' && hasMovementChart && chartData?.shots && chartData?.mapName && (
                      <div className="mt-4 p-4 bg-gray-900/30 rounded-lg">
                        <MovementOverlay
                          shots={chartData.shots}
                          mapName={chartData.mapName}
                          variant="scatter"
                          showVelocityVectors={true}
                          showCounterStrafeQuality={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Note v2 */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>Analyse v2:</strong> Cette démo a été analysée avec le moteur v2
          qui inclut les nouvelles catégories Movement, Awareness et Teamplay.
        </p>
      </div>
    </div>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 bg-gray-900/30 rounded-lg text-center">
      <div className={cn(
        'text-xl font-bold',
        highlight ? 'text-cs2-accent' : 'text-white'
      )}>
        {value}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
