/**
 * Configuration des limites et fonctionnalités par niveau d'abonnement
 */

import {
  SubscriptionTier,
  TIER_ORDER,
  PURCHASABLE_TIERS,
  isTierHigherThan,
} from '@/lib/constants/tiers';

// Re-export depuis la source centralisée
export type { SubscriptionTier };
export { TIER_ORDER, PURCHASABLE_TIERS, isTierHigherThan };

// Alias pour compatibilité arrière
export function getPurchasableTiers(): SubscriptionTier[] {
  return PURCHASABLE_TIERS;
}

// Fonctionnalités disponibles
export type Feature =
  | 'basic_stats'           // Stats de base (K/D, ADR, etc.)
  | 'full_analysis'         // Analyse complète (aim, positioning, etc.)
  | 'coaching_tips'         // Conseils de coaching basiques
  | 'advanced_coaching'     // Coaching avancé avec exercices
  | 'ai_coaching'           // Coaching IA personnalisé
  | 'export_pdf'            // Export PDF des analyses
  | 'progress_tracking'     // Suivi de progression dans le temps
  | 'pro_comparison'        // Comparaison avec joueurs pro
  | 'priority_processing'   // Traitement prioritaire des demos
  | 'team_dashboard'        // Dashboard équipe
  | 'player_comparison'     // Comparaison entre joueurs
  | 'shared_demos'          // Demos partagées en équipe
  | 'coach_notes'           // Notes du coach sur les joueurs
  | 'api_access'            // Accès API
  | 'custom_branding';      // Branding personnalisé

// Configuration d'un tier
export interface TierConfig {
  name: string;
  description: string;
  price: {
    monthly: number;      // Prix mensuel en euros
    yearly: number;       // Prix annuel en euros (avec réduction)
  };
  limits: {
    demosPerMonth: number;        // -1 = illimité
    historyDays: number;          // -1 = illimité
    storageMaxMb: number;
    maxTeamMembers?: number;      // Pour les plans équipe
  };
  features: Feature[];
  badge?: {
    text: string;
    color: string;
  };
}

// Configuration complète des tiers
export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  FREE: {
    name: 'Free',
    description: 'Découvrez CS2 Coach avec les fonctionnalités de base',
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      demosPerMonth: 3,
      historyDays: 7,
      storageMaxMb: 200,
    },
    features: [
      'basic_stats',
      'coaching_tips',
    ],
  },

  STARTER: {
    name: 'Starter',
    description: 'Pour débuter sérieusement votre progression',
    price: {
      monthly: 5,
      yearly: 50,  // 2 mois offerts
    },
    limits: {
      demosPerMonth: 50,
      historyDays: -1,
      storageMaxMb: 1000,
    },
    features: [
      'basic_stats',
      'full_analysis',
      'coaching_tips',
      'advanced_coaching',
      'progress_tracking',
    ],
    badge: {
      text: 'STARTER',
      color: 'blue',
    },
  },

  PRO: {
    name: 'Pro',
    description: 'Le maximum pour atteindre vos objectifs',
    price: {
      monthly: 10,
      yearly: 100,  // 2 mois offerts
    },
    limits: {
      demosPerMonth: -1,
      historyDays: -1,
      storageMaxMb: 5000,
    },
    features: [
      'basic_stats',
      'full_analysis',
      'coaching_tips',
      'advanced_coaching',
      'ai_coaching',
      'export_pdf',
      'progress_tracking',
      'pro_comparison',
      'priority_processing',
    ],
    badge: {
      text: 'PRO',
      color: 'purple',
    },
  },

  TEAM: {
    name: 'Team',
    description: 'Pour les équipes et clubs esport',
    price: {
      monthly: 30,
      yearly: 300,  // 2 mois offerts
    },
    limits: {
      demosPerMonth: -1,
      historyDays: -1,
      storageMaxMb: 10000,
      maxTeamMembers: 7,
    },
    features: [
      'basic_stats',
      'full_analysis',
      'coaching_tips',
      'advanced_coaching',
      'ai_coaching',
      'export_pdf',
      'progress_tracking',
      'pro_comparison',
      'priority_processing',
      'team_dashboard',
      'player_comparison',
      'shared_demos',
      'coach_notes',
    ],
    badge: {
      text: 'TEAM',
      color: 'green',
    },
  },

  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Solution sur mesure pour les organisations',
    price: {
      monthly: -1,  // Sur devis
      yearly: -1,
    },
    limits: {
      demosPerMonth: -1,
      historyDays: -1,
      storageMaxMb: -1,  // Illimité
      maxTeamMembers: -1,
    },
    features: [
      'basic_stats',
      'full_analysis',
      'coaching_tips',
      'advanced_coaching',
      'ai_coaching',
      'export_pdf',
      'progress_tracking',
      'pro_comparison',
      'priority_processing',
      'team_dashboard',
      'player_comparison',
      'shared_demos',
      'coach_notes',
      'api_access',
      'custom_branding',
    ],
    badge: {
      text: 'ENTERPRISE',
      color: 'gold',
    },
  },
};

/**
 * Obtient la configuration d'un tier
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Vérifie si un tier a accès à une fonctionnalité
 */
export function hasFeature(tier: SubscriptionTier, feature: Feature): boolean {
  return TIER_CONFIGS[tier].features.includes(feature);
}

/**
 * Obtient les limites d'un tier
 */
export function getTierLimits(tier: SubscriptionTier): TierConfig['limits'] {
  return TIER_CONFIGS[tier].limits;
}

/**
 * Vérifie si la limite de demos mensuelles est atteinte
 */
export function isDemoLimitReached(
  tier: SubscriptionTier,
  currentDemosThisMonth: number
): boolean {
  const limit = TIER_CONFIGS[tier].limits.demosPerMonth;
  if (limit === -1) return false; // Illimité
  return currentDemosThisMonth >= limit;
}

/**
 * Vérifie si la limite de stockage est atteinte
 */
export function isStorageLimitReached(
  tier: SubscriptionTier,
  currentStorageMb: number,
  additionalMb: number = 0
): boolean {
  const limit = TIER_CONFIGS[tier].limits.storageMaxMb;
  if (limit === -1) return false; // Illimité
  return currentStorageMb + additionalMb > limit;
}

/**
 * Calcule le nombre de jours d'historique visibles
 */
export function getVisibleHistoryDate(tier: SubscriptionTier): Date | null {
  const days = TIER_CONFIGS[tier].limits.historyDays;
  if (days === -1) return null; // Pas de limite
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Labels lisibles pour les fonctionnalités
 */
export const FEATURE_LABELS: Record<Feature, { name: string; description: string }> = {
  basic_stats: {
    name: 'Statistiques de base',
    description: 'K/D, ADR, KAST, headshot %',
  },
  full_analysis: {
    name: 'Analyse complète',
    description: 'Aim, positionnement, utilité, économie, timing',
  },
  coaching_tips: {
    name: 'Conseils basiques',
    description: 'Identification des points à améliorer',
  },
  advanced_coaching: {
    name: 'Coaching avancé',
    description: 'Exercices personnalisés et plan d\'entraînement',
  },
  ai_coaching: {
    name: 'Coaching IA',
    description: 'Analyse approfondie par intelligence artificielle',
  },
  export_pdf: {
    name: 'Export PDF',
    description: 'Téléchargez vos analyses en PDF',
  },
  progress_tracking: {
    name: 'Suivi de progression',
    description: 'Historique complet et graphiques d\'évolution',
  },
  pro_comparison: {
    name: 'Comparaison pro',
    description: 'Comparez vos stats avec les joueurs professionnels',
  },
  priority_processing: {
    name: 'Traitement prioritaire',
    description: 'Vos demos sont analysées en priorité',
  },
  team_dashboard: {
    name: 'Dashboard équipe',
    description: 'Vue d\'ensemble de toute l\'équipe',
  },
  player_comparison: {
    name: 'Comparaison joueurs',
    description: 'Comparez les performances entre coéquipiers',
  },
  shared_demos: {
    name: 'Demos partagées',
    description: 'Partagez et analysez les demos d\'équipe',
  },
  coach_notes: {
    name: 'Notes du coach',
    description: 'Ajoutez des notes sur chaque joueur',
  },
  api_access: {
    name: 'Accès API',
    description: 'Intégrez CS2 Coach dans vos outils',
  },
  custom_branding: {
    name: 'Branding personnalisé',
    description: 'Personnalisez l\'interface aux couleurs de votre org',
  },
};
