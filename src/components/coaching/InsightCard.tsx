'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface SolutionStep {
  order: number;
  action: string;
  howTo: string;
  why: string;
}

interface Exercise {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  duration?: number;
  steamId?: string;
  url?: string;
}

interface InsightProps {
  insight: {
    id: string;
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    problem: {
      title: string;
      description: string;
      impactScore: number;
    };
    metrics: {
      current: number;
      rankAverage: number;
      targetRankAverage: number;
      gap: number;
      unit: string;
      trend: 'improving' | 'stable' | 'declining';
    };
    solution: {
      summary: string;
      steps: SolutionStep[];
      exercises: Exercise[];
      estimatedTimeToImprove: {
        minimum: number;
        typical: number;
        maximum: number;
      };
    };
    tags: string[];
  };
  defaultExpanded?: boolean;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-400',
    label: 'Critique',
  },
  high: {
    icon: AlertCircle,
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/50',
    textColor: 'text-orange-400',
    label: 'Important',
  },
  medium: {
    icon: Info,
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-400',
    label: 'Moyen',
  },
  low: {
    icon: CheckCircle2,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    label: 'Faible',
  },
};

const categoryLabels: Record<string, { label: string; icon: string }> = {
  aim: { label: 'Aim', icon: '🎯' },
  positioning: { label: 'Positionnement', icon: '📍' },
  utility: { label: 'Utilitaires', icon: '💣' },
  economy: { label: 'Économie', icon: '💰' },
  timing: { label: 'Timing', icon: '⏱️' },
  decision: { label: 'Décisions', icon: '🧠' },
};

export function InsightCard({ insight, defaultExpanded = false }: InsightProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = severityConfig[insight.severity];
  const SeverityIcon = config.icon;
  const category = categoryLabels[insight.category] || { label: insight.category, icon: '📊' };

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border transition-all duration-200`}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <SeverityIcon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm text-gray-400">{category.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}>
                  {config.label}
                </span>
              </div>
              <CardTitle className="text-white text-lg">
                {insight.problem.title}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {insight.metrics.current.toFixed(1)}{insight.metrics.unit === '%' ? '%' : ''}
              </div>
              <div className="text-xs text-gray-400">
                Cible: {insight.metrics.targetRankAverage.toFixed(1)}{insight.metrics.unit === '%' ? '%' : ''}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Description du problème */}
          <div>
            <p className="text-gray-300">{insight.problem.description}</p>
          </div>

          {/* Métriques comparatives */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-400">Toi</div>
              <div className={`text-xl font-bold ${insight.metrics.current < insight.metrics.targetRankAverage ? 'text-red-400' : 'text-green-400'}`}>
                {insight.metrics.current.toFixed(1)}{insight.metrics.unit === '%' ? '%' : ` ${insight.metrics.unit}`}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">Ton rank</div>
              <div className="text-xl font-bold text-gray-300">
                {insight.metrics.rankAverage.toFixed(1)}{insight.metrics.unit === '%' ? '%' : ` ${insight.metrics.unit}`}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">Rank cible</div>
              <div className="text-xl font-bold text-cs2-accent">
                {insight.metrics.targetRankAverage.toFixed(1)}{insight.metrics.unit === '%' ? '%' : ` ${insight.metrics.unit}`}
              </div>
            </div>
          </div>

          {/* Solution */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-green-400">💡</span> Solution
            </h4>
            <p className="text-cs2-accent mb-4">{insight.solution.summary}</p>

            {/* Étapes */}
            <div className="space-y-3">
              {insight.solution.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 bg-gray-800/30 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cs2-accent/20 text-cs2-accent flex items-center justify-center font-bold">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{step.action}</div>
                    <div className="text-sm text-gray-400">{step.howTo}</div>
                    <div className="text-xs text-gray-500 mt-1 italic">↳ {step.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exercices recommandés */}
          {insight.solution.exercises.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span>🎮</span> Exercices recommandés
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insight.solution.exercises.slice(0, 4).map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} compact />
                ))}
              </div>
            </div>
          )}

          {/* Temps estimé */}
          <div className="flex items-center gap-2 text-sm text-gray-400 pt-2 border-t border-gray-700/50">
            <span>⏳</span>
            <span>
              Temps estimé: {insight.solution.estimatedTimeToImprove.minimum}-{insight.solution.estimatedTimeToImprove.typical} jours
              avec un entraînement régulier
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {insight.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-gray-700/50 text-gray-400 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Composant ExerciseCard compact intégré
interface ExerciseCardProps {
  exercise: Exercise;
  compact?: boolean;
}

function ExerciseCard({ exercise, compact = false }: ExerciseCardProps) {
  const difficultyColors: Record<string, string> = {
    beginner: 'text-green-400 bg-green-400/10',
    intermediate: 'text-yellow-400 bg-yellow-400/10',
    advanced: 'text-red-400 bg-red-400/10',
  };

  const difficultyLabels: Record<string, string> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };

  if (compact) {
    return (
      <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:border-cs2-accent/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-white font-medium text-sm">{exercise.name}</div>
            {exercise.duration && (
              <div className="text-xs text-gray-400 mt-1">{exercise.duration} min</div>
            )}
          </div>
          {exercise.steamId && (
            <a
              href={exercise.url || `https://steamcommunity.com/sharedfiles/filedetails/?id=${exercise.steamId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 bg-cs2-accent/20 text-cs2-accent rounded hover:bg-cs2-accent/30 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Steam →
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700/30 hover:border-cs2-accent/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-white font-medium">{exercise.name}</h4>
          <span className={`text-xs px-2 py-0.5 rounded ${difficultyColors[exercise.difficulty] || 'text-gray-400 bg-gray-700/50'}`}>
            {difficultyLabels[exercise.difficulty] || exercise.difficulty}
          </span>
        </div>
        {exercise.description && (
          <p className="text-sm text-gray-400 mb-3">{exercise.description}</p>
        )}
        <div className="flex items-center justify-between">
          {exercise.duration && (
            <span className="text-sm text-gray-500">⏱️ {exercise.duration} min</span>
          )}
          {exercise.steamId && (
            <a
              href={exercise.url || `https://steamcommunity.com/sharedfiles/filedetails/?id=${exercise.steamId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1 bg-cs2-accent/20 text-cs2-accent rounded hover:bg-cs2-accent/30 transition-colors"
            >
              Ouvrir sur Steam →
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { ExerciseCard };