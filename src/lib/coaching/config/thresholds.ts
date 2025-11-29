/**
 * Configuration centralisée des seuils de coaching
 *
 * Ce fichier permet à un administrateur de modifier facilement les seuils
 * sans toucher au code des analyseurs.
 *
 * Chaque seuil définit:
 * - value: la valeur seuil
 * - priority: 1 (critique) à 4 (basse)
 * - comparison: 'lt' (moins que), 'gt' (plus que), 'eq' (égal)
 */

export interface ThresholdConfig {
  value: number;
  priority: 1 | 2 | 3 | 4;
  comparison: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
  description: string;
}

export interface CategoryThresholds {
  [ruleId: string]: ThresholdConfig;
}

export interface CoachingThresholds {
  aim: CategoryThresholds;
  positioning: CategoryThresholds;
  utility: CategoryThresholds;
  economy: CategoryThresholds;
  timing: CategoryThresholds;
  decision: CategoryThresholds;
}

/**
 * Seuils par défaut pour le coaching
 * Ces valeurs sont ajustées en fonction du rôle et de la map
 */
export const DEFAULT_THRESHOLDS: CoachingThresholds = {
  aim: {
    low_hs_percentage: {
      value: 35,
      priority: 1,
      comparison: 'lt',
      description: 'Pourcentage de headshots trop bas',
    },
    poor_first_bullet_accuracy: {
      value: 0.35,
      priority: 2,
      comparison: 'lt',
      description: 'Précision du premier tir insuffisante',
    },
    slow_reaction_time: {
      value: 300,
      priority: 3,
      comparison: 'gt',
      description: 'Temps de réaction trop lent (ms)',
    },
    poor_spray_control: {
      value: 50,
      priority: 4,
      comparison: 'lt',
      description: 'Contrôle du spray insuffisant',
    },
    inconsistent_crosshair_placement: {
      value: 0.5,
      priority: 2,
      comparison: 'lt',
      description: 'Placement de crosshair inconsistant',
    },
  },

  positioning: {
    repeated_death_positions: {
      value: 3,
      priority: 1,
      comparison: 'gte',
      description: 'Nombre de morts au même endroit',
    },
    through_smoke_death_rate: {
      value: 0.20,
      priority: 2,
      comparison: 'gt',
      description: 'Taux de morts à travers les smokes',
    },
    wallbang_death_rate: {
      value: 0.15,
      priority: 2,
      comparison: 'gt',
      description: 'Taux de morts par wallbang (positions prévisibles)',
    },
    poor_map_control: {
      value: 50,
      priority: 2,
      comparison: 'lt',
      description: 'Score de contrôle de map insuffisant',
    },
    isolated_death_rate: {
      value: 0.40,
      priority: 2,
      comparison: 'gt',
      description: 'Taux de morts isolé (sans coéquipier proche)',
    },
    dying_too_fast: {
      value: 30,
      priority: 2,
      comparison: 'lt',
      description: 'Temps de survie moyen par round (secondes)',
    },
  },

  utility: {
    low_flash_usage: {
      value: 5,
      priority: 2,
      comparison: 'lt',
      description: 'Nombre minimum de flashs par match',
    },
    ineffective_flashes: {
      value: 0.40,
      priority: 3,
      comparison: 'lt',
      description: 'Efficacité minimum des flashs',
    },
    low_smoke_usage: {
      value: 3,
      priority: 2,
      comparison: 'lt',
      description: 'Nombre minimum de smokes par match',
    },
    low_molotov_damage: {
      value: 20,
      priority: 4,
      comparison: 'lt',
      description: 'Dégâts moyens par molotov',
    },
    self_flash_rate: {
      value: 0.15,
      priority: 3,
      comparison: 'gt',
      description: 'Taux de self-flash',
    },
    team_flash_rate: {
      value: 0.10,
      priority: 2,
      comparison: 'gt',
      description: 'Taux de flash sur coéquipiers',
    },
    dying_with_utility: {
      value: 0.30,
      priority: 1,
      comparison: 'gt',
      description: 'Taux de morts avec grenades non utilisées',
    },
  },

  economy: {
    poor_buy_decisions: {
      value: 70,
      priority: 2,
      comparison: 'lt',
      description: 'Score de décisions d\'achat',
    },
    force_buy_addiction: {
      value: 2,
      priority: 3,
      comparison: 'gt',
      description: 'Nombre de force buys inappropriés',
    },
    anti_eco_deaths: {
      value: 2,
      priority: 1,
      comparison: 'gt',
      description: 'Nombre de morts face à des ecos',
    },
  },

  timing: {
    poor_trade_speed: {
      value: 0.50,
      priority: 2,
      comparison: 'lt',
      description: 'Taux de succès des trades',
    },
    poor_peek_timing: {
      value: 60,
      priority: 3,
      comparison: 'lt',
      description: 'Score de timing de peek',
    },
    late_rotations: {
      value: 5,
      priority: 3,
      comparison: 'gt',
      description: 'Temps de rotation après info (secondes)',
    },
  },

  decision: {
    poor_clutch_performance: {
      value: 50,
      priority: 2,
      comparison: 'lt',
      description: 'Score de performance en clutch',
    },
    reckless_play_style: {
      value: 3,
      priority: 3,
      comparison: 'gt',
      description: 'Nombre d\'actions téméraires',
    },
    low_opening_duel_rate: {
      value: 0.40,
      priority: 2,
      comparison: 'lt',
      description: 'Taux de victoire en duel d\'ouverture',
    },
  },
};

/**
 * Vérifie si une valeur dépasse un seuil
 */
export function checkThreshold(
  value: number,
  threshold: ThresholdConfig
): boolean {
  switch (threshold.comparison) {
    case 'lt':
      return value < threshold.value;
    case 'lte':
      return value <= threshold.value;
    case 'gt':
      return value > threshold.value;
    case 'gte':
      return value >= threshold.value;
    case 'eq':
      return value === threshold.value;
    default:
      return false;
  }
}

/**
 * Retourne tous les seuils avec leurs descriptions pour l'affichage admin
 */
export function getThresholdsForAdmin(): {
  category: string;
  rules: { id: string; config: ThresholdConfig }[];
}[] {
  return Object.entries(DEFAULT_THRESHOLDS).map(([category, rules]) => ({
    category,
    rules: Object.entries(rules as CategoryThresholds).map(([id, config]) => ({
      id,
      config: config as ThresholdConfig,
    })),
  }));
}