import { EconomySnapshot, RoundInfo } from '@/lib/demo-parser/types';
import { EconomyAnalysis } from '../types';

export class EconomyAnalyzer {
  analyze(
    economy: EconomySnapshot[],
    rounds: RoundInfo[],
    playerSteamId: string
  ): EconomyAnalysis {
    // Without detailed per-player economy data, we estimate based on round patterns
    const totalRounds = rounds.length;

    // Estimate buy/save decisions based on round outcomes
    const buyDecisions = this.estimateBuyDecisions(rounds);
    const saveAnalysis = this.analyzeSaveRounds(rounds);

    // Calculate economy score
    const economyScore = this.calculateEconomyScore(buyDecisions, saveAnalysis);

    return {
      buyDecisions: {
        correct: buyDecisions.correct,
        incorrect: buyDecisions.incorrect,
        score: buyDecisions.score,
      },
      saveRounds: {
        appropriate: saveAnalysis.appropriate,
        inappropriate: saveAnalysis.inappropriate,
      },
      impactOnTeam: {
        positiveRounds: Math.round(totalRounds * 0.6),
        negativeRounds: Math.round(totalRounds * 0.1),
      },
      avgMoneyAtDeath: 2400, // Default estimate
      metrics: {
        buyDecisions: buyDecisions.score,
        saveDecisions: saveAnalysis.score,
        teamImpact: 70,
        overall: economyScore,
      },
    };
  }

  private estimateBuyDecisions(rounds: RoundInfo[]): {
    correct: number;
    incorrect: number;
    score: number;
  } {
    // Without detailed economy data, estimate based on round patterns
    // Assume player makes mostly correct decisions
    const totalRounds = rounds.length;

    // Estimate 80% correct decisions as baseline
    const correctRate = 0.8;
    const correct = Math.round(totalRounds * correctRate);
    const incorrect = totalRounds - correct;

    return {
      correct,
      incorrect,
      score: Math.round(correctRate * 100),
    };
  }

  private analyzeSaveRounds(rounds: RoundInfo[]): {
    appropriate: number;
    inappropriate: number;
    score: number;
  } {
    // Identify potential save rounds (after losses, before half)
    let appropriateSaves = 0;
    let inappropriateSaves = 0;

    for (let i = 1; i < rounds.length; i++) {
      const prevRound = rounds[i - 1];
      const currentRound = rounds[i];

      // After a loss, next round might be a save
      // Half time is round 12/13
      const isHalfTime = i === 12 || i === 13;
      const afterLoss = i > 1 && rounds[i - 2]?.winner !== rounds[i - 1]?.winner;

      if (afterLoss || isHalfTime) {
        appropriateSaves++;
      }
    }

    return {
      appropriate: appropriateSaves,
      inappropriate: inappropriateSaves,
      score: appropriateSaves > 0 ? 80 : 60,
    };
  }

  private calculateEconomyScore(
    buyDecisions: { score: number },
    saveAnalysis: { score: number }
  ): number {
    return Math.round((buyDecisions.score + saveAnalysis.score) / 2);
  }
}
