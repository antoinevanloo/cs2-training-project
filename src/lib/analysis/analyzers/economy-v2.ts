/**
 * Economy Analyzer v2.0 - Analyse économique avec données réelles
 *
 * Cette version utilise les données réelles d'économie extraites par le parser:
 * - Balance par joueur par round
 * - Achats détaillés
 * - Valeur d'équipement
 * - État armure/casque/défuseur
 *
 * Fournit une analyse complète des décisions économiques.
 */

import {
  RoundEconomy,
  PlayerRoundEconomy,
  ItemPurchase,
  KillEventV2,
  RoundInfoV2,
  TEAM_CT,
  TEAM_T,
} from '@/lib/demo-parser/types-v2';
import { EconomyAnalysisV2, RoundEconomyAnalysis } from '../types-v2';

// Configuration des seuils économiques
const CONFIG = {
  // Seuils d'argent CS2
  FULL_BUY_MIN: 4500, // Minimum pour full buy
  HALF_BUY_MIN: 2500, // Minimum pour half buy
  FORCE_BUY_MAX: 3500, // Maximum pour force buy
  ECO_MAX: 2000, // Maximum pour eco round

  // Équipement
  RIFLE_COST: 2700,
  AWP_COST: 4750,
  SMG_COST: 1500,
  PISTOL_UPGRADE_COST: 500,
  ARMOR_KEVLAR: 650,
  ARMOR_HELMET: 1000,
  DEFUSER_COST: 400,
  FULL_UTILITY_COST: 1000,

  // Valeurs d'équipement
  FULL_BUY_VALUE_MIN: 4000,
  HALF_BUY_VALUE_MIN: 2000,
  ECO_VALUE_MAX: 1500,

  // Loss bonus (approximation)
  LOSS_BONUS_BASE: 1400,
  LOSS_BONUS_INCREMENT: 500,
  LOSS_BONUS_MAX: 3400,

  // Seuils de décision
  SAVE_THRESHOLD: 2000, // Ne pas acheter si en dessous
  DROP_THRESHOLD: 5000, // Peut drop si au-dessus
};

/**
 * Types de buy
 */
type BuyType = 'full' | 'half' | 'force' | 'eco' | 'save' | 'pistol';

/**
 * Classe principale d'analyse économique v2
 */
export class EconomyAnalyzerV2 {
  /**
   * Analyse complète de l'économie d'un joueur
   */
  analyze(
    economyByRound: RoundEconomy[],
    purchases: ItemPurchase[],
    kills: KillEventV2[],
    rounds: RoundInfoV2[],
    playerSteamId: string,
    playerTeam: number
  ): EconomyAnalysisV2 {
    // Filtrer les données du joueur
    const playerEconomy = this.getPlayerEconomyData(economyByRound, playerSteamId);
    const playerPurchases = purchases.filter((p) => p.steamId === playerSteamId);
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    const playerDeaths = kills.filter((k) => k.victimSteamId === playerSteamId);

    // Analyse par round
    const roundByRound = this.analyzeRoundByRound(
      playerEconomy,
      playerPurchases,
      playerKills,
      playerDeaths,
      rounds,
      economyByRound,
      playerSteamId,
      playerTeam
    );

    // Analyser les décisions d'achat
    const buyDecisions = this.analyzeBuyDecisions(roundByRound);

    // Analyser les rounds de save
    const saveRounds = this.analyzeSaveRounds(roundByRound, playerEconomy);

    // Analyser la gestion d'équipement
    const equipmentManagement = this.analyzeEquipmentManagement(
      playerEconomy,
      playerDeaths,
      roundByRound
    );

    // Analyser l'impact sur l'équipe
    const teamImpact = this.analyzeTeamImpact(
      roundByRound,
      playerKills,
      playerDeaths,
      rounds
    );

    // Analyser les patterns d'achat
    const buyPatterns = this.analyzeBuyPatterns(
      playerPurchases,
      playerEconomy,
      playerTeam
    );

    // Analyser les métriques d'impact
    const impactMetrics = this.analyzeImpactMetrics(
      playerKills,
      playerDeaths,
      roundByRound
    );

    // Construire les métriques
    const metrics = this.buildMetrics(
      buyDecisions,
      saveRounds,
      equipmentManagement,
      teamImpact,
      buyPatterns,
      impactMetrics
    );

    return {
      buyDecisions,
      saveRounds,
      equipmentManagement,
      teamImpact,
      roundByRound,
      buyPatterns,
      impactMetrics,
      metrics,
    };
  }

  /**
   * Récupère les données économiques du joueur
   */
  private getPlayerEconomyData(
    economyByRound: RoundEconomy[],
    playerSteamId: string
  ): Map<number, PlayerRoundEconomy> {
    const playerData = new Map<number, PlayerRoundEconomy>();

    for (const roundEcon of economyByRound) {
      const playerEcon = roundEcon.players.find((p) => p.steamId === playerSteamId);
      if (playerEcon) {
        playerData.set(roundEcon.round, playerEcon);
      }
    }

    return playerData;
  }

  /**
   * Analyse round par round
   */
  private analyzeRoundByRound(
    playerEconomy: Map<number, PlayerRoundEconomy>,
    purchases: ItemPurchase[],
    playerKills: KillEventV2[],
    playerDeaths: KillEventV2[],
    rounds: RoundInfoV2[],
    allEconomy: RoundEconomy[],
    playerSteamId: string,
    playerTeam: number
  ): RoundEconomyAnalysis[] {
    const analyses: RoundEconomyAnalysis[] = [];

    for (const round of rounds) {
      const roundNum = round.roundNumber;
      const playerEcon = playerEconomy.get(roundNum);

      if (!playerEcon) {
        // Données manquantes pour ce round
        continue;
      }

      // Récupérer les achats de ce round
      const roundPurchases = purchases.filter((p) => p.round === roundNum);

      // Déterminer le type d'achat du joueur
      const buyType = this.determineBuyType(playerEcon, roundPurchases, roundNum);

      // Déterminer le type d'achat de l'équipe
      const teamBuyType = this.determineTeamBuyType(
        allEconomy.find((e) => e.round === roundNum),
        playerSteamId,
        playerTeam
      );

      // Évaluer la décision
      const decision = this.evaluateDecision(
        buyType,
        teamBuyType,
        playerEcon,
        roundNum
      );

      // Déterminer l'outcome
      const died = playerDeaths.some((d) => d.round === roundNum);
      const gotKills = playerKills.some((k) => k.round === roundNum);
      const roundWon = round.winner === playerTeam;

      let outcome: RoundEconomyAnalysis['outcome'];
      if (roundWon && !died) {
        outcome = 'survived';
      } else if (roundWon) {
        outcome = 'win';
      } else if (died) {
        outcome = 'died';
      } else {
        outcome = 'loss';
      }

      analyses.push({
        round: roundNum,
        balance: playerEcon.balance,
        spent: playerEcon.spentThisRound,
        equipmentValue: playerEcon.equipmentValue,
        buyType,
        teamBuyType,
        decision,
        outcome,
      });
    }

    return analyses;
  }

  /**
   * Détermine le type d'achat d'un joueur
   */
  private determineBuyType(
    econ: PlayerRoundEconomy,
    purchases: ItemPurchase[],
    roundNum: number
  ): BuyType {
    const equipValue = econ.equipmentValue;
    const balance = econ.balance;
    const spent = econ.spentThisRound;

    // Rounds pistol (1, 13)
    if (roundNum === 1 || roundNum === 13) {
      return 'pistol';
    }

    // Basé sur la valeur d'équipement
    if (equipValue >= CONFIG.FULL_BUY_VALUE_MIN) {
      return 'full';
    }

    if (equipValue >= CONFIG.HALF_BUY_VALUE_MIN && equipValue < CONFIG.FULL_BUY_VALUE_MIN) {
      return 'half';
    }

    if (equipValue < CONFIG.ECO_VALUE_MAX) {
      // Différencier eco et save
      if (spent < 500 && balance > CONFIG.SAVE_THRESHOLD) {
        return 'save';
      }
      return 'eco';
    }

    // Force buy: achat avec peu d'argent
    if (balance < CONFIG.FORCE_BUY_MAX && spent > 1000) {
      return 'force';
    }

    return 'half';
  }

  /**
   * Détermine le type d'achat de l'équipe
   */
  private determineTeamBuyType(
    roundEcon: RoundEconomy | undefined,
    playerSteamId: string,
    playerTeam: number
  ): BuyType {
    if (!roundEcon) return 'half';

    // Filtrer les coéquipiers
    const teammates = roundEcon.players.filter(
      (p) => p.steamId !== playerSteamId && p.team === playerTeam
    );

    if (teammates.length === 0) return 'half';

    // Calculer la valeur moyenne d'équipement
    const avgEquipValue =
      teammates.reduce((sum, p) => sum + p.equipmentValue, 0) / teammates.length;

    if (avgEquipValue >= CONFIG.FULL_BUY_VALUE_MIN) return 'full';
    if (avgEquipValue >= CONFIG.HALF_BUY_VALUE_MIN) return 'half';
    if (avgEquipValue < CONFIG.ECO_VALUE_MAX) return 'eco';

    return 'force';
  }

  /**
   * Évalue si la décision d'achat était correcte
   */
  private evaluateDecision(
    buyType: BuyType,
    teamBuyType: BuyType,
    econ: PlayerRoundEconomy,
    _roundNum: number
  ): RoundEconomyAnalysis['decision'] {
    // Règles de base pour une bonne décision économique

    // 1. Suivre l'équipe
    if (buyType === teamBuyType) {
      return 'correct';
    }

    // 2. Ne pas force buy seul quand l'équipe save
    if ((buyType === 'force' || buyType === 'half') && teamBuyType === 'eco') {
      return 'incorrect';
    }

    // 3. Ne pas save quand l'équipe full buy
    if (buyType === 'save' && teamBuyType === 'full') {
      return 'incorrect';
    }

    // 4. Full buy avec assez d'argent est toujours bon
    if (buyType === 'full' && econ.balance >= CONFIG.FULL_BUY_MIN) {
      return 'correct';
    }

    // 5. Eco avec peu d'argent est correct
    if (buyType === 'eco' && econ.balance < CONFIG.HALF_BUY_MIN) {
      return 'correct';
    }

    return 'neutral';
  }

  /**
   * Analyse les décisions d'achat globales
   */
  private analyzeBuyDecisions(
    roundByRound: RoundEconomyAnalysis[]
  ): EconomyAnalysisV2['buyDecisions'] {
    const breakdown = {
      fullBuy: 0,
      halfBuy: 0,
      forceBuy: 0,
      eco: 0,
      save: 0,
    };

    let correct = 0;
    let incorrect = 0;

    for (const round of roundByRound) {
      // Ignorer les rounds pistol
      if (round.buyType === 'pistol') continue;

      switch (round.buyType) {
        case 'full':
          breakdown.fullBuy++;
          break;
        case 'half':
          breakdown.halfBuy++;
          break;
        case 'force':
          breakdown.forceBuy++;
          break;
        case 'eco':
          breakdown.eco++;
          break;
        case 'save':
          breakdown.save++;
          break;
      }

      if (round.decision === 'correct') {
        correct++;
      } else if (round.decision === 'incorrect') {
        incorrect++;
      }
    }

    const total = roundByRound.filter((r) => r.buyType !== 'pistol').length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 50;

    return {
      correct,
      incorrect,
      score,
      breakdown,
    };
  }

  /**
   * Analyse les rounds de save
   */
  private analyzeSaveRounds(
    roundByRound: RoundEconomyAnalysis[],
    playerEconomy: Map<number, PlayerRoundEconomy>
  ): EconomyAnalysisV2['saveRounds'] {
    let appropriate = 0;
    let inappropriate = 0;
    let savesWithTeam = 0;
    let soloSaves = 0;

    const saveRounds = roundByRound.filter(
      (r) => r.buyType === 'save' || r.buyType === 'eco'
    );

    for (const round of saveRounds) {
      const econ = playerEconomy.get(round.round);
      if (!econ) continue;

      // Save avec l'équipe
      if (round.teamBuyType === 'eco' || round.teamBuyType === 'save') {
        savesWithTeam++;
        appropriate++;
      } else if (round.teamBuyType === 'full' && econ.balance < CONFIG.HALF_BUY_MIN) {
        // Save seul mais pas d'argent
        appropriate++;
        soloSaves++;
      } else {
        // Save seul quand l'équipe buy
        inappropriate++;
        soloSaves++;
      }
    }

    return {
      appropriate,
      inappropriate,
      savesWithTeam,
      soloSaves,
    };
  }

  /**
   * Analyse la gestion d'équipement
   */
  private analyzeEquipmentManagement(
    playerEconomy: Map<number, PlayerRoundEconomy>,
    deaths: KillEventV2[],
    roundByRound: RoundEconomyAnalysis[]
  ): EconomyAnalysisV2['equipmentManagement'] {
    let totalEquipValue = 0;
    let totalBalanceAtDeath = 0;
    let expensiveDeaths = 0;
    let pistolRoundWins = 0;

    for (const [roundNum, econ] of playerEconomy) {
      totalEquipValue += econ.equipmentValue;

      // Vérifier si mort ce round
      const diedThisRound = deaths.some((d) => d.round === roundNum);
      if (diedThisRound) {
        totalBalanceAtDeath += econ.balance;

        // Mort coûteuse (avec beaucoup d'équipement)
        if (econ.equipmentValue > CONFIG.FULL_BUY_VALUE_MIN) {
          expensiveDeaths++;
        }
      }
    }

    // Pistol rounds (1 et 13)
    const pistolRounds = roundByRound.filter(
      (r) => r.round === 1 || r.round === 13
    );
    pistolRoundWins = pistolRounds.filter(
      (r) => r.outcome === 'win' || r.outcome === 'survived'
    ).length;

    const avgEquipValue = playerEconomy.size > 0
      ? totalEquipValue / playerEconomy.size
      : 0;
    const avgBalanceAtDeath = deaths.length > 0
      ? totalBalanceAtDeath / deaths.length
      : 0;

    return {
      avgEquipmentValue: Math.round(avgEquipValue),
      avgBalanceAtDeath: Math.round(avgBalanceAtDeath),
      expensiveDeaths,
      pistolRoundWins,
    };
  }

  /**
   * Analyse l'impact sur l'équipe
   */
  private analyzeTeamImpact(
    roundByRound: RoundEconomyAnalysis[],
    kills: KillEventV2[],
    deaths: KillEventV2[],
    rounds: RoundInfoV2[]
  ): EconomyAnalysisV2['teamImpact'] {
    let positiveRounds = 0;
    let negativeRounds = 0;

    for (const round of roundByRound) {
      const roundKills = kills.filter((k) => k.round === round.round);
      const roundDeaths = deaths.filter((d) => d.round === round.round);

      // Round positif: plus de kills que de morts, ou survie
      if (roundKills.length > roundDeaths.length || round.outcome === 'survived') {
        positiveRounds++;
      } else if (roundDeaths.length > 0 && roundKills.length === 0) {
        negativeRounds++;
      }
    }

    return {
      positiveRounds,
      negativeRounds,
      moneyShared: 0, // Difficile à calculer sans données de drop
      dropsGiven: 0,
    };
  }

  /**
   * Analyse les patterns d'achat
   */
  private analyzeBuyPatterns(
    purchases: ItemPurchase[],
    playerEconomy: Map<number, PlayerRoundEconomy>,
    playerTeam: number
  ): EconomyAnalysisV2['buyPatterns'] {
    // Compter les items achetés
    const itemCounts = new Map<string, number>();
    for (const purchase of purchases) {
      const count = itemCounts.get(purchase.item) || 0;
      itemCounts.set(purchase.item, count + 1);
    }

    // Trouver le loadout préféré
    const sortedItems = [...itemCounts.entries()].sort((a, b) => b[1] - a[1]);
    const preferredLoadout = sortedItems.slice(0, 5).map(([item]) => item);

    // Calculer les taux
    let helmets = 0;
    let defusers = 0;
    let fullUtility = 0;
    let totalRounds = 0;

    for (const econ of playerEconomy.values()) {
      totalRounds++;
      if (econ.hasHelmet) helmets++;
      if (econ.hasDefuser && econ.team === TEAM_CT) defusers++;

      // Full utility approximation (basée sur les achats)
      const roundPurchases = purchases.filter((p) => p.round === econ.spentThisRound);
      const utilityCount = roundPurchases.filter(
        (p) => ['hegrenade', 'flashbang', 'smokegrenade', 'molotov', 'incgrenade'].includes(p.item)
      ).length;
      if (utilityCount >= 3) fullUtility++;
    }

    const ctRounds = [...playerEconomy.values()].filter(
      (e) => e.team === TEAM_CT
    ).length;

    return {
      preferredLoadout,
      helmetBuyRate: totalRounds > 0 ? helmets / totalRounds : 0,
      defuserBuyRate: ctRounds > 0 ? defusers / ctRounds : 0,
      fullUtilityRate: totalRounds > 0 ? fullUtility / totalRounds : 0,
    };
  }

  /**
   * Analyse les métriques d'impact économique
   */
  private analyzeImpactMetrics(
    kills: KillEventV2[],
    deaths: KillEventV2[],
    roundByRound: RoundEconomyAnalysis[]
  ): EconomyAnalysisV2['impactMetrics'] {
    // Money denied: estimation basée sur les kills en eco adverse
    let moneyDenied = 0;
    let moneyLost = 0;

    for (const kill of kills) {
      // Approximation: kill sur quelqu'un avec équipement cher = money denied
      // On utilise une valeur moyenne d'équipement
      moneyDenied += 2500; // Estimation conservatrice
    }

    for (const death of deaths) {
      const roundAnalysis = roundByRound.find((r) => r.round === death.round);
      if (roundAnalysis) {
        moneyLost += roundAnalysis.equipmentValue;
      }
    }

    const avgValuePerKill = kills.length > 0 ? moneyDenied / kills.length : 0;
    const avgValuePerDeath = deaths.length > 0 ? moneyLost / deaths.length : 0;

    return {
      moneyDenied,
      moneyLost,
      avgValuePerKill: Math.round(avgValuePerKill),
      avgValuePerDeath: Math.round(avgValuePerDeath),
    };
  }

  /**
   * Construit les métriques agrégées
   */
  private buildMetrics(
    buyDecisions: EconomyAnalysisV2['buyDecisions'],
    saveRounds: EconomyAnalysisV2['saveRounds'],
    equipmentManagement: EconomyAnalysisV2['equipmentManagement'],
    teamImpact: EconomyAnalysisV2['teamImpact'],
    buyPatterns: EconomyAnalysisV2['buyPatterns'],
    impactMetrics: EconomyAnalysisV2['impactMetrics']
  ): Record<string, number> {
    // Score global
    let overallScore = 50;

    // Bonus pour bonnes décisions
    overallScore += (buyDecisions.correct / (buyDecisions.correct + buyDecisions.incorrect + 1)) * 20;

    // Bonus pour saves appropriés
    const totalSaves = saveRounds.appropriate + saveRounds.inappropriate;
    if (totalSaves > 0) {
      overallScore += (saveRounds.appropriate / totalSaves) * 15;
    }

    // Bonus pour patterns d'achat
    overallScore += buyPatterns.helmetBuyRate * 5;
    overallScore += buyPatterns.defuserBuyRate * 5;
    overallScore += buyPatterns.fullUtilityRate * 5;

    // Penalty pour morts coûteuses
    overallScore -= equipmentManagement.expensiveDeaths * 2;

    return {
      // Décisions
      buyDecisionScore: buyDecisions.score,
      correctDecisions: buyDecisions.correct,
      incorrectDecisions: buyDecisions.incorrect,
      fullBuyRate: buyDecisions.breakdown.fullBuy / (buyDecisions.correct + buyDecisions.incorrect + 1),

      // Saves
      appropriateSaves: saveRounds.appropriate,
      soloSaves: saveRounds.soloSaves,
      saveWithTeamRate: totalSaves > 0 ? saveRounds.savesWithTeam / totalSaves : 0,

      // Équipement
      avgEquipmentValue: equipmentManagement.avgEquipmentValue,
      avgBalanceAtDeath: equipmentManagement.avgBalanceAtDeath,
      expensiveDeaths: equipmentManagement.expensiveDeaths,
      pistolRoundWins: equipmentManagement.pistolRoundWins,

      // Impact
      positiveRounds: teamImpact.positiveRounds,
      negativeRounds: teamImpact.negativeRounds,
      moneyDenied: impactMetrics.moneyDenied,
      moneyLost: impactMetrics.moneyLost,

      // Patterns
      helmetBuyRate: buyPatterns.helmetBuyRate * 100,
      defuserBuyRate: buyPatterns.defuserBuyRate * 100,
      fullUtilityRate: buyPatterns.fullUtilityRate * 100,

      // Score global
      overall: Math.max(0, Math.min(100, Math.round(overallScore))),
    };
  }
}
