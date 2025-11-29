import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/config';
import { insightGenerator } from '@/lib/coaching/actionable';
import {
  AnalysisResult,
  AimAnalysis,
  PositioningAnalysis,
  UtilityAnalysis,
  EconomyAnalysis,
  TimingAnalysis,
  DecisionAnalysis,
} from '@/lib/analysis/types';
import { CS2Rank, PlayerRole, Prisma } from '@prisma/client';

/**
 * GET /api/coaching/actionable/[demoId]
 *
 * Génère un rapport de coaching actionnable pour une démo analysée.
 * Inclut:
 * - Insights actionnables avec contexte du match
 * - Comparaison avec le rank cible
 * - Plan d'action personnalisé
 * - Exercices recommandés
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ demoId: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { demoId } = await params;

    // Récupérer la démo avec son analyse
    const demo = await prisma.demo.findUnique({
      where: { id: demoId },
      include: {
        analysis: true,
        playerStats: {
          where: { isMainPlayer: true },
        },
        user: {
          select: {
            id: true,
            role: true,
            rank: true,
            targetRank: true,
          },
        },
      },
    });

    if (!demo) {
      return NextResponse.json({ error: 'Démo non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est propriétaire de la démo
    if (demo.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Vérifier que l'analyse existe
    if (!demo.analysis) {
      return NextResponse.json(
        { error: 'Analyse non disponible. La démo doit d\'abord être analysée.' },
        { status: 400 }
      );
    }

    // Construire l'AnalysisResult à partir des données
    const mainPlayerStats = demo.playerStats[0];
    if (!mainPlayerStats) {
      return NextResponse.json(
        { error: 'Stats du joueur non trouvées' },
        { status: 400 }
      );
    }

    const analysisResult: AnalysisResult = {
      playerStats: {
        kills: mainPlayerStats.kills,
        deaths: mainPlayerStats.deaths,
        assists: mainPlayerStats.assists,
        headshots: mainPlayerStats.headshots,
        hsPercentage: mainPlayerStats.headshotPercentage,
        adr: mainPlayerStats.adr,
        kast: mainPlayerStats.kast,
        rating: mainPlayerStats.rating,
      },
      scores: {
        overall: demo.analysis.overallScore,
        aim: demo.analysis.aimScore,
        positioning: demo.analysis.positioningScore,
        utility: demo.analysis.utilityScore,
        economy: demo.analysis.economyScore,
        timing: demo.analysis.timingScore,
        decision: demo.analysis.decisionScore,
      },
      analyses: {
        aim: demo.analysis.aimAnalysis as unknown as AimAnalysis,
        positioning: demo.analysis.positioningAnalysis as unknown as PositioningAnalysis,
        utility: demo.analysis.utilityAnalysis as unknown as UtilityAnalysis,
        economy: demo.analysis.economyAnalysis as unknown as EconomyAnalysis,
        timing: demo.analysis.timingAnalysis as unknown as TimingAnalysis,
        decision: demo.analysis.decisionAnalysis as unknown as DecisionAnalysis,
      },
      strengths: demo.analysis.strengths,
      weaknesses: demo.analysis.weaknesses,
    };

    // Déterminer le rank cible
    const currentRank = (demo.user.rank as CS2Rank) || 'GOLD_NOVA';
    const targetRank = (demo.user.targetRank as CS2Rank) || getNextRank(currentRank);
    const playerRole = (demo.user.role as PlayerRole) || 'RIFLER';

    // Déterminer le résultat du match
    let matchResult: 'win' | 'loss' | 'tie';
    if (demo.matchResult === 'WIN') {
      matchResult = 'win';
    } else if (demo.matchResult === 'LOSS') {
      matchResult = 'loss';
    } else {
      matchResult = 'tie';
    }

    // Générer le rapport actionnable
    const report = insightGenerator.generateReport({
      analysis: analysisResult,
      playerRole,
      currentRank,
      targetRank,
      map: demo.mapName,
      matchResult,
    });

    // Sauvegarder la session de coaching
    await prisma.coachingSession.create({
      data: {
        userId: session.user.id,
        demoId: demo.id,
        type: 'DEMO_ANALYSIS',
        report: report as object,
        overallScore: report.executiveSummary.overallScore,
        mainStrength: report.executiveSummary.mainStrength,
        mainWeakness: report.executiveSummary.mainWeakness,
        focusArea: report.executiveSummary.oneThingToFocus,
        insightsCount: report.insights.length,
        criticalCount: report.insights.filter((i) => i.severity === 'critical').length,
        playerRank: currentRank,
        targetRank,
        playerRole,
        map: demo.mapName,
      },
    });

    // Créer un snapshot de progression
    await prisma.progressSnapshot.create({
      data: {
        userId: session.user.id,
        demoId: demo.id,
        metrics: JSON.parse(JSON.stringify({
          aim: analysisResult.analyses.aim,
          positioning: analysisResult.analyses.positioning,
          utility: analysisResult.analyses.utility,
          economy: analysisResult.analyses.economy,
          timing: analysisResult.analyses.timing,
          decision: analysisResult.analyses.decision,
        })) as Prisma.InputJsonValue,
        overallScore: analysisResult.scores.overall,
        aimScore: analysisResult.scores.aim,
        positioningScore: analysisResult.scores.positioning,
        utilityScore: analysisResult.scores.utility,
        economyScore: analysisResult.scores.economy,
        timingScore: analysisResult.scores.timing,
        decisionScore: analysisResult.scores.decision,
        rank: currentRank,
        targetRank,
        map: demo.mapName,
      },
    });

    return NextResponse.json({
      success: true,
      report,
      meta: {
        demoId: demo.id,
        map: demo.mapName,
        matchDate: demo.matchDate,
        currentRank,
        targetRank,
        playerRole,
      },
    });
  } catch (error) {
    console.error('Erreur génération rapport actionnable:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}

/**
 * Retourne le rank suivant
 */
function getNextRank(currentRank: CS2Rank): CS2Rank {
  const rankOrder: CS2Rank[] = [
    'SILVER',
    'GOLD_NOVA',
    'MASTER_GUARDIAN',
    'LEGENDARY_EAGLE',
    'SUPREME',
    'GLOBAL',
  ];

  const currentIndex = rankOrder.indexOf(currentRank);
  if (currentIndex === -1 || currentIndex === rankOrder.length - 1) {
    return currentRank;
  }

  return rankOrder[currentIndex + 1];
}