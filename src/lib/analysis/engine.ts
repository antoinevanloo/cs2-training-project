import { ParsedDemoData } from '../demo-parser/types';
import { AimAnalyzer } from './analyzers/aim';
import { PositioningAnalyzer } from './analyzers/positioning';
import { UtilityAnalyzer } from './analyzers/utility';
import { EconomyAnalyzer } from './analyzers/economy';
import { TimingAnalyzer } from './analyzers/timing';
import { DecisionAnalyzer } from './analyzers/decision';
import { calculateRating } from './calculators/rating';
import { calculateADR } from './calculators/adr';
import { AnalysisResult } from './types';

export class AnalysisEngine {
  private aimAnalyzer: AimAnalyzer;
  private positioningAnalyzer: PositioningAnalyzer;
  private utilityAnalyzer: UtilityAnalyzer;
  private economyAnalyzer: EconomyAnalyzer;
  private timingAnalyzer: TimingAnalyzer;
  private decisionAnalyzer: DecisionAnalyzer;

  constructor() {
    this.aimAnalyzer = new AimAnalyzer();
    this.positioningAnalyzer = new PositioningAnalyzer();
    this.utilityAnalyzer = new UtilityAnalyzer();
    this.economyAnalyzer = new EconomyAnalyzer();
    this.timingAnalyzer = new TimingAnalyzer();
    this.decisionAnalyzer = new DecisionAnalyzer();
  }

  async analyzeDemo(
    data: ParsedDemoData,
    mainPlayerSteamId: string
  ): Promise<AnalysisResult> {
    // Filter data for main player
    const playerKills = data.kills.filter(
      (k) => k.attackerSteamId === mainPlayerSteamId
    );
    const playerDeaths = data.kills.filter(
      (k) => k.victimSteamId === mainPlayerSteamId
    );
    const playerDamages = data.damages.filter(
      (d) => d.attackerSteamId === mainPlayerSteamId
    );
    const playerGrenades = data.grenades.filter(
      (g) => g.throwerSteamId === mainPlayerSteamId
    );

    // Calculate base stats
    const kills = playerKills.length;
    const deaths = playerDeaths.length;
    const assists = this.calculateAssists(data, mainPlayerSteamId);
    const headshots = playerKills.filter((k) => k.headshot).length;
    const hsPercentage = kills > 0 ? (headshots / kills) * 100 : 0;
    const totalRounds = data.rounds.length;
    const adr = calculateADR(playerDamages, totalRounds);
    const kast = this.calculateKAST(data, mainPlayerSteamId);
    const rating = calculateRating({
      kills,
      deaths,
      assists,
      adr,
      kast,
      totalRounds,
    });

    // Run specialized analyses
    const aimAnalysis = this.aimAnalyzer.analyze(
      playerKills,
      playerDamages,
      data.positions,
      mainPlayerSteamId
    );

    const positioningAnalysis = this.positioningAnalyzer.analyze(
      playerDeaths,
      data.positions,
      data.metadata.map,
      mainPlayerSteamId
    );

    const utilityAnalysis = this.utilityAnalyzer.analyze(
      playerGrenades,
      data.damages,
      data.kills,
      mainPlayerSteamId
    );

    const economyAnalysis = this.economyAnalyzer.analyze(
      data.economy,
      data.rounds,
      mainPlayerSteamId
    );

    const timingAnalysis = this.timingAnalyzer.analyze(
      data.kills,
      data.positions,
      mainPlayerSteamId
    );

    const decisionAnalysis = this.decisionAnalyzer.analyze(data, mainPlayerSteamId);

    // Calculate scores
    const aimScore = this.calculateScore(aimAnalysis);
    const positioningScore = this.calculateScore(positioningAnalysis);
    const utilityScore = this.calculateScore(utilityAnalysis);
    const economyScore = this.calculateScore(economyAnalysis);
    const timingScore = this.calculateScore(timingAnalysis);
    const decisionScore = this.calculateScore(decisionAnalysis);

    const overallScore = this.calculateOverallScore({
      aimScore,
      positioningScore,
      utilityScore,
      economyScore,
      timingScore,
      decisionScore,
    });

    // Identify strengths and weaknesses
    const { strengths, weaknesses } = this.identifyStrengthsWeaknesses({
      aimScore,
      positioningScore,
      utilityScore,
      economyScore,
      timingScore,
      decisionScore,
      aimAnalysis,
      positioningAnalysis,
      utilityAnalysis,
      economyAnalysis,
      timingAnalysis,
      decisionAnalysis,
    });

    return {
      playerStats: {
        kills,
        deaths,
        assists,
        headshots,
        hsPercentage,
        adr,
        kast,
        rating,
      },
      scores: {
        overall: overallScore,
        aim: aimScore,
        positioning: positioningScore,
        utility: utilityScore,
        economy: economyScore,
        timing: timingScore,
        decision: decisionScore,
      },
      analyses: {
        aim: aimAnalysis,
        positioning: positioningAnalysis,
        utility: utilityAnalysis,
        economy: economyAnalysis,
        timing: timingAnalysis,
        decision: decisionAnalysis,
      },
      strengths,
      weaknesses,
    };
  }

  private calculateAssists(data: ParsedDemoData, playerSteamId: string): number {
    let assists = 0;
    const tickrate = data.metadata.tickrate || 64;
    const assistWindow = tickrate * 5;

    for (const kill of data.kills) {
      if (kill.attackerSteamId === playerSteamId) continue;

      const recentDamage = data.damages.find(
        (d) =>
          d.attackerSteamId === playerSteamId &&
          d.victimSteamId === kill.victimSteamId &&
          d.round === kill.round &&
          kill.tick - d.tick < assistWindow &&
          kill.tick - d.tick >= 0
      );

      if (recentDamage) {
        assists++;
      }
    }

    return assists;
  }

  private calculateKAST(data: ParsedDemoData, playerSteamId: string): number {
    let kastRounds = 0;

    for (const round of data.rounds) {
      const roundKills = data.kills.filter((k) => k.round === round.roundNumber);

      const hasKill = roundKills.some((k) => k.attackerSteamId === playerSteamId);
      const survived = !roundKills.some((k) => k.victimSteamId === playerSteamId);
      const traded = this.wasTraded(roundKills, playerSteamId);

      if (hasKill || survived || traded) {
        kastRounds++;
      }
    }

    return data.rounds.length > 0 ? (kastRounds / data.rounds.length) * 100 : 0;
  }

  private wasTraded(kills: any[], playerSteamId: string): boolean {
    const playerDeath = kills.find((k) => k.victimSteamId === playerSteamId);
    if (!playerDeath) return false;

    return kills.some(
      (k) =>
        k.victimSteamId === playerDeath.attackerSteamId &&
        k.tick > playerDeath.tick &&
        k.tick - playerDeath.tick < 128 * 3
    );
  }

  private calculateScore(analysis: any): number {
    if (!analysis || !analysis.metrics) return 50;

    const metrics = Object.values(analysis.metrics) as number[];
    if (metrics.length === 0) return 50;

    const sum = metrics.reduce((a, b) => a + b, 0);
    return Math.min(100, Math.max(0, Math.round(sum / metrics.length)));
  }

  private calculateOverallScore(scores: Record<string, number>): number {
    const weights = {
      aimScore: 0.25,
      positioningScore: 0.2,
      utilityScore: 0.15,
      economyScore: 0.1,
      timingScore: 0.15,
      decisionScore: 0.15,
    };

    let weighted = 0;
    for (const [key, weight] of Object.entries(weights)) {
      weighted += (scores[key] || 50) * weight;
    }

    return Math.round(weighted);
  }

  private identifyStrengthsWeaknesses(data: any): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const scoreLabels: Record<string, string> = {
      aimScore: 'Aim et précision',
      positioningScore: 'Positionnement',
      utilityScore: 'Utilisation des grenades',
      economyScore: 'Gestion économique',
      timingScore: 'Timing et réactivité',
      decisionScore: 'Prise de décision',
    };

    for (const [key, label] of Object.entries(scoreLabels)) {
      const score = data[key];
      if (score >= 70) {
        strengths.push(label);
      } else if (score <= 40) {
        weaknesses.push(label);
      }
    }

    return { strengths, weaknesses };
  }
}

export const analysisEngine = new AnalysisEngine();
