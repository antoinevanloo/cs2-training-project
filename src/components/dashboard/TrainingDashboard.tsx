'use client';

import { useState, useMemo } from 'react';
import type {
  Exercise,
  TrainingRoutine,
  TrainingProgress,
  TrainingRecommendation,
  Achievement,
  ExerciseDifficulty,
} from '@/lib/training';
import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// STYLES
// ============================================

const CATEGORY_STYLES: Record<AnalysisCategory, { color: string; bgColor: string; icon: string }> = {
  aim: { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: 'A' },
  positioning: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: 'P' },
  utility: { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: 'U' },
  economy: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: '$' },
  timing: { color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'T' },
  decision: { color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: 'D' },
  movement: { color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: 'M' },
  awareness: { color: 'text-pink-400', bgColor: 'bg-pink-500/20', icon: 'W' },
  teamplay: { color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', icon: 'E' },
};

const DIFFICULTY_STYLES: Record<ExerciseDifficulty, { color: string; label: string }> = {
  beginner: { color: 'text-green-400', label: 'Beginner' },
  intermediate: { color: 'text-yellow-400', label: 'Intermediate' },
  advanced: { color: 'text-orange-400', label: 'Advanced' },
  pro: { color: 'text-red-400', label: 'Pro' },
};

const RARITY_STYLES = {
  common: { color: 'text-gray-400', border: 'border-gray-500' },
  uncommon: { color: 'text-green-400', border: 'border-green-500' },
  rare: { color: 'text-blue-400', border: 'border-blue-500' },
  epic: { color: 'text-purple-400', border: 'border-purple-500' },
  legendary: { color: 'text-yellow-400', border: 'border-yellow-500' },
};

// ============================================
// EXERCISE CARD
// ============================================

interface ExerciseCardProps {
  exercise: Exercise;
  onStart?: (exercise: Exercise) => void;
  compact?: boolean;
}

export function ExerciseCard({ exercise, onStart, compact = false }: ExerciseCardProps) {
  const categoryStyle = CATEGORY_STYLES[exercise.category];
  const difficultyStyle = DIFFICULTY_STYLES[exercise.difficulty];

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer"
           onClick={() => onStart?.(exercise)}>
        <div className={`w-10 h-10 rounded-lg ${categoryStyle.bgColor} flex items-center justify-center`}>
          <span className={`font-bold ${categoryStyle.color}`}>{categoryStyle.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{exercise.name}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className={difficultyStyle.color}>{difficultyStyle.label}</span>
            <span className="text-gray-500">-</span>
            <span className="text-gray-500">{exercise.duration} min</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-800/30 border border-gray-700/50 overflow-hidden hover:border-gray-600 transition-all">
      {/* Header */}
      <div className={`p-4 ${categoryStyle.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${categoryStyle.color}`}>{categoryStyle.icon}</span>
            <div>
              <h4 className="font-semibold text-white">{exercise.name}</h4>
              <span className={`text-xs ${difficultyStyle.color}`}>{difficultyStyle.label}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white">{exercise.duration}</span>
            <span className="text-xs text-gray-400 block">min</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-400 mb-3">{exercise.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {exercise.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-300">
              {tag}
            </span>
          ))}
        </div>

        {/* Workshop map */}
        {exercise.workshopMap && (
          <a
            href={exercise.workshopMap.steamUrl}
            className="block mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            Workshop: {exercise.workshopMap.name}
          </a>
        )}

        {/* Start button */}
        {onStart && (
          <button
            onClick={() => onStart(exercise)}
            className="w-full py-2 rounded-lg bg-cs2-accent text-white font-medium hover:bg-cs2-accent-light transition-colors"
          >
            Commencer
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// ROUTINE CARD
// ============================================

interface RoutineCardProps {
  routine: TrainingRoutine;
  onStart?: (routine: TrainingRoutine) => void;
  exercises?: Exercise[];
}

export function RoutineCard({ routine, onStart, exercises = [] }: RoutineCardProps) {
  const difficultyStyle = DIFFICULTY_STYLES[routine.difficulty];

  return (
    <div className="rounded-xl bg-gray-800/30 border border-gray-700/50 overflow-hidden hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-white">{routine.name}</h4>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className={difficultyStyle.color}>{difficultyStyle.label}</span>
              <span className="text-gray-500">-</span>
              <span className="text-gray-400">{routine.totalDuration} min</span>
              {routine.focusCategory && (
                <>
                  <span className="text-gray-500">-</span>
                  <span className={CATEGORY_STYLES[routine.focusCategory].color}>
                    {routine.focusCategory}
                  </span>
                </>
              )}
            </div>
          </div>
          <span className="px-2 py-1 rounded bg-gray-700 text-xs text-gray-300 capitalize">
            {routine.type.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-2">{routine.description}</p>
      </div>

      {/* Exercises */}
      <div className="p-4">
        <div className="space-y-2">
          {routine.exercises.map((re, i) => {
            const exercise = exercises.find((e) => e.id === re.exerciseId);
            if (!exercise) return null;

            const catStyle = CATEGORY_STYLES[exercise.category];

            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded bg-gray-800/50">
                <span className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                  {re.order}
                </span>
                <span className={`w-6 h-6 rounded ${catStyle.bgColor} flex items-center justify-center text-xs ${catStyle.color}`}>
                  {catStyle.icon}
                </span>
                <span className="flex-1 text-sm text-white">{exercise.name}</span>
                <span className="text-xs text-gray-500">{re.duration} min</span>
                {re.optional && (
                  <span className="px-1.5 py-0.5 rounded bg-gray-700 text-xs text-gray-400">
                    optional
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      {onStart && (
        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={() => onStart(routine)}
            className="w-full py-2 rounded-lg bg-cs2-accent text-white font-medium hover:bg-cs2-accent-light transition-colors"
          >
            Démarrer la routine
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// PROGRESS CARD
// ============================================

interface ProgressCardProps {
  progress: TrainingProgress;
}

export function ProgressCard({ progress }: ProgressCardProps) {
  return (
    <div className="rounded-xl bg-gray-800/30 border border-gray-700/50 p-4">
      <h3 className="font-semibold text-white mb-4">Ta Progression</h3>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <div className="text-2xl font-bold text-white">{progress.stats.totalSessions}</div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <div className="text-2xl font-bold text-white">
            {Math.round(progress.stats.totalTime / 60)}h
          </div>
          <div className="text-xs text-gray-500">Temps total</div>
        </div>
        <div className="p-3 rounded-lg bg-orange-500/20 text-center">
          <div className="text-2xl font-bold text-orange-400">{progress.currentStreak.days}</div>
          <div className="text-xs text-gray-500">Streak actuel</div>
        </div>
        <div className="p-3 rounded-lg bg-purple-500/20 text-center">
          <div className="text-2xl font-bold text-purple-400">{progress.achievements.length}</div>
          <div className="text-xs text-gray-500">Achievements</div>
        </div>
      </div>

      {/* Category progress */}
      <h4 className="text-sm font-medium text-gray-400 mb-2">Par catégorie</h4>
      <div className="space-y-2">
        {Object.entries(progress.categoryProgress).map(([cat, prog]) => {
          const style = CATEGORY_STYLES[cat as AnalysisCategory];
          const percentage = Math.min(100, (prog.totalTime / 300) * 100); // 5h = 100%

          return (
            <div key={cat} className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded ${style.bgColor} flex items-center justify-center ${style.color}`}>
                {style.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 capitalize">{cat}</span>
                  <span className="text-gray-500">{Math.round(prog.totalTime)} min</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${style.bgColor.replace('/20', '')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ACHIEVEMENT CARD
// ============================================

interface AchievementCardProps {
  achievement: Achievement;
  unlocked?: boolean;
}

export function AchievementCard({ achievement, unlocked = false }: AchievementCardProps) {
  const rarityStyle = RARITY_STYLES[achievement.rarity];

  return (
    <div className={`p-4 rounded-xl border ${unlocked ? rarityStyle.border : 'border-gray-700/50'} ${unlocked ? 'bg-gray-800/30' : 'bg-gray-900/50 opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl ${unlocked ? 'bg-gradient-to-br from-cs2-accent to-cs2-accent-light' : 'bg-gray-700'} flex items-center justify-center`}>
          <span className={`text-xl font-bold ${unlocked ? 'text-white' : 'text-gray-500'}`}>
            {achievement.icon}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold ${unlocked ? 'text-white' : 'text-gray-500'}`}>
              {achievement.name}
            </h4>
            <span className={`text-xs ${rarityStyle.color}`}>
              {achievement.rarity}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{achievement.description}</p>
          {unlocked && achievement.unlockedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// RECOMMENDATION CARD
// ============================================

interface RecommendationCardProps {
  recommendation: TrainingRecommendation;
  onAction?: (rec: TrainingRecommendation) => void;
}

export function RecommendationCard({ recommendation, onAction }: RecommendationCardProps) {
  const priorityColors = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-gray-700/50 bg-gray-800/30',
  };

  return (
    <div className={`p-4 rounded-xl border ${priorityColors[recommendation.priority]} cursor-pointer hover:border-cs2-accent/50 transition-colors`}
         onClick={() => onAction?.(recommendation)}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${
          recommendation.priority === 'high' ? 'bg-red-500/20' :
          recommendation.priority === 'medium' ? 'bg-yellow-500/20' : 'bg-gray-700'
        } flex items-center justify-center`}>
          <span className={`font-bold ${
            recommendation.priority === 'high' ? 'text-red-400' :
            recommendation.priority === 'medium' ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {recommendation.type.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white">{recommendation.title}</h4>
          <p className="text-sm text-gray-400 mt-0.5">{recommendation.description}</p>
          <p className="text-xs text-gray-500 mt-1">{recommendation.reason}</p>
          {recommendation.duration && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-300">
              {recommendation.duration} min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

interface TrainingDashboardProps {
  exercises: Exercise[];
  routines: TrainingRoutine[];
  progress?: TrainingProgress;
  recommendations?: TrainingRecommendation[];
  achievements?: Achievement[];
  onStartExercise?: (exercise: Exercise) => void;
  onStartRoutine?: (routine: TrainingRoutine) => void;
  className?: string;
}

export function TrainingDashboard({
  exercises,
  routines,
  progress,
  recommendations = [],
  achievements = [],
  onStartExercise,
  onStartRoutine,
  className = '',
}: TrainingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'routines' | 'exercises' | 'progress' | 'achievements'>('routines');
  const [categoryFilter, setCategoryFilter] = useState<AnalysisCategory | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<ExerciseDifficulty | 'all'>('all');

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && e.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [exercises, categoryFilter, difficultyFilter]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Training Mode</h2>
          <p className="text-gray-400 mt-1">Améliore tes skills avec des exercices ciblés</p>
        </div>
        {progress && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm text-gray-500">Streak</span>
              <div className="text-2xl font-bold text-orange-400">{progress.currentStreak.days} jours</div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recommandé pour toi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.slice(0, 2).map((rec, i) => (
              <RecommendationCard
                key={i}
                recommendation={rec}
                onAction={() => {
                  if (rec.routineId) {
                    const routine = routines.find((r) => r.id === rec.routineId);
                    if (routine) onStartRoutine?.(routine);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-gray-800/50">
        {(['routines', 'exercises', 'progress', 'achievements'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-cs2-accent text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'routines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              exercises={exercises}
              onStart={onStartRoutine}
            />
          ))}
        </div>
      )}

      {activeTab === 'exercises' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as AnalysisCategory | 'all')}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white"
            >
              <option value="all">Toutes catégories</option>
              {Object.keys(CATEGORY_STYLES).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as ExerciseDifficulty | 'all')}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white"
            >
              <option value="all">Toutes difficultés</option>
              {Object.entries(DIFFICULTY_STYLES).map(([diff, style]) => (
                <option key={diff} value={diff}>{style.label}</option>
              ))}
            </select>
          </div>

          {/* Exercise grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onStart={onStartExercise}
              />
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun exercice ne correspond aux filtres
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && progress && (
        <ProgressCard progress={progress} />
      )}

      {activeTab === 'progress' && !progress && (
        <div className="text-center py-12 text-gray-500">
          <p>Pas encore de progression</p>
          <p className="text-sm mt-1">Commence une session pour tracker ta progression!</p>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked={!!achievement.unlockedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
