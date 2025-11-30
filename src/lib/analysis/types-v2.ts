/**
 * Types d'analyse CS2 Coach v2.0 - Définitions exhaustives
 *
 * Ce fichier contient toutes les interfaces TypeScript pour les résultats
 * d'analyse, incluant les nouvelles catégories:
 * - Movement (counter-strafing, crouch, scope, air)
 * - Awareness (bombe, flash, info gathering)
 * - Teamplay (trades, support, coordination)
 * - Économie détaillée avec données réelles
 */

// =============================================================================
// RÉSULTAT D'ANALYSE PRINCIPAL
// =============================================================================

/**
 * Résultat complet d'analyse v2
 */
export interface AnalysisResultV2 {
  // Stats joueur de base
  playerStats: PlayerStatsV2;

  // Scores par catégorie (0-100)
  scores: AnalysisScoresV2;

  // Analyses détaillées
  analyses: DetailedAnalysesV2;

  // Insights
  strengths: StrengthInsight[];
  weaknesses: WeaknessInsight[];

  // Données pour visualisation
  visualizations: VisualizationData;

  // Métadonnées
  analysisVersion: string;
  analyzedAt: string;
}

/**
 * Statistiques joueur étendues
 */
export interface PlayerStatsV2 {
  // Stats de base
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  hsPercentage: number;

  // Métriques avancées
  adr: number;
  kast: number;
  rating: number;
  impact: number;

  // Stats par round
  kpr: number;
  dpr: number;
  apr: number;

  // Stats détaillées
  firstKills: number;
  firstDeaths: number;
  clutchesWon: number;
  clutchesLost: number;
  tradeKills: number;
  tradedDeaths: number;

  // Utilitaires
  flashAssists: number;
  enemiesFlashed: number;
  utilityDamage: number;

  // Économie
  totalMoneySpent: number;
  avgEquipmentValue: number;

  // Par arme
  statsByWeapon: Record<string, WeaponStats>;
}

/**
 * Stats par arme
 */
export interface WeaponStats {
  kills: number;
  deaths: number;
  headshots: number;
  damage: number;
  shots: number;
  hits: number;
  accuracy: number;
}

/**
 * Scores d'analyse v2 (9 catégories)
 */
export interface AnalysisScoresV2 {
  overall: number;
  aim: number;
  positioning: number;
  utility: number;
  economy: number;
  timing: number;
  decision: number;
  // Nouvelles catégories
  movement: number;
  awareness: number;
  teamplay: number;
}

/**
 * Analyses détaillées v2
 */
export interface DetailedAnalysesV2 {
  aim: AimAnalysisV2;
  positioning: PositioningAnalysisV2;
  utility: UtilityAnalysisV2;
  economy: EconomyAnalysisV2;
  timing: TimingAnalysisV2;
  decision: DecisionAnalysisV2;
  // Nouvelles analyses
  movement: MovementAnalysis;
  awareness: AwarenessAnalysis;
  teamplay: TeamplayAnalysis;
}

// =============================================================================
// ANALYSE AIM (améliorée)
// =============================================================================

export interface AimAnalysisV2 {
  crosshairPlacement: {
    score: number;
    headLevelTime: number;
    preAimScore: number;
  };

  reactionTime: {
    average: number;
    best: number;
    worst: number;
    consistency: number;
  };

  accuracy: {
    overall: number;
    headshot: number;
    firstBullet: number;
    spray: number;
    byWeapon: Record<string, number>;
  };

  sprayControl: {
    score: number;
    transferSpeed: number;
    bulletsToKill: number;
    sprayAccuracy: number;
  };

  // Nouvelles métriques
  counterStrafing: {
    rate: number;
    perfectRate: number;
    movingShots: number;
  };

  scopeDiscipline: {
    quickScopeRate: number;
    noScopeRate: number;
    holdScopeTime: number;
  };

  // Métriques numériques
  metrics: Record<string, number>;

  // Positions de kills pour heatmap
  killPositions: Array<{
    x: number;
    y: number;
    round: number;
    weapon: string;
    wasHeadshot: boolean;
    distance: number;
  }>;
}

// =============================================================================
// ANALYSE POSITIONING (améliorée)
// =============================================================================

export interface PositioningAnalysisV2 {
  mapControl: {
    score: number;
    avgAreaControlled: number;
    zonePresence: Record<string, number>;
  };

  rotationSpeed: {
    average: number;
    optimal: number;
    early: number;
    onTime: number;
    late: number;
  };

  deathPositions: Array<{
    x: number;
    y: number;
    count: number;
    isBadPosition: boolean;
    zone: string;
  }>;

  individualDeaths: Array<{
    x: number;
    y: number;
    round: number;
    weapon?: string;
    wasTraded: boolean;
    wasBlind?: boolean;
    timeAlive: number;
  }>;

  // Nouvelles métriques
  exposureAnalysis: {
    avgExposedTime: number;
    multiAngleDeaths: number;
    isolatedDeaths: number;
  };

  coverUsage: {
    coverKills: number;
    openKills: number;
    coverScore: number;
  };

  angleHolding: {
    offAngles: number;
    commonAngles: number;
    jigglePeeks: number;
  };

  commonMistakes: string[];
  metrics: Record<string, number>;
}

// =============================================================================
// ANALYSE UTILITY (améliorée avec player_blind)
// =============================================================================

export interface UtilityAnalysisV2 {
  flashEfficiency: {
    thrown: number;
    enemiesFlashed: number;
    effectiveness: number;
    avgBlindDuration: number;
    fullBlinds: number;
    teamFlashes: number;
    selfFlashes: number;
    flashKills: number;
  };

  smokeUsage: {
    thrown: number;
    usedForExecute: number;
    usedDefensively: number;
    oneWaySmokes: number;
    timingScore: number;
  };

  molotovDamage: {
    thrown: number;
    totalDamage: number;
    avgDamagePerMolly: number;
    kills: number;
    denialMollies: number;
  };

  heUsage: {
    thrown: number;
    totalDamage: number;
    avgDamagePerHE: number;
    kills: number;
    multiHits: number;
  };

  // Nouvelles métriques
  utilityEconomy: {
    totalSpentOnUtility: number;
    utilityValueGenerated: number;
    roi: number;
  };

  utilityTiming: {
    preExecuteUsage: number;
    reactiveUsage: number;
    wastedUtility: number;
    utilityAtDeath: number;
  };

  lineups: {
    known: number;
    custom: number;
    failed: number;
  };

  metrics: Record<string, number>;
}

// =============================================================================
// ANALYSE ÉCONOMIE (refonte complète avec données réelles)
// =============================================================================

export interface EconomyAnalysisV2 {
  buyDecisions: {
    correct: number;
    incorrect: number;
    score: number;
    breakdown: {
      fullBuy: number;
      halfBuy: number;
      forceBuy: number;
      eco: number;
      save: number;
    };
  };

  saveRounds: {
    appropriate: number;
    inappropriate: number;
    savesWithTeam: number;
    soloSaves: number;
  };

  equipmentManagement: {
    avgEquipmentValue: number;
    avgBalanceAtDeath: number;
    expensiveDeaths: number;
    pistolRoundWins: number;
  };

  teamImpact: {
    positiveRounds: number;
    negativeRounds: number;
    moneyShared: number;
    dropsGiven: number;
  };

  // Nouvelles métriques détaillées
  roundByRound: RoundEconomyAnalysis[];

  buyPatterns: {
    preferredLoadout: string[];
    helmetBuyRate: number;
    defuserBuyRate: number;
    fullUtilityRate: number;
  };

  impactMetrics: {
    moneyDenied: number;
    moneyLost: number;
    avgValuePerKill: number;
    avgValuePerDeath: number;
  };

  metrics: Record<string, number>;
}

/**
 * Analyse économique par round
 */
export interface RoundEconomyAnalysis {
  round: number;
  balance: number;
  spent: number;
  equipmentValue: number;
  buyType: 'full' | 'half' | 'force' | 'eco' | 'save' | 'pistol';
  teamBuyType: 'full' | 'half' | 'force' | 'eco' | 'save' | 'pistol';
  decision: 'correct' | 'incorrect' | 'neutral';
  outcome: 'win' | 'loss' | 'survived' | 'died';
}

// =============================================================================
// ANALYSE TIMING (améliorée)
// =============================================================================

export interface TimingAnalysisV2 {
  peekTiming: {
    score: number;
    avgPrefire: boolean;
    earlyPeeks: number;
    latePeeks: number;
    optimalPeeks: number;
  };

  tradeSpeed: {
    average: number;
    successful: number;
    instantTrades: number;
    fastTrades: number;
    slowTrades: number;
  };

  rotationTiming: {
    early: number;
    onTime: number;
    late: number;
    avgRotationTime: number;
    bombAwareness: number;
  };

  // Nouvelles métriques
  entryTiming: {
    firstContact: number;
    entryKills: number;
    entryDeaths: number;
    avgTimeToContact: number;
  };

  retakeTiming: {
    attempts: number;
    successful: number;
    avgTimeLeft: number;
    defuseClutches: number;
  };

  bombTiming: {
    avgPlantTime: number;
    avgDefuseStart: number;
    fakeDefuses: number;
    ninjaDefuses: number;
  };

  metrics: Record<string, number>;
}

// =============================================================================
// ANALYSE DÉCISION (améliorée)
// =============================================================================

export interface DecisionAnalysisV2 {
  clutchPerformance: {
    attempts: number;
    won: number;
    score: number;
    byType: Record<string, { attempts: number; won: number }>;
  };

  retakeDecisions: {
    correct: number;
    incorrect: number;
    goRate: number;
    saveRate: number;
  };

  aggressionLevel: 'passive' | 'balanced' | 'aggressive';
  aggressionScore: number;

  riskTaking: {
    calculated: number;
    reckless: number;
    score: number;
  };

  // Nouvelles métriques
  positioningDecisions: {
    rotateCorrect: number;
    rotateIncorrect: number;
    holdCorrect: number;
    pushCorrect: number;
  };

  bombDecisions: {
    plantDecisions: number;
    defuseDecisions: number;
    correctCalls: number;
  };

  adaptability: {
    strategyChanges: number;
    responseToLoss: number;
    responseToWin: number;
  };

  metrics: Record<string, number>;
}

// =============================================================================
// NOUVELLE ANALYSE: MOVEMENT
// =============================================================================

export interface MovementAnalysis {
  counterStrafing: {
    attempts: number;
    perfect: number;
    good: number;
    poor: number;
    score: number;
    avgSpeedAtShot: number;
  };

  crouchUsage: {
    crouchKills: number;
    crouchDeaths: number;
    crouchSprayRate: number;
    appropriateCrouch: number;
    inappropriateCrouch: number;
    score: number;
  };

  scopeDiscipline: {
    scopedKills: number;
    unscopedKills: number;
    quickScopeRate: number;
    hardScopeRate: number;
    noScopeSuccess: number;
    score: number;
  };

  jumpUsage: {
    jumpShots: number;
    jumpShotHits: number;
    jumpPeeks: number;
    bunnyHops: number;
    score: number;
  };

  walkDiscipline: {
    walkKills: number;
    runningExposed: number;
    silentApproaches: number;
    noiseGiveaways: number;
    score: number;
  };

  strafePatterns: {
    adPattern: number;
    wideSwings: number;
    tightPeeks: number;
    jigglePeeks: number;
  };

  overallScore: number;
  metrics: Record<string, number>;
}

// =============================================================================
// NOUVELLE ANALYSE: AWARENESS
// =============================================================================

export interface AwarenessAnalysis {
  bombAwareness: {
    // CT
    rotationsToPlant: number;
    correctRotations: number;
    lateRotations: number;
    defuseAttempts: number;
    clutchDefuses: number;
    fakeDefuseSuccess: number;

    // T
    plantSiteChoices: number;
    plantSuccess: number;
    bombDropPositions: number;
    bombRecoveries: number;

    score: number;
  };

  flashAwareness: {
    flashesDodged: number;
    fullBlindsReceived: number;
    partialBlindsReceived: number;
    blindDeaths: number;
    flashLookAways: number;
    score: number;
  };

  infoGathering: {
    firstContacts: number;
    infoKills: number;
    survivalAfterInfo: number;
    calloutOpportunities: number;
    score: number;
  };

  mapReading: {
    predictivePositioning: number;
    enemyLocationAwareness: number;
    rotationPredictions: number;
    score: number;
  };

  soundAwareness: {
    soundCues: number;
    silentPlays: number;
    audioReactions: number;
    score: number;
  };

  overallScore: number;
  metrics: Record<string, number>;
}

// =============================================================================
// NOUVELLE ANALYSE: TEAMPLAY
// =============================================================================

export interface TeamplayAnalysis {
  trading: {
    tradesGiven: number;
    tradesReceived: number;
    tradingRate: number;
    avgTradeTime: number;
    instantTrades: number;
    missedTrades: number;
    score: number;
  };

  support: {
    flashAssists: number;
    smokeSupport: number;
    refragSupport: number;
    baitRate: number;
    supportKills: number;
    score: number;
  };

  coordination: {
    synchronizedPeeks: number;
    executeParticipation: number;
    callFollowing: number;
    teamRotations: number;
    score: number;
  };

  entrying: {
    entryAttempts: number;
    entryKills: number;
    entryDeaths: number;
    entrySuccess: number;
    openingDuels: number;
    score: number;
  };

  anchor: {
    siteHolds: number;
    retakeKills: number;
    delayingDeaths: number;
    infoBeforeDeath: number;
    score: number;
  };

  clutch: {
    clutchAttempts: number;
    clutchWins: number;
    clutchKills: number;
    avgKillsInClutch: number;
    score: number;
  };

  overallScore: number;
  metrics: Record<string, number>;
}

// =============================================================================
// INSIGHTS
// =============================================================================

export interface StrengthInsight {
  category: string;
  metric: string;
  value: number;
  percentile: number;
  description: string;
  comparison?: string;
}

export interface WeaknessInsight {
  category: string;
  metric: string;
  value: number;
  percentile: number;
  description: string;
  recommendation: string;
  exercises?: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// =============================================================================
// VISUALISATION
// =============================================================================

export interface VisualizationData {
  killHeatmap: HeatmapData;
  deathHeatmap: HeatmapData;
  movementHeatmap: HeatmapData;
  economyChart: EconomyChartData;
  performanceRadar: RadarChartData;
  roundTimeline: RoundTimelineData[];
}

export interface HeatmapData {
  points: Array<{
    x: number;
    y: number;
    value: number;
    metadata?: Record<string, unknown>;
  }>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface EconomyChartData {
  rounds: number[];
  balance: number[];
  equipmentValue: number[];
  teamAverage?: number[];
}

export interface RadarChartData {
  categories: string[];
  values: number[];
  benchmarks?: number[];
}

export interface RoundTimelineData {
  round: number;
  events: Array<{
    tick: number;
    type: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  outcome: 'win' | 'loss';
}

// =============================================================================
// CONFIGURATION D'ANALYSE
// =============================================================================

export interface AnalysisConfig {
  // Catégories à analyser
  categories: {
    aim: boolean;
    positioning: boolean;
    utility: boolean;
    economy: boolean;
    timing: boolean;
    decision: boolean;
    movement: boolean;
    awareness: boolean;
    teamplay: boolean;
  };

  // Poids pour le score global
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

  // Options de calcul
  options: {
    includeVisualizations: boolean;
    includeRoundByRound: boolean;
    includeHeatmaps: boolean;
    minRoundsForAnalysis: number;
  };
}

/**
 * Configuration par défaut
 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  categories: {
    aim: true,
    positioning: true,
    utility: true,
    economy: true,
    timing: true,
    decision: true,
    movement: true,
    awareness: true,
    teamplay: true,
  },
  weights: {
    aim: 0.18,
    positioning: 0.14,
    utility: 0.10,
    economy: 0.08,
    timing: 0.12,
    decision: 0.12,
    movement: 0.10,
    awareness: 0.08,
    teamplay: 0.08,
  },
  options: {
    includeVisualizations: true,
    includeRoundByRound: true,
    includeHeatmaps: true,
    minRoundsForAnalysis: 5,
  },
};

// =============================================================================
// EXPORT DES ANCIENS TYPES POUR COMPATIBILITÉ
// =============================================================================

// Ré-export des types existants renommés
export type {
  AimAnalysisV2 as AimAnalysis,
  PositioningAnalysisV2 as PositioningAnalysis,
  UtilityAnalysisV2 as UtilityAnalysis,
  EconomyAnalysisV2 as EconomyAnalysis,
  TimingAnalysisV2 as TimingAnalysis,
  DecisionAnalysisV2 as DecisionAnalysis,
  AnalysisScoresV2 as AnalysisScores,
  AnalysisResultV2 as AnalysisResult,
  PlayerStatsV2 as PlayerStats,
  DetailedAnalysesV2 as DetailedAnalyses,
};