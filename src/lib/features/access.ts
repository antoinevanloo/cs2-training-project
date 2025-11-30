/**
 * Service de vérification d'accès aux features
 *
 * Ce module contient la logique centrale pour déterminer
 * si un utilisateur a accès à une feature.
 */

import {
  FeatureAccess,
  FeatureContext,
  FeatureDefinition,
  FeatureDecisionSource,
  SubscriptionTier,
  isTierAtLeast,
} from './types';
import { FEATURE_DEFINITIONS, getFeature } from './config';

// ============================================
// VÉRIFICATION D'ACCÈS
// ============================================

/**
 * Vérifie l'accès complet à une feature pour un utilisateur
 */
export function checkFeatureAccess(
  featureId: string,
  context: FeatureContext
): FeatureAccess {
  const feature = getFeature(featureId);

  if (!feature) {
    return {
      hasAccess: false,
      isEnabled: false,
      feature: {
        id: featureId,
        name: 'Feature inconnue',
        description: '',
        category: 'advanced',
        status: 'disabled',
        minTier: 'ENTERPRISE',
        userToggleable: false,
        enabledByDefault: false,
      },
      source: 'global',
      message: `Feature "${featureId}" non trouvée`,
      canToggle: false,
    };
  }

  // 1. Vérifier le statut global de la feature
  const globalCheck = checkGlobalStatus(feature, context);
  if (!globalCheck.hasAccess) {
    return globalCheck;
  }

  // 2. Vérifier le tier de l'utilisateur
  const tierCheck = checkTierAccess(feature, context);
  if (!tierCheck.hasAccess) {
    return tierCheck;
  }

  // 3. Vérifier les overrides administrateur
  const overrideCheck = checkOverrides(feature, context);
  if (overrideCheck) {
    return overrideCheck;
  }

  // 4. Vérifier les dépendances
  const dependencyCheck = checkDependencies(feature, context);
  if (!dependencyCheck.hasAccess) {
    return dependencyCheck;
  }

  // 5. Vérifier les limites d'utilisation
  const limitCheck = checkLimits(feature, context);
  if (!limitCheck.hasAccess) {
    return limitCheck;
  }

  // 6. Vérifier les préférences utilisateur
  const isEnabled = checkUserPreferences(feature, context);

  return {
    hasAccess: true,
    isEnabled,
    feature,
    source: isEnabled ? 'global' : 'user_disabled',
    canToggle: feature.userToggleable,
    currentUsage: limitCheck.currentUsage,
    maxUsage: limitCheck.maxUsage,
  };
}

/**
 * Vérifie le statut global de la feature sur la plateforme
 */
function checkGlobalStatus(
  feature: FeatureDefinition,
  context: FeatureContext
): FeatureAccess {
  const baseResult = {
    feature,
    canToggle: false,
  };

  switch (feature.status) {
    case 'disabled':
      return {
        ...baseResult,
        hasAccess: false,
        isEnabled: false,
        source: 'global',
        message: 'Cette fonctionnalité est actuellement désactivée',
      };

    case 'deprecated':
      return {
        ...baseResult,
        hasAccess: false,
        isEnabled: false,
        source: 'global',
        message: 'Cette fonctionnalité est obsolète et sera bientôt supprimée',
      };

    case 'coming_soon':
      return {
        ...baseResult,
        hasAccess: false,
        isEnabled: false,
        source: 'global',
        message: 'Cette fonctionnalité sera bientôt disponible',
      };

    case 'alpha':
      if (!context.isAlphaTester) {
        return {
          ...baseResult,
          hasAccess: false,
          isEnabled: false,
          source: 'global',
          message: 'Cette fonctionnalité est en alpha et réservée aux testeurs',
        };
      }
      break;

    case 'beta':
      if (!context.isBetaTester && !context.isAlphaTester) {
        return {
          ...baseResult,
          hasAccess: false,
          isEnabled: false,
          source: 'global',
          message: 'Cette fonctionnalité est en bêta et réservée aux testeurs',
        };
      }
      break;

    case 'enabled':
    default:
      break;
  }

  return {
    ...baseResult,
    hasAccess: true,
    isEnabled: true,
    source: 'global',
  };
}

/**
 * Vérifie si le tier de l'utilisateur permet d'accéder à la feature
 */
function checkTierAccess(
  feature: FeatureDefinition,
  context: FeatureContext
): FeatureAccess {
  const hasAccess = isTierAtLeast(context.tier, feature.minTier);

  if (!hasAccess) {
    return {
      hasAccess: false,
      isEnabled: false,
      feature,
      source: 'tier',
      message: `Cette fonctionnalité nécessite l'abonnement ${feature.minTier} ou supérieur`,
      canToggle: false,
      requiredTier: feature.minTier,
    };
  }

  return {
    hasAccess: true,
    isEnabled: true,
    feature,
    source: 'global',
    canToggle: feature.userToggleable,
  };
}

/**
 * Vérifie les overrides administrateur pour l'utilisateur
 */
function checkOverrides(
  feature: FeatureDefinition,
  context: FeatureContext
): FeatureAccess | null {
  const override = context.overrides.find((o) => o.featureId === feature.id);

  if (!override) {
    return null; // Pas d'override, continuer les vérifications
  }

  // Vérifier si l'override a expiré
  if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
    return null; // Override expiré
  }

  return {
    hasAccess: override.enabled,
    isEnabled: override.enabled,
    feature,
    source: 'user_override',
    message: override.reason,
    canToggle: false, // Les overrides ne peuvent pas être changés par l'utilisateur
  };
}

/**
 * Vérifie que toutes les dépendances de la feature sont satisfaites
 */
function checkDependencies(
  feature: FeatureDefinition,
  context: FeatureContext
): FeatureAccess {
  if (!feature.requires || feature.requires.length === 0) {
    return {
      hasAccess: true,
      isEnabled: true,
      feature,
      source: 'global',
      canToggle: feature.userToggleable,
    };
  }

  const missingDependencies: string[] = [];

  for (const depId of feature.requires) {
    const depAccess = checkFeatureAccess(depId, context);
    if (!depAccess.hasAccess || !depAccess.isEnabled) {
      const depFeature = getFeature(depId);
      missingDependencies.push(depFeature?.name || depId);
    }
  }

  if (missingDependencies.length > 0) {
    return {
      hasAccess: false,
      isEnabled: false,
      feature,
      source: 'dependency',
      message: `Nécessite: ${missingDependencies.join(', ')}`,
      canToggle: false,
    };
  }

  return {
    hasAccess: true,
    isEnabled: true,
    feature,
    source: 'global',
    canToggle: feature.userToggleable,
  };
}

/**
 * Vérifie les limites d'utilisation de la feature
 */
function checkLimits(
  feature: FeatureDefinition,
  context: FeatureContext
): FeatureAccess & { currentUsage?: number; maxUsage?: number } {
  if (!feature.limits) {
    return {
      hasAccess: true,
      isEnabled: true,
      feature,
      source: 'global',
      canToggle: feature.userToggleable,
    };
  }

  const tierLimit = feature.limits[context.tier];

  if (!tierLimit || tierLimit.max === -1) {
    // Pas de limite ou illimité
    return {
      hasAccess: true,
      isEnabled: true,
      feature,
      source: 'global',
      canToggle: feature.userToggleable,
    };
  }

  const currentUsage = context.usage?.[feature.id] || 0;

  if (currentUsage >= tierLimit.max) {
    return {
      hasAccess: false,
      isEnabled: false,
      feature,
      source: 'limit_reached',
      message: tierLimit.limitMessage || `Limite atteinte (${tierLimit.max} ${tierLimit.unit || ''})`,
      canToggle: false,
      currentUsage,
      maxUsage: tierLimit.max,
    };
  }

  return {
    hasAccess: true,
    isEnabled: true,
    feature,
    source: 'global',
    canToggle: feature.userToggleable,
    currentUsage,
    maxUsage: tierLimit.max,
  };
}

/**
 * Vérifie les préférences utilisateur pour déterminer si la feature est activée
 */
function checkUserPreferences(
  feature: FeatureDefinition,
  context: FeatureContext
): boolean {
  // L'utilisateur a explicitement désactivé la feature
  if (context.preferences.disabledFeatures.includes(feature.id)) {
    return false;
  }

  // L'utilisateur a explicitement activé la feature
  if (context.preferences.enabledFeatures.includes(feature.id)) {
    return true;
  }

  // Sinon, utiliser la valeur par défaut
  return feature.enabledByDefault;
}

// ============================================
// HELPERS POUR VÉRIFICATIONS MULTIPLES
// ============================================

/**
 * Vérifie l'accès à plusieurs features en une fois
 */
export function checkMultipleFeatures(
  featureIds: string[],
  context: FeatureContext
): Record<string, FeatureAccess> {
  const result: Record<string, FeatureAccess> = {};

  for (const featureId of featureIds) {
    result[featureId] = checkFeatureAccess(featureId, context);
  }

  return result;
}

/**
 * Récupère toutes les features activées pour un utilisateur
 */
export function getEnabledFeatures(context: FeatureContext): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter((feature) => {
    const access = checkFeatureAccess(feature.id, context);
    return access.hasAccess && access.isEnabled;
  });
}

/**
 * Récupère les features d'analyse activées (pour le calcul des scores)
 */
export function getEnabledAnalysisFeatures(context: FeatureContext): string[] {
  return Object.values(FEATURE_DEFINITIONS)
    .filter((feature) => {
      if (feature.category !== 'analysis') return false;
      const access = checkFeatureAccess(feature.id, context);
      return access.hasAccess && access.isEnabled;
    })
    .map((f) => f.id);
}

/**
 * Crée un contexte par défaut pour un tier donné
 */
export function createDefaultContext(tier: SubscriptionTier): FeatureContext {
  return {
    tier,
    isBetaTester: false,
    isAlphaTester: false,
    preferences: {
      disabledFeatures: [],
      enabledFeatures: [],
      featureConfigs: {},
    },
    overrides: [],
    usage: {},
  };
}

/**
 * Vérifie rapidement si une feature est accessible (sans détails)
 */
export function hasFeature(featureId: string, context: FeatureContext): boolean {
  const access = checkFeatureAccess(featureId, context);
  return access.hasAccess && access.isEnabled;
}