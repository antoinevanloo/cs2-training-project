/**
 * Benchmarks par rank pour CS2
 *
 * Ces données sont basées sur des moyennes communautaires et
 * permettent de comparer les performances d'un joueur à son rank.
 */

// Ranks CS2
export type CS2Rank =
  | 'SILVER_1'
  | 'SILVER_2'
  | 'SILVER_3'
  | 'SILVER_4'
  | 'SILVER_ELITE'
  | 'SILVER_ELITE_MASTER'
  | 'GOLD_NOVA_1'
  | 'GOLD_NOVA_2'
  | 'GOLD_NOVA_3'
  | 'GOLD_NOVA_MASTER'
  | 'MASTER_GUARDIAN_1'
  | 'MASTER_GUARDIAN_2'
  | 'MASTER_GUARDIAN_ELITE'
  | 'DISTINGUISHED_MASTER_GUARDIAN'
  | 'LEGENDARY_EAGLE'
  | 'LEGENDARY_EAGLE_MASTER'
  | 'SUPREME_MASTER_FIRST_CLASS'
  | 'GLOBAL_ELITE'
  // Premier ELO
  | 'PREMIER_0_5000'
  | 'PREMIER_5000_10000'
  | 'PREMIER_10000_15000'
  | 'PREMIER_15000_20000'
  | 'PREMIER_20000_PLUS';

// Labels d'affichage pour les ranks
export const RANK_LABELS: Record<CS2Rank, string> = {
  SILVER_1: 'Silver I',
  SILVER_2: 'Silver II',
  SILVER_3: 'Silver III',
  SILVER_4: 'Silver IV',
  SILVER_ELITE: 'Silver Elite',
  SILVER_ELITE_MASTER: 'Silver Elite Master',
  GOLD_NOVA_1: 'Gold Nova I',
  GOLD_NOVA_2: 'Gold Nova II',
  GOLD_NOVA_3: 'Gold Nova III',
  GOLD_NOVA_MASTER: 'Gold Nova Master',
  MASTER_GUARDIAN_1: 'Master Guardian I',
  MASTER_GUARDIAN_2: 'Master Guardian II',
  MASTER_GUARDIAN_ELITE: 'Master Guardian Elite',
  DISTINGUISHED_MASTER_GUARDIAN: 'DMG',
  LEGENDARY_EAGLE: 'Legendary Eagle',
  LEGENDARY_EAGLE_MASTER: 'LEM',
  SUPREME_MASTER_FIRST_CLASS: 'Supreme',
  GLOBAL_ELITE: 'Global Elite',
  PREMIER_0_5000: 'Premier 0-5K',
  PREMIER_5000_10000: 'Premier 5-10K',
  PREMIER_10000_15000: 'Premier 10-15K',
  PREMIER_15000_20000: 'Premier 15-20K',
  PREMIER_20000_PLUS: 'Premier 20K+',
};

// Couleurs pour les ranks
export const RANK_COLORS: Record<CS2Rank, string> = {
  SILVER_1: '#8B8B8B',
  SILVER_2: '#8B8B8B',
  SILVER_3: '#8B8B8B',
  SILVER_4: '#8B8B8B',
  SILVER_ELITE: '#8B8B8B',
  SILVER_ELITE_MASTER: '#8B8B8B',
  GOLD_NOVA_1: '#FFD700',
  GOLD_NOVA_2: '#FFD700',
  GOLD_NOVA_3: '#FFD700',
  GOLD_NOVA_MASTER: '#FFD700',
  MASTER_GUARDIAN_1: '#4169E1',
  MASTER_GUARDIAN_2: '#4169E1',
  MASTER_GUARDIAN_ELITE: '#4169E1',
  DISTINGUISHED_MASTER_GUARDIAN: '#9932CC',
  LEGENDARY_EAGLE: '#9932CC',
  LEGENDARY_EAGLE_MASTER: '#9932CC',
  SUPREME_MASTER_FIRST_CLASS: '#FF4500',
  GLOBAL_ELITE: '#FF4500',
  PREMIER_0_5000: '#8B8B8B',
  PREMIER_5000_10000: '#FFD700',
  PREMIER_10000_15000: '#4169E1',
  PREMIER_15000_20000: '#9932CC',
  PREMIER_20000_PLUS: '#FF4500',
};

// Structure des benchmarks
export interface MetricBenchmark {
  min: number;      // Minimum attendu pour ce rank
  avg: number;      // Moyenne pour ce rank
  max: number;      // Maximum (top du rank)
  elite?: number;   // Niveau "elite" (top 10% du rank)
}

// Benchmarks par métrique et par rank
export type MetricBenchmarks = Record<string, Record<CS2Rank, MetricBenchmark>>;

// ============================================
// BENCHMARKS - MÉTRIQUES DE PERFORMANCE
// ============================================

export const BENCHMARKS: MetricBenchmarks = {
  // Rating HLTV 2.0
  rating: {
    SILVER_1: { min: 0.50, avg: 0.65, max: 0.80, elite: 0.85 },
    SILVER_2: { min: 0.55, avg: 0.68, max: 0.82, elite: 0.88 },
    SILVER_3: { min: 0.58, avg: 0.72, max: 0.85, elite: 0.90 },
    SILVER_4: { min: 0.60, avg: 0.75, max: 0.88, elite: 0.93 },
    SILVER_ELITE: { min: 0.62, avg: 0.78, max: 0.92, elite: 0.97 },
    SILVER_ELITE_MASTER: { min: 0.65, avg: 0.82, max: 0.95, elite: 1.00 },
    GOLD_NOVA_1: { min: 0.70, avg: 0.85, max: 0.98, elite: 1.03 },
    GOLD_NOVA_2: { min: 0.72, avg: 0.88, max: 1.02, elite: 1.08 },
    GOLD_NOVA_3: { min: 0.75, avg: 0.92, max: 1.05, elite: 1.12 },
    GOLD_NOVA_MASTER: { min: 0.78, avg: 0.95, max: 1.10, elite: 1.15 },
    MASTER_GUARDIAN_1: { min: 0.82, avg: 0.98, max: 1.12, elite: 1.18 },
    MASTER_GUARDIAN_2: { min: 0.85, avg: 1.00, max: 1.15, elite: 1.22 },
    MASTER_GUARDIAN_ELITE: { min: 0.88, avg: 1.03, max: 1.18, elite: 1.25 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 0.92, avg: 1.08, max: 1.22, elite: 1.30 },
    LEGENDARY_EAGLE: { min: 0.95, avg: 1.10, max: 1.25, elite: 1.35 },
    LEGENDARY_EAGLE_MASTER: { min: 0.98, avg: 1.15, max: 1.30, elite: 1.40 },
    SUPREME_MASTER_FIRST_CLASS: { min: 1.00, avg: 1.18, max: 1.35, elite: 1.45 },
    GLOBAL_ELITE: { min: 1.05, avg: 1.22, max: 1.40, elite: 1.55 },
    PREMIER_0_5000: { min: 0.60, avg: 0.78, max: 0.95, elite: 1.00 },
    PREMIER_5000_10000: { min: 0.78, avg: 0.95, max: 1.10, elite: 1.18 },
    PREMIER_10000_15000: { min: 0.92, avg: 1.08, max: 1.22, elite: 1.30 },
    PREMIER_15000_20000: { min: 1.00, avg: 1.18, max: 1.35, elite: 1.45 },
    PREMIER_20000_PLUS: { min: 1.10, avg: 1.25, max: 1.45, elite: 1.60 },
  },

  // ADR (Average Damage per Round)
  adr: {
    SILVER_1: { min: 35, avg: 48, max: 60, elite: 68 },
    SILVER_2: { min: 38, avg: 52, max: 65, elite: 72 },
    SILVER_3: { min: 42, avg: 55, max: 68, elite: 75 },
    SILVER_4: { min: 45, avg: 58, max: 72, elite: 78 },
    SILVER_ELITE: { min: 48, avg: 62, max: 75, elite: 82 },
    SILVER_ELITE_MASTER: { min: 52, avg: 65, max: 78, elite: 85 },
    GOLD_NOVA_1: { min: 55, avg: 68, max: 82, elite: 88 },
    GOLD_NOVA_2: { min: 58, avg: 72, max: 85, elite: 92 },
    GOLD_NOVA_3: { min: 62, avg: 75, max: 88, elite: 95 },
    GOLD_NOVA_MASTER: { min: 65, avg: 78, max: 92, elite: 98 },
    MASTER_GUARDIAN_1: { min: 68, avg: 82, max: 95, elite: 102 },
    MASTER_GUARDIAN_2: { min: 72, avg: 85, max: 98, elite: 105 },
    MASTER_GUARDIAN_ELITE: { min: 75, avg: 88, max: 102, elite: 108 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 78, avg: 92, max: 105, elite: 112 },
    LEGENDARY_EAGLE: { min: 80, avg: 95, max: 108, elite: 115 },
    LEGENDARY_EAGLE_MASTER: { min: 82, avg: 98, max: 112, elite: 120 },
    SUPREME_MASTER_FIRST_CLASS: { min: 85, avg: 100, max: 115, elite: 125 },
    GLOBAL_ELITE: { min: 88, avg: 105, max: 120, elite: 130 },
    PREMIER_0_5000: { min: 50, avg: 65, max: 78, elite: 85 },
    PREMIER_5000_10000: { min: 65, avg: 78, max: 92, elite: 100 },
    PREMIER_10000_15000: { min: 78, avg: 92, max: 105, elite: 115 },
    PREMIER_15000_20000: { min: 85, avg: 100, max: 115, elite: 125 },
    PREMIER_20000_PLUS: { min: 92, avg: 108, max: 125, elite: 140 },
  },

  // KAST
  kast: {
    SILVER_1: { min: 45, avg: 55, max: 65, elite: 70 },
    SILVER_2: { min: 48, avg: 58, max: 68, elite: 72 },
    SILVER_3: { min: 50, avg: 60, max: 70, elite: 75 },
    SILVER_4: { min: 52, avg: 62, max: 72, elite: 78 },
    SILVER_ELITE: { min: 55, avg: 65, max: 75, elite: 80 },
    SILVER_ELITE_MASTER: { min: 58, avg: 68, max: 78, elite: 82 },
    GOLD_NOVA_1: { min: 60, avg: 70, max: 80, elite: 85 },
    GOLD_NOVA_2: { min: 62, avg: 72, max: 82, elite: 87 },
    GOLD_NOVA_3: { min: 65, avg: 75, max: 85, elite: 88 },
    GOLD_NOVA_MASTER: { min: 67, avg: 77, max: 87, elite: 90 },
    MASTER_GUARDIAN_1: { min: 70, avg: 78, max: 88, elite: 92 },
    MASTER_GUARDIAN_2: { min: 72, avg: 80, max: 90, elite: 93 },
    MASTER_GUARDIAN_ELITE: { min: 73, avg: 82, max: 91, elite: 94 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 75, avg: 83, max: 92, elite: 95 },
    LEGENDARY_EAGLE: { min: 76, avg: 85, max: 93, elite: 96 },
    LEGENDARY_EAGLE_MASTER: { min: 78, avg: 86, max: 94, elite: 97 },
    SUPREME_MASTER_FIRST_CLASS: { min: 80, avg: 88, max: 95, elite: 98 },
    GLOBAL_ELITE: { min: 82, avg: 90, max: 96, elite: 99 },
    PREMIER_0_5000: { min: 55, avg: 65, max: 75, elite: 82 },
    PREMIER_5000_10000: { min: 65, avg: 75, max: 85, elite: 90 },
    PREMIER_10000_15000: { min: 75, avg: 83, max: 92, elite: 95 },
    PREMIER_15000_20000: { min: 80, avg: 88, max: 95, elite: 98 },
    PREMIER_20000_PLUS: { min: 85, avg: 92, max: 98, elite: 100 },
  },

  // Headshot %
  headshotPercentage: {
    SILVER_1: { min: 25, avg: 32, max: 40, elite: 45 },
    SILVER_2: { min: 27, avg: 34, max: 42, elite: 47 },
    SILVER_3: { min: 28, avg: 36, max: 44, elite: 48 },
    SILVER_4: { min: 30, avg: 38, max: 46, elite: 50 },
    SILVER_ELITE: { min: 32, avg: 40, max: 48, elite: 52 },
    SILVER_ELITE_MASTER: { min: 34, avg: 42, max: 50, elite: 54 },
    GOLD_NOVA_1: { min: 36, avg: 44, max: 52, elite: 56 },
    GOLD_NOVA_2: { min: 38, avg: 46, max: 54, elite: 58 },
    GOLD_NOVA_3: { min: 40, avg: 48, max: 55, elite: 60 },
    GOLD_NOVA_MASTER: { min: 42, avg: 50, max: 57, elite: 62 },
    MASTER_GUARDIAN_1: { min: 43, avg: 51, max: 58, elite: 63 },
    MASTER_GUARDIAN_2: { min: 44, avg: 52, max: 59, elite: 64 },
    MASTER_GUARDIAN_ELITE: { min: 45, avg: 53, max: 60, elite: 65 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 46, avg: 54, max: 62, elite: 67 },
    LEGENDARY_EAGLE: { min: 47, avg: 55, max: 63, elite: 68 },
    LEGENDARY_EAGLE_MASTER: { min: 48, avg: 56, max: 64, elite: 70 },
    SUPREME_MASTER_FIRST_CLASS: { min: 48, avg: 57, max: 65, elite: 72 },
    GLOBAL_ELITE: { min: 50, avg: 58, max: 68, elite: 75 },
    PREMIER_0_5000: { min: 32, avg: 42, max: 50, elite: 55 },
    PREMIER_5000_10000: { min: 40, avg: 48, max: 56, elite: 62 },
    PREMIER_10000_15000: { min: 46, avg: 54, max: 62, elite: 68 },
    PREMIER_15000_20000: { min: 48, avg: 57, max: 65, elite: 72 },
    PREMIER_20000_PLUS: { min: 52, avg: 60, max: 70, elite: 78 },
  },

  // Win Rate
  winRate: {
    SILVER_1: { min: 30, avg: 42, max: 52, elite: 55 },
    SILVER_2: { min: 32, avg: 44, max: 53, elite: 56 },
    SILVER_3: { min: 34, avg: 45, max: 54, elite: 57 },
    SILVER_4: { min: 36, avg: 46, max: 55, elite: 58 },
    SILVER_ELITE: { min: 38, avg: 47, max: 56, elite: 60 },
    SILVER_ELITE_MASTER: { min: 40, avg: 48, max: 57, elite: 62 },
    GOLD_NOVA_1: { min: 42, avg: 49, max: 58, elite: 63 },
    GOLD_NOVA_2: { min: 43, avg: 50, max: 58, elite: 64 },
    GOLD_NOVA_3: { min: 44, avg: 50, max: 59, elite: 65 },
    GOLD_NOVA_MASTER: { min: 45, avg: 51, max: 60, elite: 65 },
    MASTER_GUARDIAN_1: { min: 46, avg: 51, max: 60, elite: 66 },
    MASTER_GUARDIAN_2: { min: 46, avg: 52, max: 61, elite: 67 },
    MASTER_GUARDIAN_ELITE: { min: 47, avg: 52, max: 62, elite: 68 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 47, avg: 53, max: 62, elite: 68 },
    LEGENDARY_EAGLE: { min: 48, avg: 53, max: 63, elite: 69 },
    LEGENDARY_EAGLE_MASTER: { min: 48, avg: 54, max: 64, elite: 70 },
    SUPREME_MASTER_FIRST_CLASS: { min: 49, avg: 55, max: 65, elite: 72 },
    GLOBAL_ELITE: { min: 50, avg: 56, max: 68, elite: 75 },
    PREMIER_0_5000: { min: 38, avg: 48, max: 57, elite: 62 },
    PREMIER_5000_10000: { min: 44, avg: 51, max: 60, elite: 66 },
    PREMIER_10000_15000: { min: 47, avg: 53, max: 63, elite: 70 },
    PREMIER_15000_20000: { min: 50, avg: 56, max: 66, elite: 74 },
    PREMIER_20000_PLUS: { min: 52, avg: 58, max: 70, elite: 80 },
  },

  // ============================================
  // SCORES D'ANALYSE (0-100)
  // ============================================

  overallScore: {
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
  },

  // Les autres scores d'analyse utilisent les mêmes benchmarks que overallScore
  // (aimScore, positioningScore, utilityScore, economyScore, timingScore, decisionScore)
  aimScore: {
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
  },

  // Isolation Death Rate (inversé: plus bas = mieux)
  isolationDeathRate: {
    SILVER_1: { min: 55, avg: 65, max: 75, elite: 50 },
    SILVER_2: { min: 52, avg: 62, max: 72, elite: 48 },
    SILVER_3: { min: 50, avg: 60, max: 70, elite: 45 },
    SILVER_4: { min: 48, avg: 58, max: 68, elite: 42 },
    SILVER_ELITE: { min: 45, avg: 55, max: 65, elite: 40 },
    SILVER_ELITE_MASTER: { min: 42, avg: 52, max: 62, elite: 38 },
    GOLD_NOVA_1: { min: 40, avg: 50, max: 60, elite: 35 },
    GOLD_NOVA_2: { min: 38, avg: 48, max: 58, elite: 33 },
    GOLD_NOVA_3: { min: 35, avg: 45, max: 55, elite: 30 },
    GOLD_NOVA_MASTER: { min: 33, avg: 42, max: 52, elite: 28 },
    MASTER_GUARDIAN_1: { min: 30, avg: 40, max: 50, elite: 25 },
    MASTER_GUARDIAN_2: { min: 28, avg: 38, max: 48, elite: 23 },
    MASTER_GUARDIAN_ELITE: { min: 26, avg: 35, max: 45, elite: 20 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 24, avg: 32, max: 42, elite: 18 },
    LEGENDARY_EAGLE: { min: 22, avg: 30, max: 40, elite: 16 },
    LEGENDARY_EAGLE_MASTER: { min: 20, avg: 28, max: 38, elite: 15 },
    SUPREME_MASTER_FIRST_CLASS: { min: 18, avg: 25, max: 35, elite: 12 },
    GLOBAL_ELITE: { min: 15, avg: 22, max: 32, elite: 10 },
    PREMIER_0_5000: { min: 42, avg: 52, max: 62, elite: 38 },
    PREMIER_5000_10000: { min: 33, avg: 42, max: 52, elite: 28 },
    PREMIER_10000_15000: { min: 24, avg: 32, max: 42, elite: 18 },
    PREMIER_15000_20000: { min: 18, avg: 25, max: 35, elite: 12 },
    PREMIER_20000_PLUS: { min: 12, avg: 18, max: 28, elite: 8 },
  },

  // Flash Efficiency
  flashEfficiency: {
    SILVER_1: { min: 15, avg: 25, max: 35, elite: 40 },
    SILVER_2: { min: 18, avg: 28, max: 38, elite: 43 },
    SILVER_3: { min: 20, avg: 30, max: 42, elite: 47 },
    SILVER_4: { min: 22, avg: 33, max: 45, elite: 50 },
    SILVER_ELITE: { min: 25, avg: 36, max: 48, elite: 53 },
    SILVER_ELITE_MASTER: { min: 28, avg: 40, max: 52, elite: 57 },
    GOLD_NOVA_1: { min: 32, avg: 44, max: 55, elite: 60 },
    GOLD_NOVA_2: { min: 35, avg: 47, max: 58, elite: 63 },
    GOLD_NOVA_3: { min: 38, avg: 50, max: 62, elite: 67 },
    GOLD_NOVA_MASTER: { min: 42, avg: 53, max: 65, elite: 70 },
    MASTER_GUARDIAN_1: { min: 45, avg: 56, max: 68, elite: 73 },
    MASTER_GUARDIAN_2: { min: 48, avg: 60, max: 72, elite: 77 },
    MASTER_GUARDIAN_ELITE: { min: 52, avg: 63, max: 75, elite: 80 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 55, avg: 67, max: 78, elite: 83 },
    LEGENDARY_EAGLE: { min: 58, avg: 70, max: 80, elite: 85 },
    LEGENDARY_EAGLE_MASTER: { min: 62, avg: 73, max: 83, elite: 88 },
    SUPREME_MASTER_FIRST_CLASS: { min: 65, avg: 76, max: 85, elite: 90 },
    GLOBAL_ELITE: { min: 70, avg: 80, max: 90, elite: 95 },
    PREMIER_0_5000: { min: 28, avg: 40, max: 52, elite: 57 },
    PREMIER_5000_10000: { min: 42, avg: 53, max: 65, elite: 70 },
    PREMIER_10000_15000: { min: 55, avg: 67, max: 78, elite: 83 },
    PREMIER_15000_20000: { min: 65, avg: 76, max: 85, elite: 90 },
    PREMIER_20000_PLUS: { min: 72, avg: 82, max: 92, elite: 97 },
  },

  // Clutch Win Rate
  clutchWinRate: {
    SILVER_1: { min: 5, avg: 12, max: 20, elite: 25 },
    SILVER_2: { min: 7, avg: 14, max: 22, elite: 27 },
    SILVER_3: { min: 8, avg: 16, max: 25, elite: 30 },
    SILVER_4: { min: 10, avg: 18, max: 28, elite: 33 },
    SILVER_ELITE: { min: 12, avg: 20, max: 30, elite: 35 },
    SILVER_ELITE_MASTER: { min: 14, avg: 22, max: 33, elite: 38 },
    GOLD_NOVA_1: { min: 16, avg: 25, max: 35, elite: 40 },
    GOLD_NOVA_2: { min: 18, avg: 27, max: 38, elite: 43 },
    GOLD_NOVA_3: { min: 20, avg: 30, max: 40, elite: 45 },
    GOLD_NOVA_MASTER: { min: 22, avg: 32, max: 43, elite: 48 },
    MASTER_GUARDIAN_1: { min: 24, avg: 35, max: 45, elite: 50 },
    MASTER_GUARDIAN_2: { min: 26, avg: 37, max: 48, elite: 53 },
    MASTER_GUARDIAN_ELITE: { min: 28, avg: 40, max: 50, elite: 55 },
    DISTINGUISHED_MASTER_GUARDIAN: { min: 30, avg: 42, max: 53, elite: 58 },
    LEGENDARY_EAGLE: { min: 32, avg: 45, max: 55, elite: 60 },
    LEGENDARY_EAGLE_MASTER: { min: 35, avg: 47, max: 58, elite: 63 },
    SUPREME_MASTER_FIRST_CLASS: { min: 38, avg: 50, max: 60, elite: 67 },
    GLOBAL_ELITE: { min: 42, avg: 55, max: 65, elite: 72 },
    PREMIER_0_5000: { min: 14, avg: 22, max: 33, elite: 38 },
    PREMIER_5000_10000: { min: 22, avg: 32, max: 43, elite: 48 },
    PREMIER_10000_15000: { min: 30, avg: 42, max: 53, elite: 58 },
    PREMIER_15000_20000: { min: 38, avg: 50, max: 60, elite: 67 },
    PREMIER_20000_PLUS: { min: 45, avg: 58, max: 70, elite: 78 },
  },
};

// ============================================
// HELPERS
// ============================================

/**
 * Obtenir le benchmark d'une métrique pour un rank donné
 */
export function getBenchmark(metricId: string, rank: CS2Rank): MetricBenchmark | undefined {
  return BENCHMARKS[metricId]?.[rank];
}

/**
 * Comparer une valeur au benchmark d'un rank
 */
export type BenchmarkComparison = 'below_min' | 'below_avg' | 'at_avg' | 'above_avg' | 'at_max' | 'elite';

export function compareToRankBenchmark(
  metricId: string,
  value: number,
  rank: CS2Rank
): BenchmarkComparison | undefined {
  const benchmark = getBenchmark(metricId, rank);
  if (!benchmark) return undefined;

  // Métriques inversées (plus bas = mieux)
  const inversedMetrics = ['isolationDeathRate', 'dpr'];
  const isInversed = inversedMetrics.includes(metricId);

  if (isInversed) {
    if (benchmark.elite && value <= benchmark.elite) return 'elite';
    if (value <= benchmark.min) return 'at_max';
    if (value <= benchmark.avg) return 'above_avg';
    if (value <= benchmark.max) return 'at_avg';
    return 'below_min';
  }

  if (benchmark.elite && value >= benchmark.elite) return 'elite';
  if (value >= benchmark.max) return 'at_max';
  if (value >= benchmark.avg) return 'above_avg';
  if (value >= benchmark.min) return 'at_avg';
  return 'below_min';
}

/**
 * Obtenir la couleur selon la comparaison
 */
export function getComparisonColor(comparison: BenchmarkComparison): string {
  const colors: Record<BenchmarkComparison, string> = {
    below_min: 'text-red-400',
    below_avg: 'text-orange-400',
    at_avg: 'text-yellow-400',
    above_avg: 'text-green-400',
    at_max: 'text-green-400',
    elite: 'text-blue-400',
  };
  return colors[comparison];
}

/**
 * Obtenir le label selon la comparaison
 */
export function getComparisonLabel(comparison: BenchmarkComparison): string {
  const labels: Record<BenchmarkComparison, string> = {
    below_min: 'En dessous',
    below_avg: 'Sous la moyenne',
    at_avg: 'Moyen',
    above_avg: 'Au-dessus',
    at_max: 'Top du rank',
    elite: 'Elite',
  };
  return labels[comparison];
}

/**
 * Obtenir le rank suivant (pour progression)
 */
export function getNextRank(currentRank: CS2Rank): CS2Rank | null {
  const rankOrder: CS2Rank[] = [
    'SILVER_1', 'SILVER_2', 'SILVER_3', 'SILVER_4', 'SILVER_ELITE', 'SILVER_ELITE_MASTER',
    'GOLD_NOVA_1', 'GOLD_NOVA_2', 'GOLD_NOVA_3', 'GOLD_NOVA_MASTER',
    'MASTER_GUARDIAN_1', 'MASTER_GUARDIAN_2', 'MASTER_GUARDIAN_ELITE', 'DISTINGUISHED_MASTER_GUARDIAN',
    'LEGENDARY_EAGLE', 'LEGENDARY_EAGLE_MASTER', 'SUPREME_MASTER_FIRST_CLASS', 'GLOBAL_ELITE',
  ];

  const currentIndex = rankOrder.indexOf(currentRank);
  if (currentIndex === -1 || currentIndex === rankOrder.length - 1) {
    return null;
  }
  return rankOrder[currentIndex + 1];
}
