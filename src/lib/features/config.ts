/**
 * Configuration des Features et Tiers CS2 Coach
 *
 * Ce fichier centralise toutes les définitions de features
 * et la configuration des tiers d'abonnement.
 */

import {
  FeatureDefinition,
  TierDefinition,
  SubscriptionTier,
  FeatureCategory,
} from './types';

// ============================================
// CONFIGURATION DES TIERS D'ABONNEMENT
// ============================================

export const TIER_DEFINITIONS: Record<SubscriptionTier, TierDefinition> = {
  FREE: {
    id: 'FREE',
    name: 'Gratuit',
    description: 'Découvrez CS2 Coach avec les fonctionnalités essentielles',
    priceMonthly: 0,
    priceYearly: 0,
    order: 0,
    color: 'gray',
    icon: 'User',
    highlights: [
      'Analyse de base (3 démos/mois)',
      'Statistiques essentielles',
      'Coaching basique',
    ],
    globalLimits: {
      demosPerMonth: 3,
      storageGb: 1,
    },
  },

  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    description: 'Pour les joueurs qui veulent progresser sérieusement',
    priceMonthly: 499, // 4.99€
    priceYearly: 4990, // 49.90€ (2 mois offerts)
    order: 1,
    color: 'blue',
    icon: 'Zap',
    highlights: [
      'Analyse illimitée',
      'Toutes les métriques',
      'Coaching personnalisé',
      'Historique complet',
    ],
    globalLimits: {
      demosPerMonth: 50,
      storageGb: 10,
    },
  },

  PRO: {
    id: 'PRO',
    name: 'Pro',
    description: 'Outils avancés pour les joueurs compétitifs',
    priceMonthly: 999, // 9.99€
    priceYearly: 9990, // 99.90€
    order: 2,
    color: 'purple',
    icon: 'Crown',
    highlights: [
      'Tout Starter +',
      'Heatmaps avancées',
      'Comparaison avec les pros',
      'Export des données',
      'API accès',
    ],
    globalLimits: {
      demosPerMonth: -1, // illimité
      storageGb: 50,
    },
  },

  TEAM: {
    id: 'TEAM',
    name: 'Team',
    description: 'Pour les équipes et clubs esport',
    priceMonthly: 2999, // 29.99€
    priceYearly: 29990, // 299.90€
    order: 3,
    color: 'orange',
    icon: 'Users',
    highlights: [
      'Tout Pro +',
      'Jusqu\'à 10 membres',
      'Analyse d\'équipe',
      'Dashboard coach',
      'Stats comparatives équipe',
    ],
    globalLimits: {
      demosPerMonth: -1,
      storageGb: 200,
      teamMembers: 10,
    },
  },

  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Solutions personnalisées pour organisations',
    order: 4,
    color: 'gold',
    icon: 'Building',
    highlights: [
      'Tout Team +',
      'Membres illimités',
      'Support dédié',
      'SLA garanti',
      'Intégrations personnalisées',
    ],
    globalLimits: {
      demosPerMonth: -1,
      storageGb: -1, // illimité
      teamMembers: -1,
    },
  },
};

// ============================================
// DÉFINITIONS DES FEATURES
// ============================================

export const FEATURE_DEFINITIONS: Record<string, FeatureDefinition> = {
  // =====================
  // ANALYSEURS
  // =====================

  'analysis.aim': {
    id: 'analysis.aim',
    name: 'Analyse Aim',
    description: 'Analyse de la visée (HS%, spray, réflexes)',
    longDescription:
      'Évalue votre précision mécanique : headshot percentage, first bullet accuracy, contrôle du spray et temps de réaction.',
    category: 'analysis',
    icon: 'Crosshair',
    status: 'enabled',
    minTier: 'FREE',
    userToggleable: true,
    enabledByDefault: true,
    affectsMetrics: ['headshotPercentage', 'firstBulletAccuracy', 'sprayControl', 'reactionTime'],
    affectsScores: ['aimScore', 'overallScore'],
    tags: ['core', 'mechanics'],
  },

  'analysis.positioning': {
    id: 'analysis.positioning',
    name: 'Analyse Positionnement',
    description: 'Analyse du positionnement et des rotations',
    longDescription:
      'Évalue votre game sense : contrôle de la map, vitesse de rotation, positions de mort, taux de morts isolées.',
    category: 'analysis',
    icon: 'MapPin',
    status: 'enabled',
    minTier: 'FREE',
    userToggleable: true,
    enabledByDefault: true,
    affectsMetrics: ['mapControl', 'rotationSpeed', 'isolationDeathRate', 'tradeablePositions'],
    affectsScores: ['positioningScore', 'overallScore'],
    tags: ['core', 'gamesense'],
  },

  'analysis.utility': {
    id: 'analysis.utility',
    name: 'Analyse Utilitaires',
    description: 'Analyse des grenades et utilitaires',
    longDescription:
      'Évalue votre utilisation des grenades : efficacité des flashs, placement des smokes, dégâts des molotovs/HE.',
    category: 'analysis',
    icon: 'Bomb',
    status: 'enabled',
    minTier: 'FREE',
    userToggleable: true,
    enabledByDefault: true,
    affectsMetrics: ['flashEfficiency', 'smokeUsage', 'utilityDamage', 'utilityOnDeath'],
    affectsScores: ['utilityScore', 'overallScore'],
    tags: ['core', 'utility'],
  },

  'analysis.economy': {
    id: 'analysis.economy',
    name: 'Analyse Économie',
    description: 'Analyse des décisions économiques',
    longDescription:
      'Évalue votre gestion économique : décisions d\'achat, respect des saves, impact en eco-round.',
    category: 'analysis',
    icon: 'DollarSign',
    status: 'enabled',
    minTier: 'FREE',
    userToggleable: true,
    enabledByDefault: true,
    affectsMetrics: ['buyDecisionScore', 'saveCompliance', 'ecoRoundImpact'],
    affectsScores: ['economyScore', 'overallScore'],
    tags: ['core', 'economy'],
  },

  'analysis.timing': {
    id: 'analysis.timing',
    name: 'Analyse Timing',
    description: 'Analyse des timings (peeks, trades, rotations)',
    longDescription:
      'Évalue vos timings : timing des peeks, vitesse de trade, timing des rotations, taux de prefire.',
    category: 'analysis',
    icon: 'Clock',
    status: 'enabled',
    minTier: 'STARTER',
    userToggleable: true,
    enabledByDefault: true,
    affectsMetrics: ['peekTiming', 'tradeSpeed', 'tradeSuccessRate', 'rotationTiming'],
    affectsScores: ['timingScore', 'overallScore'],
    tags: ['core', 'advanced'],
  },

  'analysis.decision': {
    id: 'analysis.decision',
    name: 'Analyse Décisions',
    description: 'Analyse des décisions de jeu',
    longDescription:
      'Évalue vos décisions : performance en clutch, succès des entries, niveau d\'agressivité, prise de risque.',
    category: 'analysis',
    icon: 'Brain',
    status: 'enabled',
    minTier: 'STARTER',
    userToggleable: true,
    enabledByDefault: true,
    affectsMetrics: ['clutchWinRate', 'entrySuccess', 'aggressionLevel', 'riskAssessment'],
    affectsScores: ['decisionScore', 'overallScore'],
    tags: ['core', 'advanced'],
  },

  // =====================
  // COACHING
  // =====================

  'coaching.recommendations': {
    id: 'coaching.recommendations',
    name: 'Recommandations',
    description: 'Recommandations personnalisées basées sur vos analyses',
    category: 'coaching',
    icon: 'Lightbulb',
    status: 'enabled',
    minTier: 'FREE',
    userToggleable: false,
    enabledByDefault: true,
    requires: ['analysis.aim', 'analysis.positioning'],
    tags: ['core'],
  },

  'coaching.exercises': {
    id: 'coaching.exercises',
    name: 'Exercices Concrets',
    description: 'Suggestions d\'exercices et workshops',
    longDescription:
      'Génère des exercices spécifiques basés sur vos faiblesses : aim trainers, maps workshop, routines d\'entraînement.',
    category: 'coaching',
    icon: 'Dumbbell',
    status: 'enabled',
    minTier: 'STARTER',
    userToggleable: true,
    enabledByDefault: true,
    requires: ['coaching.recommendations'],
    tags: ['training'],
  },

  'coaching.weekly_plan': {
    id: 'coaching.weekly_plan',
    name: 'Plan Hebdomadaire',
    description: 'Plan d\'entraînement personnalisé sur 7 jours',
    longDescription:
      'Génère un plan d\'entraînement hebdomadaire adapté à vos objectifs et votre temps disponible.',
    category: 'coaching',
    icon: 'Calendar',
    status: 'enabled',
    minTier: 'PRO',
    userToggleable: true,
    enabledByDefault: true,
    requires: ['coaching.exercises'],
    tags: ['premium', 'planning'],
  },

  'coaching.progress_tracking': {
    id: 'coaching.progress_tracking',
    name: 'Suivi de Progression',
    description: 'Tracking des objectifs et de la progression',
    category: 'coaching',
    icon: 'TrendingUp',
    status: 'enabled',
    minTier: 'STARTER',
    userToggleable: true,
    enabledByDefault: true,
    tags: ['tracking'],
  },

  'coaching.rank_comparison': {
    id: 'coaching.rank_comparison',
    name: 'Comparaison par Rank',
    description: 'Compare vos stats aux benchmarks de votre rank',
    category: 'coaching',
    icon: 'BarChart2',
    status: 'enabled',
    minTier: 'FREE',
    userToggleable: true,
    enabledByDefault: true,
    tags: ['comparison'],
  },

  'coaching.pro_comparison': {
    id: 'coaching.pro_comparison',
    name: 'Comparaison avec les Pros',
    description: 'Compare vos stats avec des joueurs professionnels',
    category: 'coaching',
    icon: 'Award',
    status: 'enabled',
    minTier: 'PRO',
    userToggleable: true,
    enabledByDefault: false,
    tags: ['premium', 'comparison'],
  },

  // =====================
  // AFFICHAGE
  // =====================

  'display.heatmaps': {
    id: 'display.heatmaps',
    name: 'Heatmaps',
    description: 'Visualisation des positions kills/morts sur la map',
    category: 'display',
    icon: 'Map',
    status: 'enabled',
    minTier: 'STARTER',
    userToggleable: true,
    enabledByDefault: true,
    requires: ['analysis.positioning'],
    tags: ['visualization'],
  },

  'display.heatmaps_aggregated': {
    id: 'display.heatmaps_aggregated',
    name: 'Heatmaps Agrégées',
    description: 'Heatmaps combinées sur plusieurs parties',
    category: 'display',
    icon: 'Layers',
    status: 'enabled',
    minTier: 'PRO',
    userToggleable: true,
    enabledByDefault: true,
    requires: ['display.heatmaps'],
    tags: ['premium', 'visualization'],
  },

  'display.round_timeline': {
    id: 'display.round_timeline',
    name: 'Timeline des Rounds',
    description: 'Visualisation détaillée des événements par round',
    category: 'display',
    icon: 'Clock',
    status: 'enabled',
    minTier: 'FREE',
    userToggleable: true,
    enabledByDefault: true,
    tags: ['core', 'visualization'],
  },

  'display.progress_chart': {
    id: 'display.progress_chart',
    name: 'Graphiques de Progression',
    description: 'Évolution des stats dans le temps',
    category: 'display',
    icon: 'LineChart',
    status: 'enabled',
    minTier: 'FREE',
    userToggleable: true,
    enabledByDefault: true,
    tags: ['core', 'visualization'],
  },

  'display.radar_chart': {
    id: 'display.radar_chart',
    name: 'Graphiques Radar',
    description: 'Visualisation radar des 6 catégories',
    category: 'display',
    icon: 'Radar',
    status: 'enabled',
    minTier: 'STARTER',
    userToggleable: true,
    enabledByDefault: true,
    tags: ['visualization'],
  },

  // =====================
  // EXPORT
  // =====================

  'export.pdf_report': {
    id: 'export.pdf_report',
    name: 'Export PDF',
    description: 'Génération de rapports PDF',
    category: 'export',
    icon: 'FileText',
    status: 'enabled',
    minTier: 'PRO',
    userToggleable: true,
    enabledByDefault: true,
    limits: {
      FREE: { type: 'count', max: 0, unit: 'per_month' },
      STARTER: { type: 'count', max: 3, unit: 'per_month' },
      PRO: { type: 'count', max: -1, unit: 'per_month' }, // illimité
    },
    tags: ['premium', 'export'],
  },

  'export.csv_data': {
    id: 'export.csv_data',
    name: 'Export CSV',
    description: 'Export des données brutes en CSV',
    category: 'export',
    icon: 'Table',
    status: 'enabled',
    minTier: 'PRO',
    userToggleable: true,
    enabledByDefault: true,
    tags: ['premium', 'export'],
  },

  'export.api_access': {
    id: 'export.api_access',
    name: 'Accès API',
    description: 'Accès à l\'API pour intégrations personnalisées',
    category: 'export',
    icon: 'Code',
    status: 'enabled',
    minTier: 'PRO',
    userToggleable: false,
    enabledByDefault: true,
    tags: ['premium', 'developer'],
  },

  // =====================
  // INTÉGRATIONS
  // =====================

  'integration.discord': {
    id: 'integration.discord',
    name: 'Intégration Discord',
    description: 'Notifications et bot Discord',
    category: 'integration',
    icon: 'MessageCircle',
    status: 'coming_soon',
    minTier: 'STARTER',
    userToggleable: true,
    enabledByDefault: false,
    tags: ['integration', 'coming_soon'],
  },

  'integration.steam_auto_import': {
    id: 'integration.steam_auto_import',
    name: 'Import Auto Steam',
    description: 'Import automatique des démos depuis Steam',
    category: 'integration',
    icon: 'RefreshCw',
    status: 'beta',
    minTier: 'PRO',
    userToggleable: true,
    enabledByDefault: false,
    tags: ['premium', 'automation'],
  },

  // =====================
  // AVANCÉ
  // =====================

  'advanced.team_analytics': {
    id: 'advanced.team_analytics',
    name: 'Analyse d\'Équipe',
    description: 'Statistiques et analyse au niveau équipe',
    category: 'advanced',
    icon: 'Users',
    status: 'enabled',
    minTier: 'TEAM',
    userToggleable: false,
    enabledByDefault: true,
    tags: ['team', 'premium'],
  },

  'advanced.coach_dashboard': {
    id: 'advanced.coach_dashboard',
    name: 'Dashboard Coach',
    description: 'Vue coach avec stats de tous les joueurs',
    category: 'advanced',
    icon: 'LayoutDashboard',
    status: 'enabled',
    minTier: 'TEAM',
    userToggleable: false,
    enabledByDefault: true,
    requires: ['advanced.team_analytics'],
    tags: ['team', 'premium'],
  },

  'advanced.custom_metrics': {
    id: 'advanced.custom_metrics',
    name: 'Métriques Personnalisées',
    description: 'Création de métriques personnalisées',
    category: 'advanced',
    icon: 'Sliders',
    status: 'coming_soon',
    minTier: 'ENTERPRISE',
    userToggleable: false,
    enabledByDefault: false,
    tags: ['enterprise', 'coming_soon'],
  },
};

// ============================================
// HELPERS
// ============================================

/**
 * Récupère une feature par son ID
 */
export function getFeature(featureId: string): FeatureDefinition | undefined {
  return FEATURE_DEFINITIONS[featureId];
}

/**
 * Récupère toutes les features d'une catégorie
 */
export function getFeaturesByCategory(category: FeatureCategory): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter((f) => f.category === category);
}

/**
 * Récupère toutes les features avec un tag donné
 */
export function getFeaturesByTag(tag: string): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter((f) => f.tags?.includes(tag));
}

/**
 * Récupère toutes les features disponibles pour un tier
 */
export function getFeaturesForTier(tier: SubscriptionTier): FeatureDefinition[] {
  const tierOrder = TIER_DEFINITIONS[tier].order;
  return Object.values(FEATURE_DEFINITIONS).filter(
    (f) => TIER_DEFINITIONS[f.minTier].order <= tierOrder
  );
}

/**
 * Récupère les features "core" (analyseurs principaux)
 */
export function getCoreAnalysisFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter(
    (f) => f.category === 'analysis' && f.tags?.includes('core')
  );
}

/**
 * Vérifie si une feature est une dépendance d'autres features
 */
export function getFeatureDependents(featureId: string): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter((f) => f.requires?.includes(featureId));
}

/**
 * Liste des IDs de features d'analyse (pour recalcul des scores)
 */
export const ANALYSIS_FEATURE_IDS = Object.values(FEATURE_DEFINITIONS)
  .filter((f) => f.category === 'analysis')
  .map((f) => f.id);

/**
 * Poids des catégories d'analyse pour le calcul du score global
 */
export const ANALYSIS_WEIGHTS: Record<string, number> = {
  'analysis.aim': 0.25,
  'analysis.positioning': 0.20,
  'analysis.utility': 0.15,
  'analysis.economy': 0.10,
  'analysis.timing': 0.15,
  'analysis.decision': 0.15,
};