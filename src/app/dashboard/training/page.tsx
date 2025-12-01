'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Target,
  Clock,
  Trophy,
  Flame,
  Play,
  CheckCircle2,
  ChevronRight,
  Star,
  Zap,
  Timer,
  BarChart3,
  Medal,
  TrendingUp,
  Lock,
  Crosshair,
  MapPin,
  Bomb,
  DollarSign,
  Brain,
  Users,
  Eye,
  Footprints,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisCategory } from '@/lib/preferences/types';
import { getCategoryStyle } from '@/lib/design/tokens';

// Types
type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'pro';
type ExerciseType = 'aim' | 'movement' | 'utility' | 'strategy' | 'warmup';

interface Exercise {
  id: string;
  title: string;
  description: string;
  type: ExerciseType;
  category: AnalysisCategory;
  difficulty: ExerciseDifficulty;
  duration: number; // minutes
  xp: number;
  completed?: boolean;
  locked?: boolean;
  premium?: boolean;
  workshopCode?: string;
  steps?: string[];
  tips?: string[];
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  exercises: string[];
  xpBonus: number;
  timeLimit: number; // hours
  expiresAt: Date;
  completed: boolean;
}

interface TrainingStats {
  totalXp: number;
  level: number;
  streak: number;
  exercisesCompleted: number;
  totalTime: number; // minutes
  weeklyProgress: number[]; // last 7 days
}

// Difficulty configurations
const DIFFICULTY_CONFIGS: Record<ExerciseDifficulty, { label: string; color: string; bgColor: string }> = {
  beginner: { label: 'Débutant', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  intermediate: { label: 'Intermédiaire', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  advanced: { label: 'Avancé', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  pro: { label: 'Pro', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

// Type configurations
const TYPE_CONFIGS: Record<ExerciseType, { icon: typeof Target; color: string }> = {
  aim: { icon: Crosshair, color: 'text-red-400' },
  movement: { icon: Footprints, color: 'text-blue-400' },
  utility: { icon: Bomb, color: 'text-green-400' },
  strategy: { icon: Brain, color: 'text-purple-400' },
  warmup: { icon: Flame, color: 'text-orange-400' },
};

// Category icon mapping
const CATEGORY_ICONS: Record<AnalysisCategory, typeof Target> = {
  aim: Crosshair,
  positioning: MapPin,
  utility: Bomb,
  economy: DollarSign,
  timing: Timer,
  decision: Brain,
  movement: Footprints,
  awareness: Eye,
  teamplay: Users,
};

// Mock exercises data
const EXERCISES: Exercise[] = [
  // Aim exercises
  {
    id: 'aim-1',
    title: 'Crosshair Placement Basics',
    description: 'Apprends à positionner ton viseur à hauteur de tête',
    type: 'aim',
    category: 'aim',
    difficulty: 'beginner',
    duration: 10,
    xp: 50,
    workshopCode: 'aim_botz',
    steps: [
      'Lance la map aim_botz',
      'Désactive le mouvement des bots',
      'Focus uniquement sur le placement à hauteur de tête',
      'Fais 100 kills en one-tap',
    ],
    tips: [
      'Utilise les lignes du décor comme repères',
      'Ne vise pas en bas quand tu te déplaces',
    ],
  },
  {
    id: 'aim-2',
    title: 'Spray Control AK-47',
    description: 'Maîtrise le pattern de spray de l\'AK-47',
    type: 'aim',
    category: 'aim',
    difficulty: 'intermediate',
    duration: 15,
    xp: 75,
    workshopCode: 'recoil_master',
    steps: [
      'Lance Recoil Master',
      'Sélectionne AK-47',
      'Practice le pattern 30 bullets',
      'Objectif: 80% accuracy',
    ],
  },
  {
    id: 'aim-3',
    title: 'Flick Training',
    description: 'Améliore ta vitesse de réaction et tes flicks',
    type: 'aim',
    category: 'aim',
    difficulty: 'advanced',
    duration: 20,
    xp: 100,
    premium: true,
    steps: [
      'Configure Aim Lab scenario "Gridshot"',
      'Fais 5 runs de 60 secondes',
      'Objectif: 80k+ score',
    ],
  },

  // Movement exercises
  {
    id: 'move-1',
    title: 'Counter-Strafing',
    description: 'Apprends à t\'arrêter instantanément pour tirer précis',
    type: 'movement',
    category: 'movement',
    difficulty: 'beginner',
    duration: 10,
    xp: 50,
    steps: [
      'Lance une map vide',
      'Strafe gauche (A), puis arrête avec D',
      'Tire au moment de l\'arrêt',
      'Répète 50 fois chaque côté',
    ],
    tips: [
      'Le timing est crucial',
      'Écoute le son de tes pas',
    ],
  },
  {
    id: 'move-2',
    title: 'Bunny Hop Basics',
    description: 'Les fondamentaux du bhop pour gagner en vitesse',
    type: 'movement',
    category: 'movement',
    difficulty: 'intermediate',
    duration: 15,
    xp: 75,
    workshopCode: 'bhop_maps',
  },
  {
    id: 'move-3',
    title: 'Jiggle Peeking',
    description: 'Technique avancée pour info et baiter les tirs',
    type: 'movement',
    category: 'movement',
    difficulty: 'advanced',
    duration: 15,
    xp: 100,
    premium: true,
  },

  // Utility exercises
  {
    id: 'util-1',
    title: 'Smokes Mirage A',
    description: 'Les 5 smokes essentielles pour take A Mirage',
    type: 'utility',
    category: 'utility',
    difficulty: 'beginner',
    duration: 20,
    xp: 75,
    workshopCode: 'yprac_mirage',
    steps: [
      'CT smoke depuis T spawn',
      'Jungle smoke depuis Palace',
      'Stairs smoke depuis Ramp',
      'Répète jusqu\'à 100% success',
    ],
  },
  {
    id: 'util-2',
    title: 'Pop Flashes',
    description: 'Apprends les flashes qui aveuglent à coup sûr',
    type: 'utility',
    category: 'utility',
    difficulty: 'intermediate',
    duration: 15,
    xp: 75,
  },

  // Strategy exercises
  {
    id: 'strat-1',
    title: 'Reading the Economy',
    description: 'Prédis l\'équipement adverse basé sur l\'économie',
    type: 'strategy',
    category: 'economy',
    difficulty: 'intermediate',
    duration: 10,
    xp: 75,
    steps: [
      'Compte les pertes adverses',
      'Calcule leur loss bonus',
      'Prédis: eco, force ou full buy',
    ],
  },
  {
    id: 'strat-2',
    title: 'Default Setups CT',
    description: 'Positions par défaut pour tenir les sites',
    type: 'strategy',
    category: 'positioning',
    difficulty: 'beginner',
    duration: 15,
    xp: 50,
  },

  // Warmup exercises
  {
    id: 'warmup-1',
    title: 'Quick Warmup',
    description: 'Routine de 10 min avant de jouer ranked',
    type: 'warmup',
    category: 'aim',
    difficulty: 'beginner',
    duration: 10,
    xp: 25,
    steps: [
      '5 min Deathmatch (HS only)',
      '3 min Aim training',
      '2 min Spray practice',
    ],
  },
  {
    id: 'warmup-2',
    title: 'Complete Warmup',
    description: 'Routine complète pour les sessions sérieuses',
    type: 'warmup',
    category: 'aim',
    difficulty: 'intermediate',
    duration: 25,
    xp: 50,
    premium: true,
  },
];

// Mock daily challenge
const DAILY_CHALLENGE: DailyChallenge = {
  id: 'daily-1',
  title: 'Challenge du jour: Aim Master',
  description: 'Complete les 3 exercices d\'aim pour gagner un bonus XP',
  exercises: ['aim-1', 'aim-2', 'warmup-1'],
  xpBonus: 150,
  timeLimit: 24,
  expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  completed: false,
};

// Mock stats
const INITIAL_STATS: TrainingStats = {
  totalXp: 1250,
  level: 5,
  streak: 3,
  exercisesCompleted: 24,
  totalTime: 480,
  weeklyProgress: [2, 3, 1, 4, 2, 0, 0],
};

// Exercise Card Component
function ExerciseCard({
  exercise,
  onStart,
  onComplete,
}: {
  exercise: Exercise;
  onStart: () => void;
  onComplete: () => void;
}) {
  const diffConfig = DIFFICULTY_CONFIGS[exercise.difficulty];
  const typeConfig = TYPE_CONFIGS[exercise.type];
  const TypeIcon = typeConfig.icon;
  const categoryStyle = getCategoryStyle(exercise.category);
  const CategoryIcon = CATEGORY_ICONS[exercise.category];

  return (
    <Card
      className={cn(
        'group transition-all duration-200 hover:scale-[1.02]',
        exercise.completed && 'border-green-500/30 bg-green-500/5',
        exercise.locked && 'opacity-50 cursor-not-allowed'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              exercise.completed ? 'bg-green-500/20' : typeConfig.color.replace('text-', 'bg-').replace('400', '500/20')
            )}
          >
            {exercise.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : exercise.locked ? (
              <Lock className="w-6 h-6 text-gray-500" />
            ) : (
              <TypeIcon className={cn('w-6 h-6', typeConfig.color)} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-white">{exercise.title}</h3>
              {exercise.premium && (
                <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                  PRO
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-3">{exercise.description}</p>

            {/* Meta info */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className={cn('text-xs px-2 py-0.5 rounded', diffConfig.bgColor, diffConfig.color)}>
                {diffConfig.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                style={{
                  backgroundColor: `${categoryStyle.color}20`,
                  color: categoryStyle.color,
                }}
              >
                <CategoryIcon className="w-3 h-3" />
                {categoryStyle.label}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {exercise.duration} min
              </span>
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <Star className="w-3 h-3" />
                {exercise.xp} XP
              </span>
            </div>
          </div>

          {/* Action */}
          <div className="flex-shrink-0">
            {exercise.completed ? (
              <Button variant="secondary" size="sm" disabled>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Terminé
              </Button>
            ) : exercise.locked ? (
              <Button variant="secondary" size="sm" disabled>
                <Lock className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={onStart} className="gap-1">
                <Play className="w-4 h-4" />
                Commencer
              </Button>
            )}
          </div>
        </div>

        {/* Expanded steps (shown on hover or when active) */}
        {exercise.steps && !exercise.completed && !exercise.locked && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 hidden group-hover:block">
            <h4 className="text-xs font-medium text-gray-400 mb-2">Étapes:</h4>
            <ol className="space-y-1">
              {exercise.steps.map((step, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-xs text-gray-500 mt-0.5">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            {exercise.workshopCode && (
              <p className="mt-2 text-xs text-gray-500">
                Workshop: <span className="text-cs2-accent">{exercise.workshopCode}</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Training Stats Card
function StatsCard({ stats }: { stats: TrainingStats }) {
  const xpToNextLevel = 500; // XP needed for next level
  const currentLevelXp = stats.totalXp % xpToNextLevel;
  const progressPercent = (currentLevelXp / xpToNextLevel) * 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cs2-accent to-purple-500 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{stats.level}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Niveau {stats.level}</h3>
            <p className="text-sm text-gray-400">{stats.totalXp} XP total</p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-orange-400 font-bold">{stats.streak}</span>
          <span className="text-xs text-gray-400">jours</span>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progression niveau {stats.level + 1}</span>
          <span>{currentLevelXp}/{xpToNextLevel} XP</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cs2-accent to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.exercisesCompleted}</div>
          <div className="text-xs text-gray-400">Exercices</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{Math.round(stats.totalTime / 60)}h</div>
          <div className="text-xs text-gray-400">Temps total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {stats.weeklyProgress.reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-xs text-gray-400">Cette semaine</div>
        </div>
      </div>
    </Card>
  );
}

// Daily Challenge Card
function DailyChallengeCard({
  challenge,
  exercises,
  onStartChallenge,
}: {
  challenge: DailyChallenge;
  exercises: Exercise[];
  onStartChallenge: () => void;
}) {
  const challengeExercises = exercises.filter((e) => challenge.exercises.includes(e.id));
  const completedCount = challengeExercises.filter((e) => e.completed).length;
  const totalCount = challengeExercises.length;
  const hoursRemaining = Math.max(0, Math.floor((challenge.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{challenge.title}</h3>
            <p className="text-sm text-gray-400">{challenge.description}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4" />
            <span className="font-bold">+{challenge.xpBonus} XP</span>
          </div>
          <span className="text-xs text-gray-500">{hoursRemaining}h restantes</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progression</span>
          <span>{completedCount}/{totalCount} exercices</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-2 mb-4">
        {challengeExercises.map((exercise) => (
          <div
            key={exercise.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg',
              exercise.completed ? 'bg-green-500/10' : 'bg-gray-800/50'
            )}
          >
            {exercise.completed ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-gray-600" />
            )}
            <span className={cn('text-sm', exercise.completed ? 'text-gray-400 line-through' : 'text-white')}>
              {exercise.title}
            </span>
            <span className="text-xs text-gray-500 ml-auto">{exercise.duration} min</span>
          </div>
        ))}
      </div>

      <Button onClick={onStartChallenge} className="w-full gap-2" disabled={challenge.completed}>
        {challenge.completed ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Challenge terminé !
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Commencer le challenge
          </>
        )}
      </Button>
    </Card>
  );
}

// Main Training Page
export default function TrainingPage() {
  const [selectedCategory, setSelectedCategory] = useState<AnalysisCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ExerciseDifficulty | 'all'>('all');
  const [exercises, setExercises] = useState<Exercise[]>(EXERCISES);
  const [stats, setStats] = useState<TrainingStats>(INITIAL_STATS);

  const filteredExercises = exercises.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && e.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const handleStartExercise = (exerciseId: string) => {
    // In a real app, this would open an exercise modal or navigate
    console.log('Starting exercise:', exerciseId);
  };

  const handleCompleteExercise = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, completed: true } : e))
    );

    const exercise = exercises.find((e) => e.id === exerciseId);
    if (exercise) {
      setStats((prev) => ({
        ...prev,
        totalXp: prev.totalXp + exercise.xp,
        exercisesCompleted: prev.exercisesCompleted + 1,
        totalTime: prev.totalTime + exercise.duration,
      }));
    }
  };

  const categories: (AnalysisCategory | 'all')[] = [
    'all',
    'aim',
    'positioning',
    'utility',
    'economy',
    'movement',
    'awareness',
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mode Entraînement</h1>
          <p className="text-gray-400 mt-1">Exercices personnalisés pour progresser</p>
        </div>
      </div>

      {/* Stats + Daily Challenge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsCard stats={stats} />
        <DailyChallengeCard
          challenge={DAILY_CHALLENGE}
          exercises={exercises}
          onStartChallenge={() => {
            const firstIncomplete = exercises.find(
              (e) => DAILY_CHALLENGE.exercises.includes(e.id) && !e.completed
            );
            if (firstIncomplete) handleStartExercise(firstIncomplete.id);
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Catégorie:</span>
          <div className="flex gap-1">
            {categories.map((cat) => {
              const style = cat !== 'all' ? getCategoryStyle(cat) : null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-all',
                    selectedCategory === cat
                      ? 'bg-cs2-accent text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                  style={
                    selectedCategory === cat && style
                      ? { backgroundColor: style.color }
                      : undefined
                  }
                >
                  {cat === 'all' ? 'Tous' : style?.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Difficulté:</span>
          <div className="flex gap-1">
            {(['all', 'beginner', 'intermediate', 'advanced', 'pro'] as const).map((diff) => {
              const config = diff !== 'all' ? DIFFICULTY_CONFIGS[diff] : null;
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-all',
                    selectedDifficulty === diff
                      ? config
                        ? `${config.bgColor} ${config.color}`
                        : 'bg-cs2-accent text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {diff === 'all' ? 'Tous' : config?.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Exercices ({filteredExercises.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onStart={() => handleStartExercise(exercise.id)}
              onComplete={() => handleCompleteExercise(exercise.id)}
            />
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">
              Aucun exercice ne correspond aux filtres sélectionnés
            </p>
          </Card>
        )}
      </div>

      {/* Recommended Routine */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-yellow-400" />
            Routine recommandée
          </CardTitle>
        </CardHeader>

        <p className="text-gray-400 text-sm mb-4">
          Basée sur ton profil et tes points à améliorer
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['warmup-1', 'aim-1', 'util-1'].map((id) => {
            const exercise = exercises.find((e) => e.id === id);
            if (!exercise) return null;

            const typeConfig = TYPE_CONFIGS[exercise.type];
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={id}
                className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all"
                onClick={() => handleStartExercise(id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
                  <span className="text-white font-medium">{exercise.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {exercise.duration} min
                  <Star className="w-3 h-3 ml-2 text-yellow-400" />
                  {exercise.xp} XP
                </div>
              </div>
            );
          })}
        </div>

        <Button className="mt-4 w-full gap-2">
          <Play className="w-4 h-4" />
          Lancer la routine complète
        </Button>
      </Card>
    </div>
  );
}
