'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, Target, Dumbbell, CheckCircle2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  duration: number;
  category: string;
}

interface WeeklyGoal {
  id: string;
  description: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  deadline: string;
}

interface ProgressCheckpoint {
  day: number;
  focus: string;
  exercises: string[];
  expectedProgress: string;
}

interface DailyRoutine {
  warmup: Exercise[];
  mainTraining: Exercise[];
  cooldown: Exercise[];
  totalDuration: number;
}

interface ActionPlanProps {
  plan: {
    weeklyFocus: {
      primary: string;
      secondary: string;
    };
    dailyRoutine: DailyRoutine;
    weeklyGoals: WeeklyGoal[];
    checkpoints: ProgressCheckpoint[];
  };
}

export function ActionPlanCard({ plan }: ActionPlanProps) {
  return (
    <div className="space-y-6">
      {/* Focus de la semaine */}
      <Card className="bg-gradient-to-r from-cs2-accent/10 to-orange-500/5 border-cs2-accent/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cs2-accent" />
            Focus de la semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-cs2-accent">
              <div className="text-xs text-cs2-accent mb-1">PRIORITÉ #1</div>
              <div className="text-white font-medium">{plan.weeklyFocus.primary}</div>
            </div>
            <div className="p-4 bg-gray-800/30 rounded-lg border-l-4 border-gray-600">
              <div className="text-xs text-gray-400 mb-1">PRIORITÉ #2</div>
              <div className="text-gray-300">{plan.weeklyFocus.secondary}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routine quotidienne */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-green-400" />
            Routine quotidienne ({plan.dailyRoutine.totalDuration} min)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Warmup */}
            {plan.dailyRoutine.warmup.length > 0 && (
              <div>
                <div className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                  <span>🔥</span> Échauffement
                </div>
                <div className="grid gap-2">
                  {plan.dailyRoutine.warmup.map((exercise) => (
                    <ExerciseRow key={exercise.id} exercise={exercise} />
                  ))}
                </div>
              </div>
            )}

            {/* Main Training */}
            {plan.dailyRoutine.mainTraining.length > 0 && (
              <div>
                <div className="text-sm font-medium text-cs2-accent mb-2 flex items-center gap-2">
                  <span>💪</span> Entraînement principal
                </div>
                <div className="grid gap-2">
                  {plan.dailyRoutine.mainTraining.map((exercise) => (
                    <ExerciseRow key={exercise.id} exercise={exercise} />
                  ))}
                </div>
              </div>
            )}

            {/* Cooldown */}
            {plan.dailyRoutine.cooldown.length > 0 && (
              <div>
                <div className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                  <span>❄️</span> Cooldown
                </div>
                <div className="grid gap-2">
                  {plan.dailyRoutine.cooldown.map((exercise) => (
                    <ExerciseRow key={exercise.id} exercise={exercise} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Objectifs hebdomadaires */}
      {plan.weeklyGoals.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              Objectifs de la semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.weeklyGoals.map((goal) => {
                const progress = Math.min(100, ((goal.currentValue - 0) / (goal.targetValue - 0)) * 100);

                return (
                  <div key={goal.id} className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">{goal.description}</span>
                      <span className="text-xs text-gray-400">
                        {goal.currentValue.toFixed(1)} → {goal.targetValue.toFixed(1)} {goal.metric}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(0, progress)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Deadline: {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkpoints */}
      {plan.checkpoints.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Checkpoints de progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

              <div className="space-y-6">
                {plan.checkpoints.map((checkpoint, index) => (
                  <div key={checkpoint.day} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                      index === 0 ? 'bg-cs2-accent border-cs2-accent' :
                      'bg-gray-800 border-gray-600'
                    }`} />

                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-medium ${
                          index === 0 ? 'text-cs2-accent' : 'text-gray-400'
                        }`}>
                          Jour {checkpoint.day}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-sm text-gray-400">{checkpoint.focus}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Exercices: {checkpoint.exercises.join(', ')}
                      </div>
                      <div className="text-sm text-green-400">
                        ✓ {checkpoint.expectedProgress}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const categoryLabels: Record<string, string> = {
    aim: '🎯',
    positioning: '📍',
    utility: '💣',
    economy: '💰',
    timing: '⏱️',
    decision: '🧠',
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
      <div className="flex items-center gap-2">
        <span className="text-sm">{categoryLabels[exercise.category] || '📊'}</span>
        <span className="text-white text-sm">{exercise.name}</span>
      </div>
      <span className="text-xs text-gray-400">{exercise.duration} min</span>
    </div>
  );
}