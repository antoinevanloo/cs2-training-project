/**
 * Types pour l'analyse d'équipe CS2 Coach
 *
 * Structure modulaire pour supporter :
 * - Analyse multi-perspectives (même match, différents joueurs)
 * - Détection de rôles
 * - Synergies et coordination
 * - Recommandations stratégiques
 */

import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// RÔLES CS2
// ============================================

export type CS2Role = 'entry' | 'support' | 'awp' | 'lurker' | 'igl' | 'anchor' | 'flex';

export interface RoleDetection {
  role: CS2Role;
  confidence: number; // 0-100
  indicators: RoleIndicator[];
  alternativeRoles: Array<{ role: CS2Role; confidence: number }>;
}

export interface RoleIndicator {
  type: 'entry_attempts' | 'first_deaths' | 'trade_given' | 'utility_usage' | 'positioning' | 'weapon_choice' | 'clutch_situations';
  value: number;
  weight: number;
  description: string;
}

// ============================================
// SYNERGIES
// ============================================

export interface TeamSynergy {
  player1SteamId: string;
  player2SteamId: string;
  player1Name: string;
  player2Name: string;
  synergyScore: number; // 0-100
  metrics: SynergyMetrics;
  strengths: string[];
  weaknesses: string[];
}

export interface SynergyMetrics {
  /** Taux de trade mutuel */
  tradeRate: number;
  /** Temps moyen pour trader l'autre */
  avgTradeTime: number;
  /** Score de coordination utility */
  utilityCoordination: number;
  /** Fréquence de jeu ensemble */
  playTogether: number;
  /** Score de communication implicite */
  implicitComm: number;
}

// ============================================
// CONFLITS DE POSITIONS
// ============================================

export interface PositionConflict {
  round: number;
  tick: number;
  players: string[];
  position: { x: number; y: number; z: number };
  conflictType: 'overlap' | 'crossfire' | 'blocking' | 'rotation_conflict';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

// ============================================
// STRATÉGIES
// ============================================

export type StrategyType = 'default' | 'execute_a' | 'execute_b' | 'split' | 'fast' | 'slow' | 'eco_rush' | 'pick' | 'fake';

export interface RoundStrategy {
  round: number;
  side: 'T' | 'CT';
  detectedStrategy: StrategyType;
  confidence: number;
  execution: StrategyExecution;
  outcome: 'win' | 'loss';
  notes: string[];
}

export interface StrategyExecution {
  score: number; // 0-100
  timing: 'early' | 'mid' | 'late';
  utilityUsage: number; // % of available utility used
  coordination: number; // 0-100
  issues: string[];
}

export interface StrategyRecommendation {
  map: string;
  side: 'T' | 'CT';
  strategy: StrategyType;
  reason: string;
  requiredRoles: CS2Role[];
  utilityRequired: string[];
  setupPositions: Array<{
    role: CS2Role;
    position: string;
    callout: string;
  }>;
  execution: string[];
  counters: string[];
}

// ============================================
// ANALYSE ÉQUIPE COMPLÈTE
// ============================================

export interface TeamMember {
  steamId: string;
  name: string;
  avatar?: string;
  detectedRole: RoleDetection;
  stats: TeamMemberStats;
  categoryScores: Record<AnalysisCategory, number>;
}

export interface TeamMemberStats {
  kills: number;
  deaths: number;
  assists: number;
  rating: number;
  adr: number;
  kast: number;
  entryAttempts: number;
  entrySuccess: number;
  clutchAttempts: number;
  clutchWins: number;
  utilityDamage: number;
  flashAssists: number;
  tradesGiven: number;
  tradesReceived: number;
}

export interface TeamAnalysis {
  /** Identifiant unique de l'analyse */
  id: string;

  /** Date de l'analyse */
  analyzedAt: Date;

  /** Map analysée */
  map: string;

  /** Résultat du match */
  matchResult: 'win' | 'loss' | 'draw';
  score: { team: number; opponent: number };

  /** Membres de l'équipe */
  members: TeamMember[];

  /** Score global de l'équipe */
  teamScore: number;

  /** Scores par catégorie (moyenne équipe) */
  categoryScores: Record<AnalysisCategory, number>;

  /** Synergies entre joueurs */
  synergies: TeamSynergy[];

  /** Conflits détectés */
  conflicts: PositionConflict[];

  /** Stratégies par round */
  roundStrategies: RoundStrategy[];

  /** Recommandations */
  recommendations: TeamRecommendation[];

  /** Statistiques globales équipe */
  teamStats: TeamGlobalStats;

  /** Heatmap combiné (optionnel) */
  combinedHeatmap?: TeamHeatmapData;
}

export interface TeamRecommendation {
  type: 'role_adjustment' | 'synergy_improvement' | 'strategy_suggestion' | 'utility_coordination' | 'position_fix';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedPlayers: string[];
  actionItems: string[];
  expectedImpact: string;
}

export interface TeamGlobalStats {
  /** Rounds joués */
  roundsPlayed: number;
  roundsWon: number;
  roundsLost: number;

  /** T-side */
  tRoundsWon: number;
  tRoundsPlayed: number;

  /** CT-side */
  ctRoundsWon: number;
  ctRoundsPlayed: number;

  /** Économie */
  avgTeamMoney: number;
  fullBuyWinRate: number;
  ecoWinRate: number;

  /** Trading */
  teamTradeRate: number;
  avgTradeTime: number;

  /** Entry */
  entryWinRate: number;
  avgFirstKillTime: number;

  /** Coordination */
  utilityCoordination: number;
  executeSuccessRate: number;

  /** Clutchs */
  clutchWinRate: number;
  clutchAttempts: number;
}

export interface TeamHeatmapData {
  positions: Array<{
    x: number;
    y: number;
    type: 'kill' | 'death' | 'position';
    playerId: string;
    count: number;
  }>;
  density: number[][];
}

// ============================================
// INPUT POUR L'ANALYZER
// ============================================

export interface TeamAnalysisInput {
  /** Demos des membres de l'équipe (même match) */
  demos: Array<{
    demoId: string;
    steamId: string;
    playerName: string;
  }>;

  /** Map du match */
  map: string;

  /** Équipe analysée (CT ou T au départ) */
  startingSide: 'CT' | 'T';

  /** Options d'analyse */
  options?: {
    /** Analyser les synergies (plus lent) */
    analyzeSynergies?: boolean;
    /** Détecter les conflits */
    detectConflicts?: boolean;
    /** Générer le heatmap combiné */
    generateHeatmap?: boolean;
    /** Profondeur d'analyse des stratégies */
    strategyDepth?: 'basic' | 'detailed';
  };
}

// ============================================
// COMPARAISON ÉQUIPE
// ============================================

export interface TeamComparison {
  match1: TeamAnalysis;
  match2: TeamAnalysis;
  improvements: ComparisonDiff[];
  regressions: ComparisonDiff[];
  stable: string[];
}

export interface ComparisonDiff {
  metric: string;
  category: string;
  match1Value: number;
  match2Value: number;
  change: number;
  changePercent: number;
  significance: 'minor' | 'moderate' | 'significant';
}
