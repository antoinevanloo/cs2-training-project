/**
 * Training Engine - Moteur principal du système d'entraînement
 *
 * Gère les sessions, routines, progression et recommandations
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Exercise,
  ExerciseDifficulty,
  TrainingRoutine,
  RoutineExercise,
  TrainingSession,
  CompletedExercise,
  SessionSummary,
  TrainingProgress,
  TrainingStats,
  CategoryProgress,
  ExerciseProgress,
  TrainingRecommendation,
  DailyPlan,
  Achievement,
  StreakInfo,
  StartSessionRequest,
  StartSessionResponse,
  CompleteExerciseRequest,
  CompleteSessionRequest,
} from './types';
import type { AnalysisCategory } from '@/lib/preferences/types';
import {
  ALL_EXERCISES,
  getExerciseById,
  getExercisesByCategory,
  getWarmupExercises,
} from './exercises';

// ============================================
// ROUTINES PRÉDÉFINIES
// ============================================

export const PREDEFINED_ROUTINES: TrainingRoutine[] = [
  {
    id: 'warmup-standard',
    name: 'Warmup Standard',
    description: 'Routine d\'échauffement équilibrée avant une session de jeu',
    totalDuration: 20,
    type: 'warmup',
    difficulty: 'beginner',
    exercises: [
      { exerciseId: 'aim-gridshot', duration: 5, order: 1 },
      { exerciseId: 'aim-aim-botz', duration: 10, order: 2 },
      { exerciseId: 'mental-warmup-routine', duration: 5, order: 3 },
    ],
    createdBy: 'system',
    createdAt: new Date(),
    tags: ['warmup', 'daily', 'quick'],
  },
  {
    id: 'aim-focus',
    name: 'Session Aim Intensive',
    description: 'Session focalisée sur l\'amélioration de la visée',
    totalDuration: 45,
    focusCategory: 'aim',
    type: 'skill_focus',
    difficulty: 'intermediate',
    exercises: [
      { exerciseId: 'aim-gridshot', duration: 10, order: 1 },
      { exerciseId: 'aim-spray-master', duration: 15, order: 2 },
      { exerciseId: 'aim-headshot-only-dm', duration: 15, order: 3 },
      { exerciseId: 'aim-aim-botz', duration: 5, order: 4, optional: true },
    ],
    createdBy: 'system',
    createdAt: new Date(),
    tags: ['aim', 'intensive', 'intermediate'],
  },
  {
    id: 'utility-mirage',
    name: 'Utility Mastery - Mirage',
    description: 'Apprends les utilitaires essentiels sur Mirage',
    totalDuration: 35,
    focusCategory: 'utility',
    type: 'skill_focus',
    difficulty: 'intermediate',
    exercises: [
      { exerciseId: 'util-yprac-mirage', duration: 20, order: 1 },
      { exerciseId: 'util-flash-practice', duration: 15, order: 2 },
    ],
    createdBy: 'system',
    createdAt: new Date(),
    tags: ['utility', 'mirage', 'intermediate'],
  },
  {
    id: 'full-session',
    name: 'Session Complète',
    description: 'Session d\'entraînement complète couvrant tous les aspects',
    totalDuration: 60,
    type: 'full_session',
    difficulty: 'intermediate',
    exercises: [
      { exerciseId: 'mental-warmup-routine', duration: 5, order: 1 },
      { exerciseId: 'aim-gridshot', duration: 5, order: 2 },
      { exerciseId: 'aim-aim-botz', duration: 10, order: 3 },
      { exerciseId: 'aim-spray-master', duration: 10, order: 4 },
      { exerciseId: 'util-yprac-mirage', duration: 15, order: 5 },
      { exerciseId: 'pos-prefire-practice', duration: 10, order: 6 },
      { exerciseId: 'timing-dm-counterstafe', duration: 5, order: 7 },
    ],
    createdBy: 'system',
    createdAt: new Date(),
    tags: ['full', 'complete', 'intermediate'],
  },
  {
    id: 'quick-15',
    name: 'Quick 15',
    description: 'Session rapide de 15 minutes pour les jours chargés',
    totalDuration: 15,
    type: 'quick',
    difficulty: 'beginner',
    exercises: [
      { exerciseId: 'aim-gridshot', duration: 5, order: 1 },
      { exerciseId: 'aim-aim-botz', duration: 10, order: 2 },
    ],
    createdBy: 'system',
    createdAt: new Date(),
    tags: ['quick', 'warmup', 'beginner'],
  },
  {
    id: 'decision-focus',
    name: 'Game Sense Training',
    description: 'Session focalisée sur la prise de décision',
    totalDuration: 50,
    focusCategory: 'decision',
    type: 'skill_focus',
    difficulty: 'advanced',
    exercises: [
      { exerciseId: 'decision-demo-review', duration: 20, order: 1 },
      { exerciseId: 'decision-clutch-scenarios', duration: 15, order: 2 },
      { exerciseId: 'pos-retake-practice', duration: 15, order: 3 },
    ],
    createdBy: 'system',
    createdAt: new Date(),
    tags: ['decision', 'game-sense', 'advanced'],
  },
];

// ============================================
// ACHIEVEMENTS
// ============================================

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Consistency
  {
    id: 'streak-3',
    name: 'On Fire',
    description: '3 jours d\'entraînement consécutifs',
    category: 'consistency',
    icon: '3',
    requirement: '3 jours de suite',
    rarity: 'common',
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7 jours d\'entraînement consécutifs',
    category: 'consistency',
    icon: '7',
    requirement: '7 jours de suite',
    rarity: 'uncommon',
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: '30 jours d\'entraînement consécutifs',
    category: 'consistency',
    icon: '30',
    requirement: '30 jours de suite',
    rarity: 'rare',
  },

  // Time
  {
    id: 'time-10h',
    name: 'Dedicated',
    description: '10 heures d\'entraînement total',
    category: 'time',
    icon: 'T',
    requirement: '10h total',
    rarity: 'common',
  },
  {
    id: 'time-50h',
    name: 'Committed',
    description: '50 heures d\'entraînement total',
    category: 'time',
    icon: 'T',
    requirement: '50h total',
    rarity: 'uncommon',
  },
  {
    id: 'time-100h',
    name: 'Training Veteran',
    description: '100 heures d\'entraînement total',
    category: 'time',
    icon: 'T',
    requirement: '100h total',
    rarity: 'rare',
  },

  // Mastery
  {
    id: 'aim-master',
    name: 'Sharpshooter',
    description: 'Maîtrise tous les exercices de visée',
    category: 'mastery',
    icon: 'A',
    requirement: 'Tous les exos aim complétés 10+',
    rarity: 'rare',
  },
  {
    id: 'utility-master',
    name: 'Smoke Lord',
    description: 'Maîtrise tous les exercices d\'utilitaires',
    category: 'mastery',
    icon: 'U',
    requirement: 'Tous les exos utility complétés 10+',
    rarity: 'rare',
  },

  // Variety
  {
    id: 'variety-10',
    name: 'Explorer',
    description: 'Essaye 10 exercices différents',
    category: 'variety',
    icon: 'V',
    requirement: '10 exercices différents',
    rarity: 'common',
  },
  {
    id: 'all-categories',
    name: 'Well Rounded',
    description: 'Entraîne-toi dans toutes les catégories',
    category: 'variety',
    icon: 'A',
    requirement: 'Toutes les catégories',
    rarity: 'uncommon',
  },

  // Special
  {
    id: 'first-session',
    name: 'First Steps',
    description: 'Complète ta première session d\'entraînement',
    category: 'special',
    icon: '1',
    requirement: '1 session complétée',
    rarity: 'common',
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Entraîne-toi après minuit',
    category: 'special',
    icon: 'N',
    requirement: 'Session après minuit',
    rarity: 'uncommon',
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Entraîne-toi avant 7h du matin',
    category: 'special',
    icon: 'E',
    requirement: 'Session avant 7h',
    rarity: 'uncommon',
  },
];

// ============================================
// TRAINING ENGINE
// ============================================

export class TrainingEngine {
  private sessions: Map<string, TrainingSession> = new Map();
  private progress: Map<string, TrainingProgress> = new Map();

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Démarre une nouvelle session d'entraînement
   */
  startSession(userId: string, request: StartSessionRequest): StartSessionResponse {
    let exercises: Exercise[] = [];

    // Si routine spécifiée
    if (request.routineId) {
      const routine = this.getRoutineById(request.routineId);
      if (routine) {
        exercises = routine.exercises
          .sort((a, b) => a.order - b.order)
          .map((re) => getExerciseById(re.exerciseId))
          .filter((e): e is Exercise => e !== undefined);
      }
    }

    // Si exercices spécifiques
    if (request.exerciseIds && request.exerciseIds.length > 0) {
      exercises = request.exerciseIds
        .map((id) => getExerciseById(id))
        .filter((e): e is Exercise => e !== undefined);
    }

    // Si catégorie focus
    if (request.focusCategory && exercises.length === 0) {
      exercises = getExercisesByCategory(request.focusCategory).slice(0, 5);
    }

    // Si toujours vide, routine par défaut
    if (exercises.length === 0) {
      exercises = getWarmupExercises();
    }

    const session: TrainingSession = {
      id: uuidv4(),
      userId,
      routineId: request.routineId,
      startedAt: new Date(),
      status: 'in_progress',
      completedExercises: [],
    };

    this.sessions.set(session.id, session);

    return {
      session,
      exercises,
      estimatedDuration: exercises.reduce((sum, e) => sum + e.duration, 0),
    };
  }

  /**
   * Enregistre un exercice complété
   */
  completeExercise(request: CompleteExerciseRequest): CompletedExercise | null {
    const session = this.sessions.get(request.sessionId);
    if (!session || session.status !== 'in_progress') {
      return null;
    }

    const completed: CompletedExercise = {
      exerciseId: request.exerciseId,
      duration: request.duration,
      status: request.status,
      metrics: request.metrics,
      performanceRating: request.performanceRating,
      notes: request.notes,
      completedAt: new Date(),
    };

    session.completedExercises.push(completed);

    // Update progress
    this.updateExerciseProgress(session.userId, request.exerciseId, completed);

    return completed;
  }

  /**
   * Termine une session
   */
  completeSession(request: CompleteSessionRequest): TrainingSession | null {
    const session = this.sessions.get(request.sessionId);
    if (!session) {
      return null;
    }

    session.status = 'completed';
    session.completedAt = new Date();
    session.actualDuration = Math.round(
      (session.completedAt.getTime() - session.startedAt.getTime()) / 60000
    );
    session.sessionRating = request.sessionRating;
    session.notes = request.notes;
    session.moodAfter = request.moodAfter;
    session.summary = this.generateSessionSummary(session);

    // Update progress
    this.updateProgress(session.userId, session);

    // Check achievements
    this.checkAchievements(session.userId);

    return session;
  }

  /**
   * Abandonne une session
   */
  abandonSession(sessionId: string): TrainingSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.status = 'abandoned';
    session.completedAt = new Date();

    return session;
  }

  // ============================================
  // ROUTINES
  // ============================================

  /**
   * Récupère une routine par ID
   */
  getRoutineById(routineId: string): TrainingRoutine | undefined {
    return PREDEFINED_ROUTINES.find((r) => r.id === routineId);
  }

  /**
   * Liste les routines disponibles
   */
  getAllRoutines(): TrainingRoutine[] {
    return PREDEFINED_ROUTINES;
  }

  /**
   * Liste les routines par type
   */
  getRoutinesByType(type: TrainingRoutine['type']): TrainingRoutine[] {
    return PREDEFINED_ROUTINES.filter((r) => r.type === type);
  }

  /**
   * Liste les routines par catégorie focus
   */
  getRoutinesByCategory(category: AnalysisCategory): TrainingRoutine[] {
    return PREDEFINED_ROUTINES.filter((r) => r.focusCategory === category);
  }

  /**
   * Génère une routine personnalisée
   */
  generatePersonalizedRoutine(
    userId: string,
    duration: number,
    focusCategory?: AnalysisCategory,
    difficulty?: ExerciseDifficulty
  ): TrainingRoutine {
    const progress = this.getProgress(userId);
    const exercises: RoutineExercise[] = [];
    let remainingTime = duration;

    // Warmup (5 min)
    if (remainingTime >= 5) {
      exercises.push({
        exerciseId: 'mental-warmup-routine',
        duration: 5,
        order: exercises.length + 1,
      });
      remainingTime -= 5;
    }

    // Focus exercises
    let targetExercises = focusCategory
      ? getExercisesByCategory(focusCategory)
      : ALL_EXERCISES;

    if (difficulty) {
      targetExercises = targetExercises.filter((e) => e.difficulty === difficulty);
    }

    // Sort by least practiced
    if (progress) {
      targetExercises.sort((a, b) => {
        const aProgress = progress.exerciseProgress[a.id]?.timesCompleted || 0;
        const bProgress = progress.exerciseProgress[b.id]?.timesCompleted || 0;
        return aProgress - bProgress;
      });
    }

    // Add exercises until time is filled
    for (const exercise of targetExercises) {
      if (remainingTime < exercise.duration) continue;

      exercises.push({
        exerciseId: exercise.id,
        duration: Math.min(exercise.duration, remainingTime),
        order: exercises.length + 1,
      });
      remainingTime -= exercise.duration;

      if (remainingTime <= 0) break;
    }

    return {
      id: `custom-${uuidv4()}`,
      name: focusCategory ? `Session ${focusCategory}` : 'Session Personnalisée',
      description: 'Routine générée automatiquement basée sur tes besoins',
      totalDuration: duration - remainingTime,
      focusCategory,
      type: 'skill_focus',
      difficulty: difficulty || 'intermediate',
      exercises,
      createdBy: 'system',
      createdAt: new Date(),
      tags: ['generated', 'personalized'],
    };
  }

  // ============================================
  // PROGRESS & STATS
  // ============================================

  /**
   * Récupère la progression d'un utilisateur
   */
  getProgress(userId: string): TrainingProgress | undefined {
    return this.progress.get(userId);
  }

  /**
   * Initialise la progression d'un utilisateur
   */
  initProgress(userId: string): TrainingProgress {
    const progress: TrainingProgress = {
      userId,
      stats: {
        totalSessions: 0,
        totalTime: 0,
        sessionsThisWeek: 0,
        timeThisWeek: 0,
        avgSessionsPerWeek: 0,
        avgSessionDuration: 0,
      },
      categoryProgress: {
        aim: this.createEmptyCategoryProgress('aim'),
        positioning: this.createEmptyCategoryProgress('positioning'),
        utility: this.createEmptyCategoryProgress('utility'),
        economy: this.createEmptyCategoryProgress('economy'),
        timing: this.createEmptyCategoryProgress('timing'),
        decision: this.createEmptyCategoryProgress('decision'),
        movement: this.createEmptyCategoryProgress('movement'),
        awareness: this.createEmptyCategoryProgress('awareness'),
        teamplay: this.createEmptyCategoryProgress('teamplay'),
      },
      exerciseProgress: {},
      currentStreak: { days: 0, startDate: new Date() },
      bestStreak: { days: 0, startDate: new Date() },
      achievements: [],
      activeGoals: [],
    };

    this.progress.set(userId, progress);
    return progress;
  }

  /**
   * Met à jour la progression après une session
   */
  private updateProgress(userId: string, session: TrainingSession): void {
    let progress = this.getProgress(userId);
    if (!progress) {
      progress = this.initProgress(userId);
    }

    // Update stats
    progress.stats.totalSessions++;
    progress.stats.totalTime += session.actualDuration || 0;
    progress.stats.avgSessionDuration =
      progress.stats.totalTime / progress.stats.totalSessions;

    // Update category progress
    for (const completed of session.completedExercises) {
      const exercise = getExerciseById(completed.exerciseId);
      if (exercise) {
        const catProgress = progress.categoryProgress[exercise.category];
        catProgress.totalTime += completed.duration;
        catProgress.sessionsCount++;
        catProgress.exercisesCompleted++;
        catProgress.lastPracticedAt = new Date();
      }
    }

    // Update streak
    const today = new Date().toDateString();
    const lastDate = progress.currentStreak.endDate?.toDateString();

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate === yesterday.toDateString()) {
        progress.currentStreak.days++;
      } else {
        // Reset streak
        if (progress.currentStreak.days > progress.bestStreak.days) {
          progress.bestStreak = { ...progress.currentStreak };
        }
        progress.currentStreak = {
          days: 1,
          startDate: new Date(),
        };
      }
      progress.currentStreak.endDate = new Date();
    }

    this.progress.set(userId, progress);
  }

  /**
   * Met à jour la progression d'un exercice
   */
  private updateExerciseProgress(
    userId: string,
    exerciseId: string,
    completed: CompletedExercise
  ): void {
    let progress = this.getProgress(userId);
    if (!progress) {
      progress = this.initProgress(userId);
    }

    if (!progress.exerciseProgress[exerciseId]) {
      progress.exerciseProgress[exerciseId] = {
        exerciseId,
        timesCompleted: 0,
        totalTime: 0,
        averageDuration: 0,
        mastery: 'novice',
      };
    }

    const exProgress = progress.exerciseProgress[exerciseId];
    exProgress.timesCompleted++;
    exProgress.totalTime += completed.duration;
    exProgress.averageDuration = exProgress.totalTime / exProgress.timesCompleted;
    exProgress.lastCompletedAt = new Date();

    if (completed.metrics) {
      exProgress.lastMetrics = completed.metrics;
      // Update best if better
      if (!exProgress.bestMetrics) {
        exProgress.bestMetrics = completed.metrics;
      } else {
        for (const [key, value] of Object.entries(completed.metrics)) {
          if (!exProgress.bestMetrics[key] || value > exProgress.bestMetrics[key]) {
            exProgress.bestMetrics[key] = value;
          }
        }
      }
    }

    // Update mastery level
    if (exProgress.timesCompleted >= 50) {
      exProgress.mastery = 'expert';
    } else if (exProgress.timesCompleted >= 25) {
      exProgress.mastery = 'proficient';
    } else if (exProgress.timesCompleted >= 10) {
      exProgress.mastery = 'competent';
    } else if (exProgress.timesCompleted >= 3) {
      exProgress.mastery = 'learning';
    }

    this.progress.set(userId, progress);
  }

  /**
   * Crée un CategoryProgress vide
   */
  private createEmptyCategoryProgress(category: AnalysisCategory): CategoryProgress {
    return {
      category,
      totalTime: 0,
      sessionsCount: 0,
      exercisesCompleted: 0,
      currentLevel: 'beginner',
      progressToNextLevel: 0,
      trend: 'stable',
    };
  }

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  /**
   * Génère des recommandations personnalisées
   */
  getRecommendations(userId: string): TrainingRecommendation[] {
    const progress = this.getProgress(userId);
    const recommendations: TrainingRecommendation[] = [];

    // If no progress, recommend starting
    if (!progress || progress.stats.totalSessions === 0) {
      recommendations.push({
        type: 'routine',
        priority: 'high',
        title: 'Commence ton entraînement',
        description: 'Lance ta première session d\'échauffement',
        reason: 'La constance est la clé de la progression',
        routineId: 'warmup-standard',
        duration: 20,
      });
      return recommendations;
    }

    // Find weakest category
    const categoryEntries = Object.entries(progress.categoryProgress);
    const weakestCategory = categoryEntries.reduce((a, b) =>
      a[1].totalTime < b[1].totalTime ? a : b
    );

    if (weakestCategory[1].totalTime < 60) {
      recommendations.push({
        type: 'focus_area',
        priority: 'medium',
        title: `Travaille ton ${weakestCategory[0]}`,
        description: `Tu n'as pas beaucoup pratiqué ${weakestCategory[0]} récemment`,
        reason: 'Équilibre ton entraînement entre toutes les catégories',
        category: weakestCategory[0] as AnalysisCategory,
      });
    }

    // Streak recommendation
    if (progress.currentStreak.days >= 3 && progress.currentStreak.days < 7) {
      recommendations.push({
        type: 'routine',
        priority: 'high',
        title: 'Maintiens ton streak!',
        description: `${progress.currentStreak.days} jours consécutifs - continue!`,
        reason: 'Tu es proche de débloquer un achievement',
        routineId: 'quick-15',
        duration: 15,
      });
    }

    // Recovery recommendation
    const lastSession = Array.from(this.sessions.values())
      .filter((s) => s.userId === userId && s.status === 'completed')
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];

    if (lastSession && lastSession.moodAfter === 'tired') {
      recommendations.push({
        type: 'recovery',
        priority: 'low',
        title: 'Session légère recommandée',
        description: 'Tu semblais fatigué après ta dernière session',
        reason: 'Le repos fait partie de l\'entraînement',
        duration: 15,
      });
    }

    return recommendations;
  }

  /**
   * Génère le plan du jour
   */
  getDailyPlan(userId: string): DailyPlan {
    const recommendations = this.getRecommendations(userId);
    const progress = this.getProgress(userId);

    // Determine focus areas
    const focusAreas: AnalysisCategory[] = [];
    if (progress) {
      const weakest = Object.entries(progress.categoryProgress)
        .sort((a, b) => a[1].totalTime - b[1].totalTime)
        .slice(0, 2)
        .map(([cat]) => cat as AnalysisCategory);
      focusAreas.push(...weakest);
    }

    // Find suggested routine
    let suggestedRoutine: TrainingRoutine | undefined;
    const routineRec = recommendations.find((r) => r.type === 'routine');
    if (routineRec?.routineId) {
      suggestedRoutine = this.getRoutineById(routineRec.routineId);
    }

    return {
      date: new Date(),
      recommendations,
      suggestedRoutine,
      focusAreas,
      estimatedDuration: suggestedRoutine?.totalDuration || 30,
      personalizedTips: [
        'Hydrate-toi bien avant de commencer',
        'Étire tes poignets entre les exercices',
        'Focus sur la qualité, pas la quantité',
      ],
    };
  }

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  /**
   * Vérifie et débloque les achievements
   */
  private checkAchievements(userId: string): Achievement[] {
    const progress = this.getProgress(userId);
    if (!progress) return [];

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ALL_ACHIEVEMENTS) {
      // Skip if already unlocked
      if (progress.achievements.some((a) => a.id === achievement.id)) {
        continue;
      }

      let unlocked = false;

      switch (achievement.id) {
        case 'first-session':
          unlocked = progress.stats.totalSessions >= 1;
          break;
        case 'streak-3':
          unlocked = progress.currentStreak.days >= 3;
          break;
        case 'streak-7':
          unlocked = progress.currentStreak.days >= 7;
          break;
        case 'streak-30':
          unlocked = progress.currentStreak.days >= 30;
          break;
        case 'time-10h':
          unlocked = progress.stats.totalTime >= 600;
          break;
        case 'time-50h':
          unlocked = progress.stats.totalTime >= 3000;
          break;
        case 'time-100h':
          unlocked = progress.stats.totalTime >= 6000;
          break;
        case 'variety-10':
          unlocked = Object.keys(progress.exerciseProgress).length >= 10;
          break;
        case 'all-categories':
          unlocked = Object.values(progress.categoryProgress).every(
            (c) => c.sessionsCount > 0
          );
          break;
        case 'night-owl':
          const hour = new Date().getHours();
          unlocked = hour >= 0 && hour < 5;
          break;
        case 'early-bird':
          const earlyHour = new Date().getHours();
          unlocked = earlyHour >= 5 && earlyHour < 7;
          break;
      }

      if (unlocked) {
        const unlockedAchievement = { ...achievement, unlockedAt: new Date() };
        progress.achievements.push(unlockedAchievement);
        newlyUnlocked.push(unlockedAchievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      this.progress.set(userId, progress);
    }

    return newlyUnlocked;
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Génère un résumé de session
   */
  private generateSessionSummary(session: TrainingSession): SessionSummary {
    const completed = session.completedExercises.filter((e) => e.status === 'completed');
    const skipped = session.completedExercises.filter((e) => e.status === 'skipped');

    const categories = new Set<AnalysisCategory>();
    for (const ex of completed) {
      const exercise = getExerciseById(ex.exerciseId);
      if (exercise) {
        categories.add(exercise.category);
      }
    }

    return {
      totalTime: completed.reduce((sum, e) => sum + e.duration, 0),
      exercisesCompleted: completed.length,
      exercisesSkipped: skipped.length,
      focusAreas: Array.from(categories),
      highlights: this.generateHighlights(completed),
      areasToImprove: this.generateAreasToImprove(session),
    };
  }

  private generateHighlights(completed: CompletedExercise[]): string[] {
    const highlights: string[] = [];

    const bestRated = completed
      .filter((e) => e.performanceRating && e.performanceRating >= 4)
      .map((e) => getExerciseById(e.exerciseId)?.name)
      .filter((n): n is string => !!n);

    if (bestRated.length > 0) {
      highlights.push(`Excellente performance sur: ${bestRated.join(', ')}`);
    }

    if (completed.length >= 5) {
      highlights.push('Session complète et variée');
    }

    return highlights;
  }

  private generateAreasToImprove(session: TrainingSession): string[] {
    const areas: string[] = [];

    const lowRated = session.completedExercises
      .filter((e) => e.performanceRating && e.performanceRating <= 2);

    if (lowRated.length > 0) {
      areas.push('Continue à pratiquer les exercices difficiles');
    }

    const skipped = session.completedExercises.filter((e) => e.status === 'skipped');
    if (skipped.length > 0) {
      areas.push('Essaie de compléter tous les exercices la prochaine fois');
    }

    return areas;
  }

  /**
   * Récupère une session par ID
   */
  getSession(sessionId: string): TrainingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Liste les sessions d'un utilisateur
   */
  getUserSessions(userId: string, limit: number = 10): TrainingSession[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const trainingEngine = new TrainingEngine();
