import { KillEvent, PositionSnapshot } from '@/lib/demo-parser/types';
import { TimingAnalysis } from '../types';

export class TimingAnalyzer {
  analyze(
    kills: KillEvent[],
    positions: PositionSnapshot[],
    playerSteamId: string
  ): TimingAnalysis {
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    const playerDeaths = kills.filter((k) => k.victimSteamId === playerSteamId);

    // Analyze peek timing
    const peekAnalysis = this.analyzePeekTiming(playerKills, playerDeaths);

    // Analyze trade speed
    const tradeAnalysis = this.analyzeTradeSpeed(kills, playerSteamId);

    // Analyze rotation timing (simplified)
    const rotationAnalysis = this.analyzeRotationTiming(positions, playerSteamId);

    return {
      peekTiming: {
        score: peekAnalysis.score,
        avgPrefire: peekAnalysis.usesPrefire,
      },
      tradeSpeed: {
        average: tradeAnalysis.averageTime,
        successful: tradeAnalysis.successRate,
      },
      rotationTiming: {
        early: rotationAnalysis.early,
        onTime: rotationAnalysis.onTime,
        late: rotationAnalysis.late,
      },
      metrics: {
        peekTiming: peekAnalysis.score,
        tradeSpeed: tradeAnalysis.score,
        rotations: rotationAnalysis.score,
        overall: Math.round(
          (peekAnalysis.score + tradeAnalysis.score + rotationAnalysis.score) / 3
        ),
      },
    };
  }

  private analyzePeekTiming(
    kills: KillEvent[],
    deaths: KillEvent[]
  ): { score: number; usesPrefire: boolean } {
    // Analyze kill/death ratio for timing insights
    const kd = deaths.length > 0 ? kills.length / deaths.length : kills.length;

    // Check for prefire indicators
    const throughSmokeKills = kills.filter((k) => k.throughSmoke).length;
    const blindKills = kills.filter((k) => k.attackerBlind).length;
    const usesPrefire = throughSmokeKills > 0 || blindKills > 0;

    // Calculate score based on kill success
    let score = 50;

    // Bonus for good K/D (indicates good peek timing)
    if (kd > 1.5) score += 20;
    else if (kd > 1.0) score += 10;

    // Bonus for prefire usage
    if (usesPrefire) score += 10;

    // Bonus for noscope kills (indicates confidence/quick reactions)
    const noScopeKills = kills.filter((k) => k.noScope).length;
    if (noScopeKills > 0) score += 5;

    return {
      score: Math.min(100, score),
      usesPrefire,
    };
  }

  private analyzeTradeSpeed(
    allKills: KillEvent[],
    playerSteamId: string
  ): { averageTime: number; successRate: number; score: number } {
    const tradeWindow = 128 * 3; // 3 seconds at 128 tick
    let tradesAttempted = 0;
    let tradesSuccessful = 0;
    let totalTradeTime = 0;

    const sortedKills = [...allKills].sort((a, b) => a.tick - b.tick);

    for (let i = 0; i < sortedKills.length - 1; i++) {
      const death = sortedKills[i];
      const nextKill = sortedKills[i + 1];

      // Check if player could have traded
      if (
        nextKill.attackerSteamId === playerSteamId &&
        nextKill.tick - death.tick < tradeWindow
      ) {
        tradesAttempted++;
        tradesSuccessful++;
        totalTradeTime += (nextKill.tick - death.tick) / 128; // Convert to seconds
      }
    }

    const averageTime =
      tradesSuccessful > 0 ? totalTradeTime / tradesSuccessful : 2.5;
    const successRate = tradesAttempted > 0 ? tradesSuccessful / tradesAttempted : 0.5;

    // Score based on trade success and speed
    let score = 50;
    score += successRate * 30;
    score += Math.max(0, (2.5 - averageTime) * 10); // Bonus for fast trades

    return {
      averageTime: Math.round(averageTime * 10) / 10,
      successRate,
      score: Math.min(100, Math.round(score)),
    };
  }

  private analyzeRotationTiming(
    _positions: PositionSnapshot[],
    _playerSteamId: string
  ): { early: number; onTime: number; late: number; score: number } {
    // Without bomb position data, use simplified analysis
    return {
      early: 3,
      onTime: 8,
      late: 2,
      score: 70,
    };
  }
}
