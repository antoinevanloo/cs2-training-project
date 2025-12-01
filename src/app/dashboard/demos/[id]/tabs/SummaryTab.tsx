'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { StrengthWeaknessCard } from '@/components/coaching';
import { CategoryRadarChart } from '@/components/charts';
import { CategoryScoreCard } from '@/components/ui/CategoryScoreCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import {
  Lightbulb,
  Calendar,
  Trophy,
  Skull,
  Minus,
  TrendingUp,
  Target,
  ChevronRight,
  Crosshair,
  MapPin,
  Bomb,
  DollarSign,
  Clock,
  Brain,
  Move,
  Eye,
  Users,
  Lock,
  Star,
  Settings,
} from 'lucide-react';
import type { AnalysisCategory } from '@/lib/preferences/types';
import { CATEGORY_ORDER, getScoreLevel, getScoreColor } from '@/lib/design/tokens';

interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  rating: number;
  headshotPercentage: number;
  kast: number;
}

// Scores pour les 9 catégories v2
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

interface Comparison {
  rating: number;
  adr: number;
  hsPercent: number;
  kast: number;
}

// Quick insights pour les priorités
interface QuickInsight {
  category: AnalysisCategory;
  type: 'strength' | 'weakness' | 'improvement';
  message: string;
  score: number;
}

interface SummaryTabProps {
  overallScore: number;
  categoryScores: CategoryScores;
  strengths: string[];
  weaknesses: string[];
  playerStats: PlayerStats | null;
  matchResult: 'WIN' | 'LOSS' | 'TIE';
  onViewCoaching: () => void;
  onViewPlan: () => void;
  comparison: Comparison | null;
  previousScores?: CategoryScores;
  onCategoryClick?: (category: AnalysisCategory) => void;
  /** All scores including disabled categories (with original values) */
  allCategoryScores?: CategoryScores;
  /** IDs des analyseurs activés */
  enabledAnalyzers?: string[];
  /** Catégories prioritaires (affichées avec étoile) */
  priorityCategories?: AnalysisCategory[];
}

// Configuration des 9 catégories
const CATEGORY_CONFIG = [
  { key: 'aim', featureId: 'analysis.aim', label: 'Aim', icon: Crosshair, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { key: 'positioning', featureId: 'analysis.positioning', label: 'Position', icon: MapPin, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { key: 'utility', featureId: 'analysis.utility', label: 'Utility', icon: Bomb, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { key: 'economy', featureId: 'analysis.economy', label: 'Economy', icon: DollarSign, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { key: 'timing', featureId: 'analysis.timing', label: 'Timing', icon: Clock, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { key: 'decision', featureId: 'analysis.decision', label: 'Decision', icon: Brain, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { key: 'movement', featureId: 'analysis.movement', label: 'Movement', icon: Move, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { key: 'awareness', featureId: 'analysis.awareness', label: 'Awareness', icon: Eye, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  { key: 'teamplay', featureId: 'analysis.teamplay', label: 'Teamplay', icon: Users, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
];

// Génère les quick insights basés sur les scores
function generateQuickInsights(
  scores: CategoryScores,
  previousScores?: CategoryScores
): QuickInsight[] {
  const insights: QuickInsight[] = [];

  // Trouver les 3 meilleures et pires catégories
  const sortedCategories = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      score: scores[cat as keyof CategoryScores] || 0,
      previousScore: previousScores?.[cat as keyof CategoryScores],
    }))
    .sort((a, b) => b.score - a.score);

  // Top force
  if (sortedCategories[0].score >= 70) {
    insights.push({
      category: sortedCategories[0].category,
      type: 'strength',
      message: `Excellent ${sortedCategories[0].category} - continue sur cette lancée`,
      score: sortedCategories[0].score,
    });
  }

  // Pire faiblesse
  const worst = sortedCategories[sortedCategories.length - 1];
  if (worst.score < 50) {
    insights.push({
      category: worst.category,
      type: 'weakness',
      message: `Focus sur le ${worst.category} pour progresser`,
      score: worst.score,
    });
  }

  // Meilleure amélioration
  if (previousScores) {
    const improvements = sortedCategories
      .filter((c) => c.previousScore !== undefined)
      .map((c) => ({
        ...c,
        improvement: c.score - (c.previousScore || 0),
      }))
      .filter((c) => c.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement);

    if (improvements.length > 0 && improvements[0].improvement >= 5) {
      insights.push({
        category: improvements[0].category,
        type: 'improvement',
        message: `+${improvements[0].improvement.toFixed(0)} en ${improvements[0].category}`,
        score: improvements[0].score,
      });
    }
  }

  return insights.slice(0, 3);
}

export function SummaryTab({
  overallScore,
  categoryScores,
  strengths,
  weaknesses,
  playerStats,
  matchResult,
  onViewCoaching,
  onViewPlan,
  comparison,
  previousScores,
  onCategoryClick,
  allCategoryScores,
  enabledAnalyzers = [],
  priorityCategories = [],
}: SummaryTabProps) {
  const resultConfig = {
    WIN: { icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Victoire' },
    LOSS: { icon: Skull, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Défaite' },
    TIE: { icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Égalité' },
  };

  const result = resultConfig[matchResult];
  const ResultIcon = result.icon;
  const scoreLevel = getScoreLevel(overallScore);

  // Quick insights
  const quickInsights = useMemo(
    () => generateQuickInsights(categoryScores, previousScores),
    [categoryScores, previousScores]
  );

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
    return orderedCategories.map(cat => {
      const isEnabled = enabledAnalyzers.length === 0 || enabledAnalyzers.includes(cat.featureId);
      return {
        ...cat,
        isEnabled,
        isPriority: priorityCategories.includes(cat.key as AnalysisCategory),
        // Use enabled score if enabled, otherwise use all scores (for grayed display)
        score: isEnabled
          ? categoryScores[cat.key as keyof CategoryScores]
          : allCategoryScores?.[cat.key as keyof CategoryScores],
      };
    });
  }, [orderedCategories, enabledAnalyzers, priorityCategories, categoryScores, allCategoryScores]);

  // Catégories désactivées pour le radar chart (grisées mais visibles)
  const disabledCategoriesForRadar = useMemo(() => {
    if (enabledAnalyzers.length === 0) return []; // Toutes activées si non spécifié
    const allCategories = CATEGORY_CONFIG.map(c => c.key);
    const enabledKeys = enabledAnalyzers
      .filter(id => id.startsWith('analysis.'))
      .map(id => id.replace('analysis.', ''));
    return allCategories.filter(cat => !enabledKeys.includes(cat)) as AnalysisCategory[];
  }, [enabledAnalyzers]);

  const priorityAdvice = weaknesses.length > 0
    ? `Focus sur: ${weaknesses[0]}`
    : 'Continue comme ça, tu progresses bien !';

  return (
    <div className="space-y-6">
      {/* Section Hero: Score global + Radar Chart */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Score global avec résultat */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center relative">
            {/* Background glow */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `radial-gradient(circle at center, ${scoreLevel.color} 0%, transparent 70%)`,
              }}
            />

            {/* Match result badge */}
            <div className={`flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full ${result.bg} ${result.border} border`}>
              <ResultIcon className={`w-4 h-4 ${result.color}`} />
              <span className={`text-sm font-semibold ${result.color}`}>{result.label}</span>
            </div>

            {/* Score circulaire */}
            <div className="relative">
              <CircularProgress
                value={overallScore}
                size={160}
                strokeWidth={14}
                color="score"
              />
              {/* Score level badge */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${scoreLevel.color}20`,
                  color: scoreLevel.color,
                }}
              >
                {scoreLevel.label}
              </div>
            </div>

            <p className="text-gray-400 mt-6 text-center text-sm">
              Score global de performance
            </p>

            {/* Quick stats row */}
            {playerStats && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700/50">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{playerStats.rating.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
                <div className="w-px h-8 bg-gray-700" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{playerStats.kills}/{playerStats.deaths}/{playerStats.assists}</div>
                  <div className="text-xs text-gray-500">K/D/A</div>
                </div>
                <div className="w-px h-8 bg-gray-700" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{playerStats.adr.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">ADR</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart - 9 axes */}
        <Card className="lg:col-span-3 bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Profil de compétences</h3>
              <span className="text-xs text-gray-500">
                {disabledCategoriesForRadar.length > 0
                  ? `${9 - disabledCategoriesForRadar.length} catégories actives`
                  : '9 catégories'}
              </span>
            </div>
            <div className="flex justify-center">
              <CategoryRadarChart
                scores={categoryScores}
                size={280}
                showLabels={true}
                showValues={true}
                showLegend={false}
                animated={true}
                disabledCategories={disabledCategoriesForRadar}
                onCategoryClick={onCategoryClick}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid 3x3 des scores par catégorie */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-semibold">Détail par catégorie</h3>
            <InfoTooltip
              variant="help"
              size="sm"
              content={
                <div className="space-y-2">
                  <div className="font-medium text-white">Catégories d&apos;analyse</div>
                  <p className="text-xs text-gray-300">
                    Les catégories avec <Star className="w-3 h-3 inline text-yellow-400" /> sont vos priorités.
                  </p>
                  <p className="text-xs text-gray-400">
                    Les catégories grisées sont désactivées dans vos paramètres.
                  </p>
                  <Link href="/dashboard/settings" className="text-cs2-accent text-xs hover:underline block mt-2">
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
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-1">
                <Settings className="w-4 h-4" />
                Personnaliser
              </Button>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesWithState.map((cat) => (
            <div key={cat.key} className="relative">
              {cat.isPriority && (
                <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 fill-yellow-400 z-10" />
              )}
              <CategoryScoreCard
                category={cat.key as AnalysisCategory}
                label={cat.label}
                score={cat.isEnabled ? cat.score : undefined}
                icon={cat.icon}
                iconColor={cat.color}
                iconBgColor={cat.bgColor}
                isEnabled={cat.isEnabled}
                disabledReason="disabled_by_user"
                showWeightInfo={false}
                size="md"
                onClick={cat.isEnabled ? () => onCategoryClick?.(cat.key as AnalysisCategory) : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      {quickInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickInsights.map((insight, index) => (
            <Card
              key={index}
              className={`p-4 border ${
                insight.type === 'strength'
                  ? 'bg-green-500/5 border-green-500/20'
                  : insight.type === 'weakness'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-blue-500/5 border-blue-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    insight.type === 'strength'
                      ? 'bg-green-500/20'
                      : insight.type === 'weakness'
                      ? 'bg-red-500/20'
                      : 'bg-blue-500/20'
                  }`}
                >
                  {insight.type === 'strength' && <Trophy className="w-4 h-4 text-green-400" />}
                  {insight.type === 'weakness' && <Target className="w-4 h-4 text-red-400" />}
                  {insight.type === 'improvement' && <TrendingUp className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{insight.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Score: <span style={{ color: getScoreColor(insight.score) }}>{insight.score.toFixed(0)}</span>
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats clés du match */}
      {playerStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
            <MetricDisplay
              metricId="rating"
              value={playerStats.rating}
              granularity="demo"
              previousValue={comparison ? playerStats.rating - comparison.rating : undefined}
              showTrend={!!comparison}
              size="md"
            />
          </Card>
          <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
            <MetricDisplay
              metricId="adr"
              value={playerStats.adr}
              granularity="demo"
              previousValue={comparison ? playerStats.adr - comparison.adr : undefined}
              showTrend={!!comparison}
              size="md"
            />
          </Card>
          <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
            <MetricDisplay
              metricId="headshotPercentage"
              value={playerStats.headshotPercentage}
              granularity="demo"
              previousValue={comparison ? playerStats.headshotPercentage - comparison.hsPercent : undefined}
              showTrend={!!comparison}
              size="md"
            />
          </Card>
          <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
            <MetricDisplay
              metricId="kast"
              value={playerStats.kast}
              granularity="demo"
              previousValue={comparison ? playerStats.kast - comparison.kast : undefined}
              showTrend={!!comparison}
              size="md"
            />
          </Card>
        </div>
      )}

      {/* Conseil prioritaire */}
      <Card className="bg-gradient-to-r from-cs2-accent/10 to-orange-500/5 border-cs2-accent/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cs2-accent/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-cs2-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Conseil prioritaire</p>
              <p className="text-white font-medium">{priorityAdvice}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewCoaching}
              className="text-cs2-accent hover:text-cs2-accent/80"
            >
              Voir plus
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forces & Faiblesses */}
      <StrengthWeaknessCard
        strengths={strengths}
        weaknesses={weaknesses}
        maxItems={3}
        onViewMore={onViewCoaching}
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onViewCoaching} className="flex-1 gap-2">
          <Lightbulb className="w-4 h-4" />
          Voir les insights détaillés
        </Button>
        <Button onClick={onViewPlan} variant="secondary" className="flex-1 gap-2">
          <Calendar className="w-4 h-4" />
          Voir le plan d&apos;entraînement
        </Button>
      </div>
    </div>
  );
}
