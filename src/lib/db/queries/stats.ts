import prisma from '../prisma';
import { Prisma } from '@prisma/client';
import { MapStats, RatingHistoryEntry } from '../types';

export async function getUserStats(userId: string) {
  return prisma.userStats.findUnique({
    where: { userId },
  });
}

export async function updateUserStats(userId: string) {
  // Récupérer toutes les démos complétées
  const demos = await prisma.demo.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    include: {
      playerStats: {
        where: { isMainPlayer: true },
      },
      analysis: true,
    },
  });

  if (demos.length === 0) {
    return prisma.userStats.upsert({
      where: { userId },
      create: { userId },
      update: { lastUpdated: new Date() },
    });
  }

  // Calculer les statistiques
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalRounds = 0;
  let totalRating = 0;
  let totalAdr = 0;
  let totalKast = 0;
  let totalHsPercent = 0;
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let totalAimScore = 0;
  let totalPositioningScore = 0;
  let totalUtilityScore = 0;
  let totalEconomyScore = 0;
  let analysisCount = 0;

  const mapStatsMap: Record<string, { played: number; wins: number; totalRating: number }> = {};
  const ratingHistory: RatingHistoryEntry[] = [];

  for (const demo of demos) {
    const mainStats = demo.playerStats[0];
    if (!mainStats) continue;

    totalKills += mainStats.kills;
    totalDeaths += mainStats.deaths;
    totalAssists += mainStats.assists;
    totalRating += mainStats.rating;
    totalAdr += mainStats.adr;
    totalKast += mainStats.kast;
    totalHsPercent += mainStats.headshotPercentage;

    // Compter les rounds
    const roundsInDemo = await prisma.round.count({
      where: { demoId: demo.id },
    });
    totalRounds += roundsInDemo;

    // Win/Loss/Tie
    if (demo.matchResult === 'WIN') wins++;
    else if (demo.matchResult === 'LOSS') losses++;
    else ties++;

    // Stats par map
    if (!mapStatsMap[demo.mapName]) {
      mapStatsMap[demo.mapName] = { played: 0, wins: 0, totalRating: 0 };
    }
    mapStatsMap[demo.mapName].played++;
    if (demo.matchResult === 'WIN') mapStatsMap[demo.mapName].wins++;
    mapStatsMap[demo.mapName].totalRating += mainStats.rating;

    // Historique rating
    ratingHistory.push({
      date: demo.matchDate.toISOString().split('T')[0],
      rating: mainStats.rating,
    });

    // Scores d'analyse
    if (demo.analysis) {
      totalAimScore += demo.analysis.aimScore;
      totalPositioningScore += demo.analysis.positioningScore;
      totalUtilityScore += demo.analysis.utilityScore;
      totalEconomyScore += demo.analysis.economyScore;
      analysisCount++;
    }
  }

  const demoCount = demos.length;
  const totalMatches = wins + losses + ties;

  // Convertir mapStats
  const mapStats: MapStats = {};
  for (const [mapName, stats] of Object.entries(mapStatsMap)) {
    mapStats[mapName] = {
      played: stats.played,
      winRate: stats.played > 0 ? stats.wins / stats.played : 0,
      avgRating: stats.played > 0 ? stats.totalRating / stats.played : 0,
    };
  }

  // Trier l'historique par date
  ratingHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalDemos: demoCount,
      totalMatches,
      totalRounds,
      totalKills,
      totalDeaths,
      totalAssists,
      avgRating: demoCount > 0 ? totalRating / demoCount : 0,
      avgAdr: demoCount > 0 ? totalAdr / demoCount : 0,
      avgKast: demoCount > 0 ? totalKast / demoCount : 0,
      avgHsPercent: demoCount > 0 ? totalHsPercent / demoCount : 0,
      wins,
      losses,
      ties,
      winRate: totalMatches > 0 ? wins / totalMatches : 0,
      mapStats,
      ratingHistory: ratingHistory as unknown as Prisma.InputJsonValue,
      avgAimScore: analysisCount > 0 ? totalAimScore / analysisCount : 0,
      avgPositioningScore: analysisCount > 0 ? totalPositioningScore / analysisCount : 0,
      avgUtilityScore: analysisCount > 0 ? totalUtilityScore / analysisCount : 0,
      avgEconomyScore: analysisCount > 0 ? totalEconomyScore / analysisCount : 0,
      lastUpdated: new Date(),
    },
    update: {
      totalDemos: demoCount,
      totalMatches,
      totalRounds,
      totalKills,
      totalDeaths,
      totalAssists,
      avgRating: demoCount > 0 ? totalRating / demoCount : 0,
      avgAdr: demoCount > 0 ? totalAdr / demoCount : 0,
      avgKast: demoCount > 0 ? totalKast / demoCount : 0,
      avgHsPercent: demoCount > 0 ? totalHsPercent / demoCount : 0,
      wins,
      losses,
      ties,
      winRate: totalMatches > 0 ? wins / totalMatches : 0,
      mapStats,
      ratingHistory: ratingHistory as unknown as Prisma.InputJsonValue,
      avgAimScore: analysisCount > 0 ? totalAimScore / analysisCount : 0,
      avgPositioningScore: analysisCount > 0 ? totalPositioningScore / analysisCount : 0,
      avgUtilityScore: analysisCount > 0 ? totalUtilityScore / analysisCount : 0,
      avgEconomyScore: analysisCount > 0 ? totalEconomyScore / analysisCount : 0,
      lastUpdated: new Date(),
    },
  });
}

export async function getMapPerformance(userId: string) {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
    select: { mapStats: true },
  });

  if (!stats || !stats.mapStats) {
    return [];
  }

  const mapStats = stats.mapStats as MapStats;

  return Object.entries(mapStats)
    .map(([mapName, data]) => ({
      mapName,
      ...data,
    }))
    .sort((a, b) => b.played - a.played);
}

export async function getRatingProgression(userId: string) {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
    select: { ratingHistory: true },
  });

  if (!stats || !stats.ratingHistory) {
    return [];
  }

  return stats.ratingHistory as unknown as RatingHistoryEntry[];
}
