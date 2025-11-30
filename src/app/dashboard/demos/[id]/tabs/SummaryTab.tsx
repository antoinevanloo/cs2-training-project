'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { StrengthWeaknessCard } from '@/components/coaching';
import { CategoryRadarChart } from '@/components/charts';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { Lightbulb, Calendar, Trophy, Skull, Minus } from 'lucide-react';

interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  rating: number;
  headshotPercentage: number;
  kast: number;
}

interface CategoryScores {
  aim?: number;
  positioning?: number;
  utility?: number;
  economy?: number;
  timing?: number;
  decision?: number;
}

interface Comparison {
    rating: number;
    adr: number;
    hsPercent: number;
    kast: number;
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
}: SummaryTabProps) {
  const resultConfig = {
    WIN: { icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Victoire' },
    LOSS: { icon: Skull, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Défaite' },
    TIE: { icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Égalité' },
  };

  const result = resultConfig[matchResult];
  const ResultIcon = result.icon;

  const priorityAdvice = weaknesses.length > 0
    ? `Focus sur: ${weaknesses[0]}`
    : 'Continue comme ça, tu progresses bien !';

  return (
    <div className="space-y-6">
      {/* Score global + Résultat + Radar */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-6 flex flex-col items-center">
            <div className={`flex items-center gap-2 mb-4 px-3 py-1 rounded-full ${result.bg}`}>
              <ResultIcon className={`w-4 h-4 ${result.color}`} />
              <span className={`text-sm font-medium ${result.color}`}>{result.label}</span>
            </div>
            <CircularProgress
              value={overallScore}
              size={140}
              strokeWidth={12}
              color="score"
            />
            <p className="text-gray-400 mt-4 text-center text-sm">
              Score global de performance
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700/50 lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Répartition des compétences</h3>
            <div className="flex justify-center">
              <CategoryRadarChart
                scores={categoryScores}
                size={220}
                showLabels={true}
                showLegend={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>

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
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">K/D/A</span>
                <span className="text-2xl font-bold text-white">
                  {playerStats.kills}/{playerStats.deaths}/{playerStats.assists}
                </span>
              </div>
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
          </div>
        </CardContent>
      </Card>

      <StrengthWeaknessCard
        strengths={strengths}
        weaknesses={weaknesses}
        maxItems={3}
        onViewMore={onViewCoaching}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onViewCoaching}
          className="flex-1 gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          Voir les insights détaillés
        </Button>
        <Button
          onClick={onViewPlan}
          variant="secondary"
          className="flex-1 gap-2"
        >
          <Calendar className="w-4 h-4" />
          Voir le plan d&apos;entraînement
        </Button>
      </div>
    </div>
  );
}

function StatMini({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/30 text-center">
      <div className={`text-lg font-bold ${highlight ? 'text-cs2-accent' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
