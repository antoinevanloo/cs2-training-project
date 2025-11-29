'use client';

import { useEffect, useState } from 'react';
import { InsightCard, RankComparisonCard } from '@/components/coaching';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CoachingTabProps {
  demoId: string;
}

interface Insight {
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
    steps: Array<{
      order: number;
      action: string;
      howTo: string;
      why: string;
    }>;
    exercises: Array<{
      id: string;
      name: string;
      description?: string;
      category: string;
      difficulty: string;
      duration?: number;
      steamId?: string;
      url?: string;
    }>;
    estimatedTimeToImprove: {
      minimum: number;
      typical: number;
      maximum: number;
    };
  };
  tags: string[];
}

interface RankComparison {
  currentRank: string;
  targetRank: string;
  overallGap: {
    score: number;
    description: string;
  };
  categoryComparisons: Array<{
    category: string;
    currentScore: number;
    rankAverageScore: number;
    targetRankAverageScore: number;
    gap: number;
    status: 'above_target' | 'on_track' | 'below_average' | 'critical';
  }>;
  topPriorities: Array<{
    rank: number;
    category: string;
    issue: string;
    currentValue: number;
    targetValue: number;
    impact: string;
  }>;
  estimatedTimeToRankUp: {
    optimistic: string;
    realistic: string;
    description: string;
  };
}

interface CoachingData {
  insights: Insight[];
  rankComparison: RankComparison;
  executiveSummary?: {
    overallScore: number;
    mainStrength: string;
    mainWeakness: string;
    oneThingToFocus: string;
  };
}

export function CoachingTab({ demoId }: CoachingTabProps) {
  const [data, setData] = useState<CoachingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const fetchCoachingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/coaching/actionable/${demoId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du chargement');
      }

      const result = await response.json();

      if (!result.success || !result.report) {
        throw new Error('Réponse invalide');
      }

      setData({
        insights: result.report.insights || [],
        rankComparison: result.report.rankComparison,
        executiveSummary: result.report.executiveSummary,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachingData();
  }, [demoId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-cs2-accent animate-spin mb-4" />
        <p className="text-gray-400">Génération des insights de coaching...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchCoachingData} variant="secondary" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const insights = data.insights || [];
  const sortedInsights = [...insights].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const insightCounts = {
    critical: insights.filter((i) => i.severity === 'critical').length,
    high: insights.filter((i) => i.severity === 'high').length,
    medium: insights.filter((i) => i.severity === 'medium').length,
    low: insights.filter((i) => i.severity === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {data.executiveSummary && (
        <div className="p-4 bg-gradient-to-r from-cs2-accent/10 to-orange-500/5 rounded-lg border border-cs2-accent/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-white font-semibold">Focus principal</h3>
              <p className="text-cs2-accent">{data.executiveSummary.oneThingToFocus}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {data.executiveSummary.overallScore}
              </div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-400">+ </span>
              <span className="text-gray-300">{data.executiveSummary.mainStrength}</span>
            </div>
            <div>
              <span className="text-red-400">- </span>
              <span className="text-gray-300">{data.executiveSummary.mainWeakness}</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Rank Comparison */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">
          Insights ({insights.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComparison(!showComparison)}
        >
          {showComparison ? 'Masquer' : 'Voir'} comparaison rank
        </Button>
      </div>

      {/* Rank Comparison */}
      {showComparison && data.rankComparison && (
        <RankComparisonCard comparison={data.rankComparison} />
      )}

      {/* Severity Summary */}
      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {insightCounts.critical > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              {insightCounts.critical} critique{insightCounts.critical > 1 ? 's' : ''}
            </span>
          )}
          {insightCounts.high > 0 && (
            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
              {insightCounts.high} important{insightCounts.high > 1 ? 's' : ''}
            </span>
          )}
          {insightCounts.medium > 0 && (
            <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
              {insightCounts.medium} moyen{insightCounts.medium > 1 ? 's' : ''}
            </span>
          )}
          {insightCounts.low > 0 && (
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {insightCounts.low} faible{insightCounts.low > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Insights List */}
      {sortedInsights.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Aucun insight disponible pour cette démo.</p>
          <p className="text-sm mt-2">Continue à jouer pour générer des analyses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedInsights.map((insight, index) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              defaultExpanded={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
