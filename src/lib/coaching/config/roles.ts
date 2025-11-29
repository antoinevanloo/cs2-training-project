/**
 * Configuration des rôles de joueurs CS2
 *
 * Chaque rôle a des caractéristiques spécifiques qui ajustent les seuils de coaching.
 * Par exemple, un lurker isolé n'est pas un problème, un entry qui meurt beaucoup non plus.
 */

export type PlayerRole = 'entry' | 'awper' | 'lurker' | 'support' | 'igl' | 'rifler';

export interface RoleProfile {
  id: PlayerRole;
  name: string;
  description: string;

  /**
   * Caractéristiques attendues du rôle
   * Ces valeurs servent de référence pour ajuster les seuils
   */
  expectedBehavior: {
    // Combat
    expectedDeathRate: 'high' | 'normal' | 'low';
    expectedEntryRate: 'high' | 'normal' | 'low';
    expectedKD: 'high' | 'normal' | 'low';
    expectedFirstKills: 'high' | 'normal' | 'low';

    // Positionnement
    isolatedPlayNormal: boolean;
    expectedMapControl: 'high' | 'normal' | 'low';
    aggressivePositions: boolean;

    // Utility
    utilityPriority: 'high' | 'normal' | 'low';
    flashPriority: 'high' | 'normal' | 'low';
    smokePriority: 'high' | 'normal' | 'low';

    // Économie
    expensiveLoadout: boolean;
    canSaveForAWP: boolean;
  };

  /**
   * Modificateurs de seuils pour ce rôle
   * Multiplie ou remplace les seuils par défaut
   */
  thresholdModifiers: {
    // Format: { ruleId: multiplier }
    // > 1.0 = plus tolérant (seuil augmenté)
    // < 1.0 = plus strict (seuil diminué)
    // null = désactiver la règle pour ce rôle
    [ruleId: string]: number | null;
  };
}

export const PLAYER_ROLES: Record<PlayerRole, RoleProfile> = {
  entry: {
    id: 'entry',
    name: 'Entry Fragger',
    description:
      'Premier à entrer sur site, crée l\'espace pour l\'équipe. Meurt souvent mais doit avoir un impact.',

    expectedBehavior: {
      expectedDeathRate: 'high',
      expectedEntryRate: 'high',
      expectedKD: 'low', // Normal d'avoir un K/D plus bas
      expectedFirstKills: 'high',
      isolatedPlayNormal: false,
      expectedMapControl: 'high',
      aggressivePositions: true,
      utilityPriority: 'normal',
      flashPriority: 'high', // Flashs pour entrer
      smokePriority: 'normal',
      expensiveLoadout: false,
      canSaveForAWP: false,
    },

    thresholdModifiers: {
      // Positionnement - plus tolérant sur les morts
      isolated_death_rate: 1.3, // 40% -> 52% toléré
      dying_too_fast: 0.7, // 30s -> 21s toléré (normal de mourir vite)
      repeated_death_positions: 1.5, // Les entrées sont prévisibles

      // Décision - normal d'être agressif
      reckless_play_style: 1.5, // Plus tolérant
      low_opening_duel_rate: 0.8, // Plus strict, c'est son job

      // Timing - doit être bon
      poor_trade_speed: null, // Non applicable, c'est lui qu'on trade
    },
  },

  awper: {
    id: 'awper',
    name: 'AWPer',
    description:
      'Sniper de l\'équipe. Joue souvent seul, tient des angles. Doit avoir un impact économique.',

    expectedBehavior: {
      expectedDeathRate: 'normal',
      expectedEntryRate: 'low',
      expectedKD: 'high', // Doit avoir un bon K/D avec l'AWP
      expectedFirstKills: 'high', // First pick avec l'AWP
      isolatedPlayNormal: true, // Souvent seul mid, etc.
      expectedMapControl: 'normal',
      aggressivePositions: false, // Tient des angles
      utilityPriority: 'low',
      flashPriority: 'low',
      smokePriority: 'low',
      expensiveLoadout: true,
      canSaveForAWP: true,
    },

    thresholdModifiers: {
      // Positionnement - normal d'être isolé
      isolated_death_rate: null, // Désactivé - normal pour AWPer
      poor_map_control: 1.3, // Plus tolérant, il tient un angle

      // Aim - plus strict sur certains points
      poor_spray_control: null, // Non applicable à l'AWP
      poor_first_bullet_accuracy: 0.7, // Plus strict, doit one-shot

      // Utility - moins attendu
      low_flash_usage: 1.5, // Plus tolérant
      low_smoke_usage: 1.5, // Plus tolérant

      // Économie - spécifique
      force_buy_addiction: 0.7, // Plus strict, doit save pour AWP
    },
  },

  lurker: {
    id: 'lurker',
    name: 'Lurker',
    description:
      'Joue seul à l\'opposé de l\'équipe. Cherche les timings, les rotations. Isolé par définition.',

    expectedBehavior: {
      expectedDeathRate: 'normal',
      expectedEntryRate: 'low',
      expectedKD: 'high', // Doit capitaliser sur les timings
      expectedFirstKills: 'normal',
      isolatedPlayNormal: true, // C'est son rôle
      expectedMapControl: 'high', // Crée de la pression
      aggressivePositions: false,
      utilityPriority: 'low',
      flashPriority: 'normal',
      smokePriority: 'low',
      expensiveLoadout: false,
      canSaveForAWP: false,
    },

    thresholdModifiers: {
      // Positionnement - ISOLÉ EST NORMAL
      isolated_death_rate: null, // Complètement désactivé
      poor_map_control: null, // Non applicable

      // Timing - critique pour un lurker
      poor_peek_timing: 0.7, // Plus strict
      late_rotations: null, // Il ne tourne pas avec l'équipe

      // Trade - ne peut pas être tradé
      poor_trade_speed: null, // Non applicable
    },
  },

  support: {
    id: 'support',
    name: 'Support',
    description:
      'Flash pour l\'équipe, trade les coéquipiers, utilise les utils. Ne devrait jamais être isolé.',

    expectedBehavior: {
      expectedDeathRate: 'normal',
      expectedEntryRate: 'low',
      expectedKD: 'normal',
      expectedFirstKills: 'low',
      isolatedPlayNormal: false, // JAMAIS isolé
      expectedMapControl: 'normal',
      aggressivePositions: false,
      utilityPriority: 'high', // Son job principal
      flashPriority: 'high',
      smokePriority: 'high',
      expensiveLoadout: false,
      canSaveForAWP: false,
    },

    thresholdModifiers: {
      // Positionnement - NE DOIT PAS être isolé
      isolated_death_rate: 0.6, // Plus strict: 40% -> 24%

      // Utility - c'est son job, plus strict
      low_flash_usage: 0.5, // Plus strict: 5 -> 10 minimum
      ineffective_flashes: 0.7, // Plus strict
      low_smoke_usage: 0.5, // Plus strict
      dying_with_utility: 0.7, // Plus strict

      // Trading - c'est son job
      poor_trade_speed: 0.7, // Plus strict
    },
  },

  igl: {
    id: 'igl',
    name: 'In-Game Leader',
    description:
      'Capitaine, fait les calls. Stats souvent plus basses car focalisé sur la stratégie.',

    expectedBehavior: {
      expectedDeathRate: 'normal',
      expectedEntryRate: 'low',
      expectedKD: 'low', // Normal d'avoir des stats plus basses
      expectedFirstKills: 'low',
      isolatedPlayNormal: false,
      expectedMapControl: 'normal',
      aggressivePositions: false,
      utilityPriority: 'high',
      flashPriority: 'normal',
      smokePriority: 'high',
      expensiveLoadout: false,
      canSaveForAWP: false,
    },

    thresholdModifiers: {
      // Aim - plus tolérant car focalisé sur les calls
      low_hs_percentage: 1.2, // 35% -> 42%
      poor_first_bullet_accuracy: 1.2,
      slow_reaction_time: 1.2,

      // K/D - plus tolérant
      low_opening_duel_rate: 1.3,

      // Clutch - l'IGL doit survivre pour les infos, pas clutcher
      poor_clutch_performance: 1.3,
    },
  },

  rifler: {
    id: 'rifler',
    name: 'Rifler',
    description:
      'Joueur polyvalent au rifle. Standards normaux sur tous les aspects.',

    expectedBehavior: {
      expectedDeathRate: 'normal',
      expectedEntryRate: 'normal',
      expectedKD: 'normal',
      expectedFirstKills: 'normal',
      isolatedPlayNormal: false,
      expectedMapControl: 'normal',
      aggressivePositions: false,
      utilityPriority: 'normal',
      flashPriority: 'normal',
      smokePriority: 'normal',
      expensiveLoadout: false,
      canSaveForAWP: false,
    },

    thresholdModifiers: {
      // Aucun modificateur, standards par défaut
    },
  },
};

/**
 * Détecte automatiquement le rôle probable d'un joueur basé sur ses stats
 */
export interface RoleDetectionInput {
  entryKillRate: number; // % de kills qui sont des entry kills
  avgWeaponValue: number; // Valeur moyenne de l'arme utilisée
  isolatedDeathRate: number; // % de morts isolées
  flashesThrown: number;
  smokesThrown: number;
  avgPositionDistance: number; // Distance moyenne des coéquipiers
  firstKillRate: number; // % de rounds avec first kill
}

export function detectPlayerRole(input: RoleDetectionInput): PlayerRole {
  // AWPer detection
  if (input.avgWeaponValue > 4000) {
    return 'awper';
  }

  // Entry detection
  if (input.entryKillRate > 0.25 && input.firstKillRate > 0.20) {
    return 'entry';
  }

  // Lurker detection
  if (input.isolatedDeathRate > 0.5 && input.avgPositionDistance > 1000) {
    return 'lurker';
  }

  // Support detection
  if (input.flashesThrown > 10 && input.smokesThrown > 8) {
    return 'support';
  }

  // Default to rifler
  return 'rifler';
}

/**
 * Retourne tous les rôles pour l'affichage admin
 */
export function getRolesForAdmin(): RoleProfile[] {
  return Object.values(PLAYER_ROLES);
}