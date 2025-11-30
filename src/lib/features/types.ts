/**
 * Système de Feature Flags CS2 Coach
 *
 * Architecture flexible permettant de:
 * - Activer/désactiver des features globalement (rollout progressif)
 * - Restreindre des features par tier d'abonnement
 * - Permettre aux utilisateurs de personnaliser leurs features actives
 * - Gérer des overrides par utilisateur (beta testers, etc.)
 */

// Import du type depuis la source de vérité (Prisma via constants)
import {
  SubscriptionTier,
  TIER_LEVEL,
  isTierAtLeast,
} from '@/lib/constants/tiers';

// Re-export pour que les fichiers qui importent depuis features/types puissent continuer à fonctionner
export type { SubscriptionTier };
export { TIER_LEVEL as TIER_ORDER, isTierAtLeast };

// ============================================
// TYPES DE BASE
// ============================================

/**
 * Catégories de features
 */
export type FeatureCategory =
  | 'analysis'    // Analyseurs (aim, positioning, etc.)
  | 'coaching'    // Fonctionnalités de coaching
  | 'display'     // Options d'affichage
  | 'export'      // Export de données
  | 'integration' // Intégrations externes (Discord, etc.)
  | 'advanced';   // Fonctionnalités avancées

/**
 * État d'une feature au niveau global (plateforme)
 */
export type FeatureStatus =
  | 'enabled'      // Activée pour tous
  | 'disabled'     // Désactivée pour tous
  | 'beta'         // Uniquement pour les beta testers
  | 'alpha'        // Uniquement pour les alpha testers (dev)
  | 'deprecated'   // En cours de suppression
  | 'coming_soon'; // Annoncée mais pas encore disponible

/**
 * Source d'une décision de feature
 * Permet de savoir pourquoi une feature est active/inactive
 */
export type FeatureDecisionSource =
  | 'global'         // État global de la plateforme
  | 'tier'           // Tier d'abonnement insuffisant
  | 'user_disabled'  // L'utilisateur l'a désactivée
  | 'user_override'  // Override manuel (admin)
  | 'dependency'     // Une dépendance n'est pas satisfaite
  | 'limit_reached'; // Limite d'utilisation atteinte

// ============================================
// DÉFINITION D'UNE FEATURE
// ============================================

/**
 * Configuration complète d'une feature
 */
export interface FeatureDefinition {
  /** Identifiant unique (ex: 'analysis.aim', 'coaching.weekly_plan') */
  id: string;

  /** Nom d'affichage */
  name: string;

  /** Description courte */
  description: string;

  /** Description détaillée pour la page de settings */
  longDescription?: string;

  /** Catégorie */
  category: FeatureCategory;

  /** Icône (nom Lucide) */
  icon?: string;

  // --- État Global ---

  /** État actuel de la feature sur la plateforme */
  status: FeatureStatus;

  /** Tier minimum requis pour accéder à cette feature */
  minTier: SubscriptionTier;

  /** Cette feature peut-elle être désactivée par l'utilisateur ? */
  userToggleable: boolean;

  /** Activée par défaut pour les nouveaux utilisateurs ? */
  enabledByDefault: boolean;

  // --- Dépendances ---

  /** Features requises pour que celle-ci fonctionne */
  requires?: string[];

  /** Features incompatibles avec celle-ci */
  conflicts?: string[];

  // --- Impact sur les calculs ---

  /** Métriques impactées si cette feature est désactivée */
  affectsMetrics?: string[];

  /** Scores recalculés si cette feature change d'état */
  affectsScores?: string[];

  // --- Limites d'utilisation ---

  /** Limites par tier (optionnel) */
  limits?: Partial<Record<SubscriptionTier, FeatureLimit>>;

  // --- Métadonnées ---

  /** Date d'ajout de la feature */
  addedAt?: string;

  /** Version depuis laquelle cette feature existe */
  sinceVersion?: string;

  /** Tags pour filtrage */
  tags?: string[];
}

/**
 * Limite d'utilisation d'une feature
 */
export interface FeatureLimit {
  /** Type de limite */
  type: 'count' | 'period' | 'storage';

  /** Valeur maximale */
  max: number;

  /** Unité (si applicable) */
  unit?: 'per_day' | 'per_week' | 'per_month' | 'total' | 'mb' | 'gb';

  /** Message à afficher quand la limite est atteinte */
  limitMessage?: string;
}

// ============================================
// CONFIGURATION UTILISATEUR
// ============================================

/**
 * Préférences de features d'un utilisateur
 */
export interface UserFeaturePreferences {
  /** Features explicitement désactivées par l'utilisateur */
  disabledFeatures: string[];

  /** Features activées (pour celles désactivées par défaut) */
  enabledFeatures: string[];

  /** Configuration spécifique par feature */
  featureConfigs: Record<string, Record<string, unknown>>;
}

/**
 * Override administrateur pour un utilisateur
 */
export interface UserFeatureOverride {
  /** ID de la feature */
  featureId: string;

  /** Forcer l'activation ou la désactivation */
  enabled: boolean;

  /** Raison de l'override */
  reason?: string;

  /** Date d'expiration de l'override */
  expiresAt?: Date;

  /** Qui a créé cet override */
  createdBy?: string;
}

// ============================================
// RÉSULTAT DE VÉRIFICATION
// ============================================

/**
 * Résultat complet de la vérification d'accès à une feature
 */
export interface FeatureAccess {
  /** La feature est-elle accessible ? */
  hasAccess: boolean;

  /** La feature est-elle actuellement activée ? */
  isEnabled: boolean;

  /** La définition de la feature */
  feature: FeatureDefinition;

  /** Source de la décision */
  source: FeatureDecisionSource;

  /** Message explicatif (si pas d'accès) */
  message?: string;

  /** L'utilisateur peut-il toggler cette feature ? */
  canToggle: boolean;

  /** Tier requis pour débloquer (si bloqué par tier) */
  requiredTier?: SubscriptionTier;

  /** Limite actuelle (si applicable) */
  currentUsage?: number;

  /** Limite maximale (si applicable) */
  maxUsage?: number;
}

// ============================================
// CONFIGURATION DES TIERS
// ============================================

/**
 * Configuration d'un tier d'abonnement
 */
export interface TierDefinition {
  /** Identifiant du tier */
  id: SubscriptionTier;

  /** Nom d'affichage */
  name: string;

  /** Description */
  description: string;

  /** Prix mensuel (en centimes) */
  priceMonthly?: number;

  /** Prix annuel (en centimes) */
  priceYearly?: number;

  /** Ordre d'affichage (plus petit = moins cher) */
  order: number;

  /** Couleur du badge */
  color: string;

  /** Icône */
  icon?: string;

  /** Fonctionnalités mises en avant pour ce tier */
  highlights?: string[];

  /** Limites globales */
  globalLimits?: {
    demosPerMonth?: number;
    storageGb?: number;
    teamMembers?: number;
  };
}

// ============================================
// CONTEXTE FEATURE FLAGS
// ============================================

/**
 * Contexte complet des features pour un utilisateur
 */
export interface FeatureContext {
  /** Tier de l'utilisateur */
  tier: SubscriptionTier;

  /** L'utilisateur est-il beta tester ? */
  isBetaTester: boolean;

  /** L'utilisateur est-il alpha tester ? */
  isAlphaTester: boolean;

  /** Préférences de l'utilisateur */
  preferences: UserFeaturePreferences;

  /** Overrides appliqués */
  overrides: UserFeatureOverride[];

  /** Utilisation actuelle par feature (pour les limites) */
  usage?: Record<string, number>;
}

// ============================================
// HELPERS TYPES
// ============================================

/**
 * Groupement de features par catégorie
 */
export type FeaturesByCategory = Record<FeatureCategory, FeatureDefinition[]>;

/**
 * Map de tous les accès aux features pour un utilisateur
 */
export type FeatureAccessMap = Record<string, FeatureAccess>;

/**
 * Labels des catégories
 */
export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  analysis: 'Analyse',
  coaching: 'Coaching',
  display: 'Affichage',
  export: 'Export',
  integration: 'Intégrations',
  advanced: 'Avancé',
};

/**
 * Labels des statuts
 */
export const STATUS_LABELS: Record<FeatureStatus, string> = {
  enabled: 'Activé',
  disabled: 'Désactivé',
  beta: 'Bêta',
  alpha: 'Alpha',
  deprecated: 'Obsolète',
  coming_soon: 'Bientôt disponible',
};