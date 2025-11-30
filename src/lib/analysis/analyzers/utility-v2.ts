/**
 * Utility Analyzer v2.0 - Analyse exhaustive de l'usage des utilitaires
 *
 * Ce module analyse l'utilisation des grenades avec des données réelles :
 * - Flashbangs : durée exacte via PlayerBlindEvent, pop-flashes, coordination
 * - Smokes : timing, positionnement, one-way, exécutes
 * - Molotovs/Incendiaires : dégâts, denial, zone control
 * - HE : dégâts multi-cibles, timing
 *
 * Améliorations v2 :
 * - Utilise PlayerBlindEvent pour la durée exacte des flashs
 * - Détection des pop-flashes (flash + kill rapide)
 * - Analyse de la coordination utilitaire avec les kills
 * - Tracking de l'économie utilitaire (achetées vs utilisées)
 * - Métriques par round pour tendances
 */

import {
  GrenadeEventV2,
  DamageEventV2,
  KillEventV2,
  PlayerBlindEvent,
  ItemPurchase,
  Position3D,
  FLASH_THRESHOLDS,
  classifyFlashDuration,
  ticksToSeconds,
  secondsToTicks,
  TEAM_CT,
  TEAM_T,
} from '@/lib/demo-parser/types-v2';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Analyse détaillée des flashbangs
 */
export interface FlashAnalysisV2 {
  // Compteurs
  thrown: number;
  bought: number;
  unused: number;

  // Flashs reçus par catégorie
  enemiesFlashed: number;
  teammatesFlashed: number;
  selfFlashes: number;

  // Durées exactes
  totalEnemyBlindDuration: number;
  avgEnemyBlindDuration: number;
  maxEnemyBlindDuration: number;

  // Classifications de durée
  fullBlinds: number;
  significantBlinds: number;
  partialBlinds: number;
  minimalBlinds: number;

  // Pop-flashes (kill dans les 2s après flash)
  popFlashes: number;
  popFlashKills: number;

  // Assists
  flashAssists: number;
  flashAssistKills: number;

  // Efficacité
  effectiveness: number;
  enemyFlashRate: number;
  teamFlashRate: number;
  selfFlashRate: number;

  // Timing
  avgTimeToKillAfterFlash: number;
  flashKillTimings: number[];
}

/**
 * Analyse détaillée des smokes
 */
export interface SmokeAnalysisV2 {
  thrown: number;
  bought: number;
  unused: number;

  // Contexte d'utilisation
  usedForExecute: number;
  usedDefensively: number;
  usedForRotation: number;

  // One-ways
  oneWayAttempts: number;
  oneWayKills: number;

  // Timing
  avgTimingInRound: number;
  smokeTimings: number[];

  // Coordination
  smokesFollowedByKill: number;
  avgTimeToKillAfterSmoke: number;

  // Efficacité
  effectiveness: number;
}

/**
 * Analyse détaillée des molotovs/incendiaires
 */
export interface MolotovAnalysisV2 {
  thrown: number;
  bought: number;
  unused: number;

  // Dégâts
  totalDamage: number;
  avgDamagePerMolly: number;
  maxDamageFromSingle: number;

  // Kills
  kills: number;
  assists: number;

  // Type d'utilisation
  denialMollies: number;
  pushMollies: number;
  retakeMollies: number;

  // Multi-hits
  multiHitMollies: number;
  avgPlayersHitPerMolly: number;

  // Efficacité
  effectiveness: number;
  damageEfficiency: number;
}

/**
 * Analyse détaillée des HE grenades
 */
export interface HEAnalysisV2 {
  thrown: number;
  bought: number;
  unused: number;

  // Dégâts
  totalDamage: number;
  avgDamagePerHE: number;
  maxDamageFromSingle: number;

  // Kills
  kills: number;

  // Multi-hits
  multiHits: number;
  playersHitTotal: number;
  avgPlayersHitPerHE: number;

  // Efficacité
  effectiveness: number;
  damageEfficiency: number;
}

/**
 * Analyse du timing utilitaire
 */
export interface UtilityTimingAnalysis {
  // Catégories de timing
  preExecuteUtility: number;
  reactiveUtility: number;
  wastedUtility: number;

  // Coordination avec l'équipe
  coordinatedUtility: number;
  soloUtility: number;

  // Timing moyen dans le round (0-1 normalisé)
  avgUtilityTiming: number;

  // Utilisation par phase de round
  earlyRoundUtility: number;
  midRoundUtility: number;
  lateRoundUtility: number;
}

/**
 * Économie utilitaire
 */
export interface UtilityEconomy {
  totalSpent: number;
  flashesBought: number;
  smokesBought: number;
  molotovsBought: number;
  hesBought: number;

  flashesUsed: number;
  smokesUsed: number;
  molotovsUsed: number;
  hesUsed: number;

  wasteRate: number;
  avgUtilityPerRound: number;
  avgUtilitySpentPerRound: number;
}

/**
 * Analyse d'une round individuelle
 */
export interface RoundUtilityAnalysis {
  round: number;
  flashesThrown: number;
  smokesThrown: number;
  molotovsThrown: number;
  hesThrown: number;
  totalDamage: number;
  enemiesFlashed: number;
  totalBlindDuration: number;
  hadImpact: boolean;
}

/**
 * Résultat complet de l'analyse utilitaire v2
 */
export interface UtilityAnalysisV2 {
  // Analyses par type
  flash: FlashAnalysisV2;
  smoke: SmokeAnalysisV2;
  molotov: MolotovAnalysisV2;
  he: HEAnalysisV2;

  // Analyses transversales
  timing: UtilityTimingAnalysis;
  economy: UtilityEconomy;

  // Par round
  roundBreakdown: RoundUtilityAnalysis[];

  // Scores globaux (0-100)
  scores: {
    flashEfficiency: number;
    smokeEfficiency: number;
    molotovEfficiency: number;
    heEfficiency: number;
    timingScore: number;
    economyScore: number;
    overall: number;
  };

  // Métadonnées
  totalRounds: number;
  totalGrenadesThrown: number;
  totalGrenadeDamage: number;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/**
 * Positions de denial communes par map
 */
const DENIAL_POSITIONS: Record<string, { name: string; position: Position3D; radius: number }[]> = {
  de_dust2: [
    { name: 'B Tunnels', position: { x: -1200, y: 2600, z: 0 }, radius: 300 },
    { name: 'Long Doors', position: { x: 1200, y: 1400, z: 0 }, radius: 300 },
    { name: 'Short', position: { x: 200, y: 2200, z: 0 }, radius: 300 },
    { name: 'CT Mid', position: { x: -400, y: 1600, z: 0 }, radius: 300 },
  ],
  de_mirage: [
    { name: 'B Apps', position: { x: -2200, y: -200, z: 0 }, radius: 300 },
    { name: 'Mid Window', position: { x: -400, y: 200, z: 0 }, radius: 300 },
    { name: 'Palace', position: { x: 800, y: -1400, z: 0 }, radius: 300 },
    { name: 'Ramp', position: { x: 1400, y: -1000, z: 0 }, radius: 300 },
    { name: 'Underpass', position: { x: -600, y: 0, z: -200 }, radius: 300 },
  ],
  de_inferno: [
    { name: 'Banana', position: { x: 400, y: 2400, z: 0 }, radius: 400 },
    { name: 'Apps', position: { x: 2200, y: 0, z: 0 }, radius: 300 },
    { name: 'Mid', position: { x: 600, y: 1600, z: 0 }, radius: 300 },
    { name: 'Top Banana', position: { x: 200, y: 2000, z: 0 }, radius: 300 },
  ],
  de_nuke: [
    { name: 'Ramp', position: { x: 600, y: -900, z: -400 }, radius: 300 },
    { name: 'Lobby', position: { x: -200, y: 0, z: 0 }, radius: 300 },
    { name: 'Vent', position: { x: 400, y: 200, z: -400 }, radius: 200 },
  ],
  de_overpass: [
    { name: 'Connector', position: { x: -2000, y: -200, z: 0 }, radius: 300 },
    { name: 'Monster', position: { x: -2800, y: 400, z: 0 }, radius: 300 },
    { name: 'Toilets', position: { x: -1600, y: -800, z: 0 }, radius: 250 },
  ],
  de_ancient: [
    { name: 'Mid', position: { x: 0, y: 0, z: 0 }, radius: 400 },
    { name: 'Donut', position: { x: 800, y: -600, z: 0 }, radius: 250 },
    { name: 'Elbow', position: { x: -1200, y: 400, z: 0 }, radius: 300 },
  ],
  de_anubis: [
    { name: 'Mid', position: { x: -200, y: 0, z: 0 }, radius: 350 },
    { name: 'Connector', position: { x: 600, y: -400, z: 0 }, radius: 300 },
    { name: 'Canal', position: { x: -800, y: 600, z: 0 }, radius: 300 },
  ],
};

/**
 * Prix des grenades
 */
const GRENADE_PRICES: Record<string, number> = {
  flashbang: 200,
  smokegrenade: 300,
  molotov: 400,
  incgrenade: 600,
  hegrenade: 300,
  decoy: 50,
};

// =============================================================================
// CLASSE PRINCIPALE
// =============================================================================

export class UtilityAnalyzerV2 {
  private readonly tickrate: number;
  private readonly mapName: string;

  constructor(options: { tickrate?: number; mapName?: string } = {}) {
    this.tickrate = options.tickrate || 128;
    this.mapName = options.mapName || 'unknown';
  }

  /**
   * Analyse complète de l'usage des utilitaires
   */
  analyze(
    grenades: GrenadeEventV2[],
    playerBlinds: PlayerBlindEvent[],
    damages: DamageEventV2[],
    kills: KillEventV2[],
    purchases: ItemPurchase[],
    playerSteamId: string,
    playerTeam: number,
    _teammates: string[],
    totalRounds: number
  ): UtilityAnalysisV2 {
    // Filtrer les grenades du joueur
    const playerGrenades = grenades.filter((g) => g.throwerSteamId === playerSteamId);

    // Catégoriser par type
    const flashes = playerGrenades.filter((g) => g.type === 'flash');
    const smokes = playerGrenades.filter((g) => g.type === 'smoke');
    const molotovs = playerGrenades.filter((g) => g.type === 'molotov');
    const heGrenades = playerGrenades.filter((g) => g.type === 'he');

    // Filtrer les achats du joueur
    const playerPurchases = purchases.filter((p) => p.steamId === playerSteamId);

    // Filtrer les blinds causés par le joueur
    const playerBlindsGiven = playerBlinds.filter((b) => b.attackerSteamId === playerSteamId);

    // Filtrer les kills du joueur
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);

    // Analyses détaillées
    const flashAnalysis = this.analyzeFlashes(
      flashes,
      playerBlindsGiven,
      playerBlinds.filter((b) => b.victimSteamId === playerSteamId),
      playerKills,
      kills,
      playerPurchases,
      playerSteamId,
      playerTeam
    );

    const smokeAnalysis = this.analyzeSmokes(
      smokes,
      playerKills,
      kills,
      playerPurchases,
      playerSteamId,
      totalRounds
    );

    const molotovAnalysis = this.analyzeMolotovs(
      molotovs,
      damages,
      kills,
      playerPurchases,
      playerSteamId
    );

    const heAnalysis = this.analyzeHE(heGrenades, damages, kills, playerPurchases, playerSteamId);

    const timingAnalysis = this.analyzeUtilityTiming(playerGrenades, playerKills, totalRounds);

    const economyAnalysis = this.analyzeUtilityEconomy(playerPurchases, playerGrenades, totalRounds);

    const roundBreakdown = this.analyzeByRound(
      playerGrenades,
      playerBlindsGiven,
      damages,
      playerSteamId,
      totalRounds
    );

    // Calcul des scores
    const scores = this.calculateScores(
      flashAnalysis,
      smokeAnalysis,
      molotovAnalysis,
      heAnalysis,
      timingAnalysis,
      economyAnalysis
    );

    return {
      flash: flashAnalysis,
      smoke: smokeAnalysis,
      molotov: molotovAnalysis,
      he: heAnalysis,
      timing: timingAnalysis,
      economy: economyAnalysis,
      roundBreakdown,
      scores,
      totalRounds,
      totalGrenadesThrown: playerGrenades.length,
      totalGrenadeDamage: molotovAnalysis.totalDamage + heAnalysis.totalDamage,
    };
  }

  /**
   * Analyse détaillée des flashbangs avec données PlayerBlindEvent
   */
  private analyzeFlashes(
    flashes: GrenadeEventV2[],
    blindsGiven: PlayerBlindEvent[],
    blindsReceived: PlayerBlindEvent[],
    playerKills: KillEventV2[],
    allKills: KillEventV2[],
    purchases: ItemPurchase[],
    playerSteamId: string,
    playerTeam: number
  ): FlashAnalysisV2 {
    const flashesBought = purchases.filter(
      (p) => p.item.includes('flashbang') || p.item === 'weapon_flashbang'
    ).length;

    const analysis: FlashAnalysisV2 = {
      thrown: flashes.length,
      bought: flashesBought,
      unused: Math.max(0, flashesBought - flashes.length),
      enemiesFlashed: 0,
      teammatesFlashed: 0,
      selfFlashes: 0,
      totalEnemyBlindDuration: 0,
      avgEnemyBlindDuration: 0,
      maxEnemyBlindDuration: 0,
      fullBlinds: 0,
      significantBlinds: 0,
      partialBlinds: 0,
      minimalBlinds: 0,
      popFlashes: 0,
      popFlashKills: 0,
      flashAssists: 0,
      flashAssistKills: 0,
      effectiveness: 0,
      enemyFlashRate: 0,
      teamFlashRate: 0,
      selfFlashRate: 0,
      avgTimeToKillAfterFlash: 0,
      flashKillTimings: [],
    };

    if (flashes.length === 0) return analysis;

    // Analyser chaque blind causé par le joueur
    const enemyTeam = playerTeam === TEAM_CT ? TEAM_T : TEAM_CT;
    const enemyBlinds: PlayerBlindEvent[] = [];
    const teamBlinds: PlayerBlindEvent[] = [];

    for (const blind of blindsGiven) {
      if (blind.victimSteamId === playerSteamId) {
        analysis.selfFlashes++;
        continue;
      }

      // Déterminer l'équipe de la victime via les kills
      const victimKill = allKills.find(
        (k) =>
          k.victimSteamId === blind.victimSteamId ||
          k.attackerSteamId === blind.victimSteamId
      );

      // Si la victime a été tuée par notre équipe ou a tué un ennemi, c'est un ennemi
      const isEnemy = victimKill
        ? (victimKill.victimSteamId === blind.victimSteamId &&
            this.sameTeam(victimKill.attackerSteamId, playerSteamId, allKills)) ||
          (victimKill.attackerSteamId === blind.victimSteamId &&
            !this.sameTeam(victimKill.attackerSteamId, playerSteamId, allKills))
        : false;

      if (isEnemy) {
        enemyBlinds.push(blind);
        analysis.totalEnemyBlindDuration += blind.duration;
        analysis.maxEnemyBlindDuration = Math.max(analysis.maxEnemyBlindDuration, blind.duration);

        // Classifier la durée
        const classification = classifyFlashDuration(blind.duration);
        switch (classification) {
          case 'full':
            analysis.fullBlinds++;
            break;
          case 'significant':
            analysis.significantBlinds++;
            break;
          case 'partial':
            analysis.partialBlinds++;
            break;
          case 'minimal':
            analysis.minimalBlinds++;
            break;
        }
      } else {
        teamBlinds.push(blind);
      }
    }

    analysis.enemiesFlashed = enemyBlinds.length;
    analysis.teammatesFlashed = teamBlinds.length;

    if (enemyBlinds.length > 0) {
      analysis.avgEnemyBlindDuration = analysis.totalEnemyBlindDuration / enemyBlinds.length;
    }

    // Self-flashes via les blinds reçus (quand le joueur s'est flashé)
    const selfBlinds = blindsReceived.filter((b) => b.attackerSteamId === playerSteamId);
    analysis.selfFlashes = selfBlinds.length;

    // Analyser les pop-flashes et flash assists
    for (const flash of flashes) {
      // Trouver les kills peu après le flash (fenêtre de 3s)
      const killsAfterFlash = playerKills.filter(
        (k) =>
          k.round === flash.round &&
          k.tick > flash.tick &&
          k.tick < flash.tick + secondsToTicks(3, this.tickrate)
      );

      if (killsAfterFlash.length > 0) {
        // Vérifier si la victime était aveuglée
        const popFlashKills = killsAfterFlash.filter((kill) =>
          enemyBlinds.some(
            (b) =>
              b.round === kill.round &&
              b.victimSteamId === kill.victimSteamId &&
              // Le blind était actif au moment du kill
              kill.tick >= b.tick &&
              ticksToSeconds(kill.tick - b.tick, this.tickrate) < b.duration
          )
        );

        if (popFlashKills.length > 0) {
          analysis.popFlashes++;
          analysis.popFlashKills += popFlashKills.length;

          // Enregistrer le timing
          for (const kill of popFlashKills) {
            const timing = ticksToSeconds(kill.tick - flash.tick, this.tickrate) * 1000;
            analysis.flashKillTimings.push(timing);
          }
        }

        // Flash assist kills (kills par des coéquipiers sur des ennemis flashés par moi)
        for (const k of killsAfterFlash) {
          if (k.assistedFlash && k.attackerSteamId !== playerSteamId) {
            analysis.flashAssistKills++;
          }
        }
      }
    }

    // Compter les flash assists uniques
    const flashAssistRounds = new Set(
      allKills
        .filter(
          (k) =>
            k.assistedFlash &&
            k.attackerSteamId !== playerSteamId &&
            // Le joueur a flashé dans ce round
            flashes.some((f) => f.round === k.round)
        )
        .map((k) => k.round)
    );
    analysis.flashAssists = flashAssistRounds.size;

    // Calcul timing moyen
    if (analysis.flashKillTimings.length > 0) {
      analysis.avgTimeToKillAfterFlash =
        analysis.flashKillTimings.reduce((a, b) => a + b, 0) / analysis.flashKillTimings.length;
    }

    // Calcul des taux
    const totalBlinds = analysis.enemiesFlashed + analysis.teammatesFlashed + analysis.selfFlashes;
    if (totalBlinds > 0) {
      analysis.enemyFlashRate = analysis.enemiesFlashed / totalBlinds;
      analysis.teamFlashRate = analysis.teammatesFlashed / totalBlinds;
      analysis.selfFlashRate = analysis.selfFlashes / totalBlinds;
    }

    // Efficacité globale
    if (flashes.length > 0) {
      // Formule : (ennemis flashés * durée moyenne) + pop-flash bonus - pénalités team/self
      const baseEfficiency = Math.min(1, (analysis.enemiesFlashed / flashes.length) * 0.5);
      const durationBonus =
        analysis.avgEnemyBlindDuration >= FLASH_THRESHOLDS.FULL_BLIND
          ? 0.3
          : analysis.avgEnemyBlindDuration >= FLASH_THRESHOLDS.SIGNIFICANT
            ? 0.2
            : 0.1;
      const popFlashBonus = Math.min(0.2, (analysis.popFlashes / flashes.length) * 0.5);
      const teamPenalty = (analysis.teammatesFlashed / flashes.length) * 0.15;
      const selfPenalty = (analysis.selfFlashes / flashes.length) * 0.25;

      analysis.effectiveness = Math.max(
        0,
        Math.min(1, baseEfficiency + durationBonus + popFlashBonus - teamPenalty - selfPenalty)
      );
    }

    return analysis;
  }

  /**
   * Analyse détaillée des smokes
   */
  private analyzeSmokes(
    smokes: GrenadeEventV2[],
    playerKills: KillEventV2[],
    _allKills: KillEventV2[],
    purchases: ItemPurchase[],
    _playerSteamId: string,
    totalRounds: number
  ): SmokeAnalysisV2 {
    const smokesBought = purchases.filter(
      (p) => p.item.includes('smoke') || p.item === 'weapon_smokegrenade'
    ).length;

    const analysis: SmokeAnalysisV2 = {
      thrown: smokes.length,
      bought: smokesBought,
      unused: Math.max(0, smokesBought - smokes.length),
      usedForExecute: 0,
      usedDefensively: 0,
      usedForRotation: 0,
      oneWayAttempts: 0,
      oneWayKills: 0,
      avgTimingInRound: 0,
      smokeTimings: [],
      smokesFollowedByKill: 0,
      avgTimeToKillAfterSmoke: 0,
      effectiveness: 0,
    };

    if (smokes.length === 0) return analysis;

    const smokeKillTimings: number[] = [];

    for (const smoke of smokes) {
      // Calculer le timing dans le round (0-1)
      const roundKills = playerKills.filter((k) => k.round === smoke.round);
      const firstRoundTick = roundKills.length > 0 ? Math.min(...roundKills.map((k) => k.tick)) : smoke.tick;
      const roundDuration = secondsToTicks(115, this.tickrate); // ~1:55 round time
      const relativeTimng = Math.min(1, (smoke.tick - firstRoundTick + secondsToTicks(15, this.tickrate)) / roundDuration);
      analysis.smokeTimings.push(relativeTimng);

      // Kills pendant que le smoke est actif (~18s)
      const smokeDuration = secondsToTicks(18, this.tickrate);
      const killsDuringSmoke = playerKills.filter(
        (k) => k.round === smoke.round && k.tick > smoke.tick && k.tick < smoke.tick + smokeDuration
      );

      if (killsDuringSmoke.length > 0) {
        analysis.smokesFollowedByKill++;

        for (const kill of killsDuringSmoke) {
          smokeKillTimings.push(ticksToSeconds(kill.tick - smoke.tick, this.tickrate) * 1000);
        }

        // One-way : kill through smoke rapidement après placement
        const oneWayKills = killsDuringSmoke.filter(
          (k) => k.throughSmoke && k.tick < smoke.tick + secondsToTicks(5, this.tickrate)
        );

        if (oneWayKills.length > 0) {
          analysis.oneWayAttempts++;
          analysis.oneWayKills += oneWayKills.length;
        }
      }

      // Déterminer le type d'utilisation
      if (relativeTimng < 0.3) {
        // Début de round = probablement execute ou rotation
        analysis.usedForExecute++;
      } else if (relativeTimng > 0.7) {
        // Fin de round = défensif
        analysis.usedDefensively++;
      } else {
        // Milieu = rotation
        analysis.usedForRotation++;
      }
    }

    // Moyennes
    if (analysis.smokeTimings.length > 0) {
      analysis.avgTimingInRound =
        analysis.smokeTimings.reduce((a, b) => a + b, 0) / analysis.smokeTimings.length;
    }

    if (smokeKillTimings.length > 0) {
      analysis.avgTimeToKillAfterSmoke =
        smokeKillTimings.reduce((a, b) => a + b, 0) / smokeKillTimings.length;
    }

    // Efficacité
    if (smokes.length > 0) {
      const usageRate = smokes.length / totalRounds;
      const impactRate = analysis.smokesFollowedByKill / smokes.length;
      const oneWayBonus = Math.min(0.1, (analysis.oneWayKills / smokes.length) * 0.2);

      analysis.effectiveness = Math.min(1, usageRate * 0.3 + impactRate * 0.5 + 0.2 + oneWayBonus);
    }

    return analysis;
  }

  /**
   * Analyse détaillée des molotovs/incendiaires
   */
  private analyzeMolotovs(
    molotovs: GrenadeEventV2[],
    damages: DamageEventV2[],
    kills: KillEventV2[],
    purchases: ItemPurchase[],
    playerSteamId: string
  ): MolotovAnalysisV2 {
    const molotovsBought = purchases.filter(
      (p) => p.item.includes('molotov') || p.item.includes('incgrenade')
    ).length;

    const analysis: MolotovAnalysisV2 = {
      thrown: molotovs.length,
      bought: molotovsBought,
      unused: Math.max(0, molotovsBought - molotovs.length),
      totalDamage: 0,
      avgDamagePerMolly: 0,
      maxDamageFromSingle: 0,
      kills: 0,
      assists: 0,
      denialMollies: 0,
      pushMollies: 0,
      retakeMollies: 0,
      multiHitMollies: 0,
      avgPlayersHitPerMolly: 0,
      effectiveness: 0,
      damageEfficiency: 0,
    };

    if (molotovs.length === 0) return analysis;

    // Filtrer les dégâts de molotov
    const molotovDamages = damages.filter(
      (d) =>
        d.attackerSteamId === playerSteamId &&
        (d.weapon === 'inferno' || d.weapon.includes('molotov') || d.weapon.includes('incgrenade'))
    );

    analysis.totalDamage = molotovDamages.reduce((sum, d) => sum + d.damage, 0);

    // Analyser par molotov
    const damagePerMolly: Map<number, { damage: number; victims: Set<string> }> = new Map();

    for (const molly of molotovs) {
      const mollyDamages = molotovDamages.filter(
        (d) =>
          d.round === molly.round &&
          d.tick >= molly.tick &&
          d.tick < molly.tick + secondsToTicks(8, this.tickrate) // Durée molotov ~7s
      );

      const totalDamage = mollyDamages.reduce((sum, d) => sum + d.damage, 0);
      const victims = new Set(mollyDamages.map((d) => d.victimSteamId));

      damagePerMolly.set(molly.tick, { damage: totalDamage, victims });

      if (totalDamage > analysis.maxDamageFromSingle) {
        analysis.maxDamageFromSingle = totalDamage;
      }

      if (victims.size >= 2) {
        analysis.multiHitMollies++;
      }

      // Classifier le type de molly
      if (this.isNearDenialPosition(molly.position)) {
        analysis.denialMollies++;
      } else {
        analysis.pushMollies++;
      }
    }

    // Moyennes
    if (molotovs.length > 0) {
      analysis.avgDamagePerMolly = analysis.totalDamage / molotovs.length;
      const totalPlayersHit = Array.from(damagePerMolly.values()).reduce(
        (sum, d) => sum + d.victims.size,
        0
      );
      analysis.avgPlayersHitPerMolly = totalPlayersHit / molotovs.length;
    }

    // Kills
    const molotovKills = kills.filter(
      (k) =>
        k.attackerSteamId === playerSteamId &&
        (k.weapon === 'inferno' || k.weapon.includes('molotov'))
    );
    analysis.kills = molotovKills.length;

    // Efficacité
    // Un bon molotov fait en moyenne 20-30 dégâts
    const avgDamageScore = Math.min(1, analysis.avgDamagePerMolly / 30);
    const denialRate = molotovs.length > 0 ? analysis.denialMollies / molotovs.length : 0;
    const multiHitRate = molotovs.length > 0 ? analysis.multiHitMollies / molotovs.length : 0;

    analysis.damageEfficiency = avgDamageScore;
    analysis.effectiveness = Math.min(1, avgDamageScore * 0.5 + denialRate * 0.3 + multiHitRate * 0.2);

    return analysis;
  }

  /**
   * Analyse détaillée des HE grenades
   */
  private analyzeHE(
    heGrenades: GrenadeEventV2[],
    damages: DamageEventV2[],
    kills: KillEventV2[],
    purchases: ItemPurchase[],
    playerSteamId: string
  ): HEAnalysisV2 {
    const hesBought = purchases.filter((p) => p.item.includes('hegrenade')).length;

    const analysis: HEAnalysisV2 = {
      thrown: heGrenades.length,
      bought: hesBought,
      unused: Math.max(0, hesBought - heGrenades.length),
      totalDamage: 0,
      avgDamagePerHE: 0,
      maxDamageFromSingle: 0,
      kills: 0,
      multiHits: 0,
      playersHitTotal: 0,
      avgPlayersHitPerHE: 0,
      effectiveness: 0,
      damageEfficiency: 0,
    };

    if (heGrenades.length === 0) return analysis;

    // Filtrer les dégâts de HE
    const heDamages = damages.filter(
      (d) => d.attackerSteamId === playerSteamId && d.weapon.includes('hegrenade')
    );

    analysis.totalDamage = heDamages.reduce((sum, d) => sum + d.damage, 0);

    // Grouper par HE (10 ticks de différence max = même HE)
    const damagesByRound: Map<number, DamageEventV2[]> = new Map();
    for (const damage of heDamages) {
      if (!damagesByRound.has(damage.round)) {
        damagesByRound.set(damage.round, []);
      }
      damagesByRound.get(damage.round)!.push(damage);
    }

    const heExplosions: { damage: number; victims: Set<string> }[] = [];

    for (const [, roundDamages] of damagesByRound) {
      const sorted = roundDamages.sort((a, b) => a.tick - b.tick);
      let currentGroup: DamageEventV2[] = [];
      let lastTick = 0;

      for (const damage of sorted) {
        if (damage.tick - lastTick > 10 && currentGroup.length > 0) {
          const totalDamage = currentGroup.reduce((sum, d) => sum + d.damage, 0);
          const victims = new Set(currentGroup.map((d) => d.victimSteamId));
          heExplosions.push({ damage: totalDamage, victims });

          if (totalDamage > analysis.maxDamageFromSingle) {
            analysis.maxDamageFromSingle = totalDamage;
          }
          if (victims.size >= 2) {
            analysis.multiHits++;
          }

          currentGroup = [];
        }

        currentGroup.push(damage);
        lastTick = damage.tick;
      }

      // Dernier groupe
      if (currentGroup.length > 0) {
        const totalDamage = currentGroup.reduce((sum, d) => sum + d.damage, 0);
        const victims = new Set(currentGroup.map((d) => d.victimSteamId));
        heExplosions.push({ damage: totalDamage, victims });

        if (totalDamage > analysis.maxDamageFromSingle) {
          analysis.maxDamageFromSingle = totalDamage;
        }
        if (victims.size >= 2) {
          analysis.multiHits++;
        }
      }
    }

    // Statistiques
    analysis.playersHitTotal = heExplosions.reduce((sum, e) => sum + e.victims.size, 0);

    if (heGrenades.length > 0) {
      analysis.avgDamagePerHE = analysis.totalDamage / heGrenades.length;
      analysis.avgPlayersHitPerHE = analysis.playersHitTotal / heGrenades.length;
    }

    // Kills
    const heKills = kills.filter(
      (k) => k.attackerSteamId === playerSteamId && k.weapon.includes('hegrenade')
    );
    analysis.kills = heKills.length;

    // Efficacité
    // Un bon HE fait en moyenne 40-60 dégâts
    const avgDamageScore = Math.min(1, analysis.avgDamagePerHE / 50);
    const multiHitRate = heGrenades.length > 0 ? analysis.multiHits / heGrenades.length : 0;

    analysis.damageEfficiency = avgDamageScore;
    analysis.effectiveness = Math.min(1, avgDamageScore * 0.7 + multiHitRate * 0.3);

    return analysis;
  }

  /**
   * Analyse du timing de l'utilisation des utilitaires
   */
  private analyzeUtilityTiming(
    grenades: GrenadeEventV2[],
    playerKills: KillEventV2[],
    totalRounds: number
  ): UtilityTimingAnalysis {
    const analysis: UtilityTimingAnalysis = {
      preExecuteUtility: 0,
      reactiveUtility: 0,
      lateRoundUtility: 0,
      wastedUtility: 0,
      coordinatedUtility: 0,
      soloUtility: 0,
      avgUtilityTiming: 0,
      earlyRoundUtility: 0,
      midRoundUtility: 0,
    };

    if (grenades.length === 0) return analysis;

    const timings: number[] = [];

    for (const grenade of grenades) {
      // Trouver le premier kill du round pour estimer le début
      const roundKills = playerKills.filter((k) => k.round === grenade.round);
      const roundDuration = secondsToTicks(115, this.tickrate);

      // Estimer le timing relatif dans le round
      let relativeTiming = 0.5; // Par défaut milieu de round
      if (roundKills.length > 0) {
        const firstKillTick = Math.min(...roundKills.map((k) => k.tick));
        relativeTiming = Math.max(0, Math.min(1, (grenade.tick - firstKillTick + secondsToTicks(30, this.tickrate)) / roundDuration));
      }

      timings.push(relativeTiming);

      // Classifier par phase
      if (relativeTiming < 0.25) {
        analysis.earlyRoundUtility++;
      } else if (relativeTiming < 0.65) {
        analysis.midRoundUtility++;
      } else {
        analysis.lateRoundUtility++;
      }

      // Vérifier si l'utilitaire a mené à un kill
      const killAfterUtility = playerKills.find(
        (k) =>
          k.round === grenade.round &&
          k.tick > grenade.tick &&
          k.tick < grenade.tick + secondsToTicks(5, this.tickrate)
      );

      if (killAfterUtility) {
        const timeToKill = ticksToSeconds(killAfterUtility.tick - grenade.tick, this.tickrate);
        if (timeToKill > 2) {
          analysis.preExecuteUtility++;
        } else {
          analysis.reactiveUtility++;
        }
      } else {
        // Pas de kill après = potentiellement gaspillé
        const anyKillThisRound = playerKills.some((k) => k.round === grenade.round);
        if (!anyKillThisRound) {
          analysis.wastedUtility++;
        }
      }
    }

    if (timings.length > 0) {
      analysis.avgUtilityTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
    }

    // Coordination vs solo (basé sur les grenades proches dans le temps)
    for (let i = 0; i < grenades.length; i++) {
      const grenade = grenades[i];
      const nearbyGrenades = grenades.filter(
        (g, j) =>
          i !== j &&
          g.round === grenade.round &&
          Math.abs(g.tick - grenade.tick) < secondsToTicks(3, this.tickrate)
      );

      if (nearbyGrenades.length > 0) {
        analysis.coordinatedUtility++;
      } else {
        analysis.soloUtility++;
      }
    }

    return analysis;
  }

  /**
   * Analyse de l'économie utilitaire
   */
  private analyzeUtilityEconomy(
    purchases: ItemPurchase[],
    grenades: GrenadeEventV2[],
    totalRounds: number
  ): UtilityEconomy {
    const economy: UtilityEconomy = {
      totalSpent: 0,
      flashesBought: 0,
      smokesBought: 0,
      molotovsBought: 0,
      hesBought: 0,
      flashesUsed: grenades.filter((g) => g.type === 'flash').length,
      smokesUsed: grenades.filter((g) => g.type === 'smoke').length,
      molotovsUsed: grenades.filter((g) => g.type === 'molotov').length,
      hesUsed: grenades.filter((g) => g.type === 'he').length,
      wasteRate: 0,
      avgUtilityPerRound: 0,
      avgUtilitySpentPerRound: 0,
    };

    // Compter les achats
    for (const purchase of purchases) {
      const item = purchase.item.toLowerCase();

      if (item.includes('flash')) {
        economy.flashesBought++;
        economy.totalSpent += GRENADE_PRICES.flashbang;
      } else if (item.includes('smoke')) {
        economy.smokesBought++;
        economy.totalSpent += GRENADE_PRICES.smokegrenade;
      } else if (item.includes('molotov')) {
        economy.molotovsBought++;
        economy.totalSpent += GRENADE_PRICES.molotov;
      } else if (item.includes('incgrenade')) {
        economy.molotovsBought++;
        economy.totalSpent += GRENADE_PRICES.incgrenade;
      } else if (item.includes('hegrenade')) {
        economy.hesBought++;
        economy.totalSpent += GRENADE_PRICES.hegrenade;
      }
    }

    // Calculer le taux de gaspillage
    const totalBought =
      economy.flashesBought + economy.smokesBought + economy.molotovsBought + economy.hesBought;
    const totalUsed = economy.flashesUsed + economy.smokesUsed + economy.molotovsUsed + economy.hesUsed;

    if (totalBought > 0) {
      economy.wasteRate = Math.max(0, (totalBought - totalUsed) / totalBought);
    }

    // Moyennes par round
    if (totalRounds > 0) {
      economy.avgUtilityPerRound = totalUsed / totalRounds;
      economy.avgUtilitySpentPerRound = economy.totalSpent / totalRounds;
    }

    return economy;
  }

  /**
   * Analyse par round
   */
  private analyzeByRound(
    grenades: GrenadeEventV2[],
    blindsGiven: PlayerBlindEvent[],
    damages: DamageEventV2[],
    playerSteamId: string,
    totalRounds: number
  ): RoundUtilityAnalysis[] {
    const breakdown: RoundUtilityAnalysis[] = [];

    for (let round = 1; round <= totalRounds; round++) {
      const roundGrenades = grenades.filter((g) => g.round === round);
      const roundBlinds = blindsGiven.filter((b) => b.round === round);
      const roundDamages = damages.filter(
        (d) =>
          d.round === round &&
          d.attackerSteamId === playerSteamId &&
          (d.weapon === 'inferno' ||
            d.weapon.includes('molotov') ||
            d.weapon.includes('hegrenade'))
      );

      breakdown.push({
        round,
        flashesThrown: roundGrenades.filter((g) => g.type === 'flash').length,
        smokesThrown: roundGrenades.filter((g) => g.type === 'smoke').length,
        molotovsThrown: roundGrenades.filter((g) => g.type === 'molotov').length,
        hesThrown: roundGrenades.filter((g) => g.type === 'he').length,
        totalDamage: roundDamages.reduce((sum, d) => sum + d.damage, 0),
        enemiesFlashed: roundBlinds.length,
        totalBlindDuration: roundBlinds.reduce((sum, b) => sum + b.duration, 0),
        hadImpact:
          roundBlinds.length > 0 || roundDamages.reduce((sum, d) => sum + d.damage, 0) > 20,
      });
    }

    return breakdown;
  }

  /**
   * Calcul des scores finaux
   */
  private calculateScores(
    flash: FlashAnalysisV2,
    smoke: SmokeAnalysisV2,
    molotov: MolotovAnalysisV2,
    he: HEAnalysisV2,
    timing: UtilityTimingAnalysis,
    economy: UtilityEconomy
  ): UtilityAnalysisV2['scores'] {
    // Flash score (0-100)
    let flashScore = 40;
    if (flash.thrown > 0) {
      flashScore = Math.round(flash.effectiveness * 60 + 40);

      // Bonus pop-flash
      flashScore += Math.min(10, flash.popFlashes * 3);

      // Pénalité team flash
      flashScore -= Math.min(15, flash.teammatesFlashed * 2);

      flashScore = Math.max(0, Math.min(100, flashScore));
    }

    // Smoke score (0-100)
    let smokeScore = 40;
    if (smoke.thrown > 0) {
      smokeScore = Math.round(smoke.effectiveness * 50 + 40);

      // Bonus one-way
      smokeScore += Math.min(10, smoke.oneWayKills * 5);

      smokeScore = Math.max(0, Math.min(100, smokeScore));
    }

    // Molotov score (0-100)
    let molotovScore = 40;
    if (molotov.thrown > 0) {
      molotovScore = Math.round(molotov.effectiveness * 50 + 40);

      // Bonus dégâts
      molotovScore += Math.min(10, Math.floor(molotov.avgDamagePerMolly / 5));

      molotovScore = Math.max(0, Math.min(100, molotovScore));
    }

    // HE score (0-100)
    let heScore = 40;
    if (he.thrown > 0) {
      heScore = Math.round(he.effectiveness * 50 + 40);

      // Bonus multi-hit
      heScore += Math.min(10, he.multiHits * 5);

      heScore = Math.max(0, Math.min(100, heScore));
    }

    // Timing score (0-100)
    const totalUtility =
      flash.thrown + smoke.thrown + molotov.thrown + he.thrown;
    let timingScore = 50;
    if (totalUtility > 0) {
      const preExecuteRate = timing.preExecuteUtility / totalUtility;
      const wastedRate = timing.wastedUtility / totalUtility;
      const coordinatedRate = timing.coordinatedUtility / totalUtility;

      timingScore = Math.round(50 + preExecuteRate * 25 + coordinatedRate * 15 - wastedRate * 20);
      timingScore = Math.max(0, Math.min(100, timingScore));
    }

    // Economy score (0-100)
    let economyScore = 60;
    economyScore -= Math.round(economy.wasteRate * 30);
    economyScore += Math.min(20, Math.round(economy.avgUtilityPerRound * 10));
    economyScore = Math.max(0, Math.min(100, economyScore));

    // Score global pondéré
    const weights = {
      flash: 0.30,
      smoke: 0.25,
      molotov: 0.20,
      he: 0.10,
      timing: 0.10,
      economy: 0.05,
    };

    const overall = Math.round(
      flashScore * weights.flash +
      smokeScore * weights.smoke +
      molotovScore * weights.molotov +
      heScore * weights.he +
      timingScore * weights.timing +
      economyScore * weights.economy
    );

    return {
      flashEfficiency: flashScore,
      smokeEfficiency: smokeScore,
      molotovEfficiency: molotovScore,
      heEfficiency: heScore,
      timingScore,
      economyScore,
      overall: Math.max(0, Math.min(100, overall)),
    };
  }

  /**
   * Vérifie si une position est proche d'une position de denial
   */
  private isNearDenialPosition(position: Position3D): boolean {
    const mapPositions = DENIAL_POSITIONS[this.mapName] || [];

    for (const denialPos of mapPositions) {
      const distance = Math.sqrt(
        Math.pow(position.x - denialPos.position.x, 2) +
        Math.pow(position.y - denialPos.position.y, 2)
      );

      if (distance < denialPos.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Détermine si deux joueurs sont dans la même équipe
   */
  private sameTeam(
    player1: string,
    player2: string,
    kills: KillEventV2[]
  ): boolean {
    // Si l'un a tué l'autre, ils sont dans des équipes différentes
    const killedEachOther = kills.some(
      (k) =>
        (k.attackerSteamId === player1 && k.victimSteamId === player2) ||
        (k.attackerSteamId === player2 && k.victimSteamId === player1)
    );

    if (killedEachOther) return false;

    // Si les deux ont tué la même personne, ils sont probablement dans la même équipe
    const player1Victims = new Set(
      kills.filter((k) => k.attackerSteamId === player1).map((k) => k.victimSteamId)
    );
    const player2Victims = new Set(
      kills.filter((k) => k.attackerSteamId === player2).map((k) => k.victimSteamId)
    );

    for (const victim of player1Victims) {
      if (player2Victims.has(victim)) {
        return true;
      }
    }

    return true; // Par défaut, supposer même équipe
  }
}

// =============================================================================
// MÉTRIQUES EXPORTÉES
// =============================================================================

/**
 * Définitions des métriques pour l'interface utilisateur
 */
export const UTILITY_V2_METRICS = {
  // Flash
  flashEfficiency: {
    key: 'flashEfficiency',
    label: 'Efficacité Flash',
    description: 'Évalue la qualité des flashbangs basée sur les ennemis aveuglés et la durée',
    category: 'utility',
    subcategory: 'flash',
    unit: 'score',
    format: 'percentage',
    higherIsBetter: true,
  },
  avgEnemyBlindDuration: {
    key: 'avgEnemyBlindDuration',
    label: 'Durée Moyenne Aveuglement',
    description: 'Durée moyenne pendant laquelle les ennemis sont aveuglés',
    category: 'utility',
    subcategory: 'flash',
    unit: 's',
    format: 'decimal',
    higherIsBetter: true,
  },
  popFlashRate: {
    key: 'popFlashRate',
    label: 'Taux Pop-Flash',
    description: 'Pourcentage de flashs suivis d\'un kill rapide',
    category: 'utility',
    subcategory: 'flash',
    unit: '%',
    format: 'percentage',
    higherIsBetter: true,
  },
  teamFlashRate: {
    key: 'teamFlashRate',
    label: 'Taux Team Flash',
    description: 'Pourcentage de flashs touchant des coéquipiers',
    category: 'utility',
    subcategory: 'flash',
    unit: '%',
    format: 'percentage',
    higherIsBetter: false,
  },

  // Smoke
  smokeEfficiency: {
    key: 'smokeEfficiency',
    label: 'Efficacité Smoke',
    description: 'Évalue l\'utilisation stratégique des smokes',
    category: 'utility',
    subcategory: 'smoke',
    unit: 'score',
    format: 'percentage',
    higherIsBetter: true,
  },
  oneWaySuccess: {
    key: 'oneWaySuccess',
    label: 'Kills One-Way',
    description: 'Nombre de kills à travers vos smokes',
    category: 'utility',
    subcategory: 'smoke',
    unit: 'kills',
    format: 'integer',
    higherIsBetter: true,
  },

  // Molotov
  molotovEfficiency: {
    key: 'molotovEfficiency',
    label: 'Efficacité Molotov',
    description: 'Évalue les dégâts et le denial des molotovs',
    category: 'utility',
    subcategory: 'molotov',
    unit: 'score',
    format: 'percentage',
    higherIsBetter: true,
  },
  avgMolotovDamage: {
    key: 'avgMolotovDamage',
    label: 'Dégâts Moyens Molotov',
    description: 'Dégâts moyens infligés par molotov',
    category: 'utility',
    subcategory: 'molotov',
    unit: 'HP',
    format: 'decimal',
    higherIsBetter: true,
  },

  // HE
  heEfficiency: {
    key: 'heEfficiency',
    label: 'Efficacité HE',
    description: 'Évalue les dégâts et multi-hits des HE',
    category: 'utility',
    subcategory: 'he',
    unit: 'score',
    format: 'percentage',
    higherIsBetter: true,
  },
  heMultiHitRate: {
    key: 'heMultiHitRate',
    label: 'Taux Multi-Hit HE',
    description: 'Pourcentage de HE touchant 2+ joueurs',
    category: 'utility',
    subcategory: 'he',
    unit: '%',
    format: 'percentage',
    higherIsBetter: true,
  },

  // Global
  utilityUsageRate: {
    key: 'utilityUsageRate',
    label: 'Taux Utilisation',
    description: 'Pourcentage des utilitaires achetés effectivement utilisés',
    category: 'utility',
    subcategory: 'economy',
    unit: '%',
    format: 'percentage',
    higherIsBetter: true,
  },
  avgUtilityPerRound: {
    key: 'avgUtilityPerRound',
    label: 'Utilitaires/Round',
    description: 'Nombre moyen d\'utilitaires utilisés par round',
    category: 'utility',
    subcategory: 'economy',
    unit: 'grenades',
    format: 'decimal',
    higherIsBetter: true,
  },
} as const;
