/**
 * Point d'entrée simplifié pour les règles de coaching
 *
 * @example
 * import { allCoachingRules, aimRules, getRulesByCategory } from '@/lib/coaching/rules';
 */

export {
  // Toutes les règles combinées
  allCoachingRules,

  // Règles par catégorie
  aimRules,
  positioningRules,
  utilityRules,
  economyRules,
  timingRules,
  decisionRules,

  // Fonctions utilitaires
  getRulesByCategory,
  getRuleById,

  // Statistiques
  rulesStats,
} from './rules/index';

// Réexport du type
export type { CoachingRule } from './types';