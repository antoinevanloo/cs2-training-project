/**
 * Générateur d'insights actionnables
 *
 * Ce module transforme les résultats d'analyse bruts en conseils
 * vraiment actionnables avec contexte précis du match.
 */

import { AnalysisResult } from '../../analysis/types';
import { PlayerRole, CS2Rank } from '@prisma/client';
import { PLAYER_ROLES } from '../config';
import {
  ActionableInsight,
  InsightCategory,
  InsightSeverity,
  MatchContext,
  RoundContext,
  MapPosition,
  InsightMetrics,
  ActionableSolution,
  SolutionStep,
  RankComparison,
  CategoryComparison,
  SpecificGap,
  RankUpPriority,
  ActionableCoachingReport,
  PersonalizedActionPlan,
  DailyRoutine,
  WeeklyGoal,
  ProgressCheckpoint,
  ProgressionSnapshot,
  RecommendedExercise,
} from './types';
import {
  RANK_BENCHMARKS,
  getBenchmarkForRank,
  getMetricBenchmark,
  compareToRank,
  getNextRank,
  calculateRankGap,
  BenchmarkMetrics,
} from './benchmarks';
import {
  findExercisesForWeakness,
  getExercisesByCategory,
  generateDailyRoutine,
  WORKSHOP_MAPS,
  COMMUNITY_SERVERS,
} from './exercises-library';

// ============================================
// TYPES INTERNES
// ============================================

interface InsightGeneratorContext {
  analysis: AnalysisResult;
  playerRole: PlayerRole;
  currentRank: CS2Rank;
  targetRank: CS2Rank;
  map: string;
  matchResult: 'win' | 'loss' | 'tie';
  previousAnalyses?: AnalysisResult[];
}

// ============================================
// INSIGHT GENERATOR CLASS
// ============================================

export class ActionableInsightGenerator {
  /**
   * Génère un rapport de coaching actionnable complet
   */
  generateReport(context: InsightGeneratorContext): ActionableCoachingReport {
    const insights = this.generateInsights(context);
    const rankComparison = this.generateRankComparison(context);
    const actionPlan = this.generateActionPlan(insights, rankComparison, context);
    const progressionMetrics = this.generateProgressionSnapshot(context);

    // Find the main strength and weakness
    const sortedInsights = [...insights].sort((a, b) => a.priority - b.priority);
    const mainWeakness = sortedInsights[0]?.problem.title || 'Aucune faiblesse critique détectée';

    const strengths = this.identifyStrengths(context);
    const mainStrength = strengths[0] || 'Consistance générale';

    // Determine the one thing to focus on
    const oneThingToFocus = this.determineMainFocus(sortedInsights, rankComparison);

    return {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      playerContext: {
        rank: context.currentRank,
        targetRank: context.targetRank,
        role: context.playerRole,
        map: context.map,
        matchResult: context.matchResult,
      },
      executiveSummary: {
        overallScore: context.analysis.scores.overall,
        mainStrength,
        mainWeakness,
        oneThingToFocus,
      },
      insights,
      rankComparison,
      actionPlan,
      progressionMetrics,
    };
  }

  /**
   * Génère tous les insights actionnables
   */
  private generateInsights(context: InsightGeneratorContext): ActionableInsight[] {
    const insights: ActionableInsight[] = [];

    // Aim insights
    insights.push(...this.generateAimInsights(context));

    // Positioning insights
    insights.push(...this.generatePositioningInsights(context));

    // Utility insights
    insights.push(...this.generateUtilityInsights(context));

    // Economy insights
    insights.push(...this.generateEconomyInsights(context));

    // Timing insights
    insights.push(...this.generateTimingInsights(context));

    // Decision insights
    insights.push(...this.generateDecisionInsights(context));

    // Sort by priority
    return insights.sort((a, b) => a.priority - b.priority);
  }

  // ============================================
  // AIM INSIGHTS
  // ============================================

  private generateAimInsights(context: InsightGeneratorContext): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    const { analysis, currentRank, targetRank, playerRole } = context;
    const aimAnalysis = analysis.analyses.aim;

    if (!aimAnalysis) return insights;

    // Low headshot percentage
    const hsPercent = analysis.playerStats.hsPercentage;
    const hsBenchmark = getMetricBenchmark(targetRank, 'aim', 'headshotPercentage');

    if (hsBenchmark && hsPercent < hsBenchmark.average) {
      const gap = hsBenchmark.average - hsPercent;
      const severity = this.calculateSeverity(gap, 15);

      insights.push({
        id: 'aim_low_hs_percentage',
        category: 'aim',
        severity,
        problem: {
          title: 'Pourcentage de headshots insuffisant',
          description: `Ton taux de headshot (${hsPercent.toFixed(1)}%) est en dessous de la moyenne ${targetRank} (${hsBenchmark.average}%). Cela réduit ton efficacité au combat et te désavantage dans les duels.`,
          impactScore: Math.min(gap * 2, 30),
        },
        matchContext: this.extractMatchContext(analysis, 'aim', 'low_hs'),
        metrics: {
          current: hsPercent,
          rankAverage: getMetricBenchmark(currentRank, 'aim', 'headshotPercentage')?.average || 40,
          targetRankAverage: hsBenchmark.average,
          gap,
          unit: '%',
          trend: this.calculateTrend(context.previousAnalyses, 'headshotPercentage'),
        },
        solution: this.createAimSolution('headshot', gap, context),
        priority: severity === 'critical' ? 1 : severity === 'high' ? 2 : 3,
        tags: ['aim', 'headshot', 'crosshair_placement'],
      });
    }

    // Poor crosshair placement
    const crosshairScore = aimAnalysis.crosshairPlacement?.score || 0;
    const crosshairBenchmark = getMetricBenchmark(targetRank, 'aim', 'crosshairPlacementScore');

    if (crosshairBenchmark && crosshairScore < crosshairBenchmark.average) {
      const gap = crosshairBenchmark.average - crosshairScore;
      const severity = this.calculateSeverity(gap, 20);

      insights.push({
        id: 'aim_poor_crosshair_placement',
        category: 'aim',
        severity,
        problem: {
          title: 'Placement de crosshair à améliorer',
          description: `Ton placement de crosshair (score ${crosshairScore.toFixed(0)}) n'est pas optimal. Tu perds du temps à ajuster ta visée au lieu de pré-aim les angles.`,
          impactScore: Math.min(gap * 1.5, 25),
        },
        matchContext: this.extractMatchContext(analysis, 'aim', 'crosshair'),
        metrics: {
          current: crosshairScore,
          rankAverage: getMetricBenchmark(currentRank, 'aim', 'crosshairPlacementScore')?.average || 50,
          targetRankAverage: crosshairBenchmark.average,
          gap,
          unit: 'score',
          trend: this.calculateTrend(context.previousAnalyses, 'crosshairPlacementScore'),
        },
        solution: this.createAimSolution('crosshair', gap, context),
        priority: severity === 'critical' ? 1 : severity === 'high' ? 2 : 3,
        tags: ['aim', 'crosshair_placement', 'prefire'],
      });
    }

    // Slow reaction time
    const reactionTime = aimAnalysis.reactionTime?.average || 0;
    const reactionBenchmark = getMetricBenchmark(targetRank, 'aim', 'reactionTimeMs');

    if (reactionBenchmark && reactionTime > reactionBenchmark.average) {
      const gap = reactionTime - reactionBenchmark.average;
      const severity = this.calculateSeverity(gap, 50);

      insights.push({
        id: 'aim_slow_reaction',
        category: 'aim',
        severity,
        problem: {
          title: 'Temps de réaction à améliorer',
          description: `Ton temps de réaction moyen (${reactionTime.toFixed(0)}ms) est plus lent que la moyenne ${targetRank} (${reactionBenchmark.average}ms). Tu perds des duels que tu devrais gagner.`,
          impactScore: Math.min(gap / 3, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'aim', 'reaction'),
        metrics: {
          current: reactionTime,
          rankAverage: getMetricBenchmark(currentRank, 'aim', 'reactionTimeMs')?.average || 280,
          targetRankAverage: reactionBenchmark.average,
          gap,
          unit: 'ms',
          trend: this.calculateTrend(context.previousAnalyses, 'reactionTime'),
        },
        solution: this.createAimSolution('reaction', gap, context),
        priority: severity === 'critical' ? 2 : 3,
        tags: ['aim', 'reaction_time', 'reflex'],
      });
    }

    // Poor spray control
    const sprayScore = aimAnalysis.sprayControl?.score || 0;
    const sprayBenchmark = getMetricBenchmark(targetRank, 'aim', 'sprayAccuracy');

    if (sprayBenchmark && sprayScore < sprayBenchmark.average) {
      const gap = sprayBenchmark.average - sprayScore;
      const severity = this.calculateSeverity(gap, 20);

      insights.push({
        id: 'aim_poor_spray',
        category: 'aim',
        severity,
        problem: {
          title: 'Contrôle du spray insuffisant',
          description: `Ton contrôle du spray (score ${sprayScore.toFixed(0)}) est en dessous de la moyenne. Tu perds de l'efficacité sur les kills à moyenne distance.`,
          impactScore: Math.min(gap, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'aim', 'spray'),
        metrics: {
          current: sprayScore,
          rankAverage: getMetricBenchmark(currentRank, 'aim', 'sprayAccuracy')?.average || 45,
          targetRankAverage: sprayBenchmark.average,
          gap,
          unit: 'score',
          trend: this.calculateTrend(context.previousAnalyses, 'sprayControl'),
        },
        solution: this.createAimSolution('spray', gap, context),
        priority: severity === 'critical' ? 2 : 3,
        tags: ['aim', 'spray', 'recoil'],
      });
    }

    return insights;
  }

  // ============================================
  // POSITIONING INSIGHTS
  // ============================================

  private generatePositioningInsights(context: InsightGeneratorContext): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    const { analysis, currentRank, targetRank, map, playerRole } = context;
    const posAnalysis = analysis.analyses.positioning;

    if (!posAnalysis) return insights;

    // High isolated death rate
    const isolatedDeathRate = this.estimateIsolatedDeathRate(analysis);
    const isolatedBenchmark = getMetricBenchmark(targetRank, 'positioning', 'isolatedDeathRate');

    if (isolatedBenchmark && isolatedDeathRate > isolatedBenchmark.average) {
      // Adjust for role
      const roleAdjustment = playerRole === 'LURKER' ? 1.3 : playerRole === 'ENTRY' ? 1.2 : 1.0;
      const adjustedThreshold = isolatedBenchmark.average * roleAdjustment;

      if (isolatedDeathRate > adjustedThreshold) {
        const gap = isolatedDeathRate - adjustedThreshold;
        const severity = this.calculateSeverity(gap * 100, 15);

        insights.push({
          id: 'positioning_isolated_deaths',
          category: 'positioning',
          severity,
          problem: {
            title: 'Trop de morts isolées',
            description: `Tu meurs isolé ${(isolatedDeathRate * 100).toFixed(0)}% du temps (cible: <${(adjustedThreshold * 100).toFixed(0)}%). Tes coéquipiers ne peuvent pas te trade, ce qui donne un avantage à l'ennemi.`,
            impactScore: Math.min(gap * 100, 25),
          },
          matchContext: this.extractDeathPositions(analysis, 'isolated'),
          metrics: {
            current: isolatedDeathRate * 100,
            rankAverage: (getMetricBenchmark(currentRank, 'positioning', 'isolatedDeathRate')?.average || 0.4) * 100,
            targetRankAverage: adjustedThreshold * 100,
            gap: gap * 100,
            unit: '%',
            trend: 'stable',
          },
          solution: this.createPositioningSolution('isolated', context),
          priority: severity === 'critical' ? 1 : 2,
          tags: ['positioning', 'isolated', 'teamplay', 'trade'],
        });
      }
    }

    // Repeated death positions
    const deathPositions = posAnalysis.deathPositions || [];
    const repeatedPositions = deathPositions.filter((p: { count?: number }) => (p.count || 0) >= 3);

    if (repeatedPositions.length > 0) {
      const worstPosition = repeatedPositions.sort((a: { count?: number }, b: { count?: number }) =>
        (b.count || 0) - (a.count || 0)
      )[0];

      insights.push({
        id: 'positioning_repeated_deaths',
        category: 'positioning',
        severity: 'high',
        problem: {
          title: 'Positions de mort récurrentes',
          description: `Tu meurs ${worstPosition.count || 0} fois à la même position. L'ennemi a compris ton pattern et t'attend.`,
          impactScore: Math.min((worstPosition.count || 0) * 5, 25),
        },
        matchContext: {
          rounds: [],
          positions: repeatedPositions.slice(0, 3).map((p: { x?: number; y?: number; name?: string; zone?: string; count?: number }) => ({
            x: p.x || 0,
            y: p.y || 0,
            name: p.name || 'Position inconnue',
            zone: p.zone || 'Inconnu',
            occurrences: p.count || 0,
          })),
          frequency: {
            occurrences: repeatedPositions.reduce((sum: number, p: { count?: number }) => sum + (p.count || 0), 0),
            totalOpportunities: analysis.playerStats.deaths,
            rate: repeatedPositions.reduce((sum: number, p: { count?: number }) => sum + (p.count || 0), 0) / Math.max(1, analysis.playerStats.deaths),
          },
          timing: 'consistent',
        },
        metrics: {
          current: repeatedPositions.length,
          rankAverage: 0,
          targetRankAverage: 0,
          gap: repeatedPositions.length,
          unit: 'positions',
          trend: 'stable',
        },
        solution: this.createPositioningSolution('repeated', context, repeatedPositions),
        priority: 2,
        tags: ['positioning', 'predictable', 'adaptation'],
      });
    }

    // Low map control score
    const mapControlScore = posAnalysis.mapControl?.score || 0;
    const mapControlBenchmark = getMetricBenchmark(targetRank, 'positioning', 'mapControlScore');

    if (mapControlBenchmark && mapControlScore < mapControlBenchmark.average) {
      const gap = mapControlBenchmark.average - mapControlScore;
      const severity = this.calculateSeverity(gap, 20);

      insights.push({
        id: 'positioning_map_control',
        category: 'positioning',
        severity,
        problem: {
          title: 'Contrôle de map insuffisant',
          description: `Ton score de contrôle de map (${mapControlScore.toFixed(0)}) est en dessous de la moyenne ${targetRank}. Tu ne prends pas assez d'information et de contrôle territorial.`,
          impactScore: Math.min(gap, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'positioning', 'map_control'),
        metrics: {
          current: mapControlScore,
          rankAverage: getMetricBenchmark(currentRank, 'positioning', 'mapControlScore')?.average || 50,
          targetRankAverage: mapControlBenchmark.average,
          gap,
          unit: 'score',
          trend: 'stable',
        },
        solution: this.createPositioningSolution('map_control', context),
        priority: 3,
        tags: ['positioning', 'map_control', 'information'],
      });
    }

    return insights;
  }

  // ============================================
  // UTILITY INSIGHTS
  // ============================================

  private generateUtilityInsights(context: InsightGeneratorContext): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    const { analysis, currentRank, targetRank, playerRole } = context;
    const utilityAnalysis = analysis.analyses.utility;

    if (!utilityAnalysis) return insights;

    // Low flash efficiency
    const flashEfficiency = utilityAnalysis.flashEfficiency?.effectiveness || 0;
    const flashBenchmark = getMetricBenchmark(targetRank, 'utility', 'flashEfficiency');

    // Adjust for role (support should be better at flashes)
    const roleMultiplier = playerRole === 'SUPPORT' ? 1.1 : 1.0;
    const adjustedTarget = flashBenchmark ? flashBenchmark.average * roleMultiplier : 0.4;

    if (flashEfficiency < adjustedTarget) {
      const gap = adjustedTarget - flashEfficiency;
      const severity = this.calculateSeverity(gap * 100, 15);

      insights.push({
        id: 'utility_flash_efficiency',
        category: 'utility',
        severity,
        problem: {
          title: 'Efficacité des flashs à améliorer',
          description: `Seulement ${(flashEfficiency * 100).toFixed(0)}% de tes flashs touchent des ennemis (cible: ${(adjustedTarget * 100).toFixed(0)}%). Tes flashs sont gaspillées ou mal timées.`,
          impactScore: Math.min(gap * 100, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'utility', 'flash'),
        metrics: {
          current: flashEfficiency * 100,
          rankAverage: (getMetricBenchmark(currentRank, 'utility', 'flashEfficiency')?.average || 0.35) * 100,
          targetRankAverage: adjustedTarget * 100,
          gap: gap * 100,
          unit: '%',
          trend: 'stable',
        },
        solution: this.createUtilitySolution('flash', context),
        priority: playerRole === 'SUPPORT' ? 2 : 3,
        tags: ['utility', 'flash', 'support', 'teamplay'],
      });
    }

    // Dying with utility - estimate based on utility thrown vs potential
    // If flash effectiveness is low, they might be holding onto utility
    const totalUtilityThrown = (utilityAnalysis.flashEfficiency?.thrown || 0) +
      (utilityAnalysis.smokeUsage?.thrown || 0) +
      (utilityAnalysis.molotovDamage?.thrown || 0) +
      (utilityAnalysis.heUsage?.thrown || 0);

    // Estimate: if total utility thrown is low (< 8 per match), might be dying with utility
    const estimatedDyingWithUtility = totalUtilityThrown < 8 ? 0.4 : totalUtilityThrown < 12 ? 0.25 : 0.15;
    const dyingBenchmark = getMetricBenchmark(targetRank, 'utility', 'dyingWithUtilityRate');

    if (dyingBenchmark && estimatedDyingWithUtility > dyingBenchmark.average) {
      const gap = estimatedDyingWithUtility - dyingBenchmark.average;
      const severity = this.calculateSeverity(gap * 100, 10);

      insights.push({
        id: 'utility_dying_with',
        category: 'utility',
        severity: severity === 'low' ? 'medium' : severity, // Minimum medium severity
        problem: {
          title: 'Tu meurs avec des grenades non utilisées',
          description: `Tu sembles mourir avec des grenades non utilisées (estimé ${(estimatedDyingWithUtility * 100).toFixed(0)}%). C'est de l'argent gaspillé et des opportunités manquées.`,
          impactScore: Math.min(gap * 150, 25),
        },
        matchContext: this.extractMatchContext(analysis, 'utility', 'unused'),
        metrics: {
          current: estimatedDyingWithUtility * 100,
          rankAverage: (getMetricBenchmark(currentRank, 'utility', 'dyingWithUtilityRate')?.average || 0.35) * 100,
          targetRankAverage: dyingBenchmark.average * 100,
          gap: gap * 100,
          unit: '%',
          trend: 'stable',
        },
        solution: this.createUtilitySolution('unused', context),
        priority: 2,
        tags: ['utility', 'economy', 'waste'],
      });
    }

    // Low utility usage overall
    const flashesThrown = utilityAnalysis.flashEfficiency?.thrown || 0;
    const flashUsageBenchmark = getMetricBenchmark(targetRank, 'utility', 'flashesPerMatch');

    if (flashUsageBenchmark && flashesThrown < flashUsageBenchmark.average * 0.7) {
      const gap = flashUsageBenchmark.average - flashesThrown;

      insights.push({
        id: 'utility_low_usage',
        category: 'utility',
        severity: 'medium',
        problem: {
          title: 'Pas assez d\'utilités utilisées',
          description: `Tu n'as lancé que ${flashesThrown} flashs ce match (moyenne ${targetRank}: ${flashUsageBenchmark.average}). Tu ne maximises pas l'impact de tes achats.`,
          impactScore: Math.min(gap * 2, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'utility', 'low_usage'),
        metrics: {
          current: flashesThrown,
          rankAverage: getMetricBenchmark(currentRank, 'utility', 'flashesPerMatch')?.average || 8,
          targetRankAverage: flashUsageBenchmark.average,
          gap,
          unit: 'flashs',
          trend: 'stable',
        },
        solution: this.createUtilitySolution('usage', context),
        priority: 3,
        tags: ['utility', 'usage', 'buying'],
      });
    }

    return insights;
  }

  // ============================================
  // ECONOMY INSIGHTS
  // ============================================

  private generateEconomyInsights(context: InsightGeneratorContext): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    const { analysis, currentRank, targetRank } = context;
    const economyAnalysis = analysis.analyses.economy;

    if (!economyAnalysis) return insights;

    // Poor buy decisions
    const buyScore = economyAnalysis.buyDecisions?.score || 0;
    const buyBenchmark = getMetricBenchmark(targetRank, 'economy', 'buyDecisionScore');

    if (buyBenchmark && buyScore < buyBenchmark.average) {
      const gap = buyBenchmark.average - buyScore;
      const severity = this.calculateSeverity(gap, 15);

      insights.push({
        id: 'economy_buy_decisions',
        category: 'economy',
        severity,
        problem: {
          title: 'Décisions d\'achat à améliorer',
          description: `Ton score de décisions d'achat (${buyScore.toFixed(0)}) indique des achats non optimaux. Cela affecte l'économie de toute l'équipe.`,
          impactScore: Math.min(gap, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'economy', 'buy'),
        metrics: {
          current: buyScore,
          rankAverage: getMetricBenchmark(currentRank, 'economy', 'buyDecisionScore')?.average || 65,
          targetRankAverage: buyBenchmark.average,
          gap,
          unit: 'score',
          trend: 'stable',
        },
        solution: this.createEconomySolution('buy', context),
        priority: severity === 'critical' ? 2 : 3,
        tags: ['economy', 'buy', 'team'],
      });
    }

    // Force buy addiction
    const inappropriateSaves = economyAnalysis.saveRounds?.inappropriate || 0;

    if (inappropriateSaves > 2) {
      insights.push({
        id: 'economy_force_buy',
        category: 'economy',
        severity: 'medium',
        problem: {
          title: 'Trop de force buys',
          description: `Tu as fait ${inappropriateSaves} force buys inappropriés ce match. Cela casse l'économie de l'équipe et réduit vos chances sur les rounds suivants.`,
          impactScore: inappropriateSaves * 5,
        },
        matchContext: this.extractMatchContext(analysis, 'economy', 'force'),
        metrics: {
          current: inappropriateSaves,
          rankAverage: 1,
          targetRankAverage: 0,
          gap: inappropriateSaves,
          unit: 'force buys',
          trend: 'stable',
        },
        solution: this.createEconomySolution('force', context),
        priority: 3,
        tags: ['economy', 'force_buy', 'discipline'],
      });
    }

    return insights;
  }

  // ============================================
  // TIMING INSIGHTS
  // ============================================

  private generateTimingInsights(context: InsightGeneratorContext): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    const { analysis, currentRank, targetRank } = context;
    const timingAnalysis = analysis.analyses.timing;

    if (!timingAnalysis) return insights;

    // Poor trade speed
    const tradeSuccess = timingAnalysis.tradeSpeed?.successful || 0;
    const tradeBenchmark = getMetricBenchmark(targetRank, 'timing', 'tradeSuccessRate');

    if (tradeBenchmark && tradeSuccess < tradeBenchmark.average) {
      const gap = tradeBenchmark.average - tradeSuccess;
      const severity = this.calculateSeverity(gap * 100, 15);

      insights.push({
        id: 'timing_trade_speed',
        category: 'timing',
        severity,
        problem: {
          title: 'Trades trop lents',
          description: `Ton taux de trades réussis (${(tradeSuccess * 100).toFixed(0)}%) est en dessous de la cible ${targetRank} (${(tradeBenchmark.average * 100).toFixed(0)}%). Tu ne venges pas tes coéquipiers assez vite.`,
          impactScore: Math.min(gap * 100, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'timing', 'trade'),
        metrics: {
          current: tradeSuccess * 100,
          rankAverage: (getMetricBenchmark(currentRank, 'timing', 'tradeSuccessRate')?.average || 0.5) * 100,
          targetRankAverage: tradeBenchmark.average * 100,
          gap: gap * 100,
          unit: '%',
          trend: 'stable',
        },
        solution: this.createTimingSolution('trade', context),
        priority: 2,
        tags: ['timing', 'trade', 'teamplay'],
      });
    }

    // Poor peek timing
    const peekScore = timingAnalysis.peekTiming?.score || 0;
    const peekBenchmark = getMetricBenchmark(targetRank, 'timing', 'peekTimingScore');

    if (peekBenchmark && peekScore < peekBenchmark.average) {
      const gap = peekBenchmark.average - peekScore;
      const severity = this.calculateSeverity(gap, 15);

      insights.push({
        id: 'timing_peek',
        category: 'timing',
        severity,
        problem: {
          title: 'Timing de peek à améliorer',
          description: `Ton score de timing de peek (${peekScore.toFixed(0)}) indique que tu peek aux mauvais moments ou de manière prévisible.`,
          impactScore: Math.min(gap, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'timing', 'peek'),
        metrics: {
          current: peekScore,
          rankAverage: getMetricBenchmark(currentRank, 'timing', 'peekTimingScore')?.average || 55,
          targetRankAverage: peekBenchmark.average,
          gap,
          unit: 'score',
          trend: 'stable',
        },
        solution: this.createTimingSolution('peek', context),
        priority: 3,
        tags: ['timing', 'peek', 'prefire'],
      });
    }

    return insights;
  }

  // ============================================
  // DECISION INSIGHTS
  // ============================================

  private generateDecisionInsights(context: InsightGeneratorContext): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    const { analysis, currentRank, targetRank } = context;
    const decisionAnalysis = analysis.analyses.decision;

    if (!decisionAnalysis) return insights;

    // Poor clutch performance
    const clutchScore = decisionAnalysis.clutchPerformance?.score || 0;
    const clutchBenchmark = getMetricBenchmark(targetRank, 'timing', 'clutchConversionRate');

    if (clutchBenchmark && clutchScore < clutchBenchmark.average * 100) {
      const gap = clutchBenchmark.average * 100 - clutchScore;
      const severity = this.calculateSeverity(gap, 15);

      insights.push({
        id: 'decision_clutch',
        category: 'decision',
        severity,
        problem: {
          title: 'Performance en clutch à améliorer',
          description: `Ton score de clutch (${clutchScore.toFixed(0)}) indique des difficultés dans les situations 1vX. La gestion du temps et des décisions peut être améliorée.`,
          impactScore: Math.min(gap, 20),
        },
        matchContext: this.extractMatchContext(analysis, 'decision', 'clutch'),
        metrics: {
          current: clutchScore,
          rankAverage: (getMetricBenchmark(currentRank, 'timing', 'clutchConversionRate')?.average || 0.25) * 100,
          targetRankAverage: clutchBenchmark.average * 100,
          gap,
          unit: 'score',
          trend: 'stable',
        },
        solution: this.createDecisionSolution('clutch', context),
        priority: 3,
        tags: ['decision', 'clutch', 'pressure'],
      });
    }

    // Low opening duel win rate
    const openingDuelRate = this.estimateOpeningDuelRate(analysis);
    const openingBenchmark = getMetricBenchmark(targetRank, 'decision', 'openingDuelWinRate');

    if (openingBenchmark && openingDuelRate < openingBenchmark.average) {
      const gap = openingBenchmark.average - openingDuelRate;
      const severity = this.calculateSeverity(gap * 100, 10);

      insights.push({
        id: 'decision_opening_duel',
        category: 'decision',
        severity,
        problem: {
          title: 'Win rate des duels d\'ouverture faible',
          description: `Tu gagnes ${(openingDuelRate * 100).toFixed(0)}% de tes duels d'ouverture (cible ${targetRank}: ${(openingBenchmark.average * 100).toFixed(0)}%). Les premiers kills sont cruciaux pour l'économie du round.`,
          impactScore: Math.min(gap * 100, 25),
        },
        matchContext: this.extractMatchContext(analysis, 'decision', 'opening'),
        metrics: {
          current: openingDuelRate * 100,
          rankAverage: (getMetricBenchmark(currentRank, 'decision', 'openingDuelWinRate')?.average || 0.48) * 100,
          targetRankAverage: openingBenchmark.average * 100,
          gap: gap * 100,
          unit: '%',
          trend: 'stable',
        },
        solution: this.createDecisionSolution('opening', context),
        priority: 2,
        tags: ['decision', 'opening', 'entry', 'first_kill'],
      });
    }

    return insights;
  }

  // ============================================
  // RANK COMPARISON
  // ============================================

  private generateRankComparison(context: InsightGeneratorContext): RankComparison {
    const { analysis, currentRank, targetRank } = context;
    const categoryComparisons: CategoryComparison[] = [];

    const categories: { key: InsightCategory; score: number }[] = [
      { key: 'aim', score: analysis.scores.aim },
      { key: 'positioning', score: analysis.scores.positioning },
      { key: 'utility', score: analysis.scores.utility },
      { key: 'economy', score: analysis.scores.economy },
      { key: 'timing', score: analysis.scores.timing },
      { key: 'decision', score: analysis.scores.decision },
    ];

    for (const { key, score } of categories) {
      const currentBenchmark = this.getCategoryAverage(currentRank, key);
      const targetBenchmark = this.getCategoryAverage(targetRank, key);

      const gap = targetBenchmark - score;
      let status: 'above_target' | 'on_track' | 'below_average' | 'critical';

      if (score >= targetBenchmark) {
        status = 'above_target';
      } else if (score >= currentBenchmark) {
        status = 'on_track';
      } else if (score >= currentBenchmark * 0.8) {
        status = 'below_average';
      } else {
        status = 'critical';
      }

      categoryComparisons.push({
        category: key,
        currentScore: score,
        rankAverageScore: currentBenchmark,
        targetRankAverageScore: targetBenchmark,
        gap: Math.max(0, gap),
        status,
        specificGaps: this.getSpecificGaps(analysis, key, currentRank, targetRank),
      });
    }

    // Sort by gap (biggest first)
    const sortedComparisons = [...categoryComparisons].sort((a, b) => b.gap - a.gap);

    // Generate top priorities
    const topPriorities: RankUpPriority[] = sortedComparisons
      .filter((c) => c.gap > 0)
      .slice(0, 3)
      .map((c, index) => ({
        rank: index + 1,
        category: c.category,
        issue: `Score ${c.category} de ${c.currentScore.toFixed(0)} (cible: ${c.targetRankAverageScore.toFixed(0)})`,
        currentValue: c.currentScore,
        targetValue: c.targetRankAverageScore,
        impact: this.getImpactDescription(c.category, c.gap),
        insightId: `${c.category}_improvement`,
      }));

    // Calculate overall gap
    const overallGap = categoryComparisons.reduce((sum, c) => sum + c.gap, 0) / categoryComparisons.length;
    const readinessScore = Math.max(0, 100 - overallGap);

    return {
      currentRank,
      targetRank,
      overallGap: {
        score: readinessScore,
        description: this.getReadinessDescription(readinessScore),
      },
      categoryComparisons,
      topPriorities,
      estimatedTimeToRankUp: this.estimateTimeToRankUp(overallGap),
    };
  }

  // ============================================
  // ACTION PLAN GENERATION
  // ============================================

  private generateActionPlan(
    insights: ActionableInsight[],
    rankComparison: RankComparison,
    context: InsightGeneratorContext
  ): PersonalizedActionPlan {
    const topInsights = insights.slice(0, 3);

    // Primary and secondary focus
    const primaryFocus = topInsights[0]?.problem.title || 'Amélioration générale';
    const secondaryFocus = topInsights[1]?.problem.title || 'Consistance';

    // Generate daily routine
    const primaryCategory = topInsights[0]?.category || 'aim';
    const dailyRoutine = this.generateDailyRoutineForInsights(topInsights, context);

    // Weekly goals
    const weeklyGoals: WeeklyGoal[] = topInsights.slice(0, 3).map((insight, index) => ({
      id: `goal_${index}`,
      description: `Améliorer ${insight.category}: ${insight.problem.title}`,
      metric: insight.metrics.unit,
      currentValue: insight.metrics.current,
      targetValue: insight.metrics.current + (insight.metrics.gap * 0.3), // 30% improvement goal
      deadline: this.getDeadline(7),
      relatedInsightId: insight.id,
    }));

    // Checkpoints
    const checkpoints: ProgressCheckpoint[] = [
      {
        day: 1,
        focus: primaryFocus,
        exercises: dailyRoutine.warmup.map((e) => e.name),
        expectedProgress: 'Familiarisation avec les exercices',
      },
      {
        day: 3,
        focus: primaryFocus,
        exercises: dailyRoutine.mainTraining.slice(0, 2).map((e) => e.name),
        expectedProgress: 'Début d\'amélioration visible',
      },
      {
        day: 7,
        focus: secondaryFocus,
        exercises: dailyRoutine.mainTraining.map((e) => e.name),
        expectedProgress: 'Progression mesurable sur les métriques clés',
      },
    ];

    return {
      weeklyFocus: {
        primary: primaryFocus,
        secondary: secondaryFocus,
      },
      dailyRoutine,
      weeklyGoals,
      checkpoints,
    };
  }

  private generateDailyRoutineForInsights(
    insights: ActionableInsight[],
    context: InsightGeneratorContext
  ): DailyRoutine {
    const primaryCategory = insights[0]?.category || 'aim';

    const routineConfig = generateDailyRoutine({
      totalTime: 45, // 45 minutes par défaut
      focusCategory: primaryCategory,
      difficulty: this.getDifficultyForRank(context.currentRank),
      includeWarmup: true,
    });

    return {
      warmup: routineConfig.warmup,
      mainTraining: routineConfig.main,
      cooldown: routineConfig.cooldown,
      totalDuration: routineConfig.totalDuration,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private calculateSeverity(gap: number, threshold: number): InsightSeverity {
    const ratio = gap / threshold;
    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1) return 'medium';
    return 'low';
  }

  private extractMatchContext(
    analysis: AnalysisResult,
    category: string,
    type: string
  ): MatchContext {
    // In a real implementation, this would extract actual round data
    // For now, return a basic context
    return {
      rounds: [],
      positions: [],
      frequency: {
        occurrences: 0,
        totalOpportunities: 0,
        rate: 0,
      },
      timing: 'consistent',
    };
  }

  private extractDeathPositions(
    analysis: AnalysisResult,
    type: string
  ): MatchContext {
    const posAnalysis = analysis.analyses.positioning;
    const deathPositions = posAnalysis?.deathPositions || [];

    return {
      rounds: [],
      positions: deathPositions.slice(0, 5).map((p: { x?: number; y?: number; name?: string; zone?: string; count?: number }) => ({
        x: p.x || 0,
        y: p.y || 0,
        name: p.name || 'Position inconnue',
        zone: p.zone || 'Inconnu',
        occurrences: p.count || 0,
      })),
      frequency: {
        occurrences: analysis.playerStats.deaths,
        totalOpportunities: analysis.playerStats.deaths,
        rate: 1,
      },
      timing: 'consistent',
    };
  }

  private calculateTrend(
    previousAnalyses: AnalysisResult[] | undefined,
    metric: string
  ): 'improving' | 'stable' | 'declining' {
    if (!previousAnalyses || previousAnalyses.length < 2) return 'stable';
    // In a real implementation, calculate actual trend
    return 'stable';
  }

  private estimateIsolatedDeathRate(analysis: AnalysisResult): number {
    const mapControlScore = analysis.analyses.positioning?.mapControl?.score || 60;
    return (100 - mapControlScore) / 100;
  }

  private estimateOpeningDuelRate(analysis: AnalysisResult): number {
    const stats = analysis.playerStats;
    const kd = stats.kills / Math.max(1, stats.deaths);
    return kd > 1.2 ? 0.55 : kd > 1.0 ? 0.45 : 0.35;
  }

  private getCategoryAverage(rank: CS2Rank, category: InsightCategory): number {
    // Map category scores based on benchmarks
    const benchmarks: Record<InsightCategory, number> = {
      aim: 50,
      positioning: 50,
      utility: 50,
      economy: 50,
      timing: 50,
      decision: 50,
      communication: 50,
      mental: 50,
    };

    // Adjust based on rank
    const rankMultipliers: Record<string, number> = {
      SILVER: 0.7,
      GOLD_NOVA: 0.85,
      MASTER_GUARDIAN: 1.0,
      LEGENDARY_EAGLE: 1.1,
      SUPREME: 1.2,
      GLOBAL: 1.3,
    };

    const multiplier = rankMultipliers[rank] || 1.0;
    return (benchmarks[category] || 50) * multiplier;
  }

  private getSpecificGaps(
    analysis: AnalysisResult,
    category: InsightCategory,
    currentRank: CS2Rank,
    targetRank: CS2Rank
  ): SpecificGap[] {
    // Return specific gaps for the category
    return [];
  }

  private getImpactDescription(category: InsightCategory, gap: number): string {
    const impacts: Record<InsightCategory, string> = {
      aim: 'Améliorer l\'aim augmente directement ton win rate en duels',
      positioning: 'Un meilleur positionnement réduit les morts évitables',
      utility: 'Une meilleure utility usage aide toute l\'équipe',
      economy: 'Une meilleure économie permet plus de full buys',
      timing: 'Un meilleur timing crée des opportunités de kills',
      decision: 'De meilleures décisions gagnent les rounds serrés',
      communication: 'Une meilleure communication coordonne l\'équipe',
      mental: 'Un meilleur mental maintient la performance sous pression',
    };

    return impacts[category] || 'Amélioration générale des performances';
  }

  private getReadinessDescription(score: number): string {
    if (score >= 90) return 'Tu es prêt pour le rank supérieur!';
    if (score >= 75) return 'Proche du rank supérieur, continue comme ça';
    if (score >= 60) return 'Progression solide, quelques points à travailler';
    if (score >= 40) return 'Des améliorations nécessaires dans plusieurs domaines';
    return 'Focus sur les fondamentaux avant de viser plus haut';
  }

  private estimateTimeToRankUp(overallGap: number): {
    optimistic: string;
    realistic: string;
    description: string;
  } {
    if (overallGap < 10) {
      return {
        optimistic: '1-2 semaines',
        realistic: '2-4 semaines',
        description: 'Tu es très proche, maintiens ton niveau',
      };
    }
    if (overallGap < 25) {
      return {
        optimistic: '2-4 semaines',
        realistic: '1-2 mois',
        description: 'Avec un entraînement régulier, tu peux y arriver',
      };
    }
    if (overallGap < 40) {
      return {
        optimistic: '1-2 mois',
        realistic: '2-4 mois',
        description: 'Focus sur les priorités identifiées',
      };
    }
    return {
      optimistic: '2-4 mois',
      realistic: '4-6 mois',
      description: 'Un travail soutenu sur les fondamentaux est nécessaire',
    };
  }

  private identifyStrengths(context: InsightGeneratorContext): string[] {
    const { analysis, currentRank } = context;
    const strengths: string[] = [];

    // Check each category
    if (analysis.scores.aim >= this.getCategoryAverage(currentRank, 'aim') * 1.1) {
      strengths.push('Aim solide');
    }
    if (analysis.scores.positioning >= this.getCategoryAverage(currentRank, 'positioning') * 1.1) {
      strengths.push('Bon positionnement');
    }
    if (analysis.scores.utility >= this.getCategoryAverage(currentRank, 'utility') * 1.1) {
      strengths.push('Bonne utilisation des utilités');
    }
    if (analysis.scores.economy >= this.getCategoryAverage(currentRank, 'economy') * 1.1) {
      strengths.push('Gestion économique efficace');
    }

    return strengths.length > 0 ? strengths : ['Consistance générale'];
  }

  private determineMainFocus(
    insights: ActionableInsight[],
    rankComparison: RankComparison
  ): string {
    if (insights.length === 0) {
      return 'Maintiens ton niveau actuel et continue à jouer régulièrement';
    }

    const topInsight = insights[0];
    return `${topInsight.problem.title} - ${topInsight.solution.summary}`;
  }

  private getDifficultyForRank(
    rank: CS2Rank
  ): 'beginner' | 'intermediate' | 'advanced' {
    if (['SILVER', 'GOLD_NOVA', 'PREMIER_0_5000', 'PREMIER_5000_10000'].includes(rank)) {
      return 'beginner';
    }
    if (['MASTER_GUARDIAN', 'LEGENDARY_EAGLE', 'PREMIER_10000_15000'].includes(rank)) {
      return 'intermediate';
    }
    return 'advanced';
  }

  private getDeadline(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private generateProgressionSnapshot(context: InsightGeneratorContext): ProgressionSnapshot {
    return {
      trend: {
        overall: 'stable',
        byCategory: {
          aim: 'stable',
          positioning: 'stable',
          utility: 'stable',
          economy: 'stable',
          timing: 'stable',
          decision: 'stable',
          communication: 'stable',
          mental: 'stable',
        },
      },
      achievedGoals: [],
      activeGoals: [],
    };
  }

  // ============================================
  // SOLUTION GENERATORS
  // ============================================

  private createAimSolution(type: string, gap: number, context: InsightGeneratorContext): ActionableSolution {
    const exercises = findExercisesForWeakness(
      type,
      'aim',
      this.getDifficultyForRank(context.currentRank),
      5
    ).map((m) => m.exercise);

    const steps: SolutionStep[] = [];
    const roleSpecificTips: string[] = [];

    switch (type) {
      case 'headshot':
        steps.push(
          { order: 1, action: 'Warmup Aim Botz', howTo: 'Fais 200 kills en visant uniquement la tête', why: 'Crée le réflexe de viser la tête' },
          { order: 2, action: 'DM Headshot Only', howTo: 'Joue 15 min sur serveur HS only', why: 'Force l\'habitude en conditions réelles' },
          { order: 3, action: 'Prefire ta map', howTo: 'Pratique les prefires sur ta map principale', why: 'Améliore le crosshair placement' }
        );
        if (context.playerRole === 'AWPER') {
          roleSpecificTips.push('En tant qu\'AWPer, focus sur le one-shot plutôt que le spray');
        }
        break;

      case 'crosshair':
        steps.push(
          { order: 1, action: 'Prefire maps', howTo: 'Fais la map Yprac Prefire de ta map', why: 'Apprend où placer ton crosshair' },
          { order: 2, action: 'Regarde des pros', howTo: 'Observe le crosshair placement des pros', why: 'Copie les bonnes habitudes' },
          { order: 3, action: 'Pratique consciente', howTo: 'En DM, focus uniquement sur le placement', why: 'Intègre l\'habitude' }
        );
        break;

      case 'reaction':
        steps.push(
          { order: 1, action: 'Fast Aim Training', howTo: 'Fais la map Fast Aim/Reflex 10 min', why: 'Entraîne les réflexes' },
          { order: 2, action: 'Assure-toi d\'être reposé', howTo: 'Dors bien, évite de jouer fatigué', why: 'Le temps de réaction dépend de la fatigue' },
          { order: 3, action: 'DM Warmup', howTo: 'Toujours warmup avant de jouer ranked', why: 'Active les réflexes' }
        );
        break;

      case 'spray':
        steps.push(
          { order: 1, action: 'Recoil Master', howTo: 'Pratique AK-47 et M4 10 min', why: 'Mémorise les patterns' },
          { order: 2, action: 'Spray transfers', howTo: 'Pratique les transfers entre cibles', why: 'Maîtrise le contrôle dynamique' },
          { order: 3, action: 'Application en DM', howTo: 'En DM, spray les duels moyenne distance', why: 'Applique en conditions réelles' }
        );
        break;
    }

    return {
      summary: this.getAimSolutionSummary(type),
      steps,
      exercises,
      estimatedTimeToImprove: { minimum: 7, typical: 14, maximum: 30 },
      successCriteria: [
        {
          metric: type === 'headshot' ? 'Headshot %' : type === 'reaction' ? 'Reaction time' : 'Score',
          currentValue: 0,
          targetValue: 0,
          unit: type === 'reaction' ? 'ms' : '%',
          measurementMethod: 'Compare dans les prochaines démos',
        },
      ],
      roleSpecificTips: roleSpecificTips.length > 0 ? roleSpecificTips : undefined,
      mapSpecificTips: context.map ? [`Focus sur les angles clés de ${context.map}`] : undefined,
    };
  }

  private createPositioningSolution(
    type: string,
    context: InsightGeneratorContext,
    positions?: { name?: string; zone?: string; count?: number }[]
  ): ActionableSolution {
    const exercises = findExercisesForWeakness(
      type,
      'positioning',
      this.getDifficultyForRank(context.currentRank),
      5
    ).map((m) => m.exercise);

    const steps: SolutionStep[] = [];

    switch (type) {
      case 'isolated':
        steps.push(
          { order: 1, action: 'Joue avec un buddy', howTo: 'Reste toujours à portée de trade d\'un coéquipier', why: 'Tes morts deviennent des trades' },
          { order: 2, action: 'Communique ta position', howTo: 'Dis où tu es à ton équipe', why: 'Permet aux autres de te couvrir' },
          { order: 3, action: 'Évite les flanks seul', howTo: 'Ne pars pas seul sauf si tu es lurker', why: 'Les flanks isolés sont risqués' }
        );
        break;

      case 'repeated':
        const positionNames = positions?.slice(0, 2).map((p) => p.name || 'position').join(', ') || 'ces positions';
        steps.push(
          { order: 1, action: 'Varie tes positions', howTo: `Évite de retourner à ${positionNames}`, why: 'L\'ennemi t\'attend à ces endroits' },
          { order: 2, action: 'Regarde ta démo', howTo: 'Analyse pourquoi tu meurs à ces endroits', why: 'Comprends tes erreurs' },
          { order: 3, action: 'Apprends de nouvelles positions', howTo: 'Regarde des pros jouer ta map', why: 'Élargis ton répertoire' }
        );
        break;

      case 'map_control':
        steps.push(
          { order: 1, action: 'Prends de l\'information', howTo: 'Peek pour info au début du round', why: 'L\'info guide les décisions de l\'équipe' },
          { order: 2, action: 'Utilise tes utilités', howTo: 'Smoke/flash pour prendre du contrôle', why: 'L\'utility facilite les prises de map' },
          { order: 3, action: 'Communique', howTo: 'Partage l\'info avec ton équipe', why: 'L\'info partagée multiplie sa valeur' }
        );
        break;
    }

    return {
      summary: this.getPositioningSolutionSummary(type),
      steps,
      exercises,
      estimatedTimeToImprove: { minimum: 14, typical: 28, maximum: 60 },
      successCriteria: [
        {
          metric: 'Isolated death rate',
          currentValue: 0,
          targetValue: 0,
          unit: '%',
          measurementMethod: 'Compare dans les prochaines démos',
        },
      ],
      roleSpecificTips: context.playerRole === 'LURKER'
        ? ['En tant que lurker, les positions isolées sont normales mais time bien tes plays']
        : undefined,
    };
  }

  private createUtilitySolution(type: string, context: InsightGeneratorContext): ActionableSolution {
    const exercises = findExercisesForWeakness(
      type,
      'utility',
      this.getDifficultyForRank(context.currentRank),
      5
    ).map((m) => m.exercise);

    const steps: SolutionStep[] = [];

    switch (type) {
      case 'flash':
        steps.push(
          { order: 1, action: 'Apprends 5 pop flashes', howTo: 'Utilise Yprac Utility pour ta map', why: 'Les pop flashes sont plus efficaces' },
          { order: 2, action: 'Flash pour tes coéquipiers', howTo: 'Communique avant de flash', why: 'Flash + entry = kill' },
          { order: 3, action: 'Évite les self-flash', howTo: 'Tourne-toi ou utilise des pop flashes', why: 'Les self-flash font perdre des duels' }
        );
        break;

      case 'unused':
        steps.push(
          { order: 1, action: 'Lance tôt', howTo: 'Utilise tes nades dès que tu as une opportunité', why: 'Une nade non utilisée est gaspillée' },
          { order: 2, action: 'Achète moins si besoin', howTo: 'N\'achète pas plus que ce que tu utiliseras', why: 'Économise l\'argent pour les armes' },
          { order: 3, action: 'Panic throw', howTo: 'Si tu vas mourir, lance ce que tu as', why: 'Mieux vaut lancer que perdre' }
        );
        break;

      case 'usage':
        steps.push(
          { order: 1, action: 'Achète des nades', howTo: 'Toujours acheter au moins 2 nades en full buy', why: 'L\'utility est essentielle' },
          { order: 2, action: 'Apprends des lineups', howTo: 'Connais 5 smokes et 5 flashes par map', why: 'Tu sauras quand les utiliser' },
          { order: 3, action: 'Suis le plan', howTo: 'Lance tes nades pendant les exécutes', why: 'L\'utility collective gagne les rounds' }
        );
        break;
    }

    return {
      summary: this.getUtilitySolutionSummary(type),
      steps,
      exercises,
      estimatedTimeToImprove: { minimum: 7, typical: 21, maximum: 45 },
      successCriteria: [
        {
          metric: 'Flash efficiency',
          currentValue: 0,
          targetValue: 0,
          unit: '%',
          measurementMethod: 'Compare dans les prochaines démos',
        },
      ],
      roleSpecificTips: context.playerRole === 'SUPPORT'
        ? ['En tant que support, l\'utility est ton rôle principal - deviens expert']
        : undefined,
    };
  }

  private createEconomySolution(type: string, context: InsightGeneratorContext): ActionableSolution {
    const exercises = findExercisesForWeakness(
      'economy',
      'economy',
      this.getDifficultyForRank(context.currentRank),
      3
    ).map((m) => m.exercise);

    const steps: SolutionStep[] = [];

    switch (type) {
      case 'buy':
        steps.push(
          { order: 1, action: 'Apprends les loss bonus', howTo: 'Connais les montants: 1900, 2400, 2900, 3400', why: 'Permet de prévoir les économies' },
          { order: 2, action: 'Achète avec l\'équipe', howTo: 'Ne full buy pas seul si l\'équipe save', why: 'L\'économie est collective' },
          { order: 3, action: 'Calcule l\'éco ennemie', howTo: 'Estime leur argent pour adapter ta position', why: 'Prévois les force buys ennemis' }
        );
        break;

      case 'force':
        steps.push(
          { order: 1, action: 'Discipline', howTo: 'Si l\'équipe dit save, tu save', why: 'Un joueur qui force ruine l\'économie' },
          { order: 2, action: 'Comprends le win condition', howTo: 'Parfois perdre un round maintient l\'avantage éco', why: 'Gagne le match, pas le round' },
          { order: 3, action: 'Communique', howTo: 'Dis ton argent, demande le plan éco', why: 'La coordination évite les erreurs' }
        );
        break;
    }

    return {
      summary: this.getEconomySolutionSummary(type),
      steps,
      exercises,
      estimatedTimeToImprove: { minimum: 7, typical: 14, maximum: 30 },
      successCriteria: [
        {
          metric: 'Buy decision score',
          currentValue: 0,
          targetValue: 0,
          unit: 'score',
          measurementMethod: 'Compare dans les prochaines démos',
        },
      ],
    };
  }

  private createTimingSolution(type: string, context: InsightGeneratorContext): ActionableSolution {
    const exercises = findExercisesForWeakness(
      type,
      'timing',
      this.getDifficultyForRank(context.currentRank),
      5
    ).map((m) => m.exercise);

    const steps: SolutionStep[] = [];

    switch (type) {
      case 'trade':
        steps.push(
          { order: 1, action: 'Reste proche', howTo: 'Sois toujours à 2-3 secondes de tes coéquipiers', why: 'Permet de trade rapidement' },
          { order: 2, action: 'Écoute les callouts', howTo: 'Réagis immédiatement aux calls de contact', why: 'La réactivité sauve des rounds' },
          { order: 3, action: 'Pratique en retakes', howTo: 'Les serveurs retakes entraînent le trade', why: 'Crée le réflexe de trade' }
        );
        break;

      case 'peek':
        steps.push(
          { order: 1, action: 'Prefire les angles', howTo: 'Tire en arrivant sur l\'angle, pas après', why: 'Gagne du temps sur le duel' },
          { order: 2, action: 'Varie tes timings', howTo: 'Ne peek pas toujours au même moment', why: 'Deviens imprévisible' },
          { order: 3, action: 'Jiggle peek pour info', howTo: 'Peek court pour voir, pas pour kill', why: 'Réduis le risque' }
        );
        break;
    }

    return {
      summary: this.getTimingSolutionSummary(type),
      steps,
      exercises,
      estimatedTimeToImprove: { minimum: 14, typical: 28, maximum: 45 },
      successCriteria: [
        {
          metric: type === 'trade' ? 'Trade success rate' : 'Peek timing score',
          currentValue: 0,
          targetValue: 0,
          unit: type === 'trade' ? '%' : 'score',
          measurementMethod: 'Compare dans les prochaines démos',
        },
      ],
    };
  }

  private createDecisionSolution(type: string, context: InsightGeneratorContext): ActionableSolution {
    const exercises = findExercisesForWeakness(
      type,
      'decision',
      this.getDifficultyForRank(context.currentRank),
      5
    ).map((m) => m.exercise);

    const steps: SolutionStep[] = [];

    switch (type) {
      case 'clutch':
        steps.push(
          { order: 1, action: 'Gère le temps', howTo: 'Regarde toujours le timer en clutch', why: 'Le temps dicte tes options' },
          { order: 2, action: 'Joue l\'info', howTo: 'Utilise ce que tu sais sur les positions ennemies', why: 'L\'info guide les décisions' },
          { order: 3, action: 'Reste calme', howTo: 'Respire, ne précipite pas', why: 'La panique fait perdre des clutchs' },
          { order: 4, action: 'Analyse après', howTo: 'Regarde tes clutchs en démo', why: 'Apprends de tes erreurs' }
        );
        break;

      case 'opening':
        steps.push(
          { order: 1, action: 'Choisis tes duels', howTo: 'Ne prends pas de duels désavantageux', why: 'Les first kills doivent être favorables' },
          { order: 2, action: 'Utilise l\'utility', howTo: 'Flash avant de peek pour le first kill', why: 'L\'avantage de la flash gagne le duel' },
          { order: 3, action: 'Communique', howTo: 'Dis quand tu vas peek pour le first', why: 'L\'équipe peut te support' }
        );
        break;
    }

    return {
      summary: this.getDecisionSolutionSummary(type),
      steps,
      exercises,
      estimatedTimeToImprove: { minimum: 21, typical: 45, maximum: 90 },
      successCriteria: [
        {
          metric: type === 'clutch' ? 'Clutch win rate' : 'Opening duel win rate',
          currentValue: 0,
          targetValue: 0,
          unit: '%',
          measurementMethod: 'Compare dans les prochaines démos',
        },
      ],
    };
  }

  // Summary helpers
  private getAimSolutionSummary(type: string): string {
    const summaries: Record<string, string> = {
      headshot: 'Focus sur le crosshair placement à hauteur de tête et pratique en HS only',
      crosshair: 'Utilise les prefire maps et observe les pros pour améliorer ton placement',
      reaction: 'Entraîne tes réflexes avec Fast Aim Training et assure-toi d\'être reposé',
      spray: 'Maîtrise les patterns avec Recoil Master et applique en DM',
    };
    return summaries[type] || 'Améliore ton aim avec un entraînement ciblé';
  }

  private getPositioningSolutionSummary(type: string): string {
    const summaries: Record<string, string> = {
      isolated: 'Reste proche de tes coéquipiers pour permettre les trades',
      repeated: 'Varie tes positions et analyse tes morts récurrentes',
      map_control: 'Prends plus d\'information et utilise l\'utility pour contrôler la map',
    };
    return summaries[type] || 'Améliore ton positionnement';
  }

  private getUtilitySolutionSummary(type: string): string {
    const summaries: Record<string, string> = {
      flash: 'Apprends des pop flashes et coordonne avec ton équipe',
      unused: 'Lance tes utilités plus tôt et n\'achète que ce que tu utiliseras',
      usage: 'Achète plus de nades et apprends des lineups',
    };
    return summaries[type] || 'Améliore ton utilisation des utilités';
  }

  private getEconomySolutionSummary(type: string): string {
    const summaries: Record<string, string> = {
      buy: 'Apprends les loss bonus et synchronise tes achats avec l\'équipe',
      force: 'Discipline tes achats et respecte les décisions économiques de l\'équipe',
    };
    return summaries[type] || 'Améliore ta gestion économique';
  }

  private getTimingSolutionSummary(type: string): string {
    const summaries: Record<string, string> = {
      trade: 'Reste proche de tes coéquipiers et réagis rapidement aux contacts',
      peek: 'Prefire les angles et varie tes timings pour être imprévisible',
    };
    return summaries[type] || 'Améliore ton timing';
  }

  private getDecisionSolutionSummary(type: string): string {
    const summaries: Record<string, string> = {
      clutch: 'Gère le temps, utilise l\'information et reste calme sous pression',
      opening: 'Choisis tes duels et utilise l\'utility pour avoir l\'avantage',
    };
    return summaries[type] || 'Améliore ta prise de décision';
  }
}

// Export singleton instance
export const insightGenerator = new ActionableInsightGenerator();