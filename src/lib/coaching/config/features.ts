/**
 * Configuration des features activables/désactivables
 *
 * Permet à un administrateur de:
 * - Désactiver des catégories entières d'analyse
 * - Désactiver des règles spécifiques
 * - Désactiver des ajustements contextuels
 * - Configurer le niveau de détail des feedbacks
 */

export interface FeatureConfig {
  enabled: boolean;
  description: string;
  /** Si désactivé, afficher ce message à l'utilisateur */
  disabledMessage?: string;
}

export interface RuleFeatureConfig extends FeatureConfig {
  /** Priorité minimum pour que la règle soit évaluée (1-4) */
  minPriority?: number;
}

export interface CategoryFeatures {
  enabled: boolean;
  rules: { [ruleId: string]: RuleFeatureConfig };
}

export interface CoachingFeatures {
  /** Features globales */
  global: {
    /** Activer le système de coaching */
    coachingEnabled: FeatureConfig;
    /** Activer l'ajustement par rôle */
    roleAdjustmentEnabled: FeatureConfig;
    /** Activer l'ajustement par map */
    mapAdjustmentEnabled: FeatureConfig;
    /** Activer l'ajustement par rank */
    rankAdjustmentEnabled: FeatureConfig;
    /** Activer la détection automatique du rôle */
    autoRoleDetectionEnabled: FeatureConfig;
    /** Générer un plan d'entraînement hebdomadaire */
    weeklyPlanEnabled: FeatureConfig;
    /** Suggérer des exercices */
    exerciseSuggestionsEnabled: FeatureConfig;
  };

  /** Features par catégorie d'analyse */
  categories: {
    aim: CategoryFeatures;
    positioning: CategoryFeatures;
    utility: CategoryFeatures;
    economy: CategoryFeatures;
    timing: CategoryFeatures;
    decision: CategoryFeatures;
  };

  /** Configuration de l'affichage */
  display: {
    /** Nombre maximum de problèmes prioritaires à afficher */
    maxPriorityIssues: number;
    /** Nombre maximum de recommandations */
    maxRecommendations: number;
    /** Afficher les seuils dans les feedbacks (mode debug) */
    showThresholds: boolean;
    /** Afficher les modificateurs appliqués */
    showModifiers: boolean;
    /** Langue des feedbacks */
    language: 'fr' | 'en';
  };
}

/**
 * Configuration par défaut - toutes les features activées
 */
export const DEFAULT_FEATURES: CoachingFeatures = {
  global: {
    coachingEnabled: {
      enabled: true,
      description: 'Active le système de coaching et génération de feedbacks',
    },
    roleAdjustmentEnabled: {
      enabled: true,
      description: 'Ajuste les seuils en fonction du rôle du joueur (Entry, AWPer, etc.)',
    },
    mapAdjustmentEnabled: {
      enabled: true,
      description: 'Ajuste les seuils en fonction de la map jouée',
    },
    rankAdjustmentEnabled: {
      enabled: true,
      description: 'Ajuste les seuils en fonction du rank du joueur',
    },
    autoRoleDetectionEnabled: {
      enabled: false,
      description: 'Détecte automatiquement le rôle du joueur basé sur ses stats (désactivé par défaut, le rôle doit être défini dans le profil)',
    },
    weeklyPlanEnabled: {
      enabled: true,
      description: 'Génère un plan d\'entraînement hebdomadaire personnalisé',
    },
    exerciseSuggestionsEnabled: {
      enabled: true,
      description: 'Suggère des exercices pour améliorer les points faibles',
    },
  },

  categories: {
    aim: {
      enabled: true,
      rules: {
        low_hs_percentage: {
          enabled: true,
          description: 'Détecte un pourcentage de headshot trop bas',
        },
        poor_first_bullet_accuracy: {
          enabled: true,
          description: 'Détecte une mauvaise précision du premier tir',
        },
        slow_reaction_time: {
          enabled: true,
          description: 'Détecte un temps de réaction trop lent',
        },
        poor_spray_control: {
          enabled: true,
          description: 'Détecte un mauvais contrôle du spray',
        },
        inconsistent_crosshair_placement: {
          enabled: true,
          description: 'Détecte un placement de crosshair inconsistant',
        },
      },
    },

    positioning: {
      enabled: true,
      rules: {
        repeated_death_positions: {
          enabled: true,
          description: 'Détecte les morts répétées au même endroit',
        },
        through_smoke_death_rate: {
          enabled: true,
          description: 'Détecte trop de morts à travers les smokes',
        },
        wallbang_death_rate: {
          enabled: true,
          description: 'Détecte des positions prévisibles (wallbangs)',
        },
        poor_map_control: {
          enabled: true,
          description: 'Détecte un mauvais contrôle de map',
        },
        isolated_death_rate: {
          enabled: true,
          description: 'Détecte trop de morts isolées',
        },
        dying_too_fast: {
          enabled: true,
          description: 'Détecte une survie trop courte par round',
        },
      },
    },

    utility: {
      enabled: true,
      rules: {
        low_flash_usage: {
          enabled: true,
          description: 'Détecte une sous-utilisation des flashs',
        },
        ineffective_flashes: {
          enabled: true,
          description: 'Détecte des flashs inefficaces',
        },
        low_smoke_usage: {
          enabled: true,
          description: 'Détecte une sous-utilisation des smokes',
        },
        low_molotov_damage: {
          enabled: true,
          description: 'Détecte des molotovs peu efficaces',
        },
        self_flash_rate: {
          enabled: true,
          description: 'Détecte trop de self-flashs',
        },
        team_flash_rate: {
          enabled: true,
          description: 'Détecte trop de flashs sur coéquipiers',
        },
        dying_with_utility: {
          enabled: true,
          description: 'Détecte les morts avec grenades non utilisées',
        },
      },
    },

    economy: {
      enabled: true,
      rules: {
        poor_buy_decisions: {
          enabled: true,
          description: 'Détecte de mauvaises décisions d\'achat',
        },
        force_buy_addiction: {
          enabled: true,
          description: 'Détecte trop de force buys',
        },
        anti_eco_deaths: {
          enabled: true,
          description: 'Détecte les morts face à des ecos',
        },
      },
    },

    timing: {
      enabled: true,
      rules: {
        poor_trade_speed: {
          enabled: true,
          description: 'Détecte des trades trop lents',
        },
        poor_peek_timing: {
          enabled: true,
          description: 'Détecte un mauvais timing de peek',
        },
        late_rotations: {
          enabled: true,
          description: 'Détecte des rotations trop lentes',
        },
      },
    },

    decision: {
      enabled: true,
      rules: {
        poor_clutch_performance: {
          enabled: true,
          description: 'Détecte de mauvaises performances en clutch',
        },
        reckless_play_style: {
          enabled: true,
          description: 'Détecte un style de jeu trop risqué',
        },
        low_opening_duel_rate: {
          enabled: true,
          description: 'Détecte un mauvais taux de victoire en duel d\'ouverture',
        },
      },
    },
  },

  display: {
    maxPriorityIssues: 5,
    maxRecommendations: 10,
    showThresholds: false,
    showModifiers: false,
    language: 'fr',
  },
};

/**
 * Instance mutable de la configuration (peut être modifiée au runtime)
 */
let currentFeatures: CoachingFeatures = { ...DEFAULT_FEATURES };
let isInitialized = false;

/**
 * Initialise les features depuis une source externe (DB)
 * Cette fonction doit être appelée au démarrage de l'application
 */
export function initializeFeatures(features: CoachingFeatures): void {
  currentFeatures = deepMerge(DEFAULT_FEATURES, features);
  isInitialized = true;
}

/**
 * Définit directement les features (utilisé par l'API après sauvegarde DB)
 */
export function setFeatures(features: CoachingFeatures): void {
  currentFeatures = features;
  isInitialized = true;
}

/**
 * Met à jour la configuration des features
 */
export function updateFeatures(updates: Partial<CoachingFeatures>): void {
  currentFeatures = deepMerge(currentFeatures, updates);
}

/**
 * Retourne la configuration actuelle
 */
export function getFeatures(): CoachingFeatures {
  return currentFeatures;
}

/**
 * Vérifie si les features ont été initialisées depuis la DB
 */
export function areFeaturesInitialized(): boolean {
  return isInitialized;
}

/**
 * Réinitialise la configuration par défaut
 */
export function resetFeatures(): void {
  currentFeatures = { ...DEFAULT_FEATURES };
}

/**
 * Vérifie si une feature globale est activée
 */
export function isGlobalFeatureEnabled(
  feature: keyof CoachingFeatures['global']
): boolean {
  return currentFeatures.global[feature].enabled;
}

/**
 * Vérifie si une catégorie est activée
 */
export function isCategoryEnabled(
  category: keyof CoachingFeatures['categories']
): boolean {
  return currentFeatures.categories[category].enabled;
}

/**
 * Vérifie si une règle spécifique est activée
 */
export function isRuleEnabled(
  category: keyof CoachingFeatures['categories'],
  ruleId: string
): boolean {
  const categoryConfig = currentFeatures.categories[category];

  if (!categoryConfig.enabled) {
    return false;
  }

  const ruleConfig = categoryConfig.rules[ruleId];

  if (!ruleConfig) {
    // Règle non configurée = activée par défaut
    return true;
  }

  return ruleConfig.enabled;
}

/**
 * Désactive une règle spécifique
 */
export function disableRule(
  category: keyof CoachingFeatures['categories'],
  ruleId: string,
  message?: string
): void {
  if (!currentFeatures.categories[category].rules[ruleId]) {
    currentFeatures.categories[category].rules[ruleId] = {
      enabled: false,
      description: '',
      disabledMessage: message,
    };
  } else {
    currentFeatures.categories[category].rules[ruleId].enabled = false;
    if (message) {
      currentFeatures.categories[category].rules[ruleId].disabledMessage = message;
    }
  }
}

/**
 * Active une règle spécifique
 */
export function enableRule(
  category: keyof CoachingFeatures['categories'],
  ruleId: string
): void {
  if (currentFeatures.categories[category].rules[ruleId]) {
    currentFeatures.categories[category].rules[ruleId].enabled = true;
  }
}

/**
 * Désactive une catégorie entière
 */
export function disableCategory(
  category: keyof CoachingFeatures['categories']
): void {
  currentFeatures.categories[category].enabled = false;
}

/**
 * Active une catégorie entière
 */
export function enableCategory(
  category: keyof CoachingFeatures['categories']
): void {
  currentFeatures.categories[category].enabled = true;
}

/**
 * Retourne un résumé des features pour l'admin
 */
export function getFeaturesForAdmin(): {
  global: { feature: string; enabled: boolean; description: string }[];
  categories: {
    category: string;
    enabled: boolean;
    rules: { ruleId: string; enabled: boolean; description: string }[];
  }[];
  display: CoachingFeatures['display'];
} {
  return {
    global: Object.entries(currentFeatures.global).map(([feature, config]) => ({
      feature,
      enabled: config.enabled,
      description: config.description,
    })),
    categories: Object.entries(currentFeatures.categories).map(
      ([category, config]) => ({
        category,
        enabled: config.enabled,
        rules: Object.entries(config.rules).map(([ruleId, ruleConfig]) => ({
          ruleId,
          enabled: ruleConfig.enabled,
          description: ruleConfig.description,
        })),
      })
    ),
    display: currentFeatures.display,
  };
}

/**
 * Helper pour deep merge
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(
          target[key] as object,
          source[key] as object
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}