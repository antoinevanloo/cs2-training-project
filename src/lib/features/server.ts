/**
 * Service Server-Side pour les Feature Flags
 *
 * Ce module fournit des fonctions pour vérifier les features côté serveur.
 * Il récupère automatiquement les configurations globales et utilisateur depuis la DB.
 */

import prisma from '@/lib/db/prisma';
import {
  FeatureContext,
  FeatureAccess,
  FeatureDefinition,
  FeatureStatus,
  UserFeatureOverride,
  SubscriptionTier,
} from './types';
import { FEATURE_DEFINITIONS, getFeature } from './config';
import {
  checkFeatureAccess,
  getEnabledAnalysisFeatures,
  hasFeature as hasFeatureCore,
} from './access';

// Key for storing feature config in SystemConfig
const FEATURE_CONFIG_KEY = 'global_feature_config';

// Cache for global config (5 minutes)
let globalConfigCache: GlobalFeatureConfig | null = null;
let globalConfigCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface GlobalFeatureConfig {
  [featureId: string]: {
    status?: FeatureStatus;
    minTier?: SubscriptionTier;
  };
}

// ============================================
// GLOBAL CONFIG MANAGEMENT
// ============================================

/**
 * Récupère la configuration globale des features depuis la DB
 * avec cache pour éviter les requêtes répétées
 */
export async function getGlobalFeatureConfig(): Promise<GlobalFeatureConfig> {
  const now = Date.now();

  // Return cached config if still valid
  if (globalConfigCache && now - globalConfigCacheTime < CACHE_TTL) {
    return globalConfigCache;
  }

  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: FEATURE_CONFIG_KEY },
    });

    globalConfigCache = (config?.value as GlobalFeatureConfig) || {};
    globalConfigCacheTime = now;

    return globalConfigCache;
  } catch (error) {
    console.error('Error fetching global feature config:', error);
    return globalConfigCache || {};
  }
}

/**
 * Invalide le cache de la configuration globale
 * À appeler après une modification de la config
 */
export function invalidateGlobalConfigCache(): void {
  globalConfigCache = null;
  globalConfigCacheTime = 0;
}

/**
 * Applique les overrides globaux à une feature definition
 */
export function applyGlobalOverrides(
  feature: FeatureDefinition,
  globalConfig: GlobalFeatureConfig
): FeatureDefinition {
  const override = globalConfig[feature.id];

  if (!override) {
    return feature;
  }

  return {
    ...feature,
    status: override.status || feature.status,
    minTier: override.minTier || feature.minTier,
  };
}

/**
 * Récupère toutes les features avec les overrides globaux appliqués
 */
export async function getFeatureDefinitionsWithOverrides(): Promise<
  Record<string, FeatureDefinition>
> {
  const globalConfig = await getGlobalFeatureConfig();

  return Object.fromEntries(
    Object.entries(FEATURE_DEFINITIONS).map(([id, feature]) => [
      id,
      applyGlobalOverrides(feature, globalConfig),
    ])
  );
}

// ============================================
// USER CONTEXT BUILDING
// ============================================

/**
 * Construit le contexte de features pour un utilisateur depuis la DB
 */
export async function buildUserFeatureContext(userId: string): Promise<FeatureContext | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        isBetaTester: true,
        isAlphaTester: true,
        featurePreferences: {
          select: {
            disabledFeatures: true,
            enabledFeatures: true,
            featureConfigs: true,
          },
        },
        featureOverrides: {
          select: {
            featureId: true,
            enabled: true,
            reason: true,
            expiresAt: true,
            createdBy: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Get usage stats for the current period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageStats = await prisma.featureUsage.findMany({
      where: {
        userId,
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
    });

    const usage = usageStats.reduce((acc, stat) => {
      acc[stat.featureId] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      tier: user.subscriptionTier,
      isBetaTester: user.isBetaTester,
      isAlphaTester: user.isAlphaTester,
      preferences: {
        disabledFeatures: user.featurePreferences?.disabledFeatures || [],
        enabledFeatures: user.featurePreferences?.enabledFeatures || [],
        featureConfigs: (user.featurePreferences?.featureConfigs as Record<string, Record<string, unknown>>) || {},
      },
      overrides: user.featureOverrides.map((o) => ({
        featureId: o.featureId,
        enabled: o.enabled,
        reason: o.reason || undefined,
        expiresAt: o.expiresAt || undefined,
        createdBy: o.createdBy || undefined,
      })),
      usage,
    };
  } catch (error) {
    console.error('Error building user feature context:', error);
    return null;
  }
}

// ============================================
// FEATURE ACCESS CHECKING
// ============================================

/**
 * Vérifie l'accès à une feature pour un utilisateur (server-side)
 * Cette fonction récupère automatiquement le contexte depuis la DB
 */
export async function checkServerFeatureAccess(
  userId: string,
  featureId: string
): Promise<FeatureAccess> {
  // Get global config and user context in parallel
  const [globalConfig, context] = await Promise.all([
    getGlobalFeatureConfig(),
    buildUserFeatureContext(userId),
  ]);

  if (!context) {
    return {
      hasAccess: false,
      isEnabled: false,
      feature: getFeature(featureId) || {
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
      message: 'Utilisateur non trouvé',
      canToggle: false,
    };
  }

  // Get feature with global overrides applied
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

  const featureWithOverrides = applyGlobalOverrides(feature, globalConfig);

  // Use the core access check with the modified feature
  return checkFeatureAccess(featureWithOverrides.id, {
    ...context,
    // Inject the overridden feature into a modified FEATURE_DEFINITIONS lookup
  });
}

/**
 * Vérifie rapidement si un utilisateur a accès à une feature (server-side)
 */
export async function hasServerFeature(userId: string, featureId: string): Promise<boolean> {
  const access = await checkServerFeatureAccess(userId, featureId);
  return access.hasAccess && access.isEnabled;
}

/**
 * Récupère les features d'analyse activées pour un utilisateur (server-side)
 * Utilisé pour le calcul des scores
 */
export async function getServerEnabledAnalysisFeatures(userId: string): Promise<string[]> {
  const [globalConfig, context] = await Promise.all([
    getGlobalFeatureConfig(),
    buildUserFeatureContext(userId),
  ]);

  if (!context) {
    return [];
  }

  // Get all analysis features and filter by access
  const analysisFeatures = Object.values(FEATURE_DEFINITIONS).filter(
    (f) => f.category === 'analysis'
  );

  const enabledFeatures: string[] = [];

  for (const feature of analysisFeatures) {
    const featureWithOverrides = applyGlobalOverrides(feature, globalConfig);

    // Check if feature is globally enabled
    if (featureWithOverrides.status !== 'enabled') {
      // Check if user is a tester
      if (featureWithOverrides.status === 'beta' && !context.isBetaTester && !context.isAlphaTester) {
        continue;
      }
      if (featureWithOverrides.status === 'alpha' && !context.isAlphaTester) {
        continue;
      }
      if (['disabled', 'deprecated', 'coming_soon'].includes(featureWithOverrides.status)) {
        continue;
      }
    }

    // Check tier access
    const tierOrder: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'TEAM', 'ENTERPRISE'];
    const userTierIndex = tierOrder.indexOf(context.tier);
    const requiredTierIndex = tierOrder.indexOf(featureWithOverrides.minTier);

    if (userTierIndex < requiredTierIndex) {
      continue;
    }

    // Check user overrides
    const override = context.overrides.find((o) => o.featureId === feature.id);
    if (override) {
      if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
        // Override expired, continue normal check
      } else {
        if (override.enabled) {
          enabledFeatures.push(feature.id);
        }
        continue;
      }
    }

    // Check user preferences
    if (context.preferences.disabledFeatures.includes(feature.id)) {
      continue;
    }

    if (
      context.preferences.enabledFeatures.includes(feature.id) ||
      featureWithOverrides.enabledByDefault
    ) {
      enabledFeatures.push(feature.id);
    }
  }

  return enabledFeatures;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Récupère toutes les features disponibles pour un utilisateur
 * avec leur état d'accès
 */
export async function getAllFeaturesForUser(
  userId: string
): Promise<Record<string, FeatureAccess>> {
  const [globalConfig, context] = await Promise.all([
    getGlobalFeatureConfig(),
    buildUserFeatureContext(userId),
  ]);

  if (!context) {
    return {};
  }

  const result: Record<string, FeatureAccess> = {};

  for (const [id, feature] of Object.entries(FEATURE_DEFINITIONS)) {
    const featureWithOverrides = applyGlobalOverrides(feature, globalConfig);
    result[id] = checkFeatureAccess(featureWithOverrides.id, context);
  }

  return result;
}

/**
 * Incrémente le compteur d'utilisation d'une feature
 */
export async function incrementFeatureUsage(
  userId: string,
  featureId: string
): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  try {
    await prisma.featureUsage.upsert({
      where: {
        userId_featureId_periodStart: {
          userId,
          featureId,
          periodStart: startOfMonth,
        },
      },
      create: {
        userId,
        featureId,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('Error incrementing feature usage:', error);
  }
}

/**
 * Récupère le nombre d'utilisations restantes pour une feature
 */
export async function getRemainingUsage(
  userId: string,
  featureId: string
): Promise<{ current: number; max: number; remaining: number } | null> {
  const [globalConfig, context] = await Promise.all([
    getGlobalFeatureConfig(),
    buildUserFeatureContext(userId),
  ]);

  if (!context) {
    return null;
  }

  const feature = getFeature(featureId);
  if (!feature || !feature.limits) {
    return null;
  }

  const featureWithOverrides = applyGlobalOverrides(feature, globalConfig);
  const tierLimit = featureWithOverrides.limits?.[context.tier];

  if (!tierLimit || tierLimit.max === -1) {
    return { current: 0, max: -1, remaining: -1 }; // Unlimited
  }

  const currentUsage = context.usage?.[featureId] || 0;

  return {
    current: currentUsage,
    max: tierLimit.max,
    remaining: Math.max(0, tierLimit.max - currentUsage),
  };
}
