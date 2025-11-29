'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Target, Clock } from 'lucide-react';

interface CategoryComparison {
  category: string;
  currentScore: number;
  rankAverageScore: number;
  targetRankAverageScore: number;
  gap: number;
  status: 'above_target' | 'on_track' | 'below_average' | 'critical';
}

interface RankUpPriority {
  rank: number;
  category: string;
  issue: string;
  currentValue: number;
  targetValue: number;
  impact: string;
}

interface RankComparisonProps {
  comparison: {
    currentRank: string;
    targetRank: string;
    overallGap: {
      score: number;
      description: string;
    };
    categoryComparisons: CategoryComparison[];
    topPriorities: RankUpPriority[];
    estimatedTimeToRankUp: {
      optimistic: string;
      realistic: string;
      description: string;
    };
  };
}

const rankDisplayNames: Record<string, string> = {
  SILVER: 'Silver',
  GOLD_NOVA: 'Gold Nova',
  MASTER_GUARDIAN: 'Master Guardian',
  LEGENDARY_EAGLE: 'Legendary Eagle',
  SUPREME: 'Supreme',
  GLOBAL: 'Global Elite',
  PREMIER_0_5000: 'Premier (0-5K)',
  PREMIER_5000_10000: 'Premier (5K-10K)',
  PREMIER_10000_15000: 'Premier (10K-15K)',
  PREMIER_15000_20000: 'Premier (15K-20K)',
  PREMIER_20000_PLUS: 'Premier (20K+)',
};

const categoryLabels: Record<string, { label: string; icon: string }> = {
  aim: { label: 'Aim', icon: '🎯' },
  positioning: { label: 'Positionnement', icon: '📍' },
  utility: { label: 'Utilitaires', icon: '💣' },
  economy: { label: 'Économie', icon: '💰' },
  timing: { label: 'Timing', icon: '⏱️' },
  decision: { label: 'Décisions', icon: '🧠' },
};

const statusConfig = {
  above_target: {
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    icon: TrendingUp,
    label: 'Au-dessus de la cible',
  },
  on_track: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    icon: Minus,
    label: 'En bonne voie',
  },
  below_average: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    icon: TrendingDown,
    label: 'En dessous de la moyenne',
  },
  critical: {
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    icon: TrendingDown,
    label: 'Critique',
  },
};

export function RankComparisonCard({ comparison }: RankComparisonProps) {
  const currentRankName = rankDisplayNames[comparison.currentRank] || comparison.currentRank;
  const targetRankName = rankDisplayNames[comparison.targetRank] || comparison.targetRank;

  // Score de préparation (0-100)
  const readinessScore = comparison.overallGap.score;
  const readinessColor = readinessScore >= 80 ? 'text-green-400' : readinessScore >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Header avec ranks */}
      <Card className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-gray-600/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Current Rank */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Rank actuel</div>
              <div className="text-2xl font-bold text-white">{currentRankName}</div>
            </div>

            {/* Arrow & Gap */}
            <div className="flex flex-col items-center px-8">
              <ArrowRight className="w-8 h-8 text-cs2-accent mb-2" />
              <div className={`text-3xl font-bold ${readinessColor}`}>
                {readinessScore.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-400">prêt</div>
            </div>

            {/* Target Rank */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Rank cible</div>
              <div className="text-2xl font-bold text-cs2-accent">{targetRankName}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cs2-accent to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, readinessScore)}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2 text-center">{comparison.overallGap.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Comparaison par catégorie */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cs2-accent" />
            Comparaison par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {comparison.categoryComparisons.map((cat) => {
              const config = statusConfig[cat.status];
              const StatusIcon = config.icon;
              const category = categoryLabels[cat.category] || { label: cat.category, icon: '📊' };
              const progressPercent = Math.min(100, (cat.currentScore / cat.targetRankAverageScore) * 100);

              return (
                <div key={cat.category} className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-white font-medium">{category.label}</span>
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400">
                        {cat.currentScore.toFixed(0)} / {cat.targetRankAverageScore.toFixed(0)}
                      </span>
                      {cat.gap > 0 && (
                        <span className="text-red-400">(-{cat.gap.toFixed(0)})</span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.status === 'above_target' ? 'bg-green-500' :
                        cat.status === 'on_track' ? 'bg-blue-500' :
                        cat.status === 'below_average' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Priorités pour rank up */}
      {comparison.topPriorities.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Priorités pour rank up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comparison.topPriorities.map((priority) => {
                const category = categoryLabels[priority.category] || { label: priority.category, icon: '📊' };

                return (
                  <div
                    key={`${priority.category}-${priority.rank}`}
                    className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cs2-accent/20 text-cs2-accent flex items-center justify-center font-bold">
                      {priority.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{category.icon}</span>
                        <span className="text-white font-medium">{category.label}</span>
                      </div>
                      <div className="text-sm text-gray-400">{priority.issue}</div>
                      <div className="text-xs text-gray-500 mt-1">{priority.impact}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temps estimé */}
      <Card className="bg-gradient-to-r from-cs2-accent/10 to-orange-500/10 border-cs2-accent/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Clock className="w-10 h-10 text-cs2-accent" />
            <div>
              <div className="text-white font-medium">Temps estimé pour atteindre {targetRankName}</div>
              <div className="text-sm text-gray-400">
                {comparison.estimatedTimeToRankUp.optimistic} (optimiste) à {comparison.estimatedTimeToRankUp.realistic} (réaliste)
              </div>
              <div className="text-xs text-gray-500 mt-1">{comparison.estimatedTimeToRankUp.description}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}