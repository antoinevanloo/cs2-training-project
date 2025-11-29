/**
 * Module de coaching actionnable
 *
 * Ce module fournit:
 * - Génération d'insights actionnables contextualisés
 * - Benchmarks par rank CS2
 * - Bibliothèque d'exercices enrichie avec workshop maps réels
 * - Comparaison avec rank cible
 * - Plans d'action personnalisés
 */

// Types
export * from './types';

// Benchmarks
export {
  RANK_BENCHMARKS,
  getBenchmarkForRank,
  getMetricBenchmark,
  compareToRank,
  getNextRank,
  calculateRankGap,
  type RankBenchmark,
  type BenchmarkMetrics,
  type MetricBenchmark,
} from './benchmarks';

// Exercises Library
export {
  WORKSHOP_MAPS,
  COMMUNITY_SERVERS,
  THEORY_EXERCISES,
  findExercisesForWeakness,
  getExercisesByCategory,
  generateDailyRoutine,
  type WorkshopMap,
  type CommunityServerType,
  type TheoryExercise,
  type ExerciseMatch,
  type DailyRoutineConfig,
} from './exercises-library';

// Insight Generator
export {
  ActionableInsightGenerator,
  insightGenerator,
} from './insight-generator';