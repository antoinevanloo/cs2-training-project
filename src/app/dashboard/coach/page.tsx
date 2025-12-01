import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { CoachChatClient } from './CoachChatClient';
import type { AnalysisCategory } from '@/lib/preferences/types';
import { getServerEnabledAnalysisFeatures } from '@/lib/features/server';

// Mapping feature ID -> category
const FEATURE_TO_CATEGORY: Record<string, AnalysisCategory> = {
  'analysis.aim': 'aim',
  'analysis.positioning': 'positioning',
  'analysis.utility': 'utility',
  'analysis.economy': 'economy',
  'analysis.timing': 'timing',
  'analysis.decision': 'decision',
  'analysis.movement': 'movement',
  'analysis.awareness': 'awareness',
  'analysis.teamplay': 'teamplay',
};

export default async function CoachPage() {
  const user = await requireAuth();

  // Charger les features activées pour l'utilisateur
  const enabledAnalyzers = await getServerEnabledAnalysisFeatures(user.id);
  const enabledCategories = enabledAnalyzers
    .map(f => FEATURE_TO_CATEGORY[f])
    .filter((c): c is AnalysisCategory => c !== undefined);

  // Fetch user stats
  const userStats = await prisma.userStats.findUnique({
    where: { userId: user.id },
  });

  // Count recent demos
  const recentDemosCount = await prisma.demo.count({
    where: {
      userId: user.id,
      status: 'COMPLETED',
    },
  });

  // Find weakest and strongest categories from recent analyses
  const recentAnalyses = await prisma.analysis.findMany({
    where: {
      demo: {
        userId: user.id,
        status: 'COMPLETED',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
    select: {
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

  // Calculate average scores per category
  let weakestCategory: AnalysisCategory | undefined;
  let strongestCategory: AnalysisCategory | undefined;

  if (recentAnalyses.length > 0) {
    const categoryScores: Record<AnalysisCategory, number[]> = {
      aim: [],
      positioning: [],
      utility: [],
      economy: [],
      timing: [],
      decision: [],
      movement: [],
      awareness: [],
      teamplay: [],
    };

    recentAnalyses.forEach((analysis) => {
      if (analysis.aimScore) categoryScores.aim.push(analysis.aimScore);
      if (analysis.positioningScore) categoryScores.positioning.push(analysis.positioningScore);
      if (analysis.utilityScore) categoryScores.utility.push(analysis.utilityScore);
      if (analysis.economyScore) categoryScores.economy.push(analysis.economyScore);
      if (analysis.timingScore) categoryScores.timing.push(analysis.timingScore);
      if (analysis.decisionScore) categoryScores.decision.push(analysis.decisionScore);
      if (analysis.movementScore) categoryScores.movement.push(analysis.movementScore);
      if (analysis.awarenessScore) categoryScores.awareness.push(analysis.awarenessScore);
      if (analysis.teamplayScore) categoryScores.teamplay.push(analysis.teamplayScore);
    });

    // Calculate averages
    const avgScores: Partial<Record<AnalysisCategory, number>> = {};
    (Object.keys(categoryScores) as AnalysisCategory[]).forEach((cat) => {
      const scores = categoryScores[cat];
      if (scores.length > 0) {
        avgScores[cat] = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    });

    // Find min and max (only among enabled categories)
    let minScore = Infinity;
    let maxScore = -Infinity;

    (Object.entries(avgScores) as [AnalysisCategory, number][]).forEach(([cat, score]) => {
      // Ignorer les catégories désactivées
      if (!enabledCategories.includes(cat)) return;

      if (score < minScore) {
        minScore = score;
        weakestCategory = cat;
      }
      if (score > maxScore) {
        maxScore = score;
        strongestCategory = cat;
      }
    });
  }

  // Determine trend (comparing last 5 vs previous 5 demos)
  let recentTrend: 'up' | 'down' | 'stable' | undefined;
  if (recentAnalyses.length >= 5) {
    const recent5 = recentAnalyses.slice(0, 5);
    const older5 = recentAnalyses.slice(5, 10);

    if (older5.length > 0) {
      const avgRecent =
        recent5.reduce((sum, a) => sum + (a.aimScore || 0), 0) / recent5.length;
      const avgOlder =
        older5.reduce((sum, a) => sum + (a.aimScore || 0), 0) / older5.length;

      if (avgRecent > avgOlder * 1.05) recentTrend = 'up';
      else if (avgRecent < avgOlder * 0.95) recentTrend = 'down';
      else recentTrend = 'stable';
    }
  }

  return (
    <CoachChatClient
      userStats={
        userStats
          ? {
              avgRating: userStats.avgRating,
              avgAdr: userStats.avgAdr,
              avgKast: userStats.avgKast,
              avgHsPercent: userStats.avgHsPercent,
              weakestCategory,
              strongestCategory,
              recentTrend,
            }
          : null
      }
      recentDemosCount={recentDemosCount}
      userName={user.name || 'Coach'}
      enabledCategories={enabledCategories}
    />
  );
}
