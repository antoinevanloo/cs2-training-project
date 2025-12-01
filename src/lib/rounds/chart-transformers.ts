/**
 * Transformateurs de donnees pour les charts
 * Convertit les donnees de rounds en formats utilisables par les composants chart
 */

import type { Round, RoundEvent } from '@/types/rounds';

// Types pour EconomyFlow chart
export interface RoundEconomy {
  roundNumber: number;
  startMoney: number;
  spent: number;
  remaining: number;
  earned: number;
  endMoney: number;
  buyType: 'full' | 'force' | 'eco' | 'save' | 'pistol' | 'half';
  equipmentValue: number;
  isWin: boolean;
  teamBuySync: boolean;
  isGoodDecision: boolean;
}

// Types pour TradeTimeline chart
export interface KillEvent {
  tick: number;
  timestamp: number;
  attackerSteamId: string;
  attackerName: string;
  attackerTeam: number;
  victimSteamId: string;
  victimName: string;
  victimTeam: number;
  weapon: string;
  isHeadshot: boolean;
}

export interface TradeEvent {
  originalKill: KillEvent;
  tradeKill: KillEvent;
  tradeTime: number;
  isSuccessful: boolean;
}

// Seuils d'argent CS2
const MONEY_THRESHOLDS = {
  fullBuy: 4750,
  forceBuy: 3000,
  halfBuy: 2000,
};

// Gains de round CS2
const ROUND_REWARDS = {
  win: 3250,
  loss: {
    base: 1400,
    increment: 500,
    max: 3400,
  },
};

/**
 * Determine le type d'achat en fonction de l'argent et de l'equipement
 */
function determineBuyType(
  roundNumber: number,
  money: number,
  equipment: number
): RoundEconomy['buyType'] {
  // Rounds pistol
  if (roundNumber === 1 || roundNumber === 13) {
    return 'pistol';
  }

  // Full buy: equipement au-dessus du seuil full buy
  if (equipment >= MONEY_THRESHOLDS.fullBuy) {
    return 'full';
  }

  // Save: beaucoup d'argent mais peu d'equipement
  if (money > MONEY_THRESHOLDS.fullBuy && equipment < MONEY_THRESHOLDS.halfBuy) {
    return 'save';
  }

  // Force buy
  if (equipment >= MONEY_THRESHOLDS.forceBuy) {
    return 'force';
  }

  // Half buy
  if (equipment >= MONEY_THRESHOLDS.halfBuy) {
    return 'half';
  }

  // Eco par defaut
  return 'eco';
}

/**
 * Estime les gains d'un round
 */
function estimateRoundEarnings(isWin: boolean, lossStreak: number): number {
  if (isWin) {
    return ROUND_REWARDS.win;
  }

  const lossBonus = Math.min(
    lossStreak * ROUND_REWARDS.loss.increment,
    ROUND_REWARDS.loss.max - ROUND_REWARDS.loss.base
  );

  return ROUND_REWARDS.loss.base + lossBonus;
}

/**
 * Transforme les rounds en donnees pour le chart EconomyFlow
 */
export function transformRoundsToEconomy(
  rounds: Round[],
  mainPlayerTeam: number
): RoundEconomy[] {
  let lossStreak = 0;

  return rounds.map((round) => {
    const money = mainPlayerTeam === 1 ? round.team1Money : round.team2Money;
    const equipment = mainPlayerTeam === 1 ? round.team1Equipment : round.team2Equipment;
    const isWin = round.winnerTeam === mainPlayerTeam;

    // Mise a jour du loss streak
    if (!isWin) {
      lossStreak++;
    } else {
      lossStreak = 0;
    }

    const buyType = determineBuyType(round.roundNumber, money, equipment);
    const spent = Math.min(equipment, money); // On ne peut pas depenser plus que ce qu'on a
    const remaining = Math.max(0, money - spent);
    const earned = estimateRoundEarnings(isWin, lossStreak);

    // Verification decision d'achat
    const isGoodDecision = !(money > MONEY_THRESHOLDS.fullBuy && buyType === 'eco');

    return {
      roundNumber: round.roundNumber,
      startMoney: money,
      spent,
      remaining,
      earned,
      endMoney: remaining + earned,
      buyType,
      equipmentValue: equipment,
      isWin,
      teamBuySync: true, // Non determinable avec les donnees actuelles
      isGoodDecision,
    };
  });
}

/**
 * Extrait les evenements de kill des rounds
 */
export function extractKillEvents(
  rounds: Round[],
  playerStats: Array<{ steamId: string; playerName: string; teamNumber: number }>
): KillEvent[] {
  const playerMap = new Map(
    playerStats.map((p) => [p.steamId, { name: p.playerName, team: p.teamNumber }])
  );

  const kills: KillEvent[] = [];

  rounds.forEach((round) => {
    round.events
      .filter((e): e is RoundEvent & { type: 'kill' } => e.type === 'kill')
      .forEach((event) => {
        if (!event.attackerSteamId || !event.victimSteamId) return;

        const attacker = playerMap.get(event.attackerSteamId);
        const victim = playerMap.get(event.victimSteamId);

        if (!attacker || !victim) return;

        kills.push({
          tick: event.tick || 0,
          timestamp: event.timestamp || 0,
          attackerSteamId: event.attackerSteamId,
          attackerName: attacker.name,
          attackerTeam: attacker.team,
          victimSteamId: event.victimSteamId,
          victimName: victim.name,
          victimTeam: victim.team,
          weapon: event.weapon || 'unknown',
          isHeadshot: event.headshot || false,
        });
      });
  });

  return kills;
}

/**
 * Detecte les trades a partir des kills
 * Un trade est un kill qui venge un coequipier mort dans les X secondes
 */
export function detectTrades(
  kills: KillEvent[],
  maxTradeTime: number = 5
): TradeEvent[] {
  const trades: TradeEvent[] = [];

  // Grouper les kills par round (approximativement par timestamp gaps)
  for (let i = 1; i < kills.length; i++) {
    const currentKill = kills[i];
    const previousKill = kills[i - 1];

    // Verifier si c'est un trade potentiel
    const timeDiff = currentKill.timestamp - previousKill.timestamp;

    if (timeDiff > 0 && timeDiff <= maxTradeTime) {
      // Verifier si le kill actuel venge la victime precedente
      // (le tueur actuel est de la meme equipe que la victime precedente)
      // et la nouvelle victime est de la meme equipe que le tueur precedent
      if (
        currentKill.attackerTeam === previousKill.victimTeam &&
        currentKill.victimTeam === previousKill.attackerTeam
      ) {
        trades.push({
          originalKill: previousKill,
          tradeKill: currentKill,
          tradeTime: timeDiff,
          isSuccessful: true,
        });
      }
    }
  }

  return trades;
}

// Types pour MovementOverlay (requiert des donnees detaillees du parser)
export interface ShotEvent {
  tick: number;
  timestamp: number;
  position: { x: number; y: number; z: number };
  velocity: number;
  isMoving: boolean;
  isCounterStrafed: boolean;
  counterStrafeQuality: 'perfect' | 'good' | 'poor' | 'none';
  isCrouching: boolean;
  isScoped: boolean;
  isJumping: boolean;
  weapon: string;
  isHit: boolean;
  isHeadshot: boolean;
  isKill: boolean;
}

/**
 * Type pour les donnees de chart destinees au composant client
 */
export interface ChartData {
  economyRounds: RoundEconomy[];
  trades: TradeEvent[];
  kills: KillEvent[];
  playerSteamId: string;
  playerTeam: number;
  // Movement data (optionnel - requiert parsing avancé)
  shots?: ShotEvent[];
  mapName?: string;
}

/**
 * Prepare toutes les donnees de chart a partir des rounds
 * Fonction principale a utiliser dans le Server Component
 */
export function prepareChartData(
  rounds: Round[],
  mainPlayerSteamId: string,
  mainPlayerTeam: number,
  playerStats: Array<{ steamId: string; playerName: string; teamNumber: number }>
): ChartData {
  const economyRounds = transformRoundsToEconomy(rounds, mainPlayerTeam);
  const kills = extractKillEvents(rounds, playerStats);
  const trades = detectTrades(kills);

  return {
    economyRounds,
    trades,
    kills,
    playerSteamId: mainPlayerSteamId,
    playerTeam: mainPlayerTeam,
  };
}