/**
 * Types pour le système de Training Mode
 *
 * Gère les exercices, routines et suivi de progression
 */

import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// EXERCICES
// ============================================

export type ExerciseType =
  | 'aim_training'
  | 'spray_control'
  | 'movement'
  | 'utility_practice'
  | 'demo_review'
  | 'deathmatch'
  | 'retake'
  | 'theory'
  | 'mental';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export interface Exercise {
  /** Identifiant unique */
  id: string;

  /** Nom de l'exercice */
  name: string;

  /** Description détaillée */
  description: string;

  /** Type d'exercice */
  type: ExerciseType;

  /** Catégorie CS2 ciblée */
  category: AnalysisCategory;

  /** Niveau de difficulté */
  difficulty: ExerciseDifficulty;

  /** Durée estimée (minutes) */
  duration: number;

  /** Instructions étape par étape */
  instructions: string[];

  /** Conseils pour bien exécuter */
  tips: string[];

  /** Métriques à tracker */
  metrics?: ExerciseMetric[];

  /** Objectifs à atteindre */
  goals?: ExerciseGoal[];

  /** Workshop map associé (si applicable) */
  workshopMap?: {
    id: string;
    name: string;
    steamUrl: string;
  };

  /** Tags pour recherche */
  tags: string[];

  /** Exercices prérequis */
  prerequisites?: string[];

  /** Exercices recommandés après */
  nextExercises?: string[];

  /** Score d'efficacité (calculé) */
  effectivenessScore?: number;
}

export interface ExerciseMetric {
  id: string;
  name: string;
  unit: string;
  targetValue?: number;
  description?: string;
}

export interface ExerciseGoal {
  id: string;
  description: string;
  targetValue: number;
  unit: string;
  timeframe?: 'session' | 'daily' | 'weekly';
}

// ============================================
// ROUTINES
// ============================================

export interface TrainingRoutine {
  /** Identifiant unique */
  id: string;

  /** Nom de la routine */
  name: string;

  /** Description */
  description: string;

  /** Durée totale (minutes) */
  totalDuration: number;

  /** Catégorie principale */
  focusCategory?: AnalysisCategory;

  /** Type de routine */
  type: 'warmup' | 'skill_focus' | 'full_session' | 'quick' | 'recovery';

  /** Difficulté globale */
  difficulty: ExerciseDifficulty;

  /** Exercices de la routine */
  exercises: RoutineExercise[];

  /** Jours recommandés */
  recommendedDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];

  /** Fréquence recommandée par semaine */
  recommendedFrequency?: number;

  /** Créée par (user ou system) */
  createdBy: 'system' | 'user';

  /** Date de création */
  createdAt: Date;

  /** Tags */
  tags: string[];
}

export interface RoutineExercise {
  /** ID de l'exercice */
  exerciseId: string;

  /** Exercice (peuplé) */
  exercise?: Exercise;

  /** Durée pour cet exercice dans cette routine */
  duration: number;

  /** Ordre dans la routine */
  order: number;

  /** Notes spécifiques */
  notes?: string;

  /** Optionnel (peut être sauté) */
  optional?: boolean;
}

// ============================================
// SESSIONS D'ENTRAINEMENT
// ============================================

export interface TrainingSession {
  /** Identifiant unique */
  id: string;

  /** ID utilisateur */
  userId: string;

  /** Routine utilisée (si applicable) */
  routineId?: string;

  /** Date de début */
  startedAt: Date;

  /** Date de fin */
  completedAt?: Date;

  /** Durée effective (minutes) */
  actualDuration?: number;

  /** Statut */
  status: 'in_progress' | 'completed' | 'abandoned';

  /** Exercices complétés */
  completedExercises: CompletedExercise[];

  /** Note globale de la session (1-5) */
  sessionRating?: number;

  /** Notes de l'utilisateur */
  notes?: string;

  /** Humeur avant */
  moodBefore?: 'great' | 'good' | 'neutral' | 'tired' | 'stressed';

  /** Humeur après */
  moodAfter?: 'great' | 'good' | 'neutral' | 'tired' | 'stressed';

  /** Résumé auto-généré */
  summary?: SessionSummary;
}

export interface CompletedExercise {
  /** ID de l'exercice */
  exerciseId: string;

  /** Temps passé (minutes) */
  duration: number;

  /** Statut */
  status: 'completed' | 'skipped' | 'partial';

  /** Métriques enregistrées */
  metrics?: Record<string, number>;

  /** Note de performance (1-5) */
  performanceRating?: number;

  /** Notes */
  notes?: string;

  /** Timestamp de complétion */
  completedAt: Date;
}

export interface SessionSummary {
  totalTime: number;
  exercisesCompleted: number;
  exercisesSkipped: number;
  focusAreas: AnalysisCategory[];
  highlights: string[];
  areasToImprove: string[];
}

// ============================================
// PROGRESSION
// ============================================

export interface TrainingProgress {
  /** ID utilisateur */
  userId: string;

  /** Stats globales */
  stats: TrainingStats;

  /** Progression par catégorie */
  categoryProgress: Record<AnalysisCategory, CategoryProgress>;

  /** Progression par exercice */
  exerciseProgress: Record<string, ExerciseProgress>;

  /** Streak actuel */
  currentStreak: StreakInfo;

  /** Meilleur streak */
  bestStreak: StreakInfo;

  /** Achievements débloqués */
  achievements: Achievement[];

  /** Objectifs actifs */
  activeGoals: TrainingGoal[];
}

export interface TrainingStats {
  /** Sessions totales */
  totalSessions: number;

  /** Temps total (minutes) */
  totalTime: number;

  /** Sessions cette semaine */
  sessionsThisWeek: number;

  /** Temps cette semaine (minutes) */
  timeThisWeek: number;

  /** Moyenne de sessions par semaine */
  avgSessionsPerWeek: number;

  /** Durée moyenne de session (minutes) */
  avgSessionDuration: number;

  /** Jour le plus actif */
  mostActiveDay?: string;

  /** Exercice le plus pratiqué */
  mostPracticedExercise?: string;

  /** Catégorie la plus travaillée */
  mostWorkedCategory?: AnalysisCategory;
}

export interface CategoryProgress {
  category: AnalysisCategory;
  totalTime: number;
  sessionsCount: number;
  exercisesCompleted: number;
  currentLevel: ExerciseDifficulty;
  progressToNextLevel: number; // 0-100
  lastPracticedAt?: Date;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ExerciseProgress {
  exerciseId: string;
  timesCompleted: number;
  totalTime: number;
  averageDuration: number;
  bestMetrics?: Record<string, number>;
  lastMetrics?: Record<string, number>;
  lastCompletedAt?: Date;
  mastery: 'novice' | 'learning' | 'competent' | 'proficient' | 'expert';
}

export interface StreakInfo {
  days: number;
  startDate: Date;
  endDate?: Date;
}

// ============================================
// ACHIEVEMENTS
// ============================================

export type AchievementCategory =
  | 'consistency'
  | 'time'
  | 'mastery'
  | 'variety'
  | 'improvement'
  | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  unlockedAt?: Date;
  progress?: number; // 0-100
  requirement: string;
  reward?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface TrainingGoal {
  id: string;
  userId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target: GoalTarget;
  currentValue: number;
  status: 'active' | 'completed' | 'failed';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface GoalTarget {
  metric: 'sessions' | 'time' | 'exercises' | 'streak' | 'category_time';
  value: number;
  category?: AnalysisCategory;
}

// ============================================
// RECOMMENDATIONS
// ============================================

export interface TrainingRecommendation {
  type: 'routine' | 'exercise' | 'focus_area' | 'recovery';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  routineId?: string;
  exerciseId?: string;
  category?: AnalysisCategory;
  duration?: number;
}

export interface DailyPlan {
  date: Date;
  recommendations: TrainingRecommendation[];
  suggestedRoutine?: TrainingRoutine;
  focusAreas: AnalysisCategory[];
  estimatedDuration: number;
  personalizedTips: string[];
}

// ============================================
// SCHEDULE
// ============================================

export interface TrainingSchedule {
  userId: string;
  weeklyPlan: WeeklyPlan;
  preferences: SchedulePreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyPlan {
  monday?: DayPlan;
  tuesday?: DayPlan;
  wednesday?: DayPlan;
  thursday?: DayPlan;
  friday?: DayPlan;
  saturday?: DayPlan;
  sunday?: DayPlan;
}

export interface DayPlan {
  routineId?: string;
  exercises?: string[];
  duration: number;
  focusCategory?: AnalysisCategory;
  isRestDay?: boolean;
  notes?: string;
}

export interface SchedulePreferences {
  preferredTime?: 'morning' | 'afternoon' | 'evening' | 'night';
  availableDays: string[];
  maxDailyTime: number; // minutes
  minSessionsPerWeek: number;
  focusCategories: AnalysisCategory[];
  includeWarmup: boolean;
  reminderEnabled: boolean;
  reminderTime?: string;
}

// ============================================
// API
// ============================================

export interface StartSessionRequest {
  routineId?: string;
  exerciseIds?: string[];
  focusCategory?: AnalysisCategory;
}

export interface StartSessionResponse {
  session: TrainingSession;
  exercises: Exercise[];
  estimatedDuration: number;
}

export interface CompleteExerciseRequest {
  sessionId: string;
  exerciseId: string;
  duration: number;
  metrics?: Record<string, number>;
  performanceRating?: number;
  notes?: string;
  status: 'completed' | 'skipped' | 'partial';
}

export interface CompleteSessionRequest {
  sessionId: string;
  sessionRating?: number;
  notes?: string;
  moodAfter?: 'great' | 'good' | 'neutral' | 'tired' | 'stressed';
}
