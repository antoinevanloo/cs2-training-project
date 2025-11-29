/**
 * Types pour le système de coaching actionnable
 *
 * Ce module définit les structures pour générer des conseils
 * vraiment actionnables, liés au contexte précis du match.
 */

import { PlayerRole, CS2Rank } from '@prisma/client';

// ============================================
// INSIGHTS ACTIONNABLES
// ============================================

/**
 * Un insight actionnable est un conseil lié à un moment précis du match
 */
export interface ActionableInsight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;

  // Le problème identifié
  problem: {
    title: string;
    description: string;
    /** Impact sur la performance (pourcentage estimé) */
    impactScore: number;
  };

  // Contexte précis du match
  matchContext: MatchContext;

  // Données quantifiées
  metrics: InsightMetrics;

  // Solution proposée
  solution: ActionableSolution;

  // Priorité calculée (1 = plus urgent)
  priority: number;

  // Tags pour filtrage
  tags: string[];
}

export type InsightCategory =
  | 'aim'
  | 'positioning'
  | 'utility'
  | 'economy'
  | 'timing'
  | 'decision'
  | 'communication'
  | 'mental';

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Contexte précis dans le match où le problème a été identifié
 */
export interface MatchContext {
  /** Rounds où le problème s'est manifesté */
  rounds: RoundContext[];
  /** Positions sur la map concernées */
  positions: MapPosition[];
  /** Récurrence du problème */
  frequency: {
    occurrences: number;
    totalOpportunities: number;
    rate: number;
  };
  /** Pattern temporel (début/milieu/fin de match) */
  timing: 'early' | 'mid' | 'late' | 'consistent';
}

export interface RoundContext {
  roundNumber: number;
  /** Timestamp dans le round (secondes) */
  timestamp?: number;
  /** Ce qui s'est passé */
  event: string;
  /** Situation au moment de l'événement */
  situation: {
    playersAliveT: number;
    playersAliveCT: number;
    bombPlanted: boolean;
    economy: 'eco' | 'force' | 'full_buy';
  };
}

export interface MapPosition {
  x: number;
  y: number;
  /** Nom de la position (ex: "B Apartments", "Long Doors") */
  name: string;
  /** Zone de la map */
  zone: string;
  /** Combien de fois le problème s'est produit ici */
  occurrences: number;
}

/**
 * Métriques quantifiées du problème
 */
export interface InsightMetrics {
  /** Valeur actuelle du joueur */
  current: number;
  /** Benchmark pour son rank actuel */
  rankAverage: number;
  /** Benchmark pour le rank cible */
  targetRankAverage: number;
  /** Écart avec le rank cible */
  gap: number;
  /** Unité de mesure */
  unit: string;
  /** Tendance sur les derniers matchs */
  trend: 'improving' | 'stable' | 'declining';
  /** Historique récent */
  history?: number[];
}

// ============================================
// SOLUTIONS ACTIONNABLES
// ============================================

/**
 * Solution concrète proposée pour résoudre le problème
 */
export interface ActionableSolution {
  /** Résumé de ce qu'il faut faire */
  summary: string;

  /** Étapes concrètes */
  steps: SolutionStep[];

  /** Exercices recommandés (ordonnés par pertinence) */
  exercises: RecommendedExercise[];

  /** Temps estimé pour amélioration visible */
  estimatedTimeToImprove: {
    minimum: number; // en jours
    typical: number;
    maximum: number;
  };

  /** Ce qu'il faut mesurer pour voir l'amélioration */
  successCriteria: SuccessCriterion[];

  /** Conseils spécifiques au rôle du joueur */
  roleSpecificTips?: string[];

  /** Conseils spécifiques à la map */
  mapSpecificTips?: string[];
}

export interface SolutionStep {
  order: number;
  action: string;
  /** Détail de comment faire */
  howTo: string;
  /** Pourquoi c'est important */
  why: string;
  /** Exercice associé */
  exerciseId?: string;
}

export interface RecommendedExercise {
  id: string;
  name: string;
  description: string;

  /** Type d'exercice */
  type: ExerciseType;

  /** Durée recommandée en minutes */
  duration: number;

  /** Difficulté */
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  /** Score de pertinence pour ce problème (0-100) */
  relevanceScore: number;

  /** Lien Steam Workshop si applicable */
  workshopId?: string;
  workshopUrl?: string;

  /** Serveur communautaire si applicable */
  serverType?: string;

  /** Instructions spécifiques */
  instructions: string[];

  /** Objectifs mesurables */
  goals: ExerciseGoal[];
}

export type ExerciseType =
  | 'workshop_map'
  | 'aim_trainer'
  | 'community_server'
  | 'demo_review'
  | 'theory'
  | 'custom_game'
  | 'in_game_focus';

export interface ExerciseGoal {
  metric: string;
  target: number;
  unit: string;
}

export interface SuccessCriterion {
  metric: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  /** Comment mesurer */
  measurementMethod: string;
}

// ============================================
// COMPARAISON RANK
// ============================================

/**
 * Comparaison complète avec le rank cible
 */
export interface RankComparison {
  currentRank: CS2Rank;
  targetRank: CS2Rank;

  /** Écart global estimé */
  overallGap: {
    score: number; // 0-100, 100 = prêt pour le rank cible
    description: string;
  };

  /** Analyse par catégorie */
  categoryComparisons: CategoryComparison[];

  /** Top 3 priorités pour progresser */
  topPriorities: RankUpPriority[];

  /** Estimation du temps pour atteindre le rank cible */
  estimatedTimeToRankUp: {
    optimistic: string;
    realistic: string;
    description: string;
  };
}

export interface CategoryComparison {
  category: InsightCategory;
  currentScore: number;
  rankAverageScore: number;
  targetRankAverageScore: number;
  gap: number;
  status: 'above_target' | 'on_track' | 'below_average' | 'critical';
  specificGaps: SpecificGap[];
}

export interface SpecificGap {
  metric: string;
  current: number;
  target: number;
  gap: number;
  importance: 'critical' | 'important' | 'nice_to_have';
}

export interface RankUpPriority {
  rank: number; // 1, 2, 3
  category: InsightCategory;
  issue: string;
  currentValue: number;
  targetValue: number;
  impact: string;
  /** L'insight actionnable associé */
  insightId: string;
}

// ============================================
// RAPPORT ACTIONNABLE COMPLET
// ============================================

/**
 * Rapport de coaching actionnable complet
 */
export interface ActionableCoachingReport {
  /** ID unique du rapport */
  id: string;

  /** Date de génération */
  generatedAt: string;

  /** Contexte du joueur */
  playerContext: {
    rank: CS2Rank;
    targetRank: CS2Rank;
    role: PlayerRole;
    map: string;
    matchResult: 'win' | 'loss' | 'tie';
  };

  /** Résumé exécutif */
  executiveSummary: {
    overallScore: number;
    mainStrength: string;
    mainWeakness: string;
    oneThingToFocus: string;
  };

  /** Tous les insights actionnables */
  insights: ActionableInsight[];

  /** Comparaison avec rank cible */
  rankComparison: RankComparison;

  /** Plan d'action personnalisé */
  actionPlan: PersonalizedActionPlan;

  /** Métriques de progression */
  progressionMetrics: ProgressionSnapshot;
}

export interface PersonalizedActionPlan {
  /** Focus de la semaine */
  weeklyFocus: {
    primary: string;
    secondary: string;
  };

  /** Exercices quotidiens recommandés */
  dailyRoutine: DailyRoutine;

  /** Objectifs SMART pour la semaine */
  weeklyGoals: WeeklyGoal[];

  /** Checkpoints de progression */
  checkpoints: ProgressCheckpoint[];
}

export interface DailyRoutine {
  warmup: RecommendedExercise[];
  mainTraining: RecommendedExercise[];
  cooldown: RecommendedExercise[];
  totalDuration: number;
}

export interface WeeklyGoal {
  id: string;
  description: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  deadline: string;
  relatedInsightId: string;
}

export interface ProgressCheckpoint {
  day: number;
  focus: string;
  exercises: string[];
  expectedProgress: string;
}

export interface ProgressionSnapshot {
  /** Comparaison avec la démo précédente */
  vsLastDemo?: {
    overallChange: number;
    improvements: string[];
    regressions: string[];
  };

  /** Tendance sur les 5 dernières démos */
  trend: {
    overall: 'improving' | 'stable' | 'declining';
    byCategory: Record<InsightCategory, 'improving' | 'stable' | 'declining'>;
  };

  /** Objectifs atteints */
  achievedGoals: string[];

  /** Objectifs en cours */
  activeGoals: WeeklyGoal[];
}
