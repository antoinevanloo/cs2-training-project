import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { CoachingClient } from './CoachingClient';

export default async function CoachingPage() {
  const user = await requireAuth();

  // Récupérer les données pour le coaching
  const [demos, progressSnapshots] = await Promise.all([
    // Dernières démos avec analyses
    prisma.demo.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        analysis: { isNot: null },
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
            strengths: true,
            weaknesses: true,
          },
        },
        playerStats: {
          where: { isMainPlayer: true },
          select: {
            kills: true,
            deaths: true,
            rating: true,
            adr: true,
          },
        },
      },
      orderBy: { matchDate: 'desc' },
      take: 30, // Derniers 30 matchs pour les stats
    }),

    // Snapshots de progression
    prisma.progressSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  // Transformer les données pour le client
  const demosData = demos.map((demo) => ({
    id: demo.id,
    mapName: demo.mapName,
    matchDate: demo.matchDate.toISOString(),
    matchResult: demo.matchResult,
    scoreTeam1: demo.scoreTeam1,
    scoreTeam2: demo.scoreTeam2,
    analysis: demo.analysis
      ? {
          overallScore: demo.analysis.overallScore,
          aimScore: demo.analysis.aimScore,
          positioningScore: demo.analysis.positioningScore,
          utilityScore: demo.analysis.utilityScore,
          economyScore: demo.analysis.economyScore,
          timingScore: demo.analysis.timingScore,
          decisionScore: demo.analysis.decisionScore,
          strengths: demo.analysis.strengths || [],
          weaknesses: demo.analysis.weaknesses || [],
        }
      : null,
    playerStats: demo.playerStats[0] || null,
  }));

  // Calculer les stats par map
  const mapStats = calculateMapStats(demosData);

  // Calculer les faiblesses récurrentes
  const recurringWeaknesses = calculateRecurringWeaknesses(demosData);

  // Calculer les tendances
  const trends = calculateTrends(demosData);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-white">Mon Coaching</h1>
        <p className="text-gray-400 mt-1">
          Suivi de progression et recommandations personnalisées
        </p>
      </div>

      <CoachingClient
        demos={demosData}
        mapStats={mapStats}
        recurringWeaknesses={recurringWeaknesses}
        trends={trends}
      />
    </div>
  );
}

// Helper: Calculer les stats par map
function calculateMapStats(demos: Array<{ mapName: string; matchResult: string; analysis: { overallScore: number; strengths: string[]; weaknesses: string[] } | null }>) {
  const mapData: Record<string, {
    gamesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
    totalScore: number;
    strengths: string[];
    weaknesses: string[];
  }> = {};

  demos.forEach((demo) => {
    if (!demo.analysis) return;

    const map = demo.mapName.replace('de_', '');
    if (!mapData[map]) {
      mapData[map] = {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        totalScore: 0,
        strengths: [],
        weaknesses: [],
      };
    }

    mapData[map].gamesPlayed++;
    mapData[map].totalScore += demo.analysis.overallScore;
    mapData[map].strengths.push(...demo.analysis.strengths);
    mapData[map].weaknesses.push(...demo.analysis.weaknesses);

    if (demo.matchResult === 'WIN') mapData[map].wins++;
    else if (demo.matchResult === 'LOSS') mapData[map].losses++;
    else mapData[map].ties++;
  });

  return Object.entries(mapData).map(([map, data]) => ({
    map,
    gamesPlayed: data.gamesPlayed,
    winRate: data.gamesPlayed > 0 ? (data.wins / data.gamesPlayed) * 100 : 0,
    avgScore: data.gamesPlayed > 0 ? data.totalScore / data.gamesPlayed : 0,
    wins: data.wins,
    losses: data.losses,
    ties: data.ties,
    // Compter les occurrences de forces/faiblesses
    topStrengths: getMostFrequent(data.strengths, 3),
    topWeaknesses: getMostFrequent(data.weaknesses, 3),
  })).sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}

// Helper: Calculer les faiblesses récurrentes
function calculateRecurringWeaknesses(demos: Array<{ analysis: { weaknesses: string[] } | null }>) {
  const weaknessCount: Record<string, number> = {};

  demos.forEach((demo) => {
    if (!demo.analysis) return;
    demo.analysis.weaknesses.forEach((w) => {
      weaknessCount[w] = (weaknessCount[w] || 0) + 1;
    });
  });

  return Object.entries(weaknessCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: demos.length > 0 ? (count / demos.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Helper: Calculer les tendances
function calculateTrends(demos: Array<{
  matchDate: string;
  analysis: {
    overallScore: number;
    aimScore: number;
    positioningScore: number;
    utilityScore: number;
    economyScore: number;
    timingScore: number;
    decisionScore: number;
  } | null;
}>) {
  const sorted = [...demos].sort((a, b) =>
    new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  );

  // Prendre les 10 derniers matchs avec analyse
  const recent = sorted.filter((d) => d.analysis).slice(-10);
  const older = sorted.filter((d) => d.analysis).slice(-20, -10);

  if (recent.length < 3) {
    return null; // Pas assez de données
  }

  const avgRecent = calculateAverage(recent);
  const avgOlder = older.length >= 3 ? calculateAverage(older) : null;

  const categories = ['overall', 'aim', 'positioning', 'utility', 'economy', 'timing', 'decision'] as const;

  return categories.map((cat) => {
    const currentAvg = avgRecent[cat];
    const previousAvg = avgOlder ? avgOlder[cat] : null;
    const change = previousAvg ? currentAvg - previousAvg : 0;

    return {
      category: cat,
      current: currentAvg,
      previous: previousAvg,
      change,
      trend: (change > 2 ? 'up' : change < -2 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    };
  });
}

function calculateAverage(demos: Array<{ analysis: { overallScore: number; aimScore: number; positioningScore: number; utilityScore: number; economyScore: number; timingScore: number; decisionScore: number } | null }>) {
  const valid = demos.filter((d) => d.analysis);
  if (valid.length === 0) {
    return { overall: 0, aim: 0, positioning: 0, utility: 0, economy: 0, timing: 0, decision: 0 };
  }

  return {
    overall: valid.reduce((sum, d) => sum + (d.analysis?.overallScore || 0), 0) / valid.length,
    aim: valid.reduce((sum, d) => sum + (d.analysis?.aimScore || 0), 0) / valid.length,
    positioning: valid.reduce((sum, d) => sum + (d.analysis?.positioningScore || 0), 0) / valid.length,
    utility: valid.reduce((sum, d) => sum + (d.analysis?.utilityScore || 0), 0) / valid.length,
    economy: valid.reduce((sum, d) => sum + (d.analysis?.economyScore || 0), 0) / valid.length,
    timing: valid.reduce((sum, d) => sum + (d.analysis?.timingScore || 0), 0) / valid.length,
    decision: valid.reduce((sum, d) => sum + (d.analysis?.decisionScore || 0), 0) / valid.length,
  };
}

function getMostFrequent(items: string[], limit: number): string[] {
  const count: Record<string, number> = {};
  items.forEach((item) => {
    count[item] = (count[item] || 0) + 1;
  });

  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item]) => item);
}
