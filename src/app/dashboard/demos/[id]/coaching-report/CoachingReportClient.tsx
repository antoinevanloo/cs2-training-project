'use client';

import { useEffect, useState } from 'react';
import { InsightCard, RankComparisonCard, ActionPlanCard } from '@/components/coaching';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CoachingReportClientProps {
  demoId: string;
}

// Types alignés avec ActionableCoachingReport du backend
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

interface ActionPlan {
  weeklyFocus: {
    primary: string;
    secondary: string;
  };
  dailyRoutine: {
    warmup: Array<{
      id: string;
      name: string;
      duration: number;
      category: string;
    }>;
    mainTraining: Array<{
      id: string;
      name: string;
      duration: number;
      category: string;
    }>;
    cooldown: Array<{
      id: string;
      name: string;
      duration: number;
      category: string;
    }>;
    totalDuration: number;
  };
  weeklyGoals: Array<{
    id: string;
    description: string;
    metric: string;
    currentValue: number;
    targetValue: number;
    deadline: string;
  }>;
  checkpoints: Array<{
    day: number;
    focus: string;
    exercises: string[];
    expectedProgress: string;
  }>;
}

interface CoachingReport {
  id: string;
  generatedAt: string;
  playerContext: {
    rank: string;
    targetRank: string;
    role: string;
    map: string;
    matchResult: 'win' | 'loss' | 'tie';
  };
  executiveSummary: {
    overallScore: number;
    mainStrength: string;
    mainWeakness: string;
    oneThingToFocus: string;
  };
  insights: Insight[];
  rankComparison: RankComparison;
  actionPlan: ActionPlan;
}

interface ApiResponse {
  success: boolean;
  report: CoachingReport;
  meta: {
    demoId: string;
    map: string;
    matchDate: string;
    currentRank: string;
    targetRank: string;
    playerRole: string;
  };
}

type TabType = 'insights' | 'comparison' | 'plan';

export function CoachingReportClient({ demoId }: CoachingReportClientProps) {
  const [report, setReport] = useState<CoachingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('insights');

  const fetchCoachingReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/coaching/actionable/${demoId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du chargement du rapport');
      }

      const apiResponse: ApiResponse = await response.json();

      if (!apiResponse.success || !apiResponse.report) {
        throw new Error('Réponse invalide du serveur');
      }

      setReport(apiResponse.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachingReport();
  }, [demoId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-cs2-accent animate-spin mb-4" />
        <p className="text-gray-400">Génération du rapport de coaching...</p>
        <p className="text-sm text-gray-500 mt-2">
          Analyse des données et création des recommandations personnalisées
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-4 bg-red-500/10 rounded-full mb-4">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Erreur</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchCoachingReport} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  // Valeurs par défaut pour éviter les erreurs
  const insights = report.insights || [];
  const rankComparison = report.rankComparison;
  const actionPlan = report.actionPlan;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'insights', label: 'Insights', count: insights.length },
    { id: 'comparison', label: 'Comparaison Rank' },
    { id: 'plan', label: 'Plan d\'action' },
  ];

  // Trier les insights par sévérité
  const sortedInsights = [...insights].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Compter les insights par sévérité
  const insightCounts = {
    critical: insights.filter((i) => i.severity === 'critical').length,
    high: insights.filter((i) => i.severity === 'high').length,
    medium: insights.filter((i) => i.severity === 'medium').length,
    low: insights.filter((i) => i.severity === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {report.executiveSummary && (
        <div className="p-4 bg-gradient-to-r from-cs2-accent/10 to-orange-500/5 rounded-lg border border-cs2-accent/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-white font-semibold">Résumé</h3>
              <p className="text-cs2-accent text-sm">{report.executiveSummary.oneThingToFocus}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{report.executiveSummary.overallScore}</div>
              <div className="text-xs text-gray-400">Score global</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-400">+ Force:</span>{' '}
              <span className="text-gray-300">{report.executiveSummary.mainStrength}</span>
            </div>
            <div>
              <span className="text-red-400">- Faiblesse:</span>{' '}
              <span className="text-gray-300">{report.executiveSummary.mainWeakness}</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Insights critiques"
          value={insightCounts.critical}
          color="text-red-400"
          bgColor="bg-red-500/10"
        />
        <SummaryCard
          label="Insights importants"
          value={insightCounts.high}
          color="text-orange-400"
          bgColor="bg-orange-500/10"
        />
        <SummaryCard
          label="Readiness Score"
          value={rankComparison?.overallGap?.score ? `${rankComparison.overallGap.score.toFixed(0)}%` : 'N/A'}
          color="text-cs2-accent"
          bgColor="bg-cs2-accent/10"
        />
        <SummaryCard
          label="Durée entraînement"
          value={actionPlan?.dailyRoutine?.totalDuration ? `${actionPlan.dailyRoutine.totalDuration} min` : 'N/A'}
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-800 text-white border-b-2 border-cs2-accent'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-700/50">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {sortedInsights.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Aucun insight disponible pour cette démo.</p>
              </div>
            ) : (
              <>
                {/* Filter par sévérité si beaucoup d'insights */}
                {sortedInsights.length > 5 && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <span>Affichage par priorité:</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                      {insightCounts.critical} critiques
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400">
                      {insightCounts.high} importants
                    </span>
                    <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                      {insightCounts.medium} moyens
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {insightCounts.low} faibles
                    </span>
                  </div>
                )}

                {sortedInsights.map((insight, index) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    defaultExpanded={index === 0}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'comparison' && rankComparison && (
          <RankComparisonCard comparison={rankComparison} />
        )}

        {activeTab === 'plan' && actionPlan && (
          <ActionPlanCard plan={actionPlan} />
        )}
      </div>

      {/* Footer with generation info */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700/50">
        Rapport généré le {new Date(report.generatedAt).toLocaleString('fr-FR')}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}

function SummaryCard({ label, value, color, bgColor }: SummaryCardProps) {
  return (
    <div className={`p-4 rounded-lg ${bgColor} border border-gray-700/30`}>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
