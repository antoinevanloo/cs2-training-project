/**
 * Benchmarks v2.0 - Benchmarks étendus pour toutes les métriques
 *
 * Ce fichier étend les benchmarks existants avec:
 * - Métriques Movement (counter-strafing, crouch, scope)
 * - Métriques Awareness (bomb, flash, info)
 * - Métriques Teamplay (trades, support, coordination)
 * - Métriques Utility et Economy améliorées
 */

import { CS2Rank, MetricBenchmark, MetricBenchmarks, BENCHMARKS } from './benchmarks';

// Réexporter tout de benchmarks.ts
export * from './benchmarks';

// =============================================================================
// NOUVEAUX BENCHMARKS V2
// =============================================================================

/**
 * Générateur de benchmarks pour les scores (0-100)
 * Permet de créer rapidement des benchmarks cohérents
 */
function generateScoreBenchmarks(): Record<CS2Rank, MetricBenchmark> {
  return {
    SILVER_1: { min: 20, avg: 32, max: 45, elite: 50 },
    SILVER_2: { min: 22, avg: 35, max: 48, elite: 53 },
    SILVER_3: { min: 25, avg: 38, max: 52, elite: 57 },
    SILVER_4: { min: 28, avg: 42, max: 55, elite: 60 },
    SILVER_ELITE: { min: 32, avg: 45, max: 58, elite: 63 },
    SILVER_ELITE_MASTER: { min: 35, avg: 48, max: 62, elite: 67 },
    GOLD_NOVA_1: { min: 38, avg: 52, max: 65, elite: 70 },
    GOLD_NOVA_2: { min: 42, avg: 55, max: 68, elite: 73 },
    GOLD_NOVA_3: { min: 45, avg: 58, max: 72, elite: 77 },
    GOLD_NOVA_MASTER: { min: 48, avg: 62, max: 75, elite: 80 },
    MASTER_GUARDIAN_1: { min: 52, avg: 65, max: 78, elite: 83 },
    MASTER_GUARDIAN_2: { min: 55, avg: 68, max: 80, elite: 85 },
    MASTER_GUARDIAN_ELITE: { min: 58, avg: 72, max: 83, elite: 87 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 62, avg: 75, max: 85, elite: 90 },
    LEGENDARY_EAGLE: { min: 65, avg: 78, max: 88, elite: 92 },
    LEGENDARY_EAGLE_MASTER: { min: 68, avg: 80, max: 90, elite: 94 },
    SUPREME_MASTER_FIRST_CLASS: { min: 72, avg: 83, max: 92, elite: 96 },
    GLOBAL_ELITE: { min: 75, avg: 85, max: 95, elite: 98 },
    PREMIER_0_5000: { min: 35, avg: 48, max: 62, elite: 67 },
    PREMIER_5000_10000: { min: 48, avg: 62, max: 75, elite: 80 },
    PREMIER_10000_15000: { min: 62, avg: 75, max: 85, elite: 90 },
    PREMIER_15000_20000: { min: 72, avg: 83, max: 92, elite: 96 },
    PREMIER_20000_PLUS: { min: 78, avg: 88, max: 96, elite: 99 },
  };
}

/**
 * Générateur de benchmarks pour les pourcentages (0-100)
 * Avec progression plus lente
 */
function generatePercentageBenchmarks(
  silverAvg: number,
  eliteAvg: number
): Record<CS2Rank, MetricBenchmark> {
  const step = (eliteAvg - silverAvg) / 17; // 17 steps between Silver I and Global Elite
  const variance = 12; // ±12% around average

  const ranks: CS2Rank[] = [
    'SILVER_1', 'SILVER_2', 'SILVER_3', 'SILVER_4', 'SILVER_ELITE', 'SILVER_ELITE_MASTER',
    'GOLD_NOVA_1', 'GOLD_NOVA_2', 'GOLD_NOVA_3', 'GOLD_NOVA_MASTER',
    'MASTER_GUARDIAN_1', 'MASTER_GUARDIAN_2', 'MASTER_GUARDIAN_ELITE', 'DISTINGUISHED_MASTER_GUARDIAN',
    'LEGENDARY_EAGLE', 'LEGENDARY_EAGLE_MASTER', 'SUPREME_MASTER_FIRST_CLASS', 'GLOBAL_ELITE',
  ];

  const result: Record<CS2Rank, MetricBenchmark> = {} as Record<CS2Rank, MetricBenchmark>;

  ranks.forEach((rank, i) => {
    const avg = silverAvg + step * i;
    result[rank] = {
      min: Math.max(0, avg - variance),
      avg: avg,
      max: Math.min(100, avg + variance * 0.8),
      elite: Math.min(100, avg + variance * 1.2),
    };
  });

  // Premier ranks (approximation based on MM equivalents)
  result.PREMIER_0_5000 = result.SILVER_ELITE_MASTER;
  result.PREMIER_5000_10000 = result.GOLD_NOVA_MASTER;
  result.PREMIER_10000_15000 = result.DISTINGUISHED_MASTER_GUARDIAN;
  result.PREMIER_15000_20000 = result.SUPREME_MASTER_FIRST_CLASS;
  result.PREMIER_20000_PLUS = {
    min: result.GLOBAL_ELITE.avg,
    avg: Math.min(100, result.GLOBAL_ELITE.avg + 5),
    max: Math.min(100, result.GLOBAL_ELITE.max + 5),
    elite: Math.min(100, result.GLOBAL_ELITE.elite! + 5),
  };

  return result;
}

// =============================================================================
// BENCHMARKS MOVEMENT
// =============================================================================

export const MOVEMENT_BENCHMARKS: MetricBenchmarks = {
  // Counter-strafe rate (% de tirs avec vitesse < 34 u/s)
  counterStrafeRate: generatePercentageBenchmarks(30, 85),

  // Perfect counter-strafe rate (% de tirs avec vitesse = 0)
  perfectCounterStrafeRate: generatePercentageBenchmarks(10, 55),

  // Average speed at shot (inversé: plus bas = mieux)
  avgSpeedAtShot: {
    SILVER_1: { min: 120, avg: 95, max: 70, elite: 50 },
    SILVER_2: { min: 115, avg: 90, max: 65, elite: 48 },
    SILVER_3: { min: 110, avg: 85, max: 60, elite: 45 },
    SILVER_4: { min: 105, avg: 80, max: 55, elite: 42 },
    SILVER_ELITE: { min: 100, avg: 75, max: 50, elite: 40 },
    SILVER_ELITE_MASTER: { min: 95, avg: 70, max: 48, elite: 38 },
    GOLD_NOVA_1: { min: 90, avg: 65, max: 45, elite: 35 },
    GOLD_NOVA_2: { min: 85, avg: 60, max: 42, elite: 32 },
    GOLD_NOVA_3: { min: 80, avg: 55, max: 40, elite: 30 },
    GOLD_NOVA_MASTER: { min: 75, avg: 50, max: 38, elite: 28 },
    MASTER_GUARDIAN_1: { min: 70, avg: 48, max: 35, elite: 25 },
    MASTER_GUARDIAN_2: { min: 65, avg: 45, max: 32, elite: 22 },
    MASTER_GUARDIAN_ELITE: { min: 60, avg: 42, max: 30, elite: 20 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 55, avg: 38, max: 28, elite: 18 },
    LEGENDARY_EAGLE: { min: 50, avg: 35, max: 25, elite: 15 },
    LEGENDARY_EAGLE_MASTER: { min: 45, avg: 32, max: 22, elite: 12 },
    SUPREME_MASTER_FIRST_CLASS: { min: 40, avg: 28, max: 20, elite: 10 },
    GLOBAL_ELITE: { min: 35, avg: 25, max: 18, elite: 8 },
    PREMIER_0_5000: { min: 95, avg: 70, max: 48, elite: 38 },
    PREMIER_5000_10000: { min: 75, avg: 50, max: 38, elite: 28 },
    PREMIER_10000_15000: { min: 55, avg: 38, max: 28, elite: 18 },
    PREMIER_15000_20000: { min: 40, avg: 28, max: 20, elite: 10 },
    PREMIER_20000_PLUS: { min: 30, avg: 22, max: 15, elite: 5 },
  },

  // Crouch shot rate (ni trop haut ni trop bas - optimal ~25-35%)
  crouchShotRate: {
    SILVER_1: { min: 5, avg: 15, max: 35, elite: 28 },
    SILVER_2: { min: 8, avg: 18, max: 38, elite: 28 },
    SILVER_3: { min: 10, avg: 20, max: 40, elite: 30 },
    SILVER_4: { min: 12, avg: 22, max: 42, elite: 30 },
    SILVER_ELITE: { min: 15, avg: 25, max: 42, elite: 32 },
    SILVER_ELITE_MASTER: { min: 18, avg: 27, max: 40, elite: 32 },
    GOLD_NOVA_1: { min: 20, avg: 28, max: 40, elite: 33 },
    GOLD_NOVA_2: { min: 22, avg: 30, max: 40, elite: 33 },
    GOLD_NOVA_3: { min: 22, avg: 30, max: 40, elite: 33 },
    GOLD_NOVA_MASTER: { min: 23, avg: 30, max: 38, elite: 33 },
    MASTER_GUARDIAN_1: { min: 23, avg: 30, max: 38, elite: 33 },
    MASTER_GUARDIAN_2: { min: 24, avg: 30, max: 38, elite: 33 },
    MASTER_GUARDIAN_ELITE: { min: 24, avg: 30, max: 38, elite: 32 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 25, avg: 32, max: 38, elite: 32 },
    LEGENDARY_EAGLE: { min: 25, avg: 32, max: 38, elite: 32 },
    LEGENDARY_EAGLE_MASTER: { min: 25, avg: 32, max: 38, elite: 32 },
    SUPREME_MASTER_FIRST_CLASS: { min: 25, avg: 32, max: 38, elite: 32 },
    GLOBAL_ELITE: { min: 25, avg: 32, max: 38, elite: 32 },
    PREMIER_0_5000: { min: 18, avg: 27, max: 40, elite: 32 },
    PREMIER_5000_10000: { min: 23, avg: 30, max: 38, elite: 33 },
    PREMIER_10000_15000: { min: 25, avg: 32, max: 38, elite: 32 },
    PREMIER_15000_20000: { min: 25, avg: 32, max: 38, elite: 32 },
    PREMIER_20000_PLUS: { min: 25, avg: 32, max: 38, elite: 32 },
  },

  // Scoped shot rate (avec armes à lunette)
  scopedShotRate: generatePercentageBenchmarks(50, 95),

  // Quick scope rate
  quickScopeRate: generatePercentageBenchmarks(20, 70),

  // Airborne shot rate (inversé: plus bas = mieux)
  airborneShotRate: {
    SILVER_1: { min: 25, avg: 18, max: 12, elite: 8 },
    SILVER_2: { min: 22, avg: 16, max: 10, elite: 7 },
    SILVER_3: { min: 20, avg: 14, max: 9, elite: 6 },
    SILVER_4: { min: 18, avg: 12, max: 8, elite: 5 },
    SILVER_ELITE: { min: 16, avg: 10, max: 7, elite: 4 },
    SILVER_ELITE_MASTER: { min: 14, avg: 9, max: 6, elite: 4 },
    GOLD_NOVA_1: { min: 12, avg: 8, max: 5, elite: 3 },
    GOLD_NOVA_2: { min: 10, avg: 7, max: 5, elite: 3 },
    GOLD_NOVA_3: { min: 9, avg: 6, max: 4, elite: 2 },
    GOLD_NOVA_MASTER: { min: 8, avg: 5, max: 4, elite: 2 },
    MASTER_GUARDIAN_1: { min: 7, avg: 5, max: 3, elite: 2 },
    MASTER_GUARDIAN_2: { min: 6, avg: 4, max: 3, elite: 2 },
    MASTER_GUARDIAN_ELITE: { min: 5, avg: 4, max: 2, elite: 1 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 5, avg: 3, max: 2, elite: 1 },
    LEGENDARY_EAGLE: { min: 4, avg: 3, max: 2, elite: 1 },
    LEGENDARY_EAGLE_MASTER: { min: 4, avg: 3, max: 2, elite: 1 },
    SUPREME_MASTER_FIRST_CLASS: { min: 3, avg: 2, max: 1, elite: 1 },
    GLOBAL_ELITE: { min: 3, avg: 2, max: 1, elite: 0.5 },
    PREMIER_0_5000: { min: 14, avg: 9, max: 6, elite: 4 },
    PREMIER_5000_10000: { min: 8, avg: 5, max: 4, elite: 2 },
    PREMIER_10000_15000: { min: 5, avg: 3, max: 2, elite: 1 },
    PREMIER_15000_20000: { min: 3, avg: 2, max: 1, elite: 1 },
    PREMIER_20000_PLUS: { min: 2, avg: 1.5, max: 1, elite: 0.5 },
  },

  // Walk discipline score
  walkDiscipline: generateScoreBenchmarks(),

  // Movement score global
  movementScore: generateScoreBenchmarks(),
};

// =============================================================================
// BENCHMARKS AWARENESS
// =============================================================================

export const AWARENESS_BENCHMARKS: MetricBenchmarks = {
  // Bomb awareness score
  bombAwarenessScore: generateScoreBenchmarks(),

  // Defuse success rate
  defuseSuccessRate: generatePercentageBenchmarks(50, 90),

  // Flash dodge rate
  flashDodgeRate: generatePercentageBenchmarks(20, 75),

  // Blind death rate (inversé)
  blindDeathRate: {
    SILVER_1: { min: 35, avg: 25, max: 18, elite: 12 },
    SILVER_2: { min: 32, avg: 23, max: 16, elite: 11 },
    SILVER_3: { min: 30, avg: 22, max: 15, elite: 10 },
    SILVER_4: { min: 28, avg: 20, max: 14, elite: 9 },
    SILVER_ELITE: { min: 26, avg: 18, max: 12, elite: 8 },
    SILVER_ELITE_MASTER: { min: 24, avg: 16, max: 11, elite: 7 },
    GOLD_NOVA_1: { min: 22, avg: 15, max: 10, elite: 6 },
    GOLD_NOVA_2: { min: 20, avg: 14, max: 9, elite: 6 },
    GOLD_NOVA_3: { min: 18, avg: 13, max: 8, elite: 5 },
    GOLD_NOVA_MASTER: { min: 16, avg: 12, max: 8, elite: 5 },
    MASTER_GUARDIAN_1: { min: 15, avg: 11, max: 7, elite: 4 },
    MASTER_GUARDIAN_2: { min: 14, avg: 10, max: 6, elite: 4 },
    MASTER_GUARDIAN_ELITE: { min: 13, avg: 9, max: 6, elite: 3 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 12, avg: 8, max: 5, elite: 3 },
    LEGENDARY_EAGLE: { min: 11, avg: 7, max: 5, elite: 3 },
    LEGENDARY_EAGLE_MASTER: { min: 10, avg: 7, max: 4, elite: 2 },
    SUPREME_MASTER_FIRST_CLASS: { min: 9, avg: 6, max: 4, elite: 2 },
    GLOBAL_ELITE: { min: 8, avg: 5, max: 3, elite: 2 },
    PREMIER_0_5000: { min: 24, avg: 16, max: 11, elite: 7 },
    PREMIER_5000_10000: { min: 16, avg: 12, max: 8, elite: 5 },
    PREMIER_10000_15000: { min: 12, avg: 8, max: 5, elite: 3 },
    PREMIER_15000_20000: { min: 9, avg: 6, max: 4, elite: 2 },
    PREMIER_20000_PLUS: { min: 7, avg: 5, max: 3, elite: 1 },
  },

  // Info gathering score
  infoGatheringScore: generateScoreBenchmarks(),

  // First contact rate
  firstContactRate: generatePercentageBenchmarks(10, 45),

  // Awareness score global
  awarenessScore: generateScoreBenchmarks(),
};

// =============================================================================
// BENCHMARKS TEAMPLAY
// =============================================================================

export const TEAMPLAY_BENCHMARKS: MetricBenchmarks = {
  // Trade efficiency score
  tradeEfficiency: generateScoreBenchmarks(),

  // Trades given per match
  tradesGiven: {
    SILVER_1: { min: 0, avg: 1.5, max: 3, elite: 4 },
    SILVER_2: { min: 0.5, avg: 2, max: 3.5, elite: 4.5 },
    SILVER_3: { min: 0.5, avg: 2.2, max: 4, elite: 5 },
    SILVER_4: { min: 1, avg: 2.5, max: 4.5, elite: 5.5 },
    SILVER_ELITE: { min: 1, avg: 3, max: 5, elite: 6 },
    SILVER_ELITE_MASTER: { min: 1.5, avg: 3.5, max: 5.5, elite: 7 },
    GOLD_NOVA_1: { min: 2, avg: 4, max: 6, elite: 7.5 },
    GOLD_NOVA_2: { min: 2, avg: 4.5, max: 6.5, elite: 8 },
    GOLD_NOVA_3: { min: 2.5, avg: 5, max: 7, elite: 8.5 },
    GOLD_NOVA_MASTER: { min: 3, avg: 5.5, max: 7.5, elite: 9 },
    MASTER_GUARDIAN_1: { min: 3, avg: 6, max: 8, elite: 10 },
    MASTER_GUARDIAN_2: { min: 3.5, avg: 6.5, max: 8.5, elite: 10.5 },
    MASTER_GUARDIAN_ELITE: { min: 4, avg: 7, max: 9, elite: 11 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 4, avg: 7.5, max: 10, elite: 12 },
    LEGENDARY_EAGLE: { min: 4.5, avg: 8, max: 10.5, elite: 12.5 },
    LEGENDARY_EAGLE_MASTER: { min: 5, avg: 8.5, max: 11, elite: 13 },
    SUPREME_MASTER_FIRST_CLASS: { min: 5.5, avg: 9, max: 12, elite: 14 },
    GLOBAL_ELITE: { min: 6, avg: 10, max: 13, elite: 15 },
    PREMIER_0_5000: { min: 1.5, avg: 3.5, max: 5.5, elite: 7 },
    PREMIER_5000_10000: { min: 3, avg: 5.5, max: 7.5, elite: 9 },
    PREMIER_10000_15000: { min: 4, avg: 7.5, max: 10, elite: 12 },
    PREMIER_15000_20000: { min: 5.5, avg: 9, max: 12, elite: 14 },
    PREMIER_20000_PLUS: { min: 7, avg: 11, max: 14, elite: 17 },
  },

  // Average trade time (inversé: plus bas = mieux)
  avgTradeTime: {
    SILVER_1: { min: 8, avg: 5.5, max: 4, elite: 3 },
    SILVER_2: { min: 7.5, avg: 5.2, max: 3.8, elite: 2.8 },
    SILVER_3: { min: 7, avg: 5, max: 3.5, elite: 2.6 },
    SILVER_4: { min: 6.5, avg: 4.7, max: 3.3, elite: 2.5 },
    SILVER_ELITE: { min: 6, avg: 4.5, max: 3.2, elite: 2.4 },
    SILVER_ELITE_MASTER: { min: 5.5, avg: 4.2, max: 3, elite: 2.2 },
    GOLD_NOVA_1: { min: 5, avg: 4, max: 2.8, elite: 2 },
    GOLD_NOVA_2: { min: 4.8, avg: 3.8, max: 2.6, elite: 1.9 },
    GOLD_NOVA_3: { min: 4.5, avg: 3.5, max: 2.5, elite: 1.8 },
    GOLD_NOVA_MASTER: { min: 4.2, avg: 3.3, max: 2.3, elite: 1.7 },
    MASTER_GUARDIAN_1: { min: 4, avg: 3, max: 2.2, elite: 1.6 },
    MASTER_GUARDIAN_2: { min: 3.8, avg: 2.8, max: 2, elite: 1.5 },
    MASTER_GUARDIAN_ELITE: { min: 3.5, avg: 2.6, max: 1.9, elite: 1.4 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 3.2, avg: 2.4, max: 1.8, elite: 1.3 },
    LEGENDARY_EAGLE: { min: 3, avg: 2.2, max: 1.7, elite: 1.2 },
    LEGENDARY_EAGLE_MASTER: { min: 2.8, avg: 2, max: 1.5, elite: 1.1 },
    SUPREME_MASTER_FIRST_CLASS: { min: 2.5, avg: 1.8, max: 1.4, elite: 1 },
    GLOBAL_ELITE: { min: 2.2, avg: 1.6, max: 1.2, elite: 0.8 },
    PREMIER_0_5000: { min: 5.5, avg: 4.2, max: 3, elite: 2.2 },
    PREMIER_5000_10000: { min: 4.2, avg: 3.3, max: 2.3, elite: 1.7 },
    PREMIER_10000_15000: { min: 3.2, avg: 2.4, max: 1.8, elite: 1.3 },
    PREMIER_15000_20000: { min: 2.5, avg: 1.8, max: 1.4, elite: 1 },
    PREMIER_20000_PLUS: { min: 2, avg: 1.4, max: 1, elite: 0.7 },
  },

  // Flash assist score
  flashAssistScore: generateScoreBenchmarks(),

  // Coordination score
  coordinationScore: generateScoreBenchmarks(),

  // Entry success rate
  entrySuccessRate: generatePercentageBenchmarks(30, 60),

  // Entry attempts per match
  entryAttempts: {
    SILVER_1: { min: 0, avg: 1, max: 2.5, elite: 3.5 },
    SILVER_2: { min: 0.5, avg: 1.5, max: 3, elite: 4 },
    SILVER_3: { min: 0.5, avg: 2, max: 3.5, elite: 4.5 },
    SILVER_4: { min: 1, avg: 2.5, max: 4, elite: 5 },
    SILVER_ELITE: { min: 1, avg: 3, max: 4.5, elite: 5.5 },
    SILVER_ELITE_MASTER: { min: 1.5, avg: 3.5, max: 5, elite: 6 },
    GOLD_NOVA_1: { min: 2, avg: 4, max: 5.5, elite: 7 },
    GOLD_NOVA_2: { min: 2, avg: 4.5, max: 6, elite: 7.5 },
    GOLD_NOVA_3: { min: 2.5, avg: 5, max: 6.5, elite: 8 },
    GOLD_NOVA_MASTER: { min: 3, avg: 5.5, max: 7, elite: 8.5 },
    MASTER_GUARDIAN_1: { min: 3, avg: 6, max: 7.5, elite: 9 },
    MASTER_GUARDIAN_2: { min: 3.5, avg: 6.5, max: 8, elite: 9.5 },
    MASTER_GUARDIAN_ELITE: { min: 4, avg: 7, max: 8.5, elite: 10 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 4, avg: 7.5, max: 9, elite: 11 },
    LEGENDARY_EAGLE: { min: 4.5, avg: 8, max: 10, elite: 12 },
    LEGENDARY_EAGLE_MASTER: { min: 5, avg: 8.5, max: 11, elite: 13 },
    SUPREME_MASTER_FIRST_CLASS: { min: 5.5, avg: 9, max: 12, elite: 14 },
    GLOBAL_ELITE: { min: 6, avg: 10, max: 13, elite: 15 },
    PREMIER_0_5000: { min: 1.5, avg: 3.5, max: 5, elite: 6 },
    PREMIER_5000_10000: { min: 3, avg: 5.5, max: 7, elite: 8.5 },
    PREMIER_10000_15000: { min: 4, avg: 7.5, max: 9, elite: 11 },
    PREMIER_15000_20000: { min: 5.5, avg: 9, max: 12, elite: 14 },
    PREMIER_20000_PLUS: { min: 7, avg: 11, max: 14, elite: 17 },
  },

  // Clutch win rate (réutiliser celui existant)
  clutchWinRate: BENCHMARKS.clutchWinRate,

  // Anchor score
  anchorScore: generateScoreBenchmarks(),

  // Teamplay score global
  teamplayScore: generateScoreBenchmarks(),
};

// =============================================================================
// BENCHMARKS UTILITY V2
// =============================================================================

export const UTILITY_V2_BENCHMARKS: MetricBenchmarks = {
  // Flash efficiency v2
  flashEfficiencyV2: generateScoreBenchmarks(),

  // Average enemy blind duration
  avgEnemyBlindDuration: {
    SILVER_1: { min: 0.5, avg: 0.9, max: 1.3, elite: 1.5 },
    SILVER_2: { min: 0.6, avg: 1.0, max: 1.4, elite: 1.6 },
    SILVER_3: { min: 0.7, avg: 1.1, max: 1.5, elite: 1.7 },
    SILVER_4: { min: 0.8, avg: 1.2, max: 1.6, elite: 1.8 },
    SILVER_ELITE: { min: 0.9, avg: 1.3, max: 1.7, elite: 1.9 },
    SILVER_ELITE_MASTER: { min: 1.0, avg: 1.4, max: 1.8, elite: 2.0 },
    GOLD_NOVA_1: { min: 1.1, avg: 1.5, max: 1.9, elite: 2.1 },
    GOLD_NOVA_2: { min: 1.2, avg: 1.6, max: 2.0, elite: 2.2 },
    GOLD_NOVA_3: { min: 1.3, avg: 1.7, max: 2.1, elite: 2.3 },
    GOLD_NOVA_MASTER: { min: 1.4, avg: 1.8, max: 2.2, elite: 2.4 },
    MASTER_GUARDIAN_1: { min: 1.4, avg: 1.9, max: 2.3, elite: 2.5 },
    MASTER_GUARDIAN_2: { min: 1.5, avg: 2.0, max: 2.4, elite: 2.6 },
    MASTER_GUARDIAN_ELITE: { min: 1.6, avg: 2.1, max: 2.5, elite: 2.7 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 1.7, avg: 2.2, max: 2.6, elite: 2.8 },
    LEGENDARY_EAGLE: { min: 1.8, avg: 2.3, max: 2.7, elite: 2.9 },
    LEGENDARY_EAGLE_MASTER: { min: 1.9, avg: 2.4, max: 2.8, elite: 3.0 },
    SUPREME_MASTER_FIRST_CLASS: { min: 2.0, avg: 2.5, max: 2.9, elite: 3.1 },
    GLOBAL_ELITE: { min: 2.1, avg: 2.6, max: 3.0, elite: 3.2 },
    PREMIER_0_5000: { min: 1.0, avg: 1.4, max: 1.8, elite: 2.0 },
    PREMIER_5000_10000: { min: 1.4, avg: 1.8, max: 2.2, elite: 2.4 },
    PREMIER_10000_15000: { min: 1.7, avg: 2.2, max: 2.6, elite: 2.8 },
    PREMIER_15000_20000: { min: 2.0, avg: 2.5, max: 2.9, elite: 3.1 },
    PREMIER_20000_PLUS: { min: 2.2, avg: 2.7, max: 3.1, elite: 3.4 },
  },

  // Pop-flash rate
  popFlashRate: generatePercentageBenchmarks(5, 45),

  // Team flash rate (inversé)
  teamFlashRate: {
    SILVER_1: { min: 50, avg: 38, max: 28, elite: 20 },
    SILVER_2: { min: 48, avg: 36, max: 26, elite: 18 },
    SILVER_3: { min: 45, avg: 34, max: 24, elite: 17 },
    SILVER_4: { min: 42, avg: 32, max: 22, elite: 15 },
    SILVER_ELITE: { min: 40, avg: 30, max: 20, elite: 14 },
    SILVER_ELITE_MASTER: { min: 38, avg: 28, max: 18, elite: 12 },
    GOLD_NOVA_1: { min: 35, avg: 26, max: 17, elite: 11 },
    GOLD_NOVA_2: { min: 32, avg: 24, max: 15, elite: 10 },
    GOLD_NOVA_3: { min: 30, avg: 22, max: 14, elite: 9 },
    GOLD_NOVA_MASTER: { min: 28, avg: 20, max: 12, elite: 8 },
    MASTER_GUARDIAN_1: { min: 25, avg: 18, max: 11, elite: 7 },
    MASTER_GUARDIAN_2: { min: 22, avg: 16, max: 10, elite: 6 },
    MASTER_GUARDIAN_ELITE: { min: 20, avg: 14, max: 9, elite: 5 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 18, avg: 12, max: 8, elite: 5 },
    LEGENDARY_EAGLE: { min: 16, avg: 11, max: 7, elite: 4 },
    LEGENDARY_EAGLE_MASTER: { min: 14, avg: 10, max: 6, elite: 4 },
    SUPREME_MASTER_FIRST_CLASS: { min: 12, avg: 8, max: 5, elite: 3 },
    GLOBAL_ELITE: { min: 10, avg: 7, max: 4, elite: 2 },
    PREMIER_0_5000: { min: 38, avg: 28, max: 18, elite: 12 },
    PREMIER_5000_10000: { min: 28, avg: 20, max: 12, elite: 8 },
    PREMIER_10000_15000: { min: 18, avg: 12, max: 8, elite: 5 },
    PREMIER_15000_20000: { min: 12, avg: 8, max: 5, elite: 3 },
    PREMIER_20000_PLUS: { min: 8, avg: 5, max: 3, elite: 1 },
  },

  // Average molotov damage
  avgMolotovDamage: {
    SILVER_1: { min: 5, avg: 12, max: 22, elite: 30 },
    SILVER_2: { min: 7, avg: 14, max: 25, elite: 33 },
    SILVER_3: { min: 8, avg: 16, max: 28, elite: 36 },
    SILVER_4: { min: 10, avg: 18, max: 30, elite: 40 },
    SILVER_ELITE: { min: 12, avg: 20, max: 33, elite: 43 },
    SILVER_ELITE_MASTER: { min: 14, avg: 23, max: 36, elite: 46 },
    GOLD_NOVA_1: { min: 16, avg: 26, max: 40, elite: 50 },
    GOLD_NOVA_2: { min: 18, avg: 28, max: 43, elite: 53 },
    GOLD_NOVA_3: { min: 20, avg: 30, max: 45, elite: 56 },
    GOLD_NOVA_MASTER: { min: 22, avg: 33, max: 48, elite: 60 },
    MASTER_GUARDIAN_1: { min: 25, avg: 36, max: 52, elite: 65 },
    MASTER_GUARDIAN_2: { min: 27, avg: 38, max: 55, elite: 68 },
    MASTER_GUARDIAN_ELITE: { min: 30, avg: 42, max: 58, elite: 72 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 32, avg: 45, max: 62, elite: 75 },
    LEGENDARY_EAGLE: { min: 35, avg: 48, max: 65, elite: 80 },
    LEGENDARY_EAGLE_MASTER: { min: 38, avg: 52, max: 70, elite: 85 },
    SUPREME_MASTER_FIRST_CLASS: { min: 42, avg: 56, max: 75, elite: 90 },
    GLOBAL_ELITE: { min: 45, avg: 60, max: 80, elite: 100 },
    PREMIER_0_5000: { min: 14, avg: 23, max: 36, elite: 46 },
    PREMIER_5000_10000: { min: 22, avg: 33, max: 48, elite: 60 },
    PREMIER_10000_15000: { min: 32, avg: 45, max: 62, elite: 75 },
    PREMIER_15000_20000: { min: 42, avg: 56, max: 75, elite: 90 },
    PREMIER_20000_PLUS: { min: 50, avg: 65, max: 85, elite: 110 },
  },

  // HE multi-hit rate
  heMultiHitRate: generatePercentageBenchmarks(5, 50),

  // Utility usage rate
  utilityUsageRate: generatePercentageBenchmarks(55, 95),
};

// =============================================================================
// BENCHMARKS ECONOMY V2
// =============================================================================

export const ECONOMY_V2_BENCHMARKS: MetricBenchmarks = {
  // Buy decision score
  buyDecisionScore: generateScoreBenchmarks(),

  // Team buy sync rate
  teamBuySyncRate: generatePercentageBenchmarks(50, 95),

  // Helmet buy rate
  helmetBuyRate: generatePercentageBenchmarks(60, 98),

  // Defuser buy rate (CT only)
  defuserBuyRate: generatePercentageBenchmarks(50, 95),

  // Average money at death (inversé)
  avgMoneyAtDeath: {
    SILVER_1: { min: 5000, avg: 3500, max: 2200, elite: 1500 },
    SILVER_2: { min: 4800, avg: 3300, max: 2000, elite: 1400 },
    SILVER_3: { min: 4500, avg: 3100, max: 1900, elite: 1300 },
    SILVER_4: { min: 4200, avg: 2900, max: 1800, elite: 1200 },
    SILVER_ELITE: { min: 4000, avg: 2700, max: 1700, elite: 1100 },
    SILVER_ELITE_MASTER: { min: 3800, avg: 2500, max: 1600, elite: 1000 },
    GOLD_NOVA_1: { min: 3500, avg: 2300, max: 1500, elite: 900 },
    GOLD_NOVA_2: { min: 3300, avg: 2100, max: 1400, elite: 850 },
    GOLD_NOVA_3: { min: 3000, avg: 2000, max: 1300, elite: 800 },
    GOLD_NOVA_MASTER: { min: 2800, avg: 1800, max: 1200, elite: 750 },
    MASTER_GUARDIAN_1: { min: 2600, avg: 1700, max: 1100, elite: 700 },
    MASTER_GUARDIAN_2: { min: 2400, avg: 1600, max: 1000, elite: 650 },
    MASTER_GUARDIAN_ELITE: { min: 2200, avg: 1500, max: 950, elite: 600 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 2000, avg: 1400, max: 900, elite: 550 },
    LEGENDARY_EAGLE: { min: 1800, avg: 1300, max: 850, elite: 500 },
    LEGENDARY_EAGLE_MASTER: { min: 1600, avg: 1200, max: 800, elite: 450 },
    SUPREME_MASTER_FIRST_CLASS: { min: 1400, avg: 1000, max: 700, elite: 400 },
    GLOBAL_ELITE: { min: 1200, avg: 850, max: 600, elite: 350 },
    PREMIER_0_5000: { min: 3800, avg: 2500, max: 1600, elite: 1000 },
    PREMIER_5000_10000: { min: 2800, avg: 1800, max: 1200, elite: 750 },
    PREMIER_10000_15000: { min: 2000, avg: 1400, max: 900, elite: 550 },
    PREMIER_15000_20000: { min: 1400, avg: 1000, max: 700, elite: 400 },
    PREMIER_20000_PLUS: { min: 1000, avg: 700, max: 500, elite: 300 },
  },

  // Eco impact score
  ecoImpactScore: generateScoreBenchmarks(),
};

// =============================================================================
// COMBINAISON DE TOUS LES BENCHMARKS
// =============================================================================

export const ALL_BENCHMARKS_V2: MetricBenchmarks = {
  ...BENCHMARKS,
  ...MOVEMENT_BENCHMARKS,
  ...AWARENESS_BENCHMARKS,
  ...TEAMPLAY_BENCHMARKS,
  ...UTILITY_V2_BENCHMARKS,
  ...ECONOMY_V2_BENCHMARKS,
};

// =============================================================================
// HELPERS ÉTENDUS
// =============================================================================

/**
 * Liste des métriques inversées (plus bas = mieux)
 */
export const INVERTED_METRICS = [
  'isolationDeathRate',
  'dpr',
  'avgSpeedAtShot',
  'airborneShotRate',
  'blindDeathRate',
  'teamFlashRate',
  'avgTradeTime',
  'avgMoneyAtDeath',
];

/**
 * Obtenir le benchmark d'une métrique pour un rank donné (v2)
 */
export function getBenchmarkV2(metricId: string, rank: CS2Rank): MetricBenchmark | undefined {
  return ALL_BENCHMARKS_V2[metricId]?.[rank];
}

/**
 * Vérifier si une métrique est inversée
 */
export function isInvertedMetric(metricId: string): boolean {
  return INVERTED_METRICS.includes(metricId);
}

/**
 * Obtenir le percentile d'une valeur par rapport au benchmark
 */
export function getPercentileInRank(
  metricId: string,
  value: number,
  rank: CS2Rank
): number | undefined {
  const benchmark = getBenchmarkV2(metricId, rank);
  if (!benchmark) return undefined;

  const isInverted = isInvertedMetric(metricId);

  if (isInverted) {
    // Pour les métriques inversées, inverser le calcul
    if (value >= benchmark.min) return 5; // Pire que le minimum
    if (value >= benchmark.avg) {
      return 5 + ((benchmark.min - value) / (benchmark.min - benchmark.avg)) * 40;
    }
    if (value >= benchmark.max) {
      return 45 + ((benchmark.avg - value) / (benchmark.avg - benchmark.max)) * 35;
    }
    if (benchmark.elite && value >= benchmark.elite) {
      return 80 + ((benchmark.max - value) / (benchmark.max - benchmark.elite)) * 15;
    }
    return 95 + Math.min(5, ((benchmark.elite || benchmark.max) - value) / 10);
  }

  // Métriques normales
  if (value <= benchmark.min) return 5; // Pire que le minimum
  if (value <= benchmark.avg) {
    return 5 + ((value - benchmark.min) / (benchmark.avg - benchmark.min)) * 40;
  }
  if (value <= benchmark.max) {
    return 45 + ((value - benchmark.avg) / (benchmark.max - benchmark.avg)) * 35;
  }
  if (benchmark.elite && value <= benchmark.elite) {
    return 80 + ((value - benchmark.max) / (benchmark.elite - benchmark.max)) * 15;
  }
  return 95 + Math.min(5, (value - (benchmark.elite || benchmark.max)) / 10);
}

/**
 * Obtenir les gaps entre la performance actuelle et le rank cible
 */
export interface RankGap {
  metricId: string;
  currentValue: number;
  targetValue: number;
  gap: number;
  percentageGap: number;
  priority: 'high' | 'medium' | 'low';
}

export function getGapsToRank(
  metrics: Record<string, number>,
  currentRank: CS2Rank,
  targetRank: CS2Rank
): RankGap[] {
  const gaps: RankGap[] = [];

  for (const [metricId, value] of Object.entries(metrics)) {
    const targetBenchmark = getBenchmarkV2(metricId, targetRank);
    const currentBenchmark = getBenchmarkV2(metricId, currentRank);

    if (!targetBenchmark || !currentBenchmark) continue;

    const isInverted = isInvertedMetric(metricId);
    const targetValue = isInverted ? targetBenchmark.max : targetBenchmark.avg;
    const gap = isInverted ? value - targetValue : targetValue - value;

    if (gap <= 0) continue; // Déjà au niveau ou mieux

    const percentageGap = Math.abs(gap / targetValue) * 100;

    let priority: 'high' | 'medium' | 'low' = 'low';
    if (percentageGap > 30) priority = 'high';
    else if (percentageGap > 15) priority = 'medium';

    gaps.push({
      metricId,
      currentValue: value,
      targetValue,
      gap: isInverted ? -gap : gap,
      percentageGap,
      priority,
    });
  }

  // Trier par priorité puis par gap
  return gaps.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.percentageGap - a.percentageGap;
  });
}
