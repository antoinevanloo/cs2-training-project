/**
 * Team Analysis Module
 *
 * Export principal pour l'analyse d'équipe
 */

export { TeamAnalyzer, teamAnalyzer } from './team-analyzer';
export type { TeamDemoData } from './team-analyzer';
export type {
  // Main types
  TeamAnalysis,
  TeamAnalysisInput,
  TeamMember,
  TeamMemberStats,
  TeamGlobalStats,
  TeamComparison,
  ComparisonDiff,

  // Roles
  CS2Role,
  RoleDetection,
  RoleIndicator,

  // Synergies
  TeamSynergy,
  SynergyMetrics,

  // Conflicts
  PositionConflict,

  // Strategies
  StrategyType,
  RoundStrategy,
  StrategyExecution,
  StrategyRecommendation,

  // Recommendations
  TeamRecommendation,

  // Heatmap
  TeamHeatmapData,
} from './types';
