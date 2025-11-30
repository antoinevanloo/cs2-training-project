'use client';

import { useState, ReactNode } from 'react';
import { Info, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';
import { GranularityBadge, GranularityLevel } from './GranularityBadge';
import {
  MetricDefinition,
  getMetricDefinition,
  getInterpretation,
  formatMetricValue,
  InterpretationThreshold,
} from '@/lib/metrics/definitions';
import {
  CS2Rank,
  RANK_LABELS,
  getBenchmark,
  compareToRankBenchmark,
  getComparisonColor,
  getComparisonLabel,
  BenchmarkComparison,
} from '@/lib/metrics/benchmarks';

// ============================================
// Types
// ============================================

interface MetricDisplayProps {
  /** ID de la métrique (ex: 'rating', 'adr', 'kast') */
  metricId: string;
  /** Valeur de la métrique */
  value: number;
  /** Niveau de granularité de cette valeur */
  granularity?: GranularityLevel;
  /** Valeur précédente pour afficher la tendance */
  previousValue?: number;
  /** Rank du joueur pour comparaison aux benchmarks */
  playerRank?: CS2Rank;
  /** Label personnalisé (override le nom de la définition) */
  label?: string;
  /** Afficher le badge de granularité */
  showGranularity?: boolean;
  /** Afficher le bouton info */
  showInfo?: boolean;
  /** Afficher la tendance */
  showTrend?: boolean;
  /** Afficher la comparaison au rank */
  showRankComparison?: boolean;
  /** Taille d'affichage */
  size?: 'sm' | 'md' | 'lg';
  /** Layout du composant */
  layout?: 'horizontal' | 'vertical' | 'compact';
  /** Classes CSS additionnelles */
  className?: string;
}

// ============================================
// Helper Components
// ============================================

function TrendIndicator({
  current,
  previous,
  isInversed = false,
}: {
  current: number;
  previous: number;
  isInversed?: boolean;
}) {
  const diff = current - previous;
  const percentChange = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : '0';

  // Pour les métriques inversées (DPR, isolation rate), une baisse est positive
  const isPositive = isInversed ? diff < 0 : diff > 0;
  const isNegative = isInversed ? diff > 0 : diff < 0;

  if (Math.abs(diff) < 0.01) {
    return (
      <span className="flex items-center text-gray-500 text-xs">
        <Minus className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span
      className={`flex items-center text-xs ${
        isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
      }`}
    >
      {diff > 0 ? (
        <TrendingUp className="w-3 h-3 mr-0.5" />
      ) : (
        <TrendingDown className="w-3 h-3 mr-0.5" />
      )}
      {diff > 0 ? '+' : ''}
      {percentChange}%
    </span>
  );
}

function InterpretationBar({
  value,
  interpretation,
}: {
  value: number;
  interpretation: InterpretationThreshold[];
}) {
  const currentLevel = interpretation.findIndex((i) => value <= i.max);
  const totalLevels = interpretation.length;

  return (
    <div className="flex gap-1 mt-2">
      {interpretation.map((level, index) => {
        const isActive = index === currentLevel;
        const isPassed = index < currentLevel;

        const colorMap: Record<string, string> = {
          red: 'bg-red-500',
          orange: 'bg-orange-500',
          yellow: 'bg-yellow-500',
          green: 'bg-green-500',
          blue: 'bg-blue-500',
        };

        return (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              isActive || isPassed ? colorMap[level.color] : 'bg-gray-700'
            } ${isActive ? 'ring-2 ring-white/30' : ''}`}
            title={level.label}
          />
        );
      })}
    </div>
  );
}

// ============================================
// Metric Tooltip Modal
// ============================================

interface MetricTooltipModalProps {
  isOpen: boolean;
  onClose: () => void;
  definition: MetricDefinition;
  value?: number;
  playerRank?: CS2Rank;
}

export function MetricTooltipModal({
  isOpen,
  onClose,
  definition,
  value,
  playerRank,
}: MetricTooltipModalProps) {
  const interpretation = value !== undefined ? getInterpretation(definition.id, value) : undefined;
  const benchmark = playerRank ? getBenchmark(definition.id, playerRank) : undefined;
  const comparison =
    value !== undefined && playerRank
      ? compareToRankBenchmark(definition.id, value, playerRank)
      : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={definition.name} size="md">
      <div className="space-y-5">
        {/* Description */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
          <p className="text-gray-200 text-sm leading-relaxed">
            {definition.detailedDescription || definition.description}
          </p>
        </div>

        {/* Formule */}
        {definition.formula && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Calcul</h4>
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
              <code className="text-sm text-orange-400 font-mono">{definition.formula}</code>
              {definition.formulaExplanation && (
                <p className="text-xs text-gray-400 mt-2 whitespace-pre-line">
                  {definition.formulaExplanation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Valeur actuelle */}
        {value !== undefined && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Votre valeur</h4>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-white">
                {formatMetricValue(definition.id, value)}
              </span>
              {interpretation && (
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    interpretation.color === 'red'
                      ? 'bg-red-500/20 text-red-400'
                      : interpretation.color === 'orange'
                        ? 'bg-orange-500/20 text-orange-400'
                        : interpretation.color === 'yellow'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : interpretation.color === 'green'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {interpretation.label}
                </span>
              )}
            </div>
            {interpretation && (
              <p className="text-sm text-gray-400 mt-1">{interpretation.description}</p>
            )}
          </div>
        )}

        {/* Benchmarks par rank */}
        {benchmark && playerRank && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Benchmarks pour {RANK_LABELS[playerRank]}
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-500">Min</div>
                <div className="text-sm font-medium text-gray-300">
                  {formatMetricValue(definition.id, benchmark.min)}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-500">Moyenne</div>
                <div className="text-sm font-medium text-yellow-400">
                  {formatMetricValue(definition.id, benchmark.avg)}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-500">Max</div>
                <div className="text-sm font-medium text-green-400">
                  {formatMetricValue(definition.id, benchmark.max)}
                </div>
              </div>
              {benchmark.elite && (
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Elite</div>
                  <div className="text-sm font-medium text-blue-400">
                    {formatMetricValue(definition.id, benchmark.elite)}
                  </div>
                </div>
              )}
            </div>
            {comparison && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-400">Votre position:</span>
                <span className={`text-sm font-medium ${getComparisonColor(comparison)}`}>
                  {getComparisonLabel(comparison)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Échelle d'interprétation */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Échelle d'évaluation</h4>
          <div className="space-y-1">
            {definition.interpretation.map((level, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className={`w-3 h-3 rounded-full ${
                    level.color === 'red'
                      ? 'bg-red-500'
                      : level.color === 'orange'
                        ? 'bg-orange-500'
                        : level.color === 'yellow'
                          ? 'bg-yellow-500'
                          : level.color === 'green'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                  }`}
                />
                <span className="text-gray-300 w-24">{level.label}</span>
                <span className="text-gray-500">
                  {index === 0 ? '< ' : index === definition.interpretation.length - 1 ? '> ' : ''}
                  {level.max === Infinity
                    ? `> ${definition.interpretation[index - 1]?.max || 0}`
                    : `≤ ${level.max}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Granularités disponibles */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Disponible à ces niveaux</h4>
          <div className="flex gap-2">
            {definition.availableGranularities.map((g) => (
              <GranularityBadge
                key={g}
                level={g}
                showLabel
                size="md"
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// Main Component
// ============================================

export function MetricDisplay({
  metricId,
  value,
  granularity,
  previousValue,
  playerRank,
  label,
  showGranularity = true,
  showInfo = true,
  showTrend = false,
  showRankComparison = false,
  size = 'md',
  layout = 'vertical',
  className = '',
}: MetricDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const definition = getMetricDefinition(metricId);
  if (!definition) {
    console.warn(`MetricDisplay: No definition found for metric "${metricId}"`);
    return null;
  }

  const displayLabel = label || definition.shortName;
  const formattedValue = formatMetricValue(metricId, value);
  const interpretation = getInterpretation(metricId, value);
  const comparison = playerRank
    ? compareToRankBenchmark(metricId, value, playerRank)
    : undefined;

  // Déterminer si c'est une métrique inversée
  const isInversed = ['isolationDeathRate', 'dpr'].includes(metricId);

  // Tailles
  const sizeClasses = {
    sm: {
      value: 'text-lg',
      label: 'text-xs',
      container: 'gap-0.5',
    },
    md: {
      value: 'text-2xl',
      label: 'text-sm',
      container: 'gap-1',
    },
    lg: {
      value: 'text-4xl',
      label: 'text-base',
      container: 'gap-2',
    },
  };

  // Couleur basée sur l'interprétation
  const getValueColor = () => {
    if (!interpretation) return 'text-white';
    const colorMap: Record<string, string> = {
      red: 'text-red-400',
      orange: 'text-orange-400',
      yellow: 'text-yellow-400',
      green: 'text-green-400',
      blue: 'text-blue-400',
    };
    return colorMap[interpretation.color] || 'text-white';
  };

  // Layout compact (pour les listes)
  if (layout === 'compact') {
    return (
      <>
        <div
          className={`flex items-center justify-between py-1.5 ${className}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{displayLabel}</span>
            {showGranularity && granularity && (
              <GranularityBadge level={granularity} size="sm" />
            )}
            {showInfo && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${getValueColor()}`}>
              {formattedValue}
            </span>
            {showTrend && previousValue !== undefined && (
              <TrendIndicator
                current={value}
                previous={previousValue}
                isInversed={isInversed}
              />
            )}
            {showRankComparison && comparison && (
              <span className={`text-xs ${getComparisonColor(comparison)}`}>
                {getComparisonLabel(comparison)}
              </span>
            )}
          </div>
        </div>

        <MetricTooltipModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          definition={definition}
          value={value}
          playerRank={playerRank}
        />
      </>
    );
  }

  // Layout horizontal
  if (layout === 'horizontal') {
    return (
      <>
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="flex items-center gap-1.5">
            <span className={`text-gray-400 ${sizeClasses[size].label}`}>
              {displayLabel}
            </span>
            {showInfo && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className={`font-bold ${getValueColor()} ${sizeClasses[size].value}`}>
            {formattedValue}
          </span>
          {showGranularity && granularity && (
            <GranularityBadge level={granularity} size="sm" />
          )}
          {showTrend && previousValue !== undefined && (
            <TrendIndicator
              current={value}
              previous={previousValue}
              isInversed={isInversed}
            />
          )}
        </div>

        <MetricTooltipModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          definition={definition}
          value={value}
          playerRank={playerRank}
        />
      </>
    );
  }

  // Layout vertical (par défaut)
  return (
    <>
      <div className={`flex flex-col ${sizeClasses[size].container} ${className}`}>
        {/* Header avec label et boutons */}
        <div className="flex items-center gap-1.5">
          <span className={`text-gray-400 ${sizeClasses[size].label}`}>
            {displayLabel}
          </span>
          {showGranularity && granularity && (
            <GranularityBadge level={granularity} size="sm" />
          )}
          {showInfo && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={`Plus d'informations sur ${displayLabel}`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Valeur */}
        <div className="flex items-center gap-2">
          <span className={`font-bold ${getValueColor()} ${sizeClasses[size].value}`}>
            {formattedValue}
          </span>
          {showTrend && previousValue !== undefined && (
            <TrendIndicator
              current={value}
              previous={previousValue}
              isInversed={isInversed}
            />
          )}
        </div>

        {/* Comparaison au rank */}
        {showRankComparison && comparison && playerRank && (
          <div className="flex items-center gap-1 text-xs">
            <span className={getComparisonColor(comparison)}>
              {getComparisonLabel(comparison)}
            </span>
            <span className="text-gray-500">pour {RANK_LABELS[playerRank]}</span>
          </div>
        )}

        {/* Barre d'interprétation optionnelle */}
        {size === 'lg' && (
          <InterpretationBar value={value} interpretation={definition.interpretation} />
        )}
      </div>

      <MetricTooltipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        definition={definition}
        value={value}
        playerRank={playerRank}
      />
    </>
  );
}

// ============================================
// Metric Grid (pour afficher plusieurs métriques)
// ============================================

interface MetricGridProps {
  metrics: Array<{
    metricId: string;
    value: number;
    previousValue?: number;
  }>;
  granularity?: GranularityLevel;
  playerRank?: CS2Rank;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({
  metrics,
  granularity,
  playerRank,
  columns = 3,
  className = '',
}: MetricGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {metrics.map((metric) => (
        <div
          key={metric.metricId}
          className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4"
        >
          <MetricDisplay
            metricId={metric.metricId}
            value={metric.value}
            previousValue={metric.previousValue}
            granularity={granularity}
            playerRank={playerRank}
            showTrend={metric.previousValue !== undefined}
            showRankComparison={!!playerRank}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================
// Metric Card (métrique mise en avant)
// ============================================

interface MetricCardProps {
  metricId: string;
  value: number;
  previousValue?: number;
  granularity?: GranularityLevel;
  playerRank?: CS2Rank;
  showDetails?: boolean;
  className?: string;
}

export function MetricCard({
  metricId,
  value,
  previousValue,
  granularity,
  playerRank,
  showDetails = true,
  className = '',
}: MetricCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const definition = getMetricDefinition(metricId);
  if (!definition) return null;

  const formattedValue = formatMetricValue(metricId, value);
  const interpretation = getInterpretation(metricId, value);
  const comparison = playerRank
    ? compareToRankBenchmark(metricId, value, playerRank)
    : undefined;
  const isInversed = ['isolationDeathRate', 'dpr'].includes(metricId);

  return (
    <>
      <div
        className={`
          bg-gradient-to-br from-gray-800 to-gray-900
          border border-gray-700/50 rounded-xl p-5
          hover:border-gray-600/50 transition-all
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">{definition.name}</span>
            {granularity && <GranularityBadge level={granularity} size="sm" />}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Value */}
        <div className="flex items-end gap-3 mb-2">
          <span
            className={`text-4xl font-bold ${
              interpretation
                ? interpretation.color === 'red'
                  ? 'text-red-400'
                  : interpretation.color === 'orange'
                    ? 'text-orange-400'
                    : interpretation.color === 'yellow'
                      ? 'text-yellow-400'
                      : interpretation.color === 'green'
                        ? 'text-green-400'
                        : 'text-blue-400'
                : 'text-white'
            }`}
          >
            {formattedValue}
          </span>
          {previousValue !== undefined && (
            <TrendIndicator
              current={value}
              previous={previousValue}
              isInversed={isInversed}
            />
          )}
        </div>

        {/* Interpretation */}
        {interpretation && (
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                interpretation.color === 'red'
                  ? 'text-red-400'
                  : interpretation.color === 'orange'
                    ? 'text-orange-400'
                    : interpretation.color === 'yellow'
                      ? 'text-yellow-400'
                      : interpretation.color === 'green'
                        ? 'text-green-400'
                        : 'text-blue-400'
              }`}
            >
              {interpretation.label}
            </span>
            {comparison && playerRank && (
              <>
                <span className="text-gray-600">•</span>
                <span className={`text-sm ${getComparisonColor(comparison)}`}>
                  {getComparisonLabel(comparison)} pour {RANK_LABELS[playerRank]}
                </span>
              </>
            )}
          </div>
        )}

        {/* Bar */}
        <InterpretationBar value={value} interpretation={definition.interpretation} />

        {/* Details button */}
        {showDetails && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span>Voir les détails</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <MetricTooltipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        definition={definition}
        value={value}
        playerRank={playerRank}
      />
    </>
  );
}

// Export types
export type { MetricDisplayProps, MetricGridProps, MetricCardProps };
