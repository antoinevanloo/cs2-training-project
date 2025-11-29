/**
 * Configuration centralisée du système de coaching CS2
 *
 * Ce module exporte toute la configuration nécessaire pour:
 * - Les seuils de détection des problèmes
 * - Les profils de rôles de joueurs
 * - Les contextes par map
 * - Le système d'ajustement contextuel
 * - Les features activables/désactivables
 *
 * Usage pour les administrateurs:
 *
 * ```typescript
 * import {
 *   // Seuils
 *   DEFAULT_THRESHOLDS,
 *   getThresholdsForAdmin,
 *
 *   // Rôles
 *   PLAYER_ROLES,
 *   getRolesForAdmin,
 *
 *   // Maps
 *   MAP_CONFIGS,
 *   getMapsForAdmin,
 *
 *   // Features
 *   getFeatures,
 *   updateFeatures,
 *   disableRule,
 *   enableRule,
 *   getFeaturesForAdmin,
 *
 *   // Contexte
 *   evaluateRuleWithContext,
 *   explainAdjustments,
 * } from '@/lib/coaching/config';
 * ```
 */

// Seuils de coaching
export {
  DEFAULT_THRESHOLDS,
  checkThreshold,
  getThresholdsForAdmin,
  type CoachingThresholds,
  type ThresholdConfig,
  type CategoryThresholds,
} from './thresholds';

// Profils de rôles
export {
  PLAYER_ROLES,
  detectPlayerRole,
  getRolesForAdmin,
  type PlayerRole,
  type RoleProfile,
  type RoleDetectionInput,
} from './roles';

// Configuration des maps
export {
  MAP_CONFIGS,
  isIsolatedPositionNormal,
  getExpectedRotationTime,
  getMapThresholdModifiers,
  getMapsForAdmin,
  type CS2Map,
  type MapConfig,
  type MapZone,
} from './maps';

// Système d'ajustement contextuel
export {
  RANK_MODIFIERS,
  getAdjustedThreshold,
  evaluateRuleWithContext,
  explainAdjustments,
  getContextSummary,
  type CS2Rank,
  type PlayerContext,
  type ContextualRuleResult,
} from './context';

// Features activables/désactivables
export {
  DEFAULT_FEATURES,
  getFeatures,
  setFeatures,
  initializeFeatures,
  areFeaturesInitialized,
  updateFeatures,
  resetFeatures,
  isGlobalFeatureEnabled,
  isCategoryEnabled,
  isRuleEnabled,
  disableRule,
  enableRule,
  disableCategory,
  enableCategory,
  getFeaturesForAdmin,
  type CoachingFeatures,
  type FeatureConfig,
  type RuleFeatureConfig,
  type CategoryFeatures,
} from './features';