'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { GranularityBadge } from '@/components/ui/GranularityBadge';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { CategoryScoreCard } from '@/components/ui/CategoryScoreCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { getAdjustedWeights, convertUserWeightsToFeatureWeights } from '@/lib/features/score-calculator';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  MapPin,
  Bomb,
  DollarSign,
  Clock,
  Brain,
  AlertTriangle,
  CheckCircle,
  Move,
  Eye,
  Users,
  Lock,
  Settings,
  Star,
} from 'lucide-react';
import type { CategoryWeights, AnalysisCategory } from '@/lib/preferences/types';

interface MapDetailClientProps {
  mapName: string;
  data: {
    demos: Array<{
      id: string;
      matchDate: string;
      matchResult: string;
      scoreTeam1: number;
      scoreTeam2: number;
      rating: number;
      analysisScore: number | null;
    }>;
    stats: {
      gamesPlayed: number;
      wins: number;
      losses: number;
      ties: number;
      winRate: number;
      avgRating: number;
      avgAdr: number;
      avgHsPercent: number;
      avgKast: number;
      totalKills: number;
      totalDeaths: number;
    };
    analysisScores: {
      avgOverall: number;
      avgAim: number;
      avgPositioning: number;
      avgUtility: number;
      avgEconomy: number;
      avgTiming: number;
      avgDecision: number;
      avgMovement: number;
      avgAwareness: number;
      avgTeamplay: number;
    } | null;
    recurringWeaknesses: Array<{ name: string; count: number; percentage: number }>;
    recurringStrengths: Array<{ name: string; count: number; percentage: number }>;
    ratingHistory: Array<{ date: string; rating: number; score: number }>;
    globalStats: {
      avgRating: number;
      avgAdr: number;
      avgHsPercent: number;
      winRate: number;
    } | null;
  };
  /** IDs des analyseurs activés (ex: ['analysis.aim', 'analysis.positioning']) */
  enabledAnalyzers: string[];
  /** Poids personnalisés des catégories */
  categoryWeights?: CategoryWeights;
  /** Catégories prioritaires (affichées en premier avec étoile) */
  priorityCategories: AnalysisCategory[];
}

// Configuration des 9 catégories v2
const CATEGORY_CONFIG = [
  { key: 'aim', featureId: 'analysis.aim', scoreKey: 'avgAim', label: 'Aim', icon: Crosshair, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { key: 'positioning', featureId: 'analysis.positioning', scoreKey: 'avgPositioning', label: 'Position', icon: MapPin, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { key: 'utility', featureId: 'analysis.utility', scoreKey: 'avgUtility', label: 'Utility', icon: Bomb, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { key: 'economy', featureId: 'analysis.economy', scoreKey: 'avgEconomy', label: 'Economy', icon: DollarSign, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { key: 'timing', featureId: 'analysis.timing', scoreKey: 'avgTiming', label: 'Timing', icon: Clock, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { key: 'decision', featureId: 'analysis.decision', scoreKey: 'avgDecision', label: 'Decision', icon: Brain, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { key: 'movement', featureId: 'analysis.movement', scoreKey: 'avgMovement', label: 'Movement', icon: Move, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { key: 'awareness', featureId: 'analysis.awareness', scoreKey: 'avgAwareness', label: 'Awareness', icon: Eye, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  { key: 'teamplay', featureId: 'analysis.teamplay', scoreKey: 'avgTeamplay', label: 'Teamplay', icon: Users, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
];

export function MapDetailClient({
  mapName,
  data,
  enabledAnalyzers,
  categoryWeights,
  priorityCategories,
}: MapDetailClientProps) {
  const { demos, stats, analysisScores, recurringWeaknesses, recurringStrengths, globalStats } = data;

  // Comparaison avec stats globales
  const _comparison = globalStats ? {
    rating: stats.avgRating - globalStats.avgRating,
    adr: stats.avgAdr - globalStats.avgAdr,
    hsPercent: stats.avgHsPercent - globalStats.avgHsPercent,
    winRate: stats.winRate - (globalStats.winRate * 100),
  } : null;

  // Calculer les poids ajustés
  const customWeights = useMemo(() => {
    return categoryWeights ? convertUserWeightsToFeatureWeights(categoryWeights) : {};
  }, [categoryWeights]);

  const adjustedWeights = useMemo(() => {
    return getAdjustedWeights(enabledAnalyzers, customWeights);
  }, [enabledAnalyzers, customWeights]);

  // Nombre de catégories activées/désactivées
  const enabledCount = enabledAnalyzers.filter(id => id.startsWith('analysis.')).length;
  const disabledCount = CATEGORY_CONFIG.length - enabledCount;

  // Trier les catégories: prioritaires d'abord, puis les autres
  const orderedCategories = useMemo(() => {
    if (priorityCategories.length === 0) return CATEGORY_CONFIG;
    const prioritySet = new Set(priorityCategories);
    const priorityCats = CATEGORY_CONFIG.filter(c => prioritySet.has(c.key as AnalysisCategory));
    const otherCats = CATEGORY_CONFIG.filter(c => !prioritySet.has(c.key as AnalysisCategory));
    return [...priorityCats, ...otherCats];
  }, [priorityCategories]);

  // Préparer les catégories avec leur état
  const categoriesWithState = useMemo(() => {
    return orderedCategories.map(cat => ({
      ...cat,
      isEnabled: enabledAnalyzers.includes(cat.featureId),
      isPriority: priorityCategories.includes(cat.key as AnalysisCategory),
      originalWeight: customWeights[cat.featureId] ?? 11.11,
      adjustedWeight: adjustedWeights[cat.featureId],
    }));
  }, [orderedCategories, enabledAnalyzers, priorityCategories, customWeights, adjustedWeights]);

  // Récupérer le score pour une catégorie
  const getScore = (scoreKey: string): number | undefined => {
    if (!analysisScores) return undefined;
    return analysisScores[scoreKey as keyof typeof analysisScores] as number | undefined;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/maps"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour aux maps
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white capitalize">{mapName}</h1>
            <GranularityBadge level="map" showLabel />
          </div>
          <p className="text-gray-400 mt-1">
            Statistiques agrégées sur {stats.gamesPlayed} parties
          </p>
        </div>
      </div>

      {/* Stats principales avec MetricDisplay */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <MetricDisplay
            metricId="rating"
            value={stats.avgRating}
            granularity="map"
            previousValue={globalStats?.avgRating}
            showTrend={!!globalStats}
            size="md"
          />
        </Card>
        <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <MetricDisplay
            metricId="adr"
            value={stats.avgAdr}
            granularity="map"
            previousValue={globalStats?.avgAdr}
            showTrend={!!globalStats}
            size="md"
          />
        </Card>
        <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <MetricDisplay
            metricId="winRate"
            value={stats.winRate}
            granularity="map"
            previousValue={globalStats ? globalStats.winRate * 100 : undefined}
            showTrend={!!globalStats}
            size="md"
          />
        </Card>
        <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <MetricDisplay
            metricId="kd"
            value={stats.totalDeaths > 0 ? stats.totalKills / stats.totalDeaths : stats.totalKills}
            granularity="map"
            size="md"
          />
        </Card>
      </div>

      {/* Bilan W/L */}
      <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{stats.wins}</div>
                <div className="text-xs text-gray-400 uppercase">Victoires</div>
              </div>
              <div className="text-2xl text-gray-600">-</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{stats.losses}</div>
                <div className="text-xs text-gray-400 uppercase">Défaites</div>
              </div>
              {stats.ties > 0 && (
                <>
                  <div className="text-2xl text-gray-600">-</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-400">{stats.ties}</div>
                    <div className="text-xs text-gray-400 uppercase">Nuls</div>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.round(stats.winRate)}%
              </div>
              <div className="text-sm text-gray-400">Win Rate sur {mapName}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille principale */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 9 Catégories v2 */}
        <Card className="lg:col-span-2 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Scores d&apos;analyse sur {mapName}</CardTitle>
              <GranularityBadge level="map" />
              <InfoTooltip
                variant="help"
                size="sm"
                content={
                  <div className="space-y-2">
                    <div className="font-medium text-white">Système de poids</div>
                    <p className="text-xs text-gray-300">
                      Les catégories avec une <Star className="w-3 h-3 inline text-yellow-400" /> sont vos priorités.
                      Elles s&apos;affichent en premier.
                    </p>
                    <p className="text-xs text-gray-400">
                      Les catégories grisées sont désactivées. Leur poids est redistribué aux autres.
                    </p>
                    <Link
                      href="/dashboard/settings"
                      className="text-cs2-accent text-xs hover:underline block mt-2"
                    >
                      Personnaliser →
                    </Link>
                  </div>
                }
              />
            </div>
            <div className="flex items-center gap-3">
              {disabledCount > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {disabledCount} désactivée{disabledCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {analysisScores ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categoriesWithState.map((cat) => (
                  <div key={cat.key} className="relative">
                    {cat.isPriority && (
                      <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 fill-yellow-400 z-10" />
                    )}
                    <CategoryScoreCard
                      category={cat.key as AnalysisCategory}
                      label={cat.label}
                      score={cat.isEnabled ? getScore(cat.scoreKey) : undefined}
                      icon={cat.icon}
                      iconColor={cat.color}
                      iconBgColor={cat.bgColor}
                      isEnabled={cat.isEnabled}
                      disabledReason="disabled_by_user"
                      originalWeight={cat.originalWeight}
                      adjustedWeight={cat.adjustedWeight}
                      showWeightInfo={true}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            ) : enabledCount === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Lock className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                <p>Toutes les catégories sont désactivées.</p>
                <Link
                  href="/dashboard/settings"
                  className="text-cs2-accent hover:underline text-sm mt-2 inline-flex items-center gap-1"
                >
                  <Settings className="w-4 h-4" />
                  Configurer les analyseurs
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Pas d&apos;analyses disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forces et faiblesses */}
        <div className="space-y-4">
          {/* Forces */}
          <Card className="border-green-500/20 bg-gradient-to-br from-green-900/10 to-gray-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                Points forts sur {mapName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recurringStrengths.length > 0 ? (
                <div className="space-y-2">
                  {recurringStrengths.slice(0, 3).map((strength) => (
                    <div key={strength.name} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-gray-300 flex-1">{strength.name}</span>
                      <span className="text-gray-500">{strength.percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Pas assez de données</p>
              )}
            </CardContent>
          </Card>

          {/* Faiblesses */}
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-900/10 to-gray-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                À améliorer sur {mapName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recurringWeaknesses.length > 0 ? (
                <div className="space-y-2">
                  {recurringWeaknesses.slice(0, 3).map((weakness) => (
                    <div key={weakness.name} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="text-gray-300 flex-1">{weakness.name}</span>
                      <span className="text-gray-500">{weakness.percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Pas assez de données</p>
              )}
              {recurringWeaknesses.length > 0 && (
                <Link
                  href="/dashboard/coaching"
                  className="inline-flex items-center gap-1 mt-4 text-sm text-orange-400 hover:text-orange-300"
                >
                  Voir le coaching
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historique des parties */}
      <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Historique sur {mapName}</CardTitle>
            <GranularityBadge level="demo" />
          </div>
          <span className="text-sm text-gray-500">{demos.length} parties</span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {demos.slice(0, 10).map((demo) => (
              <Link
                key={demo.id}
                href={`/dashboard/demos/${demo.id}`}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-900/30 hover:bg-gray-800/50 transition-colors group"
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center font-bold
                  ${demo.matchResult === 'WIN' ? 'bg-green-500/20 text-green-400' : ''}
                  ${demo.matchResult === 'LOSS' ? 'bg-red-500/20 text-red-400' : ''}
                  ${demo.matchResult === 'TIE' ? 'bg-gray-500/20 text-gray-400' : ''}
                `}>
                  {demo.matchResult === 'WIN' ? 'V' : demo.matchResult === 'LOSS' ? 'D' : 'N'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white group-hover:text-cs2-accent transition-colors">
                      {demo.scoreTeam1} - {demo.scoreTeam2}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-cs2-accent">
                    {demo.rating.toFixed(2)}
                  </div>
                  {demo.analysisScore !== null && (
                    <div className="text-xs text-gray-500">
                      Score: {Math.round(demo.analysisScore)}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
              </Link>
            ))}
          </div>
          {demos.length > 10 && (
            <div className="text-center mt-4">
              <span className="text-sm text-gray-500">
                + {demos.length - 10} autres parties
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

