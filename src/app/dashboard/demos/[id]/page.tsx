import { requireAuth } from '@/lib/auth/utils';
import { getDemoById } from '@/lib/db/queries/demos';
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { DemoDetailClient } from './DemoDetailClient';
import type { Round, RoundEvent } from '@/types/rounds';
import { buildUserFeatureContext, getGlobalFeatureConfig, applyGlobalOverrides } from '@/lib/features/server';
import { FEATURE_DEFINITIONS } from '@/lib/features/config';
import { recalculateAnalysisScores, convertUserWeightsToFeatureWeights } from '@/lib/features/score-calculator';
import { DEFAULT_CATEGORY_WEIGHTS, type CategoryWeights } from '@/lib/preferences';
import type { UserFeaturePreferences, UserFeatureOverride } from '@/lib/features/types';
import { prepareChartData, type ChartData } from '@/lib/rounds';

export default async function DemoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  const demo = await getDemoById(params.id);

  if (!demo || demo.userId !== user.id) {
    notFound();
  }

  // Recuperer les stats globales pour comparaison et le contexte de features en parallèle
  const [globalStats, featureContext, globalFeatureConfig, userPrefs] = await Promise.all([
    prisma.userStats.findUnique({
      where: { userId: user.id },
      select: {
        avgRating: true,
        avgAdr: true,
        avgHsPercent: true,
        avgKast: true,
      },
    }),
    buildUserFeatureContext(user.id),
    getGlobalFeatureConfig(),
    prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: {
        priorityCategories: true,
        categoryWeights: true,
      },
    }),
  ]);

  // Calculer les features d'analyse activées
  const enabledAnalyzers = featureContext
    ? Object.values(FEATURE_DEFINITIONS)
        .filter((f) => f.category === 'analysis')
        .filter((f) => {
          const featureWithOverrides = applyGlobalOverrides(f, globalFeatureConfig);
          // Check status
          if (featureWithOverrides.status !== 'enabled') {
            if (featureWithOverrides.status === 'beta' && !featureContext.isBetaTester && !featureContext.isAlphaTester) return false;
            if (featureWithOverrides.status === 'alpha' && !featureContext.isAlphaTester) return false;
            if (['disabled', 'deprecated', 'coming_soon'].includes(featureWithOverrides.status)) return false;
          }
          // Check tier
          const tierOrder = ['FREE', 'STARTER', 'PRO', 'TEAM', 'ENTERPRISE'];
          if (tierOrder.indexOf(featureContext.tier) < tierOrder.indexOf(featureWithOverrides.minTier)) return false;
          // Check preferences
          if (featureContext.preferences.disabledFeatures.includes(f.id)) return false;
          return true;
        })
        .map((f) => f.id)
    : ['analysis.aim', 'analysis.positioning', 'analysis.utility', 'analysis.economy', 'analysis.timing', 'analysis.decision'];

  // Recuperer les rounds avec leurs donnees completes
  const roundsData = await prisma.round.findMany({
    where: { demoId: demo.id },
    orderBy: { roundNumber: 'asc' },
  });

  // Transformer les rounds pour le client
  const rounds: Round[] = roundsData.map((round) => ({
    roundNumber: round.roundNumber,
    winnerTeam: round.winnerTeam,
    winReason: round.winReason,
    team1Money: round.team1Money,
    team2Money: round.team2Money,
    team1Equipment: round.team1Equipment,
    team2Equipment: round.team2Equipment,
    duration: round.duration,
    events: (round.events as unknown as RoundEvent[]) || [],
  }));

  // Recuperer le joueur principal
  const mainPlayer = demo.playerStats.find((p) => p.isMainPlayer);

  // Calculer les poids personnalisés pour le recalcul des scores
  const categoryWeights: CategoryWeights = userPrefs?.categoryWeights
    ? (userPrefs.categoryWeights as unknown as CategoryWeights)
    : DEFAULT_CATEGORY_WEIGHTS;
  const customWeights = convertUserWeightsToFeatureWeights(categoryWeights);

  // Transformer les données pour le client
  const demoData = {
    id: demo.id,
    mapName: demo.mapName,
    matchDate: demo.matchDate.toISOString(),
    matchResult: demo.matchResult,
    scoreTeam1: demo.scoreTeam1,
    scoreTeam2: demo.scoreTeam2,
    status: demo.status,
    statusMessage: demo.statusMessage,
    playerStats: demo.playerStats.map((p) => ({
      id: p.id,
      playerName: p.playerName,
      steamId: p.steamId,
      teamNumber: p.team,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      headshots: p.headshots,
      headshotPercentage: p.headshotPercentage,
      adr: p.adr,
      kast: p.kast,
      rating: p.rating,
      entryKills: p.entryKills,
      entryDeaths: p.entryDeaths,
      clutchesWon: p.clutchesWon,
      clutchesLost: p.clutchesLost,
      isMainPlayer: p.isMainPlayer,
    })),
    analysis: demo.analysis
      ? (() => {
          // Recalculer les scores en fonction des analyseurs activés
          // Convertir null en undefined pour la compatibilité avec le type AnalysisScores
          const originalScores = {
            overallScore: demo.analysis!.overallScore,
            aimScore: demo.analysis!.aimScore,
            positioningScore: demo.analysis!.positioningScore,
            utilityScore: demo.analysis!.utilityScore,
            economyScore: demo.analysis!.economyScore,
            timingScore: demo.analysis!.timingScore,
            decisionScore: demo.analysis!.decisionScore,
            movementScore: demo.analysis!.movementScore ?? undefined,
            awarenessScore: demo.analysis!.awarenessScore ?? undefined,
            teamplayScore: demo.analysis!.teamplayScore ?? undefined,
          };
          const recalculatedScores = recalculateAnalysisScores(originalScores, enabledAnalyzers, customWeights);

          return {
            overallScore: recalculatedScores.overallScore ?? originalScores.overallScore,
            aimScore: enabledAnalyzers.includes('analysis.aim') ? originalScores.aimScore : undefined,
            positioningScore: enabledAnalyzers.includes('analysis.positioning') ? originalScores.positioningScore : undefined,
            utilityScore: enabledAnalyzers.includes('analysis.utility') ? originalScores.utilityScore : undefined,
            economyScore: enabledAnalyzers.includes('analysis.economy') ? originalScores.economyScore : undefined,
            timingScore: enabledAnalyzers.includes('analysis.timing') ? originalScores.timingScore : undefined,
            decisionScore: enabledAnalyzers.includes('analysis.decision') ? originalScores.decisionScore : undefined,
            movementScore: enabledAnalyzers.includes('analysis.movement') ? originalScores.movementScore : undefined,
            awarenessScore: enabledAnalyzers.includes('analysis.awareness') ? originalScores.awarenessScore : undefined,
            teamplayScore: enabledAnalyzers.includes('analysis.teamplay') ? originalScores.teamplayScore : undefined,
            strengths: demo.analysis!.strengths || [],
            weaknesses: demo.analysis!.weaknesses || [],
            aimAnalysis: enabledAnalyzers.includes('analysis.aim') ? demo.analysis!.aimAnalysis : null,
            positioningAnalysis: enabledAnalyzers.includes('analysis.positioning') ? demo.analysis!.positioningAnalysis : null,
            utilityAnalysis: enabledAnalyzers.includes('analysis.utility') ? demo.analysis!.utilityAnalysis : null,
            economyAnalysis: enabledAnalyzers.includes('analysis.economy') ? demo.analysis!.economyAnalysis : null,
            timingAnalysis: enabledAnalyzers.includes('analysis.timing') ? demo.analysis!.timingAnalysis : null,
            decisionAnalysis: enabledAnalyzers.includes('analysis.decision') ? demo.analysis!.decisionAnalysis : null,
            movementAnalysis: enabledAnalyzers.includes('analysis.movement') ? demo.analysis!.movementAnalysis : null,
            awarenessAnalysis: enabledAnalyzers.includes('analysis.awareness') ? demo.analysis!.awarenessAnalysis : null,
            teamplayAnalysis: enabledAnalyzers.includes('analysis.teamplay') ? demo.analysis!.teamplayAnalysis : null,
          };
        })()
      : null,
    rounds,
    mainPlayerTeam: mainPlayer?.team || 1,
    mainPlayerSteamId: mainPlayer?.steamId || '',
  };

  // Préparer les données de features pour le client
  const priorityCategories = (userPrefs?.priorityCategories as string[] | null) ?? [];
  const featureData = featureContext
    ? {
        tier: featureContext.tier,
        isBetaTester: featureContext.isBetaTester,
        isAlphaTester: featureContext.isAlphaTester,
        preferences: featureContext.preferences as UserFeaturePreferences,
        overrides: featureContext.overrides as UserFeatureOverride[],
        enabledAnalyzers,
        priorityCategories,
      }
    : {
        tier: 'FREE' as const,
        isBetaTester: false,
        isAlphaTester: false,
        preferences: { disabledFeatures: [], enabledFeatures: [], featureConfigs: {} },
        overrides: [],
        enabledAnalyzers,
        priorityCategories,
      };

  // Préparer les données de charts (côté serveur)
  const chartData: ChartData | null = rounds.length > 0
    ? prepareChartData(
        rounds,
        mainPlayer?.steamId || '',
        mainPlayer?.team || 1,
        demo.playerStats.map((p) => ({
          steamId: p.steamId,
          playerName: p.playerName,
          teamNumber: p.team,
        }))
      )
    : null;

  return (
    <DemoDetailClient
      demo={demoData}
      globalStats={globalStats}
      featureData={featureData}
      chartData={chartData}
    />
  );
}
