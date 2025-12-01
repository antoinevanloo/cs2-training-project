'use client';

import { LucideIcon, Lock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './Progress';
import { InfoTooltip, WeightTooltip, DisabledFeatureTooltip } from './InfoTooltip';
import { getScoreColor } from '@/lib/design/tokens';
import type { AnalysisCategory } from '@/lib/preferences/types';

interface CategoryScoreCardProps {
  /** Clé de la catégorie */
  category: AnalysisCategory;
  /** Label à afficher */
  label: string;
  /** Score de la catégorie (0-100) */
  score: number | null | undefined;
  /** Icône de la catégorie */
  icon: LucideIcon;
  /** Couleur de l'icône (classe Tailwind) */
  iconColor: string;
  /** Couleur de fond de l'icône (classe Tailwind) */
  iconBgColor: string;
  /** Si la catégorie est activée */
  isEnabled: boolean;
  /** Raison de désactivation si non activée */
  disabledReason?: 'disabled_by_user' | 'tier_restriction' | 'beta' | 'coming_soon';
  /** Tier requis si tier_restriction */
  requiredTier?: string;
  /** Poids original de la catégorie (%) */
  originalWeight?: number;
  /** Poids ajusté après redistribution (%) */
  adjustedWeight?: number;
  /** Afficher les détails du poids */
  showWeightInfo?: boolean;
  /** Taille de la carte */
  size?: 'sm' | 'md' | 'lg';
  /** Callback au clic */
  onClick?: () => void;
  /** Classes additionnelles */
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    padding: 'p-3',
    iconSize: 'w-4 h-4',
    iconWrapper: 'p-1',
    labelSize: 'text-xs',
    scoreSize: 'text-lg',
    gap: 'gap-2',
  },
  md: {
    padding: 'p-4',
    iconSize: 'w-4 h-4',
    iconWrapper: 'p-1.5',
    labelSize: 'text-sm',
    scoreSize: 'text-2xl',
    gap: 'gap-3',
  },
  lg: {
    padding: 'p-5',
    iconSize: 'w-5 h-5',
    iconWrapper: 'p-2',
    labelSize: 'text-base',
    scoreSize: 'text-3xl',
    gap: 'gap-4',
  },
};

export function CategoryScoreCard({
  category,
  label,
  score,
  icon: Icon,
  iconColor,
  iconBgColor,
  isEnabled,
  disabledReason = 'disabled_by_user',
  requiredTier,
  originalWeight = 11.11,
  adjustedWeight,
  showWeightInfo = false,
  size = 'md',
  onClick,
  className,
}: CategoryScoreCardProps) {
  const config = SIZE_CONFIG[size];
  const effectiveWeight = adjustedWeight ?? originalWeight;
  const hasWeightChange = adjustedWeight !== undefined && Math.abs(adjustedWeight - originalWeight) > 0.1;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border transition-all duration-200',
        config.padding,
        isEnabled
          ? 'bg-gray-900/50 border-gray-800/50 hover:border-gray-700/50'
          : 'bg-gray-900/20 border-gray-800/30 opacity-60',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Header avec icône et label */}
      <div className={cn('flex items-center justify-between mb-3', config.gap)}>
        <div className="flex items-center gap-2">
          <div className={cn(
            'rounded',
            config.iconWrapper,
            isEnabled ? iconBgColor : 'bg-gray-700/30'
          )}>
            <Icon className={cn(
              config.iconSize,
              isEnabled ? iconColor : 'text-gray-500'
            )} />
          </div>
          <span className={cn(
            'font-medium',
            config.labelSize,
            isEnabled ? 'text-gray-300' : 'text-gray-500'
          )}>
            {label}
          </span>
        </div>

        {/* Indicateurs de statut */}
        <div className="flex items-center gap-1.5">
          {/* Badge de poids si différent du défaut */}
          {isEnabled && showWeightInfo && hasWeightChange && (
            <span className="text-[10px] text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded">
              {effectiveWeight.toFixed(1)}%
            </span>
          )}

          {/* Tooltip de poids */}
          {isEnabled && showWeightInfo && (
            <WeightTooltip
              originalWeight={originalWeight}
              adjustedWeight={effectiveWeight}
              isEnabled={isEnabled}
            />
          )}

          {/* Indicateur désactivé */}
          {!isEnabled && (
            <DisabledFeatureTooltip
              reason={disabledReason}
              requiredTier={requiredTier}
            />
          )}
        </div>
      </div>

      {/* Score */}
      <div className="mb-2">
        {isEnabled && score !== null && score !== undefined ? (
          <span
            className={cn('font-bold', config.scoreSize)}
            style={{ color: getScoreColor(score) }}
          >
            {score.toFixed(0)}
          </span>
        ) : (
          <span className={cn('font-bold text-gray-600', config.scoreSize)}>
            {isEnabled ? '--' : <Lock className="w-5 h-5 inline" />}
          </span>
        )}
        {isEnabled && (
          <span className="text-gray-500 text-sm ml-1">/100</span>
        )}
      </div>

      {/* Barre de progression */}
      {isEnabled ? (
        <Progress
          value={score ?? 0}
          color="score"
          size="sm"
        />
      ) : (
        <div className="h-2 bg-gray-800/30 rounded-full overflow-hidden">
          <div className="h-full bg-gray-700/20 w-1/3" />
        </div>
      )}

      {/* Message pour catégorie désactivée */}
      {!isEnabled && (
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          {disabledReason === 'disabled_by_user' && 'Désactivé'}
          {disabledReason === 'tier_restriction' && 'Premium'}
          {disabledReason === 'beta' && 'Beta'}
          {disabledReason === 'coming_soon' && 'Bientôt'}
        </p>
      )}
    </div>
  );
}

/**
 * Grille de catégories avec gestion automatique des états
 */
interface CategoryGridProps {
  /** Scores des catégories */
  scores: Record<string, number | null | undefined>;
  /** Catégories activées */
  enabledCategories: AnalysisCategory[];
  /** Configuration des catégories à afficher */
  categories: Array<{
    key: AnalysisCategory;
    label: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
  }>;
  /** Poids personnalisés */
  weights?: Record<string, number>;
  /** Poids ajustés après redistribution */
  adjustedWeights?: Record<string, number>;
  /** Afficher les catégories désactivées */
  showDisabled?: boolean;
  /** Afficher les infos de poids */
  showWeightInfo?: boolean;
  /** Nombre de colonnes */
  columns?: 2 | 3 | 4;
  /** Taille des cartes */
  cardSize?: 'sm' | 'md' | 'lg';
  /** Callback au clic sur une catégorie */
  onCategoryClick?: (category: AnalysisCategory) => void;
}

const COLUMN_CLASSES = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

export function CategoryGrid({
  scores,
  enabledCategories,
  categories,
  weights,
  adjustedWeights,
  showDisabled = true,
  showWeightInfo = false,
  columns = 3,
  cardSize = 'md',
  onCategoryClick,
}: CategoryGridProps) {
  // Filtrer les catégories à afficher
  const visibleCategories = showDisabled
    ? categories
    : categories.filter(cat => enabledCategories.includes(cat.key));

  // Calculer les stats
  const enabledCount = categories.filter(cat => enabledCategories.includes(cat.key)).length;
  const disabledCount = categories.length - enabledCount;

  return (
    <div className="space-y-3">
      {/* Header avec stats */}
      {showDisabled && disabledCount > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{enabledCount} catégories actives</span>
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            {disabledCount} désactivée{disabledCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Grille */}
      <div className={cn('grid gap-4', COLUMN_CLASSES[columns])}>
        {visibleCategories.map((cat) => {
          const isEnabled = enabledCategories.includes(cat.key);
          const scoreKey = `${cat.key}Score` as keyof typeof scores;
          const avgKey = `avg${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}` as keyof typeof scores;
          const score = scores[scoreKey] ?? scores[avgKey] ?? scores[cat.key];

          return (
            <CategoryScoreCard
              key={cat.key}
              category={cat.key}
              label={cat.label}
              score={score as number | null | undefined}
              icon={cat.icon}
              iconColor={cat.color}
              iconBgColor={cat.bgColor}
              isEnabled={isEnabled}
              originalWeight={weights?.[`analysis.${cat.key}`] ?? 11.11}
              adjustedWeight={adjustedWeights?.[`analysis.${cat.key}`]}
              showWeightInfo={showWeightInfo}
              size={cardSize}
              onClick={onCategoryClick ? () => onCategoryClick(cat.key) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
