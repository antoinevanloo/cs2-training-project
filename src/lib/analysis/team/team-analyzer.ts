/**
 * Team Analyzer - Analyse d'équipe CS2 Coach
 *
 * Analyse multi-perspectives pour équipes :
 * - Détection de rôles automatique
 * - Synergies entre joueurs
 * - Conflits de positions
 * - Recommandations stratégiques
 */

import type {
  TeamAnalysis,
  TeamAnalysisInput,
  TeamMember,
  TeamMemberStats,
  RoleDetection,
  CS2Role,
  RoleIndicator,
  TeamSynergy,
  SynergyMetrics,
  PositionConflict,
  RoundStrategy,
  StrategyType,
  TeamRecommendation,
  TeamGlobalStats,
} from './types';
import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// CONFIGURATION
// ============================================

const ROLE_CONFIG = {
  entry: {
    entryWeight: 0.35,
    firstDeathWeight: 0.25,
    weaponWeight: 0.15,
    positionWeight: 0.25,
    thresholds: { entryAttempts: 0.3, firstDeaths: 0.25 },
  },
  support: {
    tradeWeight: 0.3,
    utilityWeight: 0.35,
    flashAssistWeight: 0.2,
    positionWeight: 0.15,
    thresholds: { tradeRate: 0.4, utilityUsage: 0.7 },
  },
  awp: {
    awpKillsWeight: 0.5,
    holdingWeight: 0.3,
    distanceWeight: 0.2,
    thresholds: { awpKillRate: 0.4 },
  },
  lurker: {
    soloPlayWeight: 0.35,
    lateKillWeight: 0.3,
    rotationWeight: 0.2,
    positionWeight: 0.15,
    thresholds: { soloKills: 0.3, lateRoundKills: 0.25 },
  },
  igl: {
    utilityWeight: 0.3,
    positionWeight: 0.25,
    survivalWeight: 0.25,
    callWeight: 0.2,
    thresholds: { survivalRate: 0.5 },
  },
  anchor: {
    siteHoldWeight: 0.4,
    clutchWeight: 0.25,
    retakeWeight: 0.2,
    survivalWeight: 0.15,
    thresholds: { siteHoldRate: 0.6 },
  },
  flex: {
    versatilityWeight: 0.4,
    adaptationWeight: 0.3,
    performanceWeight: 0.3,
    thresholds: { roleVariance: 0.3 },
  },
};

const SYNERGY_THRESHOLDS = {
  excellent: 80,
  good: 60,
  average: 40,
  poor: 20,
};

// ============================================
// TEAM ANALYZER CLASS
// ============================================

export class TeamAnalyzer {
  /**
   * Analyse complète d'une équipe
   */
  async analyze(input: TeamAnalysisInput, demoData: TeamDemoData[]): Promise<TeamAnalysis> {
    const { map, options = {} } = input;
    const {
      analyzeSynergies = true,
      detectConflicts = true,
      strategyDepth = 'detailed',
    } = options;

    // 1. Extraire les membres de l'équipe avec leurs stats
    const members = this.extractTeamMembers(demoData);

    // 2. Détecter les rôles
    const membersWithRoles = members.map((member) => ({
      ...member,
      detectedRole: this.detectRole(member, demoData),
    }));

    // 3. Calculer les synergies
    const synergies = analyzeSynergies
      ? this.analyzeSynergies(membersWithRoles, demoData)
      : [];

    // 4. Détecter les conflits de positions
    const conflicts = detectConflicts
      ? this.detectConflicts(demoData, map)
      : [];

    // 5. Analyser les stratégies par round
    const roundStrategies = this.analyzeStrategies(demoData, strategyDepth);

    // 6. Calculer les stats globales de l'équipe
    const teamStats = this.calculateTeamStats(membersWithRoles, demoData);

    // 7. Calculer le score global et par catégorie
    const { teamScore, categoryScores } = this.calculateTeamScores(membersWithRoles);

    // 8. Déterminer le résultat du match
    const matchResult = this.getMatchResult(demoData);

    // 9. Générer les recommandations
    const recommendations = this.generateRecommendations(
      membersWithRoles,
      synergies,
      conflicts,
      roundStrategies,
      teamStats,
      map
    );

    return {
      id: `team-${Date.now()}`,
      analyzedAt: new Date(),
      map,
      matchResult: matchResult.result,
      score: matchResult.score,
      members: membersWithRoles,
      teamScore,
      categoryScores,
      synergies,
      conflicts,
      roundStrategies,
      recommendations,
      teamStats,
    };
  }

  // ============================================
  // EXTRACTION DES MEMBRES
  // ============================================

  private extractTeamMembers(demoData: TeamDemoData[]): Omit<TeamMember, 'detectedRole'>[] {
    return demoData.map((data) => ({
      steamId: data.steamId,
      name: data.playerName,
      avatar: data.avatar,
      stats: this.extractPlayerStats(data),
      categoryScores: data.categoryScores,
    }));
  }

  private extractPlayerStats(data: TeamDemoData): TeamMemberStats {
    return {
      kills: data.kills,
      deaths: data.deaths,
      assists: data.assists,
      rating: data.rating,
      adr: data.adr,
      kast: data.kast,
      entryAttempts: data.entryAttempts || 0,
      entrySuccess: data.entrySuccess || 0,
      clutchAttempts: data.clutchAttempts || 0,
      clutchWins: data.clutchWins || 0,
      utilityDamage: data.utilityDamage || 0,
      flashAssists: data.flashAssists || 0,
      tradesGiven: data.tradesGiven || 0,
      tradesReceived: data.tradesReceived || 0,
    };
  }

  // ============================================
  // DÉTECTION DE RÔLES
  // ============================================

  private detectRole(
    member: Omit<TeamMember, 'detectedRole'>,
    demoData: TeamDemoData[]
  ): RoleDetection {
    const playerData = demoData.find((d) => d.steamId === member.steamId);
    if (!playerData) {
      return this.defaultRoleDetection();
    }

    const roleScores = this.calculateRoleScores(member.stats, playerData);
    const sortedRoles = Object.entries(roleScores)
      .sort(([, a], [, b]) => b.score - a.score) as [CS2Role, { score: number; indicators: RoleIndicator[] }][];

    const [primaryRole, primaryData] = sortedRoles[0];
    const alternativeRoles = sortedRoles.slice(1, 3).map(([role, data]) => ({
      role,
      confidence: data.score,
    }));

    return {
      role: primaryRole,
      confidence: primaryData.score,
      indicators: primaryData.indicators,
      alternativeRoles,
    };
  }

  private calculateRoleScores(
    stats: TeamMemberStats,
    data: TeamDemoData
  ): Record<CS2Role, { score: number; indicators: RoleIndicator[] }> {
    const totalRounds = data.roundsPlayed || 1;

    return {
      entry: this.scoreEntryRole(stats, data, totalRounds),
      support: this.scoreSupportRole(stats, data, totalRounds),
      awp: this.scoreAwpRole(stats, data),
      lurker: this.scoreLurkerRole(stats, data, totalRounds),
      igl: this.scoreIglRole(stats, data, totalRounds),
      anchor: this.scoreAnchorRole(stats, data, totalRounds),
      flex: this.scoreFlexRole(stats, data),
    };
  }

  private scoreEntryRole(
    stats: TeamMemberStats,
    data: TeamDemoData,
    totalRounds: number
  ): { score: number; indicators: RoleIndicator[] } {
    const indicators: RoleIndicator[] = [];
    let score = 0;

    // Entry attempts rate
    const entryRate = stats.entryAttempts / totalRounds;
    indicators.push({
      type: 'entry_attempts',
      value: entryRate,
      weight: ROLE_CONFIG.entry.entryWeight,
      description: `${(entryRate * 100).toFixed(1)}% des rounds en entry`,
    });
    score += entryRate * 100 * ROLE_CONFIG.entry.entryWeight;

    // First death rate
    const firstDeathRate = (data.firstDeaths || 0) / totalRounds;
    indicators.push({
      type: 'first_deaths',
      value: firstDeathRate,
      weight: ROLE_CONFIG.entry.firstDeathWeight,
      description: `${(firstDeathRate * 100).toFixed(1)}% first death`,
    });
    score += firstDeathRate * 100 * ROLE_CONFIG.entry.firstDeathWeight;

    // Entry success rate
    if (stats.entryAttempts > 0) {
      const successRate = stats.entrySuccess / stats.entryAttempts;
      score += successRate * 30 * ROLE_CONFIG.entry.positionWeight;
    }

    return { score: Math.min(100, score), indicators };
  }

  private scoreSupportRole(
    stats: TeamMemberStats,
    data: TeamDemoData,
    totalRounds: number
  ): { score: number; indicators: RoleIndicator[] } {
    const indicators: RoleIndicator[] = [];
    let score = 0;

    // Trade given rate
    const tradeRate = stats.tradesGiven / Math.max(1, stats.deaths);
    indicators.push({
      type: 'trade_given',
      value: tradeRate,
      weight: ROLE_CONFIG.support.tradeWeight,
      description: `${(tradeRate * 100).toFixed(1)}% des morts tradées`,
    });
    score += tradeRate * 100 * ROLE_CONFIG.support.tradeWeight;

    // Utility usage
    const utilityPerRound = (data.utilityThrown || 0) / totalRounds;
    const utilityScore = Math.min(utilityPerRound / 3, 1); // 3 utils/round = max
    indicators.push({
      type: 'utility_usage',
      value: utilityScore,
      weight: ROLE_CONFIG.support.utilityWeight,
      description: `${utilityPerRound.toFixed(1)} utility/round`,
    });
    score += utilityScore * 100 * ROLE_CONFIG.support.utilityWeight;

    // Flash assists
    const flashAssistRate = stats.flashAssists / totalRounds;
    score += Math.min(flashAssistRate, 0.5) * 100 * ROLE_CONFIG.support.flashAssistWeight;

    return { score: Math.min(100, score), indicators };
  }

  private scoreAwpRole(
    stats: TeamMemberStats,
    data: TeamDemoData
  ): { score: number; indicators: RoleIndicator[] } {
    const indicators: RoleIndicator[] = [];
    let score = 0;

    // AWP kills ratio
    const awpKills = data.awpKills || 0;
    const awpKillRate = awpKills / Math.max(1, stats.kills);
    indicators.push({
      type: 'weapon_choice',
      value: awpKillRate,
      weight: ROLE_CONFIG.awp.awpKillsWeight,
      description: `${(awpKillRate * 100).toFixed(1)}% kills à l'AWP`,
    });
    score += awpKillRate * 100 * ROLE_CONFIG.awp.awpKillsWeight;

    // Long range kills
    const longRangeRate = (data.longRangeKills || 0) / Math.max(1, stats.kills);
    score += longRangeRate * 100 * ROLE_CONFIG.awp.distanceWeight;

    return { score: Math.min(100, score), indicators };
  }

  private scoreLurkerRole(
    stats: TeamMemberStats,
    data: TeamDemoData,
    totalRounds: number
  ): { score: number; indicators: RoleIndicator[] } {
    const indicators: RoleIndicator[] = [];
    let score = 0;

    // Solo plays (kills without team near)
    const soloKillRate = (data.soloKills || 0) / Math.max(1, stats.kills);
    indicators.push({
      type: 'positioning',
      value: soloKillRate,
      weight: ROLE_CONFIG.lurker.soloPlayWeight,
      description: `${(soloKillRate * 100).toFixed(1)}% kills en solo`,
    });
    score += soloKillRate * 100 * ROLE_CONFIG.lurker.soloPlayWeight;

    // Late round kills
    const lateKillRate = (data.lateRoundKills || 0) / Math.max(1, stats.kills);
    indicators.push({
      type: 'timing',
      value: lateKillRate,
      weight: ROLE_CONFIG.lurker.lateKillWeight,
      description: `${(lateKillRate * 100).toFixed(1)}% kills en late round`,
    });
    score += lateKillRate * 100 * ROLE_CONFIG.lurker.lateKillWeight;

    return { score: Math.min(100, score), indicators };
  }

  private scoreIglRole(
    stats: TeamMemberStats,
    data: TeamDemoData,
    totalRounds: number
  ): { score: number; indicators: RoleIndicator[] } {
    const indicators: RoleIndicator[] = [];
    let score = 0;

    // Survival rate (IGL survit plus longtemps)
    const survivalRate = 1 - (stats.deaths / totalRounds);
    indicators.push({
      type: 'positioning',
      value: survivalRate,
      weight: ROLE_CONFIG.igl.survivalWeight,
      description: `${(survivalRate * 100).toFixed(1)}% survie`,
    });
    score += survivalRate * 100 * ROLE_CONFIG.igl.survivalWeight;

    // Utility coordination (many utils thrown)
    const utilityPerRound = (data.utilityThrown || 0) / totalRounds;
    score += Math.min(utilityPerRound / 4, 1) * 100 * ROLE_CONFIG.igl.utilityWeight;

    return { score: Math.min(100, score), indicators };
  }

  private scoreAnchorRole(
    stats: TeamMemberStats,
    data: TeamDemoData,
    totalRounds: number
  ): { score: number; indicators: RoleIndicator[] } {
    const indicators: RoleIndicator[] = [];
    let score = 0;

    // CT rounds played (anchor = primarily CT)
    const ctRoundRate = (data.ctRoundsPlayed || 0) / totalRounds;

    // Site holds (kills while defending)
    const siteHoldKills = (data.siteHoldKills || 0) / Math.max(1, stats.kills);
    indicators.push({
      type: 'positioning',
      value: siteHoldKills,
      weight: ROLE_CONFIG.anchor.siteHoldWeight,
      description: `${(siteHoldKills * 100).toFixed(1)}% kills en anchor`,
    });
    score += siteHoldKills * 100 * ROLE_CONFIG.anchor.siteHoldWeight * ctRoundRate;

    // Clutch involvement
    if (stats.clutchAttempts > 0) {
      const clutchRate = stats.clutchWins / stats.clutchAttempts;
      score += clutchRate * 100 * ROLE_CONFIG.anchor.clutchWeight;
    }

    return { score: Math.min(100, score), indicators };
  }

  private scoreFlexRole(
    stats: TeamMemberStats,
    _data: TeamDemoData
  ): { score: number; indicators: RoleIndicator[] } {
    // Flex = joueur polyvalent avec performances équilibrées
    const indicators: RoleIndicator[] = [];

    // Un joueur flex a des stats équilibrées, pas de spécialisation forte
    const rating = stats.rating;
    const kd = stats.kills / Math.max(1, stats.deaths);

    // Score basé sur la performance générale sans spécialisation
    let score = 0;
    if (rating >= 1.0 && kd >= 1.0) {
      score = 50 + (rating - 1.0) * 30;
    } else {
      score = 30 + rating * 20;
    }

    indicators.push({
      type: 'positioning',
      value: score / 100,
      weight: 1.0,
      description: 'Profil polyvalent',
    });

    return { score: Math.min(100, score), indicators };
  }

  private defaultRoleDetection(): RoleDetection {
    return {
      role: 'flex',
      confidence: 50,
      indicators: [],
      alternativeRoles: [],
    };
  }

  // ============================================
  // ANALYSE DES SYNERGIES
  // ============================================

  private analyzeSynergies(
    members: TeamMember[],
    demoData: TeamDemoData[]
  ): TeamSynergy[] {
    const synergies: TeamSynergy[] = [];

    // Analyser chaque paire de joueurs
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const player1 = members[i];
        const player2 = members[j];

        const metrics = this.calculateSynergyMetrics(
          player1.steamId,
          player2.steamId,
          demoData
        );

        const synergyScore = this.calculateSynergyScore(metrics);
        const { strengths, weaknesses } = this.identifySynergyTraits(metrics);

        synergies.push({
          player1SteamId: player1.steamId,
          player2SteamId: player2.steamId,
          player1Name: player1.name,
          player2Name: player2.name,
          synergyScore,
          metrics,
          strengths,
          weaknesses,
        });
      }
    }

    return synergies.sort((a, b) => b.synergyScore - a.synergyScore);
  }

  private calculateSynergyMetrics(
    player1Id: string,
    player2Id: string,
    demoData: TeamDemoData[]
  ): SynergyMetrics {
    const p1Data = demoData.find((d) => d.steamId === player1Id);
    const p2Data = demoData.find((d) => d.steamId === player2Id);

    if (!p1Data || !p2Data) {
      return {
        tradeRate: 0,
        avgTradeTime: 5,
        utilityCoordination: 0,
        playTogether: 0,
        implicitComm: 0,
      };
    }

    // Calculer les trades mutuels
    const p1TradesForP2 = p1Data.tradesFor?.[player2Id] || 0;
    const p2TradesForP1 = p2Data.tradesFor?.[player1Id] || 0;
    const totalTrades = p1TradesForP2 + p2TradesForP1;
    const totalDeaths = (p1Data.deaths || 0) + (p2Data.deaths || 0);
    const tradeRate = totalDeaths > 0 ? totalTrades / totalDeaths : 0;

    // Temps moyen de trade
    const avgTradeTime = (p1Data.avgTradeTimeFor?.[player2Id] || 3) +
                         (p2Data.avgTradeTimeFor?.[player1Id] || 3) / 2;

    // Coordination utility (jouer ensemble dans les mêmes rounds)
    const utilityCoordination = this.calculateUtilityCoordination(p1Data, p2Data);

    // Play together (proximité moyenne)
    const playTogether = this.calculateProximityScore(p1Data, p2Data);

    // Communication implicite (anticipation des mouvements)
    const implicitComm = (tradeRate * 40 + utilityCoordination * 30 + playTogether * 30);

    return {
      tradeRate,
      avgTradeTime,
      utilityCoordination,
      playTogether,
      implicitComm,
    };
  }

  private calculateUtilityCoordination(p1: TeamDemoData, p2: TeamDemoData): number {
    // Simplified: based on flash assists and coordinated utility
    const p1FlashAssistsForP2 = p1.flashAssistsFor?.[p2.steamId] || 0;
    const p2FlashAssistsForP1 = p2.flashAssistsFor?.[p1.steamId] || 0;

    const coordScore = Math.min(
      (p1FlashAssistsForP2 + p2FlashAssistsForP1) * 10,
      100
    );

    return coordScore;
  }

  private calculateProximityScore(p1: TeamDemoData, p2: TeamDemoData): number {
    // Simplified: based on rounds where both were alive together
    const avgProximity = p1.avgProximityTo?.[p2.steamId] || 50;
    return Math.max(0, 100 - avgProximity); // Closer = higher score
  }

  private calculateSynergyScore(metrics: SynergyMetrics): number {
    return (
      metrics.tradeRate * 25 +
      Math.max(0, 100 - metrics.avgTradeTime * 10) * 0.25 +
      metrics.utilityCoordination * 0.25 +
      metrics.playTogether * 0.15 +
      metrics.implicitComm * 0.10
    );
  }

  private identifySynergyTraits(metrics: SynergyMetrics): { strengths: string[]; weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (metrics.tradeRate >= 0.5) {
      strengths.push('Excellent trading mutuel');
    } else if (metrics.tradeRate < 0.2) {
      weaknesses.push('Trading insuffisant');
    }

    if (metrics.avgTradeTime < 2) {
      strengths.push('Réaction rapide aux trades');
    } else if (metrics.avgTradeTime > 4) {
      weaknesses.push('Temps de trade trop long');
    }

    if (metrics.utilityCoordination >= 60) {
      strengths.push('Bonne coordination utilitaires');
    } else if (metrics.utilityCoordination < 30) {
      weaknesses.push('Coordination utilitaires à améliorer');
    }

    return { strengths, weaknesses };
  }

  // ============================================
  // DÉTECTION DES CONFLITS
  // ============================================

  private detectConflicts(demoData: TeamDemoData[], _map: string): PositionConflict[] {
    const conflicts: PositionConflict[] = [];

    // Analyser chaque round pour les conflits de position
    const roundsPlayed = Math.max(...demoData.map((d) => d.roundsPlayed || 0));

    for (let round = 1; round <= roundsPlayed; round++) {
      const roundConflicts = this.detectRoundConflicts(demoData, round);
      conflicts.push(...roundConflicts);
    }

    return conflicts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private detectRoundConflicts(demoData: TeamDemoData[], round: number): PositionConflict[] {
    const conflicts: PositionConflict[] = [];

    // Simplified: detect overlapping positions
    for (let i = 0; i < demoData.length; i++) {
      for (let j = i + 1; j < demoData.length; j++) {
        const p1Positions = demoData[i].positionsByRound?.[round] || [];
        const p2Positions = demoData[j].positionsByRound?.[round] || [];

        // Check for overlaps at similar timestamps
        for (const pos1 of p1Positions) {
          for (const pos2 of p2Positions) {
            if (Math.abs(pos1.tick - pos2.tick) < 64) { // Within ~0.5s
              const distance = this.calculateDistance(pos1, pos2);
              if (distance < 100) { // Very close
                conflicts.push({
                  round,
                  tick: pos1.tick,
                  players: [demoData[i].steamId, demoData[j].steamId],
                  position: pos1,
                  conflictType: 'overlap',
                  severity: distance < 50 ? 'high' : 'medium',
                  description: `Positions qui se chevauchent (${distance.toFixed(0)} units)`,
                  suggestion: 'Définir des zones de responsabilité claires',
                });
              }
            }
          }
        }
      }
    }

    return conflicts;
  }

  private calculateDistance(
    pos1: { x: number; y: number; z: number },
    pos2: { x: number; y: number; z: number }
  ): number {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
    );
  }

  // ============================================
  // ANALYSE DES STRATÉGIES
  // ============================================

  private analyzeStrategies(
    demoData: TeamDemoData[],
    depth: 'basic' | 'detailed'
  ): RoundStrategy[] {
    const strategies: RoundStrategy[] = [];
    const roundsPlayed = Math.max(...demoData.map((d) => d.roundsPlayed || 0));

    for (let round = 1; round <= roundsPlayed; round++) {
      const strategy = this.analyzeRoundStrategy(demoData, round, depth);
      if (strategy) {
        strategies.push(strategy);
      }
    }

    return strategies;
  }

  private analyzeRoundStrategy(
    demoData: TeamDemoData[],
    round: number,
    _depth: 'basic' | 'detailed'
  ): RoundStrategy | null {
    // Get round data
    const roundData = demoData[0]?.roundData?.[round];
    if (!roundData) return null;

    // Determine strategy type based on timing and positions
    const { strategyType, confidence } = this.detectStrategyType(demoData, round);

    // Calculate execution score
    const execution = this.evaluateExecution(demoData, round, strategyType);

    return {
      round,
      side: roundData.side as 'T' | 'CT',
      detectedStrategy: strategyType,
      confidence,
      execution,
      outcome: roundData.won ? 'win' : 'loss',
      notes: this.generateStrategyNotes(strategyType, execution),
    };
  }

  private detectStrategyType(
    demoData: TeamDemoData[],
    round: number
  ): { strategyType: StrategyType; confidence: number } {
    // Simplified strategy detection based on timing and utility usage
    const roundTimings = demoData.map((d) => d.firstActionTiming?.[round] || 0);
    const avgTiming = roundTimings.reduce((a, b) => a + b, 0) / roundTimings.length;

    const utilityUsed = demoData.reduce((sum, d) => sum + (d.utilityByRound?.[round] || 0), 0);

    // Fast execute: early timing, lots of utility
    if (avgTiming < 30 && utilityUsed >= 6) {
      return { strategyType: 'fast', confidence: 75 };
    }

    // Slow default: late timing
    if (avgTiming > 60) {
      return { strategyType: 'slow', confidence: 70 };
    }

    // Execute with utility
    if (utilityUsed >= 4) {
      return { strategyType: 'execute_a', confidence: 60 };
    }

    return { strategyType: 'default', confidence: 50 };
  }

  private evaluateExecution(
    demoData: TeamDemoData[],
    round: number,
    _strategyType: StrategyType
  ): {
    score: number;
    timing: 'early' | 'mid' | 'late';
    utilityUsage: number;
    coordination: number;
    issues: string[];
  } {
    const issues: string[] = [];

    // Calculate utility usage
    const utilityUsed = demoData.reduce((sum, d) => sum + (d.utilityByRound?.[round] || 0), 0);
    const utilityAvailable = demoData.length * 4; // Max 4 per player
    const utilityUsage = utilityUsed / utilityAvailable;

    // Calculate timing
    const avgTiming = demoData.reduce((sum, d) => sum + (d.firstActionTiming?.[round] || 45), 0) / demoData.length;
    const timing: 'early' | 'mid' | 'late' = avgTiming < 30 ? 'early' : avgTiming < 60 ? 'mid' : 'late';

    // Coordination (simplified)
    const coordination = utilityUsage * 50 + 50 * (avgTiming < 45 ? 1 : 0.5);

    // Calculate score
    let score = 50;
    score += utilityUsage * 25;
    score += coordination / 2;

    // Issues
    if (utilityUsage < 0.5) {
      issues.push('Utility sous-utilisée');
    }
    if (coordination < 50) {
      issues.push('Manque de coordination');
    }

    return {
      score: Math.min(100, score),
      timing,
      utilityUsage: utilityUsage * 100,
      coordination,
      issues,
    };
  }

  private generateStrategyNotes(strategyType: StrategyType, execution: { score: number; issues: string[] }): string[] {
    const notes: string[] = [];

    if (execution.score >= 80) {
      notes.push(`Excellente exécution ${strategyType}`);
    } else if (execution.score < 50) {
      notes.push(`Exécution ${strategyType} à améliorer`);
    }

    notes.push(...execution.issues);

    return notes;
  }

  // ============================================
  // CALCULS STATS ET SCORES
  // ============================================

  private calculateTeamStats(
    members: TeamMember[],
    demoData: TeamDemoData[]
  ): TeamGlobalStats {
    const totalRounds = Math.max(...demoData.map((d) => d.roundsPlayed || 0));
    const roundsWon = demoData[0]?.roundsWon || 0;

    const tRoundsPlayed = demoData[0]?.tRoundsPlayed || Math.floor(totalRounds / 2);
    const tRoundsWon = demoData[0]?.tRoundsWon || 0;
    const ctRoundsPlayed = demoData[0]?.ctRoundsPlayed || Math.floor(totalRounds / 2);
    const ctRoundsWon = demoData[0]?.ctRoundsWon || 0;

    const avgTradeTime = members.reduce((sum, m) => {
      const data = demoData.find((d) => d.steamId === m.steamId);
      return sum + (data?.avgTradeTime || 3);
    }, 0) / members.length;

    const teamTradeRate = members.reduce((sum, m) => {
      return sum + m.stats.tradesGiven;
    }, 0) / Math.max(1, members.reduce((sum, m) => sum + m.stats.deaths, 0));

    return {
      roundsPlayed: totalRounds,
      roundsWon,
      roundsLost: totalRounds - roundsWon,
      tRoundsWon,
      tRoundsPlayed,
      ctRoundsWon,
      ctRoundsPlayed,
      avgTeamMoney: demoData[0]?.avgTeamMoney || 0,
      fullBuyWinRate: demoData[0]?.fullBuyWinRate || 0,
      ecoWinRate: demoData[0]?.ecoWinRate || 0,
      teamTradeRate,
      avgTradeTime,
      entryWinRate: members.reduce((sum, m) => {
        return sum + (m.stats.entryAttempts > 0 ? m.stats.entrySuccess / m.stats.entryAttempts : 0);
      }, 0) / members.length,
      avgFirstKillTime: demoData[0]?.avgFirstKillTime || 30,
      utilityCoordination: demoData[0]?.utilityCoordination || 50,
      executeSuccessRate: demoData[0]?.executeSuccessRate || 50,
      clutchWinRate: members.reduce((sum, m) => {
        return sum + (m.stats.clutchAttempts > 0 ? m.stats.clutchWins / m.stats.clutchAttempts : 0);
      }, 0) / members.length,
      clutchAttempts: members.reduce((sum, m) => sum + m.stats.clutchAttempts, 0),
    };
  }

  private calculateTeamScores(members: TeamMember[]): {
    teamScore: number;
    categoryScores: Record<AnalysisCategory, number>;
  } {
    const categories: AnalysisCategory[] = [
      'aim', 'positioning', 'utility', 'economy', 'timing',
      'decision', 'movement', 'awareness', 'teamplay',
    ];

    const categoryScores = {} as Record<AnalysisCategory, number>;

    for (const category of categories) {
      const scores = members.map((m) => m.categoryScores[category] || 0);
      categoryScores[category] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    const teamScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / categories.length;

    return { teamScore, categoryScores };
  }

  private getMatchResult(demoData: TeamDemoData[]): {
    result: 'win' | 'loss' | 'draw';
    score: { team: number; opponent: number };
  } {
    const teamScore = demoData[0]?.teamScore || 0;
    const opponentScore = demoData[0]?.opponentScore || 0;

    return {
      result: teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw',
      score: { team: teamScore, opponent: opponentScore },
    };
  }

  // ============================================
  // GÉNÉRATION DES RECOMMANDATIONS
  // ============================================

  private generateRecommendations(
    members: TeamMember[],
    synergies: TeamSynergy[],
    conflicts: PositionConflict[],
    _strategies: RoundStrategy[],
    teamStats: TeamGlobalStats,
    _map: string
  ): TeamRecommendation[] {
    const recommendations: TeamRecommendation[] = [];

    // Role adjustments
    this.generateRoleRecommendations(members, recommendations);

    // Synergy improvements
    this.generateSynergyRecommendations(synergies, recommendations);

    // Position conflict fixes
    this.generateConflictRecommendations(conflicts, recommendations);

    // Strategy suggestions
    this.generateStrategyRecommendations(teamStats, recommendations);

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private generateRoleRecommendations(members: TeamMember[], recommendations: TeamRecommendation[]): void {
    // Check for missing roles
    const roles = members.map((m) => m.detectedRole.role);

    if (!roles.includes('entry')) {
      recommendations.push({
        type: 'role_adjustment',
        priority: 'high',
        title: 'Pas d\'entry fragger défini',
        description: 'L\'équipe n\'a pas de joueur entry clair. Cela peut ralentir les executes.',
        affectedPlayers: members.map((m) => m.steamId),
        actionItems: [
          'Désigner un joueur avec un bon aim pour entry',
          'Pratiquer les timings de flash + entry',
          'Établir des calls clairs pour les entry',
        ],
        expectedImpact: 'Amélioration de 20-30% sur les executes T-side',
      });
    }

    if (!roles.includes('support')) {
      recommendations.push({
        type: 'role_adjustment',
        priority: 'medium',
        title: 'Pas de support clairement identifié',
        description: 'L\'équipe manque d\'un joueur support qui flash et trade systématiquement.',
        affectedPlayers: members.map((m) => m.steamId),
        actionItems: [
          'Assigner un joueur au rôle support',
          'Pratiquer les pop-flash pour entry',
          'Se positionner pour les trades systématiques',
        ],
        expectedImpact: 'Amélioration du trade rate de 15-25%',
      });
    }

    // Check for low confidence roles
    for (const member of members) {
      if (member.detectedRole.confidence < 50) {
        recommendations.push({
          type: 'role_adjustment',
          priority: 'low',
          title: `Rôle flou pour ${member.name}`,
          description: `Le rôle de ${member.name} n'est pas clairement défini (${member.detectedRole.role} à ${member.detectedRole.confidence.toFixed(0)}% confiance).`,
          affectedPlayers: [member.steamId],
          actionItems: [
            'Clarifier les responsabilités de ce joueur',
            'Assigner des positions et des tâches spécifiques',
          ],
          expectedImpact: 'Meilleure coordination d\'équipe',
        });
      }
    }
  }

  private generateSynergyRecommendations(synergies: TeamSynergy[], recommendations: TeamRecommendation[]): void {
    // Find worst synergies
    const poorSynergies = synergies.filter((s) => s.synergyScore < SYNERGY_THRESHOLDS.average);

    for (const synergy of poorSynergies.slice(0, 2)) {
      recommendations.push({
        type: 'synergy_improvement',
        priority: synergy.synergyScore < SYNERGY_THRESHOLDS.poor ? 'high' : 'medium',
        title: `Synergie faible: ${synergy.player1Name} - ${synergy.player2Name}`,
        description: `Score de synergie de ${synergy.synergyScore.toFixed(0)}%. ${synergy.weaknesses.join('. ')}`,
        affectedPlayers: [synergy.player1SteamId, synergy.player2SteamId],
        actionItems: [
          'Pratiquer les executes ensemble',
          'Définir qui flash pour qui',
          'Établir des positions de trade claires',
        ],
        expectedImpact: 'Amélioration de la coordination dans les executes',
      });
    }
  }

  private generateConflictRecommendations(conflicts: PositionConflict[], recommendations: TeamRecommendation[]): void {
    const highConflicts = conflicts.filter((c) => c.severity === 'high');

    if (highConflicts.length > 3) {
      recommendations.push({
        type: 'position_fix',
        priority: 'high',
        title: 'Conflits de positions fréquents',
        description: `${highConflicts.length} conflits de positions majeurs détectés. Les joueurs se gênent régulièrement.`,
        affectedPlayers: [...new Set(highConflicts.flatMap((c) => c.players))],
        actionItems: [
          'Définir des zones de responsabilité par joueur',
          'Éviter les doubles peeks non coordonnés',
          'Clarifier qui prend quelle position',
        ],
        expectedImpact: 'Moins de morts inutiles, meilleur contrôle de map',
      });
    }
  }

  private generateStrategyRecommendations(teamStats: TeamGlobalStats, recommendations: TeamRecommendation[]): void {
    // Trading issues
    if (teamStats.teamTradeRate < 0.4) {
      recommendations.push({
        type: 'strategy_suggestion',
        priority: 'high',
        title: 'Taux de trade trop bas',
        description: `Seulement ${(teamStats.teamTradeRate * 100).toFixed(0)}% des morts sont tradées. L'équipe doit jouer plus groupée.`,
        affectedPlayers: [],
        actionItems: [
          'Jouer les duos plus près',
          'Établir des positions de trade par défaut',
          'Communiquer les deaths pour le trade',
        ],
        expectedImpact: 'Amélioration significative du T-side',
      });
    }

    // Entry issues
    if (teamStats.entryWinRate < 0.4) {
      recommendations.push({
        type: 'strategy_suggestion',
        priority: 'medium',
        title: 'Win rate entry insuffisant',
        description: `L'équipe ne gagne que ${(teamStats.entryWinRate * 100).toFixed(0)}% des first duels.`,
        affectedPlayers: [],
        actionItems: [
          'Utiliser plus de utility avant l\'entry',
          'Varier les timings d\'entry',
          'Pratiquer les aim duels',
        ],
        expectedImpact: 'Amélioration des ouvertures de rounds',
      });
    }

    // Clutch analysis
    if (teamStats.clutchAttempts > 5 && teamStats.clutchWinRate < 0.2) {
      recommendations.push({
        type: 'strategy_suggestion',
        priority: 'medium',
        title: 'Situations de clutch trop fréquentes',
        description: `L'équipe se retrouve souvent en clutch (${teamStats.clutchAttempts} fois) avec un win rate de ${(teamStats.clutchWinRate * 100).toFixed(0)}%.`,
        affectedPlayers: [],
        actionItems: [
          'Améliorer le trading pour éviter les clutchs',
          'Jouer plus groupé en fin de round',
          'Mieux gérer l\'économie pour avoir des pleins achats',
        ],
        expectedImpact: 'Moins de rounds perdus en clutch',
      });
    }
  }
}

// ============================================
// TYPES INTERNES
// ============================================

/**
 * Données extraites d'une demo pour l'analyse d'équipe
 */
export interface TeamDemoData {
  steamId: string;
  playerName: string;
  avatar?: string;

  // Stats de base
  kills: number;
  deaths: number;
  assists: number;
  rating: number;
  adr: number;
  kast: number;

  // Rounds
  roundsPlayed: number;
  roundsWon: number;
  tRoundsPlayed: number;
  tRoundsWon: number;
  ctRoundsPlayed: number;
  ctRoundsWon: number;

  // Entry
  entryAttempts: number;
  entrySuccess: number;
  firstDeaths: number;

  // Clutch
  clutchAttempts: number;
  clutchWins: number;

  // Trading
  tradesGiven: number;
  tradesReceived: number;
  tradesFor?: Record<string, number>; // trades for specific player
  avgTradeTime: number;
  avgTradeTimeFor?: Record<string, number>;

  // Utility
  utilityThrown: number;
  utilityDamage: number;
  flashAssists: number;
  flashAssistsFor?: Record<string, number>;
  utilityByRound?: Record<number, number>;

  // AWP
  awpKills: number;
  longRangeKills: number;

  // Position
  soloKills: number;
  lateRoundKills: number;
  siteHoldKills: number;
  positionsByRound?: Record<number, Array<{ x: number; y: number; z: number; tick: number }>>;
  avgProximityTo?: Record<string, number>;

  // Strategy
  firstActionTiming?: Record<number, number>;
  roundData?: Record<number, { side: string; won: boolean }>;

  // Economy
  avgTeamMoney: number;
  fullBuyWinRate: number;
  ecoWinRate: number;

  // Match
  teamScore: number;
  opponentScore: number;
  avgFirstKillTime: number;
  utilityCoordination: number;
  executeSuccessRate: number;

  // Category scores from analysis
  categoryScores: Record<AnalysisCategory, number>;
}

// Export singleton
export const teamAnalyzer = new TeamAnalyzer();
