/**
 * Teamplay Analyzer - Analyse du jeu d'équipe
 *
 * Analyse les aspects de teamplay en CS2:
 * - Trading (refrag des coéquipiers)
 * - Support (flash assists, smoke support)
 * - Coordination (synchronisation, executes)
 * - Entrying (ouverture de sites)
 * - Anchoring (tenue de positions)
 * - Clutch (situations 1vX)
 *
 * Le teamplay différencie les joueurs solo des joueurs d'équipe.
 */

import {
  KillEventV2,
  DamageEventV2,
  GrenadeEventV2,
  PlayerBlindEvent,
  TradeEvent,
  EntryDuel,
  ClutchSituation,
  RoundInfoV2,
  ticksToSeconds,
  TRADE_THRESHOLDS,
} from '@/lib/demo-parser/types-v2';
import { TeamplayAnalysis } from '../types-v2';

// Configuration des seuils
const CONFIG = {
  // Trade timing
  TRADE_INSTANT: 1.0,
  TRADE_FAST: 2.0,
  TRADE_NORMAL: 3.0,
  TRADE_SLOW: 5.0,

  // Support
  FLASH_ASSIST_WINDOW: 384, // 3 secondes
  SMOKE_SUPPORT_WINDOW: 2304, // 18 secondes (durée smoke)

  // Coordination
  SYNC_PEEK_WINDOW: 32, // 0.25 secondes
  EXECUTE_WINDOW: 256, // 2 secondes

  // Entry
  ENTRY_WINDOW: 128, // 1 seconde après contact

  // Anchor
  DELAY_TIME_MIN: 10, // secondes
};

/**
 * Classe principale d'analyse du teamplay
 */
export class TeamplayAnalyzer {
  /**
   * Analyse complète du teamplay d'un joueur
   */
  analyze(
    kills: KillEventV2[],
    damages: DamageEventV2[],
    grenades: GrenadeEventV2[],
    playerBlinds: PlayerBlindEvent[],
    trades: TradeEvent[],
    entryDuels: EntryDuel[],
    clutches: ClutchSituation[],
    rounds: RoundInfoV2[],
    playerSteamId: string,
    playerTeam: number
  ): TeamplayAnalysis {
    // Analyses spécifiques
    const tradingAnalysis = this.analyzeTrading(
      trades,
      kills,
      playerSteamId
    );

    const supportAnalysis = this.analyzeSupport(
      kills,
      grenades,
      playerBlinds,
      playerSteamId
    );

    const coordinationAnalysis = this.analyzeCoordination(
      kills,
      damages,
      grenades,
      rounds,
      playerSteamId
    );

    const entryingAnalysis = this.analyzeEntrying(
      entryDuels,
      kills,
      playerSteamId
    );

    const anchorAnalysis = this.analyzeAnchor(
      kills,
      rounds,
      playerSteamId,
      playerTeam
    );

    const clutchAnalysis = this.analyzeClutch(
      clutches,
      kills,
      playerSteamId
    );

    // Score global
    const overallScore = this.calculateOverallScore(
      tradingAnalysis,
      supportAnalysis,
      coordinationAnalysis,
      entryingAnalysis,
      anchorAnalysis,
      clutchAnalysis
    );

    // Métriques agrégées
    const metrics = this.buildMetrics(
      tradingAnalysis,
      supportAnalysis,
      coordinationAnalysis,
      entryingAnalysis,
      anchorAnalysis,
      clutchAnalysis
    );

    return {
      trading: tradingAnalysis,
      support: supportAnalysis,
      coordination: coordinationAnalysis,
      entrying: entryingAnalysis,
      anchor: anchorAnalysis,
      clutch: clutchAnalysis,
      overallScore,
      metrics,
    };
  }

  /**
   * Analyse du trading (refrag)
   */
  private analyzeTrading(
    trades: TradeEvent[],
    kills: KillEventV2[],
    playerSteamId: string
  ): TeamplayAnalysis['trading'] {
    // Trades donnés par le joueur (il a refrag)
    const tradesGiven = trades.filter(
      (t) => t.traderId === playerSteamId
    );

    // Trades reçus (le joueur a été trade après sa mort)
    const tradesReceived = trades.filter(
      (t) => t.originalVictimId === playerSteamId
    );

    // Trades manqués (le joueur aurait pu trade mais ne l'a pas fait)
    // Approximation: morts de coéquipiers sans trade dans la fenêtre
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    const playerDeaths = kills.filter((k) => k.victimSteamId === playerSteamId);

    let missedTrades = 0;

    // Classifier les trades par vitesse
    let instantTrades = 0;
    let fastTrades = 0;
    let slowTrades = 0;
    let totalTradeTime = 0;

    for (const trade of tradesGiven) {
      totalTradeTime += trade.timeToTrade;

      if (trade.timeToTrade <= CONFIG.TRADE_INSTANT) {
        instantTrades++;
      } else if (trade.timeToTrade <= CONFIG.TRADE_FAST) {
        fastTrades++;
      } else if (trade.timeToTrade > CONFIG.TRADE_NORMAL) {
        slowTrades++;
      }
    }

    // Calculer le taux de trading
    const potentialTrades = tradesGiven.length + missedTrades;
    const tradingRate = potentialTrades > 0 ? tradesGiven.length / potentialTrades : 0.5;

    // Temps moyen de trade
    const avgTradeTime = tradesGiven.length > 0
      ? totalTradeTime / tradesGiven.length
      : 2.5;

    // Score
    let score = 50;

    // Bonus pour trades donnés
    score += tradesGiven.length * 3;

    // Bonus pour trades rapides
    score += instantTrades * 5;
    score += fastTrades * 2;

    // Penalty pour trades lents
    score -= slowTrades * 2;

    // Bonus pour taux de trading élevé
    score += tradingRate * 20;

    // Bonus si le joueur est souvent trade (joue en position tradeable)
    if (playerDeaths.length > 0) {
      const tradedRate = tradesReceived.length / playerDeaths.length;
      score += tradedRate * 10;
    }

    return {
      tradesGiven: tradesGiven.length,
      tradesReceived: tradesReceived.length,
      tradingRate,
      avgTradeTime,
      instantTrades,
      missedTrades,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse du support (flash assists, smoke support)
   */
  private analyzeSupport(
    kills: KillEventV2[],
    grenades: GrenadeEventV2[],
    playerBlinds: PlayerBlindEvent[],
    playerSteamId: string
  ): TeamplayAnalysis['support'] {
    const playerFlashes = grenades.filter(
      (g) => g.type === 'flash' && g.throwerSteamId === playerSteamId
    );
    const playerSmokes = grenades.filter(
      (g) => g.type === 'smoke' && g.throwerSteamId === playerSteamId
    );

    // Flash assists: ennemis flashés par le joueur suivis d'un kill d'équipe
    let flashAssists = 0;

    // Trouver les blinds causés par les flashs du joueur
    const playerCausedBlinds = playerBlinds.filter(
      (b) => b.attackerSteamId === playerSteamId
    );

    for (const blind of playerCausedBlinds) {
      // Chercher si un coéquipier a tué la personne flashée
      const killOnBlinded = kills.find(
        (k) =>
          k.victimSteamId === blind.victimSteamId &&
          k.attackerSteamId !== playerSteamId &&
          k.round === blind.round &&
          k.tick > blind.tick &&
          k.tick < blind.tick + CONFIG.FLASH_ASSIST_WINDOW
      );

      if (killOnBlinded) {
        flashAssists++;
      }
    }

    // Smoke support: smokes suivis de kills d'équipe
    let smokeSupport = 0;

    for (const smoke of playerSmokes) {
      const teamKillDuringSmoke = kills.find(
        (k) =>
          k.attackerSteamId !== playerSteamId &&
          k.round === smoke.round &&
          k.tick > smoke.tick &&
          k.tick < smoke.tick + CONFIG.SMOKE_SUPPORT_WINDOW
      );

      if (teamKillDuringSmoke) {
        smokeSupport++;
      }
    }

    // Refrag support: kills sur quelqu'un qui vient de tuer un coéquipier
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    let refragSupport = 0;

    for (const kill of playerKills) {
      const recentTeammateKill = kills.find(
        (k) =>
          k.attackerSteamId === kill.victimSteamId &&
          k.round === kill.round &&
          k.tick < kill.tick &&
          kill.tick - k.tick < CONFIG.TRADE_NORMAL * 128
      );

      if (recentTeammateKill) {
        refragSupport++;
      }
    }

    // Support kills (kills qui aident l'équipe mais pas entry)
    const supportKills = playerKills.filter((kill) => {
      // Pas le premier kill du round
      const roundKills = kills.filter((k) => k.round === kill.round);
      const sortedKills = roundKills.sort((a, b) => a.tick - b.tick);
      return sortedKills[0]?.tick !== kill.tick;
    }).length;

    // Bait rate (approximation: mourir premier sans trade fréquemment)
    const playerDeaths = kills.filter((k) => k.victimSteamId === playerSteamId);
    let baitDeaths = 0;

    for (const death of playerDeaths) {
      const roundKills = kills.filter((k) => k.round === death.round);
      const sortedDeaths = roundKills
        .filter((k) => k.victimSteamId !== playerSteamId)
        .sort((a, b) => a.tick - b.tick);

      // Si le joueur meurt et qu'il y a des coéquipiers qui meurent après sans trade
      const deathsAfter = sortedDeaths.filter((d) => d.tick > death.tick);
      if (deathsAfter.length >= 2) {
        baitDeaths++;
      }
    }

    const baitRate = playerDeaths.length > 0 ? baitDeaths / playerDeaths.length : 0;

    // Score
    let score = 50;
    score += flashAssists * 5;
    score += smokeSupport * 3;
    score += refragSupport * 4;
    score += supportKills * 2;
    score -= baitRate * 20;

    return {
      flashAssists,
      smokeSupport,
      refragSupport,
      baitRate,
      supportKills,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de la coordination
   */
  private analyzeCoordination(
    kills: KillEventV2[],
    damages: DamageEventV2[],
    grenades: GrenadeEventV2[],
    rounds: RoundInfoV2[],
    playerSteamId: string
  ): TeamplayAnalysis['coordination'] {
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);

    // Synchronized peeks: kills qui arrivent en même temps qu'un autre kill d'équipe
    let synchronizedPeeks = 0;

    for (const kill of playerKills) {
      const teamKillsSameTime = kills.filter(
        (k) =>
          k.attackerSteamId !== playerSteamId &&
          k.round === kill.round &&
          Math.abs(k.tick - kill.tick) < CONFIG.SYNC_PEEK_WINDOW
      );

      if (teamKillsSameTime.length > 0) {
        synchronizedPeeks++;
      }
    }

    // Execute participation: kills/damages pendant une execute (après utility)
    let executeParticipation = 0;

    const playerGrenades = grenades.filter((g) => g.throwerSteamId === playerSteamId);

    for (const kill of playerKills) {
      // Chercher si des grenades ont été utilisées juste avant
      const recentGrenades = grenades.filter(
        (g) =>
          g.round === kill.round &&
          g.tick < kill.tick &&
          kill.tick - g.tick < CONFIG.EXECUTE_WINDOW
      );

      if (recentGrenades.length >= 2) {
        executeParticipation++;
      }
    }

    // Call following (approximation: rotations vers la bonne zone)
    // Difficile à mesurer sans données de communication
    const callFollowing = 0;

    // Team rotations: kills sur différentes zones du même round
    let teamRotations = 0;

    const killsByRound = new Map<number, KillEventV2[]>();
    for (const kill of playerKills) {
      const existing = killsByRound.get(kill.round) || [];
      existing.push(kill);
      killsByRound.set(kill.round, existing);
    }

    for (const [_round, roundKills] of killsByRound) {
      if (roundKills.length >= 2) {
        const sortedKills = roundKills.sort((a, b) => a.tick - b.tick);
        const firstPos = sortedKills[0].attackerPosition;
        const lastPos = sortedKills[sortedKills.length - 1].attackerPosition;
        const distance = Math.sqrt(
          Math.pow(firstPos.x - lastPos.x, 2) +
          Math.pow(firstPos.y - lastPos.y, 2)
        );

        if (distance > 1500) {
          teamRotations++;
        }
      }
    }

    // Score
    let score = 50;
    score += synchronizedPeeks * 5;
    score += executeParticipation * 4;
    score += teamRotations * 3;

    return {
      synchronizedPeeks,
      executeParticipation,
      callFollowing,
      teamRotations,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de l'entry fragging
   */
  private analyzeEntrying(
    entryDuels: EntryDuel[],
    kills: KillEventV2[],
    playerSteamId: string
  ): TeamplayAnalysis['entrying'] {
    // Entry attempts: le joueur était impliqué dans le premier duel
    const entryAttempts = entryDuels.filter(
      (e) => e.winnerId === playerSteamId || e.loserId === playerSteamId
    );

    const entryKills = entryDuels.filter((e) => e.winnerId === playerSteamId);
    const entryDeaths = entryDuels.filter((e) => e.loserId === playerSteamId);

    // Entry success rate
    const entrySuccess = entryAttempts.length > 0
      ? entryKills.length / entryAttempts.length
      : 0.5;

    // Opening duels (duels plus larges, pas juste le premier)
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    let openingDuels = 0;

    const killsByRound = new Map<number, KillEventV2[]>();
    for (const kill of kills) {
      const existing = killsByRound.get(kill.round) || [];
      existing.push(kill);
      killsByRound.set(kill.round, existing);
    }

    for (const [_round, roundKills] of killsByRound) {
      const sortedKills = roundKills.sort((a, b) => a.tick - b.tick);
      // Premiers 3 kills du round
      const earlyKills = sortedKills.slice(0, 3);

      for (const kill of earlyKills) {
        if (kill.attackerSteamId === playerSteamId) {
          openingDuels++;
        }
      }
    }

    // Score
    let score = 50;

    // Bonus pour entry kills
    score += entryKills.length * 5;

    // Bonus pour entry success rate
    score += entrySuccess * 25;

    // Bonus pour opening duels
    score += openingDuels * 2;

    // Penalty modéré pour entry deaths (c'est normal de mourir en entry)
    score -= entryDeaths.length * 2;

    return {
      entryAttempts: entryAttempts.length,
      entryKills: entryKills.length,
      entryDeaths: entryDeaths.length,
      entrySuccess,
      openingDuels,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de l'anchoring (tenue de position)
   */
  private analyzeAnchor(
    kills: KillEventV2[],
    rounds: RoundInfoV2[],
    playerSteamId: string,
    playerTeam: number
  ): TeamplayAnalysis['anchor'] {
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    const playerDeaths = kills.filter((k) => k.victimSteamId === playerSteamId);

    // Site holds: kills en retenant un site (CT side)
    // Approximation: kills sur le même site pendant un round
    let siteHolds = 0;

    const killsByRound = new Map<number, KillEventV2[]>();
    for (const kill of playerKills) {
      const existing = killsByRound.get(kill.round) || [];
      existing.push(kill);
      killsByRound.set(kill.round, existing);
    }

    for (const [_round, roundKills] of killsByRound) {
      if (roundKills.length >= 2) {
        // Vérifier si les kills sont au même endroit (site hold)
        const sortedKills = roundKills.sort((a, b) => a.tick - b.tick);
        let sameArea = true;

        for (let i = 1; i < sortedKills.length; i++) {
          const prev = sortedKills[i - 1].attackerPosition;
          const curr = sortedKills[i].attackerPosition;
          const distance = Math.sqrt(
            Math.pow(prev.x - curr.x, 2) + Math.pow(prev.y - curr.y, 2)
          );

          if (distance > 500) {
            sameArea = false;
            break;
          }
        }

        if (sameArea) {
          siteHolds++;
        }
      }
    }

    // Retake kills
    let retakeKills = 0;

    // Approximation: kills après que le joueur ne soit pas mort au début du round
    for (const [round, roundKills] of killsByRound) {
      const allRoundKills = kills.filter((k) => k.round === round);
      const sortedAllKills = allRoundKills.sort((a, b) => a.tick - b.tick);

      // Si le joueur a des kills tardifs dans le round
      const lateKills = roundKills.filter((k) => {
        const killIndex = sortedAllKills.findIndex((sk) => sk.tick === k.tick);
        return killIndex >= sortedAllKills.length / 2;
      });

      retakeKills += lateKills.length;
    }

    // Delaying deaths: morts qui ont retardé les ennemis
    // Approximation: temps en vie avant la mort
    let delayingDeaths = 0;

    for (const death of playerDeaths) {
      const roundKills = kills.filter((k) => k.round === death.round);
      const sortedKills = roundKills.sort((a, b) => a.tick - b.tick);

      if (sortedKills.length > 0) {
        const firstKillTick = sortedKills[0].tick;
        const timeAlive = ticksToSeconds(death.tick - firstKillTick);

        if (timeAlive > CONFIG.DELAY_TIME_MIN) {
          delayingDeaths++;
        }
      }
    }

    // Info before death: dégâts/kills juste avant de mourir
    let infoBeforeDeath = 0;

    for (const death of playerDeaths) {
      const damagesBeforeDeath = kills.filter(
        (k) =>
          k.attackerSteamId === playerSteamId &&
          k.round === death.round &&
          k.tick < death.tick &&
          death.tick - k.tick < 128 // 1 seconde avant
      );

      if (damagesBeforeDeath.length > 0) {
        infoBeforeDeath++;
      }
    }

    // Score
    let score = 50;
    score += siteHolds * 5;
    score += retakeKills * 3;
    score += delayingDeaths * 4;
    score += infoBeforeDeath * 3;

    return {
      siteHolds,
      retakeKills,
      delayingDeaths,
      infoBeforeDeath,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse du clutch
   */
  private analyzeClutch(
    clutches: ClutchSituation[],
    kills: KillEventV2[],
    playerSteamId: string
  ): TeamplayAnalysis['clutch'] {
    // Clutches du joueur
    const playerClutches = clutches.filter((c) => c.steamId === playerSteamId);
    const clutchWins = playerClutches.filter((c) => c.won);

    // Calculer les kills en clutch
    let totalClutchKills = 0;
    for (const clutch of playerClutches) {
      totalClutchKills += clutch.killsInClutch;
    }

    const avgKillsInClutch = playerClutches.length > 0
      ? totalClutchKills / playerClutches.length
      : 0;

    // Score
    let score = 50;

    // Bonus pour clutches gagnés
    score += clutchWins.length * 10;

    // Bonus pour kills en clutch
    score += totalClutchKills * 3;

    // Win rate bonus
    if (playerClutches.length > 0) {
      const winRate = clutchWins.length / playerClutches.length;
      score += winRate * 20;
    }

    return {
      clutchAttempts: playerClutches.length,
      clutchWins: clutchWins.length,
      clutchKills: totalClutchKills,
      avgKillsInClutch,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Calcule le score global
   */
  private calculateOverallScore(
    trading: TeamplayAnalysis['trading'],
    support: TeamplayAnalysis['support'],
    coordination: TeamplayAnalysis['coordination'],
    entrying: TeamplayAnalysis['entrying'],
    anchor: TeamplayAnalysis['anchor'],
    clutch: TeamplayAnalysis['clutch']
  ): number {
    const weights = {
      trading: 0.25,
      support: 0.20,
      coordination: 0.15,
      entrying: 0.15,
      anchor: 0.15,
      clutch: 0.10,
    };

    const score =
      trading.score * weights.trading +
      support.score * weights.support +
      coordination.score * weights.coordination +
      entrying.score * weights.entrying +
      anchor.score * weights.anchor +
      clutch.score * weights.clutch;

    return Math.round(score);
  }

  /**
   * Construit les métriques agrégées
   */
  private buildMetrics(
    trading: TeamplayAnalysis['trading'],
    support: TeamplayAnalysis['support'],
    coordination: TeamplayAnalysis['coordination'],
    entrying: TeamplayAnalysis['entrying'],
    anchor: TeamplayAnalysis['anchor'],
    clutch: TeamplayAnalysis['clutch']
  ): Record<string, number> {
    return {
      // Trading
      tradingScore: trading.score,
      tradesGiven: trading.tradesGiven,
      tradingRate: trading.tradingRate * 100,
      avgTradeTime: trading.avgTradeTime,
      instantTrades: trading.instantTrades,

      // Support
      supportScore: support.score,
      flashAssists: support.flashAssists,
      baitRate: support.baitRate * 100,

      // Coordination
      coordinationScore: coordination.score,
      synchronizedPeeks: coordination.synchronizedPeeks,
      executeParticipation: coordination.executeParticipation,

      // Entry
      entryScore: entrying.score,
      entryKills: entrying.entryKills,
      entrySuccess: entrying.entrySuccess * 100,

      // Anchor
      anchorScore: anchor.score,
      siteHolds: anchor.siteHolds,
      retakeKills: anchor.retakeKills,

      // Clutch
      clutchScore: clutch.score,
      clutchWins: clutch.clutchWins,
      clutchAttempts: clutch.clutchAttempts,
      avgKillsInClutch: clutch.avgKillsInClutch,
    };
  }
}
