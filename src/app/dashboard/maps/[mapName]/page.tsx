import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { MapDetailClient } from './MapDetailClient';

interface Props {
  params: { mapName: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `${params.mapName.charAt(0).toUpperCase() + params.mapName.slice(1)} | Vue par Map | CS2 Coach`,
  };
}

export default async function MapDetailPage({ params }: Props) {
  const user = await requireAuth();
  const mapName = params.mapName.toLowerCase();

  // Récupérer toutes les données pour cette map
  const mapData = await getMapData(user.id, mapName);

  if (!mapData || mapData.demos.length === 0) {
    notFound();
  }

  return (
    <MapDetailClient
      mapName={mapName}
      data={mapData}
    />
  );
}

// Helper: Récupérer toutes les données d'une map
async function getMapData(userId: string, mapName: string) {
  // Chercher avec et sans préfixe de_
  const demos = await prisma.demo.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      OR: [
        { mapName: mapName },
        { mapName: `de_${mapName}` },
      ],
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
          aimAnalysis: true,
          positioningAnalysis: true,
          strengths: true,
          weaknesses: true,
        },
      },
      playerStats: {
        where: { isMainPlayer: true },
        select: {
          kills: true,
          deaths: true,
          assists: true,
          rating: true,
          adr: true,
          headshotPercentage: true,
          kast: true,
        },
      },
    },
    orderBy: { matchDate: 'desc' },
  });

  if (demos.length === 0) {
    return null;
  }

  // Calculer les stats agrégées
  const validDemos = demos.filter(d => d.playerStats[0]);
  const analyzedDemos = demos.filter(d => d.analysis);

  // Stats de performance
  const stats = {
    gamesPlayed: demos.length,
    wins: demos.filter(d => d.matchResult === 'WIN').length,
    losses: demos.filter(d => d.matchResult === 'LOSS').length,
    ties: demos.filter(d => d.matchResult === 'TIE').length,
    winRate: 0,
    avgRating: 0,
    avgAdr: 0,
    avgHsPercent: 0,
    avgKast: 0,
    totalKills: 0,
    totalDeaths: 0,
  };

  if (validDemos.length > 0) {
    stats.winRate = (stats.wins / stats.gamesPlayed) * 100;
    stats.avgRating = validDemos.reduce((sum, d) => sum + (d.playerStats[0]?.rating || 0), 0) / validDemos.length;
    stats.avgAdr = validDemos.reduce((sum, d) => sum + (d.playerStats[0]?.adr || 0), 0) / validDemos.length;
    stats.avgHsPercent = validDemos.reduce((sum, d) => sum + (d.playerStats[0]?.headshotPercentage || 0), 0) / validDemos.length;
    stats.avgKast = validDemos.reduce((sum, d) => sum + (d.playerStats[0]?.kast || 0), 0) / validDemos.length;
    stats.totalKills = validDemos.reduce((sum, d) => sum + (d.playerStats[0]?.kills || 0), 0);
    stats.totalDeaths = validDemos.reduce((sum, d) => sum + (d.playerStats[0]?.deaths || 0), 0);
  }

  // Scores d'analyse agrégés
  const analysisScores = analyzedDemos.length > 0 ? {
    avgOverall: analyzedDemos.reduce((sum, d) => sum + (d.analysis?.overallScore || 0), 0) / analyzedDemos.length,
    avgAim: analyzedDemos.reduce((sum, d) => sum + (d.analysis?.aimScore || 0), 0) / analyzedDemos.length,
    avgPositioning: analyzedDemos.reduce((sum, d) => sum + (d.analysis?.positioningScore || 0), 0) / analyzedDemos.length,
    avgUtility: analyzedDemos.reduce((sum, d) => sum + (d.analysis?.utilityScore || 0), 0) / analyzedDemos.length,
    avgEconomy: analyzedDemos.reduce((sum, d) => sum + (d.analysis?.economyScore || 0), 0) / analyzedDemos.length,
    avgTiming: analyzedDemos.reduce((sum, d) => sum + (d.analysis?.timingScore || 0), 0) / analyzedDemos.length,
    avgDecision: analyzedDemos.reduce((sum, d) => sum + (d.analysis?.decisionScore || 0), 0) / analyzedDemos.length,
  } : null;

  // Faiblesses récurrentes sur cette map
  const weaknessCount: Record<string, number> = {};
  analyzedDemos.forEach(demo => {
    (demo.analysis?.weaknesses || []).forEach(w => {
      weaknessCount[w] = (weaknessCount[w] || 0) + 1;
    });
  });

  const recurringWeaknesses = Object.entries(weaknessCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / analyzedDemos.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Forces récurrentes
  const strengthCount: Record<string, number> = {};
  analyzedDemos.forEach(demo => {
    (demo.analysis?.strengths || []).forEach(s => {
      strengthCount[s] = (strengthCount[s] || 0) + 1;
    });
  });

  const recurringStrengths = Object.entries(strengthCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / analyzedDemos.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Historique pour le graphique
  const ratingHistory = validDemos
    .map(d => ({
      date: d.matchDate.toISOString().split('T')[0],
      rating: d.playerStats[0]?.rating || 0,
      score: d.analysis?.overallScore || 0,
    }))
    .reverse();

  // Liste des démos pour affichage
  const demosList = demos.map(d => ({
    id: d.id,
    matchDate: d.matchDate.toISOString(),
    matchResult: d.matchResult,
    scoreTeam1: d.scoreTeam1,
    scoreTeam2: d.scoreTeam2,
    rating: d.playerStats[0]?.rating || 0,
    analysisScore: d.analysis?.overallScore || null,
  }));

  // Récupérer les stats globales de l'utilisateur pour comparaison
  const globalStats = await prisma.userStats.findUnique({
    where: { userId },
    select: {
      avgRating: true,
      avgAdr: true,
      avgHsPercent: true,
      winRate: true,
    },
  });

  return {
    demos: demosList,
    stats,
    analysisScores,
    recurringWeaknesses,
    recurringStrengths,
    ratingHistory,
    globalStats,
  };
}