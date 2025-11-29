/**
 * Benchmarks par rank CS2
 *
 * Ces données sont basées sur des analyses de joueurs réels
 * et des études de plateformes comme Leetify, HLTV, etc.
 *
 * Structure extensible pour ajouter facilement de nouveaux metrics.
 */

import { CS2Rank } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface RankBenchmark {
  rank: CS2Rank;
  displayName: string;
  eloRange?: { min: number; max: number }; // Pour Premier
  metrics: BenchmarkMetrics;
}

export interface BenchmarkMetrics {
  // Aim metrics
  aim: {
    headshotPercentage: MetricBenchmark;
    firstBulletAccuracy: MetricBenchmark;
    reactionTimeMs: MetricBenchmark;
    sprayAccuracy: MetricBenchmark;
    crosshairPlacementScore: MetricBenchmark;
  };

  // Positioning metrics
  positioning: {
    survivalTimePerRound: MetricBenchmark;
    tradeableDeathRate: MetricBenchmark;
    isolatedDeathRate: MetricBenchmark;
    mapControlScore: MetricBenchmark;
    positioningScore: MetricBenchmark;
  };

  // Utility metrics
  utility: {
    flashEfficiency: MetricBenchmark;
    flashesPerMatch: MetricBenchmark;
    smokesPerMatch: MetricBenchmark;
    utilityDamagePerMatch: MetricBenchmark;
    dyingWithUtilityRate: MetricBenchmark;
  };

  // Economy metrics
  economy: {
    buyDecisionScore: MetricBenchmark;
    saveRoundCompliance: MetricBenchmark;
    avgMoneyAtDeath: MetricBenchmark;
    ecoRoundWinRate: MetricBenchmark;
  };

  // Timing metrics
  timing: {
    tradeSuccessRate: MetricBenchmark;
    peekTimingScore: MetricBenchmark;
    rotationSpeed: MetricBenchmark;
    clutchConversionRate: MetricBenchmark;
  };

  // Decision metrics
  decision: {
    openingDuelWinRate: MetricBenchmark;
    clutchWinRate: MetricBenchmark;
    kast: MetricBenchmark;
    impactRating: MetricBenchmark;
    adr: MetricBenchmark;
  };

  // Overall
  overall: {
    rating: MetricBenchmark;
    winRate: MetricBenchmark;
  };
}

export interface MetricBenchmark {
  /** Valeur moyenne pour ce rank */
  average: number;
  /** Valeur du percentile 25 (bas) */
  low: number;
  /** Valeur du percentile 75 (haut) */
  high: number;
  /** Valeur du percentile 90 (excellent) */
  excellent: number;
  /** Unité de mesure */
  unit: string;
  /** Plus c'est haut, mieux c'est (ou l'inverse) */
  higherIsBetter: boolean;
}

// ============================================
// BENCHMARKS DATA
// ============================================

export const RANK_BENCHMARKS: Record<CS2Rank, RankBenchmark> = {
  // SILVER
  SILVER: {
    rank: 'SILVER',
    displayName: 'Silver',
    metrics: {
      aim: {
        headshotPercentage: { average: 28, low: 20, high: 35, excellent: 42, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.25, low: 0.18, high: 0.32, excellent: 0.38, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 350, low: 420, high: 300, excellent: 260, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 35, low: 25, high: 45, excellent: 55, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 40, low: 30, high: 50, excellent: 60, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 45, low: 35, high: 55, excellent: 65, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.35, low: 0.25, high: 0.45, excellent: 0.55, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.55, low: 0.65, high: 0.45, excellent: 0.35, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 40, low: 30, high: 50, excellent: 60, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 40, low: 30, high: 50, excellent: 60, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.25, low: 0.15, high: 0.35, excellent: 0.45, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 4, low: 2, high: 6, excellent: 10, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 3, low: 1, high: 5, excellent: 8, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 80, low: 40, high: 120, excellent: 180, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.45, low: 0.55, high: 0.35, excellent: 0.25, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 55, low: 45, high: 65, excellent: 75, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.60, low: 0.50, high: 0.70, excellent: 0.80, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 3500, low: 4500, high: 2500, excellent: 1800, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.08, low: 0.04, high: 0.12, excellent: 0.18, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.35, low: 0.25, high: 0.45, excellent: 0.55, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 45, low: 35, high: 55, excellent: 65, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 6, low: 8, high: 5, excellent: 4, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.15, low: 0.08, high: 0.22, excellent: 0.30, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.40, low: 0.30, high: 0.50, excellent: 0.58, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.15, low: 0.08, high: 0.22, excellent: 0.30, unit: '%', higherIsBetter: true },
        kast: { average: 55, low: 45, high: 65, excellent: 72, unit: '%', higherIsBetter: true },
        impactRating: { average: 0.85, low: 0.70, high: 1.0, excellent: 1.15, unit: 'rating', higherIsBetter: true },
        adr: { average: 60, low: 50, high: 70, excellent: 80, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 0.85, low: 0.70, high: 1.0, excellent: 1.10, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.45, low: 0.35, high: 0.52, excellent: 0.58, unit: '%', higherIsBetter: true },
      },
    },
  },

  // GOLD NOVA
  GOLD_NOVA: {
    rank: 'GOLD_NOVA',
    displayName: 'Gold Nova',
    metrics: {
      aim: {
        headshotPercentage: { average: 38, low: 30, high: 45, excellent: 52, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.32, low: 0.25, high: 0.40, excellent: 0.48, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 300, low: 350, high: 260, excellent: 230, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 45, low: 35, high: 55, excellent: 65, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 52, low: 42, high: 62, excellent: 72, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 52, low: 42, high: 62, excellent: 72, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.45, low: 0.35, high: 0.55, excellent: 0.65, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.45, low: 0.55, high: 0.35, excellent: 0.28, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 50, low: 40, high: 60, excellent: 70, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 52, low: 42, high: 62, excellent: 72, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.35, low: 0.25, high: 0.45, excellent: 0.55, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 6, low: 4, high: 10, excellent: 14, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 5, low: 3, high: 7, excellent: 10, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 120, low: 80, high: 160, excellent: 220, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.38, low: 0.48, high: 0.28, excellent: 0.20, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 65, low: 55, high: 75, excellent: 82, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.70, low: 0.60, high: 0.80, excellent: 0.88, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 3000, low: 4000, high: 2200, excellent: 1600, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.12, low: 0.06, high: 0.18, excellent: 0.24, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.45, low: 0.35, high: 0.55, excellent: 0.65, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 55, low: 45, high: 65, excellent: 75, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 5, low: 7, high: 4, excellent: 3.5, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.22, low: 0.14, high: 0.30, excellent: 0.38, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.48, low: 0.38, high: 0.55, excellent: 0.62, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.22, low: 0.14, high: 0.30, excellent: 0.38, unit: '%', higherIsBetter: true },
        kast: { average: 62, low: 52, high: 70, excellent: 76, unit: '%', higherIsBetter: true },
        impactRating: { average: 0.95, low: 0.80, high: 1.10, excellent: 1.22, unit: 'rating', higherIsBetter: true },
        adr: { average: 70, low: 58, high: 80, excellent: 90, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 0.95, low: 0.82, high: 1.08, excellent: 1.18, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.48, low: 0.40, high: 0.55, excellent: 0.62, unit: '%', higherIsBetter: true },
      },
    },
  },

  // MASTER GUARDIAN
  MASTER_GUARDIAN: {
    rank: 'MASTER_GUARDIAN',
    displayName: 'Master Guardian',
    metrics: {
      aim: {
        headshotPercentage: { average: 45, low: 38, high: 52, excellent: 58, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.40, low: 0.32, high: 0.48, excellent: 0.55, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 265, low: 310, high: 235, excellent: 210, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 55, low: 45, high: 65, excellent: 75, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 62, low: 52, high: 72, excellent: 80, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 58, low: 48, high: 68, excellent: 78, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.55, low: 0.45, high: 0.65, excellent: 0.72, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.38, low: 0.48, high: 0.28, excellent: 0.22, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 60, low: 50, high: 70, excellent: 78, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 62, low: 52, high: 72, excellent: 80, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.45, low: 0.35, high: 0.55, excellent: 0.65, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 10, low: 6, high: 14, excellent: 18, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 7, low: 5, high: 10, excellent: 14, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 160, low: 110, high: 210, excellent: 280, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.30, low: 0.40, high: 0.22, excellent: 0.15, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 72, low: 62, high: 80, excellent: 88, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.78, low: 0.68, high: 0.86, excellent: 0.92, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 2600, low: 3400, high: 2000, excellent: 1400, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.16, low: 0.10, high: 0.22, excellent: 0.28, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.55, low: 0.45, high: 0.65, excellent: 0.72, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 65, low: 55, high: 75, excellent: 82, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 4.5, low: 6, high: 3.5, excellent: 3, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.28, low: 0.20, high: 0.36, excellent: 0.44, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.52, low: 0.44, high: 0.60, excellent: 0.68, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.28, low: 0.20, high: 0.36, excellent: 0.44, unit: '%', higherIsBetter: true },
        kast: { average: 68, low: 58, high: 76, excellent: 82, unit: '%', higherIsBetter: true },
        impactRating: { average: 1.05, low: 0.90, high: 1.18, excellent: 1.30, unit: 'rating', higherIsBetter: true },
        adr: { average: 78, low: 66, high: 88, excellent: 98, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 1.02, low: 0.90, high: 1.14, excellent: 1.24, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.50, low: 0.42, high: 0.58, excellent: 0.65, unit: '%', higherIsBetter: true },
      },
    },
  },

  // LEGENDARY EAGLE
  LEGENDARY_EAGLE: {
    rank: 'LEGENDARY_EAGLE',
    displayName: 'Legendary Eagle',
    metrics: {
      aim: {
        headshotPercentage: { average: 50, low: 42, high: 58, excellent: 65, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.48, low: 0.40, high: 0.55, excellent: 0.62, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 240, low: 280, high: 210, excellent: 190, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 65, low: 55, high: 75, excellent: 82, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 72, low: 62, high: 80, excellent: 88, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 65, low: 55, high: 75, excellent: 85, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.62, low: 0.52, high: 0.72, excellent: 0.78, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.32, low: 0.42, high: 0.24, excellent: 0.18, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 68, low: 58, high: 78, excellent: 85, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 72, low: 62, high: 80, excellent: 88, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.52, low: 0.42, high: 0.62, excellent: 0.72, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 14, low: 10, high: 18, excellent: 24, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 10, low: 7, high: 13, excellent: 18, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 200, low: 150, high: 260, excellent: 340, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.24, low: 0.34, high: 0.18, excellent: 0.12, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 78, low: 68, high: 86, excellent: 92, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.84, low: 0.74, high: 0.90, excellent: 0.95, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 2200, low: 3000, high: 1700, excellent: 1200, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.20, low: 0.14, high: 0.26, excellent: 0.32, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.62, low: 0.52, high: 0.72, excellent: 0.78, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 72, low: 62, high: 80, excellent: 88, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 4, low: 5.5, high: 3.2, excellent: 2.8, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.34, low: 0.26, high: 0.42, excellent: 0.50, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.56, low: 0.48, high: 0.64, excellent: 0.72, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.34, low: 0.26, high: 0.42, excellent: 0.50, unit: '%', higherIsBetter: true },
        kast: { average: 72, low: 64, high: 80, excellent: 86, unit: '%', higherIsBetter: true },
        impactRating: { average: 1.12, low: 0.98, high: 1.25, excellent: 1.38, unit: 'rating', higherIsBetter: true },
        adr: { average: 84, low: 72, high: 95, excellent: 105, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 1.08, low: 0.96, high: 1.20, excellent: 1.30, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.52, low: 0.45, high: 0.60, excellent: 0.68, unit: '%', higherIsBetter: true },
      },
    },
  },

  // SUPREME
  SUPREME: {
    rank: 'SUPREME',
    displayName: 'Supreme',
    metrics: {
      aim: {
        headshotPercentage: { average: 55, low: 48, high: 62, excellent: 70, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.54, low: 0.46, high: 0.62, excellent: 0.70, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 220, low: 260, high: 195, excellent: 175, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 72, low: 62, high: 80, excellent: 88, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 78, low: 68, high: 86, excellent: 92, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 72, low: 62, high: 82, excellent: 90, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.68, low: 0.58, high: 0.76, excellent: 0.82, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.26, low: 0.36, high: 0.20, excellent: 0.14, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 75, low: 65, high: 83, excellent: 90, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 78, low: 68, high: 86, excellent: 92, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.58, low: 0.48, high: 0.68, excellent: 0.78, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 18, low: 14, high: 24, excellent: 30, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 12, low: 9, high: 16, excellent: 22, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 250, low: 190, high: 320, excellent: 400, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.18, low: 0.28, high: 0.12, excellent: 0.08, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 84, low: 74, high: 90, excellent: 95, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.88, low: 0.80, high: 0.94, excellent: 0.98, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 1900, low: 2600, high: 1400, excellent: 1000, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.24, low: 0.18, high: 0.30, excellent: 0.36, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.68, low: 0.58, high: 0.76, excellent: 0.82, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 78, low: 68, high: 86, excellent: 92, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 3.5, low: 5, high: 2.8, excellent: 2.4, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.40, low: 0.32, high: 0.48, excellent: 0.56, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.60, low: 0.52, high: 0.68, excellent: 0.75, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.40, low: 0.32, high: 0.48, excellent: 0.56, unit: '%', higherIsBetter: true },
        kast: { average: 76, low: 68, high: 84, excellent: 90, unit: '%', higherIsBetter: true },
        impactRating: { average: 1.18, low: 1.05, high: 1.32, excellent: 1.45, unit: 'rating', higherIsBetter: true },
        adr: { average: 90, low: 78, high: 102, excellent: 112, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 1.14, low: 1.02, high: 1.26, excellent: 1.36, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.54, low: 0.47, high: 0.62, excellent: 0.70, unit: '%', higherIsBetter: true },
      },
    },
  },

  // GLOBAL
  GLOBAL: {
    rank: 'GLOBAL',
    displayName: 'Global Elite',
    metrics: {
      aim: {
        headshotPercentage: { average: 58, low: 52, high: 65, excellent: 72, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.60, low: 0.52, high: 0.68, excellent: 0.75, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 200, low: 240, high: 175, excellent: 160, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 78, low: 68, high: 86, excellent: 92, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 85, low: 75, high: 92, excellent: 96, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 78, low: 68, high: 88, excellent: 95, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.74, low: 0.64, high: 0.82, excellent: 0.88, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.20, low: 0.30, high: 0.15, excellent: 0.10, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 82, low: 72, high: 90, excellent: 95, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 85, low: 75, high: 92, excellent: 96, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.65, low: 0.55, high: 0.75, excellent: 0.82, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 22, low: 16, high: 28, excellent: 35, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 15, low: 11, high: 20, excellent: 26, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 300, low: 230, high: 380, excellent: 460, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.12, low: 0.22, high: 0.08, excellent: 0.05, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 90, low: 82, high: 95, excellent: 98, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.92, low: 0.85, high: 0.96, excellent: 0.99, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 1600, low: 2200, high: 1200, excellent: 800, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.28, low: 0.22, high: 0.35, excellent: 0.42, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.74, low: 0.64, high: 0.82, excellent: 0.88, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 85, low: 75, high: 92, excellent: 96, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 3, low: 4.2, high: 2.4, excellent: 2, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.45, low: 0.36, high: 0.54, excellent: 0.62, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.65, low: 0.56, high: 0.72, excellent: 0.80, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.45, low: 0.36, high: 0.54, excellent: 0.62, unit: '%', higherIsBetter: true },
        kast: { average: 80, low: 72, high: 88, excellent: 93, unit: '%', higherIsBetter: true },
        impactRating: { average: 1.25, low: 1.12, high: 1.40, excellent: 1.52, unit: 'rating', higherIsBetter: true },
        adr: { average: 96, low: 84, high: 108, excellent: 118, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 1.20, low: 1.08, high: 1.32, excellent: 1.42, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.56, low: 0.48, high: 0.65, excellent: 0.72, unit: '%', higherIsBetter: true },
      },
    },
  },

  // PREMIER RANKS (ELO-based) - metrics defined inline to avoid circular reference
  PREMIER_0_5000: {
    rank: 'PREMIER_0_5000',
    displayName: 'Premier (0-5K)',
    eloRange: { min: 0, max: 5000 },
    metrics: {
      aim: {
        headshotPercentage: { average: 28, low: 20, high: 35, excellent: 42, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.25, low: 0.18, high: 0.32, excellent: 0.38, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 350, low: 420, high: 300, excellent: 260, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 35, low: 25, high: 45, excellent: 55, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 40, low: 30, high: 50, excellent: 60, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 45, low: 35, high: 55, excellent: 65, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.35, low: 0.25, high: 0.45, excellent: 0.55, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.55, low: 0.65, high: 0.45, excellent: 0.35, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 40, low: 30, high: 50, excellent: 60, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 40, low: 30, high: 50, excellent: 60, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.25, low: 0.15, high: 0.35, excellent: 0.45, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 4, low: 2, high: 6, excellent: 10, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 3, low: 1, high: 5, excellent: 8, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 80, low: 40, high: 120, excellent: 180, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.45, low: 0.55, high: 0.35, excellent: 0.25, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 55, low: 45, high: 65, excellent: 75, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.60, low: 0.50, high: 0.70, excellent: 0.80, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 3500, low: 4500, high: 2500, excellent: 1800, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.08, low: 0.04, high: 0.12, excellent: 0.18, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.35, low: 0.25, high: 0.45, excellent: 0.55, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 45, low: 35, high: 55, excellent: 65, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 6, low: 8, high: 5, excellent: 4, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.15, low: 0.08, high: 0.22, excellent: 0.30, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.40, low: 0.30, high: 0.50, excellent: 0.58, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.15, low: 0.08, high: 0.22, excellent: 0.30, unit: '%', higherIsBetter: true },
        kast: { average: 55, low: 45, high: 65, excellent: 72, unit: '%', higherIsBetter: true },
        impactRating: { average: 0.85, low: 0.70, high: 1.0, excellent: 1.15, unit: 'rating', higherIsBetter: true },
        adr: { average: 60, low: 50, high: 70, excellent: 80, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 0.85, low: 0.70, high: 1.0, excellent: 1.10, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.45, low: 0.35, high: 0.52, excellent: 0.58, unit: '%', higherIsBetter: true },
      },
    },
  },

  PREMIER_5000_10000: {
    rank: 'PREMIER_5000_10000',
    displayName: 'Premier (5K-10K)',
    eloRange: { min: 5000, max: 10000 },
    metrics: {
      aim: {
        headshotPercentage: { average: 38, low: 30, high: 45, excellent: 52, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.32, low: 0.25, high: 0.40, excellent: 0.48, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 300, low: 350, high: 260, excellent: 230, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 45, low: 35, high: 55, excellent: 65, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 52, low: 42, high: 62, excellent: 72, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 52, low: 42, high: 62, excellent: 72, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.45, low: 0.35, high: 0.55, excellent: 0.65, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.45, low: 0.55, high: 0.35, excellent: 0.28, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 50, low: 40, high: 60, excellent: 70, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 52, low: 42, high: 62, excellent: 72, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.35, low: 0.25, high: 0.45, excellent: 0.55, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 6, low: 4, high: 10, excellent: 14, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 5, low: 3, high: 7, excellent: 10, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 120, low: 80, high: 160, excellent: 220, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.38, low: 0.48, high: 0.28, excellent: 0.20, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 65, low: 55, high: 75, excellent: 82, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.70, low: 0.60, high: 0.80, excellent: 0.88, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 3000, low: 4000, high: 2200, excellent: 1600, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.12, low: 0.06, high: 0.18, excellent: 0.24, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.45, low: 0.35, high: 0.55, excellent: 0.65, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 55, low: 45, high: 65, excellent: 75, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 5, low: 7, high: 4, excellent: 3.5, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.22, low: 0.14, high: 0.30, excellent: 0.38, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.48, low: 0.38, high: 0.55, excellent: 0.62, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.22, low: 0.14, high: 0.30, excellent: 0.38, unit: '%', higherIsBetter: true },
        kast: { average: 62, low: 52, high: 70, excellent: 76, unit: '%', higherIsBetter: true },
        impactRating: { average: 0.95, low: 0.80, high: 1.10, excellent: 1.22, unit: 'rating', higherIsBetter: true },
        adr: { average: 70, low: 58, high: 80, excellent: 90, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 0.95, low: 0.82, high: 1.08, excellent: 1.18, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.48, low: 0.40, high: 0.55, excellent: 0.62, unit: '%', higherIsBetter: true },
      },
    },
  },

  PREMIER_10000_15000: {
    rank: 'PREMIER_10000_15000',
    displayName: 'Premier (10K-15K)',
    eloRange: { min: 10000, max: 15000 },
    metrics: {
      aim: {
        headshotPercentage: { average: 45, low: 38, high: 52, excellent: 58, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.40, low: 0.32, high: 0.48, excellent: 0.55, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 265, low: 310, high: 235, excellent: 210, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 55, low: 45, high: 65, excellent: 75, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 62, low: 52, high: 72, excellent: 80, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 58, low: 48, high: 68, excellent: 78, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.55, low: 0.45, high: 0.65, excellent: 0.72, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.38, low: 0.48, high: 0.28, excellent: 0.22, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 60, low: 50, high: 70, excellent: 78, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 62, low: 52, high: 72, excellent: 80, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.45, low: 0.35, high: 0.55, excellent: 0.65, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 10, low: 6, high: 14, excellent: 18, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 7, low: 5, high: 10, excellent: 14, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 160, low: 110, high: 210, excellent: 280, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.30, low: 0.40, high: 0.22, excellent: 0.15, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 72, low: 62, high: 80, excellent: 88, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.78, low: 0.68, high: 0.86, excellent: 0.92, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 2600, low: 3400, high: 2000, excellent: 1400, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.16, low: 0.10, high: 0.22, excellent: 0.28, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.55, low: 0.45, high: 0.65, excellent: 0.72, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 65, low: 55, high: 75, excellent: 82, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 4.5, low: 6, high: 3.5, excellent: 3, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.28, low: 0.20, high: 0.36, excellent: 0.44, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.52, low: 0.44, high: 0.60, excellent: 0.68, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.28, low: 0.20, high: 0.36, excellent: 0.44, unit: '%', higherIsBetter: true },
        kast: { average: 68, low: 58, high: 76, excellent: 82, unit: '%', higherIsBetter: true },
        impactRating: { average: 1.05, low: 0.90, high: 1.18, excellent: 1.30, unit: 'rating', higherIsBetter: true },
        adr: { average: 78, low: 66, high: 88, excellent: 98, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 1.02, low: 0.90, high: 1.14, excellent: 1.24, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.50, low: 0.42, high: 0.58, excellent: 0.65, unit: '%', higherIsBetter: true },
      },
    },
  },

  PREMIER_15000_20000: {
    rank: 'PREMIER_15000_20000',
    displayName: 'Premier (15K-20K)',
    eloRange: { min: 15000, max: 20000 },
    metrics: {
      aim: {
        headshotPercentage: { average: 50, low: 42, high: 58, excellent: 65, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.48, low: 0.40, high: 0.55, excellent: 0.62, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 240, low: 280, high: 210, excellent: 190, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 65, low: 55, high: 75, excellent: 82, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 72, low: 62, high: 80, excellent: 88, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 65, low: 55, high: 75, excellent: 85, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.62, low: 0.52, high: 0.72, excellent: 0.78, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.32, low: 0.42, high: 0.24, excellent: 0.18, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 68, low: 58, high: 78, excellent: 85, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 72, low: 62, high: 80, excellent: 88, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.52, low: 0.42, high: 0.62, excellent: 0.72, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 14, low: 10, high: 18, excellent: 24, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 10, low: 7, high: 13, excellent: 18, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 200, low: 150, high: 260, excellent: 340, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.24, low: 0.34, high: 0.18, excellent: 0.12, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 78, low: 68, high: 86, excellent: 92, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.84, low: 0.74, high: 0.90, excellent: 0.95, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 2200, low: 3000, high: 1700, excellent: 1200, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.20, low: 0.14, high: 0.26, excellent: 0.32, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.62, low: 0.52, high: 0.72, excellent: 0.78, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 72, low: 62, high: 80, excellent: 88, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 4, low: 5.5, high: 3.2, excellent: 2.8, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.34, low: 0.26, high: 0.42, excellent: 0.50, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.56, low: 0.48, high: 0.64, excellent: 0.72, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.34, low: 0.26, high: 0.42, excellent: 0.50, unit: '%', higherIsBetter: true },
        kast: { average: 72, low: 64, high: 80, excellent: 86, unit: '%', higherIsBetter: true },
        impactRating: { average: 1.12, low: 0.98, high: 1.25, excellent: 1.38, unit: 'rating', higherIsBetter: true },
        adr: { average: 84, low: 72, high: 95, excellent: 105, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 1.08, low: 0.96, high: 1.20, excellent: 1.30, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.52, low: 0.45, high: 0.60, excellent: 0.68, unit: '%', higherIsBetter: true },
      },
    },
  },

  PREMIER_20000_PLUS: {
    rank: 'PREMIER_20000_PLUS',
    displayName: 'Premier (20K+)',
    eloRange: { min: 20000, max: 99999 },
    metrics: {
      aim: {
        headshotPercentage: { average: 58, low: 52, high: 65, excellent: 72, unit: '%', higherIsBetter: true },
        firstBulletAccuracy: { average: 0.60, low: 0.52, high: 0.68, excellent: 0.75, unit: '%', higherIsBetter: true },
        reactionTimeMs: { average: 200, low: 240, high: 175, excellent: 160, unit: 'ms', higherIsBetter: false },
        sprayAccuracy: { average: 78, low: 68, high: 86, excellent: 92, unit: '%', higherIsBetter: true },
        crosshairPlacementScore: { average: 85, low: 75, high: 92, excellent: 96, unit: 'score', higherIsBetter: true },
      },
      positioning: {
        survivalTimePerRound: { average: 78, low: 68, high: 88, excellent: 95, unit: 's', higherIsBetter: true },
        tradeableDeathRate: { average: 0.74, low: 0.64, high: 0.82, excellent: 0.88, unit: '%', higherIsBetter: true },
        isolatedDeathRate: { average: 0.20, low: 0.30, high: 0.15, excellent: 0.10, unit: '%', higherIsBetter: false },
        mapControlScore: { average: 82, low: 72, high: 90, excellent: 95, unit: 'score', higherIsBetter: true },
        positioningScore: { average: 85, low: 75, high: 92, excellent: 96, unit: 'score', higherIsBetter: true },
      },
      utility: {
        flashEfficiency: { average: 0.65, low: 0.55, high: 0.75, excellent: 0.82, unit: '%', higherIsBetter: true },
        flashesPerMatch: { average: 22, low: 16, high: 28, excellent: 35, unit: 'count', higherIsBetter: true },
        smokesPerMatch: { average: 15, low: 11, high: 20, excellent: 26, unit: 'count', higherIsBetter: true },
        utilityDamagePerMatch: { average: 300, low: 230, high: 380, excellent: 460, unit: 'dmg', higherIsBetter: true },
        dyingWithUtilityRate: { average: 0.12, low: 0.22, high: 0.08, excellent: 0.05, unit: '%', higherIsBetter: false },
      },
      economy: {
        buyDecisionScore: { average: 90, low: 82, high: 95, excellent: 98, unit: 'score', higherIsBetter: true },
        saveRoundCompliance: { average: 0.92, low: 0.85, high: 0.96, excellent: 0.99, unit: '%', higherIsBetter: true },
        avgMoneyAtDeath: { average: 1600, low: 2200, high: 1200, excellent: 800, unit: '$', higherIsBetter: false },
        ecoRoundWinRate: { average: 0.28, low: 0.22, high: 0.35, excellent: 0.42, unit: '%', higherIsBetter: true },
      },
      timing: {
        tradeSuccessRate: { average: 0.74, low: 0.64, high: 0.82, excellent: 0.88, unit: '%', higherIsBetter: true },
        peekTimingScore: { average: 85, low: 75, high: 92, excellent: 96, unit: 'score', higherIsBetter: true },
        rotationSpeed: { average: 3, low: 4.2, high: 2.4, excellent: 2, unit: 's', higherIsBetter: false },
        clutchConversionRate: { average: 0.45, low: 0.36, high: 0.54, excellent: 0.62, unit: '%', higherIsBetter: true },
      },
      decision: {
        openingDuelWinRate: { average: 0.65, low: 0.56, high: 0.72, excellent: 0.80, unit: '%', higherIsBetter: true },
        clutchWinRate: { average: 0.45, low: 0.36, high: 0.54, excellent: 0.62, unit: '%', higherIsBetter: true },
        kast: { average: 80, low: 72, high: 88, excellent: 93, unit: '%', higherIsBetter: true },
        impactRating: { average: 1.25, low: 1.12, high: 1.40, excellent: 1.52, unit: 'rating', higherIsBetter: true },
        adr: { average: 96, low: 84, high: 108, excellent: 118, unit: 'dmg', higherIsBetter: true },
      },
      overall: {
        rating: { average: 1.20, low: 1.08, high: 1.32, excellent: 1.42, unit: 'rating', higherIsBetter: true },
        winRate: { average: 0.56, low: 0.48, high: 0.65, excellent: 0.72, unit: '%', higherIsBetter: true },
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get benchmark for a specific rank
 */
export function getBenchmarkForRank(rank: CS2Rank): RankBenchmark {
  return RANK_BENCHMARKS[rank];
}

/**
 * Get a specific metric benchmark
 */
export function getMetricBenchmark(
  rank: CS2Rank,
  category: keyof BenchmarkMetrics,
  metric: string
): MetricBenchmark | null {
  const benchmark = RANK_BENCHMARKS[rank];
  const categoryMetrics = benchmark?.metrics[category];
  return (categoryMetrics as Record<string, MetricBenchmark>)?.[metric] || null;
}

/**
 * Compare a player value to rank benchmarks
 */
export function compareToRank(
  value: number,
  rank: CS2Rank,
  category: keyof BenchmarkMetrics,
  metric: string
): {
  percentile: number;
  status: 'below_average' | 'average' | 'above_average' | 'excellent';
  gap: number;
} {
  const benchmark = getMetricBenchmark(rank, category, metric);
  if (!benchmark) {
    return { percentile: 50, status: 'average', gap: 0 };
  }

  const { average, low, high, excellent, higherIsBetter } = benchmark;

  // Calculate percentile
  let percentile: number;
  let status: 'below_average' | 'average' | 'above_average' | 'excellent';

  if (higherIsBetter) {
    if (value >= excellent) {
      percentile = 90 + ((value - excellent) / excellent) * 10;
      status = 'excellent';
    } else if (value >= high) {
      percentile = 75 + ((value - high) / (excellent - high)) * 15;
      status = 'above_average';
    } else if (value >= average) {
      percentile = 50 + ((value - average) / (high - average)) * 25;
      status = 'average';
    } else if (value >= low) {
      percentile = 25 + ((value - low) / (average - low)) * 25;
      status = 'below_average';
    } else {
      percentile = (value / low) * 25;
      status = 'below_average';
    }
  } else {
    // Lower is better (e.g., reaction time)
    if (value <= excellent) {
      percentile = 90 + ((excellent - value) / excellent) * 10;
      status = 'excellent';
    } else if (value <= high) {
      percentile = 75 + ((high - value) / (high - excellent)) * 15;
      status = 'above_average';
    } else if (value <= average) {
      percentile = 50 + ((average - value) / (average - high)) * 25;
      status = 'average';
    } else if (value <= low) {
      percentile = 25 + ((low - value) / (low - average)) * 25;
      status = 'below_average';
    } else {
      percentile = Math.max(0, 25 - ((value - low) / low) * 25);
      status = 'below_average';
    }
  }

  // Calculate gap to average
  const gap = higherIsBetter ? average - value : value - average;

  return {
    percentile: Math.min(100, Math.max(0, percentile)),
    status,
    gap,
  };
}

/**
 * Get the next rank for progression
 */
export function getNextRank(currentRank: CS2Rank): CS2Rank | null {
  const rankOrder: CS2Rank[] = [
    'SILVER',
    'GOLD_NOVA',
    'MASTER_GUARDIAN',
    'LEGENDARY_EAGLE',
    'SUPREME',
    'GLOBAL',
    'PREMIER_0_5000',
    'PREMIER_5000_10000',
    'PREMIER_10000_15000',
    'PREMIER_15000_20000',
    'PREMIER_20000_PLUS',
  ];

  const currentIndex = rankOrder.indexOf(currentRank);
  if (currentIndex === -1 || currentIndex === rankOrder.length - 1) {
    return null;
  }

  return rankOrder[currentIndex + 1];
}

/**
 * Calculate overall gap between current performance and target rank
 */
export function calculateRankGap(
  playerMetrics: Partial<BenchmarkMetrics>,
  currentRank: CS2Rank,
  targetRank: CS2Rank
): {
  overallGap: number;
  categoryGaps: Record<string, number>;
  priorityAreas: string[];
} {
  const targetBenchmark = RANK_BENCHMARKS[targetRank];
  const categoryGaps: Record<string, number> = {};
  const gaps: { category: string; gap: number }[] = [];

  const categories: (keyof BenchmarkMetrics)[] = [
    'aim',
    'positioning',
    'utility',
    'economy',
    'timing',
    'decision',
  ];

  for (const category of categories) {
    const playerCat = playerMetrics[category];
    const targetCat = targetBenchmark.metrics[category];

    if (!playerCat || !targetCat) continue;

    let totalGap = 0;
    let metricCount = 0;

    for (const [metric, targetValue] of Object.entries(targetCat)) {
      const playerValue = (playerCat as Record<string, MetricBenchmark | number>)[metric];
      if (typeof playerValue !== 'number') continue;

      const target = (targetValue as MetricBenchmark).average;
      const { higherIsBetter } = targetValue as MetricBenchmark;

      if (higherIsBetter) {
        totalGap += Math.max(0, target - playerValue) / target;
      } else {
        totalGap += Math.max(0, playerValue - target) / target;
      }
      metricCount++;
    }

    const avgGap = metricCount > 0 ? (totalGap / metricCount) * 100 : 0;
    categoryGaps[category] = avgGap;
    gaps.push({ category, gap: avgGap });
  }

  // Sort by gap (biggest first)
  gaps.sort((a, b) => b.gap - a.gap);

  const overallGap = Object.values(categoryGaps).reduce((a, b) => a + b, 0) / categories.length;

  return {
    overallGap,
    categoryGaps,
    priorityAreas: gaps.slice(0, 3).map((g) => g.category),
  };
}