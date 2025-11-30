'use client';

import { useState, useTransition } from 'react';
import { CS2Rank } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Progress } from '@/components/ui/Progress';
import {
  RANK_BENCHMARKS,
  compareToRank,
  type RankBenchmark,
} from '@/lib/coaching/actionable/benchmarks';

// Types pour les props
interface PlayerStats {
  rating: number;
  adr: number;
  kast: number;
  hsPercent: number;
  winRate?: number;
}

interface RankComparisonProps {
  playerStats: PlayerStats;
  currentRank?: CS2Rank | null;
  targetRank?: CS2Rank | null;
  onTargetRankChange?: (rank: CS2Rank) => Promise<void>;
}

// Options de rang pour le select
const RANK_OPTIONS = [
  { value: 'SILVER', label: 'Silver' },
  { value: 'GOLD_NOVA', label: 'Gold Nova' },
  { value: 'MASTER_GUARDIAN', label: 'Master Guardian' },
  { value: 'LEGENDARY_EAGLE', label: 'Legendary Eagle' },
  { value: 'SUPREME', label: 'Supreme' },
  { value: 'GLOBAL', label: 'Global Elite' },
  { value: 'PREMIER_0_5000', label: 'Premier (0-5K)' },
  { value: 'PREMIER_5000_10000', label: 'Premier (5K-10K)' },
  { value: 'PREMIER_10000_15000', label: 'Premier (10K-15K)' },
  { value: 'PREMIER_15000_20000', label: 'Premier (15K-20K)' },
  { value: 'PREMIER_20000_PLUS', label: 'Premier (20K+)' },
];

// Couleurs pour les status
const STATUS_COLORS = {
  below_average: 'text-red-400',
  average: 'text-yellow-400',
  above_average: 'text-green-400',
  excellent: 'text-emerald-400',
} as const;

const STATUS_BG = {
  below_average: 'bg-red-500',
  average: 'bg-yellow-500',
  above_average: 'bg-green-500',
  excellent: 'bg-emerald-500',
} as const;

const STATUS_LABELS = {
  below_average: 'En dessous',
  average: 'Dans la moyenne',
  above_average: 'Au-dessus',
  excellent: 'Excellent',
} as const;

export function RankComparison({
  playerStats,
  currentRank,
  targetRank: initialTargetRank,
  onTargetRankChange,
}: RankComparisonProps) {
  const [targetRank, setTargetRank] = useState<CS2Rank>(
    initialTargetRank || 'GOLD_NOVA'
  );
  const [isPending, startTransition] = useTransition();

  const benchmark = RANK_BENCHMARKS[targetRank];

  // Comparer les stats principales
  const comparisons = [
    {
      label: 'Rating',
      value: playerStats.rating,
      ...compareToRank(playerStats.rating, targetRank, 'overall', 'rating'),
      target: benchmark.metrics.overall.rating.average,
      format: (v: number) => v.toFixed(2),
    },
    {
      label: 'ADR',
      value: playerStats.adr,
      ...compareToRank(playerStats.adr, targetRank, 'decision', 'adr'),
      target: benchmark.metrics.decision.adr.average,
      format: (v: number) => Math.round(v).toString(),
    },
    {
      label: 'KAST',
      value: playerStats.kast,
      ...compareToRank(playerStats.kast, targetRank, 'decision', 'kast'),
      target: benchmark.metrics.decision.kast.average,
      format: (v: number) => `${Math.round(v)}%`,
    },
    {
      label: 'HS%',
      value: playerStats.hsPercent,
      ...compareToRank(
        playerStats.hsPercent,
        targetRank,
        'aim',
        'headshotPercentage'
      ),
      target: benchmark.metrics.aim.headshotPercentage.average,
      format: (v: number) => `${Math.round(v)}%`,
    },
  ];

  const handleRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRank = e.target.value as CS2Rank;
    setTargetRank(newRank);

    if (onTargetRankChange) {
      startTransition(async () => {
        await onTargetRankChange(newRank);
      });
    }
  };

  // Calculer le score global de progression
  const avgPercentile =
    comparisons.reduce((acc, c) => acc + c.percentile, 0) / comparisons.length;
  const isReady = avgPercentile >= 50;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Comparaison vs Rang Cible</CardTitle>
          <p className="text-sm text-gray-400 mt-1">
            Compare tes stats avec les moyennes de ton rang cible
          </p>
        </div>
        <div className="w-48">
          <Select
            options={RANK_OPTIONS}
            value={targetRank}
            onChange={handleRankChange}
            disabled={isPending}
          />
        </div>
      </CardHeader>

      <CardContent>
        {/* Score global */}
        <div className="mb-6 p-4 rounded-lg bg-gray-900/50 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Progression vers {benchmark.displayName}
            </span>
            <span
              className={`text-sm font-medium ${
                isReady ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {isReady ? 'Pret pour ce rang' : 'En progression'}
            </span>
          </div>
          <Progress value={avgPercentile} color="score" size="lg" />
          <p className="text-xs text-gray-500 mt-2">
            {Math.round(avgPercentile)}% des stats correspondent au niveau{' '}
            {benchmark.displayName}
          </p>
        </div>

        {/* Comparaisons detaillees */}
        <div className="space-y-4">
          {comparisons.map((comp) => (
            <div key={comp.label} className="flex items-center gap-4">
              {/* Label et valeur */}
              <div className="w-24">
                <span className="text-sm text-gray-400">{comp.label}</span>
              </div>

              {/* Valeur joueur */}
              <div className="w-20 text-right">
                <span className="text-lg font-bold text-white">
                  {comp.format(comp.value)}
                </span>
              </div>

              {/* Barre de progression */}
              <div className="flex-1">
                <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden">
                  {/* Marqueur cible */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                    style={{ left: '50%' }}
                  />

                  {/* Barre joueur */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 ${STATUS_BG[comp.status]} transition-all duration-500`}
                    style={{ width: `${Math.min(100, comp.percentile)}%` }}
                  />

                  {/* Label percentile */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white drop-shadow">
                      {Math.round(comp.percentile)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Valeur cible */}
              <div className="w-20 text-right">
                <span className="text-sm text-gray-500">
                  Cible: {comp.format(comp.target)}
                </span>
              </div>

              {/* Status */}
              <div className="w-28">
                <span className={`text-xs ${STATUS_COLORS[comp.status]}`}>
                  {STATUS_LABELS[comp.status]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Conseil */}
        <div className="mt-6 p-4 rounded-lg bg-cs2-accent/10 border border-cs2-accent/30">
          <p className="text-sm text-gray-300">
            {avgPercentile < 30 && (
              <>
                <span className="font-semibold text-cs2-accent">Focus recommande :</span>{' '}
                Concentre-toi sur les fondamentaux avant de viser ce rang.
              </>
            )}
            {avgPercentile >= 30 && avgPercentile < 50 && (
              <>
                <span className="font-semibold text-cs2-accent">En progression :</span>{' '}
                Continue tes efforts, tu te rapproches du niveau {benchmark.displayName}.
              </>
            )}
            {avgPercentile >= 50 && avgPercentile < 75 && (
              <>
                <span className="font-semibold text-cs2-accent">Bien parti :</span>{' '}
                Tes stats sont dans la moyenne de {benchmark.displayName}. Peaufine les details.
              </>
            )}
            {avgPercentile >= 75 && (
              <>
                <span className="font-semibold text-cs2-accent">Excellent :</span>{' '}
                Tu depasses le niveau {benchmark.displayName}. Vise plus haut !
              </>
            )}
          </p>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span>Legende :</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500" /> En dessous
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-500" /> Moyenne
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500" /> Au-dessus
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500" /> Excellent
          </span>
        </div>
      </CardContent>
    </Card>
  );
}