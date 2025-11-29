/**
 * Système d'ajustement contextuel des seuils de coaching
 *
 * Ce module combine:
 * - Les seuils par défaut
 * - Les modificateurs de rôle
 * - Les modificateurs de map
 * - Les modificateurs de rank (optionnel)
 *
 * Pour produire des seuils ajustés au contexte du joueur.
 */

import {
  DEFAULT_THRESHOLDS,
  CoachingThresholds,
  ThresholdConfig,
  checkThreshold,
} from './thresholds';
import { PLAYER_ROLES, PlayerRole, RoleProfile } from './roles';
import { MAP_CONFIGS, CS2Map, getMapThresholdModifiers } from './maps';

/**
 * Rangs CS2 pour l'ajustement des attentes
 */
export type CS2Rank =
  | 'silver'
  | 'gold_nova'
  | 'master_guardian'
  | 'legendary_eagle'
  | 'supreme'
  | 'global';

/**
 * Modificateurs de seuils par rank
 * Les joueurs de bas rank ont des attentes plus basses
 */
export const RANK_MODIFIERS: Record<CS2Rank, { [key: string]: number }> = {
  silver: {
    low_hs_percentage: 1.5, // 35% -> ~23% attendu
    poor_first_bullet_accuracy: 1.4,
    slow_reaction_time: 1.3,
    poor_spray_control: 1.5,
    poor_map_control: 1.4,
    poor_trade_speed: 1.3,
    poor_clutch_performance: 1.4,
  },
  gold_nova: {
    low_hs_percentage: 1.2,
    poor_first_bullet_accuracy: 1.2,
    slow_reaction_time: 1.15,
    poor_spray_control: 1.2,
    poor_map_control: 1.2,
    poor_trade_speed: 1.15,
  },
  master_guardian: {
    // Standards normaux
  },
  legendary_eagle: {
    low_hs_percentage: 0.9, // Plus strict
    poor_first_bullet_accuracy: 0.9,
    poor_trade_speed: 0.9,
  },
  supreme: {
    low_hs_percentage: 0.8,
    poor_first_bullet_accuracy: 0.8,
    slow_reaction_time: 0.85,
    poor_spray_control: 0.85,
    poor_trade_speed: 0.8,
    poor_clutch_performance: 0.85,
  },
  global: {
    low_hs_percentage: 0.7, // Très strict pour Global
    poor_first_bullet_accuracy: 0.7,
    slow_reaction_time: 0.8,
    poor_spray_control: 0.75,
    poor_map_control: 0.8,
    poor_trade_speed: 0.7,
    poor_clutch_performance: 0.75,
  },
};

/**
 * Contexte complet pour l'évaluation d'un joueur
 */
export interface PlayerContext {
  role?: PlayerRole;
  map?: string;
  rank?: CS2Rank;
  side?: 'ct' | 't';
}

/**
 * Résultat d'une évaluation de règle avec contexte
 */
export interface ContextualRuleResult {
  ruleId: string;
  triggered: boolean;
  originalThreshold: number;
  adjustedThreshold: number;
  actualValue: number;
  modifiers: {
    role?: number;
    map?: number;
    rank?: number;
  };
  disabled: boolean;
  disabledReason?: string;
}

/**
 * Calcule le seuil ajusté pour une règle donnée
 */
export function getAdjustedThreshold(
  ruleId: string,
  category: keyof CoachingThresholds,
  context: PlayerContext
): { threshold: number; disabled: boolean; modifiers: { role?: number; map?: number; rank?: number } } {
  const baseThreshold = DEFAULT_THRESHOLDS[category]?.[ruleId];

  if (!baseThreshold) {
    return { threshold: 0, disabled: true, modifiers: {} };
  }

  let adjustedValue = baseThreshold.value;
  const modifiers: { role?: number; map?: number; rank?: number } = {};

  // 1. Appliquer les modificateurs de rôle
  if (context.role) {
    const roleProfile = PLAYER_ROLES[context.role];
    const roleModifier = roleProfile?.thresholdModifiers[ruleId];

    if (roleModifier === null) {
      // Règle désactivée pour ce rôle
      return {
        threshold: adjustedValue,
        disabled: true,
        modifiers: { role: null as unknown as number },
      };
    }

    if (roleModifier !== undefined) {
      adjustedValue *= roleModifier;
      modifiers.role = roleModifier;
    }
  }

  // 2. Appliquer les modificateurs de map
  if (context.map) {
    const mapModifiers = getMapThresholdModifiers(context.map);
    const mapModifier = mapModifiers[ruleId];

    if (mapModifier !== undefined) {
      adjustedValue *= mapModifier;
      modifiers.map = mapModifier;
    }
  }

  // 3. Appliquer les modificateurs de rank
  if (context.rank) {
    const rankModifiers = RANK_MODIFIERS[context.rank];
    const rankModifier = rankModifiers?.[ruleId];

    if (rankModifier !== undefined) {
      adjustedValue *= rankModifier;
      modifiers.rank = rankModifier;
    }
  }

  return { threshold: adjustedValue, disabled: false, modifiers };
}

/**
 * Évalue une règle avec le contexte complet
 */
export function evaluateRuleWithContext(
  ruleId: string,
  category: keyof CoachingThresholds,
  actualValue: number,
  context: PlayerContext
): ContextualRuleResult {
  const baseThreshold = DEFAULT_THRESHOLDS[category]?.[ruleId];

  if (!baseThreshold) {
    return {
      ruleId,
      triggered: false,
      originalThreshold: 0,
      adjustedThreshold: 0,
      actualValue,
      modifiers: {},
      disabled: true,
      disabledReason: 'Règle non trouvée',
    };
  }

  const { threshold, disabled, modifiers } = getAdjustedThreshold(ruleId, category, context);

  if (disabled) {
    let reason = 'Règle désactivée';
    if (context.role && modifiers.role === null) {
      const roleProfile = PLAYER_ROLES[context.role];
      reason = `Non applicable pour le rôle ${roleProfile.name}`;
    }

    return {
      ruleId,
      triggered: false,
      originalThreshold: baseThreshold.value,
      adjustedThreshold: threshold,
      actualValue,
      modifiers,
      disabled: true,
      disabledReason: reason,
    };
  }

  // Créer un threshold temporaire avec la valeur ajustée
  const adjustedThreshold: ThresholdConfig = {
    ...baseThreshold,
    value: threshold,
  };

  const triggered = checkThreshold(actualValue, adjustedThreshold);

  return {
    ruleId,
    triggered,
    originalThreshold: baseThreshold.value,
    adjustedThreshold: threshold,
    actualValue,
    modifiers,
    disabled: false,
  };
}

/**
 * Génère un rapport d'explication des ajustements pour l'admin
 */
export function explainAdjustments(
  ruleId: string,
  category: keyof CoachingThresholds,
  context: PlayerContext
): string {
  const baseThreshold = DEFAULT_THRESHOLDS[category]?.[ruleId];

  if (!baseThreshold) {
    return `Règle "${ruleId}" non trouvée.`;
  }

  const { threshold, disabled, modifiers } = getAdjustedThreshold(ruleId, category, context);

  const lines: string[] = [
    `Règle: ${ruleId}`,
    `Description: ${baseThreshold.description}`,
    `Seuil par défaut: ${baseThreshold.value}`,
  ];

  if (disabled) {
    if (context.role) {
      const roleProfile = PLAYER_ROLES[context.role];
      lines.push(`❌ Règle désactivée pour le rôle "${roleProfile.name}"`);
    }
    return lines.join('\n');
  }

  if (Object.keys(modifiers).length > 0) {
    lines.push('Modificateurs appliqués:');

    if (modifiers.role !== undefined) {
      const roleProfile = PLAYER_ROLES[context.role!];
      lines.push(`  • Rôle (${roleProfile.name}): ×${modifiers.role}`);
    }

    if (modifiers.map !== undefined) {
      lines.push(`  • Map (${context.map}): ×${modifiers.map}`);
    }

    if (modifiers.rank !== undefined) {
      lines.push(`  • Rank (${context.rank}): ×${modifiers.rank}`);
    }

    lines.push(`Seuil ajusté: ${threshold.toFixed(2)}`);
  } else {
    lines.push('Aucun modificateur appliqué.');
  }

  return lines.join('\n');
}

/**
 * Retourne un résumé du contexte pour l'affichage
 */
export function getContextSummary(context: PlayerContext): string {
  const parts: string[] = [];

  if (context.role) {
    parts.push(`Rôle: ${PLAYER_ROLES[context.role].name}`);
  }

  if (context.map) {
    const mapId = context.map.toLowerCase().replace('/', '_') as CS2Map;
    const mapConfig = MAP_CONFIGS[mapId];
    parts.push(`Map: ${mapConfig?.name || context.map}`);
  }

  if (context.rank) {
    parts.push(`Rank: ${context.rank}`);
  }

  if (context.side) {
    parts.push(`Côté: ${context.side.toUpperCase()}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'Contexte par défaut';
}

/**
 * Exporte le fichier index pour le dossier config
 */
export * from './thresholds';
export * from './roles';
export * from './maps';