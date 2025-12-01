import { requireAuth } from '@/lib/auth/utils';
import { getUserStats, getRatingProgression } from '@/lib/db/queries/stats';
import { getRecentDemos } from '@/lib/db/queries/demos';
import { prisma } from '@/lib/db/prisma';
import { OverviewClient } from './OverviewClient';
import { getServerEnabledAnalysisFeatures } from '@/lib/features/server';
import { DEFAULT_CATEGORY_WEIGHTS, type CategoryWeights } from '@/lib/preferences';

export const metadata = {
  title: 'Vue d\'ensemble | CS2 Coach',
};

export default async function OverviewPage() {
  const user = await requireAuth();

  // Charger les features activées et les préférences en parallèle
  const [stats, recentDemos, ratingHistory, analysisStats, enabledAnalyzers, userPreferences] = await Promise.all([
    getUserStats(user.id),
    getRecentDemos(user.id, 5),
    getRatingProgression(user.id),
    // Récupérer les données d'analyse agrégées (9 catégories)
    getAnalysisStats(user.id),
    // Récupérer les analyseurs activés pour l'utilisateur
    getServerEnabledAnalysisFeatures(user.id),
    // Récupérer les préférences utilisateur pour les poids et priorités
    prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { categoryWeights: true, priorityCategories: true },
    }),
  ]);

  // Récupérer les poids des catégories (défaut ou personnalisés)
  // Le type JSON de Prisma nécessite une conversion explicite
  const categoryWeights: CategoryWeights = userPreferences?.categoryWeights
    ? (userPreferences.categoryWeights as unknown as CategoryWeights)
    : DEFAULT_CATEGORY_WEIGHTS;

  // Récupérer les catégories prioritaires
  const priorityCategories = (userPreferences?.priorityCategories as string[] | null) ?? [];

  // Calculer les faiblesses récurrentes
  const recurringWeaknesses = await getRecurringWeaknesses(user.id);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header avec badge de granularité */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Vue d&apos;ensemble</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              Global
            </span>
          </div>
          <p className="text-gray-400 mt-1">
            Statistiques agrégées sur {stats?.totalDemos || 0} parties analysées
          </p>
        </div>
      </div>

      <OverviewClient
        stats={stats}
        recentDemos={recentDemos.map((d) => ({
          ...d,
          matchDate: d.matchDate.toISOString(),
        }))}
        ratingHistory={ratingHistory}
        analysisStats={analysisStats}
        recurringWeaknesses={recurringWeaknesses}
        userName={user.name || 'Joueur'}
        enabledAnalyzers={enabledAnalyzers}
        categoryWeights={categoryWeights}
        priorityCategories={priorityCategories}
      />
    </div>
  );
}

// Helper: Récupérer les stats d'analyse agrégées (9 catégories v2)
async function getAnalysisStats(userId: string) {
  const analyses = await prisma.analysis.findMany({
    where: {
      demo: {
        userId,
        status: 'COMPLETED',
      },
    },
    select: {
      overallScore: true,
      aimScore: true,
      positioningScore: true,
      utilityScore: true,
      economyScore: true,
      timingScore: true,
      decisionScore: true,
      movementScore: true,
      awarenessScore: true,
      teamplayScore: true,
    },
  });

  if (analyses.length === 0) {
    return null;
  }

  const count = analyses.length;

  // Helper pour calculer la moyenne en gérant les valeurs nulles
  const avg = (getter: (a: typeof analyses[0]) => number | null) => {
    const validValues = analyses.map(getter).filter((v): v is number => v !== null);
    return validValues.length > 0 ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
  };

  return {
    count,
    avgOverall: analyses.reduce((sum, a) => sum + a.overallScore, 0) / count,
    avgAim: analyses.reduce((sum, a) => sum + a.aimScore, 0) / count,
    avgPositioning: analyses.reduce((sum, a) => sum + a.positioningScore, 0) / count,
    avgUtility: analyses.reduce((sum, a) => sum + a.utilityScore, 0) / count,
    avgEconomy: analyses.reduce((sum, a) => sum + a.economyScore, 0) / count,
    avgTiming: analyses.reduce((sum, a) => sum + a.timingScore, 0) / count,
    avgDecision: analyses.reduce((sum, a) => sum + a.decisionScore, 0) / count,
    // Nouvelles catégories v2 (peuvent être null pour anciennes analyses)
    avgMovement: avg((a) => a.movementScore),
    avgAwareness: avg((a) => a.awarenessScore),
    avgTeamplay: avg((a) => a.teamplayScore),
  };
}

// Helper: Récupérer les faiblesses récurrentes
async function getRecurringWeaknesses(userId: string) {
  const analyses = await prisma.analysis.findMany({
    where: {
      demo: {
        userId,
        status: 'COMPLETED',
      },
    },
    select: {
      weaknesses: true,
    },
    take: 30,
    orderBy: {
      demo: {
        matchDate: 'desc',
      },
    },
  });

  const weaknessCount: Record<string, number> = {};

  analyses.forEach((analysis) => {
    (analysis.weaknesses || []).forEach((w) => {
      weaknessCount[w] = (weaknessCount[w] || 0) + 1;
    });
  });

  const totalDemos = analyses.length;

  return Object.entries(weaknessCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalDemos > 0 ? Math.round((count / totalDemos) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
