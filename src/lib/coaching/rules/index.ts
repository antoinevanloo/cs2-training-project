import { CoachingRule } from '../types';
import { aimRules } from './aim-rules';
import { positioningRules } from './positioning-rules';
import { utilityRules } from './utility-rules';
import { economyRules } from './economy-rules';
import { timingRules } from './timing-rules';
import { decisionRules } from './decision-rules';

/**
 * Export toutes les règles par catégorie pour usage individuel
 */
export {
  aimRules,
  positioningRules,
  utilityRules,
  economyRules,
  timingRules,
  decisionRules,
};

/**
 * Toutes les règles de coaching combinées
 * Triées par priorité (1 = critique, 4 = faible)
 */
export const allCoachingRules: CoachingRule[] = [
  ...aimRules,
  ...positioningRules,
  ...utilityRules,
  ...economyRules,
  ...timingRules,
  ...decisionRules,
].sort((a, b) => a.priority - b.priority);

/**
 * Récupère les règles par catégorie
 */
export function getRulesByCategory(
  category: CoachingRule['category']
): CoachingRule[] {
  return allCoachingRules.filter((rule) => rule.category === category);
}

/**
 * Récupère une règle par son ID
 */
export function getRuleById(id: string): CoachingRule | undefined {
  return allCoachingRules.find((rule) => rule.id === id);
}

/**
 * Statistiques sur les règles disponibles
 */
export const rulesStats = {
  total: allCoachingRules.length,
  byCategory: {
    aim: aimRules.length,
    positioning: positioningRules.length,
    utility: utilityRules.length,
    economy: economyRules.length,
    timing: timingRules.length,
    decision: decisionRules.length,
  },
  byPriority: {
    critical: allCoachingRules.filter((r) => r.priority === 1).length,
    high: allCoachingRules.filter((r) => r.priority === 2).length,
    medium: allCoachingRules.filter((r) => r.priority === 3).length,
    low: allCoachingRules.filter((r) => r.priority === 4).length,
  },
};