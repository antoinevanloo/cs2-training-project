import { ParsedDemoData, KillEvent } from '@/lib/demo-parser/types';
import { DecisionAnalysis } from '../types';

export class DecisionAnalyzer {
  analyze(data: ParsedDemoData, playerSteamId: string): DecisionAnalysis {
    const kills = data.kills;
    const rounds = data.rounds;

    // Analyze clutch performance
    const clutchAnalysis = this.analyzeClutchPerformance(kills, rounds, playerSteamId);

    // Analyze retake decisions
    const retakeAnalysis = this.analyzeRetakeDecisions(kills, rounds, playerSteamId);

    // Determine aggression level
    const aggressionLevel = this.determineAggressionLevel(kills, playerSteamId);

    // Analyze risk taking
    const riskAnalysis = this.analyzeRiskTaking(kills, playerSteamId);

    return {
      clutchPerformance: {
        attempts: clutchAnalysis.attempts,
        won: clutchAnalysis.won,
        score: clutchAnalysis.score,
      },
      retakeDecisions: {
        correct: retakeAnalysis.correct,
        incorrect: retakeAnalysis.incorrect,
      },
      aggressionLevel,
      riskTaking: {
        calculated: riskAnalysis.calculated,
        reckless: riskAnalysis.reckless,
      },
      metrics: {
        clutch: clutchAnalysis.score,
        retakes: retakeAnalysis.score,
        aggression: aggressionLevel === 'balanced' ? 80 : 60,
        riskManagement: riskAnalysis.score,
        overall: Math.round(
          (clutchAnalysis.score + retakeAnalysis.score + riskAnalysis.score) / 3
        ),
      },
    };
  }

  private analyzeClutchPerformance(
    kills: KillEvent[],
    rounds: any[],
    playerSteamId: string
  ): { attempts: number; won: number; score: number } {
    // Simplified clutch detection
    // Real implementation would need player alive status per tick

    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);

    // Look for multi-kills at end of rounds (potential clutches)
    let clutchAttempts = 0;
    let clutchWins = 0;

    // Group kills by round
    const killsByRound: Record<number, KillEvent[]> = {};
    for (const kill of playerKills) {
      if (!killsByRound[kill.round]) {
        killsByRound[kill.round] = [];
      }
      killsByRound[kill.round].push(kill);
    }

    // Check for rounds with 2+ kills (potential clutches)
    for (const round in killsByRound) {
      const roundKills = killsByRound[round];
      if (roundKills.length >= 2) {
        clutchAttempts++;
        // Assume won if got multiple kills
        if (roundKills.length >= 2) {
          clutchWins++;
        }
      }
    }

    const successRate = clutchAttempts > 0 ? clutchWins / clutchAttempts : 0.5;
    const score = Math.round(50 + successRate * 50);

    return {
      attempts: clutchAttempts,
      won: clutchWins,
      score,
    };
  }

  private analyzeRetakeDecisions(
    kills: KillEvent[],
    rounds: any[],
    playerSteamId: string
  ): { correct: number; incorrect: number; score: number } {
    // Simplified retake analysis
    // Real implementation would need bomb plant events

    const totalRounds = rounds.length;
    const ctRounds = Math.floor(totalRounds / 2);

    // Estimate retake decisions
    const estimatedRetakes = Math.round(ctRounds * 0.4); // ~40% of CT rounds have retakes
    const correct = Math.round(estimatedRetakes * 0.7);
    const incorrect = estimatedRetakes - correct;

    return {
      correct,
      incorrect,
      score: 70,
    };
  }

  private determineAggressionLevel(
    kills: KillEvent[],
    playerSteamId: string
  ): 'passive' | 'balanced' | 'aggressive' {
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    const playerDeaths = kills.filter((k) => k.victimSteamId === playerSteamId);

    // Calculate aggression indicators
    const entryKills = this.countEntryKills(kills, playerSteamId);
    const totalKills = playerKills.length;
    const entryRatio = totalKills > 0 ? entryKills / totalKills : 0;

    // Check through-smoke and flash-through kills (aggressive plays)
    const aggressiveKills = playerKills.filter(
      (k) => k.throughSmoke || k.attackerBlind
    ).length;
    const aggressiveRatio = totalKills > 0 ? aggressiveKills / totalKills : 0;

    // K/D ratio
    const kd = playerDeaths.length > 0 ? totalKills / playerDeaths.length : totalKills;

    if (entryRatio > 0.3 || aggressiveRatio > 0.2) {
      return kd > 1.0 ? 'aggressive' : 'balanced';
    } else if (entryRatio < 0.1 && kd > 1.2) {
      return 'passive';
    }

    return 'balanced';
  }

  private countEntryKills(kills: KillEvent[], playerSteamId: string): number {
    // Group by round and find first kills
    const killsByRound: Record<number, KillEvent[]> = {};
    for (const kill of kills) {
      if (!killsByRound[kill.round]) {
        killsByRound[kill.round] = [];
      }
      killsByRound[kill.round].push(kill);
    }

    let entryKills = 0;
    for (const round in killsByRound) {
      const roundKills = killsByRound[round].sort((a, b) => a.tick - b.tick);
      if (roundKills.length > 0 && roundKills[0].attackerSteamId === playerSteamId) {
        entryKills++;
      }
    }

    return entryKills;
  }

  private analyzeRiskTaking(
    kills: KillEvent[],
    playerSteamId: string
  ): { calculated: number; reckless: number; score: number } {
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    const playerDeaths = kills.filter((k) => k.victimSteamId === playerSteamId);

    // Reckless indicators
    const blindKills = playerKills.filter((k) => k.attackerBlind).length;
    const throughSmokeDeaths = playerDeaths.filter((k) => k.throughSmoke).length;

    // Calculated risk indicators
    const headshotKills = playerKills.filter((k) => k.headshot).length;
    const wallbangKills = playerKills.filter((k) => k.penetrated).length;

    const totalActions = playerKills.length + playerDeaths.length;
    if (totalActions === 0) {
      return { calculated: 5, reckless: 2, score: 70 };
    }

    const recklessRatio = (blindKills + throughSmokeDeaths) / totalActions;
    const calculatedRatio = (headshotKills + wallbangKills) / totalActions;

    const calculated = Math.round(playerKills.length * calculatedRatio);
    const reckless = Math.round(totalActions * recklessRatio);

    const score = Math.round(70 - reckless * 5 + calculated * 2);

    return {
      calculated,
      reckless,
      score: Math.max(30, Math.min(100, score)),
    };
  }
}
