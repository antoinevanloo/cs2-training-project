/**
 * Analysis Engine v2.0 - Moteur d'analyse complet
 *
 * Ce moteur intègre tous les analyzers v2:
 * - Aim, Positioning, Timing, Decision (originaux)
 * - Movement (counter-strafing, crouch, scope)
 * - Awareness (bomb, flash, info)
 * - Teamplay (trades, support, coordination)
 * - Utility v2 (avec PlayerBlindEvent)
 * - Economy v2 (avec données réelles)
 *
 * Utilise ParsedDemoDataV2 pour exploiter toutes les nouvelles données.
 */

import {
  ParsedDemoDataV2,
  KillEventV2,
  DamageEventV2,
  GrenadeEventV2,
  PlayerBlindEvent,
  BombEvent,
  RoundEconomy,
  ItemPurchase,
  WeaponFireEvent,
  PositionSnapshotV2,
  ClutchSituation,
  EntryDuel,
  TradeEvent,
  TEAM_CT,
  TEAM_T,
} from '../demo-parser/types-v2';

// Analyzers originaux
import { AimAnalyzer } from './analyzers/aim';
import { PositioningAnalyzer } from './analyzers/positioning';
import { TimingAnalyzer } from './analyzers/timing';
import { DecisionAnalyzer } from './analyzers/decision';

// Nouveaux analyzers v2
import { MovementAnalyzer } from './analyzers/movement';
import { AwarenessAnalyzer } from './analyzers/awareness';
import { TeamplayAnalyzer } from './analyzers/teamplay';
import { UtilityAnalyzerV2 } from './analyzers/utility-v2';
import { EconomyAnalyzerV2 } from './analyzers/economy-v2';

// Calculators
import { calculateRating } from './calculators/rating';
import { calculateADR } from './calculators/adr';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Configuration de l'analyse
 */
export interface AnalysisConfigV2 {
  // Features à activer/désactiver
  enableMovementAnalysis: boolean;
  enableAwarenessAnalysis: boolean;
  enableTeamplayAnalysis: boolean;
  enableUtilityV2: boolean;
  enableEconomyV2: boolean;

  // Poids des catégories pour le score global
  weights: {
    aim: number;
    positioning: number;
    utility: number;
    economy: number;
    timing: number;
    decision: number;
    movement: number;
    awareness: number;
    teamplay: number;
  };

  // Options des analyzers
  tickrate: number;
  mapName: string;
}

/**
 * Résultat d'analyse étendu v2
 */
export interface AnalysisResultV2 {
  // Statistiques de base du joueur
  playerStats: {
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    hsPercentage: number;
    adr: number;
    kast: number;
    rating: number;
    // Nouvelles stats
    entryKills: number;
    entryDeaths: number;
    clutchWins: number;
    clutchAttempts: number;
    tradesGiven: number;
    tradesReceived: number;
  };

  // Scores par catégorie (0-100)
  scores: {
    overall: number;
    aim: number;
    positioning: number;
    utility: number;
    economy: number;
    timing: number;
    decision: number;
    // Nouveaux scores
    movement: number;
    awareness: number;
    teamplay: number;
  };

  // Analyses détaillées par catégorie
  analyses: {
    aim: any;
    positioning: any;
    utility: any;
    economy: any;
    timing: any;
    decision: any;
    movement?: any;
    awareness?: any;
    teamplay?: any;
  };

  // Forces et faiblesses identifiées
  strengths: string[];
  weaknesses: string[];

  // Recommandations prioritaires
  recommendations: Recommendation[];

  // Métadonnées
  metadata: {
    version: string;
    analyzedAt: string;
    totalRounds: number;
    map: string;
    duration: number;
  };
}

/**
 * Recommandation d'amélioration
 */
export interface Recommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  targetValue: number;
}

// =============================================================================
// CONFIGURATION PAR DÉFAUT
// =============================================================================

const DEFAULT_CONFIG: AnalysisConfigV2 = {
  enableMovementAnalysis: true,
  enableAwarenessAnalysis: true,
  enableTeamplayAnalysis: true,
  enableUtilityV2: true,
  enableEconomyV2: true,
  weights: {
    aim: 0.20,
    positioning: 0.15,
    utility: 0.12,
    economy: 0.08,
    timing: 0.10,
    decision: 0.10,
    movement: 0.10,
    awareness: 0.08,
    teamplay: 0.07,
  },
  tickrate: 128,
  mapName: 'unknown',
};

// =============================================================================
// CLASSE PRINCIPALE
// =============================================================================

export class AnalysisEngineV2 {
  private config: AnalysisConfigV2;

  // Analyzers originaux
  private aimAnalyzer: AimAnalyzer;
  private positioningAnalyzer: PositioningAnalyzer;
  private timingAnalyzer: TimingAnalyzer;
  private decisionAnalyzer: DecisionAnalyzer;

  // Nouveaux analyzers
  private movementAnalyzer: MovementAnalyzer;
  private awarenessAnalyzer: AwarenessAnalyzer;
  private teamplayAnalyzer: TeamplayAnalyzer;
  private utilityAnalyzerV2: UtilityAnalyzerV2;
  private economyAnalyzerV2: EconomyAnalyzerV2;

  constructor(config: Partial<AnalysisConfigV2> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialiser les analyzers originaux
    this.aimAnalyzer = new AimAnalyzer();
    this.positioningAnalyzer = new PositioningAnalyzer();
    this.timingAnalyzer = new TimingAnalyzer();
    this.decisionAnalyzer = new DecisionAnalyzer();

    // Initialiser les nouveaux analyzers (pas de constructeurs avec options)
    this.movementAnalyzer = new MovementAnalyzer();
    this.awarenessAnalyzer = new AwarenessAnalyzer();
    this.teamplayAnalyzer = new TeamplayAnalyzer();
    this.utilityAnalyzerV2 = new UtilityAnalyzerV2();
    this.economyAnalyzerV2 = new EconomyAnalyzerV2();
  }

  /**
   * Analyse complète d'une démo avec données v2
   */
  async analyzeDemo(
    data: ParsedDemoDataV2,
    mainPlayerSteamId: string
  ): Promise<AnalysisResultV2> {
    const startTime = Date.now();

    // Mettre à jour la config avec les infos de la démo
    this.config.tickrate = data.metadata.tickrate || 128;
    this.config.mapName = data.metadata.map;

    // Trouver les infos du joueur
    const playerInfo = data.players.find((p) => p.steamId === mainPlayerSteamId);
    const playerTeam = playerInfo?.team || TEAM_CT;

    // Trouver les coéquipiers
    const teammates = data.players
      .filter((p) => p.team === playerTeam && p.steamId !== mainPlayerSteamId)
      .map((p) => p.steamId);

    // Filtrer les données pour le joueur principal
    const playerKills = data.kills.filter((k) => k.attackerSteamId === mainPlayerSteamId);
    const playerDeaths = data.kills.filter((k) => k.victimSteamId === mainPlayerSteamId);
    const playerDamages = data.damages.filter((d) => d.attackerSteamId === mainPlayerSteamId);
    const playerGrenades = data.grenades.filter((g) => g.throwerSteamId === mainPlayerSteamId);
    const playerBlindsGiven = data.playerBlinds.filter((b) => b.attackerSteamId === mainPlayerSteamId);
    const playerBlindsReceived = data.playerBlinds.filter((b) => b.victimSteamId === mainPlayerSteamId);
    const playerPurchases = data.purchases.filter((p) => p.steamId === mainPlayerSteamId);
    const playerWeaponFires = data.weaponFires?.filter((w) => w.steamId === mainPlayerSteamId) || [];
    const playerClutches = data.clutches.filter((c) => c.steamId === mainPlayerSteamId);
    const playerEntryDuels = data.entryDuels.filter(
      (e) => e.winnerId === mainPlayerSteamId || e.loserId === mainPlayerSteamId
    );
    const playerTrades = data.trades.filter(
      (t) => t.traderId === mainPlayerSteamId || t.originalVictimId === mainPlayerSteamId
    );

    // Calculer les statistiques de base
    const totalRounds = data.rounds.length;
    const kills = playerKills.length;
    const deaths = playerDeaths.length;
    const headshots = playerKills.filter((k) => k.headshot).length;
    const hsPercentage = kills > 0 ? (headshots / kills) * 100 : 0;
    const assists = this.calculateAssists(data, mainPlayerSteamId);
    const adr = calculateADR(playerDamages as any[], totalRounds);
    const kast = this.calculateKAST(data, mainPlayerSteamId);
    const rating = calculateRating({ kills, deaths, assists, adr, kast, totalRounds });

    // Statistiques d'entry
    const entryKills = playerEntryDuels.filter((e) => e.winnerId === mainPlayerSteamId).length;
    const entryDeaths = playerEntryDuels.filter((e) => e.loserId === mainPlayerSteamId).length;

    // Statistiques de clutch
    const clutchWins = playerClutches.filter((c) => c.won).length;
    const clutchAttempts = playerClutches.length;

    // Statistiques de trade
    const tradesGiven = playerTrades.filter((t) => t.traderId === mainPlayerSteamId).length;
    const tradesReceived = playerTrades.filter((t) => t.originalVictimId === mainPlayerSteamId).length;

    // Convertir les données pour les anciens analyzers
    const legacyPositions = this.convertPositionsToLegacy(data.positions || []);

    // ========== ANALYSES ==========

    // Analyses originales
    const aimAnalysis = this.aimAnalyzer.analyze(
      playerKills as any[],
      playerDamages as any[],
      legacyPositions,
      mainPlayerSteamId
    );

    const positioningAnalysis = this.positioningAnalyzer.analyze(
      playerDeaths as any[],
      legacyPositions,
      data.metadata.map,
      mainPlayerSteamId
    );

    const timingAnalysis = this.timingAnalyzer.analyze(
      data.kills as any[],
      legacyPositions,
      mainPlayerSteamId
    );

    const decisionAnalysis = this.decisionAnalyzer.analyze(
      data as any,
      mainPlayerSteamId
    );

    // Nouvelles analyses v2
    let movementAnalysis = null;
    let awarenessAnalysis = null;
    let teamplayAnalysis = null;
    let utilityAnalysis = null;
    let economyAnalysis = null;

    if (this.config.enableMovementAnalysis && data.weaponFires) {
      movementAnalysis = this.movementAnalyzer.analyze(
        playerWeaponFires,
        playerKills as any[],
        playerDamages as any[],
        data.positions || [],
        mainPlayerSteamId
      );
    }

    if (this.config.enableAwarenessAnalysis) {
      awarenessAnalysis = this.awarenessAnalyzer.analyze(
        data.bombEvents,
        playerBlindsReceived,
        data.kills as any[],
        data.positions || [],
        data.rounds as any[],
        mainPlayerSteamId,
        playerTeam
      );
    }

    if (this.config.enableTeamplayAnalysis) {
      teamplayAnalysis = this.teamplayAnalyzer.analyze(
        data.kills as any[],
        data.damages as any[],
        data.grenades as any[],
        data.playerBlinds,
        data.trades,
        data.entryDuels,
        data.clutches,
        data.rounds as any[],
        mainPlayerSteamId,
        playerTeam
      );
    }

    if (this.config.enableUtilityV2) {
      utilityAnalysis = this.utilityAnalyzerV2.analyze(
        playerGrenades as any[],
        data.playerBlinds,
        playerDamages as any[],
        data.kills as any[],
        playerPurchases as any[],
        mainPlayerSteamId,
        playerTeam,
        teammates,
        totalRounds
      );
    } else {
      // Fallback sur l'ancien utility analyzer
      const utilityAnalyzer = new (await import('./analyzers/utility')).UtilityAnalyzer();
      utilityAnalysis = utilityAnalyzer.analyze(
        playerGrenades as any[],
        data.damages as any[],
        data.kills as any[],
        mainPlayerSteamId
      );
    }

    if (this.config.enableEconomyV2 && data.economyByRound.length > 0) {
      economyAnalysis = this.economyAnalyzerV2.analyze(
        data.economyByRound,
        data.purchases,
        data.kills as any[],
        data.rounds as any[],
        mainPlayerSteamId,
        playerTeam
      );
    } else {
      // Fallback sur l'ancien economy analyzer
      const economyAnalyzer = new (await import('./analyzers/economy')).EconomyAnalyzer();
      economyAnalysis = economyAnalyzer.analyze(
        [] as any,
        data.rounds as any[],
        mainPlayerSteamId
      );
    }

    // ========== CALCUL DES SCORES ==========

    const aimScore = this.calculateScore(aimAnalysis);
    const positioningScore = this.calculateScore(positioningAnalysis);
    const timingScore = this.calculateScore(timingAnalysis);
    const decisionScore = this.calculateScore(decisionAnalysis);
    const movementScore = movementAnalysis
      ? movementAnalysis.overallScore ?? 50
      : 50;
    const awarenessScore = awarenessAnalysis
      ? awarenessAnalysis.overallScore ?? 50
      : 50;
    const teamplayScore = teamplayAnalysis
      ? teamplayAnalysis.overallScore ?? 50
      : 50;
    const utilityScore = utilityAnalysis
      ? (utilityAnalysis as any).scores?.overall || this.calculateScore(utilityAnalysis)
      : 50;
    const economyScore = economyAnalysis
      ? (economyAnalysis as any).scores?.overall || this.calculateScore(economyAnalysis)
      : 50;

    // Score global pondéré
    const overallScore = this.calculateOverallScore({
      aim: aimScore,
      positioning: positioningScore,
      utility: utilityScore,
      economy: economyScore,
      timing: timingScore,
      decision: decisionScore,
      movement: movementScore,
      awareness: awarenessScore,
      teamplay: teamplayScore,
    });

    // ========== FORCES ET FAIBLESSES ==========

    const scores = {
      aim: aimScore,
      positioning: positioningScore,
      utility: utilityScore,
      economy: economyScore,
      timing: timingScore,
      decision: decisionScore,
      movement: movementScore,
      awareness: awarenessScore,
      teamplay: teamplayScore,
    };

    const { strengths, weaknesses } = this.identifyStrengthsWeaknesses(scores);

    // ========== RECOMMANDATIONS ==========

    const recommendations = this.generateRecommendations(
      scores,
      {
        aim: aimAnalysis,
        positioning: positioningAnalysis,
        utility: utilityAnalysis,
        economy: economyAnalysis,
        timing: timingAnalysis,
        decision: decisionAnalysis,
        movement: movementAnalysis,
        awareness: awarenessAnalysis,
        teamplay: teamplayAnalysis,
      }
    );

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
        entryKills,
        entryDeaths,
        clutchWins,
        clutchAttempts,
        tradesGiven,
        tradesReceived,
      },
      scores: {
        overall: overallScore,
        aim: aimScore,
        positioning: positioningScore,
        utility: utilityScore,
        economy: economyScore,
        timing: timingScore,
        decision: decisionScore,
        movement: movementScore,
        awareness: awarenessScore,
        teamplay: teamplayScore,
      },
      analyses: {
        aim: aimAnalysis,
        positioning: positioningAnalysis,
        utility: utilityAnalysis,
        economy: economyAnalysis,
        timing: timingAnalysis,
        decision: decisionAnalysis,
        movement: movementAnalysis,
        awareness: awarenessAnalysis,
        teamplay: teamplayAnalysis,
      },
      strengths,
      weaknesses,
      recommendations,
      metadata: {
        version: '2.0',
        analyzedAt: new Date().toISOString(),
        totalRounds,
        map: data.metadata.map,
        duration: data.metadata.duration,
      },
    };
  }

  /**
   * Calcule le nombre d'assists
   */
  private calculateAssists(data: ParsedDemoDataV2, playerSteamId: string): number {
    let assists = 0;
    const tickrate = data.metadata.tickrate || 128;
    const assistWindow = tickrate * 5; // 5 secondes

    for (const kill of data.kills) {
      if (kill.attackerSteamId === playerSteamId) continue;

      // Vérifier si le joueur a infligé des dégâts à la victime récemment
      const recentDamage = data.damages.find(
        (d) =>
          d.attackerSteamId === playerSteamId &&
          d.victimSteamId === kill.victimSteamId &&
          d.round === kill.round &&
          kill.tick - d.tick < assistWindow &&
          kill.tick - d.tick >= 0
      );

      // Ou a flashé la victime
      const flashAssist = kill.assistedFlash && data.playerBlinds.some(
        (b) =>
          b.attackerSteamId === playerSteamId &&
          b.victimSteamId === kill.victimSteamId &&
          b.round === kill.round
      );

      if (recentDamage || flashAssist) {
        assists++;
      }
    }

    return assists;
  }

  /**
   * Calcule le KAST (Kill, Assist, Survive, Trade)
   */
  private calculateKAST(data: ParsedDemoDataV2, playerSteamId: string): number {
    let kastRounds = 0;

    for (const round of data.rounds) {
      const roundKills = data.kills.filter((k) => k.round === round.roundNumber);

      const hasKill = roundKills.some((k) => k.attackerSteamId === playerSteamId);
      const survived = !roundKills.some((k) => k.victimSteamId === playerSteamId);

      // Vérifier le trade via les données v2
      const traded = data.trades.some(
        (t) =>
          t.round === round.roundNumber &&
          t.originalVictimId === playerSteamId
      );

      // Vérifier l'assist
      const hasAssist = roundKills.some(
        (k) =>
          k.attackerSteamId !== playerSteamId &&
          (k.assistedFlash ||
            data.damages.some(
              (d) =>
                d.attackerSteamId === playerSteamId &&
                d.victimSteamId === k.victimSteamId &&
                d.round === round.roundNumber &&
                k.tick - d.tick < 640 && // 5 secondes
                k.tick - d.tick >= 0
            ))
      );

      if (hasKill || survived || traded || hasAssist) {
        kastRounds++;
      }
    }

    return data.rounds.length > 0 ? (kastRounds / data.rounds.length) * 100 : 0;
  }

  /**
   * Convertit les positions v2 en format legacy
   */
  private convertPositionsToLegacy(positions: PositionSnapshotV2[]): any[] {
    return positions.map((snapshot) => ({
      tick: snapshot.tick,
      players: snapshot.players.map((p) => ({
        steamId: p.steamId,
        x: p.x,
        y: p.y,
        z: p.z,
        health: p.health,
        armor: p.armor,
        team: p.team,
      })),
    }));
  }

  /**
   * Calcule un score à partir des métriques d'une analyse
   */
  private calculateScore(analysis: any): number {
    if (!analysis) return 50;

    // Si l'analyse a déjà un score overall
    if (analysis.scores?.overall !== undefined) {
      return analysis.scores.overall;
    }

    // Si l'analyse a des métriques
    if (analysis.metrics) {
      const metrics = Object.values(analysis.metrics) as number[];
      if (metrics.length === 0) return 50;

      const sum = metrics.reduce((a, b) => a + b, 0);
      return Math.min(100, Math.max(0, Math.round(sum / metrics.length)));
    }

    return 50;
  }

  /**
   * Calcule le score global pondéré
   */
  private calculateOverallScore(scores: Record<string, number>): number {
    let weighted = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(this.config.weights)) {
      const score = scores[key];
      if (score !== undefined) {
        weighted += score * weight;
        totalWeight += weight;
      }
    }

    // Normaliser si tous les poids ne sont pas utilisés
    if (totalWeight < 0.99) {
      weighted = weighted / totalWeight;
    }

    return Math.round(weighted);
  }

  /**
   * Identifie les forces et faiblesses
   */
  private identifyStrengthsWeaknesses(scores: Record<string, number>): {
    strengths: string[];
    weaknesses: string[];
  } {
    const labels: Record<string, string> = {
      aim: 'Aim et précision',
      positioning: 'Positionnement',
      utility: 'Utilisation des grenades',
      economy: 'Gestion économique',
      timing: 'Timing et réactivité',
      decision: 'Prise de décision',
      movement: 'Movement et counter-strafing',
      awareness: 'Awareness (bombe, flash, info)',
      teamplay: 'Jeu en équipe',
    };

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Trier les scores
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);

    // Top 3 = forces (si > 60)
    for (const [key, score] of sortedScores.slice(0, 3)) {
      if (score >= 60 && labels[key]) {
        strengths.push(labels[key]);
      }
    }

    // Bottom 3 = faiblesses (si < 50)
    for (const [key, score] of sortedScores.slice(-3).reverse()) {
      if (score < 50 && labels[key]) {
        weaknesses.push(labels[key]);
      }
    }

    return { strengths, weaknesses };
  }

  /**
   * Génère des recommandations basées sur les analyses
   */
  private generateRecommendations(
    scores: Record<string, number>,
    analyses: Record<string, any>
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Trouver les catégories les plus faibles
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => a - b);

    // Générer des recommandations pour les 3 catégories les plus faibles
    for (const [category, score] of sortedScores.slice(0, 3)) {
      if (score >= 70) continue; // Pas besoin de recommandation

      const rec = this.getRecommendationForCategory(category, score, analyses[category]);
      if (rec) {
        recommendations.push(rec);
      }
    }

    return recommendations.slice(0, 5); // Max 5 recommandations
  }

  /**
   * Génère une recommandation pour une catégorie
   */
  private getRecommendationForCategory(
    category: string,
    score: number,
    analysis: any
  ): Recommendation | null {
    const priority: 'high' | 'medium' | 'low' =
      score < 40 ? 'high' : score < 55 ? 'medium' : 'low';

    switch (category) {
      case 'movement':
        if (analysis?.counterStrafing?.counterStrafeRate < 60) {
          return {
            category: 'Movement',
            priority,
            title: 'Améliorer le counter-strafing',
            description:
              'Pratiquez l\'arrêt avant de tirer. Appuyez sur la touche opposée pour vous arrêter instantanément.',
            metric: 'counterStrafeRate',
            currentValue: analysis?.counterStrafing?.counterStrafeRate || 0,
            targetValue: 70,
          };
        }
        break;

      case 'awareness':
        if (analysis?.flash?.blindDeathRate > 15) {
          return {
            category: 'Awareness',
            priority,
            title: 'Réduire les morts aveuglé',
            description:
              'Apprenez à anticiper et esquiver les flashs ennemies en vous retournant ou vous cachant.',
            metric: 'blindDeathRate',
            currentValue: analysis?.flash?.blindDeathRate || 0,
            targetValue: 10,
          };
        }
        break;

      case 'teamplay':
        if (analysis?.trading?.avgTradeTime > 3) {
          return {
            category: 'Teamplay',
            priority,
            title: 'Améliorer la vitesse de trade',
            description:
              'Restez plus proche de vos coéquipiers pour pouvoir les trade rapidement.',
            metric: 'avgTradeTime',
            currentValue: analysis?.trading?.avgTradeTime || 0,
            targetValue: 2,
          };
        }
        break;

      case 'utility':
        if (analysis?.flash?.teamFlashRate > 25) {
          return {
            category: 'Utility',
            priority,
            title: 'Réduire les team flashs',
            description:
              'Communiquez avec votre équipe avant de flash et utilisez des pop-flashs.',
            metric: 'teamFlashRate',
            currentValue: analysis?.flash?.teamFlashRate || 0,
            targetValue: 15,
          };
        }
        break;

      case 'economy':
        if (analysis?.teamSync?.syncRate < 80) {
          return {
            category: 'Economy',
            priority,
            title: 'Synchroniser les achats',
            description:
              'Achetez avec votre équipe. Save quand l\'équipe save, full buy ensemble.',
            metric: 'teamBuySyncRate',
            currentValue: analysis?.teamSync?.syncRate || 0,
            targetValue: 90,
          };
        }
        break;

      case 'aim':
        return {
          category: 'Aim',
          priority,
          title: 'Améliorer le crosshair placement',
          description:
            'Gardez votre viseur au niveau de la tête et pré-aim les angles courants.',
          metric: 'headshotPercentage',
          currentValue: analysis?.metrics?.headshotPercentage || 0,
          targetValue: 50,
        };

      case 'positioning':
        return {
          category: 'Positioning',
          priority,
          title: 'Améliorer le positionnement',
          description:
            'Évitez les positions où vous ne pouvez pas être trade. Jouez plus avec l\'équipe.',
          metric: 'isolationDeathRate',
          currentValue: analysis?.metrics?.isolationDeathRate || 0,
          targetValue: 25,
        };
    }

    return null;
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export const analysisEngineV2 = new AnalysisEngineV2();

/**
 * Factory pour créer un moteur avec une config personnalisée
 */
export function createAnalysisEngine(config?: Partial<AnalysisConfigV2>): AnalysisEngineV2 {
  return new AnalysisEngineV2(config);
}
