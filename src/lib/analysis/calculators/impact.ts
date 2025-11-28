import { KillEvent, RoundInfo } from '@/lib/demo-parser/types';

/**
 * Calculate impact score based on meaningful kills
 */
export function calculateImpactScore(
  kills: KillEvent[],
  deaths: KillEvent[],
  rounds: RoundInfo[],
  playerSteamId: string
): number {
  if (rounds.length === 0) return 50;

  let impactPoints = 0;
  const totalRounds = rounds.length;

  // Group kills by round
  const killsByRound: Record<number, KillEvent[]> = {};
  for (const kill of kills) {
    if (!killsByRound[kill.round]) {
      killsByRound[kill.round] = [];
    }
    killsByRound[kill.round].push(kill);
  }

  for (const round of rounds) {
    const roundKills = killsByRound[round.roundNumber] || [];
    const playerKills = roundKills.filter((k) => k.attackerSteamId === playerSteamId);

    // Opening kill bonus
    if (roundKills.length > 0) {
      const firstKill = roundKills.sort((a, b) => a.tick - b.tick)[0];
      if (firstKill.attackerSteamId === playerSteamId) {
        impactPoints += 2; // Opening kill worth 2 points
      }
    }

    // Multi-kill bonus
    if (playerKills.length >= 3) {
      impactPoints += playerKills.length - 2; // Bonus for 3k, 4k, 5k
    }

    // Clutch potential (simplified)
    // Real clutch detection would need player alive status

    // Regular kill points
    impactPoints += playerKills.length;
  }

  // Normalize to 0-100 scale
  // Average impact per round should be around 1-1.5 points
  const avgImpactPerRound = impactPoints / totalRounds;
  const normalizedScore = Math.min(100, (avgImpactPerRound / 2) * 100);

  return Math.round(normalizedScore);
}

/**
 * Calculate trade success rate
 */
export function calculateTradeRate(
  allKills: KillEvent[],
  playerSteamId: string,
  playerTeam: number
): { tradesGiven: number; tradesTaken: number; tradeRate: number } {
  let tradesGiven = 0;
  let tradesTaken = 0;
  const tradeWindow = 128 * 3; // 3 seconds at 128 tick

  // Sort kills by tick
  const sortedKills = [...allKills].sort((a, b) => a.tick - b.tick);

  for (let i = 0; i < sortedKills.length; i++) {
    const kill = sortedKills[i];

    // If player died
    if (kill.victimSteamId === playerSteamId) {
      // Check if teammate traded
      const tradePossible = sortedKills.find(
        (k, j) =>
          j > i &&
          k.victimSteamId === kill.attackerSteamId &&
          k.tick - kill.tick < tradeWindow
      );

      if (tradePossible) {
        tradesTaken++;
      }
    }

    // If teammate died
    // Check if player traded
    if (kill.attackerSteamId !== playerSteamId && i < sortedKills.length - 1) {
      const nextKills = sortedKills.slice(i + 1);
      const tradedByPlayer = nextKills.find(
        (k) =>
          k.attackerSteamId === playerSteamId &&
          k.victimSteamId === kill.attackerSteamId &&
          k.tick - kill.tick < tradeWindow
      );

      if (tradedByPlayer) {
        tradesGiven++;
      }
    }
  }

  const totalTradeSituations = tradesGiven + tradesTaken;
  const tradeRate = totalTradeSituations > 0 ? tradesGiven / totalTradeSituations : 0.5;

  return { tradesGiven, tradesTaken, tradeRate };
}
