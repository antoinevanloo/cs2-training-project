import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  RANK_BENCHMARKS,
  getBenchmarkForRank,
  getNextRank,
} from '@/lib/coaching/actionable';
import { CS2Rank } from '@prisma/client';
import { BenchmarkMetrics } from '@/lib/coaching/actionable/benchmarks';

/**
 * GET /api/coaching/benchmarks
 *
 * Récupère les benchmarks par rank.
 *
 * Query params:
 * - rank: Rank spécifique (SILVER, GOLD_NOVA, etc.)
 * - compare: Si "true" avec currentRank et targetRank, compare les valeurs
 * - currentRank: Rank actuel pour la comparaison
 * - targetRank: Rank cible pour la comparaison
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rank = searchParams.get('rank') as CS2Rank | null;
    const wantCompare = searchParams.get('compare') === 'true';
    const currentRank = searchParams.get('currentRank') as CS2Rank | null;
    const targetRank = searchParams.get('targetRank') as CS2Rank | null;

    // Si on veut comparer deux ranks
    if (wantCompare && currentRank && targetRank) {
      const currentBenchmark = getBenchmarkForRank(currentRank);
      const targetBenchmark = getBenchmarkForRank(targetRank);

      if (!currentBenchmark || !targetBenchmark) {
        return NextResponse.json(
          { error: 'Rank invalide' },
          { status: 400 }
        );
      }

      // Calculer les différences par catégorie
      const comparison = {
        currentRank: {
          rank: currentRank,
          displayName: currentBenchmark.displayName,
        },
        targetRank: {
          rank: targetRank,
          displayName: targetBenchmark.displayName,
        },
        nextRank: getNextRank(currentRank),
        differences: calculateDifferences(currentBenchmark.metrics, targetBenchmark.metrics),
        keyMetricsToImprove: getKeyMetricsToImprove(currentBenchmark.metrics, targetBenchmark.metrics),
      };

      return NextResponse.json({
        success: true,
        comparison,
      });
    }

    // Si on veut un rank spécifique
    if (rank) {
      const benchmark = getBenchmarkForRank(rank);

      if (!benchmark) {
        return NextResponse.json(
          { error: 'Rank invalide' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        benchmark: {
          rank: benchmark.rank,
          displayName: benchmark.displayName,
          eloRange: benchmark.eloRange,
          metrics: benchmark.metrics,
        },
      });
    }

    // Sinon, retourner tous les ranks disponibles avec leurs moyennes
    const allRanks = Object.entries(RANK_BENCHMARKS).map(([key, value]) => ({
      rank: key,
      displayName: value.displayName,
      eloRange: value.eloRange,
      overview: {
        avgHeadshotPercentage: value.metrics.aim.headshotPercentage.average,
        avgRating: value.metrics.overall.rating.average,
        avgAdr: value.metrics.decision.adr.average,
        avgKast: value.metrics.decision.kast.average,
      },
    }));

    return NextResponse.json({
      success: true,
      ranks: allRanks,
      meta: {
        totalRanks: allRanks.length,
        competitiveRanks: ['SILVER', 'GOLD_NOVA', 'MASTER_GUARDIAN', 'LEGENDARY_EAGLE', 'SUPREME', 'GLOBAL'],
        premierRanks: ['PREMIER_0_5000', 'PREMIER_5000_10000', 'PREMIER_10000_15000', 'PREMIER_15000_20000', 'PREMIER_20000_PLUS'],
      },
    });
  } catch (error) {
    console.error('Erreur récupération benchmarks:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des benchmarks' },
      { status: 500 }
    );
  }
}

/**
 * Calcule les différences entre deux benchmarks
 */
function calculateDifferences(
  current: BenchmarkMetrics,
  target: BenchmarkMetrics
): Record<string, { current: number; target: number; gap: number; gapPercent: number }> {
  const differences: Record<string, { current: number; target: number; gap: number; gapPercent: number }> = {};

  // Métriques clés à comparer
  const keyMetrics: { category: keyof BenchmarkMetrics; metric: string; name: string }[] = [
    { category: 'aim', metric: 'headshotPercentage', name: 'Headshot %' },
    { category: 'aim', metric: 'firstBulletAccuracy', name: 'First Bullet Accuracy' },
    { category: 'aim', metric: 'reactionTimeMs', name: 'Reaction Time' },
    { category: 'positioning', metric: 'isolatedDeathRate', name: 'Isolated Death Rate' },
    { category: 'positioning', metric: 'mapControlScore', name: 'Map Control' },
    { category: 'utility', metric: 'flashEfficiency', name: 'Flash Efficiency' },
    { category: 'utility', metric: 'dyingWithUtilityRate', name: 'Dying with Utility' },
    { category: 'timing', metric: 'tradeSuccessRate', name: 'Trade Success' },
    { category: 'decision', metric: 'clutchWinRate', name: 'Clutch Win Rate' },
    { category: 'decision', metric: 'adr', name: 'ADR' },
    { category: 'overall', metric: 'rating', name: 'Rating' },
  ];

  for (const { category, metric, name } of keyMetrics) {
    const currentMetric = (current[category] as Record<string, { average: number }>)[metric];
    const targetMetric = (target[category] as Record<string, { average: number }>)[metric];

    if (currentMetric && targetMetric) {
      const gap = targetMetric.average - currentMetric.average;
      const gapPercent = currentMetric.average !== 0
        ? (gap / currentMetric.average) * 100
        : 0;

      differences[name] = {
        current: currentMetric.average,
        target: targetMetric.average,
        gap,
        gapPercent: Math.round(gapPercent * 10) / 10,
      };
    }
  }

  return differences;
}

/**
 * Identifie les métriques clés à améliorer en priorité
 */
function getKeyMetricsToImprove(
  current: BenchmarkMetrics,
  target: BenchmarkMetrics
): { metric: string; category: string; improvement: string; priority: number }[] {
  const improvements: { metric: string; category: string; improvement: string; priority: number; gap: number }[] = [];

  // Aim
  const hsGap = target.aim.headshotPercentage.average - current.aim.headshotPercentage.average;
  if (hsGap > 3) {
    improvements.push({
      metric: 'Headshot Percentage',
      category: 'aim',
      improvement: `+${hsGap.toFixed(0)}% headshots`,
      priority: 1,
      gap: hsGap,
    });
  }

  // Positioning
  const isolatedGap = current.positioning.isolatedDeathRate.average - target.positioning.isolatedDeathRate.average;
  if (isolatedGap > 0.05) {
    improvements.push({
      metric: 'Isolated Deaths',
      category: 'positioning',
      improvement: `-${(isolatedGap * 100).toFixed(0)}% morts isolées`,
      priority: 1,
      gap: isolatedGap * 100,
    });
  }

  // Utility
  const flashGap = target.utility.flashEfficiency.average - current.utility.flashEfficiency.average;
  if (flashGap > 0.05) {
    improvements.push({
      metric: 'Flash Efficiency',
      category: 'utility',
      improvement: `+${(flashGap * 100).toFixed(0)}% efficacité`,
      priority: 2,
      gap: flashGap * 100,
    });
  }

  // Timing
  const tradeGap = target.timing.tradeSuccessRate.average - current.timing.tradeSuccessRate.average;
  if (tradeGap > 0.05) {
    improvements.push({
      metric: 'Trade Success',
      category: 'timing',
      improvement: `+${(tradeGap * 100).toFixed(0)}% trades réussis`,
      priority: 2,
      gap: tradeGap * 100,
    });
  }

  // Decision
  const clutchGap = target.timing.clutchConversionRate.average - current.timing.clutchConversionRate.average;
  if (clutchGap > 0.03) {
    improvements.push({
      metric: 'Clutch Win Rate',
      category: 'decision',
      improvement: `+${(clutchGap * 100).toFixed(0)}% clutchs gagnés`,
      priority: 3,
      gap: clutchGap * 100,
    });
  }

  // Sort by gap and take top 5
  return improvements
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5)
    .map(({ metric, category, improvement, priority }) => ({ metric, category, improvement, priority }));
}