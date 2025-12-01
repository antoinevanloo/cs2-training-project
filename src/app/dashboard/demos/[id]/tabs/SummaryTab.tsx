'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { StrengthWeaknessCard } from '@/components/coaching';
import { CategoryRadarChart } from '@/components/charts';
import { ScoreCard } from '@/components/ui/ScoreCard';
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
}

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
              <span className="text-xs text-gray-500">9 catégories v2</span>
            </div>
            <div className="flex justify-center">
              <CategoryRadarChart
                scores={categoryScores}
                size={280}
                showLabels={true}
                showValues={true}
                showLegend={false}
                animated={true}
                onCategoryClick={onCategoryClick}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid 3x3 des scores par catégorie */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Détail par catégorie</h3>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-1">
            Personnaliser <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_ORDER.map((category) => {
            const score = categoryScores[category as keyof CategoryScores] || 0;
            const prevScore = previousScores?.[category as keyof CategoryScores];

            return (
              <ScoreCard
                key={category}
                category={category}
                score={score}
                previousScore={prevScore}
                variant="compact"
                showTrend={prevScore !== undefined}
                interactive={true}
                animate={true}
                onClick={() => onCategoryClick?.(category)}
              />
            );
          })}
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
