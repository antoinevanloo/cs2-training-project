/**
 * Training Module
 *
 * Export principal pour le système d'entraînement
 */

export { TrainingEngine, trainingEngine, PREDEFINED_ROUTINES, ALL_ACHIEVEMENTS } from './training-engine';
export {
  ALL_EXERCISES,
  AIM_EXERCISES,
  UTILITY_EXERCISES,
  POSITIONING_EXERCISES,
  ECONOMY_EXERCISES,
  TIMING_EXERCISES,
  DECISION_EXERCISES,
  MENTAL_EXERCISES,
  getExerciseById,
  getExercisesByCategory,
  getExercisesByDifficulty,
  getExercisesByType,
  searchExercises,
  getWarmupExercises,
  getQuickExercises,
} from './exercises';

export type {
  // Exercises
  ExerciseType,
  ExerciseDifficulty,
  Exercise,
  ExerciseMetric,
  ExerciseGoal,

  // Routines
  TrainingRoutine,
  RoutineExercise,

  // Sessions
  TrainingSession,
  CompletedExercise,
  SessionSummary,

  // Progress
  TrainingProgress,
  TrainingStats,
  CategoryProgress,
  ExerciseProgress,
  StreakInfo,

  // Achievements
  AchievementCategory,
  Achievement,
  TrainingGoal,
  GoalTarget,

  // Recommendations
  TrainingRecommendation,
  DailyPlan,

  // Schedule
  TrainingSchedule,
  WeeklyPlan,
  DayPlan,
  SchedulePreferences,

  // API
  StartSessionRequest,
  StartSessionResponse,
  CompleteExerciseRequest,
  CompleteSessionRequest,
} from './types';
