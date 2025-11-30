/**
 * Utilitaires pour l'analyse des rounds CS2
 * Fonctions reutilisables pour les calculs de stats round par round
 */

import type { Round, PlayerRoundStats, HalfStats } from '@/types/rounds';

/**
 * Calcule les stats d'un joueur pour un round specifique
 */
export function getPlayerRoundStats(
  round: Round,
  playerSteamId: string
): PlayerRoundStats {
  const kills = round.events.filter(
    (e) => e.type === 'kill' && e.attackerSteamId === playerSteamId
  ).length;

  const deaths = round.events.filter(
    (e) => e.type === 'kill' && e.victimSteamId === playerSteamId
  ).length;

  const assists = round.events.filter(
    (e) =>
      (e.type === 'assist' || e.type === 'flash_assist') &&
      e.attackerSteamId === playerSteamId
  ).length;

  return { kills, deaths, assists };
}

/**
 * Determine si le joueur a gagne le round
 */
export function isRoundWin(round: Round, playerTeam: number): boolean {
  return round.winnerTeam === playerTeam;
}

/**
 * Calcule les stats pour une moitie de match
 */
export function getHalfStats(
  rounds: Round[],
  playerSteamId: string,
  playerTeam: number
): HalfStats {
  const wins = rounds.filter((r) => isRoundWin(r, playerTeam)).length;

  const kills = rounds.reduce(
    (sum, r) => sum + getPlayerRoundStats(r, playerSteamId).kills,
    0
  );

  const deaths = rounds.reduce(
    (sum, r) => sum + getPlayerRoundStats(r, playerSteamId).deaths,
    0
  );

  return {
    wins,
    losses: rounds.length - wins,
    kills,
    deaths,
  };
}

/**
 * Separe les rounds en premiere et deuxieme moitie
 */
export function splitRoundsByHalf(rounds: Round[]): {
  firstHalf: Round[];
  secondHalf: Round[];
  halfPoint: number;
} {
  const halfPoint = Math.ceil(rounds.length / 2);
  return {
    firstHalf: rounds.slice(0, halfPoint),
    secondHalf: rounds.slice(halfPoint),
    halfPoint,
  };
}

/**
 * Identifie les rounds problematiques (mort sans impact et defaite)
 */
export function getProblematicRounds(
  rounds: Round[],
  playerSteamId: string,
  playerTeam: number
): Round[] {
  return rounds.filter((r) => {
    const stats = getPlayerRoundStats(r, playerSteamId);
    return stats.deaths > 0 && stats.kills === 0 && !isRoundWin(r, playerTeam);
  });
}

/**
 * Calcule le K/D ratio
 */
export function calculateKDRatio(kills: number, deaths: number): string {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
}

/**
 * Formate la duree d'un round en mm:ss
 */
export function formatRoundDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
