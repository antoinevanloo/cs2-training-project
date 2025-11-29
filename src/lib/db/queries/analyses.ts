import prisma from '../prisma';

export async function getAnalysisByDemoId(demoId: string) {
  return prisma.analysis.findUnique({
    where: { demoId },
    include: {
      demo: {
        select: {
          mapName: true,
          matchDate: true,
          matchResult: true,
          scoreTeam1: true,
          scoreTeam2: true,
        },
      },
    },
  });
}

export async function getAnalysesByUserId(userId: string, limit = 10) {
  return prisma.analysis.findMany({
    where: {
      demo: {
        userId,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    include: {
      demo: {
        select: {
          id: true,
          mapName: true,
          matchDate: true,
          matchResult: true,
        },
      },
    },
  });
}

export async function createAnalysis(data: {
  demoId: string;
  overallScore: number;
  aimScore: number;
  positioningScore: number;
  utilityScore: number;
  economyScore: number;
  timingScore: number;
  decisionScore: number;
  aimAnalysis: any;
  positioningAnalysis: any;
  utilityAnalysis: any;
  economyAnalysis: any;
  timingAnalysis: any;
  decisionAnalysis: any;
  strengths: string[];
  weaknesses: string[];
  coachingReport: any;
}) {
  return prisma.analysis.create({
    data,
  });
}

export async function getAverageScores(userId: string) {
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
    },
  });

  if (analyses.length === 0) {
    return null;
  }

  const sum = analyses.reduce(
    (acc, a) => ({
      overall: acc.overall + a.overallScore,
      aim: acc.aim + a.aimScore,
      positioning: acc.positioning + a.positioningScore,
      utility: acc.utility + a.utilityScore,
      economy: acc.economy + a.economyScore,
      timing: acc.timing + a.timingScore,
      decision: acc.decision + a.decisionScore,
    }),
    {
      overall: 0,
      aim: 0,
      positioning: 0,
      utility: 0,
      economy: 0,
      timing: 0,
      decision: 0,
    }
  );

  const count = analyses.length;

  return {
    overall: Math.round(sum.overall / count),
    aim: Math.round(sum.aim / count),
    positioning: Math.round(sum.positioning / count),
    utility: Math.round(sum.utility / count),
    economy: Math.round(sum.economy / count),
    timing: Math.round(sum.timing / count),
    decision: Math.round(sum.decision / count),
    totalAnalyses: count,
  };
}

export async function getScoreProgression(userId: string, limit = 20) {
  const analyses = await prisma.analysis.findMany({
    where: {
      demo: {
        userId,
        status: 'COMPLETED',
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit,
    select: {
      createdAt: true,
      overallScore: true,
      aimScore: true,
      positioningScore: true,
      demo: {
        select: {
          mapName: true,
          matchDate: true,
        },
      },
    },
  });

  return analyses.map((a) => ({
    date: a.demo.matchDate.toISOString().split('T')[0],
    map: a.demo.mapName,
    overall: a.overallScore,
    aim: a.aimScore,
    positioning: a.positioningScore,
  }));
}

export async function getWeaknessesFrequency(userId: string) {
  const analyses = await prisma.analysis.findMany({
    where: {
      demo: {
        userId,
      },
    },
    select: {
      weaknesses: true,
    },
  });

  const frequency: Record<string, number> = {};

  for (const analysis of analyses) {
    for (const weakness of analysis.weaknesses) {
      frequency[weakness] = (frequency[weakness] || 0) + 1;
    }
  }

  return Object.entries(frequency)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
