/**
 * Module Feature Flags CS2 Coach
 *
 * Export centralisé de toutes les fonctionnalités du système de features.
 */

// Types
export * from './types';

// Configuration
export {
  TIER_DEFINITIONS,
  FEATURE_DEFINITIONS,
  getFeature,
  getFeaturesByCategory,
  getFeaturesByTag,
  getFeaturesForTier,
  getCoreAnalysisFeatures,
  getFeatureDependents,
  ANALYSIS_FEATURE_IDS,
  ANALYSIS_WEIGHTS,
} from './config';

// Vérification d'accès
export {
  checkFeatureAccess,
  checkMultipleFeatures,
  getEnabledFeatures,
  getEnabledAnalysisFeatures,
  createDefaultContext,
  hasFeature,
} from './access';

// Context et Hooks React
export {
  FeatureProvider,
  useFeatures,
  useFeature,
  useHasFeature,
  useFeaturesInCategory,
  useEnabledAnalyzers,
  useTier,
  FeatureGate,
  withFeature,
} from './context';

// Calculateur de scores
export {
  getAdjustedWeights,
  calculateOverallScore,
  recalculateAnalysisScores,
  shouldShowScore,
  getWeightsSummary,
  calculateScoreImpact,
} from './score-calculator';
