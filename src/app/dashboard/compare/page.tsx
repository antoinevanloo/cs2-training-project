import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { CompareClient } from './CompareClient';

export default async function ComparePage() {
  const user = await requireAuth();

  // Fetch user's demos for selection
  const demos = await prisma.demo.findMany({
    where: {
      userId: user.id,
      status: 'COMPLETED',
    },
    include: {
      analysis: {
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
      },
      playerStats: {
        where: { isMainPlayer: true },
        select: {
          kills: true,
          deaths: true,
          assists: true,
          adr: true,
          rating: true,
          headshotPercentage: true,
          kast: true,
        },
      },
    },
    orderBy: { matchDate: 'desc' },
    take: 50,
  });

  // Transform demos for client
  const demosData = demos.map((demo) => ({
    id: demo.id,
    mapName: demo.mapName,
    matchDate: demo.matchDate.toISOString(),
    matchResult: demo.matchResult,
    scoreTeam1: demo.scoreTeam1,
    scoreTeam2: demo.scoreTeam2,
    analysis: demo.analysis ? {
      overallScore: demo.analysis.overallScore,
      aimScore: demo.analysis.aimScore,
      positioningScore: demo.analysis.positioningScore,
      utilityScore: demo.analysis.utilityScore,
      economyScore: demo.analysis.economyScore,
      timingScore: demo.analysis.timingScore,
      decisionScore: demo.analysis.decisionScore,
      movementScore: demo.analysis.movementScore,
      awarenessScore: demo.analysis.awarenessScore,
      teamplayScore: demo.analysis.teamplayScore,
    } : null,
    playerStats: demo.playerStats[0] || null,
  }));

  // Get user stats for period comparison
  const userStats = await prisma.userStats.findUnique({
    where: { userId: user.id },
  });

  return (
    <CompareClient
      demos={demosData}
      userStats={userStats ? {
        avgRating: userStats.avgRating,
        avgAdr: userStats.avgAdr,
        avgKast: userStats.avgKast,
        avgHsPercent: userStats.avgHsPercent,
      } : null}
    />
  );
}
