/**
 * Awareness Analyzer - Analyse de la conscience de jeu
 *
 * Analyse les aspects de game sense en CS2:
 * - Bomb awareness (rotations, défuses, plants)
 * - Flash awareness (esquives, blind reçues)
 * - Info gathering (premiers contacts, callouts)
 * - Map reading (prédictions, positionnement)
 * - Sound awareness (audio cues)
 *
 * Ces aspects différencient les bons joueurs des joueurs moyens.
 */

import {
  BombEvent,
  PlayerBlindEvent,
  KillEventV2,
  PositionSnapshotV2,
  RoundInfoV2,
  TEAM_CT,
  TEAM_T,
  FLASH_THRESHOLDS,
  ticksToSeconds,
} from '@/lib/demo-parser/types-v2';
import { AwarenessAnalysis } from '../types-v2';

// Configuration des seuils
const CONFIG = {
  // Bomb timing (en secondes)
  ROTATION_FAST: 10,
  ROTATION_NORMAL: 20,
  ROTATION_LATE: 30,

  // Flash thresholds
  FULL_BLIND_DURATION: 2.0,
  SIGNIFICANT_BLIND: 1.0,
  PARTIAL_BLIND: 0.5,

  // Info gathering
  INFO_SURVIVAL_TIME: 5, // Temps de survie après avoir donné l'info (secondes)

  // Trade window
  TRADE_WINDOW_TICKS: 384, // 3 secondes
};

/**
 * Classe principale d'analyse de l'awareness
 */
export class AwarenessAnalyzer {
  /**
   * Analyse complète de la conscience de jeu d'un joueur
   */
  analyze(
    bombEvents: BombEvent[],
    playerBlinds: PlayerBlindEvent[],
    kills: KillEventV2[],
    positions: PositionSnapshotV2[],
    rounds: RoundInfoV2[],
    playerSteamId: string,
    playerTeam: number
  ): AwarenessAnalysis {
    // Analyses spécifiques
    const bombAwareness = this.analyzeBombAwareness(
      bombEvents,
      kills,
      rounds,
      playerSteamId,
      playerTeam
    );

    const flashAwareness = this.analyzeFlashAwareness(
      playerBlinds,
      kills,
      playerSteamId
    );

    const infoGathering = this.analyzeInfoGathering(
      kills,
      positions,
      playerSteamId
    );

    const mapReading = this.analyzeMapReading(
      kills,
      positions,
      rounds,
      playerSteamId
    );

    const soundAwareness = this.analyzeSoundAwareness(
      kills,
      positions,
      playerSteamId
    );

    // Score global
    const overallScore = this.calculateOverallScore(
      bombAwareness,
      flashAwareness,
      infoGathering,
      mapReading,
      soundAwareness
    );

    // Métriques agrégées
    const metrics = this.buildMetrics(
      bombAwareness,
      flashAwareness,
      infoGathering,
      mapReading,
      soundAwareness
    );

    return {
      bombAwareness,
      flashAwareness,
      infoGathering,
      mapReading,
      soundAwareness,
      overallScore,
      metrics,
    };
  }

  /**
   * Analyse de la conscience de la bombe
   */
  private analyzeBombAwareness(
    bombEvents: BombEvent[],
    kills: KillEventV2[],
    rounds: RoundInfoV2[],
    playerSteamId: string,
    playerTeam: number
  ): AwarenessAnalysis['bombAwareness'] {
    const isCT = playerTeam === TEAM_CT;

    // Événements liés au joueur
    const playerBombEvents = bombEvents.filter((e) => e.steamId === playerSteamId);

    // CT Analysis
    let rotationsToPlant = 0;
    let correctRotations = 0;
    let lateRotations = 0;
    let defuseAttempts = 0;
    let clutchDefuses = 0;
    let fakeDefuseSuccess = 0;

    // T Analysis
    let plantSiteChoices = 0;
    let plantSuccess = 0;
    let bombDropPositions = 0;
    let bombRecoveries = 0;

    if (isCT) {
      // Analyser les rotations vers les plants
      const plants = bombEvents.filter((e) => e.type === 'planted');

      for (const plant of plants) {
        // Chercher si le joueur a fait un kill après le plant (indicateur de rotation)
        const killsAfterPlant = kills.filter(
          (k) =>
            k.attackerSteamId === playerSteamId &&
            k.round === plant.round &&
            k.tick > plant.tick
        );

        if (killsAfterPlant.length > 0) {
          rotationsToPlant++;

          // Évaluer la vitesse de rotation
          const firstKillAfterPlant = killsAfterPlant[0];
          const rotationTime = ticksToSeconds(firstKillAfterPlant.tick - plant.tick);

          if (rotationTime < CONFIG.ROTATION_FAST) {
            correctRotations++;
          } else if (rotationTime > CONFIG.ROTATION_LATE) {
            lateRotations++;
          }
        }
      }

      // Defuse attempts
      defuseAttempts = playerBombEvents.filter(
        (e) => e.type === 'begindefuse' || e.type === 'defused'
      ).length;

      // Clutch defuses (defuse quand seul)
      const successfulDefuses = playerBombEvents.filter((e) => e.type === 'defused');
      for (const defuse of successfulDefuses) {
        // Vérifier si c'était un clutch
        const aliveTeammatesAtDefuse = this.countAliveTeammates(kills, defuse.round, defuse.tick, playerSteamId, playerTeam);
        if (aliveTeammatesAtDefuse === 0) {
          clutchDefuses++;
        }
      }

      // Fake defuses (abort suivi d'un kill)
      const abortedDefuses = playerBombEvents.filter((e) => e.type === 'abortdefuse');
      for (const abort of abortedDefuses) {
        const killAfterAbort = kills.find(
          (k) =>
            k.attackerSteamId === playerSteamId &&
            k.round === abort.round &&
            k.tick > abort.tick &&
            k.tick < abort.tick + 256 // Dans les 2 secondes
        );
        if (killAfterAbort) {
          fakeDefuseSuccess++;
        }
      }
    } else {
      // T Analysis
      const playerPlants = playerBombEvents.filter((e) => e.type === 'planted');
      plantSuccess = playerPlants.length;
      plantSiteChoices = playerPlants.length;

      // Bomb drops
      bombDropPositions = playerBombEvents.filter((e) => e.type === 'dropped').length;

      // Bomb recoveries
      bombRecoveries = playerBombEvents.filter((e) => e.type === 'pickup').length;
    }

    // Score
    let score = 50;

    if (isCT) {
      // Bonus pour rotations correctes
      if (rotationsToPlant > 0) {
        score += (correctRotations / rotationsToPlant) * 20;
        score -= (lateRotations / rotationsToPlant) * 10;
      }
      // Bonus pour clutch defuses
      score += clutchDefuses * 10;
      // Bonus pour fake defuses
      score += fakeDefuseSuccess * 5;
    } else {
      // Bonus pour plants réussis
      score += plantSuccess * 5;
      // Bonus pour bomb recoveries
      score += bombRecoveries * 3;
      // Penalty pour drops fréquents
      if (bombDropPositions > 3) {
        score -= (bombDropPositions - 3) * 2;
      }
    }

    return {
      rotationsToPlant,
      correctRotations,
      lateRotations,
      defuseAttempts,
      clutchDefuses,
      fakeDefuseSuccess,
      plantSiteChoices,
      plantSuccess,
      bombDropPositions,
      bombRecoveries,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Compte les coéquipiers en vie à un moment donné
   */
  private countAliveTeammates(
    kills: KillEventV2[],
    round: number,
    atTick: number,
    playerSteamId: string,
    playerTeam: number
  ): number {
    // Compter les morts d'équipe avant ce tick
    const teamDeaths = kills.filter(
      (k) =>
        k.round === round &&
        k.tick < atTick &&
        k.victimSteamId !== playerSteamId
      // Note: On devrait vérifier l'équipe de la victime, mais on n'a pas cette info directement
    ).length;

    // Estimer: 4 coéquipiers - morts
    return Math.max(0, 4 - teamDeaths);
  }

  /**
   * Analyse de la conscience des flashs
   */
  private analyzeFlashAwareness(
    playerBlinds: PlayerBlindEvent[],
    kills: KillEventV2[],
    playerSteamId: string
  ): AwarenessAnalysis['flashAwareness'] {
    // Flashs reçues par le joueur
    const flashesReceived = playerBlinds.filter(
      (b) => b.victimSteamId === playerSteamId
    );

    // Classifier par durée
    const fullBlinds = flashesReceived.filter(
      (b) => b.duration >= CONFIG.FULL_BLIND_DURATION
    );
    const partialBlinds = flashesReceived.filter(
      (b) => b.duration >= CONFIG.PARTIAL_BLIND && b.duration < CONFIG.FULL_BLIND_DURATION
    );

    // Morts en étant aveuglé
    const blindDeaths = kills.filter((k) => {
      if (k.victimSteamId !== playerSteamId) return false;

      // Chercher si le joueur était flash au moment de la mort
      const recentFlash = flashesReceived.find(
        (f) =>
          f.round === k.round &&
          f.tick < k.tick &&
          f.tick + f.duration * 128 > k.tick // Encore aveuglé
      );
      return recentFlash !== undefined;
    }).length;

    // Estimer les flashs esquivées
    // Approximation: flashs avec durée courte = possiblement esquivées
    const shortBlinds = flashesReceived.filter((b) => b.duration < CONFIG.PARTIAL_BLIND);
    const flashesDodged = shortBlinds.length;

    // Flash look-aways (estimé par durée très courte)
    const flashLookAways = flashesReceived.filter(
      (b) => b.duration < 0.3
    ).length;

    // Score
    let score = 50;

    // Penalty pour full blinds
    score -= fullBlinds.length * 3;

    // Bonus pour flashs esquivées
    score += flashesDodged * 2;

    // Bonus pour look-aways
    score += flashLookAways * 3;

    // Penalty pour morts en blind
    score -= blindDeaths * 5;

    // Normaliser avec le nombre total de flashs reçues
    if (flashesReceived.length > 0) {
      const dodgeRate = flashesDodged / flashesReceived.length;
      score += dodgeRate * 20;
    }

    return {
      flashesDodged,
      fullBlindsReceived: fullBlinds.length,
      partialBlindsReceived: partialBlinds.length,
      blindDeaths,
      flashLookAways,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de la collecte d'informations
   */
  private analyzeInfoGathering(
    kills: KillEventV2[],
    positions: PositionSnapshotV2[],
    playerSteamId: string
  ): AwarenessAnalysis['infoGathering'] {
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    const playerDeaths = kills.filter((k) => k.victimSteamId === playerSteamId);

    // Premier contact par round
    let firstContacts = 0;
    const killsByRound = new Map<number, KillEventV2[]>();

    for (const kill of kills) {
      const existing = killsByRound.get(kill.round) || [];
      existing.push(kill);
      killsByRound.set(kill.round, existing);
    }

    for (const [_round, roundKills] of killsByRound) {
      const sortedKills = roundKills.sort((a, b) => a.tick - b.tick);
      if (sortedKills.length > 0) {
        const firstKill = sortedKills[0];
        if (
          firstKill.attackerSteamId === playerSteamId ||
          firstKill.victimSteamId === playerSteamId
        ) {
          firstContacts++;
        }
      }
    }

    // Info kills (kills qui donnent de l'information sans mourir immédiatement)
    let infoKills = 0;
    let survivalAfterInfo = 0;

    for (const kill of playerKills) {
      // Vérifier si le joueur survit après le kill
      const deathAfterKill = playerDeaths.find(
        (d) =>
          d.round === kill.round &&
          d.tick > kill.tick &&
          d.tick < kill.tick + CONFIG.INFO_SURVIVAL_TIME * 128
      );

      if (!deathAfterKill) {
        survivalAfterInfo++;
      }
      infoKills++;
    }

    // Callout opportunities (approximation basée sur les damages sans kill)
    const calloutOpportunities = firstContacts; // Simplifié

    // Score
    let score = 50;

    // Bonus pour premiers contacts
    score += firstContacts * 2;

    // Bonus pour survie après info
    if (infoKills > 0) {
      const survivalRate = survivalAfterInfo / infoKills;
      score += survivalRate * 25;
    }

    return {
      firstContacts,
      infoKills,
      survivalAfterInfo,
      calloutOpportunities,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de la lecture de carte
   */
  private analyzeMapReading(
    kills: KillEventV2[],
    positions: PositionSnapshotV2[],
    rounds: RoundInfoV2[],
    playerSteamId: string
  ): AwarenessAnalysis['mapReading'] {
    // Positionnement prédictif (kills sur des positions attendues)
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);

    // Analyser si les kills sont sur des positions prévisibles ou inattendues
    let predictivePositioning = 0;
    let enemyLocationAwareness = 0;
    let rotationPredictions = 0;

    // Grouper les kills par round pour analyser les patterns
    const killsByRound = new Map<number, KillEventV2[]>();
    for (const kill of playerKills) {
      const existing = killsByRound.get(kill.round) || [];
      existing.push(kill);
      killsByRound.set(kill.round, existing);
    }

    for (const [_round, roundKills] of killsByRound) {
      const sortedKills = roundKills.sort((a, b) => a.tick - b.tick);

      // Si plusieurs kills consécutifs, le joueur anticipe bien les positions
      if (sortedKills.length >= 2) {
        predictivePositioning++;
      }

      // Rotation kills (kills sur différentes zones de la map)
      if (sortedKills.length >= 2) {
        const firstKill = sortedKills[0];
        const lastKill = sortedKills[sortedKills.length - 1];
        const distance = Math.sqrt(
          Math.pow(firstKill.attackerPosition.x - lastKill.attackerPosition.x, 2) +
          Math.pow(firstKill.attackerPosition.y - lastKill.attackerPosition.y, 2)
        );

        if (distance > 1000) {
          rotationPredictions++;
        }
      }

      enemyLocationAwareness += roundKills.length;
    }

    // Score
    let score = 50;
    score += predictivePositioning * 5;
    score += rotationPredictions * 10;
    score += Math.min(20, (enemyLocationAwareness / rounds.length) * 20);

    return {
      predictivePositioning,
      enemyLocationAwareness,
      rotationPredictions,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de la conscience sonore
   */
  private analyzeSoundAwareness(
    kills: KillEventV2[],
    positions: PositionSnapshotV2[],
    playerSteamId: string
  ): AwarenessAnalysis['soundAwareness'] {
    // Difficile à mesurer directement sans données audio
    // On approxime avec les kills en walk et les kills de flanc

    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);

    // Kills qui semblent basés sur l'audio (position inattendue de l'attaquant)
    let soundCues = 0;
    let silentPlays = 0;

    for (const kill of playerKills) {
      // Chercher si le joueur marchait au moment du kill
      const nearSnapshot = positions.find(
        (p) => Math.abs(p.tick - kill.tick) < 64
      );

      if (nearSnapshot) {
        const playerState = nearSnapshot.players.find(
          (pl) => pl.steamId === playerSteamId
        );
        if (playerState?.isWalking) {
          silentPlays++;
        }
      }

      // Kills de flanc (approximation basée sur les angles)
      // Simplifié pour cette version
    }

    // Score basé sur les plays silencieux
    let score = 50;
    score += silentPlays * 3;

    return {
      soundCues,
      silentPlays,
      audioReactions: 0, // Difficile à mesurer
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Calcule le score global
   */
  private calculateOverallScore(
    bombAwareness: AwarenessAnalysis['bombAwareness'],
    flashAwareness: AwarenessAnalysis['flashAwareness'],
    infoGathering: AwarenessAnalysis['infoGathering'],
    mapReading: AwarenessAnalysis['mapReading'],
    soundAwareness: AwarenessAnalysis['soundAwareness']
  ): number {
    const weights = {
      bomb: 0.30,
      flash: 0.20,
      info: 0.20,
      map: 0.20,
      sound: 0.10,
    };

    const score =
      bombAwareness.score * weights.bomb +
      flashAwareness.score * weights.flash +
      infoGathering.score * weights.info +
      mapReading.score * weights.map +
      soundAwareness.score * weights.sound;

    return Math.round(score);
  }

  /**
   * Construit les métriques agrégées
   */
  private buildMetrics(
    bombAwareness: AwarenessAnalysis['bombAwareness'],
    flashAwareness: AwarenessAnalysis['flashAwareness'],
    infoGathering: AwarenessAnalysis['infoGathering'],
    mapReading: AwarenessAnalysis['mapReading'],
    soundAwareness: AwarenessAnalysis['soundAwareness']
  ): Record<string, number> {
    return {
      // Bomb
      bombScore: bombAwareness.score,
      correctRotations: bombAwareness.correctRotations,
      lateRotations: bombAwareness.lateRotations,
      clutchDefuses: bombAwareness.clutchDefuses,
      plantSuccess: bombAwareness.plantSuccess,

      // Flash
      flashScore: flashAwareness.score,
      flashesDodged: flashAwareness.flashesDodged,
      fullBlindsReceived: flashAwareness.fullBlindsReceived,
      blindDeaths: flashAwareness.blindDeaths,

      // Info
      infoScore: infoGathering.score,
      firstContacts: infoGathering.firstContacts,
      survivalAfterInfo: infoGathering.survivalAfterInfo,

      // Map
      mapScore: mapReading.score,
      predictivePositioning: mapReading.predictivePositioning,
      rotationPredictions: mapReading.rotationPredictions,

      // Sound
      soundScore: soundAwareness.score,
      silentPlays: soundAwareness.silentPlays,
    };
  }
}